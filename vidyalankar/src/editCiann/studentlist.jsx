import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { config } from "../config/api";
import SecondarySidebar from "./SecondarySidebar"; // Added import
import "./studentlist.css";
import "./EditCiannModern.css";

function Studentlist() {
  const location = useLocation();
  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for the secondary sidebar from your first code
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  useEffect(() => {
    // This logic for managing ciannData is from your original file
    if (!ciannData) {
      const storedCiannData =
        sessionStorage.getItem("currentCiannData") ||
        localStorage.getItem("ciannData");
      if (storedCiannData) {
        try {
          const parsedData = JSON.parse(storedCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }
    } else {
      sessionStorage.setItem("currentCiannData", JSON.stringify(ciannData));
      localStorage.setItem("ciannData", JSON.stringify(ciannData));
    }
  }, [ciannData]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (ciannData?.division) {
        query.set("division", ciannData.division);
      }
      if (ciannData?.academicYear) {
        query.set("academicYear", ciannData.academicYear);
      }
      const deptId = ciannData?.department?._id || ciannData?.department;
      if (deptId) {
        query.set("departmentId", deptId);
      }

      const endpoint = query.toString()
        ? `${config.students}?${query.toString()}`
        : config.students;

      const response = await fetch(endpoint);
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
  }, [ciannData?.division]);

  return (
    <div className="student-layout">
      <div className="student-main-row">
        <div className="student-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
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
