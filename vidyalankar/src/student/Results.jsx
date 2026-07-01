import React, { useState, useEffect } from "react";
import "./StudentComponents.css";
import { resultsService } from "./services/api";

const Results = () => {
  const [results, setResults] = useState([]);
  const [ctMarks, setCtMarks] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [resultData, ctData] = await Promise.all([
        resultsService.getResults(),
        resultsService.getCtMarks(),
      ]);

      setResults(Array.isArray(resultData) ? resultData : []);
      setCtMarks(Array.isArray(ctData?.marks) ? ctData.marks : []);
      setStudentInfo(ctData?.student || null);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch results:", err);
      setError("Failed to load results. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const normalizedCtMarks = ctMarks.map((ct) => ({
    ...ct,
    subjectName: ct.subjectName || ct.subject || "Subject",
    subjectCode: ct.subjectCode || "",
    totalMarks: Number(ct.totalMarks || 20),
    marks: Number(ct.marks || 0),
  }));

  const filteredResults =
    filter === "all"
      ? results
      : results.filter(
          (result) => String(result.examType || "").toLowerCase() === filter,
        );

  const calculatePercentage = (marks, maxMarks) => {
    return ((marks / maxMarks) * 100).toFixed(2);
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+": return "#10b981";
      case "A": return "#3b82f6";
      case "B+": return "#8b5cf6";
      case "B": return "#f59e0b";
      case "C": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-content-container">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchResults}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Academic Results</h1>
        <p>View CT marks and exam performance with subject-wise insights</p>
        {studentInfo?.studentName && (
          <p>
            Student: <strong>{studentInfo.studentName}</strong> ({studentInfo.rollNo || "-"})
          </p>
        )}
      </div>

      <div className="performance-summary" style={{ marginBottom: "20px" }}>
        <h2>CT Marks</h2>
        {normalizedCtMarks.length === 0 ? (
          <div className="no-results">
            <i className="bi bi-journal-x"></i>
            <p>No CT marks available yet for your account.</p>
          </div>
        ) : (
          <div className="results-grid">
            {normalizedCtMarks.map((ct) => (
              <div key={ct._id} className="result-card">
                <div className="result-header">
                  <h3>
                    {ct.subjectName}
                    {ct.subjectCode ? <small> ({ct.subjectCode})</small> : null}
                  </h3>
                  <span className="grade-badge ct-pill">
                    CT {ct.ctNumber}
                  </span>
                </div>
                <div className="result-details">
                  <div className="detail-row">
                    <span className="detail-label">CT Name:</span>
                    <span className="detail-value">{ct.ctName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{new Date(ct.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="marks-section">
                  <div className="marks-display">
                    <span className="marks">{ct.marks}</span>
                    <span className="max-marks">/{ct.totalMarks}</span>
                  </div>
                  <div className="percentage">
                    {calculatePercentage(ct.marks, ct.totalMarks)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="results-controls">
        <div className="filter-section">
          <label htmlFor="examFilter">Filter by Exam Type:</label>
          <select 
            id="examFilter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Exams</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="practical">Practical</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="no-results">
          <i className="bi bi-file-earmark-text"></i>
          <p>No results found for the selected filter</p>
        </div>
      ) : (
        <div className="results-grid">
          {filteredResults.map((result) => (
            <div key={result._id || result.id} className="result-card">
              <div className="result-header">
                <h3>{result.subject}</h3>
                <span 
                  className="grade-badge" 
                  style={{ backgroundColor: getGradeColor(result.grade) }}
                >
                  {result.grade}
                </span>
              </div>
              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">Exam Type:</span>
                  <span className="detail-value">{result.examType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{new Date(result.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Semester:</span>
                  <span className="detail-value">{result.semester}</span>
                </div>
              </div>
              <div className="marks-section">
                <div className="marks-display">
                  <span className="marks">{result.marks}</span>
                  <span className="max-marks">/{result.maxMarks}</span>
                </div>
                <div className="percentage">
                  {calculatePercentage(result.marks, result.maxMarks)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="performance-summary">
        <h2>Performance Summary</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <i className="bi bi-graph-up"></i>
            <div className="stat-info">
              <span className="stat-value">
                {results.length > 0 
                  ? (results.reduce((sum, result) => sum + result.marks, 0) / results.length).toFixed(2) 
                  : "0.00"}
              </span>
              <span className="stat-label">Average Score</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-trophy"></i>
            <div className="stat-info">
              <span className="stat-value">
                {results.filter(r => r.grade.includes("A")).length}
              </span>
              <span className="stat-label">A Grades</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-clipboard-check"></i>
            <div className="stat-info">
              <span className="stat-value">{results.length}</span>
              <span className="stat-label">Total Exams</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;