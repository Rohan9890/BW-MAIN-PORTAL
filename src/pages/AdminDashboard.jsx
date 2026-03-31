import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getInitials, useAuth } from "../context/AuthContext";
import { adminApi } from "../services";
import "./AdminDashboard.css";

const ADMIN_SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: "dashboard", key: "dashboard", path: "/admin" },
  { label: "Users", icon: "users", key: "users", path: "/admin/users" },
  {
    label: "KYC Verification",
    icon: "kyc",
    key: "kyc",
    path: "/admin/kyc",
  },
  { label: "Apps", icon: "apps", key: "apps", path: "/admin/apps" },
  { label: "Billing", icon: "billing", key: "billing", path: "/admin/billing" },
  { label: "Tickets", icon: "tickets", key: "tickets", path: "/admin/tickets" },
  {
    label: "Notifications",
    icon: "notifications",
    key: "notifications",
    path: "/admin/notifications",
  },
  {
    label: "Settings",
    icon: "settings",
    key: "settings",
    path: "/admin/settings",
  },
];

const ADMIN_STATS = [
  {
    label: "Total Users",
    value: "12,450",
    delta: "",
    tone: "cool",
    icon: "users",
    points: "0,18 9,15 18,17 27,13 36,10 45,11 54,8 64,9 74,7 84,6 94,8 100,7",
  },
  {
    label: "Active Users",
    value: "3,220",
    delta: "+ 5.4%",
    tone: "cool",
    icon: "activity",
    points: "0,19 9,16 18,17 27,14 36,12 45,13 54,10 64,8 74,9 84,7 94,8 100,6",
  },
  {
    label: "Total Apps",
    value: "150",
    delta: "",
    tone: "cool",
    icon: "apps",
    points: "0,16 9,14 18,15 27,12 36,9 45,10 54,8 64,6 74,7 84,8 94,9 100,8",
  },
  {
    label: "Revenue",
    value: "$18,750",
    delta: "",
    tone: "mint",
    icon: "billing",
    points: "0,20 9,17 18,15 27,13 36,12 45,10 54,8 64,9 74,7 84,6 94,4 100,3",
  },
  {
    label: "Open Tickets",
    value: "34",
    delta: "",
    tone: "cool",
    icon: "tickets",
    points:
      "0,18 9,16 18,14 27,12 36,11 45,12 54,13 64,14 74,13 84,12 94,11 100,10",
  },
];

const APPS = [
  {
    name: "KYC Manager",
    category: "Compliance",
    owner: "Ops Team",
    health: "Healthy",
  },
  {
    name: "Invoice Hub",
    category: "Billing",
    owner: "Finance Team",
    health: "Warning",
  },
  {
    name: "Org Registry",
    category: "Operations",
    owner: "Admin Team",
    health: "Healthy",
  },
  {
    name: "Support Console",
    category: "Support",
    owner: "Support Team",
    health: "Healthy",
  },
];

const PAYMENTS = [
  {
    user: "John Doe",
    initials: "JD",
    time: "10 mins ago",
    amount: "$120.00",
    status: "Paid",
  },
  {
    user: "Sarah Lee",
    initials: "SL",
    time: "1 hour ago",
    amount: "$85.00",
    status: "Paid",
  },
  {
    user: "Michael Smith",
    initials: "MS",
    time: "3 hours ago",
    amount: "$56.00",
    status: "Failed",
  },
  {
    user: "Emily Clark",
    initials: "EC",
    time: "1 day ago",
    amount: "$99.00",
    status: "Paid",
  },
];

const USERS = [
  {
    id: "001",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Admin",
    joinedOn: "Today",
    status: "Active",
    isActive: true,
  },
  {
    id: "002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Editor",
    joinedOn: "23 Aug 2025",
    status: "Active",
    isActive: true,
  },
  {
    id: "003",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    role: "User",
    joinedOn: "22 Aug 2025",
    status: "Inactive",
    isActive: false,
  },
  {
    id: "004",
    name: "Emily Clark",
    email: "emily.clark@example.com",
    role: "User",
    joinedOn: "21 Aug 2025",
    status: "Active",
    isActive: true,
  },
  {
    id: "005",
    name: "David Wilson",
    email: "david.wilson@example.com",
    role: "User",
    joinedOn: "20 Aug 2025",
    status: "Pending",
    isActive: false,
  },
  {
    id: "006",
    name: "Sarah Lee",
    email: "sarah.lee@example.com",
    role: "Editor",
    joinedOn: "19 Aug 2025",
    status: "Inactive",
    isActive: false,
  },
  {
    id: "007",
    name: "Chris Johnson",
    email: "chris.johnson@example.com",
    role: "User",
    joinedOn: "18 Aug 2025",
    status: "Active",
    isActive: true,
  },
  {
    id: "008",
    name: "Lisa White",
    email: "lisa.white@example.com",
    role: "User",
    joinedOn: "17 Aug 2025",
    status: "Inactive",
    isActive: false,
  },
  {
    id: "009",
    name: "Ava Miller",
    email: "ava.miller@example.com",
    role: "Admin",
    joinedOn: "16 Aug 2025",
    status: "Active",
    isActive: true,
  },
  {
    id: "010",
    name: "Liam Davis",
    email: "liam.davis@example.com",
    role: "User",
    joinedOn: "15 Aug 2025",
    status: "Pending",
    isActive: false,
  },
  {
    id: "011",
    name: "Noah Taylor",
    email: "noah.taylor@example.com",
    role: "Editor",
    joinedOn: "14 Aug 2025",
    status: "Active",
    isActive: true,
  },
  {
    id: "012",
    name: "Mia Anderson",
    email: "mia.anderson@example.com",
    role: "User",
    joinedOn: "13 Aug 2025",
    status: "Inactive",
    isActive: false,
  },
];

