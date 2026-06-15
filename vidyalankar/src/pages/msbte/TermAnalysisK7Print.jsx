import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MSBTEPages.css";

const TermAnalysisK7Print = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCombined = location.state?.isCombined || false;
  const record = location.state?.record || null;
  const recordsList = location.state?.records || (record ? [record] : []);
  const filterMeta = location.state?.filterMeta || null;
  const printRef = useRef(null);

  useEffect(() => {
    if (recordsList.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [recordsList]);

  if (recordsList.length === 0) {
    return (
      <div className="main-content" style={{ padding: "40px" }}>
        <h3>No data to print. Please select records first.</h3>
        <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const firstRecord = recordsList[0] || {};
  const instituteName = filterMeta?.instituteName || firstRecord.instituteName || "Vidyalankar Polytechnic";
  const programme = filterMeta?.programme || firstRecord.programme || "";
  const semester = filterMeta?.semester || firstRecord.semester || "";
  const examType = filterMeta?.examType || firstRecord.examType || "";
  const academicYear = filterMeta?.academicYear || firstRecord.academicYear || "";

  // Pre-fill passing heads
  const passingHeadsList = ["CT1", "CT2", "FA-TH", "SA-TH", "FA-PR", "SA-PR", "SLA"];

  return (
    <div className="main-content" style={{ background: "#ffffff", color: "#000000", minHeight: "100vh", padding: "20px" }}>
      {/* Toolbar - hidden during print */}
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
          width: "210mm", // Standard A4 width
          minHeight: "297mm", // Standard A4 height
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
            <div style={{ textAlign: "right", fontWeight: "bold" }}>K7 (PART B)</div>
          </div>

          {/* Center Title */}
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <div style={{ fontSize: "11pt", fontWeight: "normal" }}>Maharashtra State Board of Technical Education</div>
            <div style={{ fontSize: "12pt", fontWeight: "bold", textDecoration: "underline", marginTop: "3px" }}>
              ANALYSIS OF TERM END EXAMINATION RESULT
            </div>
          </div>

          {/* Form Header Info Fields */}
          <div style={{ fontSize: "10.5pt", lineHeight: "2", marginBottom: "20px" }}>
            <div style={{ display: "flex", width: "100%" }}>
              <div style={{ width: "120px" }}>Institute Name:</div>
              <div style={{ flex: 1, borderBottom: "1px solid #000000", paddingLeft: "5px", fontWeight: "bold" }}>
                {instituteName}
              </div>
            </div>
            <div style={{ display: "flex", width: "100%", marginTop: "10px" }}>
              <div style={{ display: "flex", width: "65%" }}>
                <div style={{ width: "120px" }}>Programme:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #000000", paddingLeft: "5px", fontWeight: "bold" }}>
                  {programme}
                </div>
              </div>
              <div style={{ display: "flex", width: "35%", paddingLeft: "20px" }}>
                <div style={{ width: "90px" }}>Semester:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #000000", paddingLeft: "5px", fontWeight: "bold" }}>
                  {semester ? `Semester ${semester}` : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", width: "100%", marginTop: "10px" }}>
              <div style={{ display: "flex", width: "50%" }}>
                <div style={{ width: "120px" }}>Exam:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #000000", paddingLeft: "5px", fontWeight: "bold" }}>
                  {examType || "Winter / Summer"}
                </div>
              </div>
              <div style={{ display: "flex", width: "50%", paddingLeft: "20px" }}>
                <div style={{ width: "120px" }}>Academic Year:</div>
                <div style={{ flex: 1, borderBottom: "1px solid #000000", paddingLeft: "5px", fontWeight: "bold" }}>
                  {academicYear}
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
              fontSize: "10pt",
            }}
          >
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "6%" }}>Sr. No.</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "12%" }}>Course Code</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "22%" }}>Name of Course</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "12%" }}>Passing Head</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "11%" }}>Lowest Marks</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "11%" }}>Highest Marks</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "11%" }}>Appeared Students</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "11%" }}>Passed Students</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "10%" }}>% Pass</th>
                <th style={{ border: "1px solid #000000", padding: "8px 4px", textAlign: "center", width: "12%" }}>% of students above 60%</th>
              </tr>
            </thead>
            <tbody>
              {recordsList.map((rec, recIndex) => {
                const headDataMap = {};
                passingHeadsList.forEach((headName) => {
                  const found = rec.heads?.find((h) => h.passingHead === headName);
                  headDataMap[headName] = found || null;
                });

                // Dynamically recalculate FA-TH if CT1 and CT2 are present
                if (headDataMap["CT1"] && headDataMap["CT2"]) {
                  const ct1 = headDataMap["CT1"];
                  const ct2 = headDataMap["CT2"];
                  headDataMap["FA-TH"] = {
                    passingHead: "FA-TH",
                    lowestMarks: Number(((ct1.lowestMarks + ct2.lowestMarks) / 2).toFixed(1)),
                    highestMarks: Number(((ct1.highestMarks + ct2.highestMarks) / 2).toFixed(1)),
                    appearedStudents: Number(((ct1.appearedStudents + ct2.appearedStudents) / 2).toFixed(1)),
                    passedStudents: Number(((ct1.passedStudents + ct2.passedStudents) / 2).toFixed(1)),
                    above60Percentage: Number(((ct1.above60Percentage + ct2.above60Percentage) / 2).toFixed(1)),
                  };
                }

                return passingHeadsList.map((headName, headIndex) => {
                  const data = headDataMap[headName];
                  const isFirst = headIndex === 0;

                  const passPercent = data && data.appearedStudents > 0
                    ? ((data.passedStudents / data.appearedStudents) * 100).toFixed(1) + "%"
                    : data ? "0.0%" : "";

                  const courseCodeDisplay = rec.division ? `${rec.courseCode} (${rec.division})` : rec.courseCode;

                  return (
                    <tr key={`${rec._id || recIndex}-${headName}`} style={{ height: "32px" }}>
                      {isFirst && (
                        <>
                          <td rowSpan={passingHeadsList.length} style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", verticalAlign: "middle" }}>{recIndex + 1}</td>
                          <td rowSpan={passingHeadsList.length} style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", verticalAlign: "middle", fontWeight: "bold" }}>{courseCodeDisplay}</td>
                          <td rowSpan={passingHeadsList.length} style={{ border: "1px solid #000000", padding: "4px 8px", verticalAlign: "middle", fontWeight: "bold" }}>{rec.courseName}</td>
                        </>
                      )}
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>
                        {headName === "FA-TH" ? "FA-TH (Final)" : headName}
                      </td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{data ? data.lowestMarks : ""}</td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{data ? data.highestMarks : ""}</td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{data ? data.appearedStudents : ""}</td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{data ? data.passedStudents : ""}</td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", fontWeight: data ? "bold" : "normal" }}>{passPercent}</td>
                      <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{data ? (data.above60Percentage ? `${data.above60Percentage}%` : "0%") : ""}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Footer & Signatures Section */}
        <div style={{ marginTop: "50px" }}>
          {isCombined ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11pt", marginBottom: "40px" }}>
              <div style={{ textAlign: "left", width: "300px" }}>
                <strong>Signature of Academic Co-ordinator</strong>
                <div style={{ marginTop: "25px" }}>Name: _______________________________</div>
                <div style={{ marginTop: "10px" }}>Designation: ________________________</div>
              </div>
              <div style={{ textAlign: "left", width: "250px" }}>
                <strong>Signature of HoD</strong>
                <div style={{ marginTop: "25px" }}>Name: _______________________________</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11pt", marginBottom: "40px" }}>
              <div style={{ textAlign: "center", width: "240px" }}>
                <br />
                <strong>Name & Signature of Faculty</strong>
              </div>
              <div style={{ textAlign: "center", width: "240px" }}>
                <br />
                <strong>Name & Signature of HoD</strong>
              </div>
            </div>
          )}

          {/* Handbook Bottom Footer */}
          <div
            style={{
              borderTop: "1px solid #000000",
              paddingTop: "6px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9.5pt",
              fontFamily: "sans-serif",
              color: "#475569",
            }}
          >
            <div>Maharashtra State Board of Technical Education, Mumbai</div>
            <div>K7 (PART B)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermAnalysisK7Print;
