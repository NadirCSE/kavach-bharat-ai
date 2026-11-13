export const INITIAL_ACCOUNTS = [
  { id: "ACC_HDFC_4821", name: "Aarav Sharma", bank: "HDFC Bank", vpa: "aarav.42@okhdfcbank", city: "Mumbai", isSenior: false, type: "Savings" },
  { id: "ACC_SBI_1904", name: "Sunita Devi", bank: "State Bank of India", vpa: "sunita.61@oksbi", city: "Delhi NCR", isSenior: true, type: "Savings" },
  { id: "ACC_ICICI_7732", name: "Rohan Mehta", bank: "ICICI Bank", vpa: "rohan.88@icici", city: "Bengaluru", isSenior: false, type: "Salary" },
  { id: "ACC_AXIS_3319", name: "Priya Nair", bank: "Axis Bank", vpa: "priya.19@okaxis", city: "Pune", isSenior: false, type: "Savings" },
  { id: "ACC_PNB_5520", name: "Manoj Tiwari", bank: "Punjab National Bank", vpa: "manoj.12@ybl", city: "Lucknow", isSenior: false, type: "Jan_Dhan_PMJDY" },
  { id: "ACC_SBI_6182", name: "Kavita Reddy", bank: "State Bank of India", vpa: "kavita.34@oksbi", city: "Hyderabad", isSenior: false, type: "Jan_Dhan_PMJDY" },
  { id: "ACC_KOTAK_9041", name: "Vikram Singh", bank: "Kotak Mahindra Bank", vpa: "vikram.55@paytm", city: "Jaipur", isSenior: false, type: "Current" },
  { id: "ACC_HDFC_2245", name: "Ananya Iyer", bank: "HDFC Bank", vpa: "ananya.73@okhdfcbank", city: "Chennai", isSenior: false, type: "Savings" },
  { id: "ACC_AXIS_8810", name: "Deepak Verma", bank: "Axis Bank", vpa: "deepak.21@okaxis", city: "Ahmedabad", isSenior: false, type: "Jan_Dhan_PMJDY" },
  { id: "ACC_ICICI_4109", name: "Neha Choudhury", bank: "ICICI Bank", vpa: "neha.91@icici", city: "Kolkata", isSenior: false, type: "Jan_Dhan_PMJDY" }
];

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: num >= 1000 ? 0 : 2
  }).format(num);
}

const SUSPICIOUS_KEYWORDS = [
  "cbi", "supreme court", "clearance", "escrow", "digital arrest",
  "refund approval", "enter pin", "task commission", "crypto deposit", "rbi verification"
];

const HIGH_RISK_CITIES = ["Jamtara", "Mewat", "Bharatpur"];

