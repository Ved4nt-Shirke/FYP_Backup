import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; // ✅ Import axios
import { config } from "../config/api";
import "./CourseTableShared.css";

const UpdateExperiment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State to hold the editable form data
  const [formData, setFormData] = useState({
    program: "",
    className: "",
    course: "",
    practicalNo: "",
    practicalName: "",
  });

  // ✅ State to store the original practical number for the database query
  const [originalPracticalNo, setOriginalPracticalNo] = useState(null);

  // On component load, parse the URL and set the form data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialPracticalNo = params.get("practicalNo") || "";

    setFormData({
      program: params.get("program") || "",
      className: params.get("className") || "",
      course: params.get("course") || "",
      practicalNo: initialPracticalNo,
      practicalName: params.get("practicalName") || "",
    });

    // ✅ Store the original number separately
    setOriginalPracticalNo(initialPracticalNo);
  }, [location]);

  // Handler to update state when user types in the input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ --- UPDATED Handler for form submission --- ✅
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      program: formData.program,
      className: formData.className,
      course: formData.course,
      originalPracticalNo: originalPracticalNo, // The original number to find the record
      practicalNo: formData.practicalNo, // The new number from the form
      practicalName: formData.practicalName, // The new name from the form
    };

    try {
      const response = await axios.put(
        `${config.course.experiments}/update-experiment`,
        payload,
      );

      if (response.data.success) {
        alert("Practical updated successfully!");
        navigate(-1); // Navigate back to the previous page
      } else {
        alert("Failed to update practical: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating practical:", error);
      alert("An error occurred while updating the practical.");
    }
  };

  // ... (styles object remains the same) ...
  const styles = {
    container: {
      margin: "0 auto",
      padding: "30px",
      fontFamily: "Arial, sans-serif",
      maxWidth: "800px",
    },
    form: {
      backgroundColor: "#ffffff",
      padding: "2rem",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    header: {
      color: "#333",
      marginBottom: "1.5rem",
    },
    infoBox: {
      marginBottom: "1.5rem",
      padding: "1rem",
      backgroundColor: "#f4f7fa",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      display: "flex",
      justifyContent: "space-around",
      flexWrap: "wrap",
    },
    infoItem: {
      margin: "0.5rem",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: "600",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      fontSize: "1rem",
      boxSizing: "border-box",
    },
    button: {
      backgroundColor: "#4CAF50",
      color: "white",
      padding: "12px 20px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s",
    },
  };

  // ... (return JSX remains the same) ...
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Edit Practical Information</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.infoBox}>
          <p style={styles.infoItem}>
            <strong>Program:</strong> {formData.program}
          </p>
          <p style={styles.infoItem}>
            <strong>Class:</strong> {formData.className}
          </p>
          <p style={styles.infoItem}>
            <strong>Course:</strong> {formData.course}
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="practicalNo">
            Practical Number
          </label>
          <input
            style={styles.input}
            type="text"
            id="practicalNo"
            name="practicalNo"
            value={formData.practicalNo}
            onChange={handleChange}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="practicalName">
            Practical Name
          </label>
          <textarea
            style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
            id="practicalName"
            name="practicalName"
            value={formData.practicalName}
            onChange={handleChange}
          />
        </div>

        <button style={styles.button} type="submit">
          Update Practical
        </button>
      </form>
    </div>
  );
};

export default UpdateExperiment;
