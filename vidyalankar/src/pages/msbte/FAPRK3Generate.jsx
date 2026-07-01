import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./K3Pages.css";

const FAPRK3Generate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData || null;

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [maxMarks, setMaxMarks] = useState("25");
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const response = await fetch(`${config.assessments}/batches`);
        if (response.ok) {
          const data = await response.json();
          const options = data?.success && Array.isArray(data?.batches)
            ? data.batches
            : [];

          if (options.length > 0) {
            setBatches(options);
            setSelectedBatch(options[0]);
          } else {
            const fallback = ["Batch 1", "Batch 2", "Batch 3", "Batch 4"];
            setBatches(fallback);
            setSelectedBatch("Batch 3");
          }
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
        const fallback = ["Batch 1", "Batch 2", "Batch 3", "Batch 4"];
        setBatches(fallback);
        setSelectedBatch("Batch 3");
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!CiaanData) {
      setError("Please select a Ciaan first.");
      return;
    }

    if (!selectedBatch) {
      setError("Please select a batch.");
      return;
    }

    navigate("/msbte/fa-pr-k3/print", {
      state: {
        CiaanData,
        batch: selectedBatch,
        maxMarks: Number(maxMarks),
      },
    });
  };

  return (
    <div className="k3-page">
      <div className="k3-form-card">
        <h3>Batch Selection For Generation Of K3</h3>

        {CiaanData && (
          <div className="k3-info">
            <div>
              <strong>Subject:</strong> {CiaanData.subject?.name || "-"} (
              {CiaanData.subject?.code || "-"})
            </div>
            <div>
              <strong>Division:</strong> {CiaanData.division || "-"}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="k3-label" htmlFor="k3-batch">
            Select Batch
          </label>
          <select
            id="k3-batch"
            className="form-select mb-3"
            value={selectedBatch}
            onChange={(event) => setSelectedBatch(event.target.value)}
            disabled={loadingBatches}
          >
            <option value="">-- Select Batch --</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>

          <label className="k3-label" htmlFor="k3-max-marks">
            Experiment Maximum Marks (out of Marks for single experiment)
          </label>
          <select
            id="k3-max-marks"
            className="form-select mb-3"
            value={maxMarks}
            onChange={(event) => setMaxMarks(event.target.value)}
          >
            <option value="20">20</option>
            <option value="25">25</option>
          </select>

          {error && <div className="k3-error mb-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-success k3-submit-btn"
            disabled={loadingBatches}
          >
            Submit
          </button>
        </form>

        {!CiaanData && (
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/msbte/fa-pr-k3/Ciaans")}
            >
              Select Ciaan First
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAPRK3Generate;
