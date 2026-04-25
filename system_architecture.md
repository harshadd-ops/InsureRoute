# System Architecture Document

**Project:** InsureRoute
**Domain:** Predictive AI, Algorithmic Routing, InsurTech, Google Gemini AI

---

## 1. High-Level Architecture Overview

InsureRoute is engineered on a strictly decoupled, microservices-inspired architecture. The application separates heavy mathematical processing capabilities (machine learning anomaly detection, graph routing, dynamic pricing, and AI advisory) from the client-side visualisation loop.

This separation ensures:
1. **Computational Stability:** ML matrix operations and Gemini API calls do not block the React render thread.
2. **Scalability:** Each tier can be hosted and scaled independently (frontend on Vercel CDN, backend on Google Cloud Run).
3. **Security:** Proprietary actuarial formulas and API keys remain on the server, exposing only calculated outputs to the browser.
4. **Resilience:** Each subsystem degrades gracefully. If the weather API is offline, ML still works. If Gemini is unavailable, the dashboard still provides data-driven insights.

---

## 2. Infrastructure Tiers

### 2.1. The Client Tier (Frontend)

The user-facing application is built for rendering efficiency and responsive state management.

- **Framework:** React 18 and Vite
- **Design System:** Tailwind CSS with custom design tokens (configured via `tailwind.config.js`)
- **State Management:** Asynchronous polling hooks (`useEffect` structures executing against REST endpoints at 3-second intervals)
- **Visualisation Libraries:** Recharts (AreaChart), react-simple-maps (ComposableMap with ZoomableGroup), Framer Motion (animations)
- **Role:** Acts as the digital twin. Parses complex JSON from the backend and orchestrates visual state across the Dashboard, KPI trackers, interactive map, insurance panel, weather banner, route timeline, AI advisor panel, news panel, and chronological event log.

### 2.2. The API Gateway Layer (Middleware)

Provides the standardised communication protocol bridging the UI and the computational pipeline.

- **Framework:** FastAPI (Python)
- **Data Validation:** Pydantic models automatically sanitise and structure incoming payloads
- **Async Architecture:** Native async/await for non-blocking weather polling and Gemini API calls
- **Endpoints:**
  - `GET /data` — Main tick endpoint (ML + routing + pricing + weather context)
  - `POST /inject-disruption` — Manual disruption injection
  - `GET /weather-status` — Latest weather assessment for all 8 checkpoints
  - `GET /ai-advisor` — Google Gemini risk advisory
  - `GET /route-news` — Live Route Intelligence news feed generated via Gemini
  - `GET /health` — Health check
  - `GET /hubs` — Available hub list

### 2.3. The Computational Tier (Backend Engines)

The core mathematical execution environment contains five parallel modules:

#### A. Predictability Engine (`model.py`)
- **Algorithm:** `sklearn.ensemble.IsolationForest`
- **Configuration:** n_estimators=200, contamination=0.08, random_state=42
- **Function:** Ingests live telemetry parameters (cargo type, monsoon indicators, geographic timestamps). Processes vectors against historical scaled subsets. Outputs anomaly_score mapping to risk.
- **Inference:** Single-row scoring via `score_single()` for real-time per-tick evaluation.

#### B. Weather Intelligence Service (`weather_service.py`)
- **Data Source:** OpenWeatherMap API (free tier, /data/2.5/weather endpoint)
- **Monitoring:** 8 geographic checkpoints on the Pune-Mumbai expressway (Pune, Lonavla, Khopoli, Khalapur, Panvel, Navi Mumbai, Mumbai, Bhiwandi)
- **Polling:** Every 60 seconds via async background task (`asyncio.create_task`)
- **Classification:** Dangerous if weather_id 200-622, rain > 2.5mm/hr, or wind > 10m/s
- **Severity Scoring:** 0.0-1.0 scale based on rain intensity, wind speed, and thunderstorm activity
- **Function:** When dangerous conditions are detected at any primary checkpoint, the system automatically triggers disruption handling in the main `/data` pipeline.

#### C. Algorithmic Routing Engine (`graph_engine.py`)
- **Library:** NetworkX (directed graph with bidirectional edges)
- **Algorithm:** Dijkstra's shortest-path
- **Topology:** 50 nodes representing Indian logistics hubs with geographic coordinates (lat/lon)
- **Function:** On anomaly detection (score < -0.15) or dangerous weather, the active edge weight is multiplied by 15, and Dijkstra calculates the bypass route avoiding the failure zone.

