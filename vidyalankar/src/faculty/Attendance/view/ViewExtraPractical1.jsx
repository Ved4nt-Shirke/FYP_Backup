import React from "react";
import AttendanceCiaanSelector from "../AttendanceCiannSelector";

const ViewExtraPractical1 = () => (
  <AttendanceCiaanSelector
    title="View Extra Practical Attendance"
    subtitle="Select a Ciaan to continue with extra practical attendance view."
    iconClass="bi-eye"
    continueLabel="Select Batch"
    navigateTo="/view-extra-practical2"
    onSelect={(CiaanData) => {
      window.open(
        `/view-extra-practical2?CiaanId=${CiaanData.CiaanId}`,
        "_blank",
      );
    }}
  />
);

export default ViewExtraPractical1;
