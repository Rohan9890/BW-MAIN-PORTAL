import { useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactor: false,
    dataSharing: true,
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSelect = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleAction = (action) => {
    alert(`${action} functionality`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .settings-container { padding: 16px !important; }
          h1 { font-size: 24px !important; }
          h2 { font-size: 18px !important; }
          button, input, select { font-size: 13px !important; padding: 8px 10px !important; }
        }
        @media (max-width: 480px) {
          .settings-container { padding: 12px !important; }
          h1 { font-size: 20px !important; }
          h2 { font-size: 16px !important; }
        }
      `}</style>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Settings</h1>

      {/* General */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>General</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleSelect("theme", e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                outline: "none",
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSelect("language", e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                outline: "none",
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Notifications</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <ToggleOption
            label="Email Notifications"
            checked={settings.emailNotifications}
            onChange={() => handleToggle("emailNotifications")}
          />
          <ToggleOption
            label="Push Notifications"
            checked={settings.pushNotifications}
            onChange={() => handleToggle("pushNotifications")}
          />
          <ToggleOption
            label="Marketing Emails"
            checked={settings.marketingEmails}
            onChange={() => handleToggle("marketingEmails")}
          />
        </div>
      </div>

      {/* Security */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Security</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => handleAction("Change Password")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Change Password
          </button>
          <ToggleOption
            label="Two-Factor Authentication"
            checked={settings.twoFactor}
            onChange={() => handleToggle("twoFactor")}
          />
          <button
            onClick={() => handleAction("View Login History")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            View Login History
          </button>
        </div>
      </div>

      {/* Billing */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Billing</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => handleAction("Manage Subscription")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Manage Subscription
          </button>
          <button
            onClick={() => handleAction("View Billing History")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            View Billing History
          </button>
          <button
            onClick={() => handleAction("Update Payment Method")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Update Payment Method
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Privacy</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <ToggleOption
            label="Data Sharing"
            checked={settings.dataSharing}
            onChange={() => handleToggle("dataSharing")}
          />
          <button
            onClick={() => handleAction("Download My Data")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Download My Data
          </button>
          <button
            onClick={() => handleAction("Manage Cookies")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Manage Cookies
          </button>
        </div>
      </div>

      {/* Support */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Support</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => handleAction("Contact Support")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Contact Support
          </button>
          <button
            onClick={() => handleAction("FAQ")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            FAQ
          </button>
          <button
            onClick={() => handleAction("Report a Bug")}
            style={{
              textAlign: "left",
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Report a Bug
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
          border: "1px solid #fee2e2",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#dc2626" }}>
          Danger Zone
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => handleAction("Deactivate Account")}
            style={{
              textAlign: "left",
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Deactivate Account
          </button>
          <button
            onClick={() => handleAction("Delete Account")}
            style={{
              textAlign: "left",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: 50,
          height: 24,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: "absolute",
            cursor: "pointer",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: checked ? "#2563eb" : "#cbd5e1",
            transition: "0.4s",
            borderRadius: 24,
          }}
        >
          <span
            style={{
              position: "absolute",
              height: 18,
              width: 18,
              left: checked ? 28 : 3,
              bottom: 3,
              backgroundColor: "white",
              transition: "0.4s",
              borderRadius: "50%",
            }}
          />
        </span>
      </label>
    </div>
  );
}
