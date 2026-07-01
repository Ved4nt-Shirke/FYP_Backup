import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import PracticalAttendanceForm from "./PracticalAttendanceForm";
import "./PracticalAttendance.css";

const PracticalEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData;

  const [labPlans, setLabPlans] = useState([]);
  const [practicalRecords, setPracticalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!CiaanData?.CiaanId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "");
        const CiaanId = CiaanData.CiaanId;

        // Fetch lab plans and actual attendance records in parallel
        const [labRes, attRes] = await Promise.all([
          fetch(`${BASE}/api/lab-planning/${CiaanId}`),
          fetch(`${BASE}/api/practical-attendance?CiaanId=${CiaanId}`),
        ]);

        const plans = labRes.ok ? await labRes.json() : [];
        const records = attRes.ok ? await attRes.json() : [];

        setLabPlans(Array.isArray(plans) ? plans : []);
        setPracticalRecords(Array.isArray(records) ? records : []);

        // Auto-cleanup: clear stale actualDate from lab plans that have no attendance record
        // This fixes corrupted data from the old bug where actualDate was set before submission
        if (Array.isArray(plans) && Array.isArray(records)) {
          const recordKeys = new Set(
            records.map((r) => `${r.weekNo}-${r.batch}-${r.exptNo}`),
          );
          for (const weekPlan of plans) {
            for (const plan of weekPlan.plans || []) {
              if (plan.actualDate) {
                const key = `${weekPlan.weekNo}-${plan.batch}-${plan.exptNo}`;
                if (!recordKeys.has(key)) {
                  // Lab plan has actualDate but no real attendance record — clear the stale date
                  try {
                    await fetch(
                      `${BASE}/api/lab-planning/${CiaanId}/${weekPlan.weekNo}/${plan.batch}/${plan.exptNo}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ actualDate: "", remark: plan.remark || "" }),
                      },
                    );
                    plan.actualDate = ""; // Clear locally too so UI updates immediately
                  } catch (cleanupErr) {
                    console.warn("Could not clear stale actualDate:", cleanupErr);
                  }
                }
              }
            }
          }
          // Re-set labPlans after cleanup so the UI reflects cleared dates
          setLabPlans([...plans]);
        }
      } catch (err) {
        console.error("Error fetching lab plans or attendance:", err);
        setLabPlans([]);
        setPracticalRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [CiaanData?.CiaanId]);

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

  // ✅ True source of truth: a row is "Completed" only if a real attendance record exists in the DB
  const isCompleted = (plan) => {
    return practicalRecords.some(
      (r) =>
        String(r.weekNo) === String(plan.weekNo) &&
        r.batch === plan.batch &&
        String(r.exptNo) === String(plan.exptNo),
    );
  };

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
    if (isCompleted(plan)) return;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  if (!CiaanData) {
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

  const completedCount = allRows.filter((row) => isCompleted(row)).length;
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
                {CiaanData.subject?.name} ({CiaanData.subject?.code})
              </p>
            </div>
            <div className="practical-header-meta">
              <div>
                <span>Division</span>
                <strong>{CiaanData.division || "N/A"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{CiaanData.department?.name || "N/A"}</strong>
              </div>
              <div>
                <span>Semester</span>
                <strong>{CiaanData.semester || "N/A"}</strong>
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
                CIAAN ID {CiaanData.CiaanId}
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
                          {isCompleted(plan) ? (
                            <span className="status-pill completed">
                              Completed
                            </span>
                          ) : (
                            <span className="status-pill pending">Pending</span>
                          )}
                        </td>
                        <td data-label="Action">
                          <button
                            className={`action-pill ${isCompleted(plan) ? "is-locked" : ""}`}
                            onClick={() => handleOpenModal(plan)}
                            disabled={isCompleted(plan)}
                          >
                            {isCompleted(plan) ? "Marked" : "Mark"}
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
          CiaanId={CiaanData.CiaanId}
          batch={selectedPlan.batch}
          exptNo={selectedPlan.exptNo}
          exptName={selectedPlan.exptName}
          plannedDate={selectedPlan.plannedDate}
          CiaanData={CiaanData}
          onClose={closeModal}
          onSubmitSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default PracticalEdit;
