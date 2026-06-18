import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config/api";
import "./k3.css";

const formatUsername = (rawUsername) => {
  if (!rawUsername) {
    return "";
  }

  if (rawUsername.includes(".")) {
    return rawUsername
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
};

const normalizeMark = (mark, maxMarks) => {
  const numeric = Number(mark);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (maxMarks === 25) {
    return numeric;
  }
  if (numeric <= maxMarks) {
    return numeric;
  }
  return Math.round((numeric / 25) * maxMarks);
};

const K3Print = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData || null;
  const batch = location.state?.batch || "";
  const maxMarks = Number(location.state?.maxMarks || 25);

  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const facultyName = useMemo(() => {
    const username = localStorage.getItem("username") || "";
    return formatUsername(username) || "Faculty";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!ciannData || !batch) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const program = ciannData.department?.name || "";
      const className = ciannData.class || ciannData.division || "";
      const course = ciannData.subject?.name || "";

      let studentList = [];
      try {
        const studentsResult = await axios.get(config.students, {
          params: {
            batch,
            division: ciannData.division || undefined,
            academicYear: ciannData.academicYear || undefined,
            semester: ciannData.semester || undefined,
          },
        });
        studentList = Array.isArray(studentsResult.data)
          ? studentsResult.data
          : [];
        setStudents(studentList);
      } catch (err) {
        console.error("Error fetching students:", err);
      }

      if (studentList.length > 0) {
        try {
          const studentNames = studentList.map(
            (student) => student.studentName,
          );
          const assessmentResult = await axios.post(
            `${config.assessments}/by-students`,
            { studentNames },
          );
          const payload = assessmentResult.data;
          const data = Array.isArray(payload?.data) ? payload.data : [];
          setAssessments(data);
        } catch (err) {
          console.error("Error fetching assessments:", err);
        }
      }

      try {
        const experimentsResult = await axios.get(
          `${config.assessments}/get-experiments`,
          {
            params: {
              program,
              className,
              course,
            },
          },
        );
        const data = experimentsResult.data;
        const list = Array.isArray(data?.experiments) ? data.experiments : [];
        setExperiments(list);
      } catch (err) {
        console.error("Error fetching experiments:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [ciannData, batch]);

  const experimentColumns = useMemo(() => {
    const fromExperiments = experiments
      .map((exp) => {
        const number = Number(exp.practicalNo || exp.experimentNo || exp.number);
        if (!Number.isFinite(number)) {
          return null;
        }
        return {
          number,
          name: exp.practicalName || exp.experimentName || "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);

    if (fromExperiments.length > 0) {
      return fromExperiments;
    }

    const numbers = new Set();
    assessments.forEach((student) => {
      if (student.assessments && typeof student.assessments === "object") {
        Object.keys(student.assessments).forEach((key) => {
          const number = Number(key);
          if (Number.isFinite(number)) {
            numbers.add(number);
          }
        });
      }
    });

    return Array.from(numbers)
      .sort((a, b) => a - b)
      .map((number) => ({ number, name: "" }));
  }, [assessments, experiments]);

  const studentRows = useMemo(() => {
    const assessmentMap = new Map(
      assessments.map((student) => [student.studentName, student]),
    );

    const baseRows = students.length
      ? students
      : assessments.map((student) => ({
          rollNo: student.rollNo,
          enrollmentNo: "",
          studentName: student.studentName,
        }));

    const merged = baseRows.map((student) => {
      const assessment = assessmentMap.get(student.studentName) || {};
      return {
        ...student,
        assessments: assessment.assessments || {},
      };
    });

    return merged.sort((a, b) =>
      String(a.rollNo || "").localeCompare(String(b.rollNo || ""), undefined, {
        numeric: true,
      }),
    );
  }, [assessments, students]);

  const experimentCount = experimentColumns.length;

  if (!ciannData || !batch) {
    return (
      <div className="k3-page">
        <div className="k3-form-card">
          <h3>Missing Selection</h3>
          <p className="k3-error">
            CIANN or batch information is missing. Please select again.
          </p>
          <button
            className="btn btn-success"
            onClick={() => navigate("/msbte/k3")}
          >
            Back to CIANN list
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="k3-page">
        <div className="k3-form-card">
          <p>Loading K3 format...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k3-page">
        <div className="k3-form-card">
          <p className="k3-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="k3-print-container">
      <div className="k3-print-toolbar no-print">
        <div className="k3-toolbar-title">MSBTE FORMATS</div>
        <div className="k3-toolbar-actions">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Go back
          </button>
          <button className="btn btn-success" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="k3-sheet">
        <div className="k3-sheet-header">
          <div className="k3-sheet-title">
            <div className="k3-sheet-board">
              Maharashtra State Board of Technical Education
            </div>
            <div className="k3-sheet-subtitle">
              FORMATIVE ASSESSMENT OF PRACTICAL (FA-PA)
            </div>
          </div>
          <div className="k3-sheet-format">Format K3</div>
        </div>

        <div className="k3-meta">
          <div>
            <strong>Academic Year:</strong> {ciannData.academicYear || ""}
          </div>
          <div>
            <strong>Course and Code:</strong> {ciannData.class || ""}
          </div>
          <div>
            <strong>Subject and Code:</strong> {ciannData.subject?.name || ""} (
            {ciannData.subject?.code || ""})
          </div>
          <div>
            <strong>Name of Faculty:</strong> {facultyName}
          </div>
          <div>
            <strong>Batch:</strong> {batch}
          </div>
          <div>
            <strong>Division:</strong> {ciannData.division || ""}
          </div>
        </div>

        <table className="k3-table">
          <thead>
            <tr>
              <th rowSpan={2}>Roll No.</th>
              <th rowSpan={2}>Enrollment Number</th>
              <th rowSpan={2}>Exam Seat No.</th>
              <th rowSpan={2}>Name of the Student</th>
              <th colSpan={experimentCount || 1}>
                Experiment / Practical / Tutorial (Marks out of {maxMarks} per
                experiment)
              </th>
              <th rowSpan={2}>
                Total Marks (out of {maxMarks * (experimentCount || 1)})
              </th>
              <th rowSpan={2}>
                FA Marks of Practical Converted (Max Marks 25)
              </th>
              <th rowSpan={2}>Signature of Student</th>
            </tr>
            <tr>
              {experimentCount > 0 ? (
                experimentColumns.map((column) => (
                  <th key={column.number}>
                    {String(column.number).padStart(2, "0")}
                  </th>
                ))
              ) : (
                <th>--</th>
              )}
            </tr>
          </thead>
          <tbody>
            {studentRows.length === 0 ? (
              <tr>
                <td colSpan={7 + (experimentCount || 1)} className="k3-empty">
                  No student data available.
                </td>
              </tr>
            ) : (
              studentRows.map((student) => {
                const totalMarks = experimentColumns.reduce((sum, column) => {
                  const raw = student.assessments?.[column.number]?.marks;
                  const normalized = normalizeMark(raw, maxMarks);
                  return sum + (Number.isFinite(normalized) ? normalized : 0);
                }, 0);

                const convertedMarks = experimentCount
                  ? (totalMarks / (maxMarks * experimentCount)) * 25
                  : 0;

                return (
                  <tr key={`${student.rollNo}-${student.studentName}`}>
                    <td>{student.rollNo || "-"}</td>
                    <td>{student.enrollmentNo || "-"}</td>
                    <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                    <td className="k3-name">{student.studentName || "-"}</td>
                    {experimentCount > 0 ? (
                      experimentColumns.map((column) => {
                        const raw = student.assessments?.[column.number]?.marks;
                        const normalized = normalizeMark(raw, maxMarks);
                        return (
                          <td key={`${student.studentName}-${column.number}`}>
                            {Number.isFinite(normalized) ? normalized : "-"}
                          </td>
                        );
                      })
                    ) : (
                      <td>-</td>
                    )}
                    <td>{experimentCount > 0 ? totalMarks : "-"}</td>
                    <td>
                      {experimentCount > 0
                        ? Math.round(convertedMarks)
                        : "-"}
                    </td>
                    <td></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="k3-signature-row">
          <div>
            <strong>{facultyName}</strong>
            <div className="k3-sign-label">(Name & Signature of Faculty)</div>
          </div>
          <div>
            <strong>_________________________</strong>
            <div className="k3-sign-label">(Name & Signature of HoD)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default K3Print;
