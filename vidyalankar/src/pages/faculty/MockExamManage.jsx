import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamManage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [catalog, setCatalog] = useState({ departments: [], courses: [], divisions: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Preview Modal State
  const [previewExam, setPreviewExam] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsRes, catalogRes] = await Promise.all([
        axios.get(config.mockExams),
        axios.get(`${config.mockExams}/catalog`),
      ]);

      setExams(examsRes.data?.exams || []);
      setCatalog({
        departments: catalogRes.data?.departments || [],
        courses: catalogRes.data?.courses || [],
        divisions: catalogRes.data?.divisions || [],
        subjects: catalogRes.data?.subjects || [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load mock exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id, isPublished) => {
    try {
      await axios.patch(`${config.mockExams}/${id}/publish`, { isPublished });
      await loadData();
    } catch (err) {
      setError("Failed to update publication status.");
    }
  };

  const duplicateExam = async (id) => {
    try {
      await axios.post(`${config.mockExams}/${id}/duplicate`);
      await loadData();
    } catch (err) {
      setError("Failed to duplicate exam.");
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mock exam and all student submissions associated with it?")) return;
    try {
      await axios.delete(`${config.mockExams}/${id}`);
      await loadData();
    } catch (err) {
      setError("Failed to delete exam.");
    }
  };

  // Export Exam Details (Excel)
  const downloadExamConfigReport = (exam) => {
    const wsData = [
      ["Parameter", "Details"],
      ["Exam Name", exam.title],
      ["Academic Year", exam.academicYear],
      ["Subject", exam.subjectId?.name || "N/A"],
      ["Semester", exam.semester],
      ["Division", exam.divisionId?.name || "N/A"],
      ["Duration (mins)", exam.duration],
      ["Total Marks", exam.totalMarks],
      ["Passing Marks", exam.passingMarks || 18],
      ["Attempts Allowed", exam.attemptsAllowed || "SINGLE"],
      ["Max Attempts", exam.maxAttempts || 1],
      ["Shuffle Questions", exam.shuffleQuestions ? "Yes" : "No"],
      ["Shuffle Options", exam.shuffleOptions ? "Yes" : "No"],
      ["Fullscreen Required", exam.fullscreenRequired ? "Yes" : "No"],
      ["Prevent Tab Switch", exam.preventTabSwitch ? "Yes" : "No"],
      ["Created Date", new Date(exam.createdAt).toLocaleDateString()],
      [],
      ["Questions List"],
      ["Q#", "Type", "Question", "Options / Info", "Correct Answer", "Marks", "Difficulty", "Chapter"],
    ];

    (exam.questions || []).forEach((q, idx) => {
      wsData.push([
        idx + 1,
        q.type,
        q.question,
        q.type === "MCQ" ? q.options.join(" | ") : "Written Answer",
        q.correctAnswer || "N/A",
        q.marks,
        q.difficulty,
        q.chapter || "N/A"
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Exam Details");
    XLSX.writeFile(wb, `${exam.title.replace(/\s+/g, "_")}_report.xlsx`);
  };

  // Unique lists for filter dropdowns
  const uniqueAcademicYears = useMemo(() => {
    const years = exams.map((e) => e.academicYear).filter(Boolean);
    return [...new Set(years)].sort();
  }, [exams]);

  const uniqueSemesters = useMemo(() => {
    const sems = exams.map((e) => e.semester).filter(Boolean);
    return [...new Set(sems)].sort((a, b) => a - b);
  }, [exams]);

  // Filter Logic
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchSearch = !search || exam.title.toLowerCase().includes(search.toLowerCase()) || 
        (exam.subjectId?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchYear = !selectedYear || exam.academicYear === selectedYear;
      const matchDept = !selectedDept || String(exam.courseId?.departmentId) === String(selectedDept);
      const matchSem = !selectedSem || String(exam.semester) === String(selectedSem);
      const matchSub = !selectedSub || String(exam.subjectId?._id) === String(selectedSub);

      let matchStatus = true;
      if (selectedStatus !== "all") {
        matchStatus = exam.examStatus === selectedStatus;
      }

      return matchSearch && matchYear && matchDept && matchSem && matchSub && matchStatus;
    });
  }, [exams, search, selectedYear, selectedDept, selectedSem, selectedSub, selectedStatus]);

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">Faculty Panel</span>
            <h1 className="mock-exam-title">Manage Mock Exams</h1>
            <p className="mock-exam-subtitle">
              Publish or unpublish mock exams, duplicate existing configurations, review student results, and preview exam papers.
            </p>
          </div>
          <button className="mock-exam-button" onClick={() => navigate("/faculty/mock-exams/create")}>
            <i className="bi bi-plus-lg" /> Create Exam
          </button>
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}

        {/* Advanced Filter Toolbar */}
        <div className="mock-exam-toolbar">
          <div className="mock-exam-field" style={{ flex: "2 1 240px" }}>
            <label>Search Exam or Subject</label>
            <input className="mock-exam-input" placeholder="Type exam name, course code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mock-exam-field">
            <label>Academic Year</label>
            <select className="mock-exam-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">All Years</option>
              {uniqueAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Department</label>
            <select className="mock-exam-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              <option value="">All Departments</option>
              {catalog.departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Semester</label>
            <select className="mock-exam-select" value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}>
              <option value="">All Semesters</option>
              {uniqueSemesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Subject</label>
            <select className="mock-exam-select" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
              <option value="">All Subjects</option>
              {catalog.subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Status</label>
            <select className="mock-exam-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Exams Table */}
        <div className="mock-exam-table">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success mb-2" role="status" />
              <div className="text-muted">Loading Mock Exams...</div>
            </div>
          ) : filteredExams.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th className="text-center">Questions</th>
                  <th className="text-center">Duration</th>
                  <th className="text-center">Attempts Allowed</th>
                  <th>Created Date</th>
                  <th className="text-center">Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <strong className="text-dark">{exam.title}</strong>
                      <span className="text-muted d-block" style={{ fontSize: "0.8rem" }}>
                        {exam.academicYear} | Div {exam.divisionId?.name || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div>{exam.subjectId?.name || "N/A"}</div>
                      <span className="text-muted" style={{ fontSize: "0.78rem" }}>Code: {exam.subjectId?.code || "N/A"}</span>
                    </td>
                    <td>{exam.createdBy?.username || "Faculty"}</td>
                    <td className="text-center">{exam.questions?.length || 0}</td>
                    <td className="text-center">{exam.duration} mins</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {exam.attemptsAllowed === "SINGLE" ? "Single" : `Multiple (Max ${exam.maxAttempts})`}
                      </span>
                    </td>
                    <td>{new Date(exam.createdAt).toLocaleDateString()}</td>
                    <td className="text-center">
                      <span className={`mock-exam-chip ${exam.isPublished ? "published" : "draft"}`}>
                        {exam.isPublished ? "Published" : "Draft"}
                      </span>
                      {exam.isPublished && (
                        <span className={`mock-exam-chip ${exam.examStatus} ms-1`} style={{ fontSize: "0.68rem" }}>
                          {exam.examStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <button className="mock-exam-button secondary p-2" onClick={() => navigate(`/faculty/mock-exams/${exam._id}/questions`)} title="Add/Manage Questions" style={{ color: "var(--primary-color)", borderColor: "var(--primary-color)" }}>
                          <i className="bi bi-journal-plus" />
                        </button>
                        <button className="mock-exam-button secondary p-2" onClick={() => navigate(`/faculty/mock-exams/edit/${exam._id}`)} title="Edit Exam Settings">
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button className="mock-exam-button secondary p-2" onClick={() => duplicateExam(exam._id)} title="Duplicate Exam">
                          <i className="bi bi-files" />
                        </button>
                        <button className="mock-exam-button secondary p-2" onClick={() => setPreviewExam(exam)} title="Preview Exam questions">
                          <i className="bi bi-eye" />
                        </button>
                        <button className="mock-exam-button secondary p-2" onClick={() => downloadExamConfigReport(exam)} title="Download Report">
                          <i className="bi bi-file-earmark-arrow-down" />
                        </button>
                        <button className="mock-exam-button secondary p-2" onClick={() => navigate(`/faculty/mock-exams/results`, { state: { filterExamId: exam._id } })} title="View Submissions/Results">
                          <i className="bi bi-bar-chart" />
                        </button>
                        <button className={`mock-exam-btn btn-sm ${exam.isPublished ? "ghost" : "primary"}`} onClick={() => updateStatus(exam._id, !exam.isPublished)} style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                          {exam.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button className="mock-exam-button danger p-2" onClick={() => deleteExam(exam._id)} title="Delete Exam">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mock-exam-empty text-center py-5">
              <i className="bi bi-info-circle mb-2" style={{ fontSize: "2.5rem" }} />
              <div>No mock examinations matching selection.</div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* Exam Preview Modal Dialog */}
      {/* ────────────────────────────────────────────── */}
      {previewExam && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050, overflowY: "auto" }}
          onClick={() => setPreviewExam(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 16, border: "none", overflow: "hidden" }}>
              <div className="modal-header bg-success text-white p-3">
                <h5 className="modal-title" style={{ fontWeight: 800 }}>Preview: {previewExam.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewExam(null)} />
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="d-flex justify-content-between mb-4 border-bottom pb-2" style={{ fontSize: "0.9rem" }}>
                  <div>
                    <strong>Subject:</strong> {previewExam.subjectId?.name || "N/A"} ({previewExam.subjectId?.code || "N/A"})
                  </div>
                  <div>
                    <strong>Duration:</strong> {previewExam.duration} mins | <strong>Total Marks:</strong> {previewExam.totalMarks}
                  </div>
                </div>

                <div className="d-flex flex-column gap-3">
                  {(previewExam.questions || []).map((q, idx) => (
                    <div key={q._id} className="p-3 border rounded-3" style={{ background: "#f9fafb" }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="badge bg-secondary">{q.type} | {q.marks} marks</span>
                        {q.difficulty && <span className={`badge ${q.difficulty === 'EASY' ? 'bg-success' : q.difficulty === 'HARD' ? 'bg-danger' : 'bg-warning'}`}>{q.difficulty}</span>}
                      </div>
                      <h6 style={{ fontWeight: 700, margin: "8px 0" }}>Q{idx + 1}. {q.question}</h6>

                      {q.image && (
                        <div className="my-2 text-center">
                          <img src={q.image} alt="Question figure" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 6 }} />
                        </div>
                      )}

                      {q.type === "MCQ" ? (
                        <div className="row g-2 mt-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="col-md-6">
                              <div className={`p-2 border rounded-3 text-start ${opt === q.correctAnswer ? "border-success bg-success-light" : ""}`} style={{ fontSize: "0.85rem", background: opt === q.correctAnswer ? "rgba(16,185,129,0.05)" : "#ffffff" }}>
                                <strong>Option {["A", "B", "C", "D"][oIdx]}:</strong> {opt}
                                {opt === q.correctAnswer && <i className="bi bi-check-circle-fill text-success ms-2" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
                          <strong>Evaluation Notes:</strong> {q.explanation || "No notes provided."}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer p-2 bg-light">
                <button type="button" className="mock-exam-button secondary" onClick={() => setPreviewExam(null)}>Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockExamManage;
