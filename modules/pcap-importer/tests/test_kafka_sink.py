"""Kafka publishing of normalised flows, with an in-memory stand-in for the
confluent-kafka Producer (no broker needed). Flows come from genuine captures."""
from __future__ import annotations

import json

from conftest import FLOW_EVENT_FIELDS, genuine, read_jsonl

from netguard_ingest.cli import main
from netguard_ingest.kafka_sink import KafkaFlowPublisher
from netguard_ingest.pipeline import ingest_pcap


class FakeProducer:
    """Records produce() calls; delivers (or fails) them on flush()."""

    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.messages: list[dict] = []
        self._pending: list = []

    def produce(self, topic, key, value, headers, on_delivery):
        self.messages.append({"topic": topic, "key": key.decode(), "value": json.loads(value),
                              "headers": {k: v.decode() for k, v in headers}})
        self._pending.append(on_delivery)

    def poll(self, _timeout):
        return 0

    def flush(self, _timeout):
        pending, self._pending = self._pending, []
        for callback in pending:
            callback("Broker: timed out" if self.fail else None, None)
        return 0


def test_flows_published_with_key_headers_and_contract_payload(config):
    producer = FakeProducer()
    publisher = KafkaFlowPublisher("kafka:9092", producer=producer)
    result = ingest_pcap(genuine("dns.cap"), config, publisher)
    flows = read_jsonl(result.output_dir / "flows.jsonl")
    provenance = read_jsonl(result.output_dir / "provenance.jsonl")

    assert [m["value"] for m in producer.messages] == flows          # same payload as the file output
    for message, prov in zip(producer.messages, provenance, strict=True):
        assert message["topic"] == "flows.normalized"
        assert list(message["value"]) == FLOW_EVENT_FIELDS
        assert message["key"] == message["value"]["src_ip"]          # per-source ordering
        assert message["headers"] == {"netguard-flow-id": prov["flow_id"],
                                      "netguard-ingestion-id": result.ingestion_id,
                                      "netguard-source-type": "PCAP",
                                      "netguard-dataset-id": prov["dataset_id"]}
    kafka = result.report["kafka"]
    assert kafka["complete"] and kafka["produced"] == kafka["delivered"] == len(flows) > 0
    assert result.report["warnings"] == []


def test_scenario_label_is_never_published(config):
    producer = FakeProducer()
    config.scenario_label = "PORT_SCAN"
    ingest_pcap(genuine("synscan.pcapng"), config, KafkaFlowPublisher("kafka:9092", producer=producer))
    assert producer.messages
    assert all("PORT_SCAN" not in json.dumps(m) for m in producer.messages)


def test_publisher_counts_reset_per_ingestion(config):
    publisher = KafkaFlowPublisher("kafka:9092", producer=FakeProducer())
    first = ingest_pcap(genuine("dns.cap"), config, publisher).report["kafka"]
    second = ingest_pcap(genuine("icmp_echo.pcapng"), config, publisher).report
    assert second["kafka"]["produced"] == second["flows"]["normalized"] != first["produced"]


def test_delivery_failure_is_reported(config):
    result = ingest_pcap(genuine("dns.cap"), config, KafkaFlowPublisher("kafka:9092", producer=FakeProducer(fail=True)))
    kafka = result.report["kafka"]
    assert not kafka["complete"] and kafka["failed"] == kafka["produced"] > 0 and kafka["delivered"] == 0
    assert any("Kafka publishing incomplete" in w for w in result.report["warnings"])
    assert (result.output_dir / "flows.jsonl").is_file()              # file output is still complete


def test_kafka_disabled_by_default(config):
    assert ingest_pcap(genuine("dns.cap"), config).report["kafka"] == {"enabled": False}


def test_cli_exit_code_on_failed_delivery(tmp_path, monkeypatch):
    import netguard_ingest.cli as cli
    monkeypatch.setattr(cli, "KafkaFlowPublisher",
                        lambda servers, topic: KafkaFlowPublisher(servers, topic, producer=FakeProducer(fail=True)))
    args = ["pcap", str(genuine("dns.cap")), "--output-dir", str(tmp_path / "out"), "--kafka-bootstrap-servers", "x:1"]
    assert main(args) == 4
    assert main([*args, "--no-kafka"]) == 0
