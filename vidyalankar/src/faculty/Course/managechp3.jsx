import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CourseTableShared.css";

function UpdateChapter() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data passed from the previous page
  const { program, className, course, chapter } = location.state || {};

  // State for the form fields, pre-populated with chapter data
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterName, setChapterName] = useState("");

  // Use useEffect to set state when component mounts with data
  useEffect(() => {
    if (chapter) {
      setChapterNumber(chapter.chapterNo);
      setChapterName(chapter.chapterName);
    } else {
      // If no data is passed (e.g., direct navigation), redirect back
      navigate(-1);
    }
  }, [chapter, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/course-chapters/update-chapter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program,
          className,
          course,
          originalChapterNo: chapter.chapterNo, // The original number to find the record
          newChapterNo: chapterNumber, // The new number from the form
          newChapterName: chapterName, // The new name from the form
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Chapter updated successfully!");
        navigate(-1); // Go back to the previous page
      } else {
        alert(`Update failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("An error occurred during the update.");
    }
  };

  return (
    <div className="container">
      <h2 className="header">Update Chapter for: {course}</h2>
      <hr className="divider" />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="chapterNo">Chapter Number</label>
          <input
            id="chapterNo"
            type="number"
            className="input-field"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="chapterName">Chapter Name</label>
          <input
            id="chapterName"
            type="text"
            className="input-field"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="update-button">
          Update
        </button>
      </form>
    </div>
  );
}

export default UpdateChapter;
