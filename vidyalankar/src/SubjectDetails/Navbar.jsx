import React from "react";
import { NavLink } from "react-router-dom";
import './Navbar.css'; // Import the new CSS file

const Navbar = () => {
  return (
    <nav className="simple-navbar">
      <NavLink to="/subject-details/lecture-schedule" end>Lecture Schedule</NavLink>
      <NavLink to="/subject-details/office-hours">Office Hours</NavLink>
      <NavLink to="/subject-details/knowledge-map">Knowledge Map</NavLink>
      <NavLink to="/subject-details/objectives">Objectives</NavLink>
      <NavLink to="/subject-details/cos">Course Outcomes</NavLink>
      <NavLink to="/subject-details/map-cos-pos">Map COs with POs</NavLink>
      <NavLink to="/subject-details/cos-with-psos">Map COs with PSOs</NavLink>
      <NavLink to="/subject-details/past-result">Result</NavLink>
      <NavLink to="/subject-details/recommendations">Recommendations</NavLink>
      <NavLink to="/subject-details/rubric">Rubric</NavLink>
      <NavLink to="/subject-details/resources">Resource</NavLink>
    </nav>
  );
};

export default Navbar;
