from django.db import models

class NetworkFlow(models.Model):
    id = models.BigAutoField(primary_key=True)
    start_timestamp_us = models.DateTimeField()
    duration_us = models.DurationField()

    source_ip = models.GenericIPAddressField()
    destination_ip = models.GenericIPAddressField()

    source_port = models.PositiveIntegerField()
    destination_port = models.PositiveIntegerField()

    protocol = models.CharField(max_length=10)

    packet_count = models.PositiveBigIntegerField()
    byte_count = models.PositiveBigIntegerField()

    tcp_flags = models.PositiveSmallIntegerField()

    def __str__(self):
        return (
            f"FL{self.id}[{self.start_timestamp_us.now().isoformat()}] "
            f"{self.source_ip}:{self.source_port} -> "
            f"{self.destination_ip}:{self.destination_port} "
            f"({self.protocol})"
        )

class TimeWindow(models.Model):
    class WindowType(models.IntegerChoices):
        GLOBAL = 0, "GLOBAL"
        SOURCE = 1, "SOURCE"
        DESTIN = 2, "DESTIN"
        SO1DE1 = 3, "SO1DE1"

    # core fields
    id = models.BigAutoField(primary_key=True)
    start_timestamp_us = models.DateTimeField()
    duration_us = models.DurationField()

    type = models.PositiveSmallIntegerField(
        choices=WindowType.choices,
        default=WindowType.GLOBAL
    )

    # derived
    network_flows = models.ManyToManyField(
        "NetworkFlow",
        through="WindowFlow",
        through_fields=("window", "flow"),
        related_name="time_windows",
    )

    def __str__(self):
        return (
            f"TW{self.id}[{self.start_timestamp_us.now().isoformat()} -> "
            f"{(self.start_timestamp_us + self.duration_us).now().isoformat()}] "
            f"{self.get_type_display()}"
        )

class WindowFlow(models.Model):
    pk = models.CompositePrimaryKey(
        "window",
        "flow",
    )

    window = models.ForeignKey(
        TimeWindow,
        on_delete=models.CASCADE,
        related_name="window_flows"
    )

    flow = models.ForeignKey(
        NetworkFlow,
        on_delete=models.CASCADE,
        related_name="window_flows"
    )

    def __str__(self):
        return f"WF(TW{self.time_window_id}, FL{self.flow_id})"

class Detection(models.Model):
    class Severity(models.TextChoices):
        LOW = "LOW", "LOW"
        MEDIUM = "MEDIUM", "MEDIUM"
        HIGH = "HIGH", "HIGH"
        CRITICAL = "CRITICAL", "CRITICAL"

    # core fields
    id = models.BigAutoField(primary_key=True)

    method = models.CharField(max_length=10)
    rule_id = models.CharField(max_length=20)

    detected_at_us = models.DateTimeField()

    type = models.CharField(max_length=25)
    severity = models.CharField(
        max_length=8,
        choices=Severity.choices,
    )

    confidence = models.FloatField()

    source_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    destination_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    key_feature_values = models.JSONField()
    explanation = models.TextField()

    window = models.ForeignKey(
        TimeWindow,
        on_delete=models.CASCADE,
        related_name="detection",
    )

    def __str__(self):
        return f"DE{self.id}[{self.type}: {self.severity}] -> TW{self.window_id}"
