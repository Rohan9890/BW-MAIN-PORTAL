import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./Layouts/DashboardLayout";
import Home from "./pages/Home";
import AllApps from "./pages/AllApps";
import MyApps from "./pages/MyApps";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Activity from "./pages/Activity";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ChatSupport from "./pages/ChatSupport";
import RaiseTicket from "./pages/RaiseTicket";
import Registration from "./pages/Registration";
import PlansPricing from "./pages/PlansPricing";
import MakePayment from "./pages/MakePayment";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "14px" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/register/organization" element={<Registration />} />
        <Route path="/plans" element={<PlansPricing />} />
        <Route path="/payment" element={<MakePayment />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/support/chat" element={<ChatSupport />} />
        <Route path="/support/ticket" element={<RaiseTicket />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="all-apps" element={<AllApps />} />
          <Route path="my-apps" element={<MyApps />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity" element={<Activity />} />
        </Route>
      </Routes>
    </>
  );
}
