import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./K5Pages.css";

const toMarksOutOf30 = (marks, totalMarks) => {
  const value = Number(marks);
  const total = Number(totalMarks || 20);
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return Number(((value / total) * 30).toFixed(2));
};

const buildStudentKey = (studentName, rollNo) => {
  return `${String(rollNo || "").trim()}::${String(studentName || "").trim().toLowerCase()}`;
};

const formatAverage = (first, second) => {
  const values = [first, second].filter((value) => Number.isFinite(value));
  if (values.length === 0) return "-";
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return avg.toFixed(2);
};

const FATHK5Print = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData || null;

  const [students, setStudents] = useState([]);
  const [ctMarksMap, setCtMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        if (!CiaanData?.CiaanId) {
          setLoading(false);
          return;
        }

        const query = new URLSearchParams();
        if (CiaanData?.division) query.set("division", CiaanData.division);
        if (CiaanData?.department?._id) {
          query.set("departmentId", CiaanData.department._id);
        }
        if (CiaanData?.batch) query.set("batch", CiaanData.batch);
        if (CiaanData?.academicYear) {
          query.set("academicYear", CiaanData.academicYear);
        }
        if (CiaanData?.semester) {
          query.set("semester", CiaanData.semester);
        }

        const studentsUrl = query.toString()
          ? `${config.students}?${query.toString()}`
          : config.students;

        const [studentsResponse, marksResponse] = await Promise.all([
          fetch(studentsUrl),
          fetch(`${config.apiBaseUrl}/ct-marks/${CiaanData.CiaanId}`),
        ]);

        const studentsData = await studentsResponse.json();
        const marksData = await marksResponse.json();

        if (!studentsResponse.ok) {
          throw new Error(studentsData?.message || "Failed to fetch students");
        }

        if (!marksResponse.ok) {
          throw new Error(marksData?.message || "Failed to fetch CT marks");
        }

        const studentList = Array.isArray(studentsData) ? studentsData : [];
        setStudents(studentList);

        const allMarks = Array.isArray(marksData?.data) ? marksData.data : [];
        const byStudent = {};

        allMarks.forEach((entry) => {
          const key = buildStudentKey(entry.studentName, entry.rollNo);
          if (!byStudent[key]) {
            byStudent[key] = {};
          }

          if (entry.ctNumber === 1) {
            byStudent[key].ct1 = toMarksOutOf30(entry.marks, entry.totalMarks);
          }

          if (entry.ctNumber === 2) {
            byStudent[key].ct2 = toMarksOutOf30(entry.marks, entry.totalMarks);
          }
        });

        setCtMarksMap(byStudent);
      } catch (fetchError) {
        console.error("Error preparing K5 format:", fetchError);
        setError(fetchError.message || "Failed to load K5 format data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [CiaanData]);

  const rows = useMemo(() => {
    return students.map((student) => {
      const rollNo = student.rollNo || student.rollId || student.regNumber || "";
      const name = student.studentName || student.name || "";
      const key = buildStudentKey(name, rollNo);
      const ctData = ctMarksMap[key] || {};
      const ct1 = Number.isFinite(ctData.ct1) ? ctData.ct1 : null;
      const ct2 = Number.isFinite(ctData.ct2) ? ctData.ct2 : null;

      return {
        id: student._id,
        rollNo,
        enrollmentNo: student.enrollmentNo || "-",
        studentName: name || "-",
        examSeatNo: student.examSeatNo || student.seatNo || student.examSeat || "-",
        ct1,
        ct2,
      };
    });
  }, [students, ctMarksMap]);

  if (!CiaanData) {
    return (
      <div className="k5-page">
        <div className="k5-card">
          <h3>Missing Ciaan Selection</h3>
          <p className="k5-error">Please Select a CIAAN first for FA-TH-K5.</p>
          <button
            className="btn btn-success"
            onClick={() => navigate("/msbte/fa-th-k5/Ciaans")}
          >
            Go to Ciaan Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="k5-page">
      <div className="k5-toolbar no-print">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Go back
        </button>
        <button className="btn btn-success" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="k5-sheet">
        <table className="k5-table">
          <thead>
            <tr>
              <th colSpan="8" className="k5-title-cell">
                <div className="k5-title-top">Maharashtra State Board of Technical Education</div>
                <div className="k5-title-sub">FORMATIVE ASSESSMENT OF THEORY (FA-TH)</div>
                <div className="k5-format">Format K5</div>
              </th>
            </tr>
            <tr>
              <th colSpan="4" className="k5-meta-left">
                <div><strong>Academic Year:</strong> {CiaanData?.academicYear || "2025 - 2026"}</div>
                <div><strong>Course and Code:</strong> {CiaanData?.class || "C05K-A"}</div>
                <div><strong>Marks:</strong> Max: 30&nbsp;&nbsp; Min 00</div>
              </th>
              <th colSpan="4" className="k5-meta-right">
                <div><strong>Date of Examination :</strong> </div>
                <div>
                  <strong>Subject and Code:</strong> {CiaanData?.subject?.name || "-"} ({CiaanData?.subject?.code || "-"})
                </div>
              </th>
            </tr>
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
            <tr>
              <th></th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>6</th>
              <th>7</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="k5-empty">Loading students and CT marks...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="8" className="k5-empty">No students found for this Ciaan.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rollNo || "-"}</td>
                  <td>{row.enrollmentNo}</td>
                  <td className="k5-name">{row.studentName}</td>
                  <td>{row.examSeatNo}</td>
                  <td>{Number.isFinite(row.ct1) ? row.ct1.toFixed(2) : "-"}</td>
                  <td>{Number.isFinite(row.ct2) ? row.ct2.toFixed(2) : "-"}</td>
                  <td>{formatAverage(row.ct1, row.ct2)}</td>
                  <td></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="k5-signatures">
          <div>
            <div><strong>Signature of Faculty</strong></div>
            <div><strong>Name</strong></div>
          </div>
          <div>
            <div><strong>Signature of HoD</strong></div>
            <div><strong>Name</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FATHK5Print;
