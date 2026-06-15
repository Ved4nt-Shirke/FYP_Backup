import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const K7ReportSelector = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cascading catalog selections
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDivId, setSelectedDivId] = useState("");
  const [academicYear, setAcademicYear] = useState("2023-24");

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/msbte/k7/list");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch K7 records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("/catalog/departments");
      if (res.data?.success && Array.isArray(res.data.departments)) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchDepartments();
  }, []);

  // Handle department change
  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    setSelectedCourseId("");
    setSelectedDivId("");
    setCourses([]);
    setDivisions([]);

    if (!deptId) return;

    setLoadingCourses(true);
    try {
      const res = await axios.get(`/catalog/courses/${deptId}`);
      if (res.data?.success && Array.isArray(res.data.courses)) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Handle course change
  const handleCourseChange = async (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setSelectedDivId("");
    setDivisions([]);

    if (!courseId) return;

    setLoadingDivisions(true);
    try {
      const res = await axios.get(`/catalog/divisions/${courseId}`);
      if (res.data?.success && Array.isArray(res.data.divisions)) {
        setDivisions(res.data.divisions);
      }
    } catch (err) {
      console.error("Failed to fetch divisions:", err);
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleAction = (type) => {
    if (!academicYear || !selectedDeptId || !selectedCourseId || !selectedDivId) {
      alert("Please select Academic Year, Department, Course, and Division.");
      return;
    }

    const courseObj = courses.find((c) => c._id === selectedCourseId);
    const semester = courseObj ? courseObj.semester : "";

    if (type === "edit") {
      navigate(
        `/msbte/k7/generate?academicYear=${academicYear}&semester=${semester}&departmentId=${selectedDeptId}&divisionId=${selectedDivId}`
      );
    } else {
      navigate(
        `/msbte/k7/print?academicYear=${academicYear}&semester=${semester}&departmentId=${selectedDeptId}&divisionId=${selectedDivId}`
      );
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
              K7 Part B: Consolidated Result Analysis Dashboard
            </h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateCard(!showCreateCard)}
            style={{
              background: showCreateCard ? "#64748b" : "#10b981",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
            }}
          >
            <i className={`bi ${showCreateCard ? "bi-x-lg" : "bi-eye"}`}></i>{" "}
            {showCreateCard ? "Close Selection" : "View Report by Class"}
          </button>
        </div>

        {/* Configuration Card */}
        {showCreateCard && (
          <div
            className="card mb-4"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
          >
            <h5 style={{ fontWeight: 600, color: "#10b981", marginBottom: "20px" }}>
              Select Report Parameters
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "500" }}>Academic Year</label>
                <select
                  className="form-select"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "500" }}>Department</label>
                <select
                  className="form-select"
                  value={selectedDeptId}
                  onChange={handleDeptChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "500" }}>Course / Semester Scheme</label>
                <select
                  className="form-select"
                  value={selectedCourseId}
                  onChange={handleCourseChange}
                  disabled={!selectedDeptId || loadingCourses}
                  required
                >
                  <option value="">
                    {loadingCourses ? "Loading courses..." : "-- Select Course/Semester --"}
                  </option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      Semester {course.semester} ({course.courseCode} - {course.scheme} Scheme)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "500" }}>Division</label>
                <select
                  className="form-select"
                  value={selectedDivId}
                  onChange={(e) => setSelectedDivId(e.target.value)}
                  disabled={!selectedCourseId || loadingDivisions}
                  required
                >
                  <option value="">
                    {loadingDivisions ? "Loading divisions..." : "-- Select Division --"}
                  </option>
                  {divisions.map((div) => (
                    <option key={div._id} value={div._id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 mt-4 text-end d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn text-white"
                  onClick={() => handleAction("edit")}
                  style={{
                    background: "#4f46e5",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                  }}
                >
                  <i className="bi bi-pencil-square"></i> Enter/Edit Marks
                </button>
                <button
                  type="button"
                  className="btn text-white"
                  onClick={() => handleAction("print")}
                  style={{
                    background: "#10b981",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                  }}
                >
                  <i className="bi bi-eye"></i> View Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List Card */}
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
          <h5 style={{ fontWeight: 600, color: "#10b981", marginBottom: "20px" }}>
            Saved K7 Result Analysis Reports
          </h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading reports...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-bar-graph" style={{ fontSize: "2.5rem", opacity: 0.5 }}></i>
              <p className="mt-3">No saved result analysis reports found.</p>
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => setShowCreateCard(true)}
              >
                View your first report
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-bordered table-sm"
                style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1" }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px" }}>Academic Year</th>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px" }}>Semester</th>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px" }}>Programme / Department</th>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px" }}>Division</th>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px" }}>Last Updated</th>
                    <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "12px", textAlign: "center", width: "240px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px" }}>{rec.academicYear}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px" }}>Semester {rec.semester}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px" }}>{rec.departmentId?.name || "N/A"}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px" }}>{rec.divisionId?.name || "N/A"}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px" }}>
                        {new Date(rec.updatedAt).toLocaleDateString()} {new Date(rec.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm text-white"
                            onClick={() =>
                              navigate(
                                `/msbte/k7/generate?academicYear=${rec.academicYear}&semester=${rec.semester}&departmentId=${rec.departmentId?._id}&divisionId=${rec.divisionId?._id}`
                              )
                            }
                            style={{ background: "#4f46e5", padding: "6px 12px", border: "none", borderRadius: "6px" }}
                          >
                            <i className="bi bi-pencil-square"></i> Edit Marks
                          </button>
                          <button
                            className="btn btn-sm text-white"
                            onClick={() =>
                              navigate(
                                `/msbte/k7/print?academicYear=${rec.academicYear}&semester=${rec.semester}&departmentId=${rec.departmentId?._id}&divisionId=${rec.divisionId?._id}`
                              )
                            }
                            style={{ background: "#10b981", padding: "6px 12px", border: "none", borderRadius: "6px" }}
                          >
                            <i className="bi bi-eye"></i> View Report
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
    </div>
  );
};

export default K7ReportSelector;
