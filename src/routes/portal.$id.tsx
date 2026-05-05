import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Upload, FileText, CreditCard, Calendar, PartyPopper, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { portalStore, type Portal } from "@/lib/storage";
import { postToWebhook } from "@/lib/webhook";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/portal/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Onboarding · ${params.id} — Onboardly` },
      { name: "description", content: "Complete your client onboarding in a few simple steps." },
    ],
  }),
  component: ClientPortal,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Portal not found</h1>
        <p className="mt-2 text-muted-foreground">This onboarding link is invalid or has expired.</p>
        <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  ),
});

const sections = ["welcome", "form", "files", "payment", "meeting", "done"] as const;
type Section = typeof sections[number];

function ClientPortal() {
  const { id } = Route.useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [section, setSection] = useState<Section>("welcome");

  useEffect(() => {
    const p = portalStore.get(id);
    if (!p) throw notFound();
    setPortal(p);
  }, [id]);

  if (!portal) return null;

  const refresh = () => setPortal(portalStore.get(id) ?? portal);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <Toaster />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {portal.brandLogo ? (
              <img src={portal.brandLogo} alt={portal.clientName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <div>
              <p className="text-sm font-semibold">{portal.portalName}</p>
              <p className="text-xs text-muted-foreground">For {portal.clientName}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Powered by Onboardly</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[260px_1fr]">
        <aside>
          <Card className="p-4" style={{ boxShadow: "var(--shadow-soft)" }}>
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your progress</p>
            <ul className="space-y-1">
              <NavStep active={section === "welcome"} done onClick={() => setSection("welcome")}>Welcome</NavStep>
              <NavStep active={section === "form"} done={portal.progress.formComplete} onClick={() => setSection("form")}>Project form</NavStep>
              <NavStep active={section === "files"} done={portal.progress.filesUploaded} onClick={() => setSection("files")}>Upload files</NavStep>
              <NavStep active={section === "payment"} done={portal.progress.paymentCompleted} onClick={() => setSection("payment")}>Deposit</NavStep>
              <NavStep active={section === "meeting"} done={portal.progress.meetingBooked} onClick={() => setSection("meeting")}>Kickoff call</NavStep>
            </ul>
          </Card>
        </aside>

        <main>
          {section === "welcome" && <Welcome portal={portal} onNext={() => setSection("form")} />}
          {section === "form" && <ProjectForm portal={portal} onDone={() => { refresh(); setSection("files"); }} />}
          {section === "files" && <FilesStep portal={portal} onDone={() => { refresh(); setSection("payment"); }} />}
          {section === "payment" && <PaymentStep portal={portal} onDone={() => { refresh(); setSection("meeting"); }} />}
          {section === "meeting" && <MeetingStep portal={portal} onDone={() => { refresh(); setSection("done"); }} />}
          {section === "done" && <Completion portal={portal} />}
        </main>
      </div>
    </div>
  );
}

function NavStep({ active, done, onClick, children }: { active: boolean; done: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
      >
        {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
        <span>{children}</span>
      </button>
    </li>
  );
}

function StepCard({ icon: Icon, title, subtitle, children }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-8" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Welcome({ portal, onNext }: { portal: Portal; onNext: () => void }) {
  return (
    <StepCard icon={Sparkles} title={`Welcome, ${portal.clientName} 👋`} subtitle="Let's get your project off to a great start.">
      <p className="text-muted-foreground">{portal.welcomeMessage}</p>
      <p className="mt-4 text-sm text-muted-foreground">This onboarding takes about 5 minutes. You'll fill out a brief project form, upload any brand assets, complete the deposit, and book the kickoff call.</p>
      <Button onClick={onNext} className="mt-6" style={{ background: "var(--gradient-hero)" }}>
        Begin onboarding <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </StepCard>
  );
}

function ProjectForm({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [data, setData] = useState({ projectName: "", goals: "", timeline: "", budget: "" });
  const [loading, setLoading] = useState(false);
  return (
    <StepCard icon={FileText} title="Project details" subtitle="Tell us about your project.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const res = await postToWebhook(portal.webhookUrl, { type: "form", portalId: portal.id, data });
          setLoading(false);
          if (res.ok) {
            portalStore.updateProgress(portal.id, { formComplete: true });
            toast.success("Form submitted");
            onDone();
          } else toast.error(res.error ?? "Submission failed");
        }}
      >
        <div className="space-y-1.5">
          <Label>Project name</Label>
          <Input required value={data.projectName} onChange={(e) => setData({ ...data, projectName: e.target.value })} placeholder="Website redesign" />
        </div>
        <div className="space-y-1.5">
          <Label>Goals & scope</Label>
          <Textarea required rows={4} value={data.goals} onChange={(e) => setData({ ...data, goals: e.target.value })} placeholder="What does success look like?" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Timeline</Label>
            <Input value={data.timeline} onChange={(e) => setData({ ...data, timeline: e.target.value })} placeholder="6 weeks" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Input value={data.budget} onChange={(e) => setData({ ...data, budget: e.target.value })} placeholder="$10,000" />
          </div>
        </div>
        <Button type="submit" disabled={loading} style={{ background: "var(--gradient-hero)" }}>
          {loading ? "Submitting…" : "Submit & continue"}
        </Button>
      </form>
    </StepCard>
  );
}

function FilesStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  return (
    <StepCard icon={Upload} title="Upload files" subtitle="Share logos, brand assets, briefs — anything that helps us start.">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-background/40 p-10 text-center transition-colors hover:border-primary/40 hover:bg-accent/30">
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG, ZIP up to 25MB each</p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm">
              <span className="truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      )}
      <Button
        className="mt-6"
        disabled={loading || files.length === 0}
        style={{ background: "var(--gradient-hero)" }}
        onClick={async () => {
          setLoading(true);
          const res = await postToWebhook(portal.webhookUrl, {
            type: "files",
            portalId: portal.id,
            files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          });
          setLoading(false);
          if (res.ok) {
            portalStore.updateProgress(portal.id, { filesUploaded: true });
            toast.success("Files uploaded");
            onDone();
          } else toast.error(res.error ?? "Upload failed");
        }}
      >
        {loading ? "Uploading…" : "Upload & continue"}
      </Button>
    </StepCard>
  );
}

function PaymentStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  return (
    <StepCard icon={CreditCard} title="Pay your deposit" subtitle="Lock in the project with a secure deposit.">
      <p className="text-sm text-muted-foreground">Click below to open the secure checkout page in a new tab. Once you've completed the payment, mark it as done.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="outline" disabled={!portal.paymentLink}>
          <a href={portal.paymentLink || "#"} target="_blank" rel="noreferrer">Open payment link</a>
        </Button>
        <Button
          style={{ background: "var(--gradient-hero)" }}
          onClick={async () => {
            await postToWebhook(portal.webhookUrl, { type: "payment", portalId: portal.id });
            portalStore.updateProgress(portal.id, { paymentCompleted: true });
            toast.success("Payment marked complete");
            onDone();
          }}
        >
          I've paid <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </StepCard>
  );
}

function MeetingStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  return (
    <StepCard icon={Calendar} title="Book the kickoff call" subtitle="Pick a time that works for you.">
      <p className="text-sm text-muted-foreground">We'll meet to align on goals, timeline and next steps.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="outline" disabled={!portal.meetingLink}>
          <a href={portal.meetingLink || "#"} target="_blank" rel="noreferrer">Open scheduler</a>
        </Button>
        <Button
          style={{ background: "var(--gradient-hero)" }}
          onClick={async () => {
            await postToWebhook(portal.webhookUrl, { type: "meeting", portalId: portal.id });
            portalStore.updateProgress(portal.id, { meetingBooked: true });
            toast.success("Meeting booked");
            onDone();
          }}
        >
          I've booked <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </StepCard>
  );
}

function Completion({ portal }: { portal: Portal }) {
  return (
    <StepCard icon={PartyPopper} title="You're all set! 🎉" subtitle="Onboarding complete.">
      <p className="text-muted-foreground">Thanks {portal.clientName} — we have everything we need. You'll get a confirmation email shortly with next steps.</p>
      <p className="mt-3 text-sm text-muted-foreground">Feel free to close this tab. We'll see you on the kickoff call!</p>
    </StepCard>
  );
}
