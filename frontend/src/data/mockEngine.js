/**
 * Kavach-Bharat AI - Client-side Hybrid Engine
 * Enables 100% offline & zero-latency standalone execution for seamless live deployment on Vercel/Netlify.
 * Fully mirrors the Python FastAPI detection, graph, and compliance engine.
 */

export const INDIAN_BANKS = [
  { name: "HDFC Bank", code: "HDFC", ifsc: "HDFC0001234", color: "#004c8f" },
  { name: "State Bank of India", code: "SBI", ifsc: "SBIN0004567", color: "#280071" },
  { name: "ICICI Bank", code: "ICICI", ifsc: "ICIC0007890", color: "#f37021" },
  { name: "Axis Bank", code: "AXIS", ifsc: "UTIB0003456", color: "#97144d" },
  { name: "Punjab National Bank", code: "PNB", ifsc: "PUNB0008912", color: "#a20a3a" },
  { name: "Kotak Mahindra Bank", code: "KOTAK", ifsc: "KKBK0006789", color: "#ed1c24" }
];

export const INITIAL_ACCOUNTS = [
  { id: "ACC_HDFC_1042", name: "Aarav Sharma", vpa: "aarav.sharma@okhdfcbank", bank: "HDFC Bank", type: "Savings", balance: 245000, isSenior: false, city: "Mumbai" },
  { id: "ACC_SBI_5821", name: "Sunita Devi", vpa: "sunita.devi@oksbi", bank: "State Bank of India", type: "Jan_Dhan_PMJDY", balance: 1450, isSenior: false, city: "Jamtara" },
  { id: "ACC_ICICI_9312", name: "Brigadier R. K. Bakshi (Retd)", vpa: "rk.bakshi@icici", bank: "ICICI Bank", type: "Savings", balance: 1850000, isSenior: true, city: "Delhi NCR" },
  { id: "ACC_AXIS_4190", name: "Priya Nair", vpa: "priya.nair@okaxis", bank: "Axis Bank", type: "Salary", balance: 120000, isSenior: false, city: "Bengaluru" },
  { id: "ACC_PNB_8823", name: "Ramesh Patel", vpa: "ramesh.patel@paytm", bank: "Punjab National Bank", type: "Jan_Dhan_PMJDY", balance: 2100, isSenior: false, city: "Mewat" },
  { id: "ACC_KOTAK_3345", name: "Vikram Singh", vpa: "vikram.singh@ybl", bank: "Kotak Mahindra Bank", type: "Current", balance: 540000, isSenior: false, city: "Pune" },
  { id: "ACC_SBI_7731", name: "Deepak Verma", vpa: "deepak.verma@oksbi", bank: "State Bank of India", type: "Jan_Dhan_PMJDY", balance: 850, isSenior: false, city: "Bharatpur" },
  { id: "ACC_HDFC_6619", name: "Ananya Iyer", vpa: "ananya.iyer@okhdfcbank", bank: "HDFC Bank", type: "Salary", balance: 95000, isSenior: false, city: "Chennai" },
  { id: "ACC_MULE_HUB", name: "FastPay Crypto Gateway", vpa: "merchant.settlement@paytm", bank: "Paytm Payments Bank", type: "Current", balance: 4200000, isSenior: false, city: "Jaipur" },
  { id: "ACC_ESCROW_FAKE", name: "CBI Cyber Escrow Verification", vpa: "clearance.rbi.desk@upi", bank: "State Bank of India", type: "Current", balance: 8900000, isSenior: false, city: "Delhi NCR" }
];

const NORMAL_REMARKS = [
  "Chai & Snacks at Sharmaji", "Swiggy Food Order", "Blinkit Quick Groceries",
  "Monthly House Rent", "Electricity & Water Bill", "Apollo Pharmacy Medicine",
  "Weekend Dinner Split", "Amazon India Shopping", "Cab Ride Uber", "Mobile Recharge Jio"
];

