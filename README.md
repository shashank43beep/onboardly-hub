# 🚀 Onboardly

> **Modern Client Onboarding & Operations Platform with Autonomous Revenue Recovery.**

Onboardly empowers creative agencies and services businesses to streamline client onboarding, collect assets, manage intake forms, and automatically recover failed or abandoned revenue through an autonomous, bounded AI recovery agent.

---

## ✨ Features at a Glance

- **🎨 Client Portals**: Customizable client onboarding portals with custom branding, welcome screens, and real-time step trackers.
- **📋 Intake Form Builder**: Dynamic question builder supporting text, select, multi-select, and file upload questions.
- **💳 Payment Integration**: Direct integration with payment gateways (Razorpay & Stripe) for upfront deposit and retainer collections.
- **👥 Multi-User Team Management**: Invite team members, manage permissions, and assign client portal ownership.
- **🤖 Autonomous Revenue Recovery Agent**: Smart, bounded payment recovery engine that prevents revenue leakage while enforcing strict client-relationship guardrails.

---

## 🤖 Autonomous Revenue Recovery Agent

The **Onboardly Revenue Recovery Agent** is an explainable, bounded AI engine that resolves payment failures, abandoned checkouts, and overdue invoices without spamming clients or triggering processor penalties.

### 📌 Architecture & Core Principles

```
                       ┌───────────────────────────────┐
                       │   Failed / Overdue Event     │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │    Bounded Policy Engine        │
                      │  - Max 3 Retries                │
                      │  - Max 3 Reminders              │
                      │  - ₹50,000 High-Value Threshold │
                      └──────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
        [Safe & Within Limits]                  [Guardrail Triggered]
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │   Autonomous Action     │             │    Gated Escalation     │
    │  - Smart Payout Retry   │             │  - Human Signoff        │
    │  - 1-Click Recovery Link│             │  - Account Manager Alert│
    │  - Method Update Prompt │             │  - Audit Reason Logged  │
    └────────────┬────────────┘             └────────────┬────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────────┐
                      │   Immutable Audit Trail Table   │
                      │       `recovery_actions`        │
                      └─────────────────────────────────┘
```

### 🛡️ Safety Guardrails

1. **Bounded Automated Retries (`MAX_RETRIES = 3`)**: Prevents repetitive gateway charges that trigger card issuer blocks.
2. **Bounded Communication (`MAX_REMINDERS = 3`)**: Halts automated messages after 3 unacknowledged notifications to avoid inbox fatigue.
3. **High-Value Gating (`HIGH_VALUE_THRESHOLD = ₹50,000`)**: Large payments are automatically gated from automated retries and escalated to human account managers.
4. **Explainable Audit Trail**: Every single decision—whether executed or gated—records a human-readable justification (`reasoning`) and exact state snapshot in `recovery_actions`.

### ⚡ Recovery Strategies by Failure Type

| Failure Reason | Recovery Strategy | Bounding Rule |
| :--- | :--- | :--- |
| `insufficient_funds` | Smart retry synchronized with payout windows | Max 3 retries; escalates if exhausted |
| `card_declined` | Direct retries blocked; sends secure payment method update link | Max 3 reminders; escalates if unchanged |
| `mandate_expired` | Sends automated 1-tap e-Mandate re-authorization link | Max 3 reminders; escalates to human |
| `checkout_abandoned` | Sends 1-click personalized checkout recovery link | Max 3 reminders |
| `network_error` | Immediate idempotent gateway retry | Max 3 retries |
| `client_unresponsive` | Polite overdue reminders with portal link | Max 3 reminders; escalates to account manager |
| *High-Value (≥₹50k)* | Gated from auto-retry; immediate human escalation | ₹50,000 threshold |

---

## 🖥️ Live Dashboard (`/dashboard/recovery`)

Access the interactive recovery dashboard inside Onboardly:
- **📊 Real-time KPI Cards**: Total recovered revenue (₹), recovery rate (%), recovered invoice count, and gated safety escalations.
- **🔄 Batch Selector**: Seamlessly switch between demo batches or live test runs.
- **📋 Live Transactions Table**: Filter by status (`Paid`, `Failed`, `Escalated`, `Abandoned`) with real-time retry/reminder counters.
- **🔍 Explainable Audit Trail**: Inspect each agent decision, underlying trigger, plain-English reasoning, and safety guardrails.

---

## 🗄️ Database Schema (`supabase/migrations/`)

- **`recovery_batches`**: Tracks batch-level metrics (total transactions, recovered count, recovered amount in INR, unresolved count, start/completion timestamps).
- **`recovery_transactions`**: Stores individual transaction records linked to client portals (`portals.id`), payment gateways (Razorpay/Stripe), retry/reminder counters, and failure statuses.
- **`recovery_actions`**: Immutable audit log capturing the agent's decision-making process for every transaction.

---

## 🚀 Quick Start & Demo Instructions

### 1. Prerequisites & Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed a Synthetic Recovery Batch
Generate a demo batch of 40 transactions across diverse failure modes:
```bash
npx tsx scripts/seed-batch.ts 40
```
*Outputs the generated `batch_id`.*

### 4. Run the Autonomous Recovery Agent
Execute the recovery policy engine against the seeded batch:
```bash
npx tsx scripts/run-batch.ts <batch_id>
```

### 5. Launch the Web Application
```bash
npm run dev
```
Navigate to `http://localhost:5173/dashboard/recovery` to inspect the batch results in the interactive dashboard.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Routing & State**: TanStack Router, TanStack React Query
- **Backend & Database**: Supabase (PostgreSQL, Row-Level Security, Realtime)
- **Email & Automation**: Resend API, Webhooks
- **Tooling**: `tsx`, ESLint, Prettier
