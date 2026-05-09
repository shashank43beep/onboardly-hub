import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ExternalLink, Copy, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { portalStore, type Portal } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Onboardly" }] }),
  component: DashboardPage,
});

function progressPct(p: Portal["progress"]) {
  const total = 4;
  const done = [p.formComplete, p.filesUploaded, p.paymentCompleted, p.meetingBooked].filter(Boolean).length;
  return Math.round((done / total) * 100);
}

function DashboardPage() {
  const location = useLocation();
  const isRootDashboard = location.pathname === "/dashboard";
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await portalStore.list();
      setPortals(data);
      setLoading(false);
    }
    if (isRootDashboard) {
      load();
    }
  }, [isRootDashboard]);

  if (!isRootDashboard) {
    return <Outlet />;
  }

  return (
    <SiteLayout>
      <Toaster position="top-center" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your portals</h1>
            <p className="mt-2 text-muted-foreground">Manage all your active client onboardings.</p>
          </div>
          <Button asChild size="lg" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-soft)" }}>
            <Link to="/dashboard/new"><Plus className="mr-2 h-4 w-4" /> Create portal</Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : portals.length === 0 ? (
          <Card className="mt-12 flex flex-col items-center p-12 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
            <p className="text-muted-foreground">No portals yet. Create your first one to get started.</p>
            <Button asChild className="mt-6" style={{ background: "var(--gradient-hero)" }}>
              <Link to="/dashboard/new">Create your first portal</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => {
              const pct = progressPct(p.progress);
              const portalLink = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${p.id}`;
              
              return (
                <Card key={p.id} className="group flex flex-col p-6 transition-all hover:-translate-y-1"
                      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{p.portalName}</h3>
                      <p className="text-sm text-muted-foreground">{p.clientName}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{pct}%</span>
                  </div>
                  
                  <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-500" 
                         style={{ width: `${pct}%`, background: "var(--gradient-hero)" }} />
                  </div>
                  
                  <ul className="mb-6 space-y-2 text-xs">
                    <StepItem done={p.progress.formComplete}>Intake form</StepItem>
                    <StepItem done={p.progress.filesUploaded}>Files uploaded</StepItem>
                    <StepItem done={p.progress.paymentCompleted}>Deposit paid</StepItem>
                    <StepItem done={p.progress.meetingBooked}>Kickoff booked</StepItem>
                  </ul>
                  
                  <div className="mt-auto flex gap-2 border-t border-border/60 pt-4">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/portal/$id" params={{ id: p.id }}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Portal
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2" 
                            onClick={() => { 
                              navigator.clipboard.writeText(portalLink); 
                              toast.success("Portal link copied to clipboard"); 
                            }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function StepItem({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={done ? "text-foreground font-medium" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
