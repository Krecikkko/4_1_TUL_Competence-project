# NetGuard — PCAP/Flow Ingestion, Extraction & Normalisation (`modules/pcap-importer`)

Python subsystem owned by *Member 1 — Network Data & Flow Processing*. It
implements requirements **F01** (import prepared PCAP/flow data and validate
input) and **F02** (convert traffic into a normalised flow model) of the NetGuard
specification, plus the provenance needed for **F15** (trace an event from input
onwards).

It converts **actual** prepared captures (pcap / pcapng) and prepared
NetGuard-native flow datasets (CSV / JSON-lines) into normalised,
**unidirectional** flows serialised as **FlowEvent v1**
(`contracts/kafka/flow-event.v1.schema.json`, topic `flows.normalized`): exactly
the ten contract fields per message. They are written as JSON-lines files and,
when Kafka bootstrap servers are configured, also published to
`flows.normalized` (key `src_ip`). Identifiers go to `provenance.jsonl` and
Kafka headers; ground-truth labels only to `provenance.jsonl`. Neither is ever
in the message itself.

> It never generates, simulates or fabricates traffic. If no input is given, or
> an input contains nothing convertible, it says so explicitly
> ("No data has been imported").

## Quick start

```bash
cd modules/pcap-importer
python -m pip install -r requirements-dev.txt
python -m netguard_ingest pcap tests/data/pcap/tcp_handshake.pcapng --output-dir ./ingestion-output
python -m netguard_ingest list --output-dir ./ingestion-output
python -m pytest

# also publish to Kafka (repository stack running):
python -m netguard_ingest pcap tests/data/pcap/dns.cap --kafka-bootstrap-servers localhost:9094
# or, from the repository root, in Docker (captures in ./data/pcap-input):
docker compose run --rm pcap-importer
```

## Documentation

| Document | Content |
|---|---|
| [docs/HOW_TO_RUN.md](docs/HOW_TO_RUN.md) | **How to run**: installation, every command, configuration, outputs, tests |
| [docs/DESIGN.md](docs/DESIGN.md) | Components, formats, parsing, flow policy, timeouts, byte counting, normalisation, validation, errors, output schema, interfaces, limitations |
| [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) | Implementation report: files, libraries, tests and results, benchmarks, deviations, limitations |
| [tests/data/pcap/SOURCES.md](tests/data/pcap/SOURCES.md) | Genuine public captures used for testing (URLs, SHA-256) |

## Layout

```text
modules/pcap-importer/
├── netguard_ingest/
│   ├── cli.py              # netguard-ingest pcap | flows | list | validate-output
│   ├── pipeline.py         # PCAP and dataset pipelines, shared emit/validate/report path
│   ├── capture/reader.py   # streaming pcap/pcapng record framing (dpkt header classes)
│   ├── capture/decoder.py  # link/IP/transport decoding with dpkt
│   ├── capture/aggregator.py # unidirectional flow table, timeouts
│   ├── datasets/           # CSV/JSONL readers, mapping profiles (netguard-native built in)
│   ├── normalize.py        # value normalisation rules
│   ├── validation.py       # cross-field flow rules (same for every source)
│   ├── contract.py         # FlowEvent v1 JSON Schema check (repo contract)
│   ├── kafka_sink.py       # optional publishing to flows.normalized
│   ├── model.py, errors.py, ids.py, output.py, config.py, logging_setup.py
├── tests/                  # pytest suite + genuine captures in tests/data/pcap
├── Dockerfile              # used by the `pcap-importer` compose service
├── scripts/fetch_test_pcaps.sh
└── docs/
```
