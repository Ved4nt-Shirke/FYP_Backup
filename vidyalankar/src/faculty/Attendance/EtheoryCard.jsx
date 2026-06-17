import React from "react";
import AttendanceCiannSelector from "./AttendanceCiannSelector";

const TheoryCiannCards = () => (
  <AttendanceCiannSelector
    title="Mark Extra Theory Attendance"
    subtitle="Select a CIANN to continue with extra theory attendance marking."
    navigateTo="/extra-theory"
  />
);

export default TheoryCiannCards;
