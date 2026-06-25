import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { config } from "../config/api";
import "./ManageStudents.css";

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
  const [seatNumbers, setSeatNumbers] = useState({});
  const [savingSeats, setSavingSeats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState("rollNo");
  const [sortDirection, setSortDirection] = useState("asc");

  // Cascading filters
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

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
    aadhaarNo: "",
  });

  // Selected Student for Details Drawer
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);
  const [drawerEditData, setDrawerEditData] = useState({});
  const [regeneratingPasswordId, setRegeneratingPasswordId] = useState(null);

  // Clipboard copied
  const [copiedId, setCopiedId] = useState(null);

  // Bulk Seat Number Upload
  const [showBulkSeatModal, setShowBulkSeatModal] = useState(false);
  const [bulkSeatFile, setBulkSeatFile] = useState(null);
  const [bulkSeatFileName, setBulkSeatFileName] = useState("");
  const [bulkSeatParsedRows, setBulkSeatParsedRows] = useState([]);
  const [bulkSeatUploading, setBulkSeatUploading] = useState(false);
  const [bulkSeatResult, setBulkSeatResult] = useState(null);

  // Initial load
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Sync seat numbers state with student records
  useEffect(() => {
    if (students && Array.isArray(students)) {
      const seats = {};
      students.forEach((student) => {
        seats[student._id] = student.seatNo || "";
      });
      setSeatNumbers(seats);
    }
  }, [students]);

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
      if (selectedAcademicYear) params.append("academicYear", selectedAcademicYear);
      if (selectedBatch) params.append("batch", selectedBatch.trim());

      if (params.toString()) url += `?${params.toString()}`;

      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      let studentList = [];

      if (Array.isArray(data)) {
        studentList = data;
      } else if (data.students && Array.isArray(data.students)) {
        studentList = data.students;
      } else if (data.data && Array.isArray(data.data)) {
        studentList = data.data;
      }

      // Retry with relaxed filter logic if server returns a filter mismatch
      if (studentList.length === 0 && data.filterHint?.code === "FILTER_MISMATCH") {
        const relaxedParams = new URLSearchParams(params);
        relaxedParams.delete("academicYear");
        relaxedParams.delete("batch");

        if (relaxedParams.toString()) {
          const relaxedUrl = `${config.office.students}?${relaxedParams.toString()}`;
          const relaxedRes = await fetch(relaxedUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const relaxedData = await relaxedRes.json();
          let relaxedList = [];

          if (Array.isArray(relaxedData)) {
            relaxedList = relaxedData;
          } else if (Array.isArray(relaxedData.students)) {
            relaxedList = relaxedData.students;
          }

          const normalizedSelectedYear = normalizeAcademicYear(selectedAcademicYear);
          const normalizedSelectedBatch = normalizeBatch(selectedBatch);

          const normalizedMatches = relaxedList.filter((student) => {
            const studentYear = normalizeAcademicYear(student?.academicYear);
            const studentBatch = normalizeBatch(student?.batch);
            const yearMatches = normalizedSelectedYear ? studentYear === normalizedSelectedYear : true;
            const batchMatches = normalizedSelectedBatch ? studentBatch === normalizedSelectedBatch : true;
            return yearMatches && batchMatches;
          });

          if (normalizedMatches.length > 0) {
            setStudents(normalizedMatches);
            return;
          }

          if (relaxedList.length > 0) {
            setError(`No exact match for academic year "${selectedAcademicYear}" and batch "${selectedBatch}".`);
            setStudents([]);
            return;
          }
        }
      }

      setStudents(studentList);
      if (studentList.length === 0) {
        setError("No students found matching current filters.");
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError("Could not load students directory.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    if (!selectedDepartment) {
      setError("Please choose a department filter first.");
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
    setError("");
  };

  const handleSeatNumberChange = (studentId, value) => {
    setSeatNumbers((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSaveAllSeats = async () => {
    try {
      setSavingSeats(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired. Please sign in again.");

      const res = await fetch(config.office.saveSeatNumbers, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatNumbers }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save seat numbers");

      setSuccess("Seat numbers updated successfully.");
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          seatNo: seatNumbers[s._id] !== undefined ? seatNumbers[s._id] : s.seatNo,
        }))
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSeats(false);
    }
  };

  const handleOpenDetailsDrawer = (student) => {
    setSelectedStudent(student);
    setDrawerEditData({ ...student });
    setIsEditingInDrawer(false);
    setShowDetailsDrawer(true);
  };

  const handleCloseDetailsDrawer = () => {
    setShowDetailsDrawer(false);
    setSelectedStudent(null);
    setIsEditingInDrawer(false);
  };

  const handleDrawerEditChange = (field, value) => {
    setDrawerEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveDrawerProfile = async () => {
    if (
      !drawerEditData.studentName?.trim() ||
      !drawerEditData.rollNo?.trim() ||
      !drawerEditData.enrollmentNo?.trim() ||
      !drawerEditData.academicYear?.trim() ||
      !drawerEditData.batch?.trim()
    ) {
      setError("All required fields must be filled.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = `${config.students}/${selectedStudent._id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollNo: drawerEditData.rollNo.trim(),
          enrollmentNo: drawerEditData.enrollmentNo.trim(),
          studentName: drawerEditData.studentName.trim(),
          academicYear: drawerEditData.academicYear.trim(),
          batch: drawerEditData.batch.trim(),
          division: drawerEditData.division?.trim() || "",
          aadhaarNo: drawerEditData.aadhaarNo?.trim() || "",
          seatNo: seatNumbers[selectedStudent._id] !== undefined ? seatNumbers[selectedStudent._id] : (drawerEditData.seatNo || ""),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update profile");

      setSuccess(`"${drawerEditData.studentName}" profile updated successfully.`);
      setStudents(students.map((s) => (s._id === selectedStudent._id ? result.student : s)));
      setSelectedStudent(result.student);
      setIsEditingInDrawer(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePassword = async () => {
    const studentId = selectedStudent._id;
    try {
      setRegeneratingPasswordId(studentId);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await fetch(config.office.regeneratePassword(studentId), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Password regeneration failed");
      }

      setSuccess(`New credentials generated for ${data.studentName}.`);
      
      const updatedStudent = {
        ...selectedStudent,
        plainPassword: data.plainPassword,
      };

      setStudents(students.map((s) => (s._id === studentId ? updatedStudent : s)));
      setSelectedStudent(updatedStudent);
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegeneratingPasswordId(null);
    }
  };

  const handleAddStudentSubmit = async () => {
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
      setError("Please fill all required student details and ensure parent filters are selected.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
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
      if (!res.ok) throw new Error(result.message || "Failed to create student profile.");

      setSuccess(`Created profile for "${newStudent.studentName}" successfully.`);
      setNewStudent({
        studentName: "",
        rollNo: "",
        enrollmentNo: "",
        academicYear: "",
        batch: "",
        seatNo: "",
        aadhaarNo: "",
      });
      setShowAddStudentModal(false);

      // Refresh list
      setTimeout(() => fetchStudents(), 500);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const divisionName = divisions.find(d => d._id === selectedDivision)?.name || "";
    const classContext = divisionName ? ` from ${divisionName}` : "";
    if (!window.confirm(`Are you sure you want to permanently delete student "${studentName}"${classContext}?\n\nThis action will revoke portal credentials and cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await fetch(config.office.deleteStudent(studentId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete student record.");
      }

      setSuccess(`Removed student profile for "${studentName}" successfully.`);
      setStudents(students.filter((s) => s._id !== studentId));
      if (selectedStudent?._id === studentId) {
        handleCloseDetailsDrawer();
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllClassStudents = async () => {
    if (!selectedDepartment || !selectedCourse || !selectedDivision) {
      setError("Please select Department, Course and Division filter first.");
      return;
    }

    const divisionName = divisions.find(d => d._id === selectedDivision)?.name || "selected class";
    const studentCount = filteredStudents.length;

    if (studentCount === 0) {
      setError("No students found in the selected class to delete.");
      return;
    }

    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ALL ${studentCount} students in class "${divisionName}"?\n\nThis will also delete their portal user accounts. This action CANNOT be undone.`)) {
      return;
    }

    const verificationPrompt = window.prompt(`To confirm, type the division name "${divisionName}" below:`);
    if (verificationPrompt !== divisionName) {
      setError("Deletion cancelled. Division name did not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await fetch(config.office.clearStudents, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          departmentId: selectedDepartment,
          courseId: selectedCourse,
          divisionId: selectedDivision,
          academicYear: selectedAcademicYear || undefined,
          batch: selectedBatch || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete student records.");
      }

      setSuccess(`Successfully deleted ${data.deletedStudents || studentCount} students from class "${divisionName}".`);
      setStudents([]);
      handleCloseDetailsDrawer();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCredentialsPdf = () => {
    if (filteredStudents.length === 0) {
      setError("No students found to export credentials report.");
      return;
    }

    const deptName = departments.find((d) => d._id === selectedDepartment)?.name || "All";
    const courseCode = courses.find((c) => c._id === selectedCourse)?.courseCode || "All";
    const divName = divisions.find((d) => d._id === selectedDivision)?.name || "All";
    const batchName = selectedBatch || "All";

    const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
    doc.setFontSize(16);
    doc.text("Student Credentials Report", 40, 40);
    doc.setFontSize(11);
    doc.text(
      `Dept: ${deptName} | Course: ${courseCode} | Division: ${divName} | Batch: ${batchName}`,
      40,
      60
    );

    const rows = filteredStudents.map((s) => [
      s.rollNo || "",
      s.enrollmentNo || "",
      s.studentName || "",
      s.username || "—",
      s.plainPassword || "—",
      s.batch || "",
      s.divisionName || s.division || "—",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Roll No", "Enrollment No", "Name", "Username", "Password", "Batch", "Division"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`credentials_report_${batchName}.pdf`);
  };

  // Client-side search and filtering
  const filteredStudents = students.filter((s) => {
    const term = (filterSearch || "").toLowerCase().trim();
    const name = (s.studentName || "").toString().toLowerCase();
    const roll = (s.rollNo || "").toString().toLowerCase();
    const enroll = (s.enrollmentNo || "").toString().toLowerCase();

    if (!term) return true;
    return name.includes(term) || roll.includes(term) || enroll.includes(term);
  });

  // Sorting
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";

    if (sortField === "rollNo") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" })
        : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: "base" });
    }

    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  const requestSort = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // === Bulk Seat Number Upload Handlers ===
  const handleDownloadSeatTemplate = () => {
    const headers = [["Enrollment No", "Seat No"]];
    const sampleData = [
      ["EN2101001", "A-101"],
      ["EN2101002", "A-102"],
      ["EN2101003", "A-103"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Seat Numbers");
    XLSX.writeFile(wb, "seat_numbers_template.xlsx");
  };

  const handleBulkSeatFileChange = (event) => {
    const file = event.target.files?.[0];
    setBulkSeatResult(null);
    setBulkSeatParsedRows([]);

    if (!file) return;

    setBulkSeatFileName(file.name);
    setBulkSeatFile(file);

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

        const mapped = json.map((row) => {
          const normalized = {};
          Object.entries(row).forEach(([key, value]) => {
            const safeKey = key.toLowerCase().replace(/\s+/g, "");
            normalized[safeKey] = value === undefined || value === null ? "" : value.toString().trim();
          });
          return {
            enrollmentNo: normalized["enrollmentno"] || normalized["enrollment_no"] || normalized["enrollment"] || "",
            seatNo: normalized["seatno"] || normalized["seat_no"] || normalized["seat"] || normalized["seatnumber"] || normalized["seat_number"] || "",
          };
        }).filter((row) => row.enrollmentNo && row.seatNo);

        if (mapped.length === 0) {
          setError("Excel sheet must contain 'Enrollment No' and 'Seat No' columns with valid data.");
          return;
        }

        setBulkSeatParsedRows(mapped);
      } catch (err) {
        console.error("Failed to parse seat file", err);
        setError("Error parsing seat numbers file. Please use the template format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkSeatUpload = async () => {
    if (bulkSeatParsedRows.length === 0) {
      setError("No seat numbers to upload. Please select a valid file first.");
      return;
    }

    try {
      setBulkSeatUploading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired. Please sign in again.");

      const res = await fetch(config.office.bulkSeatNumbers, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entries: bulkSeatParsedRows,
          departmentId: selectedDepartment || undefined,
          courseId: selectedCourse || undefined,
          divisionId: selectedDivision || undefined,
          academicYear: selectedAcademicYear || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload seat numbers.");
      }

      setBulkSeatResult(data);
      setSuccess(data.message);

      // Refresh the student list to show updated seat numbers
      if (students.length > 0) {
        fetchStudents();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkSeatUploading(false);
    }
  };

  const handleCloseBulkSeatModal = () => {
    setShowBulkSeatModal(false);
    setBulkSeatFile(null);
    setBulkSeatFileName("");
    setBulkSeatParsedRows([]);
    setBulkSeatResult(null);
  };

  return (
    <div className="manage-layout-wrapper animate-fadeIn">
      
      {/* Upper Title / Summary Row */}
      <div className="manage-title-row">
        <div className="title-left">
          <h2>Student Directory</h2>
          <span className="directory-count-badge">{filteredStudents.length} Students</span>
        </div>
        
        <div className="title-actions">
          <button 
            className="wizard-btn-outline text-primary" 
            onClick={handleDownloadCredentialsPdf}
            disabled={filteredStudents.length === 0}
          >
            Export Credentials PDF
          </button>

          <button
            className="wizard-btn-outline"
            onClick={() => setShowBulkSeatModal(true)}
            disabled={filteredStudents.length === 0}
          >
            📤 Upload Seat Numbers
          </button>
          
          <button
            className="wizard-btn-primary"
            onClick={() => setShowAddStudentModal(true)}
            disabled={!selectedDepartment || !selectedCourse || !selectedDivision}
            title={(!selectedDepartment || !selectedCourse || !selectedDivision) ? "Please select Department, Course and Division filter first" : `Add student to ${divisions.find(d => d._id === selectedDivision)?.name || "selected class"}`}
          >
            ➕ Add Student
            {selectedDivision && <span style={{ fontSize: "11px", opacity: 0.85, marginLeft: "4px" }}>
              — {divisions.find(d => d._id === selectedDivision)?.name || ""}
            </span>}
          </button>

          <button
            className="wizard-btn-danger"
            onClick={handleDeleteAllClassStudents}
            disabled={!selectedDepartment || !selectedCourse || !selectedDivision || students.length === 0}
            title={(!selectedDepartment || !selectedCourse || !selectedDivision) ? "Please select Department, Course and Division filter first" : `Delete all students in class ${divisions.find(d => d._id === selectedDivision)?.name || "selected class"}`}
          >
            🗑️ Delete Class Students
            {selectedDivision && <span style={{ fontSize: "11px", opacity: 0.85, marginLeft: "4px" }}>
              — {divisions.find(d => d._id === selectedDivision)?.name || ""}
            </span>}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <div className="alert-banner error margin-bottom-sm">{error}</div>}
      {success && <div className="alert-banner success margin-bottom-sm">{success}</div>}

      {/* Sticky Compact Filters bar */}
      <div className="sticky-filters-container">
        <div className="filters-card-inner">
          <div className="filter-select-group">
            <select value={selectedDepartment} onChange={handleDepartmentChange}>
              <option value="">Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
              ))}
            </select>

            <select 
              value={selectedCourse} 
              onChange={handleCourseChange}
              disabled={!selectedDepartment}
            >
              <option value="">Course / Sem</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>Sem {c.semester} - {c.courseCode}</option>
              ))}
            </select>

            <select 
              value={selectedDivision} 
              onChange={handleDivisionChange}
              disabled={!selectedCourse}
            >
              <option value="">Division</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <select 
              value={selectedAcademicYear} 
              onChange={handleAcademicYearChange}
            >
              <option value="">Academic Year</option>
              {generateAcademicYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select 
              value={selectedBatch} 
              onChange={handleBatchChange}
            >
              <option value="">Batch</option>
              {Array.from({ length: 12 }, (_, i) => `Batch ${i + 1}`).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="filter-right-search-action">
            <div className="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="search-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search name, enrollment..." 
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>

            <div className="button-group-trigger">
              <button className="wizard-btn-primary" onClick={handleFilterApply}>Apply</button>
              <button className="wizard-btn-outline" onClick={handleFilterClear}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Table List */}
      <div className="student-records-table-card">
        {loading ? (
          <div className="table-loader-state">
            <div className="loading-ring-spinner" />
            <span>Loading student profiles...</span>
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">👥</div>
            <h4>No students loaded</h4>
            <p>Apply valid department filters or add a student to initialize the roster.</p>
          </div>
        ) : (
          <div className="table-container-inner office-scrollable">
            <table className="directory-data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort("rollNo")} className="sortable-th">
                    Roll No {sortField === "rollNo" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th onClick={() => requestSort("enrollmentNo")} className="sortable-th">
                    Enrollment No {sortField === "enrollmentNo" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th onClick={() => requestSort("studentName")} className="sortable-th">
                    Name {sortField === "studentName" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Batch</th>
                  <th>Division</th>
                  <th>Seat Number</th>
                  <th>Credentials</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student._id}>
                    <td><strong>{student.rollNo}</strong></td>
                    <td><code className="code-tag">{student.enrollmentNo}</code></td>
                    <td>
                      <div className="student-cell-identity">
                        <span className="student-identity-name">{student.studentName}</span>
                      </div>
                    </td>
                    <td><span className="batch-badge">{student.batch}</span></td>
                    <td><span className="division-badge">{student.divisionName || student.division || "—"}</span></td>
                    <td>
                      <input
                        type="text"
                        className="table-inline-input"
                        placeholder="Assign Seat"
                        value={seatNumbers[student._id] || ""}
                        onChange={(e) => handleSeatNumberChange(student._id, e.target.value)}
                      />
                    </td>
                    <td>
                      {student.plainPassword ? (
                        <div className="credentials-action-cell">
                          <code className="code-tag password">••••••••</code>
                          <button
                            className="btn-tiny-icon"
                            title="Copy Password"
                            onClick={() => copyToClipboard(student.plainPassword, student._id + "_pass")}
                          >
                            {copiedId === student._id + "_pass" ? "✓" : "📋"}
                          </button>
                        </div>
                      ) : (
                        <span className="muted-italic">Not generated</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-flex-row">
                        <button
                          className="action-link-btn"
                          onClick={() => handleOpenDetailsDrawer(student)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-link-btn danger"
                          onClick={() => handleDeleteStudent(student._id, student.studentName)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save seat numbers footer & pagination bar */}
        {sortedStudents.length > 0 && (
          <div className="table-footer-actions-row">
            <button 
              className="wizard-btn-primary" 
              onClick={handleSaveAllSeats}
              disabled={savingSeats}
            >
              {savingSeats ? "Saving Seat Numbers..." : "Save Seat Numbers"}
            </button>

            {totalPages > 1 && (
              <div className="pagination-controls-box">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ◀
                </button>
                <span className="pagination-status">Page {currentPage} of {totalPages}</span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Details Sliding Drawer (Stripe style) */}
      {showDetailsDrawer && selectedStudent && (
        <div className="drawer-overlay-backdrop" onClick={handleCloseDetailsDrawer}>
          <div className="details-slider-drawer animate-slideInRight" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header-row">
              <div className="drawer-user-info-meta">
                <div className="drawer-avatar">
                  {selectedStudent.studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedStudent.studentName}</h3>
                  <span className="role-label">Enrollment: {selectedStudent.enrollmentNo}</span>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={handleCloseDetailsDrawer}>✕</button>
            </div>

            <div className="drawer-scrolling-content office-scrollable">
              {/* Profile Details section */}
              <div className="drawer-section-card">
                <div className="section-header-trigger-row">
                  <h4>Academic profile details</h4>
                  <button 
                    className="wizard-btn-outline compact-btn"
                    onClick={() => setIsEditingInDrawer(!isEditingInDrawer)}
                  >
                    {isEditingInDrawer ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {isEditingInDrawer ? (
                  <div className="drawer-edit-form-grid">
                    <div className="form-input-control">
                      <label>Student Name</label>
                      <input 
                        type="text" 
                        value={drawerEditData.studentName || ""} 
                        onChange={(e) => handleDrawerEditChange("studentName", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-input-control">
                      <label>Roll Number</label>
                      <input 
                        type="text" 
                        value={drawerEditData.rollNo || ""} 
                        onChange={(e) => handleDrawerEditChange("rollNo", e.target.value)}
                      />
                    </div>

                    <div className="form-input-control">
                      <label>Enrollment Number</label>
                      <input 
                        type="text" 
                        value={drawerEditData.enrollmentNo || ""} 
                        onChange={(e) => handleDrawerEditChange("enrollmentNo", e.target.value)}
                      />
                    </div>

                    <div className="form-input-control">
                      <label>Batch</label>
                      <input 
                        type="text" 
                        value={drawerEditData.batch || ""} 
                        onChange={(e) => handleDrawerEditChange("batch", e.target.value)}
                      />
                    </div>

                    <div className="form-input-control">
                      <label>Academic Year</label>
                      <input 
                        type="text" 
                        value={drawerEditData.academicYear || ""} 
                        onChange={(e) => handleDrawerEditChange("academicYear", e.target.value)}
                      />
                    </div>

                    <div className="form-input-control">
                      <label>Seat Number</label>
                      <input 
                        type="text" 
                        value={drawerEditData.seatNo || ""} 
                        onChange={(e) => handleDrawerEditChange("seatNo", e.target.value)}
                      />
                    </div>

                    <div className="form-input-control">
                      <label>Aadhaar Number</label>
                      <input 
                        type="text" 
                        value={drawerEditData.aadhaarNo || ""} 
                        onChange={(e) => handleDrawerEditChange("aadhaarNo", e.target.value)}
                      />
                    </div>

                    <button className="wizard-btn-primary margin-top-sm" onClick={handleSaveDrawerProfile}>
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="drawer-details-list">
                    <div className="details-item-row">
                      <span className="item-label">Roll Number</span>
                      <span className="item-value">{selectedStudent.rollNo}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Enrollment Number</span>
                      <span className="item-value">{selectedStudent.enrollmentNo}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Division</span>
                      <span className="item-value">{selectedStudent.divisionName || selectedStudent.division || "—"}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Batch</span>
                      <span className="item-value">{selectedStudent.batch}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Academic Year</span>
                      <span className="item-value">{selectedStudent.academicYear || "—"}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Seat Number</span>
                      <span className="item-value">{selectedStudent.seatNo || "—"}</span>
                    </div>
                    <div className="details-item-row">
                      <span className="item-label">Aadhaar Number</span>
                      <span className="item-value">{selectedStudent.aadhaarNo || "—"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Credentials Card */}
              <div className="drawer-section-card margin-top-md">
                <h4>Portal access credentials</h4>
                <div className="drawer-details-list">
                  <div className="details-item-row">
                    <span className="item-label">Username</span>
                    <span className="item-value">
                      <code className="code-tag">{selectedStudent.username || "—"}</code>
                    </span>
                  </div>

                  <div className="details-item-row">
                    <span className="item-label">Plain Password</span>
                    <span className="item-value">
                      {selectedStudent.plainPassword ? (
                        <div className="credentials-action-cell">
                          <code className="code-tag password">{selectedStudent.plainPassword}</code>
                          <button
                            className="btn-tiny-icon"
                            onClick={() => copyToClipboard(selectedStudent.plainPassword, "drawer_pass")}
                          >
                            {copiedId === "drawer_pass" ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>
                      ) : (
                        <span className="muted-italic">Password not stored</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="drawer-card-actions-footer">
                  <button
                    className="wizard-btn-outline text-primary full-width"
                    onClick={handleRegeneratePassword}
                    disabled={regeneratingPasswordId !== null}
                  >
                    {regeneratingPasswordId ? "Regenerating..." : "🔄 Reset & Regenerate Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-wrapper-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-dialog-box animate-modalScaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Create Student Profile</h3>
              <p>
                Add a new student to{" "}
                <strong>{divisions.find(d => d._id === selectedDivision)?.name || "selected class"}</strong>
                {courses.find(c => c._id === selectedCourse) ? ` — Sem ${courses.find(c => c._id === selectedCourse).semester}` : ""}
              </p>
            </div>

            <div className="modal-dialog-body office-scrollable">
              <div className="form-input-control">
                <label>Student Name <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="Full name (e.g. Aarav Sharma)"
                  value={newStudent.studentName}
                  onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                />
              </div>

              <div className="form-input-control">
                <label>Roll Number <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                />
              </div>

              <div className="form-input-control">
                <label>Enrollment Number <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. EN2101001"
                  value={newStudent.enrollmentNo}
                  onChange={(e) => setNewStudent({ ...newStudent, enrollmentNo: e.target.value })}
                />
              </div>

              <div className="form-input-control">
                <label>Batch Name <span className="req">*</span></label>
                <select
                  value={newStudent.batch}
                  onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                >
                  <option value="">Select Batch</option>
                  {Array.from({ length: 12 }, (_, i) => `Batch ${i + 1}`).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-input-control">
                <label>Academic Year <span className="req">*</span></label>
                <select
                  value={newStudent.academicYear}
                  onChange={(e) => setNewStudent({ ...newStudent, academicYear: e.target.value })}
                >
                  <option value="">Select Academic Year</option>
                  {generateAcademicYearOptions().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="form-input-control">
                <label>Aadhaar Number <span className="hint">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="12-digit Aadhaar"
                  value={newStudent.aadhaarNo}
                  onChange={(e) => setNewStudent({ ...newStudent, aadhaarNo: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-dialog-footer">
              <button className="wizard-btn-outline" onClick={() => setShowAddStudentModal(false)}>
                Cancel
              </button>
              <button 
                className="wizard-btn-primary" 
                onClick={handleAddStudentSubmit}
                disabled={loading}
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Seat Number Upload Modal */}
      {showBulkSeatModal && (
        <div className="modal-wrapper-overlay" onClick={handleCloseBulkSeatModal}>
          <div className="modal-dialog-box bulk-seat-modal animate-modalScaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>📤 Bulk Upload Seat Numbers</h3>
              <p>Upload an Excel or CSV file with <strong>Enrollment No</strong> and <strong>Seat No</strong> columns to assign seat numbers in bulk.</p>
            </div>

            <div className="modal-dialog-body office-scrollable">
              {/* Template download */}
              <div className="download-template-card-box">
                <div className="template-info">
                  <h4>Download Seat Number Template</h4>
                  <p>Use this Excel template to fill in enrollment numbers and seat numbers.</p>
                </div>
                <button className="wizard-btn-outline" onClick={handleDownloadSeatTemplate}>
                  📥 Download Template
                </button>
              </div>

              {/* File upload */}
              <div className="drag-drop-file-wrapper">
                <input
                  id="bulk-seat-file-selector"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkSeatFileChange}
                />
                <label htmlFor="bulk-seat-file-selector" className="drag-drop-area-label compact">
                  <div className="drag-drop-cloud-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="cloud-svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V13.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 13.5v3.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  {bulkSeatFileName ? (
                    <div className="file-metadata-info">
                      <span className="metadata-name">{bulkSeatFileName}</span>
                      <span className="metadata-change-label">Click to select another file</span>
                    </div>
                  ) : (
                    <div className="file-prompt-info">
                      <strong>Choose Excel or CSV file</strong>
                      <span>with Enrollment No and Seat No columns</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Preview parsed rows */}
              {bulkSeatParsedRows.length > 0 && !bulkSeatResult && (
                <div className="bulk-seat-preview-section">
                  <div className="preview-header-row">
                    <h4>Preview ({bulkSeatParsedRows.length} entries)</h4>
                  </div>
                  <div className="preview-table-box office-scrollable" style={{ maxHeight: "180px" }}>
                    <table className="preview-records-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Enrollment No</th>
                          <th>Seat No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkSeatParsedRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><code className="code-tag">{row.enrollmentNo}</code></td>
                            <td><strong>{row.seatNo}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkSeatParsedRows.length > 15 && (
                      <div className="preview-records-more-label">
                        And {bulkSeatParsedRows.length - 15} more entries...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload result summary */}
              {bulkSeatResult && (
                <div className="bulk-seat-result-section">
                  <div className="result-summary-card">
                    <div className="result-stat">
                      <span className="result-stat-value success">{bulkSeatResult.updated || 0}</span>
                      <span className="result-stat-label">Updated</span>
                    </div>
                    <div className="result-stat">
                      <span className="result-stat-value warning">{bulkSeatResult.skipped || 0}</span>
                      <span className="result-stat-label">Skipped</span>
                    </div>
                    <div className="result-stat">
                      <span className="result-stat-value danger">{(bulkSeatResult.notFound || []).length}</span>
                      <span className="result-stat-label">Not Found</span>
                    </div>
                  </div>

                  {bulkSeatResult.notFound && bulkSeatResult.notFound.length > 0 && (
                    <div className="not-found-list-card">
                      <h4>⚠️ Not Found Enrollment Numbers</h4>
                      <div className="preview-table-box office-scrollable" style={{ maxHeight: "140px" }}>
                        <table className="preview-records-table">
                          <thead>
                            <tr>
                              <th>Enrollment No</th>
                              <th>Seat No (Attempted)</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkSeatResult.notFound.map((nf, idx) => (
                              <tr key={idx}>
                                <td><code className="code-tag">{nf.enrollmentNo}</code></td>
                                <td>{nf.seatNo}</td>
                                <td style={{ color: "var(--office-danger)", fontSize: "11.5px" }}>{nf.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-dialog-footer">
              <button className="wizard-btn-outline" onClick={handleCloseBulkSeatModal}>
                {bulkSeatResult ? "Close" : "Cancel"}
              </button>
              {!bulkSeatResult && (
                <button
                  className="wizard-btn-primary"
                  onClick={handleBulkSeatUpload}
                  disabled={bulkSeatParsedRows.length === 0 || bulkSeatUploading}
                >
                  {bulkSeatUploading ? (
                    <>
                      <div className="loading-ring-spinner small" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${bulkSeatParsedRows.length} Seat Numbers`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageStudents;
