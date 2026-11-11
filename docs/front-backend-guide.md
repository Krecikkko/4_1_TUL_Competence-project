# Django Backend Guide for Frontend Developers

## 1. Start the backend

Follow the startup instructions in `README.md`, then seed the database with test data:

```bash
docker compose exec backend python manage.py seed_test_data
```

The API is available at:

```text
http://localhost:8000/api/
```

## 2. Use the API

All listed endpoints use **GET**. You can open them in a browser or call them from your frontend.

| Endpoint | Purpose |
|---|---|
| `/health/` | Check that the API is running |
| `/flows/` | List flows |
| `/flows/{id}/` | Get a flow |
| `/flows/{id}/windows/` | Get a flow’s time windows |
| `/windows/` | List time windows |
| `/windows/{id}/` | Get a time window |
| `/windows/{id}/statistics/` | Get window statistics |
| `/windows/{id}/flows/` | Get flows for a window |
| `/windows/{id}/detection/` | Get detection information for a window |
| `/detections/` | List detections |
| `/detections/{id}/` | Get a detection |
| `/detections/{id}/window/` | Get the window for a detection |

For example:

```text
http://localhost:8000/api/flows/
http://localhost:8000/api/windows/1/statistics/
http://localhost:8000/api/detections/1/
```

## 3. Filter detections

Add query parameters to `/api/detections/`. Supported filters are:

- `start_timestamp_us` and `end_timestamp_us` — ISO-formatted date/time values
- `type`
- `severity` (LOW / MEDIUM / HIGH / CRITICAL)
- `source_ip`
- `destination_ip`

Example:

```text
http://localhost:8000/api/detections/?severity=HIGH&source_ip=192.168.1.3
```

You can combine filters. Invalid date/time values return a `400` response with an error message.

## 4. Check response data

Inspect the API responses in your browser before building the frontend. Check the returned field names, value types, and date/time formats, and handle them accordingly in your frontend.
