import { useState, useRef, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function PastResult() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [showResultForm, setShowResultForm] = useState(false);
  const resultInputsRef = useRef([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve CIANN Data
      const stored = sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData");
      if (!stored) {
        setError("No active CIANN session found.");
        return;
      }

      const ciannData = JSON.parse(stored);
      if (!ciannData || !ciannData.ciannId) {
        setError("Invalid CIANN session details.");
        return;
      }
      setCiannId(ciannData.ciannId);

      const res = await axios.get(config.ciannSubjectDetails.get(ciannData.ciannId));
      if (res.data.success && res.data.details?.pastResults) {
        const pr = res.data.details.pastResults;
        const loadedResults = {
          faculty: Array.isArray(pr.faculty) ? pr.faculty : ["", "", "", ""],
          subjectPass: Array.isArray(pr.subjectPass) ? pr.subjectPass : ["", "", "", ""],
          subjectTopper: Array.isArray(pr.subjectTopper) ? pr.subjectTopper : ["", "", "", ""],
          overallPass: Array.isArray(pr.overallPass) ? pr.overallPass : ["", "", "", ""]
        };
        setResults(loadedResults);
      }
    } catch (err) {
      console.error("Failed to load past results details:", err);
      setError(err.response?.data?.error || "Failed to load past results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResultForm && resultInputsRef.current.length > 0 && results) {
      // Pre-fill inputs with existing values on modal open
      const flatValues = [
        ...results.faculty,
        ...results.subjectPass,
        ...results.subjectTopper,
        ...results.overallPass
      ];
      flatValues.forEach((val, idx) => {
        if (resultInputsRef.current[idx]) {
          resultInputsRef.current[idx].value = val;
        }
      });
      resultInputsRef.current[0]?.focus();
    }
  }, [showResultForm, results]);

  const handleSubmit = async () => {
    const inputValues = resultInputsRef.current.map(input => input?.value || "");

    if (inputValues.length < 16) {
      setError("Please fill in or initialize all fields before submitting.");
      return;
    }

    const nextResults = {
      faculty: inputValues.slice(0, 4),
      subjectPass: inputValues.slice(4, 8),
      subjectTopper: inputValues.slice(8, 12),
      overallPass: inputValues.slice(12, 16),
    };

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        pastResults: nextResults
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setResults(nextResults);
        setShowResultForm(false);
      }
    } catch (err) {
      console.error("Failed to save past results:", err);
      setError(err.response?.data?.error || "Failed to save past results.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .past-result-container {
          padding: 30px;
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
          box-sizing: border-box;
          color: #333;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .title {
          margin: 0;
          font-weight: 700;
          font-size: 2rem;
          color: var(--primary-color, #28a745);
        }

        .button {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          padding: 12px 24px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover {
          background-color: var(--primary-accent-dark, #43A047);
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        .button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          table-layout: auto;
        }
        th, td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
          font-size: 14px;
        }
        th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }
        tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        tbody tr:hover {
          background-color: #f5f5f5;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        .modal-box {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 750px;
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff;
          color: #333;
          padding: 15px 25px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        .modal-header button {
          background: none;
          border: none;
          color: #999;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover {
          color: #dc3545;
          transform: rotate(90deg);
        }
        .modal-body {
          padding: 25px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .resultForm .cyRow {
          display: grid;
          grid-template-columns: minmax(150px, 1.5fr) repeat(4, minmax(80px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
          align-items: start;
          padding: 5px 0;
        }

        .leftLabel {
          font-weight: 600;
          font-size: 14px;
          text-align: left;
          color: #444;
          align-self: stretch;
          display: flex;
          align-items: center;
          word-break: break-word;
        }

        .shortInput {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .shortInput:focus {
          outline: none;
          border-color: var(--primary-color, #81c784);
          box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        .inputGroup {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          text-align: center;
          align-self: stretch;
        }

        .inputGroup label {
          font-size: 12px;
          margin-bottom: 4px;
          color: #666;
          font-weight: 500;
          width: 100%;
          text-align: center;
        }

        .btnGroup {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
          margin-top: 25px;
        }

        .btn-save {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-save:hover {
          background-color: var(--primary-accent-dark, #43A047);
        }
        .btn-cancel {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cancel:hover {
          background-color: #bb2d3b;
        }

        @media (max-width: 768px) {
          .past-result-container {
            padding: 15px;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
          }
          .title {
            font-size: 1.7rem;
          }
          .button {
            width: 100%;
            text-align: center;
          }
          .modal-box {
            width: 95%;
          }
          .modal-body {
            padding: 20px;
          }
          .resultForm .cyRow {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .leftLabel {
            text-align: center;
          }
          .btnGroup {
            flex-direction: column;
            gap: 10px;
          }
          .btn-save, .btn-cancel {
            width: 100%;
          }
        }
      `}</style>

      <div className="past-result-container">
        <div className="header-row">
          <h2 className="title">3.8 Past Result - End Semester Examination (MSBTE)</h2>
          <button
            className="button"
            disabled={loading}
            onClick={() => {
              if (!results) {
                setResults({
                  faculty: ["", "", "", ""],
                  subjectPass: ["", "", "", ""],
                  subjectTopper: ["", "", "", ""],
                  overallPass: ["", "", "", ""]
                });
              }
              setShowResultForm(true);
            }}
          >
            {results ? "Edit Past Results" : "Add Past Results"}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading past results...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Category</th>
                  <th>CY-3</th>
                  <th>CY-2</th>
                  <th>CY-1</th>
                  <th>CY (Target)</th>
                </tr>
              </thead>
              <tbody>
                {results ? (
                  <>
                    <tr>
                      <td style={{ textAlign: "left", fontWeight: "600" }}>Name of Faculty</td>
                      {results.faculty.map((val, i) => (
                        <td key={i}>{val || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left", fontWeight: "600" }}>Subject Passing %</td>
                      {results.subjectPass.map((val, i) => (
                        <td key={i}>{val || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left", fontWeight: "600" }}>Subject Topper</td>
                      {results.subjectTopper.map((val, i) => (
                        <td key={i}>{val || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: "left", fontWeight: "600" }}>Overall Passing %</td>
                      {results.overallPass.map((val, i) => (
                        <td key={i}>{val || "-"}</td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: '20px' }}>
                      No Data Entered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showResultForm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <span>Add Past Result - End Semester Examination (MSBTE)</span>
                <button onClick={() => setShowResultForm(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="resultForm">
                  <div className="cyRow">
                    <div className="leftLabel">Name of Faculty</div>
                    {["CY-3", "CY-2", "CY-1", "CY (Target)"].map((label, idx) => (
                      <div className="inputGroup" key={idx}>
                        <label>{label}</label>
                        <input
                          className="shortInput"
                          type="text"
                          ref={(el) => (resultInputsRef.current[idx] = el)}
                        />
                      </div>
                    ))}
                  </div>

                  {["Subject Passing Percentage", "Subject Topper", "Overall Passing Percentage"].map((rowLabel, rowIdx) => (
                    <div className="cyRow" key={rowIdx}>
                      <div className="leftLabel">{rowLabel}</div>
                      {[0, 1, 2, 3].map((colIdx) => {
                        const inputIndex = 4 + rowIdx * 4 + colIdx;
                        return (
                          <input
                            key={colIdx}
                            className="shortInput"
                            type="text"
                            ref={(el) => (resultInputsRef.current[inputIndex] = el)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="btnGroup">
                  <button className="btn-cancel" onClick={() => setShowResultForm(false)} disabled={saving}>Cancel</button>
                  <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
