import { runRecoveryBatch } from '../src/recovery-agent/agent';

async function runBatch() {
  const args = process.argv.slice(2);
  const batchId = args[0];

  if (!batchId) {
    console.error('\n❌ Error: Missing batch_id argument.');
    console.log('Usage:');
    console.log('  npx tsx scripts/run-batch.ts <batch_id>\n');
    process.exit(1);
  }

  console.log('\n🤖 =======================================================');
  console.log(`   Onboardly Autonomous Revenue Recovery Agent`);
  console.log(`   Processing Batch: ${batchId}`);
  console.log('=======================================================\n');

  const startTime = Date.now();

  try {
    const result = await runRecoveryBatch(batchId);

    console.log('📋 AGENT DECISION LOG & AUDIT TRAIL:\n');

    result.actions.forEach((act, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const amount = act.observed_state?.amount
        ? `₹${Number(act.observed_state.amount).toLocaleString('en-IN')}`
        : 'N/A';
      const reason = act.observed_state?.failure_reason || 'unclassified';

      let statusBadge = '🔄 [ACTED]';
      if (act.gated) {
        statusBadge = '🔒 [GATED]';
      } else if (act.outcome === 'payment_succeeded') {
        statusBadge = '✅ [PAID] ';
      }

      console.log(
        `${num}. ${statusBadge} ${amount.padEnd(9)} | Reason: ${reason.padEnd(20)} | Decision: ${act.decision}`
      );
      console.log(`    💡 Reasoning: ${act.reasoning}`);
      if (act.gated) {
        console.log(`    🛡️  Gate Rule: ${act.gate_reason}`);
      }
      console.log(`    🎯 Action:   ${act.action_taken || 'none'} -> Outcome: ${act.outcome}`);
      console.log('    ────────────────────────────────────────────────────────────────────────');
    });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n=======================================================');
    console.log('📊 RECOVERY BATCH EXECUTION SUMMARY');
    console.log('=======================================================');
    console.log(`Batch ID:               ${result.batchId}`);
    console.log(`Total Transactions:     ${result.totalTransactions}`);
    console.log(`Recovered Count:        ${result.recoveredCount}`);
    console.log(`Recovery Rate:          ${result.recoveryRatePercent.toFixed(1)}%`);
    console.log(
      `Recovered Revenue:      ₹${result.recoveredAmount.toLocaleString('en-IN')}`
    );
    console.log(`Escalated to Human:     ${result.escalatedCount} (Gated by safety guardrails)`);
    console.log(`Unresolved / In-Flight: ${result.unresolvedCount}`);
    console.log(`Audit Actions Logged:   ${result.actions.length}`);
    console.log(`Execution Time:         ${elapsedSec}s`);
    console.log('=======================================================\n');
    console.log('✅ Core loop executed cleanly end-to-end.\n');
  } catch (err: any) {
    console.error('\n❌ Execution error during batch run:', err.message || err);
    process.exit(1);
  }
}

runBatch();
