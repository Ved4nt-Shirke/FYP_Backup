import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const ViewT1 = () => (
  <AttendanceCiannSelector
    title="View Tutorial Attendance"
    subtitle="Select a CIANN to continue with tutorial attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-tutorial-attendance2"
    onSelect={(ciannData) => {
      window.open(
        `/view-tutorial-attendance2?ciannId=${ciannData.ciannId}`,
        "_blank",
      );
    }}
  />
);

export default ViewT1;
