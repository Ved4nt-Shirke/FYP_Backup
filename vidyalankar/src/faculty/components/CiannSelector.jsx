import React, { useState, useEffect } from 'react';
import { useCiaan } from '../../hooks/useCiann';

const CiaanSelector = ({ onSelect, onCancel }) => {
  const { Ciaans, fetchAllCiaans, loading, error } = useCiaan();
  const [selectedCiaan, setSelectedCiaan] = useState(null);

  useEffect(() => {
    fetchAllCiaans();
  }, [fetchAllCiaans]);

  const handleSelect = () => {
    if (selectedCiaan) {
      onSelect(selectedCiaan);
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
    CiaanCard: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    CiaanCardSelected: {
      border: '2px solid #009245',
      backgroundColor: '#f0f9f4',
    },
    CiaanCardHover: {
      backgroundColor: '#f8f9fa',
    },
    CiaanId: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#0c2c40'
    },
    CiaanDetails: {
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
    noCiaans: {
      textAlign: 'center',
      padding: '20px',
      color: '#666'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>Select a Ciaan</div>

        {loading && (
          <div style={styles.loading}>Loading Ciaans...</div>
        )}

        {error && (
          <div style={styles.error}>Error: {error}</div>
        )}

        {!loading && !error && Ciaans.length === 0 && (
          <div style={styles.noCiaans}>
            No Ciaans found. Please create a Ciaan first.
          </div>
        )}

        {!loading && !error && Ciaans.length > 0 && (
          <div>
            {Ciaans.map((Ciaan) => (
              <div
                key={Ciaan.CiaanId}
                style={{
                  ...styles.CiaanCard,
                  ...(selectedCiaan?.CiaanId === Ciaan.CiaanId ? styles.CiaanCardSelected : {})
                }}
                onClick={() => setSelectedCiaan(Ciaan)}
                onMouseEnter={(e) => {
                  if (selectedCiaan?.CiaanId !== Ciaan.CiaanId) {
                    e.target.style.backgroundColor = styles.CiaanCardHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCiaan?.CiaanId !== Ciaan.CiaanId) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={styles.CiaanId}>Ciaan ID: {Ciaan.CiaanId}</div>
                <div style={styles.CiaanDetails}>
                  {Ciaan.subject?.name} - {Ciaan.division} ({Ciaan.academicYear})
                </div>
                <div style={styles.CiaanDetails}>
                  {Ciaan.department?.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.selectButton }}
            onClick={handleSelect}
            disabled={!selectedCiaan}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiaanSelector;
