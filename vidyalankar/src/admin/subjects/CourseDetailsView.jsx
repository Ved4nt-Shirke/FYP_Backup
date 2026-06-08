import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";
import { showErrorAlert } from "../../utils/alertUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./CourseDetailsView.css";

const CourseDetailsView = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(config.courseDetails.bySubject(subjectId));
        if (res.data.success) {
          setDetails(res.data.courseDetails);
        }
      } catch (error) {
        showErrorAlert("Failed to load course details. Make sure details are added first.");
        navigate("/admin/subjects-view");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [subjectId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!details) return;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    
    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TEACHING-LEARNING & ASSESSMENT SCHEME", 40, 40);

    // Metadata Table
    const metaData = [
      ["Subject Name", details.subjectId?.name || "-", "Course Code", details.courseCode || "-"],
      ["Subject Code", details.subjectId?.code || "-", "Abbreviation", details.abbreviation || "-"],
      ["Credits", String(details.credits || "0"), "Category", details.courseCategory || "-"],
    ];

    autoTable(doc, {
      startY: 50,
      head: [],
      body: metaData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: "bold", width: 120 },
        1: { width: 200 },
        2: { fontStyle: "bold", width: 100 },
        3: { width: 200 },
      },
    });

    // Main MSBTE Table
    const headers = [
      [
        { content: "Course Code", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Course Title", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Abbr", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Course Category", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Learning Scheme", colSpan: 5, styles: { halign: "center" } },
        { content: "Credits", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Paper Duration", rowSpan: 4, styles: { halign: "center", valign: "middle" } },
        { content: "Assessment Scheme", colSpan: 11, styles: { halign: "center" } },
      ],
      [
        { content: "Actual Contact Hrs./Week", colSpan: 3, styles: { halign: "center" } },
        { content: "SLH", rowSpan: 3, styles: { halign: "center", valign: "middle" } },
        { content: "NLH", rowSpan: 3, styles: { halign: "center", valign: "middle" } },
        { content: "Theory", colSpan: 4, styles: { halign: "center" } },
        { content: "Based on LL & TL Practical", colSpan: 4, styles: { halign: "center" } },
        { content: "Based on SL SLA", colSpan: 2, styles: { halign: "center" } },
        { content: "Total Marks", rowSpan: 3, styles: { halign: "center", valign: "middle" } },
      ],
      [
        { content: "CL", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "TL", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "LL", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "FA-TH", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "SA-TH", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Total", colSpan: 2, styles: { halign: "center" } },
        { content: "FA-PR", colSpan: 2, styles: { halign: "center" } },
        { content: "SA-PR", colSpan: 2, styles: { halign: "center" } },
        { content: "SLA", colSpan: 2, styles: { halign: "center" } },
      ],
      [
        { content: "Max", styles: { halign: "center" } },
        { content: "Min", styles: { halign: "center" } },
        { content: "Max", styles: { halign: "center" } },
        { content: "Min", styles: { halign: "center" } },
        { content: "Max", styles: { halign: "center" } },
        { content: "Min", styles: { halign: "center" } },
        { content: "Max", styles: { halign: "center" } },
        { content: "Min", styles: { halign: "center" } },
      ]
    ];

    const bodyRow = [
      details.courseCode || "-",
      details.courseTitle || "-",
      details.abbreviation || "-",
      details.courseCategory || "-",
      details.learningScheme?.cl || "-",
      details.learningScheme?.tl || "-",
      details.learningScheme?.ll || "-",
      details.learningScheme?.slh || "-",
      details.learningScheme?.nlh || "-",
      String(details.credits || "-"),
      details.paperDuration || "-",
      details.assessmentScheme?.theory?.faThMax || "-",
      details.assessmentScheme?.theory?.saThMax || "-",
      details.assessmentScheme?.theory?.total || "-",
      details.assessmentScheme?.theory?.min || "-",
      details.assessmentScheme?.practical?.faPrMax || "-",
      details.assessmentScheme?.practical?.faPrMin || "-",
      details.assessmentScheme?.practical?.saPrMax || "-",
      details.assessmentScheme?.practical?.saPrMin || "-",
      details.assessmentScheme?.sla?.max || "-",
      details.assessmentScheme?.sla?.min || "-",
      details.assessmentScheme?.totalMarks || "-",
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: headers,
      body: [bodyRow],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, halign: "center" },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 1, lineColor: [150, 150, 150] },
      columnStyles: {
        1: { halign: "left", width: 140 }, // Course title left aligned
      }
    });

    // Course Outcomes Section
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Course Outcomes (COs):", 40, doc.lastAutoTable.finalY + 30);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    let startY = doc.lastAutoTable.finalY + 45;

    if (details.courseOutcomes && details.courseOutcomes.length > 0) {
      details.courseOutcomes.forEach((co) => {
        const text = `${co.coNumber}: ${co.description}`;
        const splitText = doc.splitTextToSize(text, 750);
        doc.text(splitText, 50, startY);
        startY += (splitText.length * 12) + 4;
      });
    } else {
      doc.text("No Course Outcomes mapped for this subject.", 50, startY);
    }

    doc.save(`Course_Scheme_${details.courseCode || subjectId}.pdf`);
  };

  if (loading) {
    return (
      <div className="view-format-loading">
        <div className="spinner"></div>
        <p>Loading formatted scheme...</p>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="admin-content format-view-page">
      <div className="page-header no-print">
        <div>
          <h2>Academic Scheme Format</h2>
          <p>Formatted academic Teaching-Learning and Assessment Scheme</p>
        </div>
        <div className="format-actions">
          <button className="btn-secondary" onClick={() => navigate("/admin/subjects-view")}>
            <i className="bi bi-arrow-left"></i> Back to Subjects
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <i className="bi bi-printer"></i> Print Format
          </button>
          <button className="btn-tertiary" onClick={handleExportPDF}>
            <i className="bi bi-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>

      <div className="msbte-sheet-card">
        <div className="sheet-heading">
          <h3>IV. TEACHING-LEARNING & ASSESSMENT SCHEME</h3>
        </div>

        <div className="table-responsive">
          <table className="msbte-academic-table">
            <thead>
              {/* Row 1 */}
              <tr>
                <th rowSpan="4" className="vertical-header">Course Code</th>
                <th rowSpan="4" className="title-header">Course Title</th>
                <th rowSpan="4">Abbr</th>
                <th rowSpan="4" className="category-header">Course Category/s</th>
                <th colSpan="5">Learning Scheme</th>
                <th rowSpan="4">Credits</th>
                <th rowSpan="4" className="duration-header">Paper Duration</th>
                <th colSpan="11">Assessment Scheme</th>
              </tr>
              {/* Row 2 */}
              <tr>
                <th colSpan="3">Actual Contact Hrs./Week</th>
                <th rowSpan="3">SLH</th>
                <th rowSpan="3">NLH</th>
                <th colSpan="4">Theory</th>
                <th colSpan="4">Based on LL & TL Practical</th>
                <th colSpan="2">Based on SL SLA</th>
                <th rowSpan="3">Total Marks</th>
              </tr>
              {/* Row 3 */}
              <tr>
                <th rowSpan="2">CL</th>
                <th rowSpan="2">TL</th>
                <th rowSpan="2">LL</th>
                <th rowSpan="2">FA-TH</th>
                <th rowSpan="2">SA-TH</th>
                <th colSpan="2">Total</th>
                <th colSpan="2">FA-PR</th>
                <th colSpan="2">SA-PR</th>
                <th colSpan="2">SLA</th>
              </tr>
              {/* Row 4 */}
              <tr>
                <th>Max</th>
                <th>Min</th>
                <th>Max</th>
                <th>Min</th>
                <th>Max</th>
                <th>Min</th>
                <th>Max</th>
                <th>Min</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="code-bold">{details.courseCode || "-"}</td>
                <td className="title-left">{details.courseTitle || "-"}</td>
                <td>{details.abbreviation || "-"}</td>
                <td>{details.courseCategory || "-"}</td>
                <td>{details.learningScheme?.cl || "-"}</td>
                <td>{details.learningScheme?.tl || "-"}</td>
                <td>{details.learningScheme?.ll || "-"}</td>
                <td>{details.learningScheme?.slh || "-"}</td>
                <td>{details.learningScheme?.nlh || "-"}</td>
                <td className="credits-bold">{details.credits || "0"}</td>
                <td>{details.paperDuration || "-"}</td>
                <td>{details.assessmentScheme?.theory?.faThMax || "-"}</td>
                <td>{details.assessmentScheme?.theory?.saThMax || "-"}</td>
                <td className="total-bold">{details.assessmentScheme?.theory?.total || "-"}</td>
                <td>{details.assessmentScheme?.theory?.min || "-"}</td>
                <td>{details.assessmentScheme?.practical?.faPrMax || "-"}</td>
                <td>{details.assessmentScheme?.practical?.faPrMin || "-"}</td>
                <td>{details.assessmentScheme?.practical?.saPrMax || "-"}</td>
                <td>{details.assessmentScheme?.practical?.saPrMin || "-"}</td>
                <td>{details.assessmentScheme?.sla?.max || "-"}</td>
                <td>{details.assessmentScheme?.sla?.min || "-"}</td>
                <td className="grand-total-bold">{details.assessmentScheme?.totalMarks || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="co-view-section">
          <h4>Course Outcomes (COs) Mapping</h4>
          {details.courseOutcomes && details.courseOutcomes.length > 0 ? (
            <div className="co-grid-view">
              {details.courseOutcomes.map((co) => (
                <div key={co._id || co.coNumber} className="co-view-item">
                  <span className="co-label">{co.coNumber}</span>
                  <p className="co-desc">{co.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-cos-warning">No Course Outcomes mapped for this subject yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsView;
