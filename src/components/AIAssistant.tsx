import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
}

interface AIAssistantProps {
  portalId: string;
  clientName: string;
  portalName: string;
  brandColor?: string;
}

export function AIAssistant({
  portalId,
  clientName,
  portalName,
  brandColor = "#6366f1",
}: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi ${clientName}! 👋 I'm your onboarding assistant for ${portalName}. I can help you with any questions about your onboarding steps. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId,
          clientName,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const text = await response.text();
      if (!text) throw new Error("Empty response");

      const data = JSON.parse(text);
      if (!response.ok) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        escalated: data.escalated,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.escalated) {
        toast.info("Your question has been sent to the team!");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: brandColor,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
          zIndex: 1000,
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.08)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        {open ? (
          <X style={{ width: 22, height: 22, color: "#fff" }} />
        ) : (
          <Sparkles style={{ width: 22, height: 22, color: "#fff" }} />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 96,
          right: 28,
          width: 360,
          height: 500,
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 1000,
          border: "1px solid #e5e7eb",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: brandColor,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
            }}>
              <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <div>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 600,
                color: "#fff", lineHeight: 1,
              }}>
                AI Assistant
              </p>
              <p style={{
                margin: "3px 0 0", fontSize: 11,
                color: "rgba(255,255,255,0.7)",
              }}>
                Always here to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: 16, display: "flex",
            flexDirection: "column", gap: 12,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  background: msg.role === "user" ? brandColor : "#f3f4f6",
                  color: msg.role === "user" ? "#fff" : "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}>
                  {msg.content}
                </div>
                {msg.escalated && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    marginTop: 4, fontSize: 11, color: "#f59e0b",
                  }}>
                    <AlertCircle style={{ width: 11, height: 11 }} />
                    Sent to team
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", background: "#f3f4f6",
                borderRadius: "18px 18px 18px 4px",
                width: "fit-content",
              }}>
                <Loader2 style={{
                  width: 14, height: 14, color: "#9ca3af",
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ fontSize: 13, color: "#9ca3af" }}>
                  Thinking...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #f3f4f6",
            display: "flex", gap: 8,
            background: "#fafafa",
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              style={{
                flex: 1, padding: "10px 14px",
                borderRadius: 20,
                border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none",
                background: "#fff",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: loading || !input.trim()
                  ? "#e5e7eb" : brandColor,
                border: "none",
                cursor: loading || !input.trim()
                  ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}
            >
              <Send style={{
                width: 15, height: 15,
                color: loading || !input.trim() ? "#9ca3af" : "#fff",
              }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}