import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { CommentThread } from "@/components/CommentThread";
import { sendReminderEmail } from "@/lib/api"; 
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingPortal, setEditingPortal] = useState<any | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [openChatPortalId, setOpenChatPortalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    portalName: "",
    clientName: "",
    notes: "",
  });

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


  function exportCSV() {
  const headers = ["Portal Name", "Client Name", "Email", "Status"];

  const rows = portals.map((portal) => [
    portal.portalName || "",
    portal.clientName || "",
    portal.clientEmail || "",
    getStatus(getProgress(portal)),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "portals.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("CSV exported");
}
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
    if (!portal.clientEmail || portal.clientEmail.trim() === "") {
  toast.error("No client email found");
  return;
}
       const link = `${window.location.origin}/portal/${portal.id}`;

    const subject = encodeURIComponent(
      `Your onboarding portal - ${portal.portalName}`
    );

    const body = encodeURIComponent(`Hi ${portal.clientName},

Welcome onboard.

Please complete your onboarding here:
${link}

Thanks`);

    window.open(
      `mailto:${portal.clientEmail}?subject=${subject}&body=${body}`
    );

    toast.success("Email draft opened");
  }

  // ADD this import at the top of dashboard.tsx with your other imports:
// import { sendReminderEmail } from "@/lib/api";

// ADD this state inside DashboardPage() near your other useState calls:
// const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

async function sendReminder(portal: any) {
  if (!portal.clientEmail || portal.clientEmail.trim() === "") {
    toast.error("No client email found for this portal.");
    return;
  }

  setSendingReminderId(portal.id);

  try {
    await sendReminderEmail({
      portalId: portal.id,
      clientEmail: portal.clientEmail,
      clientName: portal.clientName,
      portalName: portal.portalName,
      portalUrl: `${window.location.origin}/portal/${portal.id}`,
    });

    toast.success(`Reminder sent to ${portal.clientEmail}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send";
    toast.error(message);
  } finally {
    setSendingReminderId(null);
  }
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

  function editPortal(portal: any) {
    setEditingPortal(portal);

    setEditForm({
      portalName: portal.portalName || "",
      clientName: portal.clientName || "",
      notes: portal.notes || "",
    });
  }

  async function saveEditPortal() {
    if (!editingPortal) return;

    await portalStore.update(editingPortal.id, {
      portalName: editForm.portalName,
      clientName: editForm.clientName,
      notes: editForm.notes,
    });

    toast.success("Portal updated");
    setEditingPortal(null);
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
    <>
    <Toaster position="top-center" />
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <button
          onClick={() => window.location.assign("/dashboard/new")}
          style={buttonBlue}
        >
          + Create Portal
        </button>

      <button onClick={exportCSV} style={buttonGray}>
      Export CSV
        </button>


        <button onClick={handleLogout} style={buttonRed}>
          Logout
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by portal or client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          marginBottom: 24,
        }}
      />
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 30,
  }}
>
  <div style={statCard}>
    <p style={statLabel}>Total Portals</p>
    <h2 style={statValue}>{portals.length}</h2>
  </div>

  <div style={statCard}>
    <p style={statLabel}>Active Clients</p>
    <h2 style={statValue}>
      {portals.filter((portal) => portal.archived !== true).length}
    </h2>
  </div>

  <div style={statCard}>
    <p style={statLabel}>Completed</p>
    <h2 style={statValue}>
      {
        portals.filter(
          (portal) => getProgress(portal) === 100
        ).length
      }
    </h2>
  </div>

  <div style={statCard}>
    <p style={statLabel}>Archived</p>
    <h2 style={statValue}>
      {portals.filter((portal) => portal.archived === true).length}
    </h2>
  </div>
</div>

<div
  style={{
    display: "flex",
    gap: 10,
    marginBottom: 24,
    flexWrap: "wrap",
  }}
>
  {["all", "not_started", "in_progress", "completed"].map((status) => (
    <button
      key={status}
      onClick={() => setStatusFilter(status)}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background:
          statusFilter === status ? "#2563eb" : "#f3f4f6",
        color:
          statusFilter === status ? "white" : "#111827",
      }}
    >
      {status === "all"
        ? "All"
        : status === "not_started"
        ? "Not Started"
        : status === "in_progress"
        ? "In Progress"
        : "Completed"}
    </button>
  ))}
</div>

      {loading ? (
        <p>Loading...</p>
      ) : portals.length === 0 ? (
        <p>No portals yet</p>
      ) : (
        <>
          {portals
            .filter(
  (portal) =>
    portal.archived !== true &&
    (portal.portalName
      .toLowerCase()
      .includes(search.toLowerCase()) ||
      portal.clientName
        .toLowerCase()
        .includes(search.toLowerCase()))
)
  .filter((portal) => {
    const progress = getProgress(portal);

    if (statusFilter === "all") return true;
    if (statusFilter === "not_started") return progress === 0;
    if (statusFilter === "completed") return progress === 100;
    if (statusFilter === "in_progress")
      return progress > 0 && progress < 100;

    return true;
  })
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

                  <p
                    style={{
                      fontSize: 13,
                      color: "#9ca3af",
                      marginBottom: 12,
                    }}
                  >
                    Created:{" "}
                    {new Date(portal.createdAt).toLocaleDateString()}
                  </p>

                  {portal.notes && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        marginBottom: 12,
                      }}
                    >
                      Notes: {portal.notes}
                    </p>
                  )}

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
                    <button
                      onClick={() => copyPortalLink(portal.id)}
                      style={buttonGray}
                    >
                      Copy Portal Link
                    </button>

                    <button
                      onClick={() => sendInvite(portal)}
                      style={buttonBlue}
                    >
                      Send Invite
                    </button>

                   

                    <button
  onClick={() => sendReminder(portal)}
  disabled={sendingReminderId === portal.id}
  style={{
    ...buttonGray,
    opacity: sendingReminderId === portal.id ? 0.6 : 1,
    cursor: sendingReminderId === portal.id ? "not-allowed" : "pointer",
  }}
>
  {sendingReminderId === portal.id ? "Sending..." : "Reminder Email"}
</button>

                    <button
                      onClick={() =>
                        window.open(`/portal/${portal.id}`, "_blank")
                      }
                      style={buttonBlue}
                    >
                      Open Client Portal
                    </button>

                    <button
                      onClick={() =>
                      window.location.assign(`/dashboard/submission/${portal.id}`)
                    }
                      style={buttonGray}
                    >
                      View Submission
                    </button>

                    <button
                      onClick={() => editPortal(portal)}
                      style={buttonGray}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deletePortal(portal.id)}
                      style={buttonRed}
                    >
                      Delete
                    </button>
                    <button
  onClick={() =>
    window.location.assign(`/dashboard/activity/${portal.id}`)
  }
  style={buttonGray}
>
  Activity Timeline
</button>
                    <button
                      onClick={() => archivePortal(portal.id)}
                      style={buttonGray}
                    >
                      Archive
                    </button>

 <button
  onClick={() =>
    setOpenChatPortalId(
      openChatPortalId === portal.id ? null : portal.id
    )
  }
  style={buttonGray}
>
  {openChatPortalId === portal.id ? "Close Chat" : "💬 Messages"}
</button>

                  </div>
                  {openChatPortalId === portal.id && (
  <div style={{ marginTop: 16 }}>
    <CommentThread
      portalId={portal.id}
      authorType="admin"
      authorName="Admin"
      clientEmail={portal.clientEmail}
      clientName={portal.clientName}
      portalName={portal.portalName}
    />
  </div>
)}
                </div>
              );
            })}
<Outlet />

<div
  style={{
    marginTop: 40,
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    height: 320,
  }}
>
  <h2 style={{ marginBottom: 20 }}>Portal Progress Overview</h2>

  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={portals.map((portal) => ({
        name: portal.portalName,
        progress: getProgress(portal),
      }))}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="progress" fill="#2563eb" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
          <h2 style={{ marginTop: 40 }}>Archived Portals</h2>

          {portals
            .filter((portal) => portal.archived === true).filter(
  (portal) =>
    portal.archived &&
    (portal.portalName
      .toLowerCase()
      .includes(search.toLowerCase()) ||
      portal.clientName
        .toLowerCase()
        .includes(search.toLowerCase()))
)
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

                <p
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    marginTop: 6,
                  }}
                >
                  Created:{" "}
                  {new Date(portal.createdAt).toLocaleDateString()}
                </p>

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

      {editingPortal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: 420,
            }}
          >
            <h2 style={{ marginBottom: 16 }}>Edit Portal</h2>

            <input
              value={editForm.portalName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  portalName: e.target.value,
                })
              }
              placeholder="Portal name"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 12,
              }}
            />

            <input
              value={editForm.clientName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  clientName: e.target.value,
                })
              }
              placeholder="Client name"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 12,
              }}
            />

            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  notes: e.target.value,
                })
              }
              placeholder="Internal notes"
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 16,
              }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveEditPortal} style={buttonBlue}>
                Save
              </button>

              <button
                onClick={() => setEditingPortal(null)}
                style={buttonRed}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
   </>
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

const statCard = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const statLabel = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 8,
};

const statValue = {
  fontSize: 28,
  fontWeight: 700,
  margin: 0,
};
