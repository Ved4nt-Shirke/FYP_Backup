import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const EditTutorialAttendance1 = () => (
  <AttendanceCiaanSelector
    title="Edit Tutorial Attendance"
    subtitle="Select a Ciaan to continue with tutorial attendance editing."
    navigateTo="/edit-tutorial-attendance2"
    iconClass="bi-chat-dots"
    continueLabel="Edit Attendance"
    onSelectState={(CiaanData) => ({ selectedCiaanId: CiaanData.CiaanId })}
  />
);

export default EditTutorialAttendance1;
