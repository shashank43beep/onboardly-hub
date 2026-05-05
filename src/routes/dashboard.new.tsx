import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { portalStore } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard/new")({
  head: () => ({ meta: [{ title: "Create portal — Onboardly" }] }),
  component: NewPortal,
});

function NewPortal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    portalName: "",
    clientName: "",
    welcomeMessage: "Welcome aboard! We're excited to start working with you.",
    brandLogo: "",
    paymentLink: "",
    meetingLink: "",
    webhookUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const portal = portalStore.create(form);
      toast.success("Portal created");
      setTimeout(() => navigate({ to: "/portal/$id", params: { id: portal.id } }), 400);
    } catch {
      toast.error("Could not create portal");
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <Toaster />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Create onboarding portal</h1>
        <p className="mt-2 text-muted-foreground">Customize what your client sees when they open the link.</p>

        <Card className="mt-8 p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Portal name" required>
                <Input required value={form.portalName} onChange={(e) => update("portalName", e.target.value)} placeholder="Acme Co. Onboarding" />
              </Field>
              <Field label="Client name" required>
                <Input required value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Acme Co." />
              </Field>
            </div>
            <Field label="Welcome message">
              <Textarea rows={3} value={form.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)} />
            </Field>
            <Field label="Brand logo URL" hint="Optional. Paste a public image URL.">
              <Input value={form.brandLogo} onChange={(e) => update("brandLogo", e.target.value)} placeholder="https://…/logo.png" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment link" hint="Stripe / PayPal checkout URL">
                <Input value={form.paymentLink} onChange={(e) => update("paymentLink", e.target.value)} placeholder="https://buy.stripe.com/…" />
              </Field>
              <Field label="Meeting booking link" hint="Calendly / Cal.com URL">
                <Input value={form.meetingLink} onChange={(e) => update("meetingLink", e.target.value)} placeholder="https://calendly.com/…" />
              </Field>
            </div>
            <Field label="n8n webhook URL" hint="Optional. Form submissions will POST here.">
              <Input value={form.webhookUrl} onChange={(e) => update("webhookUrl", e.target.value)} placeholder="https://n8n.yourdomain.com/webhook/…" />
            </Field>
            <div className="flex justify-end gap-3 border-t border-border/60 pt-5">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
              <Button type="submit" disabled={submitting} style={{ background: "var(--gradient-hero)" }}>
                {submitting ? "Creating…" : "Create portal"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
