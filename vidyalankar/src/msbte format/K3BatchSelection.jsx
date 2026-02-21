import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "./k3.css";

const K3BatchSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData || null;

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [maxMarks, setMaxMarks] = useState("25");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultBatches = useMemo(() => ["B1", "B2", "B3", "B4", "B5"], []);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.assessments}/batches`);
        if (response.data?.success && Array.isArray(response.data?.batches)) {
          setBatches(response.data.batches);
        } else {
          setBatches(defaultBatches);
        }
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatches(defaultBatches);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [defaultBatches]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!ciannData) {
      setError("CIANN information is missing. Please select a CIANN again.");
      return;
    }

    if (!selectedBatch) {
      setError("Please select a batch.");
      return;
    }

    navigate("/msbte/k3/print", {
      state: {
        ciannData,
        batch: selectedBatch,
        maxMarks: Number(maxMarks),
      },
    });
  };

  if (!ciannData) {
    return (
      <>
        <Header showSearch={false} />
        <div className="k3-page">
          <div className="k3-form-card">
            <h3>Batch Selection</h3>
            <p className="k3-error">
              CIANN information is missing. Please go back and select a CIANN.
            </p>
            <button
              className="btn btn-success"
              onClick={() => navigate("/msbte/k3")}
            >
              Back to CIANN list
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <div className="k3-page">
        <div className="k3-form-card">
          <h3>Batch Selection For Generation Of K3</h3>
          <div className="k3-info">
            <div>
              <strong>Subject:</strong> {ciannData.subject?.name} (
              {ciannData.subject?.code})
            </div>
            <div>
              <strong>Division:</strong> {ciannData.division}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="k3-label" htmlFor="k3-batch">
              Select Batch
            </label>
            <select
              id="k3-batch"
              className="form-control mb-3"
              value={selectedBatch}
              onChange={(event) => setSelectedBatch(event.target.value)}
            >
              <option value="">-- Select Batch --</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>

            <label className="k3-label" htmlFor="k3-max-marks">
              Experiment Maximum Marks (out of marks for single experiment)
            </label>
            <select
              id="k3-max-marks"
              className="form-control mb-3"
              value={maxMarks}
              onChange={(event) => setMaxMarks(event.target.value)}
            >
              <option value="20">20</option>
              <option value="25">25</option>
            </select>

            {error && <div className="k3-error mb-3">{error}</div>}

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default K3BatchSelection;
