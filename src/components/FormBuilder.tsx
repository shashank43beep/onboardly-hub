import { useState } from "react";
import {
  type FormQuestion,
  type QuestionType,
  questionTypeLabels,
  questionTypeEmojis,
  createQuestion,
} from "@/lib/formTypes";
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from "lucide-react";

interface FormBuilderProps {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
}

const QUESTION_TYPES: QuestionType[] = [
  "short_text",
  "long_text",
  "multiple_choice",
  "dropdown",
  "date",
  "yes_no",
];

export function FormBuilder({ questions, onChange }: FormBuilderProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);

  function addQuestion(type: QuestionType) {
    onChange([...questions, createQuestion(type)]);
    setShowTypePicker(false);
  }

  function updateQuestion(id: string, updates: Partial<FormQuestion>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  }

  function removeQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  }

  function moveDown(index: number) {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  }

  function addOption(questionId: string) {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    updateQuestion(questionId, {
      options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`],
    });
  }

  function updateOption(questionId: string, index: number, value: string) {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    const newOptions = [...(q.options || [])];
    newOptions[index] = value;
    updateQuestion(questionId, { options: newOptions });
  }

  function removeOption(questionId: string, index: number) {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    updateQuestion(questionId, {
      options: q.options?.filter((_, i) => i !== index),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Default fields notice */}
      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: 10, padding: "10px 14px",
        fontSize: 13, color: "#0369a1",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>ℹ️</span>
        <span>
          Your form already includes <strong>Project Name</strong>,{" "}
          <strong>Website</strong>, and <strong>Goals</strong> by default.
          Add more questions below.
        </span>
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "32px 16px",
          background: "#fafafa", borderRadius: 12,
          border: "2px dashed #e5e7eb",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
            No custom questions yet. Add one below.
          </p>
        </div>
      ) : (
        questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            total={questions.length}
            onUpdate={(updates) => updateQuestion(question.id, updates)}
            onRemove={() => removeQuestion(question.id)}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
            onAddOption={() => addOption(question.id)}
            onUpdateOption={(i, v) => updateOption(question.id, i, v)}
            onRemoveOption={(i) => removeOption(question.id, i)}
          />
        ))
      )}

      {/* Add question button */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowTypePicker(!showTypePicker)}
          style={{
            width: "100%", padding: "11px",
            borderRadius: 10, border: "2px dashed #c7d2fe",
            background: showTypePicker ? "#ede9fe" : "#fff",
            color: "#6366f1", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            fontFamily: "inherit",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add Question
        </button>

        {/* Type picker dropdown */}
        {showTypePicker && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)",
            left: 0, right: 0, zIndex: 20,
            background: "#fff", borderRadius: 12,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}>
            <p style={{
              margin: 0, padding: "10px 16px",
              fontSize: 11, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.6px", textTransform: "uppercase",
              borderBottom: "1px solid #f3f4f6",
            }}>
              Choose question type
            </p>
            {QUESTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addQuestion(type)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 16px",
                  background: "none", border: "none",
                  borderBottom: "1px solid #f9fafb",
                  cursor: "pointer", fontSize: 13,
                  color: "#374151", fontFamily: "inherit",
                  textAlign: "left",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <span style={{ fontSize: 18 }}>{questionTypeEmojis[type]}</span>
                <span style={{ fontWeight: 500 }}>{questionTypeLabels[type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview label */}
      {questions.length > 0 && (
        <p style={{
          margin: "4px 0 0", fontSize: 12, color: "#9ca3af",
          textAlign: "center",
        }}>
          {questions.length} custom question{questions.length !== 1 ? "s" : ""} added
        </p>
      )}
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: FormQuestion;
  index: number;
  total: number;
  onUpdate: (updates: Partial<FormQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
}

function QuestionCard({
  question, index, total,
  onUpdate, onRemove, onMoveUp, onMoveDown,
  onAddOption, onUpdateOption, onRemoveOption,
}: QuestionCardProps) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: "1px solid #e5e7eb",
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        background: "#fafafa",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <GripVertical style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }} />

        {/* Type badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, color: "#6366f1",
          background: "#ede9fe", padding: "2px 8px",
          borderRadius: 999, flexShrink: 0,
        }}>
          {questionTypeEmojis[question.type]} {questionTypeLabels[question.type]}
        </span>

        <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>
          Question {index + 1}
        </span>

        {/* Required toggle */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "#6b7280",
        }}>
          <span>Required</span>
          <button
            type="button"
            onClick={() => onUpdate({ required: !question.required })}
            style={{
              width: 36, height: 20, borderRadius: 999,
              background: question.required ? "#6366f1" : "#d1d5db",
              border: "none", cursor: "pointer",
              position: "relative", transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 2,
              left: question.required ? 18 : 2,
              width: 16, height: 16, borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }} />
          </button>
        </div>

        {/* Move buttons */}
        <div style={{ display: "flex", gap: 2 }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: "none", border: "1px solid #e5e7eb",
              cursor: index === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              opacity: index === 0 ? 0.4 : 1,
            }}
          >
            <ChevronUp style={{ width: 12, height: 12, color: "#6b7280" }} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: "none", border: "1px solid #e5e7eb",
              cursor: index === total - 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              opacity: index === total - 1 ? 0.4 : 1,
            }}
          >
            <ChevronDown style={{ width: 12, height: 12, color: "#6b7280" }} />
          </button>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: "none", border: "none",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#ef4444",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Trash2 style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Question label */}
        <div>
          <label style={{
            fontSize: 12, fontWeight: 600, color: "#374151",
            display: "block", marginBottom: 5,
          }}>
            Question Label {question.required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
          <input
            type="text"
            value={question.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={
              question.type === "short_text" ? "e.g. What is your website URL?"
              : question.type === "long_text" ? "e.g. Describe your project in detail"
              : question.type === "multiple_choice" ? "e.g. What is your budget range?"
              : question.type === "dropdown" ? "e.g. Which service are you interested in?"
              : question.type === "date" ? "e.g. What is your preferred start date?"
              : "e.g. Do you have existing brand guidelines?"
            }
            style={inputStyle}
          />
        </div>

        {/* Placeholder (for text types) */}
        {(question.type === "short_text" || question.type === "long_text") && (
          <div>
            <label style={{
              fontSize: 12, fontWeight: 600, color: "#374151",
              display: "block", marginBottom: 5,
            }}>
              Placeholder text
              <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={question.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="e.g. https://yourwebsite.com"
              style={inputStyle}
            />
          </div>
        )}

        {/* Options (for multiple choice and dropdown) */}
        {(question.type === "multiple_choice" || question.type === "dropdown") && (
          <div>
            <label style={{
              fontSize: 12, fontWeight: 600, color: "#374151",
              display: "block", marginBottom: 8,
            }}>
              Options
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(question.options || []).map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    fontSize: 13, color: "#9ca3af",
                    width: 20, textAlign: "center", flexShrink: 0,
                  }}>
                    {question.type === "multiple_choice" ? "◯" : `${i + 1}.`}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => onUpdateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {(question.options || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemoveOption(i)}
                      style={{
                        background: "none", border: "none",
                        cursor: "pointer", color: "#ef4444",
                        padding: 4, flexShrink: 0,
                      }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={onAddOption}
                style={{
                  padding: "6px 12px", borderRadius: 6,
                  background: "none", border: "1px dashed #d1d5db",
                  cursor: "pointer", fontSize: 12,
                  color: "#6b7280", fontFamily: "inherit",
                  display: "flex", alignItems: "center",
                  gap: 4, alignSelf: "flex-start",
                }}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Add option
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        <div style={{
          background: "#f9fafb", borderRadius: 8,
          padding: "10px 12px", marginTop: 2,
        }}>
          <p style={{
            margin: "0 0 6px", fontSize: 11,
            color: "#9ca3af", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            Client sees:
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#374151" }}>
            {question.label || "Your question label"}
            {question.required && <span style={{ color: "#ef4444" }}> *</span>}
          </p>

          {question.type === "short_text" && (
            <div style={{
              height: 34, background: "#fff", borderRadius: 6,
              border: "1px solid #d1d5db", padding: "0 10px",
              display: "flex", alignItems: "center",
              fontSize: 12, color: "#9ca3af",
            }}>
              {question.placeholder || "Short answer..."}
            </div>
          )}
          {question.type === "long_text" && (
            <div style={{
              height: 60, background: "#fff", borderRadius: 6,
              border: "1px solid #d1d5db", padding: "8px 10px",
              fontSize: 12, color: "#9ca3af",
            }}>
              {question.placeholder || "Long answer..."}
            </div>
          )}
          {question.type === "multiple_choice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(question.options || []).map((opt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: "#374151",
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid #d1d5db", flexShrink: 0,
                  }} />
                  {opt}
                </div>
              ))}
            </div>
          )}
          {question.type === "dropdown" && (
            <div style={{
              height: 34, background: "#fff", borderRadius: 6,
              border: "1px solid #d1d5db", padding: "0 10px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12, color: "#9ca3af",
            }}>
              <span>Select an option...</span>
              <span>▾</span>
            </div>
          )}
          {question.type === "date" && (
            <div style={{
              height: 34, background: "#fff", borderRadius: 6,
              border: "1px solid #d1d5db", padding: "0 10px",
              display: "flex", alignItems: "center",
              fontSize: 12, color: "#9ca3af",
            }}>
              📅 Pick a date
            </div>
          )}
          {question.type === "yes_no" && (
            <div style={{ display: "flex", gap: 8 }}>
              {["Yes", "No"].map((opt) => (
                <div key={opt} style={{
                  padding: "5px 16px", borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#fff", fontSize: 12,
                  color: "#374151",
                }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  color: "#111827",
};