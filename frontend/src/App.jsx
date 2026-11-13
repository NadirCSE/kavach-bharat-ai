import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import OverviewView from "./components/OverviewView";
import TransactionStream from "./components/TransactionStream";
import GraphCanvas from "./components/GraphCanvas";
import SimulateView from "./components/SimulateView";
import ComplianceView from "./components/ComplianceView";
import XaiDrawer from "./components/XaiDrawer";
import StrModal from "./components/StrModal";
import CustomTxnModal from "./components/CustomTxnModal";

import {
  INITIAL_ACCOUNTS,
  generateRandomNormalTxn,
  generateScenarioTxns,
  generateI4CTicket
} from "./data/mockEngine";

export default function App() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {} });

  const [activeTab, setActiveTab] = useState("overview");
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState(2000);

  // Modals & Drawers
  const [selectedTxnForXai, setSelectedTxnForXai] = useState(null);
  const [selectedTxnForStr, setSelectedTxnForStr] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize seed transactions and graph
  useEffect(() => {
    const seedTxns = [];
    for (let i = 0; i < 22; i++) {
      seedTxns.push(generateRandomNormalTxn(INITIAL_ACCOUNTS));
    }
    setTransactions(seedTxns);
    rebuildGraph(seedTxns, INITIAL_ACCOUNTS);
  }, []);

  // Background stream
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const newTxn = generateRandomNormalTxn(accounts);
      setTransactions(prev => {
        const next = [newTxn, ...prev.slice(0, 120)];
        rebuildGraph(next, accounts);
        return next;
      });
    }, simSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, accounts]);

  const rebuildGraph = (currentTxns, currentAccounts) => {
    const nodeMap = new Map();

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

  const handleSimulateAttack = (scenarioType) => {
    const attackTxns = generateScenarioTxns(scenarioType, accounts);
    setTransactions(prev => {
      const merged = [...attackTxns, ...prev];
      rebuildGraph(merged, accounts);
      return merged;
    });

    const newAlerts = attackTxns.filter(t => t.risk_score >= 60);
    setFraudAlerts(prev => [...newAlerts, ...prev]);

    if (attackTxns.length > 0) {
      setSelectedTxnForXai(attackTxns[0]);
    }

    showToast(`Simulation complete: ${scenarioType} flagged in live ledger.`);
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
    showToast(`Evaluated: ${customTxn.txn_id} (Score: ${customTxn.risk_score}/100)`);
  };

  const handleDispatch1930 = (txn) => {
    const ticket = generateI4CTicket(txn);
    showToast(`I4C 1930 Golden Hour Lien Ticket Dispatched: ${ticket.ticket_id}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Professional Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        onOpenCustomTxn={() => setIsCustomModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="mb-4 p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-medium flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === "overview" && (
          <OverviewView
            txns={transactions}
            fraudAlerts={fraudAlerts}
            graphSummary={graphData?.summary}
            onSelectTxn={(t) => setSelectedTxnForXai(t)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "stream" && (
          <TransactionStream
            txns={transactions}
            onSelectTxn={(t) => setSelectedTxnForXai(t)}
          />
        )}

        {activeTab === "graph" && (
          <div className="h-[650px]">
            <GraphCanvas
              graphData={graphData}
              onSelectNode={(node) => {
                const match = transactions.find(t => t.sender_account === node.id || t.receiver_account === node.id);
                if (match) setSelectedTxnForXai(match);
              }}
            />
          </div>
        )}

        {activeTab === "simulator" && (
          <SimulateView onSimulateAttack={handleSimulateAttack} />
        )}

        {activeTab === "compliance" && (
          <ComplianceView
            fraudAlerts={fraudAlerts}
            onSelectTxn={(t) => setSelectedTxnForXai(t)}
            onOpenStrModal={(t) => setSelectedTxnForStr(t)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <p className="m-0">
          Kavach (कवच) • Intelligent Financial Fraud Detection & Anti-Money Laundering System • NPCI, RBI & FIU-IND Compliant
        </p>
      </footer>

      {/* Drawers and Modals */}
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
