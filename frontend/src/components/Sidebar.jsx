import React from "react";
import {
  Shield,
  LayoutDashboard,
  ListOrdered,
  Network,
  FlaskConical,
  FileText,
  BookOpen,
  Plus,
  Pause,
  Play
} from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  backendConnected,
  alertCount,
  onOpenCustomTxn
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "stream", label: "Transactions", icon: ListOrdered, badge: alertCount > 0 ? alertCount : null },
    { id: "graph", label: "AML Network", icon: Network },
    { id: "simulator", label: "Threat Lab", icon: FlaskConical },
    { id: "compliance", label: "Compliance & STR", icon: FileText },
    { id: "methodology", label: "Methodology", icon: BookOpen }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-60 shrink-0 bg-white border-r border-zinc-200 min-h-screen sticky top-0 h-screen p-4">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-zinc-900 tracking-tight">Kavach</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
                Fraud & AML Defense
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-2.5 pt-4 border-t border-zinc-200">
          <button
            onClick={onOpenCustomTxn}
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Test Transaction</span>
          </button>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-between border transition-colors cursor-pointer ${
              isSimulating
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSimulating ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              <span>{isSimulating ? "Live Stream On" : "Stream Paused"}</span>
            </span>
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Engine</span>
            <span className={`font-mono font-medium ${backendConnected ? "text-emerald-700" : "text-zinc-700"}`}>
              {backendConnected ? "FastAPI ML" : "Local Rule Engine"}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <header className="lg:hidden bg-white border-b border-zinc-200 sticky top-0 z-40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm text-zinc-900">Kavach</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className="px-2.5 py-1 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 bg-zinc-50"
            >
              {isSimulating ? "Pause" : "Resume"}
            </button>
            <button
              onClick={onOpenCustomTxn}
              className="px-2.5 py-1 rounded-md bg-zinc-900 text-white text-xs font-medium"
            >
              + Test
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 bg-zinc-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
