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

  async function loadPortals() {
    const data = await portalStore.list();
    setPortals(data || []);
  }

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

        await loadPortals();
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

function sendInvite(portal: any) {
  if (!portal.clientEmail) {
    toast.error("No client email found");
    return;
  }

  const link = `${window.location.origin}/portal/${portal.id}`;

  const subject = encodeURIComponent(
    `Your onboarding portal - ${portal.portalName}`
  );

  const body = encodeURIComponent(
    `Hi ${portal.clientName},

Welcome onboard.

Please complete your onboarding here:
${link}

Thanks`
  );

  window.open(
    `mailto:${portal.clientEmail}?subject=${subject}&body=${body}`
  );

  toast.success("Email draft opened");
}

  async function deletePortal(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this portal?"
    );

    if (!confirmed) return;

    await portalStore.delete(id);
    toast.success("Portal deleted");
    await loadPortals();
  }
  async function archivePortal(id: string) {
  await portalStore.update(id, {
    archived: true,
  });

  toast.success("Portal archived");
  await loadPortals();
}

  async function restorePortal(id: string) {
  await portalStore.update(id, {
    archived: false,
  });

  toast.success("Portal restored");
  await loadPortals();
}

  async function editPortal(portal: any) {
    const newPortalName = window.prompt(
      "Edit portal name",
      portal.portalName
    );

    if (!newPortalName) return;

    const newClientName = window.prompt(
      "Edit client name",
      portal.clientName
    );

    if (!newClientName) return;

    await portalStore.update(portal.id, {
      portalName: newPortalName,
      clientName: newClientName,
    });

    toast.success("Portal updated");
    await loadPortals();
  }

  function getProgress(portal: any) {
    const values = Object.values(portal.progress || {});
    const completed = values.filter(Boolean).length;
    return Math.round((completed / 4) * 100);
  }

  function getStatus(progress: number) {
    if (progress === 0) return "Not started";
    if (progress === 100) return "Completed";
    return "In progress";
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
  <>
    {portals
      .filter((portal) => !portal.archived)
      .map((portal) => {
        const progress = getProgress(portal);

        return (
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
            <p style={{ color: "#666", marginBottom: 12 }}>
              {portal.clientName}
            </p>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 14,
                }}
              >
                <span>{getStatus(progress)}</span>
                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 8,
                  background: "#e5e7eb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#2563eb",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <button onClick={() => copyPortalLink(portal.id)} style={buttonGray}>
                Copy Portal Link
              </button>

              <button onClick={() => sendInvite(portal)} style={buttonBlue}>
                Send Invite
              </button>

              <button
                onClick={() => window.open(`/portal/${portal.id}`, "_blank")}
                style={buttonBlue}
              >
                Open Client Portal
              </button>

              <button onClick={() => editPortal(portal)} style={buttonGray}>
                Edit
              </button>

              <button onClick={() => deletePortal(portal.id)} style={buttonRed}>
                Delete
              </button>

              <button onClick={() => archivePortal(portal.id)} style={buttonGray}>
                Archive
              </button>
            </div>
          </div>
        );
      })}

    <h2 style={{ marginTop: 40 }}>Archived Portals</h2>

    {portals
      .filter((portal) => portal.archived)
      .map((portal) => (
        <div
          key={portal.id}
          style={{
            padding: 18,
            background: "#f9fafb",
            marginBottom: 16,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            opacity: 0.8,
          }}
        >
          <h3>{portal.portalName}</h3>
          <p style={{ color: "#666" }}>{portal.clientName}</p>

        <button
          onClick={() => restorePortal(portal.id)}
          style={{ ...buttonBlue, marginTop: 12 }}
        >
          Restore
      </button>
        </div>
      ))}
  </>
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
