import { supabase } from "./supabase";

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
    progress: {
      formComplete: true,
      filesUploaded: true,
      paymentCompleted: false,
      meetingBooked: false,
    },
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
  list: async () => {
    // Start with local ones
    const local = read();
    
    // Try to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('portals')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        // Map Supabase data to our Portal type
        const remotePortals: Portal[] = data.map(p => ({
          id: p.id,
          portalName: p.portal_name,
          clientName: p.client_name,
          welcomeMessage: p.welcome_message,
          brandLogo: p.brand_logo || '',
          paymentLink: p.payment_link || '',
          meetingLink: p.booking_link || '',
          webhookUrl: p.webhook_url || '',
          createdAt: p.created_at,
          progress: {
            formComplete: false,
            filesUploaded: false,
            paymentCompleted: false,
            meetingBooked: false,
          }
        }));

        // Merge local progress with remote portals
        const merged = remotePortals.map(remote => {
          const matchingLocal = local.find(l => l.id === remote.id);
          if (matchingLocal) {
            return { ...remote, progress: matchingLocal.progress };
          }
          return remote;
        });

        write(merged);
        return merged;
      }
    } catch (e) {
      console.error("Failed to fetch portals from Supabase", e);
    }
    
    return local;
  },

  get: async (id: string) => {
    // Try Supabase first for the most up-to-date data
    try {
      const { data, error } = await supabase
        .from('portals')
        .select('*')
        .eq('id', id)
        .single();

      if (data && !error) {
        const local = read();
        const matchingLocal = local.find(l => l.id === id);
        
        return {
          id: data.id,
          portalName: data.portal_name,
          clientName: data.client_name,
          welcomeMessage: data.welcome_message,
          brandLogo: data.brand_logo || '',
          paymentLink: data.payment_link || '',
          meetingLink: data.booking_link || '',
          webhookUrl: data.webhook_url || '',
          createdAt: data.created_at,
          progress: matchingLocal?.progress || {
            formComplete: false,
            filesUploaded: false,
            paymentCompleted: false,
            meetingBooked: false,
          }
        };
      }
    } catch (e) {
      console.error("Failed to fetch portal from Supabase", e);
    }

    return read().find((p) => p.id === id);
  },

  create: async (data: Omit<Portal, "id" | "createdAt" | "progress">) => {
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

    const { error } = await supabase.from("portals").insert([
      {
        id: portal.id,
        portal_name: portal.portalName,
        client_name: portal.clientName,
        welcome_message: portal.welcomeMessage,
        payment_link: portal.paymentLink,
        booking_link: portal.meetingLink,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return null;
    }

    const all = read();
    write([portal, ...all]);

    return portal;
  },

  updateProgress: (id: string, patch: Partial<PortalProgress>) => {
    const all = read();
    const next = all.map((p) =>
      p.id === id ? { ...p, progress: { ...p.progress, ...patch } } : p
    );
    write(next);
  },
};
