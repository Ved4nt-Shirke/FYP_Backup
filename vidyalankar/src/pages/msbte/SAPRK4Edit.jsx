import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import Sidebar from "../../basic/Sidebar";
import "./MSBTEPages.css";

const SAPRK4Edit = () => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});

  // Fetch students on component load
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/students`,
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
          // Initialize marks object
          const initialMarks = {};
          data.forEach((student) => {
            initialMarks[student._id] = "";
          });
          setMarks(initialMarks);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  const handleMarksChange = (studentId, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleUpdate = async () => {
    // Update marks
    console.log("Updating marks:", marks);
    alert("SA-PR Sheet updated successfully!");
  };

  return (
    <>
      <Header onMenuToggle={() => setIsSidebarVisible(!isSidebarVisible)} />
      <Sidebar
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
      />
      <div className="main-content">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <h3 className="mb-4">Edit SA-PR Sheet</h3>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Roll ID</th>
                <th>Name</th>
                <th>Seat No.</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.rollId || student.regNumber || "-"}</td>
                    <td>{student.name || "-"}</td>
                    <td>{student.seatNo || "-"}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="0"
                        value={marks[student._id] || ""}
                        onChange={(e) =>
                          handleMarksChange(student._id, e.target.value)
                        }
                        min="0"
                        max="100"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button className="btn btn-warning me-2" onClick={handleUpdate}>
            <i className="bi bi-pencil-square"></i> Update Sheet
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default SAPRK4Edit;
