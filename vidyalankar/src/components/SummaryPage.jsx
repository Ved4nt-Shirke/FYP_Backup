import React, { useEffect, useState } from 'react';
import './SummaryPage.css';

const SummaryPage = () => {
  const [ciannData, setCiannData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const handlePrint = () => {
    // Add a class to body for print-specific styling
    document.body.classList.add('printing');
    
    // Set up print styles programmatically
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
      @media print {
        @page { 
          size: landscape; 
          margin: 0.5in; 
        }
        body { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
      }
    `;
    document.head.appendChild(printStyle);
    
    // Trigger print
    window.print();
    
    // Clean up after print
    setTimeout(() => {
      document.body.classList.remove('printing');
      document.head.removeChild(printStyle);
    }, 1000);
  };

  useEffect(() => {
    const storedCiannData = localStorage.getItem('ciannData');
    if (storedCiannData) {
      const parsedData = JSON.parse(storedCiannData);
      setCiannData(parsedData);
      fetchSummaryData(parsedData.ciannId);
    }
  }, []);

  const fetchSummaryData = async (ciannId) => {
    console.log("FETCHING SUMMARY FOR CIANN ID:", ciannId);
    try {
      const response = await fetch(`http://localhost:5000/api/summary/${ciannId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      setSummaryData({
        theory: {
          lecturesEngaged: 0,
          attendanceTheoryLectures: 0,
          theoryLecturesPercentage: 0,
          extraLecturesEngaged: 0,
          attendanceExtraLectures: 0,
          extraLecturesPercentage: 0,
          overallTheoryAttendance: 0
        },
        practical: {
          batch1: { practicalEngaged: 0, attendance: 0, percentage: 0 },
          batch2: { practicalEngaged: 0, attendance: 0, percentage: 0 },
          batch3: { practicalEngaged: 0, attendance: 0, percentage: 0 },
          extraPracticals: {
            batch1: { engaged: 0, attendance: 0, percentage: 0 },
            batch2: { engaged: 0, attendance: 0, percentage: 0 },
            batch3: { engaged: 0, attendance: 0, percentage: 0 }
          },
          overall: { engaged: 0, attendance: 0, percentage: 0 }
        },
        tutorial: {
          tutorialsEngaged: 0,
          attendance: 0,
          percentage: 0
        }
      });
    }
  };

  if (!ciannData || !summaryData) {
    return (
      <div className="summary-loading">
        <div className="loading-spinner"></div>
        <p>Loading summary data...</p>
      </div>
    );
  }

  return (
    <div className="summary-scroll-container">
      <div className="summary-container">
        <div className="summary-header">
          <h1>Attendance Summary</h1>
          <div className="ciann-info">
            <p><strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code})</p>
            <p><strong>Division:</strong> {ciannData.division}</p>
            <p><strong>CIANN ID:</strong> {ciannData.ciannId}</p>
          </div>
        </div>

        <h3>Theory</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Lectures Engaged</th>
                <th>Total Attendance</th>
                <th>% Attendance</th>
                <th>Extra Lectures Engaged</th>
                <th>Extra Attendance</th>
                <th>% Extra Attendance</th>
                <th>Overall %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Theory</td>
                <td>{summaryData.theory.lecturesEngaged}</td>
                <td>{summaryData.theory.attendanceTheoryLectures}</td>
                <td>{summaryData.theory.theoryLecturesPercentage || 0} %</td>
                <td>{summaryData.theory.extraLecturesEngaged}</td>
                <td>{summaryData.theory.attendanceExtraLectures}</td>
                <td>{summaryData.theory.extraLecturesPercentage || 0} %</td>
                <td>{summaryData.theory.overallTheoryAttendance} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Practical</h3>
        <div className="overflow-x-auto">
          <table className="practical-table">
            <thead>
              <tr className='th'>
                <th>Batch 1</th>
                <th>Batch 2</th>
                <th>Batch 3</th>
                <th>Batch 1</th>
                <th>Batch 2</th>
                <th>Batch 3</th>
                <th>Overall</th>
              </tr>
              <tr className='data-value-row'>
                <th>Practicals Engaged</th>
                <th>Practicals Engaged</th>
                <th>Practicals Engaged</th>
                <th>Extra Practicals Engaged</th>
                <th>Extra Practicals Engaged</th>
                <th>Extra Practicals Engaged</th>
                <th>Practicals Engaged</th>
              </tr>
            </thead>
            <tbody>
              <tr className="data-value-row">
                <td>{summaryData.practical.batch1.practicalEngaged}</td>
                <td>{summaryData.practical.batch2.practicalEngaged}</td>
                <td>{summaryData.practical.batch3.practicalEngaged}</td>
                <td>{summaryData.practical.extraPracticals.batch1.engaged}</td>
                <td>{summaryData.practical.extraPracticals.batch2.engaged}</td>
                <td>{summaryData.practical.extraPracticals.batch3.engaged}</td>
                <td>{summaryData.practical.overall.engaged}</td>
              </tr>
              <tr className="data-label-row">
                <td>Attendance</td>
                <td>Attendance</td>
                <td>Attendance</td>
                <td>Attendance</td>
                <td>Attendance</td>
                <td>Attendance</td>
                <td>Attendance</td>
              </tr>
              <tr className="data-value-row">
                <td>{summaryData.practical.batch1.attendance}</td>
                <td>{summaryData.practical.batch2.attendance}</td>
                <td>{summaryData.practical.batch3.attendance}</td>
                <td>{summaryData.practical.extraPracticals.batch1.attendance}</td>
                <td>{summaryData.practical.extraPracticals.batch2.attendance}</td>
                <td>{summaryData.practical.extraPracticals.batch3.attendance}</td>
                <td>{summaryData.practical.overall.attendance}<br />{summaryData.practical.overall.percentage} %</td>
              </tr>
              <tr className="data-label-row">
                <td>% Attendance</td>
                <td>% Attendance</td>
                <td>% Attendance</td>
                <td>% Attendance</td>
                <td>% Attendance</td>
                <td>% Attendance</td>
                <td>% Attendance</td>
              </tr>
              <tr className="data-value-row">
                <td>{summaryData.practical.batch1.percentage} %</td>
                <td>{summaryData.practical.batch2.percentage} %</td>
                <td>{summaryData.practical.batch3.percentage} %</td>
                <td>{summaryData.practical.extraPracticals.batch1.percentage} %</td>
                <td>{summaryData.practical.extraPracticals.batch2.percentage} %</td>
                <td>{summaryData.practical.extraPracticals.batch3.percentage} %</td>
                <td>{summaryData.practical.overall.percentage} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Tutorial</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Tutorials</th>
                <th>Engaged</th>
                <th>Total</th>
                <th>Attendance</th>
                <th>Percentage</th>
                <th>Overall</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tutorial</td>
                <td>{summaryData.tutorial.tutorialsEngaged}</td>
                <td>{summaryData.tutorial.tutorialsEngaged}</td>
                <td>{summaryData.tutorial.attendance}</td>
                <td>{summaryData.tutorial.percentage} %</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="footer-summary">
          <button className="print-button" onClick={handlePrint}>Print</button>
          <p>
            Copyright © 2019. All rights reserved{' '}
            <a href="https://vpt.edu.in/">Vidyalankar Polytechnic</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
