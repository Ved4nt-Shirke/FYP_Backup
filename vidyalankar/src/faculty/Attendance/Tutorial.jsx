import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../basic/Header";
import "./Tutorial.css";

const TutorialAttendance = () => {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const ciannData = location.state?.ciannData;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ciannData) {
      alert("No CIANN data found. Please select a CIANN first.");
      return;
    }

    if (!topic.trim() || !date) {
      alert("Please fill in both topic and date.");
      return;
    }

    localStorage.setItem("topic", topic);
    localStorage.setItem("date", date);
    localStorage.setItem("ciannData", JSON.stringify(ciannData));
    navigate("/student-attendance");
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
            <h3>Mark Tutorial Attendance</h3>
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
                <div className="label-bar">Topics Covered</div>
                <div className="ea-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter topics covered"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
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

export default TutorialAttendance;
