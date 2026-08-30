import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  RecoveryBatch,
  RecoveryTransaction,
  RecoveryAction,
} from '../agent';

export interface BatchStats {
  totalTransactions: number;
  recoveredCount: number;
  recoveredAmount: number;
  recoveryRatePercent: number;
  escalatedCount: number;
  unresolvedCount: number;
  gatedActionsCount: number;
}

export function useRecoveryBatches() {
  const [batches, setBatches] = useState<RecoveryBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('recovery_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) {
        throw new Error(sbError.message);
      }

      setBatches((data as RecoveryBatch[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return { batches, loading, error, refetch: fetchBatches };
}

export function useRecoveryBatch(batchId?: string | null) {
  const [batch, setBatch] = useState<RecoveryBatch | null>(null);
  const [transactions, setTransactions] = useState<RecoveryTransaction[]>([]);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchData = useCallback(async () => {
    if (!batchId) {
      setBatch(null);
      setTransactions([]);
      setActions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Batch
      const { data: batchData, error: bError } = await supabase
        .from('recovery_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (bError) {
        throw new Error(`Batch query failed: ${bError.message}`);
      }

      setBatch(batchData as RecoveryBatch);

      // 2. Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('recovery_transactions')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (txError) {
        throw new Error(`Transactions query failed: ${txError.message}`);
      }

      setTransactions((txData as RecoveryTransaction[]) || []);

      // 3. Fetch Actions Audit Trail
      const { data: actData, error: actError } = await supabase
        .from('recovery_actions')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (actError) {
        throw new Error(`Actions query failed: ${actError.message}`);
      }

      setActions((actData as RecoveryAction[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery batch data');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  // Derived Stats
  const totalTransactions = transactions.length;
  const recoveredTransactions = transactions.filter((t) => t.status === 'paid');
  const recoveredCount = recoveredTransactions.length;
  const recoveredAmount = recoveredTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );
  const escalatedCount = transactions.filter((t) => t.status === 'escalated').length;
  const unresolvedCount = transactions.filter(
    (t) => t.status !== 'paid' && t.status !== 'escalated'
  ).length;
  const gatedActionsCount = actions.filter((a) => a.gated).length;
  const recoveryRatePercent =
    totalTransactions > 0 ? (recoveredCount / totalTransactions) * 100 : 0;

  const stats: BatchStats = {
    totalTransactions,
    recoveredCount,
    recoveredAmount,
    recoveryRatePercent,
    escalatedCount,
    unresolvedCount,
    gatedActionsCount,
  };

  return {
    batch,
    transactions,
    actions,
    stats,
    loading,
    error,
    refetch: fetchBatchData,
  };
}
