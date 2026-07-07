import { useCallback, useEffect, useRef, useState } from "react";
import { adminDashboardApi } from "../services/adminDashboardApi";
import { getApiErrorMessage } from "../services/backendClient";
import { showError, showSuccess } from "../services/toast";
import { EMAIL_OTP_COOLDOWN_SECONDS } from "../utils/adminUserDto";
import "../pages/AdminInviteAccept.css";

function validateOtp(value) {
  return /^\d{4,8}$/.test(String(value || "").trim());
}

function maskEmail(email) {
  const e = String(email || "").trim();
  if (!e.includes("@")) return e || "the new address";
  const [local, domain] = e.split("@");
  const masked =
    local.length <= 2 ? `${local[0] || ""}*` : `${local.slice(0, 2)}***`;
  return `${masked}@${domain}`;
}

/**
 * Admin email-change OTP verification — OTP is sent to the NEW email address.
 */
export default function AdminEmailChangeOtpModal({
  open,
  onClose,
  userId = "",
  pendingEmail = "",
  displayName = "User",
  onVerified,
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [cooldown, setCooldown] = useState(EMAIL_OTP_COOLDOWN_SECONDS);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (seconds = EMAIL_OTP_COOLDOWN_SECONDS) => {
      clearTimer();
      setCooldown(seconds);
      intervalRef.current = window.setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!open) {
      setOtp("");
      setFieldError("");
      setLoading(false);
      clearTimer();
      return;
    }
    startCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
    return clearTimer;
  }, [open, clearTimer, startCooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    const uid = String(userId || "").trim();
    if (!uid) {
      showError("User identifier missing.");
      return;
    }
    setLoading(true);
    setFieldError("");
    try {
      await adminDashboardApi.resendEmailChangeOtp(uid);
      showSuccess(`OTP resent to ${maskEmail(pendingEmail)}`);
      startCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Could not resend OTP.");
      if (err?.status === 429) {
        setFieldError("Please wait before requesting another OTP.");
        startCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpVal = String(otp || "").trim();
    if (!validateOtp(otpVal)) {
      setFieldError("Enter the OTP code sent to the new email.");
      return;
    }
    const uid = String(userId || "").trim();
    if (!uid) {
      showError("User identifier missing.");
      return;
    }
    setLoading(true);
    setFieldError("");
    try {
      await adminDashboardApi.verifyEmailChangeOtp(uid, otpVal);
      showSuccess("Email verification successful");
      onVerified?.();
      onClose?.();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Invalid or expired OTP.");
      if (err?.status === 400 || err?.status === 401) {
        setFieldError(msg);
      } else if (err?.status === 429) {
        setFieldError("Too many attempts. Request a new OTP.");
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="kyc-mod-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
    >
      <div
        className="kyc-mod-modal admin-invite-modal admin-email-otp-modal"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="kyc-mod-modal-title">Verify new email</h3>
        <p className="admin-invite-modal-sub">
          Enter the OTP sent to{" "}
          <strong>{maskEmail(pendingEmail)}</strong> to confirm the email change
          for {displayName}. The current email stays active until verification
          succeeds.
        </p>
        <p className="kyc-mod-muted admin-email-otp-expiry-hint">
          OTP expires after a few minutes. If it expires, use Resend OTP.
        </p>
        <div className="admin-invite-form">
          <label className="admin-invite-label" htmlFor="admin-email-otp-input">
            OTP code
            <input
              id="admin-email-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="admin-invite-input"
              value={otp}
              onChange={(e) => {
                setFieldError("");
                setOtp(e.target.value);
              }}
              placeholder="Enter OTP"
              disabled={loading}
              maxLength={8}
            />
            {fieldError ? (
              <span className="admin-invite-error">{fieldError}</span>
            ) : null}
          </label>
          <button
            type="button"
            className="admin-invite-link-btn"
            disabled={loading || cooldown > 0}
            onClick={() => void handleResend()}
          >
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>
        </div>
        <div className="kyc-mod-modal-actions">
          <button
            type="button"
            className="kyc-mod-btn ghost"
            disabled={loading}
            onClick={() => onClose?.()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="kyc-mod-btn primary"
            disabled={loading}
            onClick={() => void handleVerify()}
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
        </div>
      </div>
    </div>
  );
}
