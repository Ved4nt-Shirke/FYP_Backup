import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamResults = () => {
  const [catalog, setCatalog] = useState({ departments: [], courses: [], divisions: [], subjects: [] });
  const [filter, setFilter] = useState({ courseId: "", divisionId: "", subjectId: "", examId: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catalogResponse, resultsResponse] = await Promise.all([
          axios.get(config.mockExams + "/catalog"),
          axios.get(`${config.mockExams}/results/summary`, { params: filter }),
        ]);

        setCatalog({
          departments: catalogResponse.data?.departments || [],
          courses: catalogResponse.data?.courses || [],
          divisions: catalogResponse.data?.divisions || [],
          subjects: catalogResponse.data?.subjects || [],
        });
        setResults(resultsResponse.data?.attempts || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.mockExams}/results/summary`, { params: filter });
      setResults(response.data?.attempts || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">Faculty View</span>
            <h1 className="mock-exam-title">Mock Exam Results</h1>
            <p className="mock-exam-subtitle">Filter attempts by course, division, or subject.</p>
          </div>
          <button className="mock-exam-button secondary" onClick={refresh}>Refresh</button>
        </div>

        <div className="mock-exam-toolbar">
          <div className="mock-exam-field">
            <label>Course</label>
            <select className="mock-exam-select" value={filter.courseId} onChange={(e) => setFilter({ ...filter, courseId: e.target.value })}>
              <option value="">All</option>
              {filteredCourses.map((course) => <option key={course._id} value={course._id}>{course.courseCode}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Division</label>
            <select className="mock-exam-select" value={filter.divisionId} onChange={(e) => setFilter({ ...filter, divisionId: e.target.value })}>
              <option value="">All</option>
              {filteredDivisions.map((division) => <option key={division._id} value={division._id}>{division.name}</option>)}
            </select>
          </div>
          <div className="mock-exam-field">
            <label>Subject</label>
            <select className="mock-exam-select" value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}>
              <option value="">All</option>
              {filteredSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mock-exam-table">
          {loading ? <div className="mock-exam-empty">Loading results...</div> : null}
          {!loading && results.length === 0 ? <div className="mock-exam-empty">No results available.</div> : null}
          {!loading && results.length > 0 ? (
            <table>
              <thead>
                <tr><th>Student</th><th>Exam</th><th>Score</th><th>Submitted</th><th>Time Taken</th></tr>
              </thead>
              <tbody>
                {results.map((attempt) => (
                  <tr key={attempt._id}>
                    <td>{attempt.studentId?.studentName || "-"}</td>
                    <td>{attempt.examId?.title || "-"}</td>
                    <td>{attempt.score}/{attempt.totalMarks}</td>
                    <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "-"}</td>
                    <td>{Math.floor((attempt.timeTaken || 0) / 60)}m {(attempt.timeTaken || 0) % 60}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MockExamResults;