export function evaluateTransactionRules(txn, context = {}) {
  const amount = Number(txn.amount) || 0;
  const rail = txn.rail || "UPI";
  const city = txn.city || "";
  const remarks = (txn.remarks || "").toLowerCase();
  const receiverVpa = (txn.receiver_vpa || "").toLowerCase();
  const scenario = txn.scenario || "LEGITIMATE";

  // Check if sender or receiver account is legally FROZEN
  const frozenAccounts = context.frozenAccounts || new Set();
  const isSenderFrozen = frozenAccounts.has(txn.sender_account);
  const isReceiverFrozen = frozenAccounts.has(txn.receiver_account) || txn.is_frozen;

  if (isSenderFrozen || isReceiverFrozen) {
    const role = isReceiverFrozen ? "Receiver" : "Sender";
    const frozenAcc = isReceiverFrozen ? txn.receiver_account : txn.sender_account;
    const frozenVpa = isReceiverFrozen ? txn.receiver_vpa : txn.sender_vpa;
    return {
      risk_score: 100,
      risk_level: "BLOCKED",
      recommended_action: "TRANSACTION_DENIED_ACCOUNT_FROZEN",
      action_text: `Transaction blocked: ${role} account (${frozenAcc}) is legally FROZEN under CrPC 91 / PMLA 17.`,
      explainability: {
        factors: [{
          factor: "Statutory Law Enforcement Freeze Active",
          weight: 100,
          description: `Account ${frozenAcc} (${frozenVpa || "N/A"}) is under active statutory seizure order from I4C 1930 / Cybercrime Cell. All incoming and outgoing funds are blocked.`
        }],
        summary_en: `Payment denied. The ${role} account is currently under legal freeze. No credits or debits permitted.`,
        summary_hi: `Bhugtan asafal. Kanooni freeze aadesh ke tehat ${role} khate me rashi jama ya nikasi poori tarah pratibandhit hai.`
      }
    };
  }

  const factors = [];
  let score = 8;

  if (scenario === "CIRCULAR_LAYERING") {
    score += 58;
    factors.push({
      factor: "Circular Layering Loop (AML Round-Tripping)",
      weight: 58,
      description: "Account participates in a closed transfer cycle (A → B → C → D → A) designed to obscure fund provenance."
    });
  }

  if (amount >= 47500 && amount < 50000) {
    score += 36;
    factors.push({
      factor: "Section 139A PAN Evasion Structuring",
      weight: 36,
      description: `Amount ${formatINR(amount)} sits deliberately below the ₹50,000 mandatory PAN threshold (Rule 114B IT Rules).`
    });
  }

  if (rail === "UPI_COLLECT" || remarks.includes("enter pin") || remarks.includes("refund")) {
    score += 42;
    factors.push({
      factor: "Reverse QR / Collect Request Trap",
      weight: 42,
      description: "Collect request formatted to trick the victim into entering a UPI PIN under the pretext of receiving a refund."
    });
  }

  const matched = SUSPICIOUS_KEYWORDS.filter(k => remarks.includes(k));
  if (matched.length > 0 || receiverVpa.includes("cbi") || receiverVpa.includes("rbi")) {
    score += 46;
    factors.push({
      factor: "Digital Arrest / Authority Impersonation",
      weight: 46,
      description: `Coercion signature matched in narration/VPA (${matched.join(", ") || "spoofed government handle"}).`
    });
  }

  if (HIGH_RISK_CITIES.includes(city)) {
    score += 20;
    factors.push({
      factor: "High-Risk Cybercrime Hotspot Origin",
      weight: 20,
      description: `Transaction originated from flagged cyber-fraud cluster: ${city}.`
    });
  }

  if (rail === "RTGS" && amount >= 400000) {
    score += 26;
    factors.push({
      factor: "Abnormal High-Value RTGS Outflow",
      weight: 26,
      description: `Rapid liquidation of ${formatINR(amount)} via RTGS exceeds account behavioral baseline.`
    });
  }

  if (scenario === "JAN_DHAN_SMURFING") {
    score += 22;
    factors.push({
      factor: "Dormant Jan Dhan Mule Fan-In",
      weight: 22,
      description: "Multiple split payouts routed into low-balance PMJDY accounts from an unverified gaming gateway."
    });
  }

  if (remarks.includes("payout") || remarks.includes("disbursement") || remarks.includes("bonus") || txn.is_fan_out) {
    score += 38;
    factors.push({
      factor: "Rapid Fan-Out Dispersal to Fresh Accounts",
      weight: 38,
      description: "Source entity is executing high-velocity burst disbursements into unseasoned accounts (Syndicate Dispersal Ring)."
    });
  }

  const finalScore = Math.min(Math.max(score, 5), 99);

  let risk_level = "LOW";
  let recommended_action = "ALLOW";
  let action_text = "Authorized within standard behavioral parameters";

  if (finalScore >= 80) {
    risk_level = "CRITICAL";
    recommended_action = "AUTO_LIEN_1930_ALERT";
    action_text = "Place immediate Golden-Hour Lien & dispatch I4C 1930 CFCFRMS alert";
  } else if (finalScore >= 60) {
    risk_level = "HIGH";
    recommended_action = "HOLD_AND_VERIFY";
    action_text = "Hold transaction, trigger step-up biometric 2FA & branch review";
  } else if (finalScore >= 35) {
    risk_level = "MEDIUM";
    recommended_action = "COOLING_PERIOD";
    action_text = "Enforce NPCI 30-minute beneficiary cooling period";
  }

  const summary_en =
    risk_level === "LOW"
      ? "Transaction aligns with verified customer velocity, known device fingerprint, and normal ticket size."
      : `Flagged as ${risk_level} risk (${finalScore}/100) driven by: ${factors.map(f => f.factor).join("; ")}.`;

  const summary_hi =
    risk_level === "LOW"
      ? "Yeh transaction grahak ke samanya payment pattern aur verified device ke mutabiq surakshit hai."
      : `Is transaction par ${risk_level} khatra (${finalScore}/100) darj kiya gaya hai. Turant jaanch aur zaroorat padne par lien lagane ki salah di jati hai.`;

  return {
    risk_score: finalScore,
    risk_level,
    recommended_action,
    action_text,
    explainability: {
      factors,
      summary_en,
      summary_hi
    }
  };
}

