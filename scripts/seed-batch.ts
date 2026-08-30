import { getSupabaseClient, FailureReason } from '../src/recovery-agent/agent';

async function seedBatch() {
  const args = process.argv.slice(2);
  const requestedCount = parseInt(args[0], 10) || 40;

  console.log('\n🌱 =======================================================');
  console.log(`   Onboardly Recovery Agent - Seed Synthetic Batch`);
  console.log(`   Target Transactions: ${requestedCount}`);
  console.log('=======================================================\n');

  const supabase = getSupabaseClient();

  // 1. Fetch available portals to link real portal_ids if present
  let portalIds: string[] = [];
  try {
    const { data: portals } = await supabase.from('portals').select('id').limit(20);
    if (portals && portals.length > 0) {
      portalIds = portals.map((p) => p.id);
      console.log(`🔗 Found ${portalIds.length} existing client portals to associate.`);
    }
  } catch {
    // optional
  }

  // 2. Create Recovery Batch
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const batchName = `Synthetic Recovery Batch (${timestamp} UTC)`;

  const { data: batch, error: batchErr } = await supabase
    .from('recovery_batches')
    .insert({
      name: batchName,
      status: 'pending',
      total_transactions: requestedCount,
      recovered_count: 0,
      recovered_amount: 0,
      unresolved_count: 0,
    })
    .select()
    .single();

  if (batchErr || !batch) {
    console.error('❌ Failed to create recovery_batch:', batchErr?.message);
    process.exit(1);
  }

  console.log(`✅ Created Batch:`);
  console.log(`   ID:   ${batch.id}`);
  console.log(`   Name: ${batch.name}\n`);

  // 3. Generate synthetic transactions
  const failureReasonPool: { reason: FailureReason; weight: number }[] = [
    { reason: 'insufficient_funds', weight: 25 },
    { reason: 'checkout_abandoned', weight: 20 },
    { reason: 'card_declined', weight: 20 },
    { reason: 'mandate_expired', weight: 15 },
    { reason: 'network_error', weight: 10 },
    { reason: 'client_unresponsive', weight: 10 },
  ];

  function pickReason(): FailureReason {
    const totalWeight = failureReasonPool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of failureReasonPool) {
      if (rand < item.weight) return item.reason;
      rand -= item.weight;
    }
    return 'insufficient_funds';
  }

  const sampleAmounts = [
    1499, 2999, 4999, 7500, 9999, 12500, 18000, 24500, 35000, 48000,
    // Include a few high-value amounts to trigger high-value guardrails
    55000, 75000, 120000,
  ];

  const transactions = [];
  const now = Date.now();

  for (let i = 0; i < requestedCount; i++) {
    const reason = pickReason();
    const amount = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
    const daysAgo = Math.floor(Math.random() * 12) + 1;
    const dueDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Simulate initial retry / reminder counters (some brand new, some with prior attempts)
    let initialRetryCount = 0;
    let initialReminderCount = 0;
    const progressRoll = Math.random();

    if (reason === 'insufficient_funds' || reason === 'network_error') {
      if (progressRoll > 0.85) initialRetryCount = 3; // Trigger max retry guardrail
      else if (progressRoll > 0.5) initialRetryCount = 1;
    } else if (reason === 'client_unresponsive' || reason === 'card_declined') {
      if (progressRoll > 0.85) initialReminderCount = 3; // Trigger max reminder guardrail
      else if (progressRoll > 0.5) initialReminderCount = 1;
    }

    const portalId = portalIds.length > 0 ? portalIds[i % portalIds.length] : null;
    const randomHex = Math.random().toString(16).substring(2, 10);

    let initialStatus = 'failed';
    if (reason === 'checkout_abandoned') initialStatus = 'abandoned';
    if (reason === 'client_unresponsive') initialStatus = 'unresolved';

    transactions.push({
      batch_id: batch.id,
      portal_id: portalId,
      amount,
      currency: 'INR',
      due_date: dueDate,
      status: initialStatus,
      failure_reason: reason,
      razorpay_payment_id: `pay_synth_${randomHex}`,
      razorpay_order_id: `order_synth_${randomHex}`,
      retry_count: initialRetryCount,
      reminder_count: initialReminderCount,
    });
  }

  // Insert in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);
    const { error: insertErr } = await supabase.from('recovery_transactions').insert(chunk);
    if (insertErr) {
      console.error('❌ Failed to insert transactions chunk:', insertErr.message);
      process.exit(1);
    }
  }

  console.log(`📦 Successfully seeded ${transactions.length} synthetic transactions into Supabase!`);
  console.log(`\n👉 Next Step: Run the recovery agent against this batch:`);
  console.log(`   npx tsx scripts/run-batch.ts ${batch.id}\n`);
}

seedBatch().catch((err) => {
  console.error('❌ Unhandled error during seed:', err);
  process.exit(1);
});
