import React from "react";
import AttendanceCiannSelector from "./AttendanceCiannSelector";

const TheoryCiannCards = () => (
  <AttendanceCiannSelector
    title="Mark Theory Attendance"
    subtitle="Select a CIANN to continue with theory attendance marking."
    navigateTo="/theory-edit"
  />
);

export default TheoryCiannCards;
