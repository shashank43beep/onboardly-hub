export async function postToWebhook(url: string | undefined, payload: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!url) {
    // No webhook configured — simulate success for demo
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed: ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
