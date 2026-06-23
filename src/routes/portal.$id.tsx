import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Upload,
  FileText,
  CreditCard,
  Calendar,
  ArrowRight,
  Sparkles,
  Loader2,
  FileIcon,
  X,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { CommentThread } from "@/components/CommentThread";
import { Logo } from "@/components/logo";
import { AIAssistant } from "@/components/AIAssistant";

import { portalStore, type Portal } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/$id")({
  head: ({ params }) => ({ meta: [{ title: `Portal — ${params.id}` }] }),
  component: ClientPortal,
});

async function sendStepEmail(step: string, portal: Portal, isComplete: boolean) {
  const clientEmail = portal.clientEmail;
  if (!clientEmail) return;
  const portalUrl = `${window.location.origin}/portal/${portal.id}`;
  if (isComplete) {
    await fetch("/api/send-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail, clientName: portal.clientName, portalName: portal.portalName, portalUrl }),
    }).catch(() => {});
  } else {
    await fetch("/api/send-step-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail, clientName: portal.clientName, portalName: portal.portalName, portalUrl, step }),
    }).catch(() => {});
  }
}

type Section = "welcome" | "form" | "files" | "payment" | "meeting" | "messages" | "done";

function ClientPortal() {
  const { id } = Route.useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [section, setSection] = useState<Section>("welcome");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const found = await portalStore.get(id);
      if (found) {
        setPortal(found);
        if (!found.progress.formComplete) setSection("form");
        else if (!found.progress.filesUploaded) setSection("files");
        else if (!found.progress.paymentCompleted) setSection("payment");
        else if (!found.progress.meetingBooked) setSection("meeting");
        else setSection("done");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!portal) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Portal not found</h1>
        </div>
      </SiteLayout>
    );
  }

  const refresh = async () => {
    const updated = await portalStore.get(id);
    if (updated) setPortal(updated);
  };

  const steps = [
    { id: "welcome", label: "Welcome", icon: Sparkles, done: true },
    { id: "form", label: "Intake Form", icon: FileText, done: portal.progress.formComplete },
    { id: "files", label: "Asset Upload", icon: Upload, done: portal.progress.filesUploaded },
    { id: "payment", label: "Payment", icon: CreditCard, done: portal.progress.paymentCompleted },
    { id: "meeting", label: "Kickoff Call", icon: Calendar, done: portal.progress.meetingBooked },
    { id: "messages", label: "Messages", icon: MessageSquare, done: false },
  ];

  return (
    <SiteLayout>
      <Toaster position="top-center" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-3">
              {portal.brandLogo ? (
                <img src={portal.brandLogo} alt={portal.clientName}
                  className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <Logo size={40} variant="icon" />
              )}
              <div className="w-full">
                <h2 className="font-semibold">{portal.portalName}</h2>
                <p className="text-xs text-muted-foreground">{portal.clientName}</p>
                <Button variant="outline" size="sm" className="mt-4 w-full"
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Portal link copied"); }}>
                  Copy Portal Link
                </Button>
              </div>
            </div>
            <nav className="space-y-1">
              {steps.map((step) => (
                <button key={step.id} onClick={() => setSection(step.id as Section)}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    section === step.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted")}>
                  <step.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{step.label}</span>
                  {step.done && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </nav>
          </aside>

          <main>
            {section === "welcome" && <WelcomeStep portal={portal} onNext={() => setSection("form")} />}
            {section === "form" && (
              <FormStep portal={portal} onDone={() => { refresh(); sendStepEmail("form", portal, false); setSection("files"); }} />
            )}
            {section === "files" && (
              <FilesStep portal={portal} onDone={() => { refresh(); sendStepEmail("files", portal, false); setSection("payment"); }} />
            )}
            {section === "payment" && (
              <PaymentStep portal={portal} onDone={() => { refresh(); sendStepEmail("payment", portal, false); setSection("meeting"); }} />
            )}
            {section === "meeting" && (
              <MeetingStep portal={portal} onDone={() => { refresh(); sendStepEmail("meeting", portal, true); setSection("done"); }} />
            )}
            {section === "done" && <CompletionStep />}
            {section === "messages" && (
              <Card className="p-8">
                <h2 className="text-xl font-semibold mb-6">Messages</h2>
                <CommentThread portalId={portal.id} authorType="client" authorName={portal.clientName} />
              </Card>
            )}
          </main>
        </div>
      </div>

      <AIAssistant
        portalId={portal.id}
        clientName={portal.clientName}
        portalName={portal.portalName}
        brandColor={portal.brandColor || "#6366f1"}
      />
    </SiteLayout>
  );
}

// ── WelcomeStep ────────────────────────────────────────────────────────────────

function WelcomeStep({ portal, onNext }: { portal: Portal; onNext: () => void }) {
  const steps = [
    { icon: "📋", label: "Intake Form", desc: "Tell us about your project" },
    { icon: "📁", label: "File Upload", desc: "Share your assets & documents" },
    { icon: "💳", label: "Payment", desc: "Secure your project slot" },
    { icon: "📅", label: "Kickoff Call", desc: "Book your first meeting" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{
        background: portal.brandColor || "#6366f1", borderRadius: 20,
        padding: "40px 36px", textAlign: "center", marginBottom: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        {portal.brandLogo ? (
          <img src={portal.brandLogo} alt={portal.portalName}
            style={{ width: 64, height: 64, borderRadius: 16, objectFit: "contain", marginBottom: 16, background: "rgba(255,255,255,0.15)" }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 700, color: "#fff" }}>
            {portal.clientName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Welcome, {portal.clientName}! 👋
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          {portal.welcomeMessage || "We're excited to work with you. This portal will guide you through everything we need to get started."}
        </p>
        <button onClick={onNext} style={{ padding: "13px 32px", background: "#fff", color: portal.brandColor || "#6366f1", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
          Begin Onboarding
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 16px" }}>What to expect</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{i + 1}. {step.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{step.desc}</p>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #e5e7eb", flexShrink: 0 }} />
            </div>
          ))}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>⏱ Takes about 5 minutes to complete</p>
      </div>
    </div>
  );
}

// ── FormStep ───────────────────────────────────────────────────────────────────

function FormStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ projectName: portal.portalName, goals: "", website: "" });

  // ✅ These were missing — now properly declared
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const customQuestions = portal.custom_questions || [];

  function updateCustomAnswer(questionId: string, value: string) {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required custom questions
    for (const q of customQuestions) {
      if (q.required && !customAnswers[q.id]?.trim()) {
        toast.error(`Please answer: "${q.label}"`);
        return;
      }
    }

    setLoading(true);

    await supabase.from("submissions").upsert(
      [{ portal_id: portal.id, client_name: portal.clientName, client_email: portal.clientEmail, project_details: data, custom_answers: customAnswers }],
      { onConflict: "portal_id" }
    );

    await portalStore.updateProgress(portal.id, { formComplete: true });
    toast.success("Submitted!");
    onDone();
    setLoading(false);
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-2">Intake Form</h2>
      <p className="text-muted-foreground text-sm mb-6">Tell us about your project so we can hit the ground running.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default fields */}
        <div>
          <Label>Project Name</Label>
          <Input value={data.projectName} onChange={(e) => setData({ ...data, projectName: e.target.value })} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} placeholder="https://yoursite.com" />
        </div>
        <div>
          <Label>Project Goals</Label>
          <Textarea value={data.goals} onChange={(e) => setData({ ...data, goals: e.target.value })} placeholder="What are you hoping to achieve?" />
        </div>

        {/* Custom questions */}
        {customQuestions.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
            {customQuestions.map((q) => (
              <div key={q.id} style={{ marginBottom: 20 }}>
                <Label>
                  {q.label}
                  {q.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
                </Label>

                {q.type === "short_text" && (
                  <Input value={customAnswers[q.id] || ""} onChange={(e) => updateCustomAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder || "Your answer..."} required={q.required} />
                )}
                {q.type === "long_text" && (
                  <Textarea value={customAnswers[q.id] || ""} onChange={(e) => updateCustomAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder || "Your answer..."} required={q.required} />
                )}
                {q.type === "multiple_choice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {(q.options || []).map((opt) => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input type="radio" name={q.id} value={opt}
                          checked={customAnswers[q.id] === opt} onChange={() => updateCustomAnswer(q.id, opt)} required={q.required} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === "dropdown" && (
                  <select value={customAnswers[q.id] || ""} onChange={(e) => updateCustomAnswer(q.id, e.target.value)}
                    required={q.required}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111827", outline: "none" }}>
                    <option value="">Select an option...</option>
                    {(q.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {q.type === "date" && (
                  <Input type="date" value={customAnswers[q.id] || ""}
                    onChange={(e) => updateCustomAnswer(q.id, e.target.value)} required={q.required} />
                )}
                {q.type === "yes_no" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {["Yes", "No"].map((opt) => (
                      <button key={opt} type="button" onClick={() => updateCustomAnswer(q.id, opt)}
                        style={{
                          padding: "8px 24px", borderRadius: 8,
                          border: customAnswers[q.id] === opt ? `2px solid ${portal.brandColor || "#6366f1"}` : "2px solid #e5e7eb",
                          background: customAnswers[q.id] === opt ? `${portal.brandColor || "#6366f1"}15` : "#fff",
                          color: customAnswers[q.id] === opt ? portal.brandColor || "#6366f1" : "#374151",
                          cursor: "pointer", fontSize: 14,
                          fontWeight: customAnswers[q.id] === opt ? 600 : 400,
                          fontFamily: "inherit", transition: "all 0.15s",
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button type="submit" disabled={loading} style={{ background: portal.brandColor || "#6366f1" }}>
          {loading ? "Submitting..." : "Submit & Continue"}
        </Button>
      </form>
    </Card>
  );
}

// ── FilesStep ──────────────────────────────────────────────────────────────────

function FilesStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    async function loadExistingFiles() {
      const { data, error } = await supabase.storage.from("portal-files")
        .list(portal.id, { sortBy: { column: "created_at", order: "desc" } });
      if (!error && data) setExistingFiles(data.map((f) => f.name));
      setLoadingExisting(false);
    }
    loadExistingFiles();
  }, [portal.id]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleUpload() {
    if (files.length === 0) { toast.error("Please select at least one file"); return; }
    setUploading(true);
    const successfulUploads: string[] = [];

    for (const file of files) {
      const { error } = await supabase.storage.from("portal-files")
        .upload(`${portal.id}/${Date.now()}_${file.name}`, file, { upsert: true });
      if (error) toast.error(`Failed to upload ${file.name}`);
      else successfulUploads.push(file.name);
    }

    if (successfulUploads.length > 0) {
      setUploaded(successfulUploads);
      await portalStore.updateProgress(portal.id, { filesUploaded: true });
      const { data } = await supabase.storage.from("portal-files").list(portal.id, { sortBy: { column: "created_at", order: "desc" } });
      if (data) setExistingFiles(data.map((f) => f.name));
      toast.success(`${successfulUploads.length} file(s) uploaded!`);
      setTimeout(() => onDone(), 1500);
    }
    setUploading(false);
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-2">Upload Your Files</h2>
      <p className="text-muted-foreground text-sm mb-6">Upload any logos, brand assets, documents or references.</p>

      {!loadingExisting && existingFiles.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: "#16a34a" }} /> Previously uploaded files
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {existingFiles.map((name) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <FileIcon style={{ width: 14, height: 14, color: "#16a34a" }} />
                <span style={{ fontSize: 13, color: "#166534" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById("file-input")?.click()}
        style={{ border: `2px dashed ${dragOver ? portal.brandColor || "#6366f1" : "#d1d5db"}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#f5f3ff" : "#fafafa", transition: "all 0.2s", marginBottom: 20 }}>
        <Upload className="mx-auto mb-3" style={{ width: 36, height: 36, color: dragOver ? portal.brandColor || "#6366f1" : "#9ca3af" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>{dragOver ? "Drop files here" : "Drag & drop files here"}</p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>or click to browse — any file type accepted</p>
        <input id="file-input" type="file" multiple onChange={handleFileInput} style={{ display: "none" }} />
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>{files.length} file(s) selected</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((file, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileIcon style={{ width: 16, height: 16, color: "#6366f1" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{file.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{formatSize(file.size)}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploaded.length > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a" }} />
          <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>{uploaded.join(", ")} uploaded successfully!</p>
        </div>
      )}

      <Button onClick={handleUpload} disabled={uploading || files.length === 0}
        style={{ background: files.length === 0 ? "#e5e7eb" : portal.brandColor || "#6366f1", color: files.length === 0 ? "#9ca3af" : "#fff", width: "100%" }}>
        {uploading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
            Uploading {files.length} file(s)...
          </span>
        ) : `Upload ${files.length > 0 ? files.length + " file" + (files.length > 1 ? "s" : "") : ""} & Continue`}
      </Button>
    </Card>
  );
}

// ── PaymentStep ────────────────────────────────────────────────────────────────

function PaymentStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-2xl font-bold">Payment</h2>
      {portal.paymentLink && (
        <Button asChild className="mt-6" style={{ background: portal.brandColor || "#6366f1" }}>
          <a href={portal.paymentLink} target="_blank">Pay Now</a>
        </Button>
      )}
      <Button variant="ghost" className="mt-4" onClick={onDone}>I've already paid</Button>
    </Card>
  );
}

// ── MeetingStep ────────────────────────────────────────────────────────────────

function MeetingStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-2xl font-bold">Book Meeting</h2>
      {portal.meetingLink && (
        <Button asChild className="mt-6" style={{ background: portal.brandColor || "#6366f1" }}>
          <a href={portal.meetingLink} target="_blank">Book Meeting</a>
        </Button>
      )}
      <Button variant="ghost" className="mt-4" onClick={onDone}>Skip for now</Button>
    </Card>
  );
}

// ── CompletionStep ─────────────────────────────────────────────────────────────

function CompletionStep() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const completedSteps = [
    { icon: "📋", label: "Intake Form", desc: "Project details captured" },
    { icon: "📁", label: "Files Uploaded", desc: "Assets ready for review" },
    { icon: "💳", label: "Payment Done", desc: "Project slot secured" },
    { icon: "📅", label: "Meeting Booked", desc: "Kickoff call scheduled" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: "relative" }}>
      <style>{`
        @keyframes fall-0 { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(80px) rotate(180deg); opacity: 0; } }
        @keyframes fall-1 { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100px) rotate(-180deg); opacity: 0; } }
        @keyframes fall-2 { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(60px) rotate(270deg); opacity: 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
      `}</style>

      {showConfetti && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none", display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", padding: 8, zIndex: 10 }}>
          {["🎉", "✨", "🎊", "⭐", "🎈", "💫", "🎉", "✨", "🎊"].map((emoji, i) => (
            <span key={i} style={{ fontSize: 24, animation: `fall-${i % 3} 2s ease-in forwards`, animationDelay: `${i * 0.15}s`, display: "inline-block" }}>{emoji}</span>
          ))}
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", animation: "pulse-ring 1.5s ease-out infinite" }} />
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.5px" }}>You're all done! 🎉</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
          Congratulations! You've completed all your onboarding steps. We're excited to get started!
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 16px" }}>Completed steps</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {completedSteps.map((step) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 18 }}>{step.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#166534" }}>{step.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#4ade80" }}>{step.desc}</p>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>✓</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fafafa", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>What happens next?</p>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.6 }}>Our team will review your submission and reach out within 24 hours. Keep an eye on your inbox!</p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>💬 Have questions? Use the Messages tab to chat with us directly.</p>
      </div>
    </div>
  );
}
