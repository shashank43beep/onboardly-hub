import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [portals, setPortals] = useState<any[]>([]);

  useEffect(() => {
    async function loadPortals() {
      try {
        const data = await portalStore.list();
        setPortals(data || []);
      } catch (error) {
        console.error("Failed loading portals:", error);
        setPortals([]);
      }
    }

    loadPortals();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Dashboard</h1>

      <button
        onClick={() => navigate({ to: "/dashboard/new" })}
        style={{
          marginBottom: 20,
          padding: "10px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        + Create Portal
      </button>

      {portals.length === 0 && <p>No portals yet</p>}

      {portals.map((p) => (
        <div
          key={p.id}
          onClick={() =>
            navigate({
              to: "/portal/$id",
              params: { id: String(p.id) },
            })
          }
          style={{
            border: "1px solid #e2e8f0",
            padding: 16,
            borderRadius: 10,
            marginBottom: 12,
            cursor: "pointer",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: 0 }}>{p.portalName}</h3>
          <p style={{ color: "#64748b", marginTop: 6 }}>{p.clientName}</p>
        </div>
      ))}
    </div>
  );
}
