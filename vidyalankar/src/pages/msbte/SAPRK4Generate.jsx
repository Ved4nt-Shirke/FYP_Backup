import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import Sidebar from "../../basic/Sidebar";
import "./MSBTEPages.css";

const SAPRK4Generate = () => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [students, setStudents] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState("");
  const [marksByExperiment, setMarksByExperiment] = useState({});
  const [headerInfo, setHeaderInfo] = useState({
    academicYear: "2025 - 2026",
    courseAndCode: "C05K-A",
    subjectAndCode: "CLOUD COMPUTING (315325)",
    maxMarks: "",
    minMarks: "",
    examDate: "",
    program: "",
    className: "",
    course: "",
  });

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

  useEffect(() => {
    if (!students.length) return;
    const first = students[0] || {};
    const derivedProgram = first.departmentName || first.departmentCode || "";
    const derivedClass = first.className || "";
    const derivedCourse = first.courseName || "";
    const derivedCourseAndCode =
      derivedCourse && derivedClass
        ? `${derivedCourse} - ${derivedClass}`
        : derivedCourse || derivedClass;

    setHeaderInfo((prev) => ({
      ...prev,
      program: prev.program || derivedProgram,
      className: prev.className || derivedClass,
      course: prev.course || derivedCourse,
      courseAndCode: prev.courseAndCode || derivedCourseAndCode,
    }));
  }, [students]);

  const academicYearOptions = useMemo(() => {
    const options = new Set();
    students.forEach((student) => {
      if (student.batch) {
        options.add(student.batch);
      }
    });
    if (options.size === 0 && headerInfo.academicYear) {
      options.add(headerInfo.academicYear);
    }
    return Array.from(options);
  }, [students, headerInfo.academicYear]);

  const programOptions = useMemo(() => {
    const options = new Set();
    students.forEach((student) => {
      if (student.departmentName) {
        options.add(student.departmentName);
      } else if (student.departmentCode) {
        options.add(student.departmentCode);
      }
    });
    if (options.size === 0 && headerInfo.program) {
      options.add(headerInfo.program);
    }
    return Array.from(options);
  }, [students, headerInfo.program]);

  const classOptions = useMemo(() => {
    const options = new Set();
    students.forEach((student) => {
      if (student.className) {
        options.add(student.className);
      }
    });
    if (options.size === 0 && headerInfo.className) {
      options.add(headerInfo.className);
    }
    return Array.from(options);
  }, [students, headerInfo.className]);

  const courseOptions = useMemo(() => {
    const options = new Set();
    students.forEach((student) => {
      if (student.courseName) {
        options.add(student.courseName);
      }
    });
    if (options.size === 0 && headerInfo.course) {
      options.add(headerInfo.course);
    }
    return Array.from(options);
  }, [students, headerInfo.course]);

  const courseAndCodeOptions = useMemo(() => {
    const options = new Set();
    students.forEach((student) => {
      const derivedCourse = student.courseName || "";
      const derivedClass = student.className || "";
      const combined =
        derivedCourse && derivedClass
          ? `${derivedCourse} - ${derivedClass}`
          : derivedCourse || derivedClass;
      if (combined) {
        options.add(combined);
      }
    });
    if (options.size === 0 && headerInfo.courseAndCode) {
      options.add(headerInfo.courseAndCode);
    }
    return Array.from(options);
  }, [students, headerInfo.courseAndCode]);

  const subjectOptions = useMemo(() => {
    const options = new Set();
    if (headerInfo.subjectAndCode) {
      options.add(headerInfo.subjectAndCode);
    }
    return Array.from(options);
  }, [headerInfo.subjectAndCode]);

  const handleHeaderChange = (field, value) => {
    setHeaderInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFetchExperiments = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/get-experiments/get-experiments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program: headerInfo.program,
            className: headerInfo.className,
            course: headerInfo.course,
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
        if (data.experiments && data.experiments.length > 0) {
          const firstId = String(data.experiments[0].practicalNo || 1);
          setSelectedExperiment(firstId);
        }
      }
    } catch (error) {
      console.error("Error fetching experiments:", error);
    }
  };

  useEffect(() => {
    if (!headerInfo.program || !headerInfo.className || !headerInfo.course) {
      return;
    }
    if (experiments.length > 0) return;
    handleFetchExperiments();
  }, [headerInfo.program, headerInfo.className, headerInfo.course]);

  const handleMarksChange = (studentId, value) => {
    if (!selectedExperiment) return;
    setMarksByExperiment((prev) => {
      const experimentMarks = { ...(prev[selectedExperiment] || {}) };
      experimentMarks[studentId] = value;
      return {
        ...prev,
        [selectedExperiment]: experimentMarks,
      };
    });
  };

  const averageByStudent = useMemo(() => {
    const averages = {};
    students.forEach((student) => {
      let sum = 0;
      let count = 0;
      Object.values(marksByExperiment).forEach((expMarks) => {
        const raw = expMarks?.[student._id];
        const value = Number(raw);
        if (!Number.isNaN(value) && raw !== "") {
          sum += value;
          count += 1;
        }
      });
      averages[student._id] = count > 0 ? (sum / count).toFixed(2) : "";
    });
    return averages;
  }, [students, marksByExperiment]);

  const handleSubmit = () => {
    alert("SA-PR sheet data prepared. Please review the MSBTE format below.");
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

        <h3 className="mb-4">Generate SA-PR Sheet</h3>

        <div className="msbte-controls">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Academic Year</label>
              <select
                className="form-select"
                value={headerInfo.academicYear}
                onChange={(e) =>
                  handleHeaderChange("academicYear", e.target.value)
                }
              >
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Course and Code</label>
              <select
                className="form-select"
                value={headerInfo.courseAndCode}
                onChange={(e) =>
                  handleHeaderChange("courseAndCode", e.target.value)
                }
              >
                {courseAndCodeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Subject and Code</label>
              <select
                className="form-select"
                value={headerInfo.subjectAndCode}
                onChange={(e) =>
                  handleHeaderChange("subjectAndCode", e.target.value)
                }
              >
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Marks: Max</label>
              <input
                type="number"
                className="form-control"
                value={headerInfo.maxMarks}
                onChange={(e) => handleHeaderChange("maxMarks", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Marks: Min</label>
              <input
                type="number"
                className="form-control"
                value={headerInfo.minMarks}
                onChange={(e) => handleHeaderChange("minMarks", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Date of Examination</label>
              <input
                type="date"
                className="form-control"
                value={headerInfo.examDate}
                onChange={(e) => handleHeaderChange("examDate", e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-4">
              <label className="form-label">Program</label>
              <select
                className="form-select"
                value={headerInfo.program}
                onChange={(e) => handleHeaderChange("program", e.target.value)}
              >
                {programOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Class</label>
              <select
                className="form-select"
                value={headerInfo.className}
                onChange={(e) =>
                  handleHeaderChange("className", e.target.value)
                }
              >
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Course</label>
              <select
                className="form-select"
                value={headerInfo.course}
                onChange={(e) => handleHeaderChange("course", e.target.value)}
              >
                {courseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 d-flex align-items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={handleFetchExperiments}
            >
              Load Practicals
            </button>
            <select
              className="form-select w-auto"
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
            >
              <option value="">Select Practical</option>
              {experiments.map((exp) => (
                <option key={exp.practicalNo} value={String(exp.practicalNo)}>
                  {`Practical ${exp.practicalNo} - ${exp.practicalName}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive mt-4">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll No.</th>
                <th>Enrollment Number</th>
                <th>Name</th>
                <th>Exam Seat No.</th>
                <th>Marks (Selected Practical)</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.rollNo || "-"}</td>
                    <td>{student.enrollmentNo || "-"}</td>
                    <td>{student.studentName || "-"}</td>
                    <td>{student.examSeatNo || "-"}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="0"
                        value={
                          marksByExperiment?.[selectedExperiment]?.[
                            student._id
                          ] || ""
                        }
                        onChange={(e) =>
                          handleMarksChange(student._id, e.target.value)
                        }
                        min="0"
                        max={headerInfo.maxMarks || "100"}
                        disabled={!selectedExperiment}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <button className="btn btn-primary me-2" onClick={handleSubmit}>
            <i className="bi bi-download"></i> Generate Sheet
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>

        <div className="msbte-preview mt-4">
          <div className="msbte-header">
            <div className="msbte-title">
              Maharashtra State Board of Technical Education
            </div>
            <div className="msbte-subtitle">
              Summative Assessment of Practical (SA-PR)
            </div>
            <div className="msbte-format">Format K4</div>
          </div>
          <div className="msbte-meta">
            <div>
              <strong>Academic Year:</strong> {headerInfo.academicYear || "-"}
            </div>
            <div>
              <strong>Course and Code:</strong>{" "}
              {headerInfo.courseAndCode || "-"}
            </div>
            <div>
              <strong>Subject and Code:</strong>{" "}
              {headerInfo.subjectAndCode || "-"}
            </div>
            <div>
              <strong>Marks:</strong> Max {headerInfo.maxMarks || "-"} Min{" "}
              {headerInfo.minMarks || "-"}
            </div>
            <div>
              <strong>Date of Examination:</strong> {headerInfo.examDate || "-"}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered msbte-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Enrollment Number</th>
                  <th>Name of the Student</th>
                  <th>Exam Seat No.</th>
                  <th>Marks obtained in SA part of Practical (Avg)</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.rollNo || "-"}</td>
                      <td>{student.enrollmentNo || "-"}</td>
                      <td>{student.studentName || "-"}</td>
                      <td>{student.examSeatNo || "-"}</td>
                      <td>{averageByStudent[student._id] || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default SAPRK4Generate;
