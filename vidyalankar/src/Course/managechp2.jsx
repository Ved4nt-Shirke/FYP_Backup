// managechp2.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

const ManageChapters2 = () => {
  const [chapters, setChapters] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const outletCtx = useOutletContext();
  const ciannData = outletCtx?.ciannData || JSON.parse(sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData") || "null");

  const program = ciannData?.department?.name || ciannData?.department || location.state?.program || "";
  const className = ciannData?.division || ciannData?.class || location.state?.className || "";
  const course = ciannData?.subject?.name || ciannData?.subject || location.state?.course || "";

  // --- NEW: State for the modal and form inputs ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterNo, setNewChapterNo] = useState("");
  const [newChapterName, setNewChapterName] = useState("");

  // --- EXISTING useEffect to fetch initial chapters ---
  useEffect(() => {
    if (program && className && course) {
      const fetchChapters = async () => {
        try {
          const response = await fetch("/api/course-chapters/get-chapters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ program, className, course }),
          });
          const data = await response.json();
          if (data.success) {
            setChapters(data.chp);
          } else {
            console.error("Failed to fetch chapters:", data.message);
          }
        } catch (error) {
          console.error("Error fetching chapters:", error);
        }
      };
      fetchChapters();
    }
  }, [program, className, course]);

  // --- NEW: Function to handle form submission for adding a chapter ---
  const handleAddChapter = async (event) => {
    event.preventDefault();
    if (!newChapterNo || !newChapterName) {
      alert("Please fill in both chapter number and name.");
      return;
    }

    try {
      const response = await fetch("/api/course-chapters/add-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setNewChapterNo("");
        setNewChapterName("");
      } else {
        alert(`Failed to add chapter: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding chapter:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEditClick = (chapterToEdit) => {
    navigate("/subject-details/update-chapter", {
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
    if (
      !window.confirm(
        `Are you sure you want to delete Chapter ${chapterToDelete.chapterNo}: ${chapterToDelete.chapterName}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/course-chapters/delete-chapter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
        alert("Chapter deleted successfully!");
      } else {
        alert(`Failed to delete chapter: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("An error occurred while deleting the chapter.");
    }
  };

  return (
    <div className="chapters-page-container">
      <style>{`
        .chapters-page-container {
          width: 100%;
          padding: 10px 20px 20px;
          box-sizing: border-box;
          color: var(--sd-text);
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px 20px;
          background-color: #ffffff;
          border: 1px solid var(--sd-border);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
        }

        .title-container {
          display: flex;
          flex-direction: column;
        }

        .title {
          margin: 0 0 4px 0;
          font-weight: 700;
          font-size: 1.6rem;
          color: var(--sd-primary) !important;
        }

        .subtitle {
          margin: 0;
          font-size: 0.9rem;
          color: var(--sd-muted);
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 0.88rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn-edit {
          background-color: #eef3fb;
          color: #1a56db;
          border-color: #d1e3fa;
        }

        .action-btn-edit:hover {
          background-color: #1a56db;
          color: #ffffff;
          border-color: #1a56db;
        }

        .action-btn-delete {
          background-color: #fdf2f2;
          color: #e02424;
          border-color: #fbd5d5;
          margin-left: 8px;
        }

        .action-btn-delete:hover {
          background-color: #e02424;
          color: #ffffff;
          border-color: #e02424;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--sd-border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #ffffff;
        }

        .custom-table th {
          background-color: var(--sd-primary-light) !important;
          color: var(--sd-primary) !important;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
          font-size: 0.95rem;
          border-bottom: 1px solid var(--sd-border);
        }

        .custom-table td {
          padding: 14px 16px;
          font-size: 0.92rem;
          color: var(--sd-text);
          border-bottom: 1px solid var(--sd-border);
        }

        .custom-table tbody tr:hover {
          background-color: var(--sd-bg-1) !important;
        }

        .text-center {
          text-align: center;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(16, 34, 61, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-box {
          background: #ffffff;
          border: 1px solid var(--sd-border);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(16, 34, 61, 0.25);
          overflow: hidden;
          width: min(480px, 90vw);
          animation: modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          background: var(--sd-bg-1);
          color: var(--sd-text);
          font-weight: 700;
          border-bottom: 1px solid var(--sd-border);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--sd-text);
        }

        .modal-close-btn {
          border: none;
          background: transparent;
          color: var(--sd-muted);
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          background: var(--sd-bg-1);
          border-top: 1px solid var(--sd-border);
          padding: 12px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--sd-muted);
          margin-bottom: 6px;
          text-align: left;
        }

        .form-control {
          width: 100%;
          border: 1px solid var(--sd-border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.92rem;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--sd-primary);
          box-shadow: 0 0 0 3px var(--sd-primary-light);
        }
      `}</style>

      {/* Header Row */}
      <div className="header-row">
        <div className="title-container">
          <h2 className="title">Theory Chapters</h2>
          <p className="subtitle">
            Manage course chapters for <strong>{course}</strong> ({className})
          </p>
        </div>
        <button
          className="btn button"
          onClick={() => setIsModalOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <i className="bi bi-plus-lg"></i> Add Chapter
        </button>
      </div>

      {/* Table Section */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "120px" }}>Chapter No.</th>
              <th>Chapter Name</th>
              <th className="text-center" style={{ width: "220px" }}>Setting</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <tr key={chapter.chapterNo}>
                  <td className="text-center" style={{ fontWeight: "600" }}>{chapter.chapterNo}</td>
                  <td>{chapter.chapterName}</td>
                  <td className="text-center">
                    <button
                      className="action-btn action-btn-edit"
                      title="Edit Chapter"
                      onClick={() => handleEditClick(chapter)}
                    >
                      <i className="bi bi-pencil-square"></i> Edit
                    </button>
                    <button
                      className="action-btn action-btn-delete"
                      title="Delete Chapter"
                      onClick={() => handleDeleteClick(chapter)}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center" style={{ padding: "24px", color: "var(--sd-muted)" }}>
                  No chapters found for this course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Chapter Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Chapter</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddChapter}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="chapterNo">Chapter Number</label>
                  <input
                    id="chapterNo"
                    type="number"
                    className="form-control"
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
                    className="form-control"
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    placeholder="e.g., Introduction to..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-save">
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChapters2;
