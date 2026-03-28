import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    { label: "Active Apps", value: "5 Apps", icon: "??" },
    { label: "Active Subscriptions", value: "3 Subscribed", icon: "??" },
    { label: "My Tickets", value: "8", icon: "??" },
    { label: "Usage", value: "67%", icon: "??" },
  ];

  const usageData = [
    { day: "Sun", value: 25 },
    { day: "Mon", value: 45 },
    { day: "Tue", value: 38 },
    { day: "Wed", value: 62 },
    { day: "Thu", value: 56 },
    { day: "Fri", value: 70 },
    { day: "Sat", value: 83 },
  ];

  const transactions = [
    { id: "#2099", amount: "?2,500", since: "2 days ago", status: "Paid" },
    { id: "Auto-Renewal", amount: "?2,500", since: "6 days ago", status: "Paid" },
    { id: "#2086", amount: "?5,000", since: "9 days ago", status: "Failed" },
    { id: "#2079", amount: "?750", since: "2 weeks ago", status: "Paid" },
  ];

  const recentApps = [
    { name: "Application Management", note: "2 days ago", icon: "??" },
    { name: "CRM System", note: "6 days ago", icon: "??" },
    { name: "Charge Management", note: "10 days ago", icon: "??" },
    { name: "Charge Management", note: "10 days ago", icon: "??" },
  ];

  const recentActivities = [
    { title: "Subscribed to Charge Management", when: "2 days ago" },
    { title: "Invoice #2096", when: "10 days ago" },
  ];

  const simpleActivity = [
    { title: "Subscription renewed", when: "2 days ago", status: "Completed" },
    { title: "Opened CRM System", when: "6 days ago", status: "Completed" },
    { title: "Invoice #2086", when: "6 days ago", status: "Failed" },
    { title: "Invoice #2079", when: "2 weeks ago", status: "Paid" },
  ];

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0",
    padding: 16,
  };

  const statusColor = (status) => {
    if (status === "Paid") return "#10b981";
    if (status === "Failed") return "#ef4444";
    return "#0ea5e9";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <style>{`
        @media (max-width: 768px) {
          .grid2 { grid-template-columns: 1fr !important; }
          .grid4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid3 { grid-template-columns: 1fr !important; }
          .gridItems { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .grid4 { grid-template-columns: 1fr !important; }
          .gridItems { grid-template-columns: 1fr !important; }
          .topRow { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)" }} className="topRow">
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>Good Morning, Rohan ??</h1>
          <p style={{ marginTop: 6, color: "#64748b" }}>Here’s a quick overview of your account.</p>
        </div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search apps, subscriptions, tickets, invoices..."
          style={{ width: "340px", maxWidth: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
        />
      </div>

      <div className="grid4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, minHeight: 92 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <small style={{ fontSize: 12, color: "#64748b" }}>{stat.label}</small>
                <h2 style={{ margin: "6px 0 0", fontSize: 24, color: "#0f172a" }}>{stat.value}</h2>
              </div>
              <div style={{ fontSize: 20 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Complete KYC</div>
          <p style={{ margin: "0 0 12px", color: "#64748b" }}>Verify your identity for full access and faster onboarding.</p>
          <button onClick={() => alert("KYC flow initiated")} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Start</button>
        </div>

        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Account Settings</div>
          <p style={{ margin: "0 0 12px", color: "#64748b" }}>Manage your account preferences, security, and notifications.</p>
          <button onClick={() => navigate("/settings")} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Go to Settings</button>
        </div>
      </div>

      <div className="grid2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <section style={{ ...cardStyle, minHeight: 176 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>What's New ??</h2>
            <button style={{ border: "1px solid #2563eb", color: "#2563eb", background: "transparent", borderRadius: 8, padding: "6px 11px", cursor: "pointer" }}>View All Updates</button>
          </div>
          <ul style={{ marginTop: 12, paddingLeft: 16 }}>
            <li style={{ marginBottom: 8 }}><span style={{ marginRight: 8 }}>??</span>New Feature: API usage insights added</li>
            <li style={{ marginBottom: 8 }}><span style={{ marginRight: 8 }}>?</span>Improved dashboard performance for faster loading</li>
            <li><span style={{ marginRight: 8 }}>?</span>Bug Fixes: Billing and invoicing issues resolved</li>
          </ul>
        </section>

        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
          <div style={{ ...cardStyle }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Usage Overview (Last 7 Days)</h2>
            <div style={{ marginTop: 10, height: 130, display: "flex", alignItems: "flex-end", gap: 6 }}>
              {usageData.map((item) => {
                const max = Math.max(...usageData.map((d) => d.value));
                const height = (item.value / max) * 100;
                return (
                  <div key={item.day} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: `${height}%`, background: "#2563eb", borderRadius: 8, transition: "0.2s", cursor: "pointer" }} title={`${item.value}%`} />
                    <small style={{ color: "#64748b" }}>{item.day}</small>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
              <span>Currently Active</span>
              <span>18 Sessions, 2 API Calls</span>
            </div>
          </div>

          <div style={{ ...cardStyle }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Transaction History</h2>
            <ul style={{ marginTop: 12 }}> 
              {transactions.map((tx) => (
                <li key={tx.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{tx.id}</strong> <small style={{ color: "#64748b" }}>{tx.since}</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{tx.amount}</span>
                    <span style={{ color: statusColor(tx.status), fontSize: 12, fontWeight: 700 }}>{tx.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Recently Accessed Apps</h2>
        <div className="gridItems" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          {recentApps.map((app, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{app.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{app.name}</p>
                  <small style={{ color: "#64748b" }}>{app.note}</small>
                </div>
              </div>
              <button onClick={() => alert(`Opening ${app.name}`)} style={{ border: "none", background: "#2563eb", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>Open</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <section style={{ ...cardStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Recent Activities</h2>
            <small style={{ color: "#64748b" }}>Last 7d</small>
          </div>
          <ul style={{ marginTop: 12 }}>
            {simpleActivity.map((activity, i) => (
              <li key={i} style={{ padding: "10px 0", borderBottom: i < simpleActivity.length - 1 ? "1px solid #e2e8f0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#0f172a" }}>{activity.title}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{activity.when}</div>
                </div>
                <span style={{ color: statusColor(activity.status), fontSize: 12, fontWeight: 700 }}>{activity.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...cardStyle }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, color: "#0f172a" }}>Support</h2>
          <button onClick={() => alert("Start Chat pressed")} style={{ width: "100%", marginBottom: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #c7d2fe", background: "#f8fafc", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span>Chat with support</span> <span style={{ fontSize: 12 }}>?</span>
          </button>
          <button onClick={() => alert("Raise Ticket pressed")} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c7d2fe", background: "#f8fafc", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span>Raise a Ticket</span> <span style={{ fontSize: 12 }}>?</span>
          </button>
        </section>
      </div>
    </div>
  );
}
