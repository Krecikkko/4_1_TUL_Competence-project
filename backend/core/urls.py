from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),

    # Flows
    path("flows/", views.flows, name="flows"),
    path("flows/<int:pk>/", views.flows, name="flow-detail"),
    path(
        "flows/<int:pk>/windows/",
        views.flow_windows,
        name="flow-windows",
    ),

    # Time windows
    path("windows/", views.windows, name="windows"),
    path("windows/<int:pk>/", views.windows, name="window-detail"),
    path(
        "windows/<int:pk>/statistics/",
        views.window_statistics,
        name="window-statistics",
    ),
    path(
        "windows/<int:pk>/flows/",
        views.window_flows,
        name="window-flows",
    ),
    path(
        "windows/<int:pk>/detection/",
        views.window_detection,
        name="window-detection",
    ),

    # Detections
    path("detections/", views.detections, name="detections"),
    path(
        "detections/<int:pk>/",
        views.detections,
        name="detection-detail",
    ),
    path(
        "detections/<int:pk>/window/",
        views.detection_window,
        name="detection-window",
    ),
]

