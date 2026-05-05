import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Onboardly" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <SiteLayout>
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in to manage your onboarding portals.</p>
        <Card className="mt-8 w-full p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => navigate({ to: "/dashboard" }), 600);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@agency.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading} style={{ background: "var(--gradient-hero)" }}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Don't have an account? <Link to="/dashboard" className="text-primary hover:underline">Try the demo</Link>
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
