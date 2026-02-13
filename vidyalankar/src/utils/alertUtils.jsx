import React from 'react';
import { createRoot } from 'react-dom/client';
import BootstrapAlert from './BootstrapAlert';

// Function to show Bootstrap alert
export const showAlert = (message, type = 'success') => {
  // Create a container for the alert
  const alertContainer = document.createElement('div');
  alertContainer.id = 'bootstrap-alert-container';
  document.body.appendChild(alertContainer);

  // Create root and render the alert
  const root = createRoot(alertContainer);
  
  const handleClose = () => {
    root.unmount();
    if (document.body.contains(alertContainer)) {
      document.body.removeChild(alertContainer);
    }
  };

  root.render(
    <BootstrapAlert 
      message={message} 
      type={type} 
      onClose={handleClose} 
    />
  );
};

// Helper functions for specific alert types
export const showSuccessAlert = (message) => showAlert(message, 'success');
export const showErrorAlert = (message) => showAlert(message, 'error');
