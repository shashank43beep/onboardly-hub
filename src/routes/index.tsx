import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, Upload, CreditCard, Calendar, Sparkles, Zap, Shield } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Onboardly — Beautiful client onboarding portals for agencies" },
      { name: "description", content: "Onboard clients with one professional portal link. Forms, files, payments and kickoff calls — all in one place." },
      { property: "og:title", content: "Onboardly — Client onboarding portals" },
      { property: "og:description", content: "One link to onboard every client. Forms, files, payments, and kickoff calls." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
               style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            One link to onboard every client
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Client onboarding,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              beautifully simple
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Onboardly gives freelancers and agencies a polished portal to collect intake forms, files, deposits and kickoff calls — automated end‑to‑end.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8 shadow-lg" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}>
              <Link to="/dashboard">
                Start onboarding clients <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/portal/$id" params={{ id: "demo" }}>View live demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required • 14‑day free trial</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything your client needs, in one link</h2>
          <p className="mt-4 text-muted-foreground">Stop juggling email threads, Google Drive folders and invoice PDFs. Send one Onboardly portal.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60 p-6 transition-all hover:-translate-y-1" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60" style={{ background: "var(--gradient-soft)" }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((p) => (
              <Card key={p.name} className={`relative p-8 ${p.featured ? "border-primary/40" : "border-border/60"}`}
                    style={{ boxShadow: p.featured ? "var(--shadow-elegant)" : "var(--shadow-soft)", background: p.featured ? "var(--gradient-card)" : undefined }}>
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-primary-foreground"
                        style={{ background: "var(--gradient-hero)" }}>Most popular</span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${p.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={p.featured ? "default" : "outline"}
                        style={p.featured ? { background: "var(--gradient-hero)" } : undefined}>
                  <Link to="/dashboard">{p.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to wow your next client?</h2>
        <p className="mt-4 text-muted-foreground">Spin up your first onboarding portal in under two minutes.</p>
        <Button asChild size="lg" className="mt-8 px-8" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}>
          <Link to="/dashboard">Create your first portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>
    </SiteLayout>
  );
}

const features = [
  { icon: FileText, title: "Branded intake forms", desc: "Capture project goals, scope and brand details with a clean, professional form." },
  { icon: Upload, title: "Secure file uploads", desc: "Clients drop logos, brand assets and documents straight into your workflow." },
  { icon: CreditCard, title: "Deposit collection", desc: "Embed your Stripe or PayPal link to lock in the project from day one." },
  { icon: Calendar, title: "Kickoff scheduling", desc: "Calendly or Cal.com embed so clients book the kickoff in seconds." },
  { icon: Zap, title: "Automated by n8n", desc: "Every action triggers a webhook — emails, Slack, CRM updates, you name it." },
  { icon: Shield, title: "Progress tracking", desc: "See exactly where every client stands on a clean dashboard view." },
];

const plans = [
  { name: "Starter", price: 0, tagline: "For solo freelancers getting started.", features: ["1 active portal", "Branded onboarding link", "n8n webhook integration", "Email support"], cta: "Start free", featured: false },
  { name: "Studio", price: 29, tagline: "For growing agencies & studios.", features: ["Unlimited portals", "Custom branding & logo", "Priority webhook delivery", "Advanced progress tracking", "Premium support"], cta: "Start 14‑day trial", featured: true },
];
