import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import { fetchCiaansWithAuth } from "../../utils/CiannFetch";
import "./AttendanceCiannSelector.css";

const AttendanceCiaanSelector = ({
  title,
  subtitle,
  navigateTo,
  onSelectState = (CiaanData) => ({ CiaanData }),
  onSelect,
  iconClass = "bi-book-half",
  continueLabel = "Continue",
}) => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const CiaanData = await fetchCiaansWithAuth();
        setCiaanDataList(CiaanData || []);
      } catch (err) {
        alert("Failed to fetch Ciaans: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderCiaanCard = (CiaanData) => {
    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
    return (
      <div
        key={CiaanData._id}
        className={`ats-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => {
          if (typeof onSelect === "function") {
            onSelect(CiaanData, navigate);
            return;
          }
          navigate(navigateTo, { state: onSelectState(CiaanData) });
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (typeof onSelect === "function") {
              onSelect(CiaanData, navigate);
              return;
            }
            navigate(navigateTo, { state: onSelectState(CiaanData) });
          }
        }}
      >
        <div className="ats-card-top">
          <div className="ats-card-icon" aria-hidden="true">
            <i className={`bi ${iconClass}`}></i>
          </div>
          <div className="ats-card-headtext">
            <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {CiaanData.subject?.name || "Unknown Subject"}
              {isArchived && (
                <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '3px 6px', display: 'inline-block' }}>
                  {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
                </span>
              )}
            </h3>
            <p className="ats-code">{CiaanData.subject?.code || "-"}</p>
          </div>
        </div>

        <div className="ats-details">
          <div className="ats-row">
            <span className="ats-label">Ciaan ID</span>
            <span className="ats-value">{CiaanData.CiaanId || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Semester</span>
            <span className="ats-value">{CiaanData.semester || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Division</span>
            <span className="ats-value">{CiaanData.division || "-"}</span>
          </div>
          <div className="ats-row ats-row-dept">
            <span className="ats-label">Department</span>
            <span className="ats-value">{CiaanData.department?.name || "Department"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Academic Year</span>
            <span className="ats-value">{CiaanData.academicYear || "-"}</span>
          </div>
        </div>

        <div className="ats-card-footer">
          {continueLabel} <i className="bi bi-arrow-right"></i>
        </div>
      </div>
    );
  };

  const activeCiaans = CiaanDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCiaans = CiaanDataList.filter(c => c.status === "completed" || c.status === "archived");

  const filterCiaans = (list) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((Ciaan) => {
      const subjectName = (Ciaan.subject?.name || "").toLowerCase();
      const subjectCode = (Ciaan.subject?.code || "").toLowerCase();
      const CiaanId = String(Ciaan.CiaanId || "").toLowerCase();
      const department = (Ciaan.department?.name || "").toLowerCase();
      const semester = String(Ciaan.semester || "").toLowerCase();
      const division = (Ciaan.division || "").toLowerCase();
      return (
        subjectName.includes(query) ||
        subjectCode.includes(query) ||
        CiaanId.includes(query) ||
        department.includes(query) ||
        semester.includes(query) ||
        division.includes(query)
      );
    });
  };

  const filteredActive = filterCiaans(activeCiaans);
  const filteredArchived = filterCiaans(archivedCiaans);

  return (
    <>
      <Header showSearch={false} />
      <div className="ats-page">
        <section className="ats-hero">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </section>

        {loading ? (
          <div className="ats-state">Loading Ciaans...</div>
        ) : CiaanDataList.length === 0 ? (
          <div className="ats-state">No Ciaans available.</div>
        ) : (
          <div className="ats-container py-2">
            {/* Search filter box */}
            <div className="ats-search-wrapper mb-4">
              <div className="ats-search-box">
                <i className="bi bi-search ats-search-icon" aria-hidden="true"></i>
                <input
                  type="text"
                  placeholder="Search subject, code, department, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ats-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="ats-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700", color: "var(--ats-primary)" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {filteredActive.length > 0 ? (
                <section className="ats-grid">
                  {filteredActive.map((CiaanData) => renderCiaanCard(CiaanData))}
                </section>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No matching active Ciaans found.
                </div>
              )}
            </div>

            {/* Archived Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700", color: "var(--ats-muted)" }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {filteredArchived.length > 0 ? (
                <section className="ats-grid">
                  {filteredArchived.map((CiaanData) => renderCiaanCard(CiaanData))}
                </section>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No matching archived Ciaans found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceCiaanSelector;
