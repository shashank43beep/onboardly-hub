import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { portalStore } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/activity/$id")({
  component: ActivityPage,
});

function ActivityPage() {
  const { id } = Route.useParams();
  const [portal, setPortal] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await portalStore.get(id);
      setPortal(data);
    }
    load();
  }, [id]);

  if (!portal) return <p style={{ padding: 40 }}>Loading...</p>;

  const timeline = [
    {
      label: "Portal Created",
      done: true,
    },
    {
      label: "Form Submitted",
      done: portal.progress?.formComplete,
    },
    {
      label: "Files Uploaded",
      done: portal.progress?.filesUploaded,
    },
    {
      label: "Payment Completed",
      done: portal.progress?.paymentCompleted,
    },
    {
      label: "Meeting Booked",
      done: portal.progress?.meetingBooked,
    },
  ];

  return (
    <div style={{ padding: 40 }}>
      <h1>{portal.portalName} Activity</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        {portal.clientName}
      </p>

      {timeline.map((item, index) => (
        <div
          key={index}
          style={{
            padding: 16,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: item.done ? "#ecfdf5" : "#f9fafb",
          }}
        >
          <strong>{item.label}</strong>
          <p style={{ marginTop: 6, color: "#666" }}>
            {item.done ? "Completed" : "Pending"}
          </p>
        </div>
      ))}
    </div>
  );
}
