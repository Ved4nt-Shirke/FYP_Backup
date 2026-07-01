import React from "react";
import AttendanceCiaanSelector from "./AttendanceCiannSelector";

const TheoryCiaanCards = () => (
  <AttendanceCiaanSelector
    title="Mark Theory Attendance"
    subtitle="Select a Ciaan to continue with theory attendance marking."
    navigateTo="/theory-edit"
  />
);

export default TheoryCiaanCards;
