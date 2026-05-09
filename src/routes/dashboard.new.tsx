import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { portalStore } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/new")({
  component: NewPortalPage,
});

function NewPortalPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    portalName: "",
    clientName: "",
    welcomeMessage: "",
    brandLogo: "",
    paymentLink: "",
    meetingLink: "",
    webhookUrl: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const portal = await portalStore.create(form);
    if (portal) {
      alert("Portal created successfully!");
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
          Create onboarding portal
        </h1>

        <p style={{ color: "#64748b", marginBottom: "30px" }}>
          Customize what your client sees when they open the onboarding link.
        </p>

        <form onSubmit={handleSubmit}>
          <Field
            label="Portal Name"
            value={form.portalName}
            onChange={(v) => update("portalName", v)}
          />

          <Field
            label="Client Name"
            value={form.clientName}
            onChange={(v) => update("clientName", v)}
          />

          <Field
            label="Welcome Message"
            value={form.welcomeMessage}
            onChange={(v) => update("welcomeMessage", v)}
          />

          <Field
            label="Brand Logo URL"
            value={form.brandLogo}
            onChange={(v) => update("brandLogo", v)}
          />

          <Field
            label="Payment Link"
            value={form.paymentLink}
            onChange={(v) => update("paymentLink", v)}
          />

          <Field
            label="Meeting Link"
            value={form.meetingLink}
            onChange={(v) => update("meetingLink", v)}
          />

          <Field
            label="Webhook URL"
            value={form.webhookUrl}
            onChange={(v) => update("webhookUrl", v)}
          />

          <button
            type="submit"
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Create Portal
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          fontSize: "15px",
        }}
      />
    </div>
  );
}