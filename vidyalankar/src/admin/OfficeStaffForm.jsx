import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./FacultyForm.css";

const OfficeStaffForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    status: "active",
  });

  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartments();

    if (id || location.state?.staff) {
      setIsEdit(true);
      if (location.state?.staff) {
        loadStaffData(location.state.staff);
      } else if (id) {
        fetchStaffData(id);
      }
    }
    // eslint-disable-next-line
  }, [id, location.state, navigate]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchStaffData = async (staffId) => {
    try {
      const response = await axios.get(config.admin.officeStaffById(staffId));
      if (response.data.success) {
        loadStaffData(response.data.officeStaff);
      }
    } catch (err) {
      console.error("Error fetching office staff:", err);
      showErrorAlert("Failed to load office staff data");
    }
  };

  const loadStaffData = (staff) => {
    setFormData({
      fullName: staff.fullName || "",
      email: staff.email || "",
      department: staff.department?._id || "",
      status: staff.status || "active",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case "fullName":
        if (!value.trim()) newErrors.fullName = "Full name is required";
        else if (value.trim().length < 2)
          newErrors.fullName = "Full name must be at least 2 characters";
        else delete newErrors.fullName;
        break;
      case "email":
        if (!value.trim()) newErrors.email = "Email is required";
        else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value))
          newErrors.email = "Invalid email address";
        else delete newErrors.email;
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    )
      newErrors.email = "Invalid email address";

    setErrors(newErrors);
    setTouched({ fullName: true, email: true });
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
      const currentYear = new Date().getFullYear();
      const instituteCode = adminInstitution;
      let employeeId;

      if (!isEdit) {
        try {
          const response = await axios.get(
            `${config.admin.officeStaff}?institution=${adminInstitution}`
          );
          const existingStaff = response.data.success
            ? response.data.officeStaff
            : [];
          const lastNumber =
            existingStaff.length > 0
              ? Math.max(
                  ...existingStaff.map((s) => {
                    const match = s.employeeId.match(
                      new RegExp(`${currentYear}${instituteCode}(\\d+)`)
                    );
                    return match ? parseInt(match[1]) : 0;
                  })
                )
              : 0;
          const nextNumber = (lastNumber + 1).toString().padStart(2, "0");
          employeeId = `${currentYear}${instituteCode}${nextNumber}`;
        } catch (err) {
          employeeId = `${currentYear}${instituteCode}01`;
        }
      }

      const submitData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        department: formData.department || null,
        institution: adminInstitution,
        status: formData.status,
        ...(isEdit ? {} : { employeeId }),
      };

      let response;
      if (isEdit) {
        response = await axios.put(config.admin.updateOfficeStaff(id), submitData);
      } else {
        response = await axios.post(config.admin.officeStaff, submitData);
      }

      if (response.data.success) {
        if (isEdit) {
          showSuccessAlert("Office staff profile updated successfully!");
        } else {
          const credentials = response.data.loginCredentials;
          showSuccessAlert(
            credentials
              ? `Office staff created! Username: ${credentials.username}, Password: ${credentials.password}`
              : "Office staff profile created successfully!"
          );
        }
        navigate("/admin-office-staff");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to save office staff profile";
      showErrorAlert(errorMessage);
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.field] = error.message;
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFieldValid = (field) => touched[field] && !errors[field];
  const isFieldInvalid = (field) => touched[field] && !!errors[field];

  return (
    <div className="admin-content">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <div className="form-icon">
              <i className="bi bi-person-badge"></i>
            </div>
            <div>
              <h3 className="form-title">
                {isEdit ? "Update Office Staff" : "New Office Staff Member"}
              </h3>
              <p className="form-description">
                {isEdit
                  ? "Update the details below."
                  : "Enter basic info. Credentials will be auto-generated."}
              </p>
            </div>
          </div>

          <div className="form-grid">
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("fullName")}
                  placeholder="e.g., John Smith"
                  className={isFieldInvalid("fullName") ? "invalid" : ""}
                  disabled={loading}
                />
                {isFieldValid("fullName") && (
                  <i className="bi bi-check-circle input-icon valid"></i>
                )}
                {isFieldInvalid("fullName") && (
                  <i className="bi bi-exclamation-circle input-icon invalid"></i>
                )}
              </div>
              {errors.fullName && (
                <div className="field-error">{errors.fullName}</div>
              )}
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="staff@university.edu"
                  className={isFieldInvalid("email") ? "invalid" : ""}
                  disabled={loading}
                />
                {isFieldValid("email") && (
                  <i className="bi bi-check-circle input-icon valid"></i>
                )}
                {isFieldInvalid("email") && (
                  <i className="bi bi-exclamation-circle input-icon invalid"></i>
                )}
              </div>
              {errors.email && (
                <div className="field-error">{errors.email}</div>
              )}
            </div>

            {/* Department */}
            <div className="form-field">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Department (Optional)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin-office-staff")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <i
                    className={`bi ${
                      isEdit ? "bi-check-lg" : "bi-person-plus"
                    }`}
                  ></i>
                  {isEdit ? "Update Office Staff" : "Create Office Staff"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfficeStaffForm;

