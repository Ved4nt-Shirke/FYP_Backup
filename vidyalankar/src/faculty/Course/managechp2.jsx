// managechp2.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import "../editCiann/EditCiannModern.css";
import "./CourseTableShared.css";

const ManageChapters2 = () => {
  const [chapters, setChapters] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterNo, setNewChapterNo] = useState("");
  const [newChapterName, setNewChapterName] = useState("");

  const [ciannData, setCiannData] = useState(null);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  const [program, setProgram] = useState("");
  const [className, setClassName] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => {
    let resolvedCiann = location.state?.ciannData;
    if (!resolvedCiann) {
      const stored = sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData");
      if (stored) {
        try {
          resolvedCiann = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing stored ciannData", e);
        }
      }
    }
    setCiannData(resolvedCiann);

    // If state contains them, use them
    if (location.state?.program && location.state?.className && location.state?.course) {
      setProgram(location.state.program);
      setClassName(location.state.className);
      setCourse(location.state.course);
    } else if (resolvedCiann) {
      // Otherwise extract from ciannData
      const extractValue = (data, ...possibleKeys) => {
        if (!data) return null;
        for (const key of possibleKeys) {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (typeof value === "object" && value.name) {
              return value.name;
            } else if (typeof value === "object" && value.code) {
              return value.code;
            } else if (typeof value === "string") {
              return value;
            }
          }
        }
        return null;
      };

      let prog = extractValue(resolvedCiann, "department", "dept", "departmentName", "Department", "DEPARTMENT", "branch", "Branch", "stream", "Stream") || "N/A";
      if (prog === "N/A" || typeof prog !== "string") {
        const nestedDept = resolvedCiann?.academicInfo?.department || resolvedCiann?.courseDetails?.department || resolvedCiann?.details?.department || resolvedCiann?.info?.department || resolvedCiann?.subjectDetails?.department || resolvedCiann?.class?.department || resolvedCiann?.subject?.department;
        if (nestedDept) {
          if (typeof nestedDept === "object" && nestedDept.name) prog = nestedDept.name;
          else if (typeof nestedDept === "string") prog = nestedDept;
        }
      }
      if (typeof prog === "object" && prog !== null) prog = prog.name || prog.label || "N/A";

      let cls = extractValue(resolvedCiann, "className", "class", "classname", "Class", "ClassName", "semester", "year") || "N/A";
      if (cls === "N/A") cls = resolvedCiann?.classDetails?.className || resolvedCiann?.class?.name || resolvedCiann?.class || resolvedCiann?.academicInfo?.class || "N/A";
      if (typeof cls === "object" && cls !== null) cls = cls.name || cls.label || "N/A";

      let crs = extractValue(resolvedCiann, "subjectName", "subject", "subjectname", "Subject", "SubjectName", "title", "courseName", "name") || "N/A";
      if (crs === "N/A") crs = resolvedCiann?.subjectDetails?.name || resolvedCiann?.subject?.name || resolvedCiann?.subject || resolvedCiann?.courseInfo?.subject || "N/A";
      if (typeof crs === "object" && crs !== null) crs = crs.name || crs.label || "N/A";

      setProgram(prog);
      setClassName(cls);
      setCourse(crs);
    }
  }, [location, location.state]);

  // Fetch chapters when params are loaded
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
            setChapters((data.chp || []).sort((a, b) => Number(a.chapterNo) - Number(b.chapterNo)));
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
        setChapters((data.chp || []).sort((a, b) => Number(a.chapterNo) - Number(b.chapterNo)));
        setIsModalOpen(false);
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
    navigate("/update-chapter", {
      state: {
        program,
        className,
        course,
        chapter: chapterToEdit,
        ciannData,
      },
    });
  };

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
        setChapters((data.chp || []).sort((a, b) => Number(a.chapterNo) - Number(b.chapterNo)));
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
    <div className="timetable-layout">
      <div className="timetable-main-row">
        <div className="timetable-secondary-sidebar-wrapper">
          <SecondarySidebar
            ciannData={ciannData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="timetable-main-content">
          <div className="plan-container p-4">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">Chapters Management</h2>
                <p className="text-secondary mb-0">
                  Manage syllabus chapters for <strong>{course || "Active Course"}</strong> ({className || "N/A"})
                </p>
              </div>
              <button
                className="btn btn-info rounded-pill px-4 fw-bold text-white shadow-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="bi bi-plus-lg me-2"></i> Add Chapter
              </button>
            </div>

            <div className="table-wrapper shadow-sm rounded-4 overflow-hidden mb-4">
              <table className="chapters-table table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "20%", textAlign: "center" }}>Chapter No.</th>
                    <th style={{ width: "60%", textAlign: "left" }}>Chapter Name</th>
                    <th style={{ width: "20%" }} className="setting-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.length > 0 ? (
                    chapters.map((chapter) => (
                      <tr key={chapter.chapterNo}>
                        <td className="fw-semibold text-dark text-center">{chapter.chapterNo}</td>
                        <td className="text-secondary fw-semibold text-start" style={{ textAlign: "left" }}>{chapter.chapterName}</td>
                        <td className="setting-cell">
                          <button
                            className="edit-btn btn btn-sm btn-outline-primary border-0 me-2"
                            title="Edit Chapter"
                            onClick={() => handleEditClick(chapter)}
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                          <button
                            className="delete-btn btn btn-sm btn-outline-danger border-0"
                            title="Delete Chapter"
                            onClick={() => handleDeleteClick(chapter)}
                          >
                            <i className="bi bi-trash fs-6"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
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
                <div className="modal-content popup p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header border-0 pb-2 d-flex align-items-center justify-content-between">
                    <h3 className="modal-title fw-bold m-0 fs-5">Add New Chapter</h3>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close"
                      style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddChapter} className="mt-3">
                    <div className="form-group mb-3">
                      <label htmlFor="chapterNo" className="form-label fw-bold text-dark small mb-2">Chapter Number</label>
                      <input
                        id="chapterNo"
                        type="number"
                        className="form-control input-field"
                        value={newChapterNo}
                        onChange={(e) => setNewChapterNo(e.target.value)}
                        placeholder="e.g., 1"
                        required
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label htmlFor="chapterName" className="form-label fw-bold text-dark small mb-2">Chapter Name</label>
                      <input
                        id="chapterName"
                        type="text"
                        className="form-control input-field"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        placeholder="e.g., Introduction to..."
                        required
                      />
                    </div>
                    <div className="modal-actions d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary cancel-btn"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary submit-btn">
                        Save Chapter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageChapters2;
