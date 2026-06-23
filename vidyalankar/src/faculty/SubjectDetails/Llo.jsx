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
          <div className="container-fluid py-4 px-md-4">
            {/* Header / Title */}
            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">Lab Learning Outcomes (LLO)</h2>
              <p className="text-secondary mb-0">
                Select a Course Outcome (CO) from Admin Subject Course Details and define its corresponding Lab Learning Outcomes.
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-danger border-0 rounded-3 shadow-sm d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
                <span>{error}</span>
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
              <div className="row g-4">
                {/* Selector and Editing Card */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    {/* Header */}
                    <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                      <h5 className="mb-0 fw-bold text-dark">LLO Management</h5>
                      <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fs-7">
                        Subject: {ciannData?.subject?.name || "Active subject"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="card-body p-4 bg-white">
                      <div className="row g-4">
                        {/* CO Dropdown Selection */}
                        <div className="col-md-4 border-end-md">
                          <div className="mb-3">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                              <label className="form-label fw-bold text-dark mb-0 mt-1">Course Outcome (CO)</label>
                              <div className="d-flex flex-column align-items-end gap-1">
                                <button
                                  type="button"
                                  onClick={handleAddCo}
                                  className="btn btn-sm btn-outline-secondary py-1 px-2 fw-semibold d-flex align-items-center gap-1"
                                  title="Add Course Outcome"
                                >
                                  <i className="bi bi-plus-lg"></i> Add
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDeleteCo}
                                  disabled={courseOutcomes.length <= 1}
                                  className="btn btn-sm btn-outline-danger py-1 px-2 fw-semibold d-flex align-items-center gap-1"
                                  title="Delete Selected Course Outcome"
                                >
                                  <i className="bi bi-trash"></i> Delete
                                </button>
                              </div>
                            </div>
                            <select
                              value={selectedCo}
                              onChange={(e) => setSelectedCo(e.target.value)}
                              className="form-select border shadow-sm rounded-3 text-dark fw-semibold"
                              style={{ cursor: "pointer" }}
                            >
                              {courseOutcomes.map((co) => (
                                <option key={co.coNumber} value={co.coNumber}>
                                  {co.coNumber}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedCoObj && (
                            <div className="mt-3 p-3 bg-light rounded-3 border">
                              <span className="text-secondary fw-bold text-uppercase fs-8 mb-2 d-block">
                                Description
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
                                className="form-control form-control-sm border bg-white text-dark"
                                placeholder="Enter Course Outcome Description..."
                                rows="4"
                              />
                            </div>
                          )}
                        </div>

                        {/* Outcomes Inputs */}
                        <div className="col-md-8">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                              <i className="bi bi-flask text-secondary"></i>
                              Mapped Lab Learning Outcomes for {selectedCo}
                            </h6>
                            <button
                              type="button"
                              onClick={handleAddLloField}
                              className="btn btn-sm btn-outline-secondary fw-semibold px-3 py-1 d-flex align-items-center gap-1"
                            >
                              <i className="bi bi-plus-lg"></i> Add LLO
                            </button>
                          </div>

                          <div className="outcome-inputs-list" style={{ minHeight: "150px" }}>
                            {activeLlos.map((llo, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginBottom: "10px",
                                  background: "#f8f9fa",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                  border: "1px solid #e9ecef"
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: "52px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6c757d",
                                    flexShrink: 0,
                                  }}
                                >
                                  LLO {idx + 1}
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
                                    fontSize: "14px",
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
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Save Button Footer */}
                      <div className="border-top pt-3 mt-2 d-flex align-items-center justify-content-end gap-3">
                        {success && (
                          <span className="text-success fw-semibold d-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill"></i> Saved successfully!
                          </span>
                        )}
                        <button
                          onClick={handleSave}
                          disabled={saving || loading || !ciannData}
                          className="btn btn-info rounded-3 px-4 fw-bold text-white shadow-sm"
                        >
                          {saving ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <>
                              <i className="bi bi-cloud-arrow-up-fill me-2"></i> Save LLO Details
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                    <h5 className="fw-bold text-dark mb-3">LLO Mapping Summary</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light text-secondary">
                          <tr>
                            <th style={{ width: "10%" }}>CO</th>
                            <th style={{ width: "35%" }}>Course Outcome Description</th>
                            <th>Mapped Lab Learning Outcomes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseOutcomes.map((co) => {
                            const mapping = coMappings[co.coNumber] || { llos: [] };
                            const nonEmpties = mapping.llos.filter(Boolean);
                            const coNum = co.coNumber.replace(/\D/g, "") || "1";

                            return (
                              <tr key={co.coNumber}>
                                <td>
                                  <span className="badge bg-light text-dark border fs-7 rounded-pill">{co.coNumber}</span>
                                </td>
                                <td className="text-secondary small fw-semibold">{co.description}</td>
                                <td>
                                  {nonEmpties.length === 0 ? (
                                    <span className="text-muted italic small">No LLOs mapped yet</span>
                                  ) : (
                                    <div className="d-flex flex-column gap-1">
                                      {nonEmpties.map((l, idx) => (
                                        <div 
                                          key={idx} 
                                          className="small text-dark fw-semibold py-1"
                                          style={idx < nonEmpties.length - 1 ? { borderBottom: "1px solid #e9ecef" } : {}}
                                        >
                                          {coNum}.{idx + 1} {l}
                                        </div>
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
