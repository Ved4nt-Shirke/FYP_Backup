// src/basic/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { performSearch, handleSearchResultClick } from "../utils/searchUtils";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import { ciannUtils } from "../utils/ciannUtils";
import "./Header.css";

const Header = ({
  currentUser,
  showUserDropdown: propShowUserDropdown,
  setShowUserDropdown: propSetShowUserDropdown,
  userDropdownRef: propUserDropdownRef,
  showSearch = false,
  onMenuToggle, // This prop receives the function from App.jsx
  onSecondaryMenuToggle, // This prop receives the function for secondary sidebar toggle
}) => {
  const navigate = useNavigate();

  // Initialize local state for user dropdown if props aren't provided
  const [localShowUserDropdown, setLocalShowUserDropdown] = useState(false);
  const localUserDropdownRef = useRef(null);
  
  // Use props if provided, otherwise use local state/ref
  const showUserDropdown = propShowUserDropdown !== undefined ? propShowUserDropdown : localShowUserDropdown;
  const setShowUserDropdown = propSetShowUserDropdown !== undefined ? propSetShowUserDropdown : setLocalShowUserDropdown;
  const userDropdownRef = propUserDropdownRef || localUserDropdownRef;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingCiannRequests, setPendingCiannRequests] = useState(0);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      // Close dropdown before navigating
      setShowUserDropdown(false);
      // Small delay to ensure state update before navigation
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  };

  // Search functionality
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await performSearch(query);
        setSearchResults(results);
        setIsSearching(false);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);
  };

  const handleResultClick = (result) => {
    handleSearchResultClick(result, navigate);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = (e) => {
    // Delay hiding dropdown to allow clicks on results
    setTimeout(() => {
      if (!searchRef.current?.contains(document.activeElement)) {
        setShowSearchDropdown(false);
      }
    }, 200);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchDropdown(false);
      e.target.blur();
    }
  };

  // Close search dropdown when clicking outside and handle keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle click outside for both search and user dropdowns
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }

      // Handle click outside for user dropdown
      if (
        userDropdownRef &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        // Check if the click was on the user button itself
        const userButton =
          userDropdownRef.current.querySelector(".user-button");
        if (userButton && userButton.contains(event.target)) {
          return;
        }
        setShowUserDropdown(false);
      }
    };

    const handleKeyboardShortcut = (event) => {
      // Ctrl+K or Cmd+K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = searchRef.current?.querySelector(".search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyboardShortcut);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [setShowUserDropdown, showUserDropdown]); // Add showUserDropdown to dependency array

  // Group results by category
  const groupedResults = searchResults.reduce((groups, result) => {
    const category = result.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(result);
    return groups;
  }, {});

  // Get and format username
  let username = currentUser || localStorage.getItem("username") || "User";
  
  // Format username properly (capitalize words and remove dots)
  if (username.includes(".")) {
    username = username.split(".")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  } else if (username !== "User") {
    username = username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  const college = (localStorage.getItem("college") || "VP").toUpperCase();
  const institutionCode = (
    localStorage.getItem("institutionCode") || college || "VP"
  ).toUpperCase();
  const institutionName =
    localStorage.getItem("institutionName") || institutionCode;
  const institutionLogoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const institutionFallback = getInstitutionInitials(
    institutionName,
    institutionCode,
  );
  const userRole = localStorage.getItem("role") || "faculty";
  const isSuperAdmin = userRole === "superadmin";
  const isFaculty = userRole === "faculty";

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!isFaculty) {
        setPendingCiannRequests(0);
        return;
      }

      try {
        const response = await ciannUtils.getIncomingShareRequests();
        setPendingCiannRequests(Array.isArray(response?.incoming) ? response.incoming.length : 0);
      } catch (error) {
        setPendingCiannRequests(0);
      }
    };

    fetchPendingRequests();
  }, [isFaculty]);

  // Test dropdown state
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  return (
    <div className={`header ${onSecondaryMenuToggle ? "has-secondary-toggle" : ""}`}>
      <div className="header-left">
        {/* This button's onClick calls the function passed from App.jsx */}
        <button className="menu-toggle" onClick={onMenuToggle}>
          <i className="bi bi-list"></i>
        </button>
        {/* Secondary menu toggle button for CIANN sidebar */}
        {onSecondaryMenuToggle && (
          <button
            className="secondary-menu-toggle"
            onClick={onSecondaryMenuToggle}
            aria-label="Toggle secondary sidebar"
          >
            <i className="bi bi-layout-sidebar"></i>
          </button>
        )}
        <span className="logo" title={institutionName}>
          {institutionLogoUrl ? (
            <img
              src={institutionLogoUrl}
              alt={institutionName}
              className="institution-logo-image"
            />
          ) : (
            <span className="institution-logo-fallback">{institutionFallback}</span>
          )}
          <span className="institution-name-text">{institutionName}</span>
          {isFaculty && <span className="role-chip">Faculty</span>}
        </span>
      </div>
      {showSearch && false && (
        <div className="header-center">
          <div className="search-container" ref={searchRef}>
            <input
              type="text"
              placeholder="Search students, attendance, navigation... (Ctrl+K)"
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search"
            />
            {showSearchDropdown && (
              <div className="search-dropdown">
                {isSearching ? (
                  <div className="search-loading">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="search-results">
                    {Object.entries(groupedResults).map(
                      ([category, results]) => (
                        <div key={category} className="search-category-group">
                          <div className="search-category-header">
                            {category}
                          </div>
                          {results.map((result) => (
                            <li
                              key={result.id}
                              className="search-result-item"
                              onClick={() => handleResultClick(result)}
                            >
                              <div className="search-result-title">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="search-result-subtitle">
                                  {result.subtitle}
                                </div>
                              )}
                              <div className="search-result-category">
                                {result.category}
                              </div>
                            </li>
                          ))}
                        </div>
                      )
                    )}
                  </ul>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="search-no-results">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="header-right">
        {isFaculty && (
          <button
            className="ciann-request-bell"
            title={`Pending CIANN requests: ${pendingCiannRequests}`}
            onClick={() => navigate("/edit-ciann")}
          >
            <i className="bi bi-bell"></i>
            {pendingCiannRequests > 0 && (
              <span className="header-notification-badge">{pendingCiannRequests}</span>
            )}
          </button>
        )}
        {isFaculty && (
          <button className="faculty-logout-button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        )}
        <div className="user-section" ref={userDropdownRef}>
          <button
            className="user-button"
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
            }}
            aria-expanded={showUserDropdown}
          >
            <span className="user-icon">👤</span>
            <span
              className="user-name"
              title={username}
              aria-label={`Logged in as ${username}`}
            >
              {isSuperAdmin ? `Super Admin (${username})` : username}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showUserDropdown && (
            <div
              className={`user-dropdown-menu ${
                showUserDropdown ? "visible" : ""
              }`}
            >
              {isSuperAdmin && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserDropdown(false);
                    window.location.href = "/superadmin-dashboard";
                  }}
                >
                  <i className="fas fa-user-shield"></i> Super Admin Panel
                </button>
              )}
              {!isFaculty && (
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
