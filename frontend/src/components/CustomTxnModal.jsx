import React, { useState } from "react";
import { evaluateTransactionRules } from "../data/mockEngine";
import { X, Send, ShieldAlert, Lock, AlertTriangle } from "lucide-react";

export default function CustomTxnModal({
  onClose,
  onInjectTxn,
  accounts = [],
  frozenAccountIds = new Set()
}) {
  const [senderName, setSenderName] = useState("Rajesh Kumar");
  const [senderVpa, setSenderVpa] = useState("rajesh.kumar@okhdfcbank");
  const [senderBank, setSenderBank] = useState("HDFC Bank");
  const [senderAccount, setSenderAccount] = useState("ACC_HDFC_4821");

  const [receiverName, setReceiverName] = useState("Clearance Escrow");
  const [receiverVpa, setReceiverVpa] = useState("cbi.clearance.desk@upi");
  const [receiverBank, setReceiverBank] = useState("State Bank of India");
  const [receiverAccount, setReceiverAccount] = useState("ACC_SBI_1904");

  const [amount, setAmount] = useState("49500");
  const [rail, setRail] = useState("UPI");
  const [city, setCity] = useState("Jamtara");
  const [remarks, setRemarks] = useState("Urgent Clearance order");

  // Check if chosen sender or receiver is legally frozen
  const isSenderFrozen = frozenAccountIds.has(senderAccount) || frozenAccountIds.has(senderVpa);
  const isReceiverFrozen = frozenAccountIds.has(receiverAccount) || frozenAccountIds.has(receiverVpa);
  const hasFrozenParty = isSenderFrozen || isReceiverFrozen;

  const handleSelectReceiverAccount = (accId) => {
    setReceiverAccount(accId);
    const found = accounts.find((a) => a.id === accId);
    if (found) {
      setReceiverName(found.name);
      setReceiverVpa(found.vpa);
      setReceiverBank(found.bank);
    }
  };

  const handleSelectSenderAccount = (accId) => {
    setSenderAccount(accId);
    const found = accounts.find((a) => a.id === accId);
    if (found) {
      setSenderName(found.name);
      setSenderVpa(found.vpa);
      setSenderBank(found.bank);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawTxn = {
      txn_id: `TXN_CUSTOM_${Date.now()}`,
      sender_account: senderAccount || `ACC_${senderBank.slice(0, 4).toUpperCase()}_${Math.floor(Math.random() * 8999 + 1000)}`,
      sender_name: senderName,
      sender_vpa: senderVpa,
      sender_bank: senderBank,
      receiver_account: receiverAccount || `ACC_${receiverBank.slice(0, 4).toUpperCase()}_${Math.floor(Math.random() * 8999 + 1000)}`,
      receiver_name: receiverName,
      receiver_vpa: receiverVpa,
      receiver_bank: receiverBank,
      amount: parseFloat(amount) || 1000,
      currency: "INR",
      rail,
      channel: rail === "UPI" ? "MOBILE_APP" : "NET_BANKING",
      city,
      timestamp: new Date().toISOString(),
      remarks,
      scenario: "CUSTOM_INJECTION",
      is_frozen: hasFrozenParty
    };

    const evaluated = evaluateTransactionRules(rawTxn, { frozenAccounts: frozenAccountIds });
    onInjectTxn({ ...rawTxn, ...evaluated });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 m-0">Evaluate Custom Transaction</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Live AI Evaluator
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Frozen Alert Banner if account is blocked */}
        {hasFrozenParty && (
          <div className="bg-rose-50 border-b border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
            <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">
                Statutory Account Freeze Active (CrPC 91 / PMLA Sec 17)
              </div>
              <p className="mt-0.5 m-0 leading-relaxed text-[11px] text-rose-700">
                {isReceiverFrozen ? "Recipient" : "Sender"} account ({isReceiverFrozen ? receiverAccount : senderAccount}) is under legal lien. 
                Any incoming remittance will be <strong>strictly blocked and denied</strong> at the inter-bank switch.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Quick Account Fill Selector */}
          {accounts.length > 0 && (
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-zinc-500 font-medium block mb-1">Pick Sender Entity</label>
                <select
                  value={senderAccount}
                  onChange={(e) => handleSelectSenderAccount(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-zinc-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.bank.split(" ")[0]}) {frozenAccountIds.has(a.id) ? "🔒 FROZEN" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-500 font-medium block mb-1">Pick Recipient Entity</label>
                <select
                  value={receiverAccount}
                  onChange={(e) => handleSelectReceiverAccount(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-zinc-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.bank.split(" ")[0]}) {frozenAccountIds.has(a.id) ? "🔒 FROZEN" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Sender VPA</label>
              <input
                type="text"
                value={senderVpa}
                onChange={(e) => setSenderVpa(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Receiver Name</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Receiver VPA</label>
              <input
                type="text"
                value={receiverVpa}
                onChange={(e) => setReceiverVpa(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Rail</label>
              <select
                value={rail}
                onChange={(e) => setRail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-900"
              >
                <option value="UPI">UPI</option>
                <option value="UPI_COLLECT">UPI Collect</option>
                <option value="IMPS">IMPS</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-900"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Jamtara">Jamtara (Hotspot)</option>
                <option value="Mewat">Mewat (Hotspot)</option>
                <option value="Bharatpur">Bharatpur (Hotspot)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Clearance order, refund approval, dinner"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                hasFrozenParty
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white"
              }`}
            >
              {hasFrozenParty ? <Lock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{hasFrozenParty ? "Test Frozen Remittance Block" : "Evaluate"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
