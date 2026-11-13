import React, { useState, useEffect } from "react";
import { Shield, LayoutDashboard, ListOrdered, Network, FlaskConical, FileText, Plus, Pause, Play, Database } from "lucide-react";

export default function Header({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  simSpeed,
  setSimSpeed,
  onOpenCustomTxn
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "stream", label: "Transactions", icon: ListOrdered },
    { id: "graph", label: "Network Graph", icon: Network },
    { id: "simulator", label: "Threat Lab", icon: FlaskConical },
    { id: "compliance", label: "Regulatory STR", icon: FileText }
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight text-sm">
                Kavach
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 leading-none mt-0.5 hidden sm:block">
              Financial Fraud & AML Defense
            </p>
          </div>
        </div>

        {/* Clean Minimalist Nav Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Status */}
        <div className="flex items-center gap-2.5">
          {/* DB Indicator */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>SQLite Active</span>
          </div>

          {/* Clock */}
          <div className="hidden lg:block text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-900/60 rounded border border-slate-800/80">
            {time}
          </div>

          {/* Stream pause/play */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border cursor-pointer ${
              isSimulating
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Live Stream Simulation"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span className="hidden sm:inline">{isSimulating ? "Streaming" : "Paused"}</span>
          </button>

          {/* Test Txn button */}
          <button
            onClick={onOpenCustomTxn}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Test Txn</span>
          </button>
        </div>
      </div>
    </header>
  );
}
