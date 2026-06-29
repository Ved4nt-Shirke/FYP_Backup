import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const EditExtraTheoryAttendance1 = () => (
  <AttendanceCiannSelector
    title="Edit Extra Theory Attendance"
    subtitle="Select a CIANN to continue with extra theory attendance editing."
    navigateTo="/edit-extra-theory-attendance2"
    iconClass="bi-plus-circle"
    continueLabel="Edit Attendance"
    onSelectState={(ciannData) => ({ selectedCiannId: ciannData.ciannId })}
  />
);

export default EditExtraTheoryAttendance1;
