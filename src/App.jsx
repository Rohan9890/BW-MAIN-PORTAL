import { Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./Layouts/DashboardLayout";
import Home from "./pages/Home";
import AllApps from "./pages/AllApps";
import MyApps from "./pages/MyApps";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Activity from "./pages/Activity";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import TicketCenter from "./pages/TicketCenter";
import RaiseTicket from "./pages/RaiseTicket";
import TicketDetail from "./pages/TicketDetail";
import Registration from "./pages/Registration";
import PlansPricing from "./pages/PlansPricing";
import MakePayment from "./pages/MakePayment";

// ✅ FIX HERE (lowercase file name)
import AdminKyc from "./pages/adminKyc";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

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

      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/register/organization" element={<Registration />} />

        <Route path="/plans" element={<PlansPricing />} />
        <Route path="/payment" element={<MakePayment />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute>
              <AdminKyc />
            </ProtectedRoute>
          }
        />

          {/* Legacy alias kept for compatibility */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/chat"
          element={
            <ProtectedRoute>
              <TicketCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/ticket"
          element={
            <ProtectedRoute>
              <RaiseTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/ticket/:id"
          element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          }
        />

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/all-apps" element={<AllApps />} />
            <Route path="/my-apps" element={<MyApps />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/activity" element={<Activity />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  );
}
