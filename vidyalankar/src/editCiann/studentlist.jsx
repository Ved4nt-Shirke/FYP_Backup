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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  // State for the secondary sidebar from your first code
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  const normalizeValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const getIdValue = (value) => {
    if (!value) return "";
    if (typeof value === "object") return value._id || value.id || "";
    return String(value);
  };

  const buildStudentQuery = () => {
    const params = new URLSearchParams();

    const divisionId = getIdValue(ciannData?.divisionId || ciannData?.division?._id);
    const courseId = getIdValue(ciannData?.courseId || ciannData?.course?._id);
    const departmentId = getIdValue(
      ciannData?.departmentId || ciannData?.department?._id,
    );
    const division = ciannData?.division || ciannData?.classDetails?.division;

    if (divisionId) params.append("divisionId", divisionId);
    if (courseId) params.append("courseId", courseId);
    if (departmentId) params.append("departmentId", departmentId);
    if (division && !divisionId) params.append("division", division);

    return params.toString();
  };

  const filterStudentsByCiann = (studentList) => {
    if (!ciannData) return studentList;

    const ciannDivisionId = getIdValue(ciannData?.divisionId || ciannData?.division?._id);
    const ciannCourseId = getIdValue(ciannData?.courseId || ciannData?.course?._id);
    const ciannDepartmentId = getIdValue(
      ciannData?.departmentId || ciannData?.department?._id,
    );
    const ciannDivision = normalizeValue(
      ciannData?.division || ciannData?.classDetails?.division,
    );
    const ciannClass = normalizeValue(ciannData?.class || ciannData?.className);
    const ciannDepartment = normalizeValue(
      ciannData?.department?.name || ciannData?.departmentName || ciannData?.department,
    );

    return studentList.filter((student) => {
      if (
        ciannDivisionId &&
        getIdValue(student?.divisionId) !== ciannDivisionId
      ) {
        return false;
      }

      if (ciannCourseId && getIdValue(student?.courseId) !== ciannCourseId) {
        return false;
      }

      if (
        ciannDepartmentId &&
        getIdValue(student?.departmentId) !== ciannDepartmentId
      ) {
        return false;
      }

      if (ciannDivision) {
        const studentDivision = normalizeValue(
          student?.divisionName || student?.division,
        );
        if (studentDivision !== ciannDivision) return false;
      }

      if (ciannClass) {
        const studentClass = normalizeValue(student?.className || student?.class);
        if (studentClass && studentClass !== ciannClass) return false;
      }

      if (ciannDepartment) {
        const studentDepartment = normalizeValue(
          student?.departmentName || student?.department,
        );
        if (studentDepartment && studentDepartment !== ciannDepartment)
          return false;
      }

      return true;
    });
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      const query = buildStudentQuery();
      const response = await fetch(
        query ? `${config.students}?${query}` : config.students,
      );
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      const studentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
          ? data.students
          : [];
      setStudents(filterStudentsByCiann(studentList));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [ciannData]);

  const handleAddStudent = async (student) => {
    setAddLoading(true);
    setAddError(null);
    try {
      const payload = {
        ...student,
        division:
          student.division || ciannData?.division || ciannData?.classDetails?.division || "",
      };

      const divisionId = getIdValue(ciannData?.divisionId || ciannData?.division?._id);
      const courseId = getIdValue(ciannData?.courseId || ciannData?.course?._id);
      const departmentId = getIdValue(
        ciannData?.departmentId || ciannData?.department?._id,
      );

      if (divisionId) payload.divisionId = divisionId;
      if (courseId) payload.courseId = courseId;
      if (departmentId) payload.departmentId = departmentId;

      const response = await fetch(config.students, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  return (
    <div className="student-layout">
      <Header
        showSearch={false}
        onMenuToggle={() => setIsSidebarVisible((v) => !v)}
        onSecondaryMenuToggle={() => setIsSecondarySidebarVisible((v) => !v)}
        hidePrimaryMenuToggleOnCompact={true}
        mobileHomePath="/dashboard"
      />
      <div
        className={`student-main-row ${isDesktop && isSidebarVisible ? "with-primary-sidebar" : ""}`}
      >
        <Sidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
          disableOnCompact={true}
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
              <h6>3. List of Student Enrollment & Roll ID</h6>
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
                    <th>Batch</th>
                    <th>Student Name</th>
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
                        <td data-label="Batch">
                          <span>{student.batch}</span>
                        </td>
                        <td data-label="Student Name">
                          <span>{student.studentName}</span>
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
