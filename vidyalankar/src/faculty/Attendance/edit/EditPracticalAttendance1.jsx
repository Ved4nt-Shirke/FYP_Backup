import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const EditPracticalAttendance1 = () => (
  <AttendanceCiaanSelector
    title="Edit Practical Attendance"
    subtitle="Select a CIAAN to continue with practical attendance editing."
    navigateTo="/edit-practical-attendance2"
    iconClass="bi-flask"
    continueLabel="Edit Attendance"
    onSelectState={(CiaanData) => ({ selectedCiaanId: CiaanData.CiaanId })}
  />
);

export default EditPracticalAttendance1;
