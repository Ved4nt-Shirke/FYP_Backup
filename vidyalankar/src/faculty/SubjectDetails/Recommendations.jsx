import React, { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

function Recommendation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [facultyData, setFacultyData] = useState({ cy1: '', cy2: '', cy3: '' });
  const [savedRecommendation, setSavedRecommendation] = useState({ cy1: '', cy2: '', cy3: '' });

  const [showClusterModel, setShowClusterModel] = useState(false);
  const [clusterData, setClusterData] = useState({
    cmMeeting: '', imMeeting: '', cmDate: '', imDate: ''
  });
  const [savedClusterData, setSavedClusterData] = useState({
    cmMeeting: '', imMeeting: '', cmDate: '', imDate: ''
  });

  const [showSubjectTeacher, setShowSubjectTeacher] = useState(false);
  const [recommendationEntries, setRecommendationEntries] = useState([]);

  const [currentRecommendation, setCurrentRecommendation] = useState({
    unitNo: '', practicalExpt: '', nptel: false, guestLecture: false,
    ivWorkshop: false, miniProject: false, valueAdded: false, other: '', details: ''
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
      if (res.data.success && res.data.details?.recommendations) {
        const recs = res.data.details.recommendations;
        
        if (recs.facultyRecommendation) {
          setSavedRecommendation(recs.facultyRecommendation);
          setFacultyData(recs.facultyRecommendation);
        }
        if (recs.clusterRecommendation) {
          setSavedClusterData(recs.clusterRecommendation);
          setClusterData(recs.clusterRecommendation);
        }
        if (Array.isArray(recs.subjectTeacherRecommendations)) {
          setRecommendationEntries(recs.subjectTeacherRecommendations);
        }
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError(err.response?.data?.error || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Lock scroll when any modal is open
  useEffect(() => {
    if (showFacultyForm || showClusterModel || showSubjectTeacher) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showFacultyForm, showClusterModel, showSubjectTeacher]);

  // Handlers for Subject Teacher
  const handleCurrentRecommendationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentRecommendation(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubjectTeacherSubmit = async () => {
    const updatedEntries = [...recommendationEntries, { ...currentRecommendation }];
    
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        recommendations: {
          facultyRecommendation: savedRecommendation,
          clusterRecommendation: savedClusterData,
          subjectTeacherRecommendations: updatedEntries
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setRecommendationEntries(updatedEntries);
        setCurrentRecommendation({
          unitNo: '', practicalExpt: '', nptel: false, guestLecture: false,
          ivWorkshop: false, miniProject: false, valueAdded: false, other: '', details: ''
        });
        setShowSubjectTeacher(false);
      }
    } catch (err) {
      console.error("Failed to save recommendations:", err);
      setError(err.response?.data?.error || "Failed to save recommendations.");
    } finally {
      setSaving(false);
    }
  };

  // Faculty Handlers
  const handleFacultyInput = (e) => {
    const { name, value } = e.target;
    setFacultyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFacultySubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        recommendations: {
          facultyRecommendation: facultyData,
          clusterRecommendation: savedClusterData,
          subjectTeacherRecommendations: recommendationEntries
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSavedRecommendation(facultyData);
        setShowFacultyForm(false);
      }
    } catch (err) {
      console.error("Failed to save faculty recommendation:", err);
      setError(err.response?.data?.error || "Failed to save recommendation.");
    } finally {
      setSaving(false);
    }
  };

  // Cluster Handlers
  const handleClusterInput = (e) => {
    const { name, value } = e.target;
    setClusterData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmitCluster = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        recommendations: {
          facultyRecommendation: savedRecommendation,
          clusterRecommendation: clusterData,
          subjectTeacherRecommendations: recommendationEntries
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSavedClusterData(clusterData);
        setShowClusterModel(false);
      }
    } catch (err) {
      console.error("Failed to save cluster mentor recommendations:", err);
      setError(err.response?.data?.error || "Failed to save recommendations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .recommendation-container {
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
          font-size: 1.2rem;
          color: var(--primary-color, #28a745);
          padding-left: 0;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 25px 0 15px;
          color: #333;
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
          padding: 10px 8px;
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
          max-width: 900px;
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

        .form-check-input {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          cursor: pointer;
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

        @media (max-width: 768px) {
          .recommendation-container {
            padding: 15px;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
          }
          .title {
            font-size: 1.5rem;
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

      <div className="recommendation-container">
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
            Loading recommendation details...
          </div>
        ) : (
          <>
            {/* Faculty Recommendation Section */}
            <div className="header-row">
              <h2 className="title">3.9 Recommendations of Faculty who have taught this Subject Earlier</h2>
              <button className="button" onClick={() => setShowFacultyForm(true)}>Add Faculty Recommendation</button>
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Year</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><strong>CY-1</strong></td><td style={{ textAlign: 'left' }}>{savedRecommendation.cy1 || '-'}</td></tr>
                  <tr><td><strong>CY-2</strong></td><td style={{ textAlign: 'left' }}>{savedRecommendation.cy2 || '-'}</td></tr>
                  <tr><td><strong>CY-3</strong></td><td style={{ textAlign: 'left' }}>{savedRecommendation.cy3 || '-'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Cluster Mentor Section */}
            <div className="header-row">
              <h2 className="title">3.10 Recommendations of Cluster Mentor / Industry Mentor</h2>
              <button className="button" onClick={() => setShowClusterModel(true)}>Add Cluster / Industry Mentor Recommendation</button>
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Parameters</th>
                    <th>Cluster Mentor</th>
                    <th>Industry Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Meeting with</strong></td>
                    <td>{savedClusterData.cmMeeting || '-'}</td>
                    <td>{savedClusterData.imMeeting || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Meeting held on</strong></td>
                    <td>{savedClusterData.cmDate || '-'}</td>
                    <td>{savedClusterData.imDate || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Subject Teacher Section */}
            <div className="header-row">
              <h2 className="title">3.11 Final List of Recommendations (Subject Teacher)</h2>
              <button className="button" onClick={() => setShowSubjectTeacher(true)}>Add Subject Teacher Recommendation</button>
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>Unit No</th>
                    <th style={{ width: '15%' }}>Practical</th>
                    <th style={{ width: '8%' }}>NPTEL</th>
                    <th style={{ width: '8%' }}>Guest</th>
                    <th style={{ width: '8%' }}>IV</th>
                    <th style={{ width: '8%' }}>Mini Project</th>
                    <th style={{ width: '8%' }}>Value Added</th>
                    <th style={{ width: '15%' }}>Other</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendationEntries.length > 0 ? (
                    recommendationEntries.map((entry, i) => (
                      <tr key={i}>
                        <td>{entry.unitNo || '-'}</td>
                        <td style={{ textAlign: 'left' }}>{entry.practicalExpt || '-'}</td>
                        <td><input type="checkbox" checked={!!entry.nptel} disabled className="form-check-input" /></td>
                        <td><input type="checkbox" checked={!!entry.guestLecture} disabled className="form-check-input" /></td>
                        <td><input type="checkbox" checked={!!entry.ivWorkshop} disabled className="form-check-input" /></td>
                        <td><input type="checkbox" checked={!!entry.miniProject} disabled className="form-check-input" /></td>
                        <td><input type="checkbox" checked={!!entry.valueAdded} disabled className="form-check-input" /></td>
                        <td style={{ textAlign: 'left' }}>{entry.other || '-'}</td>
                        <td style={{ textAlign: 'left' }}>{entry.details || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No Recommendations added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showFacultyForm && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span>Add Faculty Recommendation</span>
              <button className="close-btn" onClick={() => setShowFacultyForm(false)}>&times;</button>
            </div>
            <div className="modal-body-content">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Year</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CY-1</strong></td>
                    <td><input type="text" name='cy1' value={facultyData.cy1} onChange={handleFacultyInput} className="form-control" style={{ margin: 0 }} /></td>
                  </tr>
                  <tr>
                    <td><strong>CY-2</strong></td>
                    <td><input type="text" name='cy2' value={facultyData.cy2} onChange={handleFacultyInput} className="form-control" style={{ margin: 0 }} /></td>
                  </tr>
                  <tr>
                    <td><strong>CY-3</strong></td>
                    <td><input type="text" name='cy3' value={facultyData.cy3} onChange={handleFacultyInput} className="form-control" style={{ margin: 0 }} /></td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowFacultyForm(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleFacultySubmit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClusterModel && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span>Add Cluster / Industry Mentor Recommendation</span>
              <button className="close-btn" onClick={() => setShowClusterModel(false)}>&times;</button>
            </div>
            <div className="modal-body-content">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Parameters</th>
                    <th>Cluster Mentor</th>
                    <th>Industry Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Meeting with</strong></td>
                    <td><input type="text" name="cmMeeting" value={clusterData.cmMeeting} onChange={handleClusterInput} className="form-control" style={{ margin: 0 }} /></td>
                    <td><input type="text" name="imMeeting" value={clusterData.imMeeting} onChange={handleClusterInput} className="form-control" style={{ margin: 0 }} /></td>
                  </tr>
                  <tr>
                    <td><strong>Meeting held on</strong></td>
                    <td><input type="date" name="cmDate" value={clusterData.cmDate} onChange={handleClusterInput} className="form-control" style={{ margin: 0 }} /></td>
                    <td><input type="date" name="imDate" value={clusterData.imDate} onChange={handleClusterInput} className="form-control" style={{ margin: 0 }} /></td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowClusterModel(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubmitCluster} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubjectTeacher && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span>Add Subject Teacher Recommendation</span>
              <button className="close-btn" onClick={() => setShowSubjectTeacher(false)}>&times;</button>
            </div>
            <div className="modal-body-content">
              <div className="table-wrapper" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Unit No</th>
                      <th style={{ width: '15%' }}>Practical</th>
                      <th style={{ width: '8%' }}>NPTEL</th>
                      <th style={{ width: '8%' }}>Guest</th>
                      <th style={{ width: '8%' }}>IV/Workshop</th>
                      <th style={{ width: '8%' }}>Mini Project</th>
                      <th style={{ width: '8%' }}>Value Added</th>
                      <th style={{ width: '15%' }}>Other</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="text" name="unitNo" value={currentRecommendation.unitNo} onChange={handleCurrentRecommendationChange} className="form-control" style={{ margin: 0 }} /></td>
                      <td><input type="text" name="practicalExpt" value={currentRecommendation.practicalExpt} onChange={handleCurrentRecommendationChange} className="form-control" style={{ margin: 0 }} /></td>
                      <td><input type="checkbox" name="nptel" checked={currentRecommendation.nptel} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="guestLecture" checked={currentRecommendation.guestLecture} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="ivWorkshop" checked={currentRecommendation.ivWorkshop} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="miniProject" checked={currentRecommendation.miniProject} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="valueAdded" checked={currentRecommendation.valueAdded} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="text" name="other" value={currentRecommendation.other} onChange={handleCurrentRecommendationChange} className="form-control" style={{ margin: 0 }} /></td>
                      <td><input type="text" name="details" value={currentRecommendation.details} onChange={handleCurrentRecommendationChange} className="form-control" style={{ margin: 0 }} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowSubjectTeacher(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubjectTeacherSubmit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Recommendation;
