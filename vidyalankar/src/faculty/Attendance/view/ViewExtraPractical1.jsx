import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const ViewExtraPractical1 = () => (
  <AttendanceCiannSelector
    title="View Extra Practical Attendance"
    subtitle="Select a CIANN to continue with extra practical attendance view."
    iconClass="bi-eye"
    continueLabel="Select Batch"
    navigateTo="/view-extra-practical2"
    onSelect={(ciannData) => {
      window.open(
        `/view-extra-practical2?ciannId=${ciannData.ciannId}`,
        "_blank",
      );
    }}
  />
);

export default ViewExtraPractical1;
