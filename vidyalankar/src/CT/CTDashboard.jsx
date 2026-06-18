import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { config } from "../config/api";
import "./CTDashboard.css";

export default function CTDashboard() {
  const { ciannId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
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
    if (!ciannData) return `CT Dashboard - CIANN ${ciannId}`;
    const subjectName = ciannData.subject?.name || "Subject";
    const subjectCode = ciannData.subject?.code
      ? ` (${ciannData.subject.code})`
      : "";
    return `${subjectName}${subjectCode} - CIANN ${ciannData.ciannId || ciannId}`;
  }, [ciannData, ciannId]);

  useEffect(() => {
    const fetchCiannIfNeeded = async () => {
      if (ciannData) return;
      const response = await fetch(`${config.cianns}/${ciannId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch CIANN details");
      }
      setCiannData(data);
    };

    fetchCiannIfNeeded().catch((fetchError) => {
      setError(fetchError.message || "Failed to fetch CIANN details");
    });
  }, [ciannData, ciannId, token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!ciannId) return;

      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (ciannData?.batch) query.set("batch", ciannData.batch);
        if (ciannData?.division) query.set("division", ciannData.division);
        if (ciannData?.academicYear) query.set("academicYear", ciannData.academicYear);
        if (ciannData?.semester) query.set("semester", ciannData.semester);

        const studentsUrl = query.toString()
          ? `${config.students}?${query.toString()}`
          : config.students;

        const [studentsResponse, marksResponse] = await Promise.all([
          fetch(studentsUrl),
          fetch(`${config.apiBaseUrl}/ct-marks/${ciannId}/ct/${ctNumber}`),
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
  }, [ciannData?.batch, ciannData?.division, ciannId, ctNumber, reloadKey]);

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
    if (!ciannId) return;

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
            ciannId: Number(ciannId),
            program:
              ciannData?.department?.name ||
              ciannData?.departmentName ||
              ciannData?.department ||
              "",
            className: ciannData?.class || ciannData?.className || "",
            course: ciannData?.course || ciannData?.courseName || "",
            batch: ciannData?.batch || student.batch || "",
            division: ciannData?.division || student.division || "",
            subject: ciannData?.subject?.name || "",
            subjectCode: ciannData?.subject?.code || "",
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
          CIANN {ciannData?.ciannId || ciannId}
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
            <p>Loading students and marks...</p>
          ) : students.length === 0 ? (
            <p className="text-muted mb-0">
              No students found for this CIANN context.
            </p>
          ) : (
            <>
              <div className="ct-table-caption">
                <span>Total Students: {students.length}</span>
                <span>{`Marks range: 0-${totalMarks}`}</span>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle ct-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 120 }}>Roll No.</th>
                      <th>Name</th>
                      <th
                        style={{ minWidth: 180 }}
                      >{`Marks (out of ${totalMarks})`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.rollNo || student.rollId || "-"}</td>
                        <td>{student.studentName || student.name || "-"}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max={totalMarks}
                            value={marksMap[student._id] ?? ""}
                            onChange={(e) =>
                              handleMarksChange(student._id, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
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
