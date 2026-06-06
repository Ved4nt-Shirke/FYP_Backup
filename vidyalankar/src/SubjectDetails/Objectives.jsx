import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Objectives() {
  const { unifiedData, updateUnifiedData } = useOutletContext();
  const submittedData = unifiedData?.objectives || { cognitive: "", affective: "", behavioral: "" };

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cognitive: "",
    affective: "",
    behavioral: ""
  });

  // Prefill form when showForm changes
  useEffect(() => {
    if (showForm) {
      setFormData({
        cognitive: submittedData.cognitive || "",
        affective: submittedData.affective || "",
        behavioral: submittedData.behavioral || ""
      });
    }
  }, [showForm, submittedData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUnifiedData("objectives", formData);
    setShowForm(false);
  };

  // ✅ Lock background scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showForm]);

  return (
    <>
      <style>{`
        /* Overall container and typography - Copied from KnowledgeMap */
        .objectives-container { /* Changed class name for specificity */
          padding: 30px; /* Increased padding */
          font-family: 'Inter', sans-serif; /* Modern, clean font */
          background-color: #f8f9fa; /* Light background */
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
          box-sizing: border-box;
          color: #333; /* Default text color */
        }

        /* Header Row - Copied from KnowledgeMap */
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px; /* More space below header */
          padding: 20px 25px; /* Increased padding */
          background-color: #fff;
          border-radius: 12px; /* Rounded corners */
          box-shadow: 0 4px 15px rgba(0,0,0,0.08); /* Subtle shadow */
        }

        .title {
          margin: 0;
          font-weight: 700; /* Bolder title */
          font-size: 2rem; /* Larger title */
          color: #28a745; /* Green color for title */
        }

        /* Main Button - Copied from KnowledgeMap */
        .button {
          background-color: #4CAF50; /* Apple-like green */
          color: white;
          padding: 12px 24px; /* Generous padding */
          border: none;
          font-size: 16px; /* Slightly larger font */
          font-weight: 600; /* Semi-bold */
          border-radius: 10px; /* More rounded */
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15); /* Prominent shadow */
        }
        .button:hover {
          background-color: #43A047; /* Darker green on hover */
          transform: translateY(-2px); /* Lift effect */
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        .button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        /* Table Styling - Copied from KnowledgeMap, with sticky header */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px; /* Rounded corners for the table */
          overflow: hidden; /* Ensures rounded corners are visible */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Subtle shadow */
          table-layout: auto; /* Allow columns to auto-adjust */
        }
        th, td {
          border: 1px solid #e0e0e0; /* Lighter borders */
          padding: 12px 10px; /* Increased padding */
          text-align: center;
          vertical-align: middle; /* Vertically center content */
          font-size: 14px;
        }
        th {
          background-color: #f0f2f5; /* Light grey-blue header background */
          font-weight: 600;
          color: #495057;
          position: sticky; /* Make the header sticky */
          top: 0;          /* Stick to the top of its scroll container */
          z-index: 10;     /* Ensure it stays above scrolling content */
        }
        tbody tr:nth-child(even) { /* Subtle zebra striping */
          background-color: #fdfdfd;
        }
        tbody tr:hover { /* Hover effect for rows */
          background-color: #f5f5f5;
        }

        /* Modal Styling - Copied from KnowledgeMap */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7); /* Darker, more opaque backdrop */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        .modal-box {
          background: white;
          border-radius: 16px; /* More rounded corners */
          width: 90%;
          max-width: 700px; /* Adjusted max-width for the form */
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); /* Deeper shadow */
          overflow: hidden; /* Ensures rounded corners are respected */
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff; /* Match modal box background */
          color: #333; /* Dark text for header */
          padding: 15px 25px; /* Adjusted padding */
          font-size: 20px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee; /* Subtle separator */
        }
        .modal-header button {
          background: none;
          border: none;
          color: #999; /* Muted close button color */
          font-size: 28px; /* Larger close button */
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover {
          color: #dc3545; /* Red on hover */
          transform: rotate(90deg);
        }
        .modal-body {
          padding: 25px; /* Increased padding */
          max-height: 70vh;
          overflow-y: auto;
        }

        /* Form Controls - Adapted for textareas */
        .form-control {
          width: 100%;
          padding: 10px 12px; /* Adjusted padding */
          margin-bottom: 15px; /* More space between inputs */
          border: 1px solid #ddd; /* Lighter border */
          border-radius: 8px; /* More rounded */
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06); /* Subtle inner shadow */
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
          outline: none;
          border-color: #81c784; /* Green focus border */
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2); /* Green glow */
        }
        .form-control::placeholder {
          color: #aaa;
        }

        /* Button Row in Modal - Copied from KnowledgeMap */
        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px; /* More space between buttons */
          padding: 15px 25px; /* Adjusted padding */
          background: #f8f9fa; /* Light background for button row */
          border-top: 1px solid #eee; /* Separator */
        }
        .btn-save {
          margin-right: 465px; 
          background-color: #198754;
          color: white;
          padding: 8px 20px;
          border: none;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-save:hover {
          background-color: #43A047;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        .btn-cancel {
          background-color: #dc3545; /* Muted grey */
          color: white;
          border: none;
          padding: 10px 20px; /* Adjusted padding */
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-cancel:hover {
          background-color: #d5d5d5;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }

        /* Responsive adjustments - Copied from KnowledgeMap */
        @media (max-width: 1200px) {
          .objectives-container {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .objectives-container {
            padding: 15px;
            margin-left: 0;
            width: 100%;
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
            padding: 10px 20px;
          }
          th, td {
            font-size: 13px;
            padding: 10px 8px;
          }
          .modal-box {
            padding: 20px;
            width: 95%;
          }
          .modal-header {
            font-size: 18px;
            padding: 12px 20px;
          }
          .modal-header button {
            font-size: 24px;
          }
          .modal-body {
            padding: 20px;
          }
          .form-control {
            padding: 8px 10px;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .btn-row {
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 15px;
          }
          .btn-save, .btn-cancel {
            width: 100%;
            padding: 10px 15px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .objectives-container {
            padding: 10px;
          }
          .header-row {
            padding: 10px;
          }
          .title {
            font-size: 1.5rem;
          }
          .instruction {
            font-size: 13px;
          }
          th, td {
            font-size: 12px;
            padding: 8px 6px;
          }
          .modal-body {
            padding: 15px;
          }
          .modal-header {
            font-size: 16px;
            padding: 10px 15px;
          }
          .modal-header button {
            font-size: 22px;
          }
          .form-control {
            padding: 6px 8px;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="objectives-container mb-5">
        <div className="header-row">
          <h2 className="title">3.4 Objectives of the Course</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button" onClick={() => setShowForm(true)}>
              {submittedData.cognitive ? 'Edit Objectives' : 'Add Course Objectives'}
            </button>
            {submittedData.cognitive && (
              <button className="button-delete" style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {
                if (window.confirm("Delete Course Objectives?")) {
                  updateUnifiedData("objectives", { cognitive: "", affective: "", behavioral: "" });
                }
              }}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Added a scrollable container for the table */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table>
            <thead>
              {/* Added a dummy header row for sticky functionality, as your table body has no <th> */}
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Objective</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cognitive</strong></td>
                <td>What do you want students to Know?</td>
                <td>{submittedData.cognitive || "-"}</td>
              </tr>
              <tr>
                <td><strong>Affective</strong></td>
                <td>What do you want students to think/care about?</td>
                <td>{submittedData.affective || "-"}</td>
              </tr>
              <tr>
                <td><strong>Behavioral</strong></td>
                <td>What do you want students to be able to do?</td>
                <td>{submittedData.behavioral || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                Add Course Objectives
                <button className="close-btn" onClick={() => setShowForm(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <textarea // Changed to textarea for potentially longer inputs
                  className="form-control"
                  placeholder="Cognitive (What do you want students to Know?)"
                  name="cognitive"
                  value={formData.cognitive}
                  onChange={handleChange}
                  rows="3" // Added rows for better textarea sizing
                  required
                />
                <textarea // Changed to textarea
                  className="form-control"
                  placeholder="Affective (What do you want students to think/care about?)"
                  name="affective"
                  value={formData.affective}
                  onChange={handleChange}
                  rows="3"
                  required
                />
                <textarea // Changed to textarea
                  className="form-control"
                  placeholder="Behavioral (What do you want students to be able to do?)"
                  name="behavioral"
                  value={formData.behavioral}
                  onChange={handleChange}
                  rows="3"
                  required
                />

                <div className="btn-row">
                  <button type="submit" className="btn-save">
                    Submit
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                    Cancel
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
