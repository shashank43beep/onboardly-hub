import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY not set" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { clientEmail, clientName, portalName, portalUrl, welcomeMessage } = req.body;

  if (!clientEmail || !portalName || !portalUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await resend.emails.send({
      from: "Onboardly <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `You're invited to onboard with ${portalName}`,
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
                <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:600;">
                  Welcome, ${clientName} 👋
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
                  ${welcomeMessage || `You've been invited to complete your onboarding for <strong style="color:#111827;">${portalName}</strong>.`}
                </p>
                <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
                  Click below to get started — it only takes a few minutes.
                </p>
                <a href="${portalUrl}"
                  style="display:inline-block;background:#6366f1;color:#fff;
                  text-decoration:none;font-size:15px;font-weight:600;
                  padding:14px 32px;border-radius:8px;">
                  Start Onboarding →
                </a>
                <p style="margin:28px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;">
                  You can return to this link anytime to check your progress.
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