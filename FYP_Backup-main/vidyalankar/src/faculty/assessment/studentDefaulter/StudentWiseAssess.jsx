import React, { useEffect, useState } from 'react';
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

  const CiaanData = location.state?.CiaanData;
  const batch = location.state?.batch || qp.batch;

  // Derive student info from different flows (Select vs Setup vs Query)
  let studentName = location.state?.studentName || qp.studentName;
  let studentRollNo = qp.studentRollNo || '';
  if (!studentName && typeof location.state?.student === 'string') {
    try {
      const parsed = JSON.parse(location.state.student);
      studentName = parsed?.studentName || studentName;
      studentRollNo = parsed?.rollNo || studentRollNo || '';
    } catch (_) { }
  }

  // Derive subject/context info from CiaanData or query params
  const course = (
    location.state?.course ||
    CiaanData?.subject?.name ||
    CiaanData?.subject?.code ||
    qp.course ||
    ''
  ).toString().trim();



  const [experiments, setExperiments] = useState([]); // only assessed experiments for this Ciaan
  const [assessedMap, setAssessedMap] = useState({}); // experimentNumber -> marks
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        setExperiments([]);
        setAssessedMap({});

        const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "");

        // Step 1: Fetch only assessed experiments for this Ciaan
        const aeParams = new URLSearchParams();
        if (CiaanData?.CiaanId) aeParams.append('CiaanId', CiaanData.CiaanId);
        const aeRes = await fetch(`${apiBase}/api/assessments/assessed-experiments?${aeParams.toString()}`);
        const aeData = await aeRes.json();

        if (!aeData.success || !Array.isArray(aeData.experiments) || aeData.experiments.length === 0) {
          throw new Error('No assessed experiments found for this CIAAN. Please complete assessments first.');
        }

        // Convert assessed experiments to the same shape as curriculum experiments
        // assessed-experiments returns { id, name } — map to { practicalNo, practicalName }
        const assessedExps = aeData.experiments.map(e => ({
          practicalNo: e.id,
          practicalName: e.name,
        }));
        setExperiments(assessedExps);

        // Step 2: Fetch this student's marks (best-effort), filtered by CiaanId
        if (studentName) {
          try {
            const histRes = await fetch(
              `${apiBase}/api/assessments/student-history/${encodeURIComponent(studentName)}`
            );
            const histData = await histRes.json();
            const existing = histData?.assessments || [];

            const map = {};
            existing.forEach(a => {
              if (typeof a.experimentNumber !== 'number') return;

              // Only include marks that belong to this Ciaan
              const CiaanMatches =
                a.CiaanId && CiaanData?.CiaanId && String(a.CiaanId) === String(CiaanData.CiaanId);
              // Fallback: match by course name/code
              const assessmentCourse = (a.course || a.courseName || a.subject || '').toLowerCase();
              const currentCourse = course.toLowerCase();
              const courseMatches =
                currentCourse &&
                assessmentCourse &&
                (assessmentCourse.includes(currentCourse) || currentCourse.includes(assessmentCourse));

              // Only include if the experiment was actually assessed (exists in assessedExps)
              const isAssessedExp = assessedExps.some(e => e.practicalNo === a.experimentNumber);

              if (isAssessedExp && (CiaanMatches || courseMatches)) {
                map[a.experimentNumber] = Number(a.marks);
              }
            });
            setAssessedMap(map);
          } catch (histErr) {
            console.warn('Student history fetch failed, continuing without it', histErr);
            setAssessedMap({});
          }
        }
      } catch (e) {
        console.error('Failed to load student-wise assessment data', e);
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [CiaanData?.CiaanId, studentName, course]);


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
          program: CiaanData?.department?.name || CiaanData?.department?.program || location.state?.program || '',
          className: CiaanData?.class || CiaanData?.division || location.state?.className || '',
          course,
          CiaanId: CiaanData?.CiaanId,
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
      // Go back to student selection for the same Ciaan
      navigate('/studentwise-select', {
        state: { CiaanData, availableBatches: [] },
      });
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

        {CiaanData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>Student:</strong> {studentName} <br />
            <strong>Ciaan ID:</strong> {CiaanData.CiaanId} <br />
            <strong>Subject:</strong> {CiaanData.subject?.name} ({CiaanData.subject?.code}) <br />
            <strong>Division:</strong> {CiaanData.division}
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
