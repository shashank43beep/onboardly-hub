import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore } from "@/lib/storage";

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

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <button
        onClick={() => window.location.assign("/dashboard/new")}
        style={{
          padding: "12px 18px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginRight: 12,
        }}
      >
        + Create Portal
      </button>

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

      <div style={{ marginTop: 30 }}>
        {loading ? (
          <p>Loading...</p>
        ) : portals.length === 0 ? (
          <p>No portals yet</p>
        ) : (
          portals.map((portal) => (
            <div
              key={portal.id}
              onClick={() => window.location.assign(`/portal/${portal.id}`)}
              style={{
                padding: 16,
                background: "#fff",
                marginBottom: 12,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <h3>{portal.portalName}</h3>
              <p>{portal.clientName}</p>
            </div>
          ))
        )}
      </div>

      <Outlet />
    </div>
  );
}
