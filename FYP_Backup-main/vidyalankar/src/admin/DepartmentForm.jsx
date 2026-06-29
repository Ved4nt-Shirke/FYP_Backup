import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils";
import { config } from "../config/api";
import "./DepartmentForm.css";

const DepartmentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [departmentId, setDepartmentId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get admin's institution from localStorage
  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    // Check if this is an edit operation
    if (location.state?.department && location.state?.isEdit) {
      setIsEdit(true);
      setDepartmentId(location.state.department._id);
      setFormData({
        name: location.state.department.name || "",
        code: location.state.department.code || "",
      });
    }
  }, [location.state, navigate]);

  // whether there are any non-empty error messages
  const hasErrors = Object.values(errors).some(
    (v) => !!v && String(v).trim().length > 0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name": {
        const v = (value || "").trim();
        if (!v) {
          newErrors.name = "Department name is required";
        } else if (v.length < 3) {
          newErrors.name = "Department name must be at least 3 characters";
        } else if (v.length > 100) {
          newErrors.name = "Department name must be less than 100 characters";
        } else {
          delete newErrors.name;
        }
        break;
      }

      case "code": {
        const v = (value || "").trim().toUpperCase();
        if (!v) {
          newErrors.code = "Department code is required";
        } else if (!/^[A-Z]{1,5}$/.test(v)) {
          newErrors.code = "Code must be 1-5 uppercase letters only";
        } else {
          delete newErrors.code;
        }
        break;
      }

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    const nameTrim = (formData.name || "").trim();
    if (!nameTrim) {
      newErrors.name = "Department name is required";
    } else if (nameTrim.length < 3) {
      newErrors.name = "Department name must be at least 3 characters";
    } else if (nameTrim.length > 100) {
      newErrors.name = "Department name must be less than 100 characters";
    }

    // Code validation
    const codeTrim = (formData.code || "").trim().toUpperCase();
    if (!codeTrim) {
      newErrors.code = "Department code is required";
    } else if (!/^[A-Z]{1,5}$/.test(codeTrim)) {
      newErrors.code = "Code must be 1-5 uppercase letters only";
    }

    setErrors(newErrors);
    setTouched({ name: true, code: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        institution: adminInstitution,
      };

      let response;
      if (isEdit) {
        response = await axios.put(
          config.admin.updateDepartment(departmentId),
          submitData
        );
      } else {
        response = await axios.post(config.admin.departments, submitData);
      }

      if (response?.data?.success) {
        showSuccessAlert(
          isEdit
            ? "Department updated successfully!"
            : "Department created successfully!"
        );
        navigate("/admin-departments");
      } else {
        showErrorAlert(
          response?.data?.message || "Unexpected response from server"
        );
      }
    } catch (err) {
      console.error("Error saving department:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to save department";
      showErrorAlert(errorMessage);

      const serverErrs = err.response?.data?.errors;
      if (serverErrs) {
        const serverErrors = {};
        if (Array.isArray(serverErrs)) {
          serverErrs.forEach((error) => {
            if (error.field)
              serverErrors[error.field] = error.message || "Invalid value";
          });
        } else if (typeof serverErrs === "object") {
          Object.keys(serverErrs).forEach((k) => {
            const val = serverErrs[k];
            serverErrors[k] =
              typeof val === "string"
                ? val
                : val?.message || JSON.stringify(val);
          });
        }
        setErrors((prev) => ({ ...prev, ...serverErrors }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin-departments");
  };

  const getFieldError = (field) => {
    return touched[field] && errors[field] ? errors[field] : "";
  };

  const isFieldValid = (field) => {
    return touched[field] && !errors[field];
  };

  const isFieldInvalid = (field) => {
    return touched[field] && !!errors[field];
  };

  return (
    <div className="admin-content">
      <div className="form-card">
        <div className="form-progress">
          <div className="progress-step active">
            <div className="step-number">1</div>
            <div className="step-label">Department Details</div>
          </div>
          <div className="progress-line" />
          <div className="progress-step">
            <div className="step-number">2</div>
            <div className="step-label">Review & Save</div>
          </div>
        </div>

        {/* Form Body */}
        <div className="form-header">
          <div className="form-icon">
            <i className="bi bi-building" />
          </div>
          <div>
            <h3 className="form-title">
              {isEdit ? "Update Department" : "New Department"}
            </h3>
            <p className="form-description">
              {isEdit
                ? "Modify the department details below"
                : "Enter the basic information for the new department"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="department-form" noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">
                Department Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g., Computer Engineering"
                  className={`${isFieldValid("name") ? "valid" : ""} ${
                    isFieldInvalid("name") ? "invalid" : ""
                  }`}
                  required
                  disabled={loading}
                />
                {isFieldValid("name") && (
                  <div className="input-icon valid">
                    <i className="bi bi-check-circle" />
                  </div>
                )}
                {isFieldInvalid("name") && (
                  <div className="input-icon invalid">
                    <i className="bi bi-exclamation-circle" />
                  </div>
                )}
              </div>
              {getFieldError("name") && (
                <div className="field-error">
                  <i className="bi bi-exclamation-triangle" />
                  {errors.name}
                </div>
              )}
              <div className="field-hint">
                Full name of the department (3-100 characters)
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="code">
                Department Code <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    handleChange({
                      target: { name: "code", value: upperValue },
                    });
                  }}
                  onBlur={() => handleBlur("code")}
                  placeholder="e.g., CO"
                  className={`${isFieldValid("code") ? "valid" : ""} ${
                    isFieldInvalid("code") ? "invalid" : ""
                  }`}
                  maxLength="5"
                  required
                  disabled={loading}
                />
                {isFieldValid("code") && (
                  <div className="input-icon valid">
                    <i className="bi bi-check-circle" />
                  </div>
                )}
                {isFieldInvalid("code") && (
                  <div className="input-icon invalid">
                    <i className="bi bi-exclamation-circle" />
                  </div>
                )}
              </div>
              {getFieldError("code") && (
                <div className="field-error">
                  <i className="bi bi-exclamation-triangle" />
                  {errors.code}
                </div>
              )}
              <div className="field-hint">
                Unique code (1-5 uppercase letters)
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(formData.name || formData.code) && (
            <div className="form-preview">
              <h4>Live Preview</h4>
              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-icon">
                    <i className="bi bi-building" />
                  </div>
                  <div>
                    <div className="preview-name">
                      {formData.name || "Department Name"}
                    </div>
                    <div className="preview-code">
                      {formData.code || "CODE"}
                    </div>
                  </div>
                </div>
                <div className="preview-meta">
                  <span>Institution: {adminInstitution}</span>
                  <span>Status: Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || hasErrors}
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <i
                    className={`bi ${isEdit ? "bi-check-lg" : "bi-plus-lg"}`}
                  />
                  {isEdit ? "Update Department" : "Create Department"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
