import React from "react";
import "./StudentComponents.css";

const MockTestExamResult = () => {
  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Mock Test - Exam Result</h1>
        <p>This section will contain mock test results.</p>
      </div>
      <div className="content-placeholder">
        <i className="bi bi-bar-chart"></i>
        <p>Mock test exam results will be displayed here</p>
      </div>
    </div>
  );
};

export default MockTestExamResult;