import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "./ViewAssessment.css";

export default function ViewPA1() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from location.state or sessionStorage (for new tab)
  const locationData = location.state || {};
  const batch = locationData.batch || sessionStorage.getItem('viewPA_batch');
  
  let ciannData = locationData.ciannData;
  if (!ciannData) {
    try {
      const storedData = sessionStorage.getItem('viewPA_ciannData');
      if (storedData) {
        ciannData = JSON.parse(storedData);
      } else {
        ciannData = {};
      }
    } catch (e) {
      console.error('Error parsing CIAAN data from sessionStorage:', e);
      ciannData = {};
    }
  }
  
  // Debug logging
  console.log('ViewPA1 - Batch:', batch);
  console.log('ViewPA1 - CIAAN Data:', ciannData);
  
  const [studentsData, setStudentsData] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ViewPA1 useEffect - Checking data...');
    console.log('Batch:', batch);
    console.log('CIAAN Data:', ciannData);
    
    if (batch) {
      console.log('ViewPA1 - Batch found, fetching assessment data...');
      fetchAssessmentData();
    } else {
      console.log('ViewPA1 - Missing batch data. Batch:', batch);
      setError(`Missing batch information. Please select a batch first.`);
      setLoading(false);
    }

    // Cleanup function to clear sessionStorage when component unmounts
    // Commented out to prevent premature clearing
    // return () => {
    //   if (sessionStorage.getItem('viewPA_batch')) {
    //     sessionStorage.removeItem('viewPA_batch');
    //     sessionStorage.removeItem('viewPA_ciannData');
    //   }
    // };
  }, [batch, ciannData]);

  // Add keyboard shortcut for Ctrl+P
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessed experiments for this batch
      const ciannIdParam = ciannData?.ciannId ? `&ciannId=${ciannData.ciannId}` : '';
      const experimentsResponse = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/assessed-experiments?batch=${batch}${ciannIdParam}`);
      const experimentsResult = await experimentsResponse.json();

      if (!experimentsResponse.ok) {
        throw new Error('Failed to fetch experiments');
      }

      if (!experimentsResult.success) {
        throw new Error(experimentsResult.message || 'Failed to fetch experiments');
      }

      // Fetch assessment data for the batch
      const batchCiannIdParam = ciannData?.ciannId ? `?ciannId=${ciannData.ciannId}` : '';
      const assessmentResponse = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batch/${batch}${batchCiannIdParam}`);
      const assessmentResult = await assessmentResponse.json();

      if (!assessmentResponse.ok) {
        throw new Error('Failed to fetch assessment data');
      }

      if (!assessmentResult.success) {
        throw new Error(assessmentResult.message || 'Failed to fetch assessment data');
      }

      // Process the data to create a matrix of student marks
      const processedData = assessmentResult.data.map(student => {
        const experimentMarks = {};
        
        // Initialize all experiments with 0 marks
        experimentsResult.experiments.forEach(exp => {
          experimentMarks[exp.id] = 0;
        });
        
        // Fill in actual marks from assessments
        Object.keys(student.assessments).forEach(expNum => {
          experimentMarks[parseInt(expNum)] = student.assessments[expNum].marks;
        });

        return {
          _id: student._id,
          rollNo: student.rollNo,
          studentName: student.studentName,
          experimentMarks
        };
      });

      setStudentsData(processedData);
      setExperiments(experimentsResult.experiments.slice(0, 8)); // Show first 8 experiments as per screenshot
    } catch (error) {
      console.error('Error fetching assessment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    console.log('Print button clicked');
    console.log('Students data:', studentsData);
    console.log('Experiments data:', experiments);
    console.log('Loading:', loading);
    console.log('Error:', error);
    
    // Add print class to body for better print styling
    document.body.classList.add('printing');
    
    // Add a small delay to ensure styles are loaded
    setTimeout(() => {
      window.print();
      
      // Remove print class after printing
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 1000);
    }, 100);
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading assessment data...</p>
          </div>
        </div>

      </>
    );
  }

  if (error) {
    return (
      <>
        <Header showSearch={false} />
        <div className="container mt-4">
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchAssessmentData}
            >
              Retry
            </button>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={() => {
              // If opened in new tab, close the tab, otherwise navigate back
              if (sessionStorage.getItem('viewPA_batch')) {
                window.close();
              } else {
                navigate(-1);
              }
            }}
          >
            <i className="bi bi-arrow-left" /> {sessionStorage.getItem('viewPA_batch') ? 'Close' : 'Back'}
          </button>
        </div>

      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      
      {/* Print-only version */}
      <div className="print-only-content" style={{display: 'none'}}>
        <h1 style={{textAlign: 'center', margin: '20px 0', fontSize: '18pt', color: '#000'}}>
          PRACTICAL ASSESSMENT REPORT
        </h1>
        
        {/* Debug info */}
        <div style={{border: '1px solid red', padding: '5px', marginBottom: '10px', fontSize: '8pt', color: 'red'}}>
          DEBUG: Loading: {loading ? 'Yes' : 'No'} | Error: {error ? 'Yes' : 'No'} | Students: {studentsData.length} | Experiments: {experiments.length}
        </div>
        
        {ciannData && Object.keys(ciannData).length > 0 && (
          <div style={{border: '1px solid #000', padding: '10px', marginBottom: '15px', fontSize: '10pt'}}>
            <strong>CIAAN ID:</strong> {ciannData.ciannId || 'N/A'} | 
            <strong> Subject:</strong> {ciannData.subject?.name || 'N/A'} ({ciannData.subject?.code || 'N/A'}) | 
            <strong> Division:</strong> {ciannData.division || 'N/A'} | 
            <strong> Batch:</strong> {batch}
          </div>
        )}
        
        {/* Copy the exact table structure from screen version */}
        <div className="assessment-table-responsive" style={{overflow: 'visible', maxHeight: 'none', boxShadow: 'none', borderRadius: '0'}}>
          <table className="assessment-table" style={{width: '100%', fontSize: '10pt', borderCollapse: 'collapse', border: '2px solid #000', background: 'white', margin: '0'}}>
            <thead>
              <tr>
                <th className="roll-no-header" style={{border: '1px solid #000', padding: '8px 4px', background: '#e9ecef', color: '#000'}}>Roll No.</th>
                <th className="student-name-header" style={{border: '1px solid #000', padding: '8px 4px', background: '#e9ecef', color: '#000'}}>Name</th>
                {experiments.map((exp, index) => (
                  <th key={exp.id} className="exp-header" style={{border: '1px solid #000', padding: '8px 4px', background: '#e9ecef', color: '#000'}}>
                    Exp {index + 1}<br />
                    <small>{exp.name || `Experiment ${index + 1}`}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsData.length > 0 ? studentsData.map((student) => (
                <tr key={student._id}>
                  <td className="roll-no-cell" style={{border: '1px solid #000', padding: '6px 4px', textAlign: 'center'}}>{student.rollNo}</td>
                  <td className="student-name-cell" style={{border: '1px solid #000', padding: '6px 4px', textAlign: 'left'}}>{student.studentName}</td>
                  {experiments.map((exp) => (
                    <td key={exp.id} className="marks-cell" style={{border: '1px solid #000', padding: '6px 4px', textAlign: 'center'}}>
                      {student.experimentMarks[exp.id] || 0}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan="100" style={{border: '1px solid #000', padding: '10px', textAlign: 'center', color: 'red'}}>
                    No student data available - Loading: {loading ? 'Yes' : 'No'} - Error: {error || 'None'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="view-assessment-container">
        {/* Header Section */}
        <div className="assessment-header">
          <div className="course-diary-title">
            <h1>PRACTICAL ASSESSMENT REPORT</h1>
          </div>
        </div>

        {/* Assessment Table */}
        <div className="assessment-table-container">
          <h3 className="table-title">Practical Assessment</h3>
          
          {ciannData && Object.keys(ciannData).length > 0 && (
            <div className="ciaan-info mb-3">
              <strong>CIAAN ID:</strong> {ciannData.ciannId || 'N/A'} | 
              <strong> Subject:</strong> {ciannData.subject?.name || 'N/A'} ({ciannData.subject?.code || 'N/A'}) | 
              <strong> Division:</strong> {ciannData.division || 'N/A'} | 
              <strong> Batch:</strong> {batch}
            </div>
          )}

          <table className="assessment-table">
            <thead>
              <tr>
                <th className="roll-no-header">Roll No.</th>
                <th className="student-name-header">Name</th>
                {experiments.map((exp, index) => (
                  <th key={exp.id} className="exp-header">
                    Exp {index + 1}<br />
                    <small>{exp.name || `Experiment ${index + 1}`}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsData.map((student) => (
                <tr key={student._id}>
                  <td className="roll-no-cell">{student.rollNo}</td>
                  <td className="student-name-cell">{student.studentName}</td>
                  {experiments.map((exp) => (
                    <td key={exp.id} className="marks-cell">
                      {student.experimentMarks[exp.id] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-section mt-4">
            <button className="btn btn-primary" onClick={handlePrint}>
              Print
            </button>
            <button 
              className="btn btn-outline-secondary ms-2"
              onClick={() => {
                // If opened in new tab, close the tab, otherwise navigate back
                if (sessionStorage.getItem('viewPA_batch')) {
                  window.close();
                } else {
                  navigate(-1);
                }
              }}
            >
              {sessionStorage.getItem('viewPA_batch') ? 'Close' : 'Back'}
            </button>
          </div>


        </div>
      </div>

    </>
  );
}
