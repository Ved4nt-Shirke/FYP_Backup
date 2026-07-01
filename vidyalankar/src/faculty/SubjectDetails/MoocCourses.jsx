import React, { useState, useEffect } from 'react';
import { moocCoursesApi, getCurrentCiaanId, handleApiError } from './api/subjectDetailsApi';

export default function MoocCourses() {
  const blankMooc = [
    { title: '', link: '', conductedBy: '', duration: '', certificate: 'Free' },
    { title: '', link: '', conductedBy: '', duration: '', certificate: 'Free' }
  ];

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(blankMooc);
  const [submittedData, setSubmittedData] = useState([]);
  const [buttonText, setButtonText] = useState("Add/Edit List");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadMoocCourses();
  }, []);

  // Effect to prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showForm]);

  const loadMoocCourses = async () => {
    try {
      setLoading(true);
      const CiaanId = getCurrentCiaanId();
      if (!CiaanId) {
        setError('No Ciaan ID found. Please select a course first.');
        return;
      }

      const courses = await moocCoursesApi.getAll(CiaanId);
      setSubmittedData(courses);

      // Update form data if courses exist
      if (courses.length > 0) {
        const formCourses = courses.slice(0, 2); // Take first 2 for editing
        while (formCourses.length < 2) {
          formCourses.push({ title: '', link: '', conductedBy: '', duration: '', certificate: 'Free' });
        }
        setFormData(formCourses);
        setButtonText("Edit List");
      } else {
        setFormData(blankMooc);
        setButtonText("Add/Edit List");
      }

      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load MOOC courses'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const CiaanId = getCurrentCiaanId();
      if (!CiaanId) {
        setError('No Ciaan ID found. Please select a course first.');
        return;
      }

      // Filter out empty courses
      const validCourses = formData.filter(course =>
        course.title.trim() !== '' && course.link.trim() !== '' && course.conductedBy.trim() !== ''
      );

      await moocCoursesApi.saveAll(CiaanId, validCourses);
      await loadMoocCourses(); // Reload data
      setShowForm(false);
      setButtonText("Edit List");
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to save MOOC courses'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (i, field, value) => {
    const updated = [...formData];
    updated[i][field] = value;
    setFormData(updated);
  };

  return (
    <>
      <style>{`
        /* --- Main Container and Header Styles --- */
        .mooc-courses-container {
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
        
        /* --- ✅ MODAL FORM STYLES --- */
        .mooc-form {
          display: flex; flex-direction: column; gap: 20px;
        }
        .mooc-item {
          border: 1px solid #e0e0e0; border-radius: 12px;
          padding: 20px; background-color: #fafafa;
        }
        .mooc-item-header {
          font-size: 16px; font-weight: 600; color: #333;
          margin: 0 0 15px 0; padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        .form-row {
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
          margin-top: 25px;
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
          .mooc-courses-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
        }
      `}</style>

      <div className="mooc-courses-container">
        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Recommended MOOC Courses</h2>
            <p className="subtitle">3.13.5 List of relevant Massive Open Online Courses</p>
          </div>
          <button className="button" onClick={() => setShowForm(true)} disabled={loading}>
            {loading ? 'Loading...' : buttonText}
          </button>
        </div>

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

        {loading && submittedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading MOOC courses...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '13%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Course Title</th>
                  <th>MOOC Course Links</th>
                  <th>Conducted By</th>
                  <th>Duration</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {submittedData.length > 0 ? (
                  submittedData.map((r, i) => (
                    <tr key={r._id || i}>
                      <td>{i + 1}</td>
                      <td>{r.title}</td>
                      <td>
                        <a href={r.link} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#007bff', textDecoration: 'none' }}>
                          {r.link}
                        </a>
                      </td>
                      <td>{r.conductedBy}</td>
                      <td>{r.duration}</td>
                      <td>{r.certificate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No MOOC courses have been added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Add/Edit Recommended MOOC Courses</span>
                <button type="button" className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="mooc-form">
                  {formData.map((row, i) => (
                    <div key={i} className="mooc-item">
                      <h4 className="mooc-item-header">Course {i + 1}</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Course Title</label>
                          <input className="form-control" value={row.title} onChange={e => handleInputChange(i, 'title', e.target.value)} placeholder="Enter course title" />
                        </div>
                        <div className="form-group">
                          <label>MOOC Link</label>
                          <input className="form-control" value={row.link} onChange={e => handleInputChange(i, 'link', e.target.value)} placeholder="Enter course URL" />
                        </div>
                        <div className="form-group">
                          <label>Conducted By</label>
                          <input className="form-control" value={row.conductedBy} onChange={e => handleInputChange(i, 'conductedBy', e.target.value)} placeholder="e.g., Coursera, edX" />
                        </div>
                        <div className="form-group">
                          <label>Duration</label>
                          <input className="form-control" value={row.duration} onChange={e => handleInputChange(i, 'duration', e.target.value)} placeholder="e.g., 6 weeks" />
                        </div>
                        <div className="form-group">
                          <label>Certificate</label>
                          <select className="form-control" value={row.certificate} onChange={e => handleInputChange(i, 'certificate', e.target.value)}>
                            <option value="Free">Free</option>
                            <option value="Paid">Paid</option>
                            <option value="Audit Only">Audit Only</option>
                            <option value="Not Available">Not Available</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
