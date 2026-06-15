import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import Sidebar from "../../basic/Sidebar";
import "./MSBTEPages.css";

const AttendanceReport = () => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceType, setAttendanceType] = useState("theory");

  // Fetch students on component load
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/students`,
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  const handleDownloadReport = () => {
    alert(`${attendanceType.toUpperCase()} Attendance Report downloaded!`);
  };

  return (
    <>
      <Header onMenuToggle={() => setIsSidebarVisible(!isSidebarVisible)} />
      <Sidebar
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
      />
      <div className="main-content">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <h3 className="mb-4">Attendance Report</h3>

        <div className="mb-3">
          <label className="form-label fw-bold">Attendance Type:</label>
          <select
            className="form-select"
            value={attendanceType}
            onChange={(e) => setAttendanceType(e.target.value)}
          >
            <option value="theory">Theory Attendance</option>
            <option value="practical">Practical Attendance</option>
            <option value="tutorial">Tutorial Attendance</option>
            <option value="extra">Extra-curricular Sessions</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll ID</th>
                <th>Name</th>
                <th>Seat No.</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.rollNo || student.rollId || student.regNumber || "-"}</td>
                    <td>{student.studentName || student.name || "-"}</td>
                    <td>{student.seatNo || "-"}</td>
                    <td className="text-center">30</td>
                    <td className="text-center">25</td>
                    <td className="text-center">5</td>
                    <td className="text-center">83.33%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            className="btn btn-success me-2"
            onClick={handleDownloadReport}
          >
            <i className="bi bi-download"></i> Download Report
          </button>
          <button className="btn btn-info me-2" onClick={() => window.print()}>
            <i className="bi bi-printer-fill"></i> Print
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default AttendanceReport;
