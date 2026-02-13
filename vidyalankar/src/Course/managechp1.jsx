// managechp1.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './managechp1.css';

// Data structures (classData, courseData) remain the same...
const classData = {
  'Computer Engineering': [
    'CO1K', 'CO2K', 'CO3K', 'CO4K', 'CO5K', 'CO6K'
  ],
  'Electronics and Telecommunication Engineering': [
    'EJ1K', 'EJ2K', 'EJ3K', 'EJ4K', 'EJ5K', 'EJ6K'
  ],
  'Information Technology': [
    'IF1K', 'IF2K', 'IF3K', 'IF4K', 'IF5K', 'IF6K'
  ],
  'Electronics and Computer Engineering': [
    'TE1K', 'TE2K', 'TE3K', 'TE4K', 'TE5K', 'TE6K'
  ]
};

const courseData = {
  'CO1K': [
    "COMMUNICATION SKILLS (ENGLISH)", 
    "BASIC MATHEMATICS",
    "ENGINEERING GRAPHICS",
    "ENGINEERING WORKSHOP PRACTICE",
    "FUNDAMENTALS OF ICT",
    "Basic Science(Physics)",
    "Basic Science(Chemistry)",
    "Yoga and Meditation"
  ],
  'CO2K': [
    "Linux Basics",
     "Professional Communication",
      "Social and Life Skills",
       "Web Page Designing",
        "Applied Mathematics",
         "Basic Electrical And Electronics Engineering (Electrical)",
          "Programming in C",
           "Basic Electrical And Electronics Engineering (Electronics)"
  ],
  'CO3K': [
    "Data Structure using C",
     "Database Management System",
      "Digital Techniques",
       "Object Oriented Programming using C++",
        "Computer Graphics",
         "Essence of Indian Constitution"
  ],
  'CO4K': [
    "Environmental Education and Sustainability",
     "Java Programming",
      "Data Communication and Computer Network",
       "Microprocessor Programming",
        "Python Programming",
         "UI/UX Design"
  ],
  'CO5K': [
    "OPERATING SYSTEM",
     "SOFTWARE ENGINEERING",
      "ENTREPRENEURSHIP DEVELOPMENT AND STARTUPS",
       "SEMINAR AND PROJECT INITIATION COURSE",
        "INTERNSHIP",
         "CLOUD COMPUTING"
  ],
  'CO6K': [],
  'EJ1K': [
    "COMMUNICATION SKILLS(ENGLISH)",
     "BASIC MATHEMATICS",
      "ENGINEERING GRAPHICS",
       "ENGINEERING WORKSHOP PRACTICE",
        "FUNDAMENTALS OF ICT",
         "Basic Science(Physics)",
          "Basic Science(Chemistry)"
  ],
  'EJ2K': [
    "Professional Communication",
     "Social And Life Skills",
      "Electronics Workshop Practice",
       "Programming In C Language",
        "Applied Mathematics",
         "Basic Electronics",
          "Elements of Electrical Engineering",
           "Electronic Materials & Components"
  ],
  'EJ3K': [
    "Digital Techniques",
     "Analog Electronics",
      "Circuits & Networks",
       "Principles of Electronic Communication",
        "Essence of Indian Constitution",
         "Basic Python Programming",
          "Electronic Measurements & Instrumentation"
  ],
  'EJ4K': [
    "Environmental Education and Sustainability",
     "DIGITAL COMMUNICATION SYSTEMS",
      "CONSUMER ELECTRONIC SYSTEMS",
       "MICROCONTROLLER & APPLICATIONS",
        "BASIC POWER ELECTRONICS",
         "ELECTRONIC EQUIPMENT MAINTENANCE & SIMULATION"
  ],
  'EJ5K': [
    "EMBEDDED SYSTEM",
     "MOBILE & WIRELESS COMMUNICATION",
      "ENTREPRENEURSHIP DEVELOPMENT AND STARTUPS",
       "SEMINAR AND PROJECT INITIATION COURSE",
        "INTERNSHIP", "IOT APPLICATIONS"
  ],
  'EJ6K': [],
  'IF1K': [
    "COMMUNICATIONS SKILLS(ENGLISH)",
     "BASIC MATHEMATICS",
      "ENGINEERING GRAPHICS",
       "ENGINEERING WORKSHOP PRACTICE",
        "FUNDAMENTALS OF ICT",
         "Basic Science(Physics)",
          "Basic Science(Chemistry)",
           "Yoga and Meditation"
  ],
  'IF2K': [
    "Linux Basics",
     "Professional Communication",
      "Social and Life Skills",
       "Web Page Designing",
        "Applied Mathematics",
         "Basic Electrical and Electronics Engineering (Electrical)",
          "Programming in C",
           "Basic Electrical And Electronics Engineering (Electronics)"
  ],
  'IF3K': [
    "Data Structure using C",
     "Database Management System",
      "Object Oriented Programming using C++", 
      "Digital Techniques and Microprocessors",
       "Essence of Indian Constitution",
        "Applied Multimedia Techniques"
  ],
  'IF4K': [
    "Environmental Education and Sustainability",
     "Java Programming",
      "Data Communication and Computer Network",
       "Python Programming",
        "Information Security",
         "Internet Of Things"
  ],
  'IF5K': [
    "OPERATING SYSTEMS",
     "SOFTWARE ENGINEERING AND TESTING",
      "ENTREPRENEURSHIP DEVELOPEMENT AND STARTUPS", 
      "SEMINAR AND PROJECT INITIATION COURSE", 
      "INTERNSHIP",
       "DATA ANALYTICS"
  ],
  'TE1K': [
    "Communication Skill (English)",
     "Basic Science(Physics)",
      "Basic Science(Chemistry)",
       "Basic Mathematics",
        "Engineering Graphics",
         "Fundamentals of ICT",
          "Workshop Practice",
           "Yoga and Meditation"
  ],
  'TE2K': [
    "APPLIED MATHEMATICS",
     "BASIC ELECTRONICS",
      "ELEMENTS OF ELECTRICAL ENGINEERING",
       "PROFESSIONAL COMMUNICATION",
        "SOCIAL AND LIFE SKILLS", 
        "ELECTRONICS WORKSHOP PRACTICE",
         "PROGRAMMING IN 'C' LANGUAGE",
          "WEB PAGE DESIGN"
  ],
  'TE3K': [
    "Database Management System",
     "Digital Techniques",
      "Object Oriented Programming Using C++",
       "Analog Electronics",
        "Essence Of Indian Constitution", 
        "EDA Tools"
  ],
  'TE4K': [],
  'TE5K': [],
  'TE6K': []
};


