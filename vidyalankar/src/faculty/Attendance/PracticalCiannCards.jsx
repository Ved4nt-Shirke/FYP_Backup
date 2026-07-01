import React from "react";
import AttendanceCiaanSelector from "./AttendanceCiannSelector";

const PracticalCiaanCards = () => (
  <AttendanceCiaanSelector
    title="Mark Practical Attendance"
    subtitle="Select a CIAAN to continue with practical attendance marking."
    navigateTo="/practical-attendance"
  />
);

export default PracticalCiaanCards;
