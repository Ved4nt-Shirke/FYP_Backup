import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const ViewT1 = () => (
  <AttendanceCiaanSelector
    title="View Tutorial Attendance"
    subtitle="Select a CIAAN to continue with tutorial attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-tutorial-attendance2"
    onSelect={(CiaanData) => {
      window.open(
        `/view-tutorial-attendance2?CiaanId=${CiaanData.CiaanId}`,
        "_blank",
      );
    }}
  />
);

export default ViewT1;
