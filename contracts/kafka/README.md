# NetGuard — Kafka Message Contracts (Proposal v1)

> **Who is this document for?** Every member of the NetGuard team, including developers who have never worked with Apache Kafka or JSON Schema.
>
> **Status:** Proposed v1 message contracts, pending team approval. Field names and JSON serialization are implementation choices; the formal NetGuard specification does not mandate them.
>
> **Revision (November 2026):** Both contracts were reduced to the fields in `examples/flow.valid.json` and `examples/detection.valid.json`, which mirror the backend models `NetworkFlow` and `Detection`. The earlier envelope fields (`schema_version`, `event_id`, `trace_id`, `flow_id`, `detection_id`, `source_type`, `scenario_label`, `window`, `feature_values`, `related_flow_ids`, …) were removed. Messages containing them are now rejected.

## 1. Why do we need this directory?

NetGuard is made up of several modules developed by different team members. One module produces network traffic data, another analyzes it for anomalies, and the backend stores the results and exposes them to the frontend.

These modules **do not need to call one another directly at every step**. Instead, they send and receive messages through **Apache Kafka**, a message broker. To communicate correctly, everyone needs to agree on the fields included in each message, their data types, and acceptable values. This shared agreement is called a **message contract**.

A simple analogy:

- **Kafka** is the system that transports messages.
- **Topic** is a named channel in Kafka, such as `flows.normalized`.
- **Producer** is an application that sends messages to a topic.
- **Consumer** is an application that reads messages from a topic.
- **JSON** is a format for the message content, for example `{"src_ip":"192.0.2.10", "packets":15}`.
- **JSON Schema** is a set of rules describing what the JSON must look like: required fields, types, and allowed values.
- **Validation** is the process of checking whether a JSON message follows those rules.

**Important:** A `.schema.json` file does **not** send data to Kafka, create topics, or detect anomalies. It only defines the format that producers and consumers must follow.

## 2. How do NetGuard modules communicate?

```text
PCAP importer / traffic simulator
              |
              v
       Flow processor
      (Kafka producer)
              |
              | FlowEvent (JSON)
              v
    Kafka: flows.normalized
          /          \
         v            v
 Analysis workers   Flow persistence
 (consumer group)   (separate consumer group)
         |
         | DetectionEvent (JSON)
         v
  Kafka: detections.created
         |
         v
  Backend: classification + persistence
         |
         v
       Database -> REST API -> Frontend
```

**Note:** The frontend communicates with the backend through the API and does not need a direct Kafka connection. The two consumer groups reading `flows.normalized` can independently receive the same events. Two analysis workers in **the same consumer group** share the topic's partitions between them.

| Kafka topic | Message type | Producer | Consumers | Suggested Kafka key |
|---|---|---|---|---|
| `flows.normalized` | `FlowEvent` | Flow processor | Analysis workers and flow persistence | `src_ip` — subject to approval |
| `detections.created` | `DetectionEvent` | Analysis workers | Backend classification/persistence | `src_ip` — subject to approval |

The **Kafka key** is separate from the JSON message body. It influences which partition receives a message and preserves order for records sharing the same key within that partition. Using `src_ip` makes source-based grouping easier, but **does not solve destination-based DoS aggregation** (by `dst_ip`). The team must agree on a partitioning and aggregation strategy.

## 3. What files are in `contracts/kafka/`?

```text
contracts/
└── kafka/
    ├── README.md                        # This guide
    ├── flow-event.v1.schema.json         # Rules for a valid FlowEvent
    ├── detection-event.v1.schema.json    # Rules for a valid DetectionEvent
    ├── validate.py                       # Local JSON validation script
    ├── requirements-dev.txt              # Python dependencies for validation
    └── examples/
        ├── flow.valid.json               # Example of a VALID FlowEvent
        ├── flow.invalid.json             # INTENTIONALLY INVALID FlowEvent
        └── detection.valid.json          # Example of a VALID DetectionEvent
```

### `flow-event.v1.schema.json` — network flow message definition

This file describes **one normalized, unidirectional flow** (traffic from a source address to a destination address). It is the contract for messages published to `flows.normalized`.

It has exactly ten fields, all required; no other fields are allowed:

