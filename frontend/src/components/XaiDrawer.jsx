import React, { useState } from "react";
import { formatINR } from "../data/mockEngine";
import { X, ShieldAlert, FileText, CheckCircle2, Lock, AlertTriangle, Building2, User, Send, ExternalLink } from "lucide-react";

export default function XaiDrawer({ txn, onClose, onGenerateStr, onDispatch1930 }) {
  const [actionDispatched, setActionDispatched] = useState(false);
  const [accountFrozen, setAccountFrozen] = useState(false);

  if (!txn) return null;

  const isCritical = txn.risk_score >= 80;
  const isHigh = txn.risk_score >= 60;
  const isMedium = txn.risk_score >= 35;

  const factors = txn.explainability?.factors || [];
  const summaryEn = txn.explainability?.summary_en || "";
  const summaryHi = txn.explainability?.summary_hi || "";

  const handle1930Click = () => {
    setActionDispatched(true);
    onDispatch1930(txn);
  };

  const handleFreeze = () => {
    setAccountFrozen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isCritical
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : isHigh
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                    : isMedium
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {txn.risk_level} RISK
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {txn.txn_id}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 m-0">
                Explainable AI (XAI) Forensics
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Risk Score Gauge & Amount Hero */}
          <div className="my-4 p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Transaction Value
              </span>
              <div className={`text-2xl font-bold font-mono ${isCritical ? "text-red-400" : isHigh ? "text-orange-400" : "text-white"}`}>
                {formatINR(txn.amount)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-medium text-slate-300 text-[10px]">
                  {txn.rail}
                </span>
                <span>via {txn.channel}</span>
                <span>• {txn.city || "India"}</span>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                isCritical
                  ? "border-red-500 bg-red-950/40 text-red-400 glow-red"
                  : isHigh
                  ? "border-orange-500 bg-orange-950/40 text-orange-400"
                  : isMedium
                  ? "border-amber-500 bg-amber-950/40 text-amber-400"
                  : "border-emerald-500 bg-emerald-950/40 text-emerald-400"
              }`}>
                <span className="text-xl font-mono font-extrabold">
                  {txn.risk_score}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                Risk Index / 100
              </span>
            </div>
          </div>

          {/* Feature Attribution (SHAP-Style Factor Breakdown) */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Feature Attributions (Why this was flagged)</span>
            </h3>

            {factors.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                No adverse risk factors triggered. Transaction fits standard consumer payment velocity.
              </p>
            ) : (
              <div className="space-y-2">
                {factors.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-slate-200 font-semibold">{f.factor}</span>
                      <span className="font-mono text-red-400 font-bold">+{f.weight} pts</span>
                    </div>
                    {/* Weight Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(f.weight * 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 m-0 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bilingual Explanations */}
          <div className="mb-4 space-y-2.5">
            {/* English Regulatory Summary */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 mb-1">
                <span>Compliance Officer Narrative (English)</span>
              </span>
              <p className="text-xs text-slate-300 m-0 leading-relaxed">
                {summaryEn}
              </p>
            </div>

            {/* Hinglish Branch Guidance */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                <span>Branch Operations Summary (Hinglish)</span>
              </span>
              <p className="text-xs text-slate-300 m-0 leading-relaxed">
                {summaryHi}
              </p>
            </div>
          </div>

          {/* Counterparties KYC Card */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Originator / Sender</span>
              <p className="text-white font-medium truncate mt-0.5 m-0">{txn.sender_name}</p>
              <p className="text-indigo-400 font-mono text-[11px] truncate m-0">{txn.sender_vpa}</p>
              <p className="text-slate-400 text-[10px] m-0">{txn.sender_bank}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Beneficiary / Destination</span>
              <p className="text-white font-medium truncate mt-0.5 m-0">{txn.receiver_name}</p>
              <p className="text-rose-400 font-mono text-[11px] truncate m-0">{txn.receiver_vpa}</p>
              <p className="text-slate-400 text-[10px] m-0">{txn.receiver_bank}</p>
            </div>
          </div>
        </div>

        {/* Action Center Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {actionDispatched && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>I4C 1930 Inter-bank Lien Successfully Dispatched under CrPC 91.</span>
            </div>
          )}

          {accountFrozen && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-700/60 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Lock className="w-4 h-4 shrink-0 text-red-400" />
              <span>Beneficiary VPA & Account Placed on Debit-Freeze across NPCI switch.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handle1930Click}
              disabled={actionDispatched}
              className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dispatch 1930 Lien</span>
            </button>

            <button
              onClick={() => onGenerateStr(txn)}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export FIU-IND STR</span>
            </button>

            <button
              onClick={handleFreeze}
              disabled={accountFrozen}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Freeze Beneficiary VPA</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-800"
            >
              <span>Close Drawer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
