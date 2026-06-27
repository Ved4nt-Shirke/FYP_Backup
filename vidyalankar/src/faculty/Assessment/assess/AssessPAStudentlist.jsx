import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "./AssessPAStudentlist.css";

export default function AssessPAStudentlist() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    experiment,
    batch,
    ciannData,
    program,
    className,
    course,
    isEditMode,
  } = location.state || {};
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("AssessPAStudentlist - Component mounted with:", {
      batch,
      experiment,
      isEditMode,
      ciannData: ciannData?.ciannId,
    });

    // Reset all state when experiment changes to prevent cross-contamination
    setStudents([]);
    setError(null);
    setSearchTerm("");

    if (batch && experiment) {
      fetchStudents();
    } else {
      const missingInfo = [];
      if (!batch) missingInfo.push("batch");
      if (!experiment) missingInfo.push("experiment");
      setError(`Missing required information: ${missingInfo.join(", ")}`);
      setLoading(false);
    }
  }, [batch, experiment?.id]); // Include experiment.id for better dependency tracking

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isEditMode && experiment) {
        // In edit mode, fetch existing assessment data, but merge with full student list
        const ciannIdParam = ciannData?.ciannId ? `&ciannId=${ciannData.ciannId}` : '';
        
        // 1. Fetch all students in the batch/division
        let allStudents = [];
        try {
          const studentsResponse = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/students-by-batch?batch=${batch}${ciannIdParam}`);
          const studentsData = await studentsResponse.json();
          if (studentsResponse.ok && studentsData.success && studentsData.students) {
            allStudents = studentsData.students;
          }
        } catch (err) {
          console.warn('Failed to fetch batch students:', err);
        }

        // 2. Fetch existing assessments
        let existingAssessments = [];
        try {
          const response = await fetch(
            `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/edit-data/${experiment.id}?batch=${batch}${ciannIdParam}`,
          );
          const data = await response.json();
          if (response.ok && data.success && data.students) {
            existingAssessments = data.students;
          }
        } catch (err) {
          console.warn('Failed to fetch existing assessments:', err);
        }

        if (allStudents.length === 0 && existingAssessments.length === 0) {
          throw new Error('No students or assessment data found for this experiment and batch');
        }

        // Build fallback list if resolve students returned empty
        if (allStudents.length === 0) {
          allStudents = existingAssessments.map(s => ({
            _id: s._id,
            studentName: s.studentName,
            rollNo: s.rollNo
          }));
        }

        // Map existing grades if any (fallback to empty string)
        const assessedMap = {};
        existingAssessments.forEach(s => {
          assessedMap[s.studentName] = s.marks;
        });

        const mergedStudents = allStudents.map(student => {
          const existingMark = assessedMap[student.studentName];
          return {
            _id: student._id,
            rollNo: student.rollNo || 'N/A',
            studentName: student.studentName,
            marks: existingMark !== undefined ? existingMark : ''
          };
        });

        // Sort by roll number numerically
        mergedStudents.sort((a, b) => {
          const aRoll = String(a.rollNo || "").trim();
          const bRoll = String(b.rollNo || "").trim();
          return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
        });

        setStudents(mergedStudents);
      } else {
        // Normal mode: fetch students from the students database with batch and division filter
        let studentsData = [];

        try {
          // First try the regular students endpoint - filter by both batch and division from CIANN
          const division = ciannData?.division || "";
          const url = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students?batch=${encodeURIComponent(batch)}&division=${encodeURIComponent(division)}`;
          console.log("Fetching students from:", url);
          console.log("Applied filters - Batch:", batch, "Division:", division);

          const response = await fetch(url);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              `Failed to fetch students: ${response.status} ${response.statusText}`,
            );
          }

          console.log("Students fetched:", data);

          if (!Array.isArray(data)) {
            throw new Error(
              "Invalid response format: expected array of students",
            );
          }

          studentsData = data;
        } catch (error) {
          console.warn(
            "Regular students endpoint failed, trying assessment-specific endpoint:",
            error.message,
          );

          // Fallback to assessment-specific students endpoint
          try {
            const division = ciannData?.division || "";
            const fallbackUrl = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/students-by-batch?batch=${encodeURIComponent(batch)}&division=${encodeURIComponent(division)}`;
            console.log("Trying fallback URL:", fallbackUrl);

            const fallbackResponse = await fetch(fallbackUrl);
            const fallbackData = await fallbackResponse.json();

            if (!fallbackResponse.ok) {
              throw new Error(
                `Fallback endpoint also failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
              );
            }

            if (fallbackData.success && Array.isArray(fallbackData.students)) {
              studentsData = fallbackData.students;
              console.log("Students fetched from fallback:", studentsData);
            } else {
              throw new Error("No students found in fallback response");
            }
          } catch (fallbackError) {
            console.error("Both endpoints failed:", fallbackError);
            throw new Error(
              `Failed to fetch students from both endpoints: ${error.message} | ${fallbackError.message}`,
            );
          }
        }

        if (studentsData.length === 0) {
          const division = ciannData?.division || "Unknown";
          console.warn(
            `No students found for batch: ${batch}, division: ${division}`,
          );
        }

        // Transform the data to match the expected format
        const studentsWithMarks = studentsData.map((student) => ({
          _id: student._id,
          rollNo: student.rollNo,
          studentName: student.studentName,
          batch: student.batch,
          marks: "", // default marks empty for new assessment
        }));

        setStudents(studentsWithMarks);
        console.log("Students with marks initialized:", studentsWithMarks);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(error.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, marks) => {
    if (marks === "") {
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student._id === studentId
            ? { ...student, marks: "" }
            : student,
        ),
      );
      return;
    }
    const numericMarks = parseInt(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 25) {
      alert("Marks should be between 0 and 25");
      return;
    }

    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student._id === studentId
          ? { ...student, marks: numericMarks }
          : student,
      ),
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!experiment) {
        throw new Error("Missing experiment information");
      }

      // Validate marks before submitting
      const invalidMarks = students.filter((student) => {
        const marks = student.marks;
        if (marks === "" || marks === undefined || marks === null) return false;
        return marks < 0 || marks > 25;
      });

      if (invalidMarks.length > 0) {
        const invalidStudents = invalidMarks
          .map((s) => `${s.studentName} (${s.marks})`)
          .join(", ");
        alert(
          `Invalid marks found for: ${invalidStudents}. Marks must be between 0 and 25.`,
        );
        return;
      }

      // Prepare students marks data: only save students who have a mark entered!
      const studentsMarks = students
        .filter(student => student.marks !== "" && student.marks !== undefined && student.marks !== null)
        .map((student) => ({
          studentId: student._id,
          rollNo: student.rollNo,
          studentName: student.studentName,
          marks: Number(student.marks),
        }));

      if (studentsMarks.length === 0) {
        alert("Please enter marks for at least one student before submitting.");
        setSaving(false);
        return;
      }

      const requestPayload = {
        studentsMarks,
        experimentId: experiment.id,
        experimentName: experiment.name,
        batch: batch, // Add batch for validation
        // add subject context to persist with assessments
        program: program || ciannData?.department?.name || "",
        className: className || ciannData?.class || ciannData?.division || "",
        course:
          course || ciannData?.subject?.name || ciannData?.subject?.code || "",
        ciannId: ciannData?.ciannId,
      };

      console.log("Sending request payload:", requestPayload);
      console.log("Experiment object:", experiment);
      console.log("Experiment ID:", experiment?.id);
      console.log("Experiment ID type:", typeof experiment?.id);

      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/save-marks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle specific 400 Bad Request errors
        if (response.status === 400) {
          let errorMsg =
            data.message ||
            "Invalid marks data. Please check that all marks are between 0 and 25.";

          // If there are specific errors, include them
          if (data.errors && Array.isArray(data.errors)) {
            errorMsg += "\n\nDetailed errors:\n" + data.errors.join("\n");
          }

          // If there are invalid students, include them
          if (data.invalidStudents && Array.isArray(data.invalidStudents)) {
            errorMsg +=
              "\n\nInvalid students: " + data.invalidStudents.join(", ");
          }

          console.error("Detailed 400 error:", data);
          console.error("Specific errors:", data.errors);
          console.error("Invalid students:", data.invalidStudents);
          throw new Error(errorMsg);
        }
        throw new Error(data.message || "Failed to save marks");
      }

      if (data.success) {
        const message = isEditMode
          ? `Successfully updated marks for ${data.savedCount} students!`
          : `Successfully saved marks for ${data.savedCount} students!`;
        alert(message);
        // Navigate back to previous page after successful save/update
        navigate(-1);
      } else {
        throw new Error(data.message || "Failed to save marks");
      }
    } catch (error) {
      console.error("Error saving marks:", error);
      setError(error.message);

      // Show more specific error messages
      let userMessage = error.message;
      if (
        error.message.includes("400") ||
        error.message.includes("Bad Request")
      ) {
        userMessage =
          "Invalid marks data. Please ensure all marks are between 0 and 25, and try again.";
      }

      alert(`Error saving marks: ${userMessage}`);
    } finally {
      setSaving(false);
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
            <p className="mt-2">Loading students...</p>
          </div>
        </div>
      </>
    );
  }

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Header />
      <div
        className="container-fluid assess-pa-studentlist-page"
        style={{ margin: "0", padding: "15px", maxWidth: "none" }}
      >
        <div className="page-header">
          {isEditMode
            ? "Edit Progressive Assessment"
            : "Faculty Progressive Assessment"}
        </div>
        {experiment && (
          <div className="alert alert-secondary mb-3">
            <strong>Experiment {experiment.id}:</strong> {experiment.name}
          </div>
        )}
        {batch && ciannData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>CIAAN ID:</strong> {ciannData.ciannId} <br />
            <strong>Subject:</strong> {ciannData.subject?.name} (
            {ciannData.subject?.code}) <br />
            <strong>Division:</strong> {ciannData.division}
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <br />
            <small className="text-muted">
              Batch: {batch} | Mode: {isEditMode ? "Edit" : "New Assessment"}
            </small>
            <button
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchStudents}
            >
              Retry
            </button>
          </div>
        )}

        <div className="search-controls">
          <div className="d-flex justify-content-between">
            <div className="d-flex">
              <input
                type="text"
                placeholder="Search by name or roll number"
                className="form-control me-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <button
                className="btn btn-outline-secondary me-2"
                onClick={fetchStudents}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise" /> Refresh
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Marks (0-25)</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      {students.length === 0
                        ? `No students found for this batch (${ciannData?.division || "Unknown"} division)`
                        : "No matching records found"}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={`${experiment?.id}-${student._id}`}>
                      <td>{student.rollNo}</td>
                      <td>{student.studentName}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={student.marks ?? ''}
                          min="0"
                          max="25"
                          onChange={(e) =>
                            handleMarksChange(student._id, e.target.value)
                          }
                          disabled={saving}
                          key={`marks-${experiment?.id}-${student._id}`}
                          placeholder="0-25"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {students.length > 0 && (
          <div className="submit-section">
            <div className="alert alert-warning">
              <i className="bi bi-info-circle"></i>
              <strong> Important:</strong> Maximum marks per student is{" "}
              <strong>25</strong>. Please ensure all marks are between 0 and 25
              before submitting.
            </div>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Saving...
                </>
              ) : isEditMode ? (
                "Update Marks"
              ) : (
                "Submit Marks"
              )}
            </button>
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-3">
            <small className="text-muted">
              Total Students: {students.length} | Filtered:{" "}
              {filteredStudents.length} | Average Marks:{" "}
              {students.length > 0
                ? (
                    students.reduce((sum, s) => sum + (s.marks || 0), 0) /
                    students.length
                  ).toFixed(1)
                : 0}
              /25 | Max Marks: 25
            </small>
          </div>
        )}
      </div>
    </>
  );
}
