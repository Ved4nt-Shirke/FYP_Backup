import React, { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function KnowledgeMap() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [tableData, setTableData] = useState(null);

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
      if (res.data.success && res.data.details?.knowledgeMap) {
        const km = res.data.details.knowledgeMap;
        if (km.preSem?.length || km.application || km.imagePath) {
          setTableData({
            preSem: km.preSem || ['', '', ''],
            preCourse: km.preCourse || ['', '', ''],
            futureSem: km.futureSem || ['', '', ''],
            futureCourse: km.futureCourse || ['', '', ''],
            application: km.application || '',
            imagePath: km.imagePath || ''
          });
        }
      }
    } catch (err) {
      console.error("Failed to load knowledge map:", err);
      setError(err.response?.data?.error || "Failed to load knowledge map.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setSaving(true);
      setError(null);

      let imagePath = tableData?.imagePath || "";

      // 1. If a file was selected, upload it first
      if (data.file) {
        const uploadForm = new FormData();
        uploadForm.append("image", data.file);
        
        const uploadRes = await axios.post(
          config.ciannSubjectDetails.uploadImage, 
          uploadForm, 
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
        if (uploadRes.data.success) {
          imagePath = uploadRes.data.imagePath;
        }
      }

      // 2. Save everything to CiannSubjectDetails
      const payload = {
        ciannId,
        knowledgeMap: {
          preSem: data.preSem,
          preCourse: data.preCourse,
          futureSem: data.futureSem,
          futureCourse: data.futureCourse,
          application: data.application,
          imagePath
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        const updatedKm = res.data.details.knowledgeMap;
        setTableData({
          preSem: updatedKm.preSem || ['', '', ''],
          preCourse: updatedKm.preCourse || ['', '', ''],
          futureSem: updatedKm.futureSem || ['', '', ''],
          futureCourse: updatedKm.futureCourse || ['', '', ''],
          application: updatedKm.application || '',
          imagePath: updatedKm.imagePath || ''
        });
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save knowledge map:", err);
      setError(err.response?.data?.error || "Failed to save knowledge map.");
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const baseUrl = config.apiBaseUrl.replace("/api", "");
    return `${baseUrl}${imagePath}`;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showForm]);

  return (
    <>
      <style>{`
        .knowledge-map-container {
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
          table-layout: auto;
        }
        th, td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
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

        table img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
          max-width: 750px;
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
        }
        .modal-header button:hover {
          color: #dc3545;
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
          background-color: var(--primary-color, #4CAF50);
          color: white;
          border: none;
          padding: 10px 25px;
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

        @media (max-width: 768px) {
          .knowledge-map-container {
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

      <div className="knowledge-map-container mb-5">
        <div className="header-row">
          <h2 className="title">3.3 Knowledge Map</h2>
          <button className="button" disabled={loading} onClick={() => setShowForm(true)}>
            {tableData ? 'Edit Knowledge Map' : 'Add Knowledge Map'}
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
            Loading knowledge map...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <table>
              <thead>
                <tr>
                  <th colSpan="2">Pre-Requisite (Academic)</th>
                  <th colSpan="2">Relevance to Future Subjects</th>
                  <th rowSpan="2">Application</th>
                  <th rowSpan="2" style={{ width: '250px' }}>Knowledge Map Schematic</th>
                </tr>
                <tr>
                  <th>Sem</th>
                  <th>Course</th>
                  <th>Sem</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {tableData ? (
                  [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td>{tableData.preSem[i] || "-"}</td>
                      <td>{tableData.preCourse[i] || "-"}</td>
                      <td>{tableData.futureSem[i] || "-"}</td>
                      <td>{tableData.futureCourse[i] || "-"}</td>
                      {i === 0 && (
                        <>
                          <td rowSpan="3" style={{ textAlign: 'left', verticalAlign: 'top' }}>{tableData.application}</td>
                          <td rowSpan="3">
                            {tableData.imagePath ? (
                              <img
                                src={getImageUrl(tableData.imagePath)}
                                alt="Knowledge Map Diagram"
                                style={{ maxWidth: '200px', borderRadius: '8px' }}
                              />
                            ) : (
                              <span className="text-muted">No diagram uploaded.</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px' }}>No Knowledge Map added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <span>{tableData ? 'Edit Knowledge Map' : 'Add Knowledge Map'}</span>
                <button onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <KnowledgeMapForm
                  onSubmit={handleFormSubmit}
                  initialData={tableData}
                  onCancel={() => setShowForm(false)}
                  saving={saving}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function KnowledgeMapForm({ onSubmit, initialData, onCancel, saving }) {
  const [preSem, setPreSem] = useState(initialData?.preSem || ['', '', '']);
  const [preCourse, setPreCourse] = useState(initialData?.preCourse || ['', '', '']);
  const [futureSem, setFutureSem] = useState(initialData?.futureSem || ['', '', '']);
  const [futureCourse, setFutureCourse] = useState(initialData?.futureCourse || ['', '', '']);
  const [application, setApplication] = useState(initialData?.application || '');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ preSem, preCourse, futureSem, futureCourse, application, file });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-muted mb-3">Define up to 3 prerequisite & future sem dependencies:</p>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input className="form-control" style={{ marginBottom: 0 }} placeholder={`Pre Sem ${i+1}`} value={preSem[i]} onChange={(e) => {
            const arr = [...preSem];
            arr[i] = e.target.value;
            setPreSem(arr);
          }} />
          <input className="form-control" style={{ marginBottom: 0 }} placeholder={`Pre Course ${i+1}`} value={preCourse[i]} onChange={(e) => {
            const arr = [...preCourse];
            arr[i] = e.target.value;
            setPreCourse(arr);
          }} />
          <input className="form-control" style={{ marginBottom: 0 }} placeholder={`Future Sem ${i+1}`} value={futureSem[i]} onChange={(e) => {
            const arr = [...futureSem];
            arr[i] = e.target.value;
            setFutureSem(arr);
          }} />
          <input className="form-control" style={{ marginBottom: 0 }} placeholder={`Future Course ${i+1}`} value={futureCourse[i]} onChange={(e) => {
            const arr = [...futureCourse];
            arr[i] = e.target.value;
            setFutureCourse(arr);
          }} />
        </div>
      ))}
      <label style={{ fontWeight: '600', marginTop: '10px', marginBottom: '4px', display: 'block' }}>Application / Core Relevance</label>
      <textarea
        className="form-control"
        placeholder="Enter core industry application of this subject..."
        value={application}
        onChange={(e) => setApplication(e.target.value)}
        rows="3"
        required
      />
      <label style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>Upload Map Schematic Diagram</label>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="form-control" />
      <div className="btn-row">
        <button type="button" className="btn-cancel" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
