import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";

export default function PTMarksEntry() {
  const location = useLocation();
  const navigate = useNavigate();

  const { ciann, subject, config } = location.state || {};

  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({}); // studentId -> { componentName -> marks }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState({ average: 0, highest: 0, lowest: 0 });

  useEffect(() => {
    if (!ciann || !subject || !config) {
      navigate("/pt-microproject/dashboard");
      return;
    }

    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const subjectId = subject._id || subject.subjectId || ciann.subject?._id;

        // Fetch CIANN Students
        const studentsRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/students/${ciann.ciannId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const studentsData = await studentsRes.json();
        
        let loadedStudents = [];
        if (studentsData.success && Array.isArray(studentsData.data)) {
          loadedStudents = studentsData.data;
          setStudents(loadedStudents);
        }

        // Fetch Saved Marks
        const marksRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/marks/${ciann.ciannId}/${subjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const marksResData = await marksRes.json();

        const initialMarks = {};
        let lockedState = false;

        if (marksResData.success && Array.isArray(marksResData.data)) {
          marksResData.data.forEach((entry) => {
            const studentId = entry.studentId?._id || entry.studentId;
            initialMarks[studentId] = {};
            
            entry.marks.forEach((m) => {
              initialMarks[studentId][m.componentName] = m.obtainedMarks;
            });

            if (entry.status === "submitted") {
              lockedState = true;
            }
          });
        }

        // Initialize missing student entries
        loadedStudents.forEach((student) => {
          if (!initialMarks[student._id]) {
            initialMarks[student._id] = {};
          }
          config.components.forEach((comp) => {
            if (initialMarks[student._id][comp.componentName] === undefined) {
              initialMarks[student._id][comp.componentName] = "";
            }
          });
        });

        setMarksData(initialMarks);
        setIsLocked(lockedState);
      } catch (err) {
        console.error("Error loading PT Marks Entry data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ciann, subject, config, navigate]);

  // Recalculate Class Analytics in real-time
  useEffect(() => {
    if (students.length === 0) return;

    let totalScoreSum = 0;
    let highest = 0;
    let lowest = Infinity;
    let studentCount = 0;

    students.forEach((student) => {
      const studentMarks = marksData[student._id] || {};
      let studentSum = 0;
      let hasEnteredMarks = false;

      config.components.forEach((comp) => {
        const val = studentMarks[comp.componentName];
        if (val !== "" && val !== undefined) {
          studentSum += Number(val);
          hasEnteredMarks = true;
        }
      });

      if (hasEnteredMarks) {
        totalScoreSum += studentSum;
        if (studentSum > highest) highest = studentSum;
        if (studentSum < lowest) lowest = studentSum;
        studentCount++;
      }
    });

    setAnalytics({
      average: studentCount > 0 ? (totalScoreSum / studentCount).toFixed(2) : 0,
      highest: highest,
      lowest: lowest === Infinity ? 0 : lowest,
    });
  }, [marksData, students, config]);

  const handleMarkChange = (studentId, componentName, value, maxMarks) => {
    if (isLocked) return;

    if (value === "") {
      setMarksData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [componentName]: "",
        },
      }));
      return;
    }

    const numericVal = parseFloat(value);
    if (isNaN(numericVal)) return;

    // Validation checks
    if (numericVal < 0 || numericVal > maxMarks) {
      return; // reject immediately
    }

    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [componentName]: numericVal,
      },
    }));
  };

  const getStudentTotal = (studentId) => {
    const studentMarks = marksData[studentId] || {};
    return config.components.reduce((sum, comp) => {
      const val = studentMarks[comp.componentName];
      return sum + (val === "" || val === undefined ? 0 : Number(val));
    }, 0);
  };

  const handleSaveMarks = async (status) => {
    // Validate that all students have marks entered if submitting final
    if (status === "submitted") {
      let incomplete = false;
      students.forEach((student) => {
        config.components.forEach((comp) => {
          const val = marksData[student._id]?.[comp.componentName];
          if (val === "" || val === undefined) {
            incomplete = true;
          }
        });
      });

      if (incomplete) {
        const confirmSubmit = window.confirm(
          "Warning: Some students have missing marks. Do you still want to submit final marks?"
        );
        if (!confirmSubmit) return;
      } else {
        const confirmSubmit = window.confirm(
          "Are you sure you want to SUBMIT final marks? This will lock the entries."
        );
        if (!confirmSubmit) return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const subjectId = subject._id || subject.subjectId || ciann.subject?._id;

      const studentsMarksPayload = students.map((student) => {
        const sMarks = marksData[student._id] || {};
        const marksBreakdown = config.components.map((comp) => ({
          componentName: comp.componentName,
          obtainedMarks: sMarks[comp.componentName] === "" ? 0 : Number(sMarks[comp.componentName]),
          maxMarks: comp.maxMarks,
        }));

        return {
          studentId: student._id,
          marks: marksBreakdown,
          totalMarks: getStudentTotal(student._id),
        };
      });

      const bodyPayload = {
        ciannId: ciann.ciannId,
        subjectId,
        status,
        studentsMarks: studentsMarksPayload,
      };

      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/marks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Marks saved successfully as ${status.toUpperCase()}!`);
        if (status === "submitted") {
          setIsLocked(true);
        }
      } else {
        alert(data.message || "Failed to save marks");
      }
    } catch (err) {
      console.error("Error saving PT marks:", err);
      alert("Error saving marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlockMarks = () => {
    const confirmUnlock = window.confirm(
      "Are you sure you want to EDIT submitted marks? You will need to re-submit final marks when done."
    );
    if (confirmUnlock) {
      setIsLocked(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    const headers = ["Roll No", "Student Name", ...config.components.map((c) => c.componentName), "Total Obtained", "SLA Max Marks"];
    csvContent += headers.join(",") + "\n";

    // Rows
    students.forEach((student) => {
      const studentMarks = marksData[student._id] || {};
      const row = [
        student.rollNo,
        student.studentName,
        ...config.components.map((c) => studentMarks[c.componentName] ?? ""),
        getStudentTotal(student._id),
        config.slaMarks,
      ];
      csvContent += row.map((val) => `"${val}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PT_Marks_${subject.code || "Subject"}_CIANN_${ciann.ciannId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!ciann || !subject || !config) return null;

  return (
    <>
      <Header showSearch={false} />
      <div className="container-fluid py-5 px-md-5">
        {/* Navigation / Header Buttons */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div className="d-flex gap-2">
            <button
              onClick={() => navigate("/pt-microproject/dashboard")}
              className="btn btn-outline-secondary btn-sm px-3 rounded-pill d-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> Dashboard
            </button>
            <button
              onClick={() => navigate("/pt-microproject/configuration", { state: { ciann, subject, config } })}
              className="btn btn-outline-success btn-sm px-3 rounded-pill d-flex align-items-center gap-2"
            >
              <i className="bi bi-gear-fill"></i> Edit Structure
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {isLocked ? (
              <span className="badge bg-success fs-6 px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                <i className="bi bi-lock-fill"></i> Marks Submitted & Locked
              </span>
            ) : (
              <span className="badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                <i className="bi bi-pencil-fill"></i> Editing Mode (Draft)
              </span>
            )}
            {isLocked && (
              <button
                type="button"
                onClick={handleUnlockMarks}
                className="btn btn-warning btn-sm px-3 rounded-pill fw-semibold d-flex align-items-center gap-1"
              >
                <i className="bi bi-unlock-fill"></i> Edit Submitted Marks
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="btn btn-outline-dark btn-sm px-3 rounded-pill d-flex align-items-center gap-2"
            >
              <i className="bi bi-file-earmark-spreadsheet"></i> Export CSV
            </button>
          </div>
        </div>

        {/* Subject Detail banner */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{
          background: "linear-gradient(to right, #1f4037, #2d5a27)",
          color: "white"
        }}>
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="fw-bold mb-1">{subject.name}</h2>
              <p className="mb-0 text-white-50">
                Course: {ciann.department?.name || "Computer Engineering"} &bull; Sem {ciann.semester} &bull; Division {ciann.division} &bull; AY {ciann.academicYear}
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <span className="text-white-50 d-block small">SLA Available Marks</span>
              <strong className="fs-3">{config.slaMarks} Max Marks</strong>
            </div>
          </div>
        </div>

        {/* Performance Analytics Widget */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-center bg-white">
              <span className="text-muted small uppercase fw-bold">Class Average</span>
              <h3 className="fw-bold text-success mt-1 mb-0">{analytics.average} / {config.slaMarks}</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-center bg-white">
              <span className="text-muted small uppercase fw-bold">Highest Score</span>
              <h3 className="fw-bold text-success mt-1 mb-0">{analytics.highest} / {config.slaMarks}</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-center bg-white">
              <span className="text-muted small uppercase fw-bold">Lowest Score</span>
              <h3 className="fw-bold text-success mt-1 mb-0">{analytics.lowest} / {config.slaMarks}</h3>
            </div>
          </div>
        </div>

        {/* Search bar & Save Actions */}
        <div className="row mb-3">
          <div className="col-md-4 mb-2 mb-md-0">
            <div className="input-group">
              <span className="input-group-text bg-white border-0 shadow-sm">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                placeholder="Search Roll No or Student Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control border-0 shadow-sm rounded-end-3"
              />
            </div>
          </div>
          <div className="col-md-8 text-md-end d-flex justify-content-md-end gap-2 flex-wrap">
            {!isLocked && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveMarks("draft")}
                  disabled={saving}
                  className="btn btn-outline-success rounded-pill px-4 fw-semibold"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMarks("submitted")}
                  disabled={saving}
                  className="btn btn-success rounded-pill px-4 fw-bold"
                >
                  Submit Final Marks
                </button>
              </>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading students & saved marks...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5 bg-white">
              <i className="bi bi-people fs-1 text-muted"></i>
              <h5 className="text-muted mt-2">No students found</h5>
              <p className="text-secondary small mb-0">No records found matching the search criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "100px" }}>Roll No</th>
                    <th>Student Name</th>
                    {config.components.map((comp) => (
                      <th key={comp.componentName} className="text-center" style={{ minWidth: "130px" }}>
                        {comp.componentName} (Max {comp.maxMarks})
                      </th>
                    ))}
                    <th className="text-center fw-bold" style={{ width: "120px" }}>
                      Total ({config.slaMarks})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const studentMarks = marksData[student._id] || {};
                    const totalObtained = getStudentTotal(student._id);

                    return (
                      <tr key={student._id}>
                        <td>
                          <span className="fw-semibold text-secondary">{student.rollNo}</span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{student.studentName}</div>
                          <div className="text-muted small">Enroll: {student.enrollmentNo}</div>
                        </td>
                        {config.components.map((comp) => {
                          const val = studentMarks[comp.componentName];
                          const isInvalid = val !== "" && val !== undefined && (val < 0 || val > comp.maxMarks);

                          return (
                            <td key={comp.componentName}>
                              <div className="mx-auto" style={{ maxWidth: "100px" }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxMarks}
                                  disabled={isLocked}
                                  placeholder="Marks"
                                  value={val ?? ""}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      student._id,
                                      comp.componentName,
                                      e.target.value,
                                      comp.maxMarks
                                    )
                                  }
                                  className={`form-control text-center rounded-3 shadow-sm ${
                                    isInvalid ? "is-invalid border-danger" : "border-0 bg-light"
                                  }`}
                                  style={{
                                    fontWeight: "600",
                                    color: isLocked ? "#6c757d" : "#212529",
                                  }}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-center">
                          <span className={`fs-5 fw-bold ${totalObtained > config.slaMarks ? "text-danger" : "text-success"}`}>
                            {totalObtained}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