| Field | Type | Rule |
|---|---|---|
| `start_time` | string | RFC 3339 date-time with timezone |
| `duration_ms` | number | ≥ 0 |
| `src_ip`, `dst_ip` | string | IPv4 or IPv6 address |
| `src_port`, `dst_port` | integer or `null` | 0–65535; `null` for protocols without ports (ICMP, ICMPV6, OTHER) |
| `protocol` | string | `TCP`, `UDP`, `ICMP`, `ICMPV6` or `OTHER` |
| `packets`, `bytes` | integer | ≥ 0 |
| `tcp_flags` | integer or `null` | 0–255 bit mask; must be `null` for non-TCP flows |

**Example:** The flow processor analyzes controlled lab traffic from `192.0.2.10:54321` to `192.0.2.20:443`, counts 15 packets, and publishes a JSON description of that flow. The message must satisfy this schema.

### `detection-event.v1.schema.json` — detection message definition

This file describes **an analysis worker's detection result** when it notices a suspicious pattern. It is the contract for `detections.created`.

It has exactly twelve fields, all required; no other fields are allowed:

| Field | Type | Rule |
|---|---|---|
| `type` | string | `PORT_SCAN`, `DOS_LIKE`, `BRUTE_FORCE_LIKE` or `ABNORMAL_CONNECTION_PATTERN` |
| `method` | string | `RULE`, `STATISTICAL` or `ML` |
| `rule_id` | string | 1–128 characters; identifies the rule or model that fired |
| `severity` | string | `LOW`, `MEDIUM`, `HIGH` or `CRITICAL` (preliminary) |
| `confidence` | number | 0–1 |
| `src_ip`, `dst_ip` | string | IPv4 or IPv6 address |
| `timestamp` | string | RFC 3339 date-time: when the detection was made; must not precede `window_start` |
| `window_start` | string | RFC 3339 date-time: start of the analysed time window |
| `duration_seconds` | integer | window length: `1`, `10` or `60` |
| `features` | array | at least one `{"name": string, "value": number}` object |
| `explanation` | string | 1–4096 characters |

**Example:** An analysis worker finds that, within a 10-second window, one simulated host contacted many destination ports. It publishes a `PORT_SCAN` `DetectionEvent` with the measured values in `features` (for example `unique_dest_ports = 200`) and a textual explanation.

**Important responsibility boundary:** According to the current communication diagram, the backend classifies an alert *after* consuming a `DetectionEvent`. `severity` is required in the message but is only the analysis worker's preliminary assessment. The backend assigns final severity, persists the detection, and exposes a complete alert through the API. A message on `detections.created` does not yet mean that the alert has been saved in the database.

### How the contracts map to the backend models

The fields follow the Django models in `backend/core/models.py`, under different names. The backend consumer is responsible for this conversion:

| Message field | Backend field |
|---|---|
| flow `start_time` | `NetworkFlow.start_timestamp_us` |
| flow `duration_ms` | `NetworkFlow.duration_us` (`DurationField`) |
| `src_ip` / `dst_ip` | `source_ip` / `destination_ip` |
| `src_port` / `dst_port` | `source_port` / `destination_port` |
| `packets` / `bytes` | `packet_count` / `byte_count` |
| detection `timestamp` | `Detection.detected_at_us` |
| `window_start` + `duration_seconds` | `Detection.window` → `TimeWindow` row |
| `features` | `Detection.key_feature_values` |

**Known gap:** `NetworkFlow` currently requires `source_port`, `destination_port` and `tcp_flags`, but the contract allows `null` for ICMP and non-TCP flows. The backend model or consumer must handle that before such flows can be stored.

### `validate.py` — message validation script

This Python script loads a `.json` file, selects the appropriate `.schema.json`, and checks whether the message conforms to the schema. You can use it to validate the provided examples or your own payload before publishing to Kafka.

It does not start Kafka, publish a message, or test network communication. **This is a contract test**, not an end-to-end producer → broker → consumer integration test.

### `requirements-dev.txt` — validation dependencies

This file lists the Python packages required by the validator (including `jsonschema`). Install them only in the environment where you run `validate.py`. These are **not** necessarily the dependencies of the backend or analysis worker applications.

## 4. What is inside `contracts/kafka/examples/`?

These files contain **sample Kafka message bodies**. They help developers understand the contracts, implement their modules, and automate testing.

