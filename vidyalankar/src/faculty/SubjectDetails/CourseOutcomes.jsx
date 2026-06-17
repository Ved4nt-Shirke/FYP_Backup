import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

function CourseOutcomes() {
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseOutcomes();
  }, []);

  const loadCourseOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve CIANN Data
      const stored = sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData");
      if (!stored) {
        setError("No active CIANN session found.");
        return;
      }

      const ciannData = JSON.parse(stored);
      if (!ciannData || !ciannData.ciannId) {
        setError("Invalid CIANN session details.");
        return;
      }

      const res = await axios.get(config.ciannSubjectDetails.get(ciannData.ciannId));
      if (res.data.success && res.data.adminDetails) {
        const outcomes = res.data.adminDetails.courseOutcomes || [];
        setCourseOutcomes(outcomes);
      } else {
        setCourseOutcomes([]);
      }
    } catch (err) {
      console.error("Failed to load course outcomes:", err);
      setError(err.response?.data?.error || "Failed to load course outcomes from Admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-5">
      <style>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .title {
          margin: 0;
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--primary-color, #28a745);
        }
        .sync-badge {
          background-color: var(--primary-light, rgba(40, 167, 69, 0.1));
          color: var(--primary-color, #28a745);
          padding: 8px 16px;
          border: 1px solid var(--primary-color, #28a745);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        th, td {
          border: 1px solid var(--card-border, #dee2e6);
          padding: 14px;
          text-align: left;
        }
        th { 
          background: #f8f9fa;
          font-weight: 600;
          color: var(--text-primary, #333);
        }
        td {
          color: var(--text-secondary, #666);
        }
        tr:hover {
          background-color: #fdfdfd;
        }
      `}</style>
      
      <div className="header-row">
        <h2 className="title">3.5 Course Outcomes</h2>
        <div className="sync-badge">
          <i className="bi bi-arrow-repeat"></i> Synced with Admin Configuration
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading course outcomes...
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>CO No.</th>
              <th>Course Outcome Description</th>
            </tr>
          </thead>
          <tbody>
            {courseOutcomes.length > 0 ? (
              courseOutcomes.map((outcome, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{outcome.coNumber || `CO${index + 1}`}</td>
                  <td>{outcome.description || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: "center", padding: "30px" }}>
                  No Course Outcomes configured for this subject yet. Please contact the administrator.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CourseOutcomes;
