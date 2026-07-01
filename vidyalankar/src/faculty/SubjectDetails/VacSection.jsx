import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function VacSection() {
  const blankVac = [
    { name: '', conductedBy: '', duration: '', certificate: '' },
    { name: '', conductedBy: '', duration: '', certificate: '' }
  ];

  // Helper to create a deep copy of the rows array
  const deepCloneRows = (rows) => rows.map(r => ({ ...r }));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [CiaanId, setCiaanId] = useState(null);

  const [showVacForm, setShowVacForm] = useState(false);
  const [currentVacForm, setCurrentVacForm] = useState(deepCloneRows(blankVac));
  const [submittedVacData, setSubmittedVacData] = useState(deepCloneRows(blankVac));
  const [vacBtn, setVacBtn] = useState('Add/Edit List');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stored = sessionStorage.getItem("currentCiaanData") || localStorage.getItem("CiaanData");
      if (!stored) {
        setError("No active CIAAN session found.");
        return;
      }

      const CiaanData = JSON.parse(stored);
      if (!CiaanData || !CiaanData.CiaanId) {
        setError("Invalid Ciaan session details.");
        return;
      }
      setCiaanId(CiaanData.CiaanId);

      const res = await axios.get(config.CiaanSubjectDetails.get(CiaanData.CiaanId));
      if (res.data.success && Array.isArray(res.data.details?.vacSection) && res.data.details.vacSection.length > 0) {
        const data = res.data.details.vacSection;
        setSubmittedVacData(deepCloneRows(data));
        setCurrentVacForm(deepCloneRows(data));
        setVacBtn('Edit List');
      } else {
        setSubmittedVacData(deepCloneRows(blankVac));
        setCurrentVacForm(deepCloneRows(blankVac));
        setVacBtn('Add/Edit List');
      }
    } catch (err) {
      console.error("Failed to load VAC courses details:", err);
      setError(err.response?.data?.error || "Failed to load VAC details.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to prevent body scroll when modal is open
  useEffect(() => {
    if (showVacForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showVacForm]);

  // A single, efficient handler for all form inputs
  const handleInputChange = (index, fieldName, value) => {
    const updatedForm = currentVacForm.map((item, i) => {
      if (i === index) {
        return { ...item, [fieldName]: value };
      }
      return item;
    });
    setCurrentVacForm(updatedForm);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        CiaanId,
        vacSection: currentVacForm
      };

      const res = await axios.post(config.CiaanSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedVacData(deepCloneRows(currentVacForm));
        setVacBtn('Edit List');
        setShowVacForm(false);
      }
    } catch (err) {
      console.error("Failed to save VAC details:", err);
      setError(err.response?.data?.error || "Failed to save VAC details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        /* --- Main Container and Header Styles --- */
        .vac-section-container {
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
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

        .title-container .title {
          margin: 0 0 5px 0; font-weight: 700;
          font-size: 2rem; color: var(--primary-color, #28a745);
        }

        .title-container .subtitle {
          margin: 0; font-size: 1rem;
          font-weight: 500; color: #555;
        }

        .button {
          background-color: var(--primary-color, #4CAF50); color: white;
          padding: 12px 24px; border: none; font-size: 16px;
          font-weight: 600; border-radius: 10px; cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover {
          background-color: var(--primary-accent-dark, #43A047); transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* --- Main Display Table Styles --- */
        table {
          width: 100%; border-collapse: collapse; margin-bottom: 20px;
          background: #fff; border-radius: 12px; overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        th, td {
          border: 1px solid #e0e0e0; padding: 12px 8px; font-size: 13px;
          text-align: center; vertical-align: middle; word-wrap: break-word;
        }
        th {
          background-color: #f0f2f5; font-weight: 600; color: #495057;
        }
        tbody tr:nth-child(even) { background-color: #fdfdfd; }
        tbody tr:hover { background-color: #f5f5f5; }

        /* --- Modal Styles --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 900px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden; display: flex; flex-direction: column;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff; color: #333; padding: 15px 25px;
          font-size: 20px; font-weight: 600; display: flex;
          justify-content: space-between; align-items: center;
          border-bottom: 1px solid #eee;
        }
        .modal-header button {
          background: none; border: none; color: #999;
          font-size: 28px; cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover {
          color: #dc3545; transform: rotate(90deg);
        }
        .modal-body {
          padding: 25px; max-height: 70vh; overflow-y: auto;
        }
        
        /* --- MODAL FORM STYLES --- */
        .form-list {
          display: flex; flex-direction: column; gap: 20px;
        }
        .form-item-card {
          border: 1px solid #e0e0e0; border-radius: 12px;
          padding: 20px; background-color: #fafafa;
        }
        .form-item-header {
          font-size: 16px; font-weight: 600; color: #333;
          margin: 0 0 15px 0; padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        .form-row-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }
        .form-group {
          display: flex; flex-direction: column; gap: 5px;
        }
        .form-group label {
          font-size: 13px; font-weight: 500; color: #555;
        }
        .form-control {
           width: 100%; padding: 10px; font-size: 14px;
           border: 1px solid #ddd; border-radius: 8px;
           transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
           outline: none; border-color: var(--primary-color, #81c784);
           box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        /* --- Modal Button Row Styles --- */
        .btn-row {
          display: flex; justify-content: flex-end; gap: 15px;
          padding: 15px 25px; background: #f8f9fa;
          border-top: 1px solid #eee;
        }
        .btn-save, .btn-cancel {
          color: white; border: none; padding: 10px 25px;
          border-radius: 8px; cursor: pointer; font-size: 15px;
          font-weight: 600; transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-save { background-color: var(--primary-color, #4CAF50); }
        .btn-cancel { background-color: #6c757d; }
        .btn-save:hover { background-color: var(--primary-accent-dark, #43A047); transform: translateY(-1px); }
        .btn-cancel:hover { background-color: #5a6268; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .vac-section-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
        }
      `}</style>

      <div className="vac-section-container">
        {error && (
          <div style={{
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

        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Recommended VAC Courses</h2>
            <p className="subtitle">3.13.6 List of relevant Value Added Courses</p>
          </div>
          <button className="button" disabled={loading} onClick={() => setShowVacForm(true)}>{vacBtn}</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading recommended VAC courses...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name</th>
                  <th>Conducted By</th>
                  <th>Duration</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {submittedVacData[0]?.name ? (
                  submittedVacData.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.conductedBy}</td>
                      <td>{r.duration}</td>
                      <td>{r.certificate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No VAC courses have been added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showVacForm && (
          <div className="modal-overlay" onClick={() => setShowVacForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Add/Edit Recommended VAC Courses</span>
                <button type="button" className="close-btn" onClick={() => setShowVacForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-list">
                  {currentVacForm.map((row, i) => (
                    <div key={i} className="form-item-card">
                      <h4 className="form-item-header">Course {i + 1}</h4>
                      <div className="form-row-grid">
                        <div className="form-group">
                          <label>Name</label>
                          <input className="form-control" value={row.name} onChange={e => handleInputChange(i, 'name', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Conducted By</label>
                          <input className="form-control" value={row.conductedBy} onChange={e => handleInputChange(i, 'conductedBy', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Duration</label>
                          <input className="form-control" value={row.duration} onChange={e => handleInputChange(i, 'duration', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Certificate</label>
                          <input className="form-control" value={row.certificate} onChange={e => handleInputChange(i, 'certificate', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowVacForm(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
