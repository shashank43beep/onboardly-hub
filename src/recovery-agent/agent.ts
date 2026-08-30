import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Types
export type BatchStatus = 'pending' | 'running' | 'completed';
export type TransactionStatus =
  | 'pending'
  | 'failed'
  | 'paid'
  | 'abandoned'
  | 'escalated'
  | 'unresolved';

export type FailureReason =
  | 'insufficient_funds'
  | 'card_declined'
  | 'mandate_expired'
  | 'checkout_abandoned'
  | 'network_error'
  | 'client_unresponsive'
  | null;

export interface RecoveryBatch {
  id: string;
  name: string;
  status: BatchStatus;
  total_transactions: number;
  recovered_count: number;
  recovered_amount: number;
  unresolved_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface RecoveryTransaction {
  id: string;
  batch_id: string;
  portal_id: string | null;
  amount: number;
  currency: string;
  due_date: string;
  status: TransactionStatus;
  failure_reason: FailureReason;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  retry_count: number;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAction {
  id?: string;
  transaction_id: string;
  batch_id: string;
  actor: 'agent' | 'human';
  trigger: string;
  observed_state: Record<string, any>;
  decision: string;
  reasoning: string;
  action_taken: string | null;
  gated: boolean;
  gate_reason: string | null;
  outcome: string | null;
  created_at?: string;
}

export interface AgentExecutionResult {
  batchId: string;
  totalTransactions: number;
  processedCount: number;
  recoveredCount: number;
  recoveredAmount: number;
  escalatedCount: number;
  unresolvedCount: number;
  recoveryRatePercent: number;
  actions: RecoveryAction[];
}

// Bounded Guardrails
export const GUARDRAILS = {
  MAX_RETRIES: 3,
  MAX_REMINDERS: 3,
  HIGH_VALUE_THRESHOLD_INR: 50000,
  ABANDONED_STALE_DAYS: 14,
};

/**
 * Creates or retrieves a Supabase client configured with the service role key or anon key.
 */
export function getSupabaseClient(): SupabaseClient {
  let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Attempt to load from .env file if running in node/tsx
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1].trim();
            const val = (match[2] || '').trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        supabaseUrl = supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        supabaseKey = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      }
    } catch {
      // ignore
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl.trim(), supabaseKey.trim());
}

/**
 * Evaluates a single transaction through the explainable, bounded, gated agent policy.
 */
