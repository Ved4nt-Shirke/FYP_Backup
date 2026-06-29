import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const EditTutorialAttendance1 = () => (
  <AttendanceCiannSelector
    title="Edit Tutorial Attendance"
    subtitle="Select a CIANN to continue with tutorial attendance editing."
    navigateTo="/edit-tutorial-attendance2"
    iconClass="bi-chat-dots"
    continueLabel="Edit Attendance"
    onSelectState={(ciannData) => ({ selectedCiannId: ciannData.ciannId })}
  />
);

export default EditTutorialAttendance1;
