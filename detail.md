# InsureRoute — Comprehensive Technical Documentation

**Smart Supply Chain Disruption Detection and Dynamic Insurance Pricing**
Predictive AI-powered logistics intelligence with real-time weather monitoring, algorithmic rerouting, ML risk scoring, and actuarial-grade dynamic pricing.

---

## 1. Executive Summary

**InsureRoute** is a predictive supply chain intelligence platform that fuses machine learning risk scoring, live weather monitoring, Google Gemini AI advisory, multimodal graph routing, and dynamic actuarial pricing into a single unified system.

**Core problem solved:** Global supply chains operate on fragmented, static networks. When disruptions occur, logistics companies face losses not only from delays but also from insurance models that are entirely static — a company pays the same premium whether a shipment crosses a clear highway or a monsoon-flooded zone.

**Key Innovations:**
- **ML-Powered Risk Scoring:** A RandomForest Regressor trained on synthetic transit data predicts per-checkpoint risk scores using weather, time, and road condition inputs.
- **Live Weather Intelligence:** Monitors 8 geographic checkpoints along the Pune-Mumbai expressway via OpenWeatherMap API.
- **Google Gemini AI Advisory:** Integrates Gemini 2.5 Flash (agentic function-calling) for contextual risk assessments, rerouting decisions, and insurance recommendations.
- **Multimodal Graph Routing:** A NetworkX-based directed graph supporting road, rail, air, and sea transport modes with cargo-aware constraints.
- **Actuarial Dynamic Pricing Engine:** Real-time insurance premium calculation with 5 independent pricing factors — cargo type, route risk score, coverage type, transport mode, and cargo value.

---

## 2. Insurance Premium Calculation — Full Technical Reference

This is the core pricing logic in `backend/core/insurance_engine.py`.

### 2.1 Master Formula

```
Premium (₹) = Cargo Value (₹)
              × Base Rate (by transport mode)
              × Risk Loading Factor (by route risk score)
              × Cargo Risk Multiplier (by cargo type)
              × Coverage Multiplier (by coverage type)
```

Minimum premium floor: **₹500** (regardless of formula output).

---

### 2.2 Factor 1 — Transport Mode Base Rate

The base rate is the starting insurance rate before any risk adjustment. It varies by transport mode because different modes have inherently different risk profiles.

| Transport Mode | Base Rate | Annual Rate Equivalent |
|---|---|---|
| Rail | **0.15%** of cargo value | Lowest — controlled environment, low theft |
| Air | **0.20%** of cargo value | Low — fast transit, minimal weather exposure |
| Sea | **0.25%** of cargo value | Medium — weather and port risk |
| Road | **0.30%** of cargo value | Highest — traffic, weather, theft exposure |

For multimodal routes (e.g., road + rail), the base rate is the **weighted average** across all modes used.

**Example:**
- Road + Rail multimodal = (0.003 + 0.0015) / 2 = **0.225%**

---

### 2.3 Factor 2 — Route Risk Score & Risk Loading

The route risk score is a composite `0.0–1.0` score computed dynamically by the backend for each insurance quote. It blends three live data sources:

```
Route Risk Score = (ML Score × 0.60) + (Disruption Severity × 0.25) + (Weather Severity × 0.15)
```

| Source | Weight | Description |
|---|---|---|
| RandomForest ML Model | 60% | Predicted risk from weather, traffic, time, road conditions |
| Live IoT Disruption Feed | 25% | Severity of active disruptions on route checkpoints |
| Live OpenWeatherMap Weather | 15% | Worst severity across route checkpoints |

Once the composite score is computed, it is converted to a **Risk Loading Factor** using a piecewise function that penalises high-risk routes exponentially:

