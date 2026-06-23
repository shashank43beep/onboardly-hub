import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { TemplatePicker } from "@/components/TemplatePicker";
import { type PortalTemplate } from "@/lib/templates";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  FileText,
  CreditCard,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { FormBuilder } from "@/components/FormBuilder";
import type { FormQuestion } from "@/lib/formTypes";

export const Route = createFileRoute("/dashboard/new/")({
  component: NewPortalPage,
});

interface FormState {
  // Client Info
  portalName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  projectDeadline: string;
  internalNotes: string;
  // Branding
  welcomeMessage: string;
  brandColor: string;
  brandLogo: string;
  // Links
  paymentLink: string;
  meetingLink: string;
  webhookUrl: string;
  // Steps
  stepsEnabled: {
    form: boolean;
    files: boolean;
    payment: boolean;
    meeting: boolean;
  };
  
  custom_questions: FormQuestion[];
}

function NewPortalPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"template" | "form">("template");
  const [activeSection, setActiveSection] = useState<"client" | "branding" | "links" | "steps" | "form">("client");
  const [showPreview, setShowPreview] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    portalName: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    projectDeadline: "",
    internalNotes: "",
    welcomeMessage: "",
    brandColor: "#6366f1",
    brandLogo: "",
    paymentLink: "",
    meetingLink: "",
    webhookUrl: "",
    stepsEnabled: {
      form: true,
      files: true,
      payment: true,
      meeting: true,
    },
    custom_questions: [],
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = "/login";
    }
    checkUser();
  }, []);

  function updateField(key: keyof FormState, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStep(step: keyof FormState["stepsEnabled"]) {
    setForm((prev) => ({
      ...prev,
      stepsEnabled: {
        ...prev.stepsEnabled,
        [step]: !prev.stepsEnabled[step],
      },
    }));
  }

  function handleTemplateSelect(template: PortalTemplate) {
    setForm((prev) => ({
      ...prev,
      portalName: template.portalName,
      welcomeMessage: template.welcomeMessage,
      paymentLink: template.paymentLink,
      meetingLink: template.meetingLink,
      brandColor: template.brandColor,
    }));
    setStep("form");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const path = `logos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("portal-files")
      .upload(path, file, { upsert: true });

    if (error) {
      setError(`Logo upload failed: ${error.message}`);
    } else {
      const { data } = supabase.storage
        .from("portal-files")
        .getPublicUrl(path);
      updateField("brandLogo", data.publicUrl);
    }
    setLogoUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.portalName.trim()) {
      setError("Portal name is required");
      setActiveSection("client");
      return;
    }
    if (!form.clientName.trim()) {
      setError("Client name is required");
      setActiveSection("client");
      return;
    }
    if (!form.clientEmail.trim()) {
      setError("Client email is required to send the invite");
      setActiveSection("client");
      return;
    }

    setLoading(true);

    try {
      const portal = await portalStore.create({
        portalName: form.portalName,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        clientCompany: form.clientCompany,
        projectDeadline: form.projectDeadline,
        internalNotes: form.internalNotes,
        welcomeMessage: form.welcomeMessage || "Welcome aboard! Excited to work with you.",
        paymentLink: form.paymentLink,
        meetingLink: form.meetingLink,
        webhookUrl: form.webhookUrl,
        brandLogo: form.brandLogo,
        brandColor: form.brandColor,
        stepsEnabled: form.stepsEnabled,
        archived: false,
        custom_questions: form.custom_questions, // ← ADD THIS
      });

      if (!portal?.id) throw new Error("Portal creation failed");

      if (form.clientEmail) {
        try {
          await fetch("/api/send-portal-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientEmail: form.clientEmail,
              clientName: form.clientName,
              portalName: form.portalName,
              portalUrl: `${window.location.origin}/portal/${portal.id}`,
              welcomeMessage: form.welcomeMessage,
            }),
          });
        } catch {
          // Don't block portal creation if email fails
        }
      }

      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      setError("Failed to create portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const enabledStepsCount = Object.values(form.stepsEnabled).filter(Boolean).length;

  if (step === "template") {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  const sections: { id: "client" | "branding" | "links" | "steps" | "form"; label: string; emoji: string }[] = [
  { id: "client", label: "Client Info", emoji: "👤" },
  { id: "branding", label: "Branding", emoji: "🎨" },
  { id: "links", label: "Links", emoji: "🔗" },
  { id: "steps", label: "Steps", emoji: "📋" },
  { id: "form", label: "Form", emoji: "📋" },
];
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setStep("template")}
            style={{
              background: "none", border: "none",
              color: "#6b7280", cursor: "pointer",
              fontSize: 14, display: "flex",
              alignItems: "center", gap: 4,
              fontFamily: "inherit",
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Change template
          </button>
          <span style={{ color: "#e5e7eb" }}>|</span>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
            Create Client Portal
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              background: showPreview ? "#ede9fe" : "#f3f4f6",
              color: showPreview ? "#6366f1" : "#374151",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              fontFamily: "inherit",
            }}
          >
            {showPreview
              ? <><EyeOff style={{ width: 14, height: 14 }} /> Hide Preview</>
              : <><Eye style={{ width: 14, height: 14 }} /> Preview</>
            }
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 8,
              background: "#6366f1", color: "#fff",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600,
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading
              ? <><Loader2 style={{ width: 14, height: 14 }} /> Creating...</>
              : <>Create Portal <ArrowRight style={{ width: 14, height: 14 }} /></>
            }
          </button>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: showPreview ? "1fr 380px" : "1fr",
        gap: 0,
        maxWidth: showPreview ? "100%" : 760,
        margin: "0 auto",
      }}>
        {/* ── Form panel ── */}
        <div style={{ padding: "32px 40px" }}>
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              marginBottom: 20, fontSize: 13, color: "#dc2626",
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Section tabs */}
          <div style={{
            display: "flex", gap: 4,
            marginBottom: 28, flexWrap: "wrap",
          }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "inherit",
                  background: activeSection === s.id ? "#6366f1" : "#fff",
                  color: activeSection === s.id ? "#fff" : "#6b7280",
                  boxShadow: activeSection === s.id
                    ? "0 2px 8px #6366f133"
                    : "0 1px 3px rgba(0,0,0,0.06)",
                  border: activeSection === s.id
                    ? "1px solid #6366f1"
                    : "1px solid #e5e7eb",
                }}
              >
                {s.emoji} {s.label}
                {s.id === "steps" && (
                  <span style={{
                    marginLeft: 6, fontSize: 11,
                    background: activeSection === s.id
                      ? "rgba(255,255,255,0.3)" : "#f3f4f6",
                    color: activeSection === s.id ? "#fff" : "#6b7280",
                    padding: "1px 6px", borderRadius: 999,
                  }}>
                    {enabledStepsCount}/4
                  </span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── CLIENT INFO ── */}
            {activeSection === "client" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader
                  title="Client Information"
                  desc="Basic details about who this portal is for."
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Portal Name" required>
                    <input
                      type="text"
                      placeholder="e.g. Website Redesign Project"
                      value={form.portalName}
                      onChange={(e) => updateField("portalName", e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </Field>
                  <Field label="Client Company" hint="Optional">
                    <input
                      type="text"
                      placeholder="e.g. Acme Inc."
                      value={form.clientCompany}
                      onChange={(e) => updateField("clientCompany", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Client Name" required>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Johnson"
                      value={form.clientName}
                      onChange={(e) => updateField("clientName", e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </Field>
                  <Field label="Client Email" required hint="Invite email sent here">
                    <input
                      type="email"
                      placeholder="sarah@company.com"
                      value={form.clientEmail}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Client Phone" hint="Optional — for WhatsApp follow-up">
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.clientPhone}
                      onChange={(e) => updateField("clientPhone", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Project Deadline" hint="Optional">
                    <input
                      type="date"
                      value={form.projectDeadline}
                      onChange={(e) => updateField("projectDeadline", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <Field label="Internal Notes" hint="Only visible to you — not shown to client">
                  <textarea
                    placeholder="e.g. Referred by Raj. Budget: ₹50k. Prefers WhatsApp communication."
                    value={form.internalNotes}
                    onChange={(e) => updateField("internalNotes", e.target.value)}
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                  />
                </Field>

                <NavButtons
                  onNext={() => setActiveSection("branding")}
                  nextLabel="Next: Branding →"
                  color={form.brandColor}
                />
              </div>
            )}

            {/* ── BRANDING ── */}
            {activeSection === "branding" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader
                  title="Portal Branding"
                  desc="Customise the look and feel your client will see."
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Brand Color">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="color"
                        value={form.brandColor}
                        onChange={(e) => updateField("brandColor", e.target.value)}
                        style={{
                          width: 48, height: 48, border: "none",
                          cursor: "pointer", borderRadius: 8, padding: 0,
                        }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#111827" }}>
                          {form.brandColor.toUpperCase()}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                          Used for buttons and accents
                        </p>
                      </div>
                    </div>
                  </Field>

                  <Field label="Brand Logo" hint="Upload image or paste URL">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 14px", borderRadius: 8,
                        border: "1px dashed #d1d5db",
                        cursor: "pointer", fontSize: 13,
                        color: "#6b7280", background: "#fafafa",
                      }}>
                        {logoUploading
                          ? <><Loader2 style={{ width: 14, height: 14 }} /> Uploading...</>
                          : <><Upload style={{ width: 14, height: 14 }} /> Upload logo</>
                        }
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                      {form.brandLogo && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img
                            src={form.brandLogo}
                            alt="Logo preview"
                            style={{
                              width: 40, height: 40, borderRadius: 8,
                              objectFit: "contain", border: "1px solid #e5e7eb",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateField("brandLogo", "")}
                            style={{
                              background: "none", border: "none",
                              color: "#ef4444", cursor: "pointer",
                              fontSize: 12, fontFamily: "inherit",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <Field label="Welcome Message" hint="First thing your client reads">
                  <textarea
                    placeholder="e.g. Welcome aboard! We're thrilled to work on your project. This portal guides you through everything we need to get started."
                    value={form.welcomeMessage}
                    onChange={(e) => updateField("welcomeMessage", e.target.value)}
                    style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                  />
                </Field>

                {/* Live color preview */}
                <div style={{
                  background: form.brandColor,
                  borderRadius: 12, padding: "20px 24px",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  {form.brandLogo ? (
                    <img
                      src={form.brandLogo}
                      alt="Logo"
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        objectFit: "contain", background: "rgba(255,255,255,0.2)",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 18,
                      color: "#fff", fontWeight: 700,
                    }}>
                      {form.clientName.charAt(0).toUpperCase() || "C"}
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>
                      {form.portalName || "Your Portal Name"}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                      {form.clientName || "Client Name"}
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <div style={{
                      background: "#fff", borderRadius: 6,
                      padding: "5px 12px", fontSize: 12,
                      fontWeight: 600, color: form.brandColor,
                    }}>
                      Preview
                    </div>
                  </div>
                </div>

                <NavButtons
                  onBack={() => setActiveSection("client")}
                  onNext={() => setActiveSection("links")}
                  nextLabel="Next: Links →"
                  color={form.brandColor}
                />
              </div>
            )}

            {/* ── LINKS ── */}
            {activeSection === "links" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader
                  title="Portal Links"
                  desc="Connect your payment, scheduling and automation tools."
                />

                <Field
                  label="Payment Link"
                  hint="Razorpay, Stripe, PayPal or any payment URL"
                >
                  <input
                    type="url"
                    placeholder="https://rzp.io/l/your-payment-link"
                    value={form.paymentLink}
                    onChange={(e) => updateField("paymentLink", e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Meeting Booking Link"
                  hint="Calendly, Cal.com, Google Meet or any booking URL"
                >
                  <input
                    type="url"
                    placeholder="https://calendly.com/yourname/kickoff"
                    value={form.meetingLink}
                    onChange={(e) => updateField("meetingLink", e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Webhook URL"
                  hint="Optional — sends event data to n8n, Zapier or Make when client completes steps"
                >
                  <input
                    type="url"
                    placeholder="https://hook.eu1.make.com/your-webhook"
                    value={form.webhookUrl}
                    onChange={(e) => updateField("webhookUrl", e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                {/* Link status indicators */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}>
                  {[
                    { label: "Payment", value: form.paymentLink, icon: "💳" },
                    { label: "Meeting", value: form.meetingLink, icon: "📅" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", borderRadius: 8,
                      background: item.value ? "#f0fdf4" : "#f9fafb",
                      border: `1px solid ${item.value ? "#bbf7d0" : "#e5e7eb"}`,
                      fontSize: 13,
                    }}>
                      <span>{item.icon}</span>
                      <span style={{ color: item.value ? "#166534" : "#9ca3af" }}>
                        {item.label}: {item.value ? "✓ Set" : "Not set"}
                      </span>
                    </div>
                  ))}
                </div>

                <NavButtons
                  onBack={() => setActiveSection("branding")}
                  onNext={() => setActiveSection("steps")}
                  nextLabel="Next: Steps →"
                  color={form.brandColor}
                />
              </div>
            )}

            {/* ── STEPS ── */}
            {activeSection === "steps" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader
                  title="Onboarding Steps"
                  desc="Choose which steps your client needs to complete."
                />

                {[
                  {
                    key: "form" as const,
                    icon: <FileText style={{ width: 18, height: 18 }} />,
                    label: "Intake Form",
                    desc: "Client fills out project goals, website, and details",
                    required: true,
                  },
                  {
                    key: "files" as const,
                    icon: <Upload style={{ width: 18, height: 18 }} />,
                    label: "File Upload",
                    desc: "Client uploads logos, assets and documents",
                    required: false,
                  },
                  {
                    key: "payment" as const,
                    icon: <CreditCard style={{ width: 18, height: 18 }} />,
                    label: "Payment",
                    desc: "Client completes payment via your payment link",
                    required: false,
                    warning: !form.paymentLink ? "No payment link set" : "",
                  },
                  {
                    key: "meeting" as const,
                    icon: <Calendar style={{ width: 18, height: 18 }} />,
                    label: "Meeting Booking",
                    desc: "Client books a kickoff call via your meeting link",
                    required: false,
                    warning: !form.meetingLink ? "No meeting link set" : "",
                  },
                ].map((step) => (
                  <div
                    key={step.key}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 20px", borderRadius: 12,
                      border: `1px solid ${form.stepsEnabled[step.key] ? "#c7d2fe" : "#e5e7eb"}`,
                      background: form.stepsEnabled[step.key] ? "#fafafe" : "#fafafa",
                      cursor: step.required ? "default" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => !step.required && toggleStep(step.key)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: form.stepsEnabled[step.key]
                        ? form.brandColor : "#e5e7eb",
                      display: "flex", alignItems: "center",
                      justifyContent: "center",
                      color: form.stepsEnabled[step.key] ? "#fff" : "#9ca3af",
                      transition: "all 0.15s",
                    }}>
                      {step.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <p style={{
                          margin: 0, fontSize: 14, fontWeight: 600,
                          color: "#111827",
                        }}>
                          {step.label}
                        </p>
                        {step.required && (
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: "#6366f1", background: "#ede9fe",
                            padding: "1px 6px", borderRadius: 999,
                          }}>
                            ALWAYS ON
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                        {step.desc}
                      </p>
                      {step.warning && form.stepsEnabled[step.key] && (
                        <p style={{
                          margin: "4px 0 0", fontSize: 11,
                          color: "#f59e0b", display: "flex",
                          alignItems: "center", gap: 4,
                        }}>
                          ⚠️ {step.warning} —{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSection("links");
                            }}
                            style={{
                              background: "none", border: "none",
                              color: "#f59e0b", cursor: "pointer",
                              fontSize: 11, padding: 0,
                              fontFamily: "inherit", textDecoration: "underline",
                            }}
                          >
                            Add link
                          </button>
                        </p>
                      )}
                    </div>

                    {/* ── CUSTOM FORM ── */}
                    {activeSection === "form" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <SectionHeader
                      title="Custom Intake Questions"
                      desc="Add questions your client answers during onboarding."
                    />

    <FormBuilder
      questions={form.custom_questions}
      onChange={(questions) => updateField("custom_questions", questions)}
    />

    <NavButtons
  onBack={() => setActiveSection("links")}
  onNext={() => setActiveSection("form")}
  nextLabel="Next: Custom Form →"
  color={form.brandColor}
/>
  </div>
)}  

                    {/* Toggle */}
                    {!step.required && (
                      <div style={{
                        width: 44, height: 24, borderRadius: 999,
                        background: form.stepsEnabled[step.key]
                          ? form.brandColor : "#d1d5db",
                        position: "relative", transition: "background 0.2s",
                        flexShrink: 0,
                      }}>
                        <div style={{
                          position: "absolute", top: 3,
                          left: form.stepsEnabled[step.key] ? 22 : 3,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div style={{
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 10, padding: "12px 16px",
                  fontSize: 13, color: "#166534",
                }}>
                  ✅ Client will complete{" "}
                  <strong>{enabledStepsCount} step{enabledStepsCount !== 1 ? "s" : ""}</strong>:{" "}
                  {Object.entries(form.stepsEnabled)
                    .filter(([, v]) => v)
                    .map(([k]) =>
                      k === "form" ? "Intake Form"
                      : k === "files" ? "File Upload"
                      : k === "payment" ? "Payment"
                      : "Meeting Booking"
                    )
                    .join(" → ")}
                </div>

                <NavButtons
                  onBack={() => setActiveSection("links")}
                  color={form.brandColor}
                  isSubmit
                  submitLabel={loading ? "Creating portal..." : "🚀 Create Portal"}
                  loading={loading}
                />
              </div>
            )}
          </form>
        </div>

        {/* ── Preview panel ── */}
        {showPreview && (
          <div style={{
            borderLeft: "1px solid #e5e7eb",
            background: "#f8fafc",
            padding: 24,
            position: "sticky",
            top: 60,
            height: "calc(100vh - 60px)",
            overflowY: "auto",
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.8px", textTransform: "uppercase",
              margin: "0 0 16px",
            }}>
              Portal preview
            </p>

            {/* Mini portal preview */}
            <div style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Header */}
              <div style={{
                background: form.brandColor, padding: "20px 20px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {form.brandLogo ? (
                    <img src={form.brandLogo} alt="Logo"
                      style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", color: "#fff",
                      fontWeight: 700, fontSize: 16,
                    }}>
                      {form.clientName.charAt(0).toUpperCase() || "C"}
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {form.portalName || "Portal Name"}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                      {form.clientName || "Client Name"}
                      {form.clientCompany ? ` · ${form.clientCompany}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps nav */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                {Object.entries(form.stepsEnabled)
                  .filter(([, v]) => v)
                  .map(([key], i) => (
                    <div key={key} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 0",
                      borderBottom: i < enabledStepsCount - 1 ? "1px solid #f9fafb" : "none",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: i === 0 ? form.brandColor : "#f3f4f6",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 10,
                        color: i === 0 ? "#fff" : "#9ca3af",
                        fontWeight: 700,
                      }}>
                        {i + 1}
                      </div>
                      <span style={{
                        fontSize: 12,
                        color: i === 0 ? "#111827" : "#9ca3af",
                        fontWeight: i === 0 ? 500 : 400,
                      }}>
                        {key === "form" ? "Intake Form"
                          : key === "files" ? "File Upload"
                          : key === "payment" ? "Payment"
                          : "Meeting Booking"}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Welcome content */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
                  Welcome, {form.clientName || "Client"}! 👋
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 14px", lineHeight: 1.5 }}>
                  {form.welcomeMessage || "Welcome aboard! We're excited to work with you."}
                </p>
                <div style={{
                  background: form.brandColor,
                  borderRadius: 6, padding: "7px 14px",
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  textAlign: "center", display: "inline-block",
                }}>
                  Begin Onboarding →
                </div>
              </div>

              {/* Portal info */}
              {(form.projectDeadline || form.clientCompany) && (
                <div style={{
                  padding: "10px 16px",
                  borderTop: "1px solid #f3f4f6",
                  background: "#fafafa",
                }}>
                  {form.clientCompany && (
                    <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6b7280" }}>
                      🏢 {form.clientCompany}
                    </p>
                  )}
                  {form.projectDeadline && (
                    <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                      📅 Deadline: {new Date(form.projectDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div style={{ marginTop: 20 }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#9ca3af",
                letterSpacing: "0.8px", textTransform: "uppercase",
                margin: "0 0 10px",
              }}>
                Readiness check
              </p>
              {[
                { label: "Portal name", done: !!form.portalName },
                { label: "Client name", done: !!form.clientName },
                { label: "Client email", done: !!form.clientEmail },
                { label: "Welcome message", done: !!form.welcomeMessage },
                { label: "Brand color set", done: form.brandColor !== "#6366f1" },
                { label: "Payment link", done: !form.stepsEnabled.payment || !!form.paymentLink },
                { label: "Meeting link", done: !form.stepsEnabled.meeting || !!form.meetingLink },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 0",
                  borderBottom: "1px solid #f9fafb",
                }}>
                  <span style={{ fontSize: 13 }}>{item.done ? "✅" : "⬜"}</span>
                  <span style={{
                    fontSize: 12,
                    color: item.done ? "#374151" : "#9ca3af",
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{desc}</p>
    </div>
  );
}

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        </label>
        {hint && (
          <span style={{ fontSize: 11, color: "#9ca3af" }}>— {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function NavButtons({
  onBack, onNext, nextLabel = "Next →",
  isSubmit = false, submitLabel, loading = false,
  color = "#6366f1",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isSubmit?: boolean;
  submitLabel?: string;
  loading?: boolean;
  color?: string;
}) {
  return (
    <div style={{
      display: "flex", gap: 10,
      justifyContent: "flex-end",
      marginTop: 8, paddingTop: 20,
      borderTop: "1px solid #f3f4f6",
    }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "10px 18px", borderRadius: 8,
            background: "#f3f4f6", color: "#374151",
            border: "none", cursor: "pointer",
            fontSize: 14, fontFamily: "inherit",
          }}
        >
          ← Back
        </button>
      )}
      {isSubmit ? (
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 24px", borderRadius: 8,
            background: color, color: "#fff",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {submitLabel || "Create Portal"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          style={{
            padding: "10px 24px", borderRadius: 8,
            background: color, color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  color: "#111827",
  background: "#fff",
  boxSizing: "border-box",
};