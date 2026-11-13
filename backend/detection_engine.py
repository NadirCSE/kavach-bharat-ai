"""
Hybrid Detection and Explainable AI (XAI) Engine for Kavach-Bharat AI.
Combines Indian banking regulatory rules, behavioral heuristics, and ML anomaly detection.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest

PAN_MANDATORY_THRESHOLD = 50000.0  # Section 139A IT Act threshold
HIGH_VALUE_THRESHOLD = 200000.0    # 2 Lakhs standard threshold for enhanced due diligence

SUSPICIOUS_KEYWORDS = [
    "cbi", "supreme court", "clearance", "escrow", "digital arrest",
    "refund approval", "enter pin", "task commission", "crypto deposit",
    "vip investment", "part time telegram", "rbi verification"
]

HIGH_RISK_LOCATIONS = ["Jamtara", "Mewat", "Bharatpur"]


class KavachDetectionEngine:
    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.08, random_state=42)
        self._warmup_model()
        self.account_history: Dict[str, List[Dict[str, Any]]] = {}

    def _warmup_model(self):
        # Synthetic baseline training features: [amount, is_upi, is_weekend, velocity_5m]
        synthetic_normal = np.random.exponential(scale=1500, size=(1000, 4))
        synthetic_normal[:, 0] = np.clip(synthetic_normal[:, 0], 50, 45000)
        synthetic_normal[:, 1] = np.random.choice([0, 1], size=1000, p=[0.2, 0.8])
        synthetic_normal[:, 2] = np.random.choice([0, 1], size=1000, p=[0.7, 0.3])
        synthetic_normal[:, 3] = np.random.poisson(lam=0.4, size=1000)
        self.iso_forest.fit(synthetic_normal)

    def evaluate_transaction(self, txn: Dict[str, Any], graph_context: Dict[str, Any] = None) -> Dict[str, Any]:
        amount = float(txn["amount"])
        rail = txn.get("rail", "UPI")
        city = txn.get("city", "")
        remarks = (txn.get("remarks") or "").lower()
        sender_acc = txn.get("sender_account", "")
        receiver_acc = txn.get("receiver_account", "")
        receiver_vpa = (txn.get("receiver_vpa") or "").lower()

        # Update account history for velocity tracking
        if sender_acc not in self.account_history:
            self.account_history[sender_acc] = []
        self.account_history[sender_acc].append(txn)
        recent_txns = self.account_history[sender_acc][-5:]

        factors = []
        score = 10  # Base normal transaction noise

        # -1. Legal Enforcement: Account Freeze Check (CrPC 91 / PMLA Section 17)
        frozen_accounts = (graph_context or {}).get("frozen_accounts", set())
        if sender_acc in frozen_accounts or receiver_acc in frozen_accounts or txn.get("is_frozen"):
            frozen_party = "Sender" if sender_acc in frozen_accounts else "Receiver"
            return {
                "txn_id": txn["txn_id"],
                "risk_score": 100,
                "risk_level": "BLOCKED",
                "recommended_action": "TRANSACTION_DENIED_ACCOUNT_FROZEN",
                "action_text": f"Transaction denied: {frozen_party} account is legally FROZEN under CrPC 91 / PMLA 17. All credits & debits blocked.",
                "explainability": {
                    "factors": [{
                        "factor": "Statutory Account Lien & Freeze Enforced",
                        "weight": 100,
                        "description": f"Target account ({receiver_acc if frozen_party == 'Receiver' else sender_acc}) is under active seizure order from law enforcement."
                    }],
                    "summary_en": f"Payment denied. The {frozen_party} account is currently under legal freeze. No funds may enter or exit this account.",
                    "summary_hi": f"Transaction radd kiya gaya. {frozen_party} account kanooni roop se freeze hai. Is khate me koi bhi rashi jama ya nikali nahi ja sakti."
                }
            }

        # 0. Graph Context: Circular Flow / Mule Hub Boost (Precise edge & volume matching)
        if graph_context:
            circular_nodes = graph_context.get("circular_nodes", set())
            mule_nodes = graph_context.get("mule_nodes", set())
            if sender_acc in circular_nodes and receiver_acc in circular_nodes:
                score += 55
                factors.append({
                    "factor": "Circular Layering Loop (AML Round-Tripping)",
                    "weight": 55,
                    "description": "Both sender and receiver participate in an active closed topological cycle (A -> B -> C -> A) designed to obscure fund provenance."
                })
            elif receiver_acc in mule_nodes and amount >= 15000.0:
                score += 45
                factors.append({
                    "factor": "Mule Aggregator Inflow Volume",
                    "weight": 45,
                    "description": "Recipient account exhibits high-in-degree fan-in with rapid pass-through drain matching known mule aggregation networks."
                })

        # 1. Rule: Sub-₹50,000 Structuring (Section 139A PAN evasion)
        if 47500.0 <= amount < PAN_MANDATORY_THRESHOLD:
            score += 35
            factors.append({
                "factor": "PAN Evasion Structuring",
                "weight": 35,
                "description": f"Amount ₹{amount:,.2f} is strategically structured right below the ₹50,000 PAN reporting threshold (Sec 139A IT Act)."
            })

        # 2. Rule: UPI Collect / Reverse QR Fraud Pattern
        if rail == "UPI_COLLECT" or "enter pin" in remarks or "refund" in remarks:
            score += 40
            factors.append({
                "factor": "Reverse QR / Collect Request Trap",
                "weight": 40,
                "description": "Exploitation of UPI PIN confusion. Request formatted to deceive user into entering PIN to 'receive' money."
            })

        # 3. Rule: Digital Arrest / Law Enforcement Impersonation
        matched_kw = [kw for kw in SUSPICIOUS_KEYWORDS if kw in remarks]
        if matched_kw or "rbi" in receiver_vpa or "cbi" in receiver_vpa:
            score += 45
            factors.append({
                "factor": "Digital Arrest / Impersonation Signature",
                "weight": 45,
                "description": f"Detected high-risk legal/police coercion keywords: {', '.join(matched_kw or ['fake government handle'])}."
            })

        # 4. Rule: High-Risk Geolocation Velocity
        if city in HIGH_RISK_LOCATIONS:
            score += 20
            factors.append({
                "factor": "High-Risk Cybercrime Hub Geolocation",
                "weight": 20,
                "description": f"Transaction originating/routed via known high-density cybercrime node: {city}."
            })

        # 5. Rule: High-Value RTGS Sudden Spike
        if rail == "RTGS" and amount >= 400000.0:
            score += 25
            factors.append({
                "factor": "High-Value RTGS Outflow",
                "weight": 25,
                "description": f"Rapid liquidation via RTGS (₹{amount:,.2f}) exceeding standard baseline."
            })

        # 6. Rule: Rapid Fan-Out Dispersal to Freshly Issued / Dormant Accounts
        fan_out_nodes = (graph_context or {}).get("fan_out_nodes", set())
        is_dispersal = sender_acc in fan_out_nodes or txn.get("is_new_account", False) or "payout" in remarks or "disbursement" in remarks or "bonus" in remarks
        if sender_acc in fan_out_nodes or (len(recent_txns) >= 3 and is_dispersal):
            score += 38
            factors.append({
                "factor": "Rapid Fan-Out Dispersal to Fresh Accounts",
                "weight": 38,
                "description": "Source entity is fanning out rapid burst disbursements into newly provisioned accounts (Syndicate Dispersal Ring)."
            })

        # 7. ML Anomaly Scoring (Isolation Forest)
        try:
            feat_vector = np.array([[min(amount, 1000000), 1 if rail == "UPI" else 0, 0, len(recent_txns)]])
            ml_anomaly = self.iso_forest.decision_function(feat_vector)[0]
            if ml_anomaly < 0:
                ml_score = int(min(abs(ml_anomaly) * 40, 25))
                score += ml_score
                factors.append({
                    "factor": "Isolation Forest Behavioral Outlier",
                    "weight": ml_score,
                    "description": f"Unsupervised ML model identified severe behavioral distribution divergence (anomaly distance: {ml_anomaly:.3f})."
                })
        except Exception:
            pass

        # Normalized Risk Score (0-100)
        final_score = min(max(score, 5), 99)
        
        # Risk Category
        if final_score >= 80:
            risk_level = "CRITICAL"
            action_code = "AUTO_LIEN_1930_ALERT"
            action_text = "Place immediate Golden-Hour Lien & dispatch I4C 1930 CFCFRMS alert"
        elif final_score >= 60:
            risk_level = "HIGH"
            action_code = "HOLD_AND_VERIFY"
            action_text = "Hold transaction, trigger Biometric/Step-up 2FA & branch manager review"
        elif final_score >= 35:
            risk_level = "MEDIUM"
            action_code = "COOLING_PERIOD"
            action_text = "Enforce NPCI 30-minute cooling period for newly added beneficiary"
        else:
            risk_level = "LOW"
            action_code = "ALLOW"
            action_text = "Transaction authorized within normal behavioral parameters"

        # Generate Bilingual Explanations
        en_explanation, hi_explanation = self._generate_explanations(txn, factors, risk_level)

        return {
            "txn_id": txn["txn_id"],
            "risk_score": final_score,
            "risk_level": risk_level,
            "recommended_action": action_code,
            "action_text": action_text,
            "explainability": {
                "factors": factors,
                "summary_en": en_explanation,
                "summary_hi": hi_explanation
            }
        }

    def _generate_explanations(self, txn: Dict[str, Any], factors: List[Dict[str, Any]], risk_level: str) -> Tuple[str, str]:
        if risk_level == "LOW":
            return (
                "Transaction matches normal Indian consumer banking profile with verified device and standard velocity.",
                "Yeh transaction aam gawaahon aur normal payment patterns ke mutabiq sahi payi gayi hai."
            )

        factor_names = [f["factor"] for f in factors]
        en = f"Transaction flagged as {risk_level} risk due to: {'; '.join(factor_names)}. Immediate regulatory inspection advised."
        
        # Indian contextual Hinglish translation for bank officers
        hi_parts = []
        if any("PAN" in f for f in factor_names):
            hi_parts.append("₹50,000 PAN limit se bachne ke liye chote hisson me transfer (smurfing)")
        if any("Reverse QR" in f for f in factor_names):
            hi_parts.append("UPI PIN daal kar paisa lene ka jhaansa (reverse QR fraud)")
        if any("Digital Arrest" in f for f in factor_names):
            hi_parts.append("Fake police/CBI impersonation aur digital arrest ka shak")
        if any("Outflow" in f for f in factor_names):
            hi_parts.append("Achanak bada RTGS amount bahar bhejna")

        hi = f"Is transaction par {risk_level} khatra hai: {', '.join(hi_parts) if hi_parts else 'Asamanya payment behavior'}. Suraksha ke liye freeze kiya ja raha hai."
        return en, hi
