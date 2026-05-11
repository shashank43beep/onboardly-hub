import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/new/")({
  component: NewPortalPage,
});

function NewPortalPage() {
  const [form, setForm] = useState({
    portalName: "",
    clientName: "",
    clientEmail: "",
    welcomeMessage: "",
    paymentLink: "",
    meetingLink: "",
    webhookUrl: "",
    brandLogo: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
      }
    }

    checkUser();
  }, []);

  function updateField(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      });

      if (!portal?.id) {
        throw new Error("Portal creation failed");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Failed to create portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "30px", marginBottom: "24px" }}>
        Create Client Portal
      </h1>

      {error && (
        <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "420px",
        }}
      >
        <input
          type="text"
          placeholder="Portal Name"
          value={form.portalName}
          onChange={(e) => updateField("portalName", e.target.value)}
          style={inputStyle}
        />

        <input
        type="email"
        placeholder="Client Email"
        value={form.clientEmail}
        onChange={(e) => updateField("clientEmail", e.target.value)}
        style={inputStyle}
        />

        <input
          type="text"
          placeholder="Client Name"
          value={form.clientName}
          onChange={(e) => updateField("clientName", e.target.value)}
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
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
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