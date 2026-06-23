import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../../config/api";
import AddPracticalModal from "./Course3";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import "../editCiann/EditCiannModern.css";
import "./CourseTableShared.css";

const PracticalTable = () => {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ciannData, setCiannData] = useState(null);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(false);
  const [program, setProgram] = useState("");
  const [className, setClassName] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => {
    let resolvedCiann = location.state?.ciannData;
    if (!resolvedCiann) {
      const stored = sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData");
      if (stored) {
        try {
          resolvedCiann = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing stored ciannData", e);
        }
      }
    }
    setCiannData(resolvedCiann);

    // Extract program, className, course from search query params
    const searchParams = new URLSearchParams(location.search);
    const qProgram = searchParams.get("program");
    const qClassName = searchParams.get("className");
    const qCourse = searchParams.get("course");

    if (qProgram && qClassName && qCourse) {
      setProgram(qProgram);
      setClassName(qClassName);
      setCourse(qCourse);
    } else if (resolvedCiann) {
      // Otherwise extract from ciannData
      const extractValue = (data, ...possibleKeys) => {
        if (!data) return null;
        for (const key of possibleKeys) {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (typeof value === "object" && value.name) {
              return value.name;
            } else if (typeof value === "object" && value.code) {
              return value.code;
            } else if (typeof value === "string") {
              return value;
            }
          }
        }
        return null;
      };

      let prog = extractValue(resolvedCiann, "department", "dept", "departmentName", "Department", "DEPARTMENT", "branch", "Branch", "stream", "Stream") || "N/A";
      if (prog === "N/A" || typeof prog !== "string") {
        const nestedDept = resolvedCiann?.academicInfo?.department || resolvedCiann?.courseDetails?.department || resolvedCiann?.details?.department || resolvedCiann?.info?.department || resolvedCiann?.subjectDetails?.department || resolvedCiann?.class?.department || resolvedCiann?.subject?.department;
        if (nestedDept) {
          if (typeof nestedDept === "object" && nestedDept.name) prog = nestedDept.name;
          else if (typeof nestedDept === "string") prog = nestedDept;
        }
      }
      if (typeof prog === "object" && prog !== null) prog = prog.name || prog.label || "N/A";

      let cls = extractValue(resolvedCiann, "className", "class", "classname", "Class", "ClassName", "semester", "year") || "N/A";
      if (cls === "N/A") cls = resolvedCiann?.classDetails?.className || resolvedCiann?.class?.name || resolvedCiann?.class || resolvedCiann?.academicInfo?.class || "N/A";
      if (typeof cls === "object" && cls !== null) cls = cls.name || cls.label || "N/A";

      let crs = extractValue(resolvedCiann, "subjectName", "subject", "subjectname", "Subject", "SubjectName", "title", "courseName", "name") || "N/A";
      if (crs === "N/A") crs = resolvedCiann?.subjectDetails?.name || resolvedCiann?.subject?.name || resolvedCiann?.subject || resolvedCiann?.courseInfo?.subject || "N/A";
      if (typeof crs === "object" && crs !== null) crs = crs.name || crs.label || "N/A";

      setProgram(prog);
      setClassName(cls);
      setCourse(crs);
    }
  }, [location]);

  const handleAddPractical = async (newPracticalData) => {
    const payload = {
      ...newPracticalData,
      program,
      className,
      course,
    };

    try {
      const response = await axios.post(
        `${config.course.experiments}/add-experiment`,
        payload,
      );

      if (response.data.success) {
        setPracticals((prev) => [...prev, newPracticalData].sort((a, b) => Number(a.practicalNo) - Number(b.practicalNo)));
        setIsModalOpen(false);
        alert("Practical added successfully!");
      } else {
        alert("Failed to add practical: " + response.data.message);
      }
    } catch (error) {
      console.error("Error submitting new practical:", error);
      alert("An error occurred while adding the practical.");
    }
  };

  useEffect(() => {
    if (program && className && course) {
      const fetchExperiments = async () => {
        try {
          const response = await axios.post(config.course.experiments, {
            program,
            className,
            course,
          });

          if (response.data.success) {
            setPracticals((response.data.experiments || []).sort((a, b) => Number(a.practicalNo) - Number(b.practicalNo)));
          } else {
            setPracticals([]);
          }
        } catch (err) {
          console.error("Error fetching experiments:", err);
          setPracticals([]);
        } finally {
          setLoading(false);
        }
      };

      fetchExperiments();
    } else {
      setLoading(false);
    }
  }, [program, className, course]);

  const handleEditClick = (practicalToEdit) => {
    const searchParams = new URLSearchParams({
      program,
      className,
      course,
      practicalNo: practicalToEdit.practicalNo,
      practicalName: practicalToEdit.practicalName,
    }).toString();

    navigate(`/course4?${searchParams}`);
  };

  if (loading) {
    return (
      <div className="timetable-layout">
        <div className="timetable-main-row">
          <div className="timetable-secondary-sidebar-wrapper">
            <SecondarySidebar
              ciannData={ciannData}
              isSecondarySidebarVisible={isSecondarySidebarVisible}
              setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
            />
          </div>
          <div className="timetable-main-content d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading Practicals...</span>
              </div>
              <p className="mt-3 text-muted">Loading Practical Syllabus Data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-layout">
      <div className="timetable-main-row">
        <div className="timetable-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="timetable-main-content">
          <div className="plan-container p-4">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">Practical Syllabus Data</h2>
                <p className="text-secondary mb-0">
                  Manage practical syllabus for <strong>{course || "Active Course"}</strong> ({className || "N/A"})
                </p>
              </div>
              <button
                className="btn btn-info rounded-pill px-4 fw-bold text-white shadow-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="bi bi-plus-lg me-2"></i> Add Practical
              </button>
            </div>

            <div className="table-wrapper shadow-sm rounded-4 overflow-hidden mb-4">
              <table className="practical-table table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "20%", textAlign: "center" }}>Practical No.</th>
                    <th style={{ width: "60%", textAlign: "left" }}>Practical Name</th>
                    <th style={{ width: "20%" }} className="setting-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {practicals.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    practicals.map((practical, index) => (
                      <tr key={index}>
                        <td className="fw-semibold text-dark text-center">{practical.practicalNo}</td>
                        <td className="text-secondary fw-semibold text-start" style={{ textAlign: "left" }}>{practical.practicalName}</td>
                        <td className="setting-cell">
                          <button
                            className="edit-btn btn btn-sm btn-outline-primary border-0"
                            onClick={() => handleEditClick(practical)}
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <AddPracticalModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleAddPractical}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticalTable;
