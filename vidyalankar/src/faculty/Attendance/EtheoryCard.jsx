import React from "react";
import AttendanceCiaanSelector from "./AttendanceCiannSelector";

const TheoryCiaanCards = () => (
  <AttendanceCiaanSelector
    title="Mark Extra Theory Attendance"
    subtitle="Select a CIAAN to continue with extra theory attendance marking."
    navigateTo="/extra-theory"
  />
);

export default TheoryCiaanCards;
