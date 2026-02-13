import React, { useState, useEffect } from "react";
import { config } from "../config/api";
import "./CTMarks.css";

const CTMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [stats, setStats] = useState({
    averageCT1: 0,
    averageCT2: 0,
    totalSubjects: 0,
    overallAverage: 0,
  });

  useEffect(() => {
    fetchCTMarks();
  }, []);

  const fetchCTMarks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const enrollmentNo = localStorage.getItem("enrollmentNo");

      const response = await fetch(
        `${config.API_URL}/api/ct-marks/student/${enrollmentNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setMarks(Array.isArray(data) ? data : []);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching CT marks:", err);
      setError("Failed to load CT marks");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (marksData) => {
    if (!marksData || marksData.length === 0) return;

    const ct1Marks = marksData.filter((m) => m.ct1 !== null).map((m) => m.ct1);
    const ct2Marks = marksData.filter((m) => m.ct2 !== null).map((m) => m.ct2);

    const avgCT1 =
      ct1Marks.length > 0
        ? ct1Marks.reduce((a, b) => a + b, 0) / ct1Marks.length
        : 0;
    const avgCT2 =
      ct2Marks.length > 0
        ? ct2Marks.reduce((a, b) => a + b, 0) / ct2Marks.length
        : 0;

    setStats({
      averageCT1: avgCT1.toFixed(2),
      averageCT2: avgCT2.toFixed(2),
      totalSubjects: marksData.length,
      overallAverage: ((avgCT1 + avgCT2) / 2).toFixed(2),
    });
  };

  const subjects = ["all", ...new Set(marks.map((m) => m.subjectName))];
  const filteredMarks =
    selectedSubject === "all"
      ? marks
      : marks.filter((m) => m.subjectName === selectedSubject);

  const getGrade = (marks) => {
    if (marks >= 90) return { grade: "A+", color: "#27ae60" };
    if (marks >= 80) return { grade: "A", color: "#2ecc71" };
    if (marks >= 70) return { grade: "B+", color: "#f39c12" };
    if (marks >= 60) return { grade: "B", color: "#e67e22" };
    if (marks >= 50) return { grade: "C", color: "#e74c3c" };
    return { grade: "F", color: "#c0392b" };
  };

  return (
    <div className="ct-marks-container">
      <div className="ct-header">
        <h1>📊 CT Marks Dashboard</h1>
        <p>Track your continuous test performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#3498db30" }}>
            📝
          </div>
          <div className="stat-info">
            <h3>{stats.averageCT1}%</h3>
            <p>CT1 Average</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e74c3c30" }}>
            📝
          </div>
          <div className="stat-info">
            <h3>{stats.averageCT2}%</h3>
            <p>CT2 Average</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#2ecc7130" }}>
            📊
          </div>
          <div className="stat-info">
            <h3>{stats.overallAverage}%</h3>
            <p>Overall Average</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f39c1230" }}>
            📚
          </div>
          <div className="stat-info">
            <h3>{stats.totalSubjects}</h3>
            <p>Total Subjects</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <label>Filter by Subject:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="subject-select"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject === "all" ? "All Subjects" : subject}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Loading marks...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && filteredMarks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Marks Available</h3>
          <p>Your CT marks will appear here once published by faculty</p>
        </div>
      )}

      {!loading && !error && filteredMarks.length > 0 && (
        <div className="marks-grid">
          {filteredMarks.map((mark, index) => {
            const ct1Grade = mark.ct1 ? getGrade(mark.ct1) : null;
            const ct2Grade = mark.ct2 ? getGrade(mark.ct2) : null;
            const average =
              mark.ct1 && mark.ct2 ? ((mark.ct1 + mark.ct2) / 2).toFixed(2) : null;

            return (
              <div key={`${mark._id}-${index}`} className="mark-card">
                <div className="mark-header">
                  <h3>{mark.subjectName || "Subject"}</h3>
                  <span className="subject-code">{mark.subjectCode}</span>
                </div>

                <div className="marks-display">
                  <div className="ct-mark">
                    <div className="ct-label">CT 1</div>
                    <div className="mark-value">
                      {mark.ct1 !== null && mark.ct1 !== undefined ? (
                        <>
                          <span className="marks">{mark.ct1}</span>
                          <span className="out-of">/20</span>
                          {ct1Grade && (
                            <span
                              className="grade"
                              style={{ background: ct1Grade.color }}
                            >
                              {ct1Grade.grade}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="not-published">Not Published</span>
                      )}
                    </div>
                  </div>

                  <div className="ct-mark">
                    <div className="ct-label">CT 2</div>
                    <div className="mark-value">
                      {mark.ct2 !== null && mark.ct2 !== undefined ? (
                        <>
                          <span className="marks">{mark.ct2}</span>
                          <span className="out-of">/20</span>
                          {ct2Grade && (
                            <span
                              className="grade"
                              style={{ background: ct2Grade.color }}
                            >
                              {ct2Grade.grade}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="not-published">Not Published</span>
                      )}
                    </div>
                  </div>
                </div>

                {average && (
                  <div className="average-section">
                    <span>Average:</span>
                    <strong>{average}%</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Tips */}
      <div className="performance-tips">
        <h2>💡 Tips to Improve Performance</h2>
        <div className="tips-list">
          <div className="tip-item">
            <span className="tip-icon">✅</span>
            <p>Attend all classes regularly</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📖</span>
            <p>Review lecture notes daily</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">💬</span>
            <p>Clarify doubts with faculty</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <p>Practice previous year questions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTMarks;
