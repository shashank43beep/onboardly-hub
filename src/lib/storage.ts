export type PortalProgress = {
  formComplete: boolean;
  filesUploaded: boolean;
  paymentCompleted: boolean;
  meetingBooked: boolean;
};

export type Portal = {
  id: string;
  portalName: string;
  clientName: string;
  welcomeMessage: string;
  brandLogo: string;
  paymentLink: string;
  meetingLink: string;
  webhookUrl?: string;
  createdAt: string;
  progress: PortalProgress;
};

const KEY = "onboardly.portals";

const seed: Portal[] = [
  {
    id: "demo",
    portalName: "Acme Co. Onboarding",
    clientName: "Acme Co.",
    welcomeMessage: "Welcome aboard! We're excited to start working with you.",
    brandLogo: "",
    paymentLink: "https://buy.stripe.com/test_demo",
    meetingLink: "https://calendly.com/demo/kickoff",
    createdAt: new Date().toISOString(),
    progress: { formComplete: true, filesUploaded: true, paymentCompleted: false, meetingBooked: false },
  },
  {
    id: "northwind",
    portalName: "Northwind Branding Project",
    clientName: "Northwind Traders",
    welcomeMessage: "Let's build something incredible together.",
    brandLogo: "",
    paymentLink: "",
    meetingLink: "",
    createdAt: new Date().toISOString(),
    progress: { formComplete: false, filesUploaded: false, paymentCompleted: false, meetingBooked: false },
  },
];

function read(): Portal[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Portal[];
  } catch {
    return seed;
  }
}

function write(items: Portal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const portalStore = {
  list: () => read(),
  get: (id: string) => read().find((p) => p.id === id),
  create: (data: Omit<Portal, "id" | "createdAt" | "progress">) => {
    const all = read();
    const portal: Portal = {
      ...data,
      id: Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
      progress: { formComplete: false, filesUploaded: false, paymentCompleted: false, meetingBooked: false },
    };
    write([portal, ...all]);
    return portal;
  },
  updateProgress: (id: string, patch: Partial<PortalProgress>) => {
    const all = read();
    const next = all.map((p) => (p.id === id ? { ...p, progress: { ...p.progress, ...patch } } : p));
    write(next);
  },
};
