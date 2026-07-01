import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const EditExtraPracticalAttendance1 = () => (
  <AttendanceCiaanSelector
    title="Edit Extra Practical Attendance"
    subtitle="Select a Ciaan to continue with extra practical attendance editing."
    navigateTo="/edit-extra-practical-attendance2"
    iconClass="bi-flask"
    continueLabel="Edit Attendance"
    onSelectState={(CiaanData) => ({ selectedCiaanId: CiaanData.CiaanId })}
  />
);

export default EditExtraPracticalAttendance1;
