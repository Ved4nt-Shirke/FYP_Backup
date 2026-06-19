import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { config } from "../config/api";
import ManageStudents from "./ManageStudents";
import NoticesPage from "./NoticesPage";
import "./OfficeDashboard.css";

const generateAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;
  return Array.from({ length: 8 }, (_, index) => {
    const year = startYear + index;
    return `${year}-${String(year + 1).slice(-2)}`;
  });
};

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
  // Wizard flow step state: 1: Assignment, 2: Upload, 3: Preview, 4: Import
  const [currentStep, setCurrentStep] = useState(1);
  
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [copied, setCopied] = useState(false);
  const [skippedStudents, setSkippedStudents] = useState([]);
  const [existingClassCount, setExistingClassCount] = useState(0);

  // Cascading assignment filter states
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [batch, setBatch] = useState("");

  // Dropdown options
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Stats / Dashboard data
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState([]);
  
  // Batch allocation
  const [showBatchAllocationDialog, setShowBatchAllocationDialog] = useState(false);
  const [batchAllocationCount, setBatchAllocationCount] = useState(1);
  const [batchAllocations, setBatchAllocations] = useState([]);
  const [batchAllocationError, setBatchAllocationError] = useState("");

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

  useEffect(() => {
    if (selectedDepartment && selectedCourse && selectedDivision && selectedAcademicYear) {
      fetchExistingClassCount();
    } else {
      setExistingClassCount(0);
    }
  }, [selectedDepartment, selectedCourse, selectedDivision, selectedAcademicYear]);

  const fetchExistingClassCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${config.office.students}?departmentId=${selectedDepartment}&courseId=${selectedCourse}&divisionId=${selectedDivision}&academicYear=${selectedAcademicYear}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setExistingClassCount(data.students?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch class student count", err);
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

  const handleDownloadTemplate = () => {
    const headers = [["Roll No", "Enrollment No", "Student Name"]];
    const sampleData = [
      ["1", "EN2101001", "Aarav Sharma"],
      ["2", "EN2101002", "Ishaan Patel"],
      ["3", "EN2101003", "Diya Sen"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "student_bulk_upload_template.xlsx");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");
    setParsedRows([]);

    if (!file) return;

    setFileName(file.name);
    const sizeKB = (file.size / 1024).toFixed(1);
    setFileSize(`${sizeKB} KB`);

    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls") && !file.name.toLowerCase().endsWith(".csv")) {
      setError("Supported file formats are Excel (.xlsx, .xls) or CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const mapped = json
          .map((row) => mapRow(row))
          .filter((row) => row.rollNo && row.enrollmentNo && row.studentName);

        if (mapped.length === 0) {
          setError("Excel sheet must contain Roll No, Enrollment No, and Student Name columns.");
          return;
        }

        setParsedRows(mapped);
        setCurrentStep(3); // Auto advance to preview
      } catch (err) {
        console.error("Failed to parse file", err);
        setError("Error parsing sheet format. Please download the template and try again.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmPreview = () => {
    if (parsedRows.length === 0) {
      setError("Please upload student file first.");
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
      setBatchAllocations([{ batch: "Batch 1", count: parsedRows.length }]);
      return;
    }
    const safeCount = Math.min(parsed, parsedRows.length);
    setBatchAllocationCount(safeCount);
    setBatchAllocations(
      Array.from({ length: safeCount }, (_, index) => ({
        batch: `Batch ${index + 1}`,
        count: index === 0 ? parsedRows.length : 0,
      }))
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
          : allocation
      )
    );
  };

  const totalAllocated = batchAllocations.reduce(
    (sum, a) => sum + (Number(a.count) || 0),
    0
  );

  const validateBatchAllocations = () => {
    if (batchAllocations.length !== batchAllocationCount) {
      return `Please configure ${batchAllocationCount} batch rows.`;
    }
    const invalid = batchAllocations.find(
      (a) => !a.batch || !Number.isInteger(Number(a.count)) || Number(a.count) <= 0
    );
    if (invalid) {
      return "Each batch row must have a unique batch name and a positive student count.";
    }
    const uniqueNames = new Set(batchAllocations.map((a) => a.batch));
    if (uniqueNames.size !== batchAllocations.length) {
      return "Batch names must be unique.";
    }
    if (totalAllocated !== parsedRows.length) {
      return `Allocated students (${totalAllocated}) must equal uploaded students (${parsedRows.length}).`;
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

    // Set uploading + advance step BEFORE closing dialog to avoid flicker
    setError("");
    setSuccess("");
    setUploading(true);
    setCurrentStep(4);
    // Small delay so step 4 spinner renders behind the modal before it closes
    await new Promise((resolve) => setTimeout(resolve, 100));
    setShowBatchAllocationDialog(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expired. Please sign in again.");
      }

      const res = await fetch(config.office.bulkImport, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to import students");
      }

      setSuccess(`Successfully imported ${data.inserted || 0} students. Skipped ${data.skipped || 0}.`);
      if (data.generatedCredentials && data.generatedCredentials.length > 0) {
        setGeneratedCredentials(data.generatedCredentials);
      }
      if (data.errors && data.errors.length > 0) {
        const mappedSkipped = data.errors.map((err) => {
          const matchedRow = parsedRows.find((r) => r.enrollmentNo === err.enrollmentNo);
          return {
            enrollmentNo: err.enrollmentNo,
            studentName: matchedRow ? matchedRow.studentName : "Unknown",
            error: err.error || "Student already exists in this division",
          };
        });
        setSkippedStudents(mappedSkipped);
      } else {
        setSkippedStudents([]);
      }
      // Refresh counts
      fetchStudents();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error importing records.");
      setCurrentStep(3); // Reset to preview/allocate step on error
      setShowBatchAllocationDialog(true); // Re-open allocation dialog so they can fix and retry
    } finally {
      setUploading(false);
    }
  };

  // Helper stats
  const departmentsCount = departments.length;
  const uniqueDivisions = useMemo(() => {
    const set = new Set(students.map((s) => s.divisionId?._id || s.divisionId).filter(Boolean));
    return set.size;
  }, [students]);

  const lastUpload = useMemo(() => {
    if (students.length === 0) return "No uploads";
    const dates = students.map((s) => new Date(s.createdAt || s.updatedAt || Date.now()));
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [students]);

  const handleResetWizard = () => {
    setCurrentStep(1);
    setFileName("");
    setFileSize("");
    setParsedRows([]);
    setGeneratedCredentials([]);
    setSkippedStudents([]);
    setExistingClassCount(0);
    setError("");
    setSuccess("");
  };

  const handleDownloadCredentialsCSV = () => {
    if (generatedCredentials.length === 0) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Enrollment No,Student Name,Username,Password"]
        .concat(
          generatedCredentials.map(
            (c) => `"${c.enrollmentNo}","${c.studentName}","${c.username}","${c.plainPassword}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_credentials_${selectedAcademicYear}_${selectedDivision}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="office-grid-wrapper animate-fadeIn">
      {currentTab === "upload" ? (
        <div className="dashboard-layout-container">
          
          {/* Top Row: Mini Stat Cards */}
          <div className="stats-row-container">
            <div className="stats-metric-card">
              <div className="metric-icon-box students">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="metric-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="metric-text-group">
                <span className="metric-value">{students.length}</span>
                <span className="metric-title">Total Students</span>
              </div>
            </div>

            <div className="stats-metric-card">
              <div className="metric-icon-box departments">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="metric-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21m3.75-9.75h7.5" />
                </svg>
              </div>
              <div className="metric-text-group">
                <span className="metric-value">{departmentsCount}</span>
                <span className="metric-title">Departments</span>
              </div>
            </div>

            <div className="stats-metric-card">
              <div className="metric-icon-box divisions">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="metric-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="metric-text-group">
                <span className="metric-value">{uniqueDivisions}</span>
                <span className="metric-title">Divisions</span>
              </div>
            </div>

            <div className="stats-metric-card">
              <div className="metric-icon-box upload">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="metric-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V13.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 13.5v3.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="metric-text-group">
                <span className="metric-value">{lastUpload}</span>
                <span className="metric-title">Last Upload</span>
              </div>
            </div>
          </div>

          {/* Core Upload Wizard Card */}
          <div className="wizard-main-card">
            <div className="wizard-header">
              <h2>Upload Student Directory</h2>
              <p>Assign students to courses, divisions and upload records in bulk.</p>
            </div>

            {/* Steps Indicator Progress bar */}
            <div className="steps-progress-container">
              <div className="progress-track-line" />
              <div 
                className="progress-fill-line" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }} 
              />
              <div className="steps-indicator-nodes">
                {[
                  { step: 1, label: "Assignment" },
                  { step: 2, label: "Upload File" },
                  { step: 3, label: "Preview Data" },
                  { step: 4, label: "Import Status" },
                ].map((s) => (
                  <div key={s.step} className={`step-node ${currentStep >= s.step ? "active" : ""} ${currentStep === s.step ? "current" : ""}`}>
                    <div className="node-circle">{s.step}</div>
                    <span className="node-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="alert-banner error">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="alert-banner-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="alert-banner-text">{error}</div>
              </div>
            )}

            {/* Success notifications */}
            {success && (
              <div className="alert-banner success">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="alert-banner-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="alert-banner-text">{success}</div>
              </div>
            )}

            {/* Step Content panels */}
            <div className="wizard-step-content-box">
              
              {/* Step 1: Academic Assignment */}
              {currentStep === 1 && (
                <div className="wizard-step-panel animate-fadeIn">
                  <div className="step-title-row">
                    <h3>Academic Context Setup</h3>
                    <p>Assign students to their correct department, division, and year.</p>
                  </div>
                  <div className="wizard-form-grid">
                    <div className="form-input-control">
                      <label>Department <span className="req">*</span></label>
                      <select value={selectedDepartment} onChange={handleDepartmentChange}>
                        <option value="">-- Choose Department --</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-input-control">
                      <label>Course / Semester <span className="req">*</span></label>
                      <select 
                        value={selectedCourse} 
                        onChange={handleCourseChange}
                        disabled={!selectedDepartment}
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            Semester {course.semester} - {course.courseCode} ({course.scheme})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-input-control">
                      <label>Division <span className="req">*</span></label>
                      <select 
                        value={selectedDivision} 
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        disabled={!selectedCourse}
                      >
                        <option value="">-- Choose Division --</option>
                        {divisions.map((div) => (
                          <option key={div._id} value={div._id}>
                            {div.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-input-control">
                      <label>Academic Year <span className="req">*</span></label>
                      <select 
                        value={selectedAcademicYear} 
                        onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      >
                        <option value="">-- Choose Academic Year --</option>
                        {generateAcademicYearOptions().map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-input-control full-span">
                      <label>Default Batch <span className="hint">(Optional)</span></label>
                      <input 
                        type="text" 
                        value={batch} 
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="e.g. Batch 1" 
                      />
                    </div>
                    {existingClassCount > 0 && (
                      <div className="alert-banner warning full-span" style={{ gridColumn: "span 2", display: "flex", gap: "10px", alignItems: "center", backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "12px", borderRadius: "var(--office-radius-md)" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="alert-banner-svg" style={{ color: "#D97706", width: "18px", height: "18px", flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="alert-banner-text" style={{ color: "#92400E", fontSize: "12.5px" }}>
                          <strong>Note:</strong> There are already <strong>{existingClassCount}</strong> students registered in this division for the selected academic year.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="wizard-action-footer">
                    <button 
                      className="wizard-btn-primary" 
                      disabled={!selectedDepartment || !selectedCourse || !selectedDivision || !selectedAcademicYear}
                      onClick={() => setCurrentStep(2)}
                    >
                      Next Step: File Upload
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: File Upload */}
              {currentStep === 2 && (
                <div className="wizard-step-panel animate-fadeIn">
                  <div className="step-title-row">
                    <h3>Import Directory Sheet</h3>
                    <p>Upload student roster in Excel or CSV. Make sure you use the required template columns.</p>
                  </div>

                  <div className="upload-section-action-box">
                    <div className="download-template-card-box">
                      <div className="template-info">
                        <h4>Download Student Template</h4>
                        <p>Retrieve the expected Excel format matching backend requirements.</p>
                      </div>
                      <button className="wizard-btn-outline" onClick={handleDownloadTemplate}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon-svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Excel format
                      </button>
                    </div>

                    <div className="drag-drop-file-wrapper">
                      <input 
                        id="wizard-file-selector" 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        onChange={handleFileChange}
                      />
                      <label htmlFor="wizard-file-selector" className="drag-drop-area-label">
                        <div className="drag-drop-cloud-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="cloud-svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V13.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 13.5v3.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        {fileName ? (
                          <div className="file-metadata-info">
                            <span className="metadata-name">{fileName}</span>
                            <span className="metadata-size">{fileSize}</span>
                            <span className="metadata-change-label">Click to select another file</span>
                          </div>
                        ) : (
                          <div className="file-prompt-info">
                            <strong>Choose Excel or CSV file</strong>
                            <span>or drag and drop it here</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="wizard-action-footer flex-end">
                    <button className="wizard-btn-outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Preview and Allocation */}
              {currentStep === 3 && (
                <div className="wizard-step-panel animate-fadeIn">
                  <div className="step-title-row">
                    <h3>Data Verification</h3>
                    <p>Verify the parsed student list rows below before completing the database upload.</p>
                  </div>

                  <div className="preview-table-box office-scrollable">
                    <table className="preview-records-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Enrollment No</th>
                          <th>Student Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            <td>{row.rollNo}</td>
                            <td><code className="code-tag">{row.enrollmentNo}</code></td>
                            <td>{row.studentName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 10 && (
                      <div className="preview-records-more-label">
                        And {parsedRows.length - 10} more rows parsed...
                      </div>
                    )}
                  </div>

                  <div className="wizard-action-footer flex-between">
                    <button className="wizard-btn-outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </button>
                    <button className="wizard-btn-primary" onClick={handleConfirmPreview}>
                      Confirm & Allocate Batches
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Import Progress & Success */}
              {currentStep === 4 && (
                <div className="wizard-step-panel animate-fadeIn">
                  <div className="import-status-flow-box">
                    {uploading ? (
                      <div className="importing-spinner-layout">
                        <div className="loading-ring-spinner large" />
                        <span className="importing-status-label">Uploading student data...</span>
                        <span className="importing-substatus-label">Creating accounts and assigning batches. This may take a moment.</span>
                      </div>
                    ) : (
                      <div className="importing-success-complete-layout animate-fadeIn">
                        <div className="success-badge-mark">✓</div>
                        <h3>Upload Completed Successfully</h3>
                        <p>{success}</p>

                        {generatedCredentials.length > 0 && (
                          <div className="import-credentials-export-wrapper">
                            <div className="export-action-bar-row">
                              <h4>Student Credentials list</h4>
                              <div className="action-button-group">
                                <button
                                  className={`wizard-btn-outline ${copied ? "copied" : ""}`}
                                  onClick={() => {
                                    const text = generatedCredentials
                                      .map((c) => `${c.enrollmentNo},${c.studentName},${c.username},${c.plainPassword}`)
                                      .join("\n");
                                    navigator.clipboard.writeText(text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                >
                                  {copied ? "✓ Copied!" : "📋 Copy CSV content"}
                                </button>
                                <button className="wizard-btn-outline text-primary" onClick={handleDownloadCredentialsCSV}>
                                  📥 Download CSV File
                                </button>
                              </div>
                            </div>

                            <div className="credentials-scrollable-table office-scrollable">
                              <table className="credentials-display-table">
                                <thead>
                                  <tr>
                                    <th>Enrollment No</th>
                                    <th>Student Name</th>
                                    <th>Username</th>
                                    <th>Password</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {generatedCredentials.map((c, i) => (
                                    <tr key={i}>
                                      <td>{c.enrollmentNo}</td>
                                      <td><strong>{c.studentName}</strong></td>
                                      <td><code className="code-tag">{c.username}</code></td>
                                      <td><code className="code-tag font-password">{c.plainPassword}</code></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {skippedStudents.length > 0 && (
                          <div className="import-credentials-export-wrapper" style={{ marginTop: "20px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                            <div className="export-action-bar-row" style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", borderBottom: "1px solid rgba(245, 158, 11, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ color: "#D97706" }}>⚠️ Skipped Students (Already Registered in Division)</h4>
                              <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 6px", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
                                {skippedStudents.length} Students
                              </span>
                            </div>

                            <div className="credentials-scrollable-table office-scrollable">
                              <table className="credentials-display-table">
                                <thead>
                                  <tr>
                                    <th>Enrollment No</th>
                                    <th>Student Name</th>
                                    <th>Status Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {skippedStudents.map((s, i) => (
                                    <tr key={i}>
                                      <td><code className="code-tag">{s.enrollmentNo}</code></td>
                                      <td><strong>{s.studentName}</strong></td>
                                      <td style={{ color: "var(--office-danger)" }}>{s.error}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <button className="wizard-btn-primary margin-top-md" onClick={handleResetWizard}>
                          Upload Another Roster
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Batch Allocation Modal dialog */}
          {showBatchAllocationDialog && (
            <div className="modal-wrapper-overlay">
              <div className="modal-dialog-box animate-modalScaleIn">
                <div className="modal-dialog-header">
                  <h3>⚖️ Batch Allocation</h3>
                  <p>Distribute <strong>{parsedRows.length}</strong> imported students into division batches.</p>
                </div>

                <div className="modal-dialog-body office-scrollable">
                  <div className="form-input-control">
                    <label>How many batches to divide?</label>
                    <input
                      type="number"
                      min="1"
                      value={batchAllocationCount}
                      onChange={(e) => handleBatchAllocationCountChange(e.target.value)}
                    />
                  </div>

                  <div className="allocation-rows-grid">
                    {batchAllocations.map((allocation, index) => (
                      <div key={index} className="allocation-row-card">
                        <span className="allocation-batch-label">Batch {index + 1}</span>
                        <div className="form-input-control no-margin">
                          <input
                            type="number"
                            min="1"
                            value={allocation.count}
                            placeholder="Student count"
                            onChange={(e) => handleBatchAllocationFieldChange(index, "count", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="allocation-progress-bar-block">
                    <div className="progress-bar-track">
                      <div 
                        className={`progress-bar-fill ${totalAllocated === parsedRows.length ? "success" : "pending"}`} 
                        style={{ width: `${Math.min(100, (totalAllocated / parsedRows.length) * 100)}%` }}
                      />
                    </div>
                    <span className={`progress-percentage-label ${totalAllocated === parsedRows.length ? "success" : "pending"}`}>
                      Allocated: <strong>{totalAllocated}</strong> / {parsedRows.length} students
                    </span>
                  </div>

                  {batchAllocationError && (
                    <div className="alert-banner error compact">{batchAllocationError}</div>
                  )}
                </div>

                <div className="modal-dialog-footer">
                  <button className="wizard-btn-outline" onClick={() => setShowBatchAllocationDialog(false)}>
                    Cancel
                  </button>
                  <button 
                    className="wizard-btn-primary" 
                    disabled={totalAllocated !== parsedRows.length}
                    onClick={handleConfirmBatchAllocation}
                  >
                    Confirm & Import
                  </button>
                </div>
              </div>
            </div>
          )}

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
