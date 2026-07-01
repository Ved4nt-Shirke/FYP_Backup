import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./StudentPromotions.css";

const StudentPromotions = () => {
  const [activeTab, setActiveTab] = useState("promote"); // 'promote' or 'archive'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resolved department info for office staff
  const [department, setDepartment] = useState(null);

  // Source selection states
  const [selectedSrcDept, setSelectedSrcDept] = useState("");
  const [srcCourses, setSrcCourses] = useState([]);
  const [selectedSrcCourse, setSelectedSrcCourse] = useState("");
  const [srcDivisions, setSrcDivisions] = useState([]);
  const [selectedSrcDiv, setSelectedSrcDiv] = useState("");

  // Target selection states
  const [selectedTgtDept, setSelectedTgtDept] = useState("");
  const [tgtCourses, setTgtCourses] = useState([]);
  const [selectedTgtCourse, setSelectedTgtCourse] = useState("");
  const [tgtDivisions, setTgtDivisions] = useState([]);
  const [selectedTgtDiv, setSelectedTgtDiv] = useState("");
  const [targetAcademicYear, setTargetAcademicYear] = useState("");

  // Students list state
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Archives state
  const [archives, setArchives] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Load office profile & resolve department first
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/auth/profile");
        if (response.data.success && response.data.profile?.department) {
          const dept = response.data.profile.department;
          setDepartment(dept);
          setSelectedSrcDept(dept._id);
          setSelectedTgtDept(dept._id);
        } else {
          setError("Your account is not associated with any department. Please contact the administrator.");
        }
      } catch (err) {
        console.error("Error loading department profile:", err);
        setError("Failed to load department details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Load academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await axios.get(config.academicYear.all);
        if (response.data.success) {
          setAcademicYears(response.data.academicYears || []);
        }
      } catch (err) {
        console.error("Error loading academic years:", err);
      }
    };
    fetchAcademicYears();
  }, []);

  // Fetch archives when on archive tab
  useEffect(() => {
    if (activeTab === "archive" && department) {
      fetchArchives();
    }
  }, [activeTab, department]);

  // Load source courses
  useEffect(() => {
    if (!selectedSrcDept) {
      setSrcCourses([]);
      setSelectedSrcCourse("");
      return;
    }
    const fetchCourses = async () => {
      try {
        const response = await axios.get(config.catalog.courses(selectedSrcDept));
        setSrcCourses(response.data.courses || []);
        setSelectedSrcCourse("");
      } catch (err) {
        console.error("Error loading source courses:", err);
      }
    };
    fetchCourses();
  }, [selectedSrcDept]);

  // Load source divisions
  useEffect(() => {
    if (!selectedSrcCourse) {
      setSrcDivisions([]);
      setSelectedSrcDiv("");
      return;
    }
    const fetchDivisions = async () => {
      try {
        const response = await axios.get(config.catalog.divisions(selectedSrcCourse));
        setSrcDivisions(response.data.divisions || []);
        setSelectedSrcDiv("");
      } catch (err) {
        console.error("Error loading source divisions:", err);
      }
    };
    fetchDivisions();
  }, [selectedSrcCourse]);

  // Load target courses
  useEffect(() => {
    if (!selectedTgtDept) {
      setTgtCourses([]);
      setSelectedTgtCourse("");
      return;
    }
    const fetchCourses = async () => {
      try {
        const response = await axios.get(config.catalog.courses(selectedTgtDept));
        setTgtCourses(response.data.courses || []);
        setSelectedTgtCourse("");
      } catch (err) {
        console.error("Error loading target courses:", err);
      }
    };
    fetchCourses();
  }, [selectedTgtDept]);

  // Load target divisions
  useEffect(() => {
    if (!selectedTgtCourse) {
      setTgtDivisions([]);
      setSelectedTgtDiv("");
      return;
    }
    const fetchDivisions = async () => {
      try {
        const response = await axios.get(config.catalog.divisions(selectedTgtCourse));
        setTgtDivisions(response.data.divisions || []);
        setSelectedTgtDiv("");
      } catch (err) {
        console.error("Error loading target divisions:", err);
      }
    };
    fetchDivisions();
  }, [selectedTgtCourse]);

  // Load students
  const fetchStudents = async () => {
    if (!selectedSrcDept || !selectedSrcCourse || !selectedSrcDiv) return;
    setLoading(true);
    try {
      const response = await axios.get(config.office.promotionsEligible, {
        params: {
          departmentId: selectedSrcDept,
          courseId: selectedSrcCourse,
          divisionId: selectedSrcDiv
        }
      });
      if (response.data.success) {
        setStudents(response.data.students || []);
        // Select all by default
        setSelectedStudentIds((response.data.students || []).map(s => s._id));
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      showErrorAlert("Failed to load division students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSrcDiv]);

  // Load archives
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const response = await axios.get(config.office.archiveSemesters);
      if (response.data.success) {
        setArchives(response.data.semesters || []);
      }
    } catch (err) {
      console.error("Error fetching archives:", err);
      showErrorAlert("Failed to load semester archives");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map(s => s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      showErrorAlert("Please select at least one student to promote");
      return;
    }
    if (!selectedTgtDept || !selectedTgtCourse || !selectedTgtDiv || !targetAcademicYear.trim()) {
      showErrorAlert("Please complete all target configuration fields");
      return;
    }

    const confirmMsg = `Are you sure you want to promote ${selectedStudentIds.length} students to Academic Year ${targetAcademicYear.trim()}? Previous semester Ciaans for this source class will be frozen automatically.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const response = await axios.post(config.office.promoteStudents, {
        sourceDepartmentId: selectedSrcDept,
        sourceCourseId: selectedSrcCourse,
        sourceDivisionId: selectedSrcDiv,
        targetDepartmentId: selectedTgtDept,
        targetCourseId: selectedTgtCourse,
        targetDivisionId: selectedTgtDiv,
        targetAcademicYear: targetAcademicYear.trim(),
        studentIds: selectedStudentIds
      });

      if (response.data.success) {
        showSuccessAlert(response.data.message || "Students promoted successfully");
        setStudents([]);
        setSelectedStudentIds([]);
        setSelectedSrcDiv("");
      }
    } catch (err) {
      console.error("Promotion failed:", err);
      showErrorAlert(err.response?.data?.message || "Failed to promote students");
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeToggle = async (archiveItem, action) => {
    const { academicYear, division, semester } = archiveItem;
    const actionLabel = action === "freeze" ? "Freeze (Lock edits for)" : "Reopen (Enable edits for)";

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${division} (Sem ${semester}) for ${academicYear}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(config.office.freezeSemester, {
        academicYear,
        division,
        semester,
        action
      });

      if (response.data.success) {
        showSuccessAlert(response.data.message || "Semester status updated successfully");
        fetchArchives();
      }
    } catch (err) {
      console.error("Freeze toggle failed:", err);
      showErrorAlert(err.response?.data?.message || "Failed to update semester status");
    } finally {
      setLoading(false);
    }
  };

  const institutionName = localStorage.getItem("institutionName") || "Institution";

  if (error) {
    return (
      <div className="promotions-container">
        <div className="promo-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3>Access Restricted</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="promotions-container">
      {/* Header */}
      <div className="promotions-header">
        <div className="header-title-section">
          <h2>Student Promotions & Archiving</h2>
          <p className="subtitle">
            Promote students and manage historical CIAAN records for the <strong>{department?.name || "Loading..."}</strong> department in <strong>{institutionName}</strong>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="promotions-tabs">
        <button
          className={`promo-tab-btn ${activeTab === "promote" ? "active" : ""}`}
          onClick={() => setActiveTab("promote")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
          Promote Class
        </button>
        <button
          className={`promo-tab-btn ${activeTab === "archive" ? "active" : ""}`}
          onClick={() => setActiveTab("archive")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          Freeze & Archive Semesters
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="promo-overlay-loading">
          <div className="spinner"></div>
          <p>Processing request, please wait...</p>
        </div>
      )}

      {/* Promote Tab */}
      {activeTab === "promote" && (
        <div className="promote-content-grid">
          {/* Configuration Panel */}
          <div className="glass-card panel-card">
            <div className="panel-header">
              <h3><span className="step-badge">1</span> Source Class</h3>
              <p>Select class of your department to promote</p>
            </div>

            <div className="form-group-modern">
              <label>Department</label>
              <input
                type="text"
                value={department?.name || ""}
                disabled
                className="disabled-input-field"
              />
            </div>

            <div className="form-group-modern">
              <label>Semester (Course)</label>
              <select
                value={selectedSrcCourse}
                onChange={(e) => setSelectedSrcCourse(e.target.value)}
                disabled={!selectedSrcDept}
              >
                <option value="">Select Semester</option>
                {srcCourses.map((c) => (
                  <option key={c._id} value={c._id}>Sem {c.semester} - {c.courseCode} ({c.scheme})</option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label>Division</label>
              <select
                value={selectedSrcDiv}
                onChange={(e) => setSelectedSrcDiv(e.target.value)}
                disabled={!selectedSrcCourse}
              >
                <option value="">Select Division</option>
                {srcDivisions.map((div) => (
                  <option key={div._id} value={div._id}>{div.name}</option>
                ))}
              </select>
            </div>

            <div className="divider-line"></div>

            <div className="panel-header">
              <h3><span className="step-badge">2</span> Target Destination</h3>
              <p>Configure destination class and academic year</p>
            </div>

            <div className="form-group-modern">
              <label>Target Department</label>
              <input
                type="text"
                value={department?.name || ""}
                disabled
                className="disabled-input-field"
              />
            </div>

            <div className="form-group-modern">
              <label>Target Semester (Course)</label>
              <select
                value={selectedTgtCourse}
                onChange={(e) => setSelectedTgtCourse(e.target.value)}
                disabled={!selectedTgtDept}
              >
                <option value="">Select Target Semester</option>
                {tgtCourses.map((c) => (
                  <option key={c._id} value={c._id}>Sem {c.semester} - {c.courseCode} ({c.scheme})</option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label>Target Division</label>
              <select
                value={selectedTgtDiv}
                onChange={(e) => setSelectedTgtDiv(e.target.value)}
                disabled={!selectedTgtCourse}
              >
                <option value="">Select Target Division</option>
                {tgtDivisions.map((div) => (
                  <option key={div._id} value={div._id}>{div.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label>Target Academic Year</label>
              <select
                value={targetAcademicYear}
                onChange={(e) => setTargetAcademicYear(e.target.value)}
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year.yearName}>
                    {year.yearName} ({year.scheme}){year.status === "active" ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePromoteSubmit}
              className="promote-submit-btn"
              disabled={students.length === 0 || selectedStudentIds.length === 0 || !selectedTgtDiv || !targetAcademicYear}
            >
              Promote Selected ({selectedStudentIds.length})
            </button>
          </div>

          {/* Students List Panel */}
          <div className="glass-card students-list-card">
            <div className="list-header">
              <div>
                <h3>Students in Selected Class</h3>
                <p>Verify student records to be promoted</p>
              </div>
              {students.length > 0 && (
                <div className="checkbox-select-all">
                  <input
                    type="checkbox"
                    id="select-all-checkbox"
                    checked={selectedStudentIds.length === students.length}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="select-all-checkbox">Select All</label>
                </div>
              )}
            </div>

            <div className="students-list-scrollable">
              {students.length === 0 ? (
                <div className="empty-students-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0012 20c-1.353 0-2.64-.236-3.83-.664v-.109c0-1.113.285-2.16.786-3.07M7 10a4 4 0 11-8 0 4 4 0 018 0zm0 4.882a6.003 6.003 0 00-4 5.659v.27c0 .504.404.908.908.908h10.184a.908.908 0 00.908-.908v-.27a6.003 6.003 0 00-4-5.659" />
                  </svg>
                  <p>Choose a Source Division on the left to load eligible students.</p>
                </div>
              ) : (
                <table className="promo-students-table">
                  <thead>
                    <tr>
                      <th width="40"></th>
                      <th width="100">Roll No</th>
                      <th width="150">Enrollment No</th>
                      <th>Student Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      return (
                        <tr
                          key={student._id}
                          className={isSelected ? "row-selected" : ""}
                          onClick={() => handleSelectStudent(student._id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectStudent(student._id)}
                            />
                          </td>
                          <td><strong>{student.rollNo}</strong></td>
                          <td><code>{student.enrollmentNo}</code></td>
                          <td>{student.studentName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {activeTab === "archive" && (
        <div className="glass-card archive-panel">
          <div className="archive-header-row">
            <div>
              <h3>Division / Semester History</h3>
              <p>Lock/freeze historical CIAAN records to prevent further edits after promotion.</p>
            </div>
            <button onClick={fetchArchives} className="promo-refresh-btn" title="Refresh list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="archive-table-scrollable">
            {archives.length === 0 ? (
              <div className="empty-archives-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p>No semester logs found for this department yet.</p>
              </div>
            ) : (
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Division</th>
                    <th>Semester</th>
                    <th>CIAAN Progress</th>
                    <th>Lock Status</th>
                    <th width="150" style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archives.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.academicYear}</strong></td>
                      <td><span className="badge-div">{item.division}</span></td>
                      <td>Sem {item.semester}</td>
                      <td>
                        <span className="badge-count">
                          {item.completedCiaans} / {item.totalCiaans} completed
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status}`}>
                          {item.status === "completed" ? "Locked (Frozen)" : item.status === "partial" ? "Partially Active" : "Active (Editing Allowed)"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.status === "completed" ? (
                          <button
                            onClick={() => handleFreezeToggle(item, "unfreeze")}
                            className="btn-action reopen-btn"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFreezeToggle(item, "freeze")}
                            className="btn-action freeze-btn"
                          >
                            Freeze
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPromotions;
