import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Send, RefreshCw, CheckCircle2, ArrowRight, Play, Info } from "lucide-react";

export default function SimulateView({ onSimulateAttack }) {
  const [activeScenario, setActiveScenario] = useState(null);

  const scenarios = [
    {
      id: "DIGITAL_ARREST",
      title: "Digital Arrest & Police Extortion",
      category: "Coercion & Impersonation",
      icon: ShieldAlert,
      badge: "RTGS High Value",
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
      howItWorks: "Syndicates impersonate CBI, Mumbai Police, or the Enforcement Directorate via video calls, placing victims under 'digital arrest' and forcing rapid RTGS liquidations to fake government clearing accounts.",
      detectionLogic: "Tracks severe behavioral baseline deviation (10x normal volume), off-hours high-value RTGS transfers, and intimidation keywords in transaction narrations.",
      buttonLabel: "Run Digital Arrest Simulation"
    },
    {
      id: "JAN_DHAN_SMURFING",
      title: "Jan Dhan Mule Smurfing Ring",
      category: "Section 139A PAN Evasion",
      icon: AlertTriangle,
      badge: "Sub-₹50k Structuring",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      howItWorks: "Syndicates recruit dormant PMJDY (Jan Dhan) accounts and split illicit funds into chunks of ₹48,900 – ₹49,850 to avoid mandatory PAN quoting under Rule 114B of the Income Tax Rules.",
      detectionLogic: "Automated threshold proximity detector flags transactions clustered just below ₹50,000, combined with dormant account surge velocity.",
      buttonLabel: "Run Smurfing Ring Simulation"
    },
    {
      id: "CIRCULAR_LAYERING",
      title: "Circular Hawala Layering Loop",
      category: "AML Round-Tripping",
      icon: RefreshCw,
      badge: "Graph Cycle A-B-C-A",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      howItWorks: "Illicit proceeds are transferred in a circular loop across multiple banks (A ➔ B ➔ C ➔ D ➔ A) with fee reductions to obscure the original audit trail before cash-out.",
      detectionLogic: "NetworkX directed graph cycle traversal detects closed circular flows across distinct IFSCs, immediately boosting risk to Critical.",
      buttonLabel: "Run Circular Loop Simulation"
    },
    {
      id: "UPI_COLLECT_TRAP",
      title: "Reverse QR & UPI Collect Scam",
      category: "Payment Direction Reversal",
      icon: Send,
      badge: "Deceptive Collect",
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      howItWorks: "Fraudsters send deceptive collect requests or reverse QRs with memos claiming 'Enter UPI PIN to receive ₹24,999 cashback', exploiting consumer misunderstanding that PIN is only to send money.",
      detectionLogic: "Identifies collect requests disguised with refund keywords and flags inverted P2P flow from unverified merchant handles.",
      buttonLabel: "Run QR Trap Simulation"
    }
  ];

  const handleRun = (id) => {
    setActiveScenario(id);
    onSimulateAttack(id);
    setTimeout(() => setActiveScenario(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="card-clean p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white m-0">
              Indian Cybercrime Threat Testing Lab
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              This sandbox allows evaluators and compliance teams to inject synthetic, legally safe Indian fraud vectors into the active pipeline. Observe real-time detection, graph loop formation, and automated regulatory reporting.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>4 Pre-Built Attack Profiles</span>
          </div>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isRunning = activeScenario === sc.id;

          return (
            <div key={sc.id} className="card-clean p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white m-0">
                        {sc.title}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {sc.category}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Modus Operandi in India:
                    </span>
                    <p className="text-slate-300 m-0 leading-relaxed text-[11px]">
                      {sc.howItWorks}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-indigo-400 block mb-0.5">
                      Kavach AI Detection Logic:
                    </span>
                    <p className="text-slate-300 m-0 leading-relaxed text-[11px]">
                      {sc.detectionLogic}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Injects into Live Pipeline
                </span>
                <button
                  onClick={() => handleRun(sc.id)}
                  disabled={isRunning}
                  className={`py-1.5 px-4 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRunning
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Simulated & Flagged!" : sc.buttonLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
