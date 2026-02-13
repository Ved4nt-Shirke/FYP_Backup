import React from 'react';
import { useParams } from 'react-router-dom';

export default function CTDashboard() {
  const { ciannId } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <h2>CT Dashboard (Placeholder)</h2>
      <p>Showing dashboard for CIANN ID: {ciannId || 'N/A'}</p>
    </div>
  );
}
