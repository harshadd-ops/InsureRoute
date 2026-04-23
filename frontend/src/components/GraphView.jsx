import { motion } from 'framer-motion'
import { useMemo, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Minus, Plus, RotateCcw } from 'lucide-react'
import { fetchRoadGeometry } from '../services/routeGeometry'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// ── Node coordinates (real Indian hub lat/lon) ────────────────────────────
const NODE_MAP = {
  Delhi_Hub:         { lon: 77.2090, lat: 28.6139, label: 'Delhi'        },
  Mumbai_Hub:        { lon: 72.8777, lat: 19.0760, label: 'Mumbai'       },
  Bangalore_Hub:     { lon: 77.5946, lat: 12.9716, label: 'Bangalore'    },
  Chennai_Hub:       { lon: 80.2707, lat: 13.0827, label: 'Chennai'      },
  Kolkata_Hub:       { lon: 88.3639, lat: 22.5726, label: 'Kolkata'      },
  Hyderabad_Hub:     { lon: 78.4867, lat: 17.3850, label: 'Hyderabad'    },
  Pune_Hub:          { lon: 73.8567, lat: 18.5204, label: 'Pune'         },
  Ahmedabad_Hub:     { lon: 72.5714, lat: 23.0225, label: 'Ahmedabad'    },
  Jaipur_Hub:        { lon: 75.7873, lat: 26.9124, label: 'Jaipur'       },
  Lucknow_Hub:       { lon: 80.9462, lat: 26.8467, label: 'Lucknow'      },
  Surat_Hub:         { lon: 72.8311, lat: 21.1702, label: 'Surat'        },
  Nashik_Hub:        { lon: 73.7898, lat: 19.9975, label: 'Nashik'       },
  Nagpur_Hub:        { lon: 79.0882, lat: 21.1458, label: 'Nagpur'       },
  Navi_Mumbai_DC:    { lon: 73.0297, lat: 19.0330, label: 'Navi Mumbai'  },
  Indore_Hub:        { lon: 75.8577, lat: 22.7196, label: 'Indore'       },
  Bhopal_Hub:        { lon: 77.4126, lat: 23.2599, label: 'Bhopal'       },
  Coimbatore_Hub:    { lon: 76.9558, lat: 11.0168, label: 'Coimbatore'   },
  Visakhapatnam_Hub: { lon: 83.2185, lat: 17.6868, label: 'Vizag'        },
  Patna_Hub:         { lon: 85.1376, lat: 25.5941, label: 'Patna'        },
  Kochi_Hub:         { lon: 76.2673, lat: 9.9312,  label: 'Kochi'        },
  Faridabad_DC:      { lon: 77.3132, lat: 28.4089, label: 'Faridabad'    },
  Udaipur_DC:        { lon: 73.7125, lat: 24.5854, label: 'Udaipur'      },
  Belgaum_DC:        { lon: 74.5045, lat: 15.8497, label: 'Belgaum'      },
  Mangalore_DC:      { lon: 74.8560, lat: 12.9141, label: 'Mangalore'    },
}

