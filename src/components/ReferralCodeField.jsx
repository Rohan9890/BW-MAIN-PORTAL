/**
 * Referral code input — always read-only (direct default or invite link).
 */
export default function ReferralCodeField({
  id = "referral-code",
  value = "",
  locked = true,
  fromInviteLink = false,
  placeholder = "Referral Code / Name",
  label = "Referral Code / Name",
  icon = "🎟️",
  error = "",
  onChange,
  onBlur,
}) {
  const hasError = Boolean(error);
  const readOnly = locked !== false;

  return (
    <div className="reg-input-block">
      <label className="reg-label" htmlFor={id}>
        {label}
      </label>
      <div
        className={`reg-input-with-icon reg-referral-input-wrap reg-referral-locked-wrap${hasError ? " reg-input-invalid" : ""}`}
      >
        <span className="reg-input-icon" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          type="text"
          className="input reg-premium-input reg-referral-locked"
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
          onChange={onChange}
          onBlur={onBlur}
        />
        <span
          className="reg-referral-lock-icon"
          aria-hidden
          title="Referral code locked"
        >
          🔒
        </span>
      </div>
      <p className="reg-referral-locked-hint" id={`${id}-hint`}>
        {fromInviteLink
          ? "Referral code applied from invite link"
          : "Platform referral code applied automatically"}
      </p>
      {hasError ? <div className="reg-field-error">{error}</div> : null}
    </div>
  );
}
