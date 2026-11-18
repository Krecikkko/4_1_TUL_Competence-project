from AlertData import *
from enum import Enum
from WebData import *
from AlertParams import *
from Config import *
from time import time
from TimeUtils import TimeUtils
from kafkaProducer import AlertProducer

class AlertCrafterLogic:
    producer:AlertProducer
    alertQueue: list[AlertData] = [] #the list is used as a buffor but could propably be removed, it creates only minor timeloss at the moment
    def CraftAlert(self,method:str,severity:str,confidence:float,flow:WebRecordData,windowType:int,alertType:AlertTypes,featureParam:int | str | float):
        alertData:AlertData = AlertData()
        alertData.type = AlertTypes(alertType.value - alertType.value%10).name
        alertData.method = method
        alertData.rule_id = alertType.name
        alertData.severity = severity
        alertData.confidence = confidence
        alertData.src_ip = flow.src_ip
        alertData.dst_ip = flow.dst_ip
        alertData.timestamp = str(time())
        alertData.window_start = str(TimeUtils.add(TimeUtils.parse(flow.start_time),-windowType,0))
        alertData.duration_seconds = windowType
        if(alertData == AlertTypes.Port_Scan):
            alertData.features.append(DetectionFeature("Ports Scanned", featureParam))
            alertData.explanation = "Multiple ports were checked by a single user, potentially in an attempt to find vurnabilities"
        if(alertData == AlertTypes.DoS_Slowloris):
                    alertData.features.append(DetectionFeature("Maintained open connections", featureParam))
                    alertData.explanation = "Single user maintained multiple open connections potentially denying service"
        if(alertData == AlertTypes.DoS_Hulk):
                    alertData.features.append(DetectionFeature("PSH requests amount", featureParam))
                    alertData.explanation = "Single user send too many requests potentially overloading server"
        if(alertData == AlertTypes.Brute_Force):
                    alertData.features.append(DetectionFeature("Failed connections amount", featureParam))
                    alertData.explanation = "Single user failed to connect or was denied multiple times, suggesting attack on access credentials"
        if(alertData == AlertTypes.Abnormal_Connection_Big_Payloads):
                    alertData.features.append(DetectionFeature("Average payload size", featureParam))
                    alertData.explanation = "Observed increase in size of packets during window"
        if(alertData == AlertTypes.Abnormal_Connection_Heavy_Traffic):
                    alertData.features.append(DetectionFeature("Average traffic amount", featureParam))
                    alertData.explanation = "Observed above average traffic amount"
        self.alertQueue.append(alertData)        
        return
        