import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./FacultyForm.css";

const FacultyForm = () => {
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
    skills: [""],
    department: "",
    status: "active",
  });

  // Get admin's institution from localStorage
  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartments();

    if (id || location.state?.faculty) {
      setIsEdit(true);
      if (location.state?.faculty) {
        loadFacultyData(location.state.faculty);
      } else if (id) {
        fetchFacultyData(id);
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

  const fetchFacultyData = async (facultyId) => {
    try {
      const response = await axios.get(config.admin.facultyById(facultyId));
      if (response.data.success) {
        loadFacultyData(response.data.faculty);
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
      showErrorAlert("Failed to load faculty data");
    }
  };

  const loadFacultyData = (faculty) => {
    setFormData({
      fullName: faculty.fullName || "",
      email: faculty.email || "",
      skills: faculty.skills?.length > 0 ? faculty.skills : [""],
      department: faculty.department?._id || "",
      status: faculty.status || "active",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayChange = (arrayName, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const addArrayItem = (arrayName, defaultValue = "") => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultValue],
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
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
            `${config.admin.faculty}?institution=${adminInstitution}`
          );
          const existingFaculty = response.data.success
            ? response.data.faculty
            : [];
          const lastNumber =
            existingFaculty.length > 0
              ? Math.max(
                  ...existingFaculty.map((f) => {
                    const match = f.employeeId.match(
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
        skills: formData.skills.filter((s) => s.trim()),
        department: formData.department || null,
        institution: adminInstitution,
        status: formData.status,
        ...(isEdit ? {} : { employeeId }),
      };

      let response;
      if (isEdit) {
        response = await axios.put(config.admin.updateFaculty(id), submitData);
      } else {
        response = await axios.post(config.admin.faculty, submitData);
      }

      if (response.data.success) {
        if (isEdit) {
          showSuccessAlert("Faculty profile updated successfully!");
        } else {
          const credentials = response.data.loginCredentials;
          showSuccessAlert(
            credentials
              ? `Faculty created! Username: ${credentials.username}, Password: ${credentials.password}`
              : "Faculty profile created successfully!"
          );
        }
        navigate("/admin-faculty");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to save faculty profile";
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
              <i className="bi bi-person-plus"></i>
            </div>
            <div>
              <h3 className="form-title">
                {isEdit ? "Update Faculty" : "New Faculty Member"}
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
                  placeholder="faculty@university.edu"
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

          {/* Skills Section */}
          <div className="subsection">
            <h4>Skills & Expertise</h4>
            {formData.skills.map((skill, index) => (
              <div key={index} className="array-item">
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) =>
                      handleArrayChange("skills", index, e.target.value)
                    }
                    placeholder="e.g., Python, Java"
                    disabled={loading}
                  />
                </div>
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeArrayItem("skills", index)}
                    disabled={loading}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn-add-small"
              onClick={() => addArrayItem("skills")}
              disabled={loading}
            >
              <i className="bi bi-plus"></i> Add Skill
            </button>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin-faculty")}
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
                  {isEdit ? "Update Faculty" : "Create Faculty"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyForm;
