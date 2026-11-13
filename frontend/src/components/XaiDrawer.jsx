import React, { useState } from "react";
import { formatINR } from "../data/mockEngine";
import { X, ShieldAlert, FileText, CheckCircle2, Lock } from "lucide-react";

export default function XaiDrawer({ txn, onClose, onGenerateStr, onDispatch1930 }) {
  const [actionDispatched, setActionDispatched] = useState(false);
  const [accountFrozen, setAccountFrozen] = useState(false);

  if (!txn) return null;

  const isCritical = txn.risk_score >= 80;
  const isHigh = txn.risk_score >= 60;
  const factors = txn.explainability?.factors || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/25 backdrop-blur-[2px]">
      <div className="w-full max-w-lg bg-white border-l border-zinc-200 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-start justify-between pb-4 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    isCritical
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isHigh
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {txn.risk_level} RISK
                </span>
                <span className="text-xs font-mono text-zinc-400">{txn.txn_id}</span>
              </div>
              <h2 className="text-base font-semibold text-zinc-900 mt-1.5 m-0">
                Explainable AI Inspection
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg border border-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Value & Score */}
          <div className="my-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-zinc-500">Amount</div>
              <div className="text-2xl font-mono font-semibold text-zinc-900 tabular-nums mt-0.5">
                {formatINR(txn.amount)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {txn.rail} • {txn.city || "India"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium text-zinc-500">Risk Score</div>
              <div
                className={`text-3xl font-mono font-bold tabular-nums ${
                  isCritical ? "text-rose-600" : isHigh ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {txn.risk_score}
                <span className="text-sm text-zinc-400 font-normal">/100</span>
              </div>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
              Risk Attribution Factors
            </h3>
            {factors.length === 0 ? (
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                No adverse risk indicators triggered. Fits normal behavioral profile.
              </div>
            ) : (
              <div className="space-y-2.5">
                {factors.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg border border-zinc-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-zinc-900">{f.factor}</span>
                      <span className="font-mono font-semibold text-rose-600">+{f.weight} pts</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="bg-zinc-900 h-1.5 rounded-full"
                        style={{ width: `${Math.min(f.weight * 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-600 m-0 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explanations */}
          <div className="space-y-2.5 mb-5">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Officer Explanation (English)
              </div>
              <p className="text-xs text-zinc-700 m-0 leading-relaxed">
                {txn.explainability?.summary_en}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Branch Summary (Hinglish)
              </div>
              <p className="text-xs text-zinc-700 m-0 leading-relaxed">
                {txn.explainability?.summary_hi}
              </p>
            </div>
          </div>

          {/* Counterparties */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-5">
            <div className="p-3 rounded-lg border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase text-zinc-400">Sender</div>
              <div className="font-medium text-zinc-900 mt-0.5 truncate">{txn.sender_name}</div>
              <div className="font-mono text-[11px] text-zinc-500 truncate">{txn.sender_vpa}</div>
              <div className="text-[11px] text-zinc-400">{txn.sender_bank}</div>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200">
              <div className="text-[10px] font-semibold uppercase text-zinc-400">Receiver</div>
              <div className="font-medium text-zinc-900 mt-0.5 truncate">{txn.receiver_name}</div>
              <div className="font-mono text-[11px] text-zinc-500 truncate">{txn.receiver_vpa}</div>
              <div className="text-[11px] text-zinc-400">{txn.receiver_bank}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-zinc-200 space-y-2.5">
          {actionDispatched && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>I4C 1930 Golden-Hour Lien dispatched under CrPC 91.</span>
            </div>
          )}
          {accountFrozen && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Beneficiary VPA placed on debit-freeze.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActionDispatched(true);
                onDispatch1930(txn);
              }}
              disabled={actionDispatched}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dispatch 1930 Lien</span>
            </button>
            <button
              onClick={() => onGenerateStr(txn)}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate STR</span>
            </button>
            <button
              onClick={() => setAccountFrozen(true)}
              disabled={accountFrozen}
              className="py-2 px-3 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Freeze VPA</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-3 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
