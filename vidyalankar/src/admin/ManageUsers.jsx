import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils.jsx';
import { config } from '../config/api';
import './AdminPanel.css';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    role: 'faculty'
  });
  
  // Get admin's institution from localStorage
  const adminInstitution = localStorage.getItem('college') || 'VP';

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return; // prevent duplicate fetches in StrictMode
    didInitRef.current = true;
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filter when filter or users change
    if (filter === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === filter));
    }
  }, [filter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(config.admin.getUsers(adminInstitution));
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showErrorAlert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.username,
      department: user.department || '',
      role: user.role
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        config.admin.updateUser(editingUser._id),
        {
          fullName: editForm.fullName,
          department: editForm.department,
          role: editForm.role
        }
      );
      
      if (response.data.success) {
        showSuccessAlert(response.data.message);
        setEditingUser(null);
        fetchUsers(); // Refresh the user list
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showErrorAlert('Failed to update user');
    }
  };

  const handleDeleteClick = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await axios.delete(config.admin.deleteUser(userId));
        if (response.data.success) {
          showSuccessAlert(response.data.message);
          fetchUsers(); // Refresh the user list
        } else {
          showErrorAlert(response.data.message);
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        showErrorAlert('Failed to delete user');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'faculty': return 'Faculty';
      case 'office': return 'Office Staff';
      default: return role;
    }
  };

  const getDepartmentDisplayName = (dept) => {
    switch (dept) {
      case 'CO': return 'Computer Engineering';
      case 'IF': return 'Information Technology';
      case 'EJ': return 'Electronics & Telecommunication';
      default: return dept;
    }
  };

  const redirectToFacultyDashboard = () => {
    navigate('/faculty-dashboard');
  };

  return (
    <div className="admin-panel-layout">
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Manage Users</h2>
            <p className="panel-subtitle">View, edit, or delete faculty and office staff accounts for {adminInstitution}</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn-secondary-ghost" onClick={redirectToFacultyDashboard}>
              <i className="bi bi-speedometer2" style={{marginRight: 6}}></i>
              Faculty Dashboard
            </button>
            <button className="btn-secondary-ghost" onClick={() => navigate('/admin-dashboard')}>
              <i className="bi bi-arrow-left" style={{marginRight: 6}}></i>
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <div className="panel-body">
          {/* Filter Controls */}
          <div className="filter-controls mb-4">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleFilterChange('all')}
              >
                All Users
              </button>
              <button
                type="button"
                className={`btn ${filter === 'faculty' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleFilterChange('faculty')}
              >
                Faculty Only
              </button>
              <button
                type="button"
                className={`btn ${filter === 'office' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleFilterChange('office')}
              >
                Office Staff Only
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!loading && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Institution</th>
                    <th>Department</th>
                    <th>User Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td>{user.college}</td>
                        <td>{getDepartmentDisplayName(user.department) || 'N/A'}</td>
                        <td>{getRoleDisplayName(user.role)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditClick(user)}
                            >
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClick(user._id)}
                            >
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit User</h5>
                    <button type="button" className="btn-close" onClick={handleCancelEdit}></button>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fullName"
                          value={editForm.fullName}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">User Type</label>
                        <select
                          className="form-select"
                          name="role"
                          value={editForm.role}
                          onChange={handleEditChange}
                          required
                        >
                          <option value="faculty">Faculty</option>
                          <option value="office">Office Staff</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Department</label>
                        <select
                          className="form-select"
                          name="department"
                          value={editForm.department}
                          onChange={handleEditChange}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="CO">Computer Engineering (CO)</option>
                          <option value="IF">Information Technology (IF)</option>
                          <option value="EJ">Electronics & Telecommunication (EJ)</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;