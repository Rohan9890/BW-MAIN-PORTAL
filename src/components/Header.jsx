import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    setShowPopup(!showPopup);
  };

  const handleOptionClick = (option) => {
    setShowPopup(false);
    if (option === "My Profile") {
      navigate("/profile");
    } else if (option === "Settings") {
      navigate("/settings");
    } else if (option === "Billing / Subscription") {
      navigate("/billing");
    } else if (option === "Logout") {
      alert("Logged out");
      // navigate("/login"); // if you add login route later
    }
  };

  return (
    <div className="header-container">
      {/* Top white bar */}
      <div className="topbar">
        <div className="logo">
          <span className="logo-icon">W</span>
          <span className="logo-text">Bold and Wise</span>
        </div>

        <div className="top-icons">
          <span>🔍</span>
          <span>⚙️</span>
          <span>❤️</span>
          <div className="avatar" onClick={handleAvatarClick}>
            JK
            {showPopup && (
              <div className="popup">
                <button onClick={() => handleOptionClick("My Profile")}>
                  My Profile
                </button>
                <button onClick={() => handleOptionClick("Settings")}>
                  Settings
                </button>
                <button
                  onClick={() => handleOptionClick("Billing / Subscription")}
                >
                  Billing / Subscription
                </button>
                <button onClick={() => handleOptionClick("Logout")}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blue navbar */}
      <div className="navbar">
        <span className="active">My Home</span>
        <span>Custom App Space</span>
        <span>Document Management</span>
        <span>Bills Of Materials</span>
        <span>Production Planning</span>
        <span>Lean Manufacturing</span>
        <span>More ▾</span>
      </div>
    </div>
  );
}
