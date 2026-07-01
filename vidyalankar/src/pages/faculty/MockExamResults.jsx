import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamResults = () => {
  const location = useLocation();
  const filterExamId = location.state?.filterExamId || "";

  const [catalog, setCatalog] = useState({ departments: [], courses: [], divisions: [], subjects: [] });
  const [filter, setFilter] = useState({ courseId: "", divisionId: "", subjectId: "", examId: filterExamId });
  const [examsList, setExamsList] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await axios.get(config.mockExams + "/catalog");
        setCatalog({
          departments: res.data?.departments || [],
          courses: res.data?.courses || [],
          divisions: res.data?.divisions || [],
          subjects: res.data?.subjects || [],
        });
      } catch (err) {
        setError("Failed to load academic catalog.");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Fetch Exams list when Course, Division, or Subject filter changes
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(config.mockExams, {
          params: {
            courseId: filter.courseId,
            divisionId: filter.divisionId,
            subjectId: filter.subjectId
          }
        });
        setExamsList(res.data?.exams || []);
      } catch (err) {
        console.error("Failed to load exams list", err);
      }
    };
    fetchExams();
  }, [filter.courseId, filter.divisionId, filter.subjectId]);

  // Fetch results summary ONLY if a specific examId is selected
  useEffect(() => {
    if (!filter.examId) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${config.mockExams}/results/summary`, {
          params: { examId: filter.examId }
        });
        setResults(res.data?.attempts || []);
      } catch (err) {
        setError("Failed to fetch exam results summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [filter.examId]);

  const refresh = () => {
    if (!filter.examId) return;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${config.mockExams}/results/summary`, {
          params: { examId: filter.examId }
        });
        setResults(res.data?.attempts || []);
      } catch (err) {
        setError("Failed to reload exam results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  };

  const filteredCourses = useMemo(
    () => catalog.courses.filter((course) => !filter.courseId || course._id === filter.courseId),
    [catalog.courses, filter.courseId],
  );
  const filteredDivisions = useMemo(
    () => catalog.divisions.filter((division) => !filter.courseId || String(division.courseId) === String(filter.courseId)),
    [catalog.divisions, filter.courseId],
  );
  const filteredSubjects = useMemo(
    () => catalog.subjects.filter((subject) => !filter.courseId || String(subject.courseId) === String(filter.courseId)),
    [catalog.subjects, filter.courseId],
  );

  // Analytics Computations
  const analytics = useMemo(() => {
    if (results.length === 0) {
      return { avgPct: 0, highest: 0, lowest: 0, passCount: 0, failCount: 0, passRate: 0, toppers: [] };
    }

    const scores = results.map((r) => r.score);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    let totalPct = 0;
    let passCount = 0;
    let failCount = 0;

    results.forEach((r) => {
      const total = r.totalMarks || 100;
      const pct = (r.score / total) * 100;
      totalPct += pct;

      // Passing threshold (use configured passingMarks if available, fallback to 35%)
      const passMarks = r.examId?.passingMarks || (total * 0.35);
      if (r.score >= passMarks) {
        passCount++;
      } else {
        failCount++;
      }
    });

    const avgPct = (totalPct / results.length).toFixed(1);
    const passRate = ((passCount / results.length) * 100).toFixed(1);

    // Get top 3 toppers
    const toppers = [...results]
      .filter((r) => r.rank <= 3)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);

    return { avgPct, highest, lowest, passCount, failCount, passRate, toppers };
  }, [results]);

  // Custom CSS Chart Data (Grouping performance by subjects)
  const subjectChartData = useMemo(() => {
    const subMap = {};
    results.forEach((r) => {
      const subName = r.examId?.subjectId?.name || "Subject";
      if (!subMap[subName]) {
        subMap[subName] = { sumPct: 0, count: 0 };
      }
      const total = r.totalMarks || 100;
      subMap[subName].sumPct += (r.score / total) * 100;
      subMap[subName].count++;
    });

    return Object.keys(subMap).map((name) => ({
      name,
      avg: (subMap[name].sumPct / subMap[name].count).toFixed(0),
    }));
  }, [results]);

  // PDF Exporter (Roll number order)
  const exportPDF = () => {
    const doc = new jsPDF();
    const sorted = [...results].sort((a, b) => 
      String(a.studentId?.rollNo || "").localeCompare(String(b.studentId?.rollNo || ""))
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mock Exam Results Summary Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Institution: ${localStorage.getItem("college") || "VP"}`, 14, 28);
    doc.text(`Total Attempts: ${results.length} | Export Date: ${new Date().toLocaleDateString()}`, 14, 34);

    const tableColumn = ["Roll No", "Student Name", "Exam Title", "Score Obtained", "Percentage", "Rank", "Time Taken", "Status"];
    const tableRows = [];

    sorted.forEach((att) => {
      const pct = att.totalMarks ? ((att.score / att.totalMarks) * 100).toFixed(2) + "%" : "0%";
      const timeStr = `${Math.floor(att.timeTaken / 60)}m ${att.timeTaken % 60}s`;
      tableRows.push([
        att.studentId?.rollNo || "-",
        att.studentId?.studentName || "-",
        att.examId?.title || "-",
        `${att.score} / ${att.totalMarks}`,
        pct,
        att.rank || "-",
        timeStr,
        att.status || "submitted"
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save("mock_exam_results_report.pdf");
  };

  // Trigger print-only mode
  const triggerPrint = () => {
    window.print();
  };

  // Sorted by roll number specifically for Print layouts
  const printSortedResults = useMemo(() => {
    return [...results].sort((a, b) => 
      String(a.studentId?.rollNo || "").localeCompare(String(b.studentId?.rollNo || ""))
    );
  }, [results]);

  return (
    <div className="mock-exam-shell">
      {/* ────────────────────────────────────────────── */}
      {/* Main Results Dashboard View (Screen view) */}
      {/* ────────────────────────────────────────────── */}
      <div className="mock-exam-page no-print">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill"><i className="bi bi-bar-chart-line" /> Analytics Workspace</span>
            <h1 className="mock-exam-title">Exam Results & Analytics</h1>
            <p className="mock-exam-subtitle">Analyze metrics, topper distributions, subject strengths and generate print reports.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="mock-exam-button secondary" onClick={refresh}><i className="bi bi-arrow-clockwise" /> Reload</button>
            <button className="mock-exam-button secondary" onClick={exportPDF} disabled={results.length === 0}>
              <i className="bi bi-file-earmark-pdf" /> Export PDF
            </button>
            <button className="mock-exam-button" onClick={triggerPrint} disabled={results.length === 0}>
              <i className="bi bi-printer" /> Print Report
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}

        {/* Toolbar Filter */}
        <div className="mock-exam-toolbar">
          <div className="mock-exam-field">
            <label>Course</label>
            <select className="mock-exam-select" value={filter.courseId} onChange={(e) => setFilter({ ...filter, courseId: e.target.value })}>
              <option value="">All Courses</option>
              {filteredCourses.map((c) => <option key={c._id} value={c._id}>{c.courseCode}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Division</label>
            <select className="mock-exam-select" value={filter.divisionId} onChange={(e) => setFilter({ ...filter, divisionId: e.target.value })}>
              <option value="">All Divisions</option>
              {filteredDivisions.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Subject</label>
            <select className="mock-exam-select" value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}>
              <option value="">All Subjects</option>
              {filteredSubjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Exam Title Filter</label>
            <select className="mock-exam-select" value={filter.examId} onChange={(e) => setFilter({ ...filter, examId: e.target.value })}>
              <option value="">Select Exam</option>
              {examsList.map((ex) => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
            </select>
          </div>
        </div>

        {!filter.examId ? (
          <div className="mock-exam-card text-center py-5 mt-4">
            <i className="bi bi-journal-check text-primary mb-3" style={{ fontSize: "3.5rem" }} />
            <h3 style={{ fontWeight: 800 }}>Please Select a Mock Exam</h3>
            <p className="text-muted mb-0" style={{ maxWidth: "480px", margin: "8px auto 0" }}>
              To review toppers, passing rates, subject analytics, and student submission details, please select an Exam from the filter dropdown above.
            </p>
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <>
                {/* Top Toppers Cards */}
                <div className="topper-card-wrapper">
                  {analytics.toppers.map((topper, idx) => (
                    <div key={topper._id} className={`topper-card rank-${topper.rank}`}>
                      <span className="topper-medal">
                        {topper.rank === 1 ? "🥇" : topper.rank === 2 ? "🥈" : "🥉"}
                      </span>
                      <div className="topper-name">{topper.studentId?.studentName}</div>
                      <div className="topper-roll">Roll No: {topper.studentId?.rollNo || "N/A"}</div>
                      <div className="topper-score">{topper.score} / {topper.totalMarks}</div>
                      <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                        Rank {topper.rank} | Time: {Math.floor(topper.timeTaken / 60)}m {topper.timeTaken % 60}s
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dashboard Analytics summary block */}
                <div className="mock-exam-grid cols-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <div className="mock-exam-analytics-card text-center">
                    <div className="mock-exam-card-title">Average Class score</div>
                    <strong style={{ fontSize: "2rem", color: "var(--primary-color)" }}>{analytics.avgPct}%</strong>
                    <span className="badge-sec mt-2 d-inline-block">Class Average Pct</span>
                  </div>
                  <div className="mock-exam-analytics-card text-center">
                    <div className="mock-exam-card-title">Highest Score / Lowest</div>
                    <strong style={{ fontSize: "2rem", color: "#2563eb" }}>{analytics.highest} / {analytics.lowest}</strong>
                    <span className="badge-sec mt-2 d-inline-block">Absolute Marks</span>
                  </div>
                  <div className="mock-exam-analytics-card text-center">
                    <div className="mock-exam-card-title">Passing Rate</div>
                    <strong style={{ fontSize: "2rem", color: "#10b981" }}>{analytics.passRate}%</strong>
                    <span className="badge-sec mt-2 d-inline-block">{analytics.passCount} Pass | {analytics.failCount} Fail</span>
                  </div>
                </div>

                {/* Dynamic CSS Bar Charts */}
                <div className="mock-exam-card mb-4 mt-2">
                  <h3 className="mock-exam-card-title"><i className="bi bi-graph-up-arrow me-1" /> Subject-wise Performance chart</h3>
                  <div className="mock-exam-chart-container">
                    {subjectChartData.map((data) => (
                      <div key={data.name} className="mock-exam-chart-row">
                        <div className="mock-exam-chart-label">{data.name}</div>
                        <div className="mock-exam-chart-bar-bg">
                          <div className="mock-exam-chart-bar-fill" style={{ width: `${data.avg}%` }} />
                        </div>
                        <div className="mock-exam-chart-value">{data.avg}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Results Details Grid */}
            <div className="mock-exam-table mt-4">
              <h3 className="mock-exam-card-title p-3 border-bottom mb-0"><i className="bi bi-table me-1" /> Student Submissions</h3>
              {loading ? (
                <div className="text-center py-4">Loading results details...</div>
              ) : results.length === 0 ? (
                <div className="mock-exam-empty text-center py-4">No submissions matching selection.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Exam Name</th>
                      <th className="text-center">Score Obtained</th>
                      <th className="text-center">Percentage</th>
                      <th className="text-center">Rank</th>
                      <th>Time Taken</th>
                      <th>Submitted At</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((att) => {
                      const pct = att.totalMarks ? ((att.score / att.totalMarks) * 100).toFixed(1) : "0.0";
                      const passMarks = att.examId?.passingMarks || (att.totalMarks * 0.35);
                      const isPassed = att.score >= passMarks;
                      return (
                        <tr key={att._id}>
                          <td><strong>{att.studentId?.rollNo || "-"}</strong></td>
                          <td>
                            <strong className="text-dark">{att.studentId?.studentName || "-"}</strong>
                            <span className="text-muted d-block" style={{ fontSize: "0.78rem" }}>Enroll: {att.studentId?.enrollmentNo || "-"}</span>
                          </td>
                          <td>{att.examId?.title || "-"}</td>
                          <td className="text-center">
                            <strong className={isPassed ? "text-success" : "text-danger"}>{att.score}</strong> / {att.totalMarks}
                          </td>
                          <td className="text-center">{pct}%</td>
                          <td className="text-center">
                            <span className={`badge ${att.rank === 1 ? "bg-warning text-dark" : att.rank <= 3 ? "bg-info text-dark" : "bg-light text-dark"}`}>
                              Rank {att.rank || "-"}
                            </span>
                          </td>
                          <td>{Math.floor((att.timeTaken || 0) / 60)}m {(att.timeTaken || 0) % 60}s</td>
                          <td>{new Date(att.submittedAt).toLocaleString()}</td>
                          <td className="text-center">
                            <span className={`badge ${att.status === "auto-submitted" ? "bg-danger" : "bg-success"}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* Print-Only Container (A4 Optimized) */}
      {/* ────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="print-only-container d-none d-print-block">
          <div className="print-header">
            <div className="print-logo-dummy">EDU</div>
            <div className="print-college-info">
              <h1 className="print-college-name">Vidyalankar Polytechnic Institute</h1>
              <p className="print-college-address">Wadala East, Mumbai, Maharashtra 400037</p>
            </div>
            <div style={{ width: 70 }} />
          </div>

          <h2 className="print-doc-title">Mock Examination Results sheet</h2>

          <div className="print-meta-grid">
            <div><strong>Exam Title:</strong> {results[0]?.examId?.title || "Mock Examination"}</div>
            <div><strong>Academic Year:</strong> {results[0]?.examId?.academicYear || "N/A"}</div>
            <div><strong>Subject:</strong> {results[0]?.examId?.subjectId?.name || "N/A"}</div>
            <div><strong>Semester:</strong> Sem {results[0]?.examId?.semester || "N/A"}</div>
            <div><strong>Total Marks:</strong> {results[0]?.examId?.totalMarks || "N/A"} | <strong>Duration:</strong> {results[0]?.examId?.duration || "N/A"} mins</div>
            <div><strong>Class Average:</strong> {analytics.avgPct}% | <strong>Pass Rate:</strong> {analytics.passRate}%</div>
          </div>

          <table className="table table-bordered" style={{ fontSize: "0.85rem", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "left" }}>Roll No</th>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "left" }}>Student Name</th>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>Marks</th>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>Percentage</th>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>Rank</th>
                <th style={{ border: "1px solid #000000", padding: "6px" }}>Time Taken</th>
                <th style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {printSortedResults.map((att) => {
                const pct = att.totalMarks ? ((att.score / att.totalMarks) * 100).toFixed(1) : "0.0";
                const passMarks = att.examId?.passingMarks || (att.totalMarks * 0.35);
                const isPassed = att.score >= passMarks;
                return (
                  <tr key={att._id}>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{att.studentId?.rollNo || "-"}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{att.studentId?.studentName || "-"}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>{att.score}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>{pct}%</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>{att.rank}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", textAlign: "center", fontWeight: "bold", color: isPassed ? "green" : "red" }}>
                      {isPassed ? "PASS" : "FAIL"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="print-signature-row">
            <div className="print-signature-box">
              <div className="print-signature-line" />
              <div className="print-signature-title">Subject Teacher Signature</div>
            </div>
            <div className="print-signature-box">
              <div className="print-signature-line" />
              <div className="print-signature-title">HOD Signature</div>
            </div>
            <div className="print-signature-box">
              <div className="print-signature-line" />
              <div className="print-signature-title">Principal Stamp / Sign</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockExamResults;
