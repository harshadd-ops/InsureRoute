# InsureRoute: Smart Supply Chain Disruption Detection and Dynamic Insurance Pricing

**Comprehensive technical documentation covering machine learning anomaly detection, live weather intelligence, Google Gemini AI advisory, algorithmic routing, and actuarial pricing for enterprise-scale logistics disruption management.**

---

## 1. Executive Summary

**InsureRoute** is a predictive supply chain intelligence platform that fuses machine learning anomaly detection, live weather monitoring, Google Gemini AI advisory, algorithmic graph routing, and dynamic actuarial pricing into a single unified system. Built to address the fragility of modern logistics networks, InsureRoute transforms reactive disruption management into proactive risk mitigation.

**The core problem:** Global supply chains operate on fragmented, static networks. When disruptions occur (severe weather, geopolitical tensions, port strikes), logistics companies face losses not only from delays but also from insurance models that are entirely static. A company pays the same premium whether a shipment crosses a clear highway or enters a monsoon-flooded zone. Furthermore, alternate routes are typically calculated only after the disruption has already occurred.

**Why it matters:** In an era where a single delayed container ship can bottleneck global trade, having a unified dashboard that actively predicts delays, monitors live weather conditions, generates AI-powered risk assessments, and dynamically prices insurance coverage for rerouted shipments is invaluable.

**Key Innovations:**
- **Unsupervised ML Anomaly Detection:** Deploys an Isolation Forest algorithm on rolling historical data to identify complex delay patterns in real time based on multi-variate factors (weather severity, vehicle health, traffic patterns, temporal features).
- **Live Weather Intelligence:** Monitors 8 geographic checkpoints along the Pune-Mumbai expressway via OpenWeatherMap API, automatically detecting dangerous conditions and triggering the disruption pipeline without human intervention.
- **Google Gemini AI Advisory & Route Intelligence:** Integrates Google Gemini 2.5 Flash via REST API to synthesise data streams into contextual risk assessments, and simultaneously parses live weather sensor data into a continuous, defensible logistics news feed.
- **Dynamic Graph Rerouting:** Constructs a 50-node geographic hub-and-spoke graph using NetworkX. Upon detecting a bottleneck, edge weights are penalised, instantly triggering Dijkstra's shortest-path algorithm to reroute the shipment.
- **Real-time Insurance Hedging:** An actuarial pricing engine recalculates premiums dynamically. If the system reroutes a shipment to a safer path, the hedge cost drops immediately, providing tangible financial savings.

---

## 2. UN Sustainable Development Goals

InsureRoute addresses the following United Nations Sustainable Development Goals:

### SDG 9: Industry, Innovation and Infrastructure
InsureRoute builds resilient logistics infrastructure through predictive AI and algorithmic routing. By anticipating disruptions before they occur and automatically rerouting shipments, the platform strengthens the reliability of freight networks that underpin industrial supply chains.

### SDG 11: Sustainable Cities and Communities
By dynamically rerouting cargo away from hazardous zones (flooded expressways, storm-affected corridors), InsureRoute reduces accident risk for both freight operators and the communities along transit routes, contributing to safer urban transportation.

### SDG 13: Climate Action
The live weather intelligence module enables logistics providers to adapt to extreme weather events in real time, directly addressing the increasing unpredictability of climate patterns and their impact on supply chain reliability.

---

## 3. Problem Statement

The logistics and cargo insurance industries operate in distinct, uncommunicative silos. The problem breaks down into three critical sub-problems:

1. **Reactive, Not Predictive Routing:** Current systems only reroute after a driver reports a blocked road or a port officially declares a strike. The delay has already occurred and the SLA is breached.
2. **Inflexible Insurance Models:** Cargo insurance is typically bought on an annual flat-rate or static per-trip basis. If a shipper routes a high-value shipment through a severe thunderstorm, their premium does not increase dynamically. If they take a safer route, they receive no discount.
3. **Data Fragmentation:** Historical transit times, weather data, node congestion metrics, and financial risk factors exist but are scattered across separate systems with no unified view for risk managers.

