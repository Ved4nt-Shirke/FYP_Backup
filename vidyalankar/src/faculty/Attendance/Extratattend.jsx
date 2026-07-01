import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./TheoryEdit.css";

const StudentAttendance = () => {
  const { id } = useParams(); // document ID from URL

  const [students, setStudents] = useState([]); // State to hold students from DB
  const [attendanceRecord, setAttendanceRecord] = useState(null); // State to hold attendance record details
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({
    rollId: true,
    name: true,
    mark: true,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [arrowOpen, setArrowOpen] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch attendance record and students when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch the attendance record with CIAAN data
        const attendanceResponse = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/${id}`,
        );
        if (!attendanceResponse.ok) {
          throw new Error("Failed to fetch attendance record");
        }
        const attendanceData = await attendanceResponse.json();
        setAttendanceRecord(attendanceData);

        // Fetch students filtered by division if available from Ciaan
        const params = new URLSearchParams();
        if (attendanceData.CiaanId) {
          // Try to get CIAAN data to filter by division
          try {
            const CiaanResponse = await fetch(
              `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/Ciaans`,
            );
            if (CiaanResponse.ok) {
              const Ciaans = await CiaanResponse.json();
              const Ciaan = Ciaans.find(
                (c) => c.CiaanId === attendanceData.CiaanId,
              );
              if (Ciaan?.division) {
                params.append("division", Ciaan.division);
              }
            }
          } catch (CiaanError) {
            console.warn(
              "Could not fetch CIAAN data for filtering:",
              CiaanError,
            );
          }
        }

        const studentsResponse = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students?${params.toString()}`,
        );
        if (!studentsResponse.ok) {
          throw new Error("Failed to fetch students");
        }
        const studentsData = await studentsResponse.json();

        // Map DB fields with enriched data
        const formattedStudents = studentsData.map((student) => ({
          rollId: student.rollNo,
          name: student.studentName,
          enrollmentNo: student.enrollmentNo || "N/A",
          batch: student.batch || "N/A",
        }));
        setStudents(formattedStudents);

        // Initialize attendance status from existing data
        const initialStatus = {};
        attendanceData.students.forEach((student) => {
          initialStatus[student.rollId] = student.attendance === "Present";
        });
        setAttendanceStatus(initialStatus);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleCheckboxChange = async (rollId, name, isChecked) => {
    // Update local state immediately for better UX
    setAttendanceStatus((prev) => ({
      ...prev,
      [rollId]: isChecked,
    }));

    try {
      // Update individual student attendance in database
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/${id}/mark`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollId, name, present: isChecked }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update attendance");
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Failed to update attendance.");
      // Revert the local state change if the API call failed
      setAttendanceStatus((prev) => ({
        ...prev,
        [rollId]: !isChecked,
      }));
    }
  };

  const handleExportCSV = () => {
    const headers = [];
    if (visibleColumns.rollId) headers.push("Roll ID");
    if (visibleColumns.name) headers.push("Name");
    if (visibleColumns.mark) headers.push("Present");

    // Use the 'students' state variable instead of the old hardcoded list
    const rows = students.map((student) => {
      const row = [];
      if (visibleColumns.rollId) row.push(student.rollId);
      if (visibleColumns.name) row.push(student.name);
      if (visibleColumns.mark) {
        row.push(attendanceStatus[student.rollId] ? "Present" : "Absent");
      }
      return row.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "attendance.csv";
    link.click();
  };

  const toggleColumn = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleGridView = () => {
    // Implement grid view toggle logic here if needed
  };

  const handleFinalSubmit = async () => {
    try {
      const presentCount = Object.values(attendanceStatus).filter(
        (status) => status,
      ).length;
      const absentCount = students.length - presentCount;

      // Show confirmation dialog
      const confirmMessage = `Are you sure you want to submit the attendance?\n\nSummary:\n• Present: ${presentCount} students\n• Absent: ${absentCount} students\n• Total: ${students.length} students\n\nThis will save ALL students (including absent ones) to the database.`;

      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }

      // Mark all students (including absent ones) using individual API calls
      const markingPromises = students.map(async (student) => {
        const isPresent = attendanceStatus[student.rollId] || false;

        try {
          const response = await fetch(
            `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/${id}/mark`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rollId: student.rollId,
                name: student.name,
                present: isPresent,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to mark ${student.name}`);
          }

          return { success: true, student: student.name };
        } catch (error) {
          console.error(`Error marking ${student.name}:`, error);
          return { success: false, student: student.name, error };
        }
      });

      // Wait for all marking operations to complete
      const results = await Promise.all(markingPromises);

      // Check if any failed
      const failed = results.filter((result) => !result.success);

      if (failed.length > 0) {
        console.error("Some students failed to be marked:", failed);
        alert(
          `Warning: ${failed.length} students could not be marked. Please try again.`,
        );
      } else {
        alert(
          `✅ Attendance has been saved successfully!\n\n📊 Final Summary:\n• Present: ${presentCount} students\n• Absent: ${absentCount} students\n• Total: ${students.length} students\n\n✅ All students (including absent ones) have been recorded in the database.`,
        );
      }

      // Optionally navigate back or to another page
      // navigate('/extra-theory-Ciaan-cards');
    } catch (error) {
      console.error("Error in final submission:", error);
      alert("Error in final submission. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="timetable-main-content">
        <div className="theory-attendance-container">
          <div className="header-row">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!attendanceRecord) {
    return (
      <div className="timetable-main-content">
        <div className="theory-attendance-container">
          <div className="header-row">
            <h3>Attendance record not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Extra Theory Attendance</h3>
        </div>

        {/* Subject Context Header */}
        {attendanceRecord && (
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
              Extra Theory
            </h4>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>CIAAN ID:</strong> {attendanceRecord.CiaanId}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Topic:</strong> {attendanceRecord.topic}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Date:</strong>{" "}
              {new Date(attendanceRecord.date).toLocaleDateString()}
            </p>
          </div>
        )}

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
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={handleGridView}>
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={visibleColumns.rollId}
                    onChange={() => toggleColumn("rollId")}
                  />
                  Roll ID
                </label>
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={visibleColumns.name}
                    onChange={() => toggleColumn("name")}
                  />
                  Name
                </label>
                <label className="dropdown-label">
                  <input
                    type="checkbox"
                    checked={visibleColumns.mark}
                    onChange={() => toggleColumn("mark")}
                  />
                  Mark
                </label>
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={handleExportCSV}>
            <i className="bi bi-box-arrow-down"></i>
          </button>
        </div>

        <div className="table-container">
          <table>
            {showHeaders && (
              <thead>
                <tr>
                  {visibleColumns.rollId && <th>Roll No</th>}
                  {visibleColumns.name && <th>Name</th>}
                  <th>Enrollment No</th>
                  <th>Batch</th>
                  {visibleColumns.mark && <th>Mark Present</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No students found for this division.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.rollId}>
                    {visibleColumns.rollId && <td>{student.rollId}</td>}
                    {visibleColumns.name && <td>{student.name}</td>}
                    <td>{student.enrollmentNo}</td>
                    <td>{student.batch}</td>
                    {visibleColumns.mark && (
                      <td style={{ textAlign: "center" }}>
                        <label className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={attendanceStatus[student.rollId] || false}
                            onChange={(e) =>
                              handleCheckboxChange(
                                student.rollId,
                                student.name,
                                e.target.checked,
                              )
                            }
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
          <button className="submit-button" onClick={handleFinalSubmit}>
            Submit Final Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
