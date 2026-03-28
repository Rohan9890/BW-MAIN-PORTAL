import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./Layouts/DashboardLayout";
import Home from "./pages/Home";
import AllApps from "./pages/AllApps";
import MyApps from "./pages/MyApps";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Activity from "./pages/Activity";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="all-apps" element={<AllApps />} />
        <Route path="my-apps" element={<MyApps />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  );
}
