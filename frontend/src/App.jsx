import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import OverviewView from "./components/OverviewView";
import TransactionStream from "./components/TransactionStream";
import GraphCanvas from "./components/GraphCanvas";
import SimulateView from "./components/SimulateView";
import ComplianceView from "./components/ComplianceView";
import MethodologyView from "./components/MethodologyView";
import XaiDrawer from "./components/XaiDrawer";
import StrModal from "./components/StrModal";
import CustomTxnModal from "./components/CustomTxnModal";

import {
  INITIAL_ACCOUNTS,
  generateRandomNormalTxn,
  generateScenarioTxns,
  generateI4CTicket
} from "./data/mockEngine";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [accounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {} });
  const [accountRisks, setAccountRisks] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [isSimulating, setIsSimulating] = useState(true);

  const [selectedTxnForXai, setSelectedTxnForXai] = useState(null);
  const [selectedTxnForStr, setSelectedTxnForStr] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Local graph & account risk builder (used for offline fallback or instant local sync)
  const rebuildLocalDerivedState = useCallback((currentTxns, currentAccounts) => {
    const nodeMap = new Map();
    const accRiskMap = new Map();

    currentAccounts.forEach((acc) => {
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

    currentTxns.forEach((t) => {
      const sId = t.sender_account;
      const rId = t.receiver_account;
      const amt = Number(t.amount) || 0;
      const score = Number(t.risk_score) || 0;

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
        edgeMap.set(edgeKey, { source: sId, target: rId, amount: amt, count: 1, rail: t.rail });
      }

      // Account-level risk scoring
      [
        { id: sId, name: t.sender_name, vpa: t.sender_vpa, bank: t.sender_bank },
        { id: rId, name: t.receiver_name, vpa: t.receiver_vpa, bank: t.receiver_bank }
      ].forEach((party) => {
        if (!accRiskMap.has(party.id)) {
          accRiskMap.set(party.id, {
            account_id: party.id,
            name: party.name,
            vpa: party.vpa,
            bank: party.bank,
            max_risk_score: 0,
            txn_count: 0,
            flagged_count: 0,
            total_volume: 0
          });
        }
        const entry = accRiskMap.get(party.id);
        entry.txn_count += 1;
        entry.total_volume += amt;
        if (score > entry.max_risk_score) entry.max_risk_score = score;
        if (score >= 60) entry.flagged_count += 1;
      });
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

    const rankedAccounts = Array.from(accRiskMap.values())
      .sort((a, b) => b.max_risk_score - a.max_risk_score || b.flagged_count - a.flagged_count)
      .slice(0, 10);
    setAccountRisks(rankedAccounts);
  }, []);

  const syncFromBackend = useCallback(async () => {
    const [txRes, alertRes, graphRes, accRes] = await Promise.all([
      fetch(`${API_BASE}/api/transactions/recent?limit=80`),
      fetch(`${API_BASE}/api/alerts?limit=50`),
      fetch(`${API_BASE}/api/graph`),
      fetch(`${API_BASE}/api/accounts/risk`)
    ]);
    if (!txRes.ok) throw new Error("Backend unavailable");
    const [txData, alertData, gData, aData] = await Promise.all([
      txRes.json(),
      alertRes.json(),
      graphRes.json(),
      accRes.json()
    ]);
    setTransactions(txData);
    setFraudAlerts(alertData);
    setGraphData(gData);
    setAccountRisks(aData);
    setBackendConnected(true);
  }, []);

  // Initial load: try FastAPI backend, otherwise seed local engine
  useEffect(() => {
    syncFromBackend().catch(() => {
      setBackendConnected(false);
      const seedTxns = Array.from({ length: 22 }, () => generateRandomNormalTxn(INITIAL_ACCOUNTS));
      setTransactions(seedTxns);
      rebuildLocalDerivedState(seedTxns, INITIAL_ACCOUNTS);
    });
  }, [syncFromBackend, rebuildLocalDerivedState]);

  // Live stream tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(async () => {
      if (backendConnected) {
        try {
          const res = await fetch(`${API_BASE}/api/transactions/tick`, { method: "POST" });
          if (res.ok) {
            await syncFromBackend();
            return;
          }
        } catch {
          setBackendConnected(false);
        }
      }

      const newTxn = generateRandomNormalTxn(accounts);
      setTransactions((prev) => {
        const next = [newTxn, ...prev.slice(0, 100)];
        rebuildLocalDerivedState(next, accounts);
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, backendConnected, accounts, syncFromBackend, rebuildLocalDerivedState]);

  const handleSimulateAttack = async (scenarioType) => {
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/simulate/${scenarioType}`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          await syncFromBackend();
          if (data.transactions?.length > 0) setSelectedTxnForXai(data.transactions[0]);
          showToast(`Simulated ${scenarioType} via FastAPI ML & Graph Engine.`);
          return;
        }
      } catch {
        setBackendConnected(false);
      }
    }

    const attackTxns = generateScenarioTxns(scenarioType, accounts);
    setTransactions((prev) => {
      const merged = [...attackTxns, ...prev];
      rebuildLocalDerivedState(merged, accounts);
      return merged;
    });
    const newAlerts = attackTxns.filter((t) => t.risk_score >= 60);
    setFraudAlerts((prev) => [...newAlerts, ...prev]);
    if (attackTxns.length > 0) setSelectedTxnForXai(attackTxns[0]);
    showToast(`Simulated ${scenarioType}: ${newAlerts.length} high-risk alerts flagged.`);
  };

  const handleInjectCustomTxn = async (customTxn) => {
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/transactions/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customTxn)
        });
        if (res.ok) {
          const evaluated = await res.json();
          await syncFromBackend();
          setSelectedTxnForXai(evaluated);
          showToast(`Evaluated ${evaluated.txn_id} via ML Engine (Score: ${evaluated.risk_score}/100)`);
          return;
        }
      } catch {
        setBackendConnected(false);
      }
    }

    setTransactions((prev) => {
      const next = [customTxn, ...prev];
      rebuildLocalDerivedState(next, accounts);
      return next;
    });
    if (customTxn.risk_score >= 60) {
      setFraudAlerts((prev) => [customTxn, ...prev]);
    }
    setSelectedTxnForXai(customTxn);
    showToast(`Evaluated ${customTxn.txn_id} (Risk Score: ${customTxn.risk_score}/100)`);
  };

  const handleDispatch1930 = async (txn) => {
    if (backendConnected) {
      try {
        const res = await fetch(`${API_BASE}/api/compliance/1930-lien/${txn.txn_id}`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          showToast(`I4C 1930 Lien Dispatched: ${data.ticket.ticket_id}`);
          return;
        }
      } catch {
        // fallback below
      }
    }
    const ticket = generateI4CTicket(txn);
    showToast(`I4C 1930 Lien Dispatched: ${ticket.ticket_id}`);
  };

  const tabTitles = {
    overview: { title: "Security Overview", subtitle: "Real-time fraud monitoring, anomaly trend, and priority review queue" },
    stream: { title: "Transaction Ledger", subtitle: "Live UPI, IMPS & RTGS stream with sub-50ms risk scoring" },
    graph: { title: "AML Network Topology", subtitle: "Directed transaction graph for circular layering & mule hub detection" },
    simulator: { title: "Threat Simulation Lab", subtitle: "Test detection models against synthetic Indian cyber-fraud patterns" },
    compliance: { title: "Regulatory & STR Filing", subtitle: "FIU-IND Form PMLA-12 compilation and I4C 1930 lien controls" },
    methodology: { title: "Methodology & Governance", subtitle: "System architecture, hybrid AI scoring, and responsible AI practices" }
  };

  const currentHeader = tabTitles[activeTab] || tabTitles.overview;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 flex flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        backendConnected={backendConnected}
        alertCount={fraudAlerts.length}
        onOpenCustomTxn={() => setIsCustomModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Minimal Page Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-zinc-200 px-5 sm:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight m-0">
              {currentHeader.title}
            </h1>
            <p className="text-xs text-zinc-500 m-0 mt-0.5">{currentHeader.subtitle}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span className="px-2 py-1 rounded-md bg-zinc-100 border border-zinc-200">
              Synthetic Data Sandbox
            </span>
          </div>
        </div>

        <main className="flex-1 p-5 sm:p-8 max-w-[1440px] w-full mx-auto">
          {toastMessage && (
            <div className="mb-5 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-medium flex items-center justify-between shadow-md">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white ml-4 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <OverviewView
              txns={transactions}
              fraudAlerts={fraudAlerts}
              graphSummary={graphData?.summary}
              accountRisks={accountRisks}
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
            <GraphCanvas
              graphData={graphData}
              onSelectNode={(node) => {
                const match = transactions.find(
                  (t) => t.sender_account === node.id || t.receiver_account === node.id
                );
                if (match) setSelectedTxnForXai(match);
              }}
            />
          )}

          {activeTab === "simulator" && (
            <SimulateView
              onSimulateAttack={handleSimulateAttack}
              onOpenCustomTxn={() => setIsCustomModalOpen(true)}
            />
          )}

          {activeTab === "compliance" && (
            <ComplianceView
              fraudAlerts={fraudAlerts}
              onOpenStrModal={(t) => setSelectedTxnForStr(t)}
            />
          )}

          {activeTab === "methodology" && <MethodologyView />}
        </main>
      </div>

      {selectedTxnForXai && (
        <XaiDrawer
          txn={selectedTxnForXai}
          onClose={() => setSelectedTxnForXai(null)}
          onGenerateStr={(t) => setSelectedTxnForStr(t)}
          onDispatch1930={handleDispatch1930}
        />
      )}

      {selectedTxnForStr && (
        <StrModal txn={selectedTxnForStr} onClose={() => setSelectedTxnForStr(null)} />
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