#### D. Actuarial Pricing Engine (`insurance_engine.py`)
- **Formula:** Base Rate × Risk Loading × Cargo Multiplier × Coverage Multiplier × Cargo Value
- **Base Rates:** Modulated by transport mode (Road: 0.30%, Sea: 0.25%, Air: 0.20%, Rail: 0.15%).
- **Multipliers:** Cargo type (e.g., Perishables: 1.8x, Pharma: 1.6x) and Coverage Type (e.g., All Risk: 2.2x).
- **Function:** Converts live composite risk score (derived from ML, IoT, and weather) into an exponential financial risk loading factor. Calculates dynamic insurance quotes in real-time, enforcing a minimum premium floor.

#### E. Google Gemini AI Advisor (`gemini_advisor.py`)
- **Model:** Gemini 2.5 Flash via direct REST API integration
- **Prompt Design:** System instruction enforcing structured output (SUMMARY, ACTIONS, INSURANCE_TIP) with context-specific user prompts containing all shipment data.
- **Function:** Synthesises anomaly scores, weather data, route topology, and insurance pricing into natural-language risk assessments. Provides actionable recommendations for non-technical operations managers.
- **Graceful Fallback:** Returns structured "unavailable" response if API key is missing or request fails.

#### F. News Intelligence Service (`news_service.py`)
- **Model:** Gemini 2.5 Flash via direct REST API integration
- **Function:** Generates real-time, defensible logistics intelligence by analyzing live weather sensor data and creating structured news briefs, replacing static placeholder content.

---

## 3. Request Lifecycle Diagram (Data Flow)

The system operates around a continuous polling loop (3-second interval) supplemented by weather monitoring (60-second interval) and manual triggers.

### Primary Data Flow (`GET /data`)

1. **Transmission:** React dashboard dispatches HTTP GET with payload constraints (origin, destination, cargo_value, monsoon, perishable, threshold).
2. **Weather Snapshot:** API takes a snapshot of the latest `live_weather_state` from the background polling task.
3. **Disruption Decision:** If weather is dangerous, `inject_disruption=True` is forced regardless of ML output.
4. **Data Sampling:** `simulation.py` samples a random row from the 30,000-row dataset.
5. **ML Inference:** Row passed to Isolation Forest. Anomaly score and disruption probability generated.
6. **Routing Execution:**
   - If anomaly > threshold: baseline shortest path returned.
   - If anomaly < threshold OR weather dangerous: shadow-graph copy created, edge penalised, bypass calculated.
7. **Financial Mapping:** Pricing engine contrasts original risk index against bypass risk index, computing savings_pct and savings_inr.
8. **Serialisation:** All module outputs consolidated into a single JSON hierarchy.
9. **Client Resolution:** React parses JSON context, updating SVG graph lines, KPI colours, insurance figures, and weather indicators.

### Weather Polling Flow (Background)

1. **Startup:** `_weather_polling_loop()` launched as `asyncio.create_task` on FastAPI startup.
2. **Execution:** Every 60 seconds, calls `fetch_route_weather()` in a thread pool executor.
3. **API Calls:** 8 sequential OpenWeatherMap requests (2-second spacing for rate limits).
4. **Classification:** Each checkpoint classified by danger and severity.
5. **State Update:** `live_weather_state` dict updated with latest assessment.
6. **Consumption:** `/data` endpoint snapshots this state per-request for thread safety.

### AI Advisory & Route Intelligence Flow (`GET /ai-advisor`, `GET /route-news`)

1. **Context Assembly:** Full tick data assembled (KPIs, insurance pricing, route info, weather state, anomaly scores) for advisory. Weather state used for route news.
2. **Prompt Construction:** System prompt + structured user prompt built from context.
3. **Gemini Call:** REST API sends request to Gemini 2.5 Flash.
4. **Response Parsing:** Structured text parsed into summary, actions list, insurance tip, and news briefs.
5. **Client Rendering:** AIAdvisorPanel and NewsPanel display parsed output.

---

## 4. Sub-system Configurations

### Data Formatting (`preprocessing.py` and `data_loader.py`)
The pipeline eliminates nulls and standardises non-uniform datasets before ML inference.
- Converts boolean values to integer matrices.
- Engineers features: delay_ratio, rolling_delay_mean_6h, rolling_delay_std_6h, temperature_deviation, weather_severity_index, route_utilisation_ratio, monsoon_flag.
- Executes StandardScaler on numeric features to ensure model trees partition logically across multiple axes.

### CORS and Security Implementation
- FastAPI implements CORS middleware allowing all origins for development.
- API keys stored in `.env` (excluded from version control via `.gitignore`).
- `.env.example` provides a template for collaborators.
- Gemini SDK configured once on first request with lazy initialisation pattern.

### Async Task Management
- Weather polling uses `asyncio.create_task()` for fire-and-forget background execution.
- Blocking I/O (HTTP requests to OpenWeatherMap) runs in thread pool via `run_in_executor()`.
- Module-level state dict avoids database dependency while maintaining thread safety through snapshot-per-request pattern.
