import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useBrand } from "../context/BrandContext";
import "./Login.css";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";
import { showSuccess, showError } from "../services/toast";

export default function Login() {
  const { brand } = useBrand();
  const { loginWithEmail, loginWithPhoneOtp } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState("email"); // email | phone
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    otp: "",
  });

  const roleFromEmail = form.email.trim().toLowerCase().includes("admin")
    ? "admin"
    : "user";

  const validateEmail = (value) => {
    const v = String(value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
  const validatePhone = (value) => {
    const digits = normalizePhone(value);
    return digits.length >= 10 && digits.length <= 15;
  };

  const validateOtp = (value) => {
    const v = String(value || "").trim();
    return /^\d{6}$/.test(v);
  };

  const getLoginErrorMessage = (error) => {
    const rawMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Invalid email or password";
    const normalizedMessage = String(rawMessage).toLowerCase();

    if (
      normalizedMessage.includes("invalid") ||
      normalizedMessage.includes("bad credentials")
    ) {
      return "Wrong password";
    }

    return rawMessage;
  };

  const isEmailValid = validateEmail(form.email);
  const hasPassword = !!form.password.trim();
  const emailLoginDisabled = loading || !isEmailValid || !hasPassword;

  const showSuccessAndNavigate = (role) => {
    setSuccessMessage(
      `Signed in successfully as ${role === "admin" ? "Admin" : "User"}.`,
    );
    // Let users see the feedback briefly before navigation.
    setTimeout(() => {
      navigate(role === "admin" ? "/admin" : "/dashboard");
    }, 750);
  };

  const handleEmailLogin = async () => {
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!validateEmail(form.email)) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }

    if (!form.password.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        password: "Password is required.",
      }));
      return;
    }

    setLoading(true);
    try {
      await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      localStorage.setItem("login_pending_email", form.email.trim());
      showSuccess("OTP sent to your email. Please verify to continue");
      setOtpSent(true);
    } catch (e) {
      const msg = getLoginErrorMessage(e);
      setFormError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!validateOtp(form.otp)) {
      setFieldErrors({ otp: "OTP must be 6 digits." });
      return;
    }

    const storedEmail =
      localStorage.getItem("login_pending_email") || form.email.trim();
    const role = storedEmail.toLowerCase().includes("admin") ? "admin" : "user";

    setLoading(true);
    try {
      const response = await authApi.verifyOtp({
        email: storedEmail,
        otp: form.otp.trim(),
      });
      const token =
        response?.token || response?.accessToken || response?.data?.token || "";
      await loginWithEmail({ email: storedEmail, role });
      if (token) localStorage.setItem("ui-access-token", token);
      localStorage.removeItem("login_pending_email");
      showSuccess("Login successful");
      showSuccessAndNavigate(role);
    } catch (e) {
      const msg = e?.message || "Invalid OTP";
      setFormError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!validatePhone(form.phone)) {
      setFieldErrors({
        phone: "Enter a valid phone number (10-15 digits).",
      });
      return;
    }

    // Simulate sending OTP.
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!validatePhone(form.phone)) {
      setFieldErrors({
        phone: "Enter a valid phone number (10-15 digits).",
      });
      return;
    }

    if (!validateOtp(form.otp)) {
      setFieldErrors({
        otp: "OTP must be 6 digits.",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: connect to backend API
      await loginWithPhoneOtp({
        phone: form.phone,
        otp: form.otp,
        role: roleFromEmail,
      });
      showSuccessAndNavigate(roleFromEmail);
    } catch (e) {
      setFormError(e?.message || "Unable to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-gradient login-page">
      <div className="login-card card-container">
        <div className="login-right">
          <Logo to="/" className="login-brand-logo" />
          <p className="login-tagline">{brand.description}</p>
        </div>
        <div className="login-left">
          <div className="login-welcome">
            <Logo to="/" className="login-mini-logo" compact={true} />
            <h1 className="login-welcome-title">Welcome Back!</h1>
            <div className="login-welcome-sub">Sign in to your account</div>
          </div>

          <div className="method-tabs-row">
            <div
              className="method-tabs"
              role="tablist"
              aria-label="Login methods"
            >
              <button
                type="button"
                className={`method-tab ${method === "email" ? "active" : ""}`}
                onClick={() => {
                  setMethod("email");
                  setOtpSent(false);
                  setFormError("");
                  setSuccessMessage("");
                  setFieldErrors({});
                }}
                role="tab"
                aria-selected={method === "email"}
              >
                Email
              </button>
              <button
                type="button"
                className={`method-tab ${method === "phone" ? "active" : ""}`}
                onClick={() => {
                  setMethod("phone");
                  setOtpSent(false);
                  setFormError("");
                  setSuccessMessage("");
                  setFieldErrors({});
                }}
                role="tab"
                aria-selected={method === "phone"}
              >
                Phone
              </button>
            </div>
          </div>

          {formError && <div className="auth-error">{formError}</div>}
          {successMessage && (
            <div className="auth-success">{successMessage}</div>
          )}

          {method === "email" && !otpSent && (
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailLogin();
              }}
            >
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <div
                className={`input-with-icon ${
                  fieldErrors.email ? "input-invalid" : ""
                }`}
              >
                <span className="input-icon" aria-hidden>
                  @
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              {fieldErrors.email && (
                <div className="field-error">{fieldErrors.email}</div>
              )}

              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <div
                className={`input-with-icon ${
                  fieldErrors.password ? "input-invalid" : ""
                }`}
              >
                <span className="input-icon" aria-hidden>
                  🔒
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="field-error">{fieldErrors.password}</div>
              )}

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  // TODO: connect to backend API for real reset flow
                  alert(
                    "Forgot password flow is not connected to a backend yet.",
                  );
                }}
              >
                Forgot Password?
              </button>

              <button
                type="button"
                className="btn btn-primary login-btn"
                onClick={handleEmailLogin}
                disabled={emailLoginDisabled}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" aria-hidden />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          )}

          {method === "email" && otpSent && (
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyEmailOtp();
              }}
            >
              <p className="auth-footnote" style={{ marginBottom: "12px" }}>
                OTP sent to{" "}
                <strong>
                  {localStorage.getItem("login_pending_email") || form.email}
                </strong>
              </p>

              <label className="field-label" htmlFor="email-otp">
                OTP
              </label>
              <input
                id="email-otp"
                type="text"
                inputMode="numeric"
                className={`input ${fieldErrors.otp ? "input-invalid" : ""}`}
                placeholder="Enter 6-digit OTP"
                value={form.otp}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, otp: e.target.value }))
                }
              />
              {fieldErrors.otp && (
                <div className="field-error">{fieldErrors.otp}</div>
              )}

              <button
                type="button"
                className="btn btn-primary login-btn"
                onClick={handleVerifyEmailOtp}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-ghost login-btn login-ghost-btn"
                onClick={() => {
                  setOtpSent(false);
                  setForm((prev) => ({ ...prev, otp: "" }));
                  setFieldErrors({});
                  setFormError("");
                  localStorage.removeItem("login_pending_email");
                }}
                disabled={loading}
              >
                Change email
              </button>
            </form>
          )}

          {method === "phone" && (
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!otpSent) handleSendOtp();
                else handleVerifyOtp();
              }}
            >
              <label className="field-label" htmlFor="role-email-phone">
                Email (optional for role)
              </label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden>
                  @
                </span>
                <input
                  id="role-email-phone"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <label className="field-label" htmlFor="login-phone">
                Phone number
              </label>
              <div
                className={`input-with-icon ${
                  fieldErrors.phone ? "input-invalid" : ""
                }`}
              >
                <span className="input-icon" aria-hidden>
                  ☎
                </span>
                <input
                  id="login-phone"
                  type="tel"
                  className="input"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              {fieldErrors.phone && (
                <div className="field-error">{fieldErrors.phone}</div>
              )}

              {!otpSent ? (
                <button
                  type="button"
                  className="btn btn-secondary login-btn"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <label className="field-label" htmlFor="login-otp">
                    OTP
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    className={`input ${fieldErrors.otp ? "input-invalid" : ""}`}
                    placeholder="Enter 6-digit OTP"
                    value={form.otp}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, otp: e.target.value }))
                    }
                  />
                  {fieldErrors.otp && (
                    <div className="field-error">{fieldErrors.otp}</div>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary login-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify & login"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-ghost login-btn login-ghost-btn"
                    onClick={() => {
                      setOtpSent(false);
                      setForm((prev) => ({ ...prev, otp: "" }));
                      setFieldErrors({});
                      setFormError("");
                    }}
                    disabled={loading}
                  >
                    Change phone
                  </button>
                </>
              )}

              <div className="auth-footnote">
                Demo tip: any 6-digit OTP works.
              </div>
            </form>
          )}

          <div className="auth-divider">OR continue with</div>
          <div className="social-login-rows">
            <button
              type="button"
              className="social-row"
              onClick={() => setMethod("phone")}
            >
              <span className="social-icon-box" aria-hidden>
                ☎
              </span>
              <span className="social-label">Login with OTP</span>
            </button>
          </div>
          <div className="auth-footnote">
            Email login connected. OTP verification in progress.
          </div>

          <p className="signup-prompt">
            Don't have an account?{" "}
            <Link to="/register" className="btn btn-primary btn-signup">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
