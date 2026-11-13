import React from "react";
import { formatINR } from "../data/mockEngine";
import { FileCheck, Shield, Download, FileText, ExternalLink, CheckCircle2 } from "lucide-react";

export default function ComplianceView({ fraudAlerts, onSelectTxn, onOpenStrModal }) {
  return (
    <div className="space-y-6">
      {/* Statutory Header */}
      <div className="card-clean p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              PMLA SECTION 12
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Ministry of Finance, Government of India
            </span>
          </div>
          <h2 className="text-base font-semibold text-white m-0">
            Financial Intelligence Unit (FIU-IND) Compliance Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Automated compilation and generation of Suspicious Transaction Reports (STRs) and I4C 1930 "Golden Hour" inter-bank debit liens.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center min-w-[110px]">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ready for NCRP</span>
            <span className="text-lg font-bold text-white font-mono">{fraudAlerts.length}</span>
            <span className="text-[10px] text-emerald-400 block">STRs Compiled</span>
          </div>
        </div>
      </div>

      {/* STR Reports Table */}
      <div className="card-clean overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider m-0">
            Mandatory Regulatory Filings Queue (Form PMLA-12)
          </h3>
          <span className="text-xs text-slate-400">
            Automated batching enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Filing ID / Timestamp</th>
                <th className="py-3 px-4">Originator KYC</th>
                <th className="py-3 px-4">Beneficiary / VPA</th>
                <th className="py-3 px-4">Amount Reported</th>
                <th className="py-3 px-4">Statutory Grounds</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {fraudAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    No suspicious transactions currently flagged for filing.
                  </td>
                </tr>
              ) : (
                fraudAlerts.map((alert) => (
                  <tr key={alert.txn_id} className="table-row-hover transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-white font-medium">
                        STR-{(alert.txn_id || "").slice(-10)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString("en-IN") : ""}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{alert.sender_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{alert.sender_account}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{alert.receiver_name}</div>
                      <div className="text-[11px] text-indigo-400 font-mono">{alert.receiver_vpa}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatINR(alert.amount)}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-[11px] text-slate-300 line-clamp-1">
                        {alert.explainability?.factors?.[0]?.factor || "Behavioral Anomaly"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        PMLA Sec 12 / IT Act Sec 139A
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenStrModal(alert)}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Form PMLA-12</span>
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
