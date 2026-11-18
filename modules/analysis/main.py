import os

from kafkaReciever import FlowReceiver
from FlowHandler import FlowProcessor
from kafkaProducer import AlertProducer
from AlertCrafter import *

# localhost:9094 is the broker's host-side listener; inside the compose
# network use KAFKA_BOOTSTRAP_SERVERS=kafka:9092.
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")


def main():

    # Initialize Kafka receiver
    flow_receiver = FlowReceiver(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        group_id="netguard-analysis",
        topic="flows.normalized"
    )

    # Initialize detection engine
    flow_processor = FlowProcessor()
    alert_crafter = AlertCrafterLogic()
    # Initialize Kafka producer
    alert_producer = AlertProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        topic="detections.created"
    )

    print("NetGuard Detection Engine started...")
    flow_processor.SetAlertCrafter(alert_crafter)

    try:
        while True:

            # Receive network flow
            flow = flow_receiver.receive()

            if flow is None:
                continue

            # Classify flow
            flow_processor.ClassifyFlow(flow)

            # Publish alert if generated
            if alert_crafter.alertQueue.count != 0:
                alertsToSend = alert_crafter.alertQueue.copy()
                alert_crafter.alertQueue.clear()
                for alert in alertsToSend:
                    alert_producer.produceAlert(alert)

    except KeyboardInterrupt:
        print("Stopping NetGuard Detection Engine...")

    finally:
        alert_producer.flush()
        flow_receiver.close()

        print("NetGuard Detection Engine stopped.")


if __name__ == "__main__":
    main()