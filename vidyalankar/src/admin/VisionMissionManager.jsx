import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./VisionMissionManager.css";

const VisionMissionManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("institution"); // "institution" or "department"
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState([]);
  const [peos, setPeos] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);

  // Fetch departments if department tab is active
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartments();
  }, [navigate]);

  // Load configuration whenever activeTab or selectedDeptId changes
  useEffect(() => {
    if (activeTab === "institution") {
      fetchConfig(null);
    } else if (activeTab === "department" && selectedDeptId) {
      fetchConfig(selectedDeptId);
    } else {
      // Clear states if in department tab but no department selected
      setVision("");
      setMission([]);
      setPeos([]);
      setPos([]);
      setPsos([]);
    }
  }, [activeTab, selectedDeptId]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments);
        if (response.data.departments.length > 0) {
          setSelectedDeptId(response.data.departments[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showErrorAlert("Failed to load departments");
    }
  };

  const fetchConfig = async (deptId) => {
    setLoading(true);
    try {
      const url = `${config.admin.visionMission}${deptId ? `?departmentId=${deptId}` : ""}`;
      const response = await axios.get(url);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setVision(data.vision || "");
        setMission(data.mission || []);
        setPeos(data.peos || []);
        setPos(data.pos || []);
        setPsos(data.psos || []);
      } else {
        // Reset to default empty template if not found or failed
        setVision("");
        setMission([]);
        setPeos([]);
        setPos([]);
        setPsos([]);
      }
    } catch (err) {
      console.error("Error fetching configuration:", err);
      showErrorAlert("Failed to load Vision & Mission configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!vision.trim()) {
      showErrorAlert("Vision statement is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        departmentId: activeTab === "department" ? selectedDeptId : null,
        vision,
        mission: mission.filter(item => item.trim() !== ""),
        peos: activeTab === "department" ? peos.filter(item => item.trim() !== "") : [],
        pos: activeTab === "department" ? pos : [],
        psos: activeTab === "department" ? psos : []
      };

      const response = await axios.post(config.admin.visionMission, payload);
      if (response.data.success) {
        showSuccessAlert(response.data.message || "Configuration saved successfully");
        // Update local state with saved data
        const saved = response.data.data;
        setVision(saved.vision || "");
        setMission(saved.mission || []);
        setPeos(saved.peos || []);
        setPos(saved.pos || []);
        setPsos(saved.psos || []);
      } else {
        showErrorAlert(response.data.message || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Error saving configuration:", err);
      showErrorAlert("An error occurred while saving the configuration");
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for dynamic array inputs
  const handleAddMission = () => setMission([...mission, ""]);
  const handleRemoveMission = (idx) => setMission(mission.filter((_, i) => i !== idx));
  const handleMissionChange = (idx, val) => {
    const updated = [...mission];
    updated[idx] = val;
    setMission(updated);
  };

  const handleAddPEO = () => setPeos([...peos, ""]);
  const handleRemovePEO = (idx) => setPeos(peos.filter((_, i) => i !== idx));
  const handlePEOChange = (idx, val) => {
    const updated = [...peos];
    updated[idx] = val;
    setPeos(updated);
  };

  const handleAddPO = () => setPos([...pos, { code: `PO ${pos.length + 1}`, name: "", description: "" }]);
  const handleRemovePO = (idx) => setPos(pos.filter((_, i) => i !== idx));
  const handlePOChange = (idx, field, val) => {
    const updated = [...pos];
    updated[idx] = { ...updated[idx], [field]: val };
    setPos(updated);
  };

  const handleAddPSO = () => setPsos([...psos, { code: `PSO ${psos.length + 1}`, name: "", description: "" }]);
  const handleRemovePSO = (idx) => setPsos(psos.filter((_, i) => i !== idx));
  const handlePSOChange = (idx, field, val) => {
    const updated = [...psos];
    updated[idx] = { ...updated[idx], [field]: val };
    setPsos(updated);
  };

  return (
    <div className="admin-content vision-mission-manager">
      <div className="page-header">
        <div>
          <h2>Vision, Mission & Outcomes</h2>
          <p>Configure institution and department-level vision, mission, PEOs, POs, and PSOs statements</p>
        </div>
      </div>

      <div className="vm-tabs-container">
        <button
          className={`vm-tab-btn ${activeTab === "institution" ? "active" : ""}`}
          onClick={() => setActiveTab("institution")}
        >
          <i className="bi bi-bank"></i> Institution Level
        </button>
        <button
          className={`vm-tab-btn ${activeTab === "department" ? "active" : ""}`}
          onClick={() => setActiveTab("department")}
        >
          <i className="bi bi-mortarboard"></i> Department Level
        </button>
      </div>

      {activeTab === "department" && (
        <div className="department-select-section card mb-lg">
          <label htmlFor="deptSelect" className="form-label">Select Department</label>
          <select
            id="deptSelect"
            className="form-control"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-container card">
          <div className="loading-spinner"></div>
          <p>Loading configuration details...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="vm-form">
          {/* VISION STATEMENT */}
          <div className="card mb-lg">
            <div className="card-header-accent">
              <h3>Vision Statement</h3>
            </div>
            <div className="form-group mt-md">
              <label htmlFor="visionInput">Enter the Vision Statement</label>
              <textarea
                id="visionInput"
                className="form-control"
                rows="4"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="e.g. To empower students with domain knowledge..."
                required
              />
            </div>
          </div>

          {/* MISSION BULLET POINTS */}
          <div className="card mb-lg">
            <div className="card-header-accent flex-between items-center">
              <h3>Mission Statements</h3>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleAddMission}
              >
                <i className="bi bi-plus-lg"></i> Add Bullet Point
              </button>
            </div>
            <div className="mission-list mt-md flex flex-col gap-sm">
              {mission.length === 0 ? (
                <p className="no-items-text">No mission points added yet. Click 'Add Bullet Point' to start.</p>
              ) : (
                mission.map((point, index) => (
                  <div key={index} className="array-item-row flex items-center gap-sm">
                    <span className="row-number">{index + 1}.</span>
                    <input
                      type="text"
                      className="form-control"
                      value={point}
                      onChange={(e) => handleMissionChange(index, e.target.value)}
                      placeholder="e.g. Developing technical skills by explaining..."
                    />
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => handleRemoveMission(index)}
                      title="Delete point"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {activeTab === "department" && (
            <>
              {/* PROGRAM EDUCATIONAL OBJECTIVES (PEOs) */}
              <div className="card mb-lg">
                <div className="card-header-accent flex-between items-center">
                  <h3>Program Educational Objectives (PEOs)</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddPEO}
                  >
                    <i className="bi bi-plus-lg"></i> Add PEO Point
                  </button>
                </div>
                <div className="peo-list mt-md flex flex-col gap-sm">
                  {peos.length === 0 ? (
                    <p className="no-items-text">No PEO points added yet. Click 'Add PEO Point' to start.</p>
                  ) : (
                    peos.map((point, index) => (
                      <div key={index} className="array-item-row flex items-center gap-sm">
                        <span className="row-number">{index + 1}.</span>
                        <input
                          type="text"
                          className="form-control"
                          value={point}
                          onChange={(e) => handlePEOChange(index, e.target.value)}
                          placeholder="e.g. Provide socially responsible, environment friendly solutions..."
                        />
                        <button
                          type="button"
                          className="btn btn-icon btn-danger"
                          onClick={() => handleRemovePEO(index)}
                          title="Delete PEO"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PROGRAM OUTCOMES (POs) */}
              <div className="card mb-lg">
                <div className="card-header-accent flex-between items-center">
                  <h3>Program Outcomes (POs)</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddPO}
                  >
                    <i className="bi bi-plus-lg"></i> Add Custom PO
                  </button>
                </div>
                <div className="po-list mt-md flex flex-col gap-md">
                  {pos.length === 0 ? (
                    <p className="no-items-text">No PO points added yet. Click 'Add Custom PO' to start.</p>
                  ) : (
                    pos.map((po, index) => (
                      <div key={index} className="outcome-block-row card secondary-card flex flex-col gap-sm">
                        <div className="flex-between items-center">
                          <span className="outcome-title-badge">Outcome #{index + 1}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemovePO(index)}
                          >
                            <i className="bi bi-trash"></i> Remove
                          </button>
                        </div>
                        <div className="grid-2 mt-xs">
                          <div className="form-group">
                            <label>Code (e.g. PO 1)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={po.code}
                              onChange={(e) => handlePOChange(index, "code", e.target.value)}
                              placeholder="PO 1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Name (e.g. Problem analysis)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={po.name}
                              onChange={(e) => handlePOChange(index, "name", e.target.value)}
                              placeholder="Problem analysis"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={po.description}
                            onChange={(e) => handlePOChange(index, "description", e.target.value)}
                            placeholder="Detailed description of the outcome..."
                            required
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PROGRAM SPECIFIC OUTCOMES (PSOs) */}
              <div className="card mb-lg">
                <div className="card-header-accent flex-between items-center">
                  <h3>Program Specific Outcomes (PSOs)</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddPSO}
                  >
                    <i className="bi bi-plus-lg"></i> Add Custom PSO
                  </button>
                </div>
                <div className="pso-list mt-md flex flex-col gap-md">
                  {psos.length === 0 ? (
                    <p className="no-items-text">No PSO points added yet. Click 'Add Custom PSO' to start.</p>
                  ) : (
                    psos.map((pso, index) => (
                      <div key={index} className="outcome-block-row card secondary-card flex flex-col gap-sm">
                        <div className="flex-between items-center">
                          <span className="outcome-title-badge pso-badge">Specific Outcome #{index + 1}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemovePSO(index)}
                          >
                            <i className="bi bi-trash"></i> Remove
                          </button>
                        </div>
                        <div className="grid-2 mt-xs">
                          <div className="form-group">
                            <label>Code (e.g. PSO 1)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pso.code}
                              onChange={(e) => handlePSOChange(index, "code", e.target.value)}
                              placeholder="PSO 1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Name (e.g. Computer Software...)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pso.name}
                              onChange={(e) => handlePSOChange(index, "name", e.target.value)}
                              placeholder="Computer Software & Hardware"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={pso.description}
                            onChange={(e) => handlePSOChange(index, "description", e.target.value)}
                            placeholder="Detailed description of the outcome..."
                            required
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* SAVE CONTROLS */}
          <div className="form-action-bar card mt-lg flex-end">
            <button
              type="submit"
              className="btn btn-primary btn-save flex items-center gap-sm"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Saving Configuration...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VisionMissionManager;
