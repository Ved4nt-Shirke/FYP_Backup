import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const ExpertLectureK9Print = () => {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

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

  useEffect(() => {
    if (record) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [record]);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: "40px" }}>
        <h3>Loading Printable Sheet...</h3>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="main-content" style={{ padding: "40px" }}>
        <h3>No data to print.</h3>
      </div>
    );
  }

  // Pad entries up to 10 rows
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
    <div className="main-content" style={{ background: "#ffffff", color: "#000000", minHeight: "100vh", padding: "20px" }}>
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ background: "#64748b", color: "#fff", border: "none" }}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ background: "#4f46e5", color: "#fff", border: "none" }}>
          <i className="bi bi-printer"></i> Print / Save PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        ref={printRef}
        className="msbte-print-sheet"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm 15mm 15mm 15mm",
          margin: "0 auto",
          background: "#fff",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "11pt",
          color: "#000",
          boxSizing: "border-box",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          {/* Header Metadata Section */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "3px" }}>
            <div>For AICTE Diploma Engineering Courses</div>
            <div style={{ textAlign: "right", fontWeight: "bold" }}>CIAAN – 2023</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "15px" }}>
            <div>wef - 2023-24</div>
            <div style={{ textAlign: "right", fontWeight: "bold" }}>K9</div>
          </div>

          {/* Center Title */}
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <div style={{ fontSize: "11pt", fontWeight: "normal" }}>Maharashtra State Board of Technical Education</div>
            <div style={{ fontSize: "12pt", fontWeight: "bold", textDecoration: "underline", marginTop: "3px" }}>
              DETAILS OF EXPERT LECTURE
            </div>
          </div>

          {/* Form Header Info Fields */}
          <div style={{ fontSize: "10.5pt", lineHeight: "2", marginBottom: "15px" }}>
            <div style={{ display: "flex", width: "100%" }}>
              <div style={{ width: "120px" }}>Institute Name:</div>
              <div style={{ flex: 1, borderBottom: "1px solid #cbd5e1", paddingLeft: "5px", fontWeight: "bold" }}>
                {record.instituteName}
              </div>
            </div>
            <div style={{ display: "flex", width: "100%", marginTop: "8px" }}>
              <div style={{ display: "flex", width: "50%" }}>
                <div style={{ width: "120px" }}>Academic Year:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #cbd5e1", paddingLeft: "5px", fontWeight: "bold" }}>
                  {record.academicYear}
                </div>
              </div>
              <div style={{ display: "flex", width: "50%", paddingLeft: "20px" }}>
                <div style={{ width: "90px" }}>Programme:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #cbd5e1", paddingLeft: "5px", fontWeight: "bold" }}>
                  {record.programme}
                </div>
              </div>
            </div>
          </div>

          {/* Data Table with thin light-grey borders */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "15px",
              fontSize: "9pt",
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "5%" }}>Sr. No.</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "25%" }}>
                  Name, Designation, Organisation of Expert Along with Contact Details & Email ID
                </th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%" }}>Date of Expert Lecture</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "20%" }}>Topic</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%" }}>Year / Semester</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 4px", textAlign: "center", width: "12%" }}>Name of Coordinator</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "8%" }}>No. of Students Attended</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px 2px", textAlign: "center", width: "10%" }}>Relevance to PO's & PSO (only nos.)</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((r, i) => (
                <tr key={i} style={{ height: "30px" }}>
                  <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>{r.srNo}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", whiteSpace: "pre-wrap", fontSize: "8.5pt" }}>{r.expertDetails}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center" }}>
                    {!r.isBlank && r.dateOfExpertLecture ? new Date(r.dateOfExpertLecture).toLocaleDateString("en-IN") : ""}
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

        {/* Footer & Signatures Section */}
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5pt", marginBottom: "30px" }}>
            <div style={{ textAlign: "left", width: "280px" }}>
              Signature of Academic Co-ordinator<br />
              Name: ______________________
            </div>
            <div style={{ textAlign: "left", width: "240px" }}>
              Signature of HoD<br />
              Name: ______________________
            </div>
          </div>

          {/* Handbook Bottom Footer */}
          <div
            style={{
              borderTop: "1px solid #cbd5e1",
              paddingTop: "6px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9.5pt",
              fontFamily: "sans-serif",
              color: "#475569",
            }}
          >
            <div>Maharashtra State Board of Technical Education, Mumbai</div>
            <div>Page | 63</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertLectureK9Print;
