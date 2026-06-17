import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { showSuccessAlert, showErrorAlert } from '../../utils/alertUtils.jsx';
import './ExperimentAttendance.css';

// Dummy student data
const dummyStudents = [
  { rollId: 'CS001', name: 'Aarav Sharma', marks: 0 },
  { rollId: 'CS002', name: 'Vivaan Patel', marks: 0 },
];

const ExperimentAttendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(dummyStudents);
  const [experimentData, setExperimentData] = useState(null);
  const [columnsVisible, setColumnsVisible] = useState({
    rollId: true,
    name: true,
    mark: true
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [arrowOpen, setArrowOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load experiment data from localStorage
  useEffect(() => {
    console.log('Component mounted, checking localStorage...');
    const experimentDataStr = localStorage.getItem('experimentData');
    console.log('Raw experiment data:', experimentDataStr);
    
    if (!experimentDataStr) {
      console.error("No experiment data found in localStorage");
      // Just navigate back without showing error alert
      navigate(-1); // Go back to previous page
      return;
    }

    let expData;
    try {
      expData = JSON.parse(experimentDataStr);
      console.log('Parsed experiment data:', expData);
      setExperimentData(expData);
    } catch (parseError) {
      console.error("Error parsing experiment data:", parseError);
      // Just navigate back without showing error alert
      navigate(-1);
      return;
    }

    if (!expData || !expData.batch) {
      console.error("Missing batch in experiment data:", expData);
      // Just navigate back without showing error alert
      navigate(-1);
      return;
    }

    console.log('Using dummy student data for batch:', expData.batch);
    // Using dummy students instead of API call
    setStudents(dummyStudents);
  }, [navigate]);

  const handleMarksChange = (index, value) => {
    // Validate marks (0-100)
    if (!/^\d*$/.test(value) || (value !== '' && (parseInt(value) < 0 || parseInt(value) > 100))) {
      return;
    }

    setStudents(prevStudents => {
      const updated = prevStudents.map((student, i) =>
        i === index
          ? { ...student, marks: value === '' ? 0 : parseInt(value) }
          : student
      );
      console.log('Updated student marks:', updated);
      return updated;
    });
  };

  const handleSubmitMarks = async () => {
    try {
      if (!experimentData) {
        alert("Missing experiment information");
        return;
      }

      if (students.length === 0) {
        alert("No students found. Please refresh and try again.");
        return;
      }

      const payload = { 
        experimentId: experimentData.expId,
        experimentName: experimentData.expName,
        batch: experimentData.batch,
        students: students.map(student => ({
          rollId: student.rollId,
          name: student.name,
          marks: student.marks
        }))
      };
      console.log("Payload to be sent:", payload);
      
      // Simulate successful submission without API call
      console.log("Marks submitted successfully (dummy mode)");
      
      // Show success alert
      showSuccessAlert("Experiment marks submitted successfully!");
      
      // Clean up localStorage
      localStorage.removeItem('experimentData');
      
      // Wait a bit for user to see the success message, then navigate back
      setTimeout(() => {
        navigate(-1);
      }, 2000);
      
    } catch (err) {
      console.error("Submission failed:", err);
      showErrorAlert(`Submission failed: ${err.message}`);
    }
  };

  const handleExport = () => {
    if (!experimentData) return;
    
    const data = students.map(student => ({
      'Roll ID': student.rollId,
      'Name': student.name,
      'Marks': student.marks
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Experiment_Marks');
    XLSX.writeFile(workbook, `Experiment_${experimentData.expId}_Marks.xlsx`);
  };

  const toggleColumn = (column) => {
    setColumnsVisible(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleGridView = () => setShowDropdown(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!experimentData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Faculty Progressive Assessment</h3>
          <p className="experiment-info">
            <strong>Experiment =&gt; {experimentData.expId}) {experimentData.expName}</strong>
          </p>
        </div>
        
        <div className="toolbar">
          <input type="text" placeholder="Search" className="search-input" />
          <button className="icon-btn" onClick={() => setArrowOpen(prev => !prev)}>
            <i className={`bi ${arrowOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
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
                  Marks
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
                  {columnsVisible.mark && <th>Marks</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr key={index}>
                    {columnsVisible.rollId && <td>{student.rollId}</td>}
                    {columnsVisible.name && <td>{student.name}</td>}
                    {columnsVisible.mark && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={student.marks}
                          onChange={(e) => handleMarksChange(index, e.target.value)}
                          className="marks-input-field"
                          placeholder="0"
                        />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="submit-wrapper">
          <button className="submit-button" onClick={handleSubmitMarks}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperimentAttendance;
