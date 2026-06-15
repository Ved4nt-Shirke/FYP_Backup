import React, { useState, useEffect } from 'react';
import { ciannSubjectDetailsApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function ModuleAvailabilityResource() {
  const [ciannId, setCiannId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [moduleForm, setModuleForm] = useState({
    module: '',
    textbook: false,
    referenceBook: false,
    otherBook: false,
    magazine: false,
    journalRegular: false,
    journalE: false,
    available: '',
    details: ''
  });
  const [moduleData, setModuleData] = useState([]);
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
      if (data?.moduleAvailabilityResource) {
        setModuleData(data.moduleAvailabilityResource);
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch Module Availability Resource'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModuleForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ciannId) return;
    try {
      const newData = [...moduleData, moduleForm];
      await ciannSubjectDetailsApi.updateDetails(ciannId, {
        "moduleAvailabilityResource": newData
      });
      setModuleData(newData);
      setModuleForm({
        module: '', textbook: false, referenceBook: false, otherBook: false,
        magazine: false, journalRegular: false, journalE: false,
        available: '', details: ''
      });
      setShowModal(false);
    } catch (err) {
      alert(handleApiError(err, 'Failed to update Module Availability Resource'));
    }
  };

  return (
    <>
      <style>{`
        /* --- Main Container and Header Styles --- */
        .module-availability-container {
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
          font-size: 2rem; color: #28a745;
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
          max-width: 900px; /* Adjusted max-width for better form layout */
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
        
        /* --- ✅ FIXED MODAL FORM STYLES --- */
        .form-grid-modal {
          display: grid;
          /* Creates a responsive grid with 2 columns */
          grid-template-columns: repeat(2, 1fr);
          gap: 25px; /* Space between grid items */
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px; /* Space between label and input */
        }
        
        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }
        
        /* Make a grid item span both columns */
        .form-group-span-2 {
          grid-column: 1 / -1;
        }
        
        .form-control, textarea {
           width: 100%;
           padding: 10px;
           font-size: 14px;
           border: 1px solid #ddd;
           border-radius: 8px;
           transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus, textarea:focus {
           outline: none;
           border-color: #81c784;
           box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }

        .checkbox-group, .radio-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 20px; /* Row and column gap */
          padding-top: 5px;
        }

        .checkbox-group label, .radio-group label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
        }
        
        input[type="checkbox"], input[type="radio"] {
          transform: scale(1.2);
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
        .btn-save { background-color: #4CAF50; }
        .btn-cancel { background-color: #6c757d; }
        .btn-save:hover { background-color: #43A047; transform: translateY(-1px); }
        .btn-cancel:hover { background-color: #5a6268; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .module-availability-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
          .form-grid-modal { grid-template-columns: 1fr; } /* Single column on small screens */
        }
      `}</style>

      <div className="module-availability-container">
        <div className="header-row">
          <div className="title-container">
            <h2 className="title">Module-wise Resource Availability</h2>
            <p className="subtitle">3.13.3 Details on Available Resources for Each Module</p>
          </div>
          <button className="button" onClick={() => setShowModal(true)}>Add Module Info</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th rowSpan="3">Module No.</th>
                <th colSpan="7">Category (Tick Mark Indicates Availability)</th>
                <th rowSpan="3">Details of the Resource</th>
              </tr>
              <tr>
                <th colSpan="3">Book</th>
                <th rowSpan="2">Magazine</th>
                <th colSpan="2">Journals</th>
                <th rowSpan="2">In Library?</th>
              </tr>
              <tr>
                <th>Text</th><th>Reference</th><th>Other</th>
                <th>Regular</th><th>E-Journal</th>
              </tr>
            </thead>
            <tbody>
              {moduleData.length > 0 ? (
                moduleData.map((item, i) => (
                  <tr key={i}>
                    <td>{item.module}</td>
                    <td>{item.textbook && '✔'}</td>
                    <td>{item.referenceBook && '✔'}</td>
                    <td>{item.otherBook && '✔'}</td>
                    <td>{item.magazine && '✔'}</td>
                    <td>{item.journalRegular && '✔'}</td>
                    <td>{item.journalE && '✔'}</td>
                    <td>{item.available === 'yes' ? 'Yes' : 'No'}</td>
                    <td>{item.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No module information has been added yet.</td>
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
                  <span>Add Module Resource Information</span>
                  <button type="button" className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                </div>

                <div className="modal-body">
                  {/* ✅ REPLACED TABLE WITH CSS GRID FOR A CLEAN, RESPONSIVE FORM */}
                  <div className="form-grid-modal">
                    <div className="form-group">
                      <label htmlFor="module">Module No.</label>
                      <input id="module" type="text" name="module" className="form-control" required value={moduleForm.module} onChange={handleChange} />
                    </div>
                    
                    <div className="form-group">
                      <label>Available in Library?</label>
                      <div className="radio-group">
                        <label><input type="radio" name="available" value="yes" checked={moduleForm.available === 'yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="available" value="no" checked={moduleForm.available === 'no'} onChange={handleChange} /> No</label>
                      </div>
                    </div>

                    <div className="form-group form-group-span-2">
                      <label>Category (Tick all that apply)</label>
                      <div className="checkbox-group">
                        <label><input type="checkbox" name="textbook" checked={moduleForm.textbook} onChange={handleChange} /> Textbook</label>
                        <label><input type="checkbox" name="referenceBook" checked={moduleForm.referenceBook} onChange={handleChange} /> Reference Book</label>
                        <label><input type="checkbox" name="otherBook" checked={moduleForm.otherBook} onChange={handleChange} /> Other Book</label>
                        <label><input type="checkbox" name="magazine" checked={moduleForm.magazine} onChange={handleChange} /> Magazine</label>
                        <label><input type="checkbox" name="journalRegular" checked={moduleForm.journalRegular} onChange={handleChange} /> Journal (Regular)</label>
                        <label><input type="checkbox" name="journalE" checked={moduleForm.journalE} onChange={handleChange} /> E-Journal</label>
                      </div>
                    </div>

                    <div className="form-group form-group-span-2">
                      <label htmlFor="details">Details of the Resource</label>
                      <textarea id="details" name="details" className="form-control" required value={moduleForm.details} onChange={handleChange}></textarea>
                    </div>
                  </div>
                </div>

                <div className="btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-save">Add Info</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
