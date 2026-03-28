import { useMemo, useState } from "react";

const INITIAL_APPS = [
  {
    id: 1,
    name: "Application Management",
    description: "Software management",
    category: "DevOps",
    status: "subscribed",
    usage: 72,
  },
  {
    id: 2,
    name: "CRM System",
    description: "Sales tools",
    category: "Productivity",
    status: "subscribed",
    usage: 85,
  },
  {
    id: 3,
    name: "Charge Management",
    description: "Billing and invoices",
    category: "Finance",
    status: "subscribed",
    usage: 53,
  },
  {
    id: 4,
    name: "Inventory Forecast",
    description: "Stock predictions",
    category: "Planning",
    status: "available",
    usage: 0,
  },
  {
    id: 5,
    name: "Compliance Guard",
    description: "Policy and risk checks",
    category: "Security",
    status: "available",
    usage: 0,
  },
];

const RECENT_ACTIVITY = [
  { id: 1, title: "Subscription renewed", when: "2 days ago" },
  { id: 2, title: "Opened CRM System", when: "3 days ago" },
  { id: 3, title: "Profile information updated", when: "5 days ago" },
];

export default function Home() {
  const [apps, setApps] = useState(INITIAL_APPS);
  const [search, setSearch] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDetails, setTicketDetails] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const filteredApps = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query),
    );
  }, [apps, search]);

  const summary = useMemo(() => {
    const total = apps.length;
    const subscribed = apps.filter((app) => app.status === "subscribed").length;
    const usage = apps.reduce((sum, app) => sum + (app.usage || 0), 0);
    return {
      total,
      subscribed,
      avgUsage: subscribed ? Math.round(usage / subscribed) : 0,
    };
  }, [apps]);

  const toggleSubscription = (id) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: app.status === "subscribed" ? "available" : "subscribed",
              usage: app.status === "subscribed" ? 0 : 20,
            }
          : app,
      ),
    );
  };

  const raiseTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDetails) {
      window.alert("Please fill subject and details to raise a ticket.");
      return;
    }
    setTicketSubmitted(true);
    setTicketSubject("");
    setTicketDetails("");
    setTimeout(() => setTicketSubmitted(false), 2800);
  };

  return (
    <div style={{ width: "100%", minWidth: 320 }}>
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .actions-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .search-bar { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .actions-grid { grid-template-columns: 1fr !important; }
          h1 { font-size: 20px !important; }
          .search-bar { width: 100% !important; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          padding: "16px 12px",
          marginBottom: 16,
          boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ width: "100%" }}>
          <h1 style={{ margin: 0, fontSize: 30 }}>Good Morning, Rohan 👋</h1>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>
            Here&apos;s a quick overview of your account.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className="search-bar"
          style={{
            width: 280,
            padding: "10px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
        className="stats-grid"
      >
        <StatCard title="Active Apps" value={`${summary.total} Apps`} />
        <StatCard
          title="Active Subscriptions"
          value={`${summary.subscribed} Subscribed`}
        />
        <StatCard title="Average Usage" value={`${summary.avgUsage}%`} />
        <StatCard title="Open Support Tickets" value="8" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
        className="actions-grid"
      >
        <ActionCard
          title="Complete KYC"
          description="Verify your identity for access"
          buttonText="Start"
        />
        <ActionCard
          title="Explore Apps"
          description="Discover all available applications"
          buttonText="Browse"
        />
        <ActionCard
          title="Account Settings"
          description="Manage your account preferences"
          buttonText="Go to Settings"
        />
        <ActionCard
          title="Contact Support"
          description="Get assistance from our support team"
          buttonText="Get Help"
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}
        className="main-grid"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <CardContainer title="Recently Accessed Apps">
            {filteredApps.slice(0, 3).map((app) => (
              <AppRow
                key={app.id}
                app={app}
                onAction={() =>
                  app.status === "subscribed"
                    ? window.alert(`${app.name} opened`)
                    : toggleSubscription(app.id)
                }
              />
            ))}
            {filteredApps.length === 0 && (
              <p style={{ color: "#64748b" }}>No apps found.</p>
            )}
          </CardContainer>

          <CardContainer title="Activity Timeline">
            <ul
              style={{
                padding: 0,
                margin: 0,
                listStyle: "none",
                display: "grid",
                gap: 10,
              }}
            >
              {RECENT_ACTIVITY.map((item) => (
                <li
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 8,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>
                    {item.title}
                  </p>
                  <small style={{ color: "#64748b" }}>{item.when}</small>
                </li>
              ))}
            </ul>
          </CardContainer>
        </div>

        <aside style={{ display: "grid", gap: 12 }}>
          <CardContainer title="Recent Activity">
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: 10,
              }}
            >
              {RECENT_ACTIVITY.slice(0, 2).map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#0f172a" }}>
                    {item.title}
                  </span>
                  <small style={{ color: "#64748b" }}>{item.when}</small>
                </li>
              ))}
            </ul>
          </CardContainer>

          <CardContainer title="Raise Ticket">
            <form onSubmit={raiseTicket} style={{ display: "grid", gap: 10 }}>
              <input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Subject"
                style={{
                  padding: 8,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
              <textarea
                value={ticketDetails}
                onChange={(e) => setTicketDetails(e.target.value)}
                placeholder="Describe your issue"
                rows={4}
                style={{
                  padding: 8,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Raise Ticket
              </button>
              {ticketSubmitted && (
                <span style={{ color: "#16a34a" }}>
                  Ticket raised successfully!
                </span>
              )}
            </form>
          </CardContainer>

          <CardContainer title="Help & Support">
            <div style={{ display: "grid", gap: 8 }}>
              <SupportItem title="Read Documentation" />
              <SupportItem title="Billing & Payments FAQ" />
              <SupportItem title="Contact Admin" />
              <button
                style={{
                  marginTop: 8,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
                onClick={() => window.alert("Admin support request sent")}
              >
                Need Assistance?
              </button>
            </div>
          </CardContainer>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
      }}
    >
      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 13 }}>
        {title}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700 }}>
        {value}
      </p>
    </div>
  );
}

function ActionCard({ title, description, buttonText }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
      }}
    >
      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 13 }}>
        {title}
      </p>
      <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 13 }}>
        {description}
      </p>
      <button
        style={{
          marginTop: 10,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

function CardContainer({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        padding: 14,
        boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
      }}
    >
      <h2 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function AppRow({ app, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
        borderTop: "1px solid #e2e8f0",
        paddingTop: 8,
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: 600 }}>{app.name}</p>
        <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 13 }}>
          {app.description}
        </p>
      </div>
      <button
        onClick={onAction}
        style={{
          border: "none",
          background: "#2563eb",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        {app.status === "subscribed" ? "Open" : "Subscribe"}
      </button>
    </div>
  );
}

function SupportItem({ title }) {
  return (
    <button
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        background: "#f8fafc",
        color: "#0f172a",
        cursor: "pointer",
      }}
      onClick={() => window.alert(title)}
    >
      {title}
    </button>
  );
}