| Risk Score Range | Risk Loading Formula | Risk Class |
|---|---|---|
| 0.0 – 0.29 | `1.0` (no loading) | **LOW** |
| 0.30 – 0.59 | `1.0 + (score − 0.30) × 2.0` | **MEDIUM** (up to 1.6×) |
| 0.60 – 0.79 | `1.6 + (score − 0.60) × 4.0` | **HIGH** (up to 2.4×) |
| 0.80 – 1.0 | `1.6 + (score − 0.60) × 4.0` | **CRITICAL** (up to 3.2×) |

The steep exponential above 0.6 reflects actuarial reality: high-risk routes are disproportionately expensive to underwrite.

**Examples:**
- Risk score 0.2 → Loading 1.0× (no surcharge)
- Risk score 0.45 → Loading 1.3×
- Risk score 0.70 → Loading 2.2×
- Risk score 0.90 → Loading 2.8×

---

### 2.4 Factor 3 — Cargo Type Multiplier

Cargo type is a direct multiplier applied to the premium. Different cargo types have different inherent risk profiles (theft attractiveness, fragility, regulatory requirements, spoilage risk).

| Cargo Type | Multiplier | Risk Rationale |
|---|---|---|
| Perishables (Fresh Produce) | **1.8×** | Highest — strict temperature control, time-critical, spoilage risk |
| Pharmaceuticals | **1.6×** | Very high — regulatory requirements, cold chain, tamper sensitivity |
| Chemicals / Industrial | **1.5×** | High — hazmat handling, spillage liability, regulatory compliance |
| Electronics | **1.4×** | High — high theft attractiveness, moisture sensitivity |
| FMCG / Consumer Goods | **1.1×** | Slight surcharge — bulk cargo, moderate theft risk |
| Automotive Parts | **1.0×** | Baseline — standardised, low-sensitivity cargo |
| Textiles | **0.9×** | Discount — low theft attractiveness, robust against weather |

> **Note:** An unknown or unlisted cargo type defaults to `1.0×` (automotive baseline).

**Impact example on ₹5,00,000 cargo (road, LOW risk):**
| Cargo Type | Premium |
|---|---|
| Textiles | ₹1,350 |
| Automotive Parts | ₹1,500 |
| FMCG | ₹1,650 |
| Electronics | ₹2,100 |
| Chemicals | ₹2,250 |
| Pharmaceuticals | ₹2,400 |
| Perishables | ₹2,700 |

---

### 2.5 Factor 4 — Coverage Type Multiplier

Coverage type determines the breadth of perils covered. Higher coverage costs proportionally more.

| Coverage Type | Multiplier | What's Covered |
|---|---|---|
| Basic | **1.0×** | Named perils only (fire, theft, collision) |
| Comprehensive | **1.6×** | All perils except war and nuclear events |
| All Risk | **2.2×** | True all-risk — maximum protection |

**Impact on ₹5,00,000 pharmaceutical cargo on a MEDIUM risk road route (score 0.45):**
| Coverage | Premium |
|---|---|
| Basic | ₹3,120 |
| Comprehensive | ₹4,992 |
| All Risk | ₹6,864 |

---

### 2.6 Factor 5 — Cargo Value

Premium scales linearly with declared cargo value. The higher the value, the higher the absolute premium (though the rate percentage is the same).

| Cargo Value | Approx. Premium (Pharmaceutical, Road, Comprehensive, MEDIUM risk) |
|---|---|
| ₹1,00,000 | ~₹998 |
| ₹5,00,000 | ~₹4,992 |
| ₹10,00,000 | ~₹9,984 |
| ₹50,00,000 | ~₹49,920 |

---

### 2.7 Premium Breakdown Response

Every `/api/v1/insurance/quote` response includes a full itemised breakdown:

```json
{
  "base_rate_pct": 0.3,
  "risk_loading_factor": 1.3,
  "cargo_multiplier": 1.6,
  "coverage_multiplier": 1.6,
  "final_rate_pct": 0.9984,
  "premium_inr": 4992.0,
  "risk_class": "MEDIUM",
  "route_risk_score": 0.45,
  "live_risk_score": 0.45,
  "scored_at": "2026-04-25T11:00:00",
  "breakdown": {
    "base_premium": 1500.0,
    "risk_loading_amount": 450.0,
    "cargo_adjustment": 624.0,
    "coverage_adjustment": 418.0
  }
}
```