**Real-World Scenario:**
A pharmaceutical company ships temperature-sensitive vaccines from Pune to Mumbai. Heavy monsoon rains begin. Standard mapping tools might still suggest the flooded expressway as the fastest route. The truck halts in water, the cooling unit struggles, and the cargo is lost. Standard insurance investigations take months. With InsureRoute, the system detects the monsoon conditions via live weather monitoring plus historical delay patterns via ML, reroutes through a safer inland road, and adjusts the insurance hedge dynamically, saving both the cargo and the insurer massive payouts.

---

## 4. Existing Solutions Analysis

Several tools address pieces of this problem, but none offer a cohesive end-to-end framework:

- **Google Maps / Waze for Enterprise:** Excellent real-time traffic updates, but purely reactive. Cannot factor cargo type, SLA risk, or financial implications.
- **Traditional Telematics (Samsara, GeoTab):** Tracks truck location and engine health, but focuses on asset monitoring rather than predictive network mapping or financial hedging.
- **Standard ERP Insurance Modules (SAP / Oracle):** Processes claims and manages policies, but updating premium risk models takes weeks of actuary sign-offs. No millisecond-level dynamic adjustment.

**The gap:** No lightweight, visual middleware sits between the dispatch router and the insurance underwriter. InsureRoute fills this exact gap.

---

## 5. Proposed Solution

InsureRoute is a fully integrated, real-time system that does not merely observe but acts. It creates a mathematical twin of a logistics network and continuously runs anomaly detection, weather monitoring, and AI analysis.

**Core Innovation:**
Instead of relying on rigid thresholds, InsureRoute uses unsupervised machine learning to determine if a specific combination of factors constitutes an anomaly. When the anomaly score drops below a critical threshold (-0.15), the system triggers a chain reaction:

1. Penalises the specific graph edge in the network topology.
2. Re-runs Dijkstra's algorithm to find the optimal path avoiding the penalised edge.
3. Pushes the new risk probability into the actuarial pricing engine.
4. Computes the dynamic hedge cost and shows exact capital saved.
5. Feeds the complete context to Google Gemini for natural-language risk advisory and real-time news intelligence generation.

**Unique Selling Points:**
- **Millisecond Actuarial Recalibration:** Insurance repricing based on live graph permutations.
- **Triple Detection Sources:** ML anomaly detection, live weather monitoring, and manual simulation working in concert.
- **Google Gemini AI Co-pilot:** Converts complex multi-source data into clear, actionable recommendations for non-technical operations managers.
- **Self-Healing Paths:** The graph topology automatically finds alternative routes without human intervention.

---

## 6. System Architecture

The system relies on a decoupled frontend-backend architecture connected via RESTful API.

### Component Breakdown

1. **Data Ingestion Layer (`data_loader.py`):** Parses structured datasets (30,000 row CSV), handles null values, standardises types, and caches in memory.
2. **Feature Engineering Layer (`preprocessing.py`):** Constructs ML features (delay_ratio, rolling_delay_mean, temperature_deviation, weather_severity_index, route_utilisation_ratio). Applies StandardScaler normalisation.
3. **Machine Learning Engine (`model.py`):** Trains Isolation Forest (n_estimators=200, contamination=0.08) and provides single-row inference for live scoring.
4. **Weather Intelligence Service (`weather_service.py`):** Polls OpenWeatherMap API for 8 Pune-Mumbai checkpoints every 60 seconds. Classifies conditions by severity (rain rate, wind speed, weather ID). Runs as an async background task within FastAPI.
5. **Graph and Routing Controller (`graph_engine.py`):** Manages a 50-node directed graph with bidirectional edges. Stores geographic coordinates (lat/lon) for all hubs. Executes Dijkstra's algorithm with edge penalisation on disruption.
6. **Actuarial Pricing Engine (`pricing_engine.py`):** Computes base premium (Cargo Value x Disruption Probability x 0.08), applies weather and perishable multipliers, and calculates before/after rerouting savings.
7. **Google Gemini AI Advisor (`gemini_advisor.py`):** Constructs a detailed prompt from the current shipment context and sends it to Gemini 2.5 Flash via direct REST API integration. Parses structured responses into summary, action items, and insurance tips.
8. **News Intelligence Service (`news_service.py`):** Generates real-time logistics intelligence by parsing live OpenWeatherMap sensor data using the Gemini API to produce context-aware supply chain news briefs.
9. **FastAPI Pipeline (`api.py`):** Central orchestrator. Routes requests to the appropriate engine, manages the weather polling background task, and serialises all outputs into structured JSON.
10. **Simulation Orchestrator (`simulation.py`):** Manages the per-tick pipeline: sample data, score with ML, route with graph, price with actuarial engine.
11. **React Dashboard (`Dashboard.jsx`):** Consumes API JSON and orchestrates visual state across KPI cards, network map, insurance panel, weather banner, route timeline, AI advisor panel, news panel, and event log.

