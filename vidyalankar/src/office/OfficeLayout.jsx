import React from "react";
import OfficeHeader from "./OfficeHeader";
import OfficeSidebar from "./OfficeSidebar";
import "./OfficeLayout.css";

const OfficeLayout = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const staffName =
    localStorage.getItem("staffName") ||
    localStorage.getItem("name") ||
    "Office Staff";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleMenuToggle = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="office-layout-container">
      <OfficeSidebar
        isVisible={sidebarVisible}
        setIsVisible={setSidebarVisible}
        onLogout={handleLogout}
        staffName={staffName}
      />
      <div className="office-layout-main">
        <div className="office-layout-content">{children}</div>
      </div>
    </div>
  );
};

export default OfficeLayout;
