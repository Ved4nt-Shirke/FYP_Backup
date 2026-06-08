import React, { useState, useEffect } from 'react';

export default function KnowledgeMap() {
  const [showForm, setShowForm] = useState(false);
  const [tableData, setTableData] = useState(null);

  const handleFormSubmit = (data) => {
    if (data) {
      setTableData(data);
    }
    setShowForm(false);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to reset overflow when component unmounts or showForm changes
    return () => (document.body.style.overflow = 'auto');
  }, [showForm]);

  return (
    <>
      <style>{`
        /* Overall container and typography */
        .knowledge-map-container { /* Changed class name for specificity */
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

        /* Image in table */
        table img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto; /* Center the image */
          border-radius: 8px; /* Rounded corners for images */
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* Modal Styling */
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

        /* Form Controls */
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
          margin-right: 415px;
          background-color: #4CAF50; /* Apple-like green */
          color: white;
          border: none;
          padding: 10px 25px; /* Adjusted padding */
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
          background-color: #dc3545;/* Muted grey */
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

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .knowledge-map-container {
            margin-left: 0; /* Ensure it's 0 on smaller desktops too */
            width: 100%; /* Take full width */
          }
        }

        @media (max-width: 768px) {
          .knowledge-map-container {
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
          .knowledge-map-container {
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

      <div className="knowledge-map-container mb-5"> {/* Updated class name */}
        <div className="header-row">
          <h2 className="title">3.3 Knowledge Map</h2>
          <button className="button" onClick={() => setShowForm(true)}>
            {tableData ? 'Edit Knowledge Map' : 'Add Knowledge Map'}
          </button>
        </div>

        {/* Added a scrollable container for the table */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table>
            <thead>
              <tr>
                <th colSpan="2">Pre-Requisite (Academic)</th>
                <th colSpan="2">Relevance to Future Subjects</th>
                <th rowSpan="2">Application</th>
                <th rowSpan="2">Knowledge Map</th>
              </tr>
              <tr>
                <th>Sem</th>
                <th>Course</th>
                <th>Sem</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {tableData ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td>{tableData.preSem[i]}</td>
                    <td>{tableData.preCourse[i]}</td>
                    <td>{tableData.futureSem[i]}</td>
                    <td>{tableData.futureCourse[i]}</td>
                    {i === 0 && (
                      <>
                        <td rowSpan="3">{tableData.application}</td>
                        <td rowSpan="3">
                          {tableData.file && (
                            <img
                              src={URL.createObjectURL(tableData.file)}
                              alt="Map"
                              style={{ maxWidth: '200px', borderRadius: '8px' }}
                            />
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No Knowledge Map added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>{tableData ? 'Edit Knowledge Map' : 'Add Knowledge Map'}</span>
                <button onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <KnowledgeMapForm
                  onSubmit={handleFormSubmit}
                  initialData={tableData}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function KnowledgeMapForm({ onSubmit, initialData, onCancel }) {
  const [preSem, setPreSem] = useState(initialData?.preSem || ['', '', '']);
  const [preCourse, setPreCourse] = useState(initialData?.preCourse || ['', '', '']);
  const [futureSem, setFutureSem] = useState(initialData?.futureSem || ['', '', '']);
  const [futureCourse, setFutureCourse] = useState(initialData?.futureCourse || ['', '', '']);
  const [application, setApplication] = useState(initialData?.application || '');
  const [file, setFile] = useState(initialData?.file || null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ preSem, preCourse, futureSem, futureCourse, application, file });
  };

  return (
    <form onSubmit={handleSubmit}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}> {/* Adjusted margin-bottom */}
          <input className="form-control" placeholder="Pre Sem" value={preSem[i]} onChange={(e) => {
            const arr = [...preSem];
            arr[i] = e.target.value;
            setPreSem(arr);
          }} />
          <input className="form-control" placeholder="Pre Course" value={preCourse[i]} onChange={(e) => {
            const arr = [...preCourse];
            arr[i] = e.target.value;
            setPreCourse(arr);
          }} />
          <input className="form-control" placeholder="Future Sem" value={futureSem[i]} onChange={(e) => {
            const arr = [...futureSem];
            arr[i] = e.target.value;
            setFutureSem(arr);
          }} />
          <input className="form-control" placeholder="Future Course" value={futureCourse[i]} onChange={(e) => {
            const arr = [...futureCourse];
            arr[i] = e.target.value;
            setFutureCourse(arr);
          }} />
        </div>
      ))}
      <textarea
        className="form-control"
        placeholder="Application"
        value={application}
        onChange={(e) => setApplication(e.target.value)}
        style={{ marginBottom: '15px' }} /* Adjusted margin-bottom */
      />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="form-control" style={{ marginBottom: '15px' }} /> {/* Adjusted margin-bottom */}
      <div className="btn-row">
        <button type="submit" className="btn-save">Save</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
