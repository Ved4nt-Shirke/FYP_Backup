import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamManage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(config.mockExams, { params: { status } });
      setExams(response.data?.exams || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load mock exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [status]);

  const summary = useMemo(
    () => ({
      total: exams.length,
      published: exams.filter((exam) => exam.isPublished).length,
      attempts: exams.reduce((count, exam) => count + Number(exam.attempts || 0), 0),
    }),
    [exams],
  );

  const updateStatus = async (id, isPublished) => {
    await axios.patch(`${config.mockExams}/${id}/publish`, { isPublished });
    await loadExams();
  };

  const duplicateExam = async (id) => {
    await axios.post(`${config.mockExams}/${id}/duplicate`);
    await loadExams();
  };

  const deleteExam = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    await axios.delete(`${config.mockExams}/${id}`);
    await loadExams();
  };

  return (
    <div className="mock-exam-shell">
      <section className="mock-exam-hero">
        <h1 className="mock-exam-title">Manage Mock Exams</h1>
        <p className="mock-exam-subtitle">View all exams, edit them, duplicate them, and control publication status.</p>
      </section>

      <div className="mock-exam-toolbar">
        <div className="mock-exam-field" style={{ maxWidth: 220 }}>
          <label>Status Filter</label>
          <select className="mock-exam-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="mock-exam-actions" style={{ marginLeft: "auto" }}>
          <button className="mock-exam-btn secondary" onClick={() => navigate("/faculty/mock-exams/create")}>Create Exam</button>
        </div>
      </div>

      <div className="mock-exam-grid cols-3" style={{ marginBottom: 16 }}>
        <div className="mock-exam-card"><div className="mock-exam-card-title">Total</div><strong>{summary.total}</strong></div>
        <div className="mock-exam-card"><div className="mock-exam-card-title">Published</div><strong>{summary.published}</strong></div>
        <div className="mock-exam-card"><div className="mock-exam-card-title">Attempts</div><strong>{summary.attempts}</strong></div>
      </div>

      {loading ? <div className="mock-exam-card">Loading...</div> : null}
      {error ? <div className="mock-exam-card" style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div className="mock-exam-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam.title}</td>
                <td>{exam.subjectId?.name || exam.subjectId?.code || "-"}</td>
                <td><span className={`mock-exam-chip ${exam.isPublished ? "published" : "draft"}`}>{exam.isPublished ? "Published" : "Draft"}</span></td>
                <td>{exam.attempts || 0}</td>
                <td>
                  <div className="mock-exam-actions">
                    <button className="mock-exam-btn secondary" onClick={() => navigate(`/faculty/mock-exams/edit/${exam._id}`)}>Edit</button>
                    <button className="mock-exam-btn secondary" onClick={() => duplicateExam(exam._id)}>Duplicate</button>
                    <button className="mock-exam-btn ghost" onClick={() => updateStatus(exam._id, !exam.isPublished)}>{exam.isPublished ? "Unpublish" : "Publish"}</button>
                    <button className="mock-exam-btn danger" onClick={() => deleteExam(exam._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && exams.length === 0 ? <div className="mock-exam-empty">No mock exams found.</div> : null}
      </div>
    </div>
  );
};

export default MockExamManage;
