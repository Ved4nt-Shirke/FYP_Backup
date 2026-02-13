import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";

import "../components/EditCiann.css"; // using same CSS as Viewp

export default function BatchSelectionPage1() {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBatch) {
      alert("Please select a batch.");
      return;
    }

    // Navigate to practical attendance page with only batch info
    navigate("/practical-attendance", {
      state: {
        batch: selectedBatch,
      },
    });
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container my-4">
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Batch Selection
        </h3>
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
            Submit
          </button>
        </form>
      </div>

    </>
  );
}
