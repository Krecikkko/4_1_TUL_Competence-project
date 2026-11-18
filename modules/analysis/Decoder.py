import json
import WebData

def decode_message(msg) -> WebData.WebRecordData:
    # Convert Kafka bytes into a string
    data = msg.value().decode("utf-8")

    # Convert JSON string into a Python dictionary
    data = json.loads(data)

    # Convert dictionary into WebData object
    return WebData.WebRecordData(**data)