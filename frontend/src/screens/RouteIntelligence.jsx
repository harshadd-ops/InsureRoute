import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getRouteOptions, chatWithAgent, getNodes, getLiveDisruptions, getWeatherStatus, getRouteNews } from '../api';
import Map from '../components/Map';
import { Bot, Send, ShieldAlert, Zap, Truck, Train, Plane, Ship, CheckCircle2, ChevronRight, Upload, Info, X, CloudLightning, FileText, AlertTriangle, Briefcase, Activity, CheckCircle, Navigation, TrendingUp, TrendingDown } from 'lucide-react';

// ── Gemini API Key ─────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function RouteIntelligence() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  // ── existing state ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'agent', content: 'Analyzing multi-modal route options for your shipment. How can I help optimize this?' }
  ]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const chatEndRef = useRef(null);

  // ── new state for Know More drawer ─────────────────────────────────────────
  const [knowMoreRoute, setKnowMoreRoute] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // ── queries ────────────────────────────────────────────────────────────────
  const { data: routeOptions, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routeOptions', shipmentId],
    queryFn: () => getRouteOptions(shipmentId)
  });

  const { data: nodes, isLoading: loadingNodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: getNodes
  });

  const { data: disruptions } = useQuery({
    queryKey: ['disruptions'],
    queryFn: getLiveDisruptions,
    refetchInterval: 10000
  });

  const { data: weatherData } = useQuery({
    queryKey: ['weatherStatus'],
    queryFn: getWeatherStatus,
    refetchInterval: 30000
  });

  const { data: newsData } = useQuery({
    queryKey: ['newsData', 'Pune_Hub', 'Mumbai_Hub'],
    queryFn: () => getRouteNews('Pune_Hub', 'Mumbai_Hub'),
    refetchInterval: 60000
  });

  const chatMutation = useMutation({
    mutationFn: chatWithAgent,
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, {
        role: 'agent',
        content: data.response,
        tools: data.tools_invoked
      }]);
    }
  });

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: chatInput }]);
    chatMutation.mutate({ shipment_id: shipmentId, message: chatInput });
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Gemini call when knowMoreRoute changes ─────────────────────────────────
  useEffect(() => {
    if (!knowMoreRoute) return;
    setInsights(null);
    setLoadingInsights(true);

    const prompt = `You are InsureRoute Intelligence — a senior AI advisor inside a real-time logistics command centre serving the Pune–Mumbai expressway corridor.

You have received LIVE sensor data from OpenWeatherMap across all route checkpoints, live news from NewsData API, and actuarial insurance data. Use ONLY the numbers below. Never invent data.

━━━ ROUTE ━━━
Route ID        : ${knowMoreRoute.route_id}
Modes           : ${knowMoreRoute.modes.join(' → ')}
Path            : ${knowMoreRoute.path?.join(' → ') || 'N/A'}
ETA             : ${Math.floor(knowMoreRoute.total_time_min / 60)}h ${knowMoreRoute.total_time_min % 60}m
Total Cost      : ₹${knowMoreRoute.total_cost_inr?.toLocaleString('en-IN')}
Multimodal      : ${knowMoreRoute.is_multimodal ? 'Yes' : 'No'}
System Pick     : ${knowMoreRoute.isBest ? 'Yes — Recommended' : 'No'}
Market Trend    : ${knowMoreRoute.market_trend ? `${knowMoreRoute.market_trend.label} (${knowMoreRoute.market_trend.delta_pct > 0 ? '+' : ''}${knowMoreRoute.market_trend.delta_pct}%) driven by ${knowMoreRoute.market_trend.driver}` : 'N/A'}
Active Alerts   : ${disruptions?.map(d => d.checkpoint_id).join(', ') || 'None'}

━━━ LIVE WEATHER (OpenWeatherMap) ━━━
Overall Status  : ${weatherData?.is_dangerous ? '🔴 DANGEROUS' : '🟢 CLEAR'}
Last Polled     : ${weatherData?.last_checked || 'Unknown'}
Auto-Reroute Via: ${weatherData?.alternate_route_via || 'N/A'}

${(weatherData?.checkpoints || []).map(cp => `
Checkpoint : ${cp.name} (${cp.role?.replace(/_/g, ' ')})
Condition  : ${cp.description}
Temp       : ${cp.temperature}°C | Humidity: ${cp.humidity}%
Rain       : ${cp.rain_1h ?? 0} mm/hr | Wind: ${cp.wind_speed ?? 0} m/s
Severity   : ${Math.round((cp.severity ?? 0) * 100)}% | Dangerous: ${cp.is_dangerous ? 'YES ⚠️' : 'No'}
`).join('---') || 'No live checkpoint data available.'}

━━━ LIVE NEWS (NewsData API) ━━━
${(newsData?.news || []).filter(n => (n.relevance_score || 0) >= 0.4).slice(0, 4).map(n =>
  `- "${n.title}" | Source: ${n.source} | Relevance: ${(n.relevance_score || 0).toFixed(2)} | Location: ${n.location_tag || 'Route Corridor'} | Published: ${n.published_at || 'Recent'}`
).join('\n') || 'No high-relevance news for this corridor right now.'}

━━━ INSURANCE (Actuarial Engine) ━━━
Cargo Type              : ${knowMoreRoute.cargo_type || 'Standard'}
Cargo Value             : ₹${knowMoreRoute.cargo_value_inr?.toLocaleString('en-IN') || 'N/A'}
Premium (Standard Route): ₹${knowMoreRoute.insurance?.before_cost?.toLocaleString('en-IN') || 'N/A'}
Premium (This Route)    : ₹${knowMoreRoute.insurance?.after_cost?.toLocaleString('en-IN') || 'N/A'}
Savings                 : ₹${knowMoreRoute.insurance?.savings?.toLocaleString('en-IN') || '0'} (${knowMoreRoute.insurance?.savings_pct || 0}% reduction)
Weather Multiplier      : x${knowMoreRoute.insurance?.weather_multiplier?.toFixed(2) || '1.00'}
Perishable Multiplier   : x${knowMoreRoute.insurance?.perishable_multiplier?.toFixed(2) || '1.00'}
Fragility Multiplier    : x${knowMoreRoute.insurance?.fragility_multiplier?.toFixed(2) || '1.00'}
Value Density Multiplier: x${knowMoreRoute.insurance?.value_density_multiplier?.toFixed(2) || '1.00'}
Composite Cargo Risk    : x${knowMoreRoute.insurance?.cargo_multiplier?.toFixed(2) || '1.00'}

━━━ YOUR TASK ━━━
Return ONLY a raw JSON object. No markdown. No backticks. No text outside the JSON.

{
  "summary": "2-3 sentences covering route status, live weather posture, and overall risk — use actual checkpoint names and data",
  "weather_headline": "One sentence naming the single most dangerous weather condition right now with the checkpoint name and its exact rain/wind reading",
  "most_dangerous_checkpoint": "Checkpoint name with highest severity, or 'All Clear'",
  "checkpoint_advisory": "2 sentences for the driver and dispatcher about the worst checkpoint — reference its role (mountain pass, expressway entry, etc.) and tell them exactly what to do",
  "pros": ["pro grounded in live data 1", "pro grounded in live data 2", "pro grounded in live data 3"],
  "cons": ["con grounded in live data 1", "con grounded in live data 2"],
  "risk_level": "LOW or MEDIUM or HIGH",
  "risk_reason": "One sentence citing the actual anomaly score, weather severity %, or active disruption that drives this rating",
  "insurance_tip": "One actionable tip citing the exact multiplier values above — tell the underwriter what to watch or adjust",
  "routing_verdict": "One decisive sentence — take this route or switch, and exactly why based on the data",
  "news_highlight": "One sentence on the most operationally relevant news item, or 'No significant alerts for this corridor.'",
  "operations_action": "Specific action for the operations manager right now — name the checkpoint, cost, or ETA impact",
  "underwriter_action": "Specific action for the underwriter — cite the exact multiplier that is elevated and what coverage adjustment to make",
  "analyst_action": "Specific monitoring recommendation — which checkpoint metric to watch and at what threshold to escalate",
  "best_for": "The cargo type or shipment scenario this route is optimally suited for given current conditions",
  "cost_breakdown": {
    "fuel": 1500,
    "toll": 800,
    "handling": 600,
    "other": 400
  },
  "one_line_verdict": "One bold decisive sentence — the complete situation and recommended posture in plain English"
}`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    })
      .then(r => r.json())
      .then(data => {
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        const clean = raw.replace(/```json|```/g, '').trim();
        setInsights(JSON.parse(clean));
      })
      .catch(() => setInsights(null))
      .finally(() => setLoadingInsights(false));
  }, [knowMoreRoute]);

  // ── map data ───────────────────────────────────────────────────────────────
  const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const mapData = useMemo(() => {
    if (!routeOptions || !nodes) return { routes: [], markers: [], checkpoints: [] };

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const disruptedNodeIds = new Set(disruptions?.map(d => d.checkpoint_id) || []);

    const routes = routeOptions.map((route, idx) => ({
      id: route.route_id,
      positions: route.path.map(nodeId => {
        const n = nodeMap[nodeId];
        return n ? [n.lat, n.lon] : null;
      }).filter(Boolean),
      isBest: idx === 0,
      isMultimodal: route.is_multimodal,
      modes: route.modes,
      baseColor: ROUTE_COLORS[idx % ROUTE_COLORS.length]
    }));

    routes.forEach(r => {
      if (r.modes.includes('rail')) {
        r.positions = r.positions.map(p => [p[0] + 0.015, p[1] - 0.015]);
      }
    });

    const checkpointMap = {};
    routeOptions.forEach(route => {
      route.path.forEach(nodeId => {
        if (!checkpointMap[nodeId] && nodeMap[nodeId]) {
          checkpointMap[nodeId] = {
            lat: nodeMap[nodeId].lat,
            lon: nodeMap[nodeId].lon,
            label: nodeMap[nodeId].name,
            isDisrupted: disruptedNodeIds.has(nodeId)
          };
        }
      });
    });

    const checkpoints = Object.values(checkpointMap);

    let markers = [];
    if (routeOptions.length > 0) {
      const bestRoute = routeOptions[0];
      const startNode = nodeMap[bestRoute.path[0]];
      const endNode = nodeMap[bestRoute.path[bestRoute.path.length - 1]];
      if (startNode) markers.push({ lat: startNode.lat, lon: startNode.lon, label: startNode.name });
      if (endNode) markers.push({ lat: endNode.lat, lon: endNode.lon, label: endNode.name });
    }

    return { routes, markers, checkpoints };
  }, [routeOptions, nodes, disruptions]);

  const ModeIcon = ({ mode, className = 'w-4 h-4' }) => {
    if (mode === 'road') return <Truck className={className} />;
    if (mode === 'rail') return <Train className={className} />;
    if (mode === 'air') return <Plane className={className} />;
    if (mode === 'sea') return <Ship className={className} />;
    return <Truck className={className} />;
  };

  const riskColors = {
    LOW:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    MEDIUM: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    HIGH:   { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  };

  if (loadingRoutes || loadingNodes) return (
    <div className="flex h-full items-center justify-center p-12">Loading analysis...</div>
  );

  return (
    <>
      {/* ── Main three-column grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

        {/* LEFT: Route Options */}
        <div className="col-span-1 lg:col-span-3 bg-bgCard rounded-xl shadow-card overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg">Route Options</h2>
            <p className="text-xs text-textSecondary">Gemini Recommended</p>
          </div>
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            {routeOptions?.map((route, idx) => (
              <div
                key={route.route_id}
                onClick={() => setSelectedRouteId(route.route_id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRouteId === route.route_id || (!selectedRouteId && idx === 0)
                    ? 'border-accentPrimary bg-bgCardAlt shadow-md'
                    : 'border-border hover:border-textMuted'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1">
                    {route.modes.map((mode, i) => (
                      <React.Fragment key={i}>
                        <span className="p-1.5 bg-white rounded-md border text-textSecondary">
                          <ModeIcon mode={mode} />
                        </span>
                        {i < route.modes.length - 1 && <ChevronRight className="w-3 h-3 text-textMuted" />}
                      </React.Fragment>
                    ))}
                  </div>
                  {idx === 0 && (
                    <span className="bg-accentSuccess/10 text-accentSuccess text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Best
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <div className="text-xs text-textSecondary">ETA</div>
                    <div className="font-mono font-medium">
                      {Math.floor(route.total_time_min / 60)}h {route.total_time_min % 60}m
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary">Cost</div>
                    <div className="font-mono font-medium">₹{route.total_cost_inr.toLocaleString()}</div>
                  </div>
                </div>

                {/* Market Trend Badge */}
                {route.market_trend && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{route.market_trend.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{route.market_trend.driver}</div>
                    </div>
                    <div className={`flex items-center gap-1 font-mono font-bold ${route.market_trend.delta_pct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {route.market_trend.delta_pct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {route.market_trend.delta_pct > 0 ? '+' : ''}{route.market_trend.delta_pct}%
                    </div>
                  </div>
                )}

                {/* Select Route */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/monitor/${shipmentId}`);
                  }}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRouteId === route.route_id || (!selectedRouteId && idx === 0)
                      ? 'bg-accentPrimary text-white'
                      : 'bg-bgPrimary text-textSecondary hover:bg-gray-200'
                  }`}
                >
                  Select Route
                </button>

                {/* Know More */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setKnowMoreRoute(route);
                  }}
                  className="w-full py-2 rounded-lg text-sm font-medium border border-accentPrimary text-accentPrimary hover:bg-blue-50 transition-colors mt-2 flex items-center justify-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" /> Know More
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="col-span-1 lg:col-span-5 bg-bgCard rounded-xl shadow-card overflow-hidden relative">
          <Map markers={mapData.markers} routes={mapData.routes} selectedRouteId={selectedRouteId} />
        </div>

        {/* RIGHT: AI Chat */}
        <div className="col-span-1 lg:col-span-4 bg-bgCard rounded-xl shadow-card flex flex-col h-full border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="w-8 h-8 rounded-full bg-accentPrimary text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">InsureRoute AI</h3>
              <p className="text-xs text-textSecondary">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-accentPrimary text-white rounded-tr-sm'
                    : 'bg-bgPrimary text-textPrimary border border-border rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.tools.map((tool, tIdx) => (
                      <div key={tIdx} className="text-[10px] font-mono bg-blue-50 text-accentPrimary border border-blue-100 px-2 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />{tool.name}()
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="self-start bg-bgPrimary border border-border p-3 rounded-xl rounded-tl-sm flex gap-1">
                <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-3 border-t border-border bg-white flex gap-2">
            <button type="button" className="p-2 text-textMuted hover:text-accentPrimary transition-colors" title="Upload Radar Image">
              <Upload className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Gemini to optimize..."
              className="flex-1 bg-bgPrimary border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-accentPrimary"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatMutation.isPending}
              className="p-2 bg-accentPrimary text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ── Know More Drawer ──────────────────────────────────────────────────── */}
      {knowMoreRoute && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setKnowMoreRoute(null)}
          />

          {/* Drawer panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-[slideIn_0.25s_ease-out]"
            style={{ animation: 'slideIn 0.25s ease-out' }}>

            {/* Drawer header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 opacity-80" />
                    <span className="font-bold text-base">Route Insights</span>
                  </div>
                  <p className="text-blue-200 text-xs">
                    {knowMoreRoute.modes.join(' → ')} · ₹{knowMoreRoute.total_cost_inr.toLocaleString()} · {Math.floor(knowMoreRoute.total_time_min / 60)}h {knowMoreRoute.total_time_min % 60}m
                  </p>
                </div>
                <button
                  onClick={() => setKnowMoreRoute(null)}
                  className="text-blue-200 hover:text-white transition-colors mt-0.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {loadingInsights && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="flex gap-2">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-3 h-3 bg-accentPrimary rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <p className="text-sm text-textSecondary">Gemini is analyzing this route...</p>
                </div>
              )}

              {/* Insights */}
              {insights && !loadingInsights && (
                <div className="p-6 space-y-5">

                  {/* Verdict Header */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl text-white shadow-md">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Command Verdict</div>
                    <div className="text-sm font-semibold leading-relaxed">
                      {insights.one_line_verdict}
                    </div>
                  </div>

                  {/* Risk badge & Reason */}
                  {(() => {
                    const rc = riskColors[insights.risk_level] ?? riskColors.MEDIUM;
                    return (
                      <div className={`rounded-xl p-4 border ${rc.bg} ${rc.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                          <span className={`text-xs font-bold uppercase tracking-wide ${rc.text}`}>
                            {insights.risk_level} RISK
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${rc.text}`}>{insights.risk_reason}</p>
                      </div>
                    );
                  })()}

                  {/* Summary */}
                  <div>
                    <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wide mb-2">Situation Summary</div>
                    <p className="text-xs text-textPrimary leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{insights.summary}</p>
                  </div>

                  {/* Routing Decision */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Routing Decision</div>
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed font-medium mb-3">{insights.routing_verdict}</p>
                    <div className="pt-3 border-t border-blue-200/50">
                      <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Optimized For</div>
                      <div className="text-xs text-blue-900">{insights.best_for}</div>
                    </div>
                  </div>

                  {/* Weather Intelligence */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CloudLightning className="w-4 h-4 text-amber-500" />
                      <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wide">Weather Intelligence</div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white border-l-4 border-amber-500 shadow-sm p-3 rounded-r-lg">
                        <div className="text-[10px] text-amber-600 font-bold uppercase mb-1">{insights.most_dangerous_checkpoint}</div>
                        <div className="text-xs font-medium text-slate-800">{insights.weather_headline}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Advisory</div>
                        <div className="text-xs text-slate-700">{insights.checkpoint_advisory}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Matrix */}
                  <div>
                    <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wide mb-3">Required Actions</div>
                    <div className="space-y-2">
                      <div className="flex gap-3 bg-red-50 border border-red-100 p-3 rounded-lg">
                        <Activity className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-red-600 font-bold uppercase mb-0.5">Operations</div>
                          <div className="text-xs text-red-900 leading-relaxed">{insights.operations_action}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                        <Briefcase className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase mb-0.5">Underwriting</div>
                          <div className="text-xs text-emerald-900 leading-relaxed">{insights.underwriter_action}</div>
                          <div className="mt-1.5 text-[10px] bg-emerald-200/50 text-emerald-800 px-2 py-1 rounded inline-block font-medium">Tip: {insights.insurance_tip}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-indigo-600 font-bold uppercase mb-0.5">Analytics</div>
                          <div className="text-xs text-indigo-900 leading-relaxed">{insights.analyst_action}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* News Highlight */}
                  {insights.news_highlight && insights.news_highlight !== 'No significant alerts for this corridor.' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2 items-start">
                      <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-orange-600 font-bold uppercase mb-0.5">Live News</div>
                        <div className="text-xs text-orange-900 leading-relaxed">{insights.news_highlight}</div>
                      </div>
                    </div>
                  )}

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                      <div className="text-[10px] font-bold text-emerald-700 mb-2 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Strengths</div>
                      <ul className="space-y-1.5">
                        {insights.pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                            <span className="leading-tight">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg">
                      <div className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-wide flex items-center gap-1"><X className="w-3 h-3"/> Weaknesses</div>
                      <ul className="space-y-1.5">
                        {insights.cons.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <span className="text-red-500 mt-0.5 shrink-0">•</span>
                            <span className="leading-tight">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div>
                    <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wide mb-3">
                      Estimated Cost Breakdown
                    </div>
                    <div className="space-y-2.5">
                      {Object.entries(insights.cost_breakdown).map(([key, val]) => {
                        const total = Object.values(insights.cost_breakdown).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-textSecondary capitalize">{key}</span>
                              <span className="font-mono font-medium">₹{val.toLocaleString()} <span className="text-textMuted">({pct}%)</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accentPrimary rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      setSelectedRouteId(knowMoreRoute.route_id);
                      setKnowMoreRoute(null);
                    }}
                    className="w-full py-3 bg-accentPrimary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Select This Route
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation keyframe */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}