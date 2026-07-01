import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import { config, getApiUrl } from "../../config/api";
import "./WeekwisePlan1.css";
import "./TeachingPlanSheet.css";
import "./EditCiannModern.css";
import "./TutorialPlanSheet.css";

// Modal styles matching the TeachingPlan component's look
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.7)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    background: "var(--Ciaan-surface, #ffffff)",
    border: "1px solid var(--Ciaan-border, #dbe5f2)",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "90vh",
    animation: "fadeIn 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    padding: "0",
    marginTop: "0",
  },
};

const TutorialPlanSheet = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const CiaanId = CiaanData?.CiaanId;

  useEffect(() => {
    if (!CiaanData) {
      const storedCiaanData = sessionStorage.getItem("currentCiaanData");
      if (storedCiaanData) {
        try {
          const parsedData = JSON.parse(storedCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }

      const localCiaanData = localStorage.getItem("CiaanData");
      if (localCiaanData) {
        try {
          const parsedData = JSON.parse(localCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            sessionStorage.setItem("currentCiaanData", JSON.stringify(parsedData));
            return;
          }
        } catch (error) {
          console.error("Error parsing local CIAAN data:", error);
        }
      }
    } else {
      sessionStorage.setItem("currentCiaanData", JSON.stringify(CiaanData));
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    }
  }, [CiaanData]);

  const onBack = () => navigate(-1);

  const [view, setView] = useState("sheet");
  const [plans, setPlans] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);
  const [tutorialPlans, setTutorialPlans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalWeek, setModalWeek] = useState("");

  const [chapterOptions, setChapterOptions] = useState(["--- Select Chapter ---"]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersFetchError, setChaptersFetchError] = useState(null);

  // Fetch chapter list for the selected Ciaan from backend
  useEffect(() => {
    if (!CiaanData) return;
    const fetchChapters = async () => {
      try {
        const courseName = CiaanData?.subject?.name;
        const programLabel = CiaanData?.department?.label;
        const className = CiaanData?.class;

        if (!courseName) {
          setChaptersFetchError("Course information not available");
          return;
        }

        setChaptersLoading(true);
        setChaptersFetchError(null);

        const res = await fetch(
          getApiUrl("/course-chapters/get-chapters"),
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

        if (data.success && data.chp && data.chp.length > 0) {
          const dynamicOptions = data.chp
            .sort((a, b) => (a.chapterNo || 0) - (b.chapterNo || 0))
            .map((c) => `Unit - ${c.chapterNo}. ${c.chapterName}`);
          setChapterOptions(["--- Select Chapter ---", ...dynamicOptions]);
        } else {
          setChapterOptions(["--- Select Chapter ---"]);
          setChaptersFetchError(
            `No chapters found for ${courseName}. Please add chapters in Course Management first.`,
          );
        }
      } catch (err) {
        console.error("Failed to fetch chapters:", err);
        setChapterOptions(["--- Select Chapter ---"]);
        setChaptersFetchError(`Error loading chapters: ${err.message}`);
      } finally {
        setChaptersLoading(false);
      }
    };
    fetchChapters();
  }, [CiaanData]);

  // Fetch tutorial plans
  useEffect(() => {
    const fetchPlans = async () => {
      if (!CiaanId) {
        setTutorialPlans([]);
        setPlanningStarted(false);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          getApiUrl(`/tutorial-plan/${CiaanId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (res.status === 404) {
          setTutorialPlans([]);
          setPlanningStarted(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTutorialPlans(data);
        setPlanningStarted(data.length > 0);
      } catch (err) {
        console.error("Failed to fetch tutorial plans:", err);
        setTutorialPlans([]);
        setPlanningStarted(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [CiaanId]);

  // Fetch tutorial attendance records
  useEffect(() => {
    if (!CiaanId) return;
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          getApiUrl(`/tutorial-attendance?CiaanId=${CiaanId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAttendanceRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching tutorial attendance:", err);
      }
    };
    fetchAttendance();
  }, [CiaanId]);

  const handleWeekChange = (selectedWeekVal) => {
    setModalWeek(selectedWeekVal);
    if (selectedWeekVal) {
      const numericWeek = parseInt(selectedWeekVal.replace("Week ", ""));
      const found = tutorialPlans.find((p) => p.weekNo === numericWeek);
      if (found && found.plans && found.plans.length > 0) {
        setPlans(
          found.plans.map((p) => ({
            chapter: p.chapter || "",
            subTopic: p.subTopic || "",
            startDate: p.startDate || "",
            teachingMethod: p.teachingMethod || "",
          }))
        );
      } else {
        setPlans([
          {
            chapter: "",
            subTopic: "",
            startDate: "",
            teachingMethod: "",
          },
        ]);
      }
    } else {
      setPlans([]);
    }
  };

  const handleChange = (index, field, value) => {
    let updated = [...plans];
    if (updated.length === 0 || !updated[index]) {
      updated = [
        {
          chapter: "",
          subTopic: "",
          startDate: "",
          teachingMethod: "",
        },
      ];
    }
    updated[index][field] = value;
    setPlans(updated);
  };

  const handleSubmit = async () => {
    if (!CiaanId) {
      setMessage("⚠️ No CIAAN ID available. Cannot save plan.");
      return;
    }

    if (!modalWeek) {
      setMessage("⚠️ Please select a week.");
      return;
    }

    const numericWeek = parseInt(modalWeek.replace("Week ", ""));

    const filteredPlans = plans.filter(
      (p) =>
        p.chapter &&
        p.chapter.trim() !== "" &&
        p.chapter !== chapterOptions[0] &&
        p.subTopic &&
        p.subTopic.trim() !== "" &&
        p.startDate &&
        p.startDate.trim() !== ""
    );

    if (filteredPlans.length === 0) {
      setMessage(
        "⚠️ Please fill in all fields (Chapter, Sub-Topic, Start Date) for at least one row.",
      );
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        getApiUrl(`/tutorial-plan/${CiaanId}/${numericWeek}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ plans: filteredPlans }),
        },
      );
      if (!res.ok) throw new Error("Failed to save tutorial plan");

      const updatedRes = await fetch(
        getApiUrl(`/tutorial-plan/${CiaanId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const updatedData = await updatedRes.json();
      setTutorialPlans(updatedData);
      setPlanningStarted(updatedData.length > 0);
      setView("sheet");
      setPlans([]);
      setModalWeek("");
      setMessage("✅ Data submitted successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("❌ Error saving tutorial plan: " + err.message);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderWeekRow = (week) => {
    const found = tutorialPlans.find((p) => p.weekNo === week);
    const plansForWeek = found && found.plans ? found.plans : [];

    if (plansForWeek.length > 0) {
      return plansForWeek.map((p, i) => {
        return (
          <tr
            key={`week-${week}-row-${i}`}
            style={{ borderBottom: i === plansForWeek.length - 1 ? "2px solid #e0e0e0" : "none" }}
            className="table-row"
          >
            {i === 0 && (
              <td
                rowSpan={plansForWeek.length}
                style={{ textAlign: "center", verticalAlign: "middle" }}
                data-label="Week No."
                className="entry-no"
              >
                {week}
              </td>
            )}
            <td data-label="Chapter">{p.chapter || ""}</td>
            <td data-label="Sub-Topic">{p.subTopic || ""}</td>
            <td data-label="Start Date">{p.startDate || ""}</td>
            <td data-label="Teaching Method">{p.teachingMethod || ""}</td>
          </tr>
        );
      });
    } else {
      return (
        <tr
          key={`week-${week}-empty`}
          style={{ borderBottom: "2px solid #e0e0e0" }}
          className="table-row"
        >
          <td
            style={{ textAlign: "center", verticalAlign: "middle" }}
            data-label="Week No."
            className="entry-no"
          >
            {week}
          </td>
          <td data-label="Chapter"></td>
          <td data-label="Sub-Topic"></td>
          <td data-label="Start Date"></td>
          <td data-label="Teaching Method"></td>
        </tr>
      );
    }
  };

  const renderModalForm = () => (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content} className="tps-modal">
        <button
          className="tps-close-btn"
          onClick={() => {
            setView("sheet");
            setPlans([]);
            setModalWeek("");
            setMessage("");
          }}
          title="Close"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="tps-modal-header">
          {view === "edit" ? "Edit Tutorial Plan" : "Add Tutorial Plan"}
        </div>

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

        {chaptersLoading && (
          <div style={{ margin: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            Loading chapters...
          </div>
        )}

        <div className="weekwise-form-container">
          <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "15px 0" }}>
            <label style={{ fontWeight: "600", fontSize: "15px", color: "var(--Ciaan-text, #495057)" }}>Select Week:</label>
            <select
              value={modalWeek}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="form-input"
              style={{ width: "160px", padding: "6px 10px", fontSize: "14px", border: "1px solid var(--Ciaan-border, #dde3ea)", borderRadius: "8px", background: "var(--Ciaan-surface, #ffffff)", color: "var(--Ciaan-text, #10223d)" }}
            >
              <option value="">Select Week</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={`Week ${i + 1}`}>
                  Week {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="plan-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="plan-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Chapter</th>
                  <th style={{ width: "25%" }}>Sub-Topic</th>
                  <th style={{ width: "15%" }}>Start Date</th>
                  <th style={{ width: "20%" }}>Teaching Method</th>
                  <th style={{ width: "5%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={plan.chapter || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...plans];
                          updated[index].chapter = val;
                          setPlans(updated);
                        }}
                        disabled={!modalWeek || chaptersLoading || chapterOptions.length <= 1}
                        className="form-input"
                      >
                        <option value="">Select Chapter</option>
                        {chapterOptions.slice(1).map((opt, optIndex) => (
                          <option key={`${opt}-${optIndex}`} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Sub-Topic"
                        value={plan.subTopic || ""}
                        onChange={(e) => handleChange(index, "subTopic", e.target.value)}
                        disabled={!modalWeek}
                        className="form-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={plan.startDate || ""}
                        onChange={(e) => handleChange(index, "startDate", e.target.value)}
                        onFocus={(e) => e.target.showPicker()}
                        disabled={!modalWeek}
                        className="form-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Teaching Method"
                        value={plan.teachingMethod || ""}
                        onChange={(e) => handleChange(index, "teachingMethod", e.target.value)}
                        disabled={!modalWeek}
                        className="form-input"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = plans.filter((_, i) => i !== index);
                          setPlans(updated);
                        }}
                        disabled={!modalWeek || plans.length <= 1}
                        className="delete-row-btn"
                        style={{
                          background: "none",
                          border: "none",
                          color: plans.length <= 1 ? "#ccc" : "#d32f2f",
                          fontSize: "20px",
                          cursor: plans.length <= 1 ? "not-allowed" : "pointer",
                          padding: "4px 8px",
                        }}
                        title="Delete Row"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {modalWeek && (
            <button
              type="button"
              onClick={() => {
                setPlans([
                  ...plans,
                  {
                    chapter: "",
                    subTopic: "",
                    startDate: "",
                    teachingMethod: "",
                  },
                ]);
              }}
              className="btn submit"
              style={{
                marginTop: "15px",
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "var(--primary-color, #2e7d32)",
                color: "var(--text-on-primary, white)",
                borderRadius: "8px",
                border: "1px solid var(--primary-accent, rgba(26, 87, 185, 0.26))",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}
            >
              + Add Row
            </button>
          )}

          {message && <div className="submission-message">{message}</div>}
        </div>
        <div className="button-group">
          <button
            className="btn cancel"
            onClick={() => {
              setView("sheet");
              setPlans([]);
              setModalWeek("");
              setMessage("");
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn submit"
            onClick={handleSubmit}
            disabled={loading || !modalWeek}
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
        <div style={{ filter: "blur(2px)", pointerEvents: "none", userSelect: "none" }}>
          {/* Dimmed background */}
        </div>
      </>
    );
  }

  if (!CiaanData) {
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
      <div className="teaching-main-row">
        <div className="syllabus-secondary-sidebar-wrapper">
          <SecondarySidebar
            CiaanData={CiaanData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="teaching-main-content syllabus-main-content has-secondary-sidebar">
          <div className="plan-container">
            <div className="header-row">
              <h3 className="plan-title">6. Tutorial Plan (TUT)</h3>
              <div className="plan-actions-top-right">
                {!planningStarted ? (
                  <button
                    className="start-btn btn submit"
                    onClick={() => {
                      setPlanningStarted(true);
                      setView("add");
                      const nextWeek = tutorialPlans.length > 0
                        ? Math.max(...tutorialPlans.map((p) => p.weekNo)) + 1
                        : 1;
                      handleWeekChange(`Week ${nextWeek}`);
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
                        const nextWeek = tutorialPlans.length > 0
                          ? Math.max(...tutorialPlans.map((p) => p.weekNo)) + 1
                          : 1;
                        handleWeekChange(`Week ${nextWeek}`);
                      }}
                      disabled={loading}
                    >
                      Add New Plan
                    </button>
                    <button
                      className="start-btn btn submit"
                      onClick={() => {
                        setView("edit");
                        const latestWeek = tutorialPlans.length > 0
                          ? Math.max(...tutorialPlans.map((p) => p.weekNo))
                          : 1;
                        handleWeekChange(`Week ${latestWeek}`);
                      }}
                      disabled={loading}
                    >
                      Edit Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="Ciaan-details">
              CIAAN ID: <strong>{CiaanData.CiaanId}</strong> | Division:{" "}
              <strong>{CiaanData.division}</strong>
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
                  <table className="teaching-table tutorial-table">
                    <thead>
                      <tr>
                        <th>Week No.</th>
                        <th>Chapter</th>
                        <th>Sub-Topic</th>
                        <th>Start Date</th>
                        <th>Teaching Method</th>
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
                &larr; Previous
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 4 || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Forward &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPlanSheet;
