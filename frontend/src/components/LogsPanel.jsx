import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Terminal, Database } from 'lucide-react'

const TYPE_STYLES = {
  disruption: { dot: 'bg-danger',  badge: 'bg-red-100 text-danger border border-red-200' },
  reroute:    { dot: 'bg-warning', badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  savings:    { dot: 'bg-success', badge: 'bg-green-100 text-green-700 border border-green-200' },
  info:       { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border border-slate-200' },
  model:      { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
}

export default function LogsPanel({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="glass p-5 flex flex-col h-full bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-800" />
          <span className="text-sm font-bold text-slate-800">Event Stream Log</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{logs.length} events logged</span>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      {/* Log stream */}
      <div className="flex flex-col gap-[2px] max-h-56 overflow-y-auto pr-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const s = TYPE_STYLES[log.type] ?? TYPE_STYLES.info
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                className="py-1.5 flex items-start gap-4 group hover:bg-slate-50 px-2 rounded -mx-2 transition-colors"
              >
                {/* Visual timeline */}
                <div className="flex-shrink-0 flex flex-col items-center mt-2 w-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {i < logs.length - 1 && (
                    <div className="w-px h-6 bg-slate-200 mt-1" />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-[1px] rounded font-bold uppercase tracking-wider ${s.badge}`}>
                      {log.type}
                    </span>
                    <span className="text-[13px] text-slate-700 font-medium">{log.message}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{log.time}</span>
                    {log.value && (
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 rounded">{log.value}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pt-3 mt-auto border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        <Database size={12} />
        <span>Live connection active</span>
      </div>
    </div>
  )
}
