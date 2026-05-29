import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Upload,
  FileText,
  CreditCard,
  Calendar,
  PartyPopper,
  ArrowRight,
  Sparkles,
  Loader2,
  FileIcon,
  X,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { CommentThread } from "@/components/CommentThread";
import { MessageSquare } from "lucide-react";
import { Logo } from "@/components/logo";

import { portalStore, type Portal } from "@/lib/storage";
import { postToWebhook } from "@/lib/webhook";
import { supabase } from "@/lib/supabase";
import { AIAssistant } from "@/components/AIAssistant";

import { toast } from "sonner";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/portal/$id")({
  head: ({ params }) => ({ meta: [{ title: `Portal — ${params.id}` }] }),
  component: ClientPortal,
});
async function sendStepEmail(
  step: string,
  portal: Portal,
  isComplete: boolean
) {
  const clientEmail = portal.clientEmail;
  if (!clientEmail) return;

  const portalUrl = `${window.location.origin}/portal/${portal.id}`;

  if (isComplete) {
    // All steps done — send completion email
    await fetch("/api/send-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail,
        clientName: portal.clientName,
        portalName: portal.portalName,
        portalUrl,
      }),
    }).catch(() => {});
  } else {
    // Individual step done
    await fetch("/api/send-step-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail,
        clientName: portal.clientName,
        portalName: portal.portalName,
        portalUrl,
        step,
      }),
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
    {
      id: "form",
      label: "Intake Form",
      icon: FileText,
      done: portal.progress.formComplete,
    },
    {
      id: "files",
      label: "Asset Upload",
      icon: Upload,
      done: portal.progress.filesUploaded,
    },
    {
      id: "payment",
      label: "Payment",
      icon: CreditCard,
      done: portal.progress.paymentCompleted,
    },
    {
      id: "meeting",
      label: "Kickoff Call",
      icon: Calendar,
      done: portal.progress.meetingBooked,
    },
    {
  id: "messages",
  label: "Messages",
  icon: MessageSquare,
  done: false, // always accessible
},
  ];

  return (
    <SiteLayout>
      <Toaster position="top-center" />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-3">
              {portal.brandLogo ? (
  <img
    src={portal.brandLogo}
    alt={portal.clientName}
    className="h-10 w-10 rounded-lg object-contain"
  />
) : (
  <Logo size={40} variant="icon" />
)}

              <div className="w-full">
                <h2 className="font-semibold">{portal.portalName}</h2>
                <p className="text-xs text-muted-foreground">
                  {portal.clientName}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Portal link copied");
                  }}
                >
                  Copy Portal Link
                </Button>
              </div>
            </div>

            <nav className="space-y-1">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setSection(step.id as Section)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    section === step.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <step.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{step.label}</span>
                  {step.done && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main>
            {section === "welcome" && (
              <WelcomeStep
                portal={portal}
                onNext={() => setSection("form")}
              />
            )}

            {section === "form" && (
              <FormStep
                portal={portal}
                onDone={() => {
                  refresh();
                  sendStepEmail("form", portal, false); 
                  setSection("files");
                }}
              />
            )}

            {section === "files" && (
              <FilesStep
                portal={portal}
                onDone={() => {
                  refresh();
                  sendStepEmail("files", portal, false); 
                  setSection("payment");
                }}
              />
            )}

            {section === "payment" && (
              <PaymentStep
                portal={portal}
                onDone={() => {
                  refresh();
                  sendStepEmail("payment", portal, false);
                  setSection("meeting");
                }}
              />
            )}

            {section === "meeting" && (
              <MeetingStep
                portal={portal}
                onDone={() => {
                  refresh();
                  sendStepEmail("meeting", portal, true);
                  setSection("done");
                }}
              />
            )}

            {section === "done" && <CompletionStep />}
            {section === "messages" && (
  <Card className="p-8">
    <h2 className="text-xl font-semibold mb-6">Messages</h2>
    <CommentThread
      portalId={portal.id}
      authorType="client"
      authorName={portal.clientName}
    />
  </Card>
)}
          </main>
        </div>
      </div>
      {/* ✅ AI Assistant — floating button */}
    <AIAssistant
      portalId={portal.id}
      clientName={portal.clientName}
      portalName={portal.portalName}
      brandColor={portal.brandColor || "#6366f1"}
    />
    </SiteLayout>
  );
}

