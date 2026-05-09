import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/new")({
  component: NewPortalPage,
});

function NewPortalPage() {
  const [portalName, setPortalName] = useState("");
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      // getSession() reads from localStorage — no network call, works reliably on Vercel
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Session check:", session, error);
      if (!session) {
        window.location.href = "/login";
      }
    }
    checkUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!portalName || !clientName) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    console.log("Creating portal...");

    try {
      const portal = await portalStore.create({
        portalName,
        clientName,
        welcomeMessage: "Welcome aboard!",
        brandLogo: "",
        paymentLink: "",
        meetingLink: "",
        webhookUrl: "",
      });

      console.log("Portal created:", portal);

      if (!portal?.id) {
        throw new Error("Portal not created");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Create portal error:", err);
      setError("Failed to create portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px", background: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "30px", marginBottom: "24px" }}>Create Portal</h1>

      {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Portal Name"
            value={portalName}
            onChange={(e) => setPortalName(e.target.value)}
            style={{ width: "320px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ width: "320px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          {loading ? "Creating..." : "Create Portal"}
        </button>
      </form>
    </div>
  );
}
