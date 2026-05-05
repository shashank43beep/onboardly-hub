import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ExternalLink, CheckCircle2, Circle, Copy } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { portalStore, type Portal } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Onboardly" }] }),
  component: Dashboard,
});

function progressPct(p: Portal["progress"]) {
  const total = 4;
  const done = [p.formComplete, p.filesUploaded, p.paymentCompleted, p.meetingBooked].filter(Boolean).length;
  return Math.round((done / total) * 100);
}

function Dashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  useEffect(() => setPortals(portalStore.list()), []);

  return (
    <SiteLayout>
      <Toaster />
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

        {portals.length === 0 ? (
          <Card className="mt-12 flex flex-col items-center p-12 text-center">
            <p className="text-muted-foreground">No portals yet. Create your first one.</p>
            <Button asChild className="mt-4" style={{ background: "var(--gradient-hero)" }}>
              <Link to="/dashboard/new">Create portal</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => {
              const pct = progressPct(p.progress);
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${p.id}`;
              return (
                <Card key={p.id} className="group flex flex-col p-6 transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{p.portalName}</h3>
                      <p className="text-sm text-muted-foreground">{p.clientName}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{pct}%</span>
                  </div>
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--gradient-hero)" }} />
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    <Step done={p.progress.formComplete}>Intake form</Step>
                    <Step done={p.progress.filesUploaded}>Files uploaded</Step>
                    <Step done={p.progress.paymentCompleted}>Deposit paid</Step>
                    <Step done={p.progress.meetingBooked}>Kickoff booked</Step>
                  </ul>
                  <div className="mt-5 flex gap-2 border-t border-border/60 pt-4">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/portal/$id" params={{ id: p.id }}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Open</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(link); toast.success("Portal link copied"); }}>
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

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
