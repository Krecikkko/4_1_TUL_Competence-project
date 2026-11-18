import numpy as np


class Config:
    TimeWindows = [1,10,60]
    PortConnectedTresh = []
    UnclosedConnectionsTresh = []
    PSHRequestsSent = []
    BruteConnectionsTresh = []
    AvgPacketSize = []
    AvgFlowPerS = []
    SeverityMulti = []
    serviceIp = '127.1.1.1'