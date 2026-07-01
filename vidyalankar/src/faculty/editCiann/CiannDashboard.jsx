import React, { useState } from 'react';
import EditCiaan from './EditCiann'; // Make sure the path is correct
import TeachingPlanSheet from './TeachingPlanSheet'; // Make sure the path is correct

const CiaanDashboard = () => {
  // 1. Log when the component first renders or re-renders.
  console.log("CiaanDashboard has rendered.");

  const [selectedCiaan, setSelectedCiaan] = useState(null);

  // 2. Log the current state of 'selectedCiaan' every time the component renders.
  console.log("Current value of selectedCiaan:", selectedCiaan);

  // This function is passed down to EditCiaan.
  const handleCiaanSelect = (CiaanData) => {
    // 3. Log to confirm this function is being called when you click a card.
    console.log("handleCiaanSelect was called with:", CiaanData);
    setSelectedCiaan(CiaanData);
  };

  // This function is passed down to TeachingPlanSheet to allow the user to go back.
  const handleGoBack = () => {
    // 4. Log to confirm the "Go Back" function is working.
    console.log("handleGoBack was called. Resetting selectedCiaan.");
    setSelectedCiaan(null);
  };

  return (
    <div>
      {selectedCiaan ? (
        <TeachingPlanSheet CiaanData={selectedCiaan} onBack={handleGoBack} />
      ) : (
        <EditCiaan onEdit={handleCiaanSelect} />
      )}
    </div>
  );
};

export default CiaanDashboard;
