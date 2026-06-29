import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "./ViewAssessedStudentList.css";

export default function ViewAssessedStudentList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { experiment, batch, ciannData } = location.state || {};
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    averageMarks: 0,
    highestMarks: 0,
    lowestMarks: 0,
    passedStudents: 0
  });

  useEffect(() => {
    if (batch && experiment) {
      fetchAssessedStudents();
    } else {
      setError("Missing batch or experiment information");
      setLoading(false);
    }
  }, [batch, experiment]);

  const fetchAssessedStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessed students data
      const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/view-assessed/${experiment.id}?batch=${batch}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assessed students data');
      }

      if (data.success && data.students) {
        setStudents(data.students);
        calculateStatistics(data.students);
      } else {
        throw new Error('No assessed students found for this experiment');
      }
    } catch (error) {
      console.error('Error fetching assessed students:', error);
      setError(error.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (studentsData) => {
    if (studentsData.length === 0) {
      setStatistics({
        totalStudents: 0,
        averageMarks: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passedStudents: 0
      });
      return;
    }

    const marks = studentsData.map(student => student.marks || 0);
    const totalStudents = studentsData.length;
    const averageMarks = marks.reduce((sum, mark) => sum + mark, 0) / totalStudents;
    const highestMarks = Math.max(...marks);
    const lowestMarks = Math.min(...marks);
    const passedStudents = marks.filter(mark => mark >= 40).length; // Assuming 40 is passing marks

    setStatistics({
      totalStudents,
      averageMarks: averageMarks.toFixed(1),
      highestMarks,
      lowestMarks,
      passedStudents
    });
  };

  const getGrade = (marks) => {
    if (marks >= 90) return { grade: 'A+', class: 'grade-a-plus' };
    if (marks >= 80) return { grade: 'A', class: 'grade-a' };
    if (marks >= 70) return { grade: 'B+', class: 'grade-b-plus' };
    if (marks >= 60) return { grade: 'B', class: 'grade-b' };
    if (marks >= 50) return { grade: 'C+', class: 'grade-c-plus' };
    if (marks >= 40) return { grade: 'C', class: 'grade-c' };
    return { grade: 'F', class: 'grade-f' };
  };

  const exportToCSV = () => {
    const headers = ['Roll No', 'Student Name', 'Marks', 'Grade', 'Status'];
    const csvData = students.map(student => [
      student.rollNo,
      student.studentName,
      student.marks || 0,
      getGrade(student.marks || 0).grade,
      (student.marks || 0) >= 40 ? 'Pass' : 'Fail'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment?.name || 'assessment'}_${batch}_marks.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading assessed students...</p>
          </div>
        </div>

      </>
    );
  }

  const filteredStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4><strong>View Assessed Students</strong></h4>
            {experiment && (
              <p className="mb-1"><strong>Experiment {experiment.id}:</strong> {experiment.name}</p>
            )}
          </div>
          <div>
            <button 
              className="btn btn-outline-success me-2"
              onClick={exportToCSV}
              disabled={students.length === 0}
            >
              <i className="bi bi-download" /> Export CSV
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left" /> Back
            </button>
          </div>
        </div>

        {batch && ciannData && (
          <div className="alert alert-info mb-4">
            <div className="row">
              <div className="col-md-6">
                <strong>Batch:</strong> {batch} <br />
                <strong>CIAAN ID:</strong> {ciannData.ciannId} <br />
              </div>
              <div className="col-md-6">
                <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) <br />
                <strong>Division:</strong> {ciannData.division}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {students.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-primary">{statistics.totalStudents}</h5>
                  <p className="card-text small">Total Students</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-success">{statistics.averageMarks}</h5>
                  <p className="card-text small">Average Marks</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-warning">{statistics.highestMarks}</h5>
                  <p className="card-text small">Highest Marks</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-info">{statistics.lowestMarks}</h5>
                  <p className="card-text small">Lowest Marks</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-success">{statistics.passedStudents}</h5>
                  <p className="card-text small">Passed</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center stats-card">
                <div className="card-body">
                  <h5 className="card-title text-danger">{statistics.totalStudents - statistics.passedStudents}</h5>
                  <p className="card-text small">Failed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchAssessedStudents}
            >
              Retry
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <input
              type="text"
              placeholder="Search by name or roll number"
              className="form-control me-2"
              style={{ width: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="text-muted small">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={fetchAssessedStudents}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Assessment Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    {students.length === 0 ? 'No assessed students found for this experiment' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const gradeInfo = getGrade(student.marks || 0);
                  const isPassed = (student.marks || 0) >= 40;
                  
                  return (
                    <tr key={student._id} className={isPassed ? '' : 'table-warning'}>
                      <td><strong>{student.rollNo}</strong></td>
                      <td>{student.studentName}</td>
                      <td>
                        <span className={`marks-badge ${student.marks >= 80 ? 'high-marks' : student.marks >= 60 ? 'medium-marks' : student.marks >= 40 ? 'low-marks' : 'fail-marks'}`}>
                          {student.marks || 0}/100
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${gradeInfo.class}`}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isPassed ? 'bg-success' : 'bg-danger'}`}>
                          {isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td>
                        {student.assessmentDate ? 
                          new Date(student.assessmentDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Summary:</strong> {statistics.totalStudents} students assessed | 
              Pass Rate: {((statistics.passedStudents / statistics.totalStudents) * 100).toFixed(1)}% | 
              Average: {statistics.averageMarks}/100
            </small>
          </div>
        )}
      </div>

    </>
  );
}
