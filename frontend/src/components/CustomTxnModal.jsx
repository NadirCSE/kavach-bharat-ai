import React, { useState } from "react";
import { evaluateTransactionRules } from "../data/mockEngine";
import { X, Send } from "lucide-react";

export default function CustomTxnModal({ onClose, onInjectTxn }) {
  const [senderName, setSenderName] = useState("Rajesh Kumar");
  const [senderVpa, setSenderVpa] = useState("rajesh.kumar@okhdfcbank");
  const [senderBank] = useState("HDFC Bank");
  const [receiverName, setReceiverName] = useState("Clearance Escrow");
  const [receiverVpa, setReceiverVpa] = useState("cbi.clearance.desk@upi");
  const [receiverBank] = useState("State Bank of India");
  const [amount, setAmount] = useState("49500");
  const [rail, setRail] = useState("UPI");
  const [city, setCity] = useState("Jamtara");
  const [remarks, setRemarks] = useState("Urgent Clearance order");

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawTxn = {
      txn_id: `TXN_CUSTOM_${Date.now()}`,
      sender_account: `ACC_HDFC_${Math.floor(Math.random() * 8999 + 1000)}`,
      sender_name: senderName,
      sender_vpa: senderVpa,
      sender_bank: senderBank,
      receiver_account: `ACC_SBI_${Math.floor(Math.random() * 8999 + 1000)}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 m-0">Evaluate Custom Transaction</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
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
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
