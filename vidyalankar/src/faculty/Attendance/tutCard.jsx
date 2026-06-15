import React from "react";
import AttendanceCiannSelector from "./AttendanceCiannSelector";

const TutorialCiannCards = () => (
  <AttendanceCiannSelector
    title="Mark Tutorial Attendance"
    subtitle="Select a CIANN to continue with tutorial attendance marking."
    navigateTo="/tutorial-attendance"
  />
);

export default TutorialCiannCards;
