import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../basic/Header';

export default function StudentAssessSetup() {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData || null;

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoadingBatches(true);
        const res = await fetch('http://localhost:5000/api/assessments/batches');
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches || []);
        } else {
          setError(data.message || 'Failed to load batches');
        }
      } catch (err) {
        setError('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  const handleBatchChange = async (batch) => {
    setSelectedBatch(batch);
    setSelectedStudent('');
    if (!batch) {
      setStudents([]);
      return;
    }
    try {
      setLoadingStudents(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/assessments/students-by-batch?batch=${encodeURIComponent(batch)}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setError(data.message || 'Failed to load students');
        setStudents([]);
      }
    } catch (err) {
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const canProceed = selectedBatch && selectedStudent && ciannData;

  const handleNext = () => {
    if (!canProceed) return;
    // Extract subject details needed to fetch experiments later
    const program = ciannData?.department?.program || ciannData?.department; // fallback
    const className = ciannData?.class;
    const course = ciannData?.subject?.name || ciannData?.subject?.code;

    navigate('/studentwise-assess', {
      state: {
        ciannData,
        batch: selectedBatch,
        student: selectedStudent,
        program,
        className,
        course,
      }
    });
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container" style={{ maxWidth: 800 }}>
        <h3 className="text-center bg-success text-white p-2 rounded mt-3">Student-wise Progressive Assessment</h3>

        {ciannData && (
          <div className="alert alert-info mt-3">
            <strong>CIAAN:</strong> {ciannData.ciannId} | <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) | <strong>Division:</strong> {ciannData.division}
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3">{error}</div>
        )}

        <div className="card mt-3">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Select Batch</label>
              {loadingBatches ? (
                <div>Loading batches...</div>
              ) : (
                <select className="form-select" value={selectedBatch} onChange={(e) => handleBatchChange(e.target.value)}>
                  <option value="">-- Select Batch --</option>
                  {batches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Select Student</label>
              {loadingStudents ? (
                <div>Loading students...</div>
              ) : (
                <select className="form-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} disabled={!selectedBatch}>
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.rollNo + '-' + s.studentName} value={JSON.stringify(s)}>
                      {s.rollNo ? `${s.rollNo} - ` : ''}{s.studentName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="d-flex justify-content-end">
              <button className="btn btn-success" disabled={!canProceed} onClick={handleNext}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
