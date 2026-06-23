import React, { useEffect, useState } from 'react';
import { config } from '../../config/api';
import './SummaryPage.css';

const SummaryPage = () => {
  const reportType = localStorage.getItem('summaryReportType') || 'ciann';
  const isAttendanceReport = reportType === 'attendance';
  const [ciannData, setCiannData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [teachingPlans, setTeachingPlans] = useState([]);
  const [labPlans, setLabPlans] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [knowledgeMap, setKnowledgeMap] = useState([]);
  const [bookResources, setBookResources] = useState([]);
  const [webResources, setWebResources] = useState([]);
  const [moocCourses, setMoocCourses] = useState([]);

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
      fetchAllPrintData(parsedData);
    }
  }, []);

  const getAcademicContext = (data) => {
    const program = data?.department?.label || data?.department?.name || data?.department || '';
    const className = data?.courseCode || data?.class || data?.className || '';
    const course = data?.subject?.name || data?.subjectName || '';
    return {
      program: String(program || '').trim(),
      className: String(className || '').trim(),
      course: String(course || '').trim(),
    };
  };

  const fetchAllPrintData = async (data) => {
    const ciannId = data?.ciannId;
    if (!ciannId) {
      return;
    }

    const { program, className, course } = getAcademicContext(data);
    console.log('FETCHING PRINT DATA FOR CIANN ID:', ciannId);
    try {
      const [
        summaryResponse,
        teachingPlanResponse,
        labPlanResponse,
        chaptersResponse,
        experimentsResponse,
        outcomesResponse,
        objectivesResponse,
        knowledgeMapResponse,
        booksResponse,
        webResourcesResponse,
        moocResponse,
      ] = await Promise.allSettled([
        fetch(`${config.apiBaseUrl}/summary/${ciannId}`),
        fetch(`${config.teachingPlan}/${ciannId}`),
        fetch(`${config.labPlanning}/${ciannId}`),
        fetch(`${config.course.chapters}/get-chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program, className, course }),
        }),
        fetch(`${config.apiBaseUrl}/get-experiments/get-experiments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program, className, course }),
        }),
        fetch(`${config.subjectDetails}/course-outcomes/${ciannId}`),
        fetch(`${config.subjectDetails}/objectives/${ciannId}`),
        fetch(`${config.subjectDetails}/knowledge-map/${ciannId}`),
        fetch(`${config.subjectDetails}/book-resources/${ciannId}`),
        fetch(`${config.subjectDetails}/web-resources/${ciannId}`),
        fetch(`${config.subjectDetails}/mooc-courses/${ciannId}`),
      ]);

      if (summaryResponse.status !== 'fulfilled' || !summaryResponse.value.ok) {
        const status = summaryResponse.status === 'fulfilled' ? summaryResponse.value.status : 'REQUEST_FAILED';
        throw new Error(`Summary fetch failed with status ${status}`);
      }

      const summary = await summaryResponse.value.json();
      setSummaryData(summary);

      if (teachingPlanResponse.status === 'fulfilled' && teachingPlanResponse.value.ok) {
        const teachingPlansData = await teachingPlanResponse.value.json();
        setTeachingPlans(Array.isArray(teachingPlansData) ? teachingPlansData : []);
      } else {
        setTeachingPlans([]);
      }

      if (labPlanResponse.status === 'fulfilled' && labPlanResponse.value.ok) {
        const labPlansData = await labPlanResponse.value.json();
        setLabPlans(Array.isArray(labPlansData) ? labPlansData : []);
      } else {
        setLabPlans([]);
      }

      if (chaptersResponse.status === 'fulfilled' && chaptersResponse.value.ok) {
        const chapterPayload = await chaptersResponse.value.json();
        setChapters(Array.isArray(chapterPayload?.chp) ? chapterPayload.chp : []);
      } else {
        setChapters([]);
      }

      if (experimentsResponse.status === 'fulfilled' && experimentsResponse.value.ok) {
        const experimentsPayload = await experimentsResponse.value.json();
        setExperiments(Array.isArray(experimentsPayload?.experiments) ? experimentsPayload.experiments : []);
      } else {
        setExperiments([]);
      }

      if (outcomesResponse.status === 'fulfilled' && outcomesResponse.value.ok) {
        const payload = await outcomesResponse.value.json();
        setCourseOutcomes(Array.isArray(payload) ? payload : []);
      } else {
        setCourseOutcomes([]);
      }

      if (objectivesResponse.status === 'fulfilled' && objectivesResponse.value.ok) {
        const payload = await objectivesResponse.value.json();
        setObjectives(Array.isArray(payload) ? payload : []);
      } else {
        setObjectives([]);
      }

      if (knowledgeMapResponse.status === 'fulfilled' && knowledgeMapResponse.value.ok) {
        const payload = await knowledgeMapResponse.value.json();
        setKnowledgeMap(Array.isArray(payload) ? payload : []);
      } else {
        setKnowledgeMap([]);
      }

      if (booksResponse.status === 'fulfilled' && booksResponse.value.ok) {
        const payload = await booksResponse.value.json();
        setBookResources(Array.isArray(payload) ? payload : []);
      } else {
        setBookResources([]);
      }

      if (webResourcesResponse.status === 'fulfilled' && webResourcesResponse.value.ok) {
        const payload = await webResourcesResponse.value.json();
        setWebResources(Array.isArray(payload) ? payload : []);
      } else {
        setWebResources([]);
      }

      if (moocResponse.status === 'fulfilled' && moocResponse.value.ok) {
        const payload = await moocResponse.value.json();
        setMoocCourses(Array.isArray(payload) ? payload : []);
      } else {
        setMoocCourses([]);
      }
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
      setTeachingPlans([]);
      setLabPlans([]);
      setChapters([]);
      setExperiments([]);
      setCourseOutcomes([]);
      setObjectives([]);
      setKnowledgeMap([]);
      setBookResources([]);
      setWebResources([]);
      setMoocCourses([]);
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
          <h1>{isAttendanceReport ? 'Attendance Summary Report' : 'CIAAN Print Report'}</h1>
          <div className="ciann-info">
            <p><strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code})</p>
            <p><strong>Division:</strong> {ciannData.division}</p>
            <p><strong>CIANN ID:</strong> {ciannData.ciannId}</p>
            <p><strong>Academic Year:</strong> {ciannData.academicYear || '-'}</p>
            <p><strong>Class:</strong> {ciannData.courseCode || ciannData.class || '-'}</p>
            <p><strong>Semester:</strong> {ciannData.semester || '-'}</p>
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

        <h3>Course Content (Edit CIAAN)</h3>
        <div className="overflow-x-auto summary-section">
          <table>
            <thead>
              <tr>
                <th>Course Chapters</th>
                <th>Experiments / Practicals</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left' }}>
                  {chapters.length > 0 ? (
                    <ol>
                      {chapters.map((chapter, index) => (
                        <li key={`ch-${chapter.chapterNo || index}`}>
                          {chapter.chapterNo ? `${chapter.chapterNo}. ` : ''}{chapter.chapterName || '-'}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    'No chapter data available.'
                  )}
                </td>
                <td style={{ textAlign: 'left' }}>
                  {experiments.length > 0 ? (
                    <ol>
                      {experiments.map((experiment, index) => (
                        <li key={`ex-${experiment.practicalNo || index}`}>
                          {experiment.practicalNo ? `${experiment.practicalNo}. ` : ''}{experiment.practicalName || '-'}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    'No experiment data available.'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Teaching Plan (Edit CIAAN)</h3>
        <div className="overflow-x-auto summary-section">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Plan Count</th>
                <th>Completed Entries</th>
                <th>Pending Entries</th>
              </tr>
            </thead>
            <tbody>
              {teachingPlans.length > 0 ? (
                teachingPlans
                  .sort((left, right) => (left.weekNo || 0) - (right.weekNo || 0))
                  .map((weekPlan) => {
                    const plans = Array.isArray(weekPlan.plans) ? weekPlan.plans : [];
                    const completed = plans.filter((item) => item?.actualDate || item?.endDate).length;
                    const pending = Math.max(plans.length - completed, 0);
                    return (
                      <tr key={`tp-${weekPlan._id || weekPlan.weekNo}`}>
                        <td>{weekPlan.weekNo || '-'}</td>
                        <td>{plans.length}</td>
                        <td>{completed}</td>
                        <td>{pending}</td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan="4">No teaching plan data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Laboratory Plan (Edit CIAAN)</h3>
        <div className="overflow-x-auto summary-section">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Lab Entries</th>
                <th>Completed Entries</th>
                <th>Pending Entries</th>
              </tr>
            </thead>
            <tbody>
              {labPlans.length > 0 ? (
                labPlans
                  .sort((left, right) => (left.weekNo || 0) - (right.weekNo || 0))
                  .map((weekPlan) => {
                    const plans = Array.isArray(weekPlan.plans) ? weekPlan.plans : [];
                    const completed = plans.filter((item) => item?.actualDate).length;
                    const pending = Math.max(plans.length - completed, 0);
                    return (
                      <tr key={`lp-${weekPlan._id || weekPlan.weekNo}`}>
                        <td>{weekPlan.weekNo || '-'}</td>
                        <td>{plans.length}</td>
                        <td>{completed}</td>
                        <td>{pending}</td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan="4">No laboratory plan data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Subject Details (Edit CIAAN)</h3>
        <div className="overflow-x-auto summary-section">
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Count</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Course Outcomes</td>
                <td>{courseOutcomes.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {courseOutcomes.length > 0
                    ? courseOutcomes.slice(0, 3).map((item) => item.description).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
              <tr>
                <td>Subject Objectives</td>
                <td>{objectives.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {objectives.length > 0
                    ? objectives.slice(0, 3).map((item) => item.description).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
              <tr>
                <td>Knowledge Map</td>
                <td>{knowledgeMap.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {knowledgeMap.length > 0
                    ? knowledgeMap.slice(0, 3).map((item) => item.topic).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
              <tr>
                <td>Book Resources</td>
                <td>{bookResources.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {bookResources.length > 0
                    ? bookResources.slice(0, 3).map((item) => item.title || item.bookName).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
              <tr>
                <td>Web Resources</td>
                <td>{webResources.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {webResources.length > 0
                    ? webResources.slice(0, 3).map((item) => item.title || item.url).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
              <tr>
                <td>MOOC Courses</td>
                <td>{moocCourses.length}</td>
                <td style={{ textAlign: 'left' }}>
                  {moocCourses.length > 0
                    ? moocCourses.slice(0, 3).map((item) => item.courseName || item.title).filter(Boolean).join(' | ')
                    : 'No data'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="footer-summary">
          <button className="print-button" onClick={handlePrint}>Print</button>
          <p>
            Copyright © 2026. All rights reserved{' '}
            <a href="https://vpt.edu.in/">Vidyalankar Polytechnic</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
