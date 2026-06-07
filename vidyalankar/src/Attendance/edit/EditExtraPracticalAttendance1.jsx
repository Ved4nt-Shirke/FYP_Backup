import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const EditExtraPracticalAttendance1 = () => (
  <AttendanceCiannSelector
    title="Edit Extra Practical Attendance"
    subtitle="Select a CIANN to continue with extra practical attendance editing."
    navigateTo="/edit-extra-practical-attendance2"
    iconClass="bi-flask"
    continueLabel="Edit Attendance"
    onSelectState={(ciannData) => ({ selectedCiannId: ciannData.ciannId })}
  />
);

export default EditExtraPracticalAttendance1;
