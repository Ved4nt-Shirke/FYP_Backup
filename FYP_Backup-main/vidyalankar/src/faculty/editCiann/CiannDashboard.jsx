import React, { useState } from 'react';
import EditCiann from './EditCiann'; // Make sure the path is correct
import TeachingPlanSheet from './TeachingPlanSheet'; // Make sure the path is correct

const CiannDashboard = () => {
  // 1. Log when the component first renders or re-renders.
  console.log("CiannDashboard has rendered.");

  const [selectedCiann, setSelectedCiann] = useState(null);

  // 2. Log the current state of 'selectedCiann' every time the component renders.
  console.log("Current value of selectedCiann:", selectedCiann);

  // This function is passed down to EditCiann.
  const handleCiannSelect = (ciannData) => {
    // 3. Log to confirm this function is being called when you click a card.
    console.log("handleCiannSelect was called with:", ciannData);
    setSelectedCiann(ciannData);
  };

  // This function is passed down to TeachingPlanSheet to allow the user to go back.
  const handleGoBack = () => {
    // 4. Log to confirm the "Go Back" function is working.
    console.log("handleGoBack was called. Resetting selectedCiann.");
    setSelectedCiann(null);
  };

  return (
    <div>
      {selectedCiann ? (
        <TeachingPlanSheet ciannData={selectedCiann} onBack={handleGoBack} />
      ) : (
        <EditCiann onEdit={handleCiannSelect} />
      )}
    </div>
  );
};

export default CiannDashboard;
