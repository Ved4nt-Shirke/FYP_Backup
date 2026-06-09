import { useState, useEffect } from "react";
import { courseOutcomesApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

function CourseOutcomes() {
  const [showCourse, setShowCourse] = useState(false);
  const [courseInput, setCourseInput] = useState(["", "", "", "", "", ""]);
  const [submittedOutcomes, setSubmittedOutcomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadCourseOutcomes();
  }, []);

  const loadCourseOutcomes = async () => {
    try {
      setLoading(true);
      const ciannId = getCurrentCiannId();
      if (!ciannId) {
        setError('No CIANN ID found. Please select a course first.');
        return;
      }
      
      const outcomes = await courseOutcomesApi.getAll(ciannId);
      const outcomeDescriptions = outcomes.map(outcome => outcome.description);
      
      // Pad with empty strings to ensure we have 6 outcomes
      while (outcomeDescriptions.length < 6) {
        outcomeDescriptions.push("");
      }
      
      setSubmittedOutcomes(outcomeDescriptions);
      setCourseInput(outcomeDescriptions);
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load course outcomes'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    const updatedInputs = [...courseInput];
    updatedInputs[index] = value;
    setCourseInput(updatedInputs);
  };

  const handleSubmitCourse = async () => {
    try {
      setLoading(true);
      const ciannId = getCurrentCiannId();
      if (!ciannId) {
        setError('No CIANN ID found. Please select a course first.');
        return;
      }

      // Filter out empty outcomes
      const nonEmptyOutcomes = courseInput.filter(outcome => outcome.trim() !== "");
      
      await courseOutcomesApi.saveAll(ciannId, nonEmptyOutcomes);
      setSubmittedOutcomes(courseInput);
      setShowCourse(false);
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to save course outcomes'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lock background scroll when modal is open
  useEffect(() => {
    if (showCourse) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showCourse]);

  return (
    <div className="container mb-5">
      <style>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px; /* More space below header */
          padding: 20px 25px; /* Increased padding */
          background-color: #fff;
          border-radius: 12px; /* Rounded corners */
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .title {
          margin-bottom: 20;
          font-weight: 700; /* Bolder title */
          font-size: 1.5rem; /* Larger title */
          color: #28a745;
        }
        .button1 {
          background-color: #28a745;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .button1:hover { background-color: #146c43; }

        table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 10px;
          text-align: center;
        }
        th { background: #f8f9fa; }

        /* ✅ Modal Styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white;
          border-radius: 10px;
          width: 90%;
          max-width: 600px;
          padding: 20px;
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-header {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
        }
        .course-input {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-save {
          margin-right: 374px;
          background-color: #198754;
          color: white;
          margiin-right 100px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-save:hover { background-color: #146c43; }
        .btn-cancel {
          background-color: #dc3545;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-cancel:hover { background-color: #bb2d3b; }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="header-row">
        <h2 className="title">3.5 Course Outcomes</h2>
        <button className="button1" onClick={() => setShowCourse(true)} disabled={loading}>
          {loading ? 'Loading...' : 'Edit Course Outcomes'}
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

      {loading && submittedOutcomes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading course outcomes...
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sr.No</th>
              <th>Course Outcomes</th>
            </tr>
          </thead>
          <tbody>
            {submittedOutcomes.length > 0 ? (
              submittedOutcomes.map((outcome, index) => (
                <tr key={index}>
                  <td>CO{index + 1}</td>
                  <td>{outcome || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No Course Outcomes added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showCourse && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">Edit Course Outcomes</div>
            {courseInput.map((value, index) => (
              <input
                key={index}
                type="text"
                className="course-input"
                placeholder={`Course Outcome ${index + 1}`}
                value={value}
                onChange={(e) => handleInputChange(index, e.target.value)}
              />
            ))}
            <div className="btn-row">
              <button className="btn-save" onClick={handleSubmitCourse} disabled={loading}>
                {loading ? 'Saving...' : 'Submit'}
              </button>
              <button className="btn-cancel" onClick={() => setShowCourse(false)} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseOutcomes;
