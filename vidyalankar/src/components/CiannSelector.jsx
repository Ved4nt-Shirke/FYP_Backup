import React, { useState, useEffect } from 'react';
import { useCiann } from '../hooks/useCiann';

const CiannSelector = ({ onSelect, onCancel }) => {
  const { cianns, fetchAllCianns, loading, error } = useCiann();
  const [selectedCiann, setSelectedCiann] = useState(null);

  useEffect(() => {
    fetchAllCianns();
  }, [fetchAllCianns]);

  const handleSelect = () => {
    if (selectedCiann) {
      onSelect(selectedCiann);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '500px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    },
    header: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#0c2c40'
    },
    ciannCard: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    ciannCardSelected: {
      border: '2px solid #009245',
      backgroundColor: '#f0f9f4',
    },
    ciannCardHover: {
      backgroundColor: '#f8f9fa',
    },
    ciannId: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#0c2c40'
    },
    ciannDetails: {
      fontSize: '14px',
      color: '#666',
      marginTop: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    selectButton: {
      backgroundColor: '#009245',
      color: 'white'
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: '#666'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#dc3545'
    },
    noCianns: {
      textAlign: 'center',
      padding: '20px',
      color: '#666'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>Select a CIANN</div>
        
        {loading && (
          <div style={styles.loading}>Loading CIANNs...</div>
        )}
        
        {error && (
          <div style={styles.error}>Error: {error}</div>
        )}
        
        {!loading && !error && cianns.length === 0 && (
          <div style={styles.noCianns}>
            No CIANNs found. Please create a CIANN first.
          </div>
        )}
        
        {!loading && !error && cianns.length > 0 && (
          <div>
            {cianns.map((ciann) => (
              <div
                key={ciann.ciannId}
                style={{
                  ...styles.ciannCard,
                  ...(selectedCiann?.ciannId === ciann.ciannId ? styles.ciannCardSelected : {})
                }}
                onClick={() => setSelectedCiann(ciann)}
                onMouseEnter={(e) => {
                  if (selectedCiann?.ciannId !== ciann.ciannId) {
                    e.target.style.backgroundColor = styles.ciannCardHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCiann?.ciannId !== ciann.ciannId) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={styles.ciannId}>CIANN ID: {ciann.ciannId}</div>
                <div style={styles.ciannDetails}>
                  {ciann.subject?.name} - {ciann.division} ({ciann.academicYear})
                </div>
                <div style={styles.ciannDetails}>
                  {ciann.department?.name}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={styles.buttonGroup}>
          <button
            style={{...styles.button, ...styles.cancelButton}}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{...styles.button, ...styles.selectButton}}
            onClick={handleSelect}
            disabled={!selectedCiann}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiannSelector;
