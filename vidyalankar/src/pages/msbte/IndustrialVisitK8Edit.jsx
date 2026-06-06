import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const IndustrialVisitK8Edit = () => {
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState("");
  const [cianns, setCianns] = useState([]);
  const [selectedCiannId, setSelectedCiannId] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [division, setDivision] = useState("");
  const [availableDivisions, setAvailableDivisions] = useState([]);
  const [loadingCianns, setLoadingCianns] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Entries State (Current list of rows)
  const [entries, setEntries] = useState([]);

  // Form State for Entry CRUD
  const [dateOfVisit, setDateOfVisit] = useState("");
  const [yearSemester, setYearSemester] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [relevanceToCourse, setRelevanceToCourse] = useState("");
  const [mappingWithPO, setMappingWithPO] = useState("");

  // Edit Row Index Tracker (-1 means we are adding new row)
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

  // Fetch CIANNs and Load Existing Record (if id in URL)
  useEffect(() => {
    // Default brand name
    const brand = localStorage.getItem("institutionName") || "Vidyalankar Polytechnic";
    setInstituteName(brand);

    const loadData = async () => {
      setLoadingCianns(true);
      let loadedCianns = [];
      try {
        const ciannRes = await axios.get("/cianns");
        if (Array.isArray(ciannRes.data)) {
          setCianns(ciannRes.data);
          loadedCianns = ciannRes.data;
        }
      } catch (err) {
        console.error("Failed to load CIANNs:", err);
      } finally {
        setLoadingCianns(false);
      }

      // Check if editing an existing record
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        setRecordId(id);
        setLoadingRecord(true);
        try {
          const res = await axios.get(`/msbte/industrial-visit/k8?id=${id}`);
          if (res.data?.success && res.data.data) {
            const rec = res.data.data;
            setSelectedCiannId(rec.ciannId || "");
            setAcademicYear(rec.academicYear || "");
            setProgramme(rec.programme || "");
            setDivision(rec.division || "");
            if (Array.isArray(rec.entries)) {
              setEntries(rec.entries);
            }

            // Find matching CIANN to fetch its course divisions
            const matchingCiann = loadedCianns.find(
              (c) => String(c.ciannId) === String(rec.ciannId)
            );
            if (matchingCiann && matchingCiann.courseId) {
              await fetchDivisionsForCourse(matchingCiann.courseId, rec.division);
            } else if (rec.division) {
              setAvailableDivisions([{ _id: "saved", name: rec.division }]);
            }
          }
        } catch (err) {
          console.error("Failed to load existing record:", err);
        } finally {
          setLoadingRecord(false);
        }
      }
    };

    loadData();
  }, []);

  // Handle CIANN Selection
  const handleCiannChange = (e) => {
    const cid = e.target.value;
    setSelectedCiannId(cid);

    if (!cid) {
      setAcademicYear("");
      setProgramme("");
      setDivision("");
      setYearSemester("");
      setAvailableDivisions([]);
      return;
    }

    const ciannObj = cianns.find((c) => String(c.ciannId) === String(cid) || String(c._id) === String(cid));
    if (ciannObj) {
      setAcademicYear(ciannObj.academicYear || "");
      const prog = ciannObj.department?.name || ciannObj.department || "";
      setProgramme(prog);
      
      const semStr = ciannObj.semester ? `Semester ${ciannObj.semester}` : "";
      setYearSemester(semStr);

      // Fetch divisions associated with course
      if (ciannObj.courseId) {
        fetchDivisionsForCourse(ciannObj.courseId, ciannObj.division);
      } else {
        setAvailableDivisions([{ _id: "ciann_div", name: ciannObj.division || "" }]);
        setDivision(ciannObj.division || "");
      }
    }
  };

  // Add or Update Entry
  const handleAddOrUpdateEntry = (e) => {
    e.preventDefault();

    if (!dateOfVisit || !industryName || !coordinatorName) {
      alert("Please fill in Date of Visit, Industry Name, and Coordinator fields.");
      return;
    }

    const newEntry = {
      dateOfVisit,
      yearSemester,
      industryName,
      coordinatorName,
      beneficiaries: beneficiaries || "0",
      relevanceToCourse,
      mappingWithPO,
    };

    if (editIndex >= 0) {
      // Update existing
      const updated = [...entries];
      updated[editIndex] = {
        ...updated[editIndex],
        ...newEntry,
      };
      setEntries(updated);
      setEditIndex(-1);
    } else {
      // Add new
      setEntries([...entries, { ...newEntry, srNo: entries.length + 1 }]);
    }

    // Reset entry form fields
    setDateOfVisit("");
    setIndustryName("");
    setCoordinatorName("");
    setBeneficiaries("");
    setRelevanceToCourse("");
    setMappingWithPO("");
  };

  // Edit Entry Row
  const startEditEntry = (idx) => {
    const item = entries[idx];
    setDateOfVisit(item.dateOfVisit ? item.dateOfVisit.slice(0, 10) : "");
    setYearSemester(item.yearSemester || "");
    setIndustryName(item.industryName || "");
    setCoordinatorName(item.coordinatorName || "");
    setBeneficiaries(item.beneficiaries || "");
    setRelevanceToCourse(item.relevanceToCourse || "");
    setMappingWithPO(item.mappingWithPO || "");
    setEditIndex(idx);
  };

  // Delete Entry Row
  const deleteEntry = (idx) => {
    const filtered = entries.filter((_, i) => i !== idx);
    // Recalculate serial numbers
    const mapped = filtered.map((item, i) => ({
      ...item,
      srNo: i + 1,
    }));
    setEntries(mapped);
    if (editIndex === idx) {
      setEditIndex(-1);
    }
  };

  // Save Record to Backend
  const handleSaveAll = async () => {
    if (!division) {
      alert("Please select a Division before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: recordId || undefined,
        ciannId: selectedCiannId ? Number(selectedCiannId) : undefined,
        division,
        instituteName,
        academicYear,
        programme,
        entries,
      };

      const res = await axios.post("/msbte/industrial-visit/k8/save", payload);

      if (res.data?.success) {
        navigate(`/msbte/industrial-visit/k8/generate?id=${res.data.data?._id}`);
      } else {
        alert(res.data?.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save Industrial Visit record.");
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
          Industrial Visit (K8) - {recordId ? "Edit Report" : "New Report"}
        </h3>

        {/* Card 1: Header Info & CIANN selection */}
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
                Select CIANN
              </label>
              <select
                className="form-select"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                }}
                value={selectedCiannId}
                onChange={handleCiannChange}
                disabled={loadingCianns}
              >
                <option value="">-- Select CIANN --</option>
                {cianns.map((c) => (
                  <option key={c._id} value={c.ciannId}>
                    CIANN {c.ciannId} - {c.subject?.name} ({c.division})
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

        {/* Card 2: Entry form block for CRUD operations */}
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
            {editIndex >= 0 ? "Edit Entry details" : "Add Industrial Visit Entry"}
          </h5>
          <form onSubmit={handleAddOrUpdateEntry} className="row g-3">
            <div className="col-md-3">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Date of Visit *</label>
              <input
                type="date"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={dateOfVisit}
                onChange={(e) => setDateOfVisit(e.target.value)}
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
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Name of Industry *</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
                placeholder="e.g. Infosys, Pune"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Name of Coordinator/s *</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="e.g. Prof. J. D. Sharma"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>No. of Beneficiary Students</label>
              <input
                type="number"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={beneficiaries}
                onChange={(e) => setBeneficiaries(e.target.value)}
                placeholder="e.g. 54"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Relevance to Course</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={relevanceToCourse}
                onChange={(e) => setRelevanceToCourse(e.target.value)}
                placeholder="e.g. Software Testing & Deployment Practices"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#475569", fontWeight: "500" }}>Mapping with PO/PSO/Level</label>
              <input
                type="text"
                className="form-control"
                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                value={mappingWithPO}
                onChange={(e) => setMappingWithPO(e.target.value)}
                placeholder="e.g. PO1, PO3, PSO2 / Level 3"
              />
            </div>

            <div className="col-12 mt-4 text-end">
              {editIndex >= 0 && (
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setEditIndex(-1);
                    setDateOfVisit("");
                    setIndustryName("");
                    setCoordinatorName("");
                    setBeneficiaries("");
                    setRelevanceToCourse("");
                    setMappingWithPO("");
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

        {/* Card 3: Added entries list */}
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
            Entries Table ({entries.length} visits added)
          </h5>

          <div className="table-responsive">
            <table
              className="table table-bordered table-sm"
              style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1" }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Sr. No</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Date of Visit</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Year / Semester</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Name of Industry</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Coordinator/s</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Beneficiaries</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>Course Relevance</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px" }}>PO Mapping</th>
                  <th style={{ color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px", width: "140px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4" style={{ color: "#64748b", border: "1px solid #cbd5e1" }}>
                      No entries added yet. Use the form above to add industrial visits.
                    </td>
                  </tr>
                ) : (
                  entries.map((item, idx) => (
                    <tr key={idx} style={{ background: editIndex === idx ? "#f0f9ff" : "transparent" }}>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.srNo}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>
                        {item.dateOfVisit ? new Date(item.dateOfVisit).toLocaleDateString() : ""}
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.yearSemester}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.industryName}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.coordinatorName}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.beneficiaries}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.relevanceToCourse}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{item.mappingWithPO}</td>
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

        {/* Action controls */}
        <div className="d-flex gap-3 justify-content-end mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/msbte/industrial-visit/k8")}
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

export default IndustrialVisitK8Edit;
