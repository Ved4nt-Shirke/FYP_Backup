import React, { useState, useEffect } from 'react';

function Recommendation() {
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

  const handleSubjectTeacherSubmit = () => {
    setRecommendationEntries(prev => [...prev, { ...currentRecommendation }]);
    setCurrentRecommendation({
      unitNo: '', practicalExpt: '', nptel: false, guestLecture: false,
      ivWorkshop: false, miniProject: false, valueAdded: false, other: '', details: ''
    });
    setShowSubjectTeacher(false);
  };

  // Faculty Handlers
  const handleFacultyInput = (e) => {
    const { name, value } = e.target;
    setFacultyData(prev => ({ ...prev, [name]: value }));
  };
  const handleFacultySubmit = () => {
    setSavedRecommendation(facultyData);
    setShowFacultyForm(false);
  };

  // Cluster Handlers
  const handleClusterInput = (e) => {
    const { name, value } = e.target;
    setClusterData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmitCluster = () => {
    setSavedClusterData(clusterData);
    setShowClusterModel(false);
  };

  return (
    <>
      <style>{`
        /* Overall container and typography - Consistent with other components */
        .recommendation-container {
          padding: 30px;
          font-family: 'Inter', sans-serif; /* Changed to Inter */
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
          margin-bottom: 30px; /* More space below header */
          padding: 20px 25px; /* Increased padding */
          background-color: #fff;
          border-radius: 12px; /* Rounded corners */
          box-shadow: 0 4px 15px rgba(0,0,0,0.08); /* Subtle shadow */
        }

        /* Title - Consistent with other components */
        .title { /* Used for main section titles now */
          margin: 0;
          font-weight: 700; /* Bolder title */
          font-size: 1.2rem; /* Larger title */
          color: #28a745; /* Green color for title */
          padding-left: 0; /* Ensure no extra padding */
        }

        /* Section Title - Consistent with other components */
        .section-title { /* Kept for sub-sections */
          font-size: 1.8rem; /* Adjusted size */
          font-weight: 700;
          margin: 25px 0 15px; /* Adjusted margins */
          color: #333;
        }

        /* Main Button - Consistent with other components */
        .button { /* Renamed from button1 */
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
          float: none; /* Removed float */
          margin: 0; /* Removed specific margin */
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

        /* Table Styling - Consistent with other components */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px; /* Rounded corners for the table */
          overflow: hidden; /* Ensures rounded corners are visible */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Subtle shadow */
          table-layout: fixed; /* Fixed table layout for consistent column widths */
        }
        table th, table td {
          border: 1px solid #e0e0e0; /* Lighter borders */
          padding: 10px 8px; /* Adjusted padding */
          text-align: center;
          vertical-align: middle; /* Vertically center content */
          font-size: 13px; /* Adjusted font size */
          word-wrap: break-word; /* Allow long words to break */
        }
        table th {
          background-color: #f0f2f5; /* Light grey-blue header background */
          font-weight: 600;
          color: #495057;
          position: sticky; /* Make the header sticky */
          top: 0;          /* Stick to the top of its scroll container */
          z-index: 10;     /* Ensure it stays above scrolling content */
        }
        table tbody tr:nth-child(even) { /* Subtle zebra striping */
          background-color: #fdfdfd;
        }
        table tbody tr:hover { /* Hover effect for rows */
          background-color: #f5f5f5;
        }

        /* Modal Styling - Consistent with other components */
        .modal-backdrop { /* Renamed from modal-overlay */
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
          max-width: 900px; /* Adjusted max-width for the form */
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); /* Deeper shadow */
          overflow: hidden; /* Ensures rounded corners are respected */
          padding: 0; /* Remove padding here, add to inner sections */
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
        .close-btn {
          background: none;
          border: none;
          color: #999; /* Muted close button color */
          font-size: 28px; /* Larger close button */
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .close-btn:hover {
          color: #dc3545; /* Red on hover */
          transform: rotate(90deg);
        }
        .modal-body-content { /* New class for modal body content padding */
          padding: 25px;
          max-height: 70vh;
          overflow-y: auto;
        }

        /* Form Controls - Consistent with other components */
        .form-control { /* Used for all text/date inputs */
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

        /* Checkbox Styling */
        .form-check-input {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: #fff;
          transition: background-color 0.2s, border-color 0.2s;
        }
        .form-check-input:checked {
          background-color: #4CAF50;
          border-color: #4CAF50;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
          background-size: 100% 100%;
          background-repeat: no-repeat;
          background-position: center;
        }


        /* Button Row in Modal - Consistent with other components */
        .btn-row { /* Renamed from subcan */
          display: flex;
          justify-content: flex-end;
          gap: 15px; /* More space between buttons */
          padding: 15px 25px; /* Adjusted padding */
          background: #f8f9fa; /* Light background for button row */
          border-top: 1px solid #eee; /* Separator */
          margin-top: 25px; /* Ensure spacing from form fields */
        }
        .btn-save { /* Renamed from sub */
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
        .btn-cancel { /* Renamed from can */
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

        /* Responsive adjustments - Consistent with other components */
        @media (max-width: 1200px) {
          .recommendation-container {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .recommendation-container {
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
            padding: 100px 20px;
          }
          .section-title {
            font-size: 1.5rem;
          }
          th, td {
            font-size: 12px; /* Smaller font for tables on mobile */
            padding: 8px 6px;
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
        }

        @media (max-width: 480px) {
          .recommendation-container {
            padding: 10px;
          }
          .header-row {
            padding: 10px;
          }
          .title {
            font-size: 1.5rem;
          }
          .section-title {
            font-size: 1.3rem;
          }
          th, td {
            font-size: 11px; /* Even smaller font for tables on very small mobile */
            padding: 6px 4px;
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
        }
      `}</style>

      <div className="recommendation-container">
        {/* Faculty Recommendation Section */}
        <div className="header-row">
          <h2 className="title">3.9 Recommendations of Faculty who have taught this Subject Earlier</h2>
          <button className="button" onClick={() => setShowFacultyForm(true)}>Add Faculty Recommendation</button>
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table>
            <thead>
              <col style={{ width: '20%' }} />
              <col style={{ width: '80%' }} />
              <tr><th>Year</th><th>Recommendation</th></tr>
            </thead>
            <tbody>
              <tr><td>CY-1</td><td>{savedRecommendation.cy1 || '-'}</td></tr>
              <tr><td>CY-2</td><td>{savedRecommendation.cy2 || '-'}</td></tr>
              <tr><td>CY-3</td><td>{savedRecommendation.cy3 || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Cluster Mentor Section */}
        <div className="header-row"> {/* Re-using header-row for consistent spacing/styling */}
          <h2 className="title">3.10 Recommendations of Cluster Mentor / Industry Mentor</h2>
          <button className="button" onClick={() => setShowClusterModel(true)}>Add Cluster / Industry Mentor Recommendation</button>
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table>
            <thead>
              <col style={{ width: '30%' }} />
              <col style={{ width: '35%' }} />
              <col style={{ width: '35%' }} />
              <tr><th></th><th>Cluster Mentor</th><th>Industry Mentor</th></tr>
            </thead>
            <tbody>
              <tr><td>Meeting with</td><td>{savedClusterData.cmMeeting || '-'}</td><td>{savedClusterData.imMeeting || '-'}</td></tr>
              <tr><td>Meeting held on</td><td>{savedClusterData.cmDate || '-'}</td><td>{savedClusterData.imDate || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Subject Teacher Section */}
        <div className="header-row"> {/* Re-using header-row for consistent spacing/styling */}
          <h2 className="title">3.11 Final List of Recommendations</h2>
          <button className="button" onClick={() => setShowSubjectTeacher(true)}>Add Subject Teacher Recommendation</button>
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table>
            <thead>
              {/* Define column widths for the main table */}
              <col style={{ width: '10%' }} /> {/* Unit No */}
              <col style={{ width: '10%' }} /> {/* Practical */}
              <col style={{ width: '8%' }} />  {/* NPTEL */}
              <col style={{ width: '8%' }} />  {/* Guest */}
              <col style={{ width: '8%' }} />  {/* IV */}
              <col style={{ width: '8%' }} />  {/* Mini Project */}
              <col style={{ width: '8%' }} />  {/* Value Added */}
              <col style={{ width: '15%' }} /> {/* Other */}
              <col style={{ width: '15%' }} /> {/* Details */}
              <tr>
                <th>Unit No</th><th>Practical</th><th>NPTEL</th><th>Guest</th>
                <th>IV</th><th>Mini Project</th><th>Value Added</th><th>Other</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recommendationEntries.length > 0 ? (
                recommendationEntries.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.unitNo || '-'}</td>
                    <td>{entry.practicalExpt || '-'}</td>
                    <td><input type="checkbox" checked={entry.nptel} disabled className="form-check-input" /></td>
                    <td><input type="checkbox" checked={entry.guestLecture} disabled className="form-check-input" /></td>
                    <td><input type="checkbox" checked={entry.ivWorkshop} disabled className="form-check-input" /></td>
                    <td><input type="checkbox" checked={entry.miniProject} disabled className="form-check-input" /></td>
                    <td><input type="checkbox" checked={entry.valueAdded} disabled className="form-check-input" /></td>
                    <td>{entry.other || '-'}</td>
                    <td>{entry.details || '-'}</td>
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
      </div>

      {/* Modals */}
      {showFacultyForm && (
        <div className="modal-backdrop"> {/* Renamed class */}
          <div className="modal-box">
            <div className="modal-header"> {/* Added header structure */}
              <span>Add Faculty Recommendation</span>
              <button className="close-btn" onClick={() => setShowFacultyForm(false)}>&times;</button>
            </div>
            <div className="modal-body-content"> {/* Added for consistent padding */}
              <table>
                <thead>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '80%' }} />
                  <tr><th>Year</th><th>Recommendation</th></tr>
                </thead>
                <tbody>
                  <tr><td>CY-1</td><td><input type="text" name='cy1' value={facultyData.cy1} onChange={handleFacultyInput} className="form-control" /></td></tr>
                  <tr><td>CY-2</td><td><input type="text" name='cy2' value={facultyData.cy2} onChange={handleFacultyInput} className="form-control" /></td></tr>
                  <tr><td>CY-3</td><td><input type="text" name='cy3' value={facultyData.cy3} onChange={handleFacultyInput} className="form-control" /></td></tr>
                </tbody>
              </table>
              <div className="btn-row"> {/* Renamed class */}
                <button type="button" className="btn-save" onClick={handleFacultySubmit}>Save</button> {/* Renamed class and added type */}
                <button type="button" className="btn-cancel" onClick={() => setShowFacultyForm(false)}>Cancel</button> {/* Renamed class and added type */}
              </div>
            </div>
          </div>
        </div>
      )}

      {showClusterModel && (
        <div className="modal-backdrop"> {/* Renamed class */}
          <div className="modal-box">
            <div className="modal-header"> {/* Added header structure */}
              <span>Add Cluster / Industry Mentor Recommendation</span>
              <button className="close-btn" onClick={() => setShowClusterModel(false)}>&times;</button>
            </div>
            <div className="modal-body-content"> {/* Added for consistent padding */}
              <table>
                <thead>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '35%' }} />
                  <tr><th></th><th>Cluster Mentor</th><th>Industry Mentor</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Meeting with</td>
                    <td><input type="text" name="cmMeeting" value={clusterData.cmMeeting} onChange={handleClusterInput} className="form-control" /></td>
                    <td><input type="text" name="imMeeting" value={clusterData.imMeeting} onChange={handleClusterInput} className="form-control" /></td>
                  </tr>
                  <tr>
                    <td>Meeting held on</td>
                    <td><input type="date" name="cmDate" value={clusterData.cmDate} onChange={handleClusterInput} className="form-control" /></td>
                    <td><input type="date" name="imDate" value={clusterData.imDate} onChange={handleClusterInput} className="form-control" /></td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-row"> {/* Renamed class */}
                <button type="button" className="btn-save" onClick={handleSubmitCluster}>Save</button> {/* Renamed class and added type */}
                <button type="button" className="btn-cancel" onClick={() => setShowClusterModel(false)}>Cancel</button> {/* Renamed class and added type */}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubjectTeacher && (
        <div className="modal-backdrop"> {/* Renamed class */}
          <div className="modal-box">
            <div className="modal-header"> {/* Added header structure */}
              <span>Add Subject Teacher Recommendation</span>
              <button className="close-btn" onClick={() => setShowSubjectTeacher(false)}>&times;</button>
            </div>
            <div className="modal-body-content"> {/* Added for consistent padding */}
              <div className="table-wrapper" style={{ maxHeight: 'calc(70vh - 100px)' }}> {/* Added wrapper for scroll */}
                <table> {/* Removed recommendation-table class, using generic table styles */}
                  <thead>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <tr>
                      <th>Unit No</th><th>Practical</th><th>NPTEL</th><th>Guest</th>
                      <th>IV/Workshop</th><th>Mini Project</th><th>Value Added</th><th>Other</th><th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="text" name="unitNo" value={currentRecommendation.unitNo} onChange={handleCurrentRecommendationChange} className="form-control" /></td>
                      <td><input type="text" name="practicalExpt" value={currentRecommendation.practicalExpt} onChange={handleCurrentRecommendationChange} className="form-control" /></td>
                      <td><input type="checkbox" name="nptel" checked={currentRecommendation.nptel} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="guestLecture" checked={currentRecommendation.guestLecture} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="ivWorkshop" checked={currentRecommendation.ivWorkshop} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="miniProject" checked={currentRecommendation.miniProject} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="checkbox" name="valueAdded" checked={currentRecommendation.valueAdded} onChange={handleCurrentRecommendationChange} className="form-check-input" /></td>
                      <td><input type="text" name="other" value={currentRecommendation.other} onChange={handleCurrentRecommendationChange} className="form-control" /></td>
                      <td><input type="text" name="details" value={currentRecommendation.details} onChange={handleCurrentRecommendationChange} className="form-control" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="btn-row"> {/* Renamed class */}
                <button type="button" className="btn-save" onClick={handleSubjectTeacherSubmit}>Save</button> {/* Renamed class and added type */}
                <button type="button" className="btn-cancel" onClick={() => setShowSubjectTeacher(false)}>Cancel</button> {/* Renamed class and added type */}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Recommendation;
