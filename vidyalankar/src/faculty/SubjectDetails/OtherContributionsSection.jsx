import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function OtherContributionsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [CiaanId, setCiaanId] = useState(null);

  const [showContribForm, setShowContribForm] = useState(false);
  const [contribText, setContribText] = useState('');
  const [submittedContrib, setSubmittedContrib] = useState('');
  const [contribBtn, setContribBtn] = useState('Add/Edit');

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
      if (res.data.success && typeof res.data.details?.otherContributionsSection === 'string') {
        const text = res.data.details.otherContributionsSection;
        setSubmittedContrib(text);
        setContribText(text);
        setContribBtn('Edit');
      } else {
        setSubmittedContrib('');
        setContribText('');
        setContribBtn('Add/Edit');
      }
    } catch (err) {
      console.error("Failed to load other contributions:", err);
      setError(err.response?.data?.error || "Failed to load other contributions.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to prevent body scroll when modal is open
  useEffect(() => {
    if (showContribForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showContribForm]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        CiaanId,
        otherContributionsSection: contribText
      };

      const res = await axios.post(config.CiaanSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedContrib(contribText);
        setContribBtn('Edit');
        setShowContribForm(false);
      }
    } catch (err) {
      console.error("Failed to save other contributions:", err);
      setError(err.response?.data?.error || "Failed to save details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        /* --- Main Container and Header Styles --- */
        .other-contributions-container {
          font-family: 'Inter', sans-serif;
          background-color: #fff;
          color: #333;
          padding: 25px;
          border-radius: 12px;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .title-container .title {
          margin: 0 0 5px 0; font-weight: 700;
          font-size: 1.7rem; color: var(--primary-color, #28a745);
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
        
        /* --- Contribution Display Area --- */
        .contribution-display {
          background-color: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          min-height: 60px;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        .contribution-display-placeholder {
          color: #888;
          font-style: italic;
        }

        /* --- Modal Styles --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 700px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden; display: flex; flex-direction: column;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          padding: 15px 25px; font-size: 20px; font-weight: 600;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #eee;
        }
        .modal-header button {
          background: none; border: none; color: #999;
          font-size: 28px; cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover { color: #dc3545; transform: rotate(90deg); }
        .modal-body {
          padding: 25px; max-height: 70vh; overflow-y: auto;
        }
        
        /* --- MODAL FORM STYLES --- */
        .form-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .form-group label {
          font-size: 14px; font-weight: 600;
        }
        .form-control {
           width: 100%; padding: 10px; font-size: 14px;
           border: 1px solid #ddd; border-radius: 8px;
           transition: border-color 0.2s ease, box-shadow 0.2s ease;
           resize: vertical;
           min-height: 120px;
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
        }
        .btn-save { background-color: var(--primary-color, #4CAF50); }
        .btn-cancel { background-color: #6c757d; }
        .btn-save:hover { background-color: var(--primary-accent-dark, #43A047); }
        .btn-cancel:hover { background-color: #5a6268; }
        
        @media (max-width: 768px) {
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.5rem; }
          .button { width: 100%; }
        }
      `}</style>

      <div className="other-contributions-container">
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
            <h2 className="title">Other Contributions</h2>
            <p className="subtitle">3.13.8 Any other recommendations or contributions</p>
          </div>
          <button className="button" disabled={loading} onClick={() => setShowContribForm(true)}>{contribBtn}</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading other contributions...
          </div>
        ) : (
          <div className="contribution-display">
            {submittedContrib ? submittedContrib : (
              <span className="contribution-display-placeholder">No contributions added yet.</span>
            )}
          </div>
        )}

        {showContribForm && (
          <div className="modal-overlay" onClick={() => setShowContribForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Edit Recommendations / Contributions</span>
                <button type="button" className="close-btn" onClick={() => setShowContribForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="contribution-text">Details</label>
                  <textarea
                    id="contribution-text"
                    className="form-control"
                    value={contribText}
                    onChange={e => setContribText(e.target.value)}
                    placeholder="Enter any other contributions or recommendations here..."
                  />
                </div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowContribForm(false)} disabled={saving}>Cancel</button>
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
