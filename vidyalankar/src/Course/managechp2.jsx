// managechp2.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './managechp2.css';

const ManageChapters2 = () => {
  const [chapters, setChapters] = useState([]);
  const location = useLocation();
  // --- NEW: Initialize useNavigate ---
  const navigate = useNavigate();
  const { program, className, course } = location.state || {};

  // --- NEW: State for the modal and form inputs ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterNo, setNewChapterNo] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  
  // --- EXISTING useEffect to fetch initial chapters ---
  useEffect(() => {
    if (program && className && course) {
      const fetchChapters = async () => {
        try {
          const response = await fetch('/api/course-chapters/get-chapters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ program, className, course }),
          });
          const data = await response.json();
          if (data.success) {
            setChapters(data.chp);
          } else {
            console.error('Failed to fetch chapters:', data.message);
          }
        } catch (error) {
          console.error('Error fetching chapters:', error);
        }
      };
      fetchChapters();
    }
  }, [program, className, course]);

  // --- NEW: Function to handle form submission for adding a chapter ---
  const handleAddChapter = async (event) => {
    event.preventDefault();
    if (!newChapterNo || !newChapterName) {
      alert('Please fill in both chapter number and name.');
      return;
    }
    
    try {
      const response = await fetch('/api/course-chapters/add-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          className,
          course,
          chapterNo: newChapterNo,
          chapterName: newChapterName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChapters(data.chp); // Update UI with the new list of chapters from the server
        setIsModalOpen(false); // Close the modal
        // Reset form fields
        setNewChapterNo('');
        setNewChapterName('');
      } else {
        alert(`Failed to add chapter: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding chapter:', error);
      alert('An error occurred. Please try again.');
    }
  };

    const handleEditClick = (chapterToEdit) => {
    navigate('/update-chapter', {
      state: {
        program,
        className,
        course,
        chapter: chapterToEdit, // Pass the specific chapter object
      },
    });
  };

  // --- NEW: Function to handle chapter deletion ---
  const handleDeleteClick = async (chapterToDelete) => {
    if (!window.confirm(`Are you sure you want to delete Chapter ${chapterToDelete.chapterNo}: ${chapterToDelete.chapterName}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/course-chapters/delete-chapter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          className,
          course,
          chapterNo: chapterToDelete.chapterNo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChapters(data.chp); // Update UI with the new list of chapters from the server
        alert('Chapter deleted successfully!');
      } else {
        alert(`Failed to delete chapter: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('An error occurred while deleting the chapter.');
    }
  };

  return (
    <div className="add-chapters-container">
      <h2 className="page-title">Add/Edit Chapters for: {course}</h2>
      
      {/* Table remains the same */}
      <div className="table-wrapper">
        <table className="chapters-table">
          <thead>
            <tr>
              <th>Chapter No.</th>
              <th>Chapter Name</th>
              <th className="setting-header">Setting</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <tr key={chapter.chapterNo}>
                  <td>{chapter.chapterNo}</td>
                  <td>{chapter.chapterName}</td>
                  <td className="setting-cell">
                    <button 
                      className="edit-btn" 
                      title="Edit Chapter"
                      onClick={() => handleEditClick(chapter)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn" 
                      title="Delete Chapter"
                      onClick={() => handleDeleteClick(chapter)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No chapters found for this course.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-actions">
        {/* --- UPDATED: Button now opens the modal --- */}
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>Add Chapter</button>
      </div>

      {/* --- NEW: Add Chapter Modal --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Add New Chapter</h3>
            <form onSubmit={handleAddChapter}>
              <div className="form-group">
                <label htmlFor="chapterNo">Chapter Number</label>
                <input
                  id="chapterNo"
                  type="number"
                  value={newChapterNo}
                  onChange={(e) => setNewChapterNo(e.target.value)}
                  placeholder="e.g., 1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="chapterName">Chapter Name</label>
                <input
                  id="chapterName"
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="e.g., Introduction to..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Save Chapter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChapters2;
