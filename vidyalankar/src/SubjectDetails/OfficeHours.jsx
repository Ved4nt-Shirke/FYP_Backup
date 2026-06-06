import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function OfficeHours() {
  const { unifiedData, updateUnifiedData } = useOutletContext();
  const officeHours = unifiedData?.officeHours || { day: "", time: "", venue: "", informed: false };

  const [showForm, setShowForm] = useState(false);
  const [formDay, setFormDay] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formInformed, setFormInformed] = useState(false);

  // Prefill form when showForm changes
  useEffect(() => {
    if (showForm) {
      setFormDay(officeHours.day || "");
      setFormTime(officeHours.time || "");
      setFormVenue(officeHours.venue || "");
      setFormInformed(officeHours.informed || false);
    }
  }, [showForm, officeHours]);

  const handleSubmit = () => {
    updateUnifiedData("officeHours", {
      day: formDay,
      time: formTime,
      venue: formVenue,
      informed: formInformed
    });
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
        /* Overall container and typography - Consistent with other components */
        .office-hours-container { /* Renamed from office-hours-page for consistency */
          padding: 30px;
          font-family: 'Inter', sans-serif; /* Changed to Inter for consistency */
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
        .title {
          margin: 0;
          font-weight: 700; /* Bolder title */
          font-size: 2rem; /* Larger title */
          color: #28a745; /* Green color for title */
          padding-left: 0; /* Removed specific padding-left */
        }

        /* Main Button - Consistent with other components */
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
          margin-right: 0; /* Removed specific margin-right */
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

        /* Instruction text - Consistent with other components */
        .instruction {
          font-size: 15px; /* Slightly larger */
          margin-bottom: 20px; /* More space */
          color: #555;
          font-weight: 500;
          margin-left: 0; /* Removed specific margin-left */
          padding-left: 0; /* Ensure no extra padding */
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
          table-layout: auto; /* Allow columns to auto-adjust */
        }
        table th, table td { /* Changed from .table th, .table td */
          border: 1px solid #e0e0e0; /* Lighter borders */
          padding: 12px 10px; /* Increased padding */
          text-align: center;
          vertical-align: middle; /* Vertically center content */
          font-size: 14px;
        }
        table th { /* Changed from .table th */
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
        .modal-backdrop { /* Renamed from modal-overlay for consistency */
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
          padding: 25px; /* Increased padding */
          max-height: 70vh;
          overflow-y: auto;
        }

        /* Form Controls - Consistent with other components */
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

        /* Form Labels */
        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #444;
          font-size: 14px;
        }

        /* Checkbox Styling */
        .form-check {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
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
        .form-check-label {
          font-size: 14px;
          color: #555;
          cursor: pointer;
        }


        /* Button Row in Modal - Consistent with other components */
        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px; /* More space between buttons */
          padding: 15px 25px; /* Adjusted padding */
          background: #f8f9fa; /* Light background for button row */
          border-top: 1px solid #eee; /* Separator */
          margin-top: 25px; /* Ensure spacing from form fields */
        }
        .btn-save {
          margin-right: 455px;
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

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Responsive adjustments - Consistent with other components */
        @media (max-width: 1200px) {
          .office-hours-container {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .office-hours-container {
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
            padding: 0; /* Adjusted for inner padding */
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
          .office-hours-container {
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

      <div className="office-hours-container mb-5">
        <div className="header-row">
          <h2 className="title">3.2 Office Hours</h2>
          <button className="button" onClick={() => setShowForm(true)}>
            Edit Office Hours
          </button>
        </div>
        <p className="instruction mb-3">
          Staff must remain at office in this duration for solving students query
        </p>

        {/* Added a scrollable container for the table */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table> {/* Changed className to table for consistency with CSS */}
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Informed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officeHours.day || officeHours.time || officeHours.venue ? (
                <tr>
                  <td>{officeHours.day}</td>
                  <td>{officeHours.time}</td>
                  <td>{officeHours.venue}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={officeHours.informed || false}
                      onChange={() => {
                        updateUnifiedData("officeHours", {
                          ...officeHours,
                          informed: !officeHours.informed
                        });
                      }}
                      style={{ /* Inline style for checkbox for quick visual check */
                        width: '20px',
                        height: '20px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        backgroundColor: '#fff',
                        transition: 'background-color 0.2s, border-color 0.2s'
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button className="button2" style={{ padding: "6px 14px", fontSize: "13px" }} onClick={() => setShowForm(true)}>Edit</button>
                      <button className="button-delete" style={{ padding: "6px 14px", fontSize: "13px", backgroundColor: "#d32f2f", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }} onClick={() => {
                        if (window.confirm("Delete Office Hours details?")) {
                          updateUnifiedData("officeHours", { day: "", time: "", venue: "", informed: false });
                        }
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
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

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Edit Office Hours</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              {/* Added a div for modal body content padding */}
              <div className="modal-body-content">
                <label className="form-label">Select Weekday</label>
                <select
                  className="form-control" // Removed mb-2 as form-control has its own margin-bottom
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                >
                  <option value="">Select</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayOption) => (
                    <option key={dayOption} value={dayOption}>{dayOption}</option>
                  ))}
                </select>

                <label className="form-label">Time</label>
                <input
                  className="form-control" // Removed mb-2
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />

                <label className="form-label">Venue</label>
                <input
                  className="form-control" // Removed mb-2
                  type="text"
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                />

                <div className="form-check"> {/* Removed mb-3 as form-control has its own margin-bottom */}
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formInformed}
                    onChange={(e) => setFormInformed(e.target.checked)}
                    id="informedCheckbox"
                  />
                  <label className="form-check-label" htmlFor="informedCheckbox">
                    Tick if Informed Students
                  </label>
                </div>

                {/* Button row is outside modal-body-content to maintain consistent padding/background */}
              </div>
              <div className="btn-row">
                <button type="button" className="btn-save" onClick={handleSubmit}>Submit</button>
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
