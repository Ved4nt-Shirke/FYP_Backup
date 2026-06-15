import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "./k4.css";

const K4MarksForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useParams();
  const ciannData = location.state?.ciannData || null;
  const division = ciannData?.division || "";

  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [seatData, setSeatData] = useState({});
  const [maxMarks, setMaxMarks] = useState(50);
  const [minMarks, setMinMarks] = useState(0);
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";

  const facultyName = useMemo(() => {
    const username = localStorage.getItem("username") || "";
    if (!username) {
      return "Faculty";
    }
    if (username.includes(".")) {
      return username
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!ciannData || !division) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const studentResponse = await axios.get(config.students, {
          params: { division },
        });

        const studentList = Array.isArray(studentResponse.data)
          ? studentResponse.data
          : [];

        let record = null;
        if (isEdit) {
          const recordResponse = await axios.get(`${config.msbte}/sa-pr-k4`, {
            params: { ciannId: ciannData.ciannId, division },
          });
          record = recordResponse.data?.data || null;
          if (!record) {
            setError("No saved marks found for this division.");
          }
        }

        const mergedStudents = studentList.length
          ? studentList
          : record?.students || [];

        const marksMap = {};
        const seatMap = {};

        // 1. Populate seat numbers from the student list (office staff entries)
        studentList.forEach((student) => {
          const key = student._id || student.studentId || student.enrollmentNo || student.rollNo;
          if (key) {
            seatMap[key] = student.seatNo || "";
          }
        });

        // 2. Overwrite marks and check/overwrite seat numbers from the saved K4 record
        (record?.students || []).forEach((student) => {
          const key = student.studentId || student.enrollmentNo || student.rollNo;
          if (key) {
            marksMap[key] = student.marks ?? "";
            if (!seatMap[key] && student.seatNo) {
              seatMap[key] = student.seatNo;
            }
          }
        });

        if (record) {
          setMaxMarks(record.maxMarks || 50);
          setMinMarks(record.minMarks ?? 0);
          setExamDate(
            record.examDate ? record.examDate.slice(0, 10) : "",
          );
        }

        setStudents(mergedStudents);
        setMarksData(marksMap);
        setSeatData(seatMap);
      } catch (err) {
        console.error("Error loading K4 data:", err);
        setError("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ciannData, division, isEdit]);

  const handleMarkChange = (key, value) => {
    setMarksData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeatChange = (key, value) => {
    setSeatData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");

    if (!ciannData || !division) {
      setError("CIANN or division information is missing.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ciannId: ciannData.ciannId,
        subjectName: ciannData.subject?.name || "",
        subjectCode: ciannData.subject?.code || "",
        courseCode: ciannData.class || "",
        academicYear: ciannData.academicYear || "",
        division,
        examDate: examDate || null,
        maxMarks: Number(maxMarks),
        minMarks: Number(minMarks),
        students: students.map((student) => {
          const key = student._id || student.studentId || student.enrollmentNo || student.rollNo;
          return {
            studentId: student._id || student.studentId || null,
            rollNo: student.rollNo || "",
            enrollmentNo: student.enrollmentNo || "",
            studentName: student.studentName || "",
            seatNo: seatData[key] || "",
            marks: marksData[key] ?? "",
          };
        }),
      };

      await axios.post(`${config.msbte}/sa-pr-k4/save`, payload);
      navigate("/msbte/k4/edit", { replace: true });
    } catch (err) {
      console.error("Error saving K4 marks:", err);
      setError("Failed to save marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ciannData || !division) {
    return (
      <>
        <Header showSearch={false} />
        <div className="k4-page">
          <div className="k4-form-card">
            <p className="k4-error">CIANN or division is missing.</p>
            <button
              className="btn btn-success"
              onClick={() => navigate(`/msbte/k4/${mode}`)}
            >
              Back to CIANN list
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div className="k4-page">
          <div className="k4-form-card">Loading student list...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <div className="k4-page">
        <div className="k4-marks-card">
          <div className="k4-marks-header">
            <h3>{isEdit ? "Edit" : "Generate"} SA-PR Sheet</h3>
            <div className="k4-meta-grid">
              <div>
                <strong>Academic Year:</strong> {ciannData.academicYear || ""}
              </div>
              <div>
                <strong>Course and Code:</strong> {ciannData.class || ""}
              </div>
              <div>
                <strong>Subject and Code:</strong> {ciannData.subject?.name} (
                {ciannData.subject?.code})
              </div>
              <div>
                <strong>Name of Faculty:</strong> {facultyName}
              </div>
              <div>
                <strong>Division:</strong> {division}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="k4-input-row">
              <div>
                <label className="k4-label">Marks: Max</label>
                <input
                  type="number"
                  className="form-control"
                  value={maxMarks}
                  onChange={(event) => setMaxMarks(event.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="k4-label">Min</label>
                <input
                  type="number"
                  className="form-control"
                  value={minMarks}
                  onChange={(event) => setMinMarks(event.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="k4-label">Date of Examination</label>
                <input
                  type="date"
                  className="form-control"
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                />
              </div>
            </div>

            {error && <div className="k4-error mb-3">{error}</div>}

            <div className="table-responsive">
              <table className="table table-bordered k4-marks-table">
                <thead>
                  <tr>
                    <th>Roll ID</th>
                    <th>Name</th>
                    <th>Seat No.</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students]
                    .sort((a, b) =>
                      String(a.rollNo || "").localeCompare(
                        String(b.rollNo || ""),
                        undefined,
                        { numeric: true },
                      ),
                    )
                    .map((student) => {
                    const key = student._id || student.studentId || student.enrollmentNo || student.rollNo;
                    return (
                      <tr key={key}>
                        <td>{student.rollNo || student.enrollmentNo || "-"}</td>
                        <td>{student.studentName || "-"}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={seatData[key] || ""}
                            onChange={(event) =>
                              handleSeatChange(key, event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={marksData[key] ?? ""}
                            onChange={(event) =>
                              handleMarkChange(key, event.target.value)
                            }
                            min={minMarks}
                            max={maxMarks}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="k4-submit-bar">
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default K4MarksForm;