const KYC_REQUESTS = USERS.filter((user) => user.role === "User").map(
  (user, index) => ({
    id: `KYC-${2200 + index}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    submittedAt: user.joinedOn,
    documentType: index % 2 === 0 ? "Aadhaar" : "PAN",
    status:
      index % 4 === 0
        ? "Pending"
        : index % 4 === 1
          ? "Approved"
          : index % 4 === 2
            ? "Rejected"
            : "Need Info",
  }),
);

const TICKETS = [
  {
    id: "TK-2201",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    subject: "Login issue after password reset",
    description:
      "User is unable to sign in after resetting password. The reset flow finishes successfully, but login still returns invalid credentials.",
    status: "Open",
    priority: "High",
    date: "2026-03-27",
    conversation: [
      {
        id: "m-1",
        sender: "user",
        text: "I reset my password but still cannot log in.",
        time: "09:15 AM",
      },
      {
        id: "m-2",
        sender: "admin",
        text: "Thanks for reporting. We are checking your account status now.",
        time: "09:22 AM",
      },
    ],
  },
  {
    id: "TK-2194",
    userName: "Sarah Lee",
    userEmail: "sarah.lee@example.com",
    subject: "Invoice shows duplicate charge",
    description:
      "March invoice contains a duplicate transaction entry for the same order reference.",
    status: "Pending",
    priority: "Medium",
    date: "2026-03-25",
    conversation: [
      {
        id: "m-3",
        sender: "user",
        text: "I was charged twice for one payment.",
        time: "11:08 AM",
      },
    ],
  },
  {
    id: "TK-2179",
    userName: "Emily Clark",
    userEmail: "emily.clark@example.com",
    subject: "Need CSV export in profile page",
    description:
      "Requested CSV export option for activity history inside profile section.",
    status: "Resolved",
    priority: "Low",
    date: "2026-03-22",
    conversation: [
      {
        id: "m-4",
        sender: "user",
        text: "Can we export activity history as CSV?",
        time: "03:10 PM",
      },
      {
        id: "m-5",
        sender: "admin",
        text: "Great suggestion. We have added this to roadmap.",
        time: "03:35 PM",
      },
    ],
  },
];

const ACTIVITY_FEED = [
  { time: "10 mins ago", event: "New user registered", meta: "" },
  { time: "2 hrs ago", event: 'App "Task Manager" added', meta: "" },
  { time: "4 hrs ago", event: "Payment of $56.00 failed", meta: "" },
];

const USER_GROWTH = [1200, 3600, 3300, 5600, 4300, 6500, 7800, 9800];
const Y_AXIS_LABELS = ["10k", "5k"];
const X_AXIS_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21V19C16 17.34 14.66 16 13 16H7C5.34 16 4 17.34 4 19V21" />
          <circle cx="10" cy="8" r="3" />
          <path d="M20 21V19.5C20 18.18 19.16 16.99 18 16.57" />
          <path d="M15.5 5.3C16.78 5.63 17.72 6.79 17.72 8.15C17.72 9.51 16.78 10.67 15.5 11" />
        </svg>
      );
    case "apps":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "billing":
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="3" />
          <path d="M2.5 10H21.5" />
          <path d="M7.5 15H10.5" />
        </svg>
      );
    case "tickets":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19V9A2 2 0 0 0 19 13V17H6.5A2.5 2.5 0 0 1 4 14.5Z" />
          <path d="M13 9V9.01" />
          <path d="M13 12V12.01" />
          <path d="M13 15V15.01" />
        </svg>
      );
    case "analytics":
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 3V21H21" />
          <path d="M7 15L11 11L14 14L20 8" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
          <path d="M13.73 21A2 2 0 0 1 10.27 21" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.85V21A2 2 0 1 1 10 21V20.91A1.65 1.65 0 0 0 8.92 19.37A1.65 1.65 0 0 0 7.1 19.7L7.04 19.76A2 2 0 1 1 4.21 16.93L4.27 16.87A1.65 1.65 0 0 0 4.6 15.05A1.65 1.65 0 0 0 3.07 14H3A2 2 0 1 1 3 10H3.09A1.65 1.65 0 0 0 4.63 8.92A1.65 1.65 0 0 0 4.3 7.1L4.24 7.04A2 2 0 1 1 7.07 4.21L7.13 4.27A1.65 1.65 0 0 0 8.95 4.6H9A1.65 1.65 0 0 0 10 3.06V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15.08 4.63A1.65 1.65 0 0 0 16.9 4.3L16.96 4.24A2 2 0 1 1 19.79 7.07L19.73 7.13A1.65 1.65 0 0 0 19.4 8.95V9A1.65 1.65 0 0 0 20.94 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.37 15.08Z" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M3 13H11V3H3Z" />
          <path d="M13 21H21V11H13Z" />
          <path d="M13 3H21V9H13Z" />
          <path d="M3 15H11V21H3Z" />
        </svg>
      );
    case "kyc":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="M8 9H16" />
          <path d="M8 13H13" />
          <path d="M16.5 16.5L18.2 18.2L21 15.4" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20L17 17" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function TicketBadge({ type, value }) {
  const normalized = String(value || "").toLowerCase();
  return <span className={`ticket-badge ${type} ${normalized}`}>{value}</span>;
}

function normalizeTicketItem(ticket, index = 0) {
  const subject = ticket.subject || ticket.title || "Untitled Ticket";
  return {
    id: ticket.id || `TK-${index + 1}`,
    userName: ticket.userName || ticket.user || "Unknown User",
    userEmail: ticket.userEmail || "user@example.com",
    subject,
    description: ticket.description || subject,
    status: ["Open", "Pending", "Resolved"].includes(ticket.status)
      ? ticket.status
      : ticket.status === "New"
        ? "Open"
        : "Pending",
    priority: ["Low", "Medium", "High"].includes(ticket.priority)
      ? ticket.priority
      : "Medium",
    date: ticket.date || new Date().toISOString().slice(0, 10),
    conversation: Array.isArray(ticket.conversation) ? ticket.conversation : [],
  };
}

export default function AdminDashboard() {
  const { brand, setBrand, resetBrand, defaultBrand } = useBrand();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageKey = pathParts[1] || "dashboard";

  const [brandingForm, setBrandingForm] = useState(brand);
  const [searchText, setSearchText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminStats, setAdminStats] = useState(ADMIN_STATS);
  const [apps, setApps] = useState(APPS);
  const [payments, setPayments] = useState(PAYMENTS);
  const [tickets, setTickets] = useState(TICKETS);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketSearchText, setTicketSearchText] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [activityFeed, setActivityFeed] = useState(ACTIVITY_FEED);
  const [userGrowth, setUserGrowth] = useState(USER_GROWTH);
  const [uploadedApps, setUploadedApps] = useState([]);
  const [appsInitialized, setAppsInitialized] = useState(false);
  const [appSearchText, setAppSearchText] = useState("");
  const [appForm, setAppForm] = useState({
    name: "",
    description: "",
    logoUrl: "",
  });
  const [editingAppId, setEditingAppId] = useState(null);
  const [users, setUsers] = useState(USERS);
  const [userSearchText, setUserSearchText] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("All");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userViewFilter, setUserViewFilter] = useState("All");
  const [usersPage, setUsersPage] = useState(1);
  const [kycRequests, setKycRequests] = useState(KYC_REQUESTS);
  const [kycSearchText, setKycSearchText] = useState("");
  const [kycStatusFilter, setKycStatusFilter] = useState("All");
  const [notificationItems, setNotificationItems] = useState(
    ACTIVITY_FEED.map((item, index) => ({
      id: `${item.time}-${index}`,
      title: item.event,
      meta: item.meta,
      time: item.time,
      read: index > 1,
    })),
  );

  const menuRef = useRef(null);
  const searchQuery = searchText.trim().toLowerCase();

  useEffect(() => {
    setBrandingForm(brand);
  }, [brand]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      const [dashboardData, usersData, ticketsData] = await Promise.all([
        adminApi.getDashboardData(),
        adminApi.getUsers(),
        adminApi.getTickets(),
      ]);

      if (!isMounted) return;

      if (dashboardData?.stats) setAdminStats(dashboardData.stats);
      if (dashboardData?.apps) setApps(dashboardData.apps);
      if (dashboardData?.payments) setPayments(dashboardData.payments);
      const ticketsFromDashboard = Array.isArray(dashboardData?.tickets)
        ? dashboardData.tickets
        : [];
      const ticketsFromApi = Array.isArray(ticketsData?.items)
        ? ticketsData.items
        : [];
      const effectiveTickets =
        ticketsFromApi.length > 0 ? ticketsFromApi : ticketsFromDashboard;
      if (effectiveTickets.length) {
        setTickets(
          effectiveTickets.map((ticket, index) =>
            normalizeTicketItem(ticket, index),
          ),
        );
      }
      if (dashboardData?.activityFeed)
        setActivityFeed(dashboardData.activityFeed);
      if (dashboardData?.userGrowth) setUserGrowth(dashboardData.userGrowth);

      const fetchedUsers = Array.isArray(usersData?.items)
        ? usersData.items
        : null;
      if (fetchedUsers && fetchedUsers.length) {
        setUsers(fetchedUsers);
      }

      setTicketsLoading(false);
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setNotificationItems((prev) =>
      activityFeed.map((item, index) => {
        const id = `${item.time}-${index}`;
        const existing = prev.find((entry) => entry.id === id);

        return {
          id,
          title: item.event,
          meta: item.meta,
          time: item.time,
          read: existing ? existing.read : index > 1,
        };
      }),
    );
  }, [activityFeed]);

  const unreadCount = notificationItems.filter((item) => !item.read).length;

  const normalizedApps = useMemo(
    () =>
      (apps || []).map((item, index) => ({
        id: item.id || `${item.name || "app"}-${index}`,
        name: item.name || "Untitled App",
        description:
          item.description ||
          `${item.category || "General"}${item.owner ? ` • ${item.owner}` : ""}`,
        logoUrl: item.logoUrl || "",
        status: item.status || (item.health === "Healthy" ? "Active" : "Draft"),
      })),
    [apps],
  );

  useEffect(() => {
    if (!appsInitialized && normalizedApps.length) {
      setUploadedApps(normalizedApps);
      setAppsInitialized(true);
    }
  }, [appsInitialized, normalizedApps]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((item) =>
      `${item.name} ${item.email} ${item.role} ${item.joinedOn} ${item.status} ${
        item.isActive ? "active" : "inactive"
      }`
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [searchQuery, users]);

  const userManagementRows = useMemo(() => {
    const query = userSearchText.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        `${user.id} ${user.name} ${user.email} ${user.role} ${user.status}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        userStatusFilter === "All" || user.status === userStatusFilter;
      const matchesRole =
        userRoleFilter === "All" || user.role === userRoleFilter;
      const matchesView =
        userViewFilter === "All" || user.status === userViewFilter;
      return matchesSearch && matchesStatus && matchesRole && matchesView;
    });
  }, [users, userSearchText, userStatusFilter, userRoleFilter, userViewFilter]);

  const userPageSize = 8;
  const totalUserPages = Math.max(
    1,
    Math.ceil(userManagementRows.length / userPageSize),
  );

  const paginatedUserRows = useMemo(() => {
    const start = (usersPage - 1) * userPageSize;
    return userManagementRows.slice(start, start + userPageSize);
  }, [userManagementRows, usersPage]);

  const userCountStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.status === "Active").length;
    const inactive = users.filter((user) => user.status === "Inactive").length;
    const pending = users.filter((user) => user.status === "Pending").length;
    return { total, active, inactive, pending };
  }, [users]);

  useEffect(() => {
    setKycRequests((prev) => {
      const statusByUserId = new Map(
        prev.map((request) => [request.userId, request.status]),
      );

      const next = users
        .filter((user) => user.role === "User")
        .map((user, index) => ({
          id: `KYC-${2200 + index}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          submittedAt: user.joinedOn,
          documentType: index % 2 === 0 ? "Aadhaar" : "PAN",
          status: statusByUserId.get(user.id) || "Pending",
        }));

      return next;
    });
  }, [users]);

  const filteredKycRows = useMemo(() => {
    const query = kycSearchText.trim().toLowerCase();

    return kycRequests.filter((request) => {
      const matchesQuery =
        !query ||
        `${request.id} ${request.userName} ${request.userEmail} ${request.documentType}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        kycStatusFilter === "All" || request.status === kycStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [kycRequests, kycSearchText, kycStatusFilter]);

  const kycStats = useMemo(() => {
    const total = kycRequests.length;
    const pending = kycRequests.filter(
      (item) => item.status === "Pending",
    ).length;
    const approved = kycRequests.filter(
      (item) => item.status === "Approved",
    ).length;
    const rejected = kycRequests.filter(
      (item) => item.status === "Rejected",
    ).length;
    const needInfo = kycRequests.filter(
      (item) => item.status === "Need Info",
    ).length;
    return { total, pending, approved, rejected, needInfo };
  }, [kycRequests]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearchText, userStatusFilter, userRoleFilter, userViewFilter]);

  useEffect(() => {
    if (usersPage > totalUserPages) {
      setUsersPage(totalUserPages);
    }
  }, [usersPage, totalUserPages]);

  const filteredApps = useMemo(() => {
    const query = appSearchText.trim().toLowerCase() || searchQuery;
    if (!query) return uploadedApps;
    return uploadedApps.filter((item) =>
      `${item.name} ${item.description} ${item.status}`
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, appSearchText, uploadedApps]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    return payments.filter((item) =>
      `${item.user} ${item.amount} ${item.status}`
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [searchQuery, payments]);

  const dashboardFilteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    return tickets.filter((item) =>
      `${item.subject} ${item.id} ${item.status} ${item.priority}`
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [searchQuery, tickets]);

  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((item) => item.status === "Open").length;
    const pending = tickets.filter((item) => item.status === "Pending").length;
    const resolved = tickets.filter(
      (item) => item.status === "Resolved",
    ).length;
    return { total, open, pending, resolved };
  }, [tickets]);

  const filteredTicketRows = useMemo(() => {
    const query = ticketSearchText.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesQuery =
        !query ||
        `${ticket.userName} ${ticket.subject}`.toLowerCase().includes(query);
      const matchesStatus =
        ticketStatusFilter === "All" || ticket.status === ticketStatusFilter;
      const matchesPriority =
        ticketPriorityFilter === "All" ||
        ticket.priority === ticketPriorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tickets, ticketSearchText, ticketStatusFilter, ticketPriorityFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId],
  );

  const filteredActivity = useMemo(() => {
    if (!searchQuery) return activityFeed;
    return activityFeed.filter((item) =>
      `${item.event} ${item.meta} ${item.time}`
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [searchQuery, activityFeed]);

  const handleMarkAllNotificationsRead = () => {
    setNotificationItems((prev) =>
      prev.map((item) => ({ ...item, read: true })),
    );
  };

  const handleNotificationItemClick = (id) => {
    setNotificationItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setShowNotifications(false);
    navigate("/admin/notifications");
  };

  const handleUserStatusToggle = async (userId) => {
    const target = users.find((item) => item.id === userId);
    if (!target) return;

    const nextStatus = target.status === "Active" ? "Inactive" : "Active";
    await adminApi.updateUserStatus(userId, nextStatus);

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;
        if (user.status === "Active") {
          return { ...user, status: "Inactive", isActive: false };
        }
        return { ...user, status: "Active", isActive: true };
      }),
    );
  };

  const handleUserEdit = (userId) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    window.alert(`Open edit modal for ${user.name} (ID: ${user.id})`);
  };

  const handleUsersExport = () => {
    const exportUsers = async () => {
      const rowsFromApi = await adminApi.exportUsers({
        status: userStatusFilter,
        role: userRoleFilter,
        q: userSearchText,
      });

      const rows =
        Array.isArray(rowsFromApi) && rowsFromApi.length
          ? rowsFromApi
          : userManagementRows.length
            ? userManagementRows
            : users;
      const header = ["ID", "Name", "Email", "Role", "Status"];
      const csvLines = [
        header.join(","),
        ...rows.map((user) =>
          [user.id, user.name, user.email, user.role, user.status]
            .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
            .join(","),
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users-export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    };

    exportUsers();
  };

  const updateKycStatus = (requestId, nextStatus) => {
    // TODO: connect to backend API for KYC verification update.
    setKycRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: nextStatus } : request,
      ),
    );
  };

  const updateTicketStatus = async (ticketId, nextStatus) => {
    await adminApi.updateTicketStatus(ticketId, nextStatus);
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket,
      ),
    );
  };

  const handleViewTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setTicketReplyText("");
  };

  const closeTicketPanel = () => {
    setSelectedTicketId(null);
    setTicketReplyText("");
  };

  const handleSendTicketReply = async () => {
    const message = ticketReplyText.trim();
    if (!selectedTicket || !message) return;

    const newMessage = {
      id: `admin-${Date.now()}`,
      sender: "admin",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    await adminApi.addTicketReply(selectedTicket.id, newMessage);

    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== selectedTicket.id) return ticket;
        return {
          ...ticket,
          conversation: [...ticket.conversation, newMessage],
        };
      }),
    );

    setTicketReplyText("");
  };

  const handleAppFormChange = (key, value) => {
    setAppForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAppLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const logo = typeof reader.result === "string" ? reader.result : "";
      setAppForm((prev) => ({
        ...prev,
        logoUrl: logo,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetAppForm = () => {
    setAppForm({ name: "", description: "", logoUrl: "" });
    setEditingAppId(null);
  };

  const handleAppSubmit = async (event) => {
    event.preventDefault();

    const name = appForm.name.trim();
    const description = appForm.description.trim();

    if (!name || !description) {
      window.alert("Please enter app name and description.");
      return;
    }

    if (editingAppId) {
      await adminApi.updateApp(editingAppId, {
        name,
        description,
        logoUrl: appForm.logoUrl,
        status: "Active",
      });

      setUploadedApps((prev) =>
        prev.map((app) =>
          app.id === editingAppId
            ? { ...app, name, description, logoUrl: appForm.logoUrl }
            : app,
        ),
      );
      resetAppForm();
      return;
    }

    const newApp = {
      id: `APP-${Date.now()}`,
      name,
      description,
      logoUrl: appForm.logoUrl,
      status: "Active",
    };

    await adminApi.createApp(newApp);
    setUploadedApps((prev) => [newApp, ...prev]);
    resetAppForm();
  };

  const handleAppEdit = (app) => {
    setEditingAppId(app.id);
    setAppForm({
      name: app.name,
      description: app.description,
      logoUrl: app.logoUrl || "",
    });
  };

  const handleAppDelete = async (appId) => {
    const confirmed = window.confirm("Delete this app?");
    if (!confirmed) return;

    await adminApi.deleteApp(appId);
    setUploadedApps((prev) => prev.filter((app) => app.id !== appId));

    if (editingAppId === appId) {
      resetAppForm();
    }
  };

  const handleBrandFieldChange = (key, value) => {
    setBrandingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBrandingForm((prev) => ({
        ...prev,
        logoUrl:
          typeof reader.result === "string" ? reader.result : prev.logoUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBrandSave = () => {
    setBrand({
      name: brandingForm.name.trim() || defaultBrand.name,
      description: brandingForm.description.trim() || defaultBrand.description,
      logoUrl: brandingForm.logoUrl || defaultBrand.logoUrl,
    });
  };

  const renderPage = () => {
    if (pageKey === "dashboard" || pageKey === "analytics") {
      const growthData =
        Array.isArray(userGrowth) && userGrowth.length
          ? userGrowth
          : USER_GROWTH;
      const maxGrowth = Math.max(...growthData);
      const points = growthData
        .map((value, index) => {
          const x = 30 + (index * 760) / (growthData.length - 1);
          const y = 220 - (value / maxGrowth) * 165;
          return `${x},${y}`;
        })
        .join(" ");
      return (
        <div className="page-stack">
          <section className="stats-grid">
            {adminStats.map((card) => (
              <article key={card.label} className={`metric-card ${card.tone}`}>
                <p className="metric-label">{card.label}</p>
                <p className="metric-value">{card.value}</p>
                {card.delta ? (
                  <span className="metric-delta">{card.delta}</span>
                ) : null}
                <svg
                  className="mini-chart"
                  viewBox="0 0 100 22"
                  preserveAspectRatio="none"
                >
                  <path
                    d={`M 0 22 L ${card.points} L 100 22 Z`}
                    className="mini-area"
                  />
                  <polyline points={card.points} />
                </svg>
              </article>
            ))}
          </section>

          <section className="content-grid dashboard-grid">
            <article className="panel growth-panel">
              <div className="panel-head">
                <div>
                  <h3>User Growth</h3>
                </div>
              </div>
              <div className="growth-wrap">
                <div className="growth-y-axis">
                  {Y_AXIS_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <svg
                  className="growth-chart"
                  viewBox="0 0 820 240"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
                      <stop offset="100%" stopColor="rgba(59,130,246,0.03)" />
                    </linearGradient>
                  </defs>
                  <line x1="30" y1="220" x2="790" y2="220" className="axis" />
                  <line x1="30" y1="130" x2="790" y2="130" className="grid" />
                  <line x1="30" y1="40" x2="790" y2="40" className="grid" />
                  <path
                    d={`M ${points} L 790 220 L 30 220 Z`}
                    className="area"
                  />
                  <polyline points={points} className="line" />
                  {points.split(" ").map((point) => {
                    const [cx, cy] = point.split(",");
                    return (
                      <circle
                        key={point}
                        cx={cx}
                        cy={cy}
                        r="3.2"
                        className="marker"
                      />
                    );
                  })}
                </svg>
                <div className="growth-x-axis">
                  {X_AXIS_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel payments-panel">
              <div className="panel-head panel-head-inline">
                <h3>Recent Payments</h3>
                <button
                  type="button"
                  className="menu-icon-btn"
                  aria-label="More actions"
                >
                  <Icon name="menu" />
                </button>
              </div>
              <ul className="payment-list">
                {filteredPayments.map((payment) => (
                  <li key={`${payment.user}-${payment.time}`}>
                    <div className="payment-user">
                      <span className="payment-avatar">{payment.initials}</span>
                      <div>
                        <p>{payment.user}</p>
                        <small>{payment.time}</small>
                      </div>
                    </div>
                    <div className="payment-meta">
                      <strong>{payment.amount}</strong>
                      <span
                        className={`status-tag ${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </li>
                ))}
                {!filteredPayments.length && (
                  <li className="empty-state">
                    No payments found for this search.
                  </li>
                )}
              </ul>
            </article>

            <article className="panel activity-panel">
              <div className="panel-head">
                <h3>Activity Feed</h3>
              </div>
              <ul className="timeline">
                {filteredActivity.map((entry, index) => (
                  <li key={`${entry.time}-${entry.event}`}>
                    <span
                      className={`timeline-dot ${index === 0 ? "highlight" : ""}`}
                    />
                    <div>
                      <p>{entry.event}</p>
                      {entry.meta ? <small>{entry.meta}</small> : null}
                    </div>
                    <time>{entry.time}</time>
                  </li>
                ))}
                {!filteredActivity.length && (
                  <li className="empty-state">
                    No activity found for this search.
                  </li>
                )}
              </ul>
            </article>

            <article className="panel signups-panel">
              <div className="panel-head">
                <h3>Recent Signups</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.joinedOn}</td>
                      </tr>
                    ))}
                    {!filteredUsers.length && (
                      <tr>
                        <td colSpan={3} className="empty-table-row">
                          No signups found for this search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel tickets-panel compact-panel">
              <div className="panel-head">
                <h3>Active Tickets</h3>
              </div>
              <ul className="ticket-list simple-ticket-list">
                {dashboardFilteredTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <div className="ticket-title-row">
                      <span
                        className={`ticket-dot ${ticket.priority.toLowerCase()}`}
                      />
                      <p>{ticket.subject}</p>
                    </div>
                    <div className="ticket-tags">
                      <span
                        className={`priority-tag ${ticket.priority.toLowerCase()}`}
                      >
                        {ticket.priority}
                      </span>
                      <span
                        className={`status-badge ${ticket.status.toLowerCase()}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </li>
                ))}
                {!dashboardFilteredTickets.length && (
                  <li className="empty-state">
                    No tickets found for this search.
                  </li>
                )}
              </ul>
            </article>

            <article className="panel quick-actions-panel compact-panel">
              <div className="panel-head">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-column">
                <button type="button" className="primary-btn quick-action-btn">
                  Raise Ticket
                </button>
                <button type="button" className="primary-btn quick-action-btn">
                  Contact Support
                </button>
              </div>
            </article>
          </section>
        </div>
      );
    }

    if (pageKey === "users") {
      return (
        <section className="content-grid one-column">
          <article className="panel users-management-shell">
            <div className="users-metrics-grid">
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-total">
                    <Icon name="users" />
                  </span>
                  <p>Total Users</p>
                </div>
                <strong>{userCountStats.total}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-active" />
                  <p>Active Users</p>
                </div>
                <strong>{userCountStats.active}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-inactive" />
                  <p>Inactive Users</p>
                </div>
                <strong>{userCountStats.inactive}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-pending" />
                  <p>Pending Users</p>
                </div>
                <strong>{userCountStats.pending}</strong>
              </article>
            </div>

            <div className="users-controls-row">
              <input
                type="text"
                className="users-control-input users-control-search"
                placeholder="Search..."
                value={userSearchText}
                onChange={(event) => setUserSearchText(event.target.value)}
              />

              <div className="users-controls-right">
                <select
                  className="users-control-input"
                  value={userStatusFilter}
                  onChange={(event) => setUserStatusFilter(event.target.value)}
                >
                  <option value="All">Status: All</option>
                  <option value="Active">Status: Active</option>
                  <option value="Inactive">Status: Inactive</option>
                  <option value="Pending">Status: Pending</option>
                </select>
                <select
                  className="users-control-input"
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value)}
                >
                  <option value="All">Role: All</option>
                  <option value="Admin">Role: Admin</option>
                  <option value="Editor">Role: Editor</option>
                  <option value="User">Role: User</option>
                </select>
                <select
                  className="users-control-input users-control-view"
                  value={userViewFilter}
                  onChange={(event) => setUserViewFilter(event.target.value)}
                  aria-label="View filter"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
                <button
                  type="button"
                  className="users-export-btn"
                  onClick={handleUsersExport}
                >
                  Export
                </button>
              </div>
            </div>

            <div className="table-wrap users-table-wrap">
              <table className="users-management-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUserRows.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <span
                          className={`status-badge users-status-pill ${user.status.toLowerCase()}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="users-actions-cell">
                        <button
                          type="button"
                          className={`users-row-action users-row-toggle ${user.status === "Active" ? "deactivate" : "activate"}`}
                          onClick={() => handleUserStatusToggle(user.id)}
                        >
                          {user.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="users-row-action users-row-edit"
                          onClick={() => handleUserEdit(user.id)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!paginatedUserRows.length && (
                    <tr>
                      <td colSpan={6} className="empty-table-row">
                        No users found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="users-pagination-row">
              <button
                type="button"
                className="users-page-btn"
                onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                disabled={usersPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalUserPages }, (_, index) => index + 1)
                .slice(0, 5)
                .map((pageNo) => (
                  <button
                    key={pageNo}
                    type="button"
                    className={`users-page-btn users-page-number ${pageNo === usersPage ? "active" : ""}`}
                    onClick={() => setUsersPage(pageNo)}
                  >
                    {pageNo}
                  </button>
                ))}
              <button
                type="button"
                className="users-page-btn"
                onClick={() =>
                  setUsersPage((prev) => Math.min(totalUserPages, prev + 1))
                }
                disabled={usersPage === totalUserPages}
              >
                Next
              </button>
            </div>
          </article>
        </section>
      );
    }

    if (pageKey === "kyc") {
      return (
        <section className="content-grid one-column">
          <article className="panel users-management-shell">
            <div className="users-metrics-grid">
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-total">
                    <Icon name="kyc" />
                  </span>
                  <p>Total Requests</p>
                </div>
                <strong>{kycStats.total}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-pending" />
                  <p>Pending</p>
                </div>
                <strong>{kycStats.pending}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-active" />
                  <p>Approved</p>
                </div>
                <strong>{kycStats.approved}</strong>
              </article>
              <article className="users-metric-card">
                <div className="users-metric-head">
                  <span className="users-metric-icon users-metric-inactive" />
                  <p>Rejected</p>
                </div>
                <strong>{kycStats.rejected}</strong>
              </article>
            </div>

            <div className="users-controls-row">
              <input
                type="text"
                className="users-control-input users-control-search"
                placeholder="Search by user, email or request ID"
                value={kycSearchText}
                onChange={(event) => setKycSearchText(event.target.value)}
              />
              <div className="users-controls-right">
                <select
                  className="users-control-input"
                  value={kycStatusFilter}
                  onChange={(event) => setKycStatusFilter(event.target.value)}
                >
                  <option value="All">Status: All</option>
                  <option value="Pending">Status: Pending</option>
                  <option value="Approved">Status: Approved</option>
                  <option value="Rejected">Status: Rejected</option>
                  <option value="Need Info">Status: Need Info</option>
                </select>
                <span className="kyc-help-text">
                  Need Info: Ask user to upload clear documents.
                </span>
              </div>
            </div>

            <div className="table-wrap users-table-wrap">
              <table className="users-management-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>User</th>
                    <th>Document</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKycRows.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>
                        <div>
                          <strong>{request.userName}</strong>
                          <p className="kyc-user-email">{request.userEmail}</p>
                        </div>
                      </td>
                      <td>{request.documentType}</td>
                      <td>{request.submittedAt}</td>
                      <td>
                        <span
                          className={`status-badge kyc-status-pill ${request.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="users-actions-cell kyc-actions-cell">
                        <button
                          type="button"
                          className="users-row-action users-row-edit"
                          onClick={() =>
                            updateKycStatus(request.id, "Approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="users-row-action users-row-toggle deactivate"
                          onClick={() =>
                            updateKycStatus(request.id, "Rejected")
                          }
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="users-row-action kyc-row-action-info"
                          onClick={() =>
                            updateKycStatus(request.id, "Need Info")
                          }
                        >
                          Need Info
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredKycRows.length && (
                    <tr>
                      <td colSpan={6} className="empty-table-row">
                        No KYC requests found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      );
    }

    if (pageKey === "apps") {
      return (
        <section className="content-grid one-column">
          <article className="panel apps-manager-shell">
            <div className="panel-head apps-manager-head">
              <h3>App Management</h3>
              <p>Add new apps and manage uploaded apps from one place.</p>
            </div>

            <div className="apps-manager-grid">
              <form className="apps-form-panel" onSubmit={handleAppSubmit}>
                <h4>{editingAppId ? "Edit App" : "Add New App"}</h4>

                <label htmlFor="app-name">App Name</label>
                <input
                  id="app-name"
                  type="text"
                  value={appForm.name}
                  onChange={(event) =>
                    handleAppFormChange("name", event.target.value)
                  }
                  placeholder="Enter app name"
                />

                <label htmlFor="app-description">Description</label>
                <textarea
                  id="app-description"
                  value={appForm.description}
                  onChange={(event) =>
                    handleAppFormChange("description", event.target.value)
                  }
                  placeholder="Enter app description"
                />

                <label htmlFor="app-logo-upload">Logo Upload</label>
                <div className="apps-logo-row">
                  <label
                    htmlFor="app-logo-upload"
                    className="secondary-btn upload-btn"
                  >
                    Upload Logo
                  </label>
                  <input
                    id="app-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAppLogoUpload}
                  />
                  <div className="apps-logo-preview">
                    {appForm.logoUrl ? (
                      <img src={appForm.logoUrl} alt="App logo preview" />
                    ) : (
                      <span>Logo Preview</span>
                    )}
                  </div>
                </div>

                <div className="apps-form-actions">
                  <button type="submit" className="primary-btn">
                    {editingAppId ? "Update App" : "Add App"}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={resetAppForm}
                  >
                    Clear
                  </button>
                </div>
              </form>

              <div className="apps-list-panel">
                <div className="apps-list-toolbar">
                  <h4>Uploaded Apps</h4>
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={appSearchText}
                    onChange={(event) => setAppSearchText(event.target.value)}
                  />
                </div>

                <div className="table-wrap apps-table-wrap">
                  <table className="apps-management-table">
                    <thead>
                      <tr>
                        <th>Logo</th>
                        <th>App Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <div className="apps-logo-cell">
                              {app.logoUrl ? (
                                <img src={app.logoUrl} alt={app.name} />
                              ) : (
                                <span>
                                  {app.name.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{app.name}</td>
                          <td>{app.description}</td>
                          <td>
                            <span
                              className={`status-badge ${app.status === "Active" ? "active-user" : "pending"}`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="apps-actions-cell">
                            <button
                              type="button"
                              className="users-row-action users-row-edit"
                              onClick={() => handleAppEdit(app)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="users-row-action users-row-toggle deactivate"
                              onClick={() => handleAppDelete(app.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredApps.length && (
                        <tr>
                          <td colSpan={5} className="empty-table-row">
                            No apps found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </article>
        </section>
      );
    }

    if (pageKey === "billing") {
      return (
        <section className="content-grid one-column">
          <article className="panel payments-panel">
            <div className="panel-head">
              <h3>Billing and Payments</h3>
            </div>
            <ul className="payment-list">
              {filteredPayments.map((payment) => (
                <li key={`${payment.user}-${payment.time}`}>
                  <div className="payment-user">
                    <span className="payment-avatar">
                      {payment.user.slice(0, 1)}
                    </span>
                    <div>
                      <p>{payment.user}</p>
                      <small>{payment.time}</small>
                    </div>
                  </div>
                  <div className="payment-meta">
                    <strong>{payment.amount}</strong>
                    <span
                      className={`status-tag ${payment.status.toLowerCase()}`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </li>
              ))}
              {!filteredPayments.length && (
                <li className="empty-state">
                  No payments found for this search.
                </li>
              )}
            </ul>
          </article>
        </section>
      );
    }

    if (pageKey === "tickets") {
      return (
        <section className="content-grid one-column">
          <article className="panel tickets-admin-shell">
            <div className="panel-head tickets-admin-head">
              <div>
                <h3>Support Tickets</h3>
                <p>
                  Track issues, respond quickly, and manage ticket lifecycle.
                </p>
              </div>
            </div>

            <div className="tickets-stats-grid">
              <article className="tickets-stat-card total">
                <p>Total Tickets</p>
                <strong>{ticketStats.total}</strong>
              </article>
              <article className="tickets-stat-card open">
                <p>Open</p>
                <strong>{ticketStats.open}</strong>
              </article>
              <article className="tickets-stat-card pending">
                <p>Pending</p>
                <strong>{ticketStats.pending}</strong>
              </article>
              <article className="tickets-stat-card resolved">
                <p>Resolved</p>
                <strong>{ticketStats.resolved}</strong>
              </article>
            </div>

            <div className="tickets-toolbar">
              <input
                type="text"
                className="tickets-toolbar-input search"
                value={ticketSearchText}
                onChange={(event) => setTicketSearchText(event.target.value)}
                placeholder="Search by user or subject"
              />
              <select
                className="tickets-toolbar-input"
                value={ticketStatusFilter}
                onChange={(event) => setTicketStatusFilter(event.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="Open">Status: Open</option>
                <option value="Pending">Status: Pending</option>
                <option value="Resolved">Status: Resolved</option>
              </select>
              <select
                className="tickets-toolbar-input"
                value={ticketPriorityFilter}
                onChange={(event) =>
                  setTicketPriorityFilter(event.target.value)
                }
              >
                <option value="All">Priority: All</option>
                <option value="Low">Priority: Low</option>
                <option value="Medium">Priority: Medium</option>
                <option value="High">Priority: High</option>
              </select>
            </div>

            <div className="table-wrap tickets-table-wrap">
              {ticketsLoading ? (
                <div className="tickets-loading-state">Loading tickets...</div>
              ) : (
                <table className="tickets-management-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>User Name</th>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTicketRows.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td>
                        <td>{ticket.userName}</td>
                        <td>{ticket.subject}</td>
                        <td>
                          <TicketBadge
                            type="priority"
                            value={ticket.priority}
                          />
                        </td>
                        <td>
                          <select
                            className="tickets-status-select"
                            value={ticket.status}
                            onChange={(event) =>
                              updateTicketStatus(ticket.id, event.target.value)
                            }
                          >
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                        <td>{ticket.date}</td>
                        <td>
                          <button
                            type="button"
                            className="tickets-view-btn"
                            onClick={() => handleViewTicket(ticket.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredTicketRows.length && (
                      <tr>
                        <td colSpan={7} className="empty-table-row">
                          No tickets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {selectedTicket ? (
              <div
                className="ticket-detail-overlay"
                role="dialog"
                aria-modal="true"
              >
                <div className="ticket-detail-panel">
                  <div className="ticket-detail-head">
                    <div>
                      <h4>{selectedTicket.subject}</h4>
                      <p>
                        {selectedTicket.id} • {selectedTicket.userName}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ticket-detail-close"
                      onClick={closeTicketPanel}
                    >
                      Close
                    </button>
                  </div>

                  <div className="ticket-detail-meta">
                    <TicketBadge type="status" value={selectedTicket.status} />
                    <TicketBadge
                      type="priority"
                      value={selectedTicket.priority}
                    />
                  </div>

                  <section className="ticket-detail-block">
                    <h5>Description</h5>
                    <p>{selectedTicket.description}</p>
                  </section>

                  <section className="ticket-detail-block">
                    <h5>User Info</h5>
                    <p>{selectedTicket.userName}</p>
                    <small>{selectedTicket.userEmail}</small>
                  </section>

                  <section className="ticket-detail-block">
                    <h5>Conversation</h5>
                    <div className="ticket-chat-list">
                      {selectedTicket.conversation.map((message) => (
                        <div
                          key={message.id}
                          className={`ticket-chat-item ${message.sender}`}
                        >
                          <p>{message.text}</p>
                          <small>{message.time}</small>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="ticket-reply-box">
                    <textarea
                      value={ticketReplyText}
                      onChange={(event) =>
                        setTicketReplyText(event.target.value)
                      }
                      placeholder="Type your reply..."
                    />
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={handleSendTicketReply}
                    >
                      Send Reply
                    </button>
                  </div>

                  <div className="ticket-detail-actions">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        updateTicketStatus(selectedTicket.id, "Resolved")
                      }
                    >
                      Mark as Resolved
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        updateTicketStatus(selectedTicket.id, "Open")
                      }
                    >
                      Reopen Ticket
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      );
    }

    if (pageKey === "notifications") {
      return (
        <section className="content-grid one-column">
          <article className="panel activity-panel">
            <div className="panel-head">
              <h3>Notifications and Activity</h3>
            </div>
            <ul className="timeline">
              {filteredActivity.map((entry) => (
                <li key={`${entry.time}-${entry.event}`}>
                  <span className="timeline-dot" />
                  <div>
                    <p>{entry.event}</p>
                    <small>{entry.meta}</small>
                  </div>
                  <time>{entry.time}</time>
                </li>
              ))}
              {!filteredActivity.length && (
                <li className="empty-state">
                  No activity found for this search.
                </li>
              )}
            </ul>
          </article>
        </section>
      );
    }

    return (
      <section className="content-grid one-column">
        <article className="panel support-panel">
          <div className="panel-head">
            <h3>Settings</h3>
          </div>
          <p className="panel-note">
            Update branding and admin preferences for your workspace.
          </p>

          <div className="branding-editor">
            <h4>Branding</h4>
            <div className="brand-preview">
              <img
                src={brandingForm.logoUrl || defaultBrand.logoUrl}
                alt={brandingForm.name || defaultBrand.name}
                onError={(e) => {
                  e.currentTarget.src = defaultBrand.logoUrl;
                }}
              />
              <div>
                <p>{brandingForm.name || defaultBrand.name}</p>
                <small>
                  {brandingForm.description || defaultBrand.description}
                </small>
              </div>
            </div>

            <label htmlFor="brand-name">App Name</label>
            <input
              id="brand-name"
              type="text"
              value={brandingForm.name}
              onChange={(e) => handleBrandFieldChange("name", e.target.value)}
              placeholder="Bold and Wise"
            />

            <label htmlFor="brand-desc">App Description</label>
            <textarea
              id="brand-desc"
              value={brandingForm.description}
              onChange={(e) =>
                handleBrandFieldChange("description", e.target.value)
              }
              placeholder="Short app description"
            />

            <div className="branding-actions">
              <label
                htmlFor="brand-logo-upload"
                className="secondary-btn upload-btn"
              >
                Upload Logo
              </label>
              <input
                id="brand-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                className="primary-btn"
                onClick={handleBrandSave}
              >
                Save
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  resetBrand();
                  setSearchText("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  };

  const activeItem =
    ADMIN_SIDEBAR_ITEMS.find((item) => item.key === pageKey) ||
    ADMIN_SIDEBAR_ITEMS[0];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <div className="brand-logo-wrap">
            <img
              src={brandingForm.logoUrl || defaultBrand.logoUrl}
              alt={brandingForm.name || defaultBrand.name}
              onError={(e) => {
                e.currentTarget.src = defaultBrand.logoUrl;
              }}
            />
          </div>
          <div>
            <p className="brand-kicker">Bold and Wise</p>
            <h1>{brandingForm.name || defaultBrand.name}</h1>
          </div>
        </div>

        <nav className="admin-nav">
          {ADMIN_SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`admin-nav-item ${activeItem.key === item.key ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="admin-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="welcome-subtitle">Bold and Wise Control Center</p>
            <h2>{activeItem.label}</h2>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <span className="search-icon">
                <Icon name="search" />
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search in current page..."
              />
            </div>

            <div className="menu-group" ref={menuRef}>
              <div className="menu-anchor">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Notifications"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowNotifications((prev) => !prev);
                  }}
                >
                  <Icon name="notifications" />
                  {unreadCount > 0 && <span className="notif-dot" />}
                </button>

                {showNotifications && (
                  <div className="dropdown-panel notif-dropdown">
                    <div className="dropdown-header">
                      <strong>Notifications</strong>
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    </div>
                    <ul>
                      {notificationItems.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationItemClick(item.id)}
                          >
                            <span
                              className={`notif-indicator ${item.read ? "read" : "unread"}`}
                            />
                            <span>
                              <p>{item.title}</p>
                              <small>{item.meta}</small>
                            </span>
                            <time>{item.time}</time>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="menu-anchor">
                <button
                  type="button"
                  className="admin-avatar"
                  aria-label="Admin profile"
                  onClick={() => {
                    setShowNotifications(false);
                    setShowProfileMenu((prev) => !prev);
                  }}
                >
                  {getInitials(user?.name || "Admin")}
                </button>

                {showProfileMenu && (
                  <div className="dropdown-panel profile-dropdown">
                    <button type="button" onClick={() => navigate("/profile")}>
                      My Profile
                    </button>
                    <button type="button" onClick={() => navigate("/settings")}>
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}
