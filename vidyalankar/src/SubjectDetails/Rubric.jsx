import React, { useState } from "react";

export default function Rubric() {
  const [showRubric, setShowRubric] = useState(false);
  const [submittedRubricData, setSubmittedRubricData] = useState(null);
  const [rubricFormData, setRubricFormData] = useState({
    attendance: '',
    assignments: '',
    performance: '',
    journal: '',
    tests: '',
    other: '',
    total: ''
  });

  const handleRubricChange = (e) => {
    const { name, value } = e.target;
    setRubricFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRubricSubmit = () => {
    setSubmittedRubricData(rubricFormData);
    setRubricFormData({
      attendance: '',
      assignments: '',
      performance: '',
      journal: '',
      tests: '',
      other: '',
      total: ''
    });
    setShowRubric(false);
  };

  const handleCancelRubric = () => setShowRubric(false);

  return (
    <>
      <style>{`
        /* Overall container and typography - Consistent with other components */
        .rubric-container { /* Renamed for consistency */
          padding: 30px;
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
          box-sizing: border-box;
          color: #333;
        }

        /* Header Row - Consistent with other components */
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

        /* Title - Consistent with other components */
        .title {
          margin: 0;
          font-weight: 700;
          font-size: 2rem;
          color: #28a745;
          padding-left: 0; /* Ensure no extra padding */
        }

        /* Main Button - Consistent with other components */
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
          float: none; /* Remove float */
          margin-bottom: 0; /* Remove specific margin */
        }
        .button:hover {
          background-color: #43A047;
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        .button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        /* Table Styling - Consistent with other components */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          table-layout: fixed; /* Fixed table layout for consistent column widths */
        }
        table th, table td {
          border: 1px solid #e0e0e0;
          padding: 10px 8px; /* Adjusted padding */
          text-align: center;
          vertical-align: middle;
          font-size: 13px; /* Adjusted font size */
          word-wrap: break-word; /* Allow long words to break */
        }
        table th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
          position: sticky; /* Make the header sticky */
          top: 0;          /* Stick to the top of its scroll container */
          z-index: 10;     /* Ensure it stays above scrolling content */
        }
        table tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        table tbody tr:hover {
          background-color: #f5f5f5;
        }

        /* Modal Styling - Consistent with other components */
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
          max-width: 700px;
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          padding: 0;
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

        /* Form Controls - Consistent with other components */
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
          border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }
        .form-control::placeholder {
          color: #aaa;
        }

        /* Main Heading for Rubric Table */
        .rubric-heading {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 25px 0 15px;
          color: #333;
        }

        /* Button Row in Modal - Consistent with other components */
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
          margin-right: 410px;
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
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
          background-color: #d22e2eff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-cancel:hover {
          background-color: #ab8686ff;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }

        /* Table specific styles for the modal form table */
        .modal-rubric-table {
            table-layout: fixed; /* Ensure fixed layout for modal table */
            width: 100%;
        }
        .modal-rubric-table th, .modal-rubric-table td {
            font-size: 13px;
            padding: 8px;
        }
        .modal-rubric-table input[type="text"] {
            padding: 6px;
            font-size: 13px;
            min-width: 0;
        }


        /* Responsive adjustments - Consistent with other components */
        @media (max-width: 1200px) {
          .rubric-container {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .rubric-container {
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
            padding: 0;
            width: 95%;
          }
          .modal-header {
            font-size: 18px;
            padding: 12px 20px;
          }
          .close-btn {
            font-size: 24px;
          }
          .modal-body-content {
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
          .rubric-heading {
            font-size: 1.5rem;
          }
          /* Specific adjustments for modal table on smaller screens */
          .modal-rubric-table th, .modal-rubric-table td {
            font-size: 12px;
            padding: 6px;
          }
          .modal-rubric-table input[type="text"] {
            font-size: 12px;
            padding: 4px;
          }
        }

        @media (max-width: 480px) {
          .rubric-container {
            padding: 10px;
          }
          .header-row {
            padding: 10px;
          }
          .title {
            font-size: 1.5rem;
          }
          th, td {
            font-size: 12px;
            padding: 8px 6px;
          }
          .modal-body-content {
            padding: 15px;
          }
          .modal-header {
            font-size: 16px;
            padding: 10px 15px;
          }
          .close-btn {
            font-size: 22px;
          }
          .form-control {
            padding: 6px 8px;
            font-size: 13px;
          }
          .rubric-heading {
            font-size: 1.3rem;
          }
          /* Further specific adjustments for modal table on very small screens */
          .modal-rubric-table th, .modal-rubric-table td {
            font-size: 10px;
            padding: 4px;
          }
          .modal-rubric-table input[type="text"] {
            font-size: 10px;
            padding: 3px;
          }
        }
      `}</style>

      <div className='rubric-container'>
        <div className='header-row'>
          <h2 className='title'>3.12 Rubric for Grading & Marking of Term Work</h2>
          <button className="button" onClick={() => setShowRubric(true)}>Add Rubric</button>
        </div>

        {showRubric && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Add Rubric</span>
                <button className="close-btn" onClick={handleCancelRubric}>&times;</button>
              </div>
              <div className="modal-body-content">
                <div className="table-wrapper" style={{ maxHeight: 'calc(70vh - 100px)' }}> {/* Added max-height for modal table scroll */}
                  <table className="modal-rubric-table">
                    <thead>
                      <tr>
                        {/* Define column widths for the modal table */}
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                      </tr>
                      <tr>
                        <th>Lecture + Practical<br />(% Attendance)</th>
                        <th>Assignments</th>
                        <th>Lab / Practical Performance</th>
                        <th>Lab Journal Assessment</th>
                        <th>Class Tests<br />(Other than PT)</th>
                        <th>Other Specify</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.keys(rubricFormData).map((key) => (
                          <td key={key}>
                            <input
                              type="text"
                              className="form-control"
                              name={key}
                              value={rubricFormData[key]}
                              onChange={handleRubricChange}
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="btn-row">
                  <button className="btn-save" onClick={handleRubricSubmit}>Submit</button>
                  <button className="btn-cancel" onClick={handleCancelRubric}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}> {/* Added max-height for main table scroll */}
          <table>
            <thead>
              <tr>
                {/* Define column widths for the main table */}
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
              </tr>
              <tr>
                <th>Lecture +<br />Practical<br />(%Attendance)</th>
                <th>Assignment</th>
                <th>Lab/<br />Practical<br />Performance</th>
                <th>Lab Journal<br />Assessment</th>
                <th>Class Tests<br />(Other than<br />PT)</th>
                <th>Other<br />Specify</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(rubricFormData).map((key) => (
                  <td key={key}>{submittedRubricData?.[key] || ''}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
