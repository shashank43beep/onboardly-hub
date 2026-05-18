import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/accept-invite/$token")({
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("invite_token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (error || !data) {
        toast.error("Invite not found or already used");
      } else {
        setInvite(data);
        // Check if user already has an account
        const { data: session } = await supabase.auth.getSession();
        if (session.session?.user?.email === data.member_email) {
          setAlreadyHasAccount(true);
        }
      }
      setLoading(false);
    }

    loadInvite();
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);

    try {
      let userId: string;

      if (alreadyHasAccount) {
        // Already logged in with correct account
        const { data: { user } } = await supabase.auth.getUser();
        userId = user!.id;
      } else {
        // Sign up with email + password
        const { data, error } = await supabase.auth.signUp({
          email: invite.member_email,
          password,
        });

        if (error) throw error;
        userId = data.user!.id;
      }

      // Activate the membership
      const { error: updateError } = await supabase
        .from("team_members")
        .update({
          member_id: userId,
          status: "active",
          invite_token: null,
          joined_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      toast.success("Welcome to the team!");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", 
        alignItems: "center", minHeight: "100vh" }}>
        <Loader2 style={{ width: 32, height: 32, 
          animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!invite) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <h1 style={{ fontSize: 24, color: "#111827" }}>
          Invalid or expired invite
        </h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Ask your team owner to send a new invite.
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 40,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#6366f1", display: "flex",
            alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <Sparkles style={{ width: 24, height: 24, color: "#fff" }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, 
            color: "#111827", margin: "0 0 8px" }}>
            Accept your invite
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, 
            lineHeight: 1.6, margin: "0 0 28px" }}>
            You've been invited to join as a{" "}
            <strong style={{ color: "#111827" }}>Member</strong>.
            {!alreadyHasAccount && " Set a password to create your account."}
          </p>

          <form onSubmit={handleAccept}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, 
                color: "#374151", display: "block", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={invite.member_email}
                disabled
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#f9fafb", color: "#6b7280",
                  fontSize: 14, boxSizing: "border-box",
                }}
              />
            </div>

            {!alreadyHasAccount && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500,
                  color: "#374151", display: "block", marginBottom: 6 }}>
                  Set a password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: 8, border: "1px solid #d1d5db",
                    fontSize: 14, boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "12px",
                background: submitting ? "#a5b4fc" : "#6366f1",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 15, fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
              }}
            >
              {submitting && (
                <Loader2 style={{ width: 16, height: 16,
                  animation: "spin 1s linear infinite" }} />
              )}
              {submitting ? "Joining..." : "Accept & Join Team"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}