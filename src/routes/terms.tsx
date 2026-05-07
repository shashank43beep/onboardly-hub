import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Onboardly" }] }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-6 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-4 text-muted-foreground">By using Onboardly you agree to use the service responsibly and in compliance with applicable laws. You are responsible for the content shared through your portals and for the security of any third-party integrations you connect.</p>
        <h2 className="mt-8 text-xl font-semibold">Service availability</h2>
        <p className="mt-2 text-muted-foreground">We work hard to keep Onboardly available, but we offer the service on an "as is" basis without warranty.</p>
        <h2 className="mt-8 text-xl font-semibold">Cancellation</h2>
        <p className="mt-2 text-muted-foreground">You may cancel your subscription at any time. Portals you created remain accessible for the remainder of your billing period.</p>
      </div>
    </SiteLayout>
  );
}
