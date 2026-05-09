import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  component: NewPortalPage,
});

function NewPortalPage() {
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
      const portal = await portalStore.create(form);
      if (portal) {
        toast.success("Portal created successfully!");
        // Small delay to let the toast be seen
        setTimeout(() => navigate({ to: "/dashboard" }), 600);
      } else {
        throw new Error("Failed to create portal");
      }
    } catch (err) {
      console.error("Portal creation error:", err);
      toast.error("Could not create portal. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <Toaster position="top-center" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Create onboarding portal</h1>
        <p className="mt-2 text-muted-foreground">Customize what your client sees when they open the onboarding link.</p>

        <Card className="mt-8 p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portalName">Portal name <span className="text-destructive">*</span></Label>
                <Input id="portalName" required value={form.portalName} onChange={(e) => update("portalName", e.target.value)} placeholder="Acme Co. Onboarding" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client name <span className="text-destructive">*</span></Label>
                <Input id="clientName" required value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Acme Co." />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome message</Label>
              <Textarea id="welcomeMessage" rows={3} value={form.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandLogo">Brand logo URL</Label>
              <Input id="brandLogo" value={form.brandLogo} onChange={(e) => update("brandLogo", e.target.value)} placeholder="https://.../logo.png" />
              <p className="text-xs text-muted-foreground">Optional. Paste a public image URL for the portal logo.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentLink">Payment link</Label>
                <Input id="paymentLink" value={form.paymentLink} onChange={(e) => update("paymentLink", e.target.value)} placeholder="https://buy.stripe.com/..." />
                <p className="text-xs text-muted-foreground">Stripe / PayPal checkout URL</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting booking link</Label>
                <Input id="meetingLink" value={form.meetingLink} onChange={(e) => update("meetingLink", e.target.value)} placeholder="https://calendly.com/..." />
                <p className="text-xs text-muted-foreground">Calendly / Cal.com URL</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input id="webhookUrl" value={form.webhookUrl} onChange={(e) => update("webhookUrl", e.target.value)} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Optional. POST requests will be sent here on form submissions.</p>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-border/60 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="px-8" style={{ background: "var(--gradient-hero)" }}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Portal"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}