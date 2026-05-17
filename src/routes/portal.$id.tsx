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

import { portalStore, type Portal } from "@/lib/storage";
import { postToWebhook } from "@/lib/webhook";
import { supabase } from "@/lib/supabase";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/$id")({
  head: ({ params }) => ({ meta: [{ title: `Portal — ${params.id}` }] }),
  component: ClientPortal,
});

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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {portal.clientName.charAt(0)}
                </div>
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

  async function handleUpload() {
    await portalStore.updateProgress(portal.id, {
      filesUploaded: true,
    });

    toast.success("Files uploaded");
    onDone();
  }

  return (
    <Card className="p-8">
      <input
        type="file"
        multiple
        onChange={(e) =>
          setFiles(Array.from(e.target.files || []))
        }
      />

      <Button
        className="mt-6"
        onClick={handleUpload}
        style={{ background: portal.brandColor || "#2563eb" }}
      >
        Upload & Continue
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