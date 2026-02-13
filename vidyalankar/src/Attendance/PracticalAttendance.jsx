// Attendance/PracticalEdit.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../basic/Header";

import PracticalAttendanceForm from "./PracticalAttendanceForm";
import "./PracticalAttendance.css";

const PracticalEdit = () => {
  const [practicalPlans, setPracticalPlans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const ciannData = location.state?.ciannData;

  useEffect(() => {
    if (!ciannData) return;
    const fetchData = async () => {
      try {
        // Fetch lab planning
        let planRes = await fetch(`http://localhost:5000/api/lab-planning/${ciannData.ciannId}`);
        if (planRes.status === 404) {
          setPracticalPlans([]);
        } else if (!planRes.ok) {
          throw new Error(`HTTP error fetching plans! status: ${planRes.status}`);
        } else {
          let planData = await planRes.json();
          setPracticalPlans(Array.isArray(planData) ? planData : []);
        }
        // Optionally: fetch attendance records (implementation depends on schema)
        // let attRes = await fetch(`http://localhost:5000/api/practical-attendance?ciannId=${ciannData.ciannId}`);
        // ... setAttendanceRecords if needed
      } catch (err) {
        console.error("Error fetching data:", err);
        setPracticalPlans([]);
      }
    };
    fetchData();
  }, [ciannData]);

  const handleMarkAttendance = (weekNo, plan) => {
    // Set up modal for attendance form like Theory.jsx
    setSelectedPlan({ ...plan, weekNo, ciannId: ciannData.ciannId });
    setIsModalOpen(true);
  };

  // Flatten all plans for pagination
  const allRows = practicalPlans.flatMap(weekPlan =>
    weekPlan.plans.map(plan => ({
      ...plan,
      weekNo: weekPlan.weekNo
    }))
  );

  const itemsPerPage = 5;
  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const paginatedRows = allRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!ciannData) {
    return (
      <div>
        <Header />
        <div className="timetable-main-content">
          <div className="theory-attendance-container">
            <h3>No CIAAN selected. Please select a CIAAN card first.</h3>
          </div>
        </div>

      </div>
    );
  }

  const renderTable = () => {
    if (!practicalPlans.length) {
      return (
        <table>
          <thead>
            <tr>
              <th>Week No.</th>
              <th>Batch</th>
              <th>Experiment No.</th>
              <th>Experiment Name</th>
              <th>Planned Date</th>
              <th>Actual Date</th>
              <th>Remark</th>
              <th>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No practical plans available for this CIANN
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Week No.</th>
            <th>Batch</th>
            <th>Experiment No.</th>
            <th>Experiment Name</th>
            <th>Planned Date</th>
            <th>Actual Date</th>
            <th>Remark</th>
            <th>Mark Attendance</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((plan, index) => (
            <tr key={`${plan.weekNo}-${plan.exptNo}-${plan.batch}`} style={{ borderBottom: index === paginatedRows.length - 1 ? "2px solid black" : "1px solid #ccc" }}>
              <td data-label="Week No.">{plan.weekNo}</td>
              <td data-label="Batch">{plan.batch}</td>
              <td data-label="Experiment No.">{plan.exptNo}</td>
              <td data-label="Experiment Name">{plan.exptName}</td>
              <td data-label="Planned Date">{plan.date}</td>
              <td data-label="Actual Date" className={plan.actualDate ? "status-completed" : "status-dash"}>
                {plan.actualDate || "-"}
              </td>
              <td data-label="Remark">{plan.remark || ""}</td>
              <td data-label="Mark Attendance">
                <button
                  className={`mark-attendance-btn ${plan.actualDate ? 'disabled' : ''}`}
                  onClick={() => handleMarkAttendance(plan.weekNo, plan)}
                  disabled={plan.actualDate}
                  title={plan.actualDate ? 'Attendance already marked' : 'Mark attendance'}
                >
                  {plan.actualDate ? 'Marked' : 'Mark'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <Header />
      <div className="attendance-main-content">
        <div className="theory-attendance-container">
          <div className="header-row">
            <h3>Practical Attendance</h3>
          </div>
          
          {ciannData && (
            <div className="ciann-info">
              <strong>CIANN ID:</strong> {ciannData.ciannId} | <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) | <strong>Division:</strong> {ciannData.division}
            </div>
          )}

          <div className="table-container">{renderTable()}</div>
          
          {allRows.length > 0 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    backgroundColor: currentPage === page ? "#4caf50" : "white",
                    color: currentPage === page ? "white" : "black",
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}

          {/* Attendance modal */}
          {isModalOpen && selectedPlan && (
            <PracticalAttendanceForm
              weekNo={selectedPlan.weekNo}
              ciannId={selectedPlan.ciannId}
              batch={selectedPlan.batch}
              exptNo={selectedPlan.exptNo}
              exptName={selectedPlan.exptName}
              plannedDate={selectedPlan.date}
              onClose={() => setIsModalOpen(false)}
              onSubmitSuccess={() => {
                setIsModalOpen(false);
                // refresh table
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default PracticalEdit;
