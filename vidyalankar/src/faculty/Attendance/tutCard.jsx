import React from "react";
import AttendanceCiaanSelector from "./AttendanceCiannSelector";

const TutorialCiaanCards = () => (
  <AttendanceCiaanSelector
    title="Mark Tutorial Attendance"
    subtitle="Select a Ciaan to continue with tutorial attendance marking."
    navigateTo="/tutorial-attendance"
  />
);

export default TutorialCiaanCards;
