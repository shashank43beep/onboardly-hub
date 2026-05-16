// Base URL that works in both dev and production
const BASE_URL = import.meta.env.VITE_APP_URL || "";

export interface SendReminderPayload {
  portalId: string;
  
  clientEmail: string;
  clientName: string;
  portalName: string;
  portalUrl: string;
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  emailId?: string;
}

export async function sendReminderEmail(
  payload: SendReminderPayload
): Promise<ApiResponse> {
  const response = await fetch(`${BASE_URL}/api/send-reminder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send email");
  }

  return data;
}