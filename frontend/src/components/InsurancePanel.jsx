import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Shield, ArrowRight, DollarSign } from 'lucide-react'

export default function InsurancePanel({ insurance, disrupted }) {
  if (!insurance) return null

  const {
    cargo_value, disruption_probability, base_premium,
    before_cost, after_cost, savings, savings_pct,
    weather_multiplier, perishable_multiplier,
  } = insurance

  const riskPct = Math.round((disruption_probability ?? 0) * 100)
  const isHighRisk = riskPct > 35

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass p-5 flex flex-col h-full bg-white relative overflow-hidden"
    >
      {/* Top Header Block */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-slate-800" />
          <span className="font-bold text-slate-800 text-lg">Insurance Premium</span>
        </div>
        {isHighRisk && (
          <span className="text-[10px] font-bold bg-red-100 text-danger border border-red-200 px-2 py-1 rounded">
            ELEVATED RISK ({riskPct}%)
          </span>
        )}
      </div>

      {/* Breakdown List */}
      <div className="space-y-4 mb-6 flex-1">
        
        <DataRow label="Base Cargo Value" value={`₹${cargo_value.toLocaleString('en-IN')}`} strong />
        
        <div className="py-2 space-y-2">
          <DataRow label="Probability Impact" value={`${riskPct}%`} subtext="Isolation Forest Result" />
          <DataRow label="Calculated Base Premium" value={`₹${(base_premium ?? 0).toLocaleString('en-IN')}`} />
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Applied Actuarial Multipliers</div>
          <DataRow label="Weather Factor" value={`x${weather_multiplier}`} highlight={weather_multiplier > 1} />
          <DataRow label="Perishable Cargo" value={`x${perishable_multiplier}`} highlight={perishable_multiplier > 1} />
        </div>
      </div>

      {/* Quote Comparison (Before / After Reroute) */}
      <div className="flex items-center justify-between bg-slate-100 p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-semibold mb-1">Standard Route</span>
          <span className={`text-xl font-black ${disrupted ? 'text-danger line-through opacity-70' : 'text-slate-800'}`}>
            ₹{(before_cost ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <ArrowRight className="text-slate-400" />
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-500 font-semibold mb-1">Hedged Route</span>
          <span className="text-2xl font-black text-slate-900">
            ₹{(after_cost ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Savings Summary Line */}
      {savings > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-300">
          <div className="flex items-center gap-1.5 text-success">
            <DollarSign size={16} />
            <span className="text-sm font-bold">Dynamic Savings Evaluated</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-lg font-black text-success">₹{(savings ?? 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">{savings_pct}% Reduction</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function DataRow({ label, value, strong, subtext, highlight }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex flex-col">
        <span className={`${strong ? 'font-semibold text-slate-800' : 'text-slate-500 font-medium'}`}>
          {label}
        </span>
        {subtext && <span className="text-[10px] text-slate-400 mt-0.5">{subtext}</span>}
      </div>
      <span className={`${strong ? 'font-bold text-lg' : 'font-semibold'} ${highlight ? 'text-warning' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  )
}
