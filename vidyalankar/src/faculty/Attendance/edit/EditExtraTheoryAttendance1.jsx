import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const EditExtraTheoryAttendance1 = () => (
  <AttendanceCiaanSelector
    title="Edit Extra Theory Attendance"
    subtitle="Select a Ciaan to continue with extra theory attendance editing."
    navigateTo="/edit-extra-theory-attendance2"
    iconClass="bi-plus-circle"
    continueLabel="Edit Attendance"
    onSelectState={(CiaanData) => ({ selectedCiaanId: CiaanData.CiaanId })}
  />
);

export default EditExtraTheoryAttendance1;
