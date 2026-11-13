"""
Synthetic Indian Banking Transaction Generator for Kavach-Bharat AI.
Simulates high-fidelity Indian financial transactions including UPI, IMPS, NEFT, and RTGS,
with authentic behavioral baselines and realistic fraud typologies.
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

BANKS = [
    {"name": "HDFC Bank", "code": "HDFC", "ifsc_prefix": "HDFC000"},
    {"name": "State Bank of India", "code": "SBI", "ifsc_prefix": "SBIN000"},
    {"name": "ICICI Bank", "code": "ICICI", "ifsc_prefix": "ICIC000"},
    {"name": "Axis Bank", "code": "AXIS", "ifsc_prefix": "UTIB000"},
    {"name": "Punjab National Bank", "code": "PNB", "ifsc_prefix": "PUNB000"},
    {"name": "Kotak Mahindra Bank", "code": "KOTAK", "ifsc_prefix": "KKBK000"}
]

UPI_HANDLES = ["okhdfcbank", "oksbi", "okaxis", "icici", "paytm", "ybl"]

INDIAN_NAMES = [
    "Aarav Sharma", "Priya Nair", "Rohan Mehta", "Sunita Devi", "Vikram Singh",
    "Ananya Iyer", "Rajesh Patel", "Deepak Verma", "Kavita Reddy", "Amitabh Joshi",
    "Pooja Deshmukh", "Suresh Kumar", "Neha Choudhury", "Arjun Das", "Meera Pillai",
    "Manoj Tiwari", "Swati Kulkarni", "Harish Rao", "Divya Menon", "Gaurav Bansal"
]

CITIES = ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]

ACCOUNT_TYPES = ["Savings", "Salary", "Current", "Jan_Dhan_PMJDY"]


class IndianBankingDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.accounts = self._initialize_accounts(60)

    def _initialize_accounts(self, count: int) -> List[Dict[str, Any]]:
        accounts = []
        for i in range(count):
            bank = random.choice(BANKS)
            name = INDIAN_NAMES[i % len(INDIAN_NAMES)]
            first_name = name.split()[0].lower()
            acc_num = f"{random.randint(1000000000, 9999999999)}"
            handle = random.choice(UPI_HANDLES)
            vpa = f"{first_name}.{random.randint(10, 99)}@{handle}"
            acc_type = random.choice(ACCOUNT_TYPES)
            is_senior = random.random() < 0.20
            
            # Baseline volume
            avg_txn = 1500 if acc_type != "Jan_Dhan_PMJDY" else 400
            
            accounts.append({
                "account_id": f"ACC_{bank['code']}_{acc_num[-4:]}",
                "account_number": acc_num,
                "holder_name": name,
                "bank": bank["name"],
                "bank_code": bank["code"],
                "ifsc": f"{bank['ifsc_prefix']}{random.randint(1000, 9999)}",
                "vpa": vpa,
                "account_type": acc_type,
                "city": random.choice(CITIES),
                "is_senior_citizen": is_senior,
                "is_dormant": random.random() < 0.15 if acc_type == "Jan_Dhan_PMJDY" else False,
                "balance": random.randint(5000, 350000) if acc_type != "Jan_Dhan_PMJDY" else random.randint(100, 4500),
                "device_fingerprint": f"dev_in_{random.randint(10000, 99999)}",
                "avg_txn_amount": avg_txn,
                "risk_profile": "Normal"
            })
        return accounts

    def generate_normal_transaction(self) -> Dict[str, Any]:
        sender = random.choice(self.accounts)
        receiver = random.choice([a for a in self.accounts if a["account_id"] != sender["account_id"]])
        
        # Realistic Indian payment distribution: 95% everyday UPI/IMPS (₹60 - ₹4,200), 5% standard utility/salary
        if random.random() < 0.95:
            amount = round(random.uniform(60, 4200), 2)
            rail = "UPI" if random.random() < 0.90 else "IMPS"
        else:
            amount = round(random.uniform(5000, 24000), 2)
            rail = random.choice(["IMPS", "NEFT"])

        timestamp = datetime.now() - timedelta(minutes=random.randint(1, 180))

        return {
            "txn_id": f"TXN_IN_{int(time.time()*1000)}_{random.randint(100, 999)}",
            "sender_account": sender["account_id"],
            "sender_name": sender["holder_name"],
            "sender_vpa": sender["vpa"],
            "sender_bank": sender["bank"],
            "receiver_account": receiver["account_id"],
            "receiver_name": receiver["holder_name"],
            "receiver_vpa": receiver["vpa"],
            "receiver_bank": receiver["bank"],
            "amount": amount,
            "currency": "INR",
            "rail": rail,
            "timestamp": timestamp.isoformat(),
            "channel": "MOBILE_APP" if rail == "UPI" else "NET_BANKING",
            "device_id": sender["device_fingerprint"],
            "city": sender["city"],
            "scenario": "LEGITIMATE",
            "is_fraud": False,
            "remarks": random.choice(["Chai & Snacks", "Grocery Store", "Rent Payment", "Monthly Utility", "Dinner with Friends", "Medical Bill", "Book Purchase"])
        }

    def generate_attack_scenario(self, scenario_type: str) -> List[Dict[str, Any]]:
        """
        Inject high-fidelity Indian fraud scenarios.
        """
        txns = []
        now = datetime.now()

        if scenario_type == "DIGITAL_ARREST":
            # Senior citizen coerced by fake CBI/Police into high-value RTGS transfers
            victim = next((a for a in self.accounts if a["is_senior_citizen"] and a["account_type"] != "Jan_Dhan_PMJDY"), self.accounts[0])
            mule1 = random.choice(self.accounts)
            mule2 = random.choice(self.accounts)
            
            amounts = [450000.0, 680000.0, 950000.0]
            for i, amt in enumerate(amounts):
                txns.append({
                    "txn_id": f"TXN_ARREST_{int(time.time()*1000)}_{i}",
                    "sender_account": victim["account_id"],
                    "sender_name": victim["holder_name"],
                    "sender_vpa": victim["vpa"],
                    "sender_bank": victim["bank"],
                    "receiver_account": mule1["account_id"] if i < 2 else mule2["account_id"],
                    "receiver_name": "CBI Security Escrow Acct",
                    "receiver_vpa": f"clearance.rbi.{i}@upi",
                    "receiver_bank": "State Bank of India",
                    "amount": amt,
                    "currency": "INR",
                    "rail": "RTGS",
                    "timestamp": (now + timedelta(minutes=i*4)).isoformat(),
                    "channel": "NET_BANKING",
                    "device_id": victim["device_fingerprint"],
                    "city": "Mumbai",
                    "scenario": "DIGITAL_ARREST",
                    "is_fraud": True,
                    "remarks": "Urgent Clearance for Supreme Court Case"
                })

        elif scenario_type == "JAN_DHAN_SMURFING":
            # Multi-account smurfing structuring just below ₹50k PAN mandatory declaration threshold
            dormant_jan_dhan = [a for a in self.accounts if a["account_type"] == "Jan_Dhan_PMJDY"][:5]
            if len(dormant_jan_dhan) < 3:
                dormant_jan_dhan = self.accounts[:4]
            
            aggregator = random.choice(self.accounts)
            # Structuring amounts specifically just below 50,000 INR
            struct_amounts = [49500.0, 48900.0, 49800.0, 49250.0, 49000.0]
            
            for i, acc in enumerate(dormant_jan_dhan):
                txns.append({
                    "txn_id": f"TXN_SMURF_{int(time.time()*1000)}_{i}",
                    "sender_account": "ACC_SYNDICATE_MULE",
                    "sender_name": "P2P Gaming Gateway",
                    "sender_vpa": "fastcash.payout@ybl",
                    "sender_bank": "Kotak Mahindra Bank",
                    "receiver_account": acc["account_id"],
                    "receiver_name": acc["holder_name"],
                    "receiver_vpa": acc["vpa"],
                    "receiver_bank": acc["bank"],
                    "amount": struct_amounts[i % len(struct_amounts)],
                    "currency": "INR",
                    "rail": "UPI",
                    "timestamp": (now + timedelta(minutes=i*2)).isoformat(),
                    "channel": "MOBILE_APP",
                    "device_id": f"dev_unregistered_{random.randint(100, 999)}",
                    "city": "Jamtara",
                    "scenario": "JAN_DHAN_SMURFING",
                    "is_fraud": True,
                    "remarks": "Commission Task Payout"
                })

        elif scenario_type == "UPI_COLLECT_TRAP":
            # Reverse QR / Collect Request Trap: "Enter PIN to receive ₹25,000 refund"
            victim = random.choice(self.accounts)
            fraudster_vpa = "refund.department.paytm@paytm"
            txns.append({
                "txn_id": f"TXN_COLLECT_{int(time.time()*1000)}",
                "sender_account": victim["account_id"],
                "sender_name": victim["holder_name"],
                "sender_vpa": victim["vpa"],
                "sender_bank": victim["bank"],
                "receiver_account": "ACC_FRAUD_COLLECT",
                "receiver_name": "Customer Care Refund Desk",
                "receiver_vpa": fraudster_vpa,
                "receiver_bank": "Paytm Payments Bank",
                "amount": 24999.0,
                "currency": "INR",
                "rail": "UPI_COLLECT",
                "timestamp": now.isoformat(),
                "channel": "UPI_COLLECT_REQUEST",
                "device_id": f"dev_fraud_{random.randint(100, 999)}",
                "city": "Mewat",
                "scenario": "UPI_COLLECT_TRAP",
                "is_fraud": True,
                "remarks": "REFUND APPROVAL - ENTER PIN TO RECEIVE"
            })

        elif scenario_type == "CIRCULAR_LAYERING":
            # Circular layering: A -> B -> C -> D -> A (Wash trading / laundering)
            chain = self.accounts[:4]
            laundering_amount = 350000.0
            for i in range(len(chain)):
                src = chain[i]
                dst = chain[(i + 1) % len(chain)]
                txns.append({
                    "txn_id": f"TXN_CYCLE_{int(time.time()*1000)}_{i}",
                    "sender_account": src["account_id"],
                    "sender_name": src["holder_name"],
                    "sender_vpa": src["vpa"],
                    "sender_bank": src["bank"],
                    "receiver_account": dst["account_id"],
                    "receiver_name": dst["holder_name"],
                    "receiver_vpa": dst["vpa"],
                    "receiver_bank": dst["bank"],
                    "amount": laundering_amount - (i * 2500), # Slight fee reduction per hop
                    "currency": "INR",
                    "rail": "IMPS",
                    "timestamp": (now + timedelta(minutes=i*3)).isoformat(),
                    "channel": "NET_BANKING",
                    "device_id": f"dev_proxy_{i}",
                    "city": "Delhi NCR",
                    "scenario": "CIRCULAR_LAYERING",
                    "is_fraud": True,
                    "remarks": "Consultancy invoice settlement"
                })

        return txns


if __name__ == "__main__":
    gen = IndianBankingDataGenerator()
    print(f"Generated {len(gen.accounts)} Indian test accounts.")
    sample = gen.generate_normal_transaction()
    print("Normal Sample:", sample)
    attack = gen.generate_attack_scenario("DIGITAL_ARREST")
    print(f"Generated Digital Arrest attack with {len(attack)} hops.")
