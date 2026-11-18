"""Kafka publisher for normalised flows (topic ``flows.normalized``).

The message value is the FlowEvent v1 object (exactly the contract fields).
The key is ``src_ip``, as in ``examples/kafka/common.kafka_key``, so all flows
of one source land on one partition in order, which is what the analysis
module's per-source time windows need.

Provenance that is not part of the contract travels as message headers, so
consumers can trace an event back to its ingestion (F15) without the payload
changing. ``scenario_label`` is ground truth and is never published: it must
not reach detector decision logic.

``confluent-kafka`` is imported lazily, so file-only ingestion works without it.
"""
from __future__ import annotations

import json
import logging
from typing import Any

DEFAULT_TOPIC = "flows.normalized"
DEFAULT_MESSAGE_TIMEOUT_MS = 30_000
DEFAULT_FLUSH_TIMEOUT_S = 60.0

HEADER_FLOW_ID = "netguard-flow-id"
HEADER_INGESTION_ID = "netguard-ingestion-id"
HEADER_SOURCE_TYPE = "netguard-source-type"
HEADER_DATASET_ID = "netguard-dataset-id"

_log = logging.getLogger(__name__)


class KafkaUnavailable(RuntimeError):
    """confluent-kafka is not installed or the producer could not be created."""


class KafkaFlowPublisher:
    """Publishes FlowEvents and accounts for deliveries per ingestion run.

    Usage per ingestion: :meth:`begin`, :meth:`publish` for each flow,
    then :meth:`end`, which flushes and returns that run's delivery stats.
    """

    def __init__(self, bootstrap_servers: str, topic: str = DEFAULT_TOPIC, *,
                 message_timeout_ms: int = DEFAULT_MESSAGE_TIMEOUT_MS,
                 flush_timeout_s: float = DEFAULT_FLUSH_TIMEOUT_S, producer: Any = None) -> None:
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.flush_timeout_s = flush_timeout_s
        if producer is None:
            try:
                from confluent_kafka import Producer
            except ImportError as exc:  # pragma: no cover - depends on environment
                raise KafkaUnavailable("Kafka publishing needs 'confluent-kafka' (pip install confluent-kafka)") from exc
            try:
                producer = Producer({
                    "bootstrap.servers": bootstrap_servers,
                    "enable.idempotence": True,
                    "acks": "all",
                    "message.timeout.ms": message_timeout_ms,
                    "linger.ms": 20,
                })
            except Exception as exc:  # KafkaException on bad config
                raise KafkaUnavailable(f"cannot create Kafka producer: {exc}") from exc
        self._producer = producer
        self._reset()

    def _reset(self) -> None:
        self.produced = 0
        self.delivered = 0
        self.failed = 0
        self.errors: list[str] = []

    def _on_delivery(self, err: Any, _msg: Any) -> None:
        if err is None:
            self.delivered += 1
        else:
            self.failed += 1
            if len(self.errors) < 10:
                self.errors.append(str(err))

    def begin(self) -> None:
        self._reset()

    def publish(self, event: dict[str, Any], headers: dict[str, str | None]) -> None:
        value = json.dumps(event, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
        kafka_headers = [(k, v.encode("utf-8")) for k, v in headers.items() if v is not None]
        while True:
            try:
                self._producer.produce(self.topic, key=event["src_ip"].encode("utf-8"), value=value,
                                       headers=kafka_headers, on_delivery=self._on_delivery)
                break
            except BufferError:
                # Local queue full: serve delivery callbacks to drain it, then retry.
                self._producer.poll(0.5)
        self.produced += 1
        self._producer.poll(0)

    def end(self) -> dict[str, Any]:
        """Flush outstanding messages and return this run's delivery report."""
        pending = self._producer.flush(self.flush_timeout_s)
        if pending:
            _log.error("%d flow events still undelivered after %.0fs", pending, self.flush_timeout_s)
        return {
            "enabled": True,
            "topic": self.topic,
            "bootstrap_servers": self.bootstrap_servers,
            "produced": self.produced,
            "delivered": self.delivered,
            "failed": self.failed,
            "undelivered": pending,
            "errors": list(self.errors),
            "complete": self.delivered == self.produced and pending == 0,
        }
