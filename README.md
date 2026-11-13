# 🛡️ Kavach-Bharat AI (कवच-भारत)
### *Intelligent Financial Fraud Detection & Anti-Money Laundering (AML) System for Digital India*

[![Compliance](https://img.shields.io/badge/Regulatory_Compliance-NPCI_•_RBI_•_FIU--IND-emerald?style=for-the-badge)](https://fiuindia.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_•_Python_3.12-blue?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_•_Vite_•_Tailwind-indigo?style=for-the-badge&logo=react)](https://react.dev/)
[![ML](https://img.shields.io/badge/AI/ML-Isolation_Forest_•_NetworkX-amber?style=for-the-badge&logo=scikitlearn)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)](LICENSE)

---

## 🇮🇳 Executive Summary & Challenge Alignment

With over **14+ Billion monthly UPI transactions** exceeding ₹20 Lakh Crore in value, India is the world leader in real-time payments. However, instant settlement via UPI, IMPS, and RTGS has introduced sophisticated financial crime vectors where funds are layered and cashed out within **90 seconds** across multi-tier mule accounts.

**Kavach-Bharat AI (कवach)** is an enterprise-grade, intelligent financial security defense engine built specifically to protect the Indian digital payment ecosystem. It unifies **regulatory rule engines, unsupervised machine learning, graph network topology analysis, explainable AI (XAI)**, and **automated compliance reporting** into a high-speed real-time dashboard.

---

## 🎯 Core Problem Statement Coverage

| Challenge Objective | Kavach-Bharat AI Implementation |
|:---|:---|
| **1. Fraud Detection** | Real-time classification of anomalous UPI collect requests, remote APK screen-sharing takeovers, and coercion scams. |
| **2. Anomaly Detection** | **Isolation Forest** unsupervised modeling trained on consumer behavioral baselines (velocity, amount, timing, device ID). |
| **3. Anti-Money Laundering (AML)** | Directed graph topological analysis identifying **circular layering loops (A➔B➔C➔A)** and **mule aggregation hubs**. |
| **4. Risk Assessment & Scoring** | Dynamic **0–100 Risk Scoring Index** categorized into Low (Allow), Medium (Cooling Period), High (Hold), and Critical (Lien). |
| **5. Real-Time Monitoring** | Sub-50ms ingestion and evaluation pipeline with live streaming feeds and instant alerts. |
| **6. Explainable AI (XAI)** | **SHAP-style factor attributions** + dual-language audit narratives in **English** and **Hinglish/Hindi** for branch managers. |
| **7. Security Dashboard** | Interactive Force-Directed Canvas network graph, 1-click Indian fraud simulator, and regulatory STR generation. |

---

## ⚡ Real-World Indian Fraud Vectors Detected

1. **🚨 Digital Arrest Extortion (CBI / Mumbai Police Impersonation)**
   - *Threat*: Senior citizens coerced via fake video calls into transferring life savings via rapid RTGS/IMPS to "clearing escrows".
   - *Detection*: Baseline velocity divergence (10x jump) + coercion keywords (`cbi`, `supreme court`, `clearance`, `rbi`) + high-value RTGS alert.
2. **⚡ Jan Dhan Mule Smurfing (Section 139A IT Act Evasion)**
   - *Threat*: Cyber-syndicates structuring transfers at **₹48,900 – ₹49,850** into dormant PMJDY accounts to avoid mandatory PAN declaration.
   - *Detection*: Sub-₹50k PAN evasion rule + dormant account reactivation + fan-in consolidation.
3. **🛑 UPI Reverse QR & Collect Request Trap**
   - *Threat*: Deceptive collect requests falsely claiming *"Enter UPI PIN to receive ₹25,000 refund"*.
   - *Detection*: Inverted transaction direction + suspicious merchant handle + PIN reversal heuristics.
4. **🔄 Circular Hawala Layering (Topology Round-Tripping)**
   - *Threat*: Funds bounced across 4 accounts (`A ➔ B ➔ C ➔ D ➔ A`) with fee subtractions to obscure illicit criminal proceeds.
   - *Detection*: Directed graph cycle traversal finding closed loops in under 5ms.

---

## 🏗️ System Architecture

```
                       INCOMING REAL-TIME TRANSACTION STREAM
                         (UPI / IMPS / NEFT / RTGS / Collect)
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │   Indian Banking Feature Pipeline     │
                     │  (VPA, Bank Code, IFSC, PAN Threshold)│
                     └───────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 1. Indian Rule Engine   │  │ 2. Unsupervised ML Core │  │ 3. NetworkX Graph Engine│
│ - Sub-₹50k Structuring  │  │ - Isolation Forest      │  │ - Directed Cycle Loops  │
│ - UPI Collect Reversal  │  │ - Velocity Outliers     │  │ - Mule Fan-In / Out Hubs│
│ - Jamtara/Mewat Hotspot │  │ - Distribution Distance │  │ - Multi-Hop Layering    │
└────────────┬────────────┘  └───────────┬─────────────┘  └───────────┬─────────────┘
             │                           │                            │
             └───────────────────────────┼────────────────────────────┘
                                         ▼
                     ┌───────────────────────────────────────┐
                     │       Dynamic Risk Aggregator         │
                     │  (0 - 100 Multi-Dimensional Score)   │
                     └───────────────────┬───────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       Explainable AI (XAI) Engine    │  │       Regulatory Action Engine       │
│ • SHAP Factor Weight Breakdown       │  │ • I4C 1930 "Golden Hour" Lien Ticket │
│ • English Compliance Audit Narrative │  │ • FIU-IND STR (Form PMLA-12) Exporter│
│ • Hinglish Branch Officer Guidance   │  │ • NPCI Switch Debit-Freeze Mandate   │
└──────────────────┬───────────────────┘  └──────────────────┬───────────────────┘
                   │                                         │
                   └─────────────────────┬───────────────────┘
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │       KAVACH-BHARAT INTERACTIVE DASHBOARD      │
                 │ • Force-Directed Canvas Money Flow Graph       │
                 │ • 1-Click Indian Fraud Attack Simulator        │
                 │ • Real-time Transaction Stream & Alert Feeds   │
                 └────────────────────────────────────────────────┘
```

---

## 🏛️ Regulatory & Statutory Integration

- **Financial Intelligence Unit - India (FIU-IND)**: 1-click automated generation and download of **Suspicious Transaction Reports (STR)** formatted under **PMLA Section 12** and Rule 3 of PML Rules 2005.
- **I4C & CFCFRMS (1930 Helpline)**: Instant dispatch of **Golden-Hour Inter-Bank Lien Tickets** under CrPC Section 91 to freeze beneficiary accounts before funds reach an ATM or crypto P2P exchange.
- **RBI Master Directions (July 2024 update)**: Enforces Early Warning Signals (EWS) and mandatory beneficiary cooling periods.

---

## 🚀 Quickstart & Installation

### Option 1: Standalone Web Dashboard (Instant Run / Live Demo)
The frontend includes a self-contained high-fidelity simulation engine that runs 100% in-browser with zero backend dependencies.

```bash
# Clone the repository
git clone https://github.com/<your-username>/kavach-bharat-ai.git
cd kavach-bharat-ai/frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Dashboard opens on http://localhost:3000
```

### Option 2: Full-Stack with Python FastAPI Engine
```bash
# In terminal 1: Run Python AI/ML Backend
cd backend
python -m pip install -r requirements.txt
python main.py
# Backend API available at http://127.0.0.1:8000 (Swagger docs at /docs)

# In terminal 2: Run Frontend
cd ../frontend
npm run dev
```

---

## 🧪 Testing the Attack Simulator

1. Launch the dashboard.
2. Click on any of the **4 Indian Fraud Attack Triggers**:
   - Click **"Inject Digital Arrest"**: Watch 3 rapid high-value RTGS transfers get flagged with a `86/100 CRITICAL` score.
   - Click **"Inject Smurfing Ring"**: See 5 sub-₹50k transfers get flagged for Section 139A PAN evasion.
   - Click **"Inject Circular Loop"**: Watch the **Force-Directed Graph** light up a closed circular cycle (`A ➔ B ➔ C ➔ D ➔ A`) in glowing purple!
3. Click any flagged transaction to inspect the **Explainable AI (XAI) Drawer**, view the **Hinglish** summary, and click **"Export FIU-IND STR"**.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, Scikit-Learn, NetworkX, NumPy, Pandas, Pydantic.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, HTML5 Canvas Physics Engine.
- **Standards**: NPCI UPI Specifications, RBI EWS Guidelines, FIU-IND STR Schema, I4C CFCFRMS 1930.

---

## 📜 License & Acknowledgements
Developed for the Intelligent Financial Fraud Detection and Anti-Money Laundering System Challenge. Licensed under the MIT License.
