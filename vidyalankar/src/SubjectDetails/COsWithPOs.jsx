import React, { useState } from "react";

export default function COsWithPOs() {
  const initialMatrix = () => Array.from({ length: 6 }, () => Array(12).fill("-"));

  const [showForm, setShowForm] = useState(false);
  const [mappingData, setMappingData] = useState(initialMatrix);
  const [formData, setFormData] = useState(initialMatrix);

  const handleChange = (coIndex, poIndex, value) => {
    const updated = [...formData];
    updated[coIndex][poIndex] = value;
    setFormData(updated);
  };

  const handleSubmit = () => {
    setMappingData([...formData]);
    setShowForm(false);
  };

  return (
    <>
      <style>{`
        /* Overall container and typography - Consistent with other components */
        .cos-pos-container {
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
        .header-row { /* Renamed from top-bar for consistency */
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .header-row .title { /* Adjusted for consistency with other titles */
          margin: 0;
          font-weight: 700;
          font-size: 2rem;
          color: #28a745;
        }

        /* Main Button - Consistent with other components */
        .button { /* Renamed from edit-btn for consistency */
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

        /* Instruction text */
        .note {
          font-size: 15px;
          margin-bottom: 20px;
          color: #555;
          font-weight: 500;
        }

        /* Table Wrapper for Scrolling - Consistent with other components */
        .table-wrapper { /* Renamed from main-table-wrapper for consistency */
          overflow-x: auto;
          /* Removed overflow-y: auto and max-height from here for the modal's table-wrapper */
          margin-top: 20px; /* Spacing from header */
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        table { /* Applied to both display table and modal table */
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0; /* No margin here, handled by wrapper */
          background: #fff;
          overflow: hidden;
          table-layout: fixed; /* Use fixed layout for equal column distribution */
          font-size: 14px;
        }

        table th,
        table td {
          border: 1px solid #e0e0e0;
          padding: 10px 8px; /* Adjusted padding */
          text-align: center;
          vertical-align: middle;
        }

        table th {
          background-color: #f0f2f5;
          color: #495057;
          font-weight: 600;
          position: fixed;
          top: 0;
          z-index: 10;
        }

        table tbody tr:nth-child(even) { /* Subtle zebra striping */
          background-color: #fdfdfd;
        }
        table tbody tr:hover { /* Hover effect for rows */
          background-color: #f5f5f5;
        }

        table td:first-child {
          font-weight: 600;
          background-color: #f6f8fa;
        }

        /* Column widths for main table and modal table */
        table th:first-child,
        table td:first-child {
            width: 8%; /* COs column */
        }
        table th:not(:first-child),
        table td:not(:first-child) {
            width: 7.6%; /* Distribute remaining width (92% / 12 columns) */
        }

        table select {
          width: 100%;
          padding: 6px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #fefefe;
          cursor: pointer;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        table select:focus {
          outline: none;
          border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }

        /* Modal specific styles - Consistent with other components */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }

        .modal-box {
          background: #fff;
          border-radius: 16px;
          width: 80%;
          margin-left: 200px;
          max-width: 1200px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.3s ease-in-out;
          position: relative;
          z-index: 100000;
          overflow: hidden; /* Ensure content respects border-radius */
          display: flex;
          flex-direction: column;
          padding: 0; /* Remove padding here, add to inner sections */
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

        .modal-header span { /* Changed h4 to span for consistency */
          font-size: 1.6rem;
          color: #333;
          margin: 0;
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

        .modal-body-content { /* New class for modal body content padding and scroll */
          padding: 25px;
          max-height: 70vh; /* Limit height for scroll */
          overflow-y: auto; /* Enable vertical scroll for the entire modal body */
          display: flex; /* Use flex to manage inner content */
          flex-direction: column;
          gap: 20px; /* Space between elements in modal body */
        }

        .btn-row { /* Renamed from subcan for consistency */
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
          margin-top: auto; /* Push buttons to the bottom if content is short */
        }

        .btn-save { /* Renamed from sub for consistency */
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          font-size: 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-save:hover {
          background-color: #43A047;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }

        .btn-cancel { /* Renamed from can for consistency */
          background-color: #e0e0e0;
          color: #555;
          padding: 10px 20px;
          font-size: 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
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

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .cos-pos-container {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .cos-pos-container {
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
          .header-row .title {
            font-size: 1.7rem;
          }
          .button {
            width: 100%;
            text-align: center;
            padding: 10px 20px;
          }
          .note {
            font-size: 14px;
          }
          table th,
          table td {
            font-size: 12px;
            padding: 8px 6px;
          }
          table select {
            padding: 4px;
            font-size: 12px;
          }
          .modal-box {
            padding: 0; /* Handled by modal-body-content */
            width: 95%;
          }
          .modal-header {
            font-size: 18px;
            padding: 12px 20px;
          }
          .modal-header span {
            font-size: 1.4rem;
          }
          .close-btn {
            font-size: 24px;
          }
          .modal-body-content {
            padding: 20px;
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
          .table-wrapper {
            border-radius: 0;
            box-shadow: none;
          }
          table {
            min-width: 700px; /* Keep a minimum width for horizontal scroll on mobile */
          }
        }

        @media (max-width: 480px) {
          .cos-pos-container {
            padding: 10px;
          }
          .header-row {
            padding: 10px;
          }
          .header-row .title {
            font-size: 1.5rem;
          }
          .note {
            font-size: 13px;
          }
          table th,
          table td {
            font-size: 11px;
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
          .btn-save, .btn-cancel {
            padding: 8px 12px;
            font-size: 13px;
          }
          table {
            min-width: 600px; /* Further adjust min-width for very small screens */
          }
        }
      `}</style>

      <div className="cos-pos-container">
        <div className="header-row">
          <h2 className="title">3.5 Mapping of COs with POs</h2>
          <button className="button" onClick={() => {
            setFormData(mappingData.map(row => [...row]));
            setShowForm(true);
          }}>Add Mapping</button>
        </div>

        <p className="note">(Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped)</p>

        <div className="table-wrapper">
          <table>
            {/* Define column widths for the main table */}
            <col style={{ width: '8%' }} /> {/* COs column */}
            <col style={{ width: '7.6%' }} /> {/* PO1 */}
            <col style={{ width: '7.6%' }} /> {/* PO2 */}
            <col style={{ width: '7.6%' }} /> {/* PO3 */}
            <col style={{ width: '7.6%' }} /> {/* PO4 */}
            <col style={{ width: '7.6%' }} /> {/* PO5 */}
            <col style={{ width: '7.6%' }} /> {/* PO6 */}
            <col style={{ width: '7.6%' }} /> {/* PO7 */}
            <col style={{ width: '7.6%' }} /> {/* PO8 */}
            <col style={{ width: '7.6%' }} /> {/* PO9 */}
            <col style={{ width: '7.6%' }} /> {/* PO10 */}
            <col style={{ width: '7.6%' }} /> {/* PO11 */}
            <col style={{ width: '7.6%' }} /> {/* PO12 */}
            <thead>
              <tr>
                <th>COs</th>
                {[...Array(12)].map((_, i) => (
                  <th key={i}>PO{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappingData.map((row, i) => (
                <tr key={i}>
                  <td>CO{i + 1}</td>
                  {row.map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Mapping of COs with POs</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body-content">
                <p className="note">Mark: 3 - Strong, 2 - Moderate, 1 - Weak, Dash '-' - Not Mapped</p>

                <div className="table-wrapper"> {/* This table-wrapper now only handles horizontal scroll */}
                  <table>
                    {/* Define column widths for the modal table */}
                    <col style={{ width: '8%' }} /> {/* COs column */}
                    <col style={{ width: '7.6%' }} /> {/* PO1 */}
                    <col style={{ width: '7.6%' }} /> {/* PO2 */}
                    <col style={{ width: '7.6%' }} /> {/* PO3 */}
                    <col style={{ width: '7.6%' }} /> {/* PO4 */}
                    <col style={{ width: '7.6%' }} /> {/* PO5 */}
                    <col style={{ width: '7.6%' }} /> {/* PO6 */}
                    <col style={{ width: '7.6%' }} /> {/* PO7 */}
                    <col style={{ width: '7.6%' }} /> {/* PO8 */}
                    <col style={{ width: '7.6%' }} /> {/* PO9 */}
                    <col style={{ width: '7.6%' }} /> {/* PO10 */}
                    <col style={{ width: '7.6%' }} /> {/* PO11 */}
                    <col style={{ width: '7.6%' }} /> {/* PO12 */}
                    <thead>
                      <tr>
                        <th>COs</th>
                        {[...Array(12)].map((_, i) => (
                          <th key={i}>PO{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.map((row, i) => (
                        <tr key={i}>
                          <td>CO{i + 1}</td>
                          {row.map((val, j) => (
                            <td key={j}>
                              <select value={val} onChange={(e) => handleChange(i, j, e.target.value)}>
                                {["-", "3", "2", "1"].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="btn-row">
                  <button type="button" className="btn-save" onClick={handleSubmit}>Submit</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
