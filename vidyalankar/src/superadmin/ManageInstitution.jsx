import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import PalettePicker, { DEFAULT_PALETTE } from "./PalettePicker";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import "./ManageInstitution.css";

const ManageInstitution = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [updateInstitutionForm, setUpdateInstitutionForm] = useState({
    name: "",
    code: "",
    superadminPassword: "",
    confirmation: "",
  });

  const [updateAdminForm, setUpdateAdminForm] = useState({
    adminUsername: "",
    adminPassword: "",
    superadminPassword: "",
    confirmation: "",
  });

  const [deleteForm, setDeleteForm] = useState({
    superadminPassword: "",
    confirmation: "",
  });

  const [paletteState, setPaletteState] = useState(DEFAULT_PALETTE);
  const [paletteForm, setPaletteForm] = useState({
    superadminPassword: "",
    confirmation: "",
  });
  const [showPaletteModal, setShowPaletteModal] = useState(false);

  const [statusForm, setStatusForm] = useState({
    isActive: true,
    superadminPassword: "",
    confirmation: "",
  });

  useEffect(() => {
    fetchInstitution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInstitution = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/superadmin/institution/${id}`);

      if (response.data.success) {
        setInstitution(response.data.institution);
        setUpdateInstitutionForm({
          name: response.data.institution.name,
          code: response.data.institution.code,
          superadminPassword: "",
          confirmation: "",
        });
        setUpdateAdminForm({
          adminUsername: response.data.institution.adminUsername,
          adminPassword: "",
          superadminPassword: "",
          confirmation: "",
        });
        setStatusForm({
          isActive: response.data.institution.isActive !== false,
          superadminPassword: "",
          confirmation: "",
        });
        if (response.data.institution.palette) {
          setPaletteState(response.data.institution.palette);
        } else {
          setPaletteState(DEFAULT_PALETTE);
        }
      } else {
        setError("Failed to fetch institution: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching institution:", error);
      setError(
        "Error fetching institution: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePalette = async (e) => {
    e.preventDefault();
    console.log("Palette update form submitted");
    console.log("Current paletteState:", paletteState);
    console.log("Palette form values:", paletteForm);

    if (!paletteForm.superadminPassword) {
      showErrorAlert("Superadmin password is required");
      return;
    }
    if (!paletteForm.confirmation || paletteForm.confirmation !== "CONFIRM") {
      showErrorAlert('Please type "CONFIRM" to proceed');
      return;
    }
    try {
      const updatePayload = {
        palette: paletteState,
        superadminPassword: paletteForm.superadminPassword,
        confirmation: paletteForm.confirmation,
      };
      console.log("Sending payload to backend:", updatePayload);

      const response = await axios.put(
        `/superadmin/update-institution/${id}`,
        updatePayload,
      );
      console.log("Backend response:", response.data);

      if (response.data.success) {
        // Clear the cache so theme refreshes
        const college = localStorage.getItem("college") || institution?.code;
        if (college) {
          localStorage.removeItem(`palette:${college}`);
          console.log(`Cleared cache for palette:${college}`);
        }

        // Immediately update the palette in the summary
        const updatedInstitution = response.data.institution;
        if (updatedInstitution && updatedInstitution.palette) {
          setPaletteState(updatedInstitution.palette);
          console.log("Updated paletteState with:", updatedInstitution.palette);
        }

        showSuccessAlert(
          `✓ Color palette "${paletteState.name}" updated successfully!`,
        );
        setPaletteForm({ superadminPassword: "", confirmation: "" });
        setShowPaletteModal(false);

        // Fetch the updated institution data
        console.log("Fetching updated institution data...");
        await fetchInstitution();

        // Force refresh the admin theme for all open admin windows
        if (window.__adminTheme || response.data.institution?.palette) {
          console.log("Triggering admin theme refresh...");
          try {
            const { loadAndApplyAdminTheme, applyPalette } =
              await import("../utils/theme");

            // Apply palette immediately
            if (updatedInstitution?.palette) {
              applyPalette(updatedInstitution.palette);
              console.log(
                "Applied palette immediately:",
                updatedInstitution.palette,
              );
            }

            // Also refresh from API
            const updatedPalette = await loadAndApplyAdminTheme(college);
            console.log("Theme refreshed with palette:", updatedPalette);
          } catch (err) {
            console.warn("Could not reload theme:", err);
          }
        }
      } else {
        showErrorAlert(response.data.message || "Failed to update palette");
      }
    } catch (error) {
      console.error("Error updating palette:", error);
      showErrorAlert(
        "Error updating palette: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const renderPaletteSwatches = (palette) => {
    const colors = palette?.colors || {};
    return (
      <div className="palette-swatch-row">
        {Object.entries(colors).map(([key, value]) => (
          <span
            key={key}
            className="palette-swatch"
            title={`${key}: ${value}`}
            style={{ background: value }}
          />
        ))}
      </div>
    );
  };

  const handleUpdateInstitution = async (e) => {
    e.preventDefault();

    if (!updateInstitutionForm.superadminPassword) {
      showErrorAlert("Superadmin password is required");
      return;
    }

    if (
      !updateInstitutionForm.confirmation ||
      updateInstitutionForm.confirmation !== "CONFIRM"
    ) {
      showErrorAlert('Please type "CONFIRM" to proceed');
      return;
    }

    try {
      const response = await axios.put(`/superadmin/update-institution/${id}`, {
        name: updateInstitutionForm.name,
        code: updateInstitutionForm.code,
        superadminPassword: updateInstitutionForm.superadminPassword,
        confirmation: updateInstitutionForm.confirmation,
      });

      if (response.data.success) {
        showSuccessAlert("Institution updated successfully");
        setUpdateInstitutionForm({
          ...updateInstitutionForm,
          superadminPassword: "",
          confirmation: "",
        });
        fetchInstitution(); // Refresh data
      } else {
        showErrorAlert(response.data.message || "Failed to update institution");
      }
    } catch (error) {
      console.error("Error updating institution:", error);
      showErrorAlert(
        "Error updating institution: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();

    if (!updateAdminForm.superadminPassword) {
      showErrorAlert("Superadmin password is required");
      return;
    }

    if (
      !updateAdminForm.confirmation ||
      updateAdminForm.confirmation !== "CONFIRM"
    ) {
      showErrorAlert('Please type "CONFIRM" to proceed');
      return;
    }

    if (!updateAdminForm.adminUsername && !updateAdminForm.adminPassword) {
      showErrorAlert("Either username or password must be provided");
      return;
    }

    try {
      const updateData = {
        superadminPassword: updateAdminForm.superadminPassword,
        confirmation: updateAdminForm.confirmation,
      };

      // Only include fields that have values
      if (updateAdminForm.adminUsername) {
        updateData.adminUsername = updateAdminForm.adminUsername;
      }

      if (updateAdminForm.adminPassword) {
        updateData.adminPassword = updateAdminForm.adminPassword;
      }

      const response = await axios.put(
        `/superadmin/update-institution-admin/${id}`,
        updateData,
      );

      if (response.data.success) {
        showSuccessAlert("Admin credentials updated successfully");
        setUpdateAdminForm({
          adminUsername: response.data.institution.adminUsername,
          adminPassword: "",
          superadminPassword: "",
          confirmation: "",
        });
        fetchInstitution(); // Refresh data
      } else {
        showErrorAlert(
          response.data.message || "Failed to update admin credentials",
        );
      }
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      showErrorAlert(
        "Error updating admin credentials: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleUpdateInstitutionStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.superadminPassword) {
      showErrorAlert("Superadmin password is required");
      return;
    }

    if (!statusForm.confirmation || statusForm.confirmation !== "CONFIRM") {
      showErrorAlert('Please type "CONFIRM" to proceed');
      return;
    }

    try {
      const response = await axios.put(
        `/superadmin/update-institution-status/${id}`,
        {
          isActive: statusForm.isActive,
          superadminPassword: statusForm.superadminPassword,
          confirmation: statusForm.confirmation,
        },
      );

      if (response.data.success) {
        setInstitution((prev) => ({
          ...prev,
          isActive: response.data.institution.isActive,
        }));
        setStatusForm({
          isActive: response.data.institution.isActive,
          superadminPassword: "",
          confirmation: "",
        });
        showSuccessAlert(response.data.message || "Status updated");
      } else {
        showErrorAlert(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating institution status:", error);
      showErrorAlert(
        "Error updating status: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteInstitution = async (e) => {
    e.preventDefault();

    if (!deleteForm.superadminPassword) {
      showErrorAlert("Superadmin password is required");
      return;
    }

    if (!deleteForm.confirmation || deleteForm.confirmation !== "CONFIRM") {
      showErrorAlert('Please type "CONFIRM" to confirm deletion');
      return;
    }

    try {
      const response = await axios.delete(
        `/superadmin/delete-institution/${id}`,
        {
          data: {
            superadminPassword: deleteForm.superadminPassword,
            confirmation: deleteForm.confirmation,
          },
        },
      );

      if (response.data.success) {
        showSuccessAlert("Institution deleted successfully");
        setTimeout(() => {
          navigate("/superadmin-view-institutions");
        }, 1200);
      } else {
        showErrorAlert(response.data.message || "Failed to delete institution");
      }
    } catch (error) {
      console.error("Error deleting institution:", error);
      showErrorAlert(
        "Error deleting institution: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="manage-institution-container">
        <div className="page-header">
          <h2>Manage Institution</h2>
          <p className="text-muted">Loading institution details...</p>
        </div>

        <div className="card empty-card">
          <div className="card-body text-center">
            <div className="spinner"></div>
            <div className="loader-text">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-institution-container">
        <div className="page-header">
          <div>
            <h2>Manage Institution</h2>
            <p className="text-muted">Issue loading data</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/superadmin-view-institutions")}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to Institutions
          </button>
        </div>

        <div className="alert alert-danger">
          <h5>Error</h5>
          <p>{error}</p>
          <div className="mt-3">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/superadmin-view-institutions")}
            >
              Back to Institutions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="manage-institution-container">
        <div className="page-header">
          <div>
            <h2>Manage Institution</h2>
            <p className="text-muted">
              Manage <strong>{institution?.name}</strong> details and
              credentials
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/superadmin-view-institutions")}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to Institutions
          </button>
        </div>

        <div className="institution-info-card card">
          <div className="card-header">
            <h5>Institution Details</h5>
          </div>
          <div className="card-body">
            <div className="row info-row">
              <div className="col info-col">
                <div className="info-item">
                  <label className="info-label">Name</label>
                  <p className="info-value">{institution?.name}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Code</label>
                  <p className="info-value">
                    <span className="badge badge-primary">
                      {institution?.code}
                    </span>
                  </p>
                </div>
              </div>
              <div className="col info-col">
                <div className="info-item">
                  <label className="info-label">Admin Username</label>
                  <p className="info-value">{institution?.adminUsername}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Status</label>
                  <p className="info-value">
                    <span
                      className={`badge status-badge ${
                        institution?.isActive === false
                          ? "status-badge-inactive"
                          : "status-badge-active"
                      }`}
                    >
                      {institution?.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Created Date</label>
                  <p className="info-value">
                    {formatDate(institution?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="management-sections">
          {/* Institution Access Section */}
          <div className="section-card card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-toggle-on me-2"></i>
                Institution Access
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateInstitutionStatus}>
                <div className="status-toggle-row">
                  <div>
                    <div className="status-title">Access Status</div>
                    <div
                      className={`status-text ${
                        statusForm.isActive
                          ? "status-text-active"
                          : "status-text-inactive"
                      }`}
                    >
                      {statusForm.isActive
                        ? "Enabled for all users"
                        : "Disabled for all users"}
                    </div>
                    <div className="status-note">
                      Disabling blocks logins and panel access for this
                      institute.
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={statusForm.isActive}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="security-section">
                  <h6 className="security-title">Security Verification</h6>
                  <div className="grid-2">
                    <div className="mb-3">
                      <label className="form-label required">
                        Superadmin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={statusForm.superadminPassword}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            superadminPassword: e.target.value,
                          })
                        }
                        placeholder="Enter superadmin password"
                      />
                      <div className="form-text">
                        Required for security verification
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">
                        Confirmation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={statusForm.confirmation}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            confirmation: e.target.value,
                          })
                        }
                        placeholder="Type CONFIRM to proceed"
                      />
                      <div className="form-text">
                        Type "CONFIRM" to proceed with the update
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className={`btn ${
                      statusForm.isActive ? "btn-success" : "btn-danger"
                    }`}
                  >
                    <i
                      className={`fas me-2 ${
                        statusForm.isActive ? "fa-unlock" : "fa-lock"
                      }`}
                    ></i>
                    {statusForm.isActive ? "Enable Access" : "Disable Access"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* Update Color Palette Section */}
          <div className="section-card card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-palette me-2"></i>
                Update Color Palette
              </h5>
            </div>
            <div className="card-body">
              <div className="palette-summary">
                <div>
                  <div className="palette-name">
                    {paletteState?.name ??
                      (paletteState?.colors?.primary
                        ? "custom"
                        : DEFAULT_PALETTE.name)}
                  </div>
                  {renderPaletteSwatches(
                    paletteState?.colors ? paletteState : DEFAULT_PALETTE,
                  )}
                  <div className="palette-note">
                    Applies instantly to Admin UI for this institute.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPaletteModal(true)}
                >
                  <i className="fas fa-edit me-2" />
                  Edit Palette
                </button>
              </div>
            </div>
          </div>

          {/* Update Institution Details Section */}
          <div className="section-card card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-building me-2"></i>
                Update Institution Details
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateInstitution}>
                <div className="grid-2">
                  <div className="mb-3">
                    <label className="form-label required">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={updateInstitutionForm.name}
                      onChange={(e) =>
                        setUpdateInstitutionForm({
                          ...updateInstitutionForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter institution name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">
                      Institution Code
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={updateInstitutionForm.code}
                      onChange={(e) =>
                        setUpdateInstitutionForm({
                          ...updateInstitutionForm,
                          code: e.target.value,
                        })
                      }
                      placeholder="Enter institution code"
                    />
                  </div>
                </div>

                <div className="security-section">
                  <h6 className="security-title">Security Verification</h6>
                  <div className="grid-2">
                    <div className="mb-3">
                      <label className="form-label required">
                        Superadmin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={updateInstitutionForm.superadminPassword}
                        onChange={(e) =>
                          setUpdateInstitutionForm({
                            ...updateInstitutionForm,
                            superadminPassword: e.target.value,
                          })
                        }
                        placeholder="Enter superadmin password"
                      />
                      <div className="form-text">
                        Required for security verification
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">
                        Confirmation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={updateInstitutionForm.confirmation}
                        onChange={(e) =>
                          setUpdateInstitutionForm({
                            ...updateInstitutionForm,
                            confirmation: e.target.value,
                          })
                        }
                        placeholder="Type CONFIRM to proceed"
                      />
                      <div className="form-text">
                        Type "CONFIRM" to proceed with the update
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-2"></i>Update Institution
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Update Admin Credentials Section */}
          <div className="section-card card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-user-shield me-2"></i>
                Update Admin Credentials
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateAdminCredentials}>
                <div className="grid-2">
                  <div className="mb-3">
                    <label className="form-label">Admin Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={updateAdminForm.adminUsername}
                      onChange={(e) =>
                        setUpdateAdminForm({
                          ...updateAdminForm,
                          adminUsername: e.target.value,
                        })
                      }
                      placeholder="Enter new admin username"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Admin Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={updateAdminForm.adminPassword}
                      onChange={(e) =>
                        setUpdateAdminForm({
                          ...updateAdminForm,
                          adminPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new admin password"
                    />
                  </div>
                </div>

                <div className="alert alert-info">
                  <p className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    You can update either the username, password, or both. Leave
                    fields blank to keep current values.
                  </p>
                </div>

                <div className="security-section">
                  <h6 className="security-title">Security Verification</h6>
                  <div className="grid-2">
                    <div className="mb-3">
                      <label className="form-label required">
                        Superadmin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={updateAdminForm.superadminPassword}
                        onChange={(e) =>
                          setUpdateAdminForm({
                            ...updateAdminForm,
                            superadminPassword: e.target.value,
                          })
                        }
                        placeholder="Enter superadmin password"
                      />
                      <div className="form-text">
                        Required for security verification
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">
                        Confirmation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={updateAdminForm.confirmation}
                        onChange={(e) =>
                          setUpdateAdminForm({
                            ...updateAdminForm,
                            confirmation: e.target.value,
                          })
                        }
                        placeholder="Type CONFIRM to proceed"
                      />
                      <div className="form-text">
                        Type "CONFIRM" to proceed with the update
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    <i className="fas fa-key me-2"></i>Update Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Delete Institution Section */}
          <div className="section-card card border-danger">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="fas fa-trash-alt me-2"></i>
                Delete Institution
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <h5 className="alert-heading">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Warning!
                </h5>
                <p className="mb-0">
                  This action will permanently delete the institution "
                  <strong>{institution?.name}</strong>" and its associated admin
                  user. This cannot be undone.
                </p>
              </div>

              <form onSubmit={handleDeleteInstitution}>
                <div className="security-section">
                  <h6 className="security-title">Security Verification</h6>
                  <div className="grid-2">
                    <div className="mb-3">
                      <label className="form-label required">
                        Superadmin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={deleteForm.superadminPassword}
                        onChange={(e) =>
                          setDeleteForm({
                            ...deleteForm,
                            superadminPassword: e.target.value,
                          })
                        }
                        placeholder="Enter superadmin password"
                      />
                      <div className="form-text">
                        Required for security verification
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">
                        Confirmation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={deleteForm.confirmation}
                        onChange={(e) =>
                          setDeleteForm({
                            ...deleteForm,
                            confirmation: e.target.value,
                          })
                        }
                        placeholder="Type CONFIRM to confirm"
                      />
                      <div className="form-text">
                        Type "CONFIRM" to permanently delete this institution
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-danger">
                    <i className="fas fa-trash me-2"></i>Delete Institution
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showPaletteModal && (
        <div
          className="modal-overlay palette-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPaletteForm({ superadminPassword: "", confirmation: "" });
              setShowPaletteModal(false);
            }
          }}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h5 className="mb-1">Edit Color Palette</h5>
                <p className="text-muted small mb-0">
                  Pick a palette and confirm to apply it to the Admin panel.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                title="Close modal"
                onClick={() => {
                  setPaletteForm({ superadminPassword: "", confirmation: "" });
                  setShowPaletteModal(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary-dark)",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  padding: "4px 8px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(45,106,79,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <PalettePicker value={paletteState} onChange={setPaletteState} />
              <form onSubmit={handleUpdatePalette} className="mt-3">
                <div className="security-section">
                  <h6 className="security-title">Security Verification</h6>
                  <div className="grid-2">
                    <div className="mb-3">
                      <label className="form-label required">
                        Superadmin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={paletteForm.superadminPassword}
                        onChange={(e) =>
                          setPaletteForm({
                            ...paletteForm,
                            superadminPassword: e.target.value,
                          })
                        }
                        placeholder="Enter superadmin password"
                      />
                      <div className="form-text">
                        Required for security verification
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">
                        Confirmation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={paletteForm.confirmation}
                        onChange={(e) =>
                          setPaletteForm({
                            ...paletteForm,
                            confirmation: e.target.value,
                          })
                        }
                        placeholder="Type CONFIRM to proceed"
                      />
                      <div className="form-text">
                        Type "CONFIRM" to proceed with the update
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setPaletteForm({
                        superadminPassword: "",
                        confirmation: "",
                      });
                      setShowPaletteModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-2"></i>Save Palette
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageInstitution;
