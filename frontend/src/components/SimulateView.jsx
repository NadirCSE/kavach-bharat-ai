import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Send, RefreshCw, Play, Plus } from "lucide-react";

export default function SimulateView({ onSimulateAttack, onOpenCustomTxn }) {
  const [runningId, setRunningId] = useState(null);

  const scenarios = [
    {
      id: "DIGITAL_ARREST",
      title: "Digital Arrest Extortion",
      tag: "RTGS High-Value",
      howItWorks: "Impersonates law enforcement to coerce senior citizens into urgent RTGS transfers.",
      logic: "Detects authority keywords, sudden RTGS spike, and behavioral deviation.",
      icon: ShieldAlert
    },
    {
      id: "JAN_DHAN_SMURFING",
      title: "Jan Dhan Mule Smurfing",
      tag: "Sub-₹50k Structuring",
      howItWorks: "Splits illicit payouts into ₹48,900–₹49,800 chunks to bypass Sec 139A PAN checks.",
      logic: "Flags threshold proximity below ₹50k and dormant PMJDY fan-in.",
      icon: AlertTriangle
    },
    {
      id: "CIRCULAR_LAYERING",
      title: "Circular Hawala Layering",
      tag: "Graph Cycle A-B-C-A",
      howItWorks: "Cycles funds across 4 accounts (A → B → C → D → A) to disguise illicit provenance.",
      logic: "Directed graph cycle detection triggers automatic Critical AML risk escalation.",
      icon: RefreshCw
    },
    {
      id: "UPI_COLLECT_TRAP",
      title: "Reverse QR / Collect Scam",
      tag: "PIN Confusion",
      howItWorks: "Sends a collect request claiming 'Enter UPI PIN to receive ₹24,999 refund'.",
      logic: "Flags inverted UPI_COLLECT flow combined with refund/PIN coercion terms.",
      icon: Send
    }
  ];

  const trigger = (id) => {
    setRunningId(id);
    onSimulateAttack(id);
    setTimeout(() => setRunningId(null), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 m-0">Synthetic Fraud Injection Sandbox</h2>
          <p className="text-xs text-zinc-500 m-0 mt-1">
            Trigger realistic Indian payment fraud typologies or craft a custom transaction to inspect ML & rule scoring.
          </p>
        </div>
        <button
          onClick={onOpenCustomTxn}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Custom Transaction</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isRunning = runningId === sc.id;
          return (
            <div key={sc.id} className="surface-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 m-0">{sc.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {sc.tag}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-0.5">Pattern</div>
                    <p className="text-zinc-700 m-0 leading-relaxed">{sc.howItWorks}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <div className="text-[10px] font-semibold uppercase text-zinc-400 mb-0.5">Detection Signal</div>
                    <p className="text-zinc-700 m-0 leading-relaxed">{sc.logic}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  onClick={() => trigger(sc.id)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isRunning
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isRunning ? "Injected" : "Run Simulation"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
