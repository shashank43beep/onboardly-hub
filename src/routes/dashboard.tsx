import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const data = await portalStore.list();
        setPortals(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function copyPortalLink(id: string) {
    const url = `${window.location.origin}/portal/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <button
          onClick={() => window.location.assign("/dashboard/new")}
          style={buttonBlue}
        >
          + Create Portal
        </button>

        <button onClick={handleLogout} style={buttonRed}>
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : portals.length === 0 ? (
        <p>No portals yet</p>
      ) : (
        portals.map((portal) => (
          <div
            key={portal.id}
            style={{
              padding: 18,
              background: "#fff",
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3>{portal.portalName}</h3>
            <p style={{ color: "#666" }}>{portal.clientName}</p>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => copyPortalLink(portal.id)}
                style={buttonGray}
              >
                Copy Portal Link
              </button>

              <button
                onClick={() =>
                  window.open(`/portal/${portal.id}`, "_blank")
                }
                style={buttonBlue}
              >
                Open Client Portal
              </button>
            </div>
          </div>
        ))
      )}

      <Outlet />
    </div>
  );
}

const buttonBlue = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const buttonRed = {
  padding: "12px 18px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const buttonGray = {
  padding: "12px 18px",
  background: "#f3f4f6",
  color: "#111827",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
