import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { config } from "../config/api";
import "./ManageStudents.css";

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

const normalizeBatch = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

const normalizeAcademicYear = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "";

  const compact = raw.replace(/\s+/g, "").replace(/\//g, "-");
  const parts = compact.split("-").filter(Boolean);

  if (parts.length === 2) {
    const start = parts[0].replace(/\D/g, "");
    const end = parts[1].replace(/\D/g, "");

    if (start.length === 4 && end.length >= 2) {
      return `${start}-${end.slice(-2)}`;
    }
  }

  return compact.toLowerCase();
};

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cascading filters
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  // Dropdown data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Add Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentName: "",
    rollNo: "",
    enrollmentNo: "",
    academicYear: "",
    batch: "",
    seatNo: "",
    section: "",
    aadhaarNo: "",
  });

  // Search
  const [filterSearch, setFilterSearch] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedPasswordStudent, setGeneratedPasswordStudent] = useState("");

  // Initial load
  useEffect(() => {
    fetchDepartments();

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        console.log("Current user from token:", decoded);
      } catch (e) {
        console.log("Could not decode token:", e.message);
      }
    }
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

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedCourse("");
    setSelectedDivision("");
    setSelectedAcademicYear("");
    setSelectedBatch("");
    setCourses([]);
    setDivisions([]);
    setStudents([]);
    setError("");

    if (deptId) await fetchCourses(deptId);
  };

  const handleCourseChange = async (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedDivision("");
    setSelectedAcademicYear("");
    setSelectedBatch("");
    setDivisions([]);
    setStudents([]);
    setError("");

    if (courseId) await fetchDivisions(courseId);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
    setStudents([]);
    setError("");
  };

  const handleAcademicYearChange = (e) => {
    setSelectedAcademicYear(e.target.value);
    setStudents([]);
    setError("");
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
    setStudents([]);
    setError("");
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      let url = config.office.students;
      const params = new URLSearchParams();

      if (selectedDepartment) params.append("departmentId", selectedDepartment);
      if (selectedCourse) params.append("courseId", selectedCourse);
      if (selectedDivision) params.append("divisionId", selectedDivision);
      if (selectedAcademicYear)
        params.append("academicYear", selectedAcademicYear);
      if (selectedBatch) params.append("batch", selectedBatch.trim());

      if (params.toString()) url += `?${params.toString()}`;

      console.log("=== FETCH STUDENTS DEBUG ===");
      console.log("Filters:", {
        department: selectedDepartment,
        course: selectedCourse,
        division: selectedDivision,
        academicYear: selectedAcademicYear,
        batch: selectedBatch,
      });
      console.log("Fetching URL:", url);

      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Full response data:", data);
      console.log("Is data.students array?", Array.isArray(data.students));
      console.log("Is data.students populated?", data.students?.length);
      if (data.filterHint) {
        console.log("Filter hint from server:", data.filterHint);
      }

      // Handle both direct array and object with students property
      let studentList = [];
      if (Array.isArray(data)) {
        studentList = data;
      } else if (data.students && Array.isArray(data.students)) {
        studentList = data.students;
      } else if (data.data && Array.isArray(data.data)) {
        studentList = data.data;
      }

      console.log("Setting students to array with length:", studentList.length);
      if (studentList.length > 0) {
        console.log("First student:", studentList[0]);
      }

      if (studentList.length === 0 && data.filterHint?.code === "FILTER_MISMATCH") {
        const relaxedParams = new URLSearchParams(params);
        relaxedParams.delete("academicYear");
        relaxedParams.delete("batch");

        if (relaxedParams.toString()) {
          const relaxedUrl = `${config.office.students}?${relaxedParams.toString()}`;
          console.log("Retrying with relaxed filters:", relaxedUrl);

          const relaxedRes = await fetch(relaxedUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          const relaxedData = await relaxedRes.json();
          let relaxedList = [];

          if (Array.isArray(relaxedData)) {
            relaxedList = relaxedData;
          } else if (Array.isArray(relaxedData.students)) {
            relaxedList = relaxedData.students;
          } else if (Array.isArray(relaxedData.data)) {
            relaxedList = relaxedData.data;
          }

          const normalizedSelectedYear = normalizeAcademicYear(selectedAcademicYear);
          const normalizedSelectedBatch = normalizeBatch(selectedBatch);

          const normalizedMatches = relaxedList.filter((student) => {
            const studentYear = normalizeAcademicYear(student?.academicYear);
            const studentBatch = normalizeBatch(student?.batch);

            const yearMatches = normalizedSelectedYear
              ? studentYear === normalizedSelectedYear
              : true;
            const batchMatches = normalizedSelectedBatch
              ? studentBatch === normalizedSelectedBatch
              : true;

            return yearMatches && batchMatches;
          });

          if (normalizedMatches.length > 0) {
            setStudents(normalizedMatches);
            setSuccess(
              `Applied normalized matching and found ${normalizedMatches.length} student(s) for selected filters.`,
            );
            setTimeout(() => setSuccess(""), 2500);
            return;
          }

          if (relaxedList.length > 0) {
            setError(
              `No exact/normalized match for Academic Year \"${selectedAcademicYear}\" and Batch \"${selectedBatch}\". Please verify uploaded values. ${relaxedList.length} students exist for selected Department/Course/Division.`,
            );
            setStudents([]);
            return;
          }
        }
      }

      setStudents(studentList);

      if (studentList.length === 0) {
        if (data.filterHint?.code === "FILTER_MISMATCH") {
          setError(
            "Students exist for selected Department/Course/Division, but Batch or Academic Year does not match uploaded data. Please clear Batch/Academic Year and try again.",
          );
        } else {
          setError("No students found for the selected filters.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError("Could not load students. Please try again.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    if (!selectedDepartment) {
      setError("Please select a Department first.");
      return;
    }
    fetchStudents();
  };

  const handleFilterClear = () => {
    setSelectedDepartment("");
    setSelectedCourse("");
    setSelectedDivision("");
    setSelectedAcademicYear("");
    setSelectedBatch("");
    setFilterSearch("");
    setCourses([]);
    setDivisions([]);
    setStudents([]);
    setCurrentPage(1);
  };

  const handleEditStart = (student) => {
    setEditingId(student._id);
    setEditData({ ...student });
    setError("");
    setSuccess("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleEditSave = async () => {
    if (
      !editData.studentName?.trim() ||
      !editData.rollNo?.trim() ||
      !editData.enrollmentNo?.trim() ||
      !editData.academicYear?.trim() ||
      !editData.batch?.trim()
    ) {
      setError("All required fields must be filled.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = `${config.students}/${editingId}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollNo: editData.rollNo.trim(),
          enrollmentNo: editData.enrollmentNo.trim(),
          studentName: editData.studentName.trim(),
          academicYear: editData.academicYear.trim(),
          batch: editData.batch.trim(),
          division: editData.division?.trim() || "",
          aadhaarNo: editData.aadhaarNo?.trim() || "",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Session expired. Please login again.");
        if (res.status === 403)
          throw new Error("You don't have permission to edit students.");
        throw new Error(result.message || "Failed to update student");
      }

      setSuccess(`"${editData.studentName}" updated successfully.`);
      setEditingId(null);
      setEditData({});
      setStudents(
        students.map((s) => (s._id === editingId ? result.student : s)),
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    // Validation
    if (
      !newStudent.studentName?.trim() ||
      !newStudent.rollNo?.trim() ||
      !newStudent.enrollmentNo?.trim() ||
      !newStudent.academicYear?.trim() ||
      !newStudent.batch?.trim() ||
      !selectedDepartment ||
      !selectedCourse ||
      !selectedDivision
    ) {
      setError("All required fields (Name, Roll No, Enrollment No, Academic Year, Batch, Department, Course, Division) must be filled.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(config.students, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newStudent,
          departmentId: selectedDepartment,
          courseId: selectedCourse,
          divisionId: selectedDivision,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to add student");
      }

      setSuccess(`"${newStudent.studentName}" added successfully.`);
      setNewStudent({
        studentName: "",
        rollNo: "",
        enrollmentNo: "",
        academicYear: "",
        batch: "",
        seatNo: "",
        section: "",
        aadhaarNo: "",
      });
      setShowAddStudentModal(false);

      // Refresh student list
      setTimeout(() => {
        if (selectedDepartment && selectedCourse && selectedDivision) {
          fetchStudents();
        }
      }, 500);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (student) => {
    setDeleteConfirmId(student._id);
    setDeleteConfirmName(student.studentName);
  };

  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.office.deleteStudent(deleteConfirmId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to remove student");
      }

      setSuccess(
        `"${deleteConfirmName}" removed successfully. Login credentials are revoked.`,
      );
      setStudents(students.filter((s) => s._id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setDeleteConfirmName("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPassword = (student) => {
    if (!student.plainPassword) {
      setError("Password not available for this student.");
      return;
    }
    setGeneratedPassword(student.plainPassword);
    setGeneratedPasswordStudent(student.studentName);
    setShowPasswordModal(true);
    setError("");
  };

  const handleDownloadPdf = () => {
    if (filteredStudents.length === 0) {
      setError("No students available to export.");
      return;
    }

    const departmentName =
      departments.find((dept) => dept._id === selectedDepartment)?.name ||
      "All";
    const courseLabel =
      courses.find((course) => course._id === selectedCourse)?.courseCode ||
      "All";
    const divisionLabel =
      divisions.find((div) => div._id === selectedDivision)?.name || "All";
    const batchLabel = selectedBatch || "All";

    const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
    doc.setFontSize(16);
    doc.text("Student Credentials Report", 40, 40);
    doc.setFontSize(11);
    doc.text(
      `Department: ${departmentName} | Course: ${courseLabel} | Division: ${divisionLabel} | Batch: ${batchLabel}`,
      40,
      60,
    );

    const rows = filteredStudents.map((student) => [
      student.rollNo || "",
      student.enrollmentNo || "",
      student.studentName || "",
      student.username || "—",
      student.plainPassword || "—",
      student.batch || "",
      student.division || "—",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [
        [
          "Roll No",
          "Enrollment No",
          "Name",
          "Username",
          "Password",
          "Batch",
          "Division",
        ],
      ],
      body: rows,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 95 },
        2: { cellWidth: 140 },
        3: { cellWidth: 120 },
        4: { cellWidth: 100 },
        5: { cellWidth: 70 },
        6: { cellWidth: 70 },
      },
    });

    const fileSafeBatch = batchLabel.replace(/\s+/g, "-");
    doc.save(`students-${fileSafeBatch}-credentials.pdf`);
  };

  // Client-side search filter
  const filteredStudents = students.filter((student) => {
    const term = (filterSearch || "").toLowerCase().trim();
    const studentName = (student.studentName || "").toString().toLowerCase();
    const rollNo = (student.rollNo || "").toString().toLowerCase();
    const enrollmentNo = (student.enrollmentNo || "").toString().toLowerCase();

    if (!term) return true;

    return (
      studentName.includes(term) ||
      rollNo.includes(term) ||
      enrollmentNo.includes(term)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  return (
    <div className="manage-students-page">
      {/* Header */}
      <div className="manage-header">
        <div>
          <h1>👥 Manage Students</h1>
          <p>
            Filter, view, edit, and manage student records with full cascading
            controls.
          </p>
        </div>
        <div className="manage-header-actions">
          <button
            className="btn-add-student"
            onClick={() => setShowAddStudentModal(true)}
            disabled={!selectedDepartment || !selectedCourse || !selectedDivision}
            title="Select Department, Course, and Division first"
          >
            ➕ Add Student
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Student</h2>
            <p>Create a new student record</p>
            
            <div className="modal-form">
              <div className="form-row">
                <label>Student Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  value={newStudent.studentName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, studentName: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label>Roll Number <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., 101"
                  value={newStudent.rollNo}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, rollNo: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label>Enrollment Number <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., 2024001"
                  value={newStudent.enrollmentNo}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, enrollmentNo: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label>Academic Year <span className="required">*</span></label>
                <select
                  value={newStudent.academicYear}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, academicYear: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="">-- Select Academic Year --</option>
                  {generateAcademicYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Batch <span className="required">*</span></label>
                <select
                  value={newStudent.batch}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, batch: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="">-- Select Batch --</option>
                  {generateBatchOptions().map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Seat Number</label>
                <input
                  type="text"
                  placeholder="e.g., A1"
                  value={newStudent.seatNo}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, seatNo: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label>Section</label>
                <input
                  type="text"
                  placeholder="e.g., A"
                  value={newStudent.section}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, section: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label>Aadhaar Number</label>
                <input
                  type="text"
                  placeholder="e.g., 1234 5678 9012"
                  value={newStudent.aadhaarNo}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, aadhaarNo: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="modal-form-buttons">
              <button
                className="modal-btn"
                onClick={() => setShowAddStudentModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleAddStudent}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="manage-controls">
        <div className="filter-group">
          <div className="form-row">
            <label>
              Department <span className="required">*</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              disabled={loading}
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
            <label>Course</label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              disabled={!selectedDepartment || loading}
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
            <label>Division</label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              disabled={!selectedCourse || loading}
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
            <label>Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={handleAcademicYearChange}
              disabled={loading}
            >
              <option value="">-- Select Academic Year --</option>
              {generateAcademicYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Batch</label>
            <select
              value={selectedBatch}
              onChange={handleBatchChange}
              disabled={loading}
            >
              <option value="">-- Select Batch --</option>
              {generateBatchOptions().map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>
              Search <span className="hint">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Name, roll no, or enrollment..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="filter-buttons">
          <button
            className="btn-primary"
            onClick={handleFilterApply}
            disabled={loading || !selectedDepartment}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            className="btn-secondary"
            onClick={handleFilterClear}
            disabled={loading}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="manage-table-wrapper">
        <div className="table-info">
          <span className="pill">{filteredStudents.length} students found</span>
          <div className="table-actions">
            <button
              className="btn-secondary"
              onClick={handleDownloadPdf}
              disabled={filteredStudents.length === 0 || loading}
            >
              Download PDF
            </button>
          </div>
        </div>

        {currentStudents.length === 0 ? (
          <div className="empty-state">
            <p>
              {loading
                ? "Loading students..."
                : "No students match the selected filters."}
            </p>
          </div>
        ) : (
          <>
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Enrollment No</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Year</th>
                  <th>Batch</th>
                  <th>Division</th>
                  <th>Aadhaar</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student) => (
                  <React.Fragment key={student._id}>
                    {editingId === student._id ? (
                      // Edit Row
                      <tr className="edit-row">
                        <td>
                          <input
                            value={editData.rollNo || ""}
                            onChange={(e) =>
                              handleEditChange("rollNo", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editData.enrollmentNo || ""}
                            onChange={(e) =>
                              handleEditChange("enrollmentNo", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editData.studentName || ""}
                            onChange={(e) =>
                              handleEditChange("studentName", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <span className="credential-display">
                            {editData.username || "—"}
                          </span>
                          {editData.username && (
                            <button
                              className="btn-regenerate"
                              onClick={() => handleViewPassword(editData)}
                            >
                              👁️
                            </button>
                          )}
                        </td>
                        <td>
                          <select
                            value={editData.academicYear || ""}
                            onChange={(e) =>
                              handleEditChange("academicYear", e.target.value)
                            }
                          >
                            <option value="">-- Select Year --</option>
                            {generateAcademicYearOptions().map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={editData.batch || ""}
                            onChange={(e) =>
                              handleEditChange("batch", e.target.value)
                            }
                          >
                            <option value="">-- Select Batch --</option>
                            {generateBatchOptions().map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            value={editData.division || ""}
                            onChange={(e) =>
                              handleEditChange("division", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editData.aadhaarNo || ""}
                            onChange={(e) =>
                              handleEditChange("aadhaarNo", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-save"
                              onClick={handleEditSave}
                            >
                              Save
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // View Row
                      <tr>
                        <td>{student.rollNo}</td>
                        <td>{student.enrollmentNo}</td>
                        <td>{student.studentName}</td>
                        <td className="credential-cell">
                          <span className="credential-display">
                            {student.username || "—"}
                          </span>
                          {student.username && (
                            <button
                              className="btn-regenerate"
                              onClick={() => handleViewPassword(student)}
                            >
                              👁️
                            </button>
                          )}
                        </td>
                        <td>{student.academicYear || "—"}</td>
                        <td>{student.batch}</td>
                        <td>{student.division || "—"}</td>
                        <td>{student.aadhaarMasked || "—"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditStart(student)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteConfirm(student)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-nav"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-nav"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Deletion</h2>
            <p>
              Remove <strong>{deleteConfirmName}</strong>?
            </p>
            <p className="warning">
              This action cannot be undone. Student login credentials will stop
              working immediately.
            </p>
            <div className="modal-buttons">
              <button className="btn-delete" onClick={handleDeleteConfirmed}>
                Remove
              </button>
              <button
                className="btn-cancel"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="modal-content password-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Student Password</h2>
            <p>
              For <strong>{generatedPasswordStudent}</strong>
            </p>
            <div className="password-display">
              <code>{generatedPassword}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  alert("Password copied to clipboard!");
                }}
              >
                📋 Copy
              </button>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowPasswordModal(false)}
              style={{ width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