---

## 3. Route Risk Scoring — ML Engine Technical Reference

The ML risk scoring is implemented in `backend/core/ml_engine.py`.

### 3.1 Model

| Parameter | Value |
|---|---|
| Algorithm | `RandomForestRegressor` (sklearn) |
| n_estimators | 100 |
| max_depth | 12 |
| random_state | 42 |
| n_jobs | -1 (all cores) |
| Output | Risk score 0.0 – 1.0 |

### 3.2 Input Features

| Feature | Source |
|---|---|
| `hour_of_day` | Current server time |
| `day_of_week` | Current server time |
| `weather_code` | OpenWeatherMap live data |
| `visibility_km` | Estimated from live rain data |
| `wind_speed_kmh` | OpenWeatherMap live data (m/s → km/h) |
| `rainfall_mm` | OpenWeatherMap live data |
| `traffic_density` | 0.6 during rush hours (8–10, 17–19), else 0.3 |
| `checkpoint_type_enc` | Encoded: road / rail / port / airport |
| `road_condition_enc` | Encoded: good / moderate / poor (derived from weather) |
| `incident_type_enc` | Encoded: none / accident / roadblock / flood |

### 3.3 Checkpoint Types

| Checkpoint ID Pattern | Type |
|---|---|
| CP01–CP08 | road |
| RN01–RN04 | rail |
| PT01, PT02 | port |
| AP01 | airport |

### 3.4 Composite Risk Score

After ML inference per checkpoint, the composite route risk score is:

```
Composite = (avg_ml_score × 0.60) + (max_disruption_severity × 0.25) + (worst_weather_severity × 0.15)
```

Clamped to `[0.0, 1.0]`.

---

## 4. Routing Engine — Technical Reference

Implemented in `backend/core/graph_router.py` using NetworkX.

### 4.1 Graph Topology

- **Graph type:** Undirected NetworkX Graph (bidirectional edges)
- **Nodes:** Logistics hubs loaded from `backend/data/graph_topology.json`
- **Edge attributes:** `mode`, `distance_km`, `base_time_min`, `cost_inr`, `co2_kg`, `weight`, `risk_weight`

### 4.2 Transport Modes

| Mode | Cost per km (₹) | CO₂ per km (kg) | Max Cargo Weight |
|---|---|---|---|
| Road | 35 | 0.27 | Per config |
| Rail | Per config | Per config | Per config |
| Air | Per config | Per config | Per config |
| Sea | Per config | Per config | Per config |

### 4.3 Cargo-Aware Routing Constraints

The router enforces cargo-specific restrictions at the edge level:

| Cargo Type | Restriction |
|---|---|
| Chemicals | **Rail blocked** (hazmat restriction) |
| Perishables (requires cold chain) | **Sea blocked** (no cold chain on sea routes) |
| Overweight cargo | Edges with `max_cargo_weight_tons` exceeded are **skipped** |

### 4.4 Optimization Priority

Routes are found using `nx.shortest_simple_paths` (up to 20 candidates), then sorted and filtered:

| Priority | Sort Key |
|---|---|
| Speed | `total_time_min` |
| Cost | `total_cost_inr` |
| Safety | `total_time_min + (transfers × 30)` |

**Route filtering:** Routes that are >2.5× worse than the best route in both time AND cost are pruned. Top 5 returned.

### 4.5 Dynamic Cost Surcharges

Beyond base costs, routes receive dynamic surcharges at calculation time:

