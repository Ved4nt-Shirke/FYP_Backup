// ViewAttend1.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchCiannsWithAxios } from "../../utils/ciannFetch";
import "../../components/EditCiann.css";

const ViewAttend1 = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch CIAAN data on component mount
  useEffect(() => {
    const fetchCiannData = async () => {
      try {
        const data = await fetchCiannsWithAxios(axios);
        setCiannDataList(data);
      } catch (error) {
        console.error("Error fetching CIAAN data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCiannData();
  }, []);

  return (
    <>
      {/* Bootstrap Icons */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            View Theory Attendance - Select CIAAN
          </h2>
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <p>Loading...</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id}
                className="ciann-dashboard-card"
                onClick={() =>
                  window.open(
                    `/view-attend2?ciannId=${ciannData.ciannId}`,
                    "_blank"
                  )
                }
              >
                <i className="bi bi-eye ciann-icon"></i>
                <div className="ciann-id">CIAAN ID: {ciannData.ciannId}</div>
                <p className="card-text">
                  <strong>{ciannData.subject?.name}</strong>
                  <br />({ciannData.subject?.code})
                </p>
                <p className="card-text">
                  Division: <strong>{ciannData.division}</strong>
                </p>
              </div>
            ))
          ) : (
            <p className="text-center">No CIAANs available.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewAttend1;
