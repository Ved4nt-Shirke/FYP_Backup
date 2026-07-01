import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import { config, getApiUrl } from "../../config/api";
import "../editCiann/EditCiannModern.css";
import "./TloLloModern.css";

export default function Tlo() {
  const location = useLocation();
  const navigate = useNavigate();

  const [CiaanData, setCiaanData] = useState(null);
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

  // Resolve CIAAN Data
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

  // Load Outcomes & Mappings
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
        if (loadedCOs.length > 0) {
          setSelectedCo(loadedCOs[0].coNumber);
        }
      } catch (err) {
        console.error("Error fetching TLO details:", err);
        setError("Error loading Course Outcomes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [CiaanData]);

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
      const subjectId = CiaanData.subject?._id || CiaanData.subjectId;

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
    <div className="student-layout tlo-page-active">
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
            <div className="mb-4">
              <h2 className="fw-bold mb-1" style={{ color: "#0b3b2c" }}>Topic Learning Outcomes (TLO)</h2>
              <p className="text-secondary mb-0">
                Select a Course Outcome (CO) from Admin Subject Course Details and define its corresponding Topic Learning Outcomes.
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
              <div className="text-center py-5 bg-white rounded-4 shadow-sm my-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading Course Outcomes...</span>
                </div>
                <p className="mt-3 text-muted">Loading Course Outcomes & mappings...</p>
              </div>
            ) : (
              <div className="row g-4">
                {/* Selector and Editing Card */}
                <div className="col-12">
                  <div className="tlollo-card">
                    {/* Header */}
                    <div className="tlollo-card-header">
                      <h4 className="tlollo-card-title">TLO Management</h4>
                      <span className="tlollo-subject-badge">
                        Subject: {CiaanData?.subject?.name || "Active subject"}
                      </span>
                    </div>

                    {/* Body Grid */}
                    <div className="tlollo-grid">
                      {/* Left Column: CO Dropdown Selection & Description */}
                      <div>
                        <div className="co-section-header">
                          <label className="co-section-title">Course Outcome (CO)</label>
                          <div className="co-actions">
                            <button
                              type="button"
                              onClick={handleAddCo}
                              className="btn-action-green"
                            >
                              <i className="bi bi-plus-lg"></i> ADD
                            </button>
                            {courseOutcomes.length > 1 && (
                              <button
                                type="button"
                                onClick={handleDeleteCo}
                                className="btn-action-green btn-delete"
                              >
                                <i className="bi bi-trash-fill"></i> DELETE
                              </button>
                            )}
                          </div>
                        </div>

                        <select
                          value={selectedCo}
                          onChange={(e) => setSelectedCo(e.target.value)}
                          className="co-dropdown"
                        >
                          {courseOutcomes.map((co) => (
                            <option key={co.coNumber} value={co.coNumber}>
                              {co.coNumber}
                            </option>
                          ))}
                        </select>

                        {selectedCoObj && (
                          <div className="co-description-box">
                            <span className="co-description-label">Description</span>
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
                              className="co-description-textarea"
                              placeholder="Enter Course Outcome Description..."
                              rows="4"
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Column: Outcomes Inputs */}
                      <div>
                        <div className="outcomes-section-header">
                          <h6 className="outcomes-section-title">
                            <i className="bi bi-journal-text outcomes-section-title-icon"></i>
                            Mapped Topic Learning Outcomes for {selectedCo}
                          </h6>
                          <button
                            type="button"
                            onClick={handleAddTloField}
                            className="btn-add-outcome"
                          >
                            <i className="bi bi-plus-lg"></i> ADD TLO
                          </button>
                        </div>

                        <div className="outcomes-list">
                          {activeTlos.map((tlo, idx) => (
                            <div key={idx} className="outcome-item">
                              <span className="outcome-badge">
                                TLO {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={tlo}
                                onChange={(e) => handleTloFieldChange(idx, e.target.value)}
                                placeholder="Describe topic learning outcome..."
                                className="outcome-input"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveTloField(idx)}
                                className="btn-delete-outcome"
                                title="Delete TLO"
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Success Alert */}
                    {success && (
                      <div className="alert alert-success border-0 rounded-3 shadow-sm d-flex align-items-center gap-2 mb-3 mt-4">
                        <i className="bi bi-check-circle-fill text-success fs-5"></i>
                        <span>{success}</span>
                      </div>
                    )}

                    {/* Save Button Footer */}
                    <div className="tlollo-save-footer">
                      <button
                        onClick={handleSave}
                        disabled={saving || loading || !CiaanData}
                        className="btn-save-details"
                      >
                        {saving ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <>
                            <i className="bi bi-cloud-arrow-up-fill"></i> SAVE TLO DETAILS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="col-12">
                  <div className="tlollo-summary-card">
                    <h5 className="tlollo-summary-title">TLO Mapping Summary</h5>
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
                            const coNum = co.coNumber.replace(/\D/g, "") || "1";

                            return (
                              <tr key={co.coNumber}>
                                <td>
                                  <span className="badge bg-success fs-7 rounded-pill">{co.coNumber}</span>
                                </td>
                                <td className="text-secondary small fw-semibold">{co.description}</td>
                                <td>
                                  {nonEmpties.length === 0 ? (
                                    <span className="text-muted italic small">No TLOs mapped yet</span>
                                  ) : (
                                    <div className="d-flex flex-column gap-1">
                                      {nonEmpties.map((t, idx) => (
                                        <div
                                          key={idx}
                                          className="small text-dark fw-semibold py-1"
                                          style={idx < nonEmpties.length - 1 ? { borderBottom: "1px solid #e9ecef" } : {}}
                                        >
                                          {coNum}.{idx + 1} {t}
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
