import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const EditAttendance1 = () => (
  <AttendanceCiannSelector
    title="Edit Theory Attendance"
    subtitle="Select a CIANN to continue with theory attendance editing."
    navigateTo="/edit-attendance2"
    iconClass="bi-book-half"
    continueLabel="Edit Attendance"
    onSelectState={(ciannData) => ({ selectedCiannId: ciannData.ciannId })}
  />
);

export default EditAttendance1;
