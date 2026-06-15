import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const ExpertLectureK9 = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/msbte/expert-lecture/k9");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch K9 records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expert lecture record?")) {
      return;
    }

    try {
      const res = await axios.delete(`/msbte/expert-lecture/k9/${id}`);
      if (res.data?.success) {
        alert("Record deleted successfully.");
        fetchRecords();
      } else {
        alert(res.data?.message || "Failed to delete record.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record.");
    }
  };

  return (
    <div
      className="main-content"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
              MSBTE CIAAN-2023
            </p>
            <h2 style={{ margin: "4px 0 0", fontWeight: 700, color: "#0f172a" }}>
              Expert Lecture (K9)
            </h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/msbte/expert-lecture/k9/edit")}
            style={{
              background: "#4f46e5",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
            }}
          >
            <i className="bi bi-plus-lg"></i> Create New K9 Report
          </button>
        </div>

        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        >
          <h5 style={{ fontWeight: 600, color: "#4f46e5", marginBottom: "20px" }}>
            Saved K9 Formats
          </h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading reports...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-bar-graph" style={{ fontSize: "2.5rem", opacity: 0.5 }}></i>
              <p className="mt-3">No saved expert lecture reports found.</p>
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => navigate("/msbte/expert-lecture/k9/edit")}
              >
                Create your first report
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-bordered table-hover align-middle mb-0"
                style={{ width: "100%", background: "#ffffff", color: "#334155", border: "1px solid #e2e8f0" }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "12%" }}>Academic Year</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "20%" }}>Programme</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "15%" }}>Division / Class</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap", width: "10%" }}>Entries</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", width: "18%" }}>Last Updated</th>
                    <th style={{ color: "#0f172a", border: "1px solid #e2e8f0", padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap", width: "250px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap" }}>{rec.academicYear}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px" }}>{rec.programme}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap" }}>{rec.division}</td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", textAlign: "center", fontWeight: "600" }}>
                        {Array.isArray(rec.entries) ? rec.entries.length : 0}
                      </td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "14px 16px", whiteSpace: "nowrap", color: "#64748b" }}>
                        {new Date(rec.updatedAt).toLocaleDateString()} {new Date(rec.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ border: "1px solid #e2e8f0", padding: "8px 16px", textAlign: "center" }}>
                        <div className="d-flex justify-content-center align-items-center gap-2" style={{ flexWrap: "nowrap" }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => navigate(`/msbte/expert-lecture/k9/generate?id=${rec._id}`)}
                            style={{ background: "#0ea5e9", color: "#fff", padding: "6px 12px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <i className="bi bi-eye"></i> Preview
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => navigate(`/msbte/expert-lecture/k9/edit?id=${rec._id}`)}
                            style={{ background: "#f59e0b", color: "#fff", padding: "6px 12px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(rec._id)}
                            style={{ background: "#ef4444", color: "#fff", padding: "6px 12px", borderRadius: "6px", border: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertLectureK9;
