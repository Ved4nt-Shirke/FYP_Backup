import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { config } from "../config/api";
import ManageStudents from "./ManageStudents";
import DivisionCredentials from "./DivisionCredentials";
import "./OfficeDashboard.css";

const headerOptions = [
  "roll no",
  "rollno",
  "roll_no",
  "enrollment no",
  "enrollmentno",
  "enrollment_no",
  "student name",
  "name",
];

const normalizeValue = (value) => (value === undefined || value === null ? "" : value.toString().trim());

const mapRow = (row) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    const safeKey = key.toLowerCase().replace(/\s+/g, "");
    normalized[safeKey] = normalizeValue(value);
  });

  const rollNo = normalized["rollno"] || normalized["roll_no"] || normalized["roll"];
  const enrollmentNo =
    normalized["enrollmentno"] || normalized["enrollment_no"] || normalized["enrollment"];
  const studentName =
    normalized["studentname"] || normalized["name"] || normalized["student"] || "";

  return { rollNo, enrollmentNo, studentName };
};

const OfficeDashboard = ({ currentTab, setCurrentTab }) => {
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  
  // Selection states for cascading dropdowns
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [batch, setBatch] = useState("");
  
  // Lists for dropdowns
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState([]);

  const hasPreview = useMemo(() => parsedRows.length > 0, [parsedRows]);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.departments, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.courses(departmentId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const fetchDivisions = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.courseDivisions(courseId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setDivisions(data.divisions || []);
      }
    } catch (err) {
      console.error("Failed to fetch divisions", err);
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedCourse("");
    setSelectedDivision("");
    setCourses([]);
    setDivisions([]);
    
    if (deptId) {
      fetchCourses(deptId);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedDivision("");
    setDivisions([]);
    
    if (courseId) {
      fetchDivisions(courseId);
    }
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const fetchStudents = async (divisionFilter = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = divisionFilter
        ? `${config.office.students}?division=${encodeURIComponent(divisionFilter)}`
        : config.office.students;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError("Could not load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");
    setParsedRows([]);

    if (!file) return;
    setFileName(file.name);

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF import is not supported for automatic parsing. Please upload Excel/CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const mapped = json
          .map((row) => mapRow(row))
          .filter((row) => row.rollNo && row.enrollmentNo && row.studentName);

        if (mapped.length === 0) {
          setError("No valid rows found. Please check column headers: RollNo, EnrollmentNo, StudentName.");
          return;
        }

        setParsedRows(mapped);
      } catch (err) {
        console.error("Failed to parse file", err);
        setError("Unable to read file. Please use a clean Excel/CSV template.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!hasPreview) {
      setError("Please upload and parse an Excel/CSV file first.");
      return;
    }

    if (!selectedDepartment || !selectedCourse || !selectedDivision) {
      setError("Please select Department, Course, and Division.");
      return;
    }

    if (!batch.trim()) {
      setError("Please enter the Batch.");
      return;
    }

    const payload = {
      students: parsedRows,
      batch: batch.trim(),
      departmentId: selectedDepartment,
      courseId: selectedCourse,
      divisionId: selectedDivision,
    };

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.bulkImport, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(`Uploaded ${data.inserted || 0} students. Skipped ${data.skipped || 0}. Credentials generated successfully!`);
      if (data.generatedCredentials) {
        setGeneratedCredentials(data.generatedCredentials);
      }
      setParsedRows([]);
      setFileName("");
      fetchStudents(filterDivision);
    } catch (err) {
      console.error("Upload error", err);
      setError(err.message || "Failed to upload students");
    } finally {
      setUploading(false);
    }
  };

  const handleFilter = () => {
    fetchStudents(filterDivision.trim());
  };

  return (
    <div className="office-page">
      <div className="office-header">
        <div>
          <h1>Office Staff Panel</h1>
          <p>Upload student lists with division and keep records tidy.</p>
        </div>
      </div>

      <div className="office-tabs">
        <button
          className={`tab-button ${currentTab === "upload" ? "active" : ""}`}
          onClick={() => setCurrentTab("upload")}
        >
          Upload Students
        </button>
        <button
          className={`tab-button ${currentTab === "credentials" ? "active" : ""}`}
          onClick={() => setCurrentTab("credentials")}
        >
          📥 Division Credentials
        </button>
        <button
          className={`tab-button ${currentTab === "manage" ? "active" : ""}`}
          onClick={() => setCurrentTab("manage")}
        >
          Manage Students
        </button>
      </div>

      {currentTab === "upload" ? (
        <div className="office-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Upload Student List</h2>
                <p>Select Department → Course → Division, then upload Excel with columns: RollNo, EnrollmentNo, StudentName</p>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Step 1: Select Assignment</h3>
              
              <div className="form-row">
                <label>Department <span className="required">*</span></label>
                <select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  disabled={uploading}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Course <span className="required">*</span></label>
                <select
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  disabled={!selectedDepartment || uploading}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      Semester {course.semester} - {course.courseCode} ({course.scheme})
                    </option>
                  ))}
                </select>
                {selectedDepartment && courses.length === 0 && (
                  <small className="hint">No courses found for this department</small>
                )}
              </div>

              <div className="form-row">
                <label>Division <span className="required">*</span></label>
                <select
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                  disabled={!selectedCourse || uploading}
                  required
                >
                  <option value="">-- Select Division --</option>
                  {divisions.map((div) => (
                    <option key={div._id} value={div._id}>
                      {div.name}
                    </option>
                  ))}
                </select>
                {selectedCourse && divisions.length === 0 && (
                  <small className="hint">No divisions found for this course</small>
                )}
              </div>

              <div className="form-row">
                <label>Batch <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., 2024-2025"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  disabled={uploading}
                  required
                />
                <small className="hint">Academic year or batch identifier</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Step 2: Upload Student Data</h3>
              
              <div className="upload-row">
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileChange}
                  disabled={!selectedDepartment || !selectedCourse || !selectedDivision || !batch || uploading}
                />
                {fileName && <span className="file-chip">{fileName}</span>}
              </div>
              
              {hasPreview && (
                <div className="preview-info">
                  <span>✓ {parsedRows.length} students ready to upload</span>
                </div>
              )}
            </div>

            <button 
              className="primary-btn" 
              onClick={handleUpload} 
              disabled={uploading || !hasPreview}
            >
              {uploading ? "Uploading..." : "Upload Students"}
            </button>
            
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}
            
            {generatedCredentials.length > 0 && (
              <div className="credentials-section">
                <h3>Generated Student Credentials</h3>
                <p className="credentials-warning">Please save these credentials. They will not be shown again.</p>
                <div className="credentials-table-wrapper">
                  <table className="credentials-table">
                    <thead>
                      <tr>
                        <th>Enrollment No</th>
                        <th>Student Name</th>
                        <th>Username</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCredentials.map((cred, idx) => (
                        <tr key={idx}>
                          <td>{cred.enrollmentNo}</td>
                          <td>{cred.studentName}</td>
                          <td><code>{cred.username}</code></td>
                          <td><code>{cred.plainPassword}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button 
                  className="primary-btn" 
                  onClick={() => {
                    const text = generatedCredentials
                      .map(c => `${c.enrollmentNo},${c.studentName},${c.username},${c.plainPassword}`)
                      .join('\n');
                    navigator.clipboard.writeText(text);
                    alert('Credentials copied to clipboard!');
                  }}
                >
                  📋 Copy All to Clipboard
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h2>Existing Students</h2>
                <p>Stored with batch and division</p>
              </div>
              <div className="pill">{students.length} total</div>
            </div>
            <div className="office-actions">
              <input
                type="text"
                placeholder="Filter by division"
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
              />
              <button onClick={handleFilter} className="primary-btn" disabled={loading}>
                {loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Enrollment No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Course</th>
                    <th>Division</th>
                    <th>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty">{loading ? "Loading..." : "No students yet"}</td>
                    </tr>
                  )}
                  {students.map((student) => (
                    <tr key={`${student._id}-${student.enrollmentNo}`}>
                      <td>{student.rollNo}</td>
                      <td>{student.enrollmentNo}</td>
                      <td>{student.studentName}</td>
                      <td>{student.departmentId?.name || "-"}</td>
                      <td>{student.courseId ? `Sem ${student.courseId.semester} - ${student.courseId.courseCode}` : "-"}</td>
                      <td>{student.divisionId?.name || student.division || "-"}</td>
                      <td>{student.batch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : currentTab === "credentials" ? (
        <DivisionCredentials />
      ) : (
        <ManageStudents />
      )}
    </div>
  );
};

export default OfficeDashboard;
