import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, RefreshCw, Send, Sparkles } from "lucide-react";

export default function AttackSimulator({ onSimulateAttack }) {
  const [activeScenario, setActiveScenario] = useState(null);

  const scenarios = [
    {
      id: "DIGITAL_ARREST",
      title: "Digital Arrest Syndicate",
      tag: "CBI / Police Impersonation",
      icon: ShieldAlert,
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
      accentBorder: "hover:border-red-500/60",
      description: "Coerces senior citizen into rapid high-value RTGS transfers (₹4.8L - ₹9.5L) to fake government clearing accounts.",
      buttonText: "Inject Digital Arrest",
      badgeText: "High Value RTGS"
    },
    {
      id: "JAN_DHAN_SMURFING",
      title: "Jan Dhan Mule Smurfing",
      tag: "Section 139A PAN Evasion",
      icon: AlertTriangle,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      accentBorder: "hover:border-amber-500/60",
      description: "Structures transfers deliberately at ₹48,900 - ₹49,850 across 5 PMJDY accounts to evade mandatory PAN reporting.",
      buttonText: "Inject Smurfing Ring",
      badgeText: "Sub-₹50k Structuring"
    },
    {
      id: "UPI_COLLECT_TRAP",
      title: "Reverse QR / Collect Scam",
      tag: "UPI PIN Confusion",
      icon: Send,
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      accentBorder: "hover:border-orange-500/60",
      description: "Sends deceptive collect request for ₹24,999 claiming 'Enter UPI PIN to receive cashback refund' from fake merchant.",
      buttonText: "Inject QR Trap",
      badgeText: "Deceptive Collect"
    },
    {
      id: "CIRCULAR_LAYERING",
      title: "Circular Hawala Layering",
      tag: "Topology Round-Tripping",
      icon: RefreshCw,
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      accentBorder: "hover:border-purple-500/60",
      description: "Rounds ₹3,80,000 across 4 accounts (A ➔ B ➔ C ➔ D ➔ A) with fee reductions to disguise illicit origin.",
      buttonText: "Inject Circular Loop",
      badgeText: "Graph Cycle A-B-C-A"
    }
  ];

  const handleTrigger = (id) => {
    setActiveScenario(id);
    onSimulateAttack(id);
    setTimeout(() => setActiveScenario(null), 1200);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white m-0 tracking-wide flex items-center gap-2">
              LIVE ATTACK SIMULATOR & THREAT INJECTION
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-red-950/70 text-red-400 border border-red-800/60">
                SANDBOX
              </span>
            </h2>
            <p className="text-xs text-slate-400 m-0">
              Trigger real-world Indian cyber-fraud scenarios to test real-time detection, graph tracing, and automated regulatory lien dispatch.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isTriggering = activeScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`group flex flex-col justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 transition-all ${sc.accentBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                    {sc.badgeText}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {sc.description}
                </p>
              </div>

              <button
                onClick={() => handleTrigger(sc.id)}
                disabled={isTriggering}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isTriggering
                    ? "bg-emerald-600 text-white animate-pulse"
                    : "bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700/60 hover:border-indigo-500"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTriggering ? "animate-spin" : ""}`} />
                <span>{isTriggering ? "Injected!" : sc.buttonText}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
