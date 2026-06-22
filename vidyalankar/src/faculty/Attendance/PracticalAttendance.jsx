import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import PracticalAttendanceForm from "./PracticalAttendanceForm";
import "./PracticalAttendance.css";

const PracticalEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData;

  const [labPlans, setLabPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!ciannData?.ciannId) return;

    const fetchLabPlans = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/lab-planning/${ciannData.ciannId}`,
        );
        if (res.status === 404) {
          setLabPlans([]);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch lab plans`);
        }
        const data = await res.json();
        setLabPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching lab plans:", err);
        setLabPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLabPlans();
  }, [ciannData?.ciannId]);

  const allRows = useMemo(() => {
    return labPlans.flatMap((weekPlan) =>
      (weekPlan.plans || []).map((plan) => ({
        weekNo: weekPlan.weekNo,
        batch: plan.batch || "-",
        exptNo: plan.exptNo || "-",
        exptName: plan.exptName || "-",
        plannedDate: plan.date || "-",
        actualDate: plan.actualDate || "",
        remark: plan.remark || "",
      })),
    );
  }, [labPlans]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(allRows.length / itemsPerPage) || 1;
  const paginatedRows = allRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleOpenModal = (plan) => {
    if (plan.actualDate) return;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  if (!ciannData) {
    return (
      <div className="practical-page">
        <div className="practical-card">
          <h2 className="practical-title">Mark Practical Attendance</h2>
          <p className="practical-subtitle">
            No CIAAN selected. Please choose a CIAAN card first.
          </p>
        </div>
      </div>
    );
  }

  const completedCount = allRows.filter((row) => row.actualDate).length;
  const pendingCount = allRows.length - completedCount;

  return (
    <div>
      <Header />
      <div className="practical-page">
        <div className="practical-card">
          <header className="practical-header">
            <div className="practical-header-main">
              <p className="practical-eyebrow">Lab Attendance</p>
              <h2 className="practical-title">Mark Practical Attendance</h2>
              <p className="practical-subtitle">
                {ciannData.subject?.name} ({ciannData.subject?.code})
              </p>
            </div>
            <div className="practical-header-meta">
              <div>
                <span>Division</span>
                <strong>{ciannData.division || "N/A"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{ciannData.department?.name || "N/A"}</strong>
              </div>
              <div>
                <span>Semester</span>
                <strong>{ciannData.semester || "N/A"}</strong>
              </div>
            </div>
          </header>

          <section className="practical-metrics">
            <div className="metric-card">
              <span>Experiments</span>
              <strong>{allRows.length}</strong>
            </div>
            <div className="metric-card success">
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
            <div className="metric-card warning">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
          </section>

          <section className="practical-table-section">
            <div className="practical-table-head">
              <div>
                <h3>Lab Plan Schedule</h3>
                <p>
                  Use the mark button to record attendance for each experiment.
                </p>
              </div>
              <div className="practical-badge">
                CIAAN ID {ciannData.ciannId}
              </div>
            </div>

            <div className="practical-table-container">
              {loading ? (
                <div className="practical-loading">Loading lab plan...</div>
              ) : allRows.length === 0 ? (
                <div className="practical-empty">
                  <h4>No lab plan found</h4>
                  <p>Add a laboratory plan before marking attendance.</p>
                </div>
              ) : (
                <table className="practical-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Batch</th>
                      <th>Experiment</th>
                      <th>Planned Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((plan, index) => (
                      <tr key={`${plan.weekNo}-${plan.exptNo}-${index}`}>
                        <td data-label="Week">{plan.weekNo}</td>
                        <td data-label="Batch">{plan.batch}</td>
                        <td data-label="Experiment">
                          <strong>Exp {plan.exptNo}:</strong> {plan.exptName}
                        </td>
                        <td data-label="Planned Date">{plan.plannedDate}</td>
                        <td data-label="Status">
                          {plan.actualDate ? (
                            <span className="status-pill completed">
                              Completed
                            </span>
                          ) : (
                            <span className="status-pill pending">Pending</span>
                          )}
                        </td>
                        <td data-label="Action">
                          <button
                            className={`action-pill ${plan.actualDate ? "is-locked" : ""}`}
                            onClick={() => handleOpenModal(plan)}
                            disabled={!!plan.actualDate}
                          >
                            {plan.actualDate ? "Marked" : "Mark"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {allRows.length > 0 && (
            <div className="practical-pagination practical-pagination--nav">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-indicator">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedPlan && (
        <PracticalAttendanceForm
          weekNo={selectedPlan.weekNo}
          ciannId={ciannData.ciannId}
          batch={selectedPlan.batch}
          exptNo={selectedPlan.exptNo}
          exptName={selectedPlan.exptName}
          plannedDate={selectedPlan.plannedDate}
          ciannData={ciannData}
          onClose={closeModal}
          onSubmitSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default PracticalEdit;
