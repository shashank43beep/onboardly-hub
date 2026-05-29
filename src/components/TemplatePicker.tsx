import { useState } from "react";
import { templates, type PortalTemplate } from "@/lib/templates";
import { ArrowRight, Check } from "lucide-react";

interface TemplatePickerProps {
  onSelect: (template: PortalTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [selected, setSelected] = useState<string>("blank");
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selected)!;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "40px 24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => window.location.assign("/dashboard")}
            style={{
              background: "none", border: "none",
              color: "#6b7280", cursor: "pointer",
              fontSize: 14, marginBottom: 20,
              padding: 0, display: "flex",
              alignItems: "center", gap: 4,
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{
            fontSize: 26, fontWeight: 700,
            color: "#111827", margin: "0 0 6px",
          }}>
            Choose a template
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
            Start with a pre-filled template or build from scratch.
          </p>
        </div>

        {/* Template Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelected(template.id)}
              onMouseEnter={() => setHovered(template.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: selected === template.id
                  ? `2px solid ${template.color}`
                  : hovered === template.id
                    ? "2px solid #d1d5db"
                    : "2px solid #e5e7eb",
                padding: 20,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s",
                boxShadow: selected === template.id
                  ? `0 4px 20px ${template.color}22`
                  : "none",
              }}
            >
              {/* Selected checkmark */}
              {selected === template.id && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 22, height: 22, borderRadius: "50%",
                  background: template.color,
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Check style={{ width: 12, height: 12, color: "#fff" }} />
                </div>
              )}

              {/* Emoji */}
              <div style={{
                fontSize: 32, marginBottom: 12,
              }}>
                {template.emoji}
              </div>

              {/* Category badge */}
              <div style={{
                display: "inline-block",
                fontSize: 10, fontWeight: 600,
                color: template.color,
                background: `${template.color}15`,
                padding: "2px 8px", borderRadius: 999,
                marginBottom: 8,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}>
                {template.category}
              </div>

              <h3 style={{
                fontSize: 15, fontWeight: 600,
                color: "#111827", margin: "0 0 6px",
              }}>
                {template.name}
              </h3>
              <p style={{
                fontSize: 13, color: "#6b7280",
                margin: 0, lineHeight: 1.5,
              }}>
                {template.description}
              </p>
            </div>
          ))}
        </div>

        {/* Preview + CTA */}
        {selected !== "blank" && (
          <div style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #e5e7eb",
            padding: 24,
            marginBottom: 24,
          }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.8px", textTransform: "uppercase",
              margin: "0 0 8px",
            }}>
              Welcome message preview
            </p>
            <p style={{
              fontSize: 14, color: "#374151",
              lineHeight: 1.7, margin: 0,
              fontStyle: "italic",
            }}>
              "{selectedTemplate.welcomeMessage}"
            </p>
          </div>
        )}

        {/* Use Template Button */}
        <button
          onClick={() => onSelect(selectedTemplate)}
          style={{
            width: "100%",
            padding: "14px",
            background: selectedTemplate.color,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: `0 4px 20px ${selectedTemplate.color}44`,
          }}
        >
          Use {selectedTemplate.name} template
          <ArrowRight style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}