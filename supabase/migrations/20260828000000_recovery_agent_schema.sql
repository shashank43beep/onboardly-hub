-- Recovery Agent schema
-- Extends the existing Onboardly Supabase project.
-- Assumes an existing `portals` table (id uuid) representing agency clients — adjust the FK if your table/column names differ.

-- One row per test/demo run against a batch of transactions.
-- This is what you report a recovery % against for the submission.
create table if not exists recovery_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed')),
  total_transactions int not null default 0,
  recovered_count int not null default 0,
  recovered_amount numeric(12,2) not null default 0,
  unresolved_count int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Synthetic or real invoices/payments being tracked for recovery.
create table if not exists recovery_transactions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references recovery_batches(id) on delete cascade,
  portal_id uuid references portals(id) on delete set null, -- the agency's client
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  due_date date not null,
  status text not null default 'pending' check (
    status in ('pending', 'failed', 'paid', 'abandoned', 'escalated', 'unresolved')
  ),
  failure_reason text check (
    failure_reason in (
      'insufficient_funds', 'card_declined', 'mandate_expired',
      'checkout_abandoned', 'network_error', 'client_unresponsive', null
    )
  ),
  razorpay_payment_id text,
  razorpay_order_id text,
  retry_count int not null default 0,
  reminder_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The audit trail: every decision the agent makes, whether or not it acts.
-- This table IS the evidence for the "bounded, explainable, gated" bar in the brief.
create table if not exists recovery_actions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references recovery_transactions(id) on delete cascade,
  batch_id uuid not null references recovery_batches(id) on delete cascade,
  actor text not null default 'agent' check (actor in ('agent', 'human')),
  trigger text not null,               -- e.g. "payment.failed webhook", "due_date + 3 days elapsed"
  observed_state jsonb,                 -- snapshot of the transaction state the decision was based on
  decision text not null,               -- e.g. "retry_payment", "send_reminder", "escalate_to_human", "no_action"
  reasoning text not null,              -- short human-readable why, shown in the audit UI
  action_taken text,                    -- what actually executed (may differ from decision if gated/blocked)
  gated boolean not null default false, -- true if a stopping rule blocked the decision
  gate_reason text,                     -- why it was gated, if applicable
  outcome text,                         -- e.g. "payment_succeeded", "no_response", "reminder_sent"
  created_at timestamptz not null default now()
);

create index if not exists idx_recovery_transactions_batch on recovery_transactions(batch_id);
create index if not exists idx_recovery_transactions_status on recovery_transactions(status);
create index if not exists idx_recovery_actions_transaction on recovery_actions(transaction_id);
create index if not exists idx_recovery_actions_batch on recovery_actions(batch_id);

-- RLS: enable and scope to the agency's own data, mirroring Onboardly's existing portal-scoped policies.
-- Adjust the policy body to match how you scope `portals` access today (e.g. via a user_id or org_id column).
alter table recovery_batches enable row level security;
alter table recovery_transactions enable row level security;
alter table recovery_actions enable row level security;

-- Example permissive policy for local/demo use — replace with your real ownership check before shipping.
create policy "authenticated users can read recovery data" on recovery_batches
  for select using (auth.role() = 'authenticated');
create policy "authenticated users can read recovery transactions" on recovery_transactions
  for select using (auth.role() = 'authenticated');
create policy "authenticated users can read recovery actions" on recovery_actions
  for select using (auth.role() = 'authenticated');
