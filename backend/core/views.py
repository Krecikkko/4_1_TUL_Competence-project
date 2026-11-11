from datetime import datetime

from django.db.models.aggregates import Count, Sum
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import get_object_or_404

from .models import Detection, NetworkFlow, TimeWindow
from .serializers import DetectionSerializer, NetworkFlowSerializer, TimeWindowSerializer


@require_GET
def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "netguard-backend",
    })

# FLOWS

@require_GET
def flows(request, pk=None):
    if pk is not None:
        flow = get_object_or_404(NetworkFlow, pk=pk)
        serializer = NetworkFlowSerializer(flow)

        return JsonResponse(serializer.data)

    # multiple
    flows = NetworkFlow.objects.all()
    serializer = NetworkFlowSerializer(flows, many=True)

    return JsonResponse({
        "count": flows.count(),
        "results": serializer.data,
    })

@require_GET
def flow_windows(request, pk):
    flow = get_object_or_404(NetworkFlow, pk=pk)
    windows = flow.time_windows.all()
    serializer = TimeWindowSerializer(windows, many=True)

    return JsonResponse({
        "count": windows.count(),
        "results": serializer.data,
    })

# WINDOWS

@require_GET
def windows(request, pk=None):
    if pk is not None:
        window = get_object_or_404(TimeWindow, pk=pk)
        serializer = TimeWindowSerializer(window)

        return JsonResponse(serializer.data)

    # multiple
    windows = TimeWindow.objects.all()
    serializer = TimeWindowSerializer(windows, many=True)

    return JsonResponse({
        "count": windows.count(),
        "results": serializer.data,
    })

@require_GET
def window_flows(request, pk):
    window = get_object_or_404(TimeWindow, pk=pk)
    flows = window.network_flows.all()
    serializer = NetworkFlowSerializer(flows, many=True)

    return JsonResponse({
        "count": flows.count(),
        "results": serializer.data,
    })

@require_GET
def window_statistics(request, pk):
    window = get_object_or_404(TimeWindow, pk=pk)

    stats = window.network_flows.aggregate(
        total_network_flows=Count("id"),
        total_packets=Sum("packet_count"),
        total_bytes=Sum("byte_count"),
    )

    duration_seconds = window.duration_us.total_seconds()

    if duration_seconds > 0:
        packets_per_second = (
            (stats["total_packets"] or 0) / duration_seconds
        )

        bytes_per_second = (
            (stats["total_bytes"] or 0) / duration_seconds
        )
    else:
        packets_per_second = 0
        bytes_per_second = 0

    active_connections = (
        window.network_flows.values(
            "source_ip",
            "source_port",
            "destination_ip",
            "destination_port",
            "protocol",
        ).distinct().count()
    )

    return JsonResponse({
        "total_network_flows": stats["total_network_flows"],
        "packets_per_second": packets_per_second,
        "bytes_per_second": bytes_per_second,
        "active_connections": active_connections
    })

@require_GET
def window_detection(request, pk):
    window = get_object_or_404(TimeWindow, pk=pk)
    serializer = DetectionSerializer(window.detection, many=True)

    if len(serializer.data) == 0:
        raise Http404("Window doesn't have a detection")

    return JsonResponse(serializer.data[0], safe=False)

# DETECTIONS

@require_GET
def detections(request, pk=None):
    if pk is not None:
        detection = get_object_or_404(Detection, pk=pk)
        serializer = DetectionSerializer(detection)

        return JsonResponse(serializer.data)

    # multiple
    detections = Detection.objects.all()

    #filters
    start = request.GET.get("start_timestamp_us")
    end = request.GET.get("end_timestamp_us")

    if start:
        try:
            timestamp = datetime.fromisoformat(start)
        except ValueError:
            return JsonResponse(
                {"error": "Invalid start_timestamp_us"},
                status=400,
            )

        detections = detections.filter(detected_at_us__gte=timestamp)

    if end:
        try:
            timestamp = datetime.fromisoformat(end)

        except ValueError:
            return JsonResponse(
                {"error": "Invalid end_timestamp_us"},
                status=400,
            )

        detections = detections.filter(detected_at_us__lte=timestamp)

    filters = [
        "type",
        "severity",
        "source_ip",
        "destination_ip"
    ]

    for filter in filters:
        value = request.GET.get(filter)

        if value:
            detections = detections.filter(**{filter: value})

    # serializer & return
    serializer = DetectionSerializer(
        detections,
        many=True,
    )

    return JsonResponse({
        "count": detections.count(),
        "results": serializer.data,
    })

@require_GET
def detection_window(request, pk):
    detection = get_object_or_404(Detection, pk=pk)
    serializer = TimeWindowSerializer(detection.window)

    return JsonResponse(serializer.data)
