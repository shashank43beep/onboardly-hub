import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/submission/$id")({
  component: SubmissionViewer,
});

function SubmissionViewer() {
  const { id } = Route.useParams();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmission() {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("portal_id", id)
        .maybeSingle();

      if (!error) {
        setSubmission(data);
      }

      setLoading(false);
    }

    loadSubmission();
  }, [id]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  if (!submission) {
    return <div style={{ padding: 40 }}>No submission found</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Client Submission</h1>

      <div style={card}>
        <h3>Client Name</h3>
        <p>{submission.client_name}</p>
      </div>

      <div style={card}>
        <h3>Project Details</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(submission.project_details, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const card = {
  padding: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  marginTop: 20,
};
