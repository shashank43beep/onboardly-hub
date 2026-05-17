import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface Comment {
  id: string;
  portal_id: string;
  author_type: "admin" | "client";
  author_name: string;
  message: string;
  created_at: string;
}

interface CommentThreadProps {
  portalId: string;
  authorType: "admin" | "client";
  authorName: string;
  // Only pass for admin — triggers email to client
  clientEmail?: string;
  clientName?: string;
  portalName?: string;
}

export function CommentThread({
  portalId,
  authorType,
  authorName,
  clientEmail,
  clientName,
  portalName,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial comments
  useEffect(() => {
    async function loadComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("portal_id", portalId)
        .order("created_at", { ascending: true });

      if (!error && data) setComments(data);
      setLoading(false);
    }

    loadComments();
  }, [portalId]);

  // Supabase Realtime — live updates
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${portalId}`)
      .on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "comments",
    filter: `portal_id=eq.${portalId}`,
  },
  (payload) => {
    const incoming = payload.new as Comment;
    // ✅ Only add via Realtime if message came from the OTHER side
    if (incoming.author_type !== authorType) {
      setComments((prev) => [...prev, incoming]);
    }
  }
)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portalId]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);

    const newMessage = {
      id: crypto.randomUUID(),
      portal_id: portalId,
      author_type: authorType,
      author_name: authorName,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("comments").insert({
      portal_id: newMessage.portal_id,
      author_type: newMessage.author_type,
      author_name: newMessage.author_name,
      message: newMessage.message,
    });

    if (error) {
      console.error("Supabase insert error:", error.code, error.message);
      toast.error(`Failed: ${error.message}`);
      setSending(false);
      return;
    }

    // ✅ Show message instantly on sender's side
    setComments((prev) => [...prev, newMessage as Comment]);
    setMessage("");
    setSending(false);

    // Email notification for admin messages
    if (authorType === "admin" && clientEmail) {
      try {
        await fetch("/api/send-comment-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalId,
            clientEmail,
            clientName,
            portalName,
            adminMessage: newMessage.message,
            portalUrl: `${window.location.origin}/portal/${portalId}`,
          }),
        });
      } catch {
        // email failure doesn't block chat
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: 400,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
      background: "#fff",
    }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb",
        fontSize: 14,
        fontWeight: 600,
        color: "#111827",
      }}>
        💬 Messages
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {comments.length === 0 && (
          <p style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
            marginTop: 40,
          }}>
            No messages yet. Start the conversation!
          </p>
        )}

        {comments.map((c) => {
          const isMe = c.author_type === authorType;
          return (
            <div
              key={c.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div style={{
                fontSize: 11,
                color: "#9ca3af",
                marginBottom: 3,
                paddingLeft: 4,
                paddingRight: 4,
              }}>
                {c.author_name} · {new Date(c.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMe ? "#6366f1" : "#f3f4f6",
                color: isMe ? "#fff" : "#111827",
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}>
                {c.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        gap: 8,
        background: "#f9fafb",
      }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 20,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: sending || !message.trim() ? "#e5e7eb" : "#6366f1",
            border: "none",
            cursor: sending || !message.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {sending
            ? <Loader2 style={{ width: 16, height: 16, color: "#9ca3af" }} />
            : <Send style={{ width: 16, height: 16, color: "#fff" }} />
          }
        </button>
      </div>
    </div>
  );
}