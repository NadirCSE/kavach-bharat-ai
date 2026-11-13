import React from "react";
import { Cpu, Network, Shield, Database } from "lucide-react";

export default function MethodologyView() {
  const pillars = [
    {
      icon: Cpu,
      title: "1. Hybrid ML + Behavioral Scoring",
      body: "Combines unsupervised Isolation Forest anomaly detection (monitoring amount divergence, payment rail mix, and short-window velocity) with deterministic Indian regulatory heuristics such as Section 139A ₹50,000 PAN evasion structuring."
    },
    {
      icon: Network,
      title: "2. Graph-Based AML Topology",
      body: "Constructs a directed account transfer graph via NetworkX. Detects closed round-tripping cycles (A → B → C → A) and high-in-degree mule aggregators exhibiting rapid pass-through fund drains."
    },
    {
      icon: Shield,
      title: "3. Explainable AI & Human-in-the-Loop",
      body: "Every risk score (0–100) is decomposed into weighted feature attributions and translated into clear English and Hinglish operational narratives so compliance officers can audit decisions before freezing funds."
    },
    {
      icon: Database,
      title: "4. Privacy, Synthetic Data & Limitations",
      body: "Operates strictly on synthetic, anonymized Indian banking personas and VPAs—zero real customer credentials are used. Limitations include cold-start calibration on new accounts and reliance on synthetic baselines that require production bank tuning."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <h2 className="text-sm font-semibold text-zinc-900 m-0">Architecture & Methodology</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-0 max-w-3xl leading-relaxed">
          Kavach pairs a React + Tailwind CSS operational console with a FastAPI, scikit-learn, NetworkX, and SQLite detection backend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-zinc-700" />
                  <h3 className="text-xs font-semibold text-zinc-900 m-0">{p.title}</h3>
                </div>
                <p className="text-xs text-zinc-600 m-0 leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
