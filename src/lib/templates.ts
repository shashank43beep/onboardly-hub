export interface PortalTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  color: string;
  portalName: string;
  welcomeMessage: string;
  paymentLink: string;
  meetingLink: string;
  brandColor: string;
}

export const templates: PortalTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    emoji: "⚡",
    description: "Start from scratch with empty fields.",
    category: "General",
    color: "#6b7280",
    portalName: "",
    welcomeMessage: "",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#6366f1",
  },
  {
    id: "web-design",
    name: "Web Design Agency",
    emoji: "🎨",
    description: "Perfect for web design and branding projects.",
    category: "Design",
    color: "#8b5cf6",
    portalName: "Website Design Project",
    welcomeMessage:
      "Welcome! We're thrilled to be working on your new website. This portal will guide you through everything we need to get started — from your project goals to brand assets and your initial deposit. It only takes a few minutes!",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#8b5cf6",
  },
  {
    id: "software-dev",
    name: "Software Development",
    emoji: "💻",
    description: "For software, app and product development projects.",
    category: "Tech",
    color: "#0ea5e9",
    portalName: "Software Development Project",
    welcomeMessage:
      "Welcome to your development onboarding portal! We'll collect your technical requirements, access credentials and project scope. Please have your GitHub handle and any existing documentation ready.",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#0ea5e9",
  },
  {
    id: "social-media",
    name: "Social Media Marketing",
    emoji: "📱",
    description: "For social media management and content creation.",
    category: "Marketing",
    color: "#ec4899",
    portalName: "Social Media Management",
    welcomeMessage:
      "Let's get your social media strategy rolling! We'll need your brand guidelines, existing content and account access. This portal walks you through everything step by step.",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#ec4899",
  },
  {
    id: "photography",
    name: "Photography / Creative",
    emoji: "📸",
    description: "For photography, video and creative production.",
    category: "Creative",
    color: "#f59e0b",
    portalName: "Photography Project",
    welcomeMessage:
      "So excited to work with you on this shoot! Please complete this portal so we can prepare everything perfectly. We'll collect your vision, mood references and confirm the shoot details.",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#f59e0b",
  },
  {
    id: "consulting",
    name: "Business Consulting",
    emoji: "🏢",
    description: "For business strategy and consulting engagements.",
    category: "Consulting",
    color: "#10b981",
    portalName: "Business Consulting Engagement",
    welcomeMessage:
      "Welcome to your consulting onboarding portal. To prepare for our first strategy session, we'll need some background on your business, current challenges and goals. This helps us hit the ground running.",
    paymentLink: "",
    meetingLink: "",
    brandColor: "#10b981",
  },
];