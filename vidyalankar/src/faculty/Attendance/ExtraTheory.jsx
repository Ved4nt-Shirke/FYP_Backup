import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../basic/Header";
import "./ExtraTheory.css";

const ExtraAttendance = () => {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const CiaanData = location.state?.CiaanData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CiaanData) {
      alert("Ciaan data not found. Please go back and select a Ciaan.");
      return;
    }

    if (!topic.trim() || !date) {
      alert("Please fill in both topic and date.");
      return;
    }

    try {
      // Create the extra attendance record
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic.trim(),
            date,
            CiaanId: CiaanData.CiaanId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create attendance record");
      }

      const attendanceRecord = await response.json();

      // Navigate to student attendance marking with the record ID
      navigate(`/student-extra-attendance/${attendanceRecord._id}`);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      alert("Failed to create attendance record. Please try again.");
    }
  };

  if (!CiaanData) {
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
            <h3>Mark Extra Theory Attendance</h3>
          </div>

          {CiaanData && (
            <div className="Ciaan-info">
              <strong>Ciaan ID:</strong> {CiaanData.CiaanId} |{" "}
              <strong>Subject:</strong> {CiaanData.subject?.name} (
              {CiaanData.subject?.code}) | <strong>Division:</strong>{" "}
              {CiaanData.division}
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

export default ExtraAttendance;
