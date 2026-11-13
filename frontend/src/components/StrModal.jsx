import React, { useState } from "react";
import { generateOfficialSTR } from "../data/mockEngine";
import { X, Copy, Download, CheckCircle2, Shield, FileCheck } from "lucide-react";

export default function StrModal({ txn, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!txn) return null;

  const str = generateOfficialSTR(txn);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(str, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(str, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${str.report_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  FORM PMLA-12
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {str.report_id}
                </span>
              </div>
              <h2 className="text-base font-bold text-white m-0 mt-0.5">
                FIU-IND Suspicious Transaction Report (STR)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Statutory Format */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs font-sans">
          {/* Statutory Seal Banner */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Statutory Authority</span>
              <p className="font-semibold text-white m-0">Financial Intelligence Unit - India (FIU-IND)</p>
              <p className="text-[11px] text-slate-400 m-0">Department of Revenue, Ministry of Finance, Govt of India</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                SEC 12 COMPLIANT
              </span>
            </div>
          </div>

          {/* Section 1: Transaction Particulars */}
          <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-900/40">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-indigo-400">
              1. Transaction Particulars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px]">Reference ID</span>
                <p className="font-mono text-white m-0">{str.transaction_summary.transaction_id}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Payment Rail</span>
                <p className="font-mono text-white m-0">{str.transaction_summary.rail}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Amount Reported</span>
                <p className="font-mono text-red-400 font-bold m-0">{str.transaction_summary.amount}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Timestamp (UTC)</span>
                <p className="font-mono text-white m-0">{str.transaction_summary.timestamp}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Origin Node</span>
                <p className="text-white m-0">{str.transaction_summary.originating_city}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Batch Ref</span>
                <p className="font-mono text-slate-400 m-0">{str.batch_reference}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Parties Involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-900/40">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-indigo-400">
                2. Originating Entity (Sender)
              </h3>
              <div className="space-y-1 text-slate-300">
                <p className="m-0"><span className="text-slate-500">Name:</span> <span className="text-white font-medium">{str.sender_details.name}</span></p>
                <p className="m-0"><span className="text-slate-500">Account:</span> <span className="font-mono text-white">{str.sender_details.account_id}</span></p>
                <p className="m-0"><span className="text-slate-500">VPA:</span> <span className="font-mono text-indigo-300">{str.sender_details.vpa}</span></p>
                <p className="m-0"><span className="text-slate-500">Bank:</span> {str.sender_details.bank}</p>
                <p className="m-0"><span className="text-slate-500">KYC Status:</span> <span className="text-amber-400 font-mono text-[10px]">{str.sender_details.kyc_risk}</span></p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-900/40">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-rose-400">
                3. Beneficiary Entity (Receiver)
              </h3>
              <div className="space-y-1 text-slate-300">
                <p className="m-0"><span className="text-slate-500">Name:</span> <span className="text-white font-medium">{str.beneficiary_details.name}</span></p>
                <p className="m-0"><span className="text-slate-500">Account:</span> <span className="font-mono text-white">{str.beneficiary_details.account_id}</span></p>
                <p className="m-0"><span className="text-slate-500">VPA:</span> <span className="font-mono text-rose-300">{str.beneficiary_details.vpa}</span></p>
                <p className="m-0"><span className="text-slate-500">Bank:</span> {str.beneficiary_details.bank}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Grounds for Suspicion */}
          <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-900/40">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-red-400">
              4. Grounds for Suspicion & Regulatory Violations
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 mb-3">
              {str.suspicion_details.reasons.map((r, i) => (
                <li key={i} className="leading-relaxed">{r}</li>
              ))}
            </ul>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Statutory Provisions Invoked:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {str.suspicion_details.statutory_provisions.map((p, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Export ready for National Cyber Crime Reporting Portal (NCRP) ingestion.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied JSON" : "Copy Payload"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download STR (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
