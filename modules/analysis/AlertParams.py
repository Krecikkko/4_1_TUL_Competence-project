from enum import Enum

class AlertTypes(Enum):
    Port_Scan = 10
    DoS = 20
    DoS_Hulk = 21
    DoS_Slowloris = 22
    Brute_Force = 30
    Abnormal_Connection = 40
    Abnormal_Connection_Big_Payloads = 41
    Abnormal_Connection_Heavy_Traffic = 42