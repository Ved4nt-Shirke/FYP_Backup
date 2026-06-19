import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "../../utils/axiosConfig";
import { showErrorAlert, showSuccessAlert } from "../../utils/alertUtils";
import { config } from "../../config/api";
import CourseDetailsModal from "./CourseDetailsModal";
import "./SubjectManagement.css";

const normalizeValue = (value) =>
  value === undefined || value === null ? "" : value.toString().trim();

const mapSubjectRow = (row) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    const safeKey = key.toLowerCase().replace(/\s+/g, "");
    normalized[safeKey] = normalizeValue(value);
  });

  const name =
    normalized["subjectname"] ||
    normalized["name"] ||
    normalized["subject"] ||
    "";
  const code =
    normalized["subjectcode"] ||
    normalized["code"] ||
    normalized["subjectid"] ||
    "";

  return { name, code };
};

const SubjectManagement = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [uploadFileName, setUploadFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    departmentId: "",
    courseId: "",
  });
  const [selectedCourseMeta, setSelectedCourseMeta] = useState({
    semester: "",
    scheme: "",
    courseCode: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const hasPreview = useMemo(() => parsedRows.length > 0, [parsedRows]);

  const location = useLocation();
  const [newlyCreatedSubject, setNewlyCreatedSubject] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editedSubjectHasDetails, setEditedSubjectHasDetails] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.editSubject) {
      handleEdit(location.state.editSubject);
      // Check if it already has course details
      const checkDetails = async () => {
        try {
          const res = await axios.get(config.courseDetails.bySubject(location.state.editSubject._id));
          if (res.data.success && res.data.courseDetails) {
            setEditedSubjectHasDetails(true);
          } else {
            setEditedSubjectHasDetails(false);
          }
        } catch {
          setEditedSubjectHasDetails(false);
        }
      };
      checkDetails();
    }
  }, [location.state]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      showErrorAlert("Failed to load departments");
    }
  };

  const fetchCourses = async (departmentId) => {
    if (!departmentId) {
      setCourses([]);
      return;
    }

    try {
      const response = await axios.get(
        config.courses.listByDepartment(departmentId),
      );
      if (response.data.success) {
        setCourses(response.data.courses || []);
      }
    } catch (error) {
      showErrorAlert("Failed to load courses");
    }
  };

  const fetchDivisions = async (courseId) => {
    if (!courseId) {
      setDivisions([]);
      return;
    }

    try {
      const response = await axios.get(config.divisions.listByCourse(courseId));
      if (response.data.success) {
        setDivisions(response.data.divisions || []);
      }
    } catch (error) {
      showErrorAlert("Failed to load divisions");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      departmentId: "",
      courseId: "",
    });
    setSelectedCourseMeta({ semester: "", scheme: "", courseCode: "" });
    setCourses([]);
    setDivisions([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const resetUpload = () => {
    setUploadFileName("");
    setParsedRows([]);
  };

  const handleDownloadTemplate = () => {
    const headers = [["SubjectName", "SubjectCode"]];
    const sampleData = [
      ["Data Structures", "CO203"],
      ["Object Oriented Programming", "CO204"],
      ["Database Management Systems", "CO205"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "subject_bulk_upload_template.xlsx");
  };

  const handleChange = async (field, value) => {
    const nextForm = { ...formData, [field]: value };

    if (field === "departmentId") {
      nextForm.courseId = "";
      setDivisions([]);
      setSelectedCourseMeta({ semester: "", scheme: "", courseCode: "" });
      await fetchCourses(value);
    }

    if (field === "courseId") {
      const selected = courses.find((course) => course._id === value);
      setSelectedCourseMeta({
        semester: selected?.semester ? String(selected.semester) : "",
        scheme: selected?.scheme || "",
        courseCode: selected?.courseCode || "",
      });
    }

    setFormData(nextForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.code.trim() ||
      !formData.departmentId ||
      !formData.courseId
    ) {
      showErrorAlert("Please complete all subject fields");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      departmentId: formData.departmentId,
      courseId: formData.courseId,
    };

    console.log("=== Submitting Subject ===");
    console.log("Payload:", payload);
    console.log("Form Data:", formData);

    try {
      if (isEditing) {
        const response = await axios.put(
          config.subjects.update(editingId),
          payload,
        );
        if (response.data.success) {
          showSuccessAlert("Subject updated successfully");
          const updatedSubj = { ...payload, _id: editingId };
          setNewlyCreatedSubject(updatedSubj);
          resetForm();
        } else {
          showErrorAlert(response.data.message || "Failed to update subject");
        }
      } else {
        const response = await axios.post(config.subjects.create, payload);
        if (response.data.success) {
          showSuccessAlert("Subject added successfully");
          setNewlyCreatedSubject(response.data.subject);
          setEditedSubjectHasDetails(false);
          resetForm();
        } else {
          showErrorAlert(response.data.message || "Failed to add subject");
        }
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save subject";
      showErrorAlert(errorMessage);
    }
  };

  const handleEdit = async (subject) => {
    setIsEditing(true);
    setEditingId(subject._id);

    const departmentId = subject.departmentId?._id || subject.departmentId;
    const courseId = subject.courseId?._id || subject.courseId;

    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      departmentId: departmentId || "",
      courseId: courseId || "",
    });

    setSelectedCourseMeta({
      semester: subject.courseId?.semester
        ? String(subject.courseId.semester)
        : "",
      scheme: subject.courseId?.scheme || "",
      courseCode: subject.courseId?.courseCode || "",
    });

    if (departmentId) {
      await fetchCourses(departmentId);
    }
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm("Delete this subject?")) {
      return;
    }

    try {
      const response = await axios.delete(config.subjects.delete(subjectId));
      if (response.data.success) {
        showSuccessAlert("Subject deleted successfully");
        resetForm();
      } else {
        showErrorAlert(response.data.message || "Failed to delete subject");
      }
    } catch (error) {
      showErrorAlert("Failed to delete subject");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setParsedRows([]);

    if (!file) return;
    setUploadFileName(file.name);

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      showErrorAlert("PDF import is not supported. Please upload Excel/CSV.");
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
          .map(mapSubjectRow)
          .filter((row) => row.name && row.code);

        if (mapped.length === 0) {
          showErrorAlert(
            "No valid rows found. Use columns: SubjectName, SubjectCode.",
          );
          return;
        }

        setParsedRows(mapped);
      } catch (err) {
        showErrorAlert("Unable to read file. Please use a clean Excel/CSV.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!formData.departmentId || !formData.courseId) {
      showErrorAlert("Select department and course before upload");
      return;
    }

    if (!hasPreview) {
      showErrorAlert("Please upload and parse an Excel/CSV file first");
      return;
    }

    const payload = parsedRows
      .map((row) => ({
        name: row.name.trim(),
        code: row.code.trim(),
      }))
      .filter((row) => row.name && row.code);

    if (payload.length === 0) {
      showErrorAlert("No valid subjects to upload after validation");
      return;
    }

    try {
      setUploading(true);
      const response = await axios.post(config.subjects.bulkImport, {
        departmentId: formData.departmentId,
        courseId: formData.courseId,
        subjects: payload,
      });

      if (response.data.success) {
        showSuccessAlert(
          `Uploaded ${response.data.inserted || 0} subjects. Skipped ${response.data.skipped || 0}.`,
        );
        resetUpload();
        resetForm();
      } else {
        showErrorAlert(response.data.message || "Upload failed");
      }
    } catch (error) {
      showErrorAlert("Failed to upload subjects");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>Subject Management</h2>
          <p>Manage subjects separately from courses and divisions</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/admin-dashboard")}
        >
          <i className="bi bi-house-door"></i>
          Dashboard
        </button>
      </div>

      <div className="subject-form-card">
        <div className="form-header-row">
          <div>
            <h3>{isEditing ? "Edit Subject" : "Add Subject"}</h3>
            <p>Pick department, course, and division for each subject.</p>
          </div>
          {isEditing && (
            <button className="btn-ghost" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
        {newlyCreatedSubject && (
          <div
            className="alert alert-success d-flex align-items-center justify-content-between p-3 mb-4 rounded border-success"
            style={{ backgroundColor: "rgba(25, 135, 84, 0.1)", color: "#198754", gap: "12px", border: "1px solid rgba(25, 135, 84, 0.2)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-5" style={{ color: "#198754" }}></i>
              <div>
                <strong>Subject Saved:</strong> "{newlyCreatedSubject.name}" ({newlyCreatedSubject.code}) has been saved.
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "6px 12px", fontSize: "0.825rem", whiteSpace: "nowrap" }}
                onClick={() => setIsDetailsModalOpen(true)}
              >
                {editedSubjectHasDetails ? "Edit Course Details" : "Add Course Details"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.825rem", whiteSpace: "nowrap" }}
                onClick={() => setNewlyCreatedSubject(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="subject-form-grid">
          <div className="form-field">
            <label>Subject Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Data Structures"
            />
          </div>
          <div className="form-field">
            <label>Subject Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g., CO203"
            />
          </div>
          <div className="form-field">
            <label>Department</label>
            <select
              value={formData.departmentId}
              onChange={(e) => handleChange("departmentId", e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Course</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
              disabled={!formData.departmentId}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              {isEditing ? "Update Subject" : "Add Subject"}
            </button>
            <button className="btn-secondary" type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="subject-upload-card">
        <div className="form-header-row">
          <div>
            <h3>Upload Subjects</h3>
            <p>
              Select course details and upload Excel/CSV with columns:
              SubjectName, SubjectCode
            </p>
          </div>
          <button className="btn-ghost" onClick={resetUpload}>
            Clear File
          </button>
        </div>

        <div className="upload-selection-grid">
          <div className="form-field">
            <label>Department</label>
            <select
              value={formData.departmentId}
              onChange={(e) => handleChange("departmentId", e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Course</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
              disabled={!formData.departmentId}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCourseMeta.courseCode && (
          <div className="upload-course-meta">
            <div className="meta-badge">
              <span className="meta-label">Course Code:</span>
              <span className="meta-value">
                {selectedCourseMeta.courseCode}
              </span>
            </div>
            <div className="meta-badge">
              <span className="meta-label">Semester:</span>
              <span className="meta-value">{selectedCourseMeta.semester}</span>
            </div>
            <div className="meta-badge">
              <span className="meta-label">Scheme:</span>
              <span className="meta-value">{selectedCourseMeta.scheme}</span>
            </div>
          </div>
        )}

        <div className="download-template-card-box">
          <div className="template-info">
            <h4>Download Subject Template</h4>
            <p>Get the required Excel spreadsheet format for bulk subject uploads.</p>
          </div>
          <button className="btn-secondary btn-sm" type="button" onClick={handleDownloadTemplate}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon-svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Template
          </button>
        </div>

        <div className="upload-row">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={!formData.courseId}
          />
          {uploadFileName && (
            <span className="file-chip">{uploadFileName}</span>
          )}
        </div>

        {hasPreview && (
          <div className="preview-info">
            <span>{parsedRows.length} rows ready to upload</span>
          </div>
        )}

        <div className="form-actions">
          <button
            className="btn-primary"
            type="button"
            onClick={handleUpload}
            disabled={uploading || !formData.departmentId || !formData.courseId}
          >
            {uploading ? "Uploading..." : "Upload Subjects"}
          </button>
        </div>
      </div>

      <div className="info-card">
        <div className="info-header">
          <i className="bi bi-info-circle"></i>
          <div>
            <h3>View All Subjects</h3>
            <p>
              Go to the Subjects List page to view, filter, and manage all
              subjects by course and department.
            </p>
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/admin/subjects-view")}
        >
          <i className="bi bi-list-ul"></i>
          View Subjects List
        </button>
      </div>
      {isDetailsModalOpen && newlyCreatedSubject && (
        <CourseDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setNewlyCreatedSubject(null);
          }}
          subject={newlyCreatedSubject}
          onSaveSuccess={() => {
            setEditedSubjectHasDetails(true);
          }}
        />
      )}
    </div>
  );
};

export default SubjectManagement;
