import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { portalStore, type Portal } from "@/lib/storage";
import {
  ArrowLeft,
  FileText,
  Upload,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  ExternalLink,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/submission/$id")({
  component: SubmissionViewer,
});

function SubmissionViewer() {
  const { id } = Route.useParams();
  const [submission, setSubmission] = useState<any>(null);
  const [portal, setPortal] = useState<Portal | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load portal details
      const portalData = await portalStore.get(id);
      setPortal(portalData);

      // Load submission
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("*")
        .eq("portal_id", id)
        .maybeSingle();
      setSubmission(submissionData);

      // Load uploaded files
      if (portalData) {
        const { data: fileList } = await supabase.storage
          .from("portal-files")
          .list(id, { sortBy: { column: "created_at", order: "desc" } });
        setFiles(fileList || []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        fontFamily: "-apple-system, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #e5e7eb",
            borderTopColor: "#6366f1",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }} />
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading submission...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const progress = portal?.progress ?? {
  formComplete: false,
  filesUploaded: false,
  paymentCompleted: false,
  meetingBooked: false,
};
  const steps = [
    { key: "formComplete", label: "Intake Form", icon: FileText, done: progress.formComplete },
    { key: "filesUploaded", label: "File Upload", icon: Upload, done: progress.filesUploaded },
    { key: "paymentCompleted", label: "Payment", icon: CreditCard, done: progress.paymentCompleted },
    { key: "meetingBooked", label: "Meeting Booked", icon: Calendar, done: progress.meetingBooked },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const projectDetails = submission?.project_details || {};
  {submission?.custom_answers &&
  Object.keys(submission.custom_answers).length > 0 && (
    <>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#6366f1",
        letterSpacing: "0.6px", textTransform: "uppercase",
        margin: "16px 0 8px", paddingTop: 12,
        borderTop: "1px solid #e5e7eb",
      }}>
        Custom Questions
      </div>
      {portal?.custom_questions?.map((q) => (
        submission.custom_answers[q.id] && (
          <div key={q.id} style={{
            padding: "12px 16px", borderRadius: 10,
            background: "#fafafa", border: "1px solid #e5e7eb",
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 11,
              fontWeight: 600, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.6px",
            }}>
              {q.label}
            </p>
            <p style={{
              margin: 0, fontSize: 14,
              color: "#111827", lineHeight: 1.6,
            }}>
              {submission.custom_answers[q.id]}
            </p>
          </div>
        )
      ))}
    </>
  )}

  function formatSize(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function downloadFile(fileName: string) {
    const { data } = await supabase.storage
      .from("portal-files")
      .download(`${id}/${fileName}`);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => window.location.assign("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none",
              color: "#6b7280", cursor: "pointer",
              fontSize: 14, fontFamily: "inherit",
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Dashboard
          </button>
          <span style={{ color: "#e5e7eb" }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            {portal?.portalName || "Submission"}
          </span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, color: "#6b7280",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: progressPct === 100 ? "#10b981" : "#f59e0b",
          }} />
          {progressPct === 100 ? "Onboarding complete" : `${progressPct}% complete`}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Hero card ── */}
        <div style={{
          background: portal?.brandColor || "#6366f1",
          borderRadius: 20, padding: "28px 32px",
          marginBottom: 24, position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Client Submission
              </p>
              <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#fff" }}>
                {portal?.clientName || submission?.client_name || "Client"}
              </h1>
              {portal?.clientCompany && (
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  🏢 {portal.clientCompany}
                </p>
              )}
              {portal?.clientEmail && (
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  ✉️ {portal.clientEmail}
                </p>
              )}
            </div>

            {/* Progress ring */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: "#fff",
              }}>
                {progressPct}%
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                Complete
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: 20, height: 6,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: "#fff", borderRadius: 999,
              transition: "width 0.5s",
            }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Onboarding steps */}
            <Section title="Onboarding Progress">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map((step) => (
                  <div key={step.key} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 10,
                    background: step.done ? "#f0fdf4" : "#fafafa",
                    border: `1px solid ${step.done ? "#bbf7d0" : "#e5e7eb"}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: step.done
                        ? "#10b981" : "#e5e7eb",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                    }}>
                      <step.icon style={{
                        width: 16, height: 16,
                        color: step.done ? "#fff" : "#9ca3af",
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0, fontSize: 14, fontWeight: 600,
                        color: step.done ? "#166534" : "#374151",
                      }}>
                        {step.label}
                      </p>
                    </div>
                    {step.done ? (
                      <CheckCircle2 style={{ width: 18, height: 18, color: "#10b981" }} />
                    ) : (
                      <Clock style={{ width: 18, height: 18, color: "#d1d5db" }} />
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Intake form answers */}
            {submission ? (
              <Section title="Intake Form Answers">
                {Object.keys(projectDetails).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(projectDetails).map(([key, value]) => (
                      <div key={key} style={{
                        padding: "12px 16px", borderRadius: 10,
                        background: "#fafafa", border: "1px solid #e5e7eb",
                      }}>
                        <p style={{
                          margin: "0 0 4px", fontSize: 11,
                          fontWeight: 600, color: "#9ca3af",
                          textTransform: "uppercase", letterSpacing: "0.6px",
                        }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                        </p>
                        <p style={{
                          margin: 0, fontSize: 14,
                          color: "#111827", lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}>
                          {String(value) || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="📋" message="No form answers yet" />
                )}
              </Section>
            ) : (
              <Section title="Intake Form Answers">
                <EmptyState icon="📋" message="Client hasn't submitted the form yet" />
              </Section>
            )}

            {/* Uploaded files */}
            <Section title={`Uploaded Files ${files.length > 0 ? `(${files.length})` : ""}`}>
              {files.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {files.map((file) => (
                    <div key={file.name} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      background: "#fafafa", border: "1px solid #e5e7eb",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "#ede9fe",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0,
                        fontSize: 16,
                      }}>
                        {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "🖼️"
                          : file.name.match(/\.(pdf)$/i) ? "📄"
                          : file.name.match(/\.(zip|rar)$/i) ? "🗜️"
                          : file.name.match(/\.(doc|docx)$/i) ? "📝"
                          : "📎"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0, fontSize: 13, fontWeight: 500,
                          color: "#111827",
                          overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {file.name}
                        </p>
                        {file.metadata?.size && (
                          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                            {formatSize(file.metadata.size)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => downloadFile(file.name)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 12px", borderRadius: 6,
                          background: "#f3f4f6", border: "none",
                          cursor: "pointer", fontSize: 12,
                          color: "#374151", fontFamily: "inherit",
                          flexShrink: 0,
                        }}
                      >
                        <Download style={{ width: 12, height: 12 }} />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="📁" message="No files uploaded yet" />
              )}
            </Section>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Client details */}
            <Section title="Client Details">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: Mail, label: "Email", value: portal?.clientEmail },
                  { icon: Phone, label: "Phone", value: portal?.clientPhone },
                  { icon: Building2, label: "Company", value: portal?.clientCompany },
                  { icon: CalendarDays, label: "Deadline", value: portal?.projectDeadline
                    ? new Date(portal.projectDeadline).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : null,
                  },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#f3f4f6", flexShrink: 0,
                      display: "flex", alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <item.icon style={{ width: 14, height: 14, color: "#6b7280" }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                        {item.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: "#111827", fontWeight: 500 }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Internal notes */}
            {portal?.internalNotes && (
              <Section title="Internal Notes">
                <p style={{
                  margin: 0, fontSize: 13, color: "#374151",
                  lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>
                  {portal.internalNotes}
                </p>
                <p style={{
                  margin: "8px 0 0", fontSize: 11,
                  color: "#9ca3af",
                }}>
                  🔒 Only visible to you
                </p>
              </Section>
            )}

            {/* Portal links */}
            <Section title="Portal Links">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {portal?.paymentLink ? (
                  <a
                    href={portal.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 8,
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      textDecoration: "none", fontSize: 13,
                      color: "#166534", fontWeight: 500,
                    }}
                  >
                    <span>💳 Payment Link</span>
                    <ExternalLink style={{ width: 12, height: 12 }} />
                  </a>
                ) : (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#fafafa", border: "1px solid #e5e7eb",
                    fontSize: 13, color: "#9ca3af",
                  }}>
                    💳 No payment link set
                  </div>
                )}

                {portal?.meetingLink ? (
                  <a
                    href={portal.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 8,
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      textDecoration: "none", fontSize: 13,
                      color: "#1e40af", fontWeight: 500,
                    }}
                  >
                    <span>📅 Meeting Link</span>
                    <ExternalLink style={{ width: 12, height: 12 }} />
                  </a>
                ) : (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#fafafa", border: "1px solid #e5e7eb",
                    fontSize: 13, color: "#9ca3af",
                  }}>
                    📅 No meeting link set
                  </div>
                )}

                <a
                  href={`/portal/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 8,
                    background: "#faf5ff", border: "1px solid #e9d5ff",
                    textDecoration: "none", fontSize: 13,
                    color: "#6b21a8", fontWeight: 500,
                  }}
                >
                  <span>🔗 Open Client Portal</span>
                  <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              </div>
            </Section>

            {/* Quick actions */}
            <Section title="Quick Actions">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/portal/${id}`
                    );
                  }}
                  style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#f3f4f6", border: "none",
                    cursor: "pointer", fontSize: 13,
                    color: "#374151", fontFamily: "inherit",
                    textAlign: "left", fontWeight: 500,
                  }}
                >
                  📋 Copy portal link
                </button>
                {portal?.clientEmail && (
                  <button
                    onClick={() => window.open(
                      `mailto:${portal.clientEmail}?subject=Your onboarding for ${portal.portalName}`,
                      "_blank"
                    )}
                    style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: "#f3f4f6", border: "none",
                      cursor: "pointer", fontSize: 13,
                      color: "#374151", fontFamily: "inherit",
                      textAlign: "left", fontWeight: 500,
                    }}
                  >
                    ✉️ Email client
                  </button>
                )}
                {portal?.clientPhone && (
                  <button
                    onClick={() => window.open(
                      `https://wa.me/${portal.clientPhone?.replace(/[^0-9]/g, "")}`,
                      "_blank"
                    )}
                    style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      cursor: "pointer", fontSize: 13,
                      color: "#166534", fontFamily: "inherit",
                      textAlign: "left", fontWeight: 500,
                    }}
                  >
                    💬 WhatsApp client
                  </button>
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Section({
  title, children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: "1px solid #e5e7eb", padding: "20px 24px",
    }}>
      <h2 style={{
        fontSize: 13, fontWeight: 600, color: "#374151",
        margin: "0 0 16px", textTransform: "uppercase",
        letterSpacing: "0.6px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "24px 16px",
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{message}</p>
    </div>
  );
}
