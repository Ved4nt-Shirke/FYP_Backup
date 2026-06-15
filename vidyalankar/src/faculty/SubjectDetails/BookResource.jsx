import React, { useState, useEffect } from 'react';
import { bookResourcesApi, getCurrentCiannId, handleApiError } from './api/subjectDetailsApi';

export default function BookResource() {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Textbook',
    author: '',
    publisher: '',
    edition: '',
    module: '',
    isbn: '',
    year: '',
    pages: '',
    availability: 'Library'
  });
  const [submittedData, setSubmittedData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadBookResources();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showModal]);

  const loadBookResources = async () => {
    try {
      setLoading(true);
      const ciannId = getCurrentCiannId();
      if (!ciannId) {
        setError('No CIANN ID found. Please select a course first.');
        return;
      }
      
      const resources = await bookResourcesApi.getAll(ciannId);
      setSubmittedData(resources);
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load book resources'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const ciannId = getCurrentCiannId();
      if (!ciannId) {
        setError('No CIANN ID found. Please select a course first.');
        return;
      }

      const dataToSubmit = { ...formData, ciannId };
      
      if (editingId) {
        await bookResourcesApi.update(editingId, dataToSubmit);
      } else {
        await bookResourcesApi.create(dataToSubmit);
      }
      
      await loadBookResources(); // Reload data
      resetForm();
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to save book resource'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setFormData({
      title: resource.title || '',
      type: resource.type || 'Textbook',
      author: resource.author || '',
      publisher: resource.publisher || '',
      edition: resource.edition || '',
      module: resource.module || '',
      isbn: resource.isbn || '',
      year: resource.year || '',
      pages: resource.pages || '',
      availability: resource.availability || 'Library'
    });
    setEditingId(resource._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book resource?')) {
      return;
    }
    
    try {
      setLoading(true);
      await bookResourcesApi.delete(id);
      await loadBookResources(); // Reload data
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to delete book resource'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Textbook',
      author: '',
      publisher: '',
      edition: '',
      module: '',
      isbn: '',
      year: '',
      pages: '',
      availability: 'Library'
    });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <>
      <style>{`
        /* Styles adapted from KnowledgeMap component for a modern UI */
        .book-resource-container {
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          color: #333;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .title-container .title {
          margin: 0 0 5px 0;
          font-weight: 700;
          font-size: 2rem;
          color: #28a745;
        }

        .title-container .subtitle {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #555;
        }

        .button {
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover {
          background-color: #43A047;
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          /* FIX: Removed 'table-layout: fixed' to allow for proportional column widths */
        }
        th, td {
          border: 1px solid #e0e0e0 
          font-size: 13px;
          text-align: center;
          vertical-align: middle;
          word-wrap: break-word;
        }
        th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }
        tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        tbody tr:hover {
          background-color: #f5f5f5;
        }

        /* All modal, form, and button styles remain the same */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 800px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff; color: #333; padding: 15px 25px;
          font-size: 20px; font-weight: 600; display: flex;
          justify-content: space-between; align-items: center;
          border-bottom: 1px solid #eee;
        }
        .modal-header button {
          background: none; border: none; color: #999;
          font-size: 28px; cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .modal-header button:hover {
          color: #dc3545; transform: rotate(90deg);
        }
        .modal-body {
          padding: 25px; max-height: 70vh; overflow-y: auto;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .form-control, .form-select {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ddd; border-radius: 8px;
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus, .form-select:focus {
          outline: none; border-color: #81c784;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.2);
        }

        .btn-row {
          display: flex; justify-content: flex-end; gap: 15px;
          padding: 20px 25px; background: #f8f9fa;
          border-top: 1px solid #eee; margin-top: 25px;
        }
        .btn-save, .btn-cancel {
          color: white; border: none; padding: 10px 25px;
          border-radius: 8px; cursor: pointer; font-size: 15px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn-save { background-color: #4CAF50; }
        .btn-cancel { background-color: #6c757d; }
        .btn-save:hover { background-color: #43A047; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
        .btn-cancel:hover { background-color: #5a6268; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.15); }

        @media (max-width: 768px) {
          .book-resource-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title-container .title { font-size: 1.7rem; }
          .button { width: 100%; }
        }
          /* --- ADD THESE STYLES FOR SPECIFIC COLUMNS --- */

/* Target the 6th column (Edition) */
.book-table th:nth-child(6),
.book-table td:nth-child(6) {
padding: 10px;
}

/* Target the 7th column (Module) */
.book-table th:nth-child(7),
.book-table td:nth-child(7) {
  padding: 10px;
}
    
      `}</style>

      <div className="book-resource-container">
        <div className="header-row">
          <div className="title-container">
            <h2 className="title">3.13 Teaching Resources</h2>
            <p className="subtitle">3.13.1 List of Text (T), Reference (R), and E-Books (E)</p>
          </div>
          <button className="button" onClick={() => setShowModal(true)} disabled={loading}>
            {loading ? 'Loading...' : 'Add Book'}
          </button>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {loading && submittedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading book resources...
          </div>
        ) : (
          <table className='book-table'>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="table-row">
                <th>Sr. No.</th>
                <th>Book Title</th>
                <th>Type</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Edition</th>
                <th>Module</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submittedData.length > 0 ? (
                submittedData.map((data, index) => (
                  <tr key={data._id || index}>
                    <td>{index + 1}</td>
                    <td>{data.title}</td>
                    <td>{data.type}</td>
                    <td>{data.author}</td>
                    <td>{data.publisher}</td>
                    <td>{data.edition}</td>
                    <td>{data.module}</td>
                    <td>{data.availability}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(data)}
                        style={{ 
                          background: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          marginRight: '4px',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(data._id)}
                        style={{ 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No books have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        </div>

        {/* The modal JSX remains unchanged */}
        {showModal && (
          <div className="modal-overlay" onClick={() => resetForm()}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>{editingId ? 'Edit Teaching Resource' : 'Add New Teaching Resource'}</span>
                <button onClick={() => resetForm()}>&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <input 
                      type="text" 
                      name="title" 
                      placeholder="Book Title" 
                      className="form-control" 
                      value={formData.title} 
                      onChange={handleChange} 
                      required 
                    />
                    <input 
                      type="text" 
                      name="author" 
                      placeholder="Author" 
                      className="form-control" 
                      value={formData.author} 
                      onChange={handleChange} 
                      required 
                    />
                    <select name="type" className="form-select" value={formData.type} onChange={handleChange} required>
                      <option value="">Select Type</option>
                      <option value="Textbook">Textbook</option>
                      <option value="Reference Book">Reference Book</option>
                      <option value="E-book">E-book</option>
                      <option value="Journal">Journal</option>
                      <option value="Other">Other</option>
                    </select>
                    <input 
                      type="text" 
                      name="publisher" 
                      placeholder="Publisher" 
                      className="form-control" 
                      value={formData.publisher} 
                      onChange={handleChange} 
                      required 
                    />
                    <input 
                      type="text" 
                      name="edition" 
                      placeholder="Edition" 
                      className="form-control" 
                      value={formData.edition} 
                      onChange={handleChange} 
                    />
                    <input 
                      type="text" 
                      name="module" 
                      placeholder="Module No." 
                      className="form-control" 
                      value={formData.module} 
                      onChange={handleChange} 
                    />
                    <input 
                      type="text" 
                      name="isbn" 
                      placeholder="ISBN (Optional)" 
                      className="form-control" 
                      value={formData.isbn} 
                      onChange={handleChange} 
                    />
                    <input 
                      type="number" 
                      name="year" 
                      placeholder="Publication Year" 
                      className="form-control" 
                      value={formData.year} 
                      onChange={handleChange} 
                    />
                    <input 
                      type="text" 
                      name="pages" 
                      placeholder="Pages (e.g., 1-50)" 
                      className="form-control" 
                      value={formData.pages} 
                      onChange={handleChange} 
                    />
                    <select name="availability" className="form-select" value={formData.availability} onChange={handleChange}>
                      <option value="Library">Library</option>
                      <option value="Online">Online</option>
                      <option value="Purchase Required">Purchase Required</option>
                      <option value="Free Access">Free Access</option>
                    </select>
                  </div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn-cancel" onClick={() => resetForm()}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Saving...' : (editingId ? 'Update Resource' : 'Add Resource')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
     
    </>
  );
}
