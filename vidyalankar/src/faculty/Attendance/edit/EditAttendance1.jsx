import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const EditAttendance1 = () => (
  <AttendanceCiaanSelector
    title="Edit Theory Attendance"
    subtitle="Select a Ciaan to continue with theory attendance editing."
    navigateTo="/edit-attendance2"
    iconClass="bi-book-half"
    continueLabel="Edit Attendance"
    onSelectState={(CiaanData) => ({ selectedCiaanId: CiaanData.CiaanId })}
  />
);

export default EditAttendance1;
