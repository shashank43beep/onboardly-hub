# 🤖 Onboardly Revenue Recovery Agent

An autonomous, bounded, explainable, and gated AI recovery agent designed to automatically recover failed, abandoned, and overdue payments for agency client portals while protecting client relationships through strict safety boundaries.

---

## 📌 Architecture & Design Principles

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

### 1. Bounded Guardrails
Runaway automated dunning destroys client relationships. The agent operates within strict, deterministic boundaries:
- **Maximum Retries (`MAX_RETRIES = 3`)**: Limits automated payment gateway recharges. Halts retries to prevent card issuer fraud flags.
- **Maximum Reminders (`MAX_REMINDERS = 3`)**: Prevents inbox fatigue. Halts messaging when reminders go unacknowledged.
- **High-Value Gating (`HIGH_VALUE_THRESHOLD = ₹50,000`)**: Transactions exceeding ₹50,000 are gated from blind automation and routed directly to human account managers.

### 2. Explainable & Gated Audit Trail
Every single transaction evaluated by the agent produces an immutable record in `recovery_actions`:
- **`trigger`**: The webhook or schedule event that prompted review (e.g., `payment.failed: insufficient_funds`).
- **`observed_state`**: Full JSON snapshot of the transaction when the decision occurred.
- **`decision`**: The strategy selected (`retry_payment`, `send_reminder`, `escalate_to_human`, `no_action`).
- **`reasoning`**: Human-readable rationale explaining *why* this decision was made.
- **`gated` & `gate_reason`**: Explicit boolean and explanation when a safety guardrail intervened.
- **`action_taken` & `outcome`**: What actually executed and the resulting outcome.

---

## 🗄️ Database Schema (`supabase/migrations/`)

- **`recovery_batches`**: Tracks batch-level metrics (total transactions, recovered count, recovered amount in INR, unresolved count, start/completion timestamps).
- **`recovery_transactions`**: Stores individual transaction records linked to client portals (`portals.id`), payment gateways (Razorpay/Stripe), retry/reminder counters, and failure statuses.
- **`recovery_actions`**: Immutable audit log capturing the agent's decision-making process for every transaction.

---

## ⚡ Failure Strategies

| Failure Reason | Recovery Strategy | Bounding Rule |
| :--- | :--- | :--- |
| `insufficient_funds` | Smart scheduled retry synchronized with payout windows | Max 3 retries; escalates if exhausted |
| `card_declined` | Direct retries blocked; sends secure payment method update link | Max 3 reminders; escalates if unchanged |
| `mandate_expired` | Sends automated 1-tap e-Mandate re-authorization link | Max 3 reminders; escalates to human |
| `checkout_abandoned` | Sends 1-click personalized checkout recovery link | Max 3 reminders |
| `network_error` | Immediate idempotent gateway retry | Max 3 retries |
| `client_unresponsive` | Polite overdue reminders with portal link | Max 3 reminders; escalates to account manager |
| *High-Value (≥₹50k)* | Gated from auto-retry; immediate human escalation | ₹50,000 threshold |

---

## 🚀 Quick Start & CLI Usage

### Prerequisites
Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in your root `.env` file.

### 1. Install Dependencies
```bash
npm install -D tsx
```

### 2. Seed a Demo Batch
Generate 40 synthetic transactions across various failure modes:
```bash
npx tsx scripts/seed-batch.ts 40
```
*Outputs the generated `batch_id`.*

### 3. Run the Recovery Agent
Execute the agent against the seeded batch to process transactions, enforce guardrails, log audit trails, and calculate recovery metrics:
```bash
npx tsx scripts/run-batch.ts <batch_id>
```

### 4. Inspect Results via UI
Open `http://localhost:5173/dashboard/recovery` to view the live batch metrics, transaction states, and explainable audit trail in the web dashboard.
