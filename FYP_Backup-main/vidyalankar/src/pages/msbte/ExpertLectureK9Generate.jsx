import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const ExpertLectureK9Generate = () => {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const fetchRecord = async () => {
      setLoading(true);
      try {
        const url = id ? `/msbte/expert-lecture/k9?id=${encodeURIComponent(id)}` : "/msbte/expert-lecture/k9";
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
        <button className="btn btn-primary mt-3" onClick={() => navigate("/msbte/expert-lecture/k9/edit")}>
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
        expertDetails: "",
        dateOfExpertLecture: "",
        topic: "",
        yearSemester: "",
        coordinatorName: "",
        studentsAttended: "",
        relevanceToPO: "",
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
      <div style={{ maxWidth: "950px", margin: "0 auto" }}>
        {/* Controls Toolbar */}
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/msbte/expert-lecture/k9/edit?id=${record._id}`)}
            style={{ background: "#64748b", border: "1px solid #475569", color: "#fff" }}
          >
            <i className="bi bi-pencil"></i> Edit Details
          </button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/msbte/expert-lecture/k9")}
              style={{ background: "#475569", border: "none" }}
            >
              Dashboard
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/msbte/expert-lecture/k9/print?id=${record._id}`)}
              style={{ background: "#4f46e5", border: "none" }}
            >
              <i className="bi bi-printer"></i> Open printable view
            </button>
          </div>
        </div>

        {/* Clean document container for A4 portrait style */}
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
          {/* Top headers */}
          <div className="d-flex justify-content-between" style={{ fontSize: "10pt", marginBottom: "3px" }}>
            <span>For AICTE Diploma Engineering Courses</span>
            <span style={{ fontWeight: "bold" }}>CIAAN – 2023</span>
          </div>
          <div className="d-flex justify-content-between" style={{ fontSize: "10pt", marginBottom: "15px" }}>
            <span>wef - 2023-24</span>
            <span style={{ fontWeight: "bold" }}>K9</span>
          </div>

          {/* Center Heading */}
          <div className="text-center mb-4">
            <div style={{ fontSize: "11pt", fontWeight: "normal" }}>Maharashtra State Board of Technical Education</div>
            <div style={{ fontSize: "12pt", fontWeight: "bold", textDecoration: "underline", marginTop: "3px" }}>
              DETAILS OF EXPERT LECTURE
            </div>
          </div>

          {/* Metadata Fields */}
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

          {/* Data Table with thin light-grey borders */}
          <div className="table-responsive">
            <table
              className="table table-sm"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
                fontSize: "9pt",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "5%", background: "#f8fafc", color: "#000" }}>Sr. No.</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "25%", background: "#f8fafc", color: "#000" }}>Name, Designation, Organisation of Expert Along with Contact Details & Email ID</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>Date of Expert Lecture</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "20%", background: "#f8fafc", color: "#000" }}>Topic</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>Year / Semester</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "12%", background: "#f8fafc", color: "#000" }}>Name of Coordinator</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "8%", background: "#f8fafc", color: "#000" }}>No. of Students Attended</th>
                  <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%", background: "#f8fafc", color: "#000" }}>Relevance to PO's & PSO (only nos.)</th>
                </tr>
              </thead>
              <tbody>
                {displayEntries.map((r, i) => (
                  <tr key={i} style={{ height: "30px" }}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.srNo}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", whiteSpace: "pre-wrap", fontSize: "8.5pt" }}>{r.expertDetails}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>
                      {!r.isBlank && r.dateOfExpertLecture ? new Date(r.dateOfExpertLecture).toLocaleDateString() : ""}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>{r.topic}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.yearSemester}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>{r.coordinatorName}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.studentsAttended}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.relevanceToPO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Signatures */}
          <div className="d-flex justify-content-between mt-5" style={{ fontSize: "10.5pt" }}>
            <div style={{ textAlign: "left", width: "240px" }}>
              Signature of Academic Co-ordinator<br />
              Name: ______________________
            </div>
            <div style={{ textAlign: "left", width: "220px" }}>
              Signature of HoD<br />
              Name: ______________________
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
            <span>Page | 63</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertLectureK9Generate;
