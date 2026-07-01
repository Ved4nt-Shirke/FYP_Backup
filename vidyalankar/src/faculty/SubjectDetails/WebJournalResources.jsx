import React, { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function WebJournalResources() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [CiaanId, setCiaanId] = useState(null);

  const [webForm, setWebForm] = useState({
    journal: '',
    magazine: '',
    module: ''
  });

  const [webData, setWebData] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
      if (res.data.success && Array.isArray(res.data.details?.webJournalResources)) {
        setWebData(res.data.details.webJournalResources);
      }
    } catch (err) {
      console.error("Failed to load web journal resources:", err);
      setError(err.response?.data?.error || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showModal]);

  const handleChange = (e) => {
    setWebForm({ ...webForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextData = [...webData, webForm];

    try {
      setSaving(true);
      setError(null);

      const payload = {
        CiaanId,
        webJournalResources: nextData
      };

      const res = await axios.post(config.CiaanSubjectDetails.save, payload);
      if (res.data.success) {
        setWebData(nextData);
        setWebForm({ journal: '', magazine: '', module: '' });
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to save web resource:", err);
      setError(err.response?.data?.error || "Failed to save web resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .web-journal-container {
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
          margin: 0 0 5px 0;
          font-weight: 700;
          font-size: 2rem;
          color: var(--primary-color, #28a745);
        }

        .title-container .subtitle {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #555;
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
        }
        th, td {
          border: 1px solid #e0e0e0;
          padding: 12px 8px;
          font-size: 13px;
          text-align: center;
          vertical-align: middle;
          word-wrap: break-word;
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
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 800px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
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
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .form-control, .form-select {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ddd; border-radius: 8px;
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus, .form-select:focus {
          outline: none; border-color: var(--primary-color, #81c784);
          box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        .btn-row {
          display: flex; justify-content: flex-end; gap: 15px;
          padding: 20px 25px; background: #f8f9fa;
          border-top: 1px solid #eee; margin-top: 25px;
        }
        .btn-save, .btn-cancel {
          color: white; border: none; padding: 10px 25px;
          border-radius: 8px; cursor: pointer; font-size: 15px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-save { background-color: var(--primary-color, #4CAF50); }
        .btn-cancel { background-color: #dc3545; }
        .btn-save:hover { background-color: var(--primary-accent-dark, #43A047); transform: translateY(-1px); }
        .btn-cancel:hover { background-color: #bb2d3b; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .web-journal-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
        }
      `}</style>

      <div className="web-journal-container">
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

        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Web & Journal Resources</h2>
            <p className="subtitle">3.13.2 Web Links, Magazines, Journals, & E-journals</p>
          </div>
          <button className="button" disabled={loading} onClick={() => setShowModal(true)}>Add Web Resource</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading web/journal resources...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Web-Links and Journals</th>
                  <th>Magazines</th>
                  <th>For Module</th>
                </tr>
              </thead>
              <tbody>
                {webData.length > 0 ? (
                  webData.map((data, index) => (
                    <tr key={index}>
                      <td style={{ textAlign: 'left' }}>
                        {data.journal?.startsWith('http') ? (
                          <a href={data.journal} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color, #0056b3)' }}>
                            {data.journal}
                          </a>
                        ) : data.journal}
                      </td>
                      <td>{data.magazine}</td>
                      <td>{data.module}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No web resources have been added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Add New Web Resource</span>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <input
                      type="text"
                      name="journal"
                      placeholder="Journal or E-journal Link"
                      className="form-control"
                      value={webForm.journal}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="magazine"
                      placeholder="Magazine Name"
                      className="form-control"
                      value={webForm.magazine}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="module"
                      placeholder="Module No."
                      className="form-control"
                      value={webForm.module}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? "Adding..." : "Add Resource"}
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
