import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import { config, getApiUrl } from "../../config/api";
import "../editCiann/EditCiannModern.css";

export default function TloLlo() {
  const location = useLocation();
  const navigate = useNavigate();

  const [CiaanData, setCiaanData] = useState(null);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [coMappings, setCoMappings] = useState({}); // coNumber -> { tlos: [], llos: [] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Secondary sidebar visibility state (for mobile responsive design)
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

  // Resolve CIAAN Data on Mount
  useEffect(() => {
    let resolvedCiaan = location.state?.CiaanData;
    if (!resolvedCiaan) {
      const stored = sessionStorage.getItem("currentCiaanData") || localStorage.getItem("CiaanData");
      if (stored) {
        try {
          resolvedCiaan = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing stored CIAAN data", e);
        }
      }
    }

    if (!resolvedCiaan || !resolvedCiaan.CiaanId) {
      setError("No active CIAAN session found. Please Select a CIAAN card.");
      setLoading(false);
      return;
    }

    setCiaanData(resolvedCiaan);
  }, [location]);

  // Fetch Course Outcomes & Existing TLO/LLO Map
  useEffect(() => {
    if (!CiaanData) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const subjectId = CiaanData.subject?._id || CiaanData.subjectId;

        if (!subjectId) {
          throw new Error("Subject ID not found on CIAAN data.");
        }

        // Fetch Existing TLOs, LLOs & COs Mappings from Ciaan-specific TloLlo record
        const tloLloRes = await fetch(
          getApiUrl(`/subject-details/tlo-llo/${CiaanData.CiaanId}/${subjectId}`),
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
      } catch (err) {
        console.error("Error fetching TLO/LLO details:", err);
        setError("Error loading Course Outcomes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [CiaanData]);

  // Mutation Handlers for COs
  const handleAddCo = () => {
    const nextCoNum = `CO${courseOutcomes.length + 1}`;
    setCourseOutcomes((prev) => [...prev, { coNumber: nextCoNum, description: "" }]);
    setCoMappings((prev) => ({
      ...prev,
      [nextCoNum]: { tlos: [""], llos: [""] }
    }));
  };

  const handleDeleteCo = (coNumber) => {
    if (courseOutcomes.length <= 1) return;
    const indexToDelete = courseOutcomes.findIndex((c) => c.coNumber === coNumber);
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
  };

  // Mappings Mutation Handlers
  const handleAddOutcomeField = (coNumber, type) => {
    setCoMappings((prev) => {
      const current = prev[coNumber] ? { ...prev[coNumber] } : { tlos: [""], llos: [""] };
      current[type] = [...current[type], ""];
      return { ...prev, [coNumber]: current };
    });
  };

  const handleRemoveOutcomeField = (coNumber, type, index) => {
    setCoMappings((prev) => {
      const current = prev[coNumber] ? { ...prev[coNumber] } : { tlos: [""], llos: [""] };
      if (current[type].length <= 1) {
        current[type] = [""]; // reset to empty field
      } else {
        current[type] = current[type].filter((_, idx) => idx !== index);
      }
      return { ...prev, [coNumber]: current };
    });
  };

  const handleFieldChange = (coNumber, type, index, value) => {
    setCoMappings((prev) => {
      const current = prev[coNumber] ? { ...prev[coNumber] } : { tlos: [""], llos: [""] };
      const updatedList = [...current[type]];
      updatedList[index] = value;
      current[type] = updatedList;
      return { ...prev, [coNumber]: current };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const subjectId = CiaanData.subject?._id || CiaanData.subjectId;

      // Construct coData structure, filtering out empty entries
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
          CiaanId: CiaanData.CiaanId,
          subjectId,
          coData: coDataPayload,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSuccess("TLO & LLO mapping saved successfully!");
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

  return (
    <div className="student-layout">
      <div className="student-main-row">
        {/* Left Column: Workspace Secondary Sidebar */}
        <div className="student-secondary-sidebar-wrapper">
          <SecondarySidebar
            CiaanData={CiaanData}
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
                <h2 className="fw-bold text-dark mb-1">TLO & LLO Details</h2>
                <p className="text-secondary mb-0">
                  Define Topic Learning Outcomes (TLO) and Lab Learning Outcomes (LLO) per Course Outcome (CO) directly.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCo}
                  disabled={loading || !CiaanData}
                  className="btn btn-outline-success rounded-pill px-4 fw-bold shadow-sm"
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Course Outcome
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !CiaanData}
                  className="btn btn-success rounded-pill px-4 fw-bold shadow-sm"
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i> Save TLO & LLO
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

            {/* Loading Outcomes Spinner */}
            {loading ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm my-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading Course Outcomes...</span>
                </div>
                <p className="mt-3 text-muted">Loading Course Outcomes & mappings...</p>
              </div>
            ) : (
              /* CO Iteration Cards */
              <div className="row">
                {courseOutcomes.length === 0 ? (
                  <div className="col-12">
                    <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-3">
                      <i className="bi bi-diagram-2-fill fs-1 text-muted mb-3"></i>
                      <h5 className="text-muted">No Course Outcomes Defined</h5>
                      <p className="text-secondary small mb-0">
                        Please add a Course Outcome using the '+ Add Course Outcome' button above.
                      </p>
                    </div>
                  </div>
                ) : (
                  courseOutcomes.map((co) => {
                    const mappings = coMappings[co.coNumber] || { tlos: [""], llos: [""] };

                    return (
                      <div key={co.coNumber} className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                          {/* Card Header (CO Number and Name) */}
                          <div className="card-header border-0 bg-dark text-white p-3 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              <span className="badge bg-success fs-6 px-3 py-2 rounded-pill">
                                {co.coNumber}
                              </span>
                              <input
                                type="text"
                                value={co.description || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCourseOutcomes((prev) =>
                                    prev.map((c) =>
                                      c.coNumber === co.coNumber
                                        ? { ...c, description: val }
                                        : c
                                    )
                                  );
                                }}
                                placeholder="Enter Course Outcome Description..."
                                className="form-control form-control-sm bg-transparent border-0 text-white fw-semibold fs-5 p-0"
                                style={{ outline: "none", boxShadow: "none" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCo(co.coNumber)}
                              disabled={courseOutcomes.length <= 1}
                              className="btn btn-sm btn-outline-danger border-0 text-white"
                              title="Delete Course Outcome"
                            >
                              <i className="bi bi-trash-fill text-danger fs-5"></i>
                            </button>
                          </div>

                          {/* Card Body */}
                          <div className="card-body p-4 bg-white">
                            <div className="row g-4">
                              {/* TLO Column */}
                              <div className="col-md-6 border-end-md">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                  <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                                    <i className="bi bi-journal-text text-primary"></i>
                                    Topic Learning Outcomes (TLO)
                                  </h6>
                                  <button
                                    type="button"
                                    onClick={() => handleAddOutcomeField(co.coNumber, "tlos")}
                                    className="btn btn-sm btn-outline-primary rounded-circle p-1 d-flex align-items-center justify-content-center"
                                    style={{ width: "28px", height: "28px" }}
                                    title="Add TLO Field"
                                  >
                                    <i className="bi bi-plus"></i>
                                  </button>
                                </div>

                                {mappings.tlos.map((tlo, idx) => (
                                  <div key={idx} className="input-group mb-2 shadow-sm rounded-3 overflow-hidden">
                                    <span className="input-group-text border-0 bg-light text-secondary small fw-semibold">
                                      TLO {idx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={tlo}
                                      onChange={(e) => handleFieldChange(co.coNumber, "tlos", idx, e.target.value)}
                                      placeholder="Describe topic learning outcome..."
                                      className="form-control border-0 px-3 bg-light"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOutcomeField(co.coNumber, "tlos", idx)}
                                      className="btn btn-outline-danger border-0 bg-light"
                                      title="Delete Field"
                                    >
                                      <i className="bi bi-dash-circle-fill"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* LLO Column */}
                              <div className="col-md-6">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                  <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-0">
                                    <i className="bi bi-flask-fill text-info"></i>
                                    Lab Learning Outcomes (LLO)
                                  </h6>
                                  <button
                                    type="button"
                                    onClick={() => handleAddOutcomeField(co.coNumber, "llos")}
                                    className="btn btn-sm btn-outline-info rounded-circle p-1 d-flex align-items-center justify-content-center"
                                    style={{ width: "28px", height: "28px" }}
                                    title="Add LLO Field"
                                  >
                                    <i className="bi bi-plus text-info"></i>
                                  </button>
                                </div>

                                {mappings.llos.map((llo, idx) => (
                                  <div key={idx} className="input-group mb-2 shadow-sm rounded-3 overflow-hidden">
                                    <span className="input-group-text border-0 bg-light text-secondary small fw-semibold">
                                      LLO {idx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={llo}
                                      onChange={(e) => handleFieldChange(co.coNumber, "llos", idx, e.target.value)}
                                      placeholder="Describe laboratory outcome..."
                                      className="form-control border-0 px-3 bg-light"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOutcomeField(co.coNumber, "llos", idx)}
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
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
