from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    TimeWindow,
    NetworkFlow,
    WindowFlow,
    Detection,
)

class Command(BaseCommand):
    help = "Generate test network data"

    def handle(self, *args, **options):
        now = timezone.now()

        # Time windows
        windows: list[TimeWindow] = []

        for i, window_type in enumerate(TimeWindow.WindowType):
            window, _ = TimeWindow.objects.get_or_create(
                start_timestamp_us=now - timedelta(minutes=i),
                duration_us=timedelta(minutes=1, seconds=30),
                type=window_type,
            )
            windows.append(window)

        # Network flows
        flows: list[NetworkFlow] = []

        for i in range(40):
            flow, _ = NetworkFlow.objects.get_or_create(
                source_ip=f"192.168.1.{i + 10}",
                destination_ip=f"10.0.0.{i + 1}",
                source_port=50000 + i,
                destination_port=443,
                protocol="TCP",
                defaults={
                    "start_timestamp_us": now - timedelta(seconds=6*i),
                    "duration_us": timedelta(seconds=1, microseconds=2),
                    "packet_count": 100 + i * 10,
                    "byte_count": 5000 + i * 100,
                    "tcp_flags": 18,
                },
            )
            flows.append(flow)

        # Many-to-many associations
        for window in windows:
            window_end = window.start_timestamp_us + window.duration_us

            # flows wholly in windows
            matching_flows = [
                flow for flow in flows
                if window.start_timestamp_us <= flow.start_timestamp_us < window_end 
                and flow.start_timestamp_us + flow.duration_us < window_end
            ]

            WindowFlow.objects.bulk_create(
                [
                    WindowFlow(
                        window=window,
                        flow=flow,
                    )
                    for flow in matching_flows
                ],
                ignore_conflicts=True,
            )

        # Detections
        severities = list(Detection.Severity)

        for i, severity in enumerate(severities):
            Detection.objects.create(
                method="TEST",
                rule_id=f"TEST-{i + 1}",
                detected_at_us=now,
                type="ANOMALY",
                severity=severity,
                confidence=0.75 + i * 0.05,
                source_ip="192.168.1.10",
                destination_ip="10.0.0.1",
                key_feature_values={
                    "packet_count": 150,
                    "byte_count": 7500,
                },
                explanation=f"Test detection with severity {severity}",
                window=windows[i],
            )

        self.stdout.write(
            self.style.SUCCESS("Test data generated successfully!")
        )
    