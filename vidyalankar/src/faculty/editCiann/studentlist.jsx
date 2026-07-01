import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { config } from "../../config/api";
import SecondarySidebar from "./SecondarySidebar"; // Added import
import "./studentlist.css";
import "./EditCiannModern.css";

function Studentlist() {
  const location = useLocation();
  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for the secondary sidebar from your first code
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  useEffect(() => {
    // This logic for managing CiaanData is from your original file
    if (!CiaanData) {
      const storedCiaanData =
        sessionStorage.getItem("currentCiaanData") ||
        localStorage.getItem("CiaanData");
      if (storedCiaanData) {
        try {
          const parsedData = JSON.parse(storedCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }
    } else {
      sessionStorage.setItem("currentCiaanData", JSON.stringify(CiaanData));
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    }
  }, [CiaanData]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (CiaanData?.division) {
        query.set("division", CiaanData.division);
      }
      if (CiaanData?.academicYear) {
        query.set("academicYear", CiaanData.academicYear);
      }
      if (CiaanData?.semester) {
        query.set("semester", CiaanData.semester);
      }
      const deptId = CiaanData?.department?._id || CiaanData?.department;
      if (deptId) {
        query.set("departmentId", deptId);
      }

      const endpoint = query.toString()
        ? `${config.students}?${query.toString()}`
        : config.students;

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [CiaanData?.division]);

  return (
    <div className="student-layout">
      <div className="student-main-row">
        <div className="student-secondary-sidebar-wrapper">
          <SecondarySidebar
            CiaanData={CiaanData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>

        <div className="student-main-content">
          <div className="studentlist-container">
            <div className="header-with-button">
              <h6>4. List of Student Enrollment & Roll ID</h6>
            </div>

            <div className="table-responsive-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="text-center text-danger">
                        {error}
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => (
                      <tr key={student._id || index}>
                        <td data-label="Roll No">
                          <span>{student.rollNo}</span>
                        </td>
                        <td data-label="Enrollment No">
                          <span>{student.enrollmentNo}</span>
                        </td>
                        <td data-label="Student Name">
                          <span>{student.studentName}</span>
                        </td>
                        <td data-label="Batch">
                          <span>{student.batch}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-buttons">
              <button className="btn">← Previous</button>
              <button className="btn">Forward →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Studentlist;
