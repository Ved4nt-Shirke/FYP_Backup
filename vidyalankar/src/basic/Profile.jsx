import React, { useState, useEffect } from "react";
import { config } from "../config/api";
import { buildInstitutionLogoUrl } from "../utils/institutionBranding";
import "./Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "danger", text: "Session token not found. Please login again." });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success && data.profile) {
        setProfile(data.profile);
        setEmailInput(data.profile.email || "");
        setPhoneInput(data.profile.whatsappPhone || "");
      } else {
        setMessage({ type: "danger", text: data.msg || "Failed to load profile details" });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({ type: "danger", text: "Could not connect to the server." });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage({
        type: "danger",
        text: "Only PNG, JPEG/JPG, and WEBP profile photos are allowed.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "danger",
        text: "Profile photo size must be under 2MB.",
      });
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!password) {
      setMessage({ type: "danger", text: "Please enter your password to confirm edits." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      formData.append("email", emailInput.trim());
      formData.append("whatsappPhone", phoneInput.trim());
      formData.append("password", password);
      if (selectedPhoto) {
        formData.append("profilePhoto", selectedPhoto);
      }

      const response = await fetch(`${config.apiBaseUrl}/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Failed to update profile details");
      }

      if (data.success && data.profile) {
        setProfile(data.profile);
        setEmailInput(data.profile.email || "");
        setPhoneInput(data.profile.whatsappPhone || "");
        setSelectedPhoto(null);
        setPhotoPreview("");
        setPassword("");
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Emit profile update event to trigger reload in header
        window.dispatchEvent(new Event("profile:updated"));
      }
    } catch (err) {
      setMessage({ type: "danger", text: err.message || "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-page-header">
        <h1>Faculty Profile</h1>
        <p>View your professional credentials and update your contact information.</p>
      </div>

      {message.text && (
        <div className={`profile-alert-box alert-${message.type}`}>
          <i className={message.type === "success" ? "bi bi-check-circle-fill" : "bi bi-exclamation-triangle-fill"}></i>
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-grid">
        {/* Photo Card */}
        <div className="profile-card photo-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="avatar-image" />
              ) : profile && profile.profilePhoto ? (
                <img src={buildInstitutionLogoUrl(profile.profilePhoto)} alt="Avatar" className="avatar-image" />
              ) : (
                <span className="avatar-fallback">👤</span>
              )}
              <label htmlFor="photo-file" className="avatar-overlay">
                <i className="bi bi-camera-fill"></i>
                <span>Change Photo</span>
              </label>
            </div>
            <input
              type="file"
              id="photo-file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            <h3>{profile ? profile.fullName : "Faculty Member"}</h3>
            <p className="status-badge active">{profile ? profile.status.toUpperCase() : "ACTIVE"}</p>
            <div className="photo-instructions">
              Supports PNG, JPG, or WEBP. Max size 2MB.
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="profile-card details-card">
          <h2>Update Credentials</h2>
          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-grid">
              <div className="form-group read-only">
                <label>Employee ID</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock-fill lock-icon"></i>
                  <input type="text" value={profile ? profile.employeeId : ""} disabled />
                </div>
              </div>

              <div className="form-group read-only">
                <label>Department</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock-fill lock-icon"></i>
                  <input type="text" value={profile && profile.department ? profile.department.name : "N/A"} disabled />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>WhatsApp Phone</label>
                <div className="input-wrapper">
                  <i className="bi bi-whatsapp"></i>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 919876543210"
                  />
                </div>
              </div>

              <div className="form-group password-verification-field">
                <label className="required-label">Verify Current Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-shield-lock-fill"></i>
                  <input
                    type="password"
                    placeholder="Enter password to authorize profile changes"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <small className="verification-text">
                  You must confirm your current account password to submit any modifications.
                </small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-save"></i>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
