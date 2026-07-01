import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const ViewAttend1 = () => (
  <AttendanceCiaanSelector
    title="View Theory Attendance"
    subtitle="Select a CIAAN to continue with theory attendance view."
    iconClass="bi-eye"
    continueLabel="View Attendance"
    navigateTo="/view-attend2"
    onSelect={(CiaanData) => {
      window.open(`/view-attend2?CiaanId=${CiaanData.CiaanId}`, "_blank");
    }}
  />
);

export default ViewAttend1;
