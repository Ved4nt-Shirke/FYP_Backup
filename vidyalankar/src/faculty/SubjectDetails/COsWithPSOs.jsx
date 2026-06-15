import React, { useState, useEffect } from "react";
import { ciannSubjectDetailsApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function COsWithPSOs() {
  const [ciannId, setCiannId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPSOForm, setShowPSOForm] = useState(false);
  const [mappingData, setMappingData] = useState(
    Array.from({ length: 6 }, () => ({ pso1: "-", pso2: "-" }))
  );
  const [formData, setFormData] = useState(
    Array.from({ length: 6 }, () => ({ pso1: "-", pso2: "-" }))
  );

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
      if (data?.cosWithPSOs && data.cosWithPSOs.length > 0) {
        setMappingData(data.cosWithPSOs);
        setFormData(data.cosWithPSOs);
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch CO-PSO mapping'));
    } finally {
      setLoading(false);
    }
  };

  const handlePSOChange = (index, field, value) => {
    const updated = [...formData];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(updated);
  };

  const handlePSOSubmit = async () => {
    if (!ciannId) return;
    try {
      await ciannSubjectDetailsApi.updateDetails(ciannId, {
        "cosWithPSOs": formData
      });
      setMappingData(formData.map(row => ({ ...row })));
      setShowPSOForm(false);
    } catch (err) {
      alert(handleApiError(err, 'Failed to update mapping'));
    }
  };

  return (
    <div className="cos-psos-container">
      <style>{`
        /* Overall container and typography */
        .cos-psos-container {
          padding: 30px; /* Increased padding */
          font-family: 'Inter', sans-serif; /* Modern, clean font */
          background-color: #f8f9fa; /* Light background */
          min-height: 100vh;
          margin-left: 0; /* Changed to 0 to move it to the far left */
          width: 100%; /* Changed to 100% to take full available space */
          box-sizing: border-box;
          color: #333; /* Default text color */
        }

        /* Header Row */
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

        /* Main Button */
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

        /* Instruction text */
        .instruction {
          font-size: 15px; /* Slightly larger */
          margin-bottom: 20px; /* More space */
          color: #555;
          font-weight: 500;
        }

        /* Table Scroll Wrapper */
        .table-scroll-wrapper {
          max-height: 400px; /* Max height for vertical scrolling */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: auto; /* Enable horizontal scrolling */
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px; /* Rounded corners for the wrapper */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Subtle shadow */
        }

        /* Table Styling */
        table {
          width: 100%;
          min-width: 400px; /* Ensure a minimum width for horizontal scroll */
          border-collapse: collapse;
          table-layout: auto; /* Allow columns to auto-adjust */
          font-size: 14px;
        }
        th, td {
          border: 1px solid #e0e0e0; /* Lighter borders */
          padding: 12px 10px; /* Increased padding */
          text-align: center;
          vertical-align: middle; /* Vertically center content */
        }
        th {
          background-color: #f0f2f5; /* Light grey-blue header background */
          font-weight: 600;
          color: #495057;
          position: sticky; /* Make header sticky */
          top: 0; /* Stick to the top of the scrolling container */
          z-index: 1; /* Ensure header is above scrolling content */
        }
        tbody tr:nth-child(even) { /* Subtle zebra striping */
          background-color: #fdfdfd;
        }
        tbody tr:hover { /* Hover effect for rows */
          background-color: #f5f5f5;
        }

        /* Form Select in table */
        .form-select {
          width: 100%;
          padding: 6px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fefefe;
          cursor: pointer;
        }

        /* Modal Styling */
        .modal-backdrop {
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

        /* Button Row in Modal */
        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px; /* More space between buttons */
          padding: 15px 25px; /* Adjusted padding */
          background: #f8f9fa; /* Light background for button row */
          border-top: 1px solid #eee; /* Separator */
        }
        .btn-save {
          background-color: #4CAF50; /* Apple-like green */
          color: white;
          border: none;
          padding: 10px 20px; /* Adjusted padding */
          border-radius: 8px; /* More rounded */
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-save:hover {
          background-color: #43A047;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        .btn-cancel {
          background-color: #e0e0e0; /* Muted grey */
          color: #555;
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

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .cos-psos-container {
            margin-left: 0; /* Ensure it's 0 on smaller desktops too */
            width: 100%; /* Take full width */
          }
        }

        @media (max-width: 768px) {
          .cos-psos-container {
            padding: 15px;
            margin-left: 0; /* Remove margin-left on smaller screens if sidebar collapses */
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
          /* Form Controls in modal */
          .modal-body .form-select { /* Specificity for modal form controls */
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
          .cos-psos-container {
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
          .modal-body .form-select { /* Specificity for modal form controls */
            padding: 6px 8px;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="header-row">
        <h2 className="title">3.6 Mapping of COs with PSOs</h2>
        <button className="button" onClick={() => {
          setFormData(mappingData.map(row => ({ ...row }))); // Copy current data to form data
          setShowPSOForm(true);
        }}>
          Add COs with PSOs Mapping
        </button>
      </div>

      <p className="instruction">
        (Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped)
      </p>

      {/* Main table display wrapped for scrolling */}
      <div className="table-scroll-wrapper">
        <table>
          <thead>
            <tr>
              <th>COs</th>
              <th>PSO1</th>
              <th>PSO2</th>
            </tr>
          </thead>
          <tbody>
            {mappingData.map((row, idx) => (
              <tr key={idx}>
                <td>{`CO${idx + 1}`}</td>
                <td>{row.pso1}</td>
                <td>{row.pso2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form for editing/adding mappings */}
      {showPSOForm && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span>Mapping of COs with PSOs</span>
              <button onClick={() => setShowPSOForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="instruction">
                Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped
              </p>
              <table>
                <thead>
                  <tr>
                    <th>COs</th>
                    <th>PSO1</th>
                    <th>PSO2</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{`CO${idx + 1}`}</td>
                      <td>
                        <select
                          className="form-select"
                          value={row.pso1}
                          onChange={(e) => handlePSOChange(idx, "pso1", e.target.value)}
                        >
                          {["-", "3", "2", "1"].map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={row.pso2}
                          onChange={(e) => handlePSOChange(idx, "pso2", e.target.value)}
                        >
                          {["-", "3", "2", "1"].map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowPSOForm(false)}>Cancel</button>
                <button type="button" className="btn-save" onClick={handlePSOSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
