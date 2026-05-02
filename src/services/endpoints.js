export const endpoints = {
  auth: {
    login: "/login",
    verifyOtp: "/verify-otp",
    register: "/register",
    registerIndividual: "/auth/register/individual",
    registerOrganization: "/auth/register/organization",
  },
  dashboard: {
    home: "/dashboard/home",
    activity: "/dashboard/activity",
  },
  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    userStatus: (id) => `/admin/users/${id}/status`,
    apps: "/admin/apps",
    appById: (id) => `/admin/apps/${id}`,
    payments: "/admin/payments",
    kyc: "/admin/kyc",
    kycStatus: (id) => `/admin/kyc/${id}/status`,
    tickets: "/admin/tickets",
    ticketStatus: (id) => `/admin/tickets/${id}/status`,
    ticketReply: (id) => `/admin/tickets/${id}/reply`,
    activity: "/admin/activity",
  },
  apps: {
    all: "/apps",
    myApps: "/apps/my",
    favorites: "/apps/favorites",
    toggleSubscription: (id) => `/apps/${id}/subscription`,
    toggleFavorite: (id) => `/apps/${id}/favorite`,
  },
  users: {
    list: "/users",
    byId: (id) => `/users/${id}`,
  },
  tickets: {
    all: "/tickets",
    byId: (id) => `/tickets/${id}`,
    create: "/tickets",
    /** PUT body e.g. { status } */
    update: (id) => `/tickets/${id}`,
    updateStatus: (id) => `/tickets/${id}`,
    reply: (id) => `/tickets/${id}/reply`,
  },
  profile: {
    me: "/profile/me",
    update: "/profile/me",
    uploadPhoto: "/profile/me/photo",
  },
  settings: {
    me: "/settings/me",
  },
  plans: {
    all: "/plans",
  },
  payment: {
    create: "/payments/create",
  },
};
