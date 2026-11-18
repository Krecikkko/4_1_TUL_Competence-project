from dataclasses import dataclass
from typing import List

@dataclass
class DetectionFeature:
    name: str
    value: int | float | str

@dataclass
class AlertData:
    type: str = ""
    method: str = ""
    rule_id: str = ""
    severity: str = ""
    confidence: float = 0
    src_ip: str = ""
    dst_ip: str = ""
    timestamp: str = ""
    window_start: str = ""
    duration_seconds: int = 0
    features: List[DetectionFeature] = []
    explanation: str = ""