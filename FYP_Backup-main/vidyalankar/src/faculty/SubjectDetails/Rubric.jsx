import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function Rubric() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [showRubric, setShowRubric] = useState(false);
  const [submittedRubricData, setSubmittedRubricData] = useState(null);
  const [rubricFormData, setRubricFormData] = useState({
    attendance: '',
    assignments: '',
    performance: '',
    journal: '',
    tests: '',
    other: '',
    total: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      setCiannId(ciannData.ciannId);

      const res = await axios.get(config.ciannSubjectDetails.get(ciannData.ciannId));
      if (res.data.success && res.data.details?.rubric) {
        const rub = res.data.details.rubric;
        const loadedRub = {
          attendance: rub.attendance || "",
          assignments: rub.assignments || "",
          performance: rub.performance || "",
          journal: rub.journal || "",
          tests: rub.tests || "",
          other: rub.other || "",
          total: rub.total || ""
        };
        setSubmittedRubricData(loadedRub);
        setRubricFormData(loadedRub);
      }
    } catch (err) {
      console.error("Failed to load rubric details:", err);
      setError(err.response?.data?.error || "Failed to load rubric.");
    } finally {
      setLoading(false);
    }
  };

  const handleRubricChange = (e) => {
    const { name, value } = e.target;
    setRubricFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRubricSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        rubric: rubricFormData
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedRubricData(rubricFormData);
        setShowRubric(false);
      }
    } catch (err) {
      console.error("Failed to save rubric:", err);
      setError(err.response?.data?.error || "Failed to save rubric.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRubric = () => setShowRubric(false);

  return (
    <>
      <style>{`
        .rubric-container {
          padding: 30px;
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
          box-sizing: border-box;
          color: #333;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .title {
          margin: 0;
          font-weight: 700;
          font-size: 2rem;
          color: var(--primary-color, #28a745);
        }

        .button {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          padding: 12px 24px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover {
          background-color: var(--primary-accent-dark, #43A047);
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          table-layout: fixed;
        }
        table th, table td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
          font-size: 13px;
          word-wrap: break-word;
        }
        table th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }
        table tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        table tbody tr:hover {
          background-color: #f5f5f5;
        }

        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        .modal-box {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff;
          color: #333;
          padding: 15px 25px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        .close-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .close-btn:hover {
          color: #dc3545;
          transform: rotate(90deg);
        }
        .modal-body-content {
          padding: 25px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
          outline: none;
          border-color: var(--primary-color, #81c784);
          box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
          margin-top: 25px;
        }
        .btn-save {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-save:hover {
          background-color: var(--primary-accent-dark, #43A047);
        }
        .btn-cancel {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cancel:hover {
          background-color: #bb2d3b;
        }

        .modal-rubric-table {
          width: 100%;
        }
        .modal-rubric-table th, .modal-rubric-table td {
          font-size: 13px;
          padding: 8px;
        }

        @media (max-width: 768px) {
          .rubric-container {
            padding: 15px;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
          }
          .title {
            font-size: 1.7rem;
          }
          .button {
            width: 100%;
            text-align: center;
          }
          .modal-box {
            width: 95%;
          }
          .modal-body-content {
            padding: 20px;
          }
          .btn-row {
            flex-direction: column;
            gap: 10px;
          }
          .btn-save, .btn-cancel {
            width: 100%;
          }
        }
      `}</style>

      <div className='rubric-container'>
        <div className='header-row'>
          <h2 className='title'>3.12 Rubric for Grading & Marking of Term Work</h2>
          <button 
            className="button"
            disabled={loading}
            onClick={() => {
              if (submittedRubricData) {
                setRubricFormData(submittedRubricData);
              }
              setShowRubric(true);
            }}
          >
            {submittedRubricData ? "Edit Rubric" : "Add Rubric"}
          </button>
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

        {showRubric && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Add Rubric</span>
                <button className="close-btn" onClick={handleCancelRubric}>&times;</button>
              </div>
              <div className="modal-body-content">
                <div className="table-wrapper">
                  <table className="modal-rubric-table">
                    <thead>
                      <tr>
                        <th>Lecture + Practical<br />(% Attendance)</th>
                        <th>Assignments</th>
                        <th>Lab / Practical Performance</th>
                        <th>Lab Journal Assessment</th>
                        <th>Class Tests<br />(Other than PT)</th>
                        <th>Other Specify</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.keys(rubricFormData).map((key) => (
                          <td key={key}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ margin: 0, padding: '6px' }}
                              name={key}
                              value={rubricFormData[key]}
                              onChange={handleRubricChange}
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="btn-row">
                  <button className="btn-cancel" onClick={handleCancelRubric} disabled={saving}>Cancel</button>
                  <button className="btn-save" onClick={handleRubricSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading grading rubric...
          </div>
        ) : (
          <div className="table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <table>
              <thead>
                <tr>
                  <th>Lecture +<br />Practical<br />(%Attendance)</th>
                  <th>Assignment</th>
                  <th>Lab/<br />Practical<br />Performance</th>
                  <th>Lab Journal<br />Assessment</th>
                  <th>Class Tests<br />(Other than<br />PT)</th>
                  <th>Other<br />Specify</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {submittedRubricData ? (
                    Object.keys(rubricFormData).map((key) => (
                      <td key={key}>{submittedRubricData[key] || '-'}</td>
                    ))
                  ) : (
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      No grading rubrics specified yet.
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
