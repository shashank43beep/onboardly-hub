import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Onboardly" },
      { name: "description", content: "Simple, transparent pricing. Start free, upgrade when you're ready." },
    ],
  }),
  component: Pricing,
});

const plans = [
  { name: "Starter", price: 0, tagline: "Solo freelancers", features: ["1 active portal", "Branded link", "Webhook integration", "Email support"], featured: false },
  { name: "Studio", price: 29, tagline: "Growing agencies", features: ["Unlimited portals", "Custom branding", "Priority webhooks", "Progress tracking", "Premium support"], featured: true },
  { name: "Agency", price: 79, tagline: "Established teams", features: ["Everything in Studio", "Team seats", "White‑label portal", "API access", "Dedicated manager"], featured: false },
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Pricing built for momentum</h1>
          <p className="mt-4 text-muted-foreground">Pick a plan, ship a portal, get paid faster.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={p.featured ? "default" : "outline"}
                      style={p.featured ? { background: "var(--gradient-hero)" } : undefined}>
                <Link to="/dashboard">Choose {p.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
