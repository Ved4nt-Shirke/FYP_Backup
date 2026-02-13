import React, { useState, useEffect } from "react";

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.7)",
    zIndex: 999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "700px",
    maxHeight: "90vh", // Keep modal within viewport on mobile
    animation: "fadeIn 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    overflow: "hidden", // Ensure modal content doesn't overflow outside its rounded corners
    padding: "0",
    marginTop: "0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#999",
    fontSize: "28px",
    cursor: "pointer",
    transition: "transform 0.2s ease, color 0.2s ease",
  },
};

const WeekwisePlan = ({
  onSubmitPlan,
  initialWeek,
  existingData = [],
  onCancel,
}) => {
  const [week, setWeek] = useState(initialWeek ? `Week ${initialWeek}` : "");
  const [plans, setPlans] = useState([
    { batch: "B1", exptNo: "", exptName: "", date: "" },
    { batch: "B2", exptNo: "", exptName: "", date: "" },
    { batch: "B3", exptNo: "", exptName: "", date: "" },
  ]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialWeek) {
      setWeek(`Week ${initialWeek}`);
    }
    if (week) {
      const weekNo = parseInt(week.replace("Week ", ""));
      const filtered = existingData.filter((p) => p.weekNo === weekNo);
      if (filtered.length > 0) {
        const updatedPlans = plans.map((plan, i) => ({
          batch: plan.batch,
          exptNo: filtered[i]?.exptNo || "",
          exptName: filtered[i]?.exptName || "",
          date: filtered[i]?.date || "",
        }));
        setPlans(updatedPlans);
      } else {
        setPlans([
          { batch: "B1", exptNo: "", exptName: "", date: "" },
          { batch: "B2", exptNo: "", exptName: "", date: "" },
          { batch: "B3", exptNo: "", exptName: "", date: "" },
        ]);
      }
    }
  }, [week, initialWeek, existingData]); // Added plans to dependencies to prevent stale closure issues if plans were updated elsewhere.

  const handleChange = (index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index][field] = value;
    setPlans(updatedPlans);
  };

  const handleSubmit = () => {
    if (!week) {
      setMessage("⚠️ Please select a week.");
      return;
    }
    for (const p of plans) {
      if ((p.exptNo || p.exptName) && !p.date) {
        setMessage("⚠️ Please enter a date for all filled experiment rows.");
        return;
      }
    }
    onSubmitPlan(week, plans);
    setMessage("✅ Data submitted successfully!");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div style={modalStyles.overlay}>
      <style>{`
        /* Global font-family for consistent look */
        body {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header-weekwise {
          background: #fff;
          color: #333;
          padding: 15px 25px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          flex-shrink: 0; /* Prevent header from shrinking */
        }

        .weekwise-container {
          padding: 25px;
          /* Calculate max-height to fit between header (60px) and footer buttons (64px) */
          max-height: calc(90vh - 60px - 64px); 
          overflow-y: auto; /* Vertical scroll inside modal */
          -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
          background-color: #fff;
          font-family: 'Inter', sans-serif;
          flex-grow: 1; /* Allow content to grow and fill available space */
        }
        
        .plan-table-wrapper {
          overflow-x: auto; /* Horizontal scroll for the table */
          -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
          margin-top: 20px;
          padding-bottom: 0; /* Remove bottom gap so grid lines meet border */
          border: 1px solid #cfd4da; /* Slightly darker grey for clearer lines */
          border-radius: 10px; /* Rounded corners */
          background: #fff; /* Ensure solid background under sticky header */
          overflow: hidden; /* Clip table to rounded corners */
        }

        .plan-table {
          width: 100%;
          border-collapse: collapse; /* Ensure header/body borders meet */
          min-width: 600px; /* Minimum width to force horizontal scroll on small screens */
          table-layout: fixed; /* Ensures column widths are respected */
          border: 0; /* Use wrapper for outer border */
        }

        .plan-table th,
        .plan-table td {
          border: 1px solid #e0e0e0;
          padding: 10px 8px;
          text-align: center;
          vertical-align: middle;
          font-size: 13px;
          /* word-wrap: break-word; /* Allow long words to break within cell */
          white-space: normal; /* Allow text to wrap naturally */
        }

        .plan-table th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
          position: sticky; /* Make headers sticky for vertical scroll */
          top: 0;
          z-index: 10; /* Ensure header is above scrolling content */
        }
        
        /* Column widths: widen Batch to avoid wrap; rebalance others */
        .plan-table th:nth-child(1), .plan-table td:nth-child(1) { width: 23%; } /* Week No */
        .plan-table th:nth-child(2), .plan-table td:nth-child(2) { width: 12%; } /* Batch No */
        .plan-table th:nth-child(3), .plan-table td:nth-child(3) { width: 18%; } /* Experiment No */
        .plan-table th:nth-child(4), .plan-table td:nth-child(4) { width: 26%; } /* Experiment Name */
        .plan-table th:nth-child(5), .plan-table td:nth-child(5) { width: 21%; } /* Planned Date */

        .plan-table input,
        .plan-table select,
        .plan-table textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-table input:focus,
        .plan-table select:focus,
        .plan-table textarea:focus {
          outline: none;
          border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }

        .week-select {
          padding: 6px;
        }
        
        .action-buttons-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
            flex-shrink: 0; /* Prevent footer from shrinking */
        }

        .action-buttons-container button {
          padding: 10px 24px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .action-buttons-container button:first-child {
            background-color: #4CAF50;
            color: white;
        }
        
        .action-buttons-container button:first-child:hover {
            background-color: #43A047;
            transform: translateY(-1px);
        }
        
        .action-buttons-container button.cancel {
            background-color: #d22e2eff;
            color: white;
        }
        
        .action-buttons-container button.cancel:hover {
            background-color: #ab8686ff;
            transform: translateY(-1px);
        }
        
        .submission-message {
            margin-top: 15px;
            font-size: 14px;
            text-align: center;
            padding: 10px;
            background-color: #e6f7e6;
            border: 1px solid #28a745;
            color: #28a745;
            border-radius: 5px;
        }

        /* Mobile adjustments: Keep table as table for horizontal scroll */
        @media (max-width: 768px) {
            .weekwise-container {
              padding: 15px;
              /* Adjusted max-height slightly for mobile to account for smaller header/footer if needed,
                 but calc(90vh - 124px) should be good if header/footer heights are consistent */
              max-height: calc(90vh - 120px); 
              overflow-y: auto;
            }
            .plan-table-wrapper {
              overflow-x: auto; /* Ensure horizontal scroll remains for the table */
            }
            .plan-table {
              min-width: 600px; /* Crucial: Keep minimum width to force horizontal scroll */
            }
            /* Do NOT change table display properties to block on mobile,
               to maintain horizontal scrolling. */
            
            .action-buttons-container {
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            .action-buttons-container button {
                width: 100%;
            }
        }
      `}</style>
      <div style={modalStyles.content}>
        <div className="modal-header-weekwise">
          <span>{initialWeek ? "Edit Weekwise Plan" : "Weekwise Plan"}</span>
          <button style={modalStyles.closeBtn} onClick={onCancel} title="Close">
            &times;
          </button>
        </div>
        <div className="weekwise-container flip-animate">
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                {/* <col> tags are better used outside <thead> if you want to define column properties for the whole table.
                    For consistent column sizing, table-layout: fixed combined with direct th/td widths is more robust. */}
                <tr>
                  <th>Week No</th>
                  <th>Batch No</th>
                  <th>Experiment No</th>
                  <th>Experiment Name</th>
                  <th>Planned Date</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr key={i}>
                    {i === 0 && (
                      <td rowSpan="3">
                        <select
                          value={week}
                          onChange={(e) => setWeek(e.target.value)}
                          className="week-select"
                        >
                          <option value="">Select Week</option>
                          {Array.from({ length: 16 }, (_, i) => (
                            <option key={i + 1} value={`Week ${i + 1}`}>
                              Week {i + 1}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td>{plan.batch}</td>
                    <td>
                      <input
                        type="text"
                        value={plan.exptNo}
                        onChange={(e) =>
                          handleChange(i, "exptNo", e.target.value)
                        }
                        disabled={!week}
                      />
                    </td>
                    <td>
                      <textarea
                        value={plan.exptName}
                        onChange={(e) =>
                          handleChange(i, "exptName", e.target.value)
                        }
                        disabled={!week}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={plan.date}
                        onChange={(e) =>
                          handleChange(i, "date", e.target.value)
                        }
                        onFocus={(e) => e.target.showPicker()}
                        disabled={!week}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message && <div className="submission-message">{message}</div>}
        </div>
        <div className="action-buttons-container">
          <button onClick={handleSubmit}>
            {initialWeek ? "Update" : "Submit"}
          </button>
          <button className="cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeekwisePlan;
