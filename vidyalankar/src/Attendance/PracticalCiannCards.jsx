import React from "react";
import AttendanceCiannSelector from "./AttendanceCiannSelector";

const PracticalCiannCards = () => (
  <AttendanceCiannSelector
    title="Mark Practical Attendance"
    subtitle="Select a CIANN to continue with practical attendance marking."
    navigateTo="/practical-attendance"
  />
);

export default PracticalCiannCards;
