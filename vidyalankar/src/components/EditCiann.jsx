import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../basic/Header';
import { config } from '../config/api';
import { ciannUtils } from '../utils/ciannUtils';
import './EditCiann.css';

const EditCiann = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCiannData, setSelectedCiannData] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const currentUsername = (localStorage.getItem('username') || '').trim().toLowerCase();

  const fetchIncomingRequests = async () => {
    try {
      const response = await ciannUtils.getIncomingShareRequests();
      setIncomingRequests(response?.incoming || []);
    } catch (err) {
      console.error('Fetch incoming share requests error:', err);
    }
  };

  const requestCiannAccess = async () => {
    const ciannIdInput = window.prompt('Enter CIANN ID to request access:');
    const ciannId = parseInt((ciannIdInput || '').trim(), 10);

    if (!ciannId || Number.isNaN(ciannId)) {
      alert('Please enter a valid CIANN ID.');
      return;
    }

    const permissionInput = window.prompt('Request permission? Type read or edit:', 'read');
    const permission = (permissionInput || '').trim().toLowerCase();

    if (!['read', 'edit'].includes(permission)) {
      alert('Invalid permission. Please enter read or edit.');
      return;
    }

    try {
      const result = await ciannUtils.requestCiannAccess(ciannId, permission);
      alert(result?.message || 'Access request sent successfully.');
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      alert('Failed to send request: ' + message);
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
      await fetchIncomingRequests();
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      alert('Failed to process request: ' + message);
    }
  };

  const shareCiann = async (event, ciannData) => {
    event.preventDefault();
    event.stopPropagation();

    const username = window.prompt('Enter username to share this CIANN with:');
    if (!username || !username.trim()) return;

    const permissionInput = window.prompt('Permission for this user? Type read or edit:', 'read');
    const permission = (permissionInput || '').trim().toLowerCase();

    if (!['read', 'edit'].includes(permission)) {
      alert('Invalid permission. Please enter read or edit.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login first.');
        return;
      }

      const response = await fetch(`${config.cianns}/${ciannData.ciannId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim(), permission }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || `Failed to share CIANN: ${response.status}`);
      }

      alert(result.message || `CIANN shared with ${username} as ${permission}.`);
    } catch (err) {
      console.error('Share CIANN error:', err);
      alert('Failed to share CIANN: ' + err.message);
    }
  };

  const renderCiannCard = (ciannData) => {
    const ownerUsername = (ciannData?.ownerUsername || '').trim().toLowerCase();
    const accessLevel = ciannData?.accessLevel;
    const isOwner =
      accessLevel === 'owner' ||
      (!!currentUsername && ownerUsername === currentUsername);
    const isArchived = ciannData.status === 'completed' || ciannData.status === 'archived';
    const canShare =
      ciannData?.canShare === true ||
      accessLevel === 'owner' ||
      (!!currentUsername && ownerUsername === currentUsername) ||
      typeof ciannData?.canShare === 'undefined';

    return (
      <Link
        key={ciannData._id}
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
          {canShare && !isArchived && (
            <button
              type="button"
              className="ciann-share-btn"
              onClick={(event) => shareCiann(event, ciannData)}
            >
              Share
            </button>
          )}
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
            <div className="card-text">
              <strong>{ciannData.subject?.name}</strong>
              <span className="subject-code">({ciannData.subject?.code})</span>
            </div>
            <div className="card-text">
              <span className="division-label">Division:</span> <strong>{ciannData.division}</strong>
            </div>
            <div className="card-text text-muted small">
              Academic Year: <strong>{ciannData.academicYear}</strong>
            </div>
            {accessLevel && accessLevel !== 'owner' && (
              <div className="ciann-access-pill">Access: {accessLevel}</div>
            )}
          </div>
          <div className="card-hover-text">
            {isArchived ? 'Click to View / Print' : 'Click to Edit'}
          </div>
        </div>
      </Link>
    );
  };

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Authentication required. Please login first.');
          setLoading(false);
          return;
        }

        const response = await fetch(config.cianns, {
          method: 'GET',
          credentials: 'include',
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
      } catch (err) {
        console.error('Fetch CIANNs error:', err);
        alert('Failed to fetch CIANNs: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCianns();
    fetchIncomingRequests();
  }, []);

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
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">Edit CIAAN</h2>
          <div className="text-center my-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={requestCiannAccess}
            >
              Request CIANN Access
            </button>
          </div>
          {incomingRequests.length > 0 && (
            <div className="container mb-3">
              <div className="alert alert-info mb-0">
                <strong>Pending Share Requests ({incomingRequests.length})</strong>
                <div className="mt-2">
                  {incomingRequests.map((request) => (
                    <div key={request.requestId} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-white">
                      <span>
                        CIANN {request.ciannId} - {request.requester?.username} requests <strong>{request.permission}</strong> access
                      </span>
                      <span>
                        <button
                          type="button"
                          className="btn btn-sm btn-success me-2"
                          onClick={() => respondToRequest(request, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => respondToRequest(request, 'reject')}
                        >
                          Reject
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : (
          <div>
            {/* Active Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-primary mb-4" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', fontWeight: '700' }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {ciannDataList.filter(c => c.status !== 'completed' && c.status !== 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {ciannDataList
                    .filter(c => c.status !== 'completed' && c.status !== 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
                  <i className="bi bi-info-circle me-2"></i>No active CIANN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived / Completed Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', fontWeight: '700', marginTop: '2rem' }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {ciannDataList.filter(c => c.status === 'completed' || c.status === 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {ciannDataList
                    .filter(c => c.status === 'completed' || c.status === 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIANN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EditCiann;