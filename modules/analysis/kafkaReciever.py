from confluent_kafka import Consumer
import Decoder
from WebData import *


class FlowReceiver:

    def __init__(self, bootstrap_servers="localhost:9094",
                 group_id="netguard-analysis",
                 topic="flows.normalized"):

        config = {
            "bootstrap.servers": bootstrap_servers,
            "group.id": group_id,
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False
        }

        self.consumer = Consumer(config)
        self.consumer.subscribe([topic])

    def receive(self, timeout=1.0) -> WebRecordData | None:

        msg = self.consumer.poll(timeout)

        if msg is None:
            return None

        if msg.error():
            print(f"Kafka error: {msg.error()}")
            return None

        try:
            flow = Decoder.decode_message(msg)

            # Commit only after successful decoding
            self.consumer.commit(message=msg)

            return flow

        except Exception as e:
            print(f"Message processing error: {e}")
            return None

    def close(self):
        self.consumer.close()