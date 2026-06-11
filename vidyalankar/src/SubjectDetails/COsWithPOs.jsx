import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { config } from "../config/api";

export default function COsWithPOs() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [mappingData, setMappingData] = useState([]);
  const [formData, setFormData] = useState([]);
  const [showForm, setShowForm] = useState(false);

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
      
      const loadedCOs = res.data.adminDetails?.courseOutcomes || [];
      setCourseOutcomes(loadedCOs);

      const savedMapping = res.data.details?.cosWithPOs || [];
      const N = loadedCOs.length;

      const matrix = Array.from({ length: N }, (_, i) => {
        if (savedMapping[i] && Array.isArray(savedMapping[i])) {
          const row = [...savedMapping[i]];
          while (row.length < 12) row.push("-");
          return row;
        }
        return Array(12).fill("-");
      });

      setMappingData(matrix);
      setFormData(matrix.map(row => [...row]));
    } catch (err) {
      console.error("Failed to load CO-PO mapping:", err);
      setError(err.response?.data?.error || "Failed to load mapping details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (coIndex, poIndex, value) => {
    const updated = [...formData];
    updated[coIndex] = [...updated[coIndex]];
    updated[coIndex][poIndex] = value;
    setFormData(updated);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        cosWithPOs: formData
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setMappingData(formData.map(row => [...row]));
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save CO-PO mapping:", err);
      setError(err.response?.data?.error || "Failed to save mapping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .cos-pos-container {
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

        .header-row .title {
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

        .note {
          font-size: 15px;
          margin-bottom: 20px;
          color: #555;
          font-weight: 500;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 20px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          background: #fff;
          overflow: hidden;
          font-size: 14px;
        }

        table th,
        table td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
        }

        table th {
          background-color: #f0f2f5;
          color: #495057;
          font-weight: 600;
        }

        table tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        table tbody tr:hover {
          background-color: #f5f5f5;
        }

        table td:first-child {
          font-weight: 600;
          background-color: #f6f8fa;
        }

        table select {
          width: 100%;
          padding: 6px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #fefefe;
          cursor: pointer;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        table select:focus {
          outline: none;
          border-color: var(--primary-color, #81c784);
          box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }

        .modal-box {
          background: #fff;
          border-radius: 16px;
          width: 85%;
          max-width: 1100px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.3s ease-in-out;
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
          margin-top: auto;
        }

        .btn-save {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          padding: 10px 20px;
          font-size: 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-save:hover {
          background-color: var(--primary-accent-dark, #43A047);
        }

        .btn-cancel {
          background-color: #e0e0e0;
          color: #555;
          padding: 10px 20px;
          font-size: 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cancel:hover {
          background-color: #d5d5d5;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
          .cos-pos-container {
            padding: 15px;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
          }
          .header-row .title {
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

      <div className="cos-pos-container">
        <div className="header-row">
          <h2 className="title">3.5 Mapping of COs with POs</h2>
          <button 
            className="button" 
            disabled={loading || courseOutcomes.length === 0}
            onClick={() => {
              setFormData(mappingData.map(row => [...row]));
              setShowForm(true);
            }}
          >
            Add Mapping
          </button>
        </div>

        <p className="note">(Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped)</p>

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
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>COs</th>
                  {[...Array(12)].map((_, i) => (
                    <th key={i} style={{ width: '7.5%' }}>PO{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseOutcomes.length > 0 ? (
                  courseOutcomes.map((co, i) => (
                    <tr key={i}>
                      <td title={co.description}><strong>{co.coNumber || `CO${i + 1}`}</strong></td>
                      {mappingData[i]?.map((val, j) => (
                        <td key={j}>{val}</td>
                      )) || Array(12).fill("-").map((val, j) => <td key={j}>{val}</td>)}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" style={{ padding: '30px' }}>
                      No Course Outcomes defined for this subject. Set them up in the Admin panel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Mapping of COs with POs</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body-content">
                <p className="note">Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped</p>

                <div className="table-wrapper" style={{ margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '10%' }}>COs</th>
                        {[...Array(12)].map((_, i) => (
                          <th key={i} style={{ width: '7.5%' }}>PO{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courseOutcomes.map((co, i) => (
                        <tr key={i}>
                          <td title={co.description}><strong>{co.coNumber || `CO${i + 1}`}</strong></td>
                          {formData[i]?.map((val, j) => (
                            <td key={j}>
                              <select value={val} onChange={(e) => handleChange(i, j, e.target.value)}>
                                {["-", "3", "2", "1"].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="btn-row">
                  <button type="button" className="btn-save" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