| Surcharge | Trigger | Range |
|---|---|---|
| Cargo Premium | `chemicals`, `automotive`, `pharmaceuticals` | +5% to +25% |
| Short-Haul Volatility | Distance < 200 km | ±20% |
| Long-Haul Contract | Distance > 500 km | ±8% |
| Standard Spot Rate | 200–500 km | ±15% |
| Rush Hour Surge | 8–10 AM or 5–7 PM | +8% to +15% |

The dominant surcharge driver is labelled per route: `"High Demand Surge"`, `"Favorable Market Rate"`, or `"Standard Spot Rate"`.

---

## 5. API Endpoints Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/nodes` | All logistics hub nodes (id, name, lat, lon) |
| `GET` | `/api/v1/cargo-types` | All supported cargo types |
| `POST` | `/api/v1/shipments/create` | Create shipment, get route options |
| `GET` | `/api/v1/routes/{id}/options` | Get route options for shipment |
| `POST` | `/api/v1/insurance/quote` | Get dynamic insurance premium quote |
| `POST` | `/api/v1/gemini/chat` | Chat with Gemini AI agent |
| `GET` | `/api/v1/disruptions/live` | Live active disruptions |
| `WS` | `/ws/monitor/{shipment_id}` | WebSocket live shipment monitor |
| `GET` | `/api/v1/data` (legacy) | Legacy polling endpoint |
| `GET` | `/api/v1/weather-status` (legacy) | Legacy weather status |
| `GET` | `/api/v1/ai-advisor` (legacy) | Legacy Gemini advisory |

---

## 6. System Architecture

### 6.1 Backend Module Structure

```
backend/
├── api.py                        # Entry point — imports app from main.py
├── main.py                       # FastAPI app, all route handlers, tool executors
├── core/
│   ├── insurance_engine.py       # Actuarial pricing (5-factor formula)
│   ├── ml_engine.py              # RandomForest risk scorer
│   ├── graph_router.py           # NetworkX multimodal routing
│   ├── gemini_agent.py           # Gemini 2.5 Flash agentic AI (function calling)
│   └── disruption_feed.py        # Live IoT disruption simulator
├── legacy/
│   ├── api.py                    # Legacy FastAPI router (weather polling, Isolation Forest)
│   ├── pricing_engine.py         # Legacy actuarial engine
│   ├── simulation.py             # Legacy pipeline orchestrator
│   ├── weather_service.py        # OpenWeatherMap integration (8 checkpoints)
│   └── route_risk_advisor.py     # Legacy Gemini advisor
├── models/
│   ├── schemas.py                # Pydantic request/response models
│   ├── risk_model.pkl            # Trained RandomForest model (auto-generated)
│   └── encoders.pkl              # LabelEncoders (auto-generated)
├── data/
│   ├── graph_topology.json       # Hub nodes and edges
│   ├── cargo_types.json          # Cargo type config
│   ├── multimodal_config.json    # Mode costs, penalties
│   └── transit_risk.csv          # Training data for ML model
└── routers/                      # Additional FastAPI routers
```

### 6.2 Frontend Module Structure

```
frontend/src/
├── screens/
│   └── InsureRouteDashboard.jsx  # Main dashboard screen
├── components/
│   ├── AIAdvisorPanel.jsx        # Gemini AI advisory display
│   ├── WeatherStatusBanner.jsx   # Live weather alert banner
│   └── ...                       # Other UI components
├── api/
│   └── index.js                  # Axios API client
├── App.jsx
└── main.jsx
```

### 6.3 Full Data Flow

```
React Dashboard (3s polling)
        │
        ▼
POST /api/v1/insurance/quote
        │
        ├──► score_route_tool()
        │         │
        │         ├──► predict_risk() [ML — RandomForest]
        │         │         inputs: weather, time, traffic, road condition
        │         │
        │         ├──► disruption_simulator.get_active() [IoT Feed]
        │         │
        │         └──► live_weather_state [OpenWeatherMap background task]
        │
        ├──► calculate_dynamic_premium()
        │         Formula: Value × BaseRate × RiskLoading × CargoMul × CoverageMul
        │
        └──► JSON response with breakdown
```

