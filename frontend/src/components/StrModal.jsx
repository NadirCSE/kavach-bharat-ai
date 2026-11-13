import React, { useState } from "react";
import { generateOfficialSTR } from "../data/mockEngine";
import { X, Copy, Download, CheckCircle2, FileCheck } from "lucide-react";

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
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${str.report_id}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-zinc-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500">FORM PMLA-12 • {str.report_id}</span>
              <h2 className="text-base font-semibold text-zinc-900 m-0">
                FIU-IND Suspicious Transaction Report
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg border border-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Transaction ID</div>
              <div className="font-mono text-zinc-900 font-medium">{str.transaction_summary.transaction_id}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Rail</div>
              <div className="font-mono text-zinc-900">{str.transaction_summary.rail}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Amount</div>
              <div className="font-mono font-semibold text-rose-700">{str.transaction_summary.amount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-2">Originating Entity</div>
              <div className="font-medium text-zinc-900">{str.sender_details.name}</div>
              <div className="font-mono text-zinc-500 mt-0.5">{str.sender_details.vpa}</div>
              <div className="text-zinc-500">{str.sender_details.bank}</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-2">Beneficiary Entity</div>
              <div className="font-medium text-zinc-900">{str.beneficiary_details.name}</div>
              <div className="font-mono text-zinc-500 mt-0.5">{str.beneficiary_details.vpa}</div>
              <div className="text-zinc-500">{str.beneficiary_details.bank}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200">
            <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-2">Grounds for Suspicion</div>
            <ul className="list-disc pl-4 space-y-1 text-zinc-700 m-0">
              {str.suspicion_details.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download STR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
