import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "./k4.css";

const K4BatchSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useParams();
  const ciannData = location.state?.ciannData || null;

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultBatches = useMemo(() => ["B1", "B2", "B3", "B4", "B5"], []);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        if (mode === "edit" || mode === "print") {
          const response = await axios.get(`${config.msbte}/sa-pr-k4/batches`, {
            params: { ciannId: ciannData?.ciannId },
          });
          if (response.data?.success) {
            setBatches(response.data.batches || []);
            return;
          }
        }

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
  }, [ciannData?.ciannId, defaultBatches, mode]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!ciannData) {
      setError("CIANN information is missing. Please select again.");
      return;
    }

    if (!selectedBatch) {
      setError("Please select a batch.");
      return;
    }

    if (mode === "print") {
      navigate(`/msbte/k4/${mode}/view`, {
        state: { ciannData, batch: selectedBatch },
      });
      return;
    }

    navigate(`/msbte/k4/${mode}/form`, {
      state: { ciannData, batch: selectedBatch },
    });
  };

  if (!ciannData) {
    return (
      <>
        <Header showSearch={false} />
        <div className="k4-page">
          <div className="k4-form-card">
            <h3>Batch Selection</h3>
            <p className="k4-error">
              CIANN information is missing. Please go back and select a CIANN.
            </p>
            <button
              className="btn btn-success"
              onClick={() => navigate(`/msbte/k4/${mode}`)}
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
      <div className="k4-page">
        <div className="k4-form-card">
          <h3>Batch Selection For SA-PR K4</h3>
          <div className="k4-info">
            <div>
              <strong>Subject:</strong> {ciannData.subject?.name} (
              {ciannData.subject?.code})
            </div>
            <div>
              <strong>Division:</strong> {ciannData.division}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="k4-label" htmlFor="k4-batch">
              Select Batch
            </label>
            <select
              id="k4-batch"
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

            {(mode === "edit" || mode === "print") && batches.length === 0 && (
              <div className="k4-error mb-3">
                No saved batches found for this CIANN.
              </div>
            )}

            {error && <div className="k4-error mb-3">{error}</div>}

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

export default K4BatchSelection;
