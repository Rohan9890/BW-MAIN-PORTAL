import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiOrigin } from "../services/apiConfig";
import { backendJson } from "../services/backendClient";
import { showError, showSuccess } from "../services/toast";

export default function AdminKyc() {
  const navigate = useNavigate();
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "all"
  const uploadsOrigin = getApiOrigin() || window.location.origin;

  useEffect(() => {
    void fetchKyc(activeTab);
  }, [activeTab]);

  const fetchKyc = async (tab) => {
    setLoading(true);
    try {
      const path = tab === "all" ? "/admin/kyc/all" : "/admin/kyc/pending";
      const res = await backendJson(path, { method: "GET", suppressGlobalServerErrorToast: true });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setKycList(items);
    } catch (err) {
      setKycList([]);
      showError(err?.message || "Failed to load KYC requests");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await backendJson(`/admin/kyc/verify/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        suppressGlobalServerErrorToast: true,
      });
      showSuccess("KYC verified");
      await fetchKyc(activeTab);
    } catch (err) {
      showError(err?.message || "Failed to verify KYC");
    }
  };

  const reject = async (id) => {
    const reason =
      window.prompt("Rejection reason (optional)")?.trim() ?? "";
    try {
      await backendJson(`/admin/kyc/reject/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        query: { reason },
        suppressGlobalServerErrorToast: true,
      });
      showSuccess("KYC rejected");
      await fetchKyc(activeTab);
    } catch (err) {
      showError(err?.message || "Failed to reject KYC");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/admin");
          }
        }}
        style={{
          border: "1px solid rgba(148,163,184,0.5)",
          background: "#fff",
          borderRadius: 10,
          padding: "6px 10px",
          cursor: "pointer",
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        ← Back
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>KYC Admin Panel</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            disabled={activeTab === "pending"}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            disabled={activeTab === "all"}
          >
            All
          </button>
        </div>
      </div>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Document</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                Loading KYC requests...
              </td>
            </tr>
          ) : !kycList.length ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                No KYC requests found.
              </td>
            </tr>
          ) : (
            kycList.map((k) => (
              <tr key={k.id ?? `${k.user?.userId ?? ""}-${k.filePath ?? ""}`}>
                <td>{k.user?.userId ?? k.userId ?? "—"}</td>
                <td>{k.user?.entityName ?? k.name ?? "—"}</td>

                <td>
                  {k.filePath ? (
                    <a
                      href={`${uploadsOrigin}/uploads/${k.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                <td>{k.status ?? "—"}</td>

                <td>
                  <button onClick={() => approve(k.user?.userId ?? k.userId ?? k.id)}>
                    Approve
                  </button>

                  <button onClick={() => reject(k.user?.userId ?? k.userId ?? k.id)}>
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
