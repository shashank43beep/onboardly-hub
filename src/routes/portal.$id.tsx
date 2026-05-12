import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
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

import { portalStore, type Portal } from "@/lib/storage";
import { postToWebhook } from "@/lib/webhook";
import { supabase } from "@/lib/supabase";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/$id")({
  head: ({ params }) => ({ meta: [{ title: `Portal — ${params.id}` }] }),
  component: ClientPortal,
});

type Section = "welcome" | "form" | "files" | "payment" | "meeting" | "done";

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
        // Determine starting section based on progress
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold">Portal not found</h1>
          <p className="mt-2 text-muted-foreground">The portal you're looking for doesn't exist or has been deleted.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
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
  ];

  return (
    <SiteLayout>
      <Toaster position="top-center" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-3">
              {portal.brandLogo ? (
                <img src={portal.brandLogo} alt={portal.clientName} className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {portal.clientName.charAt(0)}
                </div>
              )}
             <div className="w-full">
  <h2 className="font-semibold leading-none">{portal.portalName}</h2>
  <p className="mt-1 text-xs text-muted-foreground">{portal.clientName}</p>

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
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    section === step.id ? "bg-primary/10 text-primary font-medium shadow-sm" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <step.icon className={cn("h-4 w-4", section === step.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-left">{step.label}</span>
                  {step.done && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-h-[500px]">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {section === "welcome" && <WelcomeStep portal={portal} onNext={() => setSection("form")} />}
              {section === "form" && (
                <FormStep
                  portal={portal}
                  onDone={() => {
                    refresh();
                    setSection("files");
                  }}
                />
              )}
              {section === "files" && (
                <FilesStep
                  portal={portal}
                  onDone={() => {
                    refresh();
                    setSection("payment");
                  }}
                />
              )}
              {section === "payment" && (
                <PaymentStep
                  portal={portal}
                  onDone={() => {
                    refresh();
                    setSection("meeting");
                  }}
                />
              )}
              {section === "meeting" && (
                <MeetingStep
                  portal={portal}
                  onDone={() => {
                    refresh();
                    setSection("done");
                  }}
                />
              )}
              {section === "done" && <CompletionStep portal={portal} />}
            </div>
          </main>
        </div>
      </div>
    </SiteLayout>
  );
}

function WelcomeStep({ portal, onNext }: { portal: Portal; onNext: () => void }) {
  return (
    <Card className="flex flex-col items-center p-8 text-center md:p-12" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lg" style={{ background: "var(--gradient-hero)" }}>
        <Sparkles className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {portal.clientName}!</h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">{portal.welcomeMessage}</p>
      <Button size="lg" className="mt-10 px-8 shadow-md" style={{ background: "var(--gradient-hero)" }} onClick={onNext}>
        Begin onboarding <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}

function FormStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [data, setData] = useState({
    projectName: portal.portalName,
    goals: "",
    website: "",
  });

  useEffect(() => {
    async function loadSubmission() {
      try {
        const { data: submission, error } = await supabase
          .from("submissions")
          .select("project_details")
          .eq("portal_id", portal.id)
          .maybeSingle();

        if (submission && !error) {
          const details = typeof submission.project_details === 'string' 
            ? JSON.parse(submission.project_details) 
            : submission.project_details;
          setData({
            projectName: details.projectName || portal.portalName,
            goals: details.goals || "",
            website: details.website || "",
          });
        }
      } catch (err) {
        console.error("Error loading submission:", err);
      } finally {
        setFetching(false);
      }
    }
    loadSubmission();
  }, [portal.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Upsert submission
      const { data: insertedData, error } = await supabase
  .from("submissions")
  .upsert(
    [
      {
        portal_id: portal.id,
        client_name: portal.clientName,
        project_details: data,
      },
    ],
    { onConflict: "portal_id" }
  )
  .select();

console.log("Submission result:", insertedData, error);

if (error) {
  throw error;
}

      await postToWebhook(portal.webhookUrl, { type: "form_submission", portalId: portal.id, data });

      await portalStore.updateProgress(portal.id, { formComplete: true });
      toast.success("Form submitted successfully");
      onDone();
    } catch (err) {
      toast.error("Failed to submit form");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <Card className="flex h-[300px] items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-10" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Project Intake Form</h2>
        <p className="mt-1 text-muted-foreground">Tell us a bit more about what we're building together.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input id="projectName" value={data.projectName} onChange={(e) => setData({ ...data, projectName: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website (if applicable)</Label>
          <Input id="website" type="url" placeholder="https://..." value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goals">Project Goals & Vision</Label>
          <Textarea id="goals" rows={5} placeholder="What does success look like for this project?" value={data.goals} onChange={(e) => setData({ ...data, goals: e.target.value })} required />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="w-full shadow-md" style={{ background: "var(--gradient-hero)" }}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit & Continue"}
        </Button>
      </form>
    </Card>
  );
}

function FilesStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      try {
        const { data, error } = await supabase.storage.from("client-assets").list(portal.id);
        if (data && !error) {
          const fileList = data.map(f => ({
            name: f.name,
            url: supabase.storage.from("client-assets").getPublicUrl(`${portal.id}/${f.name}`).data.publicUrl
          }));
          setExistingFiles(fileList);
        }
      } catch (err) {
        console.error("Error loading files:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExisting();
  }, [portal.id]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  async function handleUpload() {
    setUploading(true);
    try {
      for (const file of files) {
        const path = `${portal.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from("client-assets").upload(path, file);
      }

      await postToWebhook(portal.webhookUrl, { type: "files_uploaded", portalId: portal.id, count: files.length });

      // Refresh existing files
      const { data } = await supabase.storage.from("client-assets").list(portal.id);
      if (data) {
        setExistingFiles(data.map(f => ({
          name: f.name,
          url: supabase.storage.from("client-assets").getPublicUrl(`${portal.id}/${f.name}`).data.publicUrl
        })));
      }

      setFiles([]); // Clear local selection
      await portalStore.updateProgress(portal.id, { filesUploaded: true });
      toast.success("All files uploaded successfully");
      onDone();
    } catch (err) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <Card className="flex h-[300px] items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-10" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-semibold">Asset Upload</h2>
        <p className="mt-1 text-muted-foreground">Upload brand assets, logos, and any other relevant files.</p>
      </div>

      {existingFiles.length > 0 && (
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Already uploaded ({existingFiles.length})</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {existingFiles.map((file, i) => (
              <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3 transition-colors hover:bg-primary/10">
                <FileIcon className="h-5 w-5 text-primary" />
                <span className="flex-1 truncate text-sm font-medium">{file.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all",
          isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">Drag and drop files here</p>
        <p className="mt-1 text-sm text-muted-foreground text-center">or click to browse from your computer</p>
        <input
          type="file"
          multiple
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Files to upload ({files.length})</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <FileIcon className="h-5 w-5 text-primary" />
                <span className="flex-1 truncate text-sm font-medium">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} disabled={uploading} size="lg" className="mt-6 w-full shadow-md" style={{ background: "var(--gradient-hero)" }}>
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload & Continue"}
          </Button>
        </div>
      )}

      {files.length === 0 && portal.progress.filesUploaded && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="lg" onClick={onDone}>Continue to next step</Button>
        </div>
      )}
    </Card>
  );
}

function PaymentStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    await portalStore.updateProgress(portal.id, { paymentCompleted: true });
    await postToWebhook(portal.webhookUrl, { type: "payment_complete", portalId: portal.id });
    toast.success("Payment confirmed");
    onDone();
    setLoading(false);
  }

  return (
    <Card className="p-8 text-center md:p-12" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm">
        <CreditCard className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold">Secure Deposit</h2>
      <p className="mt-4 mx-auto max-w-md text-muted-foreground text-lg">
        To kick things off, please complete the initial deposit via our secure payment link.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4">
        {portal.paymentLink ? (
          <Button asChild size="lg" className="w-full max-w-xs shadow-md" style={{ background: "var(--gradient-hero)" }}>
            <a href={portal.paymentLink} target="_blank" rel="noopener noreferrer">Pay via Stripe <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        ) : (
          <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">No payment link provided by the agency.</p>
        )}
        <Button variant="ghost" className="text-muted-foreground" onClick={handleComplete} disabled={loading}>
          {loading ? "Verifying..." : "I've already paid"}
        </Button>
      </div>
    </Card>
  );
}

function MeetingStep({ portal, onDone }: { portal: Portal; onDone: () => void }) {
  return (
    <Card className="p-8 text-center md:p-12" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
        <Calendar className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold">Schedule Kickoff</h2>
      <p className="mt-4 mx-auto max-w-md text-muted-foreground text-lg">
        Book a 30-minute discovery call to align on expectations and timeline.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4">
        {portal.meetingLink ? (
          <Button asChild size="lg" className="w-full max-w-xs shadow-md" style={{ background: "var(--gradient-hero)" }}>
            <a href={portal.meetingLink} target="_blank" rel="noopener noreferrer">Book Meeting <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        ) : (
          <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">No meeting link provided by the agency.</p>
        )}
        <Button variant="ghost" className="text-muted-foreground" onClick={async () => {
          await portalStore.updateProgress(portal.id, { meetingBooked: true });
          onDone();
        }}>
          Skip / I'll book later
        </Button>
      </div>
    </Card>
  );
}

function CompletionStep({ portal }: { portal: Portal }) {
  return (
    <Card className="flex flex-col items-center p-8 text-center md:p-12" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner">
        <PartyPopper className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">You're all set!</h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Onboarding is complete. We've received your information and assets, and we'll be in touch shortly to start the project.
      </p>
      <div className="mt-10 h-px w-full bg-border/60" />
      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm text-muted-foreground">Agency Dashboard Demo</p>
        <Button asChild variant="link" className="mt-2 text-primary">
          <Link to="/dashboard">Go back to dashboard</Link>
        </Button>
      </div>
    </Card>
  );
}