import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const K7Print = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Query parameters
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [departmentName, setDepartmentName] = useState("");
  const [divisionName, setDivisionName] = useState("");
  const [instituteName, setInstituteName] = useState("");

  // Report configurations and data
  const [courseConfigs, setCourseConfigs] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse query params and fetch data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ay = params.get("academicYear") || "";
    const sem = params.get("semester") || "";
    const deptId = params.get("departmentId") || "";
    const divId = params.get("divisionId") || "";
    const urlCourseCode = params.get("courseCode") || "";

    setAcademicYear(ay);
    setSemester(sem);
    setDepartmentId(deptId);
    setDivisionId(divId);

    const brand = localStorage.getItem("institutionName") || "Vidyalankar Polytechnic";
    setInstituteName(brand);

    if (ay && sem && deptId && divId) {
      loadK7Data(ay, sem, deptId, divId, urlCourseCode);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  // Load K7 Saved data and details
  const loadK7Data = async (ay, sem, deptId, divId, urlCourseCode) => {
    setLoading(true);
    try {
      // Fetch department details
      const deptRes = await axios.get("/catalog/departments");
      if (deptRes.data?.success && Array.isArray(deptRes.data.departments)) {
        const dObj = deptRes.data.departments.find(d => d._id === deptId);
        if (dObj) setDepartmentName(dObj.name);
      }

      // Fetch division details
      const divRes = await axios.get(`/catalog/courses/${deptId}`);
      if (divRes.data?.success && Array.isArray(divRes.data.courses)) {
        for (const course of divRes.data.courses) {
          try {
            const divs = await axios.get(`/catalog/divisions/${course._id}`);
            if (divs.data?.success && Array.isArray(divs.data.divisions)) {
              const dObj = divs.data.divisions.find(d => d._id === divId);
              if (dObj) {
                setDivisionName(dObj.name);
                break;
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      // Query saved K7 record
      const k7Res = await axios.get(
        `/msbte/k7?academicYear=${ay}&semester=${sem}&departmentId=${deptId}&divisionId=${divId}`
      );

      if (k7Res.data?.success && k7Res.data.data) {
        const record = k7Res.data.data;
        let configs = record.courseConfigs || [];
        let stats = record.courseStats || [];
        if (urlCourseCode) {
          configs = configs.filter(c => c.courseCode.toLowerCase() === urlCourseCode.toLowerCase());
          stats = stats.filter(s => s.courseCode.toLowerCase() === urlCourseCode.toLowerCase());
        }
        setCourseConfigs(configs);
        setStudentMarks(record.studentMarks || []);
        setCourseStats(stats);
      }
    } catch (err) {
      console.error("Failed to load K7 data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Compute statistics for a course and field (Fallback if no saved stats)
  const calculateRowStats = (courseCode, field, maxMark) => {
    if (studentMarks.length === 0) return { min: "-", max: "-", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };

    const passThreshold = maxMark * 0.4;
    const above60Threshold = maxMark * 0.6;

    let min = Infinity;
    let max = -Infinity;
    let appeared = 0;
    let passed = 0;
    let above60 = 0;

    studentMarks.forEach(s => {
      const m = s.courses?.find(c => c.courseCode === courseCode);
      const val = m?.[field];

      if (val !== undefined && val !== null && val !== "") {
        const num = Number(val);
        appeared++;
        if (num < min) min = num;
        if (num > max) max = num;
        if (num >= passThreshold) passed++;
        if (num >= above60Threshold) above60++;
      }
    });

    if (appeared === 0) {
      return { min: "-", max: "-", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
    }

    return {
      min: min === Infinity ? "-" : min,
      max: max === -Infinity ? "-" : max,
      appeared,
      passed,
      passPct: Math.round((passed / appeared) * 100),
      above60Pct: Math.round((above60 / appeared) * 100)
    };
  };

  // Helper: Compute statistics for Class Test average (Final) (Fallback if no saved stats)
  const calculateFinalRowStatsFallback = (courseCode, maxMark) => {
    if (studentMarks.length === 0) return { min: "-", max: "-", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };

    const passThreshold = maxMark * 0.4;
    const above60Threshold = maxMark * 0.6;

    let min = Infinity;
    let max = -Infinity;
    let appeared = 0;
    let passed = 0;
    let above60 = 0;

    studentMarks.forEach(s => {
      const m = s.courses?.find(c => c.courseCode === courseCode);
      if (m) {
        let ct1 = m.ct1;
        let ct2 = m.ct2;
        let ctAvg = null;
        if (ct1 !== null && ct2 !== null) {
          ctAvg = (ct1 + ct2) / 2;
        } else if (ct1 !== null) {
          ctAvg = ct1;
        } else if (ct2 !== null) {
          ctAvg = ct2;
        }

        if (ctAvg !== null) {
          appeared++;
          if (ctAvg < min) min = ctAvg;
          if (ctAvg > max) max = ctAvg;
          if (ctAvg >= passThreshold) passed++;
          if (ctAvg >= above60Threshold) above60++;
        }
      }
    });

    if (appeared === 0) {
      return { min: "-", max: "-", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
    }

    return {
      min: min === Infinity ? "-" : min,
      max: max === -Infinity ? "-" : max,
      appeared,
      passed,
      passPct: Math.round((passed / appeared) * 100),
      above60Pct: Math.round((above60 / appeared) * 100)
    };
  };

  // Unified resolver for printed row statistics
  const getRowStats = (courseCode, key, maxMark) => {
    // Try to find saved stats in courseStats first
    const savedCourse = courseStats.find(s => s.courseCode === courseCode);
    const savedStat = savedCourse?.stats?.find(s => s.passingHead === key);

    if (savedStat) {
      return {
        min: savedStat.lowest !== undefined && savedStat.lowest !== "" ? savedStat.lowest : "-",
        max: savedStat.highest !== undefined && savedStat.highest !== "" ? savedStat.highest : "-",
        appeared: savedStat.appeared ?? 0,
        passed: savedStat.passed ?? 0,
        passPct: savedStat.passPct ?? 0,
        above60Pct: savedStat.above60Pct ?? 0
      };
    }

    // Fallback if no saved statistics exist
    if (key === "finalFaTh") {
      return calculateFinalRowStatsFallback(courseCode, maxMark);
    }
    return calculateRowStats(courseCode, key, maxMark);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="main-content d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Preparing report for printing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="k7-print-page-wrapper">
      {/* CSS Styling scoped for print page */}
      <style>{`
        .k7-print-page-wrapper {
          background: #f1f5f9;
          min-height: 100vh;
          padding: 40px 20px;
          color: #000000;
          font-family: 'Times New Roman', Times, serif;
        }

        .print-container {
          background: #ffffff;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          position: relative;
        }

        .print-actions-bar {
          max-width: 900px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* MSBTE Official styling */
        .msbte-header-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .msbte-header-title {
          text-align: center;
          margin-top: 10px;
          margin-bottom: 20px;
        }

        .msbte-header-title h1 {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }

        .msbte-header-title h2 {
          font-size: 14px;
          font-weight: bold;
          margin: 5px 0 0;
          text-decoration: underline;
          text-transform: uppercase;
        }

        .msbte-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 40px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .msbte-meta-item {
          display: flex;
          border-bottom: 1px dotted #000;
          padding-bottom: 2px;
        }

        .msbte-meta-label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 5px;
        }

        .msbte-meta-value {
          flex-grow: 1;
        }

        .k7-report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }

        .k7-report-table th,
        .k7-report-table td {
          border: 1px solid #000000;
          padding: 6px 4px;
          text-align: center;
          vertical-align: middle;
        }

        .k7-report-table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }

        .passing-head-cell {
          text-align: left !important;
          padding-left: 10px !important;
        }

        .passing-head-cell.child-head {
          padding-left: 25px !important;
          font-style: italic;
        }

        .k7-footer-signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          margin-bottom: 30px;
          font-size: 13px;
        }

        .signature-block {
          width: 250px;
        }

        .signature-line {
          height: 50px;
        }

        .disclaimer-note {
          font-size: 12px;
          font-style: italic;
          margin-top: 20px;
          margin-bottom: 20px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }

        .page-footer-border {
          border-top: 2px double #000;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: bold;
          margin-top: 40px;
        }

        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .k7-print-page-wrapper {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .print-actions-bar {
            display: none !important;
          }
          .k7-report-table th {
            background-color: transparent !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>

      {/* Printing controls */}
      <div className="print-actions-bar">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ background: "#64748b", color: "#fff", border: "none" }}
        >
          <i className="bi bi-arrow-left"></i> Selection
        </button>
        <button
          className="btn btn-primary"
          onClick={handlePrint}
          style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "600" }}
        >
          <i className="bi bi-printer"></i> Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="print-container">
        {/* Top Header Labels */}
        <div className="msbte-header-top">
          <div>For AICTE Diploma Engineering Courses</div>
          <div style={{ textAlign: "right" }}>
            <div>CIAAN – 2023</div>
            <div>K7 (PART B)</div>
            <div>wef - 2023-24</div>
          </div>
        </div>

        {/* Center Title */}
        <div className="msbte-header-title">
          <h1>Maharashtra State Board of Technical Education</h1>
          <h2>Analysis of Term End Examination Result</h2>
        </div>

        {/* Top Metadata Fields */}
        <div className="msbte-meta-grid">
          <div className="msbte-meta-item">
            <span className="msbte-meta-label">Institute Name:</span>
            <span className="msbte-meta-value">{instituteName}</span>
          </div>
          <div className="msbte-meta-item">
            <span className="msbte-meta-label">Academic Year:</span>
            <span className="msbte-meta-value">{academicYear}</span>
          </div>
          <div className="msbte-meta-item">
            <span className="msbte-meta-label">Programme:</span>
            <span className="msbte-meta-value">{departmentName}</span>
          </div>
          <div className="msbte-meta-item">
            <span className="msbte-meta-label">Semester:</span>
            <span className="msbte-meta-value">{semester}</span>
          </div>
          <div className="msbte-meta-item" style={{ gridColumn: "span 2" }}>
            <span className="msbte-meta-label">Exam:</span>
            <span className="msbte-meta-value">{academicYear} ({divisionName ? `Division ${divisionName}` : ""})</span>
          </div>
        </div>

        {/* Main Analysis Table */}
        <table className="k7-report-table">
          <thead>
            <tr>
              <th style={{ width: "6%" }}>Sr. No.</th>
              <th style={{ width: "10%" }}>Course Code</th>
              <th style={{ width: "22%" }}>Name of Course</th>
              <th style={{ width: "16%" }}>Passing Head</th>
              <th style={{ width: "10%" }}>Marks obtained Lowest</th>
              <th style={{ width: "10%" }}>Marks Obtained Highest</th>
              <th style={{ width: "9%" }}>No. of students Appeared</th>
              <th style={{ width: "9%" }}>No. of students Passed</th>
              <th style={{ width: "8%" }}>% Pass</th>
              <th style={{ width: "10%" }}>% of students above 60%</th>
            </tr>
          </thead>
          <tbody>
            {courseConfigs.length === 0 ? (
              <tr>
                <td colSpan="10">No subject analysis data found. Add configurations first.</td>
              </tr>
            ) : (
              courseConfigs.map((config, cIdx) => {
                const max = config.maxMarks || {};
                const savedCourse = courseStats.find(s => s.courseCode === config.courseCode);
                const hasSavedStats = savedCourse && Array.isArray(savedCourse.stats) && savedCourse.stats.length > 0;

                // Define standard components list matching the database stats array keys
                const components = [
                  { key: "faTh", label: "FA-TH", maxMark: max.faTh || 30 },
                  { key: "saTh", label: "SA-TH", maxMark: max.saTh || 70 },
                  { key: "faPr", label: "FA-PR", maxMark: max.faPr || 25 },
                  { key: "saPr", label: "SA-PR", maxMark: max.saPr || 25 },
                  { key: "sla", label: "SLA", maxMark: max.sla || 25 }
                ];

                return components.map((comp, compIdx) => {
                  const stats = getRowStats(config.courseCode, comp.key, comp.maxMark);
                  
                  return (
                    <tr key={`${config.courseCode}-${comp.key}`} style={{ pageBreakInside: "avoid" }}>
                      {compIdx === 0 && (
                        <>
                          <td rowSpan={components.length}>{cIdx + 1}</td>
                          <td rowSpan={components.length}>{config.courseCode}</td>
                          <td rowSpan={components.length} style={{ textAlign: "left", paddingLeft: "6px" }}>{config.courseName}</td>
                        </>
                      )}
                      
                      <td className="passing-head-cell">
                        {comp.label}
                      </td>
                      
                      <td>{stats.min}</td>
                      <td>{stats.max}</td>
                      <td>{stats.appeared}</td>
                      <td>{stats.passed}</td>
                      <td>{stats.appeared > 0 ? `${stats.passPct}%` : "-"}</td>
                      <td>{stats.appeared > 0 ? `${stats.above60Pct}%` : "-"}</td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>

        {/* Bottom footer blocks */}
        <div className="k7-footer-signatures">
          <div className="signature-block">
            <div className="signature-line"></div>
            <strong>Signature of Academic Co-ordinator</strong>
            <div>Name: __________________________</div>
            <div style={{ marginTop: "4px" }}>Designation: ____________________</div>
          </div>
          <div className="signature-block" style={{ textAlign: "right" }}>
            <div className="signature-line"></div>
            <strong>Signature of HoD</strong>
            <div>Name: __________________________</div>
          </div>
        </div>

        {/* Regular status note */}
        <div className="disclaimer-note">
          Note: Consider only Regular status students for the result analysis.
        </div>

        {/* Board bottom label line */}
        <div className="page-footer-border">
          <div>Maharashtra State Board of Technical Education, Mumbai</div>
          <div>Page | 1</div>
        </div>
      </div>
    </div>
  );
};

export default K7Print;
