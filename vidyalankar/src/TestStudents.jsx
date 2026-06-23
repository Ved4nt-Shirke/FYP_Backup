// TestStudents.jsx - Simple test component to check students API
import React, { useState, useEffect } from 'react';

const TestStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('🔍 Testing students API...');
        const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students`);
        console.log('📡 Response status:', response.status);
        console.log('✅ Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Students data:', data);
        setStudents(data);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) return <div>Loading students...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Students Test Component</h2>
      <p>Total students: {students.length}</p>
      
      {students.length > 0 ? (
        <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Enrollment No</th>
              <th>Student Name</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student._id || index}>
                <td>{student.rollNo}</td>
                <td>{student.enrollmentNo}</td>
                <td>{student.studentName}</td>
                <td>{student.batch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No students found</p>
      )}
    </div>
  );
};

export default TestStudents;
