import { useState, useRef, useEffect } from "react";
import { ciannSubjectDetailsApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function App() { // Renamed to App for default export in Canvas
  const [ciannId, setCiannId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showResultForm, setShowResultForm] = useState(false);
  const resultInputsRef = useRef([]);
  const [results, setResults] = useState(null);

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
      if (data?.pastResults && (data.pastResults.faculty || data.pastResults.subjectPass)) {
        setResults(data.pastResults);
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch past results'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResultForm && resultInputsRef.current.length > 0) {
      // Pre-fill inputs if results exist
      if (results) {
        const flatResults = [
          ...(results.faculty || ["", "", "", ""]),
          ...(results.subjectPass || ["", "", "", ""]),
          ...(results.subjectTopper || ["", "", "", ""]),
          ...(results.overallPass || ["", "", "", ""])
        ];
        
        resultInputsRef.current.forEach((input, idx) => {
          if (input) input.value = flatResults[idx] || "";
        });
      }
      
      const firstInput = resultInputsRef.current.find(input => input);
      firstInput?.focus();
    }
  }, [showResultForm, results]);

  const handleSubmit = async () => {
    const inputValues = resultInputsRef.current.map(input => input?.value || "");

    if (inputValues.length < 16) {
      console.error("Not enough input values to process results.");
      return;
    }

    const newResults = {
      faculty: inputValues.slice(0, 4),
      subjectPass: inputValues.slice(4, 8),
      subjectTopper: inputValues.slice(8, 12),
      overallPass: inputValues.slice(12, 16),
    };

    if (!ciannId) return;
    
    try {
      await ciannSubjectDetailsApi.updateDetails(ciannId, {
        "pastResults": newResults
      });
      setResults(newResults);
      setShowResultForm(false);
    } catch (err) {
      alert(handleApiError(err, 'Failed to update past results'));
    }
  };

  return (
    <>
      <style>{`
        /* Overall container and typography */
        .past-result-container { /* Changed class name for specificity */
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

        /* Table Styling */
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

        /* Specific table column width for the first column */
        .resultTable th:first-child {
          width: 250px; /* Adjusted width for the first column */
          text-align: left;
        }

        /* Modal Styling */
        .modal-overlay { /* Renamed from popup-form */
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7); /* Darker, more opaque backdrop */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        .modal-box { /* Renamed from popup-content */
          background: white;
          border-radius: 16px; /* More rounded corners */
          width: 90%;
          max-width: 750px; /* Adjusted max-width for the form to accommodate inputs better */
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
        .modal-header { /* New header for modal */
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
        .modal-body { /* Renamed from popup-content direct padding */
          padding: 25px; /* Increased padding */
          max-height: 70vh;
          overflow-y: auto;
        }

        /* Form Controls */
        .resultForm .cyRow {
          display: grid;
          /* Adjusted grid-template-columns for better distribution */
          grid-template-columns: minmax(150px, 1.5fr) repeat(4, minmax(80px, 1fr));
          gap: 15px; /* Increased gap */
          margin-bottom: 15px;
          align-items: start; /* Align items to the start of their grid cell */
          padding: 5px 0; /* Add some padding for rows */
        }

        .leftLabel {
          font-weight: 600; /* Bolder label */
          font-size: 15px;
          text-align: left; /* Align left */
          color: #444;
          /* Ensure label takes full height of its cell */
          align-self: stretch;
          display: flex;
          align-items: center; /* Vertically center text within the label */
          word-break: break-word; /* Allow long words to break */
        }

        .shortInput {
          width: 100%; /* Make input take full width of its grid column */
          padding: 10px 12px; /* Adjusted padding */
          font-size: 15px;
          border: 1px solid #ddd; /* Lighter border */
          border-radius: 8px; /* More rounded */
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06); /* Subtle inner shadow */
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .shortInput:focus {
          outline: none;
          border-color: #81c784; /* Green focus border */
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2); /* Green glow */
        }

        .inputGroup {
          display: flex;
          flex-direction: column;
          /* Removed align-items: center and justify-content: center */
          /* Let the input and label align naturally within the column */
          align-items: flex-start; /* Align label and input to the start (left) */
          justify-content: flex-start; /* Align to the top */
          text-align: center; /* Changed to center for consistency with image */
          align-self: stretch; /* Ensure inputGroup stretches to fill the grid cell height */
        }

        .inputGroup label {
          font-size: 12px;
          margin-bottom: 4px;
          color: #666;
          font-weight: 500;
          width: 100%; /* Ensure label takes full width of its container */
          text-align: center; /* Center the label above the input */
        }

        /* Button Group in Modal */
        .btnGroup { /* Renamed from btnGroup */
          display: flex;
          justify-content: flex-end;
          gap: 15px; /* More space between buttons */
          padding: 15px 25px; /* Adjusted padding */
          background: #f8f9fa; /* Light background for button row */
          border-top: 1px solid #eee; /* Separator */
          margin-top: 25px; /* Ensure spacing from form fields */
        }

        .btn-save { /* Combined styles for submit and cancel buttons */
          margin-right: 455px;
          background-color: #4CAF50; /* Apple-like green for save */
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
        .btn-cancel{
          background-color: #af4c4cff; /* Apple-like green for save */
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
          background-color: #dc3545; /* Muted grey for cancel */
          color: white;
        }
        .btn-cancel:hover {
          background-color: #d5d5d5;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }


        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .past-result-container {
            margin-left: 0; /* Ensure it's 0 on smaller desktops too */
            width: 100%; /* Take full width */
          }
        }

        @media (max-width: 768px) {
          .past-result-container {
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
          .resultTable th:first-child {
            width: auto; /* Allow auto width on mobile */
            text-align: center; /* Center align on mobile */
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
          .resultForm .cyRow {
            grid-template-columns: 1fr; /* Stack inputs on mobile */
            gap: 10px;
          }
          .leftLabel {
            text-align: center; /* Center label on mobile */
          }
          .shortInput {
            width: 100%;
          }
          .inputGroup {
            align-items: stretch; /* Stretch inputs on mobile */
          }
          .btnGroup {
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
          .past-result-container {
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
        }
      `}</style>

      <div className="past-result-container">
        {/* Header Row */}
        <div className="header-row">
          <h2 className="title">3.8 Past Result - End Semester Examination (MSBTE)</h2>
          <button
            className="button"
            onClick={() => setShowResultForm(true)}
          >
            Add Past Result
          </button>
        </div>

        {/* Main table display */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}> {/* Added a scrollable container */}
          <table>
            <thead>
              <tr>
                <th></th>
                <th>CY-3</th>
                <th>CY-2</th>
                <th>CY-1</th>
                <th>CY (Target)</th>
              </tr>
            </thead>
            <tbody>
              {results ? (
                <>
                  <tr>
                    <td>Name of Faculty</td>
                    {results.faculty.map((val, i) => (
                      <td key={i}>{val}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Subject Passing %</td>
                    {results.subjectPass.map((val, i) => (
                      <td key={i}>{val}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Subject Topper</td>
                    {results.subjectTopper.map((val, i) => (
                      <td key={i}>{val}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Overall Passing %</td>
                    {results.overallPass.map((val, i) => (
                      <td key={i}>{val}</td>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No Data Entered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showResultForm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <span>Add Past Result - End Semester Examination (MSBTE)</span>
                <button onClick={() => setShowResultForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="resultForm">
                  <div className="cyRow">
                    <div className="leftLabel">Name of Faculty</div>
                    {["CY-3", "CY-2", "CY-1", "CY (Target)"].map((label, idx) => (
                      <div className="inputGroup" key={idx}>
                        <label>{label}</label>
                        <input
                          className="shortInput"
                          type="text"
                          ref={(el) => (resultInputsRef.current[idx] = el)}
                        />
                      </div>
                    ))}
                  </div>

                  {["Subject Passing Percentage", "Subject Topper", "Overall Passing Percentage"].map((rowLabel, rowIdx) => (
                    <div className="cyRow" key={rowIdx}>
                      <div className="leftLabel">{rowLabel}</div>
                      {[0, 1, 2, 3].map((colIdx) => {
                        const inputIndex = 4 + rowIdx * 4 + colIdx; // Correct index calculation
                        return (
                          <input
                            key={colIdx}
                            className="shortInput"
                            type="text"
                            ref={(el) => (resultInputsRef.current[inputIndex] = el)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="btnGroup">
                  <button className="btn-save" onClick={handleSubmit}>Submit</button>
                  <button className="btn-cancel" onClick={() => setShowResultForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
