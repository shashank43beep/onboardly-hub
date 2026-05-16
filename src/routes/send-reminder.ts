import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Set CORS headers first — before anything else
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Validate env vars before using them
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY is not set" });
  }
  if (!process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "SUPABASE_URL is not set" });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" });
  }

  // ✅ Initialize clients inside handler so crashes are catchable
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { portalId, clientEmail, clientName, portalName, portalUrl } = req.body;

  if (!clientEmail || !portalName || !portalId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data: portal, error: portalError } = await supabase
      .from("portals")
      .select("progress")
      .eq("id", portalId)
      .single();

    if (portalError) {
      return res.status(404).json({ error: "Portal not found" });
    }

    const progress = portal?.progress || {};
    const incompleteSteps: string[] = [];
    if (!progress.formComplete) incompleteSteps.push("📋 Intake form");
    if (!progress.filesUploaded) incompleteSteps.push("📁 File upload");
    if (!progress.paymentCompleted) incompleteSteps.push("💳 Payment");
    if (!progress.meetingBooked) incompleteSteps.push("📅 Meeting booking");

    const stepsHtml =
      incompleteSteps.length > 0
        ? `<ul style="padding-left:20px;">${incompleteSteps
            .map((s) => `<li style="margin:6px 0;">${s}</li>`)
            .join("")}</ul>`
        : "<p>✅ All steps are complete!</p>";

    const { data, error } = await resend.emails.send({
      from: "Onboardly <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Reminder: Complete your onboarding for ${portalName}`,
      html: buildReminderEmail({ clientName: clientName || "there", portalName, portalUrl, stepsHtml }),
    });

    await supabase.from("email_logs").insert({
      portal_id: portalId,
      recipient_email: clientEmail,
      email_type: "reminder",
      status: error ? "failed" : "sent",
      error_message: error?.message ?? null,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, emailId: data?.id });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // ✅ Always return JSON even on crash
    return res.status(500).json({ error: message });
  }
}

function buildReminderEmail({
  clientName,
  portalName,
  portalUrl,
  stepsHtml,
}: {
  clientName: string;
  portalName: string;
  portalUrl: string;
  stepsHtml: string;
}) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#6366f1;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Onboardly</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:600;">Hi ${clientName} 👋</h2>
                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                  You're almost done with your onboarding for <strong style="color:#111827;">${portalName}</strong>.
                  Just a few steps left:
                </p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;color:#374151;font-size:14px;line-height:1.8;">
                  ${stepsHtml}
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${portalUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;">
                        Continue Onboarding →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
                  If you have questions, just reply to this email.<br/>
                  This reminder was sent on behalf of ${portalName}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
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
</html>`;
}