const ManageChapters1 = () => {
  const navigate = useNavigate();

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  const programs = [
    'Computer Engineering',
    'Electronics and Telecommunication Engineering',
    'Information Technology',
    'Electronics and Computer Engineering',
  ];

  useEffect(() => {
    if (selectedProgram) {
      setAvailableClasses(classData[selectedProgram] || []);
    } else {
      setAvailableClasses([]);
    }
    setSelectedClass('');
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedClass) {
      setAvailableCourses(courseData[selectedClass] || []);
    } else {
      setAvailableCourses([]);
    }
    setSelectedCourse('');
  }, [selectedClass]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!selectedProgram || !selectedClass || !selectedCourse) {
      alert("Please select a program, class, and course before submitting.");
      return;
    }
  
    // Pass the selected data to the next route using the state property
    navigate('/add-chapters', { 
      state: { 
        program: selectedProgram, 
        className: selectedClass, 
        course: selectedCourse 
      } 
    });
  };

  return (
    <div className="manage-chapters-container">
      <h2 className="page-title">Select Course To Add Chapters</h2>

      <form className="chapter-form" onSubmit={handleSubmit}>
        {/* ... form elements remain the same ... */}
        <div className="form-group">
          <label htmlFor="program-select">Select Program</label>
          <select
            id="program-select"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="program-select"
          >
            <option value="">-- Select Program --</option>
            {programs.map((program, index) => (
              <option key={index} value={program}>
                {program}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="class-select">Select Class</label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedProgram}
          >
            <option value="">-- Select Class --</option>
            {availableClasses.map((className, index) => (
              <option key={index} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="course-select">Select Course</label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">-- Select Course --</option>
            {availableCourses.map((courseName, index) => (
              <option key={index} value={courseName}>
                {courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
            <button type="submit" className="submit-btn">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default ManageChapters1;