// ── Edges — background network display only ──────────────────────────────
// NOTE: These edges are used ONLY for drawing the grey background network.
// The active route path is drawn separately from route.path directly,
// so direction mismatches here do NOT affect route highlighting.
const EDGE_PAIRS = [
  ['Pune_Hub',       'Mumbai_Hub'],
  ['Pune_Hub',       'Nashik_Hub'],
  ['Pune_Hub',       'Bangalore_Hub'],
  ['Pune_Hub',       'Hyderabad_Hub'],
  ['Nashik_Hub',     'Mumbai_Hub'],
  ['Nashik_Hub',     'Surat_Hub'],
  ['Surat_Hub',      'Navi_Mumbai_DC'],
  ['Navi_Mumbai_DC', 'Mumbai_Hub'],
  ['Mumbai_Hub',     'Ahmedabad_Hub'],
  ['Mumbai_Hub',     'Pune_Hub'],
  ['Ahmedabad_Hub',  'Surat_Hub'],
  ['Ahmedabad_Hub',  'Jaipur_Hub'],
  ['Ahmedabad_Hub',  'Indore_Hub'],
  ['Delhi_Hub',      'Jaipur_Hub'],
  ['Delhi_Hub',      'Lucknow_Hub'],
  ['Delhi_Hub',      'Bhopal_Hub'],
  ['Lucknow_Hub',    'Patna_Hub'],
  ['Lucknow_Hub',    'Bhopal_Hub'],
  ['Kolkata_Hub',    'Patna_Hub'],
  ['Kolkata_Hub',    'Visakhapatnam_Hub'],
  ['Chennai_Hub',    'Bangalore_Hub'],
  ['Bangalore_Hub',  'Chennai_Hub'],
  ['Chennai_Hub',    'Visakhapatnam_Hub'],
  ['Bangalore_Hub',  'Hyderabad_Hub'],
  ['Hyderabad_Hub',  'Bangalore_Hub'],
  ['Bangalore_Hub',  'Kochi_Hub'],
  ['Bangalore_Hub',  'Coimbatore_Hub'],
  ['Hyderabad_Hub',  'Visakhapatnam_Hub'],
  ['Hyderabad_Hub',  'Nagpur_Hub'],
  ['Hyderabad_Hub',  'Chennai_Hub'],
  ['Hyderabad_Hub',  'Pune_Hub'],
  ['Coimbatore_Hub', 'Chennai_Hub'],
  ['Kochi_Hub',      'Coimbatore_Hub'],
  ['Nagpur_Hub',     'Hyderabad_Hub'],
  ['Nagpur_Hub',     'Bhopal_Hub'],
  ['Nagpur_Hub',     'Kolkata_Hub'],
  ['Nagpur_Hub',     'Pune_Hub'],
  ['Bhopal_Hub',     'Indore_Hub'],
  ['Indore_Hub',     'Ahmedabad_Hub'],
  ['Jaipur_Hub',     'Delhi_Hub'],
  ['Jaipur_Hub',     'Ahmedabad_Hub'],
  ['Patna_Hub',      'Kolkata_Hub'],
  ['Visakhapatnam_Hub', 'Chennai_Hub'],
  ['Visakhapatnam_Hub', 'Hyderabad_Hub'],
]

// ── Leaflet Controls ────────────────────────────────────────────────────────
function MapController({ routePath, activeCoords }) {
  const map = useMap()
  
  useEffect(() => {
    if (activeCoords && activeCoords.length > 0) {
      const lats = activeCoords.map(c => c[1])
      const lons = activeCoords.map(c => c[0])
      const bounds = [
        [Math.min(...lats) - 0.5, Math.min(...lons) - 0.5],
        [Math.max(...lats) + 0.5, Math.max(...lons) + 0.5]
      ]
      map.flyToBounds(bounds, { duration: 1.5, padding: [20, 20], maxZoom: 12 })
    }
  }, [routePath?.join('|'), activeCoords])

  return null
}

function CustomZoomControl() {
  const map = useMap()
  const [z, setZ] = useState(map.getZoom())
  
  useEffect(() => {
    const onZoom = () => setZ(map.getZoom())
    map.on('zoomend', onZoom)
    return () => map.off('zoomend', onZoom)
  }, [map])

  return (
    <div
      data-map-control
      className="absolute left-2 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-slate-600/80 bg-slate-900/90 p-1 shadow-lg"
    >
      <div
        className="mb-0.5 rounded px-1.5 py-0.5 text-center text-[8px] font-bold uppercase tracking-wider text-emerald-400"
        style={{ borderBottom: '1px solid rgba(52,211,153,0.25)' }}
      >
        Satellite
      </div>
      <button
        type="button"
        title="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-200 hover:bg-slate-700"
        onClick={() => map.zoomIn()}
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        title="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-200 hover:bg-slate-700"
        onClick={() => map.zoomOut()}
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        title="Reset zoom & pan"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        onClick={() => map.setView([22.0, 79.0], 5)}
      >
        <RotateCcw size={14} />
      </button>
      <div className="px-1 pb-0.5 text-center font-mono text-[9px] text-slate-500">
        {Math.round((z / 18) * 100)}%
      </div>
      <div className="max-w-[4.5rem] px-0.5 pb-1 text-center text-[7px] leading-snug text-slate-500">
        Scroll wheel zoom · drag map to pan
      </div>
    </div>
  )
}

