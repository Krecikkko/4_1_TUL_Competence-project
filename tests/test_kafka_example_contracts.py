"""Offline contract/unit tests; do not require Kafka or confluent-kafka installed."""
import json
import sys
from pathlib import Path
import pytest
from jsonschema import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'examples' / 'kafka'))
from common import CONTRACTS, kafka_key, prepare_flow_for_detection, validate


def payload(name):
    return json.loads((CONTRACTS / 'examples' / name).read_text(encoding='utf-8'))


def test_valid_flow():
    msg = payload('flow.valid.json')
    assert validate('flows.normalized', msg) == msg
    assert kafka_key('flows.normalized', msg) == msg['src_ip']
    assert prepare_flow_for_detection(msg) == msg
    assert 'scenario_label' not in prepare_flow_for_detection({**msg, 'scenario_label': 'PORT_SCAN'})


def test_valid_detection():
    msg = payload('detection.valid.json')
    assert validate('detections.created', msg) == msg
    assert kafka_key('detections.created', msg) == msg['src_ip']


def test_invalid_flow():
    msg = payload('flow.invalid.json')
    with pytest.raises(ValidationError) as excinfo:
        validate('flows.normalized', msg)
    assert list(excinfo.value.absolute_path) == ['src_port']


def test_icmp_flow_without_ports_accepted():
    msg = payload('flow.valid.json')
    msg.update(protocol='ICMP', src_port=None, dst_port=None, tcp_flags=None)
    assert validate('flows.normalized', msg) == msg


@pytest.mark.parametrize('field,value', [
    ('event_id', 'event-001'),      # removed envelope field
    ('scenario_label', 'PORT_SCAN'),  # ground truth no longer allowed in flows
])
def test_flow_extra_field_rejected(field, value):
    msg = payload('flow.valid.json')
    msg[field] = value
    with pytest.raises(ValidationError):
        validate('flows.normalized', msg)


def test_detection_features_must_be_numeric_name_value_pairs():
    msg = payload('detection.valid.json')
    msg['features'][0]['value'] = '200'
    with pytest.raises(ValidationError):
        validate('detections.created', msg)


def test_detection_old_window_field_rejected():
    msg = payload('detection.valid.json')
    msg['window'] = {'start': msg['window_start'], 'duration_seconds': 10}
    with pytest.raises(ValidationError):
        validate('detections.created', msg)


def test_non_tcp_flags_rejected():
    msg = payload('flow.valid.json')
    msg['protocol'] = 'UDP'
    with pytest.raises(ValueError):
        validate('flows.normalized', msg)


def test_unsupported_window_length_rejected():
    msg = payload('detection.valid.json')
    msg['duration_seconds'] = 5
    with pytest.raises(ValidationError):
        validate('detections.created', msg)


def test_detection_before_window_start_rejected():
    msg = payload('detection.valid.json')
    msg['timestamp'] = '2026-10-20T18:29:59Z'
    with pytest.raises(ValueError):
        validate('detections.created', msg)
