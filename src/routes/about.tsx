import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Onboardly" },
      { name: "description", content: "Why we built Onboardly: client onboarding deserves to feel professional." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">About Onboardly</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          We built Onboardly for the agencies and freelancers who care deeply about first impressions. The first 48 hours after signing a client define the entire engagement — yet most onboarding still happens across scattered emails and spreadsheets.
        </p>
        <p className="mt-4 text-lg text-muted-foreground">
          Onboardly replaces that mess with a single elegant portal link. Your client gets a guided experience. You get clean data flowing into your tools through n8n automations.
        </p>
        <h2 className="mt-12 text-2xl font-semibold">Built for the modern stack</h2>
        <p className="mt-4 text-muted-foreground">
          No clunky backend. Onboardly is a beautiful frontend wired to your existing n8n workflows, payment links and scheduling tools. You stay in control of your data.
        </p>
      </div>
    </SiteLayout>
  );
}
