import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";



export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Temporary debug — remove after fixing
console.log("Env check:", {
  hasResend: !!process.env.RESEND_API_KEY,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return res.status(500).json({ 
    error: `Missing: ${[
      !process.env.RESEND_API_KEY && "RESEND_API_KEY",
      !process.env.SUPABASE_URL && "SUPABASE_URL", 
      !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean).join(", ")}` 
  });
}

  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { ownerEmail, memberEmail, ownerId, appUrl } = req.body;

  if (!memberEmail || !ownerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if already invited
    const { data: existing } = await supabase
      .from("team_members")
      .select("id, status")
      .eq("owner_id", ownerId)
      .eq("member_email", memberEmail)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        error:
          existing.status === "active"
            ? "This person is already a team member"
            : "Invite already sent to this email",
      });
    }

    // Prevent owner from inviting themselves
if (memberEmail === ownerEmail) {
  return res.status(400).json({ error: "You cannot invite yourself" });
}

    // Generate secure invite token
    const token = randomBytes(32).toString("hex");

    // Save invite to DB
    const { error: insertError } = await supabase
      .from("team_members")
      .insert({
        owner_id: ownerId,
        member_email: memberEmail,
        role: "member",
        status: "pending",
        invite_token: token,
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    const inviteUrl = `${appUrl}/accept-invite/${token}`;

    // Send invite email
    await resend.emails.send({
      from: "Onboardly <onboarding@resend.dev>",
      to: [memberEmail],
      subject: `You're invited to join Onboardly`,
      html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0"
            style="background:#fff;border-radius:12px;overflow:hidden;
            box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#6366f1;padding:28px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                  Onboardly
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">
                  You've been invited 🎉
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
                  <strong style="color:#111827;">${ownerEmail || "Your team"}</strong> 
                  has invited you to collaborate on Onboardly as a 
                  <strong style="color:#111827;">Member</strong>.
                </p>
                <a href="${inviteUrl}"
                  style="display:inline-block;background:#6366f1;color:#fff;
                  text-decoration:none;font-size:15px;font-weight:600;
                  padding:14px 32px;border-radius:8px;">
                  Accept Invitation →
                </a>
                <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
                  This invite link expires in 7 days.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                padding:16px 40px;text-align:center;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  Powered by <strong style="color:#6366f1;">Onboardly</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}