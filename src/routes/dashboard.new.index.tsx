import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { TemplatePicker } from "@/components/TemplatePicker";
import { type PortalTemplate } from "@/lib/templates";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/dashboard/new/")({
  component: NewPortalPage,
});

function NewPortalPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"template" | "form">("template");
  const [form, setForm] = useState({
    portalName: "",
    clientName: "",
    clientEmail: "",
    welcomeMessage: "",
    paymentLink: "",
    meetingLink: "",
    webhookUrl: "",
    brandLogo: "",
    brandColor: "#6366f1",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = "/login";
    }
    checkUser();
  }, []);

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

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.portalName || !form.clientName) {
      setError("Portal name and client name are required");
      return;
    }

    setLoading(true);

    try {
      const portal = await portalStore.create({
        portalName: form.portalName,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        welcomeMessage:
          form.welcomeMessage || "Welcome aboard! Excited to work with you.",
        paymentLink: form.paymentLink,
        meetingLink: form.meetingLink,
        webhookUrl: form.webhookUrl,
        brandLogo: form.brandLogo,
        brandColor: form.brandColor,
        archived: false,
      });

      if (!portal?.id) throw new Error("Portal creation failed");

      // Auto-send invite email to client
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
      setError("Failed to create portal");
    } finally {
      setLoading(false);
    }
  }

  // Show template picker first
  if (step === "template") {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  // Show form after template selected
  return (
    <div style={{
      minHeight: "100vh",
      padding: "24px 40px",
      background: "#f8fafc",
      fontFamily: "Arial, sans-serif",
    }}>
      <button
        onClick={() => setStep("template")}
        style={{
          background: "none", border: "none",
          color: "#6b7280", cursor: "pointer",
          fontSize: 14, marginBottom: 20,
          padding: 0, display: "flex",
          alignItems: "center", gap: 4,
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Change template
      </button>

      <h1 style={{ fontSize: "22px", marginBottom: "16px" }}>
        Create Client Portal
      </h1>

      {error && (
        <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex", flexDirection: "column",
          gap: "16px", maxWidth: "420px",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600,
            color: "#374151", display: "block", marginBottom: 6 }}>
            Brand Color
          </label>
          <input
            type="color"
            value={form.brandColor}
            onChange={(e) => updateField("brandColor", e.target.value)}
            style={{
              display: "block", width: 60, height: 40,
              border: "none", cursor: "pointer",
            }}
          />
        </div>

        <input
          type="text"
          placeholder="Portal Name *"
          value={form.portalName}
          onChange={(e) => updateField("portalName", e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="text"
          placeholder="Client Name *"
          value={form.clientName}
          onChange={(e) => updateField("clientName", e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="email"
          placeholder="Client Email"
          value={form.clientEmail}
          onChange={(e) => updateField("clientEmail", e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Welcome Message"
          value={form.welcomeMessage}
          onChange={(e) => updateField("welcomeMessage", e.target.value)}
          style={{ ...inputStyle, minHeight: "90px" }}
        />

        <input
          type="url"
          placeholder="Payment Link"
          value={form.paymentLink}
          onChange={(e) => updateField("paymentLink", e.target.value)}
          style={inputStyle}
        />

        <input
          type="url"
          placeholder="Meeting Link"
          value={form.meetingLink}
          onChange={(e) => updateField("meetingLink", e.target.value)}
          style={inputStyle}
        />

        <input
          type="url"
          placeholder="Webhook URL"
          value={form.webhookUrl}
          onChange={(e) => updateField("webhookUrl", e.target.value)}
          style={inputStyle}
        />

        <input
          type="url"
          placeholder="Brand Logo URL"
          value={form.brandLogo}
          onChange={(e) => updateField("brandLogo", e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px",
            background: form.brandColor || "#6366f1",
            color: "white", border: "none",
            borderRadius: "8px", cursor: "pointer",
            fontWeight: 600, fontSize: 15,
          }}
        >
          {loading ? "Creating..." : "Create Portal"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
};