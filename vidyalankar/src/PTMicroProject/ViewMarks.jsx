import React, { useState, useEffect } from 'react';

const ViewMarks = ({ activityType, ciannId, courseId, refreshToken, onEdit }) => {
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activityType) {
      fetchMarks();
    }
  }, [activityType, ciannId, courseId, refreshToken]);

  const fetchMarks = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const college = localStorage.getItem('college');

      const params = new URLSearchParams();
      if (college) params.append('institution', college);
      if (ciannId) params.append('ciannId', ciannId);
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(
        `/api/pt-microproject/activity/${activityType}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setMarksData(result.data || []);
      } else {
        setError('Failed to fetch marks');
        setMarksData([]);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
      setError('Error fetching marks. Please try again.');
      setMarksData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marks entry?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/pt-microproject/delete-marks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setMarksData(marksData.filter(item => item._id !== id));
        alert('Marks deleted successfully');
      } else {
        alert('Failed to delete marks');
      }
    } catch (err) {
      alert('Error deleting marks');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading marks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-secondary text-white">
        <h5 className="mb-0">
          <i className="bi bi-list-check me-2"></i>
          Previously Entered Marks - {activityType}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        {marksData.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="text-muted mt-3">No marks entered yet for this activity</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-light">
                <tr>
                  <th>CIANN</th>
                  <th>Subject</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map(item => (
                  <tr key={item._id}>
                    <td>{item.ciannId ? `CIANN-${item.ciannId}` : '-'}</td>
                    <td>{item.subjectName || '-'}</td>
                    <td>
                      <strong>{item.studentName}</strong>
                    </td>
                    <td>{item.rollNo}</td>
                    <td>
                      <span className="badge bg-success">
                        {item.marks}/{item.maxMarks || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${item.status === 'Evaluated' ? 'success' : 'info'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-info me-1"
                        title="Edit Marks"
                        onClick={() => onEdit && onEdit(item)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        title="Delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3">
          <button
            className="btn btn-secondary"
            onClick={fetchMarks}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
