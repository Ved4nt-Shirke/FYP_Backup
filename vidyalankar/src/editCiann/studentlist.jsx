import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { config } from "../config/api";
import Sidebar from "../basic/Sidebar";
import SecondarySidebar from "./SecondarySidebar"; // Added import
import Header from "../basic/Header";
import "./studentlist.css";
import StudentDetails from "./StudentDetails";

function Studentlist() {
  const location = useLocation();
  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
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
      const response = await fetch(config.students);
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
  }, []);

  const handleAddStudent = async (student) => {
    setAddLoading(true);
    setAddError(null);
    try {
      const response = await fetch(config.students, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to add student");
      }
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      const response = await fetch(`${config.students}/${studentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Failed to delete student: ${response.status} ${response.statusText}`;
        try {
          const errData = JSON.parse(text);
          errorMessage = errData.message || errorMessage;
        } catch (e) {
          errorMessage += ` - Server returned: ${text.substring(0, 50)}...`;
        }
        throw new Error(errorMessage);
      }
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err.message);
      alert("Error deleting student: " + err.message);
    }
  };

  return (
    <div className="student-layout">
      <Header
        showSearch={false}
        onMenuToggle={() => setIsSidebarVisible((v) => !v)}
        // Added the toggle prop for the secondary sidebar
        onSecondaryMenuToggle={() => setIsSecondarySidebarVisible((v) => !v)}
      />
      <div className="student-main-row">
        <Sidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
        />

        {/* Added the Secondary Sidebar component and its wrapper */}
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
              <button
                className="btn btn-add-student"
                onClick={() => setShowForm(true)}
              >
                Add Student
              </button>
            </div>

            {addError && (
              <div className="alert alert-danger py-1">{addError}</div>
            )}

            <div className="table-responsive-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="text-center text-danger">
                        {error}
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
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
                        <td data-label="Action">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteStudent(student._id)}
                          >
                            Delete
                          </button>
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

          {showForm && (
            <StudentDetails
              onClose={() => setShowForm(false)}
              onSubmit={handleAddStudent}
            />
          )}

          {addLoading && (
            <div className="loading-overlay">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Studentlist;
