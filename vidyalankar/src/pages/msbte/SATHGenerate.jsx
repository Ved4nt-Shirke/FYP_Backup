import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import Sidebar from "../../basic/Sidebar";
import { config } from "../../config/api";
import "./MSBTEPages.css";

const SATHGenerate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData || null;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [maxLimit, setMaxLimit] = useState(70);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const query = new URLSearchParams();
        if (CiaanData?.division) query.set("division", CiaanData.division);
        if (CiaanData?.department?._id) {
          query.set("departmentId", CiaanData.department._id);
        }
        if (CiaanData?.academicYear) {
          query.set("academicYear", CiaanData.academicYear);
        }
        if (CiaanData?.semester) {
          query.set("semester", CiaanData.semester);
        }

        const url = query.toString()
          ? `${config.students}?${query.toString()}`
          : config.students;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
          const initialMarks = {};
          data.forEach((student) => {
            initialMarks[student._id] = "";
          });

          let nextMarks = initialMarks;
          if (CiaanData?.CiaanId && CiaanData?.division) {
            const recordRes = await fetch(
              `${config.msbte}/sa-th?CiaanId=${encodeURIComponent(
                CiaanData.CiaanId,
              )}&division=${encodeURIComponent(CiaanData.division)}`,
            );
            if (recordRes.ok) {
              const recordData = await recordRes.json();
              const record = recordData?.data;
              if (record?.students?.length) {
                const marksByKey = {};
                record.students.forEach((item) => {
                  const key = `${item.rollNo || ""}::${item.studentName || ""}`;
                  marksByKey[key] = item.marks;
                });
                if (record.maxMarks) {
                  setMaxLimit(Number(record.maxMarks));
                }

                nextMarks = { ...initialMarks };
                data.forEach((student) => {
                  const key = `${student.rollNo || student.rollId || ""}::${student.studentName || student.name || ""}`;
                  if (marksByKey[key] !== undefined && marksByKey[key] !== null) {
                    nextMarks[student._id] = marksByKey[key];
                  }
                });
                setIsSaved(true);
              }
            }
          }

          setMarks(nextMarks);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [CiaanData]);

  const handleMarksChange = (studentId, value) => {
    if (value === "") {
      setMarks((prev) => ({
        ...prev,
        [studentId]: "",
      }));
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) return;

    const cappedValue = numeric > maxLimit ? maxLimit : numeric;
    setMarks((prev) => ({
      ...prev,
      [studentId]: cappedValue,
    }));
  };

  const handleMaxLimitChange = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 1) {
      setMaxLimit(1);
      return;
    }

    setMaxLimit(numeric);
    setMarks((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((studentId) => {
        const mark = next[studentId];
        if (mark !== "" && Number(mark) > numeric) {
          next[studentId] = numeric;
        }
      });
      return next;
    });
  };

  const handleSubmit = () => {
    alert("SA-TH sheet data prepared successfully.");
  };

  const handleSave = async () => {
    if (!CiaanData?.CiaanId || !CiaanData?.division) {
      alert("Please select a Ciaan first.");
      return;
    }

    setSaving(true);
    try {
      const hasInvalid = students.some((student) => {
        const value = marks[student._id];
        return value !== "" && Number(value) > Number(maxLimit);
      });

      if (hasInvalid) {
        alert(`Marks cannot be greater than limit (${maxLimit}).`);
        setSaving(false);
        return;
      }

      const payload = {
        CiaanId: Number(CiaanData.CiaanId),
        subjectName: CiaanData.subject?.name || "",
        subjectCode: CiaanData.subject?.code || "",
        courseCode: CiaanData.courseCode || CiaanData.class || "",
        academicYear: CiaanData.academicYear || "",
        division: CiaanData.division,
        maxMarks: Number(maxLimit),
        minMarks: 0,
        students: students.map((student) => ({
          studentId: student._id,
          rollNo: student.rollNo || student.rollId || student.regNumber || "",
          enrollmentNo: student.enrollmentNo || "",
          studentName: student.studentName || student.name || "",
          seatNo: student.examSeatNo || student.seatNo || student.examSeat || "",
          marks:
            marks[student._id] === "" || marks[student._id] === undefined
              ? null
              : Number(marks[student._id]),
        })),
      };

      const token = localStorage.getItem("token");
      const response = await fetch(`${config.msbte}/sa-th/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save SA-TH marks");
      }

      setIsSaved(true);
      alert("SA-TH marks saved. Continue editing from Edit page only.");
      navigate("/msbte/sa-th/edit", { state: { CiaanData } });
    } catch (error) {
      console.error("Error saving SA-TH marks:", error);
      alert(error.message || "Failed to save SA-TH marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header onMenuToggle={() => setIsSidebarVisible(!isSidebarVisible)} />
      <Sidebar
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
      />
      <div className="main-content">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        {!CiaanData && (
          <div className="alert alert-warning">
            Please select a Ciaan first for SA-TH.
            <button
              className="btn btn-sm btn-outline-secondary ms-3"
              onClick={() => navigate("/msbte/sa-th/Ciaans?mode=generate")}
            >
              Select Ciaan
            </button>
          </div>
        )}

        <h3 className="mb-4">Generate SA-TH Sheet</h3>

        {isSaved && (
          <div className="alert alert-info">
            Marks are already saved for this Ciaan/division. Generate is locked.
            Use Edit page to modify marks.
          </div>
        )}

        <div className="mb-3" style={{ maxWidth: 240 }}>
          <label className="form-label">Limit Marks</label>
          <input
            type="number"
            className="form-control"
            min="1"
            value={maxLimit}
            onChange={(e) => handleMaxLimitChange(e.target.value)}
            disabled={isSaved}
          />
        </div>

        <div className="table-responsive mt-4">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll ID</th>
                <th>Name</th>
                <th>Seat No.</th>
                <th>Marks (Max {maxLimit})</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.rollNo || student.rollId || student.regNumber || "-"}</td>
                    <td>{student.studentName || student.name || "-"}</td>
                    <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="0"
                        value={marks[student._id] || ""}
                        onChange={(e) =>
                          handleMarksChange(student._id, e.target.value)
                        }
                        min="0"
                        max={maxLimit}
                        disabled={isSaved}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <button
            className="btn btn-success me-2"
            onClick={handleSave}
            disabled={saving || isSaved}
          >
            <i className="bi bi-save"></i>{" "}
            {saving ? "Saving..." : isSaved ? "Saved" : "Save"}
          </button>
          <button className="btn btn-primary me-2" onClick={handleSubmit}>
            <i className="bi bi-download"></i> Generate Sheet
          </button>
          <button
            className="btn btn-info me-2"
            onClick={() =>
              navigate("/msbte/sa-th/print", { state: { marks, CiaanData } })
            }
          >
            <i className="bi bi-printer-fill"></i> Print Preview
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default SATHGenerate;
