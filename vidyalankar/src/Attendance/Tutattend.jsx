import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import * as XLSX from 'xlsx';
import './TheoryEdit.css';

const StudentAttendance = () => {
  // State Management
  const [students, setStudents] = useState([]);
  const [columnsVisible, setColumnsVisible] = useState({
    rollId: true,
    name: true,
    mark: true
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [arrowOpen, setArrowOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // Data Initialization
  useEffect(() => {
    axios.get('http://localhost:5000/api/students')
      .then(res => {
        const studentList = res.data.map(student => ({
          rollId: student.rollNo,
          name: student.studentName,
          attendance: 'Absent'
        }));
        setStudents(studentList);
      })
      .catch(err => {
        console.error("Failed to fetch students:", err);
        setStudents([]);
      });
  }, []);

  // Handlers
  const toggleAttendance = (index) => {
    const updated = [...students];
    updated[index].attendance = updated[index].attendance === 'Present' ? 'Absent' : 'Present';
    setStudents(updated);
    console.log('Updated attendance:', updated[index]); // Debug log
  };

  const handleSubmit = async () => {
    try {
      const topic = localStorage.getItem('topic');
      const actualDate = localStorage.getItem('date');
      const ciannDataStr = localStorage.getItem('ciannData');
      
      if (!topic || !actualDate) {
        alert("Missing topic or date from local storage.");
        return;
      }
      
      if (!ciannDataStr) {
        alert("Missing CIANN data. Please select a CIANN first.");
        return;
      }
      
      const ciannData = JSON.parse(ciannDataStr);
      const payload = { 
        Topic: topic, 
        actualDate, 
        students,
        ciannId: ciannData.ciannId,
        subject: ciannData.subject,
        division: ciannData.division
      };
      
      console.log("Payload to be sent:", payload);
      await axios.post('http://localhost:5000/api/tutorial-attendance', payload);
      alert("Student attendance submitted!");
      
      // Clear localStorage after successful submission
      localStorage.removeItem('topic');
      localStorage.removeItem('date');
      localStorage.removeItem('ciannData');
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error("Error submitting attendance:", err);
      alert("Submission failed. Check the console for details.");
    }
  };

  const handleExport = () => {
    const data = students.map(student => ({
      'Roll ID': student.rollId,
      'Name': student.name,
      'Mark': student.attendance === 'Present' ? '✔' : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, 'Student_Attendance.xlsx');
  };

  const toggleColumn = (column) => {
    setColumnsVisible(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleGridView = () => setShowDropdown(prev => !prev);

  // Effect for closing dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Student Tutorial Attendance</h3>
        </div>
        
        <div className="toolbar toolbar-icons">
          <input type="text" placeholder="Search" className="search-input" />
          <button className="icon-btn" onClick={() => setArrowOpen(prev => !prev)}>
            <i className={arrowOpen ? "bi bi-caret-up-fill" : "bi bi-caret-down-fill"}></i>
          </button>
          <button className="icon-btn" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button className="icon-btn" onClick={() => setShowHeaders(prev => !prev)}>
            <i className="bi bi-list"></i>
          </button>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="icon-btn" onClick={handleGridView}>
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <label className="dropdown-label">
                  <input type="checkbox" checked={columnsVisible.rollId} onChange={() => toggleColumn('rollId')} />
                  Roll ID
                </label>
                <label className="dropdown-label">
                  <input type="checkbox" checked={columnsVisible.name} onChange={() => toggleColumn('name')} />
                  Name
                </label>
                <label className="dropdown-label">
                  <input type="checkbox" checked={columnsVisible.mark} onChange={() => toggleColumn('mark')} />
                  Mark
                </label>
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={handleExport}>
            <i className="bi bi-box-arrow-down"></i>
          </button>
        </div>

        <div className="table-container">
          <table>
            {showHeaders && (
              <thead>
                <tr>
                  {columnsVisible.rollId && <th>Roll ID</th>}
                  {columnsVisible.name && <th>Name</th>}
                  {columnsVisible.mark && <th>Mark Present</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  {columnsVisible.rollId && <td>{student.rollId}</td>}
                  {columnsVisible.name && <td>{student.name}</td>}
                  {columnsVisible.mark && (
                    <td style={{ textAlign: 'center' }}>
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={student.attendance === 'Present'}
                          onChange={() => toggleAttendance(index)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="submit-wrapper">
          <button className="submit-button" onClick={handleSubmit}>
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
