import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./AddPractical.css";

const AddPractical = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    division: "",
  });

  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDivisionsFromOfficePanel();
  }, []);

  const fetchDivisionsFromOfficePanel = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        setDivisions([]);
        return;
      }
      // Fetch all CIANNs to get divisions
      const response = await fetch(config.cianns, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch divisions: ${response.status}`);
      }

      const data = await response.json();
      const cianns = Array.isArray(data) ? data : data?.cianns;

      if (cianns && Array.isArray(cianns)) {
        if (cianns.length === 0) {
          setDivisions([]);
          setError("No CIANNs found. Please create CIANNs first.");
          return;
        }

        let divisionList = [];
        const primaryCiannId = cianns[0]?._id;

        if (primaryCiannId) {
          const divisionsResponse = await fetch(
            `${config.apiBaseUrl}/practical-exams/divisions?batchId=${primaryCiannId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (divisionsResponse.ok) {
            const divisionsData = await divisionsResponse.json();
            if (
              divisionsData?.success &&
              Array.isArray(divisionsData.divisions)
            ) {
              divisionList = divisionsData.divisions;
            }
          }
        }

        if (divisionList.length === 0) {
          divisionList = [
            ...new Set(cianns.map((ciann) => ciann.division).filter((d) => d)),
          ];
        }

        if (divisionList.length === 0) {
          setError("No divisions found for your CIANNs.");
        }

        setDivisions(divisionList.sort());
      } else {
        setError("Failed to load divisions from CIANNs");
      }
    } catch (err) {
      console.error("Error fetching divisions:", err);
      setError("Failed to load divisions from office panel");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.title.trim()) {
      setError("Practical Exam Title is required");
      return;
    }

    if (!formData.division.trim()) {
      setError("Please select a division");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        divisions: [formData.division], // Convert single division to array for backend
      };

      const response = await fetch(`${config.apiBaseUrl}/practical-exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const createdExamId = data?.practicalExam?._id;
        if (createdExamId) {
          navigate(`/faculty/practical-exams/questions/${createdExamId}`, {
            state: { openAddQuestion: true },
          });
          return;
        }

        setSuccess("Practical exam created successfully!");
        navigate("/faculty/practical-exams/manage");
      } else {
        setError(data.message || "Failed to create practical exam");
      }
    } catch (err) {
      console.error("Error creating practical exam:", err);
      setError("Failed to create practical exam. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-practical-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-practical-container">
      <div className="form-header">
        <h1 className="form-title">Add Practical Exam</h1>
        <p className="form-subtitle">
          Create a new practical exam and assign it to divisions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="practical-form">
        <div className="form-section">
          <h2 className="section-title">Basic Information</h2>

          {/* Division Selection Dropdown */}
          <div className="form-group">
            <label htmlFor="division" className="form-label">
              Select Division <span className="required">*</span>
            </label>
            <select
              id="division"
              name="division"
              value={formData.division}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="">-- Select Division --</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
            {divisions.length === 0 && !loading && (
              <small className="text-muted">
                No divisions found. Please ensure office staff has configured
                CIANNs.
              </small>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Practical Exam Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., Practical Exam - Semester 5"
              maxLength={100}
            />
            <small className="char-count">{formData.title.length}/100</small>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Add any additional details about the practical exam"
              rows="4"
              maxLength={500}
            ></textarea>
            <small className="char-count">
              {formData.description.length}/500
            </small>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/faculty/practical-exams")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              submitting || divisions.length === 0 || !formData.division
            }
          >
            {submitting ? "Creating..." : "Create Practical Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPractical;