const NORMAL_REMARKS = [
  "Grocery Store", "Utility Bill", "Pharmacy", "Book Purchase",
  "Metro Recharge", "Dinner Split", "Rent Payment", "Broadband Bill"
];

export function generateRandomNormalTxn(accounts = INITIAL_ACCOUNTS) {
  const s = accounts[Math.floor(Math.random() * accounts.length)];
  const others = accounts.filter(a => a.id !== s.id);
  const r = others[Math.floor(Math.random() * others.length)];

  const amount = Math.round((Math.random() * 3200 + 75) * 100) / 100;
  const rail = Math.random() < 0.90 ? "UPI" : "IMPS";

  const raw = {
    txn_id: `TXN_IN_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`,
    sender_account: s.id,
    sender_name: s.name,
    sender_vpa: s.vpa,
    sender_bank: s.bank,
    receiver_account: r.id,
    receiver_name: r.name,
    receiver_vpa: r.vpa,
    receiver_bank: r.bank,
    amount,
    currency: "INR",
    rail,
    channel: rail === "UPI" ? "MOBILE_APP" : "NET_BANKING",
    city: s.city,
    timestamp: new Date().toISOString(),
    remarks: NORMAL_REMARKS[Math.floor(Math.random() * NORMAL_REMARKS.length)],
    scenario: "LEGITIMATE"
  };

  return { ...raw, ...evaluateTransactionRules(raw) };
}

export function generateScenarioTxns(scenarioType, accounts = INITIAL_ACCOUNTS) {
  const now = Date.now();
  const txns = [];

  if (scenarioType === "DIGITAL_ARREST") {
    const victim = accounts.find(a => a.isSenior) || accounts[1];
    [450000, 680000, 950000].forEach((amt, i) => {
      const raw = {
        txn_id: `TXN_ARREST_${now}_${i}`,
        sender_account: victim.id,
        sender_name: victim.name,
        sender_vpa: victim.vpa,
        sender_bank: victim.bank,
        receiver_account: i < 2 ? "ACC_MULE_CBI_01" : "ACC_MULE_CBI_02",
        receiver_name: "CBI Security Escrow Acct",
        receiver_vpa: `clearance.rbi.${i}@upi`,
        receiver_bank: "State Bank of India",
        amount: amt,
        currency: "INR",
        rail: "RTGS",
        channel: "NET_BANKING",
        city: victim.city,
        timestamp: new Date(now + i * 1000).toISOString(),
        remarks: "Urgent Clearance for Supreme Court Case",
        scenario: "DIGITAL_ARREST"
      };
      txns.push({ ...raw, ...evaluateTransactionRules(raw) });
    });
  } else if (scenarioType === "JAN_DHAN_SMURFING") {
    const pmjdy = accounts.filter(a => a.type === "Jan_Dhan_PMJDY");
    const targets = pmjdy.length >= 3 ? pmjdy : accounts.slice(0, 4);
    const amounts = [49500, 48900, 49800, 49250];
    targets.forEach((acc, i) => {
      const raw = {
        txn_id: `TXN_SMURF_${now}_${i}`,
        sender_account: "ACC_SYNDICATE_MULE",
        sender_name: "P2P Gaming Gateway",
        sender_vpa: "fastcash.payout@ybl",
        sender_bank: "Kotak Mahindra Bank",
        receiver_account: acc.id,
        receiver_name: acc.name,
        receiver_vpa: acc.vpa,
        receiver_bank: acc.bank,
        amount: amounts[i % amounts.length],
        currency: "INR",
        rail: "UPI",
        channel: "MOBILE_APP",
        city: "Jamtara",
        timestamp: new Date(now + i * 1000).toISOString(),
        remarks: "Task Commission Payout",
        scenario: "JAN_DHAN_SMURFING"
      };
      txns.push({ ...raw, ...evaluateTransactionRules(raw) });
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
      receiver_name: "Customer Care Refund Desk",
      receiver_vpa: "refund.department@paytm",
      receiver_bank: "Paytm Payments Bank",
      amount: 24999,
      currency: "INR",
      rail: "UPI_COLLECT",
      channel: "UPI_COLLECT_REQUEST",
      city: "Mewat",
      timestamp: new Date(now).toISOString(),
      remarks: "REFUND APPROVAL - ENTER PIN TO RECEIVE",
      scenario: "UPI_COLLECT_TRAP"
    };
    txns.push({ ...raw, ...evaluateTransactionRules(raw) });
  } else if (scenarioType === "CIRCULAR_LAYERING") {
    const chain = accounts.slice(0, 4);
    chain.forEach((src, i) => {
      const dst = chain[(i + 1) % chain.length];
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
        amount: 350000 - i * 2500,
        currency: "INR",
        rail: "IMPS",
        channel: "NET_BANKING",
        city: "Delhi NCR",
        timestamp: new Date(now + i * 1000).toISOString(),
        remarks: "Consultancy invoice settlement",
        scenario: "CIRCULAR_LAYERING"
      };
      txns.push({ ...raw, ...evaluateTransactionRules(raw) });
    });
  }

  return txns;
}

