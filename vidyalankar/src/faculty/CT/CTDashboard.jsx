import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { config } from "../../config/api";
import "./CTDashboard.css";

export default function CTDashboard() {
  const { CiaanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [existingMap, setExistingMap] = useState({});
  const [ctNumber, setCtNumber] = useState(1);
  const [totalMarks, setTotalMarks] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const token = localStorage.getItem("token");

  const cardTitle = useMemo(() => {
    if (!CiaanData) return `CT Dashboard - Ciaan ${CiaanId}`;
    const subjectName = CiaanData.subject?.name || "Subject";
    const subjectCode = CiaanData.subject?.code
      ? ` (${CiaanData.subject.code})`
      : "";
    return `${subjectName}${subjectCode} - Ciaan ${CiaanData.CiaanId || CiaanId}`;
  }, [CiaanData, CiaanId]);

  const stats = useMemo(() => {
    const entered = students.filter(
      (s) => marksMap[s._id] !== "" && marksMap[s._id] !== undefined && marksMap[s._id] !== null
    );
    const total = students.length;
    if (total === 0) return { enteredCount: 0, pendingCount: 0, average: "0.0", passRate: "0" };
    
    const sum = entered.reduce((acc, s) => acc + Number(marksMap[s._id] || 0), 0);
    const avg = entered.length > 0 ? (sum / entered.length).toFixed(1) : "0.0";
    
    const passingScore = totalMarks * 0.4;
    const passed = entered.filter((s) => Number(marksMap[s._id] || 0) >= passingScore).length;
    const passRate = entered.length > 0 ? ((passed / entered.length) * 100).toFixed(0) : "0";
    
    return {
      enteredCount: entered.length,
      pendingCount: total - entered.length,
      average: avg,
      passRate: passRate
    };
  }, [students, marksMap, totalMarks]);

  useEffect(() => {
    const fetchCiaanIfNeeded = async () => {
      if (CiaanData) return;
      const response = await fetch(`${config.Ciaans}/${CiaanId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch Ciaan details");
      }
      setCiaanData(data);
    };

    fetchCiaanIfNeeded().catch((fetchError) => {
      setError(fetchError.message || "Failed to fetch Ciaan details");
    });
  }, [CiaanData, CiaanId, token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!CiaanId) return;

      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (CiaanData?.batch) query.set("batch", CiaanData.batch);
        if (CiaanData?.division) query.set("division", CiaanData.division);
        if (CiaanData?.academicYear) query.set("academicYear", CiaanData.academicYear);
        if (CiaanData?.semester) query.set("semester", CiaanData.semester);

        const studentsUrl = query.toString()
          ? `${config.students}?${query.toString()}`
          : config.students;

        const [studentsResponse, marksResponse] = await Promise.all([
          fetch(studentsUrl),
          fetch(`${config.apiBaseUrl}/ct-marks/${CiaanId}/ct/${ctNumber}`),
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

        const existingEntries = Array.isArray(marksData?.data)
          ? marksData.data
          : [];

        const entryByKey = {};
        existingEntries.forEach((entry) => {
          const key = `${entry.rollNo || ""}::${entry.studentName || ""}`;
          entryByKey[key] = entry;
        });
        setExistingMap(entryByKey);

        const nextMarksMap = {};
        studentList.forEach((student) => {
          const studentName = student.studentName || student.name || "";
          const rollNo = student.rollNo || student.rollId || "";
          const key = `${rollNo}::${studentName}`;
          nextMarksMap[student._id] = entryByKey[key]?.marks ?? "";
        });
        setMarksMap(nextMarksMap);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch CT dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [CiaanData?.batch, CiaanData?.division, CiaanId, ctNumber, reloadKey]);

  const handleMarksChange = (studentId, value) => {
    if (value === "") {
      setMarksMap((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    if (numeric < 0 || numeric > totalMarks) return;

    setMarksMap((prev) => ({ ...prev, [studentId]: numeric }));
  };

  const handleSave = async () => {
    if (!CiaanId) return;

    setSaving(true);
    setError("");

    try {
      const saveRequests = students
        .filter((student) => marksMap[student._id] !== "")
        .map((student) => {
          const studentName = student.studentName || student.name || "";
          const rollNo = student.rollNo || student.rollId || "";
          const key = `${rollNo}::${studentName}`;
          const existing = existingMap[key];

          const payload = {
            ctName: `CT${ctNumber}`,
            ctNumber,
            studentName,
            rollNo,
            marks: Number(marksMap[student._id]),
            totalMarks: Number(totalMarks),
            CiaanId: Number(CiaanId),
            program:
              CiaanData?.department?.name ||
              CiaanData?.departmentName ||
              CiaanData?.department ||
              "",
            className: CiaanData?.class || CiaanData?.className || "",
            course: CiaanData?.course || CiaanData?.courseName || "",
            batch: CiaanData?.batch || student.batch || "",
            division: CiaanData?.division || student.division || "",
            subject: CiaanData?.subject?.name || "",
            subjectCode: CiaanData?.subject?.code || "",
            markedBy: localStorage.getItem("username") || "",
          };

          if (existing?._id) {
            return fetch(`${config.apiBaseUrl}/ct-marks/${existing._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(payload),
            });
          }

          return fetch(`${config.apiBaseUrl}/ct-marks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          });
        });

      if (saveRequests.length === 0) {
        alert("Enter at least one mark before saving.");
        setSaving(false);
        return;
      }

      const responses = await Promise.all(saveRequests);
      const failed = [];
      for (const response of responses) {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          failed.push(data?.message || "Failed to save some marks");
        }
      }

      if (failed.length > 0) {
        throw new Error(failed[0]);
      }

      alert(`CT${ctNumber} marks saved successfully.`);
      setReloadKey((prev) => prev + 1);
    } catch (saveError) {
      setError(saveError.message || "Failed to save CT marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ct-dashboard-page">
      <section className="ct-dashboard-topbar">
        <button className="btn ct-btn-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h4 className="ct-dashboard-title">{cardTitle}</h4>
        <span className="ct-dashboard-badge">
          Ciaan {CiaanData?.CiaanId || CiaanId}
        </span>
      </section>

      <section className="ct-dashboard-panel ct-dashboard-controls">
        <div className="ct-controls-row">
          <div className="ct-field">
            <label className="form-label">CT Number</label>
            <select
              className="form-select"
              value={ctNumber}
              onChange={(e) => setCtNumber(Number(e.target.value))}
            >
              <option value={1}>CT1</option>
              <option value={2}>CT2</option>
            </select>
          </div>

          <div className="ct-field">
            <label className="form-label">Total Marks</label>
            <input
              type="number"
              min="1"
              max="100"
              className="form-control"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value) || 30)}
            />
          </div>

          <button
            className="btn ct-save-btn"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : `Save CT${ctNumber} Marks`}
          </button>
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="ct-dashboard-panel">
        <div className="ct-table-wrap">
          {loading ? (
            <div className="ct-loading-wrapper">
              <div className="ct-spinner"></div>
              <p>Loading students and marks...</p>
            </div>
          ) : students.length === 0 ? (
            <p className="text-muted mb-0">
              No students found for this Ciaan context.
            </p>
          ) : (
            <>
              <div className="ct-stats-summary-bar">
                <div className="ct-stat-card">
                  <div className="ct-stat-icon text-primary">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className="ct-stat-info">
                    <span className="ct-stat-label">Total Students</span>
                    <span className="ct-stat-value">{students.length}</span>
                  </div>
                </div>
                <div className="ct-stat-card">
                  <div className="ct-stat-icon text-success">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div className="ct-stat-info">
                    <span className="ct-stat-label">Marks Entered</span>
                    <span className="ct-stat-value">
                      {stats.enteredCount}
                      <span className="ct-stat-sub"> / {students.length}</span>
                    </span>
                  </div>
                </div>
                <div className="ct-stat-card">
                  <div className="ct-stat-icon text-warning">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <div className="ct-stat-info">
                    <span className="ct-stat-label">Pending Entries</span>
                    <span className="ct-stat-value">{stats.pendingCount}</span>
                  </div>
                </div>
                <div className="ct-stat-card">
                  <div className="ct-stat-icon text-info">
                    <i className="bi bi-award-fill"></i>
                  </div>
                  <div className="ct-stat-info">
                    <span className="ct-stat-label">Average Score</span>
                    <span className="ct-stat-value">
                      {stats.average}
                      <span className="ct-stat-sub"> / {totalMarks}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ct-table-caption">
                <span>Student Marks Entry</span>
                <span>{`Allowed Range: 0 - ${totalMarks}`}</span>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered align-middle ct-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 120, width: "15%" }}>Roll No.</th>
                      <th style={{ width: "50%" }}>Student Name</th>
                      <th style={{ minWidth: 180, width: "35%" }}>{`Marks (out of ${totalMarks})`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const hasMark = marksMap[student._id] !== "" && marksMap[student._id] !== undefined && marksMap[student._id] !== null;
                      return (
                        <tr key={student._id} className={hasMark ? "ct-row-assessed" : "ct-row-pending"}>
                          <td style={{ fontWeight: "700", color: "#1e293b" }}>
                            {student.rollNo || student.rollId || "-"}
                          </td>
                          <td>
                            <div className="ct-student-name-wrap">
                              <span className="ct-student-name">
                                {student.studentName || student.name || "-"}
                              </span>
                              {hasMark ? (
                                <span className="badge ct-badge-success">
                                  <i className="bi bi-check-lg me-1"></i>Entered
                                </span>
                              ) : (
                                <span className="badge ct-badge-pending">
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="ct-marks-input-wrapper">
                              <input
                                type="number"
                                className="form-control ct-marks-input"
                                min="0"
                                max={totalMarks}
                                value={marksMap[student._id] ?? ""}
                                placeholder="Enter score"
                                onChange={(e) =>
                                  handleMarksChange(student._id, e.target.value)
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
