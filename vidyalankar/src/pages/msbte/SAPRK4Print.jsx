import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./MSBTEPages.css";

const SAPRK4Print = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const ciannData = location.state?.ciannData || null;
  const marksFromState = location.state?.marks || {};
  const [savedMarks, setSavedMarks] = useState({});
  const [maxLimit, setMaxLimit] = useState("");

  // Fetch students on component load
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const query = new URLSearchParams();
        if (ciannData?.division) query.set("division", ciannData.division);
        if (ciannData?.department?._id) {
          query.set("departmentId", ciannData.department._id);
        }
        if (ciannData?.academicYear) {
          query.set("academicYear", ciannData.academicYear);
        }

        const url = query.toString()
          ? `${config.students}?${query.toString()}`
          : config.students;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStudents(data);

          if (
            Object.keys(marksFromState).length === 0 &&
            ciannData?.ciannId &&
            ciannData?.division
          ) {
            const recordRes = await fetch(
              `${config.msbte}/sa-pr-k4?ciannId=${encodeURIComponent(
                ciannData.ciannId,
              )}&division=${encodeURIComponent(ciannData.division)}`,
            );
            if (recordRes.ok) {
              const recordData = await recordRes.json();
              const record = recordData?.data;
              if (record?.students?.length) {
                if (record.maxMarks !== undefined && record.maxMarks !== null) {
                  setMaxLimit(String(record.maxMarks));
                }
                const mapByKey = {};
                record.students.forEach((item) => {
                  const key = `${item.rollNo || ""}::${item.studentName || ""}`;
                  mapByKey[key] = item.marks;
                });

                const marksMap = {};
                data.forEach((student) => {
                  const key = `${student.rollNo || student.rollId || ""}::${student.studentName || student.name || ""}`;
                  if (mapByKey[key] !== undefined && mapByKey[key] !== null) {
                    marksMap[student._id] = mapByKey[key];
                  }
                });
                setSavedMarks(marksMap);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [ciannData, marksFromState]);

  const marks =
    Object.keys(marksFromState).length > 0 ? marksFromState : savedMarks;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  return (
    <div className="k4-print-container">
      <div className="k4-print-toolbar no-print">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Go back
        </button>
        <button className="btn btn-success" onClick={handlePrint}>
          Print
        </button>
      </div>

      {!ciannData ? (
        <div className="k3-form-card">
          <h3>Missing CIANN Selection</h3>
          <p className="k3-error">Please select a CIANN first for SA-PR-K4 print.</p>
          <button
            className="btn btn-success"
            onClick={() => navigate("/msbte/sa-pr-k4/cianns?mode=print")}
          >
            Go to CIANN Selection
          </button>
        </div>
      ) : (
        <div className="k4-print-sheet">
          <table className="k4-print-table k4-structure-table">
            <colgroup>
              <col className="k4-col-roll" />
              <col className="k4-col-enroll" />
              <col className="k4-col-name" />
              <col className="k4-col-seat" />
              <col className="k4-col-marks" />
            </colgroup>
            <thead>
              <tr>
                <th colSpan="5" className="k4-sheet-title-cell">
                  <div className="k4-sheet-title-inner">
                    <div>
                      <div className="k4-print-board">
                        Maharashtra State Board of Technical Education
                      </div>
                      <div className="k4-print-subtitle">
                        SUMMATIVE ASSESSMENT OF PRACTICAL (SA-PR)
                      </div>
                    </div>
                    <div className="k4-print-format">Format K4</div>
                  </div>
                </th>
              </tr>
              <tr>
                <th colSpan="3" className="k4-meta-left">
                  <div>
                    <strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}
                  </div>
                </th>
                <th colSpan="2" className="k4-meta-right">
                  <strong>Subject and Code:</strong> {ciannData?.subject?.name || "-"} ({ciannData?.subject?.code || "-"})
                </th>
              </tr>
              <tr>
                <th colSpan="2" className="k4-meta-left">
                  <strong>Course and Code:</strong> {ciannData?.class || "C05K-A"}
                </th>
                <th colSpan="3" className="k4-meta-center">
                  <strong>Marks: Max:</strong> {maxLimit || "-"} &nbsp;&nbsp;
                  <strong>Min</strong> 0 &nbsp;&nbsp;
                  <strong>Date of Examination :</strong> {formatDate()}
                </th>
              </tr>
              <tr>
                <th>Roll No.</th>
                <th>Enrollment Number</th>
                <th>Name of the Student</th>
                <th>Exam Seat No.</th>
                <th>Marks obtained in SA part of Practical as per L-A Scheme ( Max Marks )</th>
              </tr>
              <tr>
                <th></th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.rollNo || student.rollId || student.regNumber || "-"}</td>
                    <td>{student.enrollmentNo || "-"}</td>
                    <td className="text-start">{student.studentName || student.name || "-"}</td>
                    <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                    <td>{marks[student._id] || ""}</td>
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

          <div className="k4-print-signatures">
            <div className="k4-sign-column">
              <div className="k4-sign-title">Signature of Internal Examiner</div>
              <div>Name</div>
              <div>Designation</div>
              <div>Mobile No.</div>
            </div>
            <div className="k4-sign-column">
              <div className="k4-sign-title">Signature of External Examiner</div>
              <div>Name</div>
              <div>Designation</div>
              <div>Mobile No.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAPRK4Print;
