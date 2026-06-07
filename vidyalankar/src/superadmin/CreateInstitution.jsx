import React, { useState } from "react";
import axios from "../utils/axiosConfig";
import "./CreateInstitution.css";
import PalettePicker, { DEFAULT_PALETTE } from "./PalettePicker";
import { buildInstitutionLogoUrl } from "../utils/institutionBranding";

const CreateInstitution = () => {
  const [institutionData, setInstitutionData] = useState({
    name: "",
    code: "",
    adminUsername: "",
    adminPassword: "",
  });

  const [advancedOptions, setAdvancedOptions] = useState(false);
  const [createdInstitution, setCreatedInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [logoFile, setLogoFile] = useState(null);

  const handleChange = (e) => {
    setInstitutionData({
      ...institutionData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!institutionData.name.trim() || !institutionData.code.trim()) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (institutionData.code.length < 2) {
      setError("Institution code must be at least 2 characters");
      setLoading(false);
      return;
    }

    if (advancedOptions) {
      const hasUsername = institutionData.adminUsername.trim() !== "";
      const hasPassword = institutionData.adminPassword.trim() !== "";

      if (hasUsername || hasPassword) {
        if (!hasUsername || !hasPassword) {
          setError(
            "Please provide both admin username and password if using advanced options",
          );
          setLoading(false);
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          setError("Token has expired. Please log in again.");
          setLoading(false);
          return;
        }
      } catch (decodeError) {
        // ignore
      }

      const requestData = new FormData();
      requestData.append("name", institutionData.name.trim());
      requestData.append("code", institutionData.code.trim());
      requestData.append("palette", JSON.stringify(palette));
      if (logoFile) {
        requestData.append("logo", logoFile);
      }

      if (advancedOptions) {
        const hasUsername = institutionData.adminUsername.trim() !== "";
        const hasPassword = institutionData.adminPassword.trim() !== "";

        if (hasUsername && hasPassword) {
          requestData.append("adminUsername", institutionData.adminUsername.trim());
          requestData.append("adminPassword", institutionData.adminPassword);
        }
      }

      const response = await axios.post(
        "/superadmin/create-institution",
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setCreatedInstitution(response.data.institution);
        setInstitutionData({
          name: "",
          code: "",
          adminUsername: "",
          adminPassword: "",
        });
        setLogoFile(null);
        setAdvancedOptions(false);
        setPalette(DEFAULT_PALETTE);
      } else {
        setError(response.data.message || "Failed to create institution");
      }
    } catch (error) {
      console.error("Error creating institution:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create institution",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (fieldKey, text) => {
    try {
      if (!navigator?.clipboard) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } else {
        await navigator.clipboard.writeText(text);
      }

      setCopiedField(fieldKey);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === fieldKey ? "" : prev));
      }, 1500);
    } catch {
      setError("Unable to copy right now. Please copy manually.");
    }
  };

  const resetForm = () => {
    setInstitutionData({
      name: "",
      code: "",
      adminUsername: "",
      adminPassword: "",
    });
    setAdvancedOptions(false);
    setPalette(DEFAULT_PALETTE);
    setLogoFile(null);
    setError("");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoFile(null);
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG or JPEG logo files are allowed");
      setLogoFile(null);
      e.target.value = "";
      return;
    }

    setError("");
    setLogoFile(file);
  };

  return (
    <div className="create-institution-container">
      <div className="page-header">
        <div>
          <h2>Create New Institution</h2>
          <p className="text-muted">Add a new institution to the system</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => window.history.back()}
        >
          <i className="fas fa-arrow-left me-2" /> Back
        </button>
      </div>

      <div className="grid-layout">
        <main className="main-col">
          <div className="card section-card">
            <div className="card-header">
              <h5>Institution Details</h5>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger mb-4">
                  <div>{error}</div>
                  <button
                    className="btn-close small"
                    onClick={() => setError("")}
                  />
                </div>
              )}

              {createdInstitution && (
                <div className="success-box">
                  <div className="success-header">
                    <i className="fas fa-check-circle" />
                    <div>
                      <strong>Institution Created Successfully!</strong>
                      <div className="small">
                        The institution has been created along with admin
                        credentials.
                      </div>
                    </div>
                  </div>

                  <div className="credentials-display">
                    <div className="credentials-title">Institution Credentials</div>
                    <div className="credential-row">
                      <div className="credential-label">Name</div>
                      <div className="credential-box">
                        {createdInstitution.name}
                      </div>
                    </div>
                    <div className="credential-row">
                      <div className="credential-label">Code</div>
                      <div className="credential-box">
                        {createdInstitution.code}
                      </div>
                    </div>
                    {createdInstitution.logoUrl && (
                      <div className="credential-row">
                        <div className="credential-label">Logo</div>
                        <div className="credential-box">
                          <img
                            src={buildInstitutionLogoUrl(createdInstitution.logoUrl)}
                            alt="Institution logo"
                            className="created-logo-preview"
                          />
                        </div>
                      </div>
                    )}
                    <div className="credential-row">
                      <div className="credential-label">Admin Username</div>
                      <div className="credential-box">
                        <span className="credential-value">
                          {createdInstitution.adminUsername}
                        </span>
                        <button
                          className="credential-copy-btn"
                          type="button"
                          title="Copy admin username"
                          aria-label="Copy admin username"
                          onClick={() =>
                            copyToClipboard(
                              "adminUsername",
                              createdInstitution.adminUsername,
                            )
                          }
                        >
                          <i className="fas fa-copy" aria-hidden="true" />
                          <span>
                            {copiedField === "adminUsername" ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="credential-row">
                      <div className="credential-label">Admin Password</div>
                      <div className="credential-box">
                        <span className="credential-value">
                          {createdInstitution.adminPassword}
                        </span>
                        <button
                          className="credential-copy-btn"
                          type="button"
                          title="Copy admin password"
                          aria-label="Copy admin password"
                          onClick={() =>
                            copyToClipboard(
                              "adminPassword",
                              createdInstitution.adminPassword,
                            )
                          }
                        >
                          <i className="fas fa-copy" aria-hidden="true" />
                          <span>
                            {copiedField === "adminPassword" ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-warning mt-3">
                    <i className="fas fa-exclamation-triangle me-2" />
                    <strong>Important:</strong> Please save these credentials
                    securely.
                  </div>

                  <div className="mt-3 text-end">
                    <button
                      className="btn btn-outline"
                      onClick={() => setCreatedInstitution(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label required">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={institutionData.name}
                    onChange={handleChange}
                    placeholder="e.g., Vidyalankar Polytechnic"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label required">
                    Institution Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="code"
                    value={institutionData.code}
                    onChange={handleChange}
                    placeholder="e.g., VP"
                    maxLength="10"
                    required
                  />
                  <div className="form-text">2-10 character unique code</div>
                </div>

                <div className="mb-3">
                  <PalettePicker value={palette} onChange={setPalette} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Institution Logo (PNG/JPEG)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoChange}
                  />
                  <div className="form-text">
                    Optional. If not uploaded, institution short code (example: VP) is used in header.
                  </div>
                  {logoFile && (
                    <div className="logo-file-name">Selected: {logoFile.name}</div>
                  )}
                </div>

                <div className="mb-3">
                  <button
                    type="button"
                    className={`toggle-adv ${advancedOptions ? "active" : ""}`}
                    onClick={() => setAdvancedOptions(!advancedOptions)}
                  >
                    <i
                      className={`fas ${
                        advancedOptions ? "fa-chevron-up" : "fa-chevron-down"
                      } me-2`}
                    />
                    {advancedOptions ? "Hide" : "Show"} Advanced Options
                  </button>
                </div>

                {advancedOptions && (
                  <div className="advanced-block">
                    <h6 className="mb-2">Admin Credentials (Optional)</h6>
                    <p className="text-muted small mb-3">
                      By default admin credentials will be auto-generated.
                    </p>

                    <div className="mb-3">
                      <label className="form-label">Admin Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="adminUsername"
                        value={institutionData.adminUsername}
                        onChange={handleChange}
                        placeholder="e.g., vp.admin"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Admin Password</label>
                      <input
                        type="text"
                        className="form-control"
                        name="adminPassword"
                        value={institutionData.adminPassword}
                        onChange={handleChange}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      "Creating..."
                    ) : (
                      <>
                        <i className="fas fa-plus-circle me-2" /> Create
                        Institution
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={resetForm}
                  >
                    <i className="fas fa-undo me-2" /> Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateInstitution;
