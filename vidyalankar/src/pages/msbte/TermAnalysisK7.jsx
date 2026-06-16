import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const TermAnalysisK7 = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role") || "faculty";
  const isHodOrCoordinator = userRole === "hod" || userRole === "academic_coordinator";

  const [records, setRecords] = useState([]);
  const [cianns, setCianns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCiannId, setSelectedCiannId] = useState("");
  const [saving, setSaving] = useState(false);

  // HOD/Coordinator Combined View Tab & Filter States
  const [activeTab, setActiveTab] = useState("list");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterExamType, setFilterExamType] = useState("");

  useEffect(() => {
    if (records.length > 0) {
      const years = Array.from(new Set(records.map((r) => r.academicYear).filter(Boolean)));
      const sems = Array.from(new Set(records.map((r) => r.semester).filter(Boolean))).sort();
      const exams = Array.from(new Set(records.map((r) => r.examType).filter(Boolean)));
      
      if (years.length > 0 && !filterYear) setFilterYear(years[0]);
      if (sems.length > 0 && !filterSemester) setFilterSemester(sems[0]);
      if (exams.length > 0 && !filterExamType) setFilterExamType(exams[0]);
    }
  }, [records]);

  // Form fields
  const [recordId, setRecordId] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [division, setDivision] = useState("");
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");

  // Stats for the 7 passing heads (including CT1, CT2, and FA-TH average)
  const defaultHeads = [
    { passingHead: "CT1", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "CT2", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "FA-TH", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "SA-TH", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "FA-PR", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "SA-PR", enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
    { passingHead: "SLA",   enabled: true, lowestMarks: 0, highestMarks: 0, appearedStudents: 0, passedStudents: 0, above60Percentage: 0 },
  ];
  const [heads, setHeads] = useState(defaultHeads);

  const calculateFaThAverage = (updatedHeads) => {
    const ct1 = updatedHeads.find((h) => h.passingHead === "CT1");
    const ct2 = updatedHeads.find((h) => h.passingHead === "CT2");
    const fath = updatedHeads.find((h) => h.passingHead === "FA-TH");

    if (ct1 && ct2 && fath) {
      fath.lowestMarks = Number(((ct1.lowestMarks + ct2.lowestMarks) / 2).toFixed(1));
      fath.highestMarks = Number(((ct1.highestMarks + ct2.highestMarks) / 2).toFixed(1));
      fath.appearedStudents = Number(((ct1.appearedStudents + ct2.appearedStudents) / 2).toFixed(1));
      fath.passedStudents = Number(((ct1.passedStudents + ct2.passedStudents) / 2).toFixed(1));
      fath.above60Percentage = Number(((ct1.above60Percentage + ct2.above60Percentage) / 2).toFixed(1));
      fath.enabled = ct1.enabled && ct2.enabled;
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/msbte/term-analysis-k7");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch K7 records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCianns = async () => {
    try {
      const res = await axios.get("/cianns");
      if (Array.isArray(res.data)) {
        setCianns(res.data);
      }
    } catch (err) {
      console.error("Failed to load CIANNs:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchCianns();
  }, []);

  const handleCiannChangeInForm = (e) => {
    const cid = e.target.value;
    setSelectedCiannId(cid);
    if (!cid) return;

    const ciannObj = cianns.find((c) => String(c.ciannId) === String(cid));
    if (ciannObj) {
      setAcademicYear(ciannObj.academicYear || "");
      setProgramme(ciannObj.department?.name || ciannObj.department || "");
      setDivision(ciannObj.division || "");
      setSemester(ciannObj.semester || "");
      setCourseCode(ciannObj.subject?.code || "");
      setCourseName(ciannObj.subject?.name || "");
    }
  };

  const openCreateModal = () => {
    setRecordId("");
    setSelectedCiannId("");
    setInstituteName(localStorage.getItem("institutionName") || "Vidyalankar Polytechnic");
    setAcademicYear("");
    setProgramme("");
    setDivision("");
    setSemester("");
    setExamType("");
    setCourseCode("");
    setCourseName("");
    setHeads(defaultHeads);
    setShowModal(true);
  };

  const openEditModal = (rec) => {
    setRecordId(rec._id);
    setSelectedCiannId(rec.ciannId);
    setInstituteName(rec.instituteName || "");
    setAcademicYear(rec.academicYear || "");
    setProgramme(rec.programme || "");
    setDivision(rec.division || "");
    setSemester(rec.semester || "");
    setExamType(rec.examType || "");
    setCourseCode(rec.courseCode || "");
    setCourseName(rec.courseName || "");
    
    // Map saved heads, default missing ones
    const mappedHeads = defaultHeads.map((defHead) => {
      const savedHead = rec.heads?.find((h) => h.passingHead === defHead.passingHead);
      if (savedHead) {
        return { ...defHead, ...savedHead, enabled: true };
      }
      if (defHead.passingHead === "CT1" || defHead.passingHead === "CT2") {
        return { ...defHead, enabled: true };
      }
      return { ...defHead, enabled: false };
    });
    calculateFaThAverage(mappedHeads);
    setHeads(mappedHeads);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this term end exam analysis?")) {
      return;
    }
    try {
      const res = await axios.delete(`/msbte/term-analysis-k7/${id}`);
      if (res.data?.success) {
        alert("Record deleted successfully.");
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to delete K7 record:", err);
      alert("Error deleting record.");
    }
  };

  const handleHeadFieldChange = (index, field, value) => {
    const updated = [...heads];
    updated[index][field] = field === "enabled" ? value : Number(value);

    // Auto-calculate average if changing CT1 or CT2 or their enabled state
    if (updated[index].passingHead === "CT1" || updated[index].passingHead === "CT2") {
      calculateFaThAverage(updated);
    }

    setHeads(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedCiannId) {
      alert("Please select a CIANN.");
      return;
    }
    setSaving(true);
    try {
      const enabledHeads = heads.filter((h) => h.enabled).map((h) => ({
        passingHead: h.passingHead,
        lowestMarks: h.lowestMarks,
        highestMarks: h.highestMarks,
        appearedStudents: h.appearedStudents,
        passedStudents: h.passedStudents,
        above60Percentage: h.above60Percentage,
      }));

      const payload = {
        id: recordId || undefined,
        ciannId: Number(selectedCiannId),
        instituteName,
        academicYear,
        programme,
        division,
        semester,
        examType,
        courseCode,
        courseName,
        heads: enabledHeads,
      };

      const res = await axios.post("/msbte/term-analysis-k7/save", payload);
      if (res.data?.success) {
        alert("Term Analysis saved successfully.");
        setShowModal(false);
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to save K7 Term Analysis:", err);
      alert(err.response?.data?.message || "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="main-content"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <button
          className="btn btn-secondary mb-4"
          onClick={() => navigate(-1)}
          style={{
            background: "#64748b",
            border: "1px solid #475569",
            color: "#fff",
          }}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
              MSBTE CIAAN-2023
            </p>
            <h2 style={{ margin: "4px 0 0", fontWeight: 700, color: "#0f172a" }}>
              Analysis of Term End Exam Result (K7 Part B)
            </h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{
              background: "#4f46e5",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
            }}
          >
            <i className="bi bi-plus-lg"></i> New Term Analysis
          </button>
        </div>

        {isHodOrCoordinator && (
          <div className="d-flex gap-2 mb-4" style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
            <button
              className="btn btn-sm"
              onClick={() => setActiveTab("list")}
              style={{
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "6px",
                background: activeTab === "list" ? "#4f46e5" : "transparent",
                color: activeTab === "list" ? "#fff" : "#64748b",
                border: "none"
              }}
            >
              <i className="bi bi-list-task"></i> Saved Reports List
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setActiveTab("combined")}
              style={{
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "6px",
                background: activeTab === "combined" ? "#4f46e5" : "transparent",
                color: activeTab === "combined" ? "#fff" : "#64748b",
                border: "none"
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i> Combined Department Sheet
            </button>
          </div>
        )}

        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        >
          <h5 style={{ fontWeight: 600, color: "#4f46e5", marginBottom: "20px" }}>
            {activeTab === "combined" ? "Combined Department Result Sheet" : "Saved Term Analysis Formats"}
          </h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading reports...</p>
            </div>
          ) : activeTab === "combined" && isHodOrCoordinator ? (
            <div>
              {/* Filter controls */}
              <div className="row g-3 align-items-end mb-4 p-3" style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div className="col-md-3">
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Academic Year</label>
                  <select
                    className="form-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="">-- All Years --</option>
                    {Array.from(new Set(records.map((r) => r.academicYear).filter(Boolean))).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Semester</label>
                  <select
                    className="form-select"
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    style={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="">-- All Semesters --</option>
                    {Array.from(new Set(records.map((r) => r.semester).filter(Boolean))).sort().map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Exam Type</label>
                  <select
                    className="form-select"
                    value={filterExamType}
                    onChange={(e) => setFilterExamType(e.target.value)}
                    style={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="">-- All Exams --</option>
                    {Array.from(new Set(records.map((r) => r.examType).filter(Boolean))).map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 text-end">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => {
                      const filteredRecords = records.filter((r) =>
                        (!filterYear || r.academicYear === filterYear) &&
                        (!filterSemester || String(r.semester) === String(filterSemester)) &&
                        (!filterExamType || r.examType === filterExamType)
                      );
                      if (filteredRecords.length === 0) {
                        alert("No records to print. Adjust filters or ensure faculty have saved data.");
                        return;
                      }
                      navigate("/msbte/term-analysis/print", {
                        state: {
                          records: filteredRecords,
                          isCombined: true,
                          filterMeta: {
                            academicYear: filterYear,
                            semester: filterSemester,
                            examType: filterExamType,
                            programme: filteredRecords[0]?.programme || "",
                            instituteName: filteredRecords[0]?.instituteName || "Vidyalankar Polytechnic"
                          }
                        }
                      });
                    }}
                    style={{
                      background: "#0ea5e9",
                      color: "#fff",
                      borderRadius: "8px",
                      fontWeight: "600",
                      padding: "8px 16px",
                      border: "none"
                    }}
                    disabled={
                      records.filter((r) =>
                        (!filterYear || r.academicYear === filterYear) &&
                        (!filterSemester || String(r.semester) === String(filterSemester)) &&
                        (!filterExamType || r.examType === filterExamType)
                      ).length === 0
                    }
                  >
                    <i className="bi bi-printer-fill"></i> Print Combined Report
                  </button>
                </div>
              </div>

              {records.filter((r) =>
                (!filterYear || r.academicYear === filterYear) &&
                (!filterSemester || String(r.semester) === String(filterSemester)) &&
                (!filterExamType || r.examType === filterExamType)
              ).length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-funnel" style={{ fontSize: "2.5rem", opacity: 0.5 }}></i>
                  <p className="mt-3">No term analysis records match the selected filters.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <table className="table table-bordered align-middle mb-0" style={{ fontSize: "0.9rem", color: "#334155" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#0f172a", textAlign: "center" }}>
                        <th style={{ width: "6%" }}>Sr. No.</th>
                        <th style={{ width: "12%" }}>Course Code</th>
                        <th style={{ width: "20%" }}>Name of Course</th>
                        <th style={{ width: "12%" }}>Passing Head</th>
                        <th style={{ width: "8%" }}>Lowest</th>
                        <th style={{ width: "8%" }}>Highest</th>
                        <th style={{ width: "8%" }}>Appeared</th>
                        <th style={{ width: "8%" }}>Passed</th>
                        <th style={{ width: "8%" }}>% Pass</th>
                        <th style={{ width: "10%" }}>% &gt; 60%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records
                        .filter((r) =>
                          (!filterYear || r.academicYear === filterYear) &&
                          (!filterSemester || String(r.semester) === String(filterSemester)) &&
                          (!filterExamType || r.examType === filterExamType)
                        )
                        .map((rec, recIdx) => {
                          const passingHeadsList = ["CT1", "CT2", "FA-TH", "SA-TH", "FA-PR", "SA-PR", "SLA"];
                          const headDataMap = {};
                          passingHeadsList.forEach((headName) => {
                            const found = rec.heads?.find((h) => h.passingHead === headName);
                            headDataMap[headName] = found || null;
                          });

                          // Dynamically recalculate FA-TH if CT1 and CT2 are present
                          if (headDataMap["CT1"] && headDataMap["CT2"]) {
                            const ct1 = headDataMap["CT1"];
                            const ct2 = headDataMap["CT2"];
                            headDataMap["FA-TH"] = {
                              passingHead: "FA-TH",
                              lowestMarks: Number(((ct1.lowestMarks + ct2.lowestMarks) / 2).toFixed(1)),
                              highestMarks: Number(((ct1.highestMarks + ct2.highestMarks) / 2).toFixed(1)),
                              appearedStudents: Number(((ct1.appearedStudents + ct2.appearedStudents) / 2).toFixed(1)),
                              passedStudents: Number(((ct1.passedStudents + ct2.passedStudents) / 2).toFixed(1)),
                              above60Percentage: Number(((ct1.above60Percentage + ct2.above60Percentage) / 2).toFixed(1)),
                            };
                          }

                          return passingHeadsList.map((headName, headIdx) => {
                            const data = headDataMap[headName];
                            const isFirst = headIdx === 0;
                            const isFaTh = headName === "FA-TH";

                            const passPercent = data && data.appearedStudents > 0
                              ? ((data.passedStudents / data.appearedStudents) * 100).toFixed(1) + "%"
                              : data ? "0.0%" : "-";

                            const courseCodeDisplay = rec.division ? `${rec.courseCode} (${rec.division})` : rec.courseCode;

                            return (
                              <tr key={`${rec._id}-${headName}`} style={{ background: isFaTh ? "#f1f5f9" : "transparent" }}>
                                {isFirst && (
                                  <>
                                    <td rowSpan={7} className="text-center" style={{ fontWeight: "600", background: "#fff" }}>{recIdx + 1}</td>
                                    <td rowSpan={7} className="text-center" style={{ fontWeight: "700", color: "#4f46e5", background: "#fff" }}>{courseCodeDisplay}</td>
                                    <td rowSpan={7} style={{ fontWeight: "600", background: "#fff" }}>
                                      {rec.courseName}
                                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal", marginTop: "4px" }}>
                                        Faculty: {rec.ownerUsername || "System"}
                                      </div>
                                    </td>
                                  </>
                                )}
                                <td className="text-center" style={{ fontWeight: "600" }}>{isFaTh ? "FA-TH (Final)" : headName}</td>
                                <td className="text-center">{data ? data.lowestMarks : "-"}</td>
                                <td className="text-center">{data ? data.highestMarks : "-"}</td>
                                <td className="text-center">{data ? data.appearedStudents : "-"}</td>
                                <td className="text-center">{data ? data.passedStudents : "-"}</td>
                                <td className="text-center" style={{ fontWeight: "600" }}>{passPercent}</td>
                                <td className="text-center">{data ? (data.above60Percentage ? `${data.above60Percentage}%` : "0%") : "-"}</td>
                              </tr>
                            );
                          });
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-bar-graph" style={{ fontSize: "2.5rem", opacity: 0.5 }}></i>
              <p className="mt-3">No saved Term Analysis records found.</p>
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={openCreateModal}
              >
                Create your first report
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-bordered table-hover align-middle mb-0"
                style={{ width: "100%", background: "#ffffff", color: "#334155", border: "1px solid #e2e8f0" }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "140px" }}>Academic Year</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "130px" }}>Course Code</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", minWidth: "200px" }}>Course Name</th>
                    {isHodOrCoordinator && (
                      <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "150px" }}>Faculty</th>
                    )}
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "100px" }}>Division</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "180px" }}>Last Updated</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap", width: "280px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap" }}>{rec.academicYear}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", fontWeight: "600" }}>{rec.courseCode}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px" }}>{rec.courseName}</td>
                      {isHodOrCoordinator && (
                        <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", color: "#4f46e5", fontWeight: "500" }}>{rec.ownerUsername || "System"}</td>
                      )}
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", textAlign: "center" }}>{rec.division || "-"}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", color: "#64748b" }}>
                        {new Date(rec.updatedAt).toLocaleDateString()} {new Date(rec.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "8px 12px", textAlign: "center" }}>
                        <div className="d-flex justify-content-center align-items-center gap-2" style={{ flexWrap: "nowrap" }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => navigate(`/msbte/term-analysis/print`, { state: { record: rec } })}
                            style={{ background: "#0ea5e9", color: "#fff", padding: "5px 10px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: "500" }}
                          >
                            <i className="bi bi-printer"></i> Print
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => openEditModal(rec)}
                            style={{ background: "#f59e0b", color: "#fff", padding: "5px 10px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: "500" }}
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(rec._id)}
                            style={{ background: "#ef4444", color: "#fff", padding: "5px 10px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: "500" }}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050
        }}>
          <div className="modal-content" style={{
            background: "#ffffff",
            padding: "28px",
            borderRadius: "16px",
            width: "800px",
            maxWidth: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {recordId ? "Edit Term Analysis Result" : "Create New Term Analysis Result"}
              </h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <h6 style={{ fontWeight: 600, color: "#4f46e5", marginBottom: "12px" }}>Academic Details</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: "500" }}>Select CIANN *</label>
                  <select
                    className="form-select w-100"
                    value={selectedCiannId}
                    onChange={handleCiannChangeInForm}
                    required
                    disabled={!!recordId}
                  >
                    <option value="">-- Select CIANN --</option>
                    {cianns.map((c) => (
                      <option key={c._id} value={c.ciannId}>
                        CIANN {c.ciannId} - {c.subject?.name} ({c.division})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: "500" }}>Exam Type *</label>
                  <input
                    type="text"
                    className="form-control w-100"
                    placeholder="e.g. Winter 2023 or Summer 2024"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    required
                  />
                </div>
              </div>

              {selectedCiannId && (
                <div className="p-3 mb-4" style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div className="row g-2" style={{ fontSize: "0.88rem" }}>
                    <div className="col-md-6"><strong>Institute Name:</strong> {instituteName}</div>
                    <div className="col-md-6"><strong>Academic Year:</strong> {academicYear}</div>
                    <div className="col-md-6"><strong>Programme:</strong> {programme}</div>
                    <div className="col-md-6"><strong>Division:</strong> {division}</div>
                    <div className="col-md-6"><strong>Semester:</strong> Semester {semester}</div>
                    <div className="col-md-6"><strong>Course:</strong> {courseName} ({courseCode})</div>
                  </div>
                </div>
              )}

              <h6 style={{ fontWeight: 600, color: "#4f46e5", marginBottom: "12px" }}>Passing Heads Marks Analysis</h6>
              <div className="table-responsive mb-4">
                <table className="table table-bordered table-sm" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ width: "80px", textAlign: "center" }}>Enable</th>
                      <th>Passing Head</th>
                      <th style={{ width: "95px" }}>Lowest</th>
                      <th style={{ width: "95px" }}>Highest</th>
                      <th style={{ width: "95px" }}>Appeared</th>
                      <th style={{ width: "95px" }}>Passed</th>
                      <th style={{ width: "85px", textAlign: "center" }}>% Pass</th>
                      <th style={{ width: "95px" }}>% &gt; 60%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heads.map((h, idx) => {
                      const passPercent = h.appearedStudents > 0 
                        ? ((h.passedStudents / h.appearedStudents) * 100).toFixed(1) 
                        : "0.0";
                      const isFath = h.passingHead === "FA-TH";

                      return (
                        <tr key={h.passingHead} style={{ background: isFath ? "#f1f5f9" : (h.enabled ? "transparent" : "#f8fafc") }}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={h.enabled}
                              onChange={(e) => handleHeadFieldChange(idx, "enabled", e.target.checked)}
                              disabled={isFath}
                            />
                          </td>
                          <td style={{ fontWeight: "600", verticalAlign: "middle" }}>
                            {isFath ? (
                              <span>
                                FA-TH <small className="text-muted d-block" style={{ fontWeight: "normal", fontSize: "0.75rem" }}>(Avg of CT1 & CT2)</small>
                              </span>
                            ) : h.passingHead}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={h.lowestMarks}
                              onChange={(e) => handleHeadFieldChange(idx, "lowestMarks", e.target.value)}
                              disabled={!h.enabled || isFath}
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={h.highestMarks}
                              onChange={(e) => handleHeadFieldChange(idx, "highestMarks", e.target.value)}
                              disabled={!h.enabled || isFath}
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={h.appearedStudents}
                              onChange={(e) => handleHeadFieldChange(idx, "appearedStudents", e.target.value)}
                              disabled={!h.enabled || isFath}
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={h.passedStudents}
                              onChange={(e) => handleHeadFieldChange(idx, "passedStudents", e.target.value)}
                              disabled={!h.enabled || isFath}
                              min="0"
                            />
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: "600", color: "#10b981" }}>
                            {h.enabled ? `${passPercent}%` : "-"}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control form-control-sm"
                              placeholder="%"
                              value={h.above60Percentage}
                              onChange={(e) => handleHeadFieldChange(idx, "above60Percentage", e.target.value)}
                              disabled={!h.enabled || isFath}
                              min="0"
                              max="100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ background: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !selectedCiannId}
                  style={{ background: "#4f46e5" }}
                >
                  {saving ? "Saving..." : "Save Analysis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermAnalysisK7;
