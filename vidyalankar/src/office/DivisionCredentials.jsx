import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { config } from "../config/api";
import "./DivisionCredentials.css";

const DivisionCredentials = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedDivision, setExpandedDivision] = useState(null);
  const [divisionStudents, setDivisionStudents] = useState({});

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.students}/divisions`);
      const data = await res.json();
      if (res.ok) {
        setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
      } else {
        setError(data.message || "Failed to fetch divisions");
      }
    } catch (err) {
      console.error("Error fetching divisions:", err);
      setError("Could not load divisions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisionStudents = async (division) => {
    try {
      if (divisionStudents[division]) {
        setExpandedDivision(expandedDivision === division ? null : division);
        return;
      }

      const res = await fetch(`${config.students}?division=${encodeURIComponent(division)}`);
      const data = await res.json();
      
      setDivisionStudents((prev) => ({
        ...prev,
        [division]: Array.isArray(data) ? data : [],
      }));
      setExpandedDivision(expandedDivision === division ? null : division);
    } catch (err) {
      console.error("Error fetching division students:", err);
      setError("Failed to load students for this division");
    }
  };

  const generatePDF = (division) => {
    const students = divisionStudents[division] || [];

    if (students.length === 0) {
      alert("No students found for this division");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.text(`Student Login Credentials - Division ${division}`, pageWidth / 2, 15, {
      align: "center",
    });

    // Timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, {
      align: "center",
    });

    // Table data
    const tableData = students
      .filter((s) => s.username && s.plainPassword)
      .map((student) => [
        student.enrollmentNo || "-",
        student.rollNo || "-",
        student.studentName || "-",
        student.username || "-",
        student.plainPassword || "-",
      ]);

    if (tableData.length === 0) {
      doc.setFontSize(12);
      doc.text("No students with credentials available", 10, 40);
      doc.save(`Division_${division}_Credentials.pdf`);
      return;
    }

    // Add table
    autoTable(doc, {
      head: [["Enrollment No", "Roll No", "Student Name", "Username", "Password"]],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
      },
      margin: 10,
      didDrawPage: function (data) {
        // Footer
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(9);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Add security notice
    doc.addPage();
    doc.setFontSize(12);
    doc.text("⚠️ SECURITY & CONFIDENTIALITY NOTICE", pageWidth / 2, 20, {
      align: "center",
      fontStyle: "bold",
    });

    doc.setFontSize(10);
    const notice = [
      "• This document contains sensitive login credentials and is CONFIDENTIAL",
      "• Keep this document secure and only share with authorized recipients",
      "• Do NOT print or distribute copies without proper authorization",
      "• Change default passwords immediately after first login",
      "• Report any unauthorized access or security concerns to the IT department",
      "• This document should be stored securely and destroyed after purpose is served",
    ];

    let yPosition = 35;
    notice.forEach((line) => {
      doc.text(line, 10, yPosition);
      yPosition += 8;
    });

    doc.save(`Division_${division}_Credentials.pdf`);
  };

  return (
    <div className="division-credentials-container">
      <div className="credentials-header">
        <div>
          <h1>📥 Division Credentials Management</h1>
          <p>View and download student credentials organized by division</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="loading">Loading divisions...</div>
      ) : divisions.length === 0 ? (
        <div className="empty-state">
          <p>No divisions available yet. Upload students first.</p>
        </div>
      ) : (
        <div className="divisions-grid">
          {divisions.map((division) => (
            <div key={division} className="division-card">
              <div className="division-header">
                <h3>{division}</h3>
                <span className="student-count">
                  {divisionStudents[division]?.length || "?"}
                </span>
              </div>

              <button
                className="expand-btn"
                onClick={() => fetchDivisionStudents(division)}
              >
                {expandedDivision === division ? "▼" : "▶"} 
                {expandedDivision === division ? "Hide" : "Show"} Students
              </button>

              {expandedDivision === division && (
                <div className="division-content">
                  {divisionStudents[division]?.length === 0 ? (
                    <p className="no-students">No students in this division</p>
                  ) : (
                    <div className="students-list">
                      <table>
                        <thead>
                          <tr>
                            <th>Enrollment No</th>
                            <th>Roll No</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Password</th>
                          </tr>
                        </thead>
                        <tbody>
                          {divisionStudents[division]?.map((student) => (
                            <tr key={student._id}>
                              <td>{student.enrollmentNo}</td>
                              <td>{student.rollNo}</td>
                              <td>{student.studentName}</td>
                              <td>
                                <code>{student.username || "-"}</code>
                              </td>
                              <td>
                                <code>{student.plainPassword || "-"}</code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <button
                className="download-btn"
                onClick={() => generatePDF(division)}
                disabled={!divisionStudents[division]}
              >
                📄 Download as PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DivisionCredentials;
