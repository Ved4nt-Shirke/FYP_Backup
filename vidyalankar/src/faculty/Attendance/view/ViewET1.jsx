import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const ViewExtraTheory1 = () => (
  <AttendanceCiaanSelector
    title="View Extra Theory Attendance"
    subtitle="Select a CIAAN to continue with extra theory attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-extra-theory-attend2"
    onSelect={(CiaanData) => {
      window.open(
        `/view-extra-theory-attend2?CiaanId=${CiaanData.CiaanId}`,
        "_blank",
      );
    }}
  />
);

export default ViewExtraTheory1;
