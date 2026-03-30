import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { settingsApi } from "../services";

const CARD_STYLE = {
  background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
  borderRadius: 16,
  padding: 22,
  marginBottom: 16,
  border: "1px solid rgba(37,99,235,0.12)",
  boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
};

const ITEM_BUTTON_STYLE = {
  textAlign: "left",
  background: "#f8fafc",
  color: "#1f2937",
  border: "1px solid #dbe5f3",
  borderRadius: 10,
  padding: "11px 14px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "all 0.2s ease",
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [settings, setSettings] = useState({
    theme,
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
    if (key === "theme") {
      setTheme(value);
    }
    setSettings({ ...settings, [key]: value });
  };

  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme }));
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await settingsApi.getSettings();
        if (!isMounted || !data) return;

        setSettings((prev) => ({
          ...prev,
          ...data,
          theme: data.theme || prev.theme,
        }));
        setHasHydrated(true);
      } catch (serviceError) {
        if (!isMounted) return;
        setError(serviceError?.message || "Unable to load settings.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    settingsApi.updateSettings(settings);
  }, [settings, hasHydrated]);

  if (loading) {
    return (
      <div style={{ padding: 22, textAlign: "center", color: "#64748b" }}>
        Loading settings...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 22, textAlign: "center", color: "#b91c1c" }}>
        {error}
      </div>
    );
  }

  const handleAction = (action) => {
    alert(`${action} functionality`);
  };

  return (
    <div style={{ padding: 22, maxWidth: 860, margin: "0 auto" }}>
      <style>{`
        .settings-shell {
          background: radial-gradient(circle at top right, rgba(37,99,235,0.1), transparent 50%),
                      radial-gradient(circle at bottom left, rgba(14,165,233,0.08), transparent 45%);
          border-radius: 18px;
          padding: 16px;
        }
        .settings-title {
          margin: 0 0 18px;
          font-size: 30px;
          letter-spacing: -0.4px;
          color: #0f172a;
        }
        .section-title {
          margin: 0 0 16px;
          font-size: 18px;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .hover-btn:hover {
          border-color: #93c5fd !important;
          box-shadow: 0 6px 16px rgba(37,99,235,0.12);
          transform: translateY(-1px);
        }
        .field-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 13px;
          color: #334155;
        }
        .field-select {
          width: 100%;
          max-width: 260px;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #0f172a;
          font-size: 13px;
        }
        .field-select:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        html[data-theme='dark'] .settings-shell {
          background: radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 50%),
                      radial-gradient(circle at bottom left, rgba(14,165,233,0.14), transparent 45%);
        }
        html[data-theme='dark'] .settings-title,
        html[data-theme='dark'] .section-title {
          color: #e5e7eb !important;
        }
        html[data-theme='dark'] .field-label {
          color: #cbd5e1 !important;
        }
        html[data-theme='dark'] .field-select {
          background: #0f172a !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }
        html[data-theme='dark'] .hover-btn {
          background: #0f172a !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }
        @media (max-width: 768px) {
          .settings-shell { padding: 12px !important; }
          .settings-title { font-size: 24px !important; }
          .section-title { font-size: 16px !important; }
          .field-select { max-width: 100%; }
        }
      `}</style>

      <div className="settings-shell">
        <h1 className="settings-title">Settings</h1>

        <div style={CARD_STYLE} className="settings-card">
          <h2 className="section-title">General</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="field-label">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSelect("theme", e.target.value)}
                className="field-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="field-label">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSelect("language", e.target.value)}
                className="field-select"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        <div style={CARD_STYLE} className="settings-card">
          <h2 className="section-title">Notifications</h2>
          <div style={{ display: "grid", gap: 14 }}>
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

        <div style={CARD_STYLE} className="settings-card">
          <h2 className="section-title">Security</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <button
              className="hover-btn"
              onClick={() => handleAction("Change Password")}
              style={ITEM_BUTTON_STYLE}
            >
              Change Password
            </button>
            <ToggleOption
              label="Two-Factor Authentication"
              checked={settings.twoFactor}
              onChange={() => handleToggle("twoFactor")}
            />
            <button
              className="hover-btn"
              onClick={() => handleAction("View Login History")}
              style={ITEM_BUTTON_STYLE}
            >
              View Login History
            </button>
          </div>
        </div>

        <div style={CARD_STYLE} className="settings-card">
          <h2 className="section-title">Privacy</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <ToggleOption
              label="Data Sharing"
              checked={settings.dataSharing}
              onChange={() => handleToggle("dataSharing")}
            />
            <button
              className="hover-btn"
              onClick={() => handleAction("Download My Data")}
              style={ITEM_BUTTON_STYLE}
            >
              Download My Data
            </button>
            <button
              className="hover-btn"
              onClick={() => handleAction("Manage Cookies")}
              style={ITEM_BUTTON_STYLE}
            >
              Manage Cookies
            </button>
          </div>
        </div>

        <div style={CARD_STYLE} className="settings-card">
          <h2 className="section-title">Support</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <button
              className="hover-btn"
              onClick={() => handleAction("FAQ")}
              style={ITEM_BUTTON_STYLE}
            >
              FAQ
            </button>
            <button
              className="hover-btn"
              onClick={() => handleAction("Report a Bug")}
              style={ITEM_BUTTON_STYLE}
            >
              Report a Bug
            </button>
          </div>
        </div>

        <div
          className="settings-card"
          style={{
            ...CARD_STYLE,
            border: "1px solid #fecaca",
            background: "linear-gradient(145deg, #fff7f7 0%, #fff2f2 100%)",
            marginBottom: 0,
          }}
        >
          <h2 className="section-title" style={{ color: "#dc2626" }}>
            Danger Zone
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            <button
              onClick={() => handleAction("Deactivate Account")}
              style={{
                textAlign: "left",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "11px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Deactivate Account
            </button>
          </div>
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
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>
        {label}
      </span>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: 48,
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
            transition: "0.25s",
            borderRadius: 24,
          }}
        >
          <span
            style={{
              position: "absolute",
              height: 18,
              width: 18,
              left: checked ? 27 : 3,
              bottom: 3,
              backgroundColor: "#ffffff",
              transition: "0.25s",
              borderRadius: "50%",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </span>
      </label>
    </div>
  );
}
