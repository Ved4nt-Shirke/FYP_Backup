import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config/api";
import "./k5.css";

const getMarkOutOf30 = (entry) => {
  if (!entry) {
    return null;
  }

  const marks = Number(entry.marks);
  const totalMarks = Number(entry.totalMarks);

  if (!Number.isFinite(marks)) {
    return null;
  }

  if (Number.isFinite(totalMarks) && totalMarks > 0 && totalMarks !== 30) {
    return Number(((marks / totalMarks) * 30).toFixed(2));
  }

  return Number(marks.toFixed(2));
};

const compareRollNo = (first, second) => {
  return String(first || "").localeCompare(String(second || ""), undefined, {
    numeric: true,
  });
};

const K5Print = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const ciannData = location.state?.ciannData || null;
  const [students, setStudents] = useState([]);
  const [ctMarks, setCtMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const facultyName = useMemo(() => {
    const raw = localStorage.getItem("username") || "";
    if (!raw) {
      return "";
    }

    if (raw.includes(".")) {
      return raw
        .split(".")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" ");
    }

    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!ciannData?.ciannId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const studentPromise = axios.get(config.students, {
          params: {
            division: ciannData.division || undefined,
          },
        });

        const ctMarksPromise = axios.get(
          `${config.apiBaseUrl}/ct-marks/${ciannData.ciannId}`,
        );

        const [studentsResponse, ctMarksResponse] = await Promise.all([
          studentPromise,
          ctMarksPromise,
        ]);

        const studentList = Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : [];
        const marksPayload = ctMarksResponse.data;
        const marksList = Array.isArray(marksPayload?.data)
          ? marksPayload.data
          : [];

        setStudents(studentList.sort((a, b) => compareRollNo(a.rollNo, b.rollNo)));
        setCtMarks(marksList);
      } catch (err) {
        console.error("Error loading K5 data:", err);
        setError("Failed to load students/CT marks for selected CIANN.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ciannData]);

  const marksByStudent = useMemo(() => {
    const map = new Map();

    ctMarks.forEach((entry) => {
      const rollKey = String(entry.rollNo || "").trim().toLowerCase();
      const nameKey = String(entry.studentName || "").trim().toLowerCase();
      const key = rollKey || nameKey;

      if (!key) {
        return;
      }

      if (!map.has(key)) {
        map.set(key, {});
      }

      const studentMarks = map.get(key);
      if (entry.ctNumber === 1) {
        studentMarks.ct1 = entry;
      }
      if (entry.ctNumber === 2) {
        studentMarks.ct2 = entry;
      }
    });

    return map;
  }, [ctMarks]);

  const rows = useMemo(() => {
    return students.map((student) => {
      const rollKey = String(student.rollNo || "").trim().toLowerCase();
      const nameKey = String(student.studentName || "").trim().toLowerCase();
      const key = rollKey || nameKey;

      const marks = marksByStudent.get(key) || {};
      const ct1 = getMarkOutOf30(marks.ct1);
      const ct2 = getMarkOutOf30(marks.ct2);

      const average =
        Number.isFinite(ct1) && Number.isFinite(ct2)
          ? Number(((ct1 + ct2) / 2).toFixed(2))
          : null;

      return {
        ...student,
        ct1,
        ct2,
        average,
      };
    });
  }, [students, marksByStudent]);

  if (!ciannData) {
    return (
      <div className="k5-page">
        <div className="k5-card">
          <h3>Missing Selection</h3>
          <p className="k5-error">Please select a CIANN first.</p>
          <button className="btn btn-success" onClick={() => navigate("/msbte/k5")}>
            Back to CIANN list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="k5-print-container">
      <div className="k5-toolbar no-print">
        <div className="k5-toolbar-title">MSBTE FORMATS</div>
        <div className="k5-toolbar-actions">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Go back
          </button>
          <button className="btn btn-success" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="k5-sheet">
        <div className="k5-header-row">
          <div className="k5-header-center">
            <div className="k5-board">Maharashtra State Board of Technical Education</div>
            <div className="k5-subtitle">FORMATIVE ASSESSMENT OF THEORY (FA-TH)</div>
          </div>
          <div className="k5-format">Format K5</div>
        </div>

        <div className="k5-meta-grid">
          <div>
            <strong>Academic Year:</strong> {ciannData.academicYear || ""}
          </div>
          <div>
            <strong>Subject and Code:</strong> {ciannData.subject?.name || ""} ({ciannData.subject?.code || ""})
          </div>
          <div>
            <strong>Course and Code:</strong> {ciannData.class || ""}
          </div>
          <div>
            <strong>Date of Examination:</strong>
          </div>
          <div>
            <strong>Marks: Max:</strong> 30&nbsp;&nbsp; <strong>Min</strong> 00
          </div>
          <div>
            <strong>Division:</strong> {ciannData.division || ""}
          </div>
        </div>

        <table className="k5-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Enrollment Number</th>
              <th>Name of the Student</th>
              <th>Exam Seat No.</th>
              <th>Marks of Class Test-1 (Out of 30)</th>
              <th>Marks of Class Test-2 (Out of 30)</th>
              <th>Average of 5 &amp; 6 (Out of 30)</th>
              <th>Signature of Student</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="k5-empty">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="k5-error">{error}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="k5-empty">No students found for this CIANN division.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row._id || row.rollNo}-${row.studentName}`}>
                  <td>{row.rollNo || "-"}</td>
                  <td>{row.enrollmentNo || "-"}</td>
                  <td className="k5-name">{row.studentName || "-"}</td>
                  <td>{row.examSeatNo || row.seatNo || row.examSeat || "-"}</td>
                  <td>{Number.isFinite(row.ct1) ? row.ct1 : "-"}</td>
                  <td>{Number.isFinite(row.ct2) ? row.ct2 : "-"}</td>
                  <td>{Number.isFinite(row.average) ? row.average : "-"}</td>
                  <td></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="k5-footer-signatures">
          <div className="k5-sign-box">
            <div className="k5-sign-title">Signature of Faculty</div>
            <div className="k5-sign-name">Name: {facultyName}</div>
          </div>
          <div className="k5-sign-box right">
            <div className="k5-sign-title">Signature of HoD</div>
            <div className="k5-sign-name">Name</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default K5Print;
