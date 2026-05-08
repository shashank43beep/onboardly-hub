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

const seed: Portal[] = [];

function read(): Portal[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Portal[]) : [];
  } catch {
    return [];
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
      progress: {
        formComplete: false,
        filesUploaded: false,
        paymentCompleted: false,
        meetingBooked: false,
      },
    };

    write([portal, ...all]);
    return portal;
  },

  updateProgress: (id: string, patch: Partial<PortalProgress>) => {
    const all = read();

    const updated = all.map((portal) =>
      portal.id === id
        ? {
            ...portal,
            progress: {
              ...portal.progress,
              ...patch,
            },
          }
        : portal
    );

    write(updated);
  },

  remove: (id: string) => {
    const all = read();
    write(all.filter((portal) => portal.id !== id));
  },

  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
    }
  },
};
