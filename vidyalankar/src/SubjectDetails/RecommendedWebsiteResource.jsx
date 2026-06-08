import React, { useState, useEffect } from 'react';
import { ciannSubjectDetailsApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function RecommendedWebsiteResource() {
  const [ciannId, setCiannId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ name: '', url: '', module: '' });
  const [recommendedSites, setRecommendedSites] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Effect to prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showModal]);

  useEffect(() => {
    const id = getCurrentCiannId();
    if (id) {
      setCiannId(id);
      fetchDetails(id);
    } else {
      setError('No CIANN selected');
      setLoading(false);
    }
  }, []);

  const fetchDetails = async (id) => {
    try {
      setLoading(true);
      const data = await ciannSubjectDetailsApi.getDetails(id);
      if (data?.recommendedWebsiteResource) {
        setRecommendedSites(data.recommendedWebsiteResource);
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch Recommended Websites'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ciannId) return;
    try {
      const newSites = [...recommendedSites, form];
      await ciannSubjectDetailsApi.updateDetails(ciannId, {
        "recommendedWebsiteResource": newSites
      });
      setRecommendedSites(newSites);
      setForm({ name: '', url: '', module: '' });
      setShowModal(false);
    } catch (err) {
      alert(handleApiError(err, 'Failed to save Recommended Website'));
    }
  };

  return (
    <>
      <style>{`
        /* Styles adapted from the previous components */
        .recommended-website-container {
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
          color: #28a745;
        }

        .title-container .subtitle {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #555;
        }

        .button {
          background-color: #4CAF50;
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
          background-color: #43A047;
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
        td a {
            color: #0056b3;
            text-decoration: none;
            font-weight: 500;
        }
        td a:hover {
            text-decoration: underline;
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

        .form-control {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ddd; border-radius: 8px;
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
          outline: none; border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
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
        .btn-save { background-color: #4CAF50; }
        .btn-cancel { background-color: #6c757d; }
        .btn-save:hover { background-color: #43A047; transform: translateY(-1px); }
        .btn-cancel:hover { background-color: #5a6268; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .recommended-website-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
        }
      `}</style>

      <div className="recommended-website-container">
        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Recommended Websites</h2>
            <p className="subtitle">3.13.4 List of YouTube, NPTEL, MOOC, or other relevant sites</p>
          </div>
          <button className="button" onClick={() => setShowModal(true)}>Add Website</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Website Name</th>
                <th>URL</th>
                <th>Module No.</th>
              </tr>
            </thead>
            <tbody>
              {recommendedSites.length > 0 ? (
                recommendedSites.map((site, index) => (
                  <tr key={index}>
                    <td>{site.name}</td>
                    <td><a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a></td>
                    <td>{site.module}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No recommended websites have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <span>Add Recommended Website</span>
                  <button type="button" className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-grid">
                    <input
                      type="text"
                      name="name"
                      placeholder="Website Name (e.g. NPTEL)"
                      className="form-control"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="url"
                      name="url"
                      placeholder="Website URL (e.g. https://nptel.ac.in)"
                      className="form-control"
                      value={form.url}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="module"
                      placeholder="Relevant Module No."
                      className="form-control"
                      value={form.module}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-save">Add Website</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
