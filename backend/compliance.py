"""
Regulatory Compliance and Reporting Engine for Kavach-Bharat AI.
Generates FIU-IND Suspicious Transaction Reports (STR) under PMLA guidelines,
and I4C 1930 CFCFRMS Golden-Hour Inter-bank Lien payloads.
"""

from typing import Dict, Any
from datetime import datetime


class IndianComplianceReporting:
    @staticmethod
    def generate_fiu_ind_str(txn: Dict[str, Any], evaluation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Suspicious Transaction Report (STR) compliant with FIU-IND schema.
        Reference: Financial Intelligence Unit - India (FIU-IND) Guidelines under PML Rules, 2005.
        """
        now = datetime.now()
        report_id = f"FIU-IND-STR-{now.strftime('%Y%m%d')}-{txn['txn_id'][-8:]}"

        factors = evaluation.get("explainability", {}).get("factors", [])
        reasons_for_suspicion = [f["factor"] + ": " + f["description"] for f in factors]

        return {
            "report_header": {
                "report_id": report_id,
                "report_type": "STR_PMLA_SEC_12",
                "reporting_entity": "Kavach-Bharat Central Sentinel",
                "reporting_entity_category": "SCHEDULED_COMMERCIAL_BANK / PAYMENT_SYSTEM_OPERATOR",
                "submission_timestamp": now.isoformat(),
                "fiu_batch_reference": f"BATCH_{now.strftime('%Y%m')}_PRIORITY_1"
            },
            "transaction_details": {
                "transaction_id": txn.get("txn_id"),
                "date_time": txn.get("timestamp"),
                "transaction_type": txn.get("rail"),
                "amount_inr": txn.get("amount"),
                "channel": txn.get("channel"),
                "currency": "INR",
                "originating_city": txn.get("city", "Unknown")
            },
            "sender_kyc": {
                "account_id": txn.get("sender_account"),
                "full_name": txn.get("sender_name"),
                "vpa": txn.get("sender_vpa"),
                "bank": txn.get("sender_bank"),
                "kyc_risk_category": "ENHANCED_DUE_DILIGENCE" if evaluation.get("risk_score", 0) > 70 else "STANDARD"
            },
            "beneficiary_details": {
                "account_id": txn.get("receiver_account"),
                "full_name": txn.get("receiver_name"),
                "vpa": txn.get("receiver_vpa"),
                "bank": txn.get("receiver_bank")
            },
            "suspicion_grounds": {
                "risk_score": evaluation.get("risk_score"),
                "risk_category": evaluation.get("risk_level"),
                "reasons": reasons_for_suspicion,
                "regulatory_tags": [
                    "SECTION_139A_STRUCTURING" if any("PAN" in r for r in reasons_for_suspicion) else None,
                    "CYBER_FRAUD_COLLECT_MISUSE" if any("Reverse QR" in r for r in reasons_for_suspicion) else None,
                    "COERCION_IMPERSONATION" if any("Digital Arrest" in r for r in reasons_for_suspicion) else None,
                    "CIRCULAR_HAWALA_MOVEMENT" if any("Circular" in r for r in reasons_for_suspicion) else None
                ],
                "compliance_officer_recommendation": evaluation.get("action_text")
            }
        }

    @staticmethod
    def generate_i4c_1930_lien_ticket(txn: Dict[str, Any], evaluation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate I4C (Indian Cyber Crime Coordination Centre) CFCFRMS 1930 Golden Hour freeze ticket.
        Allows instant inter-bank lien placement to halt money movement before ATM withdrawal.
        """
        now = datetime.now()
        ticket_id = f"I4C-CFCFRMS-1930-{int(now.timestamp())}"
        
        return {
            "ticket_id": ticket_id,
            "incident_type": "INTER_BANK_GOLDEN_HOUR_LIEN",
            "priority": "CRITICAL_SEV_1",
            "timestamp": now.isoformat(),
            "target_beneficiary_vpa": txn.get("receiver_vpa"),
            "target_beneficiary_account": txn.get("receiver_account"),
            "target_bank": txn.get("receiver_bank"),
            "amount_to_freeze": txn.get("amount"),
            "originating_bank": txn.get("sender_bank"),
            "fraud_category": evaluation.get("risk_level"),
            "action_mandate": "IMMEDIATE_DEBIT_FREEZE_UNDER_CRPC_91",
            "statutory_note": "Broadcasted via National Cyber Crime Reporting Portal (NCRP) API for immediate lien."
        }
