import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { profileBackend } from "../services/backendApis";
import { getApiErrorMessage } from "../services/backendClient";
import { showError, showSuccess } from "../services/toast";
import ReferralEmptyState from "../components/ReferralEmptyState";
import { PageError, PageLoading } from "../components/PageStates";
import { buildReferralRegistrationLink } from "../utils/referralStorage";
import "./Referrals.css";

function normalizeReferralsResponse(res) {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeReferralRow(item, index) {
  const userId = String(item?.userId ?? item?.id ?? "").trim();
  const fullName = String(
    item?.fullName ?? item?.name ?? item?.displayName ?? "Unknown",
  ).trim();
  const joinedAt = item?.joinedAt ?? item?.createdAt ?? item?.registeredAt ?? "";
  return {
    id: userId || item?.id || `ref-${index}`,
    userId: userId || "—",
    fullName: fullName || "Unknown",
    joinedAt,
  };
}

function formatJoinedAt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Referrals() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [reloadNonce, setReloadNonce] = useState(0);

  const referralCode = String(profile?.referralCode || "").trim();
  const referralLink = useMemo(
    () => buildReferralRegistrationLink(referralCode),
    [referralCode],
  );

  /** Memoized rows — ready for future pagination/slicing without re-normalizing. */
  const tableRows = useMemo(
    () => rawRows.map((row) => ({
      ...row,
      joinedAtDisplay: formatJoinedAt(row.joinedAt),
    })),
    [rawRows],
  );

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await profileBackend.getReferrals();
      setRawRows(normalizeReferralsResponse(res).map(normalizeReferralRow));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load referrals."));
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferrals();
  }, [loadReferrals, reloadNonce]);

  const copyReferralLink = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      showSuccess("Referral link copied");
    } catch {
      showError("Could not copy referral link");
    }
  }, [referralLink]);

  if (loading) {
    return <PageLoading title="Loading referrals..." />;
  }

  if (error) {
    return (
      <PageError
        message={error}
        onRetry={() => setReloadNonce((n) => n + 1)}
      />
    );
  }

  return (
    <div className="referrals-page">
      <header className="referrals-header">
        <div>
          <h1>Referrals</h1>
          <p className="referrals-sub">
            People who joined using your referral link.
          </p>
        </div>
        {referralLink ? (
          <button
            type="button"
            className="referrals-profile-link"
            onClick={() => void copyReferralLink()}
          >
            Copy Referral Link
          </button>
        ) : null}
      </header>

      {tableRows.length === 0 ? (
        <ReferralEmptyState
          referralLink={referralLink}
          onCopyLink={copyReferralLink}
        />
      ) : (
        <>
          <div className="referrals-table-wrap">
            <table className="referrals-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">User ID</th>
                  <th scope="col" className="referrals-col-joined">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td className="referrals-col-name">{row.fullName}</td>
                    <td>
                      <code className="referrals-user-id">{row.userId}</code>
                    </td>
                    <td className="referrals-col-joined">
                      {row.joinedAtDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="referrals-card-list" aria-label="Referrals">
            {tableRows.map((row) => (
              <li key={`card-${row.id}`} className="referrals-card">
                <div className="referrals-card-name">{row.fullName}</div>
                <code className="referrals-user-id">{row.userId}</code>
                <div className="referrals-card-joined">
                  Joined {row.joinedAtDisplay}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
