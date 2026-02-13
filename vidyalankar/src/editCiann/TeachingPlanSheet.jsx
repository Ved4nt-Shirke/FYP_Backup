import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../basic/Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import Header from "../basic/Header";
import "./WeekwisePlan1.css";
import "./TeachingPlanSheet.css";

const weekOptions = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);

// UPDATED modalStyles to match the WeekwisePlan component's look
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.7)", // Darker overlay
    zIndex: 2000, // Adjusted zIndex for consistency
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    background: "white",
    borderRadius: "16px", // More rounded corners
    width: "90%",
    maxWidth: "700px", // Increased max-width for better desktop look
    maxHeight: "84vh",
    animation: "fadeIn 0.3s ease-in-out", // Added animation
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)", // Stronger shadow
    overflow: "hidden", // Ensure content is clipped by rounded corners
    padding: "0", // Removed internal padding, managed by child elements
    marginTop: "0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#999", // Consistent color
    fontSize: "28px", // Consistent size
    cursor: "pointer",
    transition: "transform 0.2s ease, color 0.2s ease",
    position: "absolute", // Positioning for the close button
    top: 15,
    right: 20,
    zIndex: 10, // Ensure it's above other elements
  },
};

const TeachingPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const ciannId = ciannData?.ciannId;

  useEffect(() => {
    // If no ciannData from location state, try to get it from storage
    if (!ciannData) {
      // First try sessionStorage
      const storedCiannData = sessionStorage.getItem("currentCiannData");
      if (storedCiannData) {
        try {
          const parsedData = JSON.parse(storedCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }

      // Then try localStorage
      const localCiannData = localStorage.getItem("ciannData");
      if (localCiannData) {
        try {
          const parsedData = JSON.parse(localCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            // Also store in sessionStorage for consistency
            sessionStorage.setItem(
              "currentCiannData",
              JSON.stringify(parsedData)
            );
            return;
          }
        } catch (error) {
          console.error("Error parsing local CIAAN data:", error);
        }
      }
    } else {
      // Store CIAAN data in sessionStorage for persistence across navigation
      sessionStorage.setItem("currentCiannData", JSON.stringify(ciannData));
      localStorage.setItem("ciannData", JSON.stringify(ciannData));
    }
  }, [ciannData]);

  const onBack = () => navigate(-1);

  const [view, setView] = useState("sheet");
  const [week, setWeek] = useState("");
  const [plans, setPlans] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);
  const [teachingPlans, setTeachingPlans] = useState([]);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For submission messages

  // Chapter dropdown options fetched from DB
  const [chapterOptions, setChapterOptions] = useState([
    "--- Select Chapter ---",
  ]);

  // Fetch chapter list for the selected CIANN from backend
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const courseName = ciannData?.subject?.name; // e.g., "Computer Graphics"
        const programLabel = ciannData?.department?.label; // e.g., "Computer Engineering"
        const className = ciannData?.class;

        if (!courseName) return; // can't fetch without course

        const res = await fetch(
          "http://localhost:5000/api/course-chapters/get-chapters",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course: courseName,
              program: programLabel,
              className,
            }),
          }
        );
        const data = await res.json();
        const dynamicOptions = (data?.chp || [])
          .sort((a, b) => (a.chapterNo || 0) - (b.chapterNo || 0))
          .map((c) => `Unit - ${c.chapterNo}. ${c.chapterName}`);
        setChapterOptions(["--- Select Chapter ---", ...dynamicOptions]);
      } catch (err) {
        console.error("Failed to fetch chapters:", err);
        setChapterOptions(["--- Select Chapter ---"]);
      }
    };
    fetchChapters();
  }, [ciannData]);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!ciannId) {
        console.warn("No ciannId available, cannot fetch plans");
        setTeachingPlans([]);
        setPlanningStarted(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/teaching-plan/${ciannId}`
        );
        if (res.status === 404) {
          console.log(`No teaching plans found for ciannId: ${ciannId}`);
          setTeachingPlans([]);
          setPlanningStarted(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log("Fetched teaching plans:", data);
        setTeachingPlans(data);
        setPlanningStarted(data.length > 0);
      } catch (err) {
        console.error("Failed to fetch teaching plans:", err);
        setTeachingPlans([]);
        setPlanningStarted(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [ciannId]);

  useEffect(() => {
    if ((view === "edit" || view === "add") && week) {
      const weekNo = parseInt(week.replace("Week ", ""));
      const found = teachingPlans.find((p) => p.weekNo === weekNo);
      const filled = Array(5)
        .fill()
        .map((_, i) =>
          found && found.plans && found.plans[i]
            ? {
                chapter: found.plans[i].chapter || "",
                subTopic: found.plans[i].subTopic || "",
                startDate: found.plans[i].startDate || "",
                endDate: found.plans[i].endDate || "",
                teachingMethod: found.plans[i].teachingMethod || "",
              }
            : {
                chapter: "",
                subTopic: "",
                startDate: "",
                endDate: "",
                teachingMethod: "",
              }
        );
      setPlans(filled);
    }
  }, [week, view, teachingPlans]);

  const handleChange = (index, field, value) => {
    const updated = [...plans];
    updated[index][field] = value;
    setPlans(updated);
  };

  const handleSubmit = async () => {
    if (!week) {
      setMessage("⚠️ Please select a week number.");
      return;
    }
    if (!ciannId) {
      setMessage("⚠️ No CIAAN ID available. Cannot save plan.");
      return;
    }
    const weekNo = parseInt(week.replace("Week ", ""));

    const filteredPlans = plans.filter(
      (p) =>
        p.chapter &&
        p.chapter !== chapterOptions[0] &&
        p.subTopic &&
        p.startDate &&
        p.teachingMethod
    );

    if (filteredPlans.length === 0) {
      setMessage(
        "⚠️ Please fill at least one complete plan entry (Chapter, Sub-Topic, Start Date, Teaching Method)."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/teaching-plan/${ciannId}/${weekNo}`,
        {
          method: "PUT", // Use PUT to update specific week
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plans: filteredPlans }),
        }
      );
      if (!res.ok) throw new Error("Failed to save teaching plan");

      const updatedRes = await fetch(
        `http://localhost:5000/api/teaching-plan/${ciannId}`
      );
      const updatedData = await updatedRes.json();
      setTeachingPlans(updatedData);
      setPlanningStarted(true);
      setView("sheet");
      setWeek("");
      setPlans([]);
      setMessage("✅ Data submitted successfully!");
      setTimeout(() => setMessage(""), 2000); // Clear message after 2 seconds
    } catch (err) {
      setMessage("❌ Error saving teaching plan: " + err.message);
      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds for errors
    } finally {
      setLoading(false);
    }
  };

  const getPlansForPage = (page) => {
    const startWeek = (page - 1) * 4 + 1;
    const endWeek = startWeek + 3;
    return teachingPlans.filter(
      (p) => p.weekNo >= startWeek && p.weekNo <= endWeek
    );
  };

  const getPlansForWeek = (week) => {
    const found = teachingPlans.find((p) => p.weekNo === week);
    const plans = found && found.plans ? found.plans : [];
    const result = [...plans];
    while (result.length < 5) result.push({});
    return result.slice(0, 5);
  };

  const renderWeekRow = (week) => {
    const plans = getPlansForWeek(week);
    const rows = [];
    for (let i = 0; i < 5; i++) {
      const plan = plans[i];
      const chapterParts = plan?.chapter?.split("Unit - ")[1]?.split(".") || [];
      const chapterNo = chapterParts[0]?.trim() || "";
      const chapterName = plan?.chapter?.split(". ").slice(1).join(". ") || "";

      rows.push(
        <tr
          key={`week-${week}-row-${i}`}
          style={{ borderBottom: i === 4 ? "2px solid #e0e0e0" : "none" }}
          className="table-row"
        >
          <td data-label="Chapter No." className="chapter-no">
            {chapterNo ? `Unit - ${chapterNo}` : ""}
          </td>
          <td data-label="Name of Chapter" className="chapter-name">
            {chapterName}
          </td>
          <td
            data-label="Topics / Sub-topics to be covered"
            className="sub-topic"
          >
            {plan?.subTopic || ""}
          </td>
          {i === 0 && (
            <td
              rowSpan={5}
              style={{ textAlign: "center" }}
              data-label="Week No."
              className="week-no"
            >
              {week}
            </td>
          )}
          <td data-label="Date of Commencing Topic" className="start-date">
            {plan?.startDate || ""}
          </td>
          <td data-label="Date of Completion of Topic" className="end-date">
            {plan?.endDate || ""}
          </td>
          <td data-label="Teaching Methods" className="teaching-method">
            {plan?.teachingMethod || ""}
          </td>
        </tr>
      );
    }
    return rows;
  };

  const renderModalForm = () => (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content} className="tps-modal">
        <button
          className="tps-close-btn"
          onClick={() => {
            setView("sheet");
            setWeek("");
            setPlans([]);
            setMessage("");
          }}
          title="Close"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="tps-modal-header">
          {view === "edit" ? "Edit Weekwise Plan" : "Weekwise Plan"}
        </div>
        <div className="weekwise-form-container">
          {" "}
          {/* Renamed for clarity */}
          <div className="form-grid">
            <div className="form-labels">
              {" "}
              {/* This div acts as the table header */}
              <label>Chapter</label>
              <label>Sub-Topic</label>
              <label>Week No.</label>
              <label>Start Date</label>
              <label>Teaching Methods</label>
            </div>
            {(plans.length > 0
              ? plans
              : Array(5).fill({
                  chapter: "",
                  subTopic: "",
                  startDate: "",
                  endDate: "",
                  teachingMethod: "",
                })
            ).map((plan, index) => (
              <div className="form-row" key={index}>
                <select
                  value={plan.chapter}
                  onChange={(e) =>
                    handleChange(index, "chapter", e.target.value)
                  }
                  className="form-input"
                >
                  {chapterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Sub-Topic"
                  value={plan.subTopic}
                  onChange={(e) =>
                    handleChange(index, "subTopic", e.target.value)
                  }
                  className="form-input"
                />
                {index === 0 ? (
                  <select
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    className="form-input week-select" // Added week-select class
                  >
                    <option value="">Select Week</option>
                    {weekOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="empty-cell"></div> // Empty div to maintain grid structure
                )}
                <input
                  type="date"
                  value={plan.startDate}
                  onChange={(e) =>
                    handleChange(index, "startDate", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Teaching Methods"
                  value={plan.teachingMethod}
                  onChange={(e) =>
                    handleChange(index, "teachingMethod", e.target.value)
                  }
                  className="form-input"
                />
              </div>
            ))}
          </div>
          {message && <div className="submission-message">{message}</div>}
        </div>
        <div className="button-group">
          <button
            className="btn cancel"
            onClick={() => {
              setView("sheet");
              setWeek("");
              setPlans([]);
              setMessage(""); // Clear message on cancel
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {view === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "add" || view === "edit") {
    return (
      <>
        {renderModalForm()}
        <div
          style={{
            filter: "blur(2px)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {/* Dimmed background */}
        </div>
      </>
    );
  }

  if (!ciannData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Error: No CIAAN Selected</h3>
        <p>This page was loaded without the necessary data.</p>
        <button onClick={onBack} className="btn submit">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-layout">
      <Header
        showSearch={false}
        onMenuToggle={() => setIsSidebarVisible((v) => !v)}
        onSecondaryMenuToggle={() => setIsSecondarySidebarVisible((v) => !v)}
      />
      <div className="teaching-main-row">
        <Sidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
        />
        <div className="syllabus-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div
          className="teaching-main-content syllabus-main-content has-secondary-sidebar"
          style={{ marginTop: "180px" }}
        >
          <div className="plan-container">
            <div className="header-row">
              <h3 className="plan-title">6. Teaching Plan (TP)</h3>
              {/* Move the button/action area here */}
              <div className="plan-actions-top-right">
                {" "}
                {/* New div for styling */}
                {!planningStarted ? (
                  <button
                    className="start-btn btn submit"
                    onClick={() => {
                      setPlanningStarted(true);
                      setView("add");
                      setWeek("");
                      setPlans([]);
                    }}
                    disabled={loading}
                  >
                    Start Planning
                  </button>
                ) : (
                  <div className="action-buttons">
                    <button
                      className="start-btn btn submit"
                      onClick={() => {
                        setView("add");
                        setWeek("");
                        setPlans([]);
                      }}
                      disabled={loading}
                    >
                      Add Weekwise Plan
                    </button>
                    <button
                      className="start-btn btn submit"
                      onClick={() => {
                        setView("edit");
                        setWeek("");
                        setPlans([]);
                      }}
                      disabled={loading}
                    >
                      Edit Weekwise Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* The rest of your content remains here */}
            <p className="ciann-details">
              CIAAN ID: <strong>{ciannData.ciannId}</strong> | Division:{" "}
              <strong>{ciannData.division}</strong>
            </p>
            <div className="tabs">
              {[1, 2, 3, 4].map((page) => (
                <button
                  key={page}
                  className={`tab ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  Page {page}
                </button>
              ))}
            </div>
            <div className="teaching">
              <div className="table-container">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <table className="teaching-table">
                    <thead>
                      <tr>
                        <th>Chapter No.</th>
                        <th>Name of Chapter</th>
                        <th>Topics / Sub-topics</th>
                        <th>Week No.</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Teaching Methods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planningStarted &&
                        [...Array(4)].flatMap((_, i) =>
                          renderWeekRow((currentPage - 1) * 4 + i + 1)
                        )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ⬅ Previous
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 4 || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Forward ➡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingPlan;
