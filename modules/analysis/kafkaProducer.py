import json
from confluent_kafka import Producer, KafkaException
from dataclasses import asdict
from typing import Any, cast
import AlertData


class AlertProducer:

    def __init__(self, bootstrap_servers: str, topic: str):
        self.topic = topic

        self.producer = Producer({
            "bootstrap.servers": bootstrap_servers,
            "linger.ms": 5,
            "batch.num.messages": 10000,
            "compression.type": "lz4"
        })

    @staticmethod
    def delivery_report(err, msg):
        if err is not None:
            print(f"Alert delivery failed: {err}")

    def produceAlert(self, alert: AlertData.AlertData):

        data = json.dumps(asdict(cast(Any, alert)))

        while True:
            try:
                self.producer.produce(
                    topic=self.topic,
                    value=data.encode("utf-8"),
                    callback=self.delivery_report
                )

                break

            except BufferError:
                # Local producer queue is full.
                # Wait for some messages to be delivered.
                self.producer.poll(0.1)

        # Handle delivery callbacks without blocking.
        self.producer.poll(0)

    def flush(self):
        remaining = self.producer.flush(timeout=10)

        if remaining > 0:
            print(f"Warning: {remaining} alerts were not delivered.")