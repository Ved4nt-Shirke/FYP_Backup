import React from "react";
import AttendanceCiannSelector from "../AttendanceCiannSelector";

const ViewExtraTheory1 = () => (
  <AttendanceCiannSelector
    title="View Extra Theory Attendance"
    subtitle="Select a CIANN to continue with extra theory attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-extra-theory-attend2"
    onSelect={(ciannData) => {
      window.open(
        `/view-extra-theory-attend2?ciannId=${ciannData.ciannId}`,
        "_blank",
      );
    }}
  />
);

export default ViewExtraTheory1;
