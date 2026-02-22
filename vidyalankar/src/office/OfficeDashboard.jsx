import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { config } from "../config/api";
import ManageStudents from "./ManageStudents";
import NoticesPage from "./NoticesPage";
import "./OfficeDashboard.css";

// Generate batch options (2024-25 onwards for next 6 years)
const generateBatchOptions = () => {
  const options = [];
  const startYear = 2024;

  for (let i = 0; i < 6; i++) {
    const year = startYear + i;
    const nextYear = year + 1;
    const shortYear = nextYear.toString().slice(-2);
    options.push(`${year}-${shortYear}`);
  }
  return options;
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

  // Cascading filter states
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
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
    setCourses([]);
    setDivisions([]);

    if (deptId) fetchCourses(deptId);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedDivision("");
    setDivisions([]);

    if (courseId) fetchDivisions(courseId);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
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
      !selectedDivision
    ) {
      const missing = [];
      if (!selectedDepartment) missing.push("Department");
      if (!selectedCourse) missing.push("Course");
      if (!selectedDivision) missing.push("Division");
      setError(
        `Please select: ${missing.join(", ")}`,
      );
      return;
    }

    const fallbackBatch =
      batch.trim() || generateBatchOptions()[0] || "";
    setBatchAllocationCount(1);
    setBatchAllocations([
      {
        batch: fallbackBatch,
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
    setBatchAllocations((prev) => {
      const current = [...prev];
      if (current.length < safeCount) {
        const fallbackBatch = batch.trim() || "";
        while (current.length < safeCount) {
          current.push({ batch: fallbackBatch, count: 0 });
        }
      }
      return current.slice(0, safeCount);
    });
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
      {/* Header */}
      <div className="office-header">
        <div>
          <h1>🏢 Office Staff Panel</h1>
          <p>Upload new students and manage existing records</p>
        </div>
      </div>

      {/* Upload Tab */}
      {currentTab === "upload" ? (
        <div className="office-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Upload New Students</h2>
                <p>Select assignment details and upload Excel/CSV file</p>
              </div>
            </div>

            {/* Step 1: Assignment */}
            <div className="form-section">
              <h3>Step 1: Select Assignment</h3>

              <div className="form-row">
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

              <div className="form-row">
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
                      Semester {course.semester} - {course.courseCode} (
                      {course.scheme})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
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

              <div className="form-row">
                <label>
                  Default Batch <span className="hint">(optional)</span>
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">-- Select Batch --</option>
                  {generateBatchOptions().map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: File Upload */}
            <div className="form-section">
              <h3>Step 2: Upload Student Data</h3>

              <div className="upload-row">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={
                    !selectedDepartment ||
                    !selectedCourse ||
                    !selectedDivision ||
                    uploading
                  }
                />
                {fileName && <span className="file-chip">✓ {fileName}</span>}
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
                  <h2>Batch Allocation</h2>
                  <p>
                    Uploaded students: <strong>{parsedRows.length}</strong>
                  </p>

                  <div className="form-row">
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

                  <div className="batch-allocation-grid">
                    {batchAllocations.map((allocation, index) => (
                      <div key={index} className="batch-allocation-row">
                        <div className="form-row">
                          <label>Batch {index + 1}</label>
                          <select
                            value={allocation.batch}
                            onChange={(e) =>
                              handleBatchAllocationFieldChange(
                                index,
                                "batch",
                                e.target.value,
                              )
                            }
                            disabled={uploading}
                          >
                            <option value="">-- Select Batch --</option>
                            {generateBatchOptions().map((b) => (
                              <option key={`${b}-${index}`} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-row">
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

                  <div className="allocation-summary">
                    Allocated: <strong>{totalAllocated}</strong> / {parsedRows.length}
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
                <h3>Generated Student Credentials</h3>
                <p className="credentials-warning">
                  Please save these credentials. They will not be shown again.
                </p>

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
                          <td>
                            <code>{cred.username}</code>
                          </td>
                          <td>
                            <code>{cred.plainPassword}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="primary-btn"
                  onClick={() => {
                    const text = generatedCredentials
                      .map(
                        (c) =>
                          `${c.enrollmentNo},${c.studentName},${c.username},${c.plainPassword}`,
                      )
                      .join("\n");
                    navigator.clipboard.writeText(text);
                    alert("Credentials copied to clipboard!");
                  }}
                >
                  📋 Copy All to Clipboard
                </button>
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
