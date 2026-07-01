// src/Assessment/ViewAssessmentBatchSelect.jsx

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "../assessBatchselect.css";

export default function ViewAssessmentBatchSelect() {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData;
  const [selectedBatch, setSelectedBatch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBatch) {
      alert("Please select a batch.");
      return;
    }

    // Store selected batch & CiaanData for the view page to use
    sessionStorage.setItem("viewPA_batch", selectedBatch);
    sessionStorage.setItem("viewPA_CiaanData", JSON.stringify(CiaanData));

    // Dynamically navigate based on batch with state data
    navigate(`/view-pa/${selectedBatch.toLowerCase()}`, {
      state: {
        batch: selectedBatch,
        CiaanData: CiaanData
      }
    });
  };

  return (
    <>
      <Header showSearch={false} />
      <div
        className="container-fluid assess-batch-select-page"
        style={{ padding: '15px', maxWidth: 'none' }}
      >
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Batch Selection (View Mode)
        </h3>

        {CiaanData && (
          <div className="alert alert-info">
            <strong>Selected CIAAN ID:</strong> {CiaanData.CiaanId}
            <br />
            <strong>Subject:</strong> {CiaanData.subject?.name} ({CiaanData.subject?.code})
            <br />
            <strong>Division:</strong> {CiaanData.division}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <select
            className="form-control mb-3"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Select Batch --</option>
            <option value="B1">Batch 1</option>
            <option value="B2">Batch 2</option>
            <option value="B3">Batch 3</option>
          </select>

          <button type="submit" className="btn btn-success w-100">
            View Assessment
          </button>
        </form>
      </div>

    </>
  );
}
