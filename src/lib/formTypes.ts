export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "date"
  | "yes_no";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for multiple_choice and dropdown
}

export const questionTypeLabels: Record<QuestionType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  dropdown: "Dropdown",
  date: "Date",
  yes_no: "Yes / No",
};

export const questionTypeEmojis: Record<QuestionType, string> = {
  short_text: "✏️",
  long_text: "📝",
  multiple_choice: "🔘",
  dropdown: "▾",
  date: "📅",
  yes_no: "✅",
};

export function createQuestion(type: QuestionType): FormQuestion {
  return {
    id: crypto.randomUUID(),
    type,
    label: "",
    placeholder: "",
    required: false,
    options: type === "multiple_choice" || type === "dropdown"
      ? ["Option 1", "Option 2"]
      : undefined,
  };
}