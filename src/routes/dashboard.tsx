import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { CommentThread } from "@/components/CommentThread";
import { sendReminderEmail } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { Logo } from "@/components/logo";

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
  const { isMember } = useRole();
  const isExactDashboard = window.location.pathname === "/dashboard";
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingPortal, setEditingPortal] = useState<any | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [openChatPortalId, setOpenChatPortalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    portalName: "",
    clientName: "",
    notes: "",
  });

  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function loadPortals() {
    const data = await portalStore.list();
    setPortals(data || []);
  }

  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    const confirmed = window.confirm("Are you sure you want to delete this portal?");
    if (!confirmed) return;
    await portalStore.delete(id);
    toast.success("Portal deleted");
    await loadPortals();
  }

  async function archivePortal(id: string) {
    await portalStore.update(id, { archived: true });
    toast.success("Portal archived");
    await loadPortals();
  }

  async function restorePortal(id: string) {
    await portalStore.update(id, { archived: false });
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

  function getStatusColor(progress: number) {
    if (progress === 0) return "#9ca3af";
    if (progress === 100) return "#10b981";
    return "#f59e0b";
  }

  const activePortals = portals.filter((p) => !p.archived);
  const archivedPortals = portals.filter((p) => p.archived);

  return (
    <>
      <Toaster position="top-center" />
      {!isExactDashboard ? (
        <Outlet />
      ) : (
        <div style={{
          padding: "24px 32px",
          maxWidth: 1100,
          margin: "0 auto",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>

          {/* ── Top bar ── */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 28,
          }}>
            <Logo size={28} variant="full" />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => window.location.assign("/dashboard/new")}
                style={{
                  padding: "9px 16px", borderRadius: 8,
                  background: "#6366f1", color: "#fff",
                  border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                }}
              >
                + Create Portal
              </button>
              <button onClick={exportCSV} style={btnGhost}>Export CSV</button>
              {!isMember && (
                <button
                  onClick={() => window.location.assign("/dashboard/team")}
                  style={btnGhost}
                >
                  👥 Team
                </button>
              )}
              <button onClick={handleLogout} style={{
                ...btnGhost,
                color: "#ef4444",
                borderColor: "#fecaca",
              }}>
                Logout
              </button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12, marginBottom: 28,
          }}>
            {[
              { label: "Total portals", value: portals.length },
              { label: "Active clients", value: activePortals.length },
              { label: "Completed", value: portals.filter((p) => getProgress(p) === 100).length },
              { label: "Archived", value: archivedPortals.length },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: 12,
                border: "1px solid #e5e7eb", padding: "16px 20px",
              }}>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 6px" }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Search + filter ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search portals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "9px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14,
                flex: 1, minWidth: 200, outline: "none",
              }}
            />
            {["all", "not_started", "in_progress", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "9px 14px", borderRadius: 8,
                  border: "none", cursor: "pointer", fontSize: 13,
                  background: statusFilter === s ? "#6366f1" : "#f3f4f6",
                  color: statusFilter === s ? "#fff" : "#374151",
                  fontWeight: statusFilter === s ? 600 : 400,
                }}
              >
                {s === "all" ? "All"
                  : s === "not_started" ? "Not started"
                  : s === "in_progress" ? "In progress"
                  : "Completed"}
              </button>
            ))}
          </div>

          {/* ── Portal list ── */}
          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</p>
          ) : activePortals.length === 0 ? (
            /* Empty state */
            <div style={{
              textAlign: "center", padding: "64px 24px",
              background: "#fff", borderRadius: 16,
              border: "2px dashed #e5e7eb",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
                No portals yet
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>
                Create your first client onboarding portal in under 2 minutes.
              </p>
              <button
                onClick={() => window.location.assign("/dashboard/new")}
                style={{
                  padding: "12px 24px", borderRadius: 10,
                  background: "#6366f1", color: "#fff",
                  border: "none", cursor: "pointer",
                  fontSize: 15, fontWeight: 600,
                }}
              >
                + Create your first portal
              </button>
            </div>
          ) : (
            <>
              {activePortals
                .filter((portal) =>
                  (portal.portalName?.toLowerCase() || "").includes(search.toLowerCase()) ||
                  (portal.clientName?.toLowerCase() || "").includes(search.toLowerCase())
                )
                .filter((portal) => {
                  const progress = getProgress(portal);
                  if (statusFilter === "all") return true;
                  if (statusFilter === "not_started") return progress === 0;
                  if (statusFilter === "completed") return progress === 100;
                  if (statusFilter === "in_progress") return progress > 0 && progress < 100;
                  return true;
                })
                .map((portal) => {
                  const progress = getProgress(portal);
                  return (
                    <div
                      key={portal.id}
                      style={{
                        background: "#fff", marginBottom: 12,
                        borderRadius: 14, border: "1px solid #e5e7eb",
                        padding: "20px 24px",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      {/* Card header */}
                      <div style={{
                        display: "flex", alignItems: "flex-start",
                        justifyContent: "space-between", marginBottom: 12,
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: 16, fontWeight: 700,
                            color: "#111827", margin: "0 0 3px",
                          }}>
                            {portal.portalName}
                          </h3>
                          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                            {portal.clientName}
                            {portal.clientEmail && (
                              <span style={{ color: "#9ca3af" }}> · {portal.clientEmail}</span>
                            )}
                          </p>
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 600,
                          padding: "3px 10px", borderRadius: 999,
                          background: progress === 100 ? "#d1fae5"
                            : progress === 0 ? "#f3f4f6" : "#fef3c7",
                          color: getStatusColor(progress),
                        }}>
                          {getStatus(progress)}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "#9ca3af", marginBottom: 5,
                        }}>
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div style={{
                          height: 6, background: "#f3f4f6",
                          borderRadius: 999, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${progress}%`, height: "100%",
                            background: progress === 100 ? "#10b981"
                              : progress === 0 ? "#9ca3af" : "#6366f1",
                            borderRadius: 999,
                            transition: "width 0.3s",
                          }} />
                        </div>

                        {/* Step dots */}
                        <div style={{
                          display: "flex", gap: 6, marginTop: 8,
                        }}>
                          {[
                            { key: "formComplete", label: "Form" },
                            { key: "filesUploaded", label: "Files" },
                            { key: "paymentCompleted", label: "Payment" },
                            { key: "meetingBooked", label: "Meeting" },
                          ].map((step) => (
                            <div key={step.key} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              fontSize: 11,
                              color: portal.progress?.[step.key] ? "#10b981" : "#9ca3af",
                            }}>
                              <div style={{
                                width: 7, height: 7, borderRadius: "50%",
                                background: portal.progress?.[step.key] ? "#10b981" : "#e5e7eb",
                              }} />
                              {step.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{
                        display: "flex", gap: 8,
                        alignItems: "center",
                      }}>
                        {/* Primary */}
                        <button
                          onClick={() => window.open(`/portal/${portal.id}`, "_blank")}
                          style={{
                            padding: "8px 14px", borderRadius: 8,
                            background: portal.brandColor || "#6366f1",
                            color: "#fff", border: "none",
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                          }}
                        >
                          Open Portal ↗
                        </button>

                        {/* Messages */}
                        <button
                          onClick={() =>
                            setOpenChatPortalId(
                              openChatPortalId === portal.id ? null : portal.id
                            )
                          }
                          style={{
                            padding: "8px 14px", borderRadius: 8,
                            background: openChatPortalId === portal.id ? "#ede9fe" : "#f3f4f6",
                            color: openChatPortalId === portal.id ? "#6366f1" : "#374151",
                            border: "1px solid #e5e7eb",
                            cursor: "pointer", fontSize: 13, fontWeight: 500,
                          }}
                        >
                          {openChatPortalId === portal.id ? "✕ Close Chat" : "💬 Messages"}
                        </button>

                        {/* More dropdown */}
                        <div style={{ position: "relative", marginLeft: "auto" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === portal.id ? null : portal.id);
                            }}
                            style={{
                              padding: "8px 14px", borderRadius: 8,
                              background: "#f3f4f6", color: "#374151",
                              border: "1px solid #e5e7eb",
                              cursor: "pointer", fontSize: 13, fontWeight: 500,
                            }}
                          >
                            ⋯ More
                          </button>

                          {openMenuId === portal.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: "absolute", right: 0,
                                top: "calc(100% + 6px)",
                                background: "#fff", borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                                zIndex: 100, minWidth: 190,
                                overflow: "hidden",
                              }}
                            >
                              {[
                                {
                                  label: "📋 View Submission",
                                  onClick: () => {
                                    window.location.assign(`/dashboard/submission/${portal.id}`);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  label: "✏️ Edit Portal",
                                  onClick: () => {
                                    editPortal(portal);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  label: "🔗 Copy Link",
                                  onClick: () => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/portal/${portal.id}`
                                    );
                                    toast.success("Portal link copied");
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  label: sendingReminderId === portal.id
                                    ? "⏳ Sending..."
                                    : "✉️ Send Reminder",
                                  onClick: () => {
                                    sendReminder(portal);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  label: "📊 Activity Timeline",
                                  onClick: () => {
                                    window.location.assign(`/dashboard/activity/${portal.id}`);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  label: "📦 Archive",
                                  onClick: () => {
                                    archivePortal(portal.id);
                                    setOpenMenuId(null);
                                  },
                                },
                              ].map((item) => (
                                <button
                                  key={item.label}
                                  onClick={item.onClick}
                                  style={{
                                    display: "block", width: "100%",
                                    padding: "10px 16px", textAlign: "left",
                                    background: "none", border: "none",
                                    borderBottom: "1px solid #f3f4f6",
                                    cursor: "pointer", fontSize: 13,
                                    color: "#374151",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#f9fafb")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "none")
                                  }
                                >
                                  {item.label}
                                </button>
                              ))}

                              {!isMember && (
                                <button
                                  onClick={() => {
                                    deletePortal(portal.id);
                                    setOpenMenuId(null);
                                  }}
                                  style={{
                                    display: "block", width: "100%",
                                    padding: "10px 16px", textAlign: "left",
                                    background: "none", border: "none",
                                    cursor: "pointer", fontSize: 13,
                                    color: "#ef4444",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#fef2f2")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "none")
                                  }
                                >
                                  🗑️ Delete Portal
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chat thread */}
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

              {/* Analytics chart */}
              <div style={{
                marginTop: 32, background: "#fff",
                padding: 24, borderRadius: 14,
                border: "1px solid #e5e7eb",
                height: 300,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "#111827" }}>
                  Portal progress overview
                </h2>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={portals.map((portal) => ({
                      name: portal.portalName?.slice(0, 14) || "Portal",
                      progress: getProgress(portal),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="progress" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Archived portals */}
              {archivedPortals.length > 0 && (
                <>
                  <h2 style={{
                    fontSize: 16, fontWeight: 600,
                    color: "#374151", margin: "32px 0 12px",
                  }}>
                    Archived portals
                  </h2>
                  {archivedPortals
                    .filter((portal) =>
                      (portal.portalName?.toLowerCase() || "").includes(search.toLowerCase()) ||
                      (portal.clientName?.toLowerCase() || "").includes(search.toLowerCase())
                    )
                    .map((portal) => (
                      <div
                        key={portal.id}
                        style={{
                          padding: "16px 20px", background: "#f9fafb",
                          marginBottom: 10, borderRadius: 12,
                          border: "1px solid #e5e7eb", opacity: 0.8,
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: "#374151" }}>
                            {portal.portalName}
                          </h3>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                            {portal.clientName} · Archived
                          </p>
                        </div>
                        <button
                          onClick={() => restorePortal(portal.id)}
                          style={{
                            padding: "7px 14px", borderRadius: 8,
                            background: "#6366f1", color: "#fff",
                            border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 500,
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                </>
              )}
            </>
          )}

          {/* Edit modal */}
          {editingPortal && (
            <div style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex", justifyContent: "center",
              alignItems: "center", zIndex: 999,
            }}>
              <div style={{
                background: "#fff", padding: 28,
                borderRadius: 16, width: 440,
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", color: "#111827" }}>
                  Edit Portal
                </h2>
                {[
                  { placeholder: "Portal name", key: "portalName", value: editForm.portalName },
                  { placeholder: "Client name", key: "clientName", value: editForm.clientName },
                ].map((field) => (
                  <input
                    key={field.key}
                    value={field.value}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "10px 14px",
                      borderRadius: 8, border: "1px solid #d1d5db",
                      marginBottom: 12, fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                ))}
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Internal notes"
                  style={{
                    width: "100%", minHeight: 90, padding: "10px 14px",
                    borderRadius: 8, border: "1px solid #d1d5db",
                    marginBottom: 20, fontSize: 14,
                    boxSizing: "border-box", resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={saveEditPortal}
                    style={{
                      flex: 1, padding: "11px",
                      background: "#6366f1", color: "#fff",
                      border: "none", borderRadius: 8,
                      cursor: "pointer", fontWeight: 600, fontSize: 14,
                    }}
                  >
                    Save changes
                  </button>
                  <button
                    onClick={() => setEditingPortal(null)}
                    style={{
                      padding: "11px 18px",
                      background: "#f3f4f6", color: "#374151",
                      border: "none", borderRadius: 8,
                      cursor: "pointer", fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const btnGhost = {
  padding: "9px 14px",
  borderRadius: 8,
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};
