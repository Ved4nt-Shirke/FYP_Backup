import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import { fetchCiannsWithAuth } from "../../utils/ciannFetch";
import "./AttendanceCiannSelector.css";

const AttendanceCiannSelector = ({
  title,
  subtitle,
  navigateTo,
  onSelectState = (ciannData) => ({ ciannData }),
  onSelect,
  iconClass = "bi-book-half",
  continueLabel = "Continue",
}) => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ciannData = await fetchCiannsWithAuth();
        setCiannDataList(ciannData || []);
      } catch (err) {
        alert("Failed to fetch CIANNs: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === "completed" || ciannData.status === "archived";
    return (
      <div
        key={ciannData._id}
        className={`ats-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => {
          if (typeof onSelect === "function") {
            onSelect(ciannData, navigate);
            return;
          }
          navigate(navigateTo, { state: onSelectState(ciannData) });
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (typeof onSelect === "function") {
              onSelect(ciannData, navigate);
              return;
            }
            navigate(navigateTo, { state: onSelectState(ciannData) });
          }
        }}
      >
        <div className="ats-card-top">
          <div className="ats-card-icon" aria-hidden="true">
            <i className={`bi ${iconClass}`}></i>
          </div>
          <div className="ats-card-headtext">
            <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {ciannData.subject?.name || "Unknown Subject"}
              {isArchived && (
                <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '3px 6px', display: 'inline-block' }}>
                  {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
                </span>
              )}
            </h3>
            <p className="ats-code">{ciannData.subject?.code || "-"}</p>
          </div>
        </div>

        <div className="ats-details">
          <div className="ats-row">
            <span className="ats-label">CIANN ID</span>
            <span className="ats-value">{ciannData.ciannId || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Semester</span>
            <span className="ats-value">{ciannData.semester || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Division</span>
            <span className="ats-value">{ciannData.division || "-"}</span>
          </div>
          <div className="ats-row ats-row-dept">
            <span className="ats-label">Department</span>
            <span className="ats-value">{ciannData.department?.name || "Department"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Academic Year</span>
            <span className="ats-value">{ciannData.academicYear || "-"}</span>
          </div>
        </div>

        <div className="ats-card-footer">
          {continueLabel} <i className="bi bi-arrow-right"></i>
        </div>
      </div>
    );
  };

  const activeCianns = ciannDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCianns = ciannDataList.filter(c => c.status === "completed" || c.status === "archived");

  const filterCianns = (list) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((ciann) => {
      const subjectName = (ciann.subject?.name || "").toLowerCase();
      const subjectCode = (ciann.subject?.code || "").toLowerCase();
      const ciannId = String(ciann.ciannId || "").toLowerCase();
      const department = (ciann.department?.name || "").toLowerCase();
      const semester = String(ciann.semester || "").toLowerCase();
      const division = (ciann.division || "").toLowerCase();
      return (
        subjectName.includes(query) ||
        subjectCode.includes(query) ||
        ciannId.includes(query) ||
        department.includes(query) ||
        semester.includes(query) ||
        division.includes(query)
      );
    });
  };

  const filteredActive = filterCianns(activeCianns);
  const filteredArchived = filterCianns(archivedCianns);

  return (
    <>
      <Header showSearch={false} />
      <div className="ats-page">
        <section className="ats-hero">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </section>

        {loading ? (
          <div className="ats-state">Loading CIANNs...</div>
        ) : ciannDataList.length === 0 ? (
          <div className="ats-state">No CIANNs available.</div>
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
                  {filteredActive.map((ciannData) => renderCiannCard(ciannData))}
                </section>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No matching active CIANNs found.
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
                  {filteredArchived.map((ciannData) => renderCiannCard(ciannData))}
                </section>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No matching archived CIANNs found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceCiannSelector;
