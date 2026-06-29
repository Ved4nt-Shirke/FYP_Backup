import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../basic/Header";
import "./Tutorial.css";

const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const todayWithOffset = new Date(today.getTime() - offset * 60 * 1000);
  return todayWithOffset.toISOString().split("T")[0];
};

const TutorialAttendanceFormModal = ({
  weekNo,
  chapter,
  topic,
  plannedDate,
  ciannData,
  onClose,
  onSubmit,
}) => {
  const today = getTodayDateString();
  const [actualDate, setActualDate] = useState(today);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!actualDate) {
      setError("Please select the actual date.");
      return;
    }
    setError("");
    onSubmit(actualDate, remark);
  };

  return (
    <div className="tutorial-modal-overlay">
      <div className="tutorial-modal-form">
        <h2>Tutorial Attendance Form</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {ciannData && (
          <div className="tutorial-modal-context-header">
            <p className="tutorial-modal-subject">
              {ciannData.subject?.name} ({ciannData.subject?.code})
            </p>
            <p className="tutorial-modal-meta">
              Division: {ciannData.division} | Department:{" "}
              {ciannData.department?.name || "N/A"}
            </p>
          </div>
        )}

        <div className="form-content">
          <form onSubmit={handleSubmit}>
            <div className="tutorial-form-group">
              <label>Week / Entry No.</label>
              <input type="text" value={weekNo ? `Week ${weekNo}` : ""} readOnly />
            </div>
            <div className="tutorial-form-group">
              <label>Chapter</label>
              <input type="text" value={chapter || ""} readOnly />
            </div>
            <div className="tutorial-form-group">
              <label>Topic / Sub Topic</label>
              <input type="text" value={topic || ""} readOnly />
            </div>
            <div className="tutorial-form-group">
              <label>Planned Date</label>
              <input type="text" value={plannedDate || ""} readOnly />
            </div>
            <div className="tutorial-form-group">
              <label>Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => {
                  setActualDate(e.target.value);
                  if (e.target.value) setError("");
                }}
                max={today}
                required
              />
              {error && <p className="validation-error">{error}</p>}
            </div>
            <div className="tutorial-form-group">
              <label>Remark (Optional)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter any remarks"
              />
            </div>
            <div className="button-group">
              <button type="button" className="btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn submit">
                Proceed to Mark Attendance
              </button>
            </div>
          </form>
        </div>
        <footer>
          Copyright © 2026. All rights reserved Vidyalankar Polytechnic
        </footer>
      </div>
    </div>
  );
};

const TutorialAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ciannData = location.state?.ciannData;

  const [tutorialPlans, setTutorialPlans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!ciannData) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ciannId = ciannData.ciannId;
        const planRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/tutorial-plan/${ciannId}`
        );

        if (planRes.ok) {
          const planData = await planRes.json();
          setTutorialPlans(Array.isArray(planData) ? planData : []);
        }

        const attRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/tutorial-attendance?ciannId=${ciannId}`
        );

        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceRecords(Array.isArray(attData) ? attData : []);
        }
      } catch (err) {
        console.error("Error fetching tutorial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ciannData]);

  const allRows = useMemo(() => {
    return tutorialPlans.flatMap((weekPlan) =>
      (weekPlan.plans || []).map((plan) => {
        const attendance = attendanceRecords.find(
          (att) => att.Topic === plan.subTopic
        );

        return {
          weekNo: weekPlan.weekNo,
          chapter: plan.chapter || "",
          subTopic: plan.subTopic || "",
          plannedDate: plan.startDate || "",
          attendance: !!attendance,
          teachingMethod: plan.teachingMethod || "",
        };
      })
    );
  }, [tutorialPlans, attendanceRecords]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(allRows.length / itemsPerPage) || 1;
  const paginatedRows = allRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleOpenModal = (row) => {
    if (row.attendance) return;
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  if (!ciannData) {
    return (
      <div>
        <Header />
        <div className="attendance-main-content">
          <div className="tutorial-page-container">
            <h3>No CIAAN selected. Please select a CIAAN card first.</h3>
          </div>
        </div>
      </div>
    );
  }

  const markedCount = allRows.filter((row) => row.attendance).length;
  const pendingCount = allRows.length - markedCount;

  return (
    <div>
      <Header />
      <div className="attendance-main-content">
        <div className="tutorial-page-container">
          <header className="tutorial-header">
            <div className="tutorial-header-main">
              <p className="tutorial-eyebrow">Attendance Console</p>
              <h2 className="tutorial-title">Mark Tutorial Attendance</h2>
              <p className="tutorial-subtitle">
                {ciannData.subject?.name} ({ciannData.subject?.code})
              </p>
            </div>
            <div className="tutorial-header-meta">
              <div>
                <span>Division</span>
                <strong>{ciannData.division || "N/A"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{ciannData.department?.name || "N/A"}</strong>
              </div>
              <div>
                <span>Semester</span>
                <strong>{ciannData.semester || "N/A"}</strong>
              </div>
            </div>
          </header>

          <section className="tutorial-metrics">
            <div className="metric-card">
              <span>Tutorials</span>
              <strong>{allRows.length}</strong>
            </div>
            <div className="metric-card success">
              <span>Marked</span>
              <strong>{markedCount}</strong>
            </div>
            <div className="metric-card warning">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
          </section>

          <section className="tutorial-table-section">
            <div className="tutorial-table-head">
              <div>
                <h3>Tutorials Schedule</h3>
                <p>Click the checkbox to mark attendance for a tutorial topic.</p>
              </div>
              <div className="tutorial-badge">CIAAN ID {ciannData.ciannId}</div>
            </div>

            <div className="tutorial-table-container">
              {loading ? (
                <div className="tutorial-loading">Loading tutorial schedule...</div>
              ) : allRows.length === 0 ? (
                <div className="tutorial-empty">
                  <h4>No tutorial plan found</h4>
                  <p>Add a tutorial plan first to start marking attendance.</p>
                </div>
              ) : (
                <table className="tutorial-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Chapter</th>
                      <th>Topic</th>
                      <th>Planned Date</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={`${row.subTopic}-${index}`}>
                        <td data-label="Week">Week {row.weekNo}</td>
                        <td data-label="Chapter">{row.chapter || "-"}</td>
                        <td data-label="Topic">{row.subTopic || "-"}</td>
                        <td data-label="Planned Date">{row.plannedDate || "-"}</td>
                        <td data-label="Attendance">
                          <label
                            className={`checkbox-pill ${row.attendance ? "is-locked" : ""}`}
                            onClick={() => handleOpenModal(row)}
                            title={
                              row.attendance
                                ? "Attendance already marked"
                                : "Click to mark attendance"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={row.attendance}
                              readOnly
                            />
                            <span>{row.attendance ? "Marked" : "Mark"}</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {allRows.length > 0 && (
            <div className="tutorial-pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-indicator">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedRow && (
        <TutorialAttendanceFormModal
          weekNo={selectedRow.weekNo}
          chapter={selectedRow.chapter}
          topic={selectedRow.subTopic}
          plannedDate={selectedRow.plannedDate}
          ciannData={ciannData}
          onClose={closeModal}
          onSubmit={(actualDate, remark) => {
            localStorage.setItem("topic", selectedRow.subTopic);
            localStorage.setItem("date", actualDate);
            localStorage.setItem("remark", remark);
            localStorage.setItem("ciannData", JSON.stringify(ciannData));
            navigate("/student-attendance");
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default TutorialAttendance;
