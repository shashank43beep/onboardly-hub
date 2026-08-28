import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { RecoveryDashboard } from '@/recovery-agent/components/RecoveryDashboard';
import { useRecoveryBatches } from '@/recovery-agent/hooks/useRecoveryBatch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, RefreshCw, Layers } from 'lucide-react';

export const Route = createFileRoute('/dashboard/recovery')({
  component: RecoveryRoutePage,
});

function RecoveryRoutePage() {
  const { batches, loading, error, refetch } = useRecoveryBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Automatically select the most recent batch on load
  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Navigation & Batch Picker ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portals Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Revenue Recovery Agent
                </h1>
                <p className="text-xs text-muted-foreground">
                  Autonomous, bounded payment recovery & explainable audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="w-[280px]">
              <Select
                value={selectedBatchId || ''}
                onValueChange={(val) => setSelectedBatchId(val)}
                disabled={loading || batches.length === 0}
              >
                <SelectTrigger className="bg-background">
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                    <SelectValue
                      placeholder={
                        loading
                          ? 'Loading batches...'
                          : batches.length === 0
                          ? 'No batches found'
                          : 'Select a recovery batch'
                      }
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-medium text-xs truncate">
                          {b.name || 'Batch'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {b.id.substring(0, 8)}... | {b.total_transactions} txs
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh Batches"
              className="bg-background shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Main Recovery Dashboard Component ── */}
        <RecoveryDashboard batchId={selectedBatchId} />
      </div>
    </div>
  );
}
