// EditExistingPracticalAttendance.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from '../../../utils/alertUtils.jsx';
import './EditIndividualAttendance.css';
import '../FinalAtt.css';
import '../PracticalFinalAtt.css';

const EditExistingPracticalAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordToEdit, selectedCiannId } = location.state || {};
  const attendanceRecord = recordToEdit;
  const ciannId = selectedCiannId;

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSelectAll = (value) => {
    const updated = {};
    students.forEach((student) => {
      updated[student.rollNo] = value;
    });
    setAttendance(updated);
  };

  const handleToggleAll = () => {
    const updated = {};
    students.forEach((student) => {
      updated[student.rollNo] = !attendance[student.rollNo];
    });
    setAttendance(updated);
  };

  const handleReset = () => {
    const updated = {};
    students.forEach((student) => {
      const existingRecord = attendanceRecord.students?.find(
        (s) => s.rollNo === student.rollNo
      );
      updated[student.rollNo] = existingRecord ? existingRecord.status === "Present" : false;
    });
    setAttendance(updated);
  };

  const filteredStudents = students.filter((student) => {
    const query = searchTerm.trim().toLowerCase();
    const studentName = (student.studentName || "").toLowerCase();
    const enrollment = (student.enrollmentNo || "").toLowerCase();
    const roll = (student.rollNo || "").toLowerCase();

    const matchesSearch =
      studentName.includes(query) ||
      enrollment.includes(query) ||
      roll.includes(query);

    if (!matchesSearch) return false;

    const isPresent = !!attendance[student.rollNo];
    if (statusFilter === "present") return isPresent;
    if (statusFilter === "absent") return !isPresent;

    return true;
  });

  useEffect(() => {
    if (!attendanceRecord || !ciannId) {
      setError("Missing attendance record or CIANN ID");
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        // 1. Fetch CIANN details first
        const ciannResponse = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/cianns/${ciannId}`
        );
        const ciannData = ciannResponse.data;

        // 2. Map lab-plan batch codes (B1/B2/B3) to student batch field values (Batch 1/Batch 2/Batch 3)
        const labBatchToStudentBatch = (labBatch) => {
          const map = { B1: "Batch 1", B2: "Batch 2", B3: "Batch 3" };
          return map[labBatch] || labBatch;
        };

        const params = {};
        const divisionId = ciannData?.divisionId?._id || ciannData?.divisionId;
        if (divisionId) {
          params.divisionId = divisionId;
        } else if (ciannData?.division) {
          params.division = ciannData.division;
        }
        if (ciannData?.academicYear) {
          params.academicYear = ciannData.academicYear;
        }

        const studentBatchValue = labBatchToStudentBatch(attendanceRecord.batch);
        params.batch = studentBatchValue;

        // 3. Fetch ONLY the students matching this batch and division/year
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students`,
          { params }
        );

        const fetchedStudents = Array.isArray(response.data)
          ? response.data
          : response.data.students || [];

        setStudents(fetchedStudents);

        // Initialize attendance state with existing data
        const initialAttendance = {};
        fetchedStudents.forEach(student => {
          // Find if this student has attendance record
          const existingRecord = attendanceRecord.students?.find(
            s => s.rollNo === student.rollNo
          );
          initialAttendance[student.rollNo] = existingRecord ? existingRecord.status === "Present" : false;
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [attendanceRecord, ciannId]);

  const handleCheckboxChange = (rollNo) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: !prev[rollNo]
    }));
  };

  const handleSave = async () => {
    if (!window.confirm("Are you sure you want to update this practical attendance?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Prepare updated attendance data
      const updatedStudents = students.map(student => ({
        rollNo: student.rollNo,
        studentName: student.studentName,
        status: attendance[student.rollNo] ? "Present" : "Absent"
      }));

      const updatedRecord = {
        ...attendanceRecord,
        students: updatedStudents
      };

      // Update the record in the database
      await axios.put(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/practical-attendance/${attendanceRecord._id}`,
        updatedRecord
      );

      showSuccessAlert("Practical attendance updated successfully!");
      navigate("/edit-practical-attendance2", { state: { selectedCiannId: ciannId } });
    } catch (error) {
      console.error("Error updating attendance:", error);
      setError("Failed to update attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/edit-practical-attendance2", { state: { selectedCiannId: ciannId } });
  };

  if (loading) {
    return (
      <div className="edit-attendance-page-container">
        <div className="edit-attendance-card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading student data...</div>
            <div style={{ fontSize: '14px' }}>Please wait while we fetch the attendance information.</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <div className="error-heading">Error</div>
          <div style={{ marginBottom: '20px' }}>{error}</div>
          <button className="button-base button-secondary" onClick={handleCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!attendanceRecord) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <div className="error-heading">No Data</div>
          <div style={{ marginBottom: '20px' }}>No attendance record provided</div>
          <button className="button-base button-secondary" onClick={handleCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="practical-page">
      <div className="practical-card">
        <header className="practical-header">
          <div className="practical-header-main">
            <p className="practical-eyebrow">Edit Lab Attendance</p>
            <h2 className="practical-title">Edit Practical Attendance</h2>
            <p className="practical-subtitle">
              {attendanceRecord.exptName} (No. {attendanceRecord.exptNo})
            </p>
          </div>
          <div className="practical-header-meta">
            <div>
              <span>CIANN ID</span>
              <strong>{ciannId || "N/A"}</strong>
            </div>
            <div>
              <span>Batch</span>
              <strong>{attendanceRecord.batch || "N/A"}</strong>
            </div>
            <div>
              <span>Week</span>
              <strong>{attendanceRecord.weekNo || "N/A"}</strong>
            </div>
          </div>
        </header>

        <div className="practical-bulk-actions">
          <button
            type="button"
            className="practical-action-btn"
            onClick={() => handleSelectAll(true)}
          >
            Mark All Present
          </button>
          <button
            type="button"
            className="practical-action-btn"
            onClick={() => handleSelectAll(false)}
          >
            Mark All Absent
          </button>
          <button
            type="button"
            className="practical-action-btn"
            onClick={handleToggleAll}
          >
            Toggle All
          </button>
          <button
            type="button"
            className="practical-action-btn ghost"
            onClick={handleReset}
          >
            Reset to Saved
          </button>
        </div>

        <section className="practical-metrics">
          <div className="metric-card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
          <div className="metric-card success">
            <span>Present</span>
            <strong>{presentCount}</strong>
          </div>
          <div className="metric-card warning">
            <span>Absent</span>
            <strong>{absentCount}</strong>
          </div>
          <div className="metric-card info" style={{ borderColor: 'var(--practical-border)' }}>
            <span>Attendance Rate</span>
            <strong>{students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%</strong>
          </div>
        </section>

        <div className="practical-toolbar">
          <input
            type="text"
            className="practical-search"
            placeholder="Search by roll, name, enrollment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="practical-filter-chips">
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "present" ? "active" : ""}`}
              onClick={() => setStatusFilter("present")}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "absent" ? "active" : ""}`}
              onClick={() => setStatusFilter("absent")}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>

        <section className="practical-table-section">
          <div className="practical-table-head">
            <div>
              <h3>Student List</h3>
              <p>Update attendance choices below.</p>
            </div>
            <div className="practical-badge">Date: {attendanceRecord.actualDate || "N/A"}</div>
          </div>

          <div className="students-panel">
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--practical-muted)" }}>
                <h4>No students match the selected filter.</h4>
              </div>
            ) : (
              <div className="final-students-grid">
                {filteredStudents.map((student) => (
                  <div
                    key={student.rollNo}
                    className={`final-student-card ${attendance[student.rollNo] ? "present" : "absent"}`}
                    onClick={() => handleCheckboxChange(student.rollNo)}
                  >
                    <div className="final-student-header">
                      <span className="final-roll-badge">
                        {student.rollNo}
                      </span>
                      <button
                        type="button"
                        className={`status-pill status-toggle ${attendance[student.rollNo] ? "present" : "absent"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCheckboxChange(student.rollNo);
                        }}
                      >
                        {attendance[student.rollNo] ? "Present" : "Absent"}
                      </button>
                    </div>
                    <div className="final-student-name">
                      {student.studentName}
                    </div>
                    <div className="final-student-meta">
                      Enrollment: {student.enrollmentNo || "N/A"}
                    </div>
                    <div className="final-student-meta">
                      Batch: {student.batch || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="action-buttons-container" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            className="button-base button-secondary" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="button-base button-primary" 
            onClick={handleSave}
            disabled={saving || students.length === 0}
          >
            {saving ? "Saving..." : "Update Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExistingPracticalAttendance;
