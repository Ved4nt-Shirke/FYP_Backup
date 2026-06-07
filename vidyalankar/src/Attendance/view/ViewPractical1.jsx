import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const ViewPractical1 = () => (
  <AttendanceCiannSelector
    title="View Practical Attendance"
    subtitle="Select a CIANN to continue with practical attendance view."
    iconClass="bi-eye"
    continueLabel="Select Batch"
    navigateTo="/view-practical2"
    onSelect={(ciannData) => {
      window.open(`/view-practical2?ciannId=${ciannData.ciannId}`, "_blank");
    }}
  />
);

export default ViewPractical1;