---

## 7. Weather Intelligence

Implemented in `backend/legacy/weather_service.py`.

- **Data source:** OpenWeatherMap API `/data/2.5/weather`
- **Polling interval:** Every 60 seconds via `asyncio.create_task`
- **Checkpoints monitored:** Pune, Lonavla, Khopoli, Khalapur, Panvel, Navi Mumbai, Mumbai, Bhiwandi
- **Rate limit mitigation:** 2-second delay between API calls

### Danger Classification

| Condition | Threshold | Classified As |
|---|---|---|
| Weather ID | 200–622 | Dangerous (storm, rain, snow, fog codes) |
| Rainfall | > 2.5 mm/hr | Dangerous |
| Wind speed | > 10 m/s | Dangerous |

### Cargo-Specific Weather Rules (Legacy API)

| Cargo Type | Condition | Risk Triggered |
|---|---|---|
| Electronics | Humidity > 75% OR rain > 1.0 mm/hr | Yes |
| Pharmaceuticals, Perishables | Temperature > 30°C | Yes |
| Heavy Machinery | Wind speed > 8 m/s | Yes |
| Textiles | Humidity > 80% | Yes |
| Chemicals | Temperature > 35°C | Yes |
| Automotive Parts | Humidity > 70% AND rain > 0.5 mm/hr | Yes |

---

## 8. Gemini AI Integration

Implemented in `backend/core/gemini_agent.py`.

- **Model:** Gemini 2.5 Flash
- **Integration:** REST API (direct) and Gemini SDK (function calling)
- **Capabilities:** Agentic function-calling with defined tool executors

### Available Tools (Agent Functions)

| Tool | Purpose |
|---|---|
| `get_disruptions` | Fetch active disruptions for specified checkpoints |
| `score_route` | Get live composite risk score for a route |
| `calculate_premium` | Get full insurance premium quote |
| `trigger_reroute` | Find alternate routes avoiding checkpoints |
| `get_multimodal_options` | Get all transport mode options |
| `get_weather_forecast` | Get weather forecast for a location |

The agent can chain these tools autonomously to answer complex logistics questions in natural language.

### Image Analysis
The agent also supports `analyze_weather_image()` — users can upload weather images and the Gemini Vision API will analyze conditions and provide risk assessments.

---

## 9. UN Sustainable Development Goals

| SDG | Contribution |
|---|---|
| **SDG 9** — Industry, Innovation and Infrastructure | Builds resilient logistics infrastructure through predictive AI |
| **SDG 11** — Sustainable Cities and Communities | Reroutes cargo away from hazardous zones, reducing accident risk |
| **SDG 13** — Climate Action | Integrates live weather intelligence to pre-emptively mitigate extreme weather impact |

---

## 10. Limitations and Future Scope

### Current Limitations

| Limitation | Detail |
|---|---|
| Fixed graph topology | Predefined nodes; no street-level routing (OSRM/Google Maps) |
| Synthetic training data | ML trained on simulated data, not live IoT telemetry |
| Single region weather | Live weather only covers Pune-Mumbai corridor |
| Rate limits | Free-tier Gemini (15 RPM) and OpenWeatherMap limits |

### Roadmap

1. **Agentic AI:** Gemini multi-modal processing of breaking news, satellite imagery, and social media feeds as risk inputs.
2. **Live IoT Telemetry:** GPS OBD2 sensors and Thermo King reefer units via message queues.
3. **Graph Neural Networks:** GNNs on the NetworkX topology for cascading failure prediction.
4. **Google Cloud Deployment:** Cloud Run API, Cloud SQL analytics, Vertex AI model serving, Pub/Sub event streaming.
5. **Smart Contracts:** Blockchain-based automated premium settlement.

---

## 11. Team and License

Developed by **HoloSquad** for the Google Solution Challenge 2026.
Licensed under the MIT License. See [LICENSE](LICENSE) for details.