export function formatINR(val) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export function evaluateTransactionRules(txn, graphContext = {}) {
  const amount = Number(txn.amount);
  const rail = txn.rail || "UPI";
  const city = txn.city || "";
  const remarks = (txn.remarks || "").toLowerCase();
  const receiverVpa = (txn.receiver_vpa || "").toLowerCase();
  const senderId = txn.sender_account;
  const receiverId = txn.receiver_account;

  const factors = [];
  let score = 10;

  // 1. Sub-₹50,000 PAN Threshold Structuring (Section 139A IT Act)
  if (amount >= 47500 && amount < 50000) {
    score += 35;
    factors.push({
      factor: "PAN Evasion Structuring (Section 139A)",
      weight: 35,
      description: `Amount ₹${amount.toLocaleString("en-IN")} is structured deliberately under the ₹50,000 threshold to evade mandatory PAN reporting under Rule 114B of IT Rules.`
    });
  }

  // 2. UPI Collect / Reverse QR Fraud
  if (rail === "UPI_COLLECT" || remarks.includes("enter pin") || remarks.includes("refund approval")) {
    score += 42;
    factors.push({
      factor: "Reverse QR / Collect Request Trap",
      weight: 42,
      description: "Deceptive collect request exploiting UPI PIN reversal confusion (falsely claiming PIN is required to receive funds)."
    });
  }

  // 3. Digital Arrest / Law Enforcement Impersonation
  const coercionKw = ["cbi", "supreme court", "clearance", "digital arrest", "police", "escrow", "warrant"];
  const matched = coercionKw.filter(kw => remarks.includes(kw) || receiverVpa.includes(kw));
  if (matched.length > 0) {
    score += 45;
    factors.push({
      factor: "Digital Arrest / Coercion Signature",
      weight: 45,
      description: `Detected legal intimidation & fake law enforcement escrow keywords: [${matched.join(", ")}]. Matches high-profile extortion MO.`
    });
  }

  // 4. Cybercrime Geolocation Hotspot
  if (["Jamtara", "Mewat", "Bharatpur"].includes(city)) {
    score += 20;
    factors.push({
      factor: "High-Density Cybercrime Node",
      weight: 20,
      description: `Transaction initiated/routed through certified I4C priority cybercrime hotspot: ${city}.`
    });
  }

  // 5. High-Value Sudden RTGS Outflow
  if (rail === "RTGS" && amount >= 350000) {
    score += 25;
    factors.push({
      factor: "High-Value Rapid Outflow",
      weight: 25,
      description: `Substantial liquidation via RTGS (₹${amount.toLocaleString("en-IN")}) deviating significantly from median account activity.`
    });
  }

  // 6. Graph Topology - Circular Laundering & Mule Hub
  if (graphContext.circularNodes && (graphContext.circularNodes.has(senderId) || graphContext.circularNodes.has(receiverId))) {
    score += 50;
    factors.push({
      factor: "Circular Round-Tripping (AML Layering)",
      weight: 50,
      description: "Account is a node in an identified closed topological cycle (A ➔ B ➔ C ➔ A), characteristic of hawala laundering."
    });
  }

  if (graphContext.muleNodes && (graphContext.muleNodes.has(senderId) || graphContext.muleNodes.has(receiverId))) {
    score += 40;
    factors.push({
      factor: "Mule Account Funnel Pattern",
      weight: 40,
      description: "Account exhibits high fan-in degree from disparate Jan Dhan accounts coupled with immediate bulk pass-through."
    });
  }

  const finalScore = Math.min(Math.max(score, 5), 99);

  let riskLevel = "LOW";
  let actionCode = "ALLOW";
  let actionText = "Transaction authorized under normal risk profile";

  if (finalScore >= 80) {
    riskLevel = "CRITICAL";
    actionCode = "AUTO_LIEN_1930_ALERT";
    actionText = "Immediate inter-bank debit lien placed; I4C 1930 alert dispatched";
  } else if (finalScore >= 60) {
    riskLevel = "HIGH";
    actionCode = "HOLD_AND_VERIFY";
    actionText = "Debit held for 30m; Step-up biometric OTP & branch review triggered";
  } else if (finalScore >= 35) {
    riskLevel = "MEDIUM";
    actionCode = "COOLING_PERIOD";
    actionText = "Enforce NPCI beneficiary cooling period with delayed settlement";
  }

  // Bilingual explanations
  let enExp = "";
  let hiExp = "";

  if (riskLevel === "LOW") {
    enExp = "Transaction conforms to verified consumer payment patterns with standard device and merchant category.";
    hiExp = "Yeh transaction aam gawaahon aur normal payment patterns ke mutabiq bilkul sahi payi gayi hai.";
  } else {
    const factorTitles = factors.map(f => f.factor).join("; ");
    enExp = `Flagged as ${riskLevel} risk due to: ${factorTitles}. Immediate regulatory inspection mandated.`;

    const hiList = [];
    if (factors.some(f => f.factor.includes("PAN"))) hiList.push("₹50,000 PAN limit se bachne ke liye chote tukde (smurfing)");
    if (factors.some(f => f.factor.includes("Reverse QR"))) hiList.push("UPI PIN daal kar paise lene ka jhaansa (reverse QR fraud)");
    if (factors.some(f => f.factor.includes("Digital Arrest"))) hiList.push("Farzi CBI/Police dhamki aur digital arrest extortion ka shak");
    if (factors.some(f => f.factor.includes("Circular"))) hiList.push("Paison ko ghumane ka circular hawala loop");
    if (factors.some(f => f.factor.includes("Mule"))) hiList.push("Kiraye ke mule account me achanak paise aakar nikalna");
    if (factors.some(f => f.factor.includes("Outflow"))) hiList.push("Achanak bada RTGS amount bahar bhejna");

    hiExp = `Is transaction par ${riskLevel} khatra hai: ${hiList.join(", ") || "Asamanya bartaav"}. Suraksha ke liye freeze kiya ja raha hai.`;
  }

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    recommended_action: actionCode,
    action_text: actionText,
    explainability: {
      factors,
      summary_en: enExp,
      summary_hi: hiExp
    }
  };
}

