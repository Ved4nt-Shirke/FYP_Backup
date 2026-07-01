import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const K7CiaanSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [Ciaans, setCiaans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCiaans = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/Ciaans");
        if (Array.isArray(res.data)) {
          // Sort by CIAAN ID descending
          setCiaans(res.data.sort((a, b) => b.CiaanId - a.CiaanId));
        }
      } catch (err) {
        console.error("Failed to fetch Ciaans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCiaans();
  }, []);

  const handleCiaanClick = (Ciaan) => {
    const deptId = Ciaan.department?._id || Ciaan.department;
    const divisionName = Ciaan.division;
    const semester = Ciaan.semester;
    const academicYear = Ciaan.academicYear;
    const courseCode = Ciaan.subject?.code;

    navigate(
      `/msbte/k7/generate?CiaanId=${Ciaan.CiaanId}&academicYear=${academicYear}&semester=${semester}&departmentId=${deptId}&divisionName=${divisionName}&courseCode=${courseCode}`
    );
  };

  const filteredCiaans = Ciaans.filter(c => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = (
      c.CiaanId.toString().includes(query) ||
      (c.subject?.name || "").toLowerCase().includes(query) ||
      (c.subject?.code || "").toLowerCase().includes(query) ||
      (c.division || "").toLowerCase().includes(query)
    );
    if (!matchesSearch) return false;

    // URL parameter filters
    const params = new URLSearchParams(location.search);
    const filterAy = params.get("academicYear");
    const filterSem = params.get("semester");
    const filterDept = params.get("departmentId");
    const filterDivName = params.get("divisionName");

    if (filterAy && c.academicYear !== filterAy) return false;
    if (filterSem && String(c.semester) !== String(filterSem)) return false;
    if (filterDept) {
      const cDeptId = c.department?._id || c.department;
      if (String(cDeptId) !== String(filterDept)) return false;
    }
    if (filterDivName && String(c.division).toLowerCase() !== String(filterDivName).toLowerCase()) return false;

    return true;
  });

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
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{
              background: "#64748b",
              border: "1px solid #475569",
              color: "#fff",
            }}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
          {location.search && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => navigate("/msbte/k7/Ciaans")}
              style={{ borderRadius: "20px", fontSize: "0.85rem", padding: "6px 16px" }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
              MSBTE K7 Format Part B
            </p>
            <h2 style={{ margin: "4px 0 0", fontWeight: 700, color: "#0f172a" }}>
              Result Analysis Marks Entry
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Select a class/subject (Ciaan) to manage its Term End Examination result analysis.
            </p>
          </div>

          <div style={{ maxWidth: "300px", width: "100%" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                padding: "8px 12px",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading your classes...</p>
          </div>
        ) : filteredCiaans.length === 0 ? (
          <div className="text-center py-5 card" style={{ background: "#ffffff", borderRadius: "14px", padding: "40px" }}>
            <i className="bi bi-journal-x" style={{ fontSize: "3rem", color: "#94a3b8" }}></i>
            <h5 className="mt-3">No Ciaans Found</h5>
            <p className="text-muted">No classes matching your search or no Ciaans are assigned to you.</p>
          </div>
        ) : (
          <div className="row g-3">
            {filteredCiaans.map((c) => (
              <div key={c._id} className="col-md-4">
                <div
                  className="card h-100 Ciaan-selection-card"
                  onClick={() => handleCiaanClick(c)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgb(0 0 0 / 0.02)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "#4f46e5";
                    e.currentTarget.style.boxShadow = "0 8px 16px -4px rgb(79 70 229 / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgb(0 0 0 / 0.02)";
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Ciaan {c.CiaanId}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>
                      {c.academicYear}
                    </span>
                  </div>

                  <h6 style={{ fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                    {c.subject?.name}
                  </h6>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 16px" }}>
                    Code: {c.subject?.code}
                  </p>

                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "12px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div>
                      <strong className="text-muted small d-block">SEMESTER</strong>
                      <span style={{ fontWeight: "600", color: "#334155" }}>Sem {c.semester}</span>
                    </div>
                    <div>
                      <strong className="text-muted small d-block">DIVISION</strong>
                      <span style={{ fontWeight: "600", color: "#334155" }}>Division {c.division}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default K7CiaanSelection;
