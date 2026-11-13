"""
Database Persistence Layer for Kavach-Bharat AI.
Supports local persistent SQLite by default and cloud PostgreSQL (Supabase / Neon)
via DATABASE_URL environment variable.
"""

import os
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "kavach_sentinel.db")


class KavachDatabase:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Accounts Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    account_id TEXT PRIMARY KEY,
                    account_number TEXT,
                    holder_name TEXT,
                    bank_name TEXT,
                    bank_code TEXT,
                    ifsc TEXT,
                    vpa TEXT,
                    account_type TEXT,
                    city TEXT,
                    is_senior INTEGER DEFAULT 0,
                    balance REAL DEFAULT 0.0,
                    risk_profile TEXT DEFAULT 'Normal',
                    is_frozen INTEGER DEFAULT 0,
                    freeze_reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Ensure is_frozen column exists if table was created previously
            try:
                cursor.execute("ALTER TABLE accounts ADD COLUMN is_frozen INTEGER DEFAULT 0")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE accounts ADD COLUMN freeze_reason TEXT")
            except Exception:
                pass

            # Transactions Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    txn_id TEXT PRIMARY KEY,
                    sender_account TEXT,
                    sender_name TEXT,
                    sender_vpa TEXT,
                    sender_bank TEXT,
                    receiver_account TEXT,
                    receiver_name TEXT,
                    receiver_vpa TEXT,
                    receiver_bank TEXT,
                    amount REAL,
                    currency TEXT DEFAULT 'INR',
                    rail TEXT,
                    channel TEXT,
                    city TEXT,
                    timestamp TEXT,
                    remarks TEXT,
                    scenario TEXT,
                    risk_score INTEGER,
                    risk_level TEXT,
                    recommended_action TEXT,
                    action_text TEXT,
                    explainability_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Alerts Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fraud_alerts (
                    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    txn_id TEXT UNIQUE,
                    risk_score INTEGER,
                    risk_level TEXT,
                    status TEXT DEFAULT 'NEW',
                    action_taken TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (txn_id) REFERENCES transactions (txn_id)
                )
            """)

            # Compliance STR Reports Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS compliance_reports (
                    report_id TEXT PRIMARY KEY,
                    txn_id TEXT,
                    report_type TEXT,
                    fiu_batch_reference TEXT,
                    report_payload_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()

    def save_account(self, acc: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO accounts 
                (account_id, account_number, holder_name, bank_name, bank_code, ifsc, vpa, account_type, city, is_senior, balance, risk_profile)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                acc.get("account_id"),
                acc.get("account_number", ""),
                acc.get("holder_name") or acc.get("name"),
                acc.get("bank") or acc.get("bank_name"),
                acc.get("bank_code", ""),
                acc.get("ifsc", ""),
                acc.get("vpa", ""),
                acc.get("account_type") or acc.get("type", "Savings"),
                acc.get("city", "Mumbai"),
                1 if acc.get("is_senior_citizen") or acc.get("isSenior") else 0,
                float(acc.get("balance", 0.0)),
                acc.get("risk_profile", "Normal")
            ))
            conn.commit()

    def save_transaction(self, txn: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            explainability_str = json.dumps(txn.get("explainability", {}))
            cursor.execute("""
                INSERT OR REPLACE INTO transactions 
                (txn_id, sender_account, sender_name, sender_vpa, sender_bank,
                 receiver_account, receiver_name, receiver_vpa, receiver_bank,
                 amount, currency, rail, channel, city, timestamp, remarks,
                 scenario, risk_score, risk_level, recommended_action, action_text, explainability_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                txn["txn_id"],
                txn.get("sender_account", ""),
                txn.get("sender_name", ""),
                txn.get("sender_vpa", ""),
                txn.get("sender_bank", ""),
                txn.get("receiver_account", ""),
                txn.get("receiver_name", ""),
                txn.get("receiver_vpa", ""),
                txn.get("receiver_bank", ""),
                float(txn.get("amount", 0)),
                txn.get("currency", "INR"),
                txn.get("rail", "UPI"),
                txn.get("channel", "MOBILE_APP"),
                txn.get("city", "Mumbai"),
                txn.get("timestamp", datetime.now().isoformat()),
                txn.get("remarks", ""),
                txn.get("scenario", "LEGITIMATE"),
                int(txn.get("risk_score", 10)),
                txn.get("risk_level", "LOW"),
                txn.get("recommended_action", "ALLOW"),
                txn.get("action_text", "Authorized"),
                explainability_str
            ))

            # If risk is High or Critical, also save to fraud_alerts
            if int(txn.get("risk_score", 0)) >= 60:
                cursor.execute("""
                    INSERT OR IGNORE INTO fraud_alerts (txn_id, risk_score, risk_level, status, action_taken)
                    VALUES (?, ?, ?, 'NEW', ?)
                """, (txn["txn_id"], int(txn.get("risk_score", 0)), txn.get("risk_level", "HIGH"), txn.get("action_text", "")))

            # AUTOMATIC LEGAL FREEZE: If risk score >= 80 (Critical), directly freeze the recipient account
            if int(txn.get("risk_score", 0)) >= 80:
                rec_acc = txn.get("receiver_account")
                if rec_acc:
                    cursor.execute("""
                        UPDATE accounts
                        SET is_frozen = 1, risk_profile = 'FROZEN', freeze_reason = ?
                        WHERE account_id = ?
                    """, (f"Auto-Lien CrPC 91 on Txn {txn['txn_id']}: {txn.get('action_text', 'Critical Fraud')}", rec_acc))

            conn.commit()

    def freeze_account(self, account_id: str, reason: str = "PMLA Sec 17 / CrPC 91 Freeze Order"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE accounts
                SET is_frozen = 1, risk_profile = 'FROZEN', freeze_reason = ?
                WHERE account_id = ?
            """, (reason, account_id))
            conn.commit()

    def unfreeze_account(self, account_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE accounts
                SET is_frozen = 0, risk_profile = 'Normal', freeze_reason = NULL
                WHERE account_id = ?
            """, (account_id,))
            conn.commit()

    def is_account_frozen(self, account_id: str) -> bool:
        if not account_id:
            return False
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT is_frozen FROM accounts WHERE account_id = ?", (account_id,))
            row = cursor.fetchone()
            return bool(row and row["is_frozen"])

    def get_frozen_account_ids(self) -> List[str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT account_id FROM accounts WHERE is_frozen = 1")
            return [r["account_id"] for r in cursor.fetchall()]

    def export_transactions_csv(self) -> str:
        import csv
        import io
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
            rows = cursor.fetchall()
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "txn_id", "timestamp", "sender_account", "sender_name", "sender_vpa", "sender_bank",
                "receiver_account", "receiver_name", "receiver_vpa", "receiver_bank",
                "amount", "currency", "rail", "channel", "city", "remarks",
                "scenario", "risk_score", "risk_level", "recommended_action", "action_text"
            ])
            for r in rows:
                writer.writerow([
                    r["txn_id"], r["timestamp"], r["sender_account"], r["sender_name"], r["sender_vpa"], r["sender_bank"],
                    r["receiver_account"], r["receiver_name"], r["receiver_vpa"], r["receiver_bank"],
                    r["amount"], r["currency"], r["rail"], r["channel"], r["city"], r["remarks"],
                    r["scenario"], r["risk_score"], r["risk_level"], r["recommended_action"], r["action_text"]
                ])
            return output.getvalue()

    def get_recent_transactions(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                if item.get("explainability_json"):
                    try:
                        item["explainability"] = json.loads(item["explainability_json"])
                    except Exception:
                        item["explainability"] = {}
                results.append(item)
            return results

    def get_fraud_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT t.*, a.status as alert_status, a.action_taken
                FROM fraud_alerts a
                JOIN transactions t ON a.txn_id = t.txn_id
                ORDER BY a.created_at DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                if item.get("explainability_json"):
                    try:
                        item["explainability"] = json.loads(item["explainability_json"])
                    except Exception:
                        item["explainability"] = {}
                results.append(item)
            return results

    def save_compliance_report(self, report_id: str, txn_id: str, report_type: str, payload: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO compliance_reports
                (report_id, txn_id, report_type, fiu_batch_reference, report_payload_json)
                VALUES (?, ?, ?, ?, ?)
            """, (
                report_id,
                txn_id,
                report_type,
                payload.get("report_header", {}).get("fiu_batch_reference", ""),
                json.dumps(payload)
            ))
            conn.commit()


# Singleton database instance
db = KavachDatabase()
