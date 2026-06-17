import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { config } from "../config/api";
import ManageStudents from "./ManageStudents";
import NoticesPage from "./NoticesPage";
import "./OfficeDashboard.css";

const generateBatchOptions = (count = 12) =>
  Array.from({ length: count }, (_, index) => `Batch ${index + 1}`);

const generateAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;
  return Array.from({ length: 8 }, (_, index) => {
    const year = startYear + index;
    return `${year}-${String(year + 1).slice(-2)}`;
  });
};

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

const normalizeValue = (value) =>
  value === undefined || value === null ? "" : value.toString().trim();

const mapRow = (row) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    const safeKey = key.toLowerCase().replace(/\s+/g, "");
    normalized[safeKey] = normalizeValue(value);
  });

  return {
    rollNo: normalized["rollno"] || normalized["roll_no"] || normalized["roll"],
    enrollmentNo:
      normalized["enrollmentno"] ||
      normalized["enrollment_no"] ||
      normalized["enrollment"],
    studentName:
      normalized["studentname"] ||
      normalized["name"] ||
      normalized["student"] ||
      "",
  };
};

const OfficeDashboard = ({ currentTab, setCurrentTab }) => {
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [copied, setCopied] = useState(false);

  // Cascading filter states
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [batch, setBatch] = useState("");

  // Dropdown data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Main data
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState([]);
  const [showBatchAllocationDialog, setShowBatchAllocationDialog] =
    useState(false);
  const [batchAllocationCount, setBatchAllocationCount] = useState(1);
  const [batchAllocations, setBatchAllocations] = useState([]);
  const [batchAllocationError, setBatchAllocationError] = useState("");

  const hasPreview = useMemo(() => parsedRows.length > 0, [parsedRows]);

  const isUploadDisabled = useMemo(() => {
    if (!selectedDepartment || !selectedDivision || !selectedAcademicYear) return false;
    return students.some((s) => {
      const deptId = s.departmentId?._id || s.departmentId;
      const divId = s.divisionId?._id || s.divisionId;
      return (
        deptId === selectedDepartment &&
        divId === selectedDivision &&
        s.academicYear === selectedAcademicYear
      );
    });
  }, [selectedDepartment, selectedDivision, selectedAcademicYear, students]);

  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.departments, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setDepartments(data.departments || []);
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
      if (data.success) setCourses(data.courses || []);
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
      if (data.success) setDivisions(data.divisions || []);
    } catch (err) {
      console.error("Failed to fetch divisions", err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.students, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedCourse("");
    setSelectedDivision("");
    setSelectedAcademicYear("");
    setCourses([]);
    setDivisions([]);

    if (deptId) fetchCourses(deptId);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedDivision("");
    setSelectedAcademicYear("");
    setDivisions([]);

    if (courseId) fetchDivisions(courseId);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const handleAcademicYearChange = (e) => {
    setSelectedAcademicYear(e.target.value);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");
    setParsedRows([]);

    if (!file) return;
    
    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
    setFileName(file.name);

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("PDF files are not supported. Please upload Excel or CSV.");
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      console.error("File read error");
      setError("Error reading file. Please try again.");
    };

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        console.log("Workbook sheets:", workbook.SheetNames);
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        console.log("Raw rows from Excel:", json.length);
        if (json.length > 0) {
          console.log("First row keys:", Object.keys(json[0]));
          console.log("First row data:", json[0]);
        }

        const mapped = json
          .map((row) => mapRow(row))
          .filter((row) => row.rollNo && row.enrollmentNo && row.studentName);

        console.log("Mapped rows:", mapped.length);
        if (mapped.length > 0) {
          console.log("First mapped row:", mapped[0]);
        }

        if (mapped.length === 0) {
          if (json.length === 0) {
            setError("Excel file is empty. No data found.");
          } else {
            setError(
              `No valid rows found out of ${json.length}. Required columns: RollNo (or Roll), EnrollmentNo (or Enrollment No), StudentName (or Name). Check that all rows have these fields filled.`,
            );
          }
          return;
        }

        setParsedRows(mapped);
        setSuccess(`${mapped.length} students ready to upload`);
      } catch (err) {
        console.error("Failed to parse file", err);
        setError("Unable to read file. Please use a clean Excel/CSV template. " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!hasPreview) {
      setError("Please upload and parse a file first.");
      return;
    }

    if (
      !selectedDepartment ||
      !selectedCourse ||
      !selectedDivision ||
      !selectedAcademicYear
    ) {
      const missing = [];
      if (!selectedDepartment) missing.push("Department");
      if (!selectedCourse) missing.push("Course");
      if (!selectedDivision) missing.push("Division");
      if (!selectedAcademicYear) missing.push("Academic Year");
      setError(
        `Please select: ${missing.join(", ")}`,
      );
      return;
    }

    setBatchAllocationCount(1);
    setBatchAllocations([
      {
        batch: "Batch 1",
        count: parsedRows.length,
      },
    ]);
    setBatchAllocationError("");
    setShowBatchAllocationDialog(true);
  };

  const handleBatchAllocationCountChange = (value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setBatchAllocationCount(1);
      setBatchAllocations((prev) => prev.slice(0, 1));
      return;
    }

    const safeCount = Math.min(parsed, Math.max(1, parsedRows.length));
    setBatchAllocationCount(safeCount);
    setBatchAllocations((prev) =>
      Array.from({ length: safeCount }, (_, index) => ({
        batch: `Batch ${index + 1}`,
        count: Number(prev[index]?.count || 0),
      })),
    );
  };

  const handleBatchAllocationFieldChange = (index, field, value) => {
    setBatchAllocations((prev) =>
      prev.map((allocation, i) =>
        i === index
          ? {
              ...allocation,
              [field]: field === "count" ? Number(value || 0) : value,
            }
          : allocation,
      ),
    );
  };

  const totalAllocated = batchAllocations.reduce(
    (sum, allocation) => sum + (Number(allocation.count) || 0),
    0,
  );

  const validateBatchAllocations = () => {
    if (batchAllocations.length !== batchAllocationCount) {
      return `Please configure ${batchAllocationCount} batch rows.`;
    }

    const invalid = batchAllocations.find(
      (allocation) =>
        !allocation.batch ||
        !Number.isInteger(Number(allocation.count)) ||
        Number(allocation.count) <= 0,
    );

    if (invalid) {
      return "Each batch row must have a batch and a positive student count.";
    }

    const uniqueBatches = new Set(batchAllocations.map((a) => a.batch));
    if (uniqueBatches.size !== batchAllocations.length) {
      return "Batch names must be unique in allocation.";
    }

    if (totalAllocated !== parsedRows.length) {
      return `Total allocated students (${totalAllocated}) must equal uploaded students (${parsedRows.length}).`;
    }

    return "";
  };

  const handleConfirmBatchAllocation = async () => {
    const validationError = validateBatchAllocations();
    if (validationError) {
      setBatchAllocationError(validationError);
      return;
    }

    setBatchAllocationError("");

    const payload = {
      students: parsedRows,
      batch: batch.trim() || batchAllocations[0]?.batch || "",
      academicYear: selectedAcademicYear,
      departmentId: selectedDepartment,
      courseId: selectedCourse,
      divisionId: selectedDivision,
      batchAllocations,
    };

    console.log("=== UPLOAD DEBUG ===");
    console.log("Upload endpoint:", config.office.bulkImport);
    console.log("Upload payload:", payload);
    console.log("Number of students:", parsedRows.length);
    console.log("First student sample:", parsedRows[0]);
    console.log("Token exists:", !!localStorage.getItem("token"));

    try {
      setUploading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Session expired. Please login again.");
        setUploading(false);
        return;
      }

      const res = await fetch(config.office.bulkImport, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Upload response:", data);

      if (!res.ok) {
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(
        `Successfully uploaded ${data.inserted || 0} students. Skipped ${data.skipped || 0}.`,
      );

      if (data.generatedCredentials && data.generatedCredentials.length > 0) {
        setGeneratedCredentials(data.generatedCredentials);
      }

      setShowBatchAllocationDialog(false);

      // Reset form
      setParsedRows([]);
      setFileName("");
      setBatch("");
      setSelectedAcademicYear("");
      setTimeout(() => fetchStudents(), 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload students");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="office-page">
      {/* Active page views */}

      {/* Upload Tab */}
      {currentTab === "upload" ? (
        <div className="office-grid">

          {/* Compact Page Header with inline stats */}
          <div className="upload-page-header">
            <div className="upload-page-header-left">
              <div className="upload-page-icon">📤</div>
              <div>
                <h1 className="upload-page-title">Upload Students</h1>
                <p className="upload-page-sub">Assign, upload and manage student records in one place</p>
              </div>
            </div>
            <div className="upload-page-stats">
              <div className="mini-stat">
                <span className="mini-stat-icon" style={{background:"#EEF2FF"}}>👥</span>
                <div>
                  <p className="mini-stat-val">{students.length}</p>
                  <p className="mini-stat-label">Students</p>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon" style={{background:"#DBEAFE"}}>🏫</span>
                <div>
                  <p className="mini-stat-val">{departments.length}</p>
                  <p className="mini-stat-label">Departments</p>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon" style={{background:"#DCFCE7"}}>📋</span>
                <div>
                  <p className="mini-stat-val">{divisions.length || "—"}</p>
                  <p className="mini-stat-label">Divisions</p>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon" style={{background:"#FEF3C7"}}>📁</span>
                <div>
                  <p className="mini-stat-val">{parsedRows.length > 0 ? parsedRows.length : "—"}</p>
                  <p className="mini-stat-label">File Rows</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-badge">📤</div>
              <div className="card-header-text">
                <h2>Upload New Students</h2>
                <p>Select assignment details and upload Excel/CSV file</p>
              </div>
            </div>

            {/* Step 1: Assignment */}
            <div className="form-section animate-fade-in">
              <h3>Step 1: Select Assignment</h3>

              <div className="form-grid">
                <div className="form-row-col">
                  <label>
                    Department <span className="required">*</span>
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    disabled={uploading}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-col">
                  <label>
                    Course <span className="required">*</span>
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    disabled={!selectedDepartment || uploading}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        Semester {course.semester} - {course.courseCode} ({course.scheme})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-col">
                  <label>
                    Division <span className="required">*</span>
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={handleDivisionChange}
                    disabled={!selectedCourse || uploading}
                  >
                    <option value="">-- Select Division --</option>
                    {divisions.map((div) => (
                      <option key={div._id} value={div._id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-col">
                  <label>
                    Academic Year <span className="required">*</span>
                  </label>
                  <select
                    value={selectedAcademicYear}
                    onChange={handleAcademicYearChange}
                    disabled={uploading}
                  >
                    <option value="">-- Select Academic Year --</option>
                    {generateAcademicYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-col full-width">
                  <label>
                    Default Batch <span className="hint">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Enter batch name (e.g. Batch 1)"
                    disabled={uploading}
                  />
                </div>
              </div>

              {isUploadDisabled && (
                <div className="alert error">
                  <span>⚠️</span>
                  <div>
                    <strong>Bulk upload is disabled:</strong> Students already exist in the database for the selected Department, Division, and Academic Year.
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: File Upload */}
            <div className="form-section animate-fade-in delay-1">
              <h3>Step 2: Upload Student Data</h3>

              <div className="file-dropzone-wrapper">
                <input
                  id="student-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={
                    !selectedDepartment ||
                    !selectedCourse ||
                    !selectedDivision ||
                    !selectedAcademicYear ||
                    uploading ||
                    isUploadDisabled
                  }
                />
                <label 
                  htmlFor="student-file-input" 
                  className={`dropzone-label ${(!selectedDepartment || !selectedCourse || !selectedDivision || !selectedAcademicYear || isUploadDisabled) ? 'disabled' : ''}`}
                >
                  <div className="dropzone-icon">📊</div>
                  <div className="dropzone-info">
                    {fileName ? (
                      <>
                        <span className="dropzone-filename">📁 {fileName}</span>
                        <span className="dropzone-change">Click to change file</span>
                      </>
                    ) : (
                      <>
                        <strong>Choose an Excel or CSV file</strong>
                        <span className="dropzone-subtext">Click here to browse student records sheet</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {hasPreview && (
                <div className="preview-info-badge">
                  <span className="checkmark">✓</span>
                  <span>{parsedRows.length} students loaded and validated</span>
                </div>
              )}
            </div>

            <button
              className="primary-btn upload-submit-btn"
              onClick={handleUpload}
              disabled={uploading || !hasPreview || isUploadDisabled}
            >
              {uploading ? "Uploading Students..." : "Upload Students"}
            </button>

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            {showBatchAllocationDialog && (
              <div
                className="modal-overlay"
                onClick={() => setShowBatchAllocationDialog(false)}
              >
                <div
                  className="modal-content batch-allocation-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="batch-modal-header">
                    <h2>⚖️ Batch Allocation</h2>
                    <p>
                      Distribute <strong>{parsedRows.length}</strong> uploaded students into batches.
                    </p>
                  </div>

                  <div className="form-row-col">
                    <label>How many batches to divide?</label>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, parsedRows.length)}
                      value={batchAllocationCount}
                      onChange={(e) =>
                        handleBatchAllocationCountChange(e.target.value)
                      }
                      disabled={uploading}
                    />
                  </div>

                  <div className="batch-allocation-grid office-scrollable">
                    {batchAllocations.map((allocation, index) => (
                      <div key={index} className="batch-allocation-row">
                        <div className="batch-name-display">Batch {index + 1}</div>

                        <div className="form-row-col">
                          <label>Students in Batch</label>
                          <input
                            type="number"
                            min="1"
                            value={allocation.count}
                            onChange={(e) =>
                              handleBatchAllocationFieldChange(
                                index,
                                "count",
                                e.target.value,
                              )
                            }
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress and allocation summary */}
                  <div className="allocation-progress-wrapper">
                    <div className="progress-bar-container">
                      <div 
                        className={`progress-bar-fill ${totalAllocated === parsedRows.length ? 'success' : 'pending'}`} 
                        style={{ width: `${Math.min(100, (totalAllocated / parsedRows.length) * 100)}%` }}
                      />
                    </div>
                    <div className={`allocation-summary-text ${totalAllocated === parsedRows.length ? 'success' : 'error'}`}>
                      Allocated: <strong>{totalAllocated}</strong> / {parsedRows.length} students
                    </div>
                  </div>

                  {batchAllocationError && (
                    <div className="alert error">{batchAllocationError}</div>
                  )}

                  <div className="modal-buttons">
                    <button
                      className="btn-secondary"
                      onClick={() => setShowBatchAllocationDialog(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      className="primary-btn"
                      onClick={handleConfirmBatchAllocation}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading Students..." : "Confirm & Upload"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Credentials */}
            {generatedCredentials.length > 0 && (
              <div className="credentials-section">
                <div className="credentials-header-row">
                  <div>
                    <h3>🔐 Generated Student Credentials</h3>
                    <p className="credentials-warning">
                      ⚠️ Please save these credentials now. They will not be displayed again.
                    </p>
                  </div>
                  <button
                    className={`copy-all-btn ${copied ? 'copied' : ''}`}
                    onClick={() => {
                      const text = generatedCredentials
                        .map(
                          (c) =>
                            `${c.enrollmentNo},${c.studentName},${c.username},${c.plainPassword}`,
                        )
                        .join("\n");
                      navigator.clipboard.writeText(text);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy All (CSV format)"}
                  </button>
                </div>

                <div className="credentials-table-wrapper office-scrollable">
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
                          <td className="student-name-bold">{cred.studentName}</td>
                          <td>
                            <code className="cred-code">{cred.username}</code>
                          </td>
                          <td>
                            <code className="cred-code password">{cred.plainPassword}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : currentTab === "notices" ? (
        <NoticesPage />
      ) : (
        <ManageStudents />
      )}
    </div>
  );
};

export default OfficeDashboard;
