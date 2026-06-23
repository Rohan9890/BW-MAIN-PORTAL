import { Link } from "react-router-dom";

/**
 * Empty referrals list — copy link CTA for sharing.
 */
export default function ReferralEmptyState({ referralLink, onCopyLink }) {
  return (
    <div className="referrals-empty">
      <p className="referrals-empty-title">No referrals yet.</p>
      <p className="referrals-empty-sub">
        Share your referral link to invite users.
      </p>
      {referralLink ? (
        <button
          type="button"
          className="referrals-copy-link-btn"
          onClick={() => onCopyLink?.()}
        >
          Copy Referral Link
        </button>
      ) : (
        <p className="referrals-empty-hint">
          Your referral link will appear on your{" "}
          <Link to="/profile">profile</Link> once available.
        </p>
      )}
      {referralLink ? (
        <code className="referrals-empty-link-preview" title={referralLink}>
          {referralLink}
        </code>
      ) : null}
    </div>
  );
}
