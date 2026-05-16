import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

// Server-side Supabase client (uses service role key for full DB access)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Add this to your env vars (see note below)
);


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.VITE_APP_URL || "",
  ];

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ... rest of your handler


  const { portalId, submissionId, clientEmail, clientName, portalName, portalUrl } =
    req.body;

  // Basic validation
  if (!clientEmail || !portalName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Build incomplete steps message
    const { data: submission } = await supabase
      .from("submissions")
      .select("form_complete, files_uploaded, payment_completed, meeting_booked")
      .eq("id", submissionId)
      .single();

    const incompleteSteps: string[] = [];
    if (!submission?.form_complete) incompleteSteps.push("📋 Intake form");
    if (!submission?.files_uploaded) incompleteSteps.push("📁 File upload");
    if (!submission?.payment_completed) incompleteSteps.push("💳 Payment");
    if (!submission?.meeting_booked) incompleteSteps.push("📅 Meeting booking");

    const stepsHtml =
      incompleteSteps.length > 0
        ? `<ul style="padding-left:20px;">${incompleteSteps.map((s) => `<li style="margin:6px 0;">${s}</li>`).join("")}</ul>`
        : "<p>All steps are complete!</p>";

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Onboardly <onboarding@resend.dev>", // sandbox sender — replace with your domain later
      to: [clientEmail],
      subject: `Reminder: Complete your onboarding for ${portalName}`,
      html: buildReminderEmail({
        clientName: clientName || "there",
        portalName,
        portalUrl,
        stepsHtml,
      }),
    });

    if (error) {
      // Log failure to Supabase
      await supabase.from("email_logs").insert({
        portal_id: portalId,
        submission_id: submissionId,
        recipient_email: clientEmail,
        email_type: "reminder",
        status: "failed",
        error_message: error.message,
      });
      return res.status(500).json({ error: error.message });
    }

    // Log success to Supabase
    await supabase.from("email_logs").insert({
      portal_id: portalId,
      submission_id: submissionId,
      recipient_email: clientEmail,
      email_type: "reminder",
      status: "sent",
    });

    return res.status(200).json({ success: true, emailId: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

// ─── Email Template ────────────────────────────────────────────────────────────

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
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Complete your onboarding</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background:#6366f1;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                      Onboardly
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:600;">
                      Hi ${clientName} 👋
                    </h2>
                    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                      You're almost done with your onboarding for <strong style="color:#111827;">${portalName}</strong>. 
                      Just a few steps left to complete:
                    </p>

                    <!-- Steps -->
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;color:#374151;font-size:14px;line-height:1.8;">
                      ${stepsHtml}
                    </div>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${portalUrl}"
                            style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.1px;">
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

                <!-- Footer -->
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
    </html>
  `;
}