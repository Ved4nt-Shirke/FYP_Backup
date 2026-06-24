import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { config, getApiUrl } from "../../config/api";
import "./Notices.css";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeType, setNoticeType] = useState("general");
  const [targetType, setTargetType] = useState("all");
  
  // Targeted selection states
  const [targetFaculties, setTargetFaculties] = useState([]);
  const [targetStudents, setTargetStudents] = useState([]);
  const [targetDepartments, setTargetDepartments] = useState([]);
  const [targetDivisions, setTargetDivisions] = useState([]);
  const [targetAcademicYears, setTargetAcademicYears] = useState([]);

  // Schedule & Expiry
  const [sendInstantly, setSendInstantly] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  // Dropdown target options from catalog/notices API
  const [targetOptions, setTargetOptions] = useState({
    departments: [],
    divisions: [],
    divisionNames: [],
    academicYears: []
  });

  // Searching for faculty / students
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Filters & Search for notices list
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const editorRef = useRef(null);
  const token = localStorage.getItem("token");
  const facultyUsername = localStorage.getItem("username") || "faculty";

  // Fetch target options and notices on mount
  useEffect(() => {
    fetchTargetOptions();
    fetchNotices();
  }, []);

  // Sync editor content when editing notice
  useEffect(() => {
    if (!showForm) return;
    if (!editorRef.current) return;
    const nextHtml = noticeContent || "";
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [showForm, noticeContent, editingId]);

  const fetchTargetOptions = async () => {
    try {
      const url = getApiUrl("/faculty/notices/target-options");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTargetOptions({
          departments: data.departments || [],
          divisions: data.divisions || [],
          divisionNames: data.divisionNames || [],
          academicYears: data.academicYears || []
        });
      }
    } catch (error) {
      console.error("Error fetching target options:", error);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const url = getApiUrl(`/faculty/notices?faculty=${encodeURIComponent(facultyUsername)}`);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotices(data.notices || []);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTarget = async (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      if (targetType === "particular-faculty") {
        const url = getApiUrl(`/faculty/directory?search=${encodeURIComponent(query)}`);
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.faculty || []);
        }
      } else if (targetType === "particular-student") {
        const url = getApiUrl(`/faculty/students?studentName=${encodeURIComponent(query)}`);
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.students || []);
        }
      }
    } catch (error) {
      console.error("Error searching target audience:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddTargetTag = (item) => {
    if (targetType === "particular-faculty") {
      const username = item.generatedUsername;
      if (!targetFaculties.some(f => f.username === username)) {
        setTargetFaculties([...targetFaculties, { username, name: item.fullName }]);
      }
    } else if (targetType === "particular-student") {
      const enrollmentNo = item.enrollmentNo;
      if (!targetStudents.some(s => s.enrollmentNo === enrollmentNo)) {
        setTargetStudents([...targetStudents, { enrollmentNo, name: item.studentName }]);
      }
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveTargetTag = (key, field) => {
    if (field === "faculty") {
      setTargetFaculties(targetFaculties.filter(f => f.username !== key));
    } else if (field === "student") {
      setTargetStudents(targetStudents.filter(s => s.enrollmentNo !== key));
    }
  };

  const handleCheckboxToggle = (id, targetState, setTargetState) => {
    if (targetState.includes(id)) {
      setTargetState(targetState.filter(item => item !== id));
    } else {
      setTargetState([...targetState, id]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const handleRemoveFile = (index) => {
    setAttachments(attachments.filter((_, idx) => idx !== index));
  };

  const handleRemoveExistingAttachment = (index) => {
    setExistingAttachments(existingAttachments.filter((_, idx) => idx !== index));
  };

  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("Please fill all required fields: Title and Content.");
      return;
    }

    // Validation for specific targets
    if (targetType === "particular-faculty" && targetFaculties.length === 0) {
      alert("Please select at least one Faculty member.");
      return;
    }
    if (targetType === "particular-student" && targetStudents.length === 0) {
      alert("Please select at least one Student.");
      return;
    }
    if (targetType === "departments" && targetDepartments.length === 0) {
      alert("Please select at least one Department.");
      return;
    }
    if (targetType === "divisions" && targetDivisions.length === 0) {
      alert("Please select at least one Division.");
      return;
    }
    if (targetType === "academic-year" && targetAcademicYears.length === 0) {
      alert("Please select at least one Academic Year.");
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? getApiUrl(`/faculty/notices/${editingId}`)
        : getApiUrl("/faculty/notices");

      // Use FormData to support multiple file uploads
      const formData = new FormData();
      formData.append("title", noticeTitle.trim());
      formData.append("content", noticeContent.trim());
      formData.append("noticeType", noticeType);
      formData.append("targetType", targetType);
      formData.append("faculty", facultyUsername);

      // Serialize targeting collections
      if (targetType === "particular-faculty") {
        formData.append("targetFaculties", JSON.stringify(targetFaculties.map(f => f.username)));
      } else if (targetType === "particular-student") {
        formData.append("targetStudents", JSON.stringify(targetStudents.map(s => s.enrollmentNo)));
      } else if (targetType === "departments") {
        formData.append("targetDepartments", JSON.stringify(targetDepartments));
      } else if (targetType === "divisions") {
        formData.append("targetDivisions", JSON.stringify(targetDivisions));
      } else if (targetType === "academic-year") {
        formData.append("targetAcademicYears", JSON.stringify(targetAcademicYears));
      }

      // Schedule inputs
      const scheduledVal = sendInstantly ? new Date().toISOString() : new Date(scheduledAt).toISOString();
      formData.append("scheduledAt", scheduledVal);
      if (expiresAt) {
        formData.append("expiresAt", new Date(expiresAt).toISOString());
      }

      // Existing attachments (for edit mode)
      if (editingId) {
        formData.append("existingAttachments", JSON.stringify(existingAttachments));
      }

      // New files
      attachments.forEach(file => {
        formData.append("attachments", file);
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        fetchNotices();
        handleCancel();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error saving notice. Please try again.");
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      alert("Failed to submit notice to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Are you sure you want to permanently delete this notice announcement?")) {
      return;
    }

    try {
      setLoading(true);
      const url = getApiUrl(`/faculty/notices/${noticeId}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchNotices();
      } else {
        alert("Error deleting notice.");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      alert("Failed to delete notice.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotice = (notice) => {
    setEditingId(notice._id);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeType(notice.noticeType || "general");
    setTargetType(notice.targetType || "all");
    
    // Resolve target arrays
    if (notice.targetType === "particular-faculty") {
      setTargetFaculties((notice.targetFaculties || []).map(username => ({ username, name: username })));
    } else if (notice.targetType === "particular-student") {
      setTargetStudents((notice.targetStudents || []).map(enrollmentNo => ({ enrollmentNo, name: enrollmentNo })));
    } else if (notice.targetType === "departments") {
      setTargetDepartments((notice.targetDepartments || []).map(d => typeof d === "object" ? d._id : d));
    } else if (notice.targetType === "divisions") {
      setTargetDivisions((notice.targetDivisions || []).map(d => typeof d === "object" ? d._id : d));
    } else if (notice.targetType === "academic-year") {
      setTargetAcademicYears(notice.targetAcademicYears || []);
    }

    // Resolve schedule/expiry
    const sDate = notice.scheduledAt ? new Date(notice.scheduledAt) : new Date(notice.createdAt);
    const offset = sDate.getTimezoneOffset() * 60000;
    const localScheduled = new Date(sDate.getTime() - offset).toISOString().slice(0, 16);
    setScheduledAt(localScheduled);
    
    const now = new Date();
    setSendInstantly(sDate <= now);

    if (notice.expiresAt) {
      const eDate = new Date(notice.expiresAt);
      const localExpiry = new Date(eDate.getTime() - offset).toISOString().slice(0, 16);
      setExpiresAt(localExpiry);
    } else {
      setExpiresAt("");
    }

    // Attachments
    setAttachments([]);
    setExistingAttachments(notice.attachments || []);

    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeType("general");
    setTargetType("all");
    setTargetFaculties([]);
    setTargetStudents([]);
    setTargetDepartments([]);
    setTargetDivisions([]);
    setTargetAcademicYears([]);
    setSendInstantly(true);
    setScheduledAt("");
    setExpiresAt("");
    setAttachments([]);
    setExistingAttachments([]);
    setSearchQuery("");
    setSearchResults([]);
    setEditingId(null);
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleEditorInput = (e) => {
    setNoticeContent(e.currentTarget.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter link URL:");
    if (url) {
      applyFormat("createLink", url);
    }
  };

  const changeColor = (e) => {
    applyFormat("foreColor", e.target.value);
  };

  // Filter notice board listings
  const filteredNotices = notices.filter((notice) => {
    const search = filterSearch.toLowerCase().trim();
    const titleMatch = (notice.title || "").toLowerCase().includes(search);
    const contentMatch = (notice.content || "").toLowerCase().includes(search);
    const typeMatch = filterType === "all" ? true : notice.noticeType === filterType;

    return (titleMatch || contentMatch) && typeMatch;
  });

  const getNoticeBadgeClass = (type) => {
    switch (type) {
      case "urgent": return "feed-badge urgent";
      case "exam": return "feed-badge exam";
      case "fee": return "feed-badge fee";
      case "event": return "feed-badge event";
      case "holiday": return "feed-badge holiday";
      case "scholarship": return "feed-badge scholarship";
      case "circular": return "feed-badge circular";
      default: return "feed-badge general";
    }
  };

  const renderAudienceSummary = (notice) => {
    switch (notice.targetType) {
      case "all": return "Entire College";
      case "all-faculty": return "All Faculty";
      case "all-students": return "All Students";
      case "particular-faculty": return `Faculty: ${notice.targetFaculties?.join(", ") || "Selected"}`;
      case "particular-student": return `Students: ${notice.targetStudents?.join(", ") || "Selected"}`;
      case "departments": return `Departments: ${(notice.targetDepartments || []).map(d => d.name || d).join(", ")}`;
      case "divisions": return `Divisions: ${(notice.targetDivisions || []).map(d => d.name || d).join(", ")}`;
      case "academic-year": return `Years: ${(notice.targetAcademicYears || []).join(", ")}`;
      default: return "All";
    }
  };

  return (
    <ErrorBoundary>
      <div className="notices-layout-wrapper animate-fadeIn">
        
        {/* Upper Title Row */}
        <div className="notices-page-title-row">
          <div className="title-left">
            <h2>Faculty Notice Board</h2>
            <span className="notices-count-badge">{filteredNotices.length} Published</span>
          </div>

          <button
            className="wizard-btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
            disabled={loading}
          >
            Create Notice
          </button>
        </div>

        {/* Filters and search section */}
        <div className="notices-filters-card">
          <div className="filters-card-inner">
            <div className="filter-select-group">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="exam">Exam</option>
                <option value="fee">Fee</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
                <option value="scholarship">Scholarship</option>
                <option value="circular">Circular</option>
              </select>
            </div>

            <div className="filter-right-search-action">
              <div className="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="search-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search titles, content..." 
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notices Dashboard Grid */}
        <div className="notices-grid-dashboard">
          {loading && !showForm ? (
            <div className="table-loader-state">
              <div className="loading-ring-spinner" />
              <span>Syncing notice board...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="table-empty-state">
              <div className="empty-state-icon">📢</div>
              <h4>No notices published</h4>
              <p>Post announcements to keep students and departments informed of updates.</p>
            </div>
          ) : (
            <div className="notices-cards-grid">
              {filteredNotices.map((notice) => (
                <div key={notice._id} className="notice-announcement-card animate-fadeIn">
                  <div className="notice-card-top-row">
                    <span className={getNoticeBadgeClass(notice.noticeType)}>{notice.noticeType || "general"}</span>
                    <span className="notice-timestamp-label">
                      {new Date(notice.scheduledAt || notice.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <h3 className="notice-announcement-title">{notice.title}</h3>
                  
                  <div
                    className="notice-announcement-body office-scrollable"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />

                  {/* Render Attachments */}
                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="card-attachments-list">
                      <div className="attachments-label-row">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="attachment-svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L6.5 14.5m11.864-8.864a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728z" />
                        </svg>
                        <span>Attachments ({notice.attachments.length})</span>
                      </div>
                      <div className="attachments-links">
                        {notice.attachments.map((att, idx) => (
                          <a 
                            key={idx}
                            href={getApiUrl(`/office/notices/file/${notice._id}/${idx}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-attachment-link"
                            title={`${att.filename} (${(att.size / 1024).toFixed(1)} KB)`}
                            onClick={(e) => {
                              // Ensure authenticated download
                              e.preventDefault();
                              const headers = { Authorization: `Bearer ${token}` };
                              fetch(e.currentTarget.href, { headers })
                                .then(res => {
                                  if (!res.ok) throw new Error("Failed file access");
                                  return res.blob();
                                })
                                .then(blob => {
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = att.filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  a.remove();
                                })
                                .catch(err => {
                                  console.error(err);
                                  alert("Error accessing this file attachment. You may not be in its targeted list.");
                                });
                            }}
                          >
                            📎 {att.filename.length > 20 ? att.filename.substring(0, 17) + "..." : att.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="notice-announcement-footer">
                    <div className="notice-author-initials">
                      <div className="notice-meta-details">
                        <div className="target-summary-label">Target: <strong>{renderAudienceSummary(notice)}</strong></div>
                        <div className="author-summary-label">By: <strong>{notice.faculty || "Faculty"}</strong></div>
                        <div className="read-count-label">Reads: <strong>{notice.readBy?.length || 0}</strong></div>
                      </div>
                    </div>

                    <div className="notice-card-action-triggers">
                      <button
                        className="action-link-btn"
                        onClick={() => handleEditNotice(notice)}
                        title="Edit Notice"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="action-link-btn danger"
                        onClick={() => handleDeleteNotice(notice._id)}
                        title="Delete Notice"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Notice Form Modal */}
        {showForm && (
          <div className="modal-wrapper-overlay" onClick={handleCancel}>
            <div className="modal-dialog-box size-large animate-modalScaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="modal-dialog-header">
                <h3>{editingId ? "Edit Notice Announcement" : "Publish Notice Announcement"}</h3>
                <p>Broadcast targeted updates to student and department portals.</p>
              </div>

              <div className="modal-dialog-body office-scrollable">
                <div className="form-input-control">
                  <label>Notice Title <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-term Exam Timetable Out"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="notice-form-row-2">
                  <div className="form-input-control">
                    <label>Notice Type <span className="req">*</span></label>
                    <select
                      value={noticeType}
                      onChange={(e) => setNoticeType(e.target.value)}
                      disabled={loading}
                    >
                      <option value="general">General Notice</option>
                      <option value="urgent">Urgent Notice</option>
                      <option value="exam">Exam Notice</option>
                      <option value="fee">Fee Notice</option>
                      <option value="event">Event Notice</option>
                      <option value="holiday">Holiday Notice</option>
                      <option value="scholarship">Scholarship Notice</option>
                      <option value="circular">Circular / Official PDF</option>
                    </select>
                  </div>

                  <div className="form-input-control">
                    <label>Audience Targeting Scope <span className="req">*</span></label>
                    <select
                      value={targetType}
                      onChange={(e) => {
                        setTargetType(e.target.value);
                        setTargetFaculties([]);
                        setTargetStudents([]);
                        setTargetDepartments([]);
                        setTargetDivisions([]);
                        setTargetAcademicYears([]);
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      disabled={loading}
                    >
                      <option value="all">Entire College (All)</option>
                      <option value="all-faculty">All Faculty members</option>
                      <option value="all-students">All Students</option>
                      <option value="particular-faculty">Particular Faculty</option>
                      <option value="particular-student">Particular Student</option>
                      <option value="departments">Particular Department(s)</option>
                      <option value="divisions">Particular Division(s)</option>
                      <option value="academic-year">Particular Academic Year(s)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Scope selection renderers */}
                {(targetType === "particular-faculty" || targetType === "particular-student") && (
                  <div className="form-input-control searchable-tags-wrapper">
                    <label>Search and select {targetType === "particular-faculty" ? "Faculty" : "Student"}</label>
                    <div className="tags-input-container">
                      <div className="tags-list">
                        {targetType === "particular-faculty" ? (
                          targetFaculties.map(f => (
                            <span key={f.username} className="tag-node">
                              {f.name} <button type="button" onClick={() => handleRemoveTargetTag(f.username, "faculty")}>&times;</button>
                            </span>
                          ))
                        ) : (
                          targetStudents.map(s => (
                            <span key={s.enrollmentNo} className="tag-node">
                              {s.name} <button type="button" onClick={() => handleRemoveTargetTag(s.enrollmentNo, "student")}>&times;</button>
                            </span>
                          ))
                        )}
                      </div>
                      <input 
                        type="text" 
                        placeholder={targetType === "particular-faculty" ? "Type faculty name..." : "Type student name..."}
                        value={searchQuery}
                        onChange={(e) => handleSearchTarget(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="search-dropdown-menu office-scrollable">
                        {searchResults.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="search-result-item"
                            onClick={() => handleAddTargetTag(item)}
                          >
                            {targetType === "particular-faculty" ? (
                              <span><strong>{item.fullName}</strong> ({item.employeeId}) - <small>{item.department?.name}</small></span>
                            ) : (
                              <span><strong>{item.studentName}</strong> ({item.enrollmentNo}) - <small>Div {item.division}</small></span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {searchLoading && <div className="searching-indicator">Searching...</div>}
                  </div>
                )}

                {targetType === "departments" && (
                  <div className="form-input-control">
                    <label>Select Department(s)</label>
                    <div className="checkboxes-selection-box office-scrollable">
                      {targetOptions.departments.map(dept => (
                        <label key={dept._id} className="checkbox-node">
                          <input 
                            type="checkbox"
                            checked={targetDepartments.includes(dept._id)}
                            onChange={() => handleCheckboxToggle(dept._id, targetDepartments, setTargetDepartments)}
                            disabled={loading}
                          />
                          <span>{dept.name} ({dept.code})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {targetType === "divisions" && (
                  <div className="form-input-control">
                    <label>Select Division(s)</label>
                    <div className="checkboxes-selection-box office-scrollable">
                      {targetOptions.divisions.map(div => (
                        <label key={div._id} className="checkbox-node">
                          <input 
                            type="checkbox"
                            checked={targetDivisions.includes(div._id)}
                            onChange={() => handleCheckboxToggle(div._id, targetDivisions, setTargetDivisions)}
                            disabled={loading}
                          />
                          <span>Division {div.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {targetType === "academic-year" && (
                  <div className="form-input-control">
                    <label>Select Academic Year(s)</label>
                    <div className="checkboxes-selection-box office-scrollable">
                      {targetOptions.academicYears.map(year => (
                        <label key={year} className="checkbox-node">
                          <input 
                            type="checkbox"
                            checked={targetAcademicYears.includes(year)}
                            onChange={() => handleCheckboxToggle(year, targetAcademicYears, setTargetAcademicYears)}
                            disabled={loading}
                          />
                          <span>Academic Year {year}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduling Section */}
                <div className="scheduling-section-wrapper">
                  <div className="form-input-control checkbox-instant">
                    <label className="checkbox-node">
                      <input 
                        type="checkbox"
                        checked={sendInstantly}
                        onChange={(e) => {
                          setSendInstantly(e.target.checked);
                          if (e.target.checked) setScheduledAt("");
                        }}
                        disabled={loading}
                      />
                      <span>Send Notice Instantly</span>
                    </label>
                  </div>

                  {!sendInstantly && (
                    <div className="form-input-control">
                      <label>Schedule Release Date <span className="req">*</span></label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="form-input-control">
                    <label>Expiration Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Rich Editor content section */}
                <div className="form-input-control margin-top-md">
                  <label>Announcement Details <span className="req">*</span></label>
                  <div className="rich-editor-editor-card">
                    <div className="rich-editor-toolbar-row">
                      <button type="button" onClick={() => applyFormat("bold")} title="Bold"><b>B</b></button>
                      <button type="button" onClick={() => applyFormat("italic")} title="Italic"><i>I</i></button>
                      <button type="button" onClick={() => applyFormat("underline")} title="Underline"><u>U</u></button>
                      <button type="button" onClick={() => applyFormat("strikeThrough")} title="Strikethrough"><strike>S</strike></button>
                      <div className="toolbar-divider" />
                      <button type="button" onClick={() => applyFormat("justifyLeft")} title="Align Left">Align L</button>
                      <button type="button" onClick={() => applyFormat("justifyCenter")} title="Align Center">Center</button>
                      <button type="button" onClick={() => applyFormat("justifyRight")} title="Align Right">Align R</button>
                      <div className="toolbar-divider" />
                      <button type="button" onClick={() => applyFormat("insertUnorderedList")} title="Bullet List">• List</button>
                      <button type="button" onClick={() => applyFormat("insertOrderedList")} title="Numbered List">1. List</button>
                      <div className="toolbar-divider" />
                      <button type="button" onClick={insertLink} title="Insert Link">🔗 Link</button>
                      <input type="color" onChange={changeColor} className="color-picker-input" title="Text Color" />
                    </div>
                    <div
                      ref={editorRef}
                      className="rich-editor-sheet-area office-scrollable"
                      contentEditable
                      onInput={handleEditorInput}
                      data-placeholder="Type announcement details here..."
                    />
                  </div>
                </div>

                {/* Existing Attachments for Edit Mode */}
                {editingId && existingAttachments.length > 0 && (
                  <div className="uploading-files-list">
                    <h5>Current Attachments</h5>
                    {existingAttachments.map((att, idx) => (
                      <div key={idx} className="file-list-node existing">
                        <span>📎 {att.filename} ({(att.size / 1024).toFixed(1)} KB)</span>
                        <button type="button" onClick={() => handleRemoveExistingAttachment(idx)} disabled={loading}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attachments Section */}
                <div className="form-input-control">
                  <label>Attachments (Optional)</label>
                  <div className="attachments-drop-zone" onClick={() => document.getElementById("file-input-id").click()}>
                    <input 
                      type="file" 
                      id="file-input-id"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                    <div className="drop-zone-label">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="attachment-svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L6.5 14.5m11.864-8.864a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728z" />
                        </svg>
                        Click to select and attach files (PDF, images, doc, excel)
                      </span>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="uploading-files-list">
                      <h5>Files to Upload</h5>
                      {attachments.map((file, idx) => (
                        <div key={idx} className="file-list-node">
                          <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          <button type="button" onClick={() => handleRemoveFile(idx)} disabled={loading}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-dialog-footer">
                <button
                  className="wizard-btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="wizard-btn-primary"
                  onClick={handleSaveNotice}
                  disabled={loading}
                >
                  {loading ? "Publishing..." : editingId ? "Save Changes" : "Publish Announcement"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
};

export default Notices;
