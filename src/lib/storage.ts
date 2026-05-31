import { supabase } from "./supabase";

export type PortalProgress = {
  formComplete: boolean;
  filesUploaded: boolean;
  paymentCompleted: boolean;
  meetingBooked: boolean;
};

export type StepsEnabled = {
  form: boolean;
  files: boolean;
  payment: boolean;
  meeting: boolean;
};

export type Portal = {
  id: string;
  user_id?: string;
  portalName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;       // ← NEW
  clientCompany?: string;     // ← NEW
  projectDeadline?: string;   // ← NEW
  internalNotes?: string;     // ← NEW
  welcomeMessage: string;
  brandLogo: string;
  paymentLink: string;
  meetingLink: string;
  webhookUrl?: string;
  notes?: string;
  archived?: boolean;
  createdAt: string;
  progress: PortalProgress;
  brandColor?: string;
  stepsEnabled?: StepsEnabled; // ← NEW
};

function mapDbToPortal(row: any): Portal {
  return {
    id: row.id,
    user_id: row.user_id,
    portalName: row.portal_name,
    clientName: row.client_name,
    clientEmail: row.client_email || "",
    clientPhone: row.client_phone || "",         // ← NEW
    clientCompany: row.client_company || "",     // ← NEW
    projectDeadline: row.project_deadline || "", // ← NEW
    internalNotes: row.internal_notes || "",     // ← NEW
    welcomeMessage: row.welcome_message || "",
    brandLogo: row.brand_logo || "",
    paymentLink: row.payment_link || "",
    meetingLink: row.meeting_link || "",
    brandColor: row.brand_color || "",
    webhookUrl: row.webhook_url || "",
    notes: row.notes || "",
    archived: row.archived || false,
    createdAt: row.created_at,
    progress: row.progress || {
      formComplete: false,
      filesUploaded: false,
      paymentCompleted: false,
      meetingBooked: false,
    },
    stepsEnabled: row.steps_enabled || {         // ← NEW
      form: true,
      files: true,
      payment: true,
      meeting: true,
    },
  };
}

export const portalStore = {
  async list(): Promise<Portal[]> {
    const { data, error } = await supabase
      .from("portals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data.map(mapDbToPortal);
  },

  async get(id: string): Promise<Portal | null> {
    const { data, error } = await supabase
      .from("portals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return mapDbToPortal(data);
  },

  async create(data: Omit<Portal, "id" | "createdAt" | "progress">) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id,
      portal_name: data.portalName,
      client_name: data.clientName,
      client_email: data.clientEmail || "",
      client_phone: data.clientPhone || "",           // ← NEW
      client_company: data.clientCompany || "",       // ← NEW
      project_deadline: data.projectDeadline || null, // ← NEW
      internal_notes: data.internalNotes || "",       // ← NEW
      welcome_message: data.welcomeMessage,
      brand_logo: data.brandLogo,
      payment_link: data.paymentLink,
      meeting_link: data.meetingLink,
      webhook_url: data.webhookUrl || "",
      notes: data.notes || "",
      brand_color: data.brandColor || "",
      archived: false,
      steps_enabled: data.stepsEnabled || {           // ← NEW
        form: true,
        files: true,
        payment: true,
        meeting: true,
      },
      progress: {
        formComplete: false,
        filesUploaded: false,
        paymentCompleted: false,
        meetingBooked: false,
      },
    };

    const { data: inserted, error } = await supabase
      .from("portals")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    return mapDbToPortal(inserted);
  },

  async update(id: string, updates: any) {
    const payload: any = {};

    if (updates.portalName !== undefined)
      payload.portal_name = updates.portalName;
    if (updates.clientName !== undefined)
      payload.client_name = updates.clientName;
    if (updates.clientEmail !== undefined)
      payload.client_email = updates.clientEmail;
    if (updates.clientPhone !== undefined)
      payload.client_phone = updates.clientPhone;       // ← NEW
    if (updates.clientCompany !== undefined)
      payload.client_company = updates.clientCompany;   // ← NEW
    if (updates.projectDeadline !== undefined)
      payload.project_deadline = updates.projectDeadline; // ← NEW
    if (updates.internalNotes !== undefined)
      payload.internal_notes = updates.internalNotes;   // ← NEW
    if (updates.notes !== undefined)
      payload.notes = updates.notes;
    if (updates.archived !== undefined)
      payload.archived = updates.archived;
    if (updates.progress !== undefined)
      payload.progress = updates.progress;
    if (updates.stepsEnabled !== undefined)
      payload.steps_enabled = updates.stepsEnabled;     // ← NEW

    const { error } = await supabase
      .from("portals")
      .update(payload)
      .eq("id", id);

    if (error) throw error;
  },

  async updateProgress(id: string, progress: Partial<PortalProgress>) {
    const portal = await this.get(id);
    if (!portal) return;

    await this.update(id, {
      progress: {
        ...portal.progress,
        ...progress,
      },
    });
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("portals")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
