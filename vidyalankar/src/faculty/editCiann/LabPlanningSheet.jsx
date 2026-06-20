import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import WeekwisePlan from "./WeekwisePlan";
import CiannSelector from "../components/CiannSelector";
import { useCiann } from "../../hooks/useCiann";
import { config } from "../../config/api";
import "./LabPlanningSheet.css";
import "./EditCiannModern.css";

const LabPlanningSheet = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCiann, selectCiann, validateCurrentCiann } = useCiann();
  const [showCiannSelector2, setShowCiannSelector] = useState(false);

  // Try to get ciannData from multiple sources
  const getCiannData = () => {
    // First try location.state
    if (location.state?.ciannData) {
      return location.state.ciannData;
    }

    // Then try the hook
    if (currentCiann) {
      return currentCiann;
    }

    // Finally try localStorage directly
    try {
      const storedCiann = localStorage.getItem("ciannData");
      if (storedCiann) {
        return JSON.parse(storedCiann);
      }
    } catch (error) {
      console.error("Error parsing ciannData from localStorage:", error);
    }

    return null;
  };

  const ciannData = getCiannData();
  const ciannId = ciannData?.ciannId;

  // Debug logging
  useEffect(() => {
    console.log("LabPlanningSheet - Debug Info:");
    console.log("location.state:", location.state);
    console.log("currentCiann:", currentCiann);
    console.log("localStorage ciannData:", localStorage.getItem("ciannData"));
    console.log("Final ciannData:", ciannData);
    console.log("Final ciannId:", ciannId);
  }, [location.state, currentCiann, ciannData, ciannId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [showWeekwisePlan, setShowWeekwisePlan] = useState(false);
  const [editWeekNo, setEditWeekNo] = useState(null);
  const [labPlans, setLabPlans] = useState([]);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  const [loading, setLoading] = useState(false);

  // Fetch lab plans for specific ciannId from backend
  useEffect(() => {
    const fetchPlans = async () => {
      if (!ciannId) {
        console.warn("No ciannId available, cannot fetch lab plans");
        setLabPlans([]);
        setPlanningStarted(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${config.labPlanning}/${ciannId}`);
        if (res.status === 404) {
          console.log(`No lab plans found for ciannId: ${ciannId}`);
          setLabPlans([]);
          setPlanningStarted(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log("Fetched lab plans:", data);
        setLabPlans(data);
        setPlanningStarted(data.length > 0);
      } catch (err) {
        console.error("Failed to fetch lab plans:", err);
        setLabPlans([]);
        setPlanningStarted(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [ciannId]);

  const handleStartPlanning = () => {
    setPlanningStarted(true);
    setShowWeekwisePlan(true);
    setEditWeekNo(null);
  };

  const handleWeekwisePlanSubmit = async (week, plans) => {
    if (!ciannId) {
      alert("No CIAAN ID available. Cannot save lab plan.");
      return;
    }

    const numericWeek = parseInt(week.replace("Week ", ""));
    setLoading(true);

    console.log("Submitting lab plan:", {
      ciannId,
      weekNo: numericWeek,
      plans,
    });

    try {
      const res = await fetch(config.labPlanning, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciannId, weekNo: numericWeek, plans }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server error response:", errorData);
        throw new Error(
          errorData.message || `HTTP ${res.status}: Failed to save lab plan`,
        );
      }

      const savedPlan = await res.json();
      console.log("Lab plan saved successfully:", savedPlan);

      // Refetch plans after submit
      const updatedRes = await fetch(`${config.labPlanning}/${ciannId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setLabPlans(updatedData);
      } else if (updatedRes.status === 404) {
        setLabPlans([]);
      }
      setPlanningStarted(true);
      setShowWeekwisePlan(false);
      setEditWeekNo(null);
      alert("Lab plan saved successfully!");
    } catch (err) {
      console.error("Error saving lab plan:", err);
      alert(`Error saving lab plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWeekwisePlan = () => {
    setShowWeekwisePlan(false);
    setEditWeekNo(null);
  };

  const handleAddNewPlan = () => {
    setShowWeekwisePlan(true);
    setEditWeekNo(null);
  };

  const handleEditWeek = (weekNo) => {
    setShowWeekwisePlan(true);
    setEditWeekNo(weekNo);
  };

  const getPlansForPage = (page) => {
    const startWeek = (page - 1) * 4 + 1;
    const endWeek = startWeek + 3;
    return Array.isArray(labPlans)
      ? labPlans.filter((p) => p.weekNo >= startWeek && p.weekNo <= endWeek)
      : [];
  };

  const groupedPlans = () => {
    const plans = getPlansForPage(currentPage);
    const grouped = {};
    for (let i = 0; i < 4; i++) {
      const weekNo = (currentPage - 1) * 4 + i + 1;
      const found = plans.find((p) => p.weekNo === weekNo);
      grouped[weekNo] = found ? found.plans : [];
    }
    return grouped;
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCiannSelect = (selectedCiann) => {
    selectCiann(selectedCiann);
    setShowCiannSelector(false);
    // The component will re-render with the new ciannData
  };

  const handleCiannSelectorCancel = () => {
    setShowCiannSelector(false);
    navigate("/edit-ciann");
  };

  const weekData = groupedPlans();

  return (
    <div className="lab-layout">
      <div className="teaching-main-row">
        <div className="syllabus-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="labplanning-main-content">
          {!ciannId ? (
            <div className="plan-container">
              <div className="header-row">
                <h3>7. Laboratory Plan (LP)</h3>
              </div>
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#dc3545",
                }}
              >
                <p>
                  No CIAAN ID available. Please select a CIAAN first to access
                  the Laboratory Planning Sheet.
                </p>
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className="start-btn"
                    onClick={() => setShowCiannSelector(true)}
                  >
                    Select CIAAN
                  </button>
                  <button
                    className="start-btn"
                    onClick={() => navigate("/edit-ciann")}
                    style={{ backgroundColor: "#6c757d" }}
                  >
                    Go to Edit CIAAN
                  </button>
                </div>
              </div>
            </div>
          ) : showWeekwisePlan ? (
            <WeekwisePlan
              onSubmitPlan={handleWeekwisePlanSubmit}
              onCancel={handleCancelWeekwisePlan}
              existingData={
                Array.isArray(labPlans)
                  ? labPlans.flatMap((lp) =>
                      lp.plans.map((p) => ({ ...p, weekNo: lp.weekNo })),
                    )
                  : []
              }
              initialWeek={editWeekNo}
              ciannData={ciannData}
            />
          ) : (
            <div className="plan-container">
              <div className="header-row">
                <h3>7. Laboratory Plan (LP)</h3>
                <div className="button-group">
                  {planningStarted ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <button className="start-btn" onClick={handleAddNewPlan}>
                        Add Weekwise Plan
                      </button>
                      <button
                        className="start-btn"
                        onClick={() => handleEditWeek(null)}
                      >
                        Edit Weekwise Plan
                      </button>
                    </div>
                  ) : (
                    <button className="start-btn" onClick={handleStartPlanning}>
                      Start Planning
                    </button>
                  )}
                </div>
              </div>
              <p className="ciann-details">
                CIAAN ID: <strong>{ciannData?.ciannId}</strong> | Division:{" "}
                <strong>{ciannData?.division}</strong>
              </p>
              <div className="tabs">
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={currentPage === page ? "active" : ""}
                  >
                    Page {page}
                  </button>
                ))}
              </div>
              <div className="teaching" key={currentPage}>
                <div className="table-container">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>Week No.</th>
                        <th>Batch</th>
                        <th>CO</th>
                        <th>LLO</th>
                        <th>Expt. No.</th>
                        <th>Name of Experiment</th>
                        <th>Date of Performance (Planned)</th>
                        <th>Date of Completion (Actual)</th>
                      </tr>
                    </thead>
                    {planningStarted && (
                      <tbody>
                        {Object.entries(weekData).map(([weekNo, weekPlans]) =>
                          weekPlans.length > 0
                            ? weekPlans.map((p, i) => (
                                <tr
                                  key={`${weekNo}-${i}`}
                                  className={`week-group ${
                                    i === 0
                                      ? "first"
                                      : i === weekPlans.length - 1
                                        ? "last"
                                        : ""
                                  }`}
                                >
                                  {i === 0 && (
                                    <td rowSpan={weekPlans.length}>{weekNo}</td>
                                  )}
                                  <td>{p.batch}</td>
                                  <td>{p.co || ""}</td>
                                  <td>{p.llo || ""}</td>
                                  <td>{p.exptNo}</td>
                                  <td>{p.exptName}</td>
                                  <td>{p.date}</td>
                                  <td>{p.actualDate || "--"}</td>
                                </tr>
                              ))
                            : ["B1", "B2", "B3"].map((batch, i) => (
                                <tr
                                  key={`${weekNo}-empty-${i}`}
                                  className={`week-group ${
                                    i === 0 ? "first" : i === 2 ? "last" : ""
                                  }`}
                                >
                                  {i === 0 && <td rowSpan={3}>{weekNo}</td>}
                                  <td>{batch}</td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td>--</td>
                                </tr>
                              )),
                        )}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
              <div className="pagination">
                <button className="prev-btn">← Previous</button>
                <button className="forward-btn">Forward →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCiannSelector2 && (
        <CiannSelector
          onSelect={handleCiannSelect}
          onCancel={handleCiannSelectorCancel}
        />
      )}
    </div>
  );
};

export default LabPlanningSheet;
