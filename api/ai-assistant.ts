import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing: GROQ_API_KEY" });
  }
  if (!process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "Missing: SUPABASE_URL" });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing: SUPABASE_SERVICE_ROLE_KEY" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { portalId, clientName, messages } = req.body;

  if (!portalId || !messages) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data: portal } = await supabase
      .from("portals")
      .select("*")
      .eq("id", portalId)
      .single();

    if (!portal) {
      return res.status(404).json({ error: "Portal not found" });
    }

    const { data: submission } = await supabase
      .from("submissions")
      .select("*")
      .eq("portal_id", portalId)
      .maybeSingle();

    const progress = portal.progress || {};
    const completedSteps: string[] = [];
    const pendingSteps: string[] = [];

    if (progress.formComplete) completedSteps.push("Intake Form");
    else pendingSteps.push("Intake Form");
    if (progress.filesUploaded) completedSteps.push("File Upload");
    else pendingSteps.push("File Upload");
    if (progress.paymentCompleted) completedSteps.push("Payment");
    else pendingSteps.push("Payment");
    if (progress.meetingBooked) completedSteps.push("Meeting Booking");
    else pendingSteps.push("Meeting Booking");

    const systemPrompt = `You are a friendly onboarding assistant for ${portal.portalName}.
Your job is to help ${clientName || "the client"} complete their onboarding smoothly.

PORTAL CONTEXT:
- Portal Name: ${portal.portalName}
- Client Name: ${portal.clientName}
- Welcome Message: ${portal.welcomeMessage || "Welcome aboard!"}
- Payment Link: ${portal.paymentLink ? "Available" : "Not set up yet"}
- Meeting Link: ${portal.meetingLink ? "Available" : "Not set up yet"}

CURRENT PROGRESS:
- Completed: ${completedSteps.length > 0 ? completedSteps.join(", ") : "None yet"}
- Pending: ${pendingSteps.length > 0 ? pendingSteps.join(", ") : "All done!"}

SUBMISSION DATA:
${submission ? `Form submitted: ${JSON.stringify(submission.project_details || {})}` : "No form submitted yet"}

YOUR RULES:
1. Be warm, concise and encouraging — max 3 sentences per response
2. Always guide toward the next pending step
3. If asked about payment, direct to the Payment step
4. If asked about meeting, direct to Meeting Booking step
5. If you cannot answer something specific, say: "I'll flag this for the team." and add [ESCALATE] at the end
6. Never make up information not in the context above
7. No markdown, no bullet points — plain conversational English only`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Convert messages to Groq format
    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiText = completion.choices[0]?.message?.content || "I'm not sure how to help with that.";

    const shouldEscalate = aiText.includes("[ESCALATE]");
    const cleanText = aiText.replace("[ESCALATE]", "").trim();

    if (shouldEscalate) {
      const lastUserMsg = [...messages]
        .reverse()
        .find((m: { role: string; content: string }) => m.role === "user");

      if (lastUserMsg) {
        await supabase.from("comments").insert({
          portal_id: portalId,
          author_type: "client",
          author_name: `${clientName || "Client"} (via AI Assistant)`,
          message: `AI Assistant escalation — Client asked: "${lastUserMsg.content}"`,
        });
      }
    }

    return res.status(200).json({
      message: cleanText,
      escalated: shouldEscalate,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI Assistant crash:", message);
    return res.status(500).json({ error: message });
  }
}