function buildVariantExplanation(selected, best) {
  if (!best || !selected || selected.id === best.id) {
    return (
      'Default is the fastest driving option from OpenRouteService for this hub sequence. ' +
      'Shorter driving time generally means lower fuel and driver hours for long-haul freight.'
    )
  }
  const dMin = (selected.duration_sec - best.duration_sec) / 60
  const dKm = (selected.distance_m - best.distance_m) / 1000
  const parts = []
  if (dMin >= 1) parts.push(`About ${Math.round(dMin)} minutes longer than the best route`)
  else if (dMin > 0.05) parts.push(`Roughly ${Math.round(dMin * 60)} seconds longer`)
  if (dKm >= 0.5) parts.push(`Approximately ${dKm.toFixed(1)} km more distance`)
  if (parts.length === 0)
    parts.push('Very similar ETA; this path uses different highway links on the same road network')
  parts.push(
    'Not chosen as default because InsureRoute prioritizes minimum driving duration for fleet planning on this waypoint order.',
  )
  return parts.join('. ') + '.'
}

function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.id === value)

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-xs rounded px-3 py-2.5 font-semibold outline-none flex justify-between items-center transition-colors shadow-sm"
        style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0' }}
      >
        <span>{selectedOption?.label ?? 'Select...'}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full top-full mt-1.5 py-1 rounded-lg shadow-2xl max-h-56 overflow-y-auto custom-scrollbar"
          style={{ 
            background: 'rgba(15,23,42,0.98)', 
            border: '1px solid rgba(99,102,241,0.3)', 
            backdropFilter: 'blur(12px)' 
          }}
        >
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false) }}
              className="px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-indigo-500/20 text-slate-200 transition-colors"
              style={{ background: opt.id === value ? 'rgba(99,102,241,0.15)' : 'transparent' }}
            >
              {opt.label}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function GraphView({ nodes = [], edges = [], route = null, params, setParams }) {
  // All hubs on the map: API nodes (full graph) + NODE_MAP labels + any id on active route.path
  const allNodes = useMemo(() => {
    const fromApi = new Map(nodes.map(n => [n.id, n]))
    const ids = new Set([
      ...Object.keys(NODE_MAP),
      ...(route?.path ?? []),
      ...nodes.map(n => n.id),
    ])
    return [...ids].map(id => {
      const api = fromApi.get(id)
      const meta = NODE_MAP[id]
      const lon = Number(api?.lon ?? meta?.lon ?? 77.0)
      const lat = Number(api?.lat ?? meta?.lat ?? 20.0)
      const label = (meta?.label ?? api?.label ?? id.replace(/_/g, ' '))
        .replace(/\s+Hub$/i, '')
        .replace(/\s+DC$/i, '')
      return { id, lon, lat, label }
    })
  }, [nodes, route?.path])

  const nodesById = useMemo(() => {
    const m = {}
    allNodes.forEach(n => { m[n.id] = n })
    return m
  }, [allNodes])

  const routeNodeSet = useMemo(() => new Set(route?.path ?? []), [route])
  const disrupted = route?.disruption_detected ?? false

  const [routeVariants, setRouteVariants] = useState([])
  const [selectedVariantId, setSelectedVariantId] = useState('best')
  const [lineMode, setLineMode] = useState('idle') // 'road' | 'fallback' | 'idle'
  const [lineMessage, setLineMessage] = useState(null)
  const fetchAbortRef = useRef(null)

  const bestVariant = useMemo(
    () => routeVariants.find(v => v.is_best) || routeVariants[0] || null,
    [routeVariants],
  )
  const selectedVariant = useMemo(
    () => routeVariants.find(v => v.id === selectedVariantId) || bestVariant,
    [routeVariants, selectedVariantId, bestVariant],
  )

  const activeCoords = useMemo(() => {
    const coords = selectedVariant?.coordinates
  // Fetch road geometry (ORS) whenever the ordered path changes
  useEffect(() => {
    const path = route?.path
    if (!path || path.length < 2) {
      setRouteVariants([])
      setSelectedVariantId('best')
      setLineMode('idle')
      setLineMessage(null)
      return
    }
    fetchAbortRef.current?.abort()
    const ac = new AbortController()
    fetchAbortRef.current = ac
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchRoadGeometry(path, ac.signal)
        if (cancelled) return
        const coords = Array.isArray(res.coordinates) ? res.coordinates : []
        let variants = Array.isArray(res.variants) ? res.variants : []
        if (coords.length >= 2 && !variants.length) {
          variants = [
            {
              id: 'best',
              label: 'Hub connector',
              coordinates: coords,
              duration_sec: 0,
              distance_m: 0,
              is_best: true,
            },
          ]
        }
        if (variants.length >= 1 && variants[0].coordinates?.length >= 2) {
          setRouteVariants(variants)
          setSelectedVariantId('best')
          setLineMode(res.mode === 'road' ? 'road' : 'fallback')
          setLineMessage(res.message || null)
        } else {
          const ll = path
            .map(id => {
              const hit = nodes.find(n => n.id === id)
              const meta = NODE_MAP[id]
              const lon = Number(hit?.lon ?? meta?.lon)
              const lat = Number(hit?.lat ?? meta?.lat)
              if (Number.isNaN(lon) || Number.isNaN(lat)) return null
              return [lon, lat]
            })
            .filter(Boolean)
          if (ll.length >= 2) {
            setRouteVariants([{ id: 'best', label: 'Hub connector', coordinates: ll, duration_sec: 0, distance_m: 0, is_best: true }])
            setSelectedVariantId('best')
            setLineMode('fallback')
            setLineMessage(res.message || 'WARNING: Optimized route unavailable (API missing)')
          } else {
            setRouteVariants([])
            setLineMode('fallback')
            setLineMessage('WARNING: Optimized route unavailable')
          }
        }
      } catch (e) {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError') return
        if (cancelled) return
        const ll = path
          .map(id => {
            const hit = nodes.find(n => n.id === id)
            const meta = NODE_MAP[id]
            const lon = Number(hit?.lon ?? meta?.lon)
            const lat = Number(hit?.lat ?? meta?.lat)
            if (Number.isNaN(lon) || Number.isNaN(lat)) return null
            return [lon, lat]
          })
          .filter(Boolean)
        if (ll.length >= 2) {
          setRouteVariants([{ id: 'best', label: 'Hub connector', coordinates: ll, duration_sec: 0, distance_m: 0, is_best: true }])
          setSelectedVariantId('best')
          setLineMode('fallback')
          setLineMessage('WARNING: Optimized route unavailable')
        } else {
          setRouteVariants([])
          setLineMode('fallback')
          setLineMessage('WARNING: Optimized route unavailable')
        }
      }
    })()
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [route?.path, nodes])

  function nodeColor(id) {
    if (id === params?.origin)      return '#f0f9ff'
    if (id === params?.destination) return '#4ade80'
    if (routeNodeSet.has(id))       return disrupted ? '#f87171' : '#fbbf24'
    return 'rgba(148,163,184,0.55)'
  }

  // All node IDs for select dropdowns
  const nodeIds = Object.keys(NODE_MAP)

  return (
    <div className="glass p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text">Supply Chain Network</span>
          <span className="text-xs text-muted font-medium">India logistics routing — satellite view</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
          <Legend color="#f0f9ff"  label="Origin" />
          <Legend color="#4ade80"  label="Destination" />
          <Legend color={disrupted ? '#f87171' : '#fbbf24'} label={disrupted ? 'Disrupted' : 'Active Route'} />
          <Legend color="rgba(148,163,184,0.55)" label="Idle Hub" />
        </div>
      </div>

      {/* Map Area */}
      <div
        className="relative flex-1 w-full rounded-xl overflow-hidden bg-slate-950"
        style={{ minHeight: 300 }}
      >
        {/* Invisible SVG for definitions (glows, gradients) so Leaflet can use them */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-route-line">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="route-risk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={disrupted ? '#fca5a5' : '#34d399'} />
              <stop offset="50%" stopColor={disrupted ? '#f87171' : '#fbbf24'} />
              <stop offset="100%" stopColor={disrupted ? '#ef4444' : '#fb923c'} />
            </linearGradient>
          </defs>
        </svg>

        <MapContainer 
          center={[22.0, 79.0]} 
          zoom={5} 
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#020817', zIndex: 0 }}
          attributionControl={false}
        >
          <MapController routePath={route?.path} activeCoords={activeCoords} />
          
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            className="esri-base-layer"
          />

          {/* Dark Overlay Layer */}
          <div
            className="leaflet-overlay-pane pointer-events-none"
            style={{
              position: 'absolute', inset: 0, zIndex: 300,
              background: 'linear-gradient(135deg, rgba(2,8,23,0.14) 0%, rgba(15,23,42,0.1) 50%, rgba(2,6,23,0.12) 100%)',
            }}
          />

          {/* Grid Lines (CSS grid overlay since map is dynamic) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-[350]" style={{ opacity: 0.06 }}>
            <svg className="w-full h-full">
              {[...Array(8)].map((_, i) => (
                <line key={`v${i}`} x1={`${(i + 1) * 12.5}%`} y1="0" x2={`${(i + 1) * 12.5}%`} y2="100%" stroke="#bae6fd" strokeWidth="0.5" />
              ))}
              {[...Array(5)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${(i + 1) * 16.6}%`} x2="100%" y2={`${(i + 1) * 16.6}%`} stroke="#bae6fd" strokeWidth="0.5" />
              ))}
            </svg>
          </div>

          {/* Background network edges */}
          {allEdges.map((e, i) => {
            const s = nodesById[e.source]
            const t = nodesById[e.target]
            if (!s || !t) return null
            return (
              <Polyline
                key={i}
                positions={[[s.lat, s.lon], [t.lat, t.lon]]}
                pathOptions={{
                  color: 'rgba(148,163,184,0.25)',
                  weight: 1.5,
                  opacity: 0.5,
                  lineCap: 'round'
                }}
              />
            )
          })}

          {/* Active Route */}
          {activeCoords.length >= 2 && (
            <Polyline
              key={`${(route?.path ?? []).join('|')}#${selectedVariantId}`}
              positions={activeCoords.map(c => [c[1], c[0]])}
              pathOptions={{
                color: lineMode === 'road'
                  ? (selectedVariantId !== 'best' ? '#c4b5fd' : 'url(#route-risk-gradient)')
                  : '#888888',
                weight: lineMode === 'road' ? 3.4 : 2.2,
                dashArray: lineMode === 'road' ? undefined : '6, 6',
                className: lineMode === 'road' ? 'glow-route-line' : '',
                opacity: 0.95
              }}
            />
          )}

          {/* Nodes */}
          {allNodes.map(n => {
            const isKey = routeNodeSet.has(n.id)
            const isOrigin = n.id === params?.origin
            const isDest   = n.id === params?.destination
            const r = isOrigin || isDest ? 7 : isKey ? 5.5 : 3
            const color = nodeColor(n.id)
            
            return (
              <CircleMarker
                key={n.id}
                center={[n.lat, n.lon]}
                radius={r}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 1,
                  color: isKey ? '#fff' : 'rgba(255,255,255,0.2)',
                  weight: isKey ? 1.5 : 0.5,
                  className: isKey ? 'glow-node' : ''
                }}
              >
                {/* Pulse ring for key nodes */}
                {(isOrigin || isDest) && (
                  <CircleMarker
                    center={[n.lat, n.lon]}
                    radius={r + 5}
                    pathOptions={{
                      fill: false,
                      color: isDest ? '#4ade80' : '#f0f9ff',
                      weight: 1,
                      opacity: 0.4
                    }}
                    interactive={false}
                  />
                )}
                {isKey && (
                  <Tooltip 
                    permanent 
                    direction="top" 
                    className="custom-hub-tooltip" 
                    offset={[0, -10]}
                  >
                    {n.label}
                  </Tooltip>
                )}
              </CircleMarker>
            )
          })}
          
          <CustomZoomControl />
        </MapContainer>
      </div>

      {/* Route info overlay */}
        {route && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-14 right-3 backdrop-blur-md border shadow-2xl rounded-xl p-4 text-xs space-y-3 w-64"
            style={{
              background: 'rgba(2,8,23,0.88)',
              border: '1px solid rgba(99,102,241,0.35)',
              zIndex: 10,
            }}
          >
            {/* Route selectors */}
            {params && setParams && (
              <div className="flex flex-col gap-2">
                <div className="text-slate-400 font-bold tracking-wider uppercase text-[10px]">Select Route</div>
                <div className="flex flex-col gap-1.5">
                  <CustomDropdown
                    value={params.origin}
                    onChange={val => setParams({ ...params, origin: val })}
                    options={nodeIds.map(id => ({ id, label: NODE_MAP[id]?.label ?? id.replace('_Hub', '') }))}
                  />
                  <div className="text-center text-slate-500 text-[10px] py-0.5">↓</div>
                  <CustomDropdown
                    value={params.destination}
                    onChange={val => setParams({ ...params, destination: val })}
                    options={nodeIds.map(id => ({ id, label: NODE_MAP[id]?.label ?? id.replace('_Hub', '') }))}
                  />
                </div>
              </div>
            )}

            <div className="w-full h-px" style={{ background: 'rgba(99,102,241,0.2)' }} />

            <div className="flex flex-col gap-1">
              <div className="text-slate-400 font-bold tracking-wider uppercase text-[10px]">Active Route Detail</div>
              <div className="font-bold text-[13px]" style={{ color: '#e2e8f0' }}>
                {route.origin?.replace(/_/g, ' ')} → {route.destination?.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="flex gap-3 font-medium" style={{ color: '#94a3b8' }}>
              <span>Time: {route.total_time_hrs} hrs</span>
              <span>Dist: {route.total_distance_km} km</span>
            </div>
            <div className="font-semibold" style={{ color: '#94a3b8' }}>
              Cost: ₹{(route.total_cost_inr ?? 0).toLocaleString('en-IN')}
            </div>
            {route.rerouted && (
              <div
                className="font-bold flex items-center gap-1 mt-1 px-2 py-1 rounded text-xs"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle size={12} className="inline mr-1" /> Rerouted Path ({route.hops} hops)
              </div>
            )}

            {lineMode === 'road' && routeVariants.length > 1 && (
              <div className="mt-2 space-y-2 border-t border-indigo-500/20 pt-2">
                <div className="text-slate-400 font-bold tracking-wider uppercase text-[10px]">Driving options</div>
                <div className="flex flex-wrap gap-1">
                  {routeVariants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                        selectedVariantId === v.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                {selectedVariant && bestVariant && (
                  <div className="rounded-md bg-slate-900/80 p-2 text-[10px] leading-relaxed text-slate-300">
                    {selectedVariant.duration_sec > 0 && (
                      <div className="mb-1 font-mono text-slate-400">
                        ~{Math.round(selectedVariant.duration_sec / 60)} min drive ·{' '}
                        {(selectedVariant.distance_m / 1000).toFixed(1)} km
                      </div>
                    )}
                    {buildVariantExplanation(selectedVariant, bestVariant)}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {lineMode === 'fallback' && lineMessage && route?.path?.length >= 2 && (
          <div
            className="absolute bottom-2 left-14 right-2 sm:right-auto max-w-md text-[10px] font-semibold px-2.5 py-1.5 rounded-lg z-10"
            style={{
              background: 'rgba(2,8,23,0.88)',
              border: '1px solid rgba(251,191,36,0.35)',
              color: '#fde68a',
            }}
          >
            {lineMessage}
          </div>
        )}
        {lineMode === 'road' && (
          <div
            className="absolute bottom-2 left-14 text-[9px] font-bold px-2 py-0.5 rounded z-10 uppercase tracking-wider"
            style={{
              background: 'rgba(2,8,23,0.75)',
              border: '1px solid rgba(45,212,191,0.35)',
              color: '#5eead4',
            }}
          >
            Road routing · OpenRouteService
          </div>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, border: '1px solid rgba(255,255,255,0.2)' }} />
      <span>{label}</span>
    </div>
  )
}
