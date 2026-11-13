import React, { useState } from "react";
import { formatINR, exportTransactionsToCSV } from "../data/mockEngine";
import { Search, CheckCircle2, ShieldAlert, Download, FileSpreadsheet } from "lucide-react";

export default function TransactionStream({ txns, onSelectTxn }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTxns = txns.filter((t) => {
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
    return true;
  });

  return (
    <div className="surface-card overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, VPA, remarks, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs">
            {[
              { id: "all", label: `All (${txns.length})` },
              { id: "fraud", label: "Flagged" },
              { id: "critical", label: "Critical (≥80)" },
              { id: "upi", label: "UPI" }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filter === pill.id
                    ? "bg-white text-zinc-900 font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportTransactionsToCSV(filteredTxns)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
            title="Download CSV ledger of transactions"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[640px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 sticky top-0 z-10 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
            <tr>
              <th className="py-3 px-4">Transaction</th>
              <th className="py-3 px-4">Rail / City</th>
              <th className="py-3 px-4">Sender</th>
              <th className="py-3 px-4">Receiver</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Risk</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-zinc-400">
                  No transactions match your current filter.
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
                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-zinc-900 font-medium">
                        {(t.txn_id || "").slice(-12)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString("en-IN", { hour12: false }) : ""}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                        {t.rail}
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">{t.city}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{t.sender_name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[140px]">
                        {t.sender_vpa}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{t.receiver_name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[140px]">
                        {t.receiver_vpa}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-semibold text-zinc-900 tabular-nums">
                        {formatINR(t.amount)}
                      </div>
                      {t.remarks && (
                        <div className="text-[10px] text-zinc-400 truncate max-w-[140px]" title={t.remarks}>
                          {t.remarks}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border tabular-nums ${
                          isCritical
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isHigh
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {t.risk_score}/100
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {isCritical ? (
                        <span className="text-[11px] font-medium text-rose-700 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Auto-Lien 1930
                        </span>
                      ) : isHigh ? (
                        <span className="text-[11px] font-medium text-amber-700">Hold & Verify</span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cleared
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTxn(t);
                        }}
                        className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-900 hover:text-white text-zinc-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Explain
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
