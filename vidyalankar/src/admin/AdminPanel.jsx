import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorAlert } from "../utils/alertUtils.jsx";
import "./AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }
    // Redirect to dashboard - this page is deprecated, use separate create pages
    navigate("/admin-dashboard");
  }, [navigate]);

  return null;
};

export default AdminPanel;
