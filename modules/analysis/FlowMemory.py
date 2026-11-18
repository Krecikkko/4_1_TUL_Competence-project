import WebData
from collections import deque
from FlowDetectionParams import *
from enum import Enum



class FlowData:
    flowQueues = [deque(),deque(),deque()]
    IPRegistry:dict[str, FlowDetectionData] = {}
    flowPatternData = FlowPatternData()
    shouldSendPatternAlerts = [False,False,False]
    


