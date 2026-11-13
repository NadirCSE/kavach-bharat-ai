import React from "react";
import { formatINR } from "../data/mockEngine";
import { FileText } from "lucide-react";

export default function ComplianceView({ fraudAlerts, onOpenStrModal }) {
  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
            PMLA SECTION 12 • FIU-IND
          </span>
          <h2 className="text-sm font-semibold text-zinc-900 mt-2 mb-0">
            Suspicious Transaction Reports (STR) Queue
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 m-0">
            Automated Form PMLA-12 payloads compiled from flagged transactions.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-right">
          <div className="text-[10px] uppercase font-semibold text-zinc-400">STRs Ready</div>
          <div className="text-xl font-mono font-semibold text-zinc-900 tabular-nums">{fraudAlerts.length}</div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Filing Ref</th>
                <th className="py-3 px-4">Originator</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Grounds</th>
                <th className="py-3 px-4 text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fraudAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-zinc-400">
                    No suspicious transactions currently queued for STR filing.
                  </td>
                </tr>
              ) : (
                fraudAlerts.map((alert) => (
                  <tr key={alert.txn_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-900 font-medium whitespace-nowrap">
                      STR-{(alert.txn_id || "").slice(-10)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{alert.sender_name}</div>
                      <div className="text-[11px] font-mono text-zinc-500">{alert.sender_vpa}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{alert.receiver_name}</div>
                      <div className="text-[11px] font-mono text-zinc-500">{alert.receiver_vpa}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900 tabular-nums">
                      {formatINR(alert.amount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">
                      {alert.explainability?.factors?.[0]?.factor || "Behavioral Anomaly"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenStrModal(alert)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View STR</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
