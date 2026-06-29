import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../../basic/Header";
import { config } from "../../config/api";
import { TokenManager } from "../../utils/authUtils.js";
import "./defaulter.css";

const Defaulter = () => {
  const [cianns, setCianns] = useState([]);
  const [selectedCiann, setSelectedCiann] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = TokenManager.getToken();
        if (!token) {
          setError("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        const response = await axios.get(config.cianns, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCianns(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }
        setError("Failed to fetch CIANN data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCianns();
  }, []);

  useEffect(() => {
    if (!selectedCiann) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      const ciannId = selectedCiann.ciannId;

      const fetchApi = async (url) => {
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (err) {
          console.error(
            `Error fetching data from ${url}:`,
            err.response?.data?.error || err.message,
          );
          if (err.response && err.response.status === 404) {
            return [];
          }
          throw err;
        }
      };

      try {
        const studentsRes = await fetchApi(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students?${new URLSearchParams({
            ...(selectedCiann.divisionId ? { divisionId: selectedCiann.divisionId } : {}),
            ...(selectedCiann.division && !selectedCiann.divisionId ? { division: selectedCiann.division } : {}),
            ...(selectedCiann.academicYear ? { academicYear: selectedCiann.academicYear } : {}),
          }).toString()}`,
        );
        const theoryRes = await fetchApi(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/theory-attendance?ciannId=${ciannId}`,
        );
        const practicalRes = await fetchApi(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/practical-attendance?ciannId=${ciannId}`,
        );
        const extraTheoryRes = await fetchApi(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/ciann/${ciannId}`,
        );
        const extraPractRes = await fetchApi(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-pract?ciannId=${ciannId}`,
        );

        const normalizeBatchKey = (val) => {
          const str = String(val || "");
          return str.replace(/\D/g, "");
        };

        const cleanedStudents = studentsRes.map((s) => ({
          ...s,
          batch: normalizeBatchKey(s.batch),
        }));
        const cleanedPractical = practicalRes.map((p) => ({
          ...p,
          batch: normalizeBatchKey(p.batch),
        }));
        const cleanedExtraPract = extraPractRes.map((p) => ({
          ...p,
          batch: normalizeBatchKey(p.batch),
        }));

        setStudents(cleanedStudents);
        setAttendanceData({
          theory: theoryRes,
          practical: cleanedPractical,
          extraTheory: extraTheoryRes,
          extraPract: cleanedExtraPract,
        });
      } catch (err) {
        setError(
          "Failed to fetch all attendance data. Please check the console for details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCiann]);

  const processAttendance = () => {
    if (!attendanceData || !students || students.length === 0) return {};

    const { theory, practical, extraTheory, extraPract } = attendanceData;

    const totalRegularLectures = theory.length;
    const totalExtraLectures = extraTheory.length;
    const totalLectures = totalRegularLectures + totalExtraLectures;

    const batches = [
      ...new Set([
        ...students.map((s) => s.batch),
        ...practical.map((p) => p.batch),
        ...extraPract.map((p) => p.batch),
      ]),
    ].filter((b) => b);

    const practicalTotals = {};
    batches.forEach((batch) => {
      const regular = practical.filter((p) => p.batch === batch).length;
      const extra = extraPract.filter((p) => p.batch === batch).length;
      practicalTotals[batch] = {
        totalRegular: regular,
        totalExtra: extra,
        total: regular + extra,
      };
    });

    const studentAttendance = students.reduce((acc, student) => {
      if (!student.rollNo) return acc;
      acc[student.rollNo] = {
        name: student.studentName,
        batch: student.batch,
        theory: { regular: 0, extra: 0, present: 0 },
        practical: batches.reduce(
          (batchAcc, batch) => ({
            ...batchAcc,
            [batch]: { regular: 0, extra: 0, present: 0 },
          }),
          {},
        ),
        overall: { theory: 0, practical: 0, total: 0 },
      };
      return acc;
    }, {});

    theory.forEach((record) =>
      record.students.forEach((s) => {
        if (s.status === "Present" && studentAttendance[s.rollNo]) {
          studentAttendance[s.rollNo].theory.regular += 1;
          studentAttendance[s.rollNo].theory.present += 1;
        }
      }),
    );
    extraTheory.forEach((record) =>
      record.students.forEach((s) => {
        if (s.attendance === "Present" && studentAttendance[s.rollId]) {
          studentAttendance[s.rollId].theory.extra += 1;
          studentAttendance[s.rollId].theory.present += 1;
        }
      }),
    );
    practical.forEach((record) =>
      record.students.forEach((s) => {
        if (
          s.status === "Present" &&
          studentAttendance[s.rollNo] &&
          studentAttendance[s.rollNo].practical[record.batch]
        ) {
          studentAttendance[s.rollNo].practical[record.batch].regular += 1;
          studentAttendance[s.rollNo].practical[record.batch].present += 1;
        }
      }),
    );
    extraPract.forEach((record) =>
      record.students.forEach((s) => {
        if (
          s.attendance === "Present" &&
          studentAttendance[s.rollId] &&
          studentAttendance[s.rollId].practical[record.batch]
        ) {
          studentAttendance[s.rollId].practical[record.batch].extra += 1;
          studentAttendance[s.rollId].practical[record.batch].present += 1;
        }
      }),
    );

    Object.keys(studentAttendance).forEach((rollNo) => {
      const student = studentAttendance[rollNo];
      const studentBatch = student.batch;
      const theoryPresent = student.theory.present;
      const practicalPresent = student.practical[studentBatch]?.present || 0;
      const totalsForStudentBatch = practicalTotals[studentBatch];
      const totalPossiblePracticals = totalsForStudentBatch?.total || 0;

      student.overall.theory =
        totalLectures > 0 ? (theoryPresent / totalLectures) * 100 : 0;
      student.overall.practical =
        totalPossiblePracticals > 0
          ? (practicalPresent / totalPossiblePracticals) * 100
          : 0;

      const totalPresent = theoryPresent + practicalPresent;
      const totalPossible = totalLectures + totalPossiblePracticals;
      student.overall.total =
        totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;
    });

    return {
      studentAttendance,
      practicalTotals,
      totalLectures,
      totalRegularLectures,
      totalExtraLectures,
    };
  };

  const handlePrint = () => {
    const className = "printing-defaulter";
    const cleanup = () => {
      document.body.classList.remove(className);
      window.removeEventListener("afterprint", cleanup);
    };

    document.body.classList.add(className);
    window.addEventListener("afterprint", cleanup, { once: true });

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1000);
    }, 100);
  };

  const attendanceSummary =
    selectedCiann && attendanceData ? processAttendance() : {};

  if (!selectedCiann) {
    return (
      <div className="defaulter-page-container">
        <Header />
        <div className="defaulter-select-page">
          <section className="defaulter-select-hero">
            <h2>Defaulter Analysis</h2>
            <p>Select a CIANN to generate defaulter report</p>
          </section>

          {loading && <p className="defaulter-state">Loading CIANNs...</p>}
          {error && (
            <p className="defaulter-state defaulter-state-error">{error}</p>
          )}
          {!loading && !error && cianns.length === 0 && (
            <p className="defaulter-state">No CIANNs found.</p>
          )}

          {!loading && !error && cianns.length > 0 && (
            <div className="defaulter-ciann-grid">
              {cianns.map((ciann) => (
                <button
                  key={ciann._id || ciann.ciannId}
                  type="button"
                  className="defaulter-ciann-card"
                  onClick={() => setSelectedCiann(ciann)}
                >
                  <i className="bi bi-person-exclamation defaulter-ciann-icon"></i>
                  <h3>{ciann.subject?.name || "Unknown Subject"}</h3>
                  <p>{ciann.subject?.code || "-"}</p>
                  <p>CIANN ID: {ciann.ciannId || "-"}</p>
                  <p>Division: {ciann.division || "-"}</p>
                  <span className="defaulter-ciann-cta">Open Report</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="defaulter-page-container">
      <Header />
      <div className="defaulter-detail-page">
        {/* Print-only header with additional info */}
        <div className="print-only-header" style={{ display: "none" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ margin: "0", fontSize: "18pt", fontWeight: "bold" }}>
              VP Polytechnic - Defaulter Analysis Report
            </h1>
            <p style={{ margin: "5px 0", fontSize: "12pt" }}>
              Subject: {selectedCiann.subject.name} | Academic Year:{" "}
              {selectedCiann.academicYear} | Semester: {selectedCiann.semester}
            </p>
            <p style={{ margin: "5px 0", fontSize: "10pt", color: "#666" }}>
              Generated on:{" "}
              {new Date().toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <hr style={{ border: "1px solid #000", margin: "10px 0" }} />
        </div>

        <div className="defaulter-header">
          <h1>Defaulter Students ({selectedCiann.subject.name})</h1>
          <div className="header-buttons no-print">
            <button onClick={handlePrint} className="print-button">
              Print
            </button>
            <button
              onClick={() => setSelectedCiann(null)}
              className="back-button"
            >
              Back to CIANN List
            </button>
          </div>
        </div>

        {loading && <p>Loading attendance data...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="attendance-section">
              <h2>Theory Defaulters</h2>
              <div className="attendance-summary-box">
                <div className="summary-card">
                  <span>{attendanceSummary.totalRegularLectures || 0}</span>
                  <p>
                    Total Regular
                    <br />
                    Lectures
                  </p>
                </div>
                <div className="summary-card">
                  <span>{attendanceSummary.totalExtraLectures || 0}</span>
                  <p>
                    Total Extra
                    <br />
                    Lectures
                  </p>
                </div>
                <div className="summary-card">
                  <span>{attendanceSummary.totalLectures || 0}</span>
                  <p>Total Lectures</p>
                </div>
              </div>
              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Theory Lectures</th>
                      <th>Extra Lectures</th>
                      <th>Theory %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      attendanceSummary.studentAttendance || {},
                    ).filter(([, data]) => data.overall.theory < 75).length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#28a745",
                            backgroundColor: "#d4edda",
                          }}
                        >
                          🎉 No Theory Defaulters! All students have ≥75%
                          attendance.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(attendanceSummary.studentAttendance || {})
                        .filter(([, data]) => data.overall.theory < 75)
                        .map(([rollNo, data]) => (
                          <tr key={rollNo}>
                            <td>{rollNo}</td>
                            <td>{data.name}</td>
                            <td>{data.theory.regular}</td>
                            <td>{data.theory.extra}</td>
                            <td
                              style={{
                                fontWeight: "bold",
                                color:
                                  data.overall.theory < 50
                                    ? "#dc3545"
                                    : "#fd7e14",
                              }}
                            >
                              {data.overall.theory.toFixed(2)}%
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="attendance-section">
              <h2>Practical Defaulters</h2>
              {Object.entries(attendanceSummary.practicalTotals || {})
                .sort(([a], [b]) => {
                  const aNum = parseInt(a, 10);
                  const bNum = parseInt(b, 10);
                  return aNum - bNum;
                })
                .map(([batch, totals]) => (
                  <div key={batch} className="batch-container">
                    <h3>Batch {batch}</h3>
                    <div className="attendance-summary-box">
                      <div className="summary-card">
                        <span>{totals.totalRegular}</span>
                        <p>
                          Total Regular
                          <br />
                          Practicals
                        </p>
                      </div>
                      <div className="summary-card">
                        <span>{totals.totalExtra}</span>
                        <p>
                          Total Extra
                          <br />
                          Practicals
                        </p>
                      </div>
                      <div className="summary-card">
                        <span>{totals.total}</span>
                        <p>Total Practicals</p>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Roll No.</th>
                            <th>Student Name</th>
                            <th>Regular Practicals</th>
                            <th>Extra Practicals</th>
                            <th>Practical %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            attendanceSummary.studentAttendance || {},
                          ).filter(
                            ([, data]) =>
                              data.batch === batch &&
                              data.overall.practical < 75,
                          ).length === 0 ? (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: "center",
                                  padding: "20px",
                                  color: "#28a745",
                                  backgroundColor: "#d4edda",
                                }}
                              >
                                🎉 No Practical Defaulters in Batch {batch}! All
                                students have ≥75% attendance.
                              </td>
                            </tr>
                          ) : (
                            Object.entries(
                              attendanceSummary.studentAttendance || {},
                            )
                              .filter(
                                ([, data]) =>
                                  data.batch === batch &&
                                  data.overall.practical < 75,
                              )
                              .map(([rollNo, data]) => (
                                <tr key={rollNo}>
                                  <td>{rollNo}</td>
                                  <td>{data.name}</td>
                                  <td>{data.practical[batch]?.regular || 0}</td>
                                  <td>{data.practical[batch]?.extra || 0}</td>
                                  <td
                                    style={{
                                      fontWeight: "bold",
                                      color:
                                        data.overall.practical < 50
                                          ? "#dc3545"
                                          : "#fd7e14",
                                    }}
                                  >
                                    {data.overall.practical.toFixed(2)}%
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>

            <div className="attendance-section">
              <h2>Overall Defaulters</h2>
              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Theory</th>
                      <th>Practical</th>
                      <th>Overall %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      attendanceSummary.studentAttendance || {},
                    ).filter(([, data]) => data.overall.total < 75).length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#28a745",
                            backgroundColor: "#d4edda",
                          }}
                        >
                          🎉 No Overall Defaulters! All students have ≥75%
                          overall attendance.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(attendanceSummary.studentAttendance || {})
                        .filter(([, data]) => data.overall.total < 75)
                        .map(([rollNo, data]) => (
                          <tr key={rollNo}>
                            <td>{rollNo}</td>
                            <td>{data.name}</td>
                            <td>
                              {data.theory.present} /{" "}
                              {attendanceSummary.totalLectures}
                            </td>
                            <td>
                              {data.practical[data.batch]?.present || 0} /{" "}
                              {attendanceSummary.practicalTotals[data.batch]
                                ?.total || 0}
                            </td>
                            <td
                              style={{
                                fontWeight: "bold",
                                color:
                                  data.overall.total < 50
                                    ? "#dc3545"
                                    : data.overall.total < 65
                                      ? "#fd7e14"
                                      : "#ffc107",
                              }}
                            >
                              {data.overall.total.toFixed(2)}%
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Print-only footer */}
        <div className="print-only-footer" style={{ display: "none" }}>
          <hr style={{ border: "1px solid #000", margin: "20px 0 10px 0" }} />
          <div style={{ textAlign: "center", fontSize: "9pt", color: "#666" }}>
            <p style={{ margin: "0" }}>
              This report contains attendance data for students with less than
              75% attendance.
            </p>
            <p style={{ margin: "5px 0 0 0" }}>
              VP Polytechnic | Defaulter Analysis System | Page {"{page}"} of{" "}
              {"{pages}"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Defaulter;
