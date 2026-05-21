import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const stepDetails: Record<string, { label: string; emoji: string; next: string }> = {
  form: {
    label: "Intake Form",
    emoji: "📋",
    next: "Next up: upload your project files.",
  },
  files: {
    label: "File Upload",
    emoji: "📁",
    next: "Next up: complete your payment.",
  },
  payment: {
    label: "Payment",
    emoji: "💳",
    next: "Next up: book your kickoff call.",
  },
  meeting: {
    label: "Meeting Booking",
    emoji: "📅",
    next: "You're almost done — just one more step!",
  },
};

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
  const { clientEmail, clientName, portalName, portalUrl, step } = req.body;

  if (!clientEmail || !step) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const stepInfo = stepDetails[step];
  if (!stepInfo) {
    return res.status(400).json({ error: "Invalid step" });
  }

  try {
    await resend.emails.send({
      from: "Onboardly <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `${stepInfo.emoji} ${stepInfo.label} completed — keep going!`,
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
                <div style="text-align:center;margin-bottom:24px;">
                  <span style="font-size:48px;">${stepInfo.emoji}</span>
                </div>
                <h2 style="margin:0 0 8px;font-size:20px;color:#111827;
                  font-weight:600;text-align:center;">
                  Great work, ${clientName || "there"}!
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.6;
                  margin:0 0 8px;text-align:center;">
                  You've completed the
                  <strong style="color:#111827;">${stepInfo.label}</strong>
                  step for <strong style="color:#111827;">${portalName}</strong>.
                </p>
                <p style="color:#6b7280;font-size:14px;text-align:center;
                  margin:0 0 28px;">
                  ${stepInfo.next}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${portalUrl}"
                        style="display:inline-block;background:#6366f1;color:#fff;
                        text-decoration:none;font-size:15px;font-weight:600;
                        padding:14px 32px;border-radius:8px;">
                        Continue Onboarding →
                      </a>
                    </td>
                  </tr>
                </table>
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