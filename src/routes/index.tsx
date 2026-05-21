import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  CreditCard,
  Calendar,
  Sparkles,
  Bell,
  Users,
  MessageSquare,
  BarChart3,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Onboardly — Beautiful client onboarding portals for agencies" },
      {
        name: "description",
        content:
          "Onboard clients with one professional portal link. Forms, files, payments and kickoff calls — all in one place.",
      },
      {
        property: "og:title",
        content: "Onboardly — Client onboarding portals",
      },
      {
        property: "og:description",
        content:
          "One link to onboard every client. Forms, files, payments, and kickoff calls.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1152, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", height: 64,
        }}>
          {/* Logo */}
          <Logo size={32} variant="full" />

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}
            className="hidden md:flex">
            <a href="#features" style={{ fontSize: 14, color: "#6b7280",
              textDecoration: "none" }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, color: "#6b7280",
              textDecoration: "none" }}>How it works</a>
            <a href="#pricing" style={{ fontSize: 14, color: "#6b7280",
              textDecoration: "none" }}>Pricing</a>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/login" style={{
              fontSize: 14, color: "#374151",
              textDecoration: "none", fontWeight: 500,
            }}>
              Log in
            </Link>
            <Link to="/login" style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", padding: "8px 18px", borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              Get started free
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, #f8f7ff 0%, #f0f9ff 100%)",
        padding: "80px 24px 100px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%",
          transform: "translateX(-50%)",
          width: 800, height: 400, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f133, #8b5cf633)",
          filter: "blur(80px)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 999, padding: "6px 14px",
            fontSize: 13, color: "#6b7280", marginBottom: 24,
          }}>
            <Sparkles style={{ width: 13, height: 13, color: "#6366f1" }} />
            Built for agencies & freelancers
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 700, lineHeight: 1.15,
            color: "#111827", margin: "0 0 20px",
            letterSpacing: "-1px",
          }}>
            Client onboarding,{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              finally done right.
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: "#6b7280", lineHeight: 1.7,
            margin: "0 auto 40px", maxWidth: 560,
          }}>
            Stop chasing clients over email. Onboardly gives every client
            their own branded portal — forms, files, payments and meetings
            in one seamless flow.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <Link to="/login" style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", padding: "14px 28px", borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 24px #6366f144",
            }}>
              Start for free
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <a href="#how-it-works" style={{
              background: "#fff", color: "#374151",
              padding: "14px 28px", borderRadius: 10,
              fontSize: 16, fontWeight: 600, textDecoration: "none",
              border: "1px solid #e5e7eb",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              See how it works
            </a>
          </div>

          <p style={{
            marginTop: 16, fontSize: 13, color: "#9ca3af",
          }}>
            No credit card required · Free forever plan available
          </p>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <section style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        padding: "32px 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 24, textAlign: "center",
        }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{
                fontSize: 28, fontWeight: 700, color: "#111827",
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{
        padding: "96px 24px", background: "#fafafa",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
              color: "#111827", margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}>
              Everything your clients need
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 480,
              margin: "0 auto" }}>
              One portal link replaces the entire back-and-forth of
              new client onboarding.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {features.map((f) => (
              <div key={f.title} style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #e5e7eb", padding: 28,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: 16,
                }}>
                  <f.icon style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
                <h3 style={{
                  fontSize: 16, fontWeight: 600, color: "#111827",
                  margin: "0 0 8px",
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6,
                  margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: "96px 24px", background: "#fff",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
              color: "#111827", margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}>
              Up and running in minutes
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280" }}>
              Three steps. No technical setup required.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 40, position: "relative",
          }}>
            {steps.map((step, i) => (
              <div key={step.title} style={{ textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 20px",
                  fontSize: 20, fontWeight: 700, color: "#fff",
                }}>
                  {i + 1}
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 600, color: "#111827",
                  margin: "0 0 8px",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: 14, color: "#6b7280", lineHeight: 1.6,
                  margin: 0,
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" style={{
        padding: "96px 24px",
        background: "linear-gradient(160deg, #f8f7ff 0%, #f0f9ff 100%)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
              color: "#111827", margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280" }}>
              Start free. Upgrade when your business grows.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24, maxWidth: 700, margin: "0 auto",
          }}>
            {plans.map((p) => (
              <div key={p.name} style={{
                background: p.featured
                  ? "linear-gradient(160deg, #6366f1, #8b5cf6)"
                  : "#fff",
                borderRadius: 20,
                border: p.featured ? "none" : "1px solid #e5e7eb",
                padding: 36,
                position: "relative",
                boxShadow: p.featured
                  ? "0 20px 60px #6366f144"
                  : "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                {p.featured && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%",
                    transform: "translateX(-50%)",
                    background: "#f59e0b", color: "#fff",
                    fontSize: 11, fontWeight: 700,
                    padding: "4px 12px", borderRadius: 999,
                    letterSpacing: "0.5px",
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <h3 style={{
                  fontSize: 18, fontWeight: 700,
                  color: p.featured ? "#fff" : "#111827",
                  margin: "0 0 8px",
                }}>
                  {p.name}
                </h3>

                <div style={{
                  display: "flex", alignItems: "baseline",
                  gap: 4, margin: "0 0 8px",
                }}>
                  <span style={{
                    fontSize: 40, fontWeight: 800,
                    color: p.featured ? "#fff" : "#111827",
                  }}>
                    ₹{p.price}
                  </span>
                  <span style={{
                    fontSize: 14,
                    color: p.featured ? "#c7d2fe" : "#9ca3af",
                  }}>
                    /month
                  </span>
                </div>

                <p style={{
                  fontSize: 13,
                  color: p.featured ? "#c7d2fe" : "#6b7280",
                  margin: "0 0 24px",
                }}>
                  {p.tagline}
                </p>

                <ul style={{
                  listStyle: "none", padding: 0,
                  margin: "0 0 32px", display: "flex",
                  flexDirection: "column", gap: 12,
                }}>
                  {p.features.map((feat) => (
                    <li key={feat} style={{
                      display: "flex", alignItems: "flex-start",
                      gap: 10, fontSize: 14,
                      color: p.featured ? "#e0e7ff" : "#374151",
                    }}>
                      <CheckCircle2 style={{
                        width: 16, height: 16, flexShrink: 0,
                        marginTop: 1,
                        color: p.featured ? "#a5b4fc" : "#6366f1",
                      }} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link to="/login" style={{
                  display: "block", textAlign: "center",
                  padding: "12px",
                  background: p.featured ? "#fff" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: p.featured ? "#6366f1" : "#fff",
                  borderRadius: 10, fontSize: 15,
                  fontWeight: 600, textDecoration: "none",
                }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: "96px 24px", textAlign: "center",
        background: "#fff",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
            color: "#111827", margin: "0 0 16px",
            letterSpacing: "-0.5px",
          }}>
            Ready to wow your next client?
          </h2>
          <p style={{
            fontSize: 16, color: "#6b7280",
            lineHeight: 1.7, margin: "0 0 40px",
          }}>
            Create your first onboarding portal in under 2 minutes.
            No setup fees. No contracts.
          </p>
          <Link to="/login" style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", padding: "16px 36px", borderRadius: 12,
            fontSize: 17, fontWeight: 700, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 8px 32px #6366f155",
          }}>
            Create your first portal
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
            Free forever · No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        background: "#111827", padding: "48px 24px",
        color: "#9ca3af",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center", gap: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
            }}>
              <Sparkles style={{ width: 13, height: 13, color: "#fff" }} />
            </div>
            <span style={{
              color: "#fff", fontSize: 16, fontWeight: 700,
            }}>
              Onboardly
            </span>
          </div>

          <div style={{ display: "flex", gap: 32 }}>
            {["Features", "Pricing", "Login"].map((item) => (
              <a key={item} href={
                item === "Login" ? "/login" :
                item === "Features" ? "#features" : "#pricing"
              } style={{
                color: "#9ca3af", textDecoration: "none",
                fontSize: 14,
              }}>
                {item}
              </a>
            ))}
          </div>

          <p style={{ fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Onboardly. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
  { value: "2 min", label: "Average setup time" },
  { value: "100%", label: "Branded experience" },
  { value: "5 steps", label: "Complete onboarding flow" },
  { value: "0 emails", label: "Manual follow-ups needed" },
];

const features = [
  {
    icon: FileText,
    title: "Branded intake forms",
    desc: "Capture project goals, scope and brand details with a clean, professional form clients actually enjoy filling.",
  },
  {
    icon: Upload,
    title: "Secure file uploads",
    desc: "Clients drop logos, brand assets and documents straight into your Supabase-powered storage.",
  },
  {
    icon: CreditCard,
    title: "Payment collection",
    desc: "Embed your payment link to collect deposits and lock in the project from day one.",
  },
  {
    icon: Calendar,
    title: "Kickoff scheduling",
    desc: "Clients book their kickoff call directly inside the portal — no back and forth needed.",
  },
  {
    icon: MessageSquare,
    title: "Built-in chat",
    desc: "Real-time messaging between you and your client — all inside the portal, zero external tools.",
  },
  {
    icon: Bell,
    title: "Automated notifications",
    desc: "Clients get emailed at every step — invite, progress updates, and a completion celebration.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    desc: "Invite team members to manage portals together with role-based access control.",
  },
  {
    icon: BarChart3,
    title: "Progress tracking",
    desc: "See exactly where every client stands on your dashboard at a glance.",
  },
  {
    icon: Mail,
    title: "Email reminders",
    desc: "One-click reminder emails when clients go quiet — keeping projects moving forward.",
  },
];

const steps = [
  {
    title: "Create a portal",
    desc: "Set up a branded onboarding portal with your logo, colors and welcome message in under 2 minutes.",
  },
  {
    title: "Share one link",
    desc: "Send your client a single link. They complete forms, upload files, pay and book — all in one place.",
  },
  {
    title: "Get notified",
    desc: "Receive real-time updates as your client completes each step. No more chasing for status updates.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 0,
    tagline: "Perfect for solo freelancers.",
    featured: false,
    cta: "Start for free",
    features: [
      "3 active portals",
      "Branded onboarding link",
      "File uploads",
      "Email notifications",
      "Progress tracking",
    ],
  },
  {
    name: "Pro",
    price: 999,
    tagline: "For growing agencies & studios.",
    featured: true,
    cta: "Start 14-day trial",
    features: [
      "Unlimited portals",
      "Custom branding & logo",
      "Real-time client chat",
      "Team member access",
      "Priority email support",
      "Webhook integrations",
    ],
  },
];
