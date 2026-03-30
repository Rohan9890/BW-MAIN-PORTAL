import { useEffect, useState } from "react";
import { profileApi } from "../services";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    photo: null,
  });
  const [kycStatus, setKycStatus] = useState("Pending");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await profileApi.getMyProfile();
        if (!isMounted || !data) return;

        setProfile((prev) => ({
          ...prev,
          ...data,
        }));

        if (data.kycStatus) {
          setKycStatus(data.kycStatus);
        }
      } catch (serviceError) {
        if (!isMounted) return;
        setError(serviceError?.message || "Unable to load profile.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      await profileApi.updateMyProfile(profile);
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (serviceError) {
      alert(serviceError?.message || "Unable to update profile.");
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        setProfile({ ...profile, photo: result });
        profileApi.uploadProfilePhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#b91c1c" }}>
        {error}
      </div>
    );
  }

  const handleRemovePhoto = () => {
    setProfile({ ...profile, photo: null });
  };

  const handleKycAction = (action) => {
    if (action === "upload") {
      alert("Upload documents functionality");
    } else if (action === "resubmit") {
      alert("Re-submit KYC functionality");
    }
  };

  const handleSecurityAction = (action) => {
    if (action === "changePassword") {
      alert("Change password functionality");
    } else if (action === "logoutAll") {
      alert("Logout from all devices functionality");
    } else if (action === "enable2FA") {
      alert("Enable 2FA functionality");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .profile-container { padding: 16px !important; }
          .profile-header { flex-direction: column !important; text-align: center !important; }
          .profile-avatar { margin: 0 auto !important; }
          button { font-size: 12px !important; padding: 8px 10px !important; }
        }
        @media (max-width: 480px) {
          .profile-container { padding: 12px !important; maxWidth: 100% !important; }
          h1 { font-size: 22px !important; }
          .profile-header { padding: 16px 12px !important; }
        }
      `}</style>
      {/* Profile Header */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
        className="profile-header"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: profile.photo ? "transparent" : "#2563eb",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              profile.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
              {profile.fullName}
            </h1>
            <p style={{ margin: "4px 0", color: "#64748b" }}>{profile.email}</p>
            <span
              style={{
                background: "#e0f2fe",
                color: "#1d4ed8",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {profile.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleEdit}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✏️ Edit Profile
        </button>
      </div>

      {/* Personal Information */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>
          Personal Information
        </h2>
        {isEditing && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Profile Photo
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Upload Photo
              </label>
              {profile.photo && (
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
            ) : (
              <p style={{ margin: 0, color: "#0f172a" }}>{profile.fullName}</p>
            )}
          </div>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
            ) : (
              <p style={{ margin: 0, color: "#0f172a" }}>{profile.email}</p>
            )}
          </div>
          <div>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
            >
              Phone (optional)
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
            ) : (
              <p style={{ margin: 0, color: "#0f172a" }}>{profile.phone}</p>
            )}
          </div>
        </div>
        {isEditing && (
          <button
            onClick={handleSave}
            style={{
              marginTop: 20,
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        )}
      </div>

      {/* KYC Status */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>KYC Status</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={{ fontWeight: 600 }}>Status:</span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background:
                kycStatus === "Verified"
                  ? "#dcfce7"
                  : kycStatus === "Pending"
                    ? "#fef3c7"
                    : "#fee2e2",
              color:
                kycStatus === "Verified"
                  ? "#166534"
                  : kycStatus === "Pending"
                    ? "#92400e"
                    : "#dc2626",
            }}
          >
            {kycStatus}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => handleKycAction("upload")}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Upload Documents
          </button>
          <button
            onClick={() => handleKycAction("resubmit")}
            style={{
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Re-submit
          </button>
        </div>
      </div>

      {/* Security */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Security</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => handleSecurityAction("changePassword")}
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
          <button
            onClick={() => handleSecurityAction("logoutAll")}
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
            Logout from All Devices
          </button>
          <button
            onClick={() => handleSecurityAction("enable2FA")}
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
            Enable 2FA (Optional)
          </button>
        </div>
      </div>
    </div>
  );
}
