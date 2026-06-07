import React from "react";
import "./StudentComponents.css";

const Exams = () => {
  // Sample exam data
  const exams = [
    {
      id: 1,
      title: "Mathematics Midterm",
      date: "Dec 15, 2025",
      time: "10:00 AM - 12:00 PM",
      duration: "2 hours",
      subject: "Mathematics",
      status: "upcoming"
    },
    {
      id: 2,
      title: "Physics Final Exam",
      date: "Dec 20, 2025",
      time: "2:00 PM - 4:00 PM",
      duration: "2 hours",
      subject: "Physics",
      status: "upcoming"
    },
    {
      id: 3,
      title: "Chemistry Quiz",
      date: "Dec 10, 2025",
      time: "9:00 AM - 10:00 AM",
      duration: "1 hour",
      subject: "Chemistry",
      status: "completed"
    }
  ];

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h2>Upcoming Exams</h2>
        <p>Stay prepared for your upcoming assessments</p>
      </div>
      
      <div className="exams-list">
        {exams.map((exam) => (
          <div key={exam.id} className={`exam-card ${exam.status}`}>
            <div className="exam-header">
              <h3>{exam.title}</h3>
              <span className={`exam-status ${exam.status}`}>
                {exam.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </span>
            </div>
            <div className="exam-details">
              <p className="exam-subject"><i className="bi bi-book"></i> {exam.subject}</p>
              <p className="exam-date"><i className="bi bi-calendar"></i> {exam.date}</p>
              <p className="exam-time"><i className="bi bi-clock"></i> {exam.time}</p>
              <p className="exam-duration"><i className="bi bi-hourglass"></i> {exam.duration}</p>
              {exam.status === 'upcoming' ? (
                <button className="prepare-btn">Prepare for Exam</button>
              ) : (
                <button className="view-results-btn">View Results</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Exams;