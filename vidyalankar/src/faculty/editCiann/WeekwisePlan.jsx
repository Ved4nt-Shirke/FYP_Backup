import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config, getApiUrl } from "../../config/api";

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
    width: "95%",
    maxWidth: "1250px",
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
  ciannData,
  llHours = 2,
}) => {
  const [week, setWeek] = useState(initialWeek ? `Week ${initialWeek}` : "");
  const [plans, setPlans] = useState([
    { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" },
    { batch: "B2", co: "", llo: "", exptNo: "", exptName: "", date: "" },
    { batch: "B3", co: "", llo: "", exptNo: "", exptName: "", date: "" },
  ]);
  const [message, setMessage] = useState("");
  const [experiments, setExperiments] = useState([]);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [coData, setCoData] = useState([]);
  const [openLloDropdownIndex, setOpenLloDropdownIndex] = useState(null);
  const dropdownRefs = React.useRef([]);

  // Fetch TloLlo details for CO and LLO dropdowns
  useEffect(() => {
    if (!ciannData) return;
    const fetchTloLlo = async () => {
      try {
        const token = localStorage.getItem("token");
        const subjectId = ciannData.subject?._id || ciannData.subjectId;
        const res = await fetch(
          getApiUrl(`/subject-details/tlo-llo/${ciannData.ciannId}/${subjectId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data.coData)) {
          setCoData(data.data.coData);
        } else {
          // Fallback
          const courseDetailsRes = await fetch(
            getApiUrl(`/pt-microproject/new/course-details/${subjectId}`),
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const courseDetailsData = await courseDetailsRes.json();
          if (courseDetailsData.success && courseDetailsData.courseDetails) {
            const loadedCOs = courseDetailsData.courseDetails.courseOutcomes || [];
            setCoData(loadedCOs.map(c => ({ coNumber: c.coNumber, coDescription: c.description, tlos: [], llos: [] })));
          }
        }
      } catch (err) {
        console.error("Error fetching TloLlo mappings in Lab Plan:", err);
      }
    };
    fetchTloLlo();
  }, [ciannData]);

  // Fetch experiments based on ciann data
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!ciannData) return;

      setLoadingExperiments(true);
      try {
        const payload = {
          program: ciannData.department?.name || ciannData.department,
          className: ciannData.courseCode || ciannData.class || "",
          course: ciannData.subject?.name || ciannData.subject,
        };

        console.log("Fetching experiments with payload:", payload);

        const response = await axios.post(config.course.experiments, payload);
        
        if (response.data.success && response.data.experiments) {
          setExperiments(response.data.experiments);
          console.log("Fetched experiments:", response.data.experiments);
        } else {
          setExperiments([]);
          console.log("No experiments found");
        }
      } catch (error) {
        console.error("Error fetching experiments:", error);
        setExperiments([]);
      } finally {
        setLoadingExperiments(false);
      }
    };

    fetchExperiments();
  }, [ciannData]);

  useEffect(() => {
    if (initialWeek) {
      setWeek(`Week ${initialWeek}`);
    }
    if (week) {
      const weekNo = parseInt(week.replace("Week ", ""));
      const filtered = existingData.filter((p) => p.weekNo === weekNo);
      if (filtered.length > 0) {
        setPlans(
          filtered.map((item) => ({
            batch: item.batch || "B1",
            co: item.co || "",
            llo: item.llo || "",
            exptNo: item.exptNo || "",
            exptName: item.exptName || "",
            date: item.date || "",
          }))
        );
      } else {
        if (llHours >= 4) {
          setPlans([
            { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B2", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B2", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B3", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B3", co: "", llo: "", exptNo: "", exptName: "", date: "" },
          ]);
        } else {
          setPlans([
            { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B2", co: "", llo: "", exptNo: "", exptName: "", date: "" },
            { batch: "B3", co: "", llo: "", exptNo: "", exptName: "", date: "" },
          ]);
        }
      }
    }
  }, [week, initialWeek, existingData, llHours]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openLloDropdownIndex !== null) {
        const ref = dropdownRefs.current[openLloDropdownIndex];
        if (ref && !ref.contains(event.target)) {
          setOpenLloDropdownIndex(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openLloDropdownIndex]);

  const handleChange = (index, field, value) => {
    const updatedPlans = [...plans];
    
    if (field === "exptNo") {
      // When experiment number changes, auto-fill the experiment name
      const selectedExperiment = experiments.find(
        (exp) => String(exp.practicalNo) === String(value)
      );
      updatedPlans[index].exptNo = value;
      updatedPlans[index].exptName = selectedExperiment ? selectedExperiment.practicalName : "";
    } else {
      updatedPlans[index][field] = value;
    }
    
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

        .co-badges-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .co-badge-btn {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .co-badge-btn:hover:not(:disabled) {
          background-color: #e5e7eb;
          color: #1f2937;
        }
        .co-badge-btn.active {
          background-color: #e3f2fd;
          color: #1565c0;
          border-color: #90caf9;
        }
        .co-badge-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .llo-dropdown-container {
          position: relative;
          width: 100%;
        }
        .llo-dropdown-trigger {
          width: 100%;
          padding: 8px 10px;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          text-align: left;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
        }
        .llo-dropdown-trigger:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .llo-trigger-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .llo-trigger-arrow {
          font-size: 10px;
          color: #888;
          margin-left: 5px;
        }
        .llo-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          text-align: left;
          margin-top: 4px;
        }
        .llo-dropdown-item {
          display: flex;
          align-items: flex-start;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s ease;
          user-select: none;
          border-bottom: 1px solid #f0f0f0;
        }
        .llo-dropdown-item:last-child {
          border-bottom: none;
        }
        .llo-dropdown-item:hover {
          background-color: #f5f7fa;
        }
        .llo-dropdown-item input[type="checkbox"] {
          margin-right: 8px;
          margin-top: 3px;
          width: 14px;
          height: 14px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .llo-item-text {
          line-height: 1.4;
          color: #333;
        }
        .llo-dropdown-empty {
          padding: 12px;
          color: #888;
          font-size: 12px;
          text-align: center;
        }
        
        .add-row-btn {
          background-color: #28a745 !important;
          color: white !important;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .add-row-btn:hover:not(:disabled) {
          background-color: #218838 !important;
        }
        .add-row-btn:disabled {
          background-color: #e9ecef !important;
          color: #6c757d !important;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .delete-row-btn {
          background-color: #f8d7da !important;
          color: #842029 !important;
          border: 1px solid #f5c2c7;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .delete-row-btn:hover:not(:disabled) {
          background-color: #ea868f !important;
          color: white !important;
          border-color: #ea868f;
        }
        .delete-row-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .batch-select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
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
          min-width: 1150px; /* Minimum width to force horizontal scroll on small screens */
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
        
        /* Column widths */
        .plan-table th:nth-child(1), .plan-table td:nth-child(1) { width: 8%; }  /* Week No */
        .plan-table th:nth-child(2), .plan-table td:nth-child(2) { width: 8%; }  /* Batch No */
        .plan-table th:nth-child(3), .plan-table td:nth-child(3) { width: 8%; }  /* CO */
        .plan-table th:nth-child(4), .plan-table td:nth-child(4) { width: 22%; } /* LLO */
        .plan-table th:nth-child(5), .plan-table td:nth-child(5) { width: 8%; }  /* Experiment No */
        .plan-table th:nth-child(6), .plan-table td:nth-child(6) { width: 32%; } /* Experiment Name */
        .plan-table th:nth-child(7), .plan-table td:nth-child(7) { width: 10%; } /* Planned Date */
        .plan-table th:nth-child(8), .plan-table td:nth-child(8) { width: 4%; }  /* Action */

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
          background-color: white;
        }
        .plan-table input:focus,
        .plan-table select:focus,
        .plan-table textarea:focus {
          outline: none;
          border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }
        
        .plan-table textarea[readonly] {
          background-color: #f5f5f5;
          cursor: default;
        }
        
        .plan-table select {
          cursor: pointer;
        }
        
        .plan-table select:disabled,
        .plan-table input:disabled,
        .plan-table textarea:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
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
          {loadingExperiments && (
            <div style={{ 
              padding: "10px", 
              background: "#e3f2fd", 
              borderRadius: "5px", 
              marginBottom: "10px",
              textAlign: "center",
              color: "#1976d2"
            }}>
              Loading experiments...
            </div>
          )}
          {!loadingExperiments && experiments.length === 0 && ciannData && (
            <div style={{ 
              padding: "10px", 
              background: "#fff3cd", 
              borderRadius: "5px", 
              marginBottom: "10px",
              textAlign: "center",
              color: "#856404"
            }}>
              No experiments found for this subject. Please add experiments first.
            </div>
          )}
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                <tr>
                  <th>Week No</th>
                  <th>Batch No</th>
                  <th>CO</th>
                  <th>LLO</th>
                  <th>Experiment No</th>
                  <th>Experiment Name</th>
                  <th>Planned Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr key={i}>
                    {i === 0 && (
                      <td rowSpan={plans.length}>
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
                    <td>
                      <select
                        value={plan.batch}
                        onChange={(e) => handleChange(i, "batch", e.target.value)}
                        disabled={!week}
                        className="batch-select"
                      >
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B3">B3</option>
                        <option value="B4">B4</option>
                        <option value="B5">B5</option>
                        <option value="B6">B6</option>
                      </select>
                    </td>
                    <td>
                      <div className="co-badges-container">
                        {coData.map((co) => {
                          const selectedCOs = plan.co ? plan.co.split(",").map(c => c.trim()) : [];
                          const isSelected = selectedCOs.includes(co.coNumber);
                          return (
                            <button
                              key={co.coNumber}
                              type="button"
                              className={`co-badge-btn ${isSelected ? "active" : ""}`}
                              onClick={() => {
                                let nextCOs;
                                if (isSelected) {
                                  nextCOs = selectedCOs.filter((c) => c !== co.coNumber);
                                } else {
                                  nextCOs = [...selectedCOs, co.coNumber];
                                }
                                nextCOs.sort();
                                
                                const updated = [...plans];
                                updated[i].co = nextCOs.join(", ");
                                
                                // Build valid LLO labels for remaining selected COs
                                const validLloLabels = new Set();
                                coData
                                  .filter((c) => nextCOs.includes(c.coNumber))
                                  .forEach((c) => {
                                    const coNum = c.coNumber.replace(/\D/g, '') || '1';
                                    (c.llos || []).forEach((_, idx) => {
                                      validLloLabels.add(`${coNum}.${idx + 1}`);
                                    });
                                  });
                                const currentLlos = plan.llo ? plan.llo.split(",").map(l => l.trim()) : [];
                                const validLlos = currentLlos.filter(label => validLloLabels.has(label));
                                updated[i].llo = validLlos.join(", ");
                                
                                setPlans(updated);
                              }}
                              disabled={!week}
                              title={co.coDescription}
                            >
                              {co.coNumber}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div 
                        className="llo-dropdown-container" 
                        ref={(el) => (dropdownRefs.current[i] = el)}
                      >
                        <button
                          type="button"
                          className="llo-dropdown-trigger"
                          onClick={() => setOpenLloDropdownIndex(openLloDropdownIndex === i ? null : i)}
                          disabled={!week || !plan.co}
                        >
                          <span className="llo-trigger-text">
                            {plan.llo && plan.llo.split(",").map(l => l.trim()).filter(Boolean).length > 0
                              ? plan.llo.split(",").map(l => l.trim()).filter(Boolean).join(", ")
                              : "Select LLOs"}
                          </span>
                          <span className="llo-trigger-arrow">▼</span>
                        </button>
                        
                        {openLloDropdownIndex === i && (
                          <div className="llo-dropdown-menu">
                            {(() => {
                              const selectedCOs = plan.co ? plan.co.split(",").map(c => c.trim()) : [];
                              // Build LLO list with numbers (coNum.idx) and full text
                              const availableLlosWithNums = [];
                              coData
                                .filter(c => selectedCOs.includes(c.coNumber))
                                .forEach(c => {
                                  const coNum = c.coNumber.replace(/\D/g, '') || '1';
                                  (c.llos || []).forEach((lloText, lloIdx) => {
                                    const trimmed = lloText.trim();
                                    if (trimmed) {
                                      availableLlosWithNums.push({
                                        label: `${coNum}.${lloIdx + 1}`,
                                        value: trimmed,
                                      });
                                    }
                                  });
                                });
                              // Deduplicate by value
                              const seen = new Set();
                              const uniqueLlos = availableLlosWithNums.filter(item => {
                                if (seen.has(item.value)) return false;
                                seen.add(item.value);
                                return true;
                              });
                              
                              if (uniqueLlos.length === 0) {
                                return <div className="llo-dropdown-empty">No LLOs available for selected COs</div>;
                              }
                              
                              const selectedLlos = plan.llo ? plan.llo.split(",").map(l => l.trim()) : [];
                              
                              return uniqueLlos.map((lloItem, lloIdx) => {
                                const isLloSelected = selectedLlos.includes(lloItem.label);
                                return (
                                  <label key={lloIdx} className="llo-dropdown-item">
                                    <input
                                      type="checkbox"
                                      checked={isLloSelected}
                                      onChange={() => {
                                        let nextLlos;
                                        const currentLlos = plan.llo ? plan.llo.split(",").map(l => l.trim()) : [];
                                        if (isLloSelected) {
                                          nextLlos = currentLlos.filter((l) => l !== lloItem.label);
                                        } else {
                                          nextLlos = [...currentLlos, lloItem.label];
                                        }
                                        const updated = [...plans];
                                        updated[i].llo = nextLlos.join(", ");
                                        setPlans(updated);
                                      }}
                                    />
                                    <span className="llo-item-text" title={lloItem.value}>
                                      <strong>{lloItem.label}</strong>
                                    </span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        value={plan.exptNo}
                        onChange={(e) =>
                          handleChange(i, "exptNo", e.target.value)
                        }
                        disabled={!week || loadingExperiments}
                      >
                        <option value="">Select Experiment</option>
                        {experiments.map((exp) => (
                          <option key={exp.practicalNo} value={String(exp.practicalNo)}>
                            {exp.practicalNo}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        value={plan.exptName}
                        onChange={(e) =>
                          handleChange(i, "exptName", e.target.value)
                        }
                        disabled={!week}
                        readOnly
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
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = plans.filter((_, idx) => idx !== i);
                          setPlans(updated);
                        }}
                        className="delete-row-btn"
                        title="Delete Row"
                        disabled={!week}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button
              type="button"
              className="add-row-btn"
              onClick={() => {
                setPlans([
                  ...plans,
                  { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" }
                ]);
              }}
              disabled={!week}
            >
              + Add Row
            </button>
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
