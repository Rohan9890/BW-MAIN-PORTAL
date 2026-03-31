import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getInitials, useAuth } from "../context/AuthContext";
import "./UserDashboard.css";

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "All Apps", path: "/all-apps" },
  { label: "My Apps", path: "/my-apps" },
  { label: "Favorites", path: "/favorites" },
  { label: "Activity", path: "/activity" },
];

const TRANSACTIONS = [
  {
    id: "Invoice #2099",
    time: "2 days ago",
    amount: "₹2,500",
    status: "Paid",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
  {
    id: "Auto-Renewal",
    time: "6 days ago",
    amount: "₹2,500",
    status: "Paid",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
  {
    id: "Invoice #2086",
    time: "9 days ago",
    amount: "₹5,000",
    status: "Failed",
    iconBg: "#fff7ed",
    iconColor: "#f97316",
  },
  {
    id: "Invoice #2079",
    time: "2 weeks ago",
    amount: "₹750",
    status: "Paid",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
];

const RECENT_APPS = [
  {
    name: "Application Management",
    time: "2 days ago",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
  {
    name: "CRM System",
    time: "6 days ago",
    iconBg: "#f3e8ff",
    iconColor: "#8b5cf6",
  },
  {
    name: "Charge Management",
    time: "10 days ago",
    iconBg: "#fef3c7",
    iconColor: "#f59e0b",
  },
  {
    name: "Charge Management",
    time: "10 days ago",
    iconBg: "#fee2e2",
    iconColor: "#ef4444",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "Subscription renewed successfully",
    time: "2 days ago",
    read: false,
  },
  {
    id: 2,
    text: "New invoice #2099 generated",
    time: "3 days ago",
    read: false,
  },
  { id: 3, text: "CRM System access updated", time: "1 week ago", read: true },
  {
    id: 4,
    text: "Your plan has been upgraded",
    time: "2 weeks ago",
    read: true,
  },
];

const WHATS_NEW = [
  { icon: "📋", text: "New Feature: API usage insights added" },
  { icon: "⚡", text: "Improved dashboard performance for faster loading" },
  { icon: "✅", text: "Bug Fixes: Billing and invoicing issues resolved" },
];

const RIGHT_ACTIVITY = [
  { text: "Subscription renewed", time: "2 days ago", status: null },
  { text: "Opened CRM System", time: "6 days ago", status: "Open" },
  { text: "Invoice #2086", time: "6 days ago", status: "Failed" },
  { text: "Invoice #2079", time: "2 weeks ago", status: "Paid" },
];

function InvoiceIcon({ bg, color }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: bg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h4" />
      </svg>
    </div>
  );
}

function AppGridIcon({ bg, color }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: bg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
      </svg>
    </div>
  );
}

function UsageChart() {
  const linePoints = "0,82 60,70 120,74 180,50 240,30 300,15 360,9";
  const areaPoints =
    "0,82 60,70 120,74 180,50 240,30 300,15 360,9 360,100 0,100";
  return (
    <div className="ud-chart-wrap">
      <div className="ud-y-labels">
        <span>2</span>
        <span>60</span>
        <span>75</span>
        <span>0</span>
      </div>
      <div className="ud-chart-body">
        <svg
          viewBox="0 0 360 100"
          preserveAspectRatio="none"
          className="ud-chart-svg"
        >
          <defs>
            <linearGradient id="udGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#udGrad)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="ud-x-labels">
          <span>Sunday</span>
          <span>Monday</span>
          <span>Therday</span>
          <span>Tabe</span>
          <span>Sat</span>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [search, setSearch] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const avatarRef = useRef(null);
  const notifRef = useRef(null);
  const replyTimerRef = useRef(null);
  const { brand, defaultBrand } = useBrand();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSupportPanel, setActiveSupportPanel] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "m-initial",
      sender: "support",
      text: "Hi! How can we help you today?",
      time: "now",
    },
  ]);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
  });
  const [ticketErrors, setTicketErrors] = useState({});
  const [ticketSuccess, setTicketSuccess] = useState("");
  const query = search.trim().toLowerCase();

  const filteredRecentApps = query
    ? RECENT_APPS.filter((app) =>
        `${app.name} ${app.time}`.toLowerCase().includes(query),
      )
    : RECENT_APPS;

  const filteredTransactions = query
    ? TRANSACTIONS.filter((item) =>
        `${item.id} ${item.time} ${item.amount} ${item.status}`
          .toLowerCase()
          .includes(query),
      )
    : TRANSACTIONS;

  const filteredActivity = query
    ? RIGHT_ACTIVITY.filter((item) =>
        `${item.text} ${item.time} ${item.status || ""}`
          .toLowerCase()
          .includes(query),
      )
    : RIGHT_ACTIVITY;

  // TODO: connect to backend API
  const sendMessage = async (messageText) => {
    return {
      ok: true,
      echoed: messageText,
    };
  };

  // TODO: connect to backend API
  const createTicket = async (payload) => {
    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
    return {
      ok: true,
      ticketId,
      payload,
    };
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message) return;

    const userMessage = {
      id: `m-user-${Date.now()}`,
      sender: "user",
      text: message,
      time: "just now",
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsSupportTyping(true);

    await sendMessage(message);

    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
    }

    const delay = 1000 + Math.floor(Math.random() * 1000);
    replyTimerRef.current = setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-support-${Date.now()}`,
          sender: "support",
          text: "Thanks for your message. Our support team will assist you shortly.",
          time: "just now",
        },
      ]);
      setIsSupportTyping(false);
    }, delay);
  };

  const handleTicketChange = (field, value) => {
    setTicketSuccess("");
    setTicketErrors((prev) => ({ ...prev, [field]: "" }));
    setTicketForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    const nextErrors = {
      subject: ticketForm.subject.trim() ? "" : "Subject is required.",
      category: ticketForm.category.trim() ? "" : "Category is required.",
      priority: ticketForm.priority.trim() ? "" : "Priority is required.",
      description: ticketForm.description.trim()
        ? ""
        : "Description is required.",
    };

    setTicketErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const result = await createTicket(ticketForm);

    setTicketSuccess(
      `Ticket created successfully. Ticket ID: ${result.ticketId}`,
    );
    setTicketForm({
      subject: "",
      category: "",
      priority: "",
      description: "",
    });
  };

  // Close popups when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="ud-page">
      {/* ── COMPANY HEADER ── */}
      <header className="ud-header">
        <div className="ud-header-brand">
          <img
            src={brand.logoUrl || defaultBrand.logoUrl}
            alt={brand.name}
            className="ud-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="ud-header-name">
            {brand.name || defaultBrand.name}
          </span>
        </div>
        <div className="ud-header-actions">
          {/* Notification Bell */}
          <div className="ud-notif-wrap" ref={notifRef}>
            <button
              className="ud-hbtn ud-notif-btn"
              title="Notifications"
              onClick={() => {
                setShowAvatarMenu(false);
                setShowNotifications((v) => !v);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="ud-notif-badge">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="ud-notif-popup">
                <div className="ud-notif-popup-header">
                  <span className="ud-notif-popup-title">Notifications</span>
                  {notifications.some((n) => !n.read) && (
                    <button
                      className="ud-notif-mark-all"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true })),
                        )
                      }
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="ud-notif-empty">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`ud-notif-item${
                        notif.read ? " ud-notif-item--read" : ""
                      }`}
                    >
                      <span className="ud-notif-dot" />
                      <div className="ud-notif-body">
                        <p className="ud-notif-text">{notif.text}</p>
                        <small className="ud-notif-time">{notif.time}</small>
                      </div>
                      {!notif.read && (
                        <button
                          className="ud-notif-dismiss"
                          title="Mark as read"
                          onClick={() =>
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n.id === notif.id ? { ...n, read: true } : n,
                              ),
                            )
                          }
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Avatar with popup */}
          <div className="ud-avatar-wrap" ref={avatarRef}>
            <button
              className="ud-header-avatar"
              onClick={() => setShowAvatarMenu((v) => !v)}
              title="Account"
            >
              {getInitials(user?.name || "User")}
            </button>
            {showAvatarMenu && (
              <div className="ud-avatar-popup">
                <button
                  className="ud-popup-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate("/profile");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
                  </svg>
                  Profile
                </button>
                <button
                  className="ud-popup-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate("/settings");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
                <div className="ud-popup-divider" />
                <button
                  className="ud-popup-item ud-popup-logout"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    logout();
                    navigate("/login");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BLUE NAVBAR ── */}
      <nav className="ud-navbar">
        <div className="ud-navbar-inner">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`ud-nav-link${location.pathname === item.path ? " ud-nav-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── DASHBOARD GREETING BAR ── */}
      <div className="ud-top-bar">
        <div className="ud-greeting">
          <h1>
            Good Morning, {user?.name ? user.name.split(" ")[0] : "there"} 👋
          </h1>
          <p>Here's a quick overview of your account.</p>
        </div>
        <div className="ud-search-wrap">
          <svg
            className="ud-si"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="ud-search-field"
            placeholder="Search apps, subscriptions, tickets, invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── BODY GRID ── */}
      <div className="ud-body">
        {/* ── LEFT COL ── */}
        <div className="ud-left">
          {/* Stats */}
          <div className="ud-stats-strip">
            <button
              className="ud-stat ud-stat-action"
              onClick={() => navigate("/all-apps")}
            >
              <p>All Apps</p>
              <h2>5 Apps</h2>
            </button>
            <button
              className="ud-stat ud-stat-action"
              onClick={() => navigate("/my-apps")}
            >
              <p>Active Subscriptions</p>
              <h2>3 Subscribed</h2>
            </button>
            <div className="ud-stat">
              <p>My Tickets</p>
              <h2>8</h2>
            </div>
          </div>

          {/* Action Cards */}
          <div className="ud-action-strip">
            <div className="ud-action-card">
              <h3>Complete KYC</h3>
              <p>Verify your identity for access</p>
              <button
                className="ud-btn-blue"
                onClick={() => navigate("/profile")}
              >
                Start
              </button>
            </div>
            <div className="ud-action-card">
              <h3>Account Settings</h3>
              <p>Manage your account preferences</p>
              <button
                className="ud-btn-blue"
                onClick={() => navigate("/settings")}
              >
                Go to Settings
              </button>
            </div>
          </div>

          {/* What's New */}
          <div className="ud-card">
            <div className="ud-wn-head">
              <div className="ud-wn-title">
                <h3>What's New</h3>
                <span className="ud-new-badge">New</span>
                <span>🚀</span>
              </div>
              <button className="ud-btn-outline">View All Updates</button>
            </div>
            <ul className="ud-wn-list">
              {WHATS_NEW.map((item, i) => (
                <li key={i}>
                  <span className="ud-wn-ico">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Recently Accessed Apps */}
          <div className="ud-card ud-recent-apps-card">
            <h3 className="ud-card-h">Recently Accessed Apps</h3>
            <div className="ud-apps-grid">
              {filteredRecentApps.length === 0 && (
                <p className="ud-empty-state">No apps match your search.</p>
              )}
              {filteredRecentApps.map((app, i) => (
                <div className="ud-app-entry" key={i}>
                  <AppGridIcon bg={app.iconBg} color={app.iconColor} />
                  <div className="ud-app-meta">
                    <p>{app.name}</p>
                    <small>{app.time}</small>
                  </div>
                  <button
                    className="ud-btn-open"
                    onClick={() => navigate("/all-apps")}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MIDDLE COL ── */}
        <div className="ud-middle">
          {/* Usage Overview */}
          <div className="ud-card ud-usage-card">
            <div className="ud-usage-head">
              <h3 className="ud-card-h" style={{ margin: 0 }}>
                Usage Overview
              </h3>
              <div className="ud-usage-pills">
                <span>Last 7 Days</span>
                <span>Last 7 Days</span>
              </div>
            </div>
            <UsageChart />
            <div className="ud-chart-legend">
              <div>
                <span className="ud-ldot ud-ldot-blue" />
                Currently Active
              </div>
              <div>
                <span className="ud-ldot ud-ldot-teal" />
                18 Sessions, 2 API Calls
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="ud-card">
            <div className="ud-ra-head">
              <h3 className="ud-card-h" style={{ margin: 0 }}>
                Recent Activity
              </h3>
              <span className="ud-muted-xs">Last 7d</span>
            </div>
            <ul className="ud-ra-list">
              {filteredActivity.length === 0 && (
                <li className="ud-empty-state">No recent activity found.</li>
              )}
              {filteredActivity.map((item, i) => (
                <li className="ud-ra-item" key={i}>
                  <span className="ud-act-dot" />
                  <div className="ud-ra-body">
                    <span>{item.text}</span>
                    {item.status && (
                      <span
                        className={`ud-pill ud-pill-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                  <span className="ud-muted-xs" style={{ flexShrink: 0 }}>
                    {item.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT COL ── */}
        <div className="ud-right">
          {/* Transaction History */}
          <div className="ud-card">
            <h3 className="ud-card-h">Transaction History</h3>
            <ul className="ud-txn-list">
              {filteredTransactions.length === 0 && (
                <li className="ud-empty-state">No transactions found.</li>
              )}
              {filteredTransactions.map((txn, i) => (
                <li className="ud-txn-item" key={i}>
                  <InvoiceIcon bg={txn.iconBg} color={txn.iconColor} />
                  <div className="ud-txn-info">
                    <p>{txn.id}</p>
                    <small>{txn.time}</small>
                  </div>
                  <div className="ud-txn-right">
                    <p className={txn.status === "Failed" ? "ud-fail-amt" : ""}>
                      {txn.amount}
                    </p>
                    <span
                      className={`ud-pill ud-pill-${txn.status.toLowerCase()}`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="ud-card">
            <h3 className="ud-card-h">Support</h3>
            <div
              className="ud-support-item"
              onClick={() => navigate("/support/chat")}
            >
              <div className="ud-support-ico">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span>Chat with support</span>
              <span className="ud-chevron">›</span>
            </div>
            <div
              className="ud-support-item"
              onClick={() => navigate("/support/ticket")}
            >
              <div className="ud-support-ico">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Raise a Ticket
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                  Submit a request to our team
                </p>
              </div>
              <span className="ud-chevron">›</span>
            </div>

            {activeSupportPanel === "chat" && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    border: "1px solid #e8f0fe",
                    borderRadius: 10,
                    background: "#f8faff",
                    padding: 10,
                    maxHeight: 180,
                    overflowY: "auto",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        justifySelf: msg.sender === "user" ? "end" : "start",
                        maxWidth: "85%",
                        background:
                          msg.sender === "user" ? "#2563eb" : "#ffffff",
                        color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                        border:
                          msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12,
                        lineHeight: 1.35,
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isSupportTyping && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Support is typing...
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      border: "1px solid #dbeafe",
                      background: "#ffffff",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <button className="ud-btn-blue" onClick={handleSendChat}>
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeSupportPanel === "ticket" && (
              <form
                onSubmit={handleCreateTicket}
                style={{ marginTop: 10, display: "grid", gap: 8 }}
              >
                <input
                  value={ticketForm.subject}
                  onChange={(e) =>
                    handleTicketChange("subject", e.target.value)
                  }
                  placeholder="Subject"
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
                {ticketErrors.subject && (
                  <p
                    style={{
                      margin: "-2px 0 0",
                      color: "#dc2626",
                      fontSize: 11,
                    }}
                  >
                    {ticketErrors.subject}
                  </p>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <select
                    value={ticketForm.category}
                    onChange={(e) =>
                      handleTicketChange("category", e.target.value)
                    }
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      outline: "none",
                      background: "#fff",
                    }}
                  >
                    <option value="">Category</option>
                    <option value="Billing">Billing</option>
                    <option value="Technical">Technical</option>
                    <option value="Account">Account</option>
                  </select>

                  <select
                    value={ticketForm.priority}
                    onChange={(e) =>
                      handleTicketChange("priority", e.target.value)
                    }
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      outline: "none",
                      background: "#fff",
                    }}
                  >
                    <option value="">Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                {(ticketErrors.category || ticketErrors.priority) && (
                  <p
                    style={{
                      margin: "-2px 0 0",
                      color: "#dc2626",
                      fontSize: 11,
                    }}
                  >
                    {ticketErrors.category || ticketErrors.priority}
                  </p>
                )}

                <textarea
                  rows={3}
                  value={ticketForm.description}
                  onChange={(e) =>
                    handleTicketChange("description", e.target.value)
                  }
                  placeholder="Describe your issue"
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                {ticketErrors.description && (
                  <p
                    style={{
                      margin: "-2px 0 0",
                      color: "#dc2626",
                      fontSize: 11,
                    }}
                  >
                    {ticketErrors.description}
                  </p>
                )}

                <button type="submit" className="ud-btn-blue">
                  Submit Ticket
                </button>

                {ticketSuccess && (
                  <p
                    style={{
                      margin: 0,
                      color: "#15803d",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {ticketSuccess}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
