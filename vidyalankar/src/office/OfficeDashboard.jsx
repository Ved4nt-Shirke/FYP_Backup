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
  "batch",
  "division",
];

const normalizeValue = (value) => (value === undefined || value === null ? "" : value.toString().trim());

const mapRow = (row, fallbackDivision, fallbackBatch) => {
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
  const batch = normalized["batch"] || fallbackBatch;
  const division = normalized["division"] || fallbackDivision || "";

  return { rollNo, enrollmentNo, studentName, batch, division };
};

const OfficeDashboard = ({ currentTab, setCurrentTab }) => {
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [division, setDivision] = useState("");
  const [batch, setBatch] = useState("");
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
  }, []);

  const fetchStudents = async (divisionFilter = "") => {
    try {
      setLoading(true);
      const url = divisionFilter
        ? `${config.students}?division=${encodeURIComponent(divisionFilter)}`
        : config.students;
      const res = await fetch(url);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
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
          .map((row) => mapRow(row, division, batch))
          .filter((row) => row.rollNo && row.enrollmentNo && row.studentName && row.batch);

        if (mapped.length === 0) {
          setError("No valid rows found. Please check column headers: RollNo, EnrollmentNo, StudentName, Batch, Division(optional).");
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

    const payload = parsedRows
      .map((row) => ({
        rollNo: row.rollNo,
        enrollmentNo: row.enrollmentNo,
        studentName: row.studentName,
        batch: row.batch || batch,
        division: row.division || division || "",
      }))
      .filter((row) => row.rollNo && row.enrollmentNo && row.studentName && row.batch);

    if (payload.length === 0) {
      setError("No valid students to upload after validation.");
      return;
    }

    try {
      setUploading(true);
      const res = await fetch(`${config.students}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: payload }),
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
                <p>Excel/CSV with columns: RollNo, EnrollmentNo, StudentName, Batch, Division (optional)</p>
              </div>
            </div>
            <div className="form-row">
              <label>Division (applied when file has none)</label>
              <input
                type="text"
                placeholder="e.g., A, B"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Batch (fallback)</label>
              <input
                type="text"
                placeholder="e.g., CO-B1"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              />
            </div>
            <div className="upload-row">
              <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={handleFileChange} />
              {fileName && <span className="file-chip">{fileName}</span>}
            </div>
            {hasPreview && (
              <div className="preview-info">
                <span>{parsedRows.length} rows ready</span>
                {division && <span>Default Division: {division}</span>}
                {batch && <span>Default Batch: {batch}</span>}
              </div>
            )}
            <button className="primary-btn" onClick={handleUpload} disabled={uploading}>
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
                    <th>Batch</th>
                    <th>Division</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty">{loading ? "Loading..." : "No students yet"}</td>
                    </tr>
                  )}
                  {students.map((student) => (
                    <tr key={`${student._id}-${student.enrollmentNo}`}>
                      <td>{student.rollNo}</td>
                      <td>{student.enrollmentNo}</td>
                      <td>{student.studentName}</td>
                      <td>{student.batch}</td>
                      <td>{student.division || "-"}</td>
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
