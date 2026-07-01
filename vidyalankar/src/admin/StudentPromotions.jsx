import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./StudentPromotions.css";

const StudentPromotions = () => {
  const [activeTab, setActiveTab] = useState("promote"); // 'promote' or 'archive'
  const [loading, setLoading] = useState(false);

  // Source selection states
  const [departments, setDepartments] = useState([]);
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

  // Load academic years on mount
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await axios.get(config.academicYear.all);
        if (response.data.success) {
          setAcademicYears(response.data.academicYears || []);
        }
      } catch (error) {
        console.error("Error loading academic years:", error);
      }
    };
    fetchAcademicYears();
  }, []);

  // Load departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await axios.get(config.catalog.departments);
        if (response.data.success) {
          setDepartments(response.data.departments || []);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
        showErrorAlert("Failed to load departments");
      }
    };
    fetchDepts();
    if (activeTab === "archive") {
      fetchArchives();
    }
  }, [activeTab]);

  // Handle Source Department selection
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
      } catch (error) {
        console.error("Error loading source courses:", error);
      }
    };
    fetchCourses();
    // Default target dept to match source dept to simplify flow
    setSelectedTgtDept(selectedSrcDept);
  }, [selectedSrcDept]);

  // Handle Source Course selection
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
      } catch (error) {
        console.error("Error loading source divisions:", error);
      }
    };
    fetchDivisions();
  }, [selectedSrcCourse]);

  // Handle Target Department selection
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
      } catch (error) {
        console.error("Error loading target courses:", error);
      }
    };
    fetchCourses();
  }, [selectedTgtDept]);

  // Handle Target Course selection
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
      } catch (error) {
        console.error("Error loading target divisions:", error);
      }
    };
    fetchDivisions();
  }, [selectedTgtCourse]);

  // Load students when source division is selected
  const fetchStudents = async () => {
    if (!selectedSrcDept || !selectedSrcCourse || !selectedSrcDiv) return;
    setLoading(true);
    try {
      const response = await axios.get(config.admin.promotionsEligible, {
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
    } catch (error) {
      console.error("Error fetching students:", error);
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
      const response = await axios.get(config.admin.archiveSemesters);
      if (response.data.success) {
        setArchives(response.data.semesters || []);
      }
    } catch (error) {
      console.error("Error fetching archives:", error);
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
      const response = await axios.post(config.admin.promoteStudents, {
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
    } catch (error) {
      console.error("Promotion failed:", error);
      showErrorAlert(error.response?.data?.message || "Failed to promote students");
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeToggle = async (archiveItem, action) => {
    const { academicYear, division, semester } = archiveItem;
    const actionLabel = action === "freeze" ? "Freeze (Lock edits for)" : action === "unfreeze" ? "Reopen (Enable edits for)" : "Archive";

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${division} (Sem ${semester}) for ${academicYear}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(config.admin.freezeSemester, {
        academicYear,
        division,
        semester,
        action
      });

      if (response.data.success) {
        showSuccessAlert(response.data.message || "Semester status updated successfully");
        fetchArchives();
      }
    } catch (error) {
      console.error("Freeze toggle failed:", error);
      showErrorAlert(error.response?.data?.message || "Failed to update semester status");
    } finally {
      setLoading(false);
    }
  };

  const adminInstitution = localStorage.getItem("college") || "Institution";

  return (
    <div className="promotions-container">
      {/* Header */}
      <div className="promotions-header">
        <div className="header-title-section">
          <h2>Academic Archiving & Promotions</h2>
          <p className="subtitle">
            Manage student progression and secure historical Ciaan log records for <strong>{adminInstitution}</strong>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="promotions-tabs">
        <button
          className={`promo-tab-btn ${activeTab === "promote" ? "active" : ""}`}
          onClick={() => setActiveTab("promote")}
        >
          <i className="bi bi-arrow-up-right-circle-fill"></i> Promote Class
        </button>
        <button
          className={`promo-tab-btn ${activeTab === "archive" ? "active" : ""}`}
          onClick={() => setActiveTab("archive")}
        >
          <i className="bi bi-archive-fill"></i> Freeze & Archive Semesters
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
          {/* Source Panel */}
          <div className="glass-card panel-card">
            <div className="panel-header">
              <h3><span className="step-badge">1</span> Source Class</h3>
              <p>Select the class you wish to promote</p>
            </div>

            <div className="form-group-modern">
              <label>Department</label>
              <select value={selectedSrcDept} onChange={(e) => setSelectedSrcDept(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
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

            {/* Target Panel */}
            <div className="divider-line"></div>

            <div className="panel-header">
              <h3><span className="step-badge">2</span> Target Destination</h3>
              <p>Configure destination class and year</p>
            </div>

            <div className="form-group-modern">
              <label>Target Department</label>
              <select value={selectedTgtDept} onChange={(e) => setSelectedTgtDept(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
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
              <i className="bi bi-arrow-up-right-circle-fill"></i> Promote Selected ({selectedStudentIds.length})
            </button>
          </div>

          {/* Students List Panel */}
          <div className="glass-card students-list-card">
            <div className="list-header">
              <div>
                <h3>Students in Selected Class</h3>
                <p>Verify students to be promoted</p>
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

            <div className="students-scroll-area">
              {students.length === 0 ? (
                <div className="empty-students-state">
                  <i className="bi bi-people"></i>
                  <p>Select a source department, course, and division to view students.</p>
                </div>
              ) : (
                <table className="promotions-students-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>Select</th>
                      <th>Roll No</th>
                      <th>Enrollment No</th>
                      <th>Student Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student._id}
                        className={selectedStudentIds.includes(student._id) ? "selected-row" : ""}
                        onClick={() => handleSelectStudent(student._id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </td>
                        <td><strong>{student.rollNo}</strong></td>
                        <td>{student.enrollmentNo}</td>
                        <td className="student-name-col">{student.studentName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {activeTab === "archive" && (
        <div className="glass-card archive-table-card">
          <div className="table-card-header">
            <div>
              <h3>Freeze Semester Editing & Archives</h3>
              <p>Freeze editing for past academic years to preserve NAAC/NBA logs, or unfreeze them if reopening is needed.</p>
            </div>
            <button className="refresh-btn" onClick={fetchArchives} title="Refresh Archives">
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>

          {archives.length === 0 ? (
            <div className="empty-archives-state">
              <i className="bi bi-archive"></i>
              <p>No historical Ciaan semesters found for this institution.</p>
            </div>
          ) : (
            <div className="archives-table-wrapper">
              <table className="archives-table">
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Division</th>
                    <th>Semester</th>
                    <th>Ciaan Sheets</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archives.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.academicYear}</strong></td>
                      <td><span className="div-badge">{item.division}</span></td>
                      <td>Sem {item.semester}</td>
                      <td>{item.count} sheet(s)</td>
                      <td>
                        {item.status === "completed" && (
                          <span className="status-pill frozen">
                            <i className="bi bi-lock-fill"></i> Frozen
                          </span>
                        )}
                        {item.status === "archived" && (
                          <span className="status-pill archived">
                            <i className="bi bi-archive-fill"></i> Archived
                          </span>
                        )}
                        {(!item.status || item.status === "active") && (
                          <span className="status-pill active">
                            <i className="bi bi-unlock-fill"></i> Active
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons-group">
                          {item.status === "completed" || item.status === "archived" ? (
                            <button
                              onClick={() => handleFreezeToggle(item, "unfreeze")}
                              className="archive-action-btn reopen-btn"
                              title="Reopen for Faculty Editing"
                            >
                              <i className="bi bi-unlock-fill"></i> Reopen
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleFreezeToggle(item, "freeze")}
                                className="archive-action-btn freeze-btn"
                                title="Freeze Faculty Editing (Read-Only)"
                              >
                                <i className="bi bi-lock-fill"></i> Freeze
                              </button>
                              <button
                                onClick={() => handleFreezeToggle(item, "archive")}
                                className="archive-action-btn archive-btn"
                                title="Move to Archives"
                              >
                                <i className="bi bi-archive-fill"></i> Archive
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPromotions;
