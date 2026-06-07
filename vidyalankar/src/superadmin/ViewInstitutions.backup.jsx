import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils.jsx';

const ViewInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    adminUsername: '',
    adminPassword: '',
    superadminPassword: '',
    confirmation: ''
  });
  const [deleteFormData, setDeleteFormData] = useState({
    superadminPassword: '',
    confirmation: ''
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    // Filter institutions based on search term
    if (searchTerm) {
      const filtered = institutions.filter(institution => 
        institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.adminUsername.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInstitutions(filtered);
    } else {
      setFilteredInstitutions(institutions);
    }
  }, [searchTerm, institutions]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token retrieved from localStorage:', token);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Test if token is valid by decoding it (without verifying signature)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          setError('Token has expired. Please log in again.');
          setLoading(false);
          return;
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        setError('Invalid token format. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/superadmin/institutions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setInstitutions(response.data.institutions);
      } else {
        setError('Failed to fetch institutions');
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      console.error('Error response:', error.response);
      setError('Error fetching institutions: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInstitutions();
  };

  const handleUpdateClick = (institution) => {
    setSelectedInstitution(institution);
    setUpdateFormData({
      adminUsername: institution.adminUsername,
      adminPassword: '',
      superadminPassword: '',
      confirmation: ''
    });
    setShowUpdateModal(true);
  };

  const handleDeleteClick = (institution) => {
    setSelectedInstitution(institution);
    setDeleteFormData({
      superadminPassword: '',
      confirmation: ''
    });
    setShowDeleteModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    // Require confirmation
    if (updateFormData.confirmation !== 'CONFIRM') {
      showErrorAlert('Please type "CONFIRM" to proceed with the update');
      return;
    }
    
    // Require superadmin password
    if (!updateFormData.superadminPassword) {
      showErrorAlert('Superadmin password is required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/superadmin/update-institution-admin/${selectedInstitution._id}`, {
        adminUsername: updateFormData.adminUsername || undefined,
        adminPassword: updateFormData.adminPassword || undefined,
        superadminPassword: updateFormData.superadminPassword,
        confirmation: updateFormData.confirmation
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showSuccessAlert('Institution admin credentials updated successfully');
        setShowUpdateModal(false);
        fetchInstitutions(); // Refresh the list
      } else {
        showErrorAlert(response.data.message || 'Failed to update institution');
      }
    } catch (error) {
      console.error('Error updating institution:', error);
      showErrorAlert('Error updating institution: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    
    // Require confirmation
    if (deleteFormData.confirmation !== 'CONFIRM') {
      showErrorAlert('Please type "CONFIRM" to proceed with deletion');
      return;
    }
    
    // Require superadmin password
    if (!deleteFormData.superadminPassword) {
      showErrorAlert('Superadmin password is required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/superadmin/delete-institution/${selectedInstitution._id}`, {
        data: {
          superadminPassword: deleteFormData.superadminPassword,
          confirmation: deleteFormData.confirmation
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        showSuccessAlert(`Institution '${selectedInstitution.name}' deleted successfully`);
        setShowDeleteModal(false);
        fetchInstitutions(); // Refresh the list
      } else {
        showErrorAlert(response.data.message || 'Failed to delete institution');
      }
    } catch (error) {
      console.error('Error deleting institution:', error);
      showErrorAlert('Error deleting institution: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-0">View Institutions</h2>
                <p className="text-muted mb-0">Manage all institutions in the system</p>
              </div>
            </div>
            
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading institutions...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">View Institutions</h2>
              <p className="text-muted mb-0">Manage all institutions in the system</p>
            </div>
            <div className="d-flex gap-2">
              <div className="input-group me-2" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search institutions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-outline-primary"
                onClick={handleRefresh}
              >
                <i className="fas fa-sync-alt me-2"></i>Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError('')}></button>
            </div>
          )}
          
          {filteredInstitutions.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-university fa-3x text-muted mb-3"></i>
                <h5>No institutions found</h5>
                <p className="text-muted">
                  {searchTerm ? 
                    `No institutions match your search for "${searchTerm}".` : 
                    'Create your first institution to get started.'
                  }
                </p>
                {!searchTerm && (
                  <a href="/superadmin-create-institution" className="btn btn-primary">
                    <i className="fas fa-plus-circle me-2"></i>Create Institution
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Institutions List</h5>
                <span className="badge bg-primary">{filteredInstitutions.length} institutions</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Admin Username</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map((institution) => (
                        <tr key={institution._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-light rounded-circle p-2 me-3">
                                <i className="fas fa-graduation-cap text-primary"></i>
                              </div>
                              <div>
                                <h6 className="mb-0">{institution.name}</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{institution.code}</span>
                          </td>
                          <td>{institution.adminUsername}</td>
                          <td>{formatDate(institution.createdAt)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                title="View details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                title="Edit admin credentials"
                                onClick={() => handleUpdateClick(institution)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                title="Delete institution"
                                onClick={() => handleDeleteClick(institution)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {filteredInstitutions.length} of {institutions.length} institutions
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className="page-item disabled">
                        <a className="page-link" href="#" tabIndex="-1">Previous</a>
                      </li>
                      <li className="page-item active">
                        <a className="page-link" href="#">1</a>
                      </li>
                      <li className="page-item disabled">
                        <a className="page-link" href="#">Next</a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Admin Credentials</h5>
                <button type="button" className="btn-close" onClick={() => setShowUpdateModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Institution</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedInstitution?.name}
                      readOnly
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Current Admin Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedInstitution?.adminUsername}
                      readOnly
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">New Admin Username (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Leave blank to keep current username"
                      value={updateFormData.adminUsername}
                      onChange={(e) => setUpdateFormData({...updateFormData, adminUsername: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">New Admin Password (optional)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Leave blank to keep current password"
                      value={updateFormData.adminPassword}
                      onChange={(e) => setUpdateFormData({...updateFormData, adminPassword: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Superadmin Password <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter superadmin password"
                      required
                      value={updateFormData.superadminPassword}
                      onChange={(e) => setUpdateFormData({...updateFormData, superadminPassword: e.target.value})}
                    />
                    <div className="form-text">Required for security verification</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Confirmation <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type CONFIRM to proceed"
                      required
                      value={updateFormData.confirmation}
                      onChange={(e) => setUpdateFormData({...updateFormData, confirmation: e.target.value})}
                    />
                    <div className="form-text">Type "CONFIRM" to proceed with the update</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Credentials</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Institution</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleDeleteSubmit}>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <h5 className="alert-heading">Warning!</h5>
                    <p>You are about to permanently delete the institution <strong>{selectedInstitution?.name}</strong> and its associated admin user. This action cannot be undone.</p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Institution</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedInstitution?.name}
                      readOnly
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Superadmin Password <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter superadmin password"
                      required
                      value={deleteFormData.superadminPassword}
                      onChange={(e) => setDeleteFormData({...deleteFormData, superadminPassword: e.target.value})}
                    />
                    <div className="form-text">Required for security verification</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Confirmation <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type CONFIRM to proceed"
                      required
                      value={deleteFormData.confirmation}
                      onChange={(e) => setDeleteFormData({...deleteFormData, confirmation: e.target.value})}
                    />
                    <div className="form-text">Type "CONFIRM" to permanently delete this institution</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Delete Institution</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {(showUpdateModal || showDeleteModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default ViewInstitutions;
