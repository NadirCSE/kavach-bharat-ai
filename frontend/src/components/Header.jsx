import React, { useState, useEffect } from "react";
import { ShieldAlert, Play, Pause, Zap, Activity, Clock, PlusCircle, ExternalLink, Globe } from "lucide-react";

export default function Header({ isSimulating, setIsSimulating, simSpeed, setSimSpeed, onOpenCustomTxn, activeTab, setActiveTab }) {
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

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Compliance */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0 flex items-center gap-2">
                KAVACH-BHARAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400">AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  कवच 2.4
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 m-0 flex items-center gap-2 mt-0.5">
              <span>National Financial Fraud & Anti-Money Laundering Defense</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">NPCI • RBI • FIU-IND Compliant</span>
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-sm font-medium">
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "graph"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Money Flow Graph</span>
          </button>
          <button
            onClick={() => setActiveTab("stream")}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "stream"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Live Transaction Stream</span>
          </button>
        </div>

        {/* Right: Controls & Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{time}</span>
          </div>

          {/* Simulation Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSimulating
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimulating ? "Live Stream ON" : "Stream Paused"}
            </button>
            <select
              value={simSpeed}
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              className="bg-transparent text-slate-400 text-xs py-1 px-2 border-l border-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={1000} className="bg-slate-900 text-white">1s</option>
              <option value={2000} className="bg-slate-900 text-white">2s</option>
              <option value={3000} className="bg-slate-900 text-white">3s</option>
            </select>
          </div>

          {/* Custom Txn Injector */}
          <button
            onClick={onOpenCustomTxn}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Test Txn</span>
          </button>
        </div>
      </div>
    </header>
  );
}
