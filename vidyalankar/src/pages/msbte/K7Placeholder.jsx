import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./MSBTEPages.css";

const K7Placeholder = () => {
  const { partName } = useParams();
  const navigate = useNavigate();

  return (
    <div
      className="main-content"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "30px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
        <button
          className="btn btn-secondary mb-4"
          onClick={() => navigate(-1)}
          style={{
            background: "#64748b",
            border: "1px solid #475569",
            color: "#fff",
          }}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          }}
        >
          <div
            style={{
              background: "#eff6ff",
              color: "#3b82f6",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "2rem",
            }}
          >
            <i className="bi bi-info-circle-fill"></i>
          </div>

          <p
            style={{
              margin: 0,
              color: "#3b82f6",
              fontSize: "0.9rem",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            MSBTE K7 Format
          </p>
          <h2
            style={{
              margin: "8px 0 16px",
              fontWeight: 800,
              color: "#0f172a",
              fontSize: "1.8rem",
            }}
          >
            {partName || "Placeholder Page"}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: "1.6",
              fontSize: "1rem",
              marginBottom: "32px",
            }}
          >
            This part of the K7 format is currently not active in the system. As per the requirements,
            only <strong>Part B: "Analysis of Term End Examination Result"</strong> is fully supported
            and dynamically generated from the database.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/msbte/k7/cianns")}
            style={{
              background: "#4f46e5",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(79 70 229 / 0.2)",
            }}
          >
            Go to Part B (Result Analysis)
          </button>
        </div>
      </div>
    </div>
  );
};

export default K7Placeholder;
