import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../basic/Header';
import { config } from '../../config/api';
import { CiaanUtils } from '../../utils/ciannUtils';
import CiaanCollaboratorsModal from './CiannCollaboratorsModal';
import './EditCiann.css';

const EditCiaan = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Academic years state
  const [selectedYear, setSelectedYear] = useState(localStorage.getItem("selectedAcademicYear") || "all");

  // Tabs state
  const [activeTab, setActiveTab] = useState('my-Ciaans'); // 'my-Ciaans', 'shared-with-me', 'shared-by-me', 'requests'

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Modals state
  const [selectedCiaanData, setSelectedCiaanData] = useState(null);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);

  // Request access wizard state
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDirectory, setFacultyDirectory] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyCiaans, setFacultyCiaans] = useState([]);
  const [selectedCiaanId, setSelectedCiaanId] = useState('');
  const [requestPermission, setRequestPermission] = useState('read');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const currentUsername = (localStorage.getItem('username') || '').trim().toLowerCase();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login first.');
        setLoading(false);
        return;
      }

      // Fetch Ciaans
      const response = await fetch(config.Ciaans, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Ciaans: ${response.status}`);
      }

      const data = await response.json();
      setCiaanDataList(data);

      // Initialize selected year from localStorage
      const savedYear = localStorage.getItem("selectedAcademicYear");
      if (savedYear && savedYear !== "all") {
        setSelectedYear(savedYear);
      } else {
        try {
          const activeRes = await fetch(config.academicYear.current, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const activeData = await activeRes.json();
          if (activeData.success && activeData.academicYear) {
            setSelectedYear(activeData.academicYear.yearName);
            localStorage.setItem("selectedAcademicYear", activeData.academicYear.yearName);
          }
        } catch (err) {
          console.error("Error fetching current year in EditCiann:", err);
        }
      }

      // Fetch incoming requests
      const incomingRes = await CiaanUtils.getIncomingShareRequests();
      setIncomingRequests(incomingRes?.incoming || []);

      // Fetch outgoing requests
      const outgoingRes = await CiaanUtils.getOutgoingShareRequests();
      setOutgoingRequests(outgoingRes?.outgoing || []);
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleYearChange = (e) => {
      setSelectedYear(e.detail);
    };
    window.addEventListener("academicYearChanged", handleYearChange);
    return () => {
      window.removeEventListener("academicYearChanged", handleYearChange);
    };
  }, []);

  // Search faculty directory debounced
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!facultySearch.trim()) {
        setFacultyDirectory([]);
        return;
      }
      try {
        const result = await CiaanUtils.fetchFacultyDirectory(facultySearch.trim());
        setFacultyDirectory(result?.faculty || []);
      } catch (err) {
        console.error('Error searching faculty directory:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [facultySearch]);

  // Fetch CIAANs owned by selected faculty
  const handleSelectFaculty = async (faculty) => {
    setSelectedFaculty(faculty);
    setFacultyCiaans([]);
    setSelectedCiaanId('');
    setRequestError('');
    try {
      const result = await CiaanUtils.fetchCiaansByUsername(faculty.generatedUsername || faculty.username);
      setFacultyCiaans(result?.Ciaans || []);
    } catch (err) {
      setRequestError('Failed to fetch Ciaans for selected faculty: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCiaanId) {
      setRequestError('Please Select a CIAAN.');
      return;
    }

    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');

    try {
      const result = await CiaanUtils.requestCiaanAccess(parseInt(selectedCiaanId, 10), requestPermission);
      setRequestSuccess(result?.message || 'Access request sent successfully.');
      setTimeout(() => {
        setShowRequestAccessModal(false);
        // Reset states
        setSelectedFaculty(null);
        setFacultySearch('');
        setFacultyCiaans([]);
        setSelectedCiaanId('');
        setRequestSuccess('');
      }, 1500);
      fetchDashboardData();
    } catch (err) {
      setRequestError(err?.response?.data?.message || err.message || 'Failed to request access.');
    } finally {
      setRequestLoading(false);
    }
  };

  const respondToRequest = async (request, action) => {
    const confirmMessage =
      action === 'accept'
        ? `Accept request from ${request?.requester?.username} for Ciaan ${request.CiaanId}?`
        : `Reject request from ${request?.requester?.username} for Ciaan ${request.CiaanId}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await CiaanUtils.respondToShareRequest(
        request.CiaanId,
        request.requestId,
        action,
      );
      alert(result?.message || `Request ${action}ed successfully.`);
      fetchDashboardData();
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      alert('Failed to process request: ' + message);
    }
  };

  const getDepartment = (Ciaan) => {
    if (!Ciaan) return "N/A";
    const possibleFields = [
      "department",
      "dept",
      "departmentName",
      "Department",
      "DEPARTMENT",
      "branch",
      "Branch",
      "stream",
      "Stream",
      "course",
      "Course",
    ];

    for (const field of possibleFields) {
      const value = Ciaan[field];
      if (value) {
        if (typeof value === "object") {
          if (value.name) return value.name;
          if (value.departmentName) return value.departmentName;
          if (value.department) return value.department;
          if (value.value) return value.value;
        } else if (typeof value === "string" && value.trim() !== "") {
          return value;
        }
      }
    }

    const nestedPaths = [
      Ciaan?.academicInfo?.department,
      Ciaan?.courseDetails?.department,
      Ciaan?.details?.department,
      Ciaan?.info?.department,
      Ciaan?.subjectDetails?.department,
      Ciaan?.class?.department,
      Ciaan?.subject?.department,
    ];

    for (const path of nestedPaths) {
      if (path) {
        if (typeof path === "object" && path.name) return path.name;
        if (typeof path === "string" && path.trim() !== "") return path;
      }
    }
    return "N/A";
  };

  const getClassAndDiv = (Ciaan) => {
    if (!Ciaan) return "N/A";
    const deptCode = Ciaan.department?.code || Ciaan.dept?.code || Ciaan.departmentCode || "";
    const sem = Ciaan.semester || Ciaan.sem || "";
    const scheme = Ciaan.scheme || "";
    const div = Ciaan.division || Ciaan.div || "";
    if (deptCode || sem || scheme || div) {
      return `${deptCode}${sem}${scheme}${div}`.toUpperCase();
    }
    return "N/A";
  };

  const renderCiaanCard = (CiaanData) => {
    const ownerUsername = (CiaanData?.ownerUsername || '').trim().toLowerCase();
    const accessLevel = CiaanData?.accessLevel;
    const isOwner =
      accessLevel === 'owner' ||
      (!!currentUsername && ownerUsername === currentUsername);
    const isArchived = CiaanData.status === 'completed' || CiaanData.status === 'archived';

    return (
      <div key={CiaanData._id} className="position-relative">
        {/* Share/Manage Button */}
        {isOwner && !isArchived && (
          <button
            type="button"
            className="Ciaan-manage-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedCiaanData(CiaanData);
              setShowCollaboratorsModal(true);
            }}
          >
            <i className="bi bi-people-fill me-1"></i> Manage
          </button>
        )}

        <Link
          to="/course-diary"
          state={{ CiaanData: CiaanData }}
          className="Ciaan-dashboard-card-link"
          onClick={() => {
            console.log('Selected CIAAN:', CiaanData);
            setSelectedCiaanData(CiaanData);
            // Store CIAAN data in both sessionStorage and localStorage
            sessionStorage.setItem('currentCiaanData', JSON.stringify(CiaanData));
            localStorage.setItem('CiaanData', JSON.stringify(CiaanData));
          }}
        >
          <div className={`Ciaan-dashboard-card ${isArchived ? 'archived-card' : ''}`}>
            <div className="card-content">
              <i className="bi bi-journal-text Ciaan-icon"></i>
              <div className="Ciaan-id">
                CIAAN ID: {CiaanData.CiaanId}
                {isArchived && (
                  <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                    {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
                  </span>
                )}
              </div>
              <div className="card-text text-center">
                <strong>{CiaanData.subject?.name}</strong>
                <span className="subject-code">({CiaanData.subject?.code})</span>
              </div>
              <div className="card-text text-center mt-2">
                <span className="division-label">Class & Div:</span> <strong>{getClassAndDiv(CiaanData)}</strong>
              </div>

              <div className="card-text text-muted small mt-auto">
                Academic Year: <strong>{CiaanData.academicYear}</strong>
              </div>
              {CiaanData.sharedWith && CiaanData.sharedWith.length > 0 && !isArchived && (
                <div className="Ciaan-card-collab-stack">
                  {CiaanData.sharedWith.slice(0, 3).map((share, idx) => {
                    const username = share.user?.username || share.username || (typeof share.user === 'string' ? share.user : "?");
                    const initial = username.substring(0, 2).toUpperCase();
                    return (
                      <div
                        key={idx}
                        className="Ciaan-card-avatar text-white fw-bold d-flex align-items-center justify-content-center"
                        title={`${username} (${share.permission || 'read'})`}
                        style={{
                          backgroundColor: share.permission === 'edit' ? '#f59e0b' : '#3b82f6',
                          width: '24px',
                          height: '24px',
                          fontSize: '0.65rem',
                          borderRadius: '50%',
                          border: '2px solid white',
                          marginLeft: idx > 0 ? '-6px' : '0',
                          zIndex: 10 - idx
                        }}
                      >
                        {initial}
                      </div>
                    );
                  })}
                  {CiaanData.sharedWith.length > 3 && (
                    <div
                      className="Ciaan-card-avatar text-white fw-bold d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#64748b',
                        width: '24px',
                        height: '24px',
                        fontSize: '0.65rem',
                        borderRadius: '50%',
                        border: '2px solid white',
                        marginLeft: '-6px',
                        zIndex: 5
                      }}
                    >
                      +{CiaanData.sharedWith.length - 3}
                    </div>
                  )}
                </div>
              )}
              {accessLevel && accessLevel !== 'owner' && (
                <div className="Ciaan-access-pill text-capitalize">
                  <i className="bi bi-shield-lock me-1"></i>
                  Access: {accessLevel}
                </div>
              )}
            </div>
            <div className="card-hover-text">
              {isArchived ? 'Click to View / Print' : 'Click to Edit'}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // Group Ciaans
  // Filter by selected academic year
  const getFilteredCiaans = (list) => {
    if (!selectedYear || selectedYear === "all") return list;
    return list.filter((c) => c.academicYear === selectedYear);
  };

  const myCiaans = getFilteredCiaans(CiaanDataList).filter(
    (c) => c.accessLevel === 'owner' || (c.ownerUsername && c.ownerUsername.trim().toLowerCase() === currentUsername)
  );

  const sharedWithMe = getFilteredCiaans(CiaanDataList).filter(
    (c) => c.accessLevel === 'read' || c.accessLevel === 'edit'
  );

  const sharedByMe = getFilteredCiaans(CiaanDataList).filter(
    (c) => (c.accessLevel === 'owner' || (c.ownerUsername && c.ownerUsername.trim().toLowerCase() === currentUsername)) &&
      c.sharedWith && c.sharedWith.length > 0
  );

  const getCiaanListByTab = () => {
    switch (activeTab) {
      case 'my-Ciaans':
        return myCiaans;
      case 'shared-with-me':
        return sharedWithMe;
      case 'shared-by-me':
        return sharedByMe;
      default:
        return [];
    }
  };

  const activeCiaans = getCiaanListByTab();

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-Ciaan-page">
        {/* Premium Banner Header */}
        <div className="edit-Ciaan-banner">
          <div className="banner-content">
            <h1 className="banner-title">
              <i className="bi bi-folder-fill text-warning me-2"></i>
              CIAAN Workspaces
            </h1>
            <p className="banner-subtitle">
              Manage your Curriculum Implementation and Assessment Norms, co-faculty, and shared collaborative access.
            </p>
          </div>
          <div className="banner-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-premium-request"
              onClick={() => setShowRequestAccessModal(true)}
            >
              <i className="bi bi-search"></i>
              Request Ciaan Access
            </button>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="edit-Ciaan-tabs">
          <button
            className={`edit-Ciaan-tab ${activeTab === 'my-Ciaans' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-Ciaans')}
          >
            <i className="bi bi-person-workspace"></i>
            My CIAANs ({myCiaans.length})
          </button>
          <button
            className={`edit-Ciaan-tab ${activeTab === 'shared-with-me' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared-with-me')}
          >
            <i className="bi bi-people-fill"></i>
            Shared With Me ({sharedWithMe.length})
          </button>
          <button
            className={`edit-Ciaan-tab ${activeTab === 'shared-by-me' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared-by-me')}
          >
            <i className="bi bi-share-fill"></i>
            Shared By Me ({sharedByMe.length})
          </button>
          <button
            className={`edit-Ciaan-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="bi bi-clock-history"></i>
            Pending Requests ({incomingRequests.length + outgoingRequests.length})
          </button>
        </div>

        {/* Dashboard Content */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : activeTab !== 'requests' ? (
          <div>
            {/* Active Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-primary mb-4">
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCiaans.filter(c => c.status !== 'completed' && c.status !== 'archived').length > 0 ? (
                <div className="Ciaan-card-container">
                  {activeCiaans
                    .filter(c => c.status !== 'completed' && c.status !== 'archived')
                    .map(CiaanData => renderCiaanCard(CiaanData))}
                </div>
              ) : (
                <div className="no-workspaces-alert">
                  <i className="bi bi-info-circle me-2"></i>No active CIAAN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived / Completed Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4">
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {activeCiaans.filter(c => c.status === 'completed' || c.status === 'archived').length > 0 ? (
                <div className="Ciaan-card-container">
                  {activeCiaans
                    .filter(c => c.status === 'completed' || c.status === 'archived')
                    .map(CiaanData => renderCiaanCard(CiaanData))}
                </div>
              ) : (
                <div className="no-workspaces-alert">
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIAAN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Pending Requests Tab */
          <div className="container py-2">
            {/* Incoming Requests */}
            <div className="card border-0 shadow-sm mb-4 rounded-3">
              <div className="card-header bg-success text-white py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-box-arrow-in-down me-2"></i>
                  Incoming Access Requests ({incomingRequests.length})
                </h5>
              </div>
              <div className="card-body p-4">
                {incomingRequests.length > 0 ? (
                  <div className="requests-grid">
                    {incomingRequests.map((req) => (
                      <div key={req.requestId} className="request-card">
                        <div>
                          <div className="request-card-header">
                            <span className="badge bg-info text-capitalize">{req.permission} Access</span>
                            <span className="text-muted small">{new Date(req.requestedAt).toLocaleDateString()}</span>
                          </div>
                          <h6 className="fw-bold mb-1 text-dark">CIAAN ID: {req.CiaanId}</h6>
                          <p className="small mb-2 text-muted">
                            {req.subject?.name} ({req.subject?.code}) - Div: {req.division}
                          </p>
                          <div className="request-card-body">
                            From faculty: <strong>{req.requester?.username}</strong>
                          </div>
                        </div>
                        <div className="request-card-actions">
                          <button
                            type="button"
                            className="btn-premium-accept"
                            onClick={() => respondToRequest(req, 'accept')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn-premium-reject"
                            onClick={() => respondToRequest(req, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4 my-0">No pending incoming requests.</p>
                )}
              </div>
            </div>

            {/* Outgoing Requests */}
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-box-arrow-up me-2"></i>
                  Outgoing Access Requests ({outgoingRequests.length})
                </h5>
              </div>
              <div className="card-body p-4">
                {outgoingRequests.length > 0 ? (
                  <div className="requests-grid">
                    {outgoingRequests.map((req) => (
                      <div key={req.requestId} className="request-card">
                        <div>
                          <div className="request-card-header">
                            <span className="badge bg-secondary text-capitalize">{req.permission} Requested</span>
                            <span className="text-muted small">{new Date(req.requestedAt).toLocaleDateString()}</span>
                          </div>
                          <h6 className="fw-bold mb-1 text-dark">CIAAN ID: {req.CiaanId}</h6>
                          <p className="small mb-2 text-muted">
                            {req.subject?.name} - Div: {req.division}
                          </p>
                          <div className="request-card-body">
                            Owner: <strong>{req.owner?.username}</strong>
                          </div>
                        </div>
                        <div className="mt-3 text-end">
                          <span className="badge bg-warning text-dark px-3 py-2">
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Pending Approval
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4 my-0">No pending outgoing requests.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ciaan Collaborators Management Modal */}
      {showCollaboratorsModal && selectedCiaanData && (
        <CiaanCollaboratorsModal
          CiaanData={selectedCiaanData}
          onClose={() => {
            setShowCollaboratorsModal(false);
            setSelectedCiaanData(null);
          }}
          onUpdate={fetchDashboardData}
        />
      )}

      {/* Search-Based Faculty and Ciaan Access Request Modal */}
      {showRequestAccessModal && (
        <div className="Ciaan-modal-backdrop" onClick={() => {
          setShowRequestAccessModal(false);
          setSelectedFaculty(null);
          setFacultySearch('');
          setFacultyCiaans([]);
          setSelectedCiaanId('');
          setRequestError('');
          setRequestSuccess('');
        }}>
          <div className="Ciaan-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="Ciaan-modal-content">
              <div className="modal-header bg-dark text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <h5 className="modal-title fw-bold mb-0">
                  <i className="bi bi-search me-2 text-info"></i>
                  Request Ciaan Access
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowRequestAccessModal(false);
                    setSelectedFaculty(null);
                    setFacultySearch('');
                    setFacultyCiaans([]);
                    setSelectedCiaanId('');
                    setRequestError('');
                    setRequestSuccess('');
                  }}
                ></button>
              </div>

              <div className="modal-body p-4">
                {requestError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {requestError}
                  </div>
                )}
                {requestSuccess && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i> {requestSuccess}
                  </div>
                )}

                {!selectedFaculty ? (
                  /* Step 1: Search Faculty */
                  <div>
                    <label className="form-label fw-semibold text-dark mb-2">Search Faculty Member</label>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search by name, ID, or department..."
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                      />
                    </div>

                    {/* Faculty suggestions */}
                    {facultyDirectory.length > 0 ? (
                      <div className="list-group shadow-sm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {facultyDirectory.map((fac) => (
                          <button
                            key={fac._id || fac.generatedUsername}
                            type="button"
                            className="list-group-item list-group-item-action text-start py-3"
                            onClick={() => handleSelectFaculty(fac)}
                          >
                            <div className="fw-bold text-dark">{fac.fullName || fac.name}</div>
                            <small className="text-muted">
                              Emp ID: {fac.employeeId || 'N/A'} | Dept: {fac.departmentName || fac.department?.name || 'N/A'}
                            </small>
                          </button>
                        ))}
                      </div>
                    ) : facultySearch.trim() ? (
                      <p className="text-muted small text-center my-3">No matching faculty members found.</p>
                    ) : (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-people text-muted" style={{ fontSize: '1.5rem' }}></i>
                        <p className="mt-2">Type above to search faculty members in your college directory.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Step 2: Choose Ciaan and Permission */
                  <form onSubmit={handleRequestAccessSubmit}>
                    <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fw-bold text-dark mb-1">{selectedFaculty.fullName || selectedFaculty.name}</h6>
                          <small className="text-muted">
                            Dept: {selectedFaculty.departmentName || selectedFaculty.department?.name || 'N/A'}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedFaculty(null);
                            setFacultyCiaans([]);
                            setSelectedCiaanId('');
                          }}
                        >
                          Change Teacher
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark mb-2">Select CIAAN Workspace</label>
                      {facultyCiaans.length > 0 ? (
                        <select
                          className="form-select"
                          value={selectedCiaanId}
                          onChange={(e) => setSelectedCiaanId(e.target.value)}
                          required
                        >
                          <option value="">-- Select CIAAN --</option>
                          {facultyCiaans.map((c) => (
                            <option key={c.CiaanId} value={c.CiaanId}>
                              CIAAN ID: {c.CiaanId} - {c.subject?.name || 'Subject'} ({c.subject?.code || 'N/A'}) - Div: {c.division}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-danger small py-2">
                          <i className="bi bi-info-circle me-1"></i>
                          This teacher does not own any CIAAN workspaces yet.
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark mb-2">Request Permission Level</label>
                      <select
                        className="form-select"
                        value={requestPermission}
                        onChange={(e) => setRequestPermission(e.target.value)}
                      >
                        <option value="read">View Only (Read)</option>
                        <option value="edit">Collaborator (Edit)</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4 fw-semibold rounded-pill"
                        onClick={() => {
                          setSelectedFaculty(null);
                          setFacultyCiaans([]);
                          setSelectedCiaanId('');
                          setRequestError('');
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4 fw-semibold rounded-pill"
                        disabled={requestLoading || !selectedCiaanId}
                      >
                        {requestLoading ? (
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="bi bi-send-fill me-1"></i>
                        )}
                        Send Request
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditCiaan;