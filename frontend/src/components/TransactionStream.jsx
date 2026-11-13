import React, { useState } from "react";
import { formatINR } from "../data/mockEngine";
import { Search, Filter, ArrowRight, Eye, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";

export default function TransactionStream({ txns, onSelectTxn }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTxns = txns.filter(t => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        t.txn_id?.toLowerCase().includes(q) ||
        t.sender_name?.toLowerCase().includes(q) ||
        t.receiver_name?.toLowerCase().includes(q) ||
        t.sender_vpa?.toLowerCase().includes(q) ||
        t.receiver_vpa?.toLowerCase().includes(q) ||
        t.remarks?.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filter === "fraud") return t.risk_score >= 60;
    if (filter === "critical") return t.risk_score >= 80;
    if (filter === "upi") return t.rail?.includes("UPI");
    if (filter === "high_val") return Number(t.amount) >= 100000;
    return true;
  });

  return (
    <div className="card-clean overflow-hidden flex flex-col h-full">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white m-0">
            Real-Time Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Streaming UPI, IMPS, and RTGS payment events with sub-50ms risk scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by VPA, Name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filter === "all" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({txns.length})
            </button>
            <button
              onClick={() => setFilter("fraud")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filter === "fraud" ? "bg-slate-800 text-amber-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filter === "critical" ? "bg-slate-800 text-red-400 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Critical (&gt;80)
            </button>
            <button
              onClick={() => setFilter("upi")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filter === "upi" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              UPI Only
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[620px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/80 sticky top-0 z-10 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Transaction ID</th>
              <th className="py-2.5 px-4">Rail & City</th>
              <th className="py-2.5 px-4">Originator (Sender)</th>
              <th className="py-2.5 px-4">Beneficiary</th>
              <th className="py-2.5 px-4">Amount</th>
              <th className="py-2.5 px-4">Risk Index</th>
              <th className="py-2.5 px-4">Mandate</th>
              <th className="py-2.5 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-500">
                  No transactions match the selected filter.
                </td>
              </tr>
            ) : (
              filteredTxns.map((t) => {
                const isCritical = t.risk_score >= 80;
                const isHigh = t.risk_score >= 60;

                return (
                  <tr
                    key={t.txn_id}
                    onClick={() => onSelectTxn(t)}
                    className="table-row-hover transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-white font-medium">
                        {(t.txn_id || "").slice(-12)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString("en-IN", { hour12: false }) : ""}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                        {t.rail}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {t.city}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-medium text-white">{t.sender_name}</div>
                      <div className="text-[11px] text-indigo-400 font-mono truncate max-w-[140px]">{t.sender_vpa}</div>
                      <div className="text-[10px] text-slate-500">{t.sender_bank}</div>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-medium text-white">{t.receiver_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{t.receiver_vpa}</div>
                      <div className="text-[10px] text-slate-500">{t.receiver_bank}</div>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-white">
                        {formatINR(t.amount)}
                      </div>
                      {t.remarks && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={t.remarks}>
                          {t.remarks}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isCritical
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : isHigh
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {t.risk_score}/100
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {t.risk_level}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      {isCritical ? (
                        <span className="text-[11px] font-medium text-red-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Auto-Lien 1930
                        </span>
                      ) : isHigh ? (
                        <span className="text-[11px] font-medium text-amber-400">
                          Hold & Verify
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Authorized
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTxn(t);
                        }}
                        className="py-1 px-2.5 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
