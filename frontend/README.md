# NetGuard Frontend — Security Operations Center (SOC)

NetGuard is an automated network anomaly detection platform. This frontend application provides the SOC monitoring dashboard, traffic explorer, anomaly analysis, and time-window investigation modules built with React, TypeScript, Tailwind CSS, TanStack Table, TanStack Query, and Recharts.

---

## 1. Architecture Overview

The frontend is structured using a feature-oriented architecture located under `frontend/src`:

```text
frontend/src/
├── api/                    # Centralized REST API client & React Query hooks
│   ├── client.ts           # Base HTTP client with error handling & trailing slash preservation
│   ├── types.ts            # Strict TypeScript interfaces matching Django models
│   ├── health.ts           # GET /api/health/ hook & polling
│   ├── detections.ts       # GET /api/detections/, /detections/{id}/, /window/
│   ├── flows.ts            # GET /api/flows/, /flows/{id}/, /windows/
│   └── windows.ts          # GET /api/windows/, /windows/{id}/, /statistics/, /flows/, /detection/
├── components/
│   ├── common/             # Reusable UI components (StatCard, SeverityBadge, ConfidenceIndicator, etc.)
│   ├── layout/             # AppLayout, Sidebar, Header, Breadcrumbs
│   ├── evidence/           # EvidencePanel, JsonEvidenceViewer (safe JSON rendering & copy)
│   ├── detections/         # DetectionTable, DetectionFilters (server-side query params & validation)
│   ├── flows/              # NetworkFlowTable, TcpFlagBadges (decoded 8-flag bitmaps)
│   └── windows/            # TimeWindowTable, WindowStatisticsCard
├── pages/                  # Page routes
│   ├── OverviewPage.tsx    # Route '/' — SOC dashboard, severity breakdown, anomaly categories, recent alerts
│   ├── DetectionsPage.tsx  # Route '/detections' — server-filtered detection analysis
│   ├── DetectionDetailPage.tsx # Route '/detections/:id' — deep evidence, rule ID, and associated window flows
│   ├── FlowsPage.tsx       # Route '/flows' — traffic explorer
│   ├── FlowDetailPage.tsx  # Route '/flows/:id' — 5-tuple flow detail, TCP flags, associated windows
│   ├── WindowsPage.tsx     # Route '/windows' — aggregation time windows table
│   ├── WindowDetailPage.tsx # Route '/windows/:id' — window statistics, associated flows & clean detection handling
│   ├── HistoryPage.tsx     # Route '/history' — forensic timeline investigation & presets
│   └── NotFoundPage.tsx    # Route '*' — 404 handler
├── utils/
│   ├── cn.ts               # Tailwind CSS class merging helper
│   └── formatters.ts       # Django DurationField parser, byte/packet rate formatters, ISO dates
└── test/                   # Vitest setup & mock environment
```

---

## 2. Prerequisites

- **Node.js**: `v20+` or `v22+`
- **npm**: `v10+`
- Running NetGuard Django Backend on `http://localhost:8000` (started via Docker Compose)

---

## 3. Getting Started & Development

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.
   
   Vite includes a proxy that forwards `/api` requests to `http://localhost:8000`, so no CORS configuration is required on the backend for local development.

---

## 4. Build, Lint & Test Commands

- **Run all unit & integration tests**:
  ```bash
  npm test
  ```
  Runs 43 Vitest tests covering:
  - Django DurationField parsing (`DD days, HH:MM:SS.uuuuuu`, ISO 8601, and microseconds)
  - ISO date validation and range checking
  - Severity badge styling and confidence indicators
  - TCP flag decoding
  - Arbitrary JSON evidence rendering and clipboard copying
  - Clean HTTP 404 handling for window detections (normal clean windows)
  - API response parsing and error handling

- **Run typecheck & production build**:
  ```bash
  npm run build
  ```
  Generates production-optimized assets in `dist/`.

- **Preview the production build**:
  ```bash
  npm run preview
  ```

- **Run ESLint**:
  ```bash
  npm run lint
  ```

---

## 5. Docker Deployment

### Standalone Docker build:
```bash
docker build -t netguard-frontend ./frontend
docker run -p 3000:80 netguard-frontend
```

### Integrated Docker Compose deployment:
Use the additive compose file from the monorepo root:
```bash
docker compose -f compose.yaml -f compose.override.yaml -f compose.frontend.yaml up -d
```
The frontend will be available at `http://localhost:3000`.

---

## 6. Actual Django REST API Endpoints Integrated

All endpoints are relative to `/api/` and preserve trailing slashes:

| Endpoint | Method | Response Shape | Frontend Usage |
|---|---|---|---|
| `/health/` | GET | `{ status, service }` | Backend connection health badge & automatic polling |
| `/detections/` | GET | `{ count, results: Detection[] }` | Detections & History tables with server query parameters |
| `/detections/{id}/` | GET | `Detection` | Detection detail view & anomaly evidence |
| `/detections/{id}/window/` | GET | `TimeWindow` | Link between detection and aggregation window |
| `/flows/` | GET | `{ count, results: NetworkFlow[] }` | Traffic explorer table with client sorting & search |
| `/flows/{id}/` | GET | `NetworkFlow` | 5-tuple detail, byte/packet stats & TCP flag visualization |
| `/flows/{id}/windows/` | GET | `{ count, results: TimeWindow[] }` | Associated windows overlapping this flow |
| `/windows/` | GET | `{ count, results: TimeWindow[] }` | Time window list & grouping strategy table |
| `/windows/{id}/` | GET | `TimeWindow` | Window metadata & duration |
| `/windows/{id}/statistics/` | GET | `WindowStatistics` | 4 core metrics (total flows, packets/s, bytes/s, active connections) |
| `/windows/{id}/flows/` | GET | `{ count, results: NetworkFlow[] }` | Flows encompassed in window |
| `/windows/{id}/detection/` | GET | `Detection` or `404` | Anomaly alert if triggered, or clean status badge if 404 |

---

## 7. Known Backend Limitations & Future Integration Notes

1. **Server-Side Pagination**:
   Backend collection endpoints currently return all rows in `{ count, results }` without `page` or `limit` parameters. Client-side pagination is handled by TanStack Table.
2. **Window & Flow Filtering**:
   Only `/api/detections/` supports query parameter filters (`start_timestamp_us`, `end_timestamp_us`, `type`, `severity`, `source_ip`, `destination_ip`). Flow and window filtering are performed client-side.
3. **Clean Windows 404 Behavior**:
   `/api/windows/{id}/detection/` returns HTTP 404 when no detection was triggered for a window. The frontend catches this explicitly as a non-error state (`detection: null`), displaying a green "Clean Window" indicator.
4. **No WebSockets / Server-Sent Events (SSE)**:
   The backend does not yet provide streaming. Polling via TanStack Query is used with sensible intervals and manual refresh controls.
5. **No REST Simulation / PCAP Import Control**:
   The simulator and PCAP importer are currently command-line / worker services without dedicated REST APIs. No simulated or mock buttons were added for non-existent endpoints.
