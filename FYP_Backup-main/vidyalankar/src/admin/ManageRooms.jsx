import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./ManageRooms.css";

const ManageRooms = () => {
  const [activeTab, setActiveTab] = useState("classrooms"); // 'classrooms' or 'labs'
  const [classrooms, setClassrooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form input states
  const [classroomName, setClassroomName] = useState("");
  const [labName, setLabName] = useState("");

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get(config.admin.classrooms);
      if (response.data.success) {
        setClassrooms(response.data.classrooms || []);
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      showErrorAlert("Failed to load classrooms");
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await axios.get(config.admin.labs);
      if (response.data.success) {
        setLabs(response.data.labs || []);
      }
    } catch (error) {
      console.error("Error fetching labs:", error);
      showErrorAlert("Failed to load labs");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClassrooms(), fetchLabs()]).finally(() => setLoading(false));
  }, []);

  const handleAddClassroom = async (e) => {
    e.preventDefault();
    if (!classroomName.trim()) {
      showErrorAlert("Classroom name cannot be empty");
      return;
    }

    try {
      const response = await axios.post(config.admin.classrooms, {
        name: classroomName.trim(),
      });
      if (response.data.success) {
        showSuccessAlert("Classroom added successfully");
        setClassroomName("");
        fetchClassrooms();
      }
    } catch (error) {
      console.error("Error adding classroom:", error);
      const msg = error.response?.data?.message || "Failed to add classroom";
      showErrorAlert(msg);
    }
  };

  const handleAddLab = async (e) => {
    e.preventDefault();
    if (!labName.trim()) {
      showErrorAlert("Lab name cannot be empty");
      return;
    }

    try {
      const response = await axios.post(config.admin.labs, {
        name: labName.trim(),
      });
      if (response.data.success) {
        showSuccessAlert("Lab added successfully");
        setLabName("");
        fetchLabs();
      }
    } catch (error) {
      console.error("Error adding lab:", error);
      const msg = error.response?.data?.message || "Failed to add lab";
      showErrorAlert(msg);
    }
  };

  const handleDeleteClassroom = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete classroom "${name}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(config.admin.classroomById(id));
      if (response.data.success) {
        showSuccessAlert("Classroom deleted successfully");
        fetchClassrooms();
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
      showErrorAlert("Failed to delete classroom");
    }
  };

  const handleDeleteLab = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete lab "${name}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(config.admin.labById(id));
      if (response.data.success) {
        showSuccessAlert("Lab deleted successfully");
        fetchLabs();
      }
    } catch (error) {
      console.error("Error deleting lab:", error);
      showErrorAlert("Failed to delete lab");
    }
  };

  const adminInstitution = localStorage.getItem("college") || "Institution";

  return (
    <div className="manage-rooms-container">
      {/* Header */}
      <div className="manage-rooms-header">
        <div className="header-title-section">
          <h2>Manage Infrastructure</h2>
          <p className="subtitle">
            Configure classrooms and laboratories for <strong>{adminInstitution}</strong>. These names will be dynamically fetched in the timetables.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rooms-tabs-container">
        <button
          className={`rooms-tab-btn ${activeTab === "classrooms" ? "active" : ""}`}
          onClick={() => setActiveTab("classrooms")}
        >
          <i className="bi bi-door-closed-fill"></i> Classrooms ({classrooms.length})
        </button>
        <button
          className={`rooms-tab-btn ${activeTab === "labs" ? "active" : ""}`}
          onClick={() => setActiveTab("labs")}
        >
          <i className="bi bi-cpu-fill"></i> Laboratories ({labs.length})
        </button>
      </div>

      {loading ? (
        <div className="rooms-loading">
          <div className="spinner"></div>
          <p>Loading infrastructure data...</p>
        </div>
      ) : (
        <div className="tab-content-wrapper">
          {/* CLASSROOMS TAB */}
          {activeTab === "classrooms" && (
            <div className="tab-card glass-card">
              <div className="card-header">
                <h3>Add New Classroom</h3>
                <p>Enter classroom identifier (e.g. V201, W008)</p>
              </div>

              <form onSubmit={handleAddClassroom} className="add-room-form">
                <div className="input-group-modern">
                  <span className="input-icon"><i className="bi bi-tag-fill"></i></span>
                  <input
                    type="text"
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    placeholder="e.g. V201"
                    maxLength="50"
                    required
                  />
                </div>
                <button type="submit" className="add-btn">
                  <i className="bi bi-plus-lg"></i> Add Classroom
                </button>
              </form>

              <div className="divider"></div>

              <div className="list-section">
                <h3>Existing Classrooms</h3>
                {classrooms.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-door-closed"></i>
                    <p>No classrooms added yet.</p>
                  </div>
                ) : (
                  <div className="rooms-grid">
                    {classrooms.map((room) => (
                      <div key={room._id} className="room-item-card">
                        <div className="room-info">
                          <i className="bi bi-door-closed-fill room-icon"></i>
                          <span className="room-name">{room.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteClassroom(room._id, room.name)}
                          className="delete-room-btn"
                          title="Delete Classroom"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LABS TAB */}
          {activeTab === "labs" && (
            <div className="tab-card glass-card">
              <div className="card-header">
                <h3>Add New Laboratory</h3>
                <p>Enter laboratory name (e.g. Programming Lab (V118), Electronics Lab (L015))</p>
              </div>

              <form onSubmit={handleAddLab} className="add-room-form">
                <div className="input-group-modern">
                  <span className="input-icon"><i className="bi bi-cpu-fill"></i></span>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="e.g. Programming Lab (V118)"
                    maxLength="100"
                    required
                  />
                </div>
                <button type="submit" className="add-btn">
                  <i className="bi bi-plus-lg"></i> Add Laboratory
                </button>
              </form>

              <div className="divider"></div>

              <div className="list-section">
                <h3>Existing Laboratories</h3>
                {labs.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-cpu"></i>
                    <p>No laboratories added yet.</p>
                  </div>
                ) : (
                  <div className="rooms-grid">
                    {labs.map((lab) => (
                      <div key={lab._id} className="room-item-card lab-card-item">
                        <div className="room-info">
                          <i className="bi bi-cpu-fill room-icon lab-icon"></i>
                          <span className="room-name">{lab.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLab(lab._id, lab.name)}
                          className="delete-room-btn"
                          title="Delete Laboratory"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageRooms;
