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
    maxWidth: "1200px",
    maxHeight: "90vh",
    animation: "fadeIn 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
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
          className: ciannData.class || "",
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
        setPlans([
          { batch: "B1", co: "", llo: "", exptNo: "", exptName: "", date: "" },
          { batch: "B2", co: "", llo: "", exptNo: "", exptName: "", date: "" },
          { batch: "B3", co: "", llo: "", exptNo: "", exptName: "", date: "" },
        ]);
      }
    }
  }, [week, initialWeek, existingData]);

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

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header-weekwise {
          background: var(--ciann-surface, #ffffff);
          color: var(--ciann-text, #10223d);
          padding: 18px 24px;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--ciann-border, #e2eaf5);
          flex-shrink: 0;
        }

        .weekwise-container {
          padding: 24px;
          max-height: calc(90vh - 65px - 70px); 
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background-color: var(--ciann-surface, #ffffff);
          flex-grow: 1;
        }
        
        .plan-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-top: 15px;
          border: 1px solid var(--ciann-border, #d8e3f2);
          border-radius: 12px;
          background: var(--ciann-surface, #ffffff);
          box-shadow: 0 4px 16px rgba(13, 35, 72, 0.04);
        }

        .plan-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
          table-layout: fixed;
        }

        .plan-table th,
        .plan-table td {
          border: 1px solid var(--ciann-border, #e2eaf5);
          padding: 10px 8px;
          text-align: center;
          vertical-align: middle;
          font-size: 13px;
          white-space: normal;
        }

        .plan-table th {
          background-color: var(--primary-light, #f4f8ff);
          font-weight: 600;
          color: var(--text-color-primary, #233f64);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* Column widths */
        .plan-table th:nth-child(1), .plan-table td:nth-child(1) { width: 12%; } /* Week No */
        .plan-table th:nth-child(2), .plan-table td:nth-child(2) { width: 9%; }  /* Batch No */
        .plan-table th:nth-child(3), .plan-table td:nth-child(3) { width: 13%; } /* CO */
        .plan-table th:nth-child(4), .plan-table td:nth-child(4) { width: 18%; } /* LLO */
        .plan-table th:nth-child(5), .plan-table td:nth-child(5) { width: 12%; } /* Experiment No */
        .plan-table th:nth-child(6), .plan-table td:nth-child(6) { width: 20%; } /* Experiment Name */
        .plan-table th:nth-child(7), .plan-table td:nth-child(7) { width: 11%; } /* Planned Date */
        .plan-table th:nth-child(8), .plan-table td:nth-child(8) { width: 5%; }  /* Action */

        .plan-table input,
        .plan-table select {
          width: 100%;
          padding: 7px 10px;
          border: 1px solid var(--ciann-border, #dde3ea);
          border-radius: 6px;
          font-size: 13px;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background-color: var(--ciann-surface, #ffffff);
          color: var(--ciann-text, #10223d);
        }
        .plan-table input:focus,
        .plan-table select:focus {
          outline: none;
          border-color: var(--primary-color, #2f74e0);
          box-shadow: 0 0 0 3px var(--primary-accent-light, rgba(47, 116, 224, 0.15));
        }
        
        .plan-table select:disabled,
        .plan-table input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .week-select {
          padding: 8px;
          font-weight: 600;
        }

        .batch-select {
          font-weight: 500;
        }

        .co-badges-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .co-badge-btn {
          background-color: var(--primary-light, #f4f8ff);
          color: var(--text-color-secondary, #425a7d);
          border: 1px solid var(--card-border, #cfdef2);
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .co-badge-btn:hover:not(:disabled) {
          background-color: var(--primary-accent-light, #edf4ff);
          color: var(--primary-color, #1f62cf);
          border-color: var(--primary-color, #aac5eb);
        }
        .co-badge-btn.active {
          background-color: var(--primary-color, #2f74e0) !important;
          color: var(--text-on-primary, white) !important;
          border-color: var(--primary-accent-dark, #1f62cf) !important;
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
          padding: 7px 10px;
          background-color: var(--ciann-surface, #ffffff);
          border: 1px solid var(--ciann-border, #dde3ea);
          border-radius: 6px;
          text-align: left;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          color: var(--ciann-text, #10223d);
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
          border: 1px solid var(--ciann-border, #cfdef2);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(13, 35, 72, 0.12);
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
          border-bottom: 1px solid #f0f4f9;
        }
        .llo-dropdown-item:last-child {
          border-bottom: none;
        }
        .llo-dropdown-item:hover {
          background-color: var(--primary-light, #f4f8ff);
        }
        .llo-dropdown-item input[type="checkbox"] {
          margin-right: 8px;
          margin-top: 2px;
          width: 14px;
          height: 14px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .llo-item-text {
          line-height: 1.4;
          color: var(--ciann-text, #333);
        }
        .llo-dropdown-empty {
          padding: 12px;
          color: #888;
          font-size: 12px;
          text-align: center;
        }
        
        .add-row-btn {
          background: linear-gradient(180deg, var(--primary-color, #28a745) 0%, var(--primary-accent-dark, #218838) 100%) !important;
          color: var(--text-on-primary, white) !important;
          border: 1px solid var(--primary-accent-dark, #1e7e34) !important;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(40, 167, 69, 0.15);
        }
        .add-row-btn:hover:not(:disabled) {
          filter: brightness(0.95);
        }
        .add-row-btn:disabled {
          background-color: #e9ecef !important;
          color: #6c757d !important;
          cursor: not-allowed;
          box-shadow: none;
          border: 1px solid #dee2e6 !important;
        }
        
        .delete-row-btn {
          background-color: #ffeef0 !important;
          color: #d32f2f !important;
          border: 1px solid #ffccd2 !important;
          width: 28px;
          height: 28px;
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
          background-color: #d32f2f !important;
          color: white !important;
          border-color: #d32f2f !important;
        }
        .delete-row-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .action-buttons-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            background: var(--primary-light, #f4f8ff);
            border-top: 1px solid var(--ciann-border, #e2eaf5);
            flex-shrink: 0;
        }

        .action-buttons-container button {
          padding: 10px 24px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .action-buttons-container button.submit-btn {
            background: linear-gradient(180deg, var(--primary-color, #2f74e0) 0%, var(--primary-accent-dark, #1f62cf) 100%) !important;
            color: var(--text-on-primary, white) !important;
            border: 1px solid var(--primary-accent-dark, #1f5bbd) !important;
            box-shadow: 0 4px 12px rgba(31, 98, 207, 0.2) !important;
        }
        
        .action-buttons-container button.submit-btn:hover {
            filter: brightness(0.95);
        }
        
        .action-buttons-container button.cancel-btn {
            background-color: #ffffff;
            color: var(--ciann-text, #425a7d);
            border: 1px solid var(--ciann-border, #dbe5f2);
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .action-buttons-container button.cancel-btn:hover {
            background-color: #f8f9fa;
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
              max-height: calc(90vh - 120px); 
              overflow-y: auto;
            }
            .plan-table-wrapper {
              overflow-x: auto;
            }
            .plan-table {
              min-width: 1050px;
            }
            .action-buttons-container {
                flex-direction: column-reverse;
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
              background: "var(--primary-accent-light, #e3f2fd)", 
              borderRadius: "5px", 
              marginBottom: "10px",
              textAlign: "center",
              color: "var(--primary-color, #1976d2)"
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
                                
                                const remainingCOsLlos = coData
                                  .filter((c) => nextCOs.includes(c.coNumber))
                                  .flatMap((c) => [...(c.llos || []), ...(c.tlos || [])])
                                  .map(item => item.trim())
                                  .filter(Boolean);
                                const currentLlos = plan.llo ? plan.llo.split(",").map(l => l.trim()) : [];
                                const validLlos = currentLlos.filter(lloVal => remainingCOsLlos.includes(lloVal));
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
                              ? `${plan.llo.split(",").map(l => l.trim()).filter(Boolean).length} selected`
                              : "Select LLOs"}
                          </span>
                          <span className="llo-trigger-arrow">▼</span>
                        </button>
                        
                        {openLloDropdownIndex === i && (
                          <div className="llo-dropdown-menu">
                            {(() => {
                              const selectedCOs = plan.co ? plan.co.split(",").map(c => c.trim()) : [];
                              const availableLlos = [...new Set(coData
                                .filter(c => selectedCOs.includes(c.coNumber))
                                .flatMap(c => [...(c.llos || []), ...(c.tlos || [])]))]
                                .map(item => item.trim())
                                .filter(Boolean);
                              
                              if (availableLlos.length === 0) {
                                return <div className="llo-dropdown-empty">No LLOs available for selected COs</div>;
                              }
                              
                              const selectedLlos = plan.llo ? plan.llo.split(",").map(l => l.trim()) : [];
                              
                              return availableLlos.map((lloText, lloIdx) => {
                                const isLloSelected = selectedLlos.includes(lloText);
                                return (
                                  <label key={lloIdx} className="llo-dropdown-item">
                                    <input
                                      type="checkbox"
                                      checked={isLloSelected}
                                      onChange={() => {
                                        let nextLlos;
                                        if (isLloSelected) {
                                          nextLlos = selectedLlos.filter((l) => l !== lloText);
                                        } else {
                                          nextLlos = [...selectedLlos, lloText];
                                        }
                                        const updated = [...plans];
                                        updated[i].llo = nextLlos.join(", ");
                                        setPlans(updated);
                                      }}
                                    />
                                    <span className="llo-item-text" title={lloText}>
                                      {lloText}
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
                      <div style={{
                        textAlign: "left",
                        fontSize: "12px",
                        padding: "6px 8px",
                        background: "var(--primary-light, #f8f9fa)",
                        border: "1px solid var(--ciann-border, #dde3ea)",
                        borderRadius: "6px",
                        minHeight: "36px",
                        maxHeight: "60px",
                        overflowY: "auto",
                        display: "flex",
                        alignItems: "center",
                        color: "var(--ciann-text, #333)",
                        wordBreak: "break-word"
                      }}>
                        {plan.exptName || <span style={{ color: "#aaa" }}>Auto-filled</span>}
                      </div>
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
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            {initialWeek ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeekwisePlan;
