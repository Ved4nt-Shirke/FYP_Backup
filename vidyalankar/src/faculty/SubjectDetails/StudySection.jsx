import { useState, useEffect } from "react";
import { ciannSubjectDetailsApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function StudySection() {
  const [ciannId, setCiannId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const blankStudy = { gq: false, notes: false, digital: false, ppt: false, eq: false, other: '' };

  const [showStudyForm, setShowStudyForm] = useState(false);
  const [studyForm, setStudyForm] = useState({ ...blankStudy });
  const [submittedStudy, setSubmittedStudy] = useState({ ...blankStudy });
  const [studyBtn, setStudyBtn] = useState('Add/Edit');

  useEffect(() => {
    if (showStudyForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showStudyForm]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStudyForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
      if (data?.studySection) {
        const mapped = { ...blankStudy, ...data.studySection };
        setSubmittedStudy(mapped);
        setStudyForm(mapped);
        setStudyBtn('Edit');
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch Study Material data'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!ciannId) return;
    try {
      await ciannSubjectDetailsApi.updateDetails(ciannId, {
        "studySection": studyForm
      });
      setSubmittedStudy({ ...studyForm });
      setStudyBtn('Edit');
      setShowStudyForm(false);
    } catch (err) {
      alert(handleApiError(err, 'Failed to update Study Material'));
    }
  };

  const formatLabel = (field) => {
    switch(field) {
      case 'gq': return 'GQ';
      case 'ppt': return 'PPT';
      case 'eq': return 'EQ';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  };

  return (
    <>
      <style>{`
        /* --- Main Container and Header Styles --- */
        .study-section-container {
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
          font-size: 1.7rem; color: #28a745;
        }

        .title-container .subtitle {
          margin: 0; font-size: 1rem;
          font-weight: 500; color: #555;
        }

        .button {
          background-color: #4CAF50; color: white;
          padding: 12px 24px; border: none; font-size: 16px;
          font-weight: 600; border-radius: 10px; cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover {
          background-color: #43A047; transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* --- Main Display Table Styles --- */
        .study-section-container table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
        }
        .study-section-container th, .study-section-container td {
          border: 1px solid #e0e0e0;
          padding: 8px;
          font-size: 13px;
          text-align: center; vertical-align: middle;
        }
        .study-section-container th {
          background-color: #f0f2f5; font-weight: 600; color: #495057;
        }
        .study-section-container tbody tr:nth-child(even) { background-color: #fdfdfd; }
        
        /* --- Modal Styles --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 800px;
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
        .checkbox-form-container h4 {
          text-align: center;
          margin: 0 0 20px 0;
          font-weight: 600;
        }
        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px 30px;
          margin-bottom: 25px;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 16px;
        }
        input[type="checkbox"] {
          transform: scale(1.4);
          accent-color: #4CAF50;
        }
        .form-group {
          display: flex; flex-direction: column; gap: 5px;
        }
        .form-group label {
          font-size: 14px; font-weight: 600;
        }
        .form-control {
           width: 100%; padding: 10px; font-size: 14px;
           border: 1px solid #ddd; border-radius: 8px;
           transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
           outline: none; border-color: #81c784;
           box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
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
        .btn-save { background-color: #4CAF50; }
        .btn-cancel { background-color: #6c757d; }
        
        @media (max-width: 768px) {
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.5rem; }
          .button { width: 100%; }
        }
      `}</style>
      
      <div className="study-section-container">
        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Study Material Distributed</h2>
            <p className="subtitle">3.13.7 Record of Materials Provided to Students</p>
          </div>
          <button className="button" onClick={() => setShowStudyForm(true)}>{studyBtn}</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            {/* ✅ UPDATED COLGROUP FOR CUSTOM COLUMN WIDTHS */}
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>GQ</th>
                <th>Notes</th>
                <th>Digital</th>
                <th>PPT</th>
                <th>EQ</th>
                <th>Other</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{submittedStudy.gq ? '✔' : ''}</td>
                <td>{submittedStudy.notes ? '✔' : ''}</td>
                <td>{submittedStudy.digital ? '✔' : ''}</td>
                <td>{submittedStudy.ppt ? '✔' : ''}</td>
                <td>{submittedStudy.eq ? '✔' : ''}</td>
                <td>{submittedStudy.other}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {showStudyForm && (
          <div className="modal-overlay">
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Select Study Materials</span>
                <button type="button" className="close-btn" onClick={() => setShowStudyForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <h4>Tick the materials that were distributed</h4>
                <div className="checkbox-group">
                  {Object.keys(studyForm).filter(field => field !== 'other').map(field => (
                    <label key={field}>
                      <input
                        type="checkbox"
                        name={field}
                        checked={studyForm[field]}
                        onChange={handleChange}
                      />
                      {formatLabel(field)}
                    </label>
                  ))}
                </div>
                <div className="form-group">
                  <label htmlFor="other-input">Other (Specify)</label>
                  <input
                    id="other-input"
                    type="text"
                    name="other"
                    className="form-control"
                    value={studyForm.other}
                    onChange={handleChange}
                    placeholder="Specify other materials if any"
                  />
                </div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowStudyForm(false)}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubmit}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
