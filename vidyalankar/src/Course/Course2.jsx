import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ 1. Import useNavigate
import axios from "axios";
import { config } from "../config/api";
import AddPracticalModal from "./Course3";
import "./CourseTableShared.css";

const PracticalTable = () => {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate(); // ✅ 2. Initialize useNavigate

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... handleAddPractical and useEffect hooks remain the same ...
  const handleAddPractical = async (newPracticalData) => {
    const params = new URLSearchParams(location.search);
    const program = params.get("program");
    const className = params.get("className");
    const course = params.get("course");

    const payload = {
      ...newPracticalData,
      program,
      className,
      course,
    };

    try {
      const response = await axios.post(
        `${config.course.experiments}/add-experiment`,
        payload,
      );

      if (response.data.success) {
        setPracticals((prev) => [...prev, newPracticalData]);
        setIsModalOpen(false);
        alert("Practical added successfully!");
      } else {
        alert("Failed to add practical: " + response.data.message);
      }
    } catch (error) {
      console.error("Error submitting new practical:", error);
      alert("An error occurred while adding the practical.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const program = params.get("program");
    const className = params.get("className");
    const course = params.get("course");

    if (program && className && course) {
      const fetchExperiments = async () => {
        try {
          const response = await axios.post(config.course.experiments, {
            program,
            className,
            course,
          });

          if (response.data.success) {
            setPracticals(response.data.experiments);
          } else {
            setPracticals([]);
          }
        } catch (err) {
          console.error("Error fetching experiments:", err);
          setPracticals([]);
        } finally {
          setLoading(false);
        }
      };

      fetchExperiments();
    } else {
      setLoading(false);
    }
  }, [location]);

  // ✅ 3. Create a handler for the edit button click
  const handleEditClick = (practicalToEdit) => {
    // Get the base course info from the current URL
    const params = new URLSearchParams(location.search);

    // Add the specific practical's info to the params
    params.append("practicalNo", practicalToEdit.practicalNo);
    params.append("practicalName", practicalToEdit.practicalName);

    // Navigate to the edit page with all data in the URL
    navigate(`/course4?${params.toString()}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="practical-table-container">
      <h2 className="practical-table-heading">Practical Syllabus Data</h2>
      <div className="table-wrapper">
        <table className="practical-table">
          <thead>
            <tr className="practical-table-header">
              <th>Practical No.</th>
              <th>Practical Name</th>
              <th>Setting</th>
            </tr>
          </thead>
          <tbody>
            {practicals.length === 0 ? (
              <tr>
                <td colSpan="3" className="practical-table-no-data">
                  No matching records found
                </td>
              </tr>
            ) : (
              practicals.map((practical, index) => (
                <tr key={index}>
                  <td>{practical.practicalNo}</td>
                  <td>{practical.practicalName}</td>
                  <td>
                    <button
                      className="practical-table-button"
                      onClick={() => handleEditClick(practical)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        className="practical-table-button"
        onClick={() => setIsModalOpen(true)}
      >
        Add Practical
      </button>

      <AddPracticalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPractical}
      />
    </div>
  );
};

export default PracticalTable;