export function generateOfficialSTR(txn) {
  const now = new Date();
  const idTail = (txn.txn_id || "000000").slice(-8);
  const factors = txn.explainability?.factors || [];
  return {
    report_id: `FIU-IND-STR-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${idTail}`,
    batch_reference: `BATCH_${now.toISOString().slice(0, 7).replace("-", "")}_PRIORITY_1`,
    transaction_summary: {
      transaction_id: txn.txn_id,
      rail: txn.rail,
      amount: formatINR(txn.amount),
      timestamp: txn.timestamp || now.toISOString(),
      originating_city: txn.city || "India"
    },
    sender_details: {
      name: txn.sender_name,
      account_id: txn.sender_account,
      vpa: txn.sender_vpa,
      bank: txn.sender_bank,
      kyc_risk: (txn.risk_score || 0) > 70 ? "ENHANCED_DUE_DILIGENCE" : "STANDARD"
    },
    beneficiary_details: {
      name: txn.receiver_name,
      account_id: txn.receiver_account,
      vpa: txn.receiver_vpa,
      bank: txn.receiver_bank
    },
    suspicion_details: {
      risk_score: txn.risk_score,
      reasons: factors.length > 0 ? factors.map(f => `${f.factor}: ${f.description}`) : [txn.explainability?.summary_en || "Behavioral anomaly detected"],
      statutory_provisions: [
        "PMLA Section 12 (Reporting Obligations)",
        "Rule 114B / Sec 139A IT Act",
        "NPCI Circular on UPI Fraud Mitigation"
      ]
    }
  };
}

export function generateI4CTicket(txn) {
  return {
    ticket_id: `I4C-CFCFRMS-1930-${Math.floor(Date.now() / 1000)}`,
    target_vpa: txn.receiver_vpa,
    target_bank: txn.receiver_bank,
    amount: txn.amount,
    mandate: "IMMEDIATE_DEBIT_FREEZE_UNDER_CRPC_91"
  };
}

export function exportTransactionsToCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const headers = [
    "Transaction ID",
    "Timestamp",
    "Sender Account",
    "Sender Name",
    "Sender VPA",
    "Sender Bank",
    "Receiver Account",
    "Receiver Name",
    "Receiver VPA",
    "Receiver Bank",
    "Amount (INR)",
    "Payment Rail",
    "City",
    "Risk Score",
    "Risk Level",
    "Recommended Action",
    "Action Details",
    "Remarks",
    "Scenario"
  ];

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map((t) => [
    escapeCSV(t.txn_id),
    escapeCSV(t.timestamp),
    escapeCSV(t.sender_account),
    escapeCSV(t.sender_name),
    escapeCSV(t.sender_vpa),
    escapeCSV(t.sender_bank),
    escapeCSV(t.receiver_account),
    escapeCSV(t.receiver_name),
    escapeCSV(t.receiver_vpa),
    escapeCSV(t.receiver_bank),
    t.amount,
    escapeCSV(t.rail),
    escapeCSV(t.city),
    t.risk_score,
    escapeCSV(t.risk_level),
    escapeCSV(t.recommended_action),
    escapeCSV(t.action_text),
    escapeCSV(t.remarks),
    escapeCSV(t.scenario)
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `kavach_fraud_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
