import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import { config, getApiUrl } from "../../config/api";
import "../editCiann/EditCiannModern.css";

export default function Tlo() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ciannData, setCiannData] = useState(null);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [selectedCo, setSelectedCo] = useState("");
  const [coMappings, setCoMappings] = useState({}); // coNumber -> { tlos: [], llos: [] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(false);

  // Resolve CIANN Data
  useEffect(() => {
    let resolvedCiann = location.state?.ciannData;
    if (!resolvedCiann) {
      const stored = sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData");
      if (stored) {
        try {
          resolvedCiann = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing stored CIAAN data", e);
        }
      }
    }

    if (!resolvedCiann || !resolvedCiann.ciannId) {
      setError("No active CIANN session found. Please select a CIANN card.");
      setLoading(false);
      return;
    }

    setCiannData(resolvedCiann);
  }, [location]);

  // Load Outcomes & Mappings
  useEffect(() => {
    if (!ciannData) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const subjectId = ciannData.subject?._id || ciannData.subjectId;

        if (!subjectId) {
          throw new Error("Subject ID not found on CIANN data.");
        }

        // 1. Fetch Admin Course Details for COs
        const courseDetailsRes = await fetch(
          getApiUrl(`/pt-microproject/new/course-details/${subjectId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const courseDetailsData = await courseDetailsRes.json();

        let loadedCOs = [];
        if (courseDetailsData.success && courseDetailsData.courseDetails) {
          loadedCOs = courseDetailsData.courseDetails.courseOutcomes || [];
          setCourseOutcomes(loadedCOs);
          if (loadedCOs.length > 0) {
            setSelectedCo(loadedCOs[0].coNumber);
          }
        } else {
          // Fallback outcomes if admin hasn't configured course outcomes yet
          loadedCOs = [
            { coNumber: "CO1", description: "Course Outcome 1" },
            { coNumber: "CO2", description: "Course Outcome 2" },
            { coNumber: "CO3", description: "Course Outcome 3" },
          ];
          setCourseOutcomes(loadedCOs);
          setSelectedCo("CO1");
        }

        // 2. Fetch Existing TLOs & LLOs Mappings
        const tloLloRes = await fetch(
          getApiUrl(`/subject-details/tlo-llo/${ciannData.ciannId}/${subjectId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const tloLloData = await tloLloRes.json();

        const initialMappings = {};
        loadedCOs.forEach((co) => {
          initialMappings[co.coNumber] = { tlos: [""], llos: [""] };
        });

        if (tloLloData.success && tloLloData.data && Array.isArray(tloLloData.data.coData)) {
          tloLloData.data.coData.forEach((coItem) => {
            initialMappings[coItem.coNumber] = {
              tlos: coItem.tlos.length > 0 ? coItem.tlos : [""],
              llos: coItem.llos.length > 0 ? coItem.llos : [""],
            };
          });
        }

        setCoMappings(initialMappings);
      } catch (err) {
        console.error("Error fetching TLO details:", err);
        setError("Error loading Course Outcomes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ciannData]);

  // Mutation Handlers
  const handleAddTloField = () => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      current.tlos = [...current.tlos, ""];
      return { ...prev, [selectedCo]: current };
    });
  };

  const handleRemoveTloField = (index) => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      if (current.tlos.length <= 1) {
        current.tlos = [""];
      } else {
        current.tlos = current.tlos.filter((_, idx) => idx !== index);
      }
      return { ...prev, [selectedCo]: current };
    });
  };

  const handleTloFieldChange = (index, value) => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      const updatedTlos = [...current.tlos];
      updatedTlos[index] = value;
      current.tlos = updatedTlos;
      return { ...prev, [selectedCo]: current };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const subjectId = ciannData.subject?._id || ciannData.subjectId;

      const coDataPayload = courseOutcomes.map((co) => {
        const mappings = coMappings[co.coNumber] || { tlos: [], llos: [] };
        return {
          coNumber: co.coNumber,
          coDescription: co.description,
          tlos: mappings.tlos.map((t) => t.trim()).filter(Boolean),
          llos: mappings.llos.map((l) => l.trim()).filter(Boolean),
        };
      });

      const res = await fetch(getApiUrl("/subject-details/tlo-llo"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ciannId: ciannData.ciannId,
          subjectId,
          coData: coDataPayload,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSuccess("TLO mapping saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(resData.error || "Failed to save mapping.");
      }
    } catch (err) {
      console.error("Error saving mapping:", err);
      setError(err.message || "Error saving details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activeTlos = selectedCo && coMappings[selectedCo] ? coMappings[selectedCo].tlos : [""];
  const selectedCoObj = courseOutcomes.find((c) => c.coNumber === selectedCo);

  return (
    <div className="student-layout">
      <div className="student-main-row">
        {/* Left Column: Workspace Secondary Sidebar */}
        <div className="student-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>

        {/* Right Column: Main Content */}
        <div className="student-main-content">
          <div className="container-fluid py-4 px-md-4">
            {/* Header / Title */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">Topic Learning Outcomes (TLO)</h2>
                <p className="text-secondary mb-0">
                  Select a Course Outcome (CO) from Admin Subject Course Details and define its corresponding Topic Learning Outcomes.
                </p>
              </div>
              <div>
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !ciannData}
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i> Save TLO Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-danger border-0 rounded-3 shadow-sm d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success border-0 rounded-3 shadow-sm d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading Course Outcomes...</span>
                </div>
                <p className="mt-3 text-muted">Loading Course Outcomes & mappings...</p>
              </div>
            ) : (
              <div className="row g-4">
                {/* Selector and Editing Card */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    {/* Header */}
                    <div className="card-header border-0 bg-dark text-white p-3 d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 fw-semibold text-white">TLO Management</h5>
                      <span className="badge bg-primary px-3 py-2 rounded-pill fs-7">
                        Subject: {ciannData?.subject?.name || "Active subject"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="card-body p-4 bg-white">
                      <div className="row g-4">
                        {/* CO Dropdown Selection */}
                        <div className="col-md-4 border-end-md">
                          <label className="form-label fw-bold text-dark mb-2">Select Course Outcome (CO)</label>
                          <select
                            value={selectedCo}
                            onChange={(e) => setSelectedCo(e.target.value)}
                            className="form-select form-select-lg border-2 shadow-sm rounded-3 bg-light text-dark fw-semibold"
                            style={{ cursor: "pointer" }}
                          >
                            {courseOutcomes.map((co) => (
                              <option key={co.coNumber} value={co.coNumber}>
                                {co.coNumber}
                              </option>
                            ))}
                          </select>

                          {selectedCoObj && (
                            <div className="mt-4 p-3 bg-light rounded-3 border-start border-4 border-primary">
                              <span className="text-primary fw-bold text-uppercase fs-7 block mb-1">
                                Description
                              </span>
                              <p className="mb-0 text-dark small fw-semibold">
                                {selectedCoObj.description || "(No description configured)"}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Outcomes Inputs */}
                        <div className="col-md-8">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                              <i className="bi bi-journal-text text-primary"></i>
                              Mapped Topic Learning Outcomes for {selectedCo}
                            </h6>
                            <button
                              type="button"
                              onClick={handleAddTloField}
                              className="btn btn-sm btn-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm"
                            >
                              <i className="bi bi-plus-lg"></i> Add TLO
                            </button>
                          </div>

                          <div className="outcome-inputs-list" style={{ minHeight: "150px" }}>
                            {activeTlos.map((tlo, idx) => (
                              <div key={idx} className="input-group mb-2 shadow-sm rounded-3 overflow-hidden">
                                <span className="input-group-text border-0 bg-light text-secondary small fw-semibold">
                                  TLO {idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={tlo}
                                  onChange={(e) => handleTloFieldChange(idx, e.target.value)}
                                  placeholder="Describe topic learning outcome..."
                                  className="form-control border-0 px-3 bg-light text-dark"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTloField(idx)}
                                  className="btn btn-outline-danger border-0 bg-light"
                                  title="Delete Field"
                                >
                                  <i className="bi bi-dash-circle-fill"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                    <h5 className="fw-bold text-dark mb-3">TLO Mapping Summary</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th style={{ width: "10%" }}>CO</th>
                            <th style={{ width: "35%" }}>Course Outcome Description</th>
                            <th>Mapped Topic Learning Outcomes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseOutcomes.map((co) => {
                            const mapping = coMappings[co.coNumber] || { tlos: [] };
                            const nonEmpties = mapping.tlos.filter(Boolean);

                            return (
                              <tr key={co.coNumber}>
                                <td>
                                  <span className="badge bg-primary fs-7 rounded-pill">{co.coNumber}</span>
                                </td>
                                <td className="text-secondary small fw-semibold">{co.description}</td>
                                <td>
                                  {nonEmpties.length === 0 ? (
                                    <span className="text-muted italic small">No TLOs mapped yet</span>
                                  ) : (
                                    <ul className="mb-0 ps-3">
                                      {nonEmpties.map((t, idx) => (
                                        <li key={idx} className="small text-dark fw-semibold mb-1">
                                          {t}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
