import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Loader2, UserPlus, Trash2, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      await loadMembers(user?.id);
    }
    init();
  }, []);

  async function loadMembers(ownerId?: string) {
    if (!ownerId) return;
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", ownerId)
      .order("invited_at", { ascending: false });

    setMembers(data || []);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !currentUser) return;
    setInviting(true);

    try {
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: currentUser.id,
          ownerEmail: currentUser.email,
          memberEmail: email.trim(),
          appUrl: window.location.origin,
        }),
      });
      
      const text = await response.text();

    if (!text) {
      throw new Error("API route not reachable. Check Vercel deployment.");
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server error: ${text.slice(0, 100)}`);
    }
      

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      toast.success(`Invite sent to ${email}`);
      setEmail("");
      await loadMembers(currentUser.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    const confirmed = window.confirm(
      "Remove this team member? They will lose access immediately."
    );
    if (!confirmed) return;

    await supabase.from("team_members").delete().eq("id", memberId);
    toast.success("Member removed");
    await loadMembers(currentUser?.id);
  }

  return (
    <>
      <Toaster position="top-center" />
      <div style={{ padding: 40, maxWidth: 640 }}>
        <button
          onClick={() => window.location.assign("/dashboard")}
          style={{
            background: "none", border: "none",
            color: "#6b7280", cursor: "pointer",
            fontSize: 14, marginBottom: 24, padding: 0,
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 700, 
          color: "#111827", margin: "0 0 4px" }}>
          Team Members
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 32px" }}>
          Invite people to help manage your client portals.
        </p>

        {/* Invite Form */}
        <div style={{
          background: "#fff", borderRadius: 12,
          border: "1px solid #e5e7eb", padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, 
            color: "#111827", margin: "0 0 16px" }}>
            Invite a Member
          </h2>
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 12 }}>
            <input
              type="email"
              placeholder="colleague@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1, padding: "10px 14px",
                borderRadius: 8, border: "1px solid #d1d5db",
                fontSize: 14, outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={inviting}
              style={{
                padding: "10px 20px",
                background: inviting ? "#a5b4fc" : "#6366f1",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: inviting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              {inviting
                ? <Loader2 style={{ width: 14, height: 14 }} />
                : <UserPlus style={{ width: 14, height: 14 }} />
              }
              {inviting ? "Sending..." : "Send Invite"}
            </button>
          </form>
        </div>

        {/* Members List */}
        <div style={{
          background: "#fff", borderRadius: 12,
          border: "1px solid #e5e7eb", overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            fontSize: 14, fontWeight: 600, color: "#374151",
          }}>
            {/* Owner row */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#6366f1", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                }}>
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, 
                    fontWeight: 500, color: "#111827" }}>
                    {currentUser?.email}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                    You
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#6366f1",
                background: "#ede9fe", padding: "4px 10px", borderRadius: 20,
              }}>
                Owner
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Loader2 style={{ width: 24, height: 24, 
                animation: "spin 1s linear infinite", color: "#9ca3af" }} />
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 14 }}>No team members yet.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Invite someone above to get started.
              </p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: member.status === "active" ? "#10b981" : "#e5e7eb",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#fff",
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {member.member_email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, 
                      fontWeight: 500, color: "#111827" }}>
                      {member.member_email}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, 
                      color: member.status === "active" ? "#10b981" : "#9ca3af",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {member.status === "active"
                        ? <><CheckCircle2 style={{ width: 10, height: 10 }} /> Active</>
                        : <><Clock style={{ width: 10, height: 10 }} /> Invite pending</>
                      }
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "#374151",
                    background: "#f3f4f6", padding: "4px 10px", borderRadius: 20,
                  }}>
                    Member
                  </span>
                  <button
                    onClick={() => handleRemove(member.id)}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", color: "#ef4444", padding: 4,
                    }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}