export function evaluateTransactionDecision(
  tx: RecoveryTransaction,
  deterministicSeed?: number
): {
  decision: string;
  reasoning: string;
  trigger: string;
  actionTaken: string | null;
  gated: boolean;
  gateReason: string | null;
  newStatus: TransactionStatus;
  newRetryCount: number;
  newReminderCount: number;
  outcome: string;
} {
  const seed = deterministicSeed ?? Math.random();

  // Rule 1: High Value Gating
  if (tx.amount >= GUARDRAILS.HIGH_VALUE_THRESHOLD_INR && tx.status !== 'paid') {
    return {
      decision: 'escalate_to_human',
      reasoning: `High-value transaction of ₹${tx.amount.toLocaleString('en-IN')} exceeds automated risk threshold (₹${GUARDRAILS.HIGH_VALUE_THRESHOLD_INR.toLocaleString('en-IN')}). Requires human account manager touchpoint to preserve client relationship.`,
      trigger: 'policy_check: high_value_guardrail',
      actionTaken: 'escalated_to_account_manager',
      gated: true,
      gateReason: `High-value transaction (₹${tx.amount.toLocaleString('en-IN')} >= ₹${GUARDRAILS.HIGH_VALUE_THRESHOLD_INR.toLocaleString('en-IN')}) requires human signoff`,
      newStatus: 'escalated',
      newRetryCount: tx.retry_count,
      newReminderCount: tx.reminder_count,
      outcome: 'escalated_to_account_manager',
    };
  }

  // Rule 2: Max Retries Gating
  if (tx.retry_count >= GUARDRAILS.MAX_RETRIES && tx.status !== 'paid') {
    return {
      decision: 'escalate_to_human',
      reasoning: `Payment failed after ${tx.retry_count} automated attempts. Hard retry boundary (${GUARDRAILS.MAX_RETRIES}) reached to avoid gateway penalties and duplicate card blocks.`,
      trigger: 'retry_limit_exceeded',
      actionTaken: 'escalated_to_human_ops',
      gated: true,
      gateReason: `Max retry limit reached (${GUARDRAILS.MAX_RETRIES} attempts). Automated retries halted.`,
      newStatus: 'escalated',
      newRetryCount: tx.retry_count,
      newReminderCount: tx.reminder_count,
      outcome: 'retries_exhausted_escalated',
    };
  }

  // Rule 3: Max Reminders Gating
  if (tx.reminder_count >= GUARDRAILS.MAX_REMINDERS && tx.status !== 'paid') {
    return {
      decision: 'escalate_to_human',
      reasoning: `Client has received ${tx.reminder_count} unacknowledged reminders. Hard reminder boundary (${GUARDRAILS.MAX_REMINDERS}) reached to prevent spam and customer irritation.`,
      trigger: 'reminder_limit_exceeded',
      actionTaken: 'escalated_to_client_success',
      gated: true,
      gateReason: `Max reminder limit reached (${GUARDRAILS.MAX_REMINDERS} reminders). Automated messaging halted.`,
      newStatus: 'escalated',
      newRetryCount: tx.retry_count,
      newReminderCount: tx.reminder_count,
      outcome: 'reminders_exhausted_escalated',
    };
  }

  // Rule 4: Already Paid Check
  if (tx.status === 'paid') {
    return {
      decision: 'no_action',
      reasoning: 'Transaction is already settled and marked as paid.',
      trigger: 'status_check: already_paid',
      actionTaken: null,
      gated: false,
      gateReason: null,
      newStatus: 'paid',
      newRetryCount: tx.retry_count,
      newReminderCount: tx.reminder_count,
      outcome: 'already_paid_no_action',
    };
  }

  // Reason-specific bounded recovery strategies
  switch (tx.failure_reason) {
    case 'insufficient_funds': {
      // Smart retry policy: transient balance issue; retry up to MAX_RETRIES
      const attempt = tx.retry_count + 1;
      const success = seed < 0.68; // ~68% recovery on smart retry
      return {
        decision: 'retry_payment',
        reasoning: `Transient balance deficit detected. Initiating smart scheduled retry (Attempt ${attempt}/${GUARDRAILS.MAX_RETRIES}) synchronized with payout window.`,
        trigger: 'payment.failed: insufficient_funds',
        actionTaken: 'retry_payment_via_razorpay',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'failed',
        newRetryCount: attempt,
        newReminderCount: tx.reminder_count,
        outcome: success ? 'payment_succeeded' : 'retry_failed_insufficient_funds',
      };
    }

    case 'network_error': {
      // Transient gateway network glitch; immediate automated retry
      const attempt = tx.retry_count + 1;
      const success = seed < 0.85; // 85% recovery on immediate retry
      return {
        decision: 'retry_payment',
        reasoning: 'Transient gateway connection error detected. Executing immediate idempotent network retry.',
        trigger: 'payment.failed: network_error',
        actionTaken: 'retry_payment_idempotent',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'failed',
        newRetryCount: attempt,
        newReminderCount: tx.reminder_count,
        outcome: success ? 'payment_succeeded' : 'network_retry_timed_out',
      };
    }

    case 'checkout_abandoned': {
      // Nudge with 1-click personalized checkout recovery link
      const remCount = tx.reminder_count + 1;
      const success = seed < 0.55; // 55% recovery from checkout reminder
      return {
        decision: 'send_reminder',
        reasoning: `Customer abandoned onboarding checkout session. Dispatching personalized 1-click recovery link (Reminder ${remCount}/${GUARDRAILS.MAX_REMINDERS}).`,
        trigger: 'checkout.session.abandoned',
        actionTaken: 'send_email_recovery_link',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'abandoned',
        newRetryCount: tx.retry_count,
        newReminderCount: remCount,
        outcome: success ? 'payment_succeeded' : 'reminder_delivered_pending_checkout',
      };
    }

    case 'card_declined': {
      // Card blocked or expired - direct retry will fail, so send payment update portal link
      const remCount = tx.reminder_count + 1;
      const success = seed < 0.45; // 45% update card & pay
      return {
        decision: 'send_reminder',
        reasoning: `Card authorization declined by bank. Automated card retries suppressed to avoid penalties; sending secure payment method update link.`,
        trigger: 'payment.failed: card_declined',
        actionTaken: 'send_payment_method_update_request',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'failed',
        newRetryCount: tx.retry_count,
        newReminderCount: remCount,
        outcome: success ? 'payment_succeeded' : 'payment_method_update_pending',
      };
    }

    case 'mandate_expired': {
      // Recurring authorization mandate expired; request mandate re-authorization
      const remCount = tx.reminder_count + 1;
      const success = seed < 0.50;
      return {
        decision: 'send_reminder',
        reasoning: `Auto-debit recurring mandate expired. Sending automated re-authorization request with 1-tap UPI / e-Mandate link.`,
        trigger: 'mandate.status.expired',
        actionTaken: 'send_mandate_renewal_request',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'failed',
        newRetryCount: tx.retry_count,
        newReminderCount: remCount,
        outcome: success ? 'payment_succeeded' : 'mandate_renewal_pending',
      };
    }

    case 'client_unresponsive': {
      const remCount = tx.reminder_count + 1;
      const success = seed < 0.35;
      return {
        decision: 'send_reminder',
        reasoning: `Client invoice overdue with no portal activity. Sending friendly automated settlement reminder #${remCount}.`,
        trigger: 'invoice.overdue: client_unresponsive',
        actionTaken: 'send_gentle_overdue_reminder',
        gated: false,
        gateReason: null,
        newStatus: success ? 'paid' : 'unresolved',
        newRetryCount: tx.retry_count,
        newReminderCount: remCount,
        outcome: success ? 'payment_succeeded' : 'reminder_sent_awaiting_response',
      };
    }

    default: {
      return {
        decision: 'send_reminder',
        reasoning: 'Unclassified payment failure status. Sending general payment verification prompt.',
        trigger: 'transaction.unclassified_state',
        actionTaken: 'send_general_payment_inquiry',
        gated: false,
        gateReason: null,
        newStatus: 'unresolved',
        newRetryCount: tx.retry_count,
        newReminderCount: tx.reminder_count + 1,
        outcome: 'reminder_sent',
      };
    }
  }
}

