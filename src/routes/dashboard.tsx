import { createFileRoute, Link, Outlet, useMatch, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const location = useLocation();
  const isRootDashboard = location.pathname === "/dashboard";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {isRootDashboard ? (
        <>
          <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>Dashboard</h1>

          <Link
            to="/dashboard/new"
            style={{
              display: "inline-block",
              padding: "14px 20px",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            + Create Portal
          </Link>
        </>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
