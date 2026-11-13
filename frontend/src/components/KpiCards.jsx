import React from "react";
import { formatINR } from "../data/mockEngine";
import { IndianRupee, ShieldCheck, Timer, AlertOctagon, Network } from "lucide-react";

export default function KpiCards({ txns, fraudAlerts, graphSummary }) {
  const totalVolume = txns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const fraudPrevented = fraudAlerts.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const criticalCount = fraudAlerts.filter(t => t.risk_level === "CRITICAL").length;
  const cycleCount = graphSummary?.circular_cycles_count || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Metric 1: Total Volume */}
      <div className="glass-card p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Processed Volume</span>
          <IndianRupee className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {formatINR(totalVolume)}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
          <span className="text-indigo-400 font-medium">{txns.length} txns</span>
          <span>across UPI/IMPS/RTGS</span>
        </div>
      </div>

      {/* Metric 2: Fraud Prevented */}
      <div className="glass-card p-3.5 rounded-xl border border-emerald-950/40 bg-gradient-to-br from-emerald-950/20 to-slate-900/50 hover:border-emerald-800/40 transition-all">
        <div className="flex items-center justify-between text-emerald-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Fraud Blocked</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-emerald-400 tracking-tight">
          {formatINR(fraudPrevented)}
        </div>
        <div className="text-[11px] text-emerald-500/80 mt-0.5 flex items-center gap-1 font-medium">
          <span>{fraudAlerts.length} high-risk flags stopped</span>
        </div>
      </div>

      {/* Metric 3: Golden Hour Response */}
      <div className="glass-card p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Golden Hour Lien</span>
          <Timer className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight flex items-baseline gap-1">
          <span>14s</span>
          <span className="text-xs font-normal text-emerald-400 font-mono">avg response</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          <span>I4C 1930 Target: &lt; 60 secs</span>
        </div>
      </div>

      {/* Metric 4: Laundering Cycles */}
      <div className="glass-card p-3.5 rounded-xl border border-rose-950/40 bg-gradient-to-br from-rose-950/20 to-slate-900/50 hover:border-rose-800/40 transition-all">
        <div className="flex items-center justify-between text-rose-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Laundering Loops</span>
          <Network className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-xl font-bold text-rose-400 tracking-tight flex items-baseline gap-2">
          <span>{cycleCount}</span>
          <span className="text-xs font-medium text-rose-300/80">Active Rings</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          <span>Circular Hawala / Smurfing</span>
        </div>
      </div>

      {/* Metric 5: Critical Alerts */}
      <div className="glass-card p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Critical Threats</span>
          <AlertOctagon className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-xl font-bold text-red-400 tracking-tight flex items-baseline gap-2">
          <span>{criticalCount}</span>
          <span className="text-xs font-medium text-red-300/80">Lien Marked</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          <span>Score &gt; 80/100 threshold</span>
        </div>
      </div>
    </div>
  );
}