| File | What does it contain? | Expected validation result | Why do we need it? |
|---|---|---|---|
| `flow.valid.json` | Valid simulated TCP flow: 15 packets, 6,200 bytes | Valid | Reference payload for a `flows.normalized` producer |
| `flow.invalid.json` | Similar flow, but `src_port = 70000` | **Invalid** | Checks that the validator rejects ports outside the range 0–65535 |
| `detection.valid.json` | A `PORT_SCAN` detection with a 10-second window, two features and an explanation | Valid | Reference payload for a `detections.created` producer and backend consumer |

**Why include an intentionally invalid example?** Because we need to show that validation actually catches incorrect input. When the validator rejects `flow.invalid.json`, the test should report **PASS**: rejecting this file is exactly the expected behavior.

The examples are **test fixtures, not messages that must be continuously published to Kafka**. Their IP addresses come from documentation-reserved ranges (RFC 5737).

## 5. How do I validate messages? (Step by step)

Run the following commands from the **repository root** (`netguard/`, the directory containing `compose.yaml` and `contracts/`). You need Python 3 and `pip`. **Docker and a running Kafka broker are not needed** for JSON Schema validation.

**Step 1: Create a virtual environment (recommended):**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell, activate it with `.venv\Scripts\Activate.ps1`. If script execution is restricted, you can run `.venv\Scripts\python.exe` directly without activating the environment.

**Step 2: Install the validation dependency:**

```bash
python -m pip install -r contracts/kafka/requirements-dev.txt
```

**Step 3: Run the three included tests:**

```bash
python contracts/kafka/validate.py
```

Expected output (exact paths or formatting may vary):

```text
PASS: flow.valid.json (flows.normalized), valid=True
PASS: detection.valid.json (detections.created), valid=True
PASS: flow.invalid.json (flows.normalized), valid=False
```

In the last line, **`valid=False` is expected** because that test confirms the invalid payload is rejected. `PASS` means the test behaved as expected.

**Step 4: Validate your own message:**

```bash
python contracts/kafka/validate.py \
  --topic flows.normalized \
  --file contracts/kafka/examples/flow.valid.json
```

Or validate a detection:

```bash
python contracts/kafka/validate.py \
  --topic detections.created \
  --file contracts/kafka/examples/detection.valid.json
```

Replace the value of `--file` with the path to your own JSON file. For an invalid payload, the script should indicate the failing field and exit with a nonzero status.

**Note:** `validate.py` checks the structure and rules expressed in JSON Schema. It does **not** check business rules that JSON Schema cannot express, such as `tcp_flags` being `null` for non-TCP flows or a detection's `timestamp` not preceding its `window_start`. `examples/kafka/common.py` implements both checks; apply equivalent checks in application code.

## 6. What should each developer do?

### PCAP / simulator / flow processor developer

1. Convert input traffic into the shared normalized flow model.
2. Construct a JSON payload that matches `flow-event.v1.schema.json`.
3. Validate the payload against the schema before publishing it.
4. Send UTF-8 JSON to `flows.normalized` with only the ten contract fields. Provenance such as the source file, dataset or ground-truth label must stay outside the message (for example in a separate metadata file or evaluation store).

### Analysis worker developer

1. Consume `FlowEvent` messages from `flows.normalized` as part of the proposed `netguard-analysis` consumer group.
2. Validate incoming messages. Flows carry no ground-truth label; never obtain one from another source for use in detection.
3. Analyze 1-, 10-, and 60-second windows and compute the required features.
4. Create a `DetectionEvent` according to `detection-event.v1.schema.json` and publish it to `detections.created`.
5. Note that v1 messages carry no identifiers, so a detection cannot reference its contributing flows. A detection is linked to flows only through `src_ip`, `dst_ip` and its time window.

### Backend developer

1. Use a dedicated consumer group to read `FlowEvent` messages for flow-history persistence.
2. Use a separate consumer group to read `DetectionEvent` messages for final classification and alert persistence.
3. Assign final severity and retain confidence, explanation, and supporting feature values.
4. Make persistence idempotent so redelivered messages do not create duplicate records. Messages have no identifier, so deduplicate on a natural key (for flows, for example `start_time` + the 5-tuple).
5. Convert message fields to the model fields (see "How the contracts map to the backend models").
6. Expose data to the frontend through the REST API.

### Frontend developer

The frontend does **not** need to interact with Kafka directly. It obtains flows, statistics, and alerts from the backend via the REST API. The frontend developer must agree on the API response format with the backend developer. **The REST API contract is separate from the Kafka JSON Schema contracts.**

