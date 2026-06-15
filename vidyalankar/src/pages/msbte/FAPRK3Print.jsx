import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./K3Pages.css";

const formatUsername = (rawUsername) => {
  if (!rawUsername) return "";
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
  if (!Number.isFinite(numeric)) return null;
  if (maxMarks === 25) return numeric;
  if (numeric <= maxMarks) return numeric;
  return Math.round((numeric / 25) * maxMarks);
};

const FAPRK3Print = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData || null;
  const batch = location.state?.batch || "";
  const maxMarks = Number(location.state?.maxMarks || 25);

  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  const facultyName = useMemo(() => {
    const username = localStorage.getItem("username") || "";
    return formatUsername(username) || "Faculty";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!ciannData) {
          setLoading(false);
          return;
        }

        const query = new URLSearchParams();
        if (batch) query.set("batch", batch);
        if (ciannData?.division) query.set("division", ciannData.division);
        if (ciannData?.department?._id) {
          query.set("departmentId", ciannData.department._id);
        }

        const studentsResponse = await fetch(
          query.toString() ? `${config.students}?${query.toString()}` : config.students,
        );
        const studentsData = await studentsResponse.json();
        const studentList = Array.isArray(studentsData) ? studentsData : [];
        setStudents(studentList);

        if (studentList.length > 0) {
          const studentNames = studentList.map((student) => student.studentName);
          const assessmentsResponse = await fetch(`${config.assessments}/by-students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentNames }),
          });
          const assessmentsData = await assessmentsResponse.json();
          const list = Array.isArray(assessmentsData?.data) ? assessmentsData.data : [];
          setAssessments(list);
        }

        const program = ciannData?.department?.name || "";
        const className = ciannData?.class || ciannData?.division || "";
        const course = ciannData?.subject?.name || "";

        const experimentsQuery = new URLSearchParams();
        if (program) experimentsQuery.set("program", program);
        if (className) experimentsQuery.set("className", className);
        if (course) experimentsQuery.set("course", course);

        const experimentsResponse = await fetch(
          `${config.assessments}/get-experiments?${experimentsQuery.toString()}`,
        );
        const experimentsData = await experimentsResponse.json();
        setExperiments(Array.isArray(experimentsData?.experiments) ? experimentsData.experiments : []);
      } catch (error) {
        console.error("Error preparing K3 print:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batch, ciannData]);

  const experimentColumns = useMemo(() => {
    const fromExperiments = experiments
      .map((exp) => {
        const number = Number(exp.practicalNo || exp.experimentNo || exp.number);
        if (!Number.isFinite(number)) return null;
        return { number };
      })
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);

    if (fromExperiments.length > 0) return fromExperiments;

    const numbers = new Set();
    assessments.forEach((student) => {
      if (student.assessments && typeof student.assessments === "object") {
        Object.keys(student.assessments).forEach((key) => {
          const number = Number(key);
          if (Number.isFinite(number)) numbers.add(number);
        });
      }
    });

    return Array.from(numbers)
      .sort((a, b) => a - b)
      .map((number) => ({ number }));
  }, [assessments, experiments]);

  const rows = useMemo(() => {
    const map = new Map(assessments.map((item) => [item.studentName, item]));
    return students.map((student) => ({
      ...student,
      assessments: map.get(student.studentName)?.assessments || {},
    }));
  }, [assessments, students]);

  if (loading) {
    return (
      <div className="k3-page">
        <div className="k3-form-card">Loading K3 format...</div>
      </div>
    );
  }

  if (!ciannData) {
    return (
      <div className="k3-page">
        <div className="k3-form-card">
          <h3>Missing CIANN Selection</h3>
          <p className="k3-error">Please select a CIANN before generating K3 format.</p>
          <button className="btn btn-success" onClick={() => navigate("/msbte/fa-pr-k3/cianns")}>
            Go to CIANN Selection
          </button>
        </div>
      </div>
    );
  }

  const experimentCount = experimentColumns.length || 1;

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
            <div className="k3-sheet-board">Maharashtra State Board of Technical Education</div>
            <div className="k3-sheet-subtitle">FORMATIVE ASSESSMENT OF PRACTICAL (FA-PA)</div>
          </div>
          <div className="k3-sheet-format">Format K3</div>
        </div>

        <div className="k3-meta">
          <div><strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}</div>
          <div><strong>Course and Code:</strong> {ciannData?.class || "C05K-A"}</div>
          <div><strong>Subject and Code:</strong> {ciannData?.subject?.name || "CLOUD COMPUTING"} ({ciannData?.subject?.code || "315325"})</div>
          <div><strong>Name of Faculty:</strong> {facultyName}</div>
          <div><strong>Batch:</strong> {batch || "-"}</div>
          <div><strong>Division:</strong> {ciannData?.division || "-"}</div>
        </div>

        <table className="k3-table">
          <thead>
            <tr>
              <th rowSpan={2}>Roll No.</th>
              <th rowSpan={2}>Enrollment Number</th>
              <th rowSpan={2}>Exam Seat No.</th>
              <th rowSpan={2}>Name of the Student</th>
              <th colSpan={experimentCount}>Experiment / Practical / Tutorial (Marks out of {maxMarks} per experiments)</th>
              <th rowSpan={2}>Total Marks (out of {maxMarks * experimentCount})</th>
              <th rowSpan={2}>FA marks of practical converted (max marks 25)</th>
              <th rowSpan={2}>Signature of Student</th>
            </tr>
            <tr>
              {experimentColumns.length > 0 ? (
                experimentColumns.map((column) => <th key={column.number}>{String(column.number).padStart(2, "0")}</th>)
              ) : (
                <th>--</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8 + experimentCount} className="k3-empty">No student data available.</td>
              </tr>
            ) : (
              rows.map((student) => {
                const total = experimentColumns.reduce((sum, column) => {
                  const raw = student.assessments?.[column.number]?.marks;
                  const normalized = normalizeMark(raw, maxMarks);
                  return sum + (Number.isFinite(normalized) ? normalized : 0);
                }, 0);

                const converted = experimentColumns.length > 0
                  ? Math.round((total / (maxMarks * experimentColumns.length)) * 25)
                  : "-";

                return (
                  <tr key={`${student.rollNo}-${student.studentName}`}>
                    <td>{student.rollNo || "-"}</td>
                    <td>{student.enrollmentNo || "-"}</td>
                    <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                    <td className="k3-name">{student.studentName || "-"}</td>
                    {experimentColumns.length > 0 ? (
                      experimentColumns.map((column) => {
                        const raw = student.assessments?.[column.number]?.marks;
                        const normalized = normalizeMark(raw, maxMarks);
                        return <td key={`${student._id}-${column.number}`}>{Number.isFinite(normalized) ? normalized : "-"}</td>;
                      })
                    ) : (
                      <td>-</td>
                    )}
                    <td>{experimentColumns.length > 0 ? total : "-"}</td>
                    <td>{converted}</td>
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

export default FAPRK3Print;
