import { useState, useEffect } from 'react'
import { fetchNews } from '../services/api'
import { Radio } from 'lucide-react'

export default function NewsPanel() {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch news every 60 seconds to match the weather polling
  useEffect(() => {
    let mounted = true

    const loadNews = async () => {
      setLoading(true)
      const res = await fetchNews()
      if (mounted && res.data && res.data.briefs) {
        setBriefs(res.data.briefs)
      }
      if (mounted) setLoading(false)
    }

    loadNews()
    const interval = setInterval(loadNews, 60000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Helper to parse basic markdown bold (**text**)
  const parseBold = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-slate-800">$1</span>')
  }

  return (
    <div className="glass p-5 flex flex-col h-full overflow-hidden relative">
      <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50">
            <Radio size={18} className="text-amber-600 animate-pulse" />
          </div>
          <span className="text-sm font-bold text-slate-800">
            Live Route Intelligence
          </span>
        </div>
        {loading && (
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">
            Syncing...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {loading && briefs.length === 0 ? (
          <div className="text-sm text-slate-400 italic text-center py-4">Waiting for sensor telemetry...</div>
        ) : briefs.length > 0 ? (
          briefs.map((brief, idx) => (
            <div 
              key={idx} 
              className="bg-slate-50 rounded-lg border border-slate-100 p-3 text-[13px] text-slate-600 leading-relaxed shadow-sm hover:border-amber-200 transition-colors"
              dangerouslySetInnerHTML={{ __html: parseBold(brief) }}
            />
          ))
        ) : (
          <div className="text-sm text-slate-400 italic text-center py-4">No intelligence alerts at this time.</div>
        )}
      </div>
    </div>
  )
}
