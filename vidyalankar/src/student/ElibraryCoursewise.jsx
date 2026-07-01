import React, { useState, useEffect } from "react";
import "./StudentComponents.css";
import { elibraryService } from "./services/api";
import { useNavigate } from "react-router-dom";

const ElibraryCoursewise = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await elibraryService.getCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResources = async (courseId) => {
    try {
      // Navigate to the resources page for this course
      navigate(`/elibrary/course/${courseId}`);
    } catch (err) {
      console.error("Failed to view resources:", err);
      alert("Failed to load resources. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-content-container">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchCourses}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>E-library - Coursewise</h1>
        <p>Browse resources organized by your courses</p>
      </div>
      
      <div className="course-list">
        <h2>Your Courses</h2>
        {courses.length === 0 ? (
          <div className="no-results">
            <i className="bi bi-collection"></i>
            <p>No courses found</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id || course.id} className="course-card">
                <div className="course-icon">
                  <i className="bi bi-book"></i>
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="course-code">{course.code}</p>
                  <p className="resource-count">{course.resources || 0} resources available</p>
                </div>
                <button className="view-resources-btn" onClick={() => handleViewResources(course._id || course.id)}>
                  View Resources
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .course-list h2 {
          color: #2d3748;
          margin-bottom: 20px;
        }
        
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .course-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        
        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        
        .course-icon {
          width: 50px;
          height: 50px;
          background-color: #eef2ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          color: #4f46e5;
          font-size: 1.5rem;
        }
        
        .course-info h3 {
          margin: 0 0 5px 0;
          color: #2d3748;
          font-size: 1.25rem;
        }
        
        .course-code {
          margin: 0 0 10px 0;
          color: #718096;
          font-weight: 500;
        }
        
        .resource-count {
          margin: 0 0 15px 0;
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        .view-resources-btn {
          padding: 10px 15px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          margin-top: auto;
        }
        
        .view-resources-btn:hover {
          background-color: #4338ca;
        }
        
        @media (max-width: 768px) {
          .courses-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ElibraryCoursewise;