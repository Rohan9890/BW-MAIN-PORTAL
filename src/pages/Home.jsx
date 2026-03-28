import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    { label: "Active Apps", value: "5 Apps", icon: "??" },
    { label: "Active Subscriptions", value: "3 Subscribed", icon: "??" },
    { label: "My Tickets", value: "8", icon: "???" },
  ];

  const usageData = [
    { day: "Sun", value: 18 },
    { day: "Mon", value: 28 },
    { day: "Tue", value: 40 },
    { day: "Wed", value: 62 },
    { day: "Thu", value: 55 },
    { day: "Fri", value: 72 },
    { day: "Sat", value: 83 },
  ];

  const transactions = [
    { id: "Invoice #2099", amount: "?2,500", since: "2 days ago", status: "Paid" },
    { id: "Auto-Renewal", amount: "?2,500", since: "6 days ago", status: "Paid" },
    { id: "Invoice #2086", amount: "?5,000", since: "9 days ago", status: "Failed" },
    { id: "Invoice #2079", amount: "?750", since: "2 weeks ago", status: "Paid" },
  ];

  const recentApps = [
    { name: "Application Management", note: "2 days ago", action: "Open", icon: "??" },
    { name: "CRM System", note: "6 days ago", action: "Open", icon: "??" },
    { name: "Charge Management", note: "10 days ago", action: "Open", icon: "??" },
    { name: "Analytics", note: "10 days ago", action: "Open", icon: "??" },
  ];

  const recentActivities = [
    { title: "Subscribed to Charge Management", when: "2 days ago" },
    { title: "Invoice #2096", when: "10 days ago" },
  ];

  const sideActivity = [
    { title: "Subscription renewed", when: "2 days ago", status: "Completed" },
    { title: "Opened CRM System", when: "6 days ago", status: "Completed" },
    { title: "Invoice #2086", when: "6 days ago", status: "Failed" },
    { title: "Invoice #2079", when: "2 weeks ago", status: "Paid" },
  ];

  const card = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
    padding: 16,
  };

  const statusColor = (status) => {
    if (status === "Paid") return "#10b981";
    if (status === "Failed") return "#ef4444";
    return "#0ea5e9";
  };

  const maxUsage = Math.max(...usageData.map((d) => d.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <style>{`
        @media (max-width: 1024px) {
          .mainGrid { grid-template-columns: 1fr !important; }
          .topStats { grid-template-columns: repeat(2, 1fr) !important; }
          .wideGrid { grid-template-columns: 1fr !important; }
          .smallGrid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .searchArea { flex-direction: column !important; align-items: stretch !important; }
          .searchBar { width: 100% !important; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(15,23,42,0.05)" }} className="searchArea">
        <div>
          <h1 style={{ margin: 0, fontSize: 32, color: "#102a43" }}>Good Morning, Rohan ??</h1>
          <p style={{ margin: "8px 0 0", color: "#627d98" }}>Here&apos;s a quick overview of your account.</p>
        </div>
        <input
          className="searchBar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search apps, subscriptions, tickets, invoices..."
          style={{ width: 480, maxWidth: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15, background: "#f8fafc" }}
        />
      </div>

      <div className="mainGrid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateRows: "auto auto auto auto", gap: 14 }}>
          <div className="topStats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ ...card, minHeight: 92 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600 }}>{stat.label}</p>
                <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#102a43" }}>{stat.value}</h2>
              </div>
            ))}
            <div style={{ ...card, minHeight: 92 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600 }}>Usage Overview</p>
              <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#102a43" }}>67%</h2>
            </div>
          </div>

          <div className="wideGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ ...card }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#102a43" }}>Complete KYC</h3>
              <p style={{ margin: "8px 0", color: "#627d98", fontSize: 13 }}>Verify your identity for access</p>
              <button onClick={() => alert("Start KYC clicked")} style={{ borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", padding: "8px 14px", cursor: "pointer" }}>Start</button>
            </div>
            <div style={{ ...card }}>
              < h3 style={{ margin: 0, fontSize: 14, color: "#102a43" }}>Account Settings</h3>
              <p style={{ margin: "8px 0", color: "#627d98", fontSize: 13 }}>Manage your account preferences</p>
              <button onClick={() => navigate("/settings")} style={{ borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", padding: "8px 14px", cursor: "pointer" }}>Go to Settings</button>
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#102a43" }}>What&apos;s New</h3>
              <button onClick={() => alert("View All Updates")} style={{ border: "1px solid #2563eb", borderRadius: 8, background: "transparent", color: "#2563eb", padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>View All Updates</button>
            </div>
            <div style={{ marginTop: 12, color: "#334e68", fontSize: 14 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span>??</span><span>New Feature: API usage insights added</span></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span>?</span><span>Improved dashboard performance for faster loading</span></div>
              <div style={{ display: "flex", gap: 8 }}><span>?</span><span>Bug Fixes: Billing and invoicing issues resolved</span></div>
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#102a43" }}>Recently Accessed Apps</h3>
              <small style={{ color: "#64748b" }}>Last 7d</small>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {recentApps.map((app) => (
                <div key={app.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #dbeafe", borderRadius: 10, padding: "10px 12px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{app.name}</p>
                    <small style={{ color: "#64748b" }}>{app.note}</small>
                  </div>
                  <button onClick={() => alert(`Opening ${app.name}`)} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>{app.action}</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#102a43" }}>Recent Activities</h3>
              <small style={{ color: "#64748b" }}>Last 7d</small>
            </div>
            {recentActivities.map((item) => (
              <div key={item.title} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#102a43" }}>{item.title}</span>
                <span style={{ color: "#64748b", fontSize: 13 }}>{item.when}</span>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#102a43" }}>Usage Overview</h3>
              <small style={{ color: "#64748b" }}>Last 7d</small>
            </div>
            <div style={{ marginTop: 12, height: 120, display: "flex", alignItems: "flex-end", gap: 6 }}>
              {usageData.map((item) => (
                <div key={item.day} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: `${(item.value / maxUsage) * 100}%`, background: "#2f80ed", borderRadius: 6, transition: "0.2s" }}></div>
                  <small style={{ color: "#64748b" }}>{item.day}</small>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
              <span>Currently Active</span>
              <span>18 Sessions, 2 API Calls</span>
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#102a43" }}>Transaction History</h3>
              <small style={{ color: "#64748b" }}>Last 7d</small>
            </div>
            {transactions.map((tx) => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 10px", marginTop: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{tx.id}</p>
                  <small style={{ color: "#64748b" }}>{tx.since}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{tx.amount}</p>
                  <small style={{ color: statusColor(tx.status) }}>{tx.status}</small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...card }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#102a43" }}>Recent Activity</h3>
            {sideActivity.map((item) => (
              <div key={item.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                  <small style={{ color: "#64748b" }}>{item.when}</small>
                </div>
                <span style={{ color: statusColor(item.status), fontSize: 12, fontWeight: 700 }}>{item.status}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#102a43" }}>Support</h3>
            <button onClick={() => alert("Chat with support clicked") } style={{ width: "100%", marginBottom: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #c7d2fe", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span>Chat with support</span><span>?</span>
            </button>
            <button onClick={() => alert("Raise a ticket clicked") } style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c7d2fe", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span>Raise a Ticket</span><span>?</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
