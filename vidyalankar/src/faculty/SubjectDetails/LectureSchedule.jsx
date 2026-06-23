import { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

function LectureSchedule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ciannId, setCiannId] = useState(null);

  const [adminDetails, setAdminDetails] = useState(null);

  const [showIndustryForm, setShowIndustryForm] = useState(false);
  const [industryMentor, setIndustryMentor] = useState({
    name: '', designation: '', company: '', contact: '', email: ''
  });
  const [submittedIndustryMentor, setSubmittedIndustryMentor] = useState(null);

  const [showClusterForm, setShowClusterForm] = useState(false);
  const [clusterMentor, setClusterMentor] = useState({
    name: '', designation: '', department: '', contact: '', email: ''
  });
  const [submittedClusterMentor, setSubmittedClusterMentor] = useState(null);

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
      if (res.data.success) {
        setAdminDetails(res.data.adminDetails);

        const details = res.data.details;
        if (details?.lectureSchedule) {
          if (details.lectureSchedule.clusterMentor) {
            setSubmittedClusterMentor(details.lectureSchedule.clusterMentor);
            setClusterMentor(details.lectureSchedule.clusterMentor);
          }
          if (details.lectureSchedule.industryMentor) {
            setSubmittedIndustryMentor(details.lectureSchedule.industryMentor);
            setIndustryMentor(details.lectureSchedule.industryMentor);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load lecture schedule details:", err);
      setError(err.response?.data?.error || "Failed to load details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  const handleClusterSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        lectureSchedule: {
          clusterMentor,
          industryMentor: submittedIndustryMentor || { name: '', designation: '', company: '', contact: '', email: '' }
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedClusterMentor(clusterMentor);
        setShowClusterForm(false);
      }
    } catch (err) {
      console.error("Failed to save cluster mentor details:", err);
      setError(err.response?.data?.error || "Failed to save cluster mentor.");
    } finally {
      setSaving(false);
    }
  };

  const handleIndustrySubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ciannId,
        lectureSchedule: {
          clusterMentor: submittedClusterMentor || { name: '', designation: '', department: '', contact: '', email: '' },
          industryMentor
        }
      };

      const res = await axios.post(config.ciannSubjectDetails.save, payload);
      if (res.data.success) {
        setSubmittedIndustryMentor(industryMentor);
        setShowIndustryForm(false);
      }
    } catch (err) {
      console.error("Failed to save industry mentor details:", err);
      setError(err.response?.data?.error || "Failed to save industry mentor.");
    } finally {
      setSaving(false);
    }
  };

  const parseVal = (val) => {
    if (!val || val === "-") return 0;
    const parsed = parseInt(val.replace(/[^0-9]/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper variables for practical sums
  const pracEseMax = adminDetails?.assessmentScheme?.practical?.saPrMax || "-";
  const pracEseMin = adminDetails?.assessmentScheme?.practical?.saPrMin || "-";
  const pracPaMax = adminDetails?.assessmentScheme?.practical?.faPrMax || "-";
  const pracPaMin = adminDetails?.assessmentScheme?.practical?.faPrMin || "-";

  const pracTotalMax = (parseVal(pracEseMax) + parseVal(pracPaMax)) || "-";
  const pracTotalMin = (parseVal(pracEseMin) + parseVal(pracPaMin)) || "-";

  return (
    <>
      <style>{`
        .lecture-page-container {
          width: 100%;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }

        .lecture-header-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 20px;
        }

        .button1, .button2 {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          background-color: var(--primary-color, #4caf50);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: white;
          transition: background-color 0.3s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .button1:hover, .button2:hover {
          background-color: var(--primary-accent-dark, #45a049);
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        
        .popup {
          background: white;
          padding: 25px;
          width: 90%;
          max-width: 450px;
          border-radius: 12px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.4);
          animation: fadeInScale 0.3s ease-out;
        }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .popup-header {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          color: #333;
        }

        .popup-form input {
          display: block;
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .popup-form input:focus {
          outline: none;
          border-color: var(--primary-color, #4caf50);
        }

        .popup-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          gap: 10px;
        }
        .popup-submit {
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          flex: 1;
          background-color: var(--primary-color, #4caf50);
        }
        .popup-cancel {
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          flex: 1;
          background-color: #f44336;
        }

        .sheet-heading {
          margin-bottom: 20px;
          border-bottom: 2px solid #000000;
          padding-bottom: 8px;
          width: 100%;
        }

        .sheet-heading h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.5px;
        }

        .msbte-academic-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          border: 2px solid #000000;
          margin-bottom: 30px;
        }

        .msbte-academic-table th,
        .msbte-academic-table td {
          border: 1px solid #000000;
          padding: 8px 6px;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
        }

        .msbte-academic-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          color: #000000;
        }

        .msbte-academic-table th.vertical-header {
          min-width: 60px;
        }

        .msbte-academic-table th.title-header {
          min-width: 180px;
        }

        .msbte-academic-table th.category-header {
          min-width: 70px;
        }

        .msbte-academic-table th.duration-header {
          min-width: 60px;
        }

        .msbte-academic-table td.title-left {
          text-align: left;
          padding-left: 8px;
          font-weight: 500;
        }

        .msbte-academic-table td.code-bold,
        .msbte-academic-table td.credits-bold,
        .msbte-academic-table td.total-bold,
        .msbte-academic-table td.grand-total-bold {
          font-weight: bold;
        }

        .msbte-academic-table td.grand-total-bold {
          background-color: #f9fafb;
        }

        .mentor-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .mentor-table {
          width: 100%;
          max-width: 800px;
          border-collapse: collapse;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
          font-size: 14px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }

        .mentor-table th, .mentor-table td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
        }

        .mentor-table th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }

        .mentor-table .section-title {
          font-weight: bold;
          font-size: 15px;
          width: 150px;
          background-color: #fdfdfd;
        }

        @media (max-width: 768px) {
          .sheet-heading {
            flex-direction: column;
            align-items: stretch;
            padding: 15px;
          }
          .sheet-heading h3 {
            text-align: center;
            margin-bottom: 10px;
          }
          .button1, .button2 {
            width: 100%;
          }
          .mentor-container {
            width: 100%;
          }
        }
      `}</style>

      <div className="lecture-page-container">
        <div className="sheet-heading d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <h3 className="fw-bold text-dark m-0">IV. TEACHING-LEARNING & ASSESSMENT SCHEME</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="button2" onClick={() => {
              setClusterMentor(submittedClusterMentor || { name: '', designation: '', department: '', contact: '', email: '' });
              setShowClusterForm(true);
            }}>
              Cluster Mentor
            </button>
            <button className="button1" onClick={() => {
              setIndustryMentor(submittedIndustryMentor || { name: '', designation: '', company: '', contact: '', email: '' });
              setShowIndustryForm(true);
            }}>
              Industry Mentor
            </button>
          </div>
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
            Loading teaching-learning schemes...
          </div>
        ) : (
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
                  <td className="code-bold">{adminDetails?.courseCode || "-"}</td>
                  <td className="title-left">{adminDetails?.courseTitle || "-"}</td>
                  <td>{adminDetails?.abbreviation || "-"}</td>
                  <td>{adminDetails?.courseCategory || "-"}</td>
                  <td>{adminDetails?.learningScheme?.cl || "-"}</td>
                  <td>{adminDetails?.learningScheme?.tl || "-"}</td>
                  <td>{adminDetails?.learningScheme?.ll || "-"}</td>
                  <td>{adminDetails?.learningScheme?.slh || "-"}</td>
                  <td>{adminDetails?.learningScheme?.nlh || "-"}</td>
                  <td className="credits-bold">{adminDetails?.credits || "0"}</td>
                  <td>{adminDetails?.paperDuration || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.theory?.faThMax || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.theory?.saThMax || "-"}</td>
                  <td className="total-bold">{adminDetails?.assessmentScheme?.theory?.total || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.theory?.min || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.practical?.faPrMax || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.practical?.faPrMin || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.practical?.saPrMax || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.practical?.saPrMin || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.sla?.max || "-"}</td>
                  <td>{adminDetails?.assessmentScheme?.sla?.min || "-"}</td>
                  <td className="grand-total-bold">{adminDetails?.assessmentScheme?.totalMarks || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {showClusterForm && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="popup-header">Cluster Mentor Details</div>
              <form className="popup-form" onSubmit={handleClusterSubmit}>
                <input name="name" value={clusterMentor.name} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Name" required />
                <input name="designation" value={clusterMentor.designation} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Designation" required />
                <input name="department" value={clusterMentor.department} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Department" required />
                <input name="contact" value={clusterMentor.contact} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Contact No" required />
                <input name="email" type="email" value={clusterMentor.email} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Email" required />
                <div className='popup-actions'>
                  <button className='popup-cancel' type="button" onClick={() => setShowClusterForm(false)} disabled={saving}>Cancel</button>
                  <button className='popup-submit' type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showIndustryForm && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="popup-header">Industry Mentor Details</div>
              <form className="popup-form" onSubmit={handleIndustrySubmit}>
                <input name="name" value={industryMentor.name} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Name" required />
                <input name="designation" value={industryMentor.designation} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Designation" required />
                <input name="company" value={industryMentor.company} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Company" required />
                <input name="contact" value={industryMentor.contact} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Contact No" required />
                <input name="email" type="email" value={industryMentor.email} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Email" required />
                <div className='popup-actions'>
                  <button className='popup-cancel' type="button" onClick={() => setShowIndustryForm(false)} disabled={saving}>Cancel</button>
                  <button className='popup-submit' type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!loading && (
          <div className="mentor-container">
            <table className="mentor-table">
              <tbody>
                <tr><th colSpan={2}>Cluster Mentor</th></tr>
                <tr>
                  <td className="section-title">Details</td>
                  <td>
                    {submittedClusterMentor?.name ? (
                      <>
                        <p><strong>Name:</strong> {submittedClusterMentor.name}</p>
                        <p><strong>Designation:</strong> {submittedClusterMentor.designation}</p>
                        <p><strong>Department:</strong> {submittedClusterMentor.department}</p>
                        <p><strong>Contact:</strong> {submittedClusterMentor.contact}</p>
                        <p><strong>Email:</strong> {submittedClusterMentor.email}</p>
                      </>
                    ) : <p className="text-muted">No details submitted.</p>}
                  </td>
                </tr>
                <tr><th colSpan={2}>Industry Mentor</th></tr>
                <tr>
                  <td className="section-title">Details</td>
                  <td>
                    {submittedIndustryMentor?.name ? (
                      <>
                        <p><strong>Name:</strong> {submittedIndustryMentor.name}</p>
                        <p><strong>Designation:</strong> {submittedIndustryMentor.designation}</p>
                        <p><strong>Company:</strong> {submittedIndustryMentor.company}</p>
                        <p><strong>Contact:</strong> {submittedIndustryMentor.contact}</p>
                        <p><strong>Email:</strong> {submittedIndustryMentor.email}</p>
                      </>
                    ) : <p className="text-muted">No details submitted.</p>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default LectureSchedule;
