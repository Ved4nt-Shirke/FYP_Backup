import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "../utils/axiosConfig";
import { config } from "../config/api";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import "./BulkUploadFacultyModal.css";

const BulkUploadFacultyModal = ({ show, onClose, onUploadSuccess, preselectedDepartmentId }) => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch departments if general mode
  useEffect(() => {
    if (show && !preselectedDepartmentId) {
      fetchDepartments();
    }
    if (show && preselectedDepartmentId) {
      setSelectedDepartment(preselectedDepartmentId);
    }
  }, [show, preselectedDepartmentId]);

  // Reset modal states when closed/opened
  useEffect(() => {
    if (!show) {
      setSelectedDepartment("");
      setAlreadyUploaded(false);
      setFileName("");
      setParsedRows([]);
      setSuccess("");
      setError("");
      setGeneratedCredentials([]);
      setCopied(false);
    }
  }, [show]);

  // Alert check if department already has uploaded faculty
  useEffect(() => {
    if (selectedDepartment) {
      checkExistingFaculty(selectedDepartment);
    } else {
      setAlreadyUploaded(false);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showErrorAlert("Failed to load departments.");
    }
  };

  const checkExistingFaculty = async (deptId) => {
    try {
      const response = await axios.get(`${config.admin.faculty}?department=${deptId}`);
      if (response.data.success && response.data.faculty && response.data.faculty.length > 0) {
        setAlreadyUploaded(true);
      } else {
        setAlreadyUploaded(false);
      }
    } catch (err) {
      console.error("Error checking existing department faculty:", err);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Full Name": "Dr. Sameer Patil",
        "Email": "sameer.patil@vidyalankar.edu.in",
        "WhatsApp Number": "919876543210",
        "Skills": "Python, Machine Learning, Data Structures"
      },
      {
        "Full Name": "Prof. Anjali Sen",
        "Email": "anjali.sen@vidyalankar.edu.in",
        "WhatsApp Number": "919876543211",
        "Skills": "Database Management, SQL, Java"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Import Template");
    XLSX.writeFile(wb, "faculty_import_template.xlsx");
  };

  const normalizeValue = (val) => {
    return val === undefined || val === null ? "" : val.toString().trim();
  };

  const mapFacultyRow = (row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, val]) => {
      const safeKey = key.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
      normalized[safeKey] = val;
    });

    const fullName = normalizeValue(normalized["fullname"] || normalized["name"] || normalized["facultyname"] || normalized["faculty"]);
    const email = normalizeValue(normalized["email"] || normalized["emailaddress"] || normalized["mail"]);
    const whatsappPhone = normalizeValue(normalized["whatsappnumber"] || normalized["whatsapp"] || normalized["whatsappphone"] || normalized["phone"] || normalized["mobile"] || normalized["mobilenumber"] || "");
    const skills = normalizeValue(normalized["skills"] || normalized["skill"] || normalized["specialization"] || normalized["specializations"] || "");

    return { fullName, email, whatsappPhone, skills };
  };

  const processFile = (file) => {
    setError("");
    setSuccess("");
    setParsedRows([]);

    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const mapped = json
          .map((row) => mapFacultyRow(row))
          .filter((row) => row.fullName && row.email);

        if (mapped.length === 0) {
          if (json.length === 0) {
            setError("The uploaded file contains no data.");
          } else {
            setError("No valid rows found. Please make sure headers ('Full Name' and 'Email') are correctly defined.");
          }
          return;
        }

        setParsedRows(mapped);
        setSuccess(`${mapped.length} faculty records loaded and validated.`);
      } catch (err) {
        console.error("Failed to parse file:", err);
        setError("Unable to read file. Please use a clean Excel or CSV template.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    setError("");
    setSuccess("");

    if (parsedRows.length === 0) {
      setError("Please load a valid file first.");
      return;
    }

    setUploading(true);

    try {
      const payload = {
        facultyList: parsedRows,
        departmentId: selectedDepartment || null,
      };

      const response = await axios.post(config.admin.bulkImportFaculty, payload);

      if (response.data.success) {
        setSuccess(
          `Successfully imported ${response.data.inserted || 0} faculty. Skipped ${response.data.skipped || 0} duplicates/invalid rows.`
        );
        if (response.data.generatedCredentials && response.data.generatedCredentials.length > 0) {
          setGeneratedCredentials(response.data.generatedCredentials);
        }
        showSuccessAlert(response.data.message);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setError(response.data.message || "Failed to import faculty");
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Upload faculty error:", err);
      const msg = err.response?.data?.message || err.message || "Bulk import failed";
      setError(msg);
      showErrorAlert(msg);
    } finally {
      setUploading(false);
    }
  };

  const downloadCredentialsPDF = () => {
    if (generatedCredentials.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let deptName = "All Faculty";
    if (selectedDepartment) {
      const matchedDept = departments.find((d) => d._id === selectedDepartment);
      deptName = matchedDept ? `${matchedDept.name} (${matchedDept.code})` : "Department";
    }

    doc.setFontSize(16);
    doc.text(`Faculty Login Credentials - ${deptName}`, pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, {
      align: "center",
    });

    const tableData = generatedCredentials.map((fac) => [
      fac.fullName,
      fac.employeeId,
      fac.email,
      fac.username,
      fac.plainPassword,
    ]);

    autoTable(doc, {
      head: [["Full Name", "ID", "Email", "Username", "Password"]],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129], // Emerald green brand color
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      margin: 10,
      didDrawPage: (data) => {
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(9);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    doc.save(`${deptName.replace(/[^a-zA-Z0-9]/g, "_")}_Faculty_Credentials.pdf`);
  };

  const copyToClipboard = () => {
    if (generatedCredentials.length === 0) return;
    const text = generatedCredentials
      .map((c) => `${c.fullName},${c.employeeId},${c.email},${c.username},${c.plainPassword}`)
      .join("\n");
    
    navigator.clipboard.writeText(`Full Name,Employee ID,Email,Username,Password\n${text}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Clipboard copy failed:", err));
  };

  const isFormDisabled = uploading;

  if (!show) return null;

  return (
    <div className="faculty-modal-overlay" onClick={onClose}>
      <div className="faculty-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="faculty-modal-header">
          <h2>📤 Bulk Upload Faculty</h2>
          <button className="faculty-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="faculty-modal-body">
          {/* Step 1: Department Selector */}
          {!preselectedDepartmentId && (
            <div className="dept-select-group">
              <label htmlFor="dept-select">Assign to Department (Optional)</label>
              <select
                id="dept-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="">-- No Department (General Faculty) --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* WARNING BANNER: If selected/preselected department already has faculty */}
          {alreadyUploaded && (
            <div className="already-uploaded-banner">
              <i className="bi bi-exclamation-triangle-fill already-uploaded-banner-icon"></i>
              <p className="already-uploaded-banner-text">
                <strong>Data already uploaded:</strong> This department has registered faculty members in the database. 
                Any new upload will append additional accounts without overriding existing ones.
              </p>
            </div>
          )}

          {/* Step 2: Template Downloader */}
          {generatedCredentials.length === 0 && (
            <div className="template-bar">
              <div className="template-bar-info">
                <span className="template-bar-icon">📊</span>
                <div>
                  <h4 className="template-bar-title">Excel Upload Template</h4>
                  <p className="template-bar-desc">Download blank template with correct headers</p>
                </div>
              </div>
              <button className="btn-download-template" onClick={downloadTemplate}>
                <i className="bi bi-download"></i> Download Template
              </button>
            </div>
          )}

          {/* Step 3: File Selection or Dropzone */}
          {generatedCredentials.length === 0 && (
            <div
              className={`faculty-dropzone ${dragActive ? "active" : ""} ${isFormDisabled ? "disabled" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="faculty-file-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                disabled={isFormDisabled}
              />
              <label htmlFor="faculty-file-upload-input" style={{ cursor: "pointer" }}>
                <div className="dropzone-inner-icon">
                  <i className="bi bi-cloud-arrow-up-fill"></i>
                </div>
                <h3 className="dropzone-main-text">
                  {fileName ? "Change Spreadsheet File" : "Choose Excel or CSV File"}
                </h3>
                <p className="dropzone-sub-text">or drag and drop your spreadsheet here</p>
                {fileName && (
                  <span className="dropzone-filename-badge">
                    <i className="bi bi-file-earmark-spreadsheet"></i> {fileName}
                  </span>
                )}
              </label>
            </div>
          )}

          {/* Step 4: Preview parsed data */}
          {generatedCredentials.length === 0 && parsedRows.length > 0 && (
            <div className="scrollable-preview-container">
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>WhatsApp Phone</th>
                    <th>Skills / Specialty</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.fullName}</td>
                      <td>{row.email}</td>
                      <td>{row.whatsappPhone || "—"}</td>
                      <td>{row.skills || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Status alerts */}
          {error && <div className="upload-status-alert error"><i className="bi bi-x-circle-fill"></i> {error}</div>}
          {success && <div className="upload-status-alert success"><i className="bi bi-check-circle-fill"></i> {success}</div>}

          {/* Step 5: Credentials View after Import Success */}
          {generatedCredentials.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="credentials-top-row">
                <h3>🔐 Generated Faculty Credentials</h3>
                <div className="credentials-actions-group">
                  <button className="btn-credentials-action" onClick={copyToClipboard}>
                    <i className={`bi ${copied ? "bi-check-lg" : "bi-clipboard"}`}></i>
                    {copied ? "Copied!" : "📋 Copy CSV"}
                  </button>
                  <button className="btn-credentials-action primary-pdf" onClick={downloadCredentialsPDF}>
                    <i className="bi bi-file-earmark-pdf"></i> Download PDF
                  </button>
                </div>
              </div>

              <div className="scrollable-preview-container" style={{ maxHeight: "280px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Employee ID</th>
                      <th>Username</th>
                      <th>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedCredentials.map((cred, idx) => (
                      <tr key={idx}>
                        <td>{cred.fullName}</td>
                        <td>
                          <code className="faculty-cred-code">{cred.employeeId}</code>
                        </td>
                        <td>
                          <code className="faculty-cred-code">{cred.username}</code>
                        </td>
                        <td>
                          <code className="faculty-cred-code">{cred.plainPassword}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
                ⚠️ Save these credentials. Generated passwords cannot be displayed again after closing this window.
              </p>
            </div>
          )}
        </div>

        <div className="faculty-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>
            {generatedCredentials.length > 0 ? "Close" : "Cancel"}
          </button>
          {generatedCredentials.length === 0 && (
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={uploading || parsedRows.length === 0}
            >
              {uploading ? "Importing Faculty..." : "Start Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadFacultyModal;
