import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import WeekwisePlan from "./WeekwisePlan";
import CiaanSelector from "../components/CiannSelector";
import { useCiaan } from "../../hooks/useCiann";
import { config } from "../../config/api";
import "./LabPlanningSheet.css";
import "./EditCiannModern.css";

const LabPlanningSheet = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCiaan, selectCiaan, validateCurrentCiaan } = useCiaan();
  const [showCiaanSelector2, setShowCiaanSelector] = useState(false);

  // Try to get CiaanData from multiple sources
  const getCiaanData = () => {
    // First try location.state
    if (location.state?.CiaanData) {
      return location.state.CiaanData;
    }

    // Then try the hook
    if (currentCiaan) {
      return currentCiaan;
    }

    // Finally try localStorage directly
    try {
      const storedCiaan = localStorage.getItem("CiaanData");
      if (storedCiaan) {
        return JSON.parse(storedCiaan);
      }
    } catch (error) {
      console.error("Error parsing CiaanData from localStorage:", error);
    }

    return null;
  };

  const CiaanData = getCiaanData();
  const CiaanId = CiaanData?.CiaanId;

  // Debug logging
  useEffect(() => {
    console.log("LabPlanningSheet - Debug Info:");
    console.log("location.state:", location.state);
    console.log("currentCiaan:", currentCiaan);
    console.log("localStorage CiaanData:", localStorage.getItem("CiaanData"));
    console.log("Final CiaanData:", CiaanData);
    console.log("Final CiaanId:", CiaanId);
  }, [location.state, currentCiaan, CiaanData, CiaanId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [showWeekwisePlan, setShowWeekwisePlan] = useState(false);
  const [editWeekNo, setEditWeekNo] = useState(null);
  const [labPlans, setLabPlans] = useState([]);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);
  const [llHours, setLlHours] = useState(2);

  useEffect(() => {
    const fetchCiaanSubjectDetails = async () => {
      if (!CiaanId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${config.subjectDetails}/Ciaan-subject-details/${CiaanId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        if (data.success && data.adminDetails && data.adminDetails.learningScheme) {
          const ll = parseInt(data.adminDetails.learningScheme.ll);
          if (!isNaN(ll)) {
            setLlHours(ll);
          }
        }
      } catch (err) {
        console.error("Error fetching Ciaan subject details in LabPlanningSheet:", err);
      }
    };
    fetchCiaanSubjectDetails();
  }, [CiaanId]);

  const [lloMap, setLloMap] = useState({});

  // Fetch LLO details for mapping description to number
  useEffect(() => {
    if (!CiaanData) return;
    const fetchTloLlo = async () => {
      try {
        const token = localStorage.getItem("token");
        const subjectId = CiaanData.subject?._id || CiaanData.subjectId;
        const res = await fetch(
          `${config.subjectDetails}/tlo-llo/${CiaanData.CiaanId}/${subjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data.coData)) {
          const mapping = {};
          data.data.coData.forEach(c => {
            const coNum = c.coNumber.replace(/\D/g, '') || '1';
            (c.llos || []).forEach((lloText, lloIdx) => {
              const trimmed = lloText.trim();
              if (trimmed) {
                mapping[trimmed] = `${coNum}.${lloIdx + 1}`;
                mapping[trimmed.toLowerCase()] = `${coNum}.${lloIdx + 1}`;
              }
            });
          });
          setLloMap(mapping);
        }
      } catch (err) {
        console.error("Error fetching TloLlo mappings in LabPlanningSheet:", err);
      }
    };
    fetchTloLlo();
  }, [CiaanData]);

  const formatLlo = (lloValue) => {
    if (!lloValue) return "";
    if (/^[0-9.,\s]+$/.test(lloValue)) {
      return lloValue;
    }
    return lloValue
      .split(",")
      .map(part => {
        const trimmed = part.trim();
        const lower = trimmed.toLowerCase();
        return lloMap[lower] || lloMap[trimmed] || trimmed;
      })
      .join(", ");
  };
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

  // Fetch lab plans for specific CiaanId from backend
  useEffect(() => {
    const fetchPlans = async () => {
      if (!CiaanId) {
        console.warn("No CiaanId available, cannot fetch lab plans");
        setLabPlans([]);
        setPlanningStarted(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${config.labPlanning}/${CiaanId}`);
        if (res.status === 404) {
          console.log(`No lab plans found for CiaanId: ${CiaanId}`);
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
  }, [CiaanId]);

  const handleStartPlanning = () => {
    setPlanningStarted(true);
    setShowWeekwisePlan(true);
    setEditWeekNo(null);
  };

  const handleWeekwisePlanSubmit = async (week, plans) => {
    if (!CiaanId) {
      alert("No CIAAN ID available. Cannot save lab plan.");
      return;
    }

    const numericWeek = parseInt(week.replace("Week ", ""));
    setLoading(true);

    console.log("Submitting lab plan:", {
      CiaanId,
      weekNo: numericWeek,
      plans,
    });

    try {
      const res = await fetch(config.labPlanning, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CiaanId, weekNo: numericWeek, plans }),
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
      const updatedRes = await fetch(`${config.labPlanning}/${CiaanId}`);
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

  const handleCiaanSelect = (selectedCiaan) => {
    selectCiaan(selectedCiaan);
    setShowCiaanSelector(false);
    // The component will re-render with the new CiaanData
  };

  const handleCiaanSelectorCancel = () => {
    setShowCiaanSelector(false);
    navigate("/edit-Ciaan");
  };

  const weekData = groupedPlans();

  return (
    <div className="lab-layout">
      <div className="teaching-main-row">
        <div className="syllabus-secondary-sidebar-wrapper">
          <SecondarySidebar
            CiaanData={CiaanData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="labplanning-main-content">
          {!CiaanId ? (
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
                    onClick={() => setShowCiaanSelector(true)}
                  >
                    Select CIAAN
                  </button>
                  <button
                    className="start-btn"
                    onClick={() => navigate("/edit-Ciaan")}
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
              CiaanData={CiaanData}
              llHours={llHours}
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
              <p className="Ciaan-details">
                CIAAN ID: <strong>{CiaanData?.CiaanId}</strong> | Division:{" "}
                <strong>{CiaanData?.division}</strong>
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
                        <th className="llo-cell">LLO</th>
                        <th>Expt. No.</th>
                        <th className="expt-name-cell">Name of Experiment</th>
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
                                className={`week-group ${i === 0
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
                                <td className="llo-cell">{formatLlo(p.llo)}</td>
                                <td>{p.exptNo}</td>
                                <td className="expt-name-cell" style={{ whiteSpace: "pre-line", textAlign: "left" }}>{p.exptName}</td>
                                <td>{p.date}</td>
                                <td>{p.actualDate || "--"}</td>
                              </tr>
                            ))
                            : (llHours >= 4 ? ["B1", "B1", "B2", "B2", "B3", "B3"] : ["B1", "B2", "B3"]).map((batch, i, arr) => (
                              <tr
                                key={`${weekNo}-empty-${i}`}
                                className={`week-group ${i === 0 ? "first" : i === arr.length - 1 ? "last" : ""
                                  }`}
                              >
                                {i === 0 && <td rowSpan={arr.length}>{weekNo}</td>}
                                <td>{batch}</td>
                                <td></td>
                                <td className="llo-cell"></td>
                                <td></td>
                                <td className="expt-name-cell" style={{ textAlign: "left" }}></td>
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

      {showCiaanSelector2 && (
        <CiaanSelector
          onSelect={handleCiaanSelect}
          onCancel={handleCiaanSelectorCancel}
        />
      )}
    </div>
  );
};

export default LabPlanningSheet;
