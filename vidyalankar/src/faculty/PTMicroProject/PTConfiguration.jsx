import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";

export default function PTConfiguration() {
  const location = useLocation();
  const navigate = useNavigate();

  const { ciann, subject, config: existingConfig } = location.state || {};

  const [slaMarks, setSlaMarks] = useState(25);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState([
    { componentName: "Assignment", maxMarks: 15 },
    { componentName: "Other Activity", maxMarks: 5 },
    { componentName: "Microproject", maxMarks: 5 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ciann || !subject) {
      navigate("/pt-microproject/dashboard");
      return;
    }

    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const subjectId = subject._id || subject.subjectId || ciann.subject?._id;

        const res = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/course-details/${subjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();

        if (data.success && data.courseDetails) {
          const maxSla = data.courseDetails.assessmentScheme?.sla?.max;
          if (maxSla && maxSla !== "-") {
            const parsedSla = parseInt(maxSla, 10);
            if (!isNaN(parsedSla)) {
              setSlaMarks(parsedSla);
              // If we don't have an existing configuration, let's adjust components to total this SLA marks
              if (!existingConfig) {
                if (parsedSla === 25) {
                  setComponents([
                    { componentName: "Assignment", maxMarks: 15 },
                    { componentName: "Other Activity", maxMarks: 5 },
                    { componentName: "Microproject", maxMarks: 5 },
                  ]);
                } else {
                  // Fallback: assign all marks to Assignment as default
                  setComponents([{ componentName: "Assignment", maxMarks: parsedSla }]);
                }
              }
            }
          }
        }

        // If existing configuration is found, load it
        if (existingConfig) {
          setSlaMarks(existingConfig.slaMarks);
          setComponents(existingConfig.components);
        } else {
          // Double check if there's an existing configuration in DB anyway
          const configRes = await fetch(
            `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/config/${ciann.ciannId}/${subjectId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const configData = await configRes.json();
          if (configData.success && configData.config) {
            setSlaMarks(configData.config.slaMarks);
            setComponents(configData.config.components);
          }
        }
      } catch (err) {
        console.error("Error fetching course details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [ciann, subject, existingConfig, navigate]);

  const handleAddComponent = () => {
    setComponents([...components, { componentName: "", maxMarks: 0 }]);
  };

  const handleRemoveComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...components];
    if (field === "maxMarks") {
      const parsedVal = parseInt(value, 10);
      updated[index][field] = isNaN(parsedVal) ? 0 : parsedVal;
    } else {
      updated[index][field] = value;
    }
    setComponents(updated);
  };

  const handlePresetSelect = (presetName) => {
    if (presetName === "standard") {
      setComponents([
        { componentName: "Assignment", maxMarks: 15 },
        { componentName: "Other Activity", maxMarks: 5 },
        { componentName: "Microproject", maxMarks: 5 },
      ]);
    } else if (presetName === "micro_only") {
      setComponents([{ componentName: "Microproject", maxMarks: slaMarks }]);
    } else if (presetName === "quiz_viva") {
      const half = Math.floor(slaMarks / 2);
      const diff = slaMarks - half * 2;
      setComponents([
        { componentName: "Quiz", maxMarks: half },
        { componentName: "Viva Voce", maxMarks: half + diff },
      ]);
    }
  };

  const totalConfigured = components.reduce((sum, c) => sum + c.maxMarks, 0);
  const exceedsSla = totalConfigured > slaMarks;
  const matchesSla = totalConfigured === slaMarks;

  const handleSaveConfig = async () => {
    if (totalConfigured !== slaMarks) {
      alert(`Error: Total component marks (${totalConfigured}) must equal SLA Max Marks (${slaMarks}) exactly.`);
      return;
    }

    if (components.some((c) => !c.componentName.trim())) {
      alert("Error: Please provide a name for all components.");
      return;
    }

    if (components.some((c) => c.maxMarks <= 0)) {
      alert("Error: All components must have maximum marks greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const subjectId = subject._id || subject.subjectId || ciann.subject?._id;

      const bodyPayload = {
        ciannId: ciann.ciannId,
        courseId: ciann.courseId?._id || ciann.courseId,
        semester: ciann.semester,
        divisionId: ciann.divisionId || "60c72b2f9b1d8b2d88a299fa", // fallback default division object id if none
        subjectId,
        academicYear: ciann.academicYear,
        slaMarks,
        components: components.map((c) => ({
          componentName: c.componentName.trim(),
          maxMarks: c.maxMarks,
        })),
      };

      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/pt-microproject/new/config`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success && data.config) {
        alert("Configuration saved successfully!");
        navigate(`/pt-microproject/entry`, {
          state: {
            ciann,
            subject,
            config: data.config,
          },
        });
      } else {
        alert(data.message || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Error saving PT configuration:", err);
      alert("Error saving configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ciann || !subject) return null;

  return (
    <>
      <Header showSearch={false} />
      <div className="container-fluid py-4 px-md-5">
        {/* Navigation Breadcrumb */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <button
            onClick={() => navigate("/pt-microproject/dashboard")}
            className="btn btn-outline-secondary btn-sm px-3 rounded-pill d-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
          <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
            CIANN {ciann.ciannId} &bull; Sem {ciann.semester} &bull; Div {ciann.division}
          </span>
        </div>

        {/* Page Header */}
        <div className="row mb-5">
          <div className="col-12">
            <h2 className="fw-bold text-dark mb-1">PT Configuration</h2>
            <p className="text-secondary">Set up the assessment component breakdown of SLA Max Marks for this subject.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Fetching subject course details & SLA marks...</p>
          </div>
        ) : (
          <div className="row">
            {/* Left side: Configuration Details */}
            <div className="col-lg-8 mb-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <h4 className="fw-semibold text-dark mb-0">Component Distribution</h4>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetSelect("standard")}
                      className="btn btn-sm btn-outline-success rounded-pill px-3"
                    >
                      Preset: 15-5-5
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect("quiz_viva")}
                      className="btn btn-sm btn-outline-success rounded-pill px-3"
                    >
                      Preset: Quiz/Viva
                    </button>
                  </div>
                </div>

                {/* Component Rows */}
                {components.map((comp, idx) => (
                  <div key={idx} className="row g-3 align-items-center mb-3 p-3 rounded-3 bg-light border-start border-success border-3">
                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Component Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Assignment, Viva, Presentation..."
                        value={comp.componentName}
                        onChange={(e) => handleComponentChange(idx, "componentName", e.target.value)}
                        className="form-control rounded-3 border-0 shadow-sm px-3"
                      />
                    </div>
                    <div className="col-md-4 col-8">
                      <label className="form-label small text-muted mb-1">Max Marks</label>
                      <div className="input-group">
                        <input
                          type="number"
                          min="0"
                          max={slaMarks}
                          placeholder="Max Marks"
                          value={comp.maxMarks || ""}
                          onChange={(e) => handleComponentChange(idx, "maxMarks", e.target.value)}
                          className="form-control rounded-start-3 border-0 shadow-sm px-3"
                        />
                        <span className="input-group-text border-0 bg-white shadow-sm text-secondary">
                          / {slaMarks}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-2 col-4 text-end text-md-center pt-3 pt-md-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        disabled={components.length <= 1}
                        className="btn btn-outline-danger btn-sm border-0 rounded-circle p-2"
                        title="Remove Component"
                      >
                        <i className="bi bi-trash-fill fs-5"></i>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="btn btn-outline-success w-100 py-3 border-dashed rounded-3 mt-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ borderStyle: "dashed" }}
                >
                  <i className="bi bi-plus-circle-fill"></i> Add Custom Component
                </button>
              </div>
            </div>

            {/* Right side: Summary & Validation */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white position-sticky" style={{ top: "100px" }}>
                <h4 className="fw-semibold mb-4 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill text-success"></i> Summary
                </h4>

                <div className="mb-4">
                  <span className="text-secondary small d-block mb-1">Subject</span>
                  <span className="fw-bold fs-5 text-white">{subject.name}</span>
                  <span className="text-secondary small d-block">Code: {subject.code}</span>
                </div>

                <div className="mb-4">
                  <span className="text-secondary small d-block mb-1">SLA Max Marks</span>
                  <span className="badge bg-success fs-6 px-3 py-2 rounded-pill">
                    {slaMarks} Marks
                  </span>
                </div>

                <div className="mb-4 pt-3 border-top border-secondary">
                  <span className="text-secondary small d-block mb-1">Configured Breakdown Total</span>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className={`display-6 fw-bold ${exceedsSla ? "text-danger" : matchesSla ? "text-success" : "text-warning"}`}>
                      {totalConfigured}
                    </span>
                    <span className="text-secondary">/ {slaMarks} Marks</span>
                  </div>
                </div>

                {/* Validation messages */}
                {exceedsSla && (
                  <div className="alert border-0 rounded-3 small py-2 d-flex align-items-center gap-2" style={{ backgroundColor: "#fdf2f2", color: "#9b1c1c", border: "1px solid #f8b4b4", width: "100%" }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: "#e02424", fontSize: "1.1rem" }}></i>
                    <span>Total component marks exceed SLA Max Marks of {slaMarks}! Please reduce component marks.</span>
                  </div>
                )}

                {matchesSla && (
                  <div className="alert border-0 rounded-3 small py-2 d-flex align-items-center gap-2" style={{ backgroundColor: "#f3faf7", color: "#03543f", border: "1px solid #def7ec", width: "100%" }}>
                    <i className="bi bi-check-circle-fill" style={{ color: "#0e9f6e", fontSize: "1.1rem" }}></i>
                    <span>Total breakdown matches SLA Max Marks exactly. Perfect!</span>
                  </div>
                )}

                {!exceedsSla && !matchesSla && (
                  <div className="alert border-0 rounded-3 small py-2 d-flex align-items-center gap-2" style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", width: "100%" }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ color: "#d97706", fontSize: "1.1rem" }}></i>
                    <span>Total breakdown ({totalConfigured}) is less than SLA Max Marks ({slaMarks}). Marks entry will total up to {totalConfigured}.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving || !matchesSla}
                  className="btn btn-success w-100 py-3 mt-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill fs-5"></i>
                      <span>Save & Continue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
