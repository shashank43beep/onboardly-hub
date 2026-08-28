import React, { useState } from 'react';
import { useRecoveryBatch } from '../hooks/useRecoveryBatch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  AlertTriangle,
  History,
  CreditCard,
  Lock,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryDashboardProps {
  batchId?: string | null;
}

export function RecoveryDashboard({ batchId }: RecoveryDashboardProps) {
  const { batch, transactions, actions, stats, loading, error, refetch } =
    useRecoveryBatch(batchId);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('transactions');

  if (!batchId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
        <Info className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold">No Batch Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-1">
          Please select a recovery batch from the dropdown above to inspect recovery performance, transaction states, and agent audit trails.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/40 rounded-t-xl" />
              <CardContent className="h-16 bg-muted/20" />
            </Card>
          ))}
        </div>
        <div className="h-96 border rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-destructive/50 bg-destructive/10 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-destructive font-semibold">
          <AlertTriangle className="w-5 h-5" />
          <span>Error Loading Recovery Data</span>
        </div>
        <p className="text-sm text-destructive/90">{error}</p>
        {error.toLowerCase().includes('permission') ||
        error.toLowerCase().includes('policy') ||
        error.toLowerCase().includes('row-level security') ? (
          <div className="p-3 bg-background/80 border rounded text-xs text-muted-foreground">
            <strong>Note on Supabase RLS:</strong> Read access to recovery tables is protected by Row-Level Security (`auth.role() = 'authenticated'`). Ensure you are logged into an active session.
          </div>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter === 'all') return true;
    return tx.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Header details ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              {batch?.name || 'Recovery Batch'}
            </h2>
            <Badge
              variant={
                batch?.status === 'completed'
                  ? 'default'
                  : batch?.status === 'running'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {batch?.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            ID: {batch?.id}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCw className="w-4 h-4 mr-2" /> Refresh Data
        </Button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recovered Revenue */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovered Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{stats.recoveredAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>{stats.recoveryRatePercent.toFixed(1)}% recovery rate</span>
            </p>
          </CardContent>
        </Card>

        {/* Recovered Invoices */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovered Invoices
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recoveredCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / {stats.totalTransactions}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automated smart retries & reminders
            </p>
          </CardContent>
        </Card>

        {/* Guardrail Escalations */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gated Escalations
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.escalatedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.gatedActionsCount} safety guardrails triggered
            </p>
          </CardContent>
        </Card>

        {/* Unresolved / In-Flight */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unresolved / Active
            </CardTitle>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {stats.unresolvedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending client follow-up or retry
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Tabbed View: Transactions & Audit Trail ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Transactions ({transactions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Agent Audit Trail ({actions.length})</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'transactions' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter:</span>
              {['all', 'paid', 'failed', 'escalated', 'abandoned'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* ── Transactions Tab ── */}
        <TabsContent value="transactions">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Batch Transactions</CardTitle>
              <CardDescription>
                Live recovery status across client payment attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Failure Reason</TableHead>
                      <TableHead>Retries / Reminders</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No transactions found matching filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-muted/40">
                          <TableCell>
                            {tx.status === 'paid' ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                                Paid
                              </Badge>
                            ) : tx.status === 'escalated' ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">
                                Escalated
                              </Badge>
                            ) : tx.status === 'abandoned' ? (
                              <Badge variant="secondary">Abandoned</Badge>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{Number(tx.amount).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {tx.failure_reason || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Retries: <span className="font-medium text-foreground">{tx.retry_count}</span> | Reminders: <span className="font-medium text-foreground">{tx.reminder_count}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.due_date}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {tx.id.substring(0, 8)}...
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Trail Tab ── */}
        <TabsContent value="audit">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Explainable Agent Audit Trail</span>
              </CardTitle>
              <CardDescription>
                Every autonomous decision made, reasoning provided, and safety guardrails enforced.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[120px]">Decision</TableHead>
                      <TableHead className="w-[130px]">Amount / Reason</TableHead>
                      <TableHead>Explainable Reasoning & Guardrails</TableHead>
                      <TableHead className="w-[160px]">Action & Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No audit action logs recorded for this batch yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      actions.map((act) => (
                        <TableRow key={act.id || Math.random()} className="hover:bg-muted/40">
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <Badge
                                variant={
                                  act.gated
                                    ? 'destructive'
                                    : act.outcome === 'payment_succeeded'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs font-mono"
                              >
                                {act.decision}
                              </Badge>
                              {act.gated && (
                                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                                  <Lock className="w-3 h-3" /> Gated
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sm">
                                {act.observed_state?.amount
                                  ? `₹${Number(act.observed_state.amount).toLocaleString('en-IN')}`
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {act.observed_state?.failure_reason || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top space-y-1">
                            <p className="text-xs text-foreground/90 leading-relaxed">
                              {act.reasoning}
                            </p>
                            {act.gated && act.gate_reason && (
                              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-800 dark:text-amber-300">
                                <strong>Safety Rule:</strong> {act.gate_reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-top text-xs space-y-1">
                            <div>
                              <span className="text-muted-foreground">Action:</span>{' '}
                              <span className="font-mono text-foreground font-medium">
                                {act.action_taken || 'none'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Outcome:</span>{' '}
                              <Badge
                                variant={
                                  act.outcome === 'payment_succeeded'
                                    ? 'outline'
                                    : 'secondary'
                                }
                                className="text-[10px] font-mono"
                              >
                                {act.outcome || 'pending'}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
