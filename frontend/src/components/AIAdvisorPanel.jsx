import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, RefreshCw, Sparkles, Shield, AlertTriangle, Zap } from 'lucide-react'

const BASE = 'http://127.0.0.1:8000'

export default function AIAdvisorPanel({ params, isMock }) {
  const [advisory, setAdvisory] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(false)

  const fetchAdvisory = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      if (isMock) {
        // Fallback mock data when backend is down
        await new Promise(r => setTimeout(r, 1200))
        setAdvisory({
          available: true,
          summary: "This is a simulated AI advisory (mock mode). The current route shows standard operating conditions, but risk probabilities are fluctuating. Continuous monitoring is advised.",
          actions: [
            "Monitor live tracking feeds",
            "Prepare contingency reroute plans",
            "Verify weather checkpoints"
          ],
          insurance_tip: "Dynamic routing can reduce premium costs by up to 15%.",
          model: "mock-advisor-local",
          cached: false
        })
        return
      }

      const qs = new URLSearchParams({
        origin:      params?.origin      || 'Pune_Hub',
        destination: params?.destination || 'Mumbai_Hub',
        cargo_value: params?.cargoValue  || 70000,
        monsoon:     params?.monsoon     ?? true,
        perishable:  params?.perishable  ?? true,
      })
      const res = await fetch(`${BASE}/ai-advisor?${qs}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error('non-200')
      const data = await res.json()
      setAdvisory(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [params])

  const isAvailable = advisory?.available === true
  const summary     = advisory?.summary || ''
  const actions     = advisory?.actions || []
  const tip         = advisory?.insurance_tip || ''
  const model       = advisory?.model || ''
  const cached      = advisory?.cached === true

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-5 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50">
            <Brain size={18} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">AI Risk Advisor</span>
            <span className="ml-2 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
              Powered by Google Gemini
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Cached badge */}
          {cached && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Zap size={9} />
              Cached
            </span>
          )}
          <button
            onClick={fetchAdvisory}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded
                       border border-border text-slate-600 hover:bg-slate-50
                       disabled:opacity-50 transition-all"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing...' : advisory ? 'Re-analyse' : 'Analyse'}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Idle — not yet triggered */}
        {!advisory && !loading && !error && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-3 text-center"
          >
            <div className="p-3 rounded-full bg-indigo-50">
              <Brain size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">AI analysis on demand</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click <span className="font-bold text-indigo-500">Analyse</span> to generate a risk advisory.
                Results are cached for 60 s.
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-3"
          >
            <Sparkles size={24} className="text-indigo-400 animate-pulse" />
            <span className="text-sm text-slate-500 font-medium">Gemini is analysing your shipment...</span>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-2 text-center"
          >
            <AlertTriangle size={20} className="text-amber-500" />
            <span className="text-sm text-slate-500">
              {isMock 
                ? "Backend is offline. Running in mock mode." 
                : "Failed to connect to the backend server. Please ensure it is running."}
            </span>
          </motion.div>
        )}

        {/* Result */}
        {advisory && !loading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Unavailable message */}
            {!isAvailable && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="shrink-0" />
                {summary}
              </div>
            )}

            {/* Summary */}
            {isAvailable && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Risk Assessment
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{summary}</p>
              </div>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Recommended Actions
                </div>
                <div className="space-y-1.5">
                  {actions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-[12px] text-slate-600 font-medium bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                    >
                      <span className="text-indigo-500 font-bold mt-px">{i + 1}.</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance Tip */}
            {tip && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} className="text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                    Insurance Optimisation
                  </span>
                </div>
                <p className="text-[12px] text-green-800 font-medium leading-relaxed">{tip}</p>
              </div>
            )}

            {/* Model tag */}
            {model && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <Sparkles size={10} className="text-indigo-400" />
                <span className="text-[10px] text-slate-400 font-medium">
                  Model: {model} · Google Gemini API
                  {cached && <span className="ml-1 text-emerald-500">· served from cache</span>}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
