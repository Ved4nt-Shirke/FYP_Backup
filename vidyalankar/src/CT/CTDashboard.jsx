import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../basic/Header";
import { config } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const defaultRowErrors = { ct1: "", ct2: "" };

function validateMarks(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "Marks must be numeric";
  }
  if (numeric < 0 || numeric > 30) {
    return "Marks must be between 0 and 30";
  }
  return "";
}

export default function CTDashboard() {
  const { ciannId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ciannMeta, setCiannMeta] = useState(location.state?.ciannData || null);
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [selectedCt, setSelectedCt] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  const selectedCtField = selectedCt === 1 ? "ct1" : "ct2";
  const selectedCtLabel = selectedCt === 1 ? "CT-1" : "CT-2";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setGlobalError("");
        setGlobalMessage("");

        const token = localStorage.getItem("token");
        const response = await fetch(
          `${config.apiBaseUrl}/ct-marks/ciann/${ciannId}/students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load students");
        }

        setCiannMeta((prev) => prev || payload.ciann || null);
        setRows(
          (payload.data || []).map((student) => ({
            ...student,
            ct1:
              student.ct1 === null || student.ct1 === undefined
                ? ""
                : String(student.ct1),
            ct2:
              student.ct2 === null || student.ct2 === undefined
                ? ""
                : String(student.ct2),
          })),
        );
      } catch (err) {
        setGlobalError(err.message || "Failed to load CT dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ciannId]);

  const handleMarksChange = (studentId, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row._id === studentId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );

    const error = validateMarks(value);
    setRowErrors((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || defaultRowErrors),
        [field]: error,
      },
    }));
  };

  const submitAllMarks = async () => {
    const nextErrors = {};
    let hasAnyError = false;

    rows.forEach((row) => {
      const ct1Error = selectedCt === 1 ? validateMarks(row.ct1) : "";
      const ct2Error = selectedCt === 2 ? validateMarks(row.ct2) : "";
      nextErrors[row._id] = { ct1: ct1Error, ct2: ct2Error };
      if (ct1Error || ct2Error) {
        hasAnyError = true;
      }
    });

    setRowErrors(nextErrors);

    if (hasAnyError) {
      setGlobalError("Please fix invalid marks before submitting.");
      return;
    }

    const marksPayload = rows
      .filter((row) => row[selectedCtField] !== "")
      .map((row) => ({
        studentId: row._id,
        studentName: row.studentName,
        rollNo: row.rollNo,
        enrollmentNo: row.enrollmentNo,
        ct1: row.ct1 === "" ? null : Number(row.ct1),
        ct2: row.ct2 === "" ? null : Number(row.ct2),
      }));

    if (marksPayload.length === 0) {
      setGlobalError(
        `Enter at least one student's ${selectedCtLabel} marks before submitting.`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalError("");
      setGlobalMessage("");

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${config.apiBaseUrl}/ct-marks/ciann/${ciannId}/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            marks: marksPayload,
          }),
        },
      );

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save CT marks");
      }

      setGlobalMessage(`${selectedCtLabel} marks submitted successfully.`);
    } catch (err) {
      setGlobalError(err.message || "Failed to submit marks");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCtData = () => {
    const departmentName =
      ciannMeta?.department?.name || ciannMeta?.department || "-";
    const courseName = ciannMeta?.class || "-";
    const divisionName = ciannMeta?.division || "-";
    const subjectName = ciannMeta?.subject?.name || "-";
    const subjectCode = ciannMeta?.subject?.code || "-";

    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text("CT Data Report", 14, 15);

    doc.setFontSize(11);
    doc.text(`CT Type: ${selectedCtLabel}`, 14, 24);
    doc.text(`Subject: ${subjectName} (${subjectCode})`, 14, 30);
    doc.text(`Department: ${departmentName}`, 14, 36);
    doc.text(`Course: ${courseName}`, 14, 42);
    doc.text(`Division: ${divisionName}`, 14, 48);

    autoTable(doc, {
      startY: 55,
      head: [["Roll No", "Student Name", `${selectedCtLabel} Marks`]],
      body: rows.map((row) => [
        row.rollNo || "",
        row.studentName || "",
        row[selectedCtField] || "",
      ]),
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [22, 160, 133],
      },
    });

    doc.save(`${selectedCtLabel.toLowerCase()}-ciann-${ciannId}.pdf`);
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container-fluid py-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <h4 className="mb-1">Class Test Marks Entry</h4>
            <div className="text-muted">
              CIANN ID: <strong>{ciannId}</strong> | Subject:{" "}
              <strong>{ciannMeta?.subject?.name || "-"}</strong> (
              {ciannMeta?.subject?.code || "-"})
            </div>
            <div className="text-muted mt-1">
              Current CT: <strong>{selectedCtLabel}</strong>
            </div>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select"
              value={selectedCt}
              onChange={(e) => setSelectedCt(Number(e.target.value))}
              style={{ width: 120 }}
            >
              <option value={1}>CT-1</option>
              <option value={2}>CT-2</option>
            </select>
            <button
              className="btn btn-outline-primary"
              onClick={downloadCtData}
              disabled={loading || rows.length === 0}
            >
              Download PDF
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/ct-cianns")}
            >
              Back to CIANNs
            </button>
            <button
              className="btn btn-success"
              onClick={submitAllMarks}
              disabled={isSubmitting || loading || rows.length === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {globalMessage && (
          <div className="alert alert-success py-2">{globalMessage}</div>
        )}
        {globalError && (
          <div className="alert alert-danger py-2">{globalError}</div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading students...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th style={{ minWidth: 120 }}>Roll No</th>
                  <th style={{ minWidth: 280 }}>Student Name</th>
                  <th style={{ minWidth: 180 }}>
                    {selectedCtLabel} Marks (0-30)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      No students found for this CIANN.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const errors = rowErrors[row._id] || defaultRowErrors;

                    return (
                      <tr key={row._id}>
                        <td>{row.rollNo || "-"}</td>
                        <td>{row.studentName}</td>
                        <td>
                          <input
                            type="number"
                            className={`form-control ${errors[selectedCtField] ? "is-invalid" : ""}`}
                            min="0"
                            max="30"
                            value={row[selectedCtField]}
                            onChange={(e) =>
                              handleMarksChange(
                                row._id,
                                selectedCtField,
                                e.target.value,
                              )
                            }
                            placeholder={`Enter ${selectedCtLabel}`}
                          />
                          {errors[selectedCtField] && (
                            <div className="invalid-feedback d-block">
                              {errors[selectedCtField]}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
