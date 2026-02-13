import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "./Course1.css";

const CourseForm = () => {
  const data = {
    "Computer Engineering": {
      classes: ["CO1K", "CO2K", "CO3K", "CO4K", "CO5K", "CO6K"],
      courses: {
        CO1K: [
          "COMMUNICATION SKILLS (ENGLISH)",
          "BASIC MATHEMATICS",
          "ENGINEERING GRAPHICS",
          "ENGINEERING WORKSHOP PRACTICE",
          "FUNDAMENTALS OF ICT",
          "BASIC SCIENCE (PHYSICS)",
          "BASIC SCIENCE (CHEMISTRY)",
          "YOGA AND MEDITATION",
        ],
        CO2K: [
          "Linux Basics",
          "Professional Communication",
          "Social and Life Skills",
          "Web Page Designing",
          "Applied Mathematics",
          "Basic Electrical and Electronics Engineering (Electrical)",
          "Programming in C",
          "Basic Electrical and Electronics Engineering (Electronics)",
        ],
        CO3K: [
          "Data Structure using C",
          "Database management System",
          "Digital Techniques",
          "Object Oriented Programming using C++",
          "Computer Graphics",
          "Essence of Indian Constitution",
        ],
        CO4K: [
          "Environmental Education and Sustainability",
          "Java Programming",
          "Data Communication and Computer Networks",
          "Microprocessor Programming",
          "Python Programming",
          "UI/UX Design",
        ],
        CO5K: [
          "OPERATING SYSTEM",
          "SOFTWARE ENGINEERING",
          "ENTREPRENEURSHIP DEVELOPMENT AND STARTUPS",
          "SEMINAR AND PROJECT INITIATION COURSE",
          "INTERNSHIP",
          "CLOUD COMPUTING",
        ],
        // CO6K: ["NOT AVAILABLE"],
      },
    },
    "Electronics and Telecommunication Engineering": {
      classes: ["EJ1K", "EJ2K", "EJ3K", "EJ4K", "EJ5K", "EJ6K"],
      courses: {
        EJ1K: [
          "COMMUNICATION SKILLS (ENGLISH)",
          "BASIC MATHEMATICS",
          "ENGINEERING GRAPHICS",
          "ENGINEERING WORKSHOP PRACTICE",
          "FUNDAMENTALS OF ICT",
          "BASIC SCIENCE (PHYSICS)",
          "BASIC SCIENCE (CHEMISTRY)",
        ],
        EJ2K: [
          "Professional Communication",
          "Social And Life Skills",
          "Electronics Workshop Practice",
          "Programming in C Language",
          "Applied Mathematics",
          "Basic Electronics",
          "Elements of Electrical Engineering",
          "Electronics Materials & Components",
        ],
        EJ3K: [
          "Digital Techniques",
          "Analog Electronics",
          "Circuits & Networks",
          "Principles of Electronics Communication",
          "Essence of Indian Constitution",
          "Basic Python Programming",
          "Electronic Measurements & Instrumentation",
        ],
        EJ4K: [
          "Environmental Education and Sustainability",
          "Digital Communication System",
          "Consumer Electronic System",
          "Microcontroller & Applications",
          "Basic Power Electronics",
          "Electronic Equipment Maintenance & Simulation",
        ],
        EJ5K: [
          "Embedded System",
          "Mobile & Wireless Communication",
          "Entrepreneurship Development and Startups",
          "Seminar and Project Initiation Course",
          "Internship",
          "IOT Applications",
        ],
        // EJ6K: [
        //   "NOT AVAILABLE",
        // ],
      },
    },
    "Information Technology": {
      classes: ["IF1K", "IF2K", "IF3K", "IF4K", "IF5K", "IF6K"],
      courses: {
        IF1K: [
          "COMMUNICATION SKILLS (ENGLISH)",
          "BASIC MATHEMATICS",
          "ENGINEERING GRAPHICS",
          "ENGINEERING WORKSHOP PRACTICE",
          "FUNDAMENTALS OF ICT",
          "BASIC SCIENCE (PHYSICS)",
          "BASIC SCIENCE (CHEMISTRY)",
          "YOGA AND MEDITATION",
        ],
        IF2K: [
          "Linux Basics",
          "Professional Communication",
          "Social and Life Skills",
          "Web Page Designing",
          "Applied Mathematics",
          "Basic Electrical and Electronics Engineering (Electrical)",
          "Programming in C",
          "Basic Electrical and Electronics Engineering (Electronics)",
        ],
        IF3K: [
          "Data Structure using C",
          "Database management System",
          "Object Oriented Programming using C++",
          "Digital Techniques and Microprocessor",
          "Essence of Indian Constitution",
          "Applied Multimedia Techniques",
        ],
        IF4K: [
          "Environmental Education and Sustainability",
          "Java Programming",
          "Data Communication and Computer Networks",
          "Python Programming",
          "Information Security",
          "Internet of Things",
        ],
        IF5K: [
          "OPERATING SYSTEM",
          "SOFTWARE ENGINEERING AND TESTING",
          "ENTREPRENEURSHIP DEVELOPMENT AND STARTUPS",
          "SEMINAR AND PROJECT INITIATION COURSE",
          "INTERNSHIP",
          "DATA ANALYTICS",
        ],
        // IF6K: [
        //     "NOT AVAILABLE",
        // ],
      },
    },
    "Electronics and Computer Engineering": {
      classes: ["TE1K", "TE2K", "TE3K", "TE4K", "TE5K", "TE6K"],
      courses: {
        TE1K: [
          "COMMUNICATION SKILLS (ENGLISH)",
          "BASIC SCIENCE (PHYSICS)",
          "BASIC SCIENCE (CHEMISTRY)",
          "BASIC MATHEMATICS",
          "ENGINEERING GRAPHICS",
          "FUNDAMENTALS OF ICT",
          "WORKSHOP PRACTICE",
          "YOGA AND MEDITATION",
        ],
        TE2K: [
          "Applied Mathematics",
          "Basic Electronics",
          "Elements of Electrical Engineering",
          "Professional Communication",
          "Social and Life Skills",
          "Electronics Workshop Practice",
          "Programming in 'C' Language",
          "Web Page Design",
        ],
        TE3K: [
          "Database management System",
          "Digital Techniques",
          "Object Oriented Programming using C++",
          "Analog Electronics",
          "Essence of Indian Constitution",
          "EDA Tools",
        ],
        // TE4K: [
        //     "NOT AVAILABLE",
        // ],
        // TE5K: [
        //     "NOT AVAILABLE",
        // ],
        // TE6K: [
        //     "NOT AVAILABLE",
        // ],
      },
    },
  };

  const [program, setProgram] = useState("");
  const [className, setClassName] = useState("");
  const [course, setCourse] = useState("");
  const [experiments, setExperiments] = useState([]);
   const navigate = useNavigate();

   const handleProgramChange = (e) => {
    const selectedProgram = e.target.value;
    setProgram(selectedProgram);
    setClassName("");
    setCourse("");
  };

  const handleClassChange = (e) => {
    setClassName(e.target.value);
    setCourse("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (program && className && course) {
      // Navigate to Course2 with state
      const queryParams = new URLSearchParams({
        program,
        className,
        course,
      }).toString();
      navigate(`/course2?${queryParams}`);
    } else {
      alert("Please select all fields before submitting.");
    }
  };

  const classOptions = program ? data[program]?.classes || [] : [];
  const courseOptions =
    program && className ? data[program]?.courses[className] || [] : [];

  return (
    <div className="course-form-container">
      <h1>Select Course To Find Experiments</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Select Program</label>
          <select value={program} onChange={handleProgramChange}>
            <option value="">--- Select Program ---</option>
            {Object.keys(data).map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Select Class</label>
          <select
            value={className}
            onChange={handleClassChange}
            disabled={!program}
          >
            <option value="">--- Select Class ---</option>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Select Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            disabled={!className}
          >
            <option value="">--- Select Course ---</option>
            {courseOptions.map((crs) => (
              <option key={crs} value={crs}>
                {crs}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default CourseForm;
