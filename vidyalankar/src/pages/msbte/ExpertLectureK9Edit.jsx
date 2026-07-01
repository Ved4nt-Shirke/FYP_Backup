import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const ExpertLectureK9Edit = () => {
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState("");
  const [Ciaans, setCiaans] = useState([]);
  const [selectedCiaanId, setSelectedCiaanId] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [division, setDivision] = useState("");
  const [availableDivisions, setAvailableDivisions] = useState([]);
  const [loadingCiaans, setLoadingCiaans] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Entries State
  const [entries, setEntries] = useState([]);

  // Form State for Entry CRUD
  const [expertDetails, setExpertDetails] = useState("");
  const [dateOfExpertLecture, setDateOfExpertLecture] = useState("");
  const [topic, setTopic] = useState("");
  const [yearSemester, setYearSemester] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [studentsAttended, setStudentsAttended] = useState("");
  const [relevanceToPO, setRelevanceToPO] = useState("");

  // Edit Index Tracker
  const [editIndex, setEditIndex] = useState(-1);

  // Helper: Fetch divisions associated with course
  const fetchDivisionsForCourse = async (courseId, currentDivName) => {
    if (!courseId) {
      setAvailableDivisions([]);
      return;
    }
    setLoadingDivisions(true);
    try {
      const res = await axios.get(`/catalog/divisions/${courseId}`);
      if (res.data?.success && Array.isArray(res.data.divisions)) {
        setAvailableDivisions(res.data.divisions);
        if (currentDivName) {
          setDivision(currentDivName);
        }
      }
    } catch (err) {
      console.error("Failed to fetch divisions:", err);
      if (currentDivName) {
        setAvailableDivisions([{ _id: "fallback", name: currentDivName }]);
        setDivision(currentDivName);
      }
    } finally {
      setLoadingDivisions(false);
    }
  };

  // Fetch Ciaans and Load Existing Record
  useEffect(() => {
    const brand = localStorage.getItem("institutionName") || "Vidyalankar Polytechnic";
    setInstituteName(brand);

    const loadData = async () => {
      setLoadingCiaans(true);
      let loadedCiaans = [];
      try {
        const CiaanRes = await axios.get("/Ciaans");
        if (Array.isArray(CiaanRes.data)) {
          setCiaans(CiaanRes.data);
          loadedCiaans = CiaanRes.data;
        }
      } catch (err) {
        console.error("Failed to fetch Ciaans:", err);
      } finally {
        setLoadingCiaans(false);
      }

      // Check URL query parameters for editing
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        setRecordId(id);
        setLoadingRecord(true);
        try {
          const res = await axios.get(`/msbte/expert-lecture/k9?id=${id}`);
          if (res.data?.success && res.data.data) {
            const rec = res.data.data;
            setSelectedCiaanId(rec.CiaanId || "");
            setAcademicYear(rec.academicYear || "");
            setProgramme(rec.programme || "");
            setDivision(rec.division || "");
            if (Array.isArray(rec.entries)) {
              setEntries(rec.entries);
            }

            // Find matching Ciaan to fetch its course divisions
            const matchingCiaan = loadedCiaans.find(
              (c) => String(c.CiaanId) === String(rec.CiaanId)
            );
            if (matchingCiaan && matchingCiaan.courseId) {
              await fetchDivisionsForCourse(matchingCiaan.courseId, rec.division);
            } else if (rec.division) {
              setAvailableDivisions([{ _id: "saved", name: rec.division }]);
            }
          }
        } catch (err) {
          console.error("Failed to load K9 record:", err);
        } finally {
          setLoadingRecord(false);
        }
      }
    };

    loadData();
  }, []);

  // Handle Ciaan selection
  const handleCiaanChange = (e) => {
    const cid = e.target.value;
    setSelectedCiaanId(cid);

    if (!cid) {
      setAcademicYear("");
      setProgramme("");
      setDivision("");
      setYearSemester("");
      setAvailableDivisions([]);
      return;
    }

    const CiaanObj = Ciaans.find((c) => String(c.CiaanId) === String(cid) || String(c._id) === String(cid));
    if (CiaanObj) {
      setAcademicYear(CiaanObj.academicYear || "");
      const prog = CiaanObj.department?.name || CiaanObj.department || "";
      setProgramme(prog);

      const semStr = CiaanObj.semester ? `Semester ${CiaanObj.semester}` : "";
      setYearSemester(semStr);

      // Fetch divisions associated with course
      if (CiaanObj.courseId) {
        fetchDivisionsForCourse(CiaanObj.courseId, CiaanObj.division);
      } else {
        setAvailableDivisions([{ _id: "Ciaan_div", name: CiaanObj.division || "" }]);
        setDivision(CiaanObj.division || "");
      }
    }
  };

  // Add / Update row entry
  const handleAddOrUpdateEntry = (e) => {
    e.preventDefault();

    if (!expertDetails || !dateOfExpertLecture || !topic || !coordinatorName) {
      alert("Please fill in Expert Details, Date, Topic, and Coordinator Name.");
      return;
    }

    const newEntry = {
      expertDetails,
      dateOfExpertLecture,
      topic,
      yearSemester,
      coordinatorName,
      studentsAttended: studentsAttended || "0",
      relevanceToPO,
    };

    if (editIndex >= 0) {
      // Update
      const updated = [...entries];
      updated[editIndex] = {
        ...updated[editIndex],
        ...newEntry,
      };
      setEntries(updated);
      setEditIndex(-1);
    } else {
      // Add
      setEntries([...entries, { ...newEntry, srNo: entries.length + 1 }]);
    }

    // Reset Entry fields
    setExpertDetails("");
    setDateOfExpertLecture("");
    setTopic("");
    setCoordinatorName("");
    setStudentsAttended("");
    setRelevanceToPO("");
  };

  // Start Editing entry
  const startEditEntry = (idx) => {
    const item = entries[idx];
    setExpertDetails(item.expertDetails || "");
    setDateOfExpertLecture(item.dateOfExpertLecture ? item.dateOfExpertLecture.slice(0, 10) : "");
    setTopic(item.topic || "");
    setYearSemester(item.yearSemester || "");
    setCoordinatorName(item.coordinatorName || "");
    setStudentsAttended(item.studentsAttended || "");
    setRelevanceToPO(item.relevanceToPO || "");
    setEditIndex(idx);
  };

  // Delete entry
  const deleteEntry = (idx) => {
    const filtered = entries.filter((_, i) => i !== idx);
    const mapped = filtered.map((item, i) => ({
      ...item,
      srNo: i + 1,
    }));
    setEntries(mapped);
    if (editIndex === idx) {
      setEditIndex(-1);
    }
  };

  // Save all
  const handleSaveAll = async () => {
    if (!division) {
      alert("Please select Division before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: recordId || undefined,
        CiaanId: selectedCiaanId ? Number(selectedCiaanId) : undefined,
        division,
        instituteName,
        academicYear,
        programme,
        entries,
      };

      const res = await axios.post("/msbte/expert-lecture/k9/save", payload);

      if (res.data?.success) {
        navigate(`/msbte/expert-lecture/k9/generate?id=${res.data.data?._id}`);
      } else {
        alert(res.data?.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save Expert Lecture record.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingRecord) {
    return (
      <div className="main-content" style={{ background: "#f8fafc", color: "#0f172a", minHeight: "100vh", padding: "40px" }}>
        <h3>Loading Record Details...</h3>
      </div>
    );
  }

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

        <h3 style={{ fontWeight: 700, marginBottom: "24px", color: "#0f172a" }}>
          Expert Lecture (K9) - {recordId ? "Edit Report" : "New Report"}
        </h3>

        {/* Metas info Card */}
        <div
          className="card mb-4"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        >
          <h5 style={{ fontWeight: 600, color: "#4f46e5", marginBottom: "18px" }}>
            Academic & Programme Details
          </h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>
                Select Ciaan
              </label>
              <select
                className="form-select"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                }}
                value={selectedCiaanId}
                onChange={handleCiaanChange}
                disabled={loadingCiaans}
              >
                <option value="">-- Select Ciaan --</option>
                {Ciaans.map((c) => (
                  <option key={c._id} value={c.CiaanId}>
                    Ciaan {c.CiaanId} - {c.subject?.name} ({c.division})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>
                Institute Name
              </label>
              <input
                type="text"
                className="form-control"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#64748b",
                }}
                value={instituteName}
                disabled
              />
            </div>

            <div className="col-md-4">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>
                Academic Year
              </label>
              <input
                type="text"
                className="form-control"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                }}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2023-24"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>
                Programme / Department
              </label>
              <input
                type="text"
                className="form-control"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                }}
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                placeholder="e.g. Information Technology"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>
                Division
              </label>
              {availableDivisions.length > 0 ? (
                <select
                  className="form-select"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                  }}
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  disabled={loadingDivisions}
                >
                  <option value="">-- Select Division --</option>
                  {availableDivisions.map((div) => (
                    <option key={div._id} value={div.name}>
                      {div.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                  }}
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. IF6I"
                />
              )}
            </div>
          </div>
        </div>

        {/* CRUD Entry form */}
        <div
          className="card mb-4"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        >
          <h5 style={{ fontWeight: 600, color: "#0ea5e9", marginBottom: "18px" }}>
            {editIndex >= 0 ? "Edit Entry Details" : "Add Expert Lecture Entry"}
          </h5>
          <form onSubmit={handleAddOrUpdateEntry} className="row g-3">
            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Expert Details * (Name, Designation, Org, Contact, Email)</label>
              <textarea
                className="form-control"
                rows="2"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={expertDetails}
                onChange={(e) => setExpertDetails(e.target.value)}
                placeholder="e.g. Dr. Amit Patel, Head of AI Research at TechCorp. Email: amit@techcorp.com, Mobile: 9876543210"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Topic *</label>
              <textarea
                className="form-control"
                rows="2"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Overview of Machine Learning & Deep Learning Practices in Industry"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Date of Lecture *</label>
              <input
                type="date"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={dateOfExpertLecture}
                onChange={(e) => setDateOfExpertLecture(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Year / Semester</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={yearSemester}
                onChange={(e) => setYearSemester(e.target.value)}
                placeholder="e.g. Third Year / Semester VI"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Name of Coordinator *</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="e.g. Mrs. S. R. Kulkarni"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>No. of Students Attended</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={studentsAttended}
                onChange={(e) => setStudentsAttended(e.target.value)}
                placeholder="e.g. 52"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Relevance to PO's & PSO (only nos.)</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={relevanceToPO}
                onChange={(e) => setRelevanceToPO(e.target.value)}
                placeholder="e.g. PO1, PO2, PO4, PSO1"
              />
            </div>

            <div className="col-12 mt-4 text-end">
              {editIndex >= 0 && (
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setEditIndex(-1);
                    setExpertDetails("");
                    setDateOfExpertLecture("");
                    setTopic("");
                    setCoordinatorName("");
                    setStudentsAttended("");
                    setRelevanceToPO("");
                  }}
                  style={{ background: "#64748b" }}
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ background: "#4f46e5", border: "none" }}>
                {editIndex >= 0 ? "Update Row" : "Add Row Entry"}
              </button>
            </div>
          </form>
        </div>

        {/* Entries table view */}
        <div
          className="card mb-4"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        >
          <h5 style={{ fontWeight: 600, color: "#10b981", marginBottom: "18px" }}>
            Entries Table ({entries.length} expert lectures added)
          </h5>

          <div className="table-responsive">
            <table
              className="table table-bordered table-sm"
              style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1" }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "5%" }}>Sr. No</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "25%" }}>Expert details</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "10%" }}>Date of Lecture</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "20%" }}>Topic</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "10%" }}>Year/Semester</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "10%" }}>Coordinator</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "8%" }}>Attended</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "8%" }}>PO relevance</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "100px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4" style={{ color: "#64748b", border: "1px solid #cbd5e1" }}>
                      No entries added yet. Use the form above to add expert lectures.
                    </td>
                  </tr>
                ) : (
                  entries.map((item, idx) => (
                    <tr key={idx} style={{ background: editIndex === idx ? "#f0f9ff" : "transparent" }}>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.srNo}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px", whiteSpace: "pre-wrap" }}>{item.expertDetails}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>
                        {item.dateOfExpertLecture ? new Date(item.dateOfExpertLecture).toLocaleDateString() : ""}
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.topic}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.yearSemester}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.coordinatorName}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.studentsAttended}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.relevanceToPO}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-info me-2"
                          onClick={() => startEditEntry(idx)}
                          style={{ padding: "4px 8px", background: "#0ea5e9", color: "#fff", border: "none" }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteEntry(idx)}
                          style={{ padding: "4px 8px", background: "#ef4444", color: "#fff", border: "none" }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save button block */}
        <div className="d-flex gap-3 justify-content-end mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/msbte/expert-lecture/k9")}
            style={{ background: "#64748b" }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveAll}
            disabled={saving || entries.length === 0}
            style={{ background: "#4f46e5", border: "none" }}
          >
            {saving ? "Saving Report..." : "Save & Generate Format"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertLectureK9Edit;
