import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const ViewPractical1 = () => (
  <AttendanceCiaanSelector
    title="View Practical Attendance"
    subtitle="Select a CIAAN to continue with practical attendance view."
    iconClass="bi-eye"
    continueLabel="Select Batch"
    navigateTo="/view-practical2"
    onSelect={(CiaanData) => {
      window.open(`/view-practical2?CiaanId=${CiaanData.CiaanId}`, "_blank");
    }}
  />
);

export default ViewPractical1;
