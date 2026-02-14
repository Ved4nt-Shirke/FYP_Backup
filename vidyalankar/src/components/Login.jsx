import React, { useState, useEffect } from "react";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import { TokenManager, SessionManager } from "../utils/authUtils.js";
import "./Login.css";
import loginImage from "../assets/login.png";

// Function to apply theme based on college
const applyTheme = (college) => {
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
  const [college, setCollege] = useState("VP");
  const [role, setRole] = useState("faculty");
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/institutions`);
      const data = await response.json();

      if (data.success) {
        setInstitutions(data.institutions);
        if (
          data.institutions.length > 0 &&
          !data.institutions.find((inst) => inst.code === college) &&
          college !== "ALL"
        ) {
          setCollege(data.institutions[0].code);
        }
      } else {
        const hardcodedInstitutions = [
          { code: "VP", name: "Vidyalankar Polytechnic" },
          { code: "VIT", name: "Vidyalankar Institute of Technology" },
          {
            code: "VSIT",
            name: "Vidyalankar School of Information Technology",
          },
        ];
        setInstitutions(hardcodedInstitutions);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
      const hardcodedInstitutions = [
        { code: "VP", name: "Vidyalankar Polytechnic" },
        { code: "VIT", name: "Vidyalankar Institute of Technology" },
        { code: "VSIT", name: "Vidyalankar School of Information Technology" },
      ];
      setInstitutions(hardcodedInstitutions);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showErrorAlert("Please fill in all fields");
      return;
    }

    try {
      const requestData = {
        username,
        password,
        college: role === "superadmin" ? "ALL" : college,
        role,
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
          role: data.role || role,
          college: data.college || requestData.college,
        });

        applyTheme(data.college || requestData.college);

        showSuccessAlert("Login successful");

        let redirectPath;
        if ((data.role || role) === "admin") {
          redirectPath = "/admin-dashboard";
        } else if ((data.role || role) === "superadmin") {
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
          <img src={loginImage} alt="Vidyalankar Logo" className="logo" />
          <h1 className="login-title">Management Information System</h1>
          <p className="subheading">Secure access to your account</p>
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

            {role !== "superadmin" && (
              <div className="form-group">
                <label htmlFor="college">Select College</label>
                <select
                  id="college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="form-input"
                  disabled={loadingInstitutions}
                >
                  {loadingInstitutions ? (
                    <option value="">Loading institutions...</option>
                  ) : (
                    <>
                      {institutions.map((inst) => (
                        <option key={inst.code} value={inst.code}>
                          {inst.code}
                        </option>
                      ))}
                      <option value="ALL">ALL</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="office">Office Staff</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
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
