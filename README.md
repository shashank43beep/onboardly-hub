# 🚀 Onboardly

> **Modern Client Onboarding & Operations Platform with Autonomous Revenue Recovery.**

Onboardly empowers creative agencies and services businesses to streamline client onboarding, collect assets, manage intake forms, and automatically recover failed or abandoned revenue through an autonomous, bounded AI recovery agent.

---

## ✨ Features at a Glance

- **🎨 Client Portals**: Customizable client onboarding portals with custom branding, welcome screens, and real-time step trackers.
- **📋 Intake Form Builder**: Dynamic question builder supporting text, select, multi-select, and file upload questions.
- **💳 Payment Integration**: Direct integration with payment gateways (Razorpay & Stripe) for upfront deposit and retainer collections.
- **👥 Multi-User Team Management**: Invite team members, manage permissions, and assign client portal ownership.
- **🤖 Autonomous Revenue Recovery Agent**: Smart, bounded payment recovery engine — combining a real LLM diagnosis layer with a deterministic safety policy — that prevents revenue leakage while enforcing strict client-relationship guardrails.

---

## 🤖 Autonomous Revenue Recovery Agent

The **Onboardly Revenue Recovery Agent** is an explainable, bounded engine that resolves payment failures, abandoned checkouts, and overdue invoices without spamming clients or triggering processor penalties. It uses a real LLM to diagnose *why* a payment failed and *what to recommend* — but the LLM never has financial authority. A deterministic policy engine is the sole authority over which actions can actually execute.

### 📌 Architecture & Core Principles

```
                       ┌───────────────────────────────┐
                       │   Failed / Overdue Event       │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │      AI Diagnosis (advisory)     │
                      │  Groq LLM reads failure context  │
                      │  → diagnosis + recommended action│
                      │  + confidence + reasoning        │
                      │  (never authorizes payment       │
                      │   actions — recommendation only) │
                      └──────────────┬──────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────────┐
                      │    Bounded Policy Engine        │
                      │  - Max 3 Retries                │
                      │  - Max 3 Reminders              │
                      │  - ₹50,000 High-Value Threshold │
                      │  - AI can request escalation    │
                      │    (≥75% confidence) — but never│
                      │    request less caution         │
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
                      │  (includes AI diagnosis when     │
                      │   available)                     │
                      └─────────────────────────────────┘
```

### 🧠 AI Diagnosis Layer (Advisory Only)

Before the policy engine evaluates a transaction, `diagnoseFailure()` sends the failure context (amount, failure reason, retry/reminder history, days overdue) to a Groq-hosted LLM and asks it to return a structured diagnosis: `{ diagnosis, recommended_action, confidence, reasoning }`.

This is explicitly **advisory, not authoritative**:

- The AI's `recommended_action` only ever *tightens* the outcome — if it's ≥75% confident a case needs a human, the agent escalates, even if the deterministic gates alone wouldn't have. It can never cause the agent to retry, remind, or take any action the policy engine hasn't already permitted.
- Every existing deterministic rule (max retries, max reminders, the ₹50,000 high-value gate) runs exactly as before and always has final say.
- If the Groq API is unreachable, times out, or returns something malformed, the agent **fails safe**: it silently falls back to the original deterministic reasoning with no AI input, and the batch run completes normally either way.
- The AI's diagnosis text is prepended to the audit-trail `reasoning` field whenever available, so it's visible in the dashboard alongside the deterministic explanation — not replacing it.
- Transactions already marked `paid` skip the AI call entirely, since there's nothing to diagnose.

Reuses the same Groq API key already used by Onboardly's onboarding assistant (`GROQ_API_KEY`).

### 🛡️ Safety Guardrails

1. **Bounded Automated Retries (`MAX_RETRIES = 3`)**: Prevents repetitive gateway charges that trigger card issuer blocks.
2. **Bounded Communication (`MAX_REMINDERS = 3`)**: Halts automated messages after 3 unacknowledged notifications to avoid inbox fatigue.
3. **High-Value Gating (`HIGH_VALUE_THRESHOLD = ₹50,000`)**: Large payments are automatically gated from automated retries and escalated to human account managers.
4. **AI Diagnosis — Advisory Only**: The LLM diagnoses and recommends, but never authorizes a payment action. It can only request additional caution (escalation), never less than the deterministic policy already allows. Fails safe to deterministic-only behavior if the AI call fails.
5. **Explainable Audit Trail**: Every single decision — whether executed or gated, with or without AI input — records a human-readable justification (`reasoning`) and exact state snapshot in `recovery_actions`.

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
| *AI high-confidence escalation (≥75%)* | Gated from any automated action; immediate human escalation | AI-recommended, policy-enforced |

---

## 🖥️ Live Dashboard (`/dashboard/recovery`)

Access the interactive recovery dashboard inside Onboardly:
- **📊 Real-time KPI Cards**: Total recovered revenue (₹), recovery rate (%), recovered invoice count, and gated safety escalations.
- **🔄 Batch Selector**: Seamlessly switch between demo batches or live test runs.
- **📋 Live Transactions Table**: Filter by status (`Paid`, `Failed`, `Escalated`, `Abandoned`) with real-time retry/reminder counters.
- **🔍 Explainable Audit Trail**: Inspect each agent decision, underlying trigger, plain-English reasoning (including AI diagnosis when available), and safety guardrails.

---

## 🗄️ Database Schema (`supabase/migrations/`)

- **`recovery_batches`**: Tracks batch-level metrics (total transactions, recovered count, recovered amount in INR, unresolved count, start/completion timestamps).
- **`recovery_transactions`**: Stores individual transaction records linked to client portals (`portals.id`), payment gateways (Razorpay/Stripe), retry/reminder counters, and failure statuses.
- **`recovery_actions`**: Immutable audit log capturing the agent's decision-making process for every transaction, including the AI diagnosis when one was generated.

---

## 🚀 Quick Start & Demo Instructions

### 1. Prerequisites & Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GROQ_API_KEY=<your-groq-api-key>
```
`GROQ_API_KEY` is optional — the agent runs the full deterministic policy engine with or without it. When set, transactions get an additional AI diagnosis layered into the audit trail.

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
With `GROQ_API_KEY` set, each non-settled transaction is diagnosed by the LLM first; the terminal output and audit trail will show `AI diagnosis: "..."` prefixed reasoning for those cases.

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
- **AI**: Groq (LLM-based failure diagnosis, advisory only — see Safety Guardrails)
- **Email & Automation**: Resend API, Webhooks
- **Tooling**: `tsx`, ESLint, Prettier

---

## What's real vs. simulated (for the buildathon submission)

- **Real**: Supabase schema, deterministic policy/gating logic, the AI diagnosis layer (live Groq API calls, not scripted), the audit trail, the batch runner, and the dashboard UI.
- **Simulated for the demo**: transaction data is synthetic (via the seed script), and retry/reminder *outcomes* (whether a retry actually succeeds) are simulated with reason-specific probabilities rather than live Razorpay test-mode responses, since test-mode doesn't reliably reproduce failure/recovery distributions on demand. Razorpay test-mode keys are wired for the webhook ingestion path.
