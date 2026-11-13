import React from "react";
import { formatINR } from "../data/mockEngine";
import { ShieldCheck, AlertOctagon, Timer, Network, ArrowUpRight, ChevronRight, Activity, ArrowRight } from "lucide-react";

export default function OverviewView({ txns, fraudAlerts, graphSummary, onSelectTxn, onNavigateToTab }) {
  const totalVolume = txns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const fraudAmount = fraudAlerts.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cycleCount = graphSummary?.circular_cycles_count || 0;

  // Rail percentages
  const upiCount = txns.filter(t => t.rail?.includes("UPI")).length || 1;
  const impsCount = txns.filter(t => t.rail === "IMPS").length;
  const rtgsCount = txns.filter(t => t.rail === "RTGS").length;
  const totalCount = txns.length || 1;

  const upiPct = Math.round((upiCount / totalCount) * 100);
  const impsPct = Math.round((impsCount / totalCount) * 100);
  const rtgsPct = Math.round((rtgsCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Clean Minimalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="card-clean p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Processed Volume</span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
              Live Ingest
            </span>
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight mt-2 font-mono">
            {formatINR(totalVolume)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>{txns.length} transactions</span>
            <span className="text-slate-500">Across 6 Banks</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card-clean p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Threats Intercepted</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight mt-2 font-mono">
            {formatINR(fraudAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-400 font-medium">{fraudAlerts.length} flags contained</span>
            <span className="text-slate-500">Auto-Lien Active</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card-clean p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Golden Hour Response</span>
            <Timer className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight mt-2 font-mono flex items-baseline gap-1.5">
            <span>14s</span>
            <span className="text-xs font-normal text-slate-400 font-sans">avg inter-bank</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>I4C 1930 Target: &lt; 60s</span>
            <span className="text-emerald-400">98.4% On Time</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card-clean p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Laundering Cycles</span>
            <Network className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-semibold text-white tracking-tight mt-2 font-mono flex items-baseline gap-1.5">
            <span>{cycleCount}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">active rings</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Graph Cycle A-B-C-A</span>
            <span className="text-purple-400">Layering Tracked</span>
          </div>
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Alerts Ledger (8 cols) */}
        <div className="lg:col-span-8 card-clean p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white m-0">
                  Priority Threat Queue
                </h3>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Transactions requiring compliance verification or lien action under RBI / PMLA guidelines.
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab("stream")}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Transactions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-800/60 mt-2">
              {fraudAlerts.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  <p>No active threats in the priority queue.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Use the <strong>Threat Lab</strong> tab to simulate real Indian fraud vectors.
                  </p>
                </div>
              ) : (
                fraudAlerts.slice(0, 5).map((alert, idx) => (
                  <div
                    key={`${alert.txn_id}-${idx}`}
                    onClick={() => onSelectTxn(alert)}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          alert.risk_score >= 80
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {alert.risk_score}/100
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {alert.sender_name} ➔ {alert.receiver_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500">{alert.sender_vpa}</span>
                          <span>•</span>
                          <span className="text-slate-400">{alert.rail}</span>
                          <span>•</span>
                          <span className="text-slate-500">{alert.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                      <div>
                        <div className="text-xs font-semibold text-white font-mono">
                          {formatINR(alert.amount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour12: false }) : ""}
                        </div>
                      </div>
                      <button className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-300 transition-colors">
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer banner */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Real-time screening active on UPI Switch</span>
            </span>
            <span className="text-[11px] text-slate-500">
              NPCI Master Directions (July 2024)
            </span>
          </div>
        </div>

        {/* Right: Payment Rails & Risk Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Rails breakdown */}
          <div className="card-clean p-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Payment Rail Distribution
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>UPI P2P & P2M</span>
                  <span className="font-mono text-slate-400">{upiPct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${upiPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>IMPS Immediate</span>
                  <span className="font-mono text-slate-400">{impsPct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${impsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>RTGS Real-Time</span>
                  <span className="font-mono text-slate-400">{rtgsPct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${rtgsPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Threat Lab Promo Card */}
          <div className="card-clean p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
              Indian Threat Simulation Lab
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Test detection accuracy against Digital Arrest extortion, Section 139A sub-₹50k smurfing, and circular layering loops.
            </p>
            <button
              onClick={() => onNavigateToTab("simulator")}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Threat Testing Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
