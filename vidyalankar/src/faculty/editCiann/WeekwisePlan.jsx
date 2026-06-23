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
    background: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(4px)",
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
    animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    overflow: "hidden", // Ensure modal content doesn't overflow outside its rounded corners
    padding: "0",
    marginTop: "0",
    border: "1px solid rgba(226, 232, 240, 0.8)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
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
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

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

  // Fetch batches allocated by office staff
  useEffect(() => {
    const fetchBatches = async () => {
      if (!ciannData) return;
      setLoadingBatches(true);
      try {
        const token = localStorage.getItem("token");
        const ciannId = ciannData.ciannId;
        const division = ciannData.division;
        const response = await axios.get(`${config.assessments}/batches`, {
          params: { ciannId, division }
        });
        
        if (response.data && response.data.success && Array.isArray(response.data.batches)) {
          setBatches(response.data.batches);
        } else {
          setBatches(["B1", "B2", "B3", "B4", "B5", "B6"]);
        }
      } catch (err) {
        console.error("Error fetching batches in WeekwisePlan:", err);
        setBatches(["B1", "B2", "B3", "B4", "B5", "B6"]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [ciannData]);

  const getLloLabelMap = () => {
    const map = {};
    coData.forEach(c => {
      const coNum = c.coNumber.replace(/\D/g, '') || '1';
      (c.llos || []).forEach((lloText, lloIdx) => {
        const trimmed = lloText.trim();
        if (trimmed) {
          map[trimmed] = `${coNum}.${lloIdx + 1}`;
          map[trimmed.toLowerCase()] = `${coNum}.${lloIdx + 1}`;
        }
      });
    });
    return map;
  };

  const lloLabelMap = getLloLabelMap();

  const getNormalizedLlo = (lloValue) => {
    if (!lloValue) return "";
    if (/^[0-9.,\s]+$/.test(lloValue)) {
      return lloValue;
    }
    return lloValue
      .split(",")
      .map(part => {
        const trimmed = part.trim();
        const lower = trimmed.toLowerCase();
        return lloLabelMap[lower] || lloLabelMap[trimmed] || trimmed;
      })
      .join(", ");
  };

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
            batch: item.batch || (batches[0] || "B1"),
            co: item.co || "",
            llo: item.llo ? getNormalizedLlo(item.llo) : "",
            exptNo: item.exptNo || "",
            exptName: item.exptName || "",
            date: item.date || "",
          }))
        );
      } else {
        const batchList = batches.length > 0 ? batches : ["B1", "B2", "B3"];
        if (llHours >= 4) {
          const defaultPlans = [];
          batchList.forEach(b => {
            defaultPlans.push({ batch: b, co: "", llo: "", exptNo: "", exptName: "", date: "" });
            defaultPlans.push({ batch: b, co: "", llo: "", exptNo: "", exptName: "", date: "" });
          });
          setPlans(defaultPlans);
        } else {
          setPlans(
            batchList.map(b => ({ batch: b, co: "", llo: "", exptNo: "", exptName: "", date: "" }))
          );
        }
      }
    }
  }, [week, initialWeek, existingData, llHours, batches]);

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
    const normalizedPlans = plans.map(p => ({
      ...p,
      llo: getNormalizedLlo(p.llo)
    }));
    onSubmitPlan(week, normalizedPlans);
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

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .co-badges-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .co-badge-btn {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .co-badge-btn:hover:not(:disabled) {
          background-color: #e2e8f0;
          color: #0f172a;
        }
        .co-badge-btn.active {
          background-color: #d1fae5;
          color: #065f46;
          border-color: #a7f3d0;
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
          padding: 8px 12px;
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          text-align: left;
          font-size: 13px;
          color: #0f172a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        .llo-dropdown-trigger:hover:not(:disabled) {
          border-color: #94a3b8;
        }
        .llo-dropdown-trigger:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .llo-dropdown-trigger:disabled {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
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
          color: #64748b;
          margin-left: 5px;
        }
        .llo-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          max-height: 220px;
          overflow-y: auto;
          z-index: 100;
          text-align: left;
          margin-top: 4px;
          padding: 4px;
        }
        .llo-dropdown-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s ease;
          user-select: none;
          border-radius: 6px;
        }
        .llo-dropdown-item:hover {
          background-color: #f1f5f9;
        }
        .llo-dropdown-item input[type="checkbox"] {
          margin-right: 8px;
          width: 15px;
          height: 15px;
          accent-color: #10b981;
          cursor: pointer;
          flex-shrink: 0;
        }
        .llo-item-text {
          line-height: 1.4;
          color: #334155;
        }
        .llo-dropdown-empty {
          padding: 12px;
          color: #64748b;
          font-size: 12px;
          text-align: center;
        }
        
        .add-row-btn {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .add-row-btn:hover:not(:disabled) {
          background-color: #2563eb !important;
        }
        .add-row-btn:disabled {
          background-color: #f1f5f9 !important;
          color: #94a3b8 !important;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .delete-row-btn {
          background-color: #fee2e2 !important;
          color: #ef4444 !important;
          border: 1px solid #fecaca;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .delete-row-btn:hover:not(:disabled) {
          background-color: #ef4444 !important;
          color: white !important;
          border-color: #ef4444;
        }
        .delete-row-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .batch-select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
        }

        .modal-header-weekwise {
          background: #f8fafc;
          color: #0f172a;
          padding: 16px 24px;
          font-size: 18px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        
        .modal-header-weekwise button:hover {
          background-color: #f1f5f9;
          color: #0f172a !important;
        }

        .weekwise-container {
          padding: 24px;
          max-height: calc(90vh - 64px - 72px); 
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background-color: #fff;
          font-family: 'Inter', sans-serif;
          flex-grow: 1;
        }
        
        .plan-table-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          margin-top: 16px;
          padding-bottom: 0;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          background: #fff;
        }

        .plan-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
          table-layout: fixed;
          border: 0;
        }

        .plan-table th,
        .plan-table td {
          border: 1px solid #f1f5f9;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
          font-size: 13px;
          color: #334155;
          white-space: normal;
        }

        .plan-table th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #e2e8f0;
        }
        
        /* Column widths are set via <colgroup> in JSX */

        .plan-table input,
        .plan-table select,
        .plan-table textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          box-sizing: border-box;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          background-color: white;
          color: #0f172a;
        }
        .plan-table input:focus,
        .plan-table select:focus,
        .plan-table textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        
        .plan-table textarea[readonly] {
          background-color: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
          box-shadow: none;
          cursor: not-allowed;
          resize: none;
          height: 38px;
          line-height: 1.4;
        }
        
        .plan-table select {
          cursor: pointer;
        }
        
        .plan-table select:disabled,
        .plan-table input:disabled,
        .plan-table textarea:disabled {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .week-select {
          padding: 6px;
        }
        
        .action-buttons-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            flex-shrink: 0;
        }

        .action-buttons-container button {
          padding: 10px 20px;
          font-weight: 700;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .action-buttons-container button:first-child {
            background-color: #10b981;
            color: white;
        }
        
        .action-buttons-container button:first-child:hover {
            background-color: #059669;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
        }
        
        .action-buttons-container button.cancel {
            background-color: white;
            color: #64748b;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .action-buttons-container button.cancel:hover {
            background-color: #f1f5f9;
            color: #0f172a;
            border-color: #cbd5e1;
        }
        
        .submission-message {
            margin-top: 15px;
            font-size: 14px;
            text-align: center;
            padding: 10px;
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            border-radius: 8px;
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
              min-width: 600px;
            }
            
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
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Week No</th>
                  <th>Batch No</th>
                  <th>CO</th>
                  <th>LLO</th>
                  <th>Expt No</th>
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
                        {(batches.length > 0 ? batches : ["B1", "B2", "B3", "B4", "B5", "B6"]).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
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
                            {plan.llo && getNormalizedLlo(plan.llo).split(",").map(l => l.trim()).filter(Boolean).length > 0
                              ? getNormalizedLlo(plan.llo).split(",").map(l => l.trim()).filter(Boolean).join(", ")
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
                              
                              const selectedLlos = plan.llo ? getNormalizedLlo(plan.llo).split(",").map(l => l.trim()) : [];
                              
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
                        <option value="">Select</option>
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
                const defaultBatch = batches.length > 0 ? batches[0] : "B1";
                setPlans([
                  ...plans,
                  { batch: defaultBatch, co: "", llo: "", exptNo: "", exptName: "", date: "" }
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
