import React from "react";
import { formatINR } from "../data/mockEngine";
import { ChevronRight, ArrowUpRight } from "lucide-react";

export default function OverviewView({
  txns,
  fraudAlerts,
  graphSummary,
  accountRisks = [],
  frozenAccounts = new Set(),
  onSelectTxn,
  onNavigateToTab
}) {
  const totalVolume = txns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const fraudAmount = fraudAlerts.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cycleCount = graphSummary?.circular_cycles_count || 0;
  const flagRate = txns.length > 0 ? ((fraudAlerts.length / txns.length) * 100).toFixed(1) : "0.0";

  // Build minimal SVG spark/trend from last 18 transactions
  const recentSlice = [...txns].slice(0, 18).reverse();
  const chartW = 540;
  const chartH = 120;
  const pad = 12;

  const points = recentSlice.map((t, i) => {
    const x = pad + (i / Math.max(recentSlice.length - 1, 1)) * (chartW - pad * 2);
    const y = chartH - pad - ((t.risk_score || 0) / 100) * (chartH - pad * 2);
    return { x, y, score: t.risk_score || 0, txn: t };
  });

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
      : "";

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${chartH - pad} L ${points[0].x.toFixed(1)} ${chartH - pad} Z`
      : "";

  // Rail distribution
  const totalCount = txns.length || 1;
  const upiPct = Math.round((txns.filter((t) => t.rail?.includes("UPI")).length / totalCount) * 100);
  const impsPct = Math.round((txns.filter((t) => t.rail === "IMPS").length / totalCount) * 100);
  const rtgsPct = Math.round((txns.filter((t) => t.rail === "RTGS").length / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Minimalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface-card p-5">
          <div className="text-xs font-medium text-zinc-500">Monitored Volume</div>
          <div className="text-2xl font-semibold text-zinc-900 tracking-tight mt-2 tabular-nums font-mono">
            {formatINR(totalVolume)}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">{txns.length} transactions processed</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Flagged Exposure</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {flagRate}% rate
            </span>
          </div>
          <div className="text-2xl font-semibold text-zinc-900 tracking-tight mt-2 tabular-nums font-mono">
            {formatINR(fraudAmount)}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">{fraudAlerts.length} suspicious alerts</div>
        </div>

        <div className="surface-card p-5">
          <div className="text-xs font-medium text-zinc-500">AML Topology Rings</div>
          <div className="text-2xl font-semibold text-zinc-900 tracking-tight mt-2 tabular-nums font-mono">
            {cycleCount}
            <span className="text-xs font-sans font-normal text-zinc-500 ml-2">
              {graphSummary?.mule_hubs_count || 0} mule hubs
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">Circular & fan-in graph checks</div>
        </div>

        <div className="surface-card p-5">
          <div className="text-xs font-medium text-zinc-500">Golden Hour Response</div>
          <div className="text-2xl font-semibold text-zinc-900 tracking-tight mt-2 tabular-nums font-mono">
            14s
            <span className="text-xs font-sans font-normal text-emerald-700 ml-2">Avg. SLA</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">I4C 1930 target under 60s</div>
        </div>
      </div>

      {/* Middle Row: Anomaly Trend + Rail / Account Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk & Anomaly Signal Chart */}
        <div className="lg:col-span-8 surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 m-0">Real-Time Risk Signal Timeline</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5">
                Transaction risk scores (0–100) across the latest 18 events. Threshold line at 60.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-900" /> Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" /> Flagged (≥60)
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36 overflow-visible">
              <defs>
                <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18181b" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#18181b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Threshold line at 60 */}
              <line
                x1={pad}
                x2={chartW - pad}
                y1={chartH - pad - 0.6 * (chartH - pad * 2)}
                y2={chartH - pad - 0.6 * (chartH - pad * 2)}
                stroke="#e4e4e7"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {areaPath && <path d={areaPath} fill="url(#riskFill)" />}
              {linePath && (
                <path d={linePath} fill="none" stroke="#18181b" strokeWidth="1.75" strokeLinejoin="round" />
              )}

              {points.map((p, idx) => {
                const flagged = p.score >= 60;
                return (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={flagged ? 4 : 2.5}
                    fill={flagged ? "#e11d48" : "#18181b"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer"
                    onClick={() => onSelectTxn(p.txn)}
                  >
                    <title>{`${p.txn.sender_name}: Risk ${p.score}/100 (${formatINR(p.txn.amount)})`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Payment Rails & Highest Risk Account */}
        <div className="lg:col-span-4 surface-card p-5 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Channel Mix</h2>
            <div className="space-y-3 text-xs">
              {[
                { label: "UPI P2P & Collect", pct: upiPct, color: "bg-zinc-900" },
                { label: "IMPS Immediate", pct: impsPct, color: "bg-zinc-500" },
                { label: "RTGS High-Value", pct: rtgsPct, color: "bg-amber-500" }
              ].map((rail) => (
                <div key={rail.label}>
                  <div className="flex justify-between text-zinc-600 mb-1">
                    <span>{rail.label}</span>
                    <span className="font-mono text-zinc-900 tabular-nums">{rail.pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`${rail.color} h-1.5 rounded-full`} style={{ width: `${rail.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-900">Run Fraud Simulation</div>
              <div className="text-[11px] text-zinc-500">Inject smurfing, circular loops & traps</div>
            </div>
            <button
              onClick={() => onNavigateToTab("simulator")}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Threat Lab</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Priority Queue (8 cols) + Account Risk Watchlist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 surface-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 m-0">Priority Alert Queue</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5">
                Click any alert to open the Explainable AI drawer
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("stream")}
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>All transactions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {fraudAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No active fraud alerts. Open <strong className="text-zinc-800">Threat Lab</strong> to inject a test scenario.
              </div>
            ) : (
              fraudAlerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={`${alert.txn_id}-${idx}`}
                  onClick={() => onSelectTxn(alert)}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 tabular-nums ${
                        alert.risk_score >= 80
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {alert.risk_score}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-900 truncate">
                        {alert.sender_name} → {alert.receiver_name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {alert.explainability?.factors?.[0]?.factor || alert.rail} • {alert.city}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-zinc-900 tabular-nums">
                      {formatINR(alert.amount)}
                    </div>
                    <div className="text-[11px] text-zinc-400">{alert.rail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account-Level Risk Watchlist */}
        <div className="lg:col-span-4 surface-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 m-0">Account Risk Watchlist</h2>
            <p className="text-xs text-zinc-500 m-0 mt-0.5">Highest-risk accounts by behavioral score</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {accountRisks.slice(0, 5).map((acc) => {
              const isFrozen = frozenAccounts.has(acc.account_id) || acc.max_risk_score >= 80;
              return (
                <div key={acc.account_id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-900 truncate flex items-center gap-1.5">
                      <span>{acc.name}</span>
                      {isFrozen && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 font-semibold flex items-center gap-0.5">
                          🔒 FROZEN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">{acc.vpa || acc.account_id}</div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border tabular-nums shrink-0 ${
                      isFrozen || acc.max_risk_score >= 80
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : acc.max_risk_score >= 60
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200"
                    }`}
                  >
                    {acc.max_risk_score}/100
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
