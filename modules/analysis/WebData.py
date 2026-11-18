from dataclasses import dataclass
from typing import Optional

@dataclass
class WebRecordData:
    start_time: str
    duration_ms: int
    scr_ip: str
    src_port: Optional[int]
    dst_ip: str
    dstport: int
    protocol: int
    packets: int
    bytes: int
    tcp_flags: int
