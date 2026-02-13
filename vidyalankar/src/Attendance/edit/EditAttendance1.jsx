// EditAttendance1.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { fetchCiannsWithAxios } from "../../utils/ciannFetch";
import "../../components/EditCiann.css";

const EditAttendance1 = () => {
  const navigate = useNavigate();
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch CIANN data on component mount
  useEffect(() => {
    const fetchCiannData = async () => {
      try {
        const data = await fetchCiannsWithAxios(axios);
        setCiannDataList(data);
      } catch (error) {
        console.error("Error fetching CIANN data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCiannData();
  }, []);

  const handleCiannClick = (ciannId) => {
    navigate("/edit-attendance2", { state: { selectedCiannId: ciannId } });
  };

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
            Edit Theory Attendance - Select CIAAN
          </h2>
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <p className="text-center">Loading CIANN data...</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id}
                className="ciann-dashboard-card"
                onClick={() => handleCiannClick(ciannData.ciannId)}
              >
                <i className="bi bi-book ciann-icon"></i>
                <div className="ciann-id">CIAAN ID: {ciannData.ciannId}</div>
                <p className="card-text">
                  <strong>{ciannData.subject?.name}</strong>
                  <br />({ciannData.subject?.code})
                </p>
                <p className="card-text">
                  Division: <strong>{ciannData.division}</strong>
                </p>
                <p className="card-text">
                  Academic Year: <strong>{ciannData.academicYear}</strong>
                </p>
                <p className="card-text">
                  Semester: <strong>{ciannData.semester}</strong>
                </p>
              </div>
            ))
          ) : (
            <p className="text-center">
              No CIAANs available. Create a new CIANN to see options.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default EditAttendance1;
