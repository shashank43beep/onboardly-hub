import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Onboardly" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-20 prose prose-slate">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-6 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-4 text-muted-foreground">Onboardly is committed to protecting your privacy. We collect only the information needed to deliver our onboarding portals — portal configuration, client form submissions and uploaded files routed through your n8n webhooks.</p>
        <h2 className="mt-8 text-xl font-semibold">Data we store</h2>
        <p className="mt-2 text-muted-foreground">Portal configuration is stored locally in your browser unless you connect a backend. Webhook payloads are forwarded directly to the URL you configure.</p>
        <h2 className="mt-8 text-xl font-semibold">Contact</h2>
        <p className="mt-2 text-muted-foreground">Questions? Email privacy@onboardly.example.</p>
      </div>
    </SiteLayout>
  );
}
