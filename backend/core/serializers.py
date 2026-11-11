from rest_framework import serializers
from .models import TimeWindow, NetworkFlow, Detection


class NetworkFlowSerializer(serializers.ModelSerializer):
    tcp_flags = serializers.SerializerMethodField()

    class Meta:
        model = NetworkFlow
        fields = "__all__"

    def get_tcp_flags(self, obj):
        if obj.tcp_flags is None:
            return None

        flags = {
            "CWR": 128,
            "ECE": 64,
            "URG": 32,
            "ACK": 16,
            "PSH": 8,
            "RST": 4,
            "SYN": 2,
            "FIN": 1,
        }

        return {
            name: bool(obj.tcp_flags & mask)
            for name, mask in flags.items()
        }

class TimeWindowSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="get_type_display")

    class Meta:
        model = TimeWindow
        fields = [
            "id",
            "start_timestamp_us",
            "duration_us",
            "type",
        ]


class DetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detection
        fields = "__all__"

