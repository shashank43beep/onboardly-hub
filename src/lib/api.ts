export interface SendReminderPayload {
  portalId: string;
  clientEmail: string;
  clientName: string;
  portalName: string;
  portalUrl: string;
}

export async function sendReminderEmail(payload: SendReminderPayload): Promise<void> {
  const response = await fetch("/api/send-reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!text) {
    throw new Error("API route not reachable");
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server error: ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || "Failed to send reminder");
  }
}