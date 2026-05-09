import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore } from "@/lib/storage";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [portals, setPortals] = useState<any[]>([]);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      loadPortals();
    }

    async function loadPortals() {
      try {
        const data = await portalStore.list();
        setPortals(data || []);
      } catch (error) {
        console.error("Failed to load portals:", error);
      }
    }

    checkUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
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
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Dashboard</h1>

        <a
          href="/dashboard/new"
          style={{
            display: "inline-block",
            padding: "12px 18px",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: 8,
            marginRight: 12,
          }}
        >
          + Create Portal
        </a>

        <button
          onClick={handleLogout}
          style={{
            padding: "12px 18px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <h2 style={{ marginBottom: "20px" }}>Your Portals</h2>

      {portals.length === 0 ? (
        <p>No portals created yet.</p>
      ) : (
        portals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => {
              window.location.href = `/portal/${portal.id}`;
            }}
            style={{
              background: "white",
              padding: "18px",
              borderRadius: "10px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}
          >
            <h3 style={{ margin: 0 }}>{portal.portalName}</h3>
            <p style={{ color: "#666", marginTop: "8px" }}>
              Client: {portal.clientName}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
