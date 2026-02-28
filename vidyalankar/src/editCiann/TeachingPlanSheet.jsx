import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../basic/Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import Header from "../basic/Header";
import "./WeekwisePlan1.css";
import "./TeachingPlanSheet.css";

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
    maxWidth: "900px", // Increased for better visibility
    maxHeight: "90vh", // Increased from 84vh
    animation: "fadeIn 0.3s ease-in-out", // Added animation
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)", // Stronger shadow
    overflow: "hidden", // Modal itself doesn't scroll, children do
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
              JSON.stringify(parsedData),
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
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersFetchError, setChaptersFetchError] = useState(null);

  // Fetch chapter list for the selected CIANN from backend
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const courseName = ciannData?.subject?.name; // e.g., "Computer Graphics"
        const programLabel = ciannData?.department?.label; // e.g., "Computer Engineering"
        const className = ciannData?.class;

        console.log("📚 Fetching chapters for Teaching Plan:");
        console.log("  Course:", courseName);
        console.log("  Program:", programLabel);
        console.log("  Class:", className);

        if (!courseName) {
          console.warn("⚠️ No course name found, cannot fetch chapters");
          setChaptersFetchError("Course information not available");
          return;
        }

        setChaptersLoading(true);
        setChaptersFetchError(null);

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
          },
        );
        const data = await res.json();
        console.log("✅ Chapters API response:", data);

        if (data.success && data.chp && data.chp.length > 0) {
          const dynamicOptions = data.chp
            .sort((a, b) => (a.chapterNo || 0) - (b.chapterNo || 0))
            .map((c) => `Unit - ${c.chapterNo}. ${c.chapterName}`);
          console.log("📋 Processed chapter options:", dynamicOptions);
          setChapterOptions(["--- Select Chapter ---", ...dynamicOptions]);
          setChaptersFetchError(null);
        } else {
          console.warn("⚠️ No chapters found for this course");
          setChapterOptions(["--- Select Chapter ---"]);
          setChaptersFetchError(
            `No chapters found for ${courseName}. Please add chapters in Course Management first.`,
          );
        }
      } catch (err) {
        console.error("❌ Failed to fetch chapters:", err);
        setChapterOptions(["--- Select Chapter ---"]);
        setChaptersFetchError(`Error loading chapters: ${err.message}`);
      } finally {
        setChaptersLoading(false);
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
          `http://localhost:5000/api/teaching-plan/${ciannId}`,
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

  // Removed useEffect for plans initialization - now done directly in button onClick handlers

  const handleChange = (index, field, value) => {
    console.log(
      `🔧 handleChange called: index=${index}, field=${field}, value="${value}", plans.length=${plans.length}`,
    );
    console.log("📦 Current plans before update:", JSON.stringify(plans));

    // Ensure plans array is initialized with proper objects
    let updated = [...plans];

    // If plans is empty or index doesn't exist, initialize it
    if (updated.length === 0 || !updated[index]) {
      console.log("⚠️ Plans array not initialized, creating empty array");
      updated = [
        {
          chapter: "",
          subTopic: "",
          startDate: "",
          endDate: "",
          teachingMethod: "",
        },
      ];
    }

    // Now safely update the field
    updated[index][field] = value;
    console.log(
      "✅ Updated plan after change:",
      JSON.stringify(updated[index]),
    );
    console.log("💾 Setting new plans array:", JSON.stringify(updated));
    setPlans(updated);
  };

  const handleSubmit = async () => {
    if (!ciannId) {
      setMessage("⚠️ No CIAAN ID available. Cannot save plan.");
      return;
    }

    console.log("🚀 Submit clicked. Plans array:", plans);
    console.log("📋 Chapter options:", chapterOptions);

    // Log each plan individually to debug
    plans.forEach((plan, index) => {
      console.log(`Plan ${index}:`, {
        chapter: plan.chapter,
        chapterValid:
          plan.chapter &&
          plan.chapter.trim() !== "" &&
          plan.chapter !== chapterOptions[0],
        subTopic: plan.subTopic,
        subTopicValid: plan.subTopic && plan.subTopic.trim() !== "",
        startDate: plan.startDate,
        startDateValid: plan.startDate && plan.startDate.trim() !== "",
        teachingMethod: plan.teachingMethod,
        teachingMethodValid:
          plan.teachingMethod && plan.teachingMethod.trim() !== "",
      });
    });

    const filteredPlans = plans.filter(
      (p) =>
        p.chapter &&
        p.chapter.trim() !== "" &&
        p.chapter !== chapterOptions[0] &&
        p.subTopic &&
        p.subTopic.trim() !== "" &&
        p.startDate &&
        p.startDate.trim() !== "" &&
        p.teachingMethod &&
        p.teachingMethod.trim() !== "",
    );

    console.log("✅ Filtered plans:", filteredPlans);

    if (filteredPlans.length === 0) {
      setMessage(
        "⚠️ Please fill in all fields (Chapter, Sub-Topic, Start Date, Teaching Method).",
      );
      return;
    }

    setLoading(true);
    try {
      // Auto-generate week number based on existing plans
      const weekNo =
        teachingPlans.length > 0
          ? Math.max(...teachingPlans.map((p) => p.weekNo)) + 1
          : 1;

      const res = await fetch(
        `http://localhost:5000/api/teaching-plan/${ciannId}/${weekNo}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plans: filteredPlans }),
        },
      );
      if (!res.ok) throw new Error("Failed to save teaching plan");

      const updatedRes = await fetch(
        `http://localhost:5000/api/teaching-plan/${ciannId}`,
      );
      const updatedData = await updatedRes.json();
      setTeachingPlans(updatedData);
      setPlanningStarted(true);
      setView("sheet");
      setPlans([]);
      setMessage("✅ Data submitted successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("❌ Error saving teaching plan: " + err.message);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getPlansForPage = (page) => {
    const startWeek = (page - 1) * 4 + 1;
    const endWeek = startWeek + 3;
    return teachingPlans.filter(
      (p) => p.weekNo >= startWeek && p.weekNo <= endWeek,
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
              data-label="Entry No."
              className="entry-no"
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
        </tr>,
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
            setPlans([]);
            setMessage("");
          }}
          title="Close"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="tps-modal-header">
          {view === "edit" ? "Edit Teaching Plan" : "Add Teaching Plan"}
        </div>

        {/* Chapter fetch error message */}
        {chaptersFetchError && (
          <div
            style={{
              margin: "20px 20px 0 20px",
              padding: "12px 16px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "8px",
              color: "#856404",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <strong>⚠️ Warning:</strong> {chaptersFetchError}
            <br />
            <small>
              Go to Dashboard → Manage Courses → Select Course → Manage Chapters
            </small>
          </div>
        )}

        {/* Loading indicator */}
        {chaptersLoading && (
          <div
            style={{
              margin: "20px",
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
            }}
          >
            Loading chapters...
          </div>
        )}

        <div className="weekwise-form-container">
          {" "}
          {/* Renamed for clarity */}
          <div className="form-grid">
            <div className="form-labels">
              {" "}
              {/* This div acts as the table header */}
              <label>Chapter</label>
              <label>Sub-Topic</label>
              <label>Start Date</label>
              <label>Teaching Methods</label>
            </div>
            {plans.map((plan, index) => (
              <div className="form-row" key={index}>
                <select
                  value={plan.chapter || chapterOptions[0] || ""}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log(
                      `📝 Chapter selected for row ${index + 1}:`,
                      selectedValue,
                    );
                    console.log(
                      "📦 Current plans state BEFORE update:",
                      JSON.stringify(plans),
                    );

                    // Direct state update
                    const newPlans = [...plans];
                    newPlans[index] = {
                      ...newPlans[index],
                      chapter: selectedValue,
                    };
                    console.log(
                      "💾 New plans state AFTER update:",
                      JSON.stringify(newPlans),
                    );
                    setPlans(newPlans);
                  }}
                  className="form-input"
                  disabled={chaptersLoading || chapterOptions.length <= 1}
                  style={{
                    cursor:
                      chaptersLoading || chapterOptions.length <= 1
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      chaptersLoading || chapterOptions.length <= 1
                        ? "#f5f5f5"
                        : "white",
                  }}
                >
                  {chapterOptions.map((opt, optIndex) => (
                    <option
                      key={`${opt}-${optIndex}`}
                      value={opt}
                      disabled={optIndex === 0}
                      selected={optIndex === 0 && !plan.chapter}
                    >
                      {opt}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Sub-Topic"
                  value={plan.subTopic || ""}
                  onChange={(e) =>
                    handleChange(index, "subTopic", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  type="date"
                  value={plan.startDate || ""}
                  onChange={(e) =>
                    handleChange(index, "startDate", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Teaching Methods"
                  value={plan.teachingMethod || ""}
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
        onMenuToggle={() => {
          setIsSidebarVisible((v) => !v);
          window.dispatchEvent(new CustomEvent("faculty:toggle-main-sidebar"));
        }}
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
                      console.log("📅 Start Planning clicked");
                      setPlanningStarted(true);
                      setView("add");
                      setPlans([
                        {
                          chapter: "",
                          subTopic: "",
                          startDate: "",
                          endDate: "",
                          teachingMethod: "",
                        },
                      ]);
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
                        console.log("📢 Add New Plan clicked");
                        setView("add");
                        setPlans([
                          {
                            chapter: "",
                            subTopic: "",
                            startDate: "",
                            endDate: "",
                            teachingMethod: "",
                          },
                        ]);
                      }}
                      disabled={loading}
                    >
                      Add New Plan
                    </button>
                    <button
                      className="start-btn btn submit"
                      onClick={() => {
                        console.log("📋 Edit Plan clicked");
                        setView("edit");
                        setPlans([
                          {
                            chapter: "",
                            subTopic: "",
                            startDate: "",
                            endDate: "",
                            teachingMethod: "",
                          },
                        ]);
                      }}
                      disabled={loading}
                    >
                      Edit Plan
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
                        <th>Entry No.</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Teaching Methods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planningStarted &&
                        [...Array(4)].flatMap((_, i) =>
                          renderWeekRow((currentPage - 1) * 4 + i + 1),
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