### Data Flow

1. **Client Request:** React dashboard polls `/data` every 3 seconds.
2. **Weather Check:** Background task has latest weather state from 8 checkpoints.
3. **State Initialisation:** Backend fetches a random data slice simulating current truck status.
4. **ML Inference:** Row passed to Isolation Forest. Anomaly score generated.
5. **Routing Decision:** If score < threshold OR weather is dangerous, graph edge weight increased x15. Dijkstra finds alternate path.
6. **Pricing Calculation:** Engine calculates standard cost vs. mitigated cost.
7. **AI Advisory:** Full context sent to Gemini for natural-language assessment.
8. **Client Render:** JSON payload delivered to React. Dashboard updates all panels with animations.

---

## 7. Technology Stack

### Backend Infrastructure
- **Language:** Python 3.10+
- **Web Framework:** FastAPI with Pydantic validation and native async support
- **Machine Learning:** Scikit-Learn (Isolation Forest), Pandas, NumPy
- **Graph Routing:** NetworkX (Dijkstra's Algorithm)
- **AI Advisory & News:** Google Gemini 2.5 Flash via direct REST API
- **Weather Monitoring:** OpenWeatherMap API via `requests`
- **Environment Management:** python-dotenv

### Frontend Infrastructure
- **Framework:** React 18 with functional components and hooks
- **Build Tool:** Vite (native ES modules, instant HMR)
- **Styling:** Tailwind CSS (utility-first with custom design tokens)
- **Charting:** Recharts (AreaChart for risk trends)
- **Mapping:** react-simple-maps with react-simple-maps (ComposableMap, ZoomableGroup)
- **Animation:** Framer Motion
- **Icons:** Lucide-React
- **HTTP Client:** Axios with mock fallback

---

## 8. Methodology

1. **Data Synthesis:** Real logistics data is proprietary, so a credible statistical replica of 30,000 transit events was synthesised, maintaining multivariate correlations (heavy rain correlates with increased delay ratios).
2. **Unsupervised Pipeline Training:** Explicit failure labels are often missing in real-time supply chains, so unsupervised ML was chosen. The Isolation Forest algorithm partitions data; anomalies require fewer partitions to isolate.
3. **Live Weather Integration:** OpenWeatherMap API provides real-time conditions for 8 geographic checkpoints. Dangerous conditions (weather ID 200-622, rain > 2.5mm/hr, wind > 10m/s) automatically trigger the disruption pipeline.
4. **Algorithmic Bridging:** The statistical output (anomaly score) is linked directly to graph edge weight, converting abstract predictions into concrete geographic actions.
5. **AI-Powered Advisory & Intelligence:** Google Gemini receives the full shipment context and weather data via a structured prompt with system instructions, producing parsed risk assessments and live news briefs that bridge the gap between technical metrics and executive decision-making.
6. **Financial Modelling:** Base Premium formula (Cargo Value x Risk Probability x 0.08) with categorical multipliers (Weather: 1.4x if monsoon, Perishable: 1.6x if perishable). The difference between unmitigated and rerouted risk yields exact hedge savings.

---

## 9. Features and Functionalities

- **Live Weather Monitoring Dashboard:** Real-time weather data for all 8 Pune-Mumbai checkpoints displayed in an interactive route timeline with severity-coded dots, hover tooltips showing rain rate, wind speed, temperature, and humidity.
- **Automatic Weather-Triggered Rerouting:** When live weather detects dangerous conditions at any checkpoint, the system automatically triggers the full disruption pipeline (ML scoring, graph rerouting, pricing recalculation) without user action.
- **Google Gemini AI Risk Advisor & Route Intelligence:** Dedicated panels displaying AI-generated risk summaries, prioritised action items, insurance optimisation recommendations, and a live news feed generated from weather telemetry, powered by Gemini 2.5 Flash.
- **Live Disruption Simulator:** Dedicated controls for manually injecting disruptions, allowing users to stress-test the system and observe reactions across all panels.
- **Intelligent Network Graph Visualiser:** An interactive map component built with react-simple-maps showing 50 Indian logistics hubs, active route highlighting, disrupted path marking, custom origin/destination selection dropdowns, and dynamic seeded-randomized weather metrics for non-primary routes.
- **Dynamic Insurance Hedge Module:** Continuously running actuarial calculations showing "Standard Route" vs "Hedged Route" costs with percentage savings.
- **Real-time KPI Cards:** Animated metric cards showing SLA Breach Rate, Average Delay, Current Risk, and Cost Savings with threshold-based colour coding.
- **Event Stream Log:** Chronological event log with categorised entries (disruption, reroute, savings, info, model) providing full transparency.
- **Weather Status Banner:** A context-aware banner that shifts between a compact green "all clear" pill and a full-width red/amber disruption alert with live data attribution.

---

## 10. Implementation Details

**Isolation Forest Configuration:**
Data passes through `preprocessing.py` where categorical text is encoded and numerical features (temperature_deviation, rolling_delay_mean_6h, weather_severity_index) are scaled using StandardScaler. The model runs with n_estimators=200 for deep tree consensus and contamination=0.08 assuming an 8% industry-standard failure rate.

**Graph Logic and Edge Penalisation:**
Within `graph_engine.py`, edges are added as `G.add_edge(hub_a, hub_b, weight=normal_time)`. When the orchestrator receives a score below -0.15, it targets the active edge and multiplies the weight by 15. Dijkstra then finds the shortest path avoiding the penalty.

**Weather Service Pipeline:**
The `weather_service.py` module polls OpenWeatherMap for 8 checkpoints (Pune, Lonavla, Khopoli, Khalapur, Panvel, Navi Mumbai, Mumbai, Bhiwandi) with 2-second delays between requests to respect rate limits. Each checkpoint is classified by danger (weather ID 200-622, rain > 2.5mm/hr, wind > 10m/s) and severity (0.0-1.0 scale).

**Gemini AI Integration:**
The `gemini_advisor.py` and `news_service.py` modules construct detailed prompts containing shipment context and live weather data. A system instruction enforces structured output format (SUMMARY, ACTIONS, INSURANCE_TIP, and NEWS BRIEFS). The backend integrates directly with the Gemini REST API (bypassing the SDK) to ensure reliable real-time inference. Responses are parsed into structured data for frontend rendering. Graceful fallback is provided when the API key is unavailable.

**Asynchronous Architecture:**
The weather polling loop runs as an async background task (`asyncio.create_task`) within FastAPI's startup event. Weather state is stored in a module-level dict and snapshotted per-request to avoid race conditions. The React frontend polls `/data` every 3 seconds and `/weather-status` every 30 seconds independently.

---

## 11. Prototype and Demo Explanation

The prototype functions as a digital twin of a live logistics environment.

**Demo Flow:**
1. **Baseline:** The dashboard loads and polls data automatically. The graph shows optimal routing. KPIs show normal risk. Insurance shows baseline premium. AI advisor provides situation assessment.
2. **Automatic Weather Detection:** If any Pune-Mumbai checkpoint detects dangerous weather, the weather banner turns red, the route timeline highlights affected segments, and the system auto-reroutes.
3. **Manual Trigger:** Users press "Force Disruption" to simulate extreme conditions.
4. **System Response:** KPIs turn red. Anomaly banner appears. The graph severs the compromised route and draws an alternate path. Insurance panel calculates the hedged price. AI advisor generates specific recommendations.
5. **Financial Outcome:** The dashboard clearly shows the exact monetary savings from proactive rerouting.

---

## 12. Innovation

- **Triple Intelligence Fusion:** ML anomaly detection, live weather monitoring, and Google Gemini AI working in concert. No other hackathon project combines all three.
- **Financialisation of Logistics:** Unlike pure routing tools, InsureRoute directly ties pathfinding to capital risk through dynamic insurance hedging.
- **Predictive over Reactive:** The platform anticipates delays mathematically before they manifest.
- **AI Co-pilot for Operations:** Gemini translates complex technical data into actionable language for non-technical managers.
- **Enterprise-Grade Design:** Custom Tailwind design tokens, structural layouts, colour theory, and responsive grid layouts deliver a production-quality interface.

---

## 13. Applications

- **Perishable Supply Chains (Cold Chain):** Medical supplies or food produce where temperature control and speed are critical.
- **Dynamic Maritime Shipping Pricing:** Rerouting container vessels around geopolitical chokepoints with dynamic cargo premiums.
- **Urban Last-Mile Logistics:** High-density delivery networks adjusting routing and compensation based on real-time conditions.
- **Fleet Management Strategy:** Identifying systemic network weaknesses from historical failure hotspots.

---

## 14. Advantages

- **Actionable over Raw:** Distils complex weather, ML, and financial data into singular decisions through AI advisory.
- **Defensive Financial Positioning:** Allows underwriters to avoid catastrophic payouts by pre-emptive risk mitigation.
- **Software Agility:** Decoupled architecture allows any engine to be upgraded independently.
- **Multiple Detection Sources:** Weather API, ML model, and manual simulation provide redundant disruption detection.

---

## 15. Limitations

- **Synthetic Node Restriction:** The current graph operates on a predefined 50-node topology. Production integration with OSRM or Google Maps API would provide street-level routing.
- **Static Historical Window:** ML inference uses pre-calculated historical data rather than live IoT telemetry streams.
- **Threshold Calibration:** The disruption threshold (-0.15) is manually optimised. Production deployment would require continuous threshold recalibration.
- **Gemini Rate Limits:** The free-tier Gemini API has rate limits (15 RPM) that would need to be addressed for production traffic.

---

## 16. Future Scope

1. **Agentic AI and LLMs:** Integrating Gemini's multi-modal capabilities to process breaking news images, social media feeds, and satellite imagery as risk inputs.
2. **Live IoT Telemetry:** Connecting to physical hardware (GPS OBD2 sensors, Thermo King reefer sensors) via high-throughput message queues.
3. **Graph Neural Networks:** Applying GNNs directly onto the NetworkX topology to predict cascading multi-node failures.
4. **Google Cloud Deployment:** Cloud Run for the API, Cloud SQL for persistent analytics, Vertex AI for model serving, and Pub/Sub for event streaming.
5. **Decentralised Smart Contracts:** Writing pricing parameters onto blockchain smart contracts for automated premium settlement.

---

## 17. Conclusion

InsureRoute demonstrates that the historically rigid frameworks of supply chain routing and static cargo underwriting can be disrupted through deeply integrated technology.

By combining Isolation Forest anomaly detection, live OpenWeatherMap weather intelligence, Google Gemini AI advisory, NetworkX graph routing, and actuarial pricing into a single platform, we have architected an intelligent, self-healing supply chain network. The React dashboard ensures that this technical complexity remains entirely invisible to operations managers, providing them clarity, tangible financial savings, and proactive control over fragile logistics environments.

It is a blueprint for the future of predictive, AI-augmented supply chain management.
