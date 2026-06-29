import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const EditPracticalAttendance1 = () => (
  <AttendanceCiannSelector
    title="Edit Practical Attendance"
    subtitle="Select a CIANN to continue with practical attendance editing."
    navigateTo="/edit-practical-attendance2"
    iconClass="bi-flask"
    continueLabel="Edit Attendance"
    onSelectState={(ciannData) => ({ selectedCiannId: ciannData.ciannId })}
  />
);

export default EditPracticalAttendance1;
