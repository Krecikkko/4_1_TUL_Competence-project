from WebData import *
from FlowMemory import *
from Config import *
from TimeUtils import *
from AlertCrafter import *

class FlowProcessor:
    
    flowFlags = []
    markToCheck = MarkToCheck()
    flowData = FlowData()
    alertCrafter:AlertCrafterLogic
    def __init__(self) -> None:
        self.flowFlags = []
        self.markToCheck = MarkToCheck()
        self.flowData = FlowData()
        pass
    def SetAlertCrafter(self,alertCrafter:AlertCrafterLogic):
        self.alertCrafter = alertCrafter
    def ClassifyFlow(self,flow:WebRecordData):
        for i in range(0,2):
            self.flowData.flowQueues[i].append(flow) # adding to the window queues
            self.flowData.flowPatternData.AvgPacketAmount[i] += 1
        markToCheck = MarkToCheck()
        self.UpdateDetection(flow,1,0) #processing incoming flow
        for i in range(0, 2): #process flow leaving detection window
            windowTime = TimeUtils.parse(flow.start_time)
            windowTime = TimeUtils.add(windowTime,0,flow.duration_ms)
            while(True):
                checkedFlow:WebRecordData = self.flowData.flowQueues[i][0]
                flowTime = TimeUtils.parse(checkedFlow.start_time)
                flowTime = TimeUtils.add(flowTime,Config.TimeWindows[i],checkedFlow.duration_ms)
                if(TimeUtils.is_older(flowTime,windowTime)): 
                #if after adding window time to the record it is still older than new records time, it is deleted from window   
                    self.UpdateDetection(checkedFlow,-1,i)
                    self.flowData.flowQueues[i].popleft
                    self.flowData.flowPatternData.AvgPacketAmount[i]-= 1
                    self.flowData.shouldSendPatternAlerts[i] = True
                    if(i == 2): #check if the biggest window has no data, it means we can remove record to save memory for long term usability
                        if(checkedFlow.scr_ip != Config.serviceIp):
                            self.CheckToClearRecord(checkedFlow.scr_ip)
                        else:
                            self.CheckToClearRecord(checkedFlow.dst_ip)
                else:
                    break
        flowIpProfile: FlowDetectionData = self.flowData.IPRegistry[flow.scr_ip] 
        #rule based detection
        if(markToCheck.PortScan):
            for i in range(0,2):
                if (flowIpProfile.AccesedPortsAmount[i] > Config.PortConnectedTresh[i]):
                    multi = flowIpProfile.AccesedPortsAmount[i]/Config.PortConnectedTresh[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Port_Scan,flowIpProfile.AccesedPortsAmount[i])
                if(self.flowData.shouldSendPatternAlerts[i] == True):
                    score = self.flowData.flowPatternData.PortStats[i].CalcZScore(flowIpProfile.AccesedPortsAmount[i])
                    multi = score - 2
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    if(self.flowData.flowPatternData.PortStats[i].CalcZScore(flowIpProfile.AccesedPortsAmount[i]) > 2*Config.SeverityMulti[1]):
                        AlertCrafterLogic.CraftAlert(self.alertCrafter,"Statistical",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Port_Scan,flowIpProfile.AccesedPortsAmount[i])
        if(markToCheck.DoSslow):
            for i in range(0,2):
                if (flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i] > Config.UnclosedConnectionsTresh[i]):
                    multi = (flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i])/Config.UnclosedConnectionsTresh[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.DoS_Slowloris,flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i])
                if(self.flowData.shouldSendPatternAlerts[i] == True):
                    score = self.flowData.flowPatternData.DoSslow[i].CalcZScore(flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i])
                    multi = score - 2
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    if(self.flowData.flowPatternData.DoSslow[i].CalcZScore(flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i]) > 2*Config.SeverityMulti[1]):
                        AlertCrafterLogic.CraftAlert(self.alertCrafter,"Statistical",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.DoS_Slowloris,flowIpProfile.OpenConnection[i]-flowIpProfile.ClosedConnection[i])
        if(markToCheck.DoSHulk):
            for i in range(0,2):
                if(flowIpProfile.PSHAmount[i] > Config.PSHRequestsSent[i]):
                    multi = flowIpProfile.PSHAmount[i]/Config.PSHRequestsSent[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.DoS_Hulk,flowIpProfile.PSHAmount[i])
                if(self.flowData.shouldSendPatternAlerts[i] == True):
                    score = self.flowData.flowPatternData.Brute[i].CalcZScore(flowIpProfile.PSHAmount[i])
                    multi = score - 2
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    if(self.flowData.flowPatternData.Brute[i].CalcZScore(flowIpProfile.PSHAmount[i]) > 2*Config.SeverityMulti[1]):
                        AlertCrafterLogic.CraftAlert(self.alertCrafter,"Statistical",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.DoS_Hulk,flowIpProfile.PSHAmount[i])
        if(markToCheck.Brute):
            for i in range(0,2):
                if(flowIpProfile.ClosedConnection[i] > Config.BruteConnectionsTresh[i]):
                    multi = flowIpProfile.ClosedConnection[i]/Config.BruteConnectionsTresh[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Brute_Force,flowIpProfile.ClosedConnection[i])
                if(self.flowData.shouldSendPatternAlerts[i] == True):
                    score = self.flowData.flowPatternData.Brute[i].CalcZScore(flowIpProfile.ClosedConnection[i])
                    multi = score - 2
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    if(self.flowData.flowPatternData.Brute[i].CalcZScore(flowIpProfile.ClosedConnection[i]) > 2*Config.SeverityMulti[1]):
                        AlertCrafterLogic.CraftAlert(self.alertCrafter,"Statistical",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Brute_Force,flowIpProfile.ClosedConnection[i])
        for i in range(0,2):
            if(self.flowData.shouldSendPatternAlerts[i] == True):
                if(self.flowData.flowPatternData.AvgPacketAmount[i] > Config.AvgFlowPerS[i]):
                    multi = self.flowData.flowPatternData.AvgPacketAmount[i]/Config.AvgFlowPerS[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Abnormal_Connection_Heavy_Traffic,self.flowData.flowPatternData.AvgPacketAmount[i])
                if(self.flowData.flowPatternData.TotalPacketSize[i] > Config.AvgPacketSize[i]):
                    multi = self.flowData.flowPatternData.TotalPacketSize[i]/Config.AvgPacketSize[i]
                    confidence = self.normalize(multi,Config.SeverityMulti[0], Config.SeverityMulti[2])
                    AlertCrafterLogic.CraftAlert(self.alertCrafter,"Rule",self.JudgeSeverity(multi),confidence,flow,Config.TimeWindows[i],AlertTypes.Abnormal_Connection_Big_Payloads,self.flowData.flowPatternData.TotalPacketSize[i])
        return

    def UpdateDetection(self, flow:WebRecordData,incoming:int,window:int): # incoming 1 or -1, window 0-2 when incoming -1
        b:int
        e:int
        if(incoming):
            b = 0
            e = 2
        else:
            b = window
            e = window
        for i in range(b,e):
            self.flowData.flowPatternData.TotalPacketSize[i] += flow.bytes * incoming
        if(flow.scr_ip != Config.serviceIp): #check if the packet is from service or client - here client
            if(self.flowData.IPRegistry[flow.scr_ip] == None):
                self.flowDetectionData = FlowDetectionData()
                self.flowData.IPRegistry[flow.scr_ip] = self.flowDetectionData
            else:
                flowDetectionData = self.flowData.IPRegistry[flow.scr_ip]
            self.FlagExtractor(flow.tcp_flags)
            if(flow.protocol == 6): #protocol 6 is TCP
                if Flags.SYN in self.flowFlags or Flags.FIN in self.flowFlags or self.flowFlags.count == 0:
                    self.ModifyAccesedPorts(flow,self.flowDetectionData,window,incoming)
            if(flow.protocol == 1): #protocol 1 is IMCP
                    self.ModifyAccesedPorts(flow,self.flowDetectionData,window,incoming)
            if(flow.protocol == 6):
                    if Flags.SYN in self.flowFlags: #check if connection was open
                        for i in range(b,e):
                            self.flowDetectionData.OpenConnection[i] += incoming
                            if(incoming == 1):
                                self.flowData.flowPatternData.DoSslow[i].Low(self.flowDetectionData.OpenConnection[i] - self.flowDetectionData.ClosedConnection[i] + 1)
                            else:
                                self.flowData.flowPatternData.DoSslow[i].Add(self.flowDetectionData.OpenConnection[i] - self.flowDetectionData.ClosedConnection[i] - 1)                            
                        self.markToCheck.DoSslow = True
                    if Flags.PSH in self.flowFlags:
                        for i in range(b,e):
                            self.flowDetectionData.PSHAmount[i] += incoming
                            if(incoming == 1):
                                self.flowData.flowPatternData.Brute[i].Add(self.flowDetectionData.PSHAmount[i] - 1)
                            else:
                                self.flowData.flowPatternData.Brute[i].Low(self.flowDetectionData.PSHAmount[i] + 1)
                        self.markToCheck.DoSHulk = True
        else:  #packet is from service
            if(self.flowData.IPRegistry[flow.scr_ip] == None):
                flowDetectionData = FlowDetectionData()
                self.flowData.IPRegistry[flow.scr_ip] = flowDetectionData
            else:
                flowDetectionData = self.flowData.IPRegistry[flow.dst_ip]
            if(flow.protocol == 6):
                if Flags.FIN in self.flowFlags or Flags.RST in self.flowFlags: # check if connection was terminated by server
                    for i in range(b,e):
                        flowDetectionData.ClosedConnection[i] += incoming
                        if(flowDetectionData.ClosedConnection[i] <= flowDetectionData.OpenConnection[i]):
                            if(incoming == 1):
                                self.flowData.flowPatternData.DoSslow[i].Low(flowDetectionData.OpenConnection[i] - flowDetectionData.ClosedConnection[i] + 1)
                            else:
                                self.flowData.flowPatternData.DoSslow[i].Add(flowDetectionData.OpenConnection[i] - flowDetectionData.ClosedConnection[i] - 1)
                        if(incoming == 1):
                            self.flowData.flowPatternData.Brute[i].Add(flowDetectionData.ClosedConnection[i] - 1)
                        else:
                            self.flowData.flowPatternData.Brute[i].Low(flowDetectionData.ClosedConnection[i] + 1)
                    self.markToCheck.Brute = True
        return

    def FlagExtractor(self,flagInt:int):
        flags = flagInt
        div = 256
        flowFlags = []
        while(flags > 0):
            if(flags>=div):
                flowFlags.append(Flags(div).name)
                flags-=div

    def ModifyAccesedPorts(self,flow:WebRecordData,flowDetectionData:FlowDetectionData,table:int,incoming:int):
        #adds accesed ports to memory
        self.markToCheck.PortScan = True
        if(incoming == 1):
            for i in range(0,2):
                    flowDetectionData.PortList[i].add(flow.dstport)
                    if(len(set(flowDetectionData.PortList)) > flowDetectionData.AccesedPortsAmount[i]):
                        self.flowData.flowPatternData.PortStats[i].Add(flowDetectionData.AccesedPortsAmount[i])
                        flowDetectionData.AccesedPortsAmount[i] = len(set(flowDetectionData.PortList))
        else:
            flowDetectionData.PortList[table].remove(flow.dstport,1)
            if(len(set(flowDetectionData.PortList)) < flowDetectionData.AccesedPortsAmount[table]):
                self.flowData.flowPatternData.PortStats[table].Low(flowDetectionData.AccesedPortsAmount[table])
                flowDetectionData.AccesedPortsAmount[table] = len(set(flowDetectionData.PortList))
        
    def CheckToClearRecord(self,ipAdress:str):
        detectionData:FlowDetectionData = self.flowData.IPRegistry[ipAdress]
        #if every data entry is empty, we can get rid of the record
        if (detectionData.AccesedPortsAmount[2] <= 0):
            if(detectionData.OpenConnection[2]<=0):
                if(detectionData.ClosedConnection[2]<=0):
                    if(detectionData.PSHAmount[2]<=0):
                        del(detectionData)
                        self.flowData.IPRegistry.pop(ipAdress)
    def JudgeSeverity(self,multi:float) -> str:
        #Used once, but could be transscribed to an enum
        if(multi>Config.SeverityMulti[2]):
            return "Severe"
        if(multi>Config.SeverityMulti[1]):
            return "Medium"
        else:
            return "Minor"
    def normalize(self,x: float, a: float, b: float) -> float:
        if a == b:
            raise ValueError("Range cannot be zero")
        return max(0.0, min(1.0, (x - a) / (b - a)))

        
            
    