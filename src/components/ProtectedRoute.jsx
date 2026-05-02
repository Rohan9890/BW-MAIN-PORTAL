import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Loading...
      </div>
    );
  }

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Please login to continue", from: location.pathname }}
      />
    );
  }

  return children;
}

