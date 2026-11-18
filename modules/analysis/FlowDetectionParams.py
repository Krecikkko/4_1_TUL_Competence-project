from enum import Enum
from dataclasses import dataclass
from typing import Optional
import numpy as np
from multiset import Multiset
from StatisticsList import ZScore

@dataclass
class FlowDetectionData:
    PortList = [Multiset(),Multiset(),Multiset()]
    AccesedPortsAmount = [0,0,0]
    OpenConnection = [0,0,0]
    ClosedConnection = [0,0,0]
    CurrentConnection = [0,0,0]
    PSHAmount = [0,0,0]

@dataclass
class FlowPatternData:
    TotalPacketSize = [0,0,0]
    AvgPacketAmount = [0,0,0]
    PortStats = [ZScore(),ZScore(),ZScore()]
    DoSslow = [ZScore(),ZScore(),ZScore()]
    DoSHulk = [ZScore(),ZScore(),ZScore()]
    Brute = [ZScore(),ZScore(),ZScore()]

@dataclass
class MarkToCheck:
    PortScan:bool = False
    DoSslow:bool = False
    DoSHulk:bool = False
    Brute:bool = False

class Flags(Enum):
    FIN = 1
    SYN = 2
    RST = 4
    PSH = 8
    ACK = 16
    URG = 32
    ECE = 64
    CWR = 128
    NS = 256