import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    pendingExams: 0,
    studentsAttempted: 0,
    averageScore: "0.0",
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const [examsRes, resultsRes] = await Promise.all([
          axios.get(config.mockExams),
          axios.get(`${config.mockExams}/results/summary`),
        ]);

        const exams = examsRes.data?.exams || [];
        const attempts = resultsRes.data?.attempts || [];

        const totalExams = exams.length;
        const publishedExams = exams.filter((e) => e.isPublished).length;
        const pendingExams = totalExams - publishedExams;
        const studentsAttempted = attempts.length;

        // Calculate average score percentage
        let averageScore = 0;
        if (attempts.length > 0) {
          const sumPct = attempts.reduce((acc, curr) => {
            const pct = curr.totalMarks ? (curr.score / curr.totalMarks) * 100 : 0;
            return acc + pct;
          }, 0);
          averageScore = (sumPct / attempts.length).toFixed(1);
        }

        setStats({
          totalExams,
          publishedExams,
          pendingExams,
          studentsAttempted,
          averageScore,
        });

        // Set recent activities (top 5 attempts)
        const recent = attempts.slice(0, 5).map((att) => ({
          id: att._id,
          studentName: att.studentId?.studentName || "Student",
          examTitle: att.examId?.title || "Mock Exam",
          scorePct: att.totalMarks ? ((att.score / att.totalMarks) * 100).toFixed(0) : "0",
          time: new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(att.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        }));
        setRecentActivities(recent);
      } catch (err) {
        console.error("Error loading faculty dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const cards = [
    {
      title: "Create Mock Exam",
      description: "Configure academic years, shufflers, timer limits, sections, and add/upload questions.",
      action: () => navigate("/faculty/mock-exams/create"),
      icon: "bi-plus-circle-fill",
      color: "var(--primary-color)",
    },
    {
      title: "Manage Exams",
      description: "Search, filter, preview, edit, delete, duplicate or schedule publishing for exams.",
      action: () => navigate("/faculty/mock-exams/manage"),
      icon: "bi-list-check",
      color: "#2563eb", // blue
    },
    {
      title: "Result Analytics",
      description: "Review comprehensive charts, toppers list, chapter-wise metrics and print reports.",
      action: () => navigate("/faculty/mock-exams/results"),
      icon: "bi-bar-chart-line-fill",
      color: "#8b5cf6", // purple
    },
  ];

  if (loading) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status" />
          <div className="text-muted">Loading Workspace Stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">
              <i className="bi bi-clipboard2-pulse-fill me-1" /> Mock Exam Module
            </span>
            <h1 className="mock-exam-title">Faculty Dashboard</h1>
            <p className="mock-exam-subtitle">
              Configure Mock Examinations, validate uploaded questions, review class statistics, and access centralized question banks.
            </p>
          </div>
          <button className="mock-exam-button" onClick={() => navigate("/faculty/mock-exams/create")}>
            <i className="bi bi-plus-lg" /> Create Exam
          </button>
        </div>

        {/* Dashboard Stat Grid */}
        <div className="mock-exam-grid cols-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="mock-exam-card">
            <div className="mock-exam-card-title">Total Exams</div>
            <strong>{stats.totalExams}</strong>
            <span className="badge-sec mt-2 d-inline-block">All Time</span>
          </div>
          <div className="mock-exam-card">
            <div className="mock-exam-card-title">Published</div>
            <strong>{stats.publishedExams}</strong>
            <span className="badge-sec mt-2 d-inline-block" style={{ color: "#10b981", background: "rgba(16,185,129,0.05)" }}>Active / Scheduled</span>
          </div>
          <div className="mock-exam-card">
            <div className="mock-exam-card-title">Draft / Pending</div>
            <strong>{stats.pendingExams}</strong>
            <span className="badge-sec mt-2 d-inline-block" style={{ color: "#ef4444", background: "rgba(239,68,68,0.05)" }}>Requires Action</span>
          </div>
          <div className="mock-exam-card">
            <div className="mock-exam-card-title">Submissions</div>
            <strong>{stats.studentsAttempted}</strong>
            <span className="badge-sec mt-2 d-inline-block">Student Attempts</span>
          </div>
          <div className="mock-exam-card">
            <div className="mock-exam-card-title">Avg. Score</div>
            <strong>{stats.averageScore}%</strong>
            <span className="badge-sec mt-2 d-inline-block">Class Performance</span>
          </div>
        </div>

        <div className="row g-4 mt-2">
          {/* Quick Actions List */}
          <div className="col-lg-7">
            <h2 className="mock-exam-card-title mb-3" style={{ fontSize: "1.1rem" }}>Quick Operations</h2>
            <div className="d-flex flex-column gap-3">
              {cards.map((card) => (
                <div key={card.title} className="mock-exam-card d-flex align-items-center justify-content-between p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: card.color + "12",
                        color: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.45rem",
                      }}
                    >
                      <i className={`bi ${card.icon}`} />
                    </div>
                    <div>
                      <h4 className="mb-1" style={{ fontSize: "1.05rem", fontWeight: 700 }}>{card.title}</h4>
                      <p className="text-muted mb-0" style={{ fontSize: "0.85rem", maxWidth: "450px" }}>{card.description}</p>
                    </div>
                  </div>
                  <button className="mock-exam-button secondary" onClick={card.action} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Panel */}
          <div className="col-lg-5">
            <div className="mock-exam-card h-100">
              <h2 className="mock-exam-card-title mb-3" style={{ fontSize: "1.1rem" }}>
                <i className="bi bi-clock-history me-1" /> Recent Submissions
              </h2>
              {recentActivities.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="d-flex align-items-center justify-content-between border-bottom pb-2" style={{ fontSize: "0.88rem" }}>
                      <div>
                        <strong className="d-block text-dark">{act.studentName}</strong>
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>{act.examTitle}</span>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success me-2">{act.scorePct}%</span>
                        <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>{act.date} at {act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-info-circle mb-2" style={{ fontSize: "2rem" }} />
                  <div>No recent student submissions found.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockExamDashboard;
