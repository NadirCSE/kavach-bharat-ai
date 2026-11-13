import React, { useState } from "react";
import { formatINR } from "../data/mockEngine";
import { Search, Filter, ShieldAlert, ArrowRight, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TransactionStream({ txns, onSelectTxn }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTxns = txns.filter(t => {
    // Search
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

    // Filter tabs
    if (filter === "fraud") return t.risk_score >= 60;
    if (filter === "critical") return t.risk_score >= 80;
    if (filter === "upi") return t.rail?.includes("UPI");
    if (filter === "high_val") return Number(t.amount) >= 100000;
    return true;
  });

  const getRailBadge = (rail) => {
    if (rail?.includes("UPI")) {
      return "bg-purple-900/40 text-purple-300 border-purple-700/50";
    }
    if (rail === "RTGS") {
      return "bg-amber-900/40 text-amber-300 border-amber-700/50";
    }
    if (rail === "IMPS") {
      return "bg-blue-900/40 text-blue-300 border-blue-700/50";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const getRiskBadge = (score, level) => {
    if (score >= 80) {
      return "bg-red-950/60 text-red-400 border-red-800/80";
    }
    if (score >= 60) {
      return "bg-orange-950/60 text-orange-400 border-orange-800/80";
    }
    if (score >= 35) {
      return "bg-amber-950/60 text-amber-400 border-amber-800/80";
    }
    return "bg-emerald-950/60 text-emerald-400 border-emerald-800/80";
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col h-full">
      {/* Stream Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <h2 className="text-sm font-bold text-white m-0 tracking-wide">
            LIVE TRANSACTION INGESTION & RISK SCORING
          </h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {filteredTxns.length} showing
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search VPA, Name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 sm:w-48"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "all" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("fraud")}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                filter === "fraud" ? "bg-red-600 text-white font-medium" : "text-slate-400 hover:text-red-400"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Suspicious</span>
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "critical" ? "bg-red-700 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Critical (&gt;80)
            </button>
            <button
              onClick={() => setFilter("upi")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "upi" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              UPI Only
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px] border border-slate-900 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 z-10 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Txn ID / Rail</th>
              <th className="py-2.5 px-3">Sender Details</th>
              <th className="py-2.5 px-3">Beneficiary Details</th>
              <th className="py-2.5 px-3">Amount (INR)</th>
              <th className="py-2.5 px-3">AI Risk Score</th>
              <th className="py-2.5 px-3">Mandated Action</th>
              <th className="py-2.5 px-3 text-right">Investigate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-300">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500">
                  No transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredTxns.map((t) => {
                const isCritical = t.risk_score >= 80;
                const isHigh = t.risk_score >= 60;

                return (
                  <tr
                    key={t.txn_id}
                    className={`transition-colors cursor-pointer ${
                      isCritical
                        ? "bg-red-950/20 hover:bg-red-950/30"
                        : isHigh
                        ? "bg-orange-950/15 hover:bg-orange-950/25"
                        : "hover:bg-slate-900/60"
                    }`}
                    onClick={() => onSelectTxn(t)}
                  >
                    {/* Txn ID & Rail */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono text-white font-medium">
                        {(t.txn_id || "").slice(-12)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-semibold ${getRailBadge(t.rail)}`}>
                          {t.rail}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {t.timestamp ? new Date(t.timestamp).toLocaleTimeString("en-IN", { hour12: false }) : ""}
                        </span>
                      </div>
                    </td>

                    {/* Sender */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white truncate max-w-[130px]">
                        {t.sender_name}
                      </div>
                      <div className="text-[11px] text-indigo-400/90 font-mono truncate max-w-[130px]">
                        {t.sender_vpa}
                      </div>
                      <div className="text-[10px] text-slate-500">{t.sender_bank}</div>
                    </td>

                    {/* Beneficiary */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white truncate max-w-[130px]">
                        {t.receiver_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">
                        {t.receiver_vpa}
                      </div>
                      <div className="text-[10px] text-slate-500">{t.receiver_bank}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className={`font-mono font-bold ${isCritical ? "text-red-400" : isHigh ? "text-orange-400" : "text-white"}`}>
                        {formatINR(t.amount)}
                      </div>
                      {t.remarks && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={t.remarks}>
                          {t.remarks}
                        </div>
                      )}
                    </td>

                    {/* AI Risk Score */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${getRiskBadge(t.risk_score, t.risk_level)}`}>
                          {t.risk_score}/100
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {t.risk_level}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3">
                      <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                        {isCritical ? (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Auto-Lien 1930
                          </span>
                        ) : isHigh ? (
                          <span className="text-orange-400 font-medium">Hold & Verify</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Authorized
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTxn(t);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>XAI</span>
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
