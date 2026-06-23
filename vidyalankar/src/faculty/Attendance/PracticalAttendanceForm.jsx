import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PracticalAttendanceForm.css";

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
  ciannData,
  onClose,
  onSubmitSuccess,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    actualDate: getTodayDateString(),
    remark: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/lab-planning/${ciannId}/${weekNo}/${batch}/${exptNo}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorRes = await response.json();
        throw new Error(errorRes.message || "Update failed");
      }

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

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="practical-modal-overlay">
      <form className="practical-modal" onSubmit={handleSubmit}>
        <header>
          <h2>Practical Attendance</h2>
          <p>Confirm completion before marking attendance.</p>
        </header>

        <div className="practical-modal-grid">
          <div>
            <span>Experiment</span>
            <strong>
              Exp {exptNo}: {exptName}
            </strong>
          </div>
          <div>
            <span>Week</span>
            <strong>{weekNo}</strong>
          </div>
          <div>
            <span>Batch</span>
            <strong>{batch}</strong>
          </div>
          <div>
            <span>Planned Date</span>
            <strong>{plannedDate}</strong>
          </div>
        </div>

        <div className="practical-modal-field">
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

        <div className="practical-modal-field">
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

        {error && <div className="practical-modal-error">{error}</div>}

        <div className="practical-modal-actions">
          <button type="button" onClick={onClose} className="ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Proceed"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalAttendanceForm;
