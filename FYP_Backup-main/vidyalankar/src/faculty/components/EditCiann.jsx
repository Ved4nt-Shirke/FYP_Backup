import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../basic/Header';
import { config } from '../../config/api';
import { ciannUtils } from '../../utils/ciannUtils';
import CiannCollaboratorsModal from './CiannCollaboratorsModal';
import './EditCiann.css';

const EditCiann = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Academic years state
  const [selectedYear, setSelectedYear] = useState(localStorage.getItem("selectedAcademicYear") || "all");
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('my-cianns'); // 'my-cianns', 'shared-with-me', 'shared-by-me', 'requests'

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Modals state
  const [selectedCiannData, setSelectedCiannData] = useState(null);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);

  // Request access wizard state
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDirectory, setFacultyDirectory] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyCianns, setFacultyCianns] = useState([]);
  const [selectedCiannId, setSelectedCiannId] = useState('');
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

      // Fetch CIANNs
      const response = await fetch(config.cianns, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CIANNs: ${response.status}`);
      }

      const data = await response.json();
      setCiannDataList(data);

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
      const incomingRes = await ciannUtils.getIncomingShareRequests();
      setIncomingRequests(incomingRes?.incoming || []);

      // Fetch outgoing requests
      const outgoingRes = await ciannUtils.getOutgoingShareRequests();
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
        const result = await ciannUtils.fetchFacultyDirectory(facultySearch.trim());
        setFacultyDirectory(result?.faculty || []);
      } catch (err) {
        console.error('Error searching faculty directory:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [facultySearch]);

  // Fetch CIANNs owned by selected faculty
  const handleSelectFaculty = async (faculty) => {
    setSelectedFaculty(faculty);
    setFacultyCianns([]);
    setSelectedCiannId('');
    setRequestError('');
    try {
      const result = await ciannUtils.fetchCiannsByUsername(faculty.generatedUsername || faculty.username);
      setFacultyCianns(result?.cianns || []);
    } catch (err) {
      setRequestError('Failed to fetch CIANNs for selected faculty: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCiannId) {
      setRequestError('Please select a CIANN.');
      return;
    }

    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');

    try {
      const result = await ciannUtils.requestCiannAccess(parseInt(selectedCiannId, 10), requestPermission);
      setRequestSuccess(result?.message || 'Access request sent successfully.');
      setTimeout(() => {
        setShowRequestAccessModal(false);
        // Reset states
        setSelectedFaculty(null);
        setFacultySearch('');
        setFacultyCianns([]);
        setSelectedCiannId('');
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
        ? `Accept request from ${request?.requester?.username} for CIANN ${request.ciannId}?`
        : `Reject request from ${request?.requester?.username} for CIANN ${request.ciannId}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await ciannUtils.respondToShareRequest(
        request.ciannId,
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

  const getDepartment = (ciann) => {
    if (!ciann) return "N/A";
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
      const value = ciann[field];
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
      ciann?.academicInfo?.department,
      ciann?.courseDetails?.department,
      ciann?.details?.department,
      ciann?.info?.department,
      ciann?.subjectDetails?.department,
      ciann?.class?.department,
      ciann?.subject?.department,
    ];

    for (const path of nestedPaths) {
      if (path) {
        if (typeof path === "object" && path.name) return path.name;
        if (typeof path === "string" && path.trim() !== "") return path;
      }
    }
    return "N/A";
  };

  const getClassAndDiv = (ciann) => {
    if (!ciann) return "N/A";
    const deptCode = ciann.department?.code || ciann.dept?.code || ciann.departmentCode || "";
    const sem = ciann.semester || ciann.sem || "";
    const scheme = ciann.scheme || "";
    const div = ciann.division || ciann.div || "";
    if (deptCode || sem || scheme || div) {
      return `${deptCode}${sem}${scheme}${div}`.toUpperCase();
    }
    return "N/A";
  };

  const renderCiannCard = (ciannData) => {
    const ownerUsername = (ciannData?.ownerUsername || '').trim().toLowerCase();
    const accessLevel = ciannData?.accessLevel;
    const isOwner =
      accessLevel === 'owner' ||
      (!!currentUsername && ownerUsername === currentUsername);
    const isArchived = ciannData.status === 'completed' || ciannData.status === 'archived';

    return (
      <div key={ciannData._id} className="position-relative">
        {/* Share/Manage Button */}
        {isOwner && !isArchived && (
          <button
            type="button"
            className="ciann-manage-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedCiannData(ciannData);
              setShowCollaboratorsModal(true);
            }}
          >
            <i className="bi bi-people-fill me-1"></i> Manage
          </button>
        )}

        <Link
          to="/course-diary"
          state={{ ciannData: ciannData }}
          className="ciann-dashboard-card-link"
          onClick={() => {
            console.log('Selected CIAAN:', ciannData);
            setSelectedCiannData(ciannData);
            // Store CIAAN data in both sessionStorage and localStorage
            sessionStorage.setItem('currentCiannData', JSON.stringify(ciannData));
            localStorage.setItem('ciannData', JSON.stringify(ciannData));
          }}
        >
          <div className={`ciann-dashboard-card ${isArchived ? 'archived-card' : ''}`}>
            <div className="card-content">
              <i className="bi bi-journal-text ciann-icon"></i>
              <div className="ciann-id">
                CIAAN ID: {ciannData.ciannId}
                {isArchived && (
                  <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                    {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
                  </span>
                )}
              </div>
              <div className="card-text text-center">
                <strong>{ciannData.subject?.name}</strong>
                <span className="subject-code">({ciannData.subject?.code})</span>
              </div>
              <div className="card-text text-center mt-2">
                <span className="division-label">Class & Div:</span> <strong>{getClassAndDiv(ciannData)}</strong>
              </div>

              <div className="card-text text-muted small mt-auto">
                Academic Year: <strong>{ciannData.academicYear}</strong>
              </div>
              {ciannData.sharedWith && ciannData.sharedWith.length > 0 && !isArchived && (
                <div className="ciann-card-collab-stack">
                  {ciannData.sharedWith.slice(0, 3).map((share, idx) => {
                    const username = share.user?.username || share.username || (typeof share.user === 'string' ? share.user : "?");
                    const initial = username.substring(0, 2).toUpperCase();
                    return (
                      <div
                        key={idx}
                        className="ciann-card-avatar text-white fw-bold d-flex align-items-center justify-content-center"
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
                  {ciannData.sharedWith.length > 3 && (
                    <div
                      className="ciann-card-avatar text-white fw-bold d-flex align-items-center justify-content-center"
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
                      +{ciannData.sharedWith.length - 3}
                    </div>
                  )}
                </div>
              )}
              {accessLevel && accessLevel !== 'owner' && (
                <div className="ciann-access-pill text-capitalize">
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

  // Group CIANNs
  // Filter by selected academic year
  const getFilteredCianns = (list) => {
    if (!selectedYear || selectedYear === "all") return list;
    return list.filter((c) => c.academicYear === selectedYear);
  };

  const myCianns = getFilteredCianns(ciannDataList).filter(
    (c) => c.accessLevel === 'owner' || (c.ownerUsername && c.ownerUsername.trim().toLowerCase() === currentUsername)
  );

  const sharedWithMe = getFilteredCianns(ciannDataList).filter(
    (c) => c.accessLevel === 'read' || c.accessLevel === 'edit'
  );

  const sharedByMe = getFilteredCianns(ciannDataList).filter(
    (c) => (c.accessLevel === 'owner' || (c.ownerUsername && c.ownerUsername.trim().toLowerCase() === currentUsername)) &&
           c.sharedWith && c.sharedWith.length > 0
  );

  const getCiannListByTab = () => {
    switch (activeTab) {
      case 'my-cianns':
        return myCianns;
      case 'shared-with-me':
        return sharedWithMe;
      case 'shared-by-me':
        return sharedByMe;
      default:
        return [];
    }
  };

  const activeCianns = getCiannListByTab();

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

      <div className="edit-ciann-page">
        {/* Premium Banner Header */}
        <div className="edit-ciann-banner">
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
              Request CIANN Access
            </button>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="edit-ciann-tabs">
          <button
            className={`edit-ciann-tab ${activeTab === 'my-cianns' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-cianns')}
          >
            <i className="bi bi-person-workspace"></i>
            My CIANNs ({myCianns.length})
          </button>
          <button
            className={`edit-ciann-tab ${activeTab === 'shared-with-me' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared-with-me')}
          >
            <i className="bi bi-people-fill"></i>
            Shared With Me ({sharedWithMe.length})
          </button>
          <button
            className={`edit-ciann-tab ${activeTab === 'shared-by-me' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared-by-me')}
          >
            <i className="bi bi-share-fill"></i>
            Shared By Me ({sharedByMe.length})
          </button>
          <button
            className={`edit-ciann-tab ${activeTab === 'requests' ? 'active' : ''}`}
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
              {activeCianns.filter(c => c.status !== 'completed' && c.status !== 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {activeCianns
                    .filter(c => c.status !== 'completed' && c.status !== 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert">
                  <i className="bi bi-info-circle me-2"></i>No active CIANN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived / Completed Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4">
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {activeCianns.filter(c => c.status === 'completed' || c.status === 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {activeCianns
                    .filter(c => c.status === 'completed' || c.status === 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert">
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIANN workspaces in this section.
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
                          <h6 className="fw-bold mb-1 text-dark">CIAAN ID: {req.ciannId}</h6>
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
                          <h6 className="fw-bold mb-1 text-dark">CIAAN ID: {req.ciannId}</h6>
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

      {/* CIANN Collaborators Management Modal */}
      {showCollaboratorsModal && selectedCiannData && (
        <CiannCollaboratorsModal
          ciannData={selectedCiannData}
          onClose={() => {
            setShowCollaboratorsModal(false);
            setSelectedCiannData(null);
          }}
          onUpdate={fetchDashboardData}
        />
      )}

      {/* Search-Based Faculty and CIANN Access Request Modal */}
      {showRequestAccessModal && (
        <div className="ciann-modal-backdrop" onClick={() => {
          setShowRequestAccessModal(false);
          setSelectedFaculty(null);
          setFacultySearch('');
          setFacultyCianns([]);
          setSelectedCiannId('');
          setRequestError('');
          setRequestSuccess('');
        }}>
          <div className="ciann-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ciann-modal-content">
              <div className="modal-header bg-dark text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <h5 className="modal-title fw-bold mb-0">
                  <i className="bi bi-search me-2 text-info"></i>
                  Request CIANN Access
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowRequestAccessModal(false);
                    setSelectedFaculty(null);
                    setFacultySearch('');
                    setFacultyCianns([]);
                    setSelectedCiannId('');
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
                  /* Step 2: Choose CIANN and Permission */
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
                            setFacultyCianns([]);
                            setSelectedCiannId('');
                          }}
                        >
                          Change Teacher
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark mb-2">Select CIANN Workspace</label>
                      {facultyCianns.length > 0 ? (
                        <select
                          className="form-select"
                          value={selectedCiannId}
                          onChange={(e) => setSelectedCiannId(e.target.value)}
                          required
                        >
                          <option value="">-- Select CIANN --</option>
                          {facultyCianns.map((c) => (
                            <option key={c.ciannId} value={c.ciannId}>
                              CIANN ID: {c.ciannId} - {c.subject?.name || 'Subject'} ({c.subject?.code || 'N/A'}) - Div: {c.division}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-danger small py-2">
                          <i className="bi bi-info-circle me-1"></i>
                          This teacher does not own any CIANN workspaces yet.
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
                          setFacultyCianns([]);
                          setSelectedCiannId('');
                          setRequestError('');
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4 fw-semibold rounded-pill"
                        disabled={requestLoading || !selectedCiannId}
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

export default EditCiann;