export function generateRandomNormalTxn(accounts) {
  const sender = accounts[Math.floor(Math.random() * accounts.length)];
  let receiver = accounts[Math.floor(Math.random() * accounts.length)];
  while (receiver.id === sender.id) {
    receiver = accounts[Math.floor(Math.random() * accounts.length)];
  }

  const amount = Math.floor(Math.random() * 4500) + 120;
  const rail = amount > 100000 ? "RTGS" : amount > 50000 ? "IMPS" : "UPI";

  const txn = {
    txn_id: `TXN_IN_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`,
    sender_account: sender.id,
    sender_name: sender.name,
    sender_vpa: sender.vpa,
    sender_bank: sender.bank,
    receiver_account: receiver.id,
    receiver_name: receiver.name,
    receiver_vpa: receiver.vpa,
    receiver_bank: receiver.bank,
    amount,
    currency: "INR",
    rail,
    channel: rail === "UPI" ? "MOBILE_APP" : "NET_BANKING",
    city: sender.city,
    timestamp: new Date().toISOString(),
    remarks: NORMAL_REMARKS[Math.floor(Math.random() * NORMAL_REMARKS.length)],
    scenario: "LEGITIMATE"
  };

  const evalResult = evaluateTransactionRules(txn);
  return { ...txn, ...evalResult };
}

export function generateScenarioTxns(scenarioType, accounts) {
  const now = Date.now();
  const txns = [];

  if (scenarioType === "DIGITAL_ARREST") {
    const senior = accounts.find(a => a.isSenior) || accounts[2];
    const amounts = [485000, 720000, 950000];
    amounts.forEach((amt, i) => {
      const raw = {
        txn_id: `TXN_ARREST_${now}_${i}`,
        sender_account: senior.id,
        sender_name: senior.name,
        sender_vpa: senior.vpa,
        sender_bank: senior.bank,
        receiver_account: "ACC_ESCROW_FAKE",
        receiver_name: "CBI Cyber Escrow Clearing Desk",
        receiver_vpa: "clearance.rbi.desk@upi",
        receiver_bank: "State Bank of India",
        amount: amt,
        currency: "INR",
        rail: "RTGS",
        channel: "NET_BANKING",
        city: "Delhi NCR",
        timestamp: new Date(now + i * 180000).toISOString(),
        remarks: "Clearance escrow deposit for CBI Supreme Court Order Ref 402",
        scenario: "DIGITAL_ARREST"
      };
      const evalRes = evaluateTransactionRules(raw);
      txns.push({ ...raw, ...evalRes });
    });
  } else if (scenarioType === "JAN_DHAN_SMURFING") {
    const janDhanList = accounts.filter(a => a.type === "Jan_Dhan_PMJDY");
    const smurfAmts = [49500, 48900, 49850, 49200, 49900];
    janDhanList.forEach((acc, i) => {
      const raw = {
        txn_id: `TXN_SMURF_${now}_${i}`,
        sender_account: "ACC_SYNDICATE_ROUTER",
        sender_name: "Telegram Task Settlement",
        sender_vpa: "task.rewards.payout@ybl",
        sender_bank: "Kotak Mahindra Bank",
        receiver_account: acc.id,
        receiver_name: acc.name,
        receiver_vpa: acc.vpa,
        receiver_bank: acc.bank,
        amount: smurfAmts[i % smurfAmts.length],
        currency: "INR",
        rail: "UPI",
        channel: "MOBILE_APP",
        city: "Jamtara",
        timestamp: new Date(now + i * 120000).toISOString(),
        remarks: "VIP Level 3 Task Commission Payout",
        scenario: "JAN_DHAN_SMURFING"
      };
      const evalRes = evaluateTransactionRules(raw);
      txns.push({ ...raw, ...evalRes });
    });
  } else if (scenarioType === "UPI_COLLECT_TRAP") {
    const victim = accounts[0];
    const raw = {
      txn_id: `TXN_COLLECT_${now}`,
      sender_account: victim.id,
      sender_name: victim.name,
      sender_vpa: victim.vpa,
      sender_bank: victim.bank,
      receiver_account: "ACC_FRAUD_COLLECT",
      receiver_name: "Paytm Refund Support Desk",
      receiver_vpa: "refund.approval.desk@paytm",
      receiver_bank: "Paytm Payments Bank",
      amount: 24999,
      currency: "INR",
      rail: "UPI_COLLECT",
      channel: "UPI_COLLECT_REQUEST",
      city: "Mewat",
      timestamp: new Date(now).toISOString(),
      remarks: "REFUND APPROVAL - ENTER PIN TO RECEIVE ₹24,999",
      scenario: "UPI_COLLECT_TRAP"
    };
    const evalRes = evaluateTransactionRules(raw);
    txns.push({ ...raw, ...evalRes });
  } else if (scenarioType === "CIRCULAR_LAYERING") {
    const cycleNodes = [accounts[0], accounts[3], accounts[5], accounts[7]];
    const cycleAmt = 380000;
    cycleNodes.forEach((src, i) => {
      const dst = cycleNodes[(i + 1) % cycleNodes.length];
      const raw = {
        txn_id: `TXN_CYCLE_${now}_${i}`,
        sender_account: src.id,
        sender_name: src.name,
        sender_vpa: src.vpa,
        sender_bank: src.bank,
        receiver_account: dst.id,
        receiver_name: dst.name,
        receiver_vpa: dst.vpa,
        receiver_bank: dst.bank,
        amount: cycleAmt - (i * 3500),
        currency: "INR",
        rail: "IMPS",
        channel: "NET_BANKING",
        city: "Mumbai",
        timestamp: new Date(now + i * 150000).toISOString(),
        remarks: "Consultancy invoice professional fee clearance",
        scenario: "CIRCULAR_LAYERING"
      };
      // Mark with circular graph context
      const evalRes = evaluateTransactionRules(raw, {
        circularNodes: new Set(cycleNodes.map(c => c.id))
      });
      txns.push({ ...raw, ...evalRes });
    });
  }

  return txns;
}

export function generateOfficialSTR(txn) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reportId = `FIU-IND-STR-${dateStr}-${(txn.txn_id || "TXN").slice(-8)}`;

  const factors = txn.explainability?.factors || [];
  const reasons = factors.map(f => `${f.factor}: ${f.description}`);

  return {
    report_id: reportId,
    report_type: "SUSPICIOUS_TRANSACTION_REPORT (PMLA SEC 12)",
    authority: "FINANCIAL INTELLIGENCE UNIT - INDIA (FIU-IND)",
    reporting_entity: "Kavach-Bharat Central Sentinel - Scheduled Commercial Bank",
    timestamp: now.toISOString(),
    batch_reference: `BATCH_${dateStr}_PRIORITY_1`,
    transaction_summary: {
      transaction_id: txn.txn_id,
      timestamp: txn.timestamp,
      rail: txn.rail,
      amount: `₹${Number(txn.amount).toLocaleString("en-IN")}`,
      channel: txn.channel,
      originating_city: txn.city
    },
    sender_details: {
      account_id: txn.sender_account,
      name: txn.sender_name,
      vpa: txn.sender_vpa,
      bank: txn.sender_bank,
      kyc_risk: txn.risk_score > 70 ? "HIGH_ENHANCED_DUE_DILIGENCE" : "STANDARD"
    },
    beneficiary_details: {
      account_id: txn.receiver_account,
      name: txn.receiver_name,
      vpa: txn.receiver_vpa,
      bank: txn.receiver_bank
    },
    suspicion_details: {
      risk_score: `${txn.risk_score}/100`,
      classification: txn.risk_level,
      reasons,
      action_mandated: txn.action_text,
      statutory_provisions: [
        "PMLA Section 12 (Reporting Entity Obligation)",
        "IT Act Section 139A / Rule 114B (PAN Quoting)",
        "RBI Master Direction on Fraud Risk Management (July 2024)",
        "I4C Citizen Financial Cyber Fraud Reporting Directive"
      ]
    }
  };
}

export function generateI4CTicket(txn) {
  const now = Date.now();
  return {
    ticket_id: `I4C-CFCFRMS-1930-${now}`,
    portal: "National Cybercrime Reporting Portal (NCRP / I4C)",
    helpline: "1930 Citizen Financial Cyber Fraud Helpline",
    severity: "CRITICAL_SEV_1_GOLDEN_HOUR",
    timestamp: new Date().toISOString(),
    beneficiary_vpa: txn.receiver_vpa,
    beneficiary_account: txn.receiver_account,
    beneficiary_bank: txn.receiver_bank,
    amount_to_freeze: `₹${Number(txn.amount).toLocaleString("en-IN")}`,
    originating_bank: txn.sender_bank,
    mandate: "MANDATORY_INTER_BANK_DEBIT_FREEZE_UNDER_CRPC_SEC_91",
    status: "DISPATCHED_TO_BENEFICIARY_CORE_BANKING"
  };
}
