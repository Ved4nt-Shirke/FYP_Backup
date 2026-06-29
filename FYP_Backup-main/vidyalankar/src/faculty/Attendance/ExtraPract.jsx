import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { showErrorAlert } from "../../utils/alertUtils.jsx";
import Header from "../../basic/Header";
import "./ExtraPract.css";

const ExtraAttendanceForm = () => {
  const [experiments, setExperiments] = useState("");
  const [date, setDate] = useState("");
  const [batch, setBatch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const ciannData = location.state?.ciannData;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!experiments.trim() || !date || !batch) {
      showErrorAlert("Please fill in all fields.");
      return;
    }

    const payload = {
      experiments,
      actualDate: date,
      batch,
      ciannData,
    };

    localStorage.setItem("attendanceMeta", JSON.stringify(payload));
    navigate("/extrapattend");
  };

  if (!ciannData) {
    return (
      <div>
        <Header />
        <div className="attendance-main-content">
          <div className="theory-attendance-container">
            <h3>No CIAAN selected. Please select a CIAAN card first.</h3>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="attendance-main-content">
        <div className="theory-attendance-container">
          <div className="header-row">
            <h3>Extra Practical Attendance</h3>
          </div>

          {ciannData && (
            <div className="ciann-info">
              <strong>CIANN ID:</strong> {ciannData.ciannId} |{" "}
              <strong>Subject:</strong> {ciannData.subject?.name} (
              {ciannData.subject?.code}) | <strong>Division:</strong>{" "}
              {ciannData.division}
            </div>
          )}

          <div className="form-wrapper">
            <form onSubmit={handleSubmit}>
              <div className="form-box">
                <div className="label-bar">Experiments Covered</div>
                <div className="ea-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter experiments covered"
                    value={experiments}
                    onChange={(e) => setExperiments(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-box">
                <div className="label-bar">Actual Date</div>
                <div className="ea-input-wrapper">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-box">
                <div className="label-bar">Select Batch</div>
                <div className="ea-input-wrapper">
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                  >
                    <option value="">-- Select Batch --</option>
                    <option value="B1">Batch 1</option>
                    <option value="B2">Batch 2</option>
                    <option value="B3">Batch 3</option>
                  </select>
                </div>
              </div>

              <div className="ea-submit-wrapper">
                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExtraAttendanceForm;
