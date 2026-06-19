import React, { useState, useEffect } from "react";
import { showSuccessAlert, showErrorAlert } from "../../utils/alertUtils.jsx";
import { config } from "../../config/api";
import { TokenManager, SessionManager } from "../../utils/authUtils.js";
import { buildInstitutionLogoUrl } from "../../utils/institutionBranding";
import { applyPalette } from "../../utils/theme";
import "./Login.css";

// Function to apply theme based on college
const applyTheme = (college, palette = null) => {
  if (palette && typeof palette === "object") {
    applyPalette(palette);
    return;
  }

  const root = document.documentElement;
  const themeMap = {
    VSIT: { header: "#c62828", accent: "#ef4444", accentDark: "#b91c1c" }, // red
    VIT: { header: "#1565c0", accent: "#3b82f6", accentDark: "#1d4ed8" }, // blue
    VP: { header: "#2e7d32", accent: "#10b981", accentDark: "#059669" }, // green (default)
  };
  const theme = themeMap[college] || themeMap.VP;
  root.style.setProperty("--app-header-bg", theme.header);
  root.style.setProperty("--primary-accent", theme.accent);
  root.style.setProperty("--primary-accent-dark", theme.accentDark);
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      showErrorAlert("Please fill in all fields");
      return;
    }

    try {
      const requestData = {
        username,
        password,
      };

      const res = await fetch(config.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (res.ok) {
        const formattedName = username
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

        TokenManager.setToken(data.token, 24 * 60 * 60 * 1000);

        SessionManager.setSession({
          user: data.userName || formattedName,
          role: data.role,
          college: data.college,
        });

        const resolvedInstitutionCode = (data.institutionCode || data.college || "VP")
          .toString()
          .toUpperCase();
        const resolvedInstitutionName = data.institutionName || resolvedInstitutionCode;
        const resolvedInstitutionLogo = data.institutionLogoUrl || "";

        localStorage.setItem("institutionCode", resolvedInstitutionCode);
        localStorage.setItem("institutionName", resolvedInstitutionName);
        localStorage.setItem(
          "institutionLogoUrl",
          buildInstitutionLogoUrl(resolvedInstitutionLogo),
        );
        if (data.institutionPalette) {
          localStorage.setItem(
            "institutionPalette",
            JSON.stringify(data.institutionPalette),
          );
        } else {
          localStorage.removeItem("institutionPalette");
        }

        if (data.role === "student") {
          localStorage.setItem("studentName", data.studentName || data.userName || formattedName);
          localStorage.setItem("enrollmentNo", data.enrollmentNo || "");
          localStorage.setItem("studentRollNo", data.rollNo || "");
          localStorage.setItem("studentDivision", data.division || "");
          localStorage.setItem("studentBatch", data.batch || "");
        }

        applyTheme(resolvedInstitutionCode, data.institutionPalette || null);

        showSuccessAlert("Login successful");

        let redirectPath;
        if (data.role === "admin") {
          redirectPath = "/admin-dashboard";
        } else if (data.role === "superadmin") {
          redirectPath = "/superadmin-dashboard";
        } else {
          redirectPath = "/dashboard";
        }
        window.location.href = redirectPath;
      } else {
        showErrorAlert(data.msg || "Login failed");
      }
    } catch (error) {
      console.error(error);
      showErrorAlert("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Branding Section */}
        <div className="login-brand">
          <img src="/vpciaan logo .png" alt="VPCIAAN Logo" className="logo" />
          <h1 className="login-title">CIANN</h1>
          <p className="subheading">Curriculum Implementation Assessment Norms</p>
        </div>

        {/* Right Form Section */}
        <div className="login-box">
          <div className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="firstname.lastname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
              <p className="hint">Enter your registered username</p>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <p className="hint">Enter your password</p>
            </div>

            <div className="form-group remember-section">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button className="login-button" onClick={handleLogin}>
              Login
            </button>
          </div>

          <div className="footer-content">
            <p>
              © 2019 All rights reserved. Template by{" "}
              <a href="#">Vidyalankar Polytechnic</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
