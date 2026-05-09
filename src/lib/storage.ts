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

const STORAGE_KEY = "onboardly_portals";

export const portalStore = {
  async list(): Promise<Portal[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async get(id: string): Promise<Portal | null> {
    return (await this.list()).find((portal) => portal.id === id) || null;
  },

  async create(data: Omit<Portal, "id" | "createdAt" | "progress">): Promise<Portal> {
    const portals = await this.list();

    const newPortal: Portal = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      progress: {
        formComplete: false,
        filesUploaded: false,
        paymentCompleted: false,
        meetingBooked: false,
      },
    };

    const updated = [...portals, newPortal];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newPortal;
  },
  async updateProgress(id: string, progress: Partial<PortalProgress>): Promise<void> {
    const portals = await this.list() as Portal[];

    const updated = portals.map((portal) =>
      portal.id === id
        ? {
            ...portal,
            progress: {
              ...portal.progress,
              ...progress,
            },
          }
        : portal
    );
    await Promise.resolve();
    

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
};
