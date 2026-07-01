import React, { useState, useEffect } from 'react';

const BootstrapAlert = ({ message, type, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, 1000); // 1 second duration

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';

  return (
    <div 
      className={`alert ${alertClass} alert-dismissible fade show position-fixed`}
      style={{
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '300px',
        maxWidth: '500px'
      }}
      role="alert"
    >
      {message}
      <button 
        type="button" 
        className="btn-close" 
        onClick={() => {
          setShow(false);
          if (onClose) onClose();
        }}
        aria-label="Close"
      ></button>
    </div>
  );
};

export default BootstrapAlert;
