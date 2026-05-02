import { useEffect, useState } from "react";
import { buildApiRequestUrl, getApiOrigin } from "../services/apiConfig";

export default function AdminKyc() {
  const [kycList, setKycList] = useState([]);
  const token = localStorage.getItem("ui-access-token");
  const uploadsOrigin = getApiOrigin() || window.location.origin;

  useEffect(() => {
    fetchKyc();
  }, []);

  const fetchKyc = async () => {
    try {
      const res = await fetch(buildApiRequestUrl("/kyc/pending"), {
        credentials: "omit",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      setKycList(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const approve = async (id) => {
    await fetch(buildApiRequestUrl(`/kyc/verify/${id}`), {
      method: "PUT",
      credentials: "omit",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    fetchKyc();
  };

  const reject = async (id) => {
    await fetch(buildApiRequestUrl(`/kyc/reject/${id}`), {
      method: "PUT",
      credentials: "omit",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    fetchKyc();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>KYC Admin Panel</h2>

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
          {kycList.map((k) => (
            <tr key={k.id}>
              <td>{k.user?.userId}</td>
              <td>{k.user?.entityName}</td>

              <td>
                <a
                  href={`${uploadsOrigin}/uploads/${k.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              </td>

              <td>{k.status}</td>

              <td>
                <button onClick={() => approve(k.user.userId)}>Approve</button>

                <button onClick={() => reject(k.user.userId)}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
