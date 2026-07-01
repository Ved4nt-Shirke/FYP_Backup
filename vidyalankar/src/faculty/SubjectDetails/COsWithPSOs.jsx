import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function COsWithPSOs() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [CiaanId, setCiaanId] = useState(null);

  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [mappingData, setMappingData] = useState([]);
  const [formData, setFormData] = useState([]);
  const [showPSOForm, setShowPSOForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve Ciaan Data
      const stored = sessionStorage.getItem("currentCiaanData") || localStorage.getItem("CiaanData");
      if (!stored) {
        setError("No active Ciaan session found.");
        return;
      }

      const CiaanData = JSON.parse(stored);
      if (!CiaanData || !CiaanData.CiaanId) {
        setError("Invalid Ciaan session details.");
        return;
      }
      setCiaanId(CiaanData.CiaanId);

      const res = await axios.get(config.CiaanSubjectDetails.get(CiaanData.CiaanId));

      const loadedCOs = res.data.adminDetails?.courseOutcomes || [];
      setCourseOutcomes(loadedCOs);

      const savedMapping = res.data.details?.cosWithPSOs || [];
      const N = loadedCOs.length;

      const matrix = Array.from({ length: N }, (_, i) => {
        if (savedMapping[i] && typeof savedMapping[i] === "object") {
          return {
            pso1: savedMapping[i].pso1 || "-",
            pso2: savedMapping[i].pso2 || "-"
          };
        }
        return { pso1: "-", pso2: "-" };
      });

      setMappingData(matrix);
      setFormData(matrix.map(row => ({ ...row })));
    } catch (err) {
      console.error("Failed to load CO-PSO mapping:", err);
      setError(err.response?.data?.error || "Failed to load mapping details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePSOChange = (index, field, value) => {
    const updated = [...formData];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(updated);
  };

  const handlePSOSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        CiaanId,
        cosWithPSOs: formData
      };

      const res = await axios.post(config.CiaanSubjectDetails.save, payload);
      if (res.data.success) {
        setMappingData(formData.map(row => ({ ...row })));
        setShowPSOForm(false);
      }
    } catch (err) {
      console.error("Failed to save CO-PSO mapping:", err);
      setError(err.response?.data?.error || "Failed to save mapping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cos-psos-container">
      <style>{`
        .cos-psos-container {
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
        .button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .instruction {
          font-size: 15px;
          margin-bottom: 20px;
          color: #555;
          font-weight: 500;
        }

        .table-scroll-wrapper {
          overflow-y: auto;
          overflow-x: auto;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th, td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
        }
        th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }
        tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        tbody tr:hover {
          background-color: #f5f5f5;
        }

        .form-select {
          width: 100%;
          padding: 6px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fefefe;
          cursor: pointer;
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
          max-width: 650px;
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
        .modal-header button {
          background: none;
          border: none;
          color: #999;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover {
          color: #dc3545;
          transform: rotate(90deg);
        }
        .modal-body {
          padding: 25px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
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
          background-color: #e0e0e0;
          color: #555;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cancel:hover {
          background-color: #d5d5d5;
        }

        @media (max-width: 768px) {
          .cos-psos-container {
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
          .modal-body {
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

      <div className="header-row">
        <h2 className="title">3.6 Mapping of COs with PSOs</h2>
        <button
          className="button"
          disabled={loading || courseOutcomes.length === 0}
          onClick={() => {
            setFormData(mappingData.map(row => ({ ...row })));
            setShowPSOForm(true);
          }}
        >
          Add COs with PSOs Mapping
        </button>
      </div>

      <p className="instruction">
        (Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped)
      </p>

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
          Loading mapping matrix...
        </div>
      ) : (
        <div className="table-scroll-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>COs</th>
                <th>PSO1</th>
                <th>PSO2</th>
              </tr>
            </thead>
            <tbody>
              {courseOutcomes.length > 0 ? (
                courseOutcomes.map((co, idx) => (
                  <tr key={idx}>
                    <td title={co.description}><strong>{co.coNumber || `CO${idx + 1}`}</strong></td>
                    <td>{mappingData[idx]?.pso1 || "-"}</td>
                    <td>{mappingData[idx]?.pso2 || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ padding: '30px' }}>
                    No Course Outcomes defined for this subject. Set them up in the Admin panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showPSOForm && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span>Mapping of COs with PSOs</span>
              <button onClick={() => setShowPSOForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="instruction">
                Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped
              </p>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>COs</th>
                    <th>PSO1</th>
                    <th>PSO2</th>
                  </tr>
                </thead>
                <tbody>
                  {courseOutcomes.map((co, idx) => (
                    <tr key={idx}>
                      <td title={co.description}><strong>{co.coNumber || `CO${idx + 1}`}</strong></td>
                      <td>
                        <select
                          className="form-select"
                          value={formData[idx]?.pso1 || "-"}
                          onChange={(e) => handlePSOChange(idx, "pso1", e.target.value)}
                        >
                          {["-", "3", "2", "1"].map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={formData[idx]?.pso2 || "-"}
                          onChange={(e) => handlePSOChange(idx, "pso2", e.target.value)}
                        >
                          {["-", "3", "2", "1"].map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowPSOForm(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handlePSOSubmit} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
