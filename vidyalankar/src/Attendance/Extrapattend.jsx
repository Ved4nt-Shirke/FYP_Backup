import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import "./TheoryEdit.css";

const StudentAttendancePage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [columnsVisible, setColumnsVisible] = useState({
    rollId: true,
    name: true,
    mark: true,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [arrowOpen, setArrowOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch students from backend based on batch from attendanceMeta
  useEffect(() => {
    console.log("Component mounted, checking localStorage...");
    const metaString = localStorage.getItem("attendanceMeta");
    console.log("Raw localStorage data:", metaString);

    if (!metaString) {
      console.error("No attendanceMeta found in localStorage");
      showErrorAlert("Missing attendance information. Redirecting to form...");
      navigate("/extra-practical");
      return;
    }

    let meta;
    try {
      meta = JSON.parse(metaString);
      console.log("Parsed meta data:", meta);
    } catch (parseError) {
      console.error("Error parsing localStorage data:", parseError);
      showErrorAlert(
        "Invalid attendance data. Please go back and fill the form again.",
      );
      return;
    }

    if (!meta || !meta.batch) {
      console.error("Missing batch in meta data:", meta);
      showErrorAlert(
        "Missing batch information. Please go back and select a batch.",
      );
      return;
    }

    console.log("Fetching students for batch:", meta.batch);

    // Build query params with batch and division
    const params = { batch: meta.batch };
    if (meta.ciannData?.division) {
      params.division = meta.ciannData.division;
    }

    const apiUrl = `http://localhost:5000/api/students`;
    console.log("API URL:", apiUrl, "Params:", params);

    axios
      .get(apiUrl, { params })
      .then((res) => {
        console.log("API Response status:", res.status);
        console.log("Students fetched:", res.data);

        if (!res.data || res.data.length === 0) {
          console.warn("No students found for batch:", meta.batch);
          // Try fetching all students as fallback
          console.log("Trying to fetch all students as fallback...");
          return axios.get("http://localhost:5000/api/students");
        }

        // Map backend fields to frontend fields
        const studentList = res.data.map((student) => ({
          rollId: student.rollNo,
          name: student.studentName,
          enrollmentNo: student.enrollmentNo || "N/A",
          batch: student.batch || "N/A",
          attendance: "Absent", // Make sure this is a string
        }));
        console.log("Mapped student list:", studentList);
        setStudents(studentList);
      })
      .then((fallbackRes) => {
        if (fallbackRes) {
          console.log("Fallback API Response:", fallbackRes.data);
          // Filter students by batch on frontend if backend filtering failed
          const filteredStudents = fallbackRes.data.filter(
            (student) => student.batch === meta.batch,
          );
          console.log("Frontend filtered students:", filteredStudents);

          if (filteredStudents.length === 0) {
            alert(
              `No students found for batch ${meta.batch}. Please check if students are added to this batch.`,
            );
            setStudents([]);
            return;
          }

          const studentList = filteredStudents.map((student) => ({
            rollId: student.rollNo,
            name: student.studentName,
            enrollmentNo: student.enrollmentNo || "N/A",
            batch: student.batch || "N/A",
            attendance: "Absent",
          }));
          console.log("Fallback mapped student list:", studentList);
          setStudents(studentList);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch students:", err);
        console.error("Error status:", err.response?.status);
        console.error("Error data:", err.response?.data);
        console.error("Error message:", err.message);
        console.error("Full error object:", err);

        if (err.response?.status === 404) {
          alert(
            "API endpoint not found. Please check if the backend server is running correctly.",
          );
        } else if (err.code === "ECONNREFUSED") {
          alert(
            "Cannot connect to backend server. Please check if the server is running on port 5000.",
          );
        } else {
          alert(
            `Failed to fetch students: ${err.response?.data?.message || err.message}`,
          );
        }
        setStudents([]);
      });
  }, []);

  const toggleAttendance = (index) => {
    setStudents((prevStudents) => {
      const updated = prevStudents.map((student, i) =>
        i === index
          ? {
              ...student,
              attendance:
                student.attendance === "Present" ? "Absent" : "Present",
            }
          : student,
      );
      console.log(updated); // Debug: See if attendance is toggling
      return updated;
    });
  };

  const handleSubmitAttendance = async () => {
    try {
      const meta = JSON.parse(localStorage.getItem("attendanceMeta"));
      if (!meta) {
        alert("Missing attendance meta info");
        return;
      }

      // Get ciannData from meta instead of separate localStorage item
      const ciannData = meta.ciannData;
      if (!ciannData) {
        alert("Missing CIANN data. Please select a CIANN first.");
        return;
      }

      if (!ciannData.ciannId) {
        alert("Missing CIANN ID. Please select a valid CIANN.");
        return;
      }

      if (students.length === 0) {
        alert("No students found. Please refresh and try again.");
        return;
      }

      const payload = {
        ...meta,
        students,
        ciannId: ciannData.ciannId,
      };
      console.log("Payload to be sent:", payload);

      const response = await axios.post(
        "http://localhost:5000/api/extra-pract",
        payload,
      );
      console.log("Response:", response.data);

      alert("Extra practical attendance submitted successfully!");
      localStorage.removeItem("attendanceMeta");

      // Navigate back or refresh
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Submission failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Submission failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleExport = () => {
    const data = students.map((student) => ({
      "Roll ID": student.rollId,
      Name: student.name,
      Mark: student.attendance === "Present" ? "✔" : "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "Student_Attendance.xlsx");
  };

  const toggleColumn = (column) => {
    setColumnsVisible((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handleGridView = () => setShowDropdown((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Extra Practical Attendance</h3>
        </div>

        {/* Subject Context Header */}
        {(() => {
          const metaString = localStorage.getItem("attendanceMeta");
          let meta = null;
          try {
            meta = metaString ? JSON.parse(metaString) : null;
          } catch (err) {
            console.error("Error parsing metadata:", err);
          }

          const ciannData = meta?.ciannData;
          return ciannData ? (
            <div
              className="subject-info"
              style={{
                backgroundColor: "#f0f7ff",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "8px",
                borderLeft: "4px solid #4CAF50",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "#2c5282" }}>
                {ciannData.subject?.name} - Extra Practical
              </h4>
              <p style={{ margin: "5px 0", fontSize: "14px" }}>
                <strong>Subject Code:</strong> {ciannData.subject?.code} |
                <strong> Division:</strong> {ciannData.division} |
                <strong> Batch:</strong> {meta.batch}
              </p>
              {meta.experiments && (
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Experiments:</strong> {meta.experiments}
                </p>
              )}
              {meta.actualDate && (
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Date:</strong> {meta.actualDate}
                </p>
              )}
            </div>
          ) : null;
        })()}

        <div className="toolbar toolbar-icons">
          <input type="text" placeholder="Search" className="search-input" />
          <button
            className="icon-btn"
            onClick={() => setArrowOpen((prev) => !prev)}
          >
            <i
              className={`bi ${arrowOpen ? "bi-chevron-up" : "bi-chevron-down"}`}
            ></i>
          </button>
          <button className="icon-btn" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowHeaders((prev) => !prev)}
          >
            <i className="bi bi-list"></i>
          </button>
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button className="icon-btn" onClick={handleGridView}>
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={columnsVisible.rollId}
                    onChange={() => toggleColumn("rollId")}
                  />
                  Roll ID
                </label>
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={columnsVisible.name}
                    onChange={() => toggleColumn("name")}
                  />
                  Name
                </label>
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={columnsVisible.mark}
                    onChange={() => toggleColumn("mark")}
                  />
                  Mark
                </label>
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={handleExport}>
            <i className="bi bi-box-arrow-down"></i>
          </button>
        </div>

        <div className="table-container">
          <table>
            {showHeaders && (
              <thead>
                <tr>
                  {columnsVisible.rollId && <th>Roll No</th>}
                  {columnsVisible.name && <th>Name</th>}
                  <th>Enrollment No</th>
                  <th>Batch</th>
                  {columnsVisible.mark && <th>Mark Present</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No students found for this batch and division.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={index}>
                    {columnsVisible.rollId && <td>{student.rollId}</td>}
                    {columnsVisible.name && <td>{student.name}</td>}
                    <td>{student.enrollmentNo}</td>
                    <td>{student.batch}</td>
                    {columnsVisible.mark && (
                      <td style={{ textAlign: "center" }}>
                        <label className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={student.attendance === "Present"}
                            onChange={() => toggleAttendance(index)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="submit-wrapper">
          <button className="submit-button" onClick={handleSubmitAttendance}>
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
