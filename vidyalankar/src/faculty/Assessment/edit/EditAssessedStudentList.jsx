import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "../assess/AssessPAStudentlist.css";

export default function EditAssessedStudentList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { experiment, batch, ciannData } = location.state || {};
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [originalMarks, setOriginalMarks] = useState({});

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

      console.log('Fetching assessed data for experiment:', experiment.id, 'batch:', batch);

      // Fetch existing assessment data for this experiment and batch
      const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/edit-data/${experiment.id}?batch=${batch}`);
      const data = await response.json();

      console.log('Edit data response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assessment data');
      }

      if (data.success && data.students) {
        setStudents(data.students);
        
        // Store original marks for comparison
        const originalMarksMap = {};
        data.students.forEach(student => {
          originalMarksMap[student._id] = student.marks;
        });
        setOriginalMarks(originalMarksMap);
        
        console.log('Loaded students with existing marks:', data.students.length);
      } else {
        throw new Error('No assessment data found for this experiment and batch');
      }
    } catch (error) {
      console.error('Error fetching assessed students:', error);
      setError(error.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, marks) => {
    const numericMarks = parseInt(marks) || 0;
    if (numericMarks < 0 || numericMarks > 25) {
      alert("Marks should be between 0 and 25");
      return;
    }

    setStudents(prevStudents =>
      prevStudents.map(student =>
        student._id === studentId
          ? { ...student, marks: numericMarks }
          : student
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!experiment) {
        throw new Error("Missing experiment information");
      }

      // Check if any marks have been changed
      const changedStudents = students.filter(student => 
        originalMarks[student._id] !== student.marks
      );

      if (changedStudents.length === 0) {
        alert("No changes detected. Please modify some marks before submitting.");
        setSaving(false);
        return;
      }

      console.log('Updating marks for', changedStudents.length, 'students');

      // Prepare students marks data
      const studentsMarks = students.map(student => ({
        studentId: student._id,
        rollNo: student.rollNo,
        studentName: student.studentName,
        marks: student.marks || 0
      }));

      const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/save-marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentsMarks,
          experimentId: experiment.id,
          experimentName: experiment.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update marks');
      }

      if (data.success) {
        alert(`Successfully updated marks for ${changedStudents.length} students!\nTotal records processed: ${data.savedCount}`);
        
        // Update original marks to reflect the new state
        const newOriginalMarks = {};
        students.forEach(student => {
          newOriginalMarks[student._id] = student.marks;
        });
        setOriginalMarks(newOriginalMarks);
        
        // Navigate back to experiment list
        navigate(-1);
      } else {
        throw new Error(data.message || 'Failed to update marks');
      }
    } catch (error) {
      console.error('Error updating marks:', error);
      setError(error.message);
      alert(`Error updating marks: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getChangedStudentsCount = () => {
    return students.filter(student => 
      originalMarks[student._id] !== student.marks
    ).length;
  };

  const resetChanges = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      setStudents(prevStudents =>
        prevStudents.map(student => ({
          ...student,
          marks: originalMarks[student._id] || 0
        }))
      );
    }
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
            <p className="mt-2">Loading assessment data...</p>
          </div>
        </div>

      </>
    );
  }

  const filteredStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const changedCount = getChangedStudentsCount();

  return (
    <>
      <Header />
      <div className="container mt-4 assess-pa-studentlist-page">
        <h4><strong>Edit Assessment Marks</strong></h4>
        {experiment && (
          <p><strong>Experiment {experiment.id}:</strong> {experiment.name}</p>
        )}
        
        {batch && ciannData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>CIAAN ID:</strong> {ciannData.ciannId} <br />
            <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) <br />
            <strong>Division:</strong> {ciannData.division} <br />
            <strong>Mode:</strong> <span className="badge bg-warning text-dark">Edit Mode</span>
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

        {changedCount > 0 && (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle"></i>
            <strong> {changedCount} student(s) have unsaved changes</strong>
            <button 
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={resetChanges}
            >
              Reset Changes
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between mb-2">
          <div className="d-flex">
            <input
              type="text"
              placeholder="Search by name or roll number"
              className="form-control me-2"
              style={{ width: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button 
              className="btn btn-outline-secondary me-1"
              onClick={fetchAssessedStudents}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left" /> Back
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Original Marks</th>
                <th>Current Marks (0-25)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    {students.length === 0 ? 'No assessment data found for this experiment' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isChanged = originalMarks[student._id] !== student.marks;
                  return (
                    <tr key={student._id} className={isChanged ? 'table-warning' : ''}>
                      <td>{student.rollNo}</td>
                      <td>{student.studentName}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {originalMarks[student._id] || 0}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={`form-control ${isChanged ? 'border-warning' : ''}`}
                          value={student.marks || 0}
                          min="0"
                          max="25"
                          onChange={(e) => handleMarksChange(student._id, e.target.value)}
                          disabled={saving}
                        />
                      </td>
                      <td>
                        {isChanged ? (
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-pencil"></i> Modified
                          </span>
                        ) : (
                          <span className="badge bg-success">
                            <i className="bi bi-check"></i> Unchanged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <div className="text-center mt-3">
            <button 
              className="btn btn-success px-4 me-2"
              onClick={handleSubmit}
              disabled={saving || changedCount === 0}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Update Marks ({changedCount} changes)
                </>
              )}
            </button>
            
            {changedCount > 0 && (
              <button 
                className="btn btn-outline-secondary px-4"
                onClick={resetChanges}
                disabled={saving}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Reset All Changes
              </button>
            )}
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-3">
            <small className="text-muted">
              Total Students: {students.length} | 
              Filtered: {filteredStudents.length} | 
              Changed: {changedCount} | 
              Average Marks: {students.length > 0 ? (students.reduce((sum, s) => sum + (s.marks || 0), 0) / students.length).toFixed(1) : 0}
            </small>
          </div>
        )}

        <div className="mt-4">
          <div className="alert alert-light">
            <h6><i className="bi bi-info-circle"></i> Edit Instructions:</h6>
            <ul className="mb-0">
              <li><strong>Original Marks:</strong> Shows the current marks stored in database</li>
              <li><strong>Current Marks:</strong> Modify these values to update student marks</li>
              <li><strong>Status:</strong> Shows which students have modified marks (highlighted in yellow)</li>
              <li><strong>Submit:</strong> Only students with changed marks will be updated in database</li>
              <li><strong>Reset:</strong> Restore all marks to their original values</li>
            </ul>
          </div>
        </div>
      </div>

    </>
  );
}
