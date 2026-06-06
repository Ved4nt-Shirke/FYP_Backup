import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom"; // ✅ 1. Import useNavigate
import axios from "axios";
import { config } from "../config/api";
import AddPracticalModal from "./Course3";

const PracticalTable = () => {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate(); // ✅ 2. Initialize useNavigate

  const outletCtx = useOutletContext();
  const ciannData = outletCtx?.ciannData || JSON.parse(sessionStorage.getItem("currentCiannData") || localStorage.getItem("ciannData") || "null");

  const program = ciannData?.department?.name || ciannData?.department || "";
  const className = ciannData?.division || ciannData?.class || "";
  const course = ciannData?.subject?.name || ciannData?.subject || "";

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... handleAddPractical and useEffect hooks remain the same ...
  const handleAddPractical = async (newPracticalData) => {
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
  }, [program, className, course]);

  // ✅ 3. Create a handler for the edit button click
  const handleEditClick = (practicalToEdit) => {
    const params = new URLSearchParams();
    params.append("program", program);
    params.append("className", className);
    params.append("course", course);
    params.append("practicalNo", practicalToEdit.practicalNo);
    params.append("practicalName", practicalToEdit.practicalName);

    // Navigate to the edit page inside SubjectDetails
    navigate(`/subject-details/edit-experiment?${params.toString()}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="experiments-page-container">
      <style>{`
        .experiments-page-container {
          width: 100%;
          padding: 10px 20px 20px;
          box-sizing: border-box;
          color: var(--sd-text);
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px 20px;
          background-color: #ffffff;
          border: 1px solid var(--sd-border);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
        }

        .title-container {
          display: flex;
          flex-direction: column;
        }

        .title {
          margin: 0 0 4px 0;
          font-weight: 700;
          font-size: 1.6rem;
          color: var(--sd-primary) !important;
        }

        .subtitle {
          margin: 0;
          font-size: 0.9rem;
          color: var(--sd-muted);
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 0.88rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn-edit {
          background-color: #eef3fb;
          color: #1a56db;
          border-color: #d1e3fa;
        }

        .action-btn-edit:hover {
          background-color: #1a56db;
          color: #ffffff;
          border-color: #1a56db;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--sd-border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #ffffff;
        }

        .custom-table th {
          background-color: var(--sd-primary-light) !important;
          color: var(--sd-primary) !important;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
          font-size: 0.95rem;
          border-bottom: 1px solid var(--sd-border);
        }

        .custom-table td {
          padding: 14px 16px;
          font-size: 0.92rem;
          color: var(--sd-text);
          border-bottom: 1px solid var(--sd-border);
        }

        .custom-table tbody tr:hover {
          background-color: var(--sd-bg-1) !important;
        }

        .text-center {
          text-align: center;
        }
      `}</style>

      {/* Header Row */}
      <div className="header-row">
        <div className="title-container">
          <h2 className="title">Practical Experiments</h2>
          <p className="subtitle">
            Manage practical syllabus for <strong>{course}</strong> ({className})
          </p>
        </div>
        <button
          className="btn button"
          onClick={() => setIsModalOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <i className="bi bi-plus-lg"></i> Add Practical
        </button>
      </div>

      {/* Table Section */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "120px" }}>Practical No.</th>
              <th>Practical Name</th>
              <th className="text-center" style={{ width: "140px" }}>Setting</th>
            </tr>
          </thead>
          <tbody>
            {practicals.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center" style={{ padding: "24px", color: "var(--sd-muted)" }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              practicals.map((practical, index) => (
                <tr key={index}>
                  <td className="text-center" style={{ fontWeight: "600" }}>{practical.practicalNo}</td>
                  <td>{practical.practicalName}</td>
                  <td className="text-center">
                    <button
                      className="action-btn action-btn-edit"
                      onClick={() => handleEditClick(practical)}
                    >
                      <i className="bi bi-pencil-square"></i> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPracticalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPractical}
      />
    </div>
  );
};

export default PracticalTable;