/**
 * Runs the Recovery Agent on a full batch of transactions.
 * Orchestrates decision making, audit trail logging, state mutation, and metrics aggregation.
 */
export async function runRecoveryBatch(
  batchId: string,
  options?: { verbose?: boolean; client?: SupabaseClient }
): Promise<AgentExecutionResult> {
  const supabase = options?.client ?? getSupabaseClient();
  const verbose = options?.verbose ?? true;

  // 1. Fetch batch
  const { data: batch, error: batchErr } = await supabase
    .from('recovery_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (batchErr || !batch) {
    throw new Error(`Failed to find recovery batch "${batchId}": ${batchErr?.message}`);
  }

  // 2. Mark batch running
  await supabase
    .from('recovery_batches')
    .update({ status: 'running' })
    .eq('id', batchId);

  // 3. Fetch transactions in batch
  const { data: transactions, error: txErr } = await supabase
    .from('recovery_transactions')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });

  if (txErr || !transactions) {
    throw new Error(`Failed to fetch transactions for batch ${batchId}: ${txErr?.message}`);
  }

  const actionsToInsert: RecoveryAction[] = [];
  let recoveredCount = 0;
  let recoveredAmount = 0;
  let escalatedCount = 0;
  let unresolvedCount = 0;

  for (const tx of transactions as RecoveryTransaction[]) {
    // Evaluate decision through the bounded agent policy
    const result = evaluateTransactionDecision(tx);

    const observedState = {
      amount: tx.amount,
      currency: tx.currency,
      failure_reason: tx.failure_reason,
      retry_count: tx.retry_count,
      reminder_count: tx.reminder_count,
      current_status: tx.status,
      due_date: tx.due_date,
    };

    const action: RecoveryAction = {
      transaction_id: tx.id,
      batch_id: batchId,
      actor: 'agent',
      trigger: result.trigger,
      observed_state: observedState,
      decision: result.decision,
      reasoning: result.reasoning,
      action_taken: result.actionTaken,
      gated: result.gated,
      gate_reason: result.gateReason,
      outcome: result.outcome,
    };

    actionsToInsert.push(action);

    // Update transaction state in database
    await supabase
      .from('recovery_transactions')
      .update({
        status: result.newStatus,
        retry_count: result.newRetryCount,
        reminder_count: result.newReminderCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.id);

    // Tally metrics
    if (result.newStatus === 'paid') {
      recoveredCount++;
      recoveredAmount += Number(tx.amount);
    } else if (result.newStatus === 'escalated') {
      escalatedCount++;
      unresolvedCount++;
    } else {
      unresolvedCount++;
    }
  }

  // 4. Record audit logs in recovery_actions
  if (actionsToInsert.length > 0) {
    const { error: actionErr } = await supabase
      .from('recovery_actions')
      .insert(actionsToInsert);

    if (actionErr) {
      console.error('Warning: Failed to insert some recovery_actions:', actionErr.message);
    }
  }

  // 5. Update batch summary
  const completedAt = new Date().toISOString();
  await supabase
    .from('recovery_batches')
    .update({
      status: 'completed',
      total_transactions: transactions.length,
      recovered_count: recoveredCount,
      recovered_amount: recoveredAmount,
      unresolved_count: unresolvedCount,
      completed_at: completedAt,
    })
    .eq('id', batchId);

  const recoveryRatePercent =
    transactions.length > 0 ? (recoveredCount / transactions.length) * 100 : 0;

  return {
    batchId,
    totalTransactions: transactions.length,
    processedCount: transactions.length,
    recoveredCount,
    recoveredAmount,
    escalatedCount,
    unresolvedCount,
    recoveryRatePercent,
    actions: actionsToInsert,
  };
}