### DevOps / integration developer

Maintain the Kafka broker, topic configuration, documentation, infrastructure tests, automated schema-validation checks, and debugging tools. Ensure that producers and consumers use compatible contract versions.

## 7. Contract rules everyone must follow

**Versioning:** Both schemas use **JSON Schema Draft 2020-12** and payloads are UTF-8 JSON. Messages carry no version field: the version is given by the schema file (`*.v1.schema.json`) used for the topic. Do not silently change existing field meanings. For breaking changes, introduce `.v2.schema.json` and coordinate producer/consumer migration (for example via a new topic, since consumers cannot tell versions apart from the payload). Because the schemas use `additionalProperties: false`, unapproved new fields will be rejected.

**Identifiers:** v1 messages contain no identifiers (no event, flow, trace or detection ID). Consumers that need deduplication or correlation must derive a natural key from the message content, or the team must agree to add an ID field in a new contract version.

**Time:** Use RFC 3339 timestamps with timezone information, preferably UTC (`Z`). `duration_seconds` must be `1`, `10`, or `60`, and a detection's `timestamp` must not precede its `window_start`. Event-time vs. processing-time semantics and allowed lateness still require team approval.

**Flow data:** `FlowEvent` describes a unidirectional flow. All ten fields must be present. A port is `null` when the protocol does not use ports. For non-TCP traffic, do not invent TCP flags: `tcp_flags` must be present and set to `null`. Byte-counting conventions and flow timeouts still need to be agreed upon.

**Ground truth:** Expected scenario labels from a simulator or prepared dataset are **not** part of any Kafka message (`scenario_label` is rejected). They are used **only to evaluate detection quality** and belong in a separate evaluation data store, never in detector input.

**Severity vs. confidence:** `confidence` expresses detection confidence (0–1). `severity` expresses alert impact (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). They are not interchangeable. `severity` is required in a `DetectionEvent` as a preliminary value; the backend performs final classification and persistence.

**Validation and safety:** JSON Schema cannot guarantee that data is truthful, timestamps are semantically consistent, or an anomaly has genuinely occurred. Use only approved lab datasets, prepared PCAP files, and the controlled simulator—never real production traffic.

**Schema Registry:** A Schema Registry is not required for the initial lab implementation. Keep schemas in the repository and validate JSON in application code and tests.

## 8. Frequently asked questions

**Do we need to copy JSON Schema files manually into every service?** No. The repository can provide one shared `contracts/kafka/` directory. Decide how each Docker image or test environment receives the approved schemas when implementing Dockerfiles and automated tests. Every module should use the same approved contract version.

**Does Kafka automatically validate JSON against these schemas?** No. The current Kafka setup transports message bytes; validation needs to be implemented in the producer/consumer code and tests.

**Does `flow.valid.json` start the traffic simulator?** No. It is only an example message body.

**Does `detection.valid.json` prove that a port scan was actually detected?** No. It is a sample payload illustrating the contract. The real detection logic belongs to the analysis module.

**Does passing `validate.py` prove Kafka integration works?** No. This tests JSON validity. Broker communication is tested separately using `infrastructure/kafka/smoke-test.sh` or producer/consumer integration tests.

**What if I want to add a field?** Discuss the change with consuming modules and DevOps first. Update the relevant schema, examples, and tests in coordination with the team. Do not unilaterally publish additional fields; v1 rejects unknown properties.

## 9. Team decisions to confirm

- [ ] Approve `FlowEvent` and `DetectionEvent` field names/types, topic names, and producer/consumer ownership.
- [ ] Agree on partition keys and window aggregation for both `src_ip` and `dst_ip`.
- [ ] Decide whether messages need identifiers (deduplication, tracing detections to flows) or natural keys are enough.
- [ ] Decide how the backend stores flows with `null` ports or `tcp_flags`.
- [ ] Define event-time semantics, allowed lateness, and duplicate handling.
- [ ] Define byte-counting, flow timeouts, and connection-counting rules.
- [ ] Confirm the responsibility boundary: detection candidate in analysis, final severity in backend.
- [ ] Agree on the contract-change and CI/CD testing process.

---

**Where next?** `docs/NetGuard_Kafka_Integration_Guide_EN.md` explains how an application connects to Kafka. `infrastructure/kafka/` contains the broker configuration and smoke test. This README covers **message formats and validation only**.
