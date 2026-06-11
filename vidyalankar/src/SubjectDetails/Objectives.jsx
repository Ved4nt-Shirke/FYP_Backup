import React, { useState, useEffect } from 'react';
import axios from "../utils/axiosConfig";
import { config } from "../config/api";

export default function Objectives() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cognitive: "",
    affective: "",
    behavioral: ""
  });

  const [submittedData, setSubmittedData] = useState({
    cognitive: "",
    affective: "",
    behavioral: ""
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
      if (res.data.success && res.data.details?.objectives) {
        const obj = res.data.details.objectives;
        const loadedObj = {
          cognitive: obj.cognitive || "",
          affective: obj.affective || "",
          behavioral: obj.behavioral || ""
        };
        setSubmittedData(loadedObj);
        setFormData(loadedObj);
      }
    } catch (err) {
      console.error("Failed to load objectives:", err);
      setError(err.response?.data?.error || "Failed to load course objectives.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        objectives: formData
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedData(formData);
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save objectives:", err);
      setError(err.response?.data?.error || "Failed to save objectives.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .objectives-container {
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

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          table-layout: auto;
        }
        th, td {
          border: 1px solid #e0e0e0;
          padding: 14px 12px;
          text-align: left;
          vertical-align: middle;
          font-size: 14px;
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

        .modal-overlay {
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
          max-width: 700px;
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
        }
        .btn-save {
          background-color: var(--primary-color, #198754);
          color: white;
          padding: 10px 25px;
          border: none;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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

        @media (max-width: 768px) {
          .objectives-container {
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

      <div className="objectives-container mb-5">
        <div className="header-row">
          <h2 className="title">3.4 Objectives of the Course</h2>
          <button 
            className="button" 
            disabled={loading}
            onClick={() => {
              setFormData(submittedData);
              setShowForm(true);
            }}
          >
            {submittedData.cognitive || submittedData.affective || submittedData.behavioral ? 'Edit Course Objectives' : 'Add Course Objectives'}
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading course objectives...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Category</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th>Objective</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cognitive</strong></td>
                  <td>What do you want students to Know?</td>
                  <td>{submittedData.cognitive || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Affective</strong></td>
                  <td>What do you want students to think/care about?</td>
                  <td>{submittedData.affective || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Behavioral</strong></td>
                  <td>What do you want students to be able to do?</td>
                  <td>{submittedData.behavioral || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <span>Add Course Objectives</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Cognitive Objective</label>
                  <textarea
                    className="form-control"
                    placeholder="Cognitive (What do you want students to Know?)"
                    name="cognitive"
                    value={formData.cognitive}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                  <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Affective Objective</label>
                  <textarea
                    className="form-control"
                    placeholder="Affective (What do you want students to think/care about?)"
                    name="affective"
                    value={formData.affective}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                  <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Behavioral Objective</label>
                  <textarea
                    className="form-control"
                    placeholder="Behavioral (What do you want students to be able to do?)"
                    name="behavioral"
                    value={formData.behavioral}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
