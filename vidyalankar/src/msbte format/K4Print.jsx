import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config/api";
import "./k4.css";

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

const K4Print = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData || null;
  const division = CiaanData?.division || "";

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const facultyName = useMemo(() => {
    const cachedName = localStorage.getItem("facultyName");
    if (cachedName) return cachedName;
    return formatUsername(localStorage.getItem("username") || "") || "Faculty";
  }, []);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!CiaanData || !division) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${config.msbte}/sa-pr-k4`, {
          params: { CiaanId: CiaanData.CiaanId, division },
        });
        setRecord(response.data?.data || null);
      } catch (err) {
        console.error("Error fetching K4 record:", err);
        setError("Unable to load saved marks.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [CiaanData, division]);

  if (!CiaanData || !division) {
    return (
      <div className="k4-page">
        <div className="k4-form-card">
          <p className="k4-error">CIAAN or division information is missing.</p>
          <button
            className="btn btn-success"
            onClick={() => navigate("/msbte/k4/print")}
          >
            Back to CIAAN list
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="k4-page">
        <div className="k4-form-card">Loading print view...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="k4-page">
        <div className="k4-form-card">
          <p className="k4-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="k4-page">
        <div className="k4-form-card">
          <p className="k4-error">No saved marks found for this division.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="k4-print-container">
      <div className="k4-print-toolbar no-print">
        <div className="k4-toolbar-title">MSBTE FORMATS</div>
        <div className="k4-toolbar-actions">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Go back
          </button>
          <button className="btn btn-success" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="k4-sheet">
        <div className="k4-sheet-header">
          <div className="k4-sheet-title">
            <div className="k4-sheet-board">
              Maharashtra State Board of Technical Education
            </div>
            <div className="k4-sheet-subtitle">
              SUMMATIVE ASSESSMENT OF PRACTICAL (SA-PR)
            </div>
          </div>
          <div className="k4-sheet-format">Format K4</div>
        </div>

        <div className="k4-meta">
          <div>
            <strong>Academic Year:</strong> {record.academicYear || ""}
          </div>
          <div>
            <strong>Course and Code:</strong> {record.courseCode || ""}
          </div>
          <div>
            <strong>Subject and Code:</strong> {record.subjectName} (
            {record.subjectCode || ""})
          </div>
          <div>
            <strong>Marks:</strong> Max {record.maxMarks} Min {record.minMarks}
          </div>
          <div>
            <strong>Date of Examination:</strong>
            {record.examDate
              ? " " + record.examDate.slice(0, 10)
              : ""}
          </div>
        </div>

        <table className="k4-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Enrollment Number</th>
              <th>Name of the Student</th>
              <th>Exam Seat No.</th>
              <th>Marks obtained in SA part of Practical (Max Marks)</th>
            </tr>
          </thead>
          <tbody>
            {record.students.length === 0 ? (
              <tr>
                <td colSpan={5} className="k4-empty">
                  No student data available.
                </td>
              </tr>
            ) : (
              [...record.students]
                .sort((a, b) =>
                  String(a.rollNo || "").localeCompare(
                    String(b.rollNo || ""),
                    undefined,
                    { numeric: true },
                  ),
                )
                .map((student) => (
                  <tr key={`${student.rollNo}-${student.studentName}`}>
                    <td>{student.rollNo || "-"}</td>
                    <td>{student.enrollmentNo || "-"}</td>
                    <td className="k4-name">{student.studentName || "-"}</td>
                    <td>{student.seatNo || "-"}</td>
                    <td>{student.marks ?? "-"}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        <div className="k4-signature-footer">
          <div className="k4-sign-block">
            <div className="k4-sign-title">Signature of Internal Examiner</div>
            <div>Name</div>
            <div>Designation</div>
            <div>Mobile No.</div>
          </div>
          <div className="k4-sign-block">
            <div className="k4-sign-title">Signature of External Examiner</div>
            <div>Name</div>
            <div>Designation</div>
            <div>Mobile No.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default K4Print;
