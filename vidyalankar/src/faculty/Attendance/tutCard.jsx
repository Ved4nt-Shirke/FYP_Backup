import React from "react";
import AttendanceCiaanSelector from "./AttendanceCiannSelector";

const TutorialCiaanCards = () => (
  <AttendanceCiaanSelector
    title="Mark Tutorial Attendance"
    subtitle="Select a CIAAN to continue with tutorial attendance marking."
    navigateTo="/tutorial-attendance"
  />
);

export default TutorialCiaanCards;
