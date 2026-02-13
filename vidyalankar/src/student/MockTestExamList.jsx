import React, { useState, useEffect } from "react";
import "./StudentComponents.css";
import { mockTestsService } from "./services/api";
import { useNavigate } from "react-router-dom";

const MockTestExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSubject, setFilterSubject] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await mockTestsService.getTests();
      setExams(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
      setError("Failed to load exams. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming": return "#f59e0b";
      case "in-progress": return "#3b82f6";
      case "completed": return "#10b981";
      default: return "#64748b";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "upcoming": return "Upcoming";
      case "in-progress": return "In Progress";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  const handleStartExam = async (examId) => {
    try {
      // Start the exam and navigate to the exam page
      await mockTestsService.startTest(examId);
      navigate(`/mock-test/take/${examId}`);
    } catch (err) {
      console.error("Failed to start exam:", err);
      alert("Failed to start exam. Please try again.");
    }
  };

  const handleContinueExam = (examId) => {
    // Navigate to continue the exam
    navigate(`/mock-test/take/${examId}`);
  };

  const handleReviewExam = (examId) => {
    // Navigate to review the exam
    navigate(`/mock-test/review/${examId}`);
  };

  // Filter exams based on subject filter
  const filteredExams = filterSubject === "all" 
    ? exams 
    : exams.filter(exam => exam.subject === filterSubject);

  // Get unique subjects for filter dropdown
  const subjects = [...new Set(exams.map(exam => exam.subject))];

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading exams...</p>
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
          <button className="retry-btn" onClick={fetchExams}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Mock Test - Exam List</h1>
        <p>Browse and take available mock tests</p>
      </div>
      
      <div className="exams-section">
        <div className="section-header">
          <h2>Available Exams</h2>
          <div className="controls">
            <select 
              className="filter-select"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <button className="btn-primary">
              <i className="bi bi-plus-circle"></i> Create Custom Test
            </button>
          </div>
        </div>
        
        {filteredExams.length === 0 ? (
          <div className="no-results">
            <i className="bi bi-file-earmark-text"></i>
            <p>No exams found matching your criteria</p>
          </div>
        ) : (
          <div className="exams-grid">
            {filteredExams.map((exam) => (
              <div key={exam._id || exam.id} className="exam-card">
                <div className="exam-header">
                  <h3>{exam.title}</h3>
                  <span 
                    className="exam-status" 
                    style={{ 
                      backgroundColor: `${getStatusColor(exam.status)}20`, 
                      color: getStatusColor(exam.status) 
                    }}
                  >
                    {getStatusText(exam.status)}
                  </span>
                </div>
                
                <div className="exam-details">
                  <div className="detail-item">
                    <i className="bi bi-book"></i>
                    <span>{exam.subject}</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-clock"></i>
                    <span>{exam.duration} mins</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-question-circle"></i>
                    <span>{exam.questions} Questions</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-calendar"></i>
                    <span>{new Date(exam.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="exam-actions">
                  {exam.status === "upcoming" && (
                    <button className="btn-primary" onClick={() => handleStartExam(exam._id || exam.id)}>
                      <i className="bi bi-play-circle"></i> Start Exam
                    </button>
                  )}
                  {exam.status === "in-progress" && (
                    <button className="btn-warning" onClick={() => handleContinueExam(exam._id || exam.id)}>
                      <i className="bi bi-arrow-right-circle"></i> Continue
                    </button>
                  )}
                  {exam.status === "completed" && (
                    <button className="btn-secondary" onClick={() => handleReviewExam(exam._id || exam.id)}>
                      <i className="bi bi-eye"></i> Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .section-header h2 {
          margin: 0;
          color: #2d3748;
        }
        
        .controls {
          display: flex;
          gap: 10px;
        }
        
        .btn-primary {
          padding: 8px 15px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-primary:hover {
          background-color: #4338ca;
        }
        
        .btn-warning {
          padding: 8px 15px;
          background-color: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-warning:hover {
          background-color: #d97706;
        }
        
        .btn-secondary {
          padding: 8px 15px;
          background-color: #64748b;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-secondary:hover {
          background-color: #475569;
        }
        
        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .exam-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        
        .exam-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        }
        
        .exam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .exam-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.2rem;
        }
        
        .exam-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .exam-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #4a5568;
        }
        
        .exam-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .controls {
            width: 100%;
          }
          
          .exams-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MockTestExamList;