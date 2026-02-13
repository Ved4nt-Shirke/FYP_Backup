// Attendance/PracticalAttendanceForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PracticalAttendanceForm.css";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const todayWithOffset = new Date(today.getTime() - offset * 60000);
  return todayWithOffset.toISOString().split("T")[0];
};

const PracticalAttendanceForm = ({
  ciannId,
  weekNo,
  batch,
  exptNo,
  exptName,
  plannedDate,
  onClose,
  ciannData, // Optional, pass if needed for nav
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    actualDate: getTodayDateString(),
    remark: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle change for form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit the form - update actual date and remark in the lab plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.actualDate) {
      setError("Please select the actual date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/lab-planning/${ciannId}/${weekNo}/${batch}/${exptNo}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorRes = await response.json();
        throw new Error(errorRes.message || "Update failed");
      }

      // On success, navigate to the final attendance page with all necessary data
      navigate("/PracticalFinalAtt", {
        state: {
          ciannId,
          weekNo,
          batch,
          exptNo,
          exptName,
          actualDate: formData.actualDate,
          remark: formData.remark,
          ciannData,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="p">Practical Attendance</div>
        <div className="form-field">
          <strong>Experiment:</strong> <span>{exptName} (Exp. No: {exptNo})</span>
        </div>
        <div className="form-field">
          <strong>Planned Date:</strong> <span>{plannedDate}</span>
        </div>
        <div className="form-field">
          <label htmlFor="actualDate">Actual Date of Completion</label>
          <input
            type="date"
            id="actualDate"
            name="actualDate"
            value={formData.actualDate}
            onChange={handleChange}
            max={getTodayDateString()}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="remark">Remark</label>
          <input
            type="text"
            id="remark"
            name="remark"
            value={formData.remark}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
        {error && <div style={{ color: "red", marginTop: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="button1" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="button1" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalAttendanceForm;