function WelcomeStep({
  portal,
  onNext,
}: {
  portal: Portal;
  onNext: () => void;
}) {
  return (
    <Card className="p-10 text-center">
      <h1 className="text-3xl font-bold">Welcome, {portal.clientName}</h1>
      <p className="mt-4 text-muted-foreground">{portal.welcomeMessage}</p>

      <Button
        className="mt-8"
        style={{ background: portal.brandColor || "#2563eb" }}
        onClick={onNext}
      >
        Begin onboarding <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}

function FormStep({
  portal,
  onDone,
}: {
  portal: Portal;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    projectName: portal.portalName,
    goals: "",
    website: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase.from("submissions").upsert(
      [
        {
          portal_id: portal.id,
          client_name: portal.clientName,
          client_email: portal.clientEmail,
          project_details: data,
        },
      ],
      { onConflict: "portal_id" }
    );

    await portalStore.updateProgress(portal.id, {
      formComplete: true,
    });

    toast.success("Submitted");
    onDone();
    setLoading(false);
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Project Name</Label>
          <Input
            value={data.projectName}
            onChange={(e) =>
              setData({ ...data, projectName: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Website</Label>
          <Input
            value={data.website}
            onChange={(e) =>
              setData({ ...data, website: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Goals</Label>
          <Textarea
            value={data.goals}
            onChange={(e) =>
              setData({ ...data, goals: e.target.value })
            }
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          style={{ background: portal.brandColor || "#2563eb" }}
        >
          {loading ? "Submitting..." : "Submit & Continue"}
        </Button>
      </form>
    </Card>
  );
}

function FilesStep({
  portal,
  onDone,
}: {
  portal: Portal;
  onDone: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true); 
  useEffect(() => {
  async function loadExistingFiles() {
    const { data, error } = await supabase.storage
      .from("portal-files")
      .list(portal.id, {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (!error && data) {
      setExistingFiles(data.map((f) => f.name));
    }
    setLoadingExisting(false);
  }

  loadExistingFiles();
}, [portal.id]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
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
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    const successfulUploads: string[] = [];

    for (const file of files) {
      const filePath = `${portal.id}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from("portal-files")
        .upload(filePath, file, { upsert: true });

      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      } else {
        successfulUploads.push(file.name);
      }
    }

    if (successfulUploads.length > 0) {
      setUploaded(successfulUploads);

      await portalStore.updateProgress(portal.id, {
        filesUploaded: true,
      });

      toast.success(
        `${successfulUploads.length} file${successfulUploads.length > 1 ? "s" : ""} uploaded successfully!`
      );

      // Refresh existing files list
const { data } = await supabase.storage
  .from("portal-files")
  .list(portal.id, {
    sortBy: { column: "created_at", order: "desc" },
  });
if (data) setExistingFiles(data.map((f) => f.name));

setTimeout(() => onDone(), 1500);
    }

    setUploading(false);
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-2">Upload Your Files</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Upload any logos, brand assets, documents or references.
      </p>

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById("file-input")?.click()}
        style={{
          border: `2px dashed ${dragOver ? portal.brandColor || "#6366f1" : "#d1d5db"}`,
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "#f5f3ff" : "#fafafa",
          transition: "all 0.2s",
          marginBottom: 20,
        }}
      >
        <Upload
          className="mx-auto mb-3"
          style={{
            width: 36, height: 36,
            color: dragOver ? portal.brandColor || "#6366f1" : "#9ca3af",
          }}
        />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>
          {dragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          or click to browse — any file type accepted
        </p>

        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#f9fafb",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileIcon style={{ width: 16, height: 16, color: "#6366f1" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                      {formatSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  style={{
                    background: "none", border: "none",
                    cursor: "pointer", color: "#ef4444", padding: 4,
                  }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Previously Uploaded Files */}
{!loadingExisting && existingFiles.length > 0 && (
  <div style={{ marginBottom: 20 }}>
    <p style={{
      fontSize: 13, fontWeight: 600,
      color: "#374151", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <CheckCircle2 style={{ width: 14, height: 14, color: "#16a34a" }} />
      Previously uploaded files
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {existingFiles.map((name) => (
        <div key={name} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px",
          background: "#f0fdf4",
          borderRadius: 8,
          border: "1px solid #bbf7d0",
        }}>
          <FileIcon style={{ width: 14, height: 14, color: "#16a34a" }} />
          <span style={{ fontSize: 13, color: "#166534" }}>{name}</span>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Success State */}
      {uploaded.length > 0 && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 8, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a" }} />
          <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
            {uploaded.join(", ")} uploaded successfully!
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{
          background: files.length === 0 ? "#e5e7eb"
            : portal.brandColor || "#6366f1",
          color: files.length === 0 ? "#9ca3af" : "#fff",
          width: "100%",
        }}
      >
        {uploading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
            Uploading {files.length} file{files.length > 1 ? "s" : ""}...
          </span>
        ) : (
          `Upload ${files.length > 0 ? files.length + " file" + (files.length > 1 ? "s" : "") : ""} & Continue`
        )}
      </Button>
    </Card>
  );
}

function PaymentStep({
  portal,
  onDone,
}: {
  portal: Portal;
  onDone: () => void;
}) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-2xl font-bold">Payment</h2>

      {portal.paymentLink && (
        <Button
          asChild
          className="mt-6"
          style={{ background: portal.brandColor || "#2563eb" }}
        >
          <a href={portal.paymentLink} target="_blank">
            Pay via Stripe
          </a>
        </Button>
      )}

      <Button variant="ghost" className="mt-4" onClick={onDone}>
        I've already paid
      </Button>
    </Card>
  );
}

function MeetingStep({
  portal,
  onDone,
}: {
  portal: Portal;
  onDone: () => void;
}) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-2xl font-bold">Book Meeting</h2>

      {portal.meetingLink && (
        <Button
          asChild
          className="mt-6"
          style={{ background: portal.brandColor || "#2563eb" }}
        >
          <a href={portal.meetingLink} target="_blank">
            Book Meeting
          </a>
        </Button>
      )}

      <Button variant="ghost" className="mt-4" onClick={onDone}>
        Skip for now
      </Button>
    </Card>
  );
}

function CompletionStep() {
  return (
    <Card className="p-10 text-center">
      <PartyPopper className="mx-auto h-10 w-10 text-green-600" />
      <h1 className="mt-4 text-3xl font-bold">You're all set!</h1>
    </Card>
  );
}