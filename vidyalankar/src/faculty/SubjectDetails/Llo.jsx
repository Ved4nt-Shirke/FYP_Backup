import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import { config, getApiUrl } from "../../config/api";
import "../editCiann/EditCiannModern.css";

export default function Llo() {
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

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

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

        // Fetch Existing TLOs, LLOs & COs Mappings from Ciann-specific TloLlo record
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

        let loadedCOs = [];
        const initialMappings = {};

        if (tloLloData.success && tloLloData.data && Array.isArray(tloLloData.data.coData) && tloLloData.data.coData.length > 0) {
          loadedCOs = tloLloData.data.coData.map((coItem) => ({
            coNumber: coItem.coNumber,
            description: coItem.coDescription || "",
          }));
          tloLloData.data.coData.forEach((coItem) => {
            initialMappings[coItem.coNumber] = {
              tlos: coItem.tlos.length > 0 ? coItem.tlos : [""],
              llos: coItem.llos.length > 0 ? coItem.llos : [""],
            };
          });
        } else {
          // Fallback: load COs from courseDetails endpoint
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
          if (courseDetailsData.success && courseDetailsData.courseDetails) {
            const tempCOs = courseDetailsData.courseDetails.courseOutcomes || [];
            if (tempCOs.length > 0) {
              loadedCOs = tempCOs.map((c) => ({
                coNumber: c.coNumber,
                description: c.description || "",
              }));
              tempCOs.forEach((c) => {
                initialMappings[c.coNumber] = { tlos: [""], llos: [""] };
              });
            } else {
              loadedCOs = [{ coNumber: "CO1", description: "" }];
              initialMappings["CO1"] = { tlos: [""], llos: [""] };
            }
          } else {
            loadedCOs = [{ coNumber: "CO1", description: "" }];
            initialMappings["CO1"] = { tlos: [""], llos: [""] };
          }
        }

        setCourseOutcomes(loadedCOs);
        setCoMappings(initialMappings);
        if (loadedCOs.length > 0) {
          setSelectedCo(loadedCOs[0].coNumber);
        }
      } catch (err) {
        console.error("Error fetching LLO details:", err);
        setError("Error loading Course Outcomes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ciannData]);

  // Mutation Handlers
  const handleAddCo = () => {
    const nextCoNum = `CO${courseOutcomes.length + 1}`;
    setCourseOutcomes((prev) => [...prev, { coNumber: nextCoNum, description: "" }]);
    setCoMappings((prev) => ({
      ...prev,
      [nextCoNum]: { tlos: [""], llos: [""] }
    }));
    setSelectedCo(nextCoNum);
  };

  const handleDeleteCo = () => {
    if (courseOutcomes.length <= 1) return;
    const indexToDelete = courseOutcomes.findIndex((c) => c.coNumber === selectedCo);
    const updatedCOs = courseOutcomes.filter((_, idx) => idx !== indexToDelete);

    // Renumber remaining COs
    const renumberedCOs = updatedCOs.map((c, i) => ({
      ...c,
      coNumber: `CO${i + 1}`
    }));

    // Remap coMappings
    const remappedMappings = {};
    renumberedCOs.forEach((c, i) => {
      const origIndex = i >= indexToDelete ? i + 1 : i;
      const origCoNum = `CO${origIndex + 1}`;
      remappedMappings[c.coNumber] = coMappings[origCoNum] || { tlos: [""], llos: [""] };
    });

    setCourseOutcomes(renumberedCOs);
    setCoMappings(remappedMappings);
    const newSelectIndex = Math.max(0, indexToDelete - 1);
    setSelectedCo(renumberedCOs[newSelectIndex].coNumber);
  };

  const handleAddLloField = () => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      current.llos = [...current.llos, ""];
      return { ...prev, [selectedCo]: current };
    });
  };

  const handleRemoveLloField = (index) => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      if (current.llos.length <= 1) {
        current.llos = [""];
      } else {
        current.llos = current.llos.filter((_, idx) => idx !== index);
      }
      return { ...prev, [selectedCo]: current };
    });
  };

  const handleLloFieldChange = (index, value) => {
    if (!selectedCo) return;
    setCoMappings((prev) => {
      const current = prev[selectedCo] ? { ...prev[selectedCo] } : { tlos: [""], llos: [""] };
      const updatedLlos = [...current.llos];
      updatedLlos[index] = value;
      current.llos = updatedLlos;
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
        setSuccess("LLO mapping saved successfully!");
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

  const activeLlos = selectedCo && coMappings[selectedCo] ? coMappings[selectedCo].llos : [""];
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
          <div className="container-fluid py-2 px-md-3">
            {/* Header / Title */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <h5 className="fw-bold text-dark mb-0">Lab Learning Outcomes (LLO)</h5>
                <p className="text-secondary mb-0 small">
                  Select a CO and define its Lab Learning Outcomes.
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                {success && (
                  <span className="text-success fw-semibold d-flex align-items-center gap-1 small">
                    <i className="bi bi-check-circle-fill"></i> Saved!
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !ciannData}
                  className="btn btn-info btn-sm rounded-pill px-3 fw-bold text-white shadow-sm"
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <><i className="bi bi-cloud-arrow-up-fill me-1"></i> Save</>
                  )}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-danger border-0 rounded-3 shadow-sm d-flex align-items-center gap-2 mb-2 py-2">
                <i className="bi bi-exclamation-octagon-fill text-danger"></i>
                <span className="small">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm my-4">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading Course Outcomes...</span>
                </div>
                <p className="mt-3 text-muted">Loading Course Outcomes & mappings...</p>
              </div>
            ) : (
              <div className="row g-3" style={{ height: "calc(100vh - 140px)" }}>
                {/* Left: CO selector + LLO inputs */}
                <div className="col-md-5 d-flex flex-column">
                  <div className="card border-0 shadow-sm rounded-3 flex-fill overflow-hidden">
                    <div className="card-header border-0 bg-dark text-white py-2 px-3 d-flex align-items-center justify-content-between">
                      <h6 className="mb-0 fw-semibold text-white small">LLO Management</h6>
                      <span className="badge bg-info text-white px-2 py-1 rounded-pill" style={{ fontSize: "11px" }}>
                        {ciannData?.subject?.name || "Active subject"}
                      </span>
                    </div>
                    <div className="card-body p-3 bg-white d-flex flex-column" style={{ overflow: "hidden" }}>
                      {/* CO Selection row */}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <label className="fw-bold text-dark mb-0 small text-nowrap">CO:</label>
                        <select
                          value={selectedCo}
                          onChange={(e) => setSelectedCo(e.target.value)}
                          className="form-select form-select-sm border-2 shadow-sm rounded-3 bg-light text-dark fw-semibold"
                          style={{ cursor: "pointer", minWidth: 0, flex: 1 }}
                        >
                          {courseOutcomes.map((co) => (
                            <option key={co.coNumber} value={co.coNumber}>
                              {co.coNumber}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddCo}
                          className="btn btn-sm btn-outline-info fw-bold text-nowrap"
                          style={{ fontSize: "12px", padding: "3px 8px" }}
                        >
                          + CO
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteCo}
                          disabled={courseOutcomes.length <= 1}
                          className="btn btn-sm btn-outline-danger fw-bold text-nowrap"
                          style={{ fontSize: "12px", padding: "3px 8px" }}
                        >
                          - CO
                        </button>
                      </div>

                      {selectedCoObj && (
                        <div className="mb-2 p-2 bg-light rounded-3 border-start border-3 border-info">
                          <span className="text-info fw-bold text-uppercase d-block mb-1" style={{ fontSize: "11px" }}>
                            CO Description
                          </span>
                          <textarea
                            value={selectedCoObj.description || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCourseOutcomes((prev) =>
                                prev.map((c) =>
                                  c.coNumber === selectedCo
                                    ? { ...c, description: val }
                                    : c
                                )
                              );
                            }}
                            className="form-control form-control-sm bg-white text-dark"
                            placeholder="Enter Course Outcome Description..."
                            rows="2"
                            style={{ fontSize: "12px" }}
                          />
                        </div>
                      )}

                      {/* LLO Inputs */}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fw-bold text-dark d-flex align-items-center gap-1 mb-0 small">
                          <i className="bi bi-flask text-info"></i>
                          LLOs for {selectedCo}
                        </h6>
                        <button
                          type="button"
                          onClick={handleAddLloField}
                          className="btn btn-info btn-sm text-white rounded-pill px-2 py-0 d-flex align-items-center gap-1 shadow-sm"
                          style={{ fontSize: "12px" }}
                        >
                          <i className="bi bi-plus-lg"></i> Add LLO
                        </button>
                      </div>

                      <div className="outcome-inputs-list flex-fill" style={{ overflowY: "auto" }}>
                        {activeLlos.map((llo, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "6px",
                              background: "#f8f9fa",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            }}
                          >
                            <span
                              style={{
                                minWidth: "40px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: "#0ea5e9",
                                flexShrink: 0,
                                background: "#e0f2fe",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {(selectedCo.replace(/\D/g, "") || "1")}.{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={llo}
                              onChange={(e) => handleLloFieldChange(idx, e.target.value)}
                              placeholder="Describe laboratory outcome..."
                              style={{
                                flex: 1,
                                border: "none",
                                background: "transparent",
                                outline: "none",
                                fontSize: "13px",
                                color: "#212529",
                                padding: "2px 0",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveLloField(idx)}
                              title="Delete LLO"
                              style={{
                                flexShrink: 0,
                                background: "none",
                                border: "none",
                                color: "#dc3545",
                                cursor: "pointer",
                                fontSize: "1rem",
                                lineHeight: 1,
                                padding: "0 2px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <i className="bi bi-dash-circle-fill"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Table */}
                <div className="col-md-7 d-flex flex-column">
                  <div className="card border-0 shadow-sm rounded-3 flex-fill overflow-hidden">
                    <div className="card-header border-0 bg-dark text-white py-2 px-3">
                      <h6 className="fw-bold text-white mb-0 small">LLO Mapping Summary</h6>
                    </div>
                    <div className="card-body p-0 bg-white" style={{ overflowY: "auto" }}>
                      <table className="table table-bordered table-sm align-middle mb-0">
                        <thead className="table-dark sticky-top">
                          <tr>
                            <th style={{ width: "8%", textAlign: "center" }}>CO</th>
                            <th style={{ width: "40%", fontSize: "12px" }}>Course Outcome Description</th>
                            <th style={{ fontSize: "12px" }}>Mapped LLOs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseOutcomes.map((co) => {
                            const mapping = coMappings[co.coNumber] || { llos: [] };
                            const nonEmpties = mapping.llos.filter(Boolean);
                            const coNum = co.coNumber.replace(/\D/g, "") || "1";

                            return (
                              <tr key={co.coNumber}>
                                <td className="text-center">
                                  <span className="badge bg-info text-white rounded-pill" style={{ fontSize: "11px" }}>{co.coNumber}</span>
                                </td>
                                <td className="text-secondary small">{co.description}</td>
                                <td>
                                  {nonEmpties.length === 0 ? (
                                    <span className="text-muted small fst-italic">No LLOs mapped yet</span>
                                  ) : (
                                    <div className="d-flex flex-wrap gap-1">
                                      {nonEmpties.map((l, idx) => (
                                        <span
                                          key={idx}
                                          className="badge text-white fw-semibold"
                                          style={{
                                            background: "#0ea5e9",
                                            fontSize: "11px",
                                            padding: "3px 8px",
                                            borderRadius: "4px",
                                          }}
                                          title={l}
                                        >
                                          {coNum}.{idx + 1}
                                        </span>
                                      ))}
                                    </div>
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
