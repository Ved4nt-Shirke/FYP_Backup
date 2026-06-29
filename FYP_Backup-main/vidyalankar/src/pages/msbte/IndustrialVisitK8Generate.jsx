import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const IndustrialVisitK8Generate = () => {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const fetchRecord = async () => {
      setLoading(true);
      try {
        const url = id ? `/msbte/industrial-visit/k8?id=${encodeURIComponent(id)}` : "/msbte/industrial-visit/k8";
        const res = await axios.get(url);
        if (res.data?.success) setRecord(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, []);

  if (loading) {
    return (
      <div className="main-content" style={{ background: "#f8fafc", color: "#0f172a", minHeight: "100vh", padding: "40px" }}>
        <h3>Loading Format Preview...</h3>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="main-content" style={{ background: "#f8fafc", color: "#0f172a", minHeight: "100vh", padding: "40px" }}>
        <h3>No data to generate. Please save an entry first.</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/msbte/industrial-visit/k8/edit")}>
          Go to Create
        </button>
      </div>
    );
  }

  // Padding entries up to 10 rows
  const originalEntries = Array.isArray(record.entries) ? record.entries : [];
  const displayEntries = [...originalEntries];
  const minRows = 10;
  if (displayEntries.length < minRows) {
    const padCount = minRows - displayEntries.length;
    for (let i = 0; i < padCount; i++) {
      displayEntries.push({
        srNo: originalEntries.length + i + 1,
        dateOfVisit: "",
        yearSemester: "",
        industryName: "",
        coordinatorName: "",
        beneficiaries: "",
        relevanceToCourse: "",
        mappingWithPO: "",
        isBlank: true,
      });
    }
  }

  return (
    <div
      className="main-content animate-fade-in"
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#1e293b",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Controls Toolbar */}
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/msbte/industrial-visit/k8/edit?id=${record._id}`)}
            style={{ background: "#64748b", border: "1px solid #475569", color: "#fff" }}
          >
            <i className="bi bi-pencil"></i> Edit Details
          </button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/msbte/industrial-visit/k8")}
              style={{ background: "#475569", border: "none" }}
            >
              Dashboard
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/msbte/industrial-visit/k8/print?id=${record._id}`)}
              style={{ background: "#4f46e5", border: "none" }}
            >
              <i className="bi bi-printer"></i> Open printable view
            </button>
          </div>
        </div>

        {/* Clean, document-style container replicating A4 layout */}
        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "40px 30px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)",
            fontFamily: "'Times New Roman', Times, serif",
            color: "#000000",
          }}
        >
          {/* Top small headers */}
          <div className="d-flex justify-content-between" style={{ fontSize: "10pt", marginBottom: "3px" }}>
            <span>For AICTE Diploma Engineering Courses</span>
            <span style={{ fontWeight: "bold" }}>CIAAN - 2023</span>
          </div>
          <div className="d-flex justify-content-between" style={{ fontSize: "10pt", marginBottom: "15px" }}>
            <span>wef - 2023-24</span>
            <span style={{ fontWeight: "bold" }}>K8</span>
          </div>

          {/* Center Heading */}
          <div className="text-center mb-4">
            <div style={{ fontSize: "11pt", fontWeight: "normal" }}>Maharashtra State Board of Technical Education</div>
            <div style={{ fontSize: "12pt", fontWeight: "bold", textDecoration: "underline", marginTop: "3px" }}>
              DETAILS OF INDUSTRIAL VISIT
            </div>
          </div>

          {/* Form Metadata Fields */}
          <div style={{ fontSize: "10.5pt", lineHeight: "1.8", marginBottom: "20px" }}>
            <div className="d-flex w-100">
              <div style={{ width: "110px" }}>Institute Name:</div>
              <div style={{ flex: 1, borderBottom: "1px solid #94a3b8", paddingLeft: "5px", fontWeight: "bold" }}>
                {record.instituteName}
              </div>
            </div>
            <div className="d-flex w-100 mt-2">
              <div className="d-flex" style={{ width: "50%" }}>
                <div style={{ width: "110px" }}>Academic Year:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #94a3b8", paddingLeft: "5px", fontWeight: "bold" }}>
                  {record.academicYear}
                </div>
              </div>
              <div className="d-flex" style={{ width: "50%", paddingLeft: "20px" }}>
                <div style={{ width: "90px" }}>Programme:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #94a3b8", paddingLeft: "5px", fontWeight: "bold" }}>
                  {record.programme}
                </div>
              </div>
            </div>
          </div>

          {/* Table with thin light-grey borders */}
          <div className="table-responsive">
            <table
              className="table table-sm"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
                fontSize: "9.5pt",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "6%", background: "#f8fafc", color: "#000" }}>Sr. No.</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "12%", background: "#f8fafc", color: "#000" }}>Date of visit</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "12%", background: "#f8fafc", color: "#000" }}>Year / Semester</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "22%", background: "#f8fafc", color: "#000" }}>Name of Industry</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "18%", background: "#f8fafc", color: "#000" }}>Name of Coordinator /s</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>No. of Beneficiary</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>Relevance to Course</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>Mapping with PO / PSO / Level</th>
                </tr>
              </thead>
              <tbody>
                {displayEntries.map((r, i) => (
                  <tr key={i} style={{ height: "30px" }}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.srNo}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>
                      {!r.isBlank && r.dateOfVisit ? new Date(r.dateOfVisit).toLocaleDateString() : ""}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.yearSemester}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>{r.industryName}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>{r.coordinatorName}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.beneficiaries}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.relevanceToCourse}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.mappingWithPO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Signatures */}
          <div className="d-flex justify-content-between mt-5" style={{ fontSize: "10.5pt" }}>
            <div style={{ textAlign: "center", width: "260px" }}>
              <br />
              <strong>Name and Signature of Academic Co-ordinator</strong>
            </div>
            <div style={{ textAlign: "center", width: "180px" }}>
              <br />
              <strong>Name and Signature of HoD</strong>
            </div>
          </div>

          {/* Bottom Footer */}
          <div
            className="d-flex justify-content-between mt-5"
            style={{
              borderTop: "1px solid #cbd5e1",
              paddingTop: "6px",
              fontSize: "9pt",
              color: "#475569",
              fontFamily: "sans-serif",
            }}
          >
            <span>Maharashtra State Board of Technical Education, Mumbai</span>
            <span>Page | 62</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustrialVisitK8Generate;
