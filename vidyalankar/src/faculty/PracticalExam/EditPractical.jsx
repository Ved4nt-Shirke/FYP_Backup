import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./EditPractical.css";

const EditPractical = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    divisions: [],
    batch: "",
    totalMarks: 100,
    duration: 120,
    isEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [batches, setBatches] = useState([]);
  const [ciannDivisions, setCiannDivisions] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchPracticalExam();
    fetchDivisions();
  }, [examId]);

  const fetchBatches = async () => {
    try {
      const response = await fetch(config.cianns);
      const data = await response.json();
      if (data.cianns) {
        const uniqueBatches = [...new Set(data.cianns.map((c) => c.batch))];
        setBatches(uniqueBatches);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  const fetchDivisions = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch all CIANNs to get divisions
      const response = await fetch(config.cianns, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      const cianns = Array.isArray(data) ? data : data?.cianns;

      if (cianns && Array.isArray(cianns)) {
        const divisionList = [
          ...new Set(cianns.map((ciann) => ciann.division).filter((d) => d)),
        ];
        setCiannDivisions(divisionList.sort());
      }
    } catch (err) {
      console.error("Error fetching divisions:", err);
    }
  };

  const fetchPracticalExam = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.practicalExam) {
        const exam = data.practicalExam;
        setFormData({
          title: exam.title || "",
          description: exam.description || "",
          divisions: exam.divisions || [],
          batch: exam.batch || "",
          totalMarks: exam.totalMarks || 100,
          duration: exam.duration || 120,
          isEnabled: exam.isEnabled !== false,
        });
      } else {
        setError("Failed to load practical exam");
      }
    } catch (err) {
      console.error("Error fetching practical exam:", err);
      setError("Failed to load practical exam");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDivisionChange = (division) => {
    setFormData({
      ...formData,
      divisions: formData.divisions.includes(division)
        ? formData.divisions.filter((d) => d !== division)
        : [...formData.divisions, division],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (formData.divisions.length === 0) {
      setError("At least one division must be selected");
      return;
    }

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Practical exam updated successfully!");
        setTimeout(() => {
          navigate("/faculty/practical-exams/manage");
        }, 2000);
      } else {
        setError(data.message || "Failed to update practical exam");
      }
    } catch (err) {
      console.error("Error updating practical exam:", err);
      setError("Failed to update practical exam");
    }
  };

  if (loading) {
    return <div className="pe-container"><p>Loading...</p></div>;
  }

  return (
    <div className="pe-container">
      <div className="pe-content">
        <h2>Edit Practical Exam</h2>

        {error && <div className="pe-error">{error}</div>}
        {success && <div className="pe-success">{success}</div>}

        <form onSubmit={handleSubmit} className="pe-form">
          <div className="pe-form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter exam title"
              required
            />
          </div>

          <div className="pe-form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter exam description"
              rows="4"
            />
          </div>

          <div className="pe-form-group">
            <label>Batch *</label>
            <select
              name="batch"
              value={formData.batch}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          <div className="pe-form-group">
            <label>Divisions *</label>
            <div className="pe-divisions">
              {ciannDivisions.length > 0 ? (
                ciannDivisions.map((division) => (
                  <label key={division} className="pe-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.divisions.includes(division)}
                      onChange={() => handleDivisionChange(division)}
                    />
                    {division}
                  </label>
                ))
              ) : (
                <p>No divisions available</p>
              )}
            </div>
          </div>

          <div className="pe-form-row">
            <div className="pe-form-group">
              <label>Total Marks</label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="pe-form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>

          <div className="pe-form-group">
            <label className="pe-checkbox">
              <input
                type="checkbox"
                name="isEnabled"
                checked={formData.isEnabled}
                onChange={handleInputChange}
              />
              Enable for students
            </label>
          </div>

          <div className="pe-form-actions">
            <button
              type="button"
              className="pe-btn pe-btn-secondary"
              onClick={() => navigate("/faculty/practical-exams/manage")}
            >
              Cancel
            </button>
            <button type="submit" className="pe-btn pe-btn-primary">
              Update Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPractical;
