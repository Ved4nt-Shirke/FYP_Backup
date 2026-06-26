import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../basic/Header';


// Renders a single-student assessment page listing all experiments (both unassessed and already assessed)
// and allows updating/saving marks via /api/assessments/save-marks
export default function StudentWiseAssess() {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params to support direct links (e.g., /studentwise-assess?program=...&className=...&course=...)
  const searchParams = new URLSearchParams(location.search || '');
  const qp = {
    program: searchParams.get('program') || '',
    className: searchParams.get('className') || '',
    course: searchParams.get('course') || '',
    batch: searchParams.get('batch') || '',
    studentName: searchParams.get('studentName') || '',
    studentRollNo: searchParams.get('rollNo') || '',
  };

  const ciannData = location.state?.ciannData;
  const batch = location.state?.batch || qp.batch;

  // Derive student info from different flows (Select vs Setup vs Query)
  let studentName = location.state?.studentName || qp.studentName;
  let studentRollNo = qp.studentRollNo || '';
  if (!studentName && typeof location.state?.student === 'string') {
    try {
      const parsed = JSON.parse(location.state.student);
      studentName = parsed?.studentName || studentName;
      studentRollNo = parsed?.rollNo || studentRollNo || '';
    } catch (_) {}
  }

  // Derive subject info with robust fallbacks (also check localStorage ciannData)
  const storageCiann = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ciannData') || 'null'); } catch (_) { return null; }
  }, []);

  const program = (
    location.state?.program ||
    ciannData?.department?.program ||
    ciannData?.department?.name ||
    ciannData?.department?.label ||
    ciannData?.department?.value ||
    (typeof ciannData?.department === 'string' ? ciannData.department : '') ||
    storageCiann?.department?.program ||
    storageCiann?.department?.name ||
    storageCiann?.department?.label ||
    storageCiann?.department?.value ||
    (typeof storageCiann?.department === 'string' ? storageCiann.department : '') ||
    qp.program ||
    // Fallback: try to derive from CIANN ID pattern if available
    (ciannData?.ciannId ? ciannData.ciannId.split('-')[0] || '' : '') ||
    ''
  ).toString().trim();
  const className = (
    location.state?.className ||
    ciannData?.class ||
    ciannData?.division ||
    storageCiann?.class ||
    storageCiann?.division ||
    qp.className ||
    ''
  ).toString().trim();
  const course = (
    location.state?.course ||
    ciannData?.subject?.name ||
    ciannData?.subject?.code ||
    storageCiann?.subject?.name ||
    storageCiann?.subject?.code ||
    qp.course ||
    ''
  ).toString().trim();

  const [experiments, setExperiments] = useState([]); // all experiments from curriculum
  const [assessedMap, setAssessedMap] = useState({}); // experimentNumber -> marks
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subjectInfo = useMemo(() => ({ program, className, course }), [program, className, course]);

  // If missing subject context and we have ciannData, try to salvage values once here
  const hasMinimalContext = Boolean(program && className && course);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Reset state when student or subject changes to prevent cross-contamination
        setExperiments([]);
        setAssessedMap({});

        // Validate subject info before calling API
        // Require at least course; program is recommended but we will attempt best-effort fetch without it
        if (!subjectInfo.course) {
          console.warn('Missing minimal subjectInfo', { subjectInfo, ciannData, fromState: location.state, fromQuery: qp });
          setExperiments([]);
          throw new Error('Missing subject info (course). Use the Studentwise Select page or add course as a query param.');
        }
        if (!subjectInfo.program) {
          console.warn('Program missing; proceeding with best-effort fetch using course and class/division only', { subjectInfo, ciannData, fromState: location.state, fromQuery: qp });
        }

        // Build robust candidates for program, course (name/code) and class (class/division/composed)
        const courseCandidates = Array.from(new Set([
          subjectInfo.course,
          ciannData?.subject?.code,
          ciannData?.subject?.name,
          storageCiann?.subject?.code,
          storageCiann?.subject?.name,
          qp.course,
        ].filter(Boolean).map(s => String(s).trim())));

        const rawClass = subjectInfo.className || ciannData?.class || storageCiann?.class || '';
        const div = ciannData?.division || storageCiann?.division || '';
        const classCandidates = Array.from(new Set([
          subjectInfo.className,
          ciannData?.class,
          div,
          storageCiann?.class,
          storageCiann?.division,
          rawClass && div ? `${String(rawClass).trim()}${String(div).trim()}` : null,
          qp.className,
        ].filter(Boolean).map(s => String(s).trim())));

        const rawPrograms = [
          subjectInfo.program,
          ciannData?.department?.label,
          ciannData?.department?.value,
          typeof ciannData?.department === 'string' ? ciannData?.department : null,
          storageCiann?.department?.label,
          storageCiann?.department?.value,
          typeof storageCiann?.department === 'string' ? storageCiann?.department : null,
          qp.program,
        ].filter(Boolean).map(s => String(s).trim());
        const programCandidates = Array.from(new Set(rawPrograms.flatMap(p => {
          const title = p.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const slug = p.toLowerCase().replace(/\s+/g, '-');
          return [p, title, slug];
        })));

        let allExperiments = [];
        let lastErr = null;

        // Attempt to fetch using ciannId first if available
        const currentCiannId = ciannData?.ciannId || storageCiann?.ciannId || qp.ciannId;
        if (currentCiannId) {
          try {
            const params = new URLSearchParams({ ciannId: currentCiannId });
            const expRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/get-experiments?${params.toString()}`);
            const expData = await expRes.json();
            if (expRes.ok && expData?.success && Array.isArray(expData.experiments) && expData.experiments.length > 0) {
              allExperiments = expData.experiments;
            }
          } catch (err) {
            console.warn("Failed to fetch experiments by ciannId:", err);
          }
        }

        // Try with className + course combinations first, iterating through program candidates if not found yet
        if (!allExperiments.length) {
          outer: for (const prog of programCandidates.length ? programCandidates : ['']) {
            if (!prog) continue; // backend requires program
            for (const cls of classCandidates) {
              for (const crs of courseCandidates) {
                try {
                  const params = new URLSearchParams({ 
                    program: prog, 
                    className: cls, 
                    course: crs,
                    ciannId: currentCiannId || '',
                    semester: ciannData?.semester || storageCiann?.semester || ''
                  });
                  const expRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/get-experiments?${params.toString()}`);
                  const expData = await expRes.json();
                  if (expRes.ok && expData?.success && Array.isArray(expData.experiments) && expData.experiments.length > 0) {
                    allExperiments = expData.experiments;
                    break outer;
                  } else {
                    lastErr = new Error(expData?.message || `No experiments for program=${prog} class=${cls} course=${crs}`);
                  }
                } catch (err) {
                  lastErr = err;
                }
              }
            }
          }
        }

        // If still not found, try Program+Course only (backend falls back to this)
        if (!allExperiments.length) {
          for (const prog of programCandidates.length ? programCandidates : ['']) {
            if (!prog) continue; // backend requires program
            try {
              const params = new URLSearchParams({ program: prog, course: subjectInfo.course });
              const expRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/get-experiments?${params.toString()}`);
              const expData = await expRes.json();
              if (expRes.ok && expData?.success && Array.isArray(expData.experiments) && expData.experiments.length > 0) {
                allExperiments = expData.experiments;
                break;
              } else {
                lastErr = new Error(expData?.message || `No experiments found for program=${prog} course=${subjectInfo.course}`);
              }
            } catch (err) {
              lastErr = err;
            }
          }
        }

        if (!allExperiments.length) {
          throw lastErr || new Error('Experiments not found for the provided subject/course');
        }

        // Set experiments immediately so UI renders even if history fails
        setExperiments(allExperiments);

        // Fetch student assessment history (best-effort)
        if (studentName) {
          try {
            const histRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/student-history/${encodeURIComponent(studentName)}`);
            const histData = await histRes.json();
            const existing = histData?.assessments || [];

            // Build map from experimentNumber to existing marks, but ONLY for the current subject context
            const map = {};
            existing.forEach(a => {
              if (typeof a.experimentNumber === 'number') {
                // Filter assessments to only include those for the current subject/course context
                // Check multiple possible course identifiers for robust matching
                const assessmentCourse = a.course || a.courseName || a.subject || '';
                const assessmentSubject = a.subjectName || a.subjectCode || a.subject || '';
                const assessmentCiannId = a.ciannId || '';
                
                // Match by course name/code or CIANN ID if available
                const courseMatches = assessmentCourse && (
                  assessmentCourse.toLowerCase().includes(course.toLowerCase()) ||
                  course.toLowerCase().includes(assessmentCourse.toLowerCase())
                );
                const subjectMatches = assessmentSubject && (
                  assessmentSubject.toLowerCase().includes(course.toLowerCase()) ||
                  course.toLowerCase().includes(assessmentSubject.toLowerCase())
                );
                const ciannMatches = assessmentCiannId && ciannData?.ciannId && 
                  assessmentCiannId === ciannData.ciannId;
                
                // Only include marks if they match the current subject context
                if (courseMatches || subjectMatches || ciannMatches) {
                  map[a.experimentNumber] = Number(a.marks);
                  console.log(`Including assessment for exp ${a.experimentNumber}: course match=${courseMatches}, subject match=${subjectMatches}, ciann match=${ciannMatches}`);
                } else {
                  console.log(`Filtering out assessment for exp ${a.experimentNumber} from different subject context:`, {
                    assessmentCourse,
                    assessmentSubject,
                    assessmentCiannId,
                    currentCourse: course,
                    currentCiannId: ciannData?.ciannId
                  });
                }
              }
            });
            setAssessedMap(map);
          } catch (histErr) {
            console.warn('Student history fetch failed, continuing without it', histErr);
            setAssessedMap({});
          }
        } else {
          setAssessedMap({});
        }
      } catch (e) {
        console.error('Failed to load student-wise assessment data', e);
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectInfo, studentName]);

  const handleMarksChange = (expNo, value) => {
    const num = value === '' ? '' : Number(value);
    if (num === '' || (!Number.isNaN(num) && num >= 0 && num <= 25)) {
      setAssessedMap(prev => ({ ...prev, [expNo]: value === '' ? '' : num }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Prepare payload: only the current student for all experiments shown
      const studentsMarks = experiments.map(exp => ({
        studentName,
        rollNo: studentRollNo,
        marks: assessedMap[exp.practicalNo] === '' || assessedMap[exp.practicalNo] == null ? 0 : Number(assessedMap[exp.practicalNo]),
      }));

      // The API expects one experiment at a time currently.
      for (const exp of experiments) {
        const payload = {
          studentsMarks: [
            {
              studentName,
              rollNo: studentRollNo,
              marks: assessedMap[exp.practicalNo] === '' || assessedMap[exp.practicalNo] == null ? 0 : Number(assessedMap[exp.practicalNo]),
            },
          ],
          experimentId: String(exp.practicalNo),
          experimentName: exp.practicalName,
          batch,
          // persist context so defaulter loads updated marks later
          program,
          className,
          course,
          ciannId: ciannData?.ciannId,
        };

        const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/save-marks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to save marks');
        }
      }
      alert('All marks saved successfully');
      // Navigate to Studentwise Select after successful save of all experiments
      navigate('/studentwise-select');
    } catch (e) {
      console.error('Failed to save', e);
      setError(e.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div className="container" style={{ padding: 16 }}>
          <h3 className="text-center bg-success text-white p-2 rounded">Studentwise Assessment</h3>
          <div className="text-center">Loading...</div>
        </div>

      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <div className="container-fluid" style={{ padding: 16, maxWidth: 'none' }}>
        <h3 className="text-center bg-success text-white p-2 rounded">Studentwise Assessment</h3>

        {ciannData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>Student:</strong> {studentName} <br />
            <strong>CIANN ID:</strong> {ciannData.ciannId} <br />
            <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) <br />
            <strong>Division:</strong> {ciannData.division}
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-light">
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Exp ID</th>
                <th style={{ width: '55%' }}>Exp Name</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Marks (0-25)</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No experiments found</td>
                </tr>
              ) : (
                experiments.map((exp) => {
                  const isAssessed = assessedMap[exp.practicalNo] !== undefined && assessedMap[exp.practicalNo] !== '' && assessedMap[exp.practicalNo] !== null;
                  return (
                    <tr key={`student-${studentName}-exp-${exp.practicalNo}`}>
                      <td style={{ textAlign: 'center' }}>{exp.practicalNo}</td>
                      <td>{exp.practicalName}</td>
                      <td style={{ textAlign: 'center' }}>
                        {isAssessed ? (
                          <span className="badge bg-success">Assessed</span>
                        ) : (
                          <span className="badge bg-secondary">Not Assessed</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={25}
                          value={assessedMap[exp.practicalNo] ?? ''}
                          onChange={(e) => handleMarksChange(exp.practicalNo, e.target.value)}
                          placeholder="Enter marks"
                          style={{ maxWidth: 120, margin: '0 auto' }}
                          key={`marks-input-${studentName}-${exp.practicalNo}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-success" onClick={handleSave} disabled={saving || experiments.length === 0}>
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

    </>
  );
}
