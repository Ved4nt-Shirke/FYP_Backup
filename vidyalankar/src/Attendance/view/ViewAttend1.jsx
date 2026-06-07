import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const ViewAttend1 = () => (
  <AttendanceCiannSelector
    title="View Theory Attendance"
    subtitle="Select a CIANN to continue with theory attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-attend2"
    onSelect={(ciannData) => {
      window.open(`/view-attend2?ciannId=${ciannData.ciannId}`, "_blank");
    }}
  />
);

export default ViewAttend1;
