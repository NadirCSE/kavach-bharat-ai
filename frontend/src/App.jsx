import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import KpiCards from "./components/KpiCards";
import AttackSimulator from "./components/AttackSimulator";
import GraphCanvas from "./components/GraphCanvas";
import TransactionStream from "./components/TransactionStream";
import XaiDrawer from "./components/XaiDrawer";
import StrModal from "./components/StrModal";
import CustomTxnModal from "./components/CustomTxnModal";

import {
  INITIAL_ACCOUNTS,
  generateRandomNormalTxn,
  generateScenarioTxns,
  generateI4CTicket,
  evaluateTransactionRules
} from "./data/mockEngine";

export default function App() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {} });

  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState(2000);
  const [activeTab, setActiveTab] = useState("graph");

  // Modals & Drawers
  const [selectedTxnForXai, setSelectedTxnForXai] = useState(null);
  const [selectedTxnForStr, setSelectedTxnForStr] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Initialize seed transactions and graph
  useEffect(() => {
    const seedTxns = [];
    for (let i = 0; i < 18; i++) {
      seedTxns.push(generateRandomNormalTxn(INITIAL_ACCOUNTS));
    }
    setTransactions(seedTxns);
    rebuildGraph(seedTxns, INITIAL_ACCOUNTS);
  }, []);

  // Real-time transaction simulation ticker
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const newTxn = generateRandomNormalTxn(accounts);
      setTransactions(prev => {
        const next = [newTxn, ...prev.slice(0, 99)];
        rebuildGraph(next, accounts);
        return next;
      });
    }, simSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, accounts]);

  // Graph topology builder
  const rebuildGraph = (currentTxns, currentAccounts) => {
    const nodeMap = new Map();

    // Add baseline accounts
    currentAccounts.forEach(acc => {
      nodeMap.set(acc.id, {
        id: acc.id,
        label: acc.name,
        vpa: acc.vpa,
        bank: acc.bank,
        total_sent: 0,
        total_received: 0,
        in_degree: 0,
        out_degree: 0,
        node_type: "NORMAL"
      });
    });

    const edgeMap = new Map();
    const circularNodes = new Set();
    const muleNodes = new Set();

    currentTxns.forEach(t => {
      const sId = t.sender_account;
      const rId = t.receiver_account;
      const amt = Number(t.amount) || 0;

      if (!nodeMap.has(sId)) {
        nodeMap.set(sId, {
          id: sId,
          label: t.sender_name || sId,
          vpa: t.sender_vpa || "",
          bank: t.sender_bank || "Bank",
          total_sent: 0,
          total_received: 0,
          in_degree: 0,
          out_degree: 0,
          node_type: "NORMAL"
        });
      }
      if (!nodeMap.has(rId)) {
        nodeMap.set(rId, {
          id: rId,
          label: t.receiver_name || rId,
          vpa: t.receiver_vpa || "",
          bank: t.receiver_bank || "Bank",
          total_sent: 0,
          total_received: 0,
          in_degree: 0,
          out_degree: 0,
          node_type: "NORMAL"
        });
      }

      const sNode = nodeMap.get(sId);
      const rNode = nodeMap.get(rId);

      sNode.total_sent += amt;
      sNode.out_degree += 1;
      rNode.total_received += amt;
      rNode.in_degree += 1;

      // Special node tagging based on scenarios
      if (t.scenario === "CIRCULAR_LAYERING") {
        sNode.node_type = "CIRCULAR_LAUNDERING";
        rNode.node_type = "CIRCULAR_LAUNDERING";
        circularNodes.add(sId);
        circularNodes.add(rId);
      } else if (t.scenario === "JAN_DHAN_SMURFING" || t.scenario === "DIGITAL_ARREST") {
        if (rNode.in_degree >= 2) {
          rNode.node_type = "MULE_AGGREGATOR";
          muleNodes.add(rId);
        }
      }

      // Aggregate edge weight
      const edgeKey = `${sId}->${rId}`;
      if (edgeMap.has(edgeKey)) {
        const e = edgeMap.get(edgeKey);
        e.amount += amt;
        e.count += 1;
      } else {
        edgeMap.set(edgeKey, {
          source: sId,
          target: rId,
          amount: amt,
          count: 1,
          rail: t.rail
        });
      }
    });

    setGraphData({
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
      summary: {
        total_accounts: nodeMap.size,
        total_relations: edgeMap.size,
        circular_cycles_count: circularNodes.size > 0 ? 1 : 0,
        mule_hubs_count: muleNodes.size
      }
    });
  };

  // Attack Injection Handler
  const handleSimulateAttack = (scenarioType) => {
    const attackTxns = generateScenarioTxns(scenarioType, accounts);
    setTransactions(prev => {
      const merged = [...attackTxns, ...prev];
      rebuildGraph(merged, accounts);
      return merged;
    });

    const newAlerts = attackTxns.filter(t => t.risk_score >= 60);
    setFraudAlerts(prev => [...newAlerts, ...prev]);

    // Open highest risk attack transaction in XAI drawer for instant judge evaluation
    if (attackTxns.length > 0) {
      setSelectedTxnForXai(attackTxns[0]);
    }

    showNotification(`Injected ${scenarioType} Scenario (${attackTxns.length} transactions processed)`);
  };

  const handleInjectCustomTxn = (customTxn) => {
    setTransactions(prev => {
      const next = [customTxn, ...prev];
      rebuildGraph(next, accounts);
      return next;
    });

    if (customTxn.risk_score >= 60) {
      setFraudAlerts(prev => [customTxn, ...prev]);
    }
    setSelectedTxnForXai(customTxn);
    showNotification(`Custom Transaction Evaluated (Risk: ${customTxn.risk_score}/100)`);
  };

  const handleDispatch1930 = (txn) => {
    const ticket = generateI4CTicket(txn);
    showNotification(`Dispatched 1930 Golden Hour Lien Ticket: ${ticket.ticket_id}`);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        onOpenCustomTxn={() => setIsCustomModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1720px] mx-auto w-full">
        {/* Toast Notification Banner */}
        {notification && (
          <div className="p-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2 duration-200">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Top KPIs */}
        <KpiCards
          txns={transactions}
          fraudAlerts={fraudAlerts}
          graphSummary={graphData?.summary}
        />

        {/* Attack Simulator Banner */}
        <AttackSimulator onSimulateAttack={handleSimulateAttack} />

        {/* Primary View: Graph or Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Visualizer (Graph or Table) */}
          <div className="lg:col-span-8 flex flex-col h-[560px]">
            {activeTab === "graph" ? (
              <GraphCanvas
                graphData={graphData}
                onSelectNode={(node) => {
                  const match = transactions.find(t => t.sender_account === node.id || t.receiver_account === node.id);
                  if (match) setSelectedTxnForXai(match);
                }}
              />
            ) : (
              <TransactionStream
                txns={transactions}
                onSelectTxn={(t) => setSelectedTxnForXai(t)}
              />
            )}
          </div>

          {/* Right Column: Live Fraud Alert Feed */}
          <div className="lg:col-span-4 flex flex-col h-[560px] glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider m-0">
                  REAL-TIME FRAUD ALERTS
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800">
                {fraudAlerts.length} Flagged
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {fraudAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <p>No critical threats flagged currently.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Use the Attack Simulator above to inject real-world Indian fraud vectors.
                  </p>
                </div>
              ) : (
                fraudAlerts.slice(0, 25).map((alert, idx) => (
                  <div
                    key={`${alert.txn_id}-${idx}`}
                    onClick={() => setSelectedTxnForXai(alert)}
                    className="p-3 rounded-xl bg-slate-900/90 border border-red-900/40 hover:border-red-500/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-950/90 text-red-300 border border-red-800/80 font-mono">
                        SCORE {alert.risk_score}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour12: false }) : ""}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                      {alert.sender_name} ➔ {alert.receiver_name}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span className="font-mono text-red-300 font-semibold">
                        ₹{Number(alert.amount).toLocaleString("en-IN")}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-400">
                        {alert.rail}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 m-0 border-t border-slate-800/80 pt-1.5">
                      {alert.explainability?.summary_en || alert.remarks}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 px-6 text-center text-xs text-slate-500">
        <p className="m-0">
          Kavach-Bharat AI (कवच) • Built for Intelligent Financial Fraud Detection & AML System Challenge • NPCI, RBI & FIU-IND Compliant
        </p>
      </footer>

      {/* Modals & Drawers */}
      {selectedTxnForXai && (
        <XaiDrawer
          txn={selectedTxnForXai}
          onClose={() => setSelectedTxnForXai(null)}
          onGenerateStr={(t) => setSelectedTxnForStr(t)}
          onDispatch1930={handleDispatch1930}
        />
      )}

      {selectedTxnForStr && (
        <StrModal
          txn={selectedTxnForStr}
          onClose={() => setSelectedTxnForStr(null)}
        />
      )}

      {isCustomModalOpen && (
        <CustomTxnModal
          onClose={() => setIsCustomModalOpen(false)}
          onInjectTxn={handleInjectCustomTxn}
        />
      )}
    </div>
  );
}
