import React, { useState } from "react";
import { evaluateTransactionRules } from "../data/mockEngine";
import { X, Send, Sparkles } from "lucide-react";

export default function CustomTxnModal({ onClose, onInjectTxn }) {
  const [senderName, setSenderName] = useState("Rajesh Kumar");
  const [senderVpa, setSenderVpa] = useState("rajesh.kumar@okhdfcbank");
  const [senderBank, setSenderBank] = useState("HDFC Bank");
  const [receiverName, setReceiverName] = useState("Clearance Escrow");
  const [receiverVpa, setReceiverVpa] = useState("cbi.clearance.desk@upi");
  const [receiverBank, setReceiverBank] = useState("State Bank of India");
  const [amount, setAmount] = useState("49500");
  const [rail, setRail] = useState("UPI");
  const [city, setCity] = useState("Jamtara");
  const [remarks, setRemarks] = useState("Urgent Clearance order");

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawTxn = {
      txn_id: `TXN_CUSTOM_${Date.now()}`,
      sender_account: `ACC_${senderBank.slice(0, 4).toUpperCase()}_${Math.floor(Math.random()*8999+1000)}`,
      sender_name: senderName,
      sender_vpa: senderVpa,
      sender_bank: senderBank,
      receiver_account: `ACC_${receiverBank.slice(0, 4).toUpperCase()}_${Math.floor(Math.random()*8999+1000)}`,
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
      scenario: "CUSTOM_INJECTION"
    };

    const evaluated = evaluateTransactionRules(rawTxn);
    onInjectTxn({ ...rawTxn, ...evaluated });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white m-0">
              Inject Custom Indian Banking Transaction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Sender VPA</label>
              <input
                type="text"
                value={senderVpa}
                onChange={e => setSenderVpa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Receiver Name</label>
              <input
                type="text"
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Receiver VPA</label>
              <input
                type="text"
                value={receiverVpa}
                onChange={e => setReceiverVpa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Payment Rail</label>
              <select
                value={rail}
                onChange={e => setRail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
              >
                <option value="UPI">UPI P2P</option>
                <option value="UPI_COLLECT">UPI Collect Request</option>
                <option value="IMPS">IMPS Immediate</option>
                <option value="RTGS">RTGS Real-Time</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Origin City</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Jamtara">Jamtara (Hotspot)</option>
                <option value="Mewat">Mewat (Hotspot)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Transaction Narration / Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
              placeholder="e.g. Clearance order, Refund approval enter PIN..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate & Inject</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
