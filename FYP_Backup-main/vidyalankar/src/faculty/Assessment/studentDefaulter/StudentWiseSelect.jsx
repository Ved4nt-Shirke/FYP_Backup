import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../basic/Header';

export default function StudentWiseSelect() {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData || null;
  const passedBatches = location.state?.availableBatches || [];

  const [batches, setBatches] = useState(passedBatches);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load division-aware batches when CIANN is selected
    const loadBatches = async () => {
      try {
        const params = new URLSearchParams();
        if (ciannData?.ciannId) params.append('ciannId', ciannData.ciannId);
        if (ciannData?.division) params.append('division', ciannData.division);

        const query = params.toString();
        const url = query
          ? `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches?${query}`
          : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setBatches(data.batches || []);
      } catch (e) {
        console.error('Failed to load batches', e);
      }
    };
    loadBatches();
  }, [ciannData?.ciannId, ciannData?.division]);

  const handleBatchChange = async (batch) => {
    setSelectedBatch(batch);
    setSelectedStudent('');
    setStudents([]);
    if (!batch) return;
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ batch: String(batch || '') });
      if (ciannData?.ciannId) params.append('ciannId', ciannData.ciannId);
      if (ciannData?.division) params.append('division', ciannData.division);

      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/students-by-batch?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setError(data.message || 'Failed to load students');
      }
    } catch (e) {
      console.error('Failed to load students', e);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedBatch || !selectedStudent) {
      alert('Please select both batch and student');
      return;
    }
    // Navigate to student-wise assessment page with necessary context
    navigate('/studentwise-assess', {
      state: {
        ciannData,
        batch: selectedBatch,
        studentName: selectedStudent,
        // Be robust across different CIANN schemas
        program: ciannData?.department?.program || ciannData?.department?.name || (typeof ciannData?.department === 'string' ? ciannData.department : ''),
        className: ciannData?.class || '',
        course: ciannData?.subject?.name || ciannData?.subject?.code || '',
      },
    });
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container" style={{ maxWidth: 720, padding: 16 }}>
        <h3 className="text-center bg-success text-white p-2 rounded">Studentwise Assessment - Select Student</h3>

        {ciannData && (
          <div className="alert alert-info">
            <strong>CIANN ID:</strong> {ciannData.ciannId} |{' '}
            <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) |{' '}
            <strong>Division:</strong> {ciannData.division}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Select Batch</label>
          <select
            className="form-select"
            value={selectedBatch}
            onChange={(e) => handleBatchChange(e.target.value)}
          >
            <option value="">-- Select Batch --</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Select Student</label>
          <select
            className="form-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={!selectedBatch || loading || students.length === 0}
          >
            {!selectedBatch ? (
              <option value="">-- Select a Batch First --</option>
            ) : loading ? (
              <option value="">Loading students...</option>
            ) : students.length === 0 ? (
              <option value="">No students</option>
            ) : (
              <>
                <option value="">-- Select Student --</option>
                {students.map((s) => (
                  <option key={s.studentName} value={s.studentName}>
                    {s.rollNo ? `${s.rollNo} - ${s.studentName}` : s.studentName}
                  </option>
                ))}
              </>
            )}
          </select>
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-success" onClick={handleProceed} disabled={!selectedBatch || !selectedStudent}>
            Proceed
          </button>
        </div>
      </div>
    </>
  );
}
