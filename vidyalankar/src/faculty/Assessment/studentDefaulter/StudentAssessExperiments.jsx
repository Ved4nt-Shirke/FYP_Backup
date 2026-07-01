import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../../basic/Header';

export default function StudentAssessExperiments() {
  const location = useLocation();
  const CiaanData = location.state?.CiaanData;
  const batch = location.state?.batch;
  const student = useMemo(() => {
    try { return location.state?.student ? JSON.parse(location.state.student) : null; } catch { return location.state?.student || null; }
  }, [location.state]);
  const program = location.state?.program;
  const className = location.state?.className;
  const course = location.state?.course;

  const [experiments, setExperiments] = useState([]);
  const [assessed, setAssessed] = useState([]); // ids already assessed for this student
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [marksByExp, setMarksByExp] = useState({}); // { [expId]: number }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Reset state when student or subject changes to prevent cross-contamination
        setExperiments([]);
        setAssessed([]);
        setMarksByExp({});

        // 1) Fetch experiments for subject
        const expRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/get-experiments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program, className, course })
        });
        const expData = await expRes.json();
        if (!expData.success) throw new Error(expData.message || 'Failed to fetch experiments');
        const list = (expData.experiments || []).map(e => ({ id: e.practicalNo, name: e.practicalName }));
        setExperiments(list);

        // 2) Fetch this student's history to mark already assessed (filtered by subject context)
        const name = student?.studentName || student?.name || '';
        if (name) {
          const histRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/student-history/${encodeURIComponent(name)}`);
          const histData = await histRes.json();
          if (histData.success && Array.isArray(histData.assessments)) {
            const byExp = {};
            const done = new Set();
            histData.assessments.forEach(a => {
              if (typeof a.experimentNumber === 'number') {
                // Filter assessments to only include those for the current subject/course context
                const assessmentCourse = a.course || a.courseName || a.subject || '';
                const assessmentSubject = a.subjectName || a.subjectCode || a.subject || '';
                const assessmentCiaanId = a.CiaanId || '';

                // Match by course name/code or Ciaan ID if available
                const courseMatches = assessmentCourse && (
                  assessmentCourse.toLowerCase().includes(course.toLowerCase()) ||
                  course.toLowerCase().includes(assessmentCourse.toLowerCase())
                );
                const subjectMatches = assessmentSubject && (
                  assessmentSubject.toLowerCase().includes(course.toLowerCase()) ||
                  course.toLowerCase().includes(assessmentSubject.toLowerCase())
                );
                const CiaanMatches = assessmentCiaanId && CiaanData?.CiaanId &&
                  assessmentCiaanId === CiaanData.CiaanId;

                // Only include marks if they match the current subject context
                if (courseMatches || subjectMatches || CiaanMatches) {
                  done.add(a.experimentNumber);
                  byExp[a.experimentNumber] = a.marks;
                  console.log(`Including assessment for exp ${a.experimentNumber}: course match=${courseMatches}, subject match=${subjectMatches}, Ciaan match=${CiaanMatches}`);
                } else {
                  console.log(`Filtering out assessment for exp ${a.experimentNumber} from different subject context:`, {
                    assessmentCourse,
                    assessmentSubject,
                    assessmentCiaanId,
                    currentCourse: course,
                    currentCiaanId: CiaanData?.CiaanId
                  });
                }
              }
            });
            setAssessed(Array.from(done));
            setMarksByExp(byExp);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [program, className, course, student]);

  const handleMarkChange = (expId, value) => {
    const val = value === '' ? '' : Number(value);
    if (val !== '' && (isNaN(val) || val < 0 || val > 25)) return; // clamp 0-25
    setMarksByExp(prev => ({ ...prev, [expId]: value === '' ? '' : val }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const name = student?.studentName || student?.name;
      const rollNo = student?.rollNo || '';
      // build payload for only experiments with numeric marks
      const studentsMarks = Object.entries(marksByExp)
        .filter(([, m]) => m !== '' && typeof m === 'number')
        .map(([expId, m]) => ({ studentName: name, rollNo, marks: m, experimentId: Number(expId) }));

      if (studentsMarks.length === 0) {
        setError('Please enter marks for at least one experiment');
        return;
      }

      // API requires experimentId and experimentName per record; we will send per-experiment requests or decorate body
      // Optimize: group by experimentId -> send one request with proper fields
      // We'll send one experiment at a time to keep backend schema satisfied
      for (const sm of studentsMarks) {
        const expMeta = experiments.find(e => e.id === sm.experimentId);
        const body = {
          experimentId: sm.experimentId,
          experimentName: expMeta?.name || `Experiment ${sm.experimentId}`,
          batch,
          studentsMarks: [
            { studentName: name, rollNo, marks: sm.marks }
          ]
        };
        const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/save-marks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to save marks');
      }

      // refresh assessed list (filtered by subject context)
      const histRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/student-history/${encodeURIComponent(student?.studentName)}`);
      const histData = await histRes.json();
      if (histData.success) {
        const done = new Set();
        histData.assessments.forEach(a => {
          if (typeof a.experimentNumber === 'number') {
            // Filter assessments to only include those for the current subject/course context
            const assessmentCourse = a.course || a.courseName || a.subject || '';
            const assessmentSubject = a.subjectName || a.subjectCode || a.subject || '';
            const assessmentCiaanId = a.CiaanId || '';

            // Match by course name/code or Ciaan ID if available
            const courseMatches = assessmentCourse && (
              assessmentCourse.toLowerCase().includes(course.toLowerCase()) ||
              course.toLowerCase().includes(assessmentCourse.toLowerCase())
            );
            const subjectMatches = assessmentSubject && (
              assessmentSubject.toLowerCase().includes(course.toLowerCase()) ||
              course.toLowerCase().includes(assessmentSubject.toLowerCase())
            );
            const CiaanMatches = assessmentCiaanId && CiaanData?.CiaanId &&
              assessmentCiaanId === CiaanData.CiaanId;

            // Only include if they match the current subject context
            if (courseMatches || subjectMatches || CiaanMatches) {
              done.add(a.experimentNumber);
            }
          }
        });
        setAssessed(Array.from(done));
      }
      alert('Marks saved');
    } catch (err) {
      setError(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div className="container" style={{ maxWidth: 900 }}>
          <h4 className="mt-3">Loading...</h4>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <div className="container" style={{ maxWidth: 1000 }}>
        <h3 className="text-center bg-success text-white p-2 rounded mt-3">Assess Student: {student?.studentName}</h3>
        {CiaanData && (
          <div className="alert alert-info mt-3">
            <strong>Batch:</strong> {batch} | <strong>CIAAN:</strong> {CiaanData.CiaanId} | <strong>Subject:</strong> {CiaanData.subject?.name} ({CiaanData.subject?.code})
          </div>
        )}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <div className="table-responsive mt-3">
          <table className="table table-bordered table-striped">
            <thead className="table-light">
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Exp ID</th>
                <th style={{ width: '55%' }}>Experiment</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Marks (0-25)</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No experiments found</td>
                </tr>
              ) : experiments.map(exp => {
                const isDone = assessed.includes(exp.id);
                const mark = marksByExp[exp.id] ?? '';
                const studentKey = student?.studentName || student?.name || 'unknown';
                return (
                  <tr key={`exp-${exp.id}-student-${studentKey}`}>
                    <td style={{ textAlign: 'center' }}>{exp.id}</td>
                    <td>{exp.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isDone ? <span className="badge bg-success">Assessed</span> : <span className="badge bg-secondary">Pending</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={25}
                        value={mark}
                        onChange={(e) => handleMarkChange(exp.id, e.target.value)}
                        placeholder="Enter marks"
                        key={`marks-${exp.id}-${studentKey}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-success" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      </div>
    </>
  );
}
