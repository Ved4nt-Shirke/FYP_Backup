import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TheoryEdit.css";
import AttendanceForm from "./Theory";

const TheoryAt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCiaan = location.state?.CiaanData;

  const [teachingPlans, setTeachingPlans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!selectedCiaan) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const CiaanId = selectedCiaan.CiaanId;
        const planRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/teaching-plan/${CiaanId}`,
        );

        if (planRes.status === 404) {
          setTeachingPlans([]);
        } else if (!planRes.ok) {
          throw new Error(
            `HTTP error fetching plans! status: ${planRes.status}`,
          );
        } else {
          const planData = await planRes.json();
          setTeachingPlans(Array.isArray(planData) ? planData : []);
        }

        const attRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/theory-attendance?CiaanId=${CiaanId}`,
        );

        if (attRes.status === 404) {
          setAttendanceRecords([]);
        } else if (!attRes.ok) {
          throw new Error(
            `HTTP error fetching attendance! status: ${attRes.status}`,
          );
        } else {
          const attData = await attRes.json();
          setAttendanceRecords(Array.isArray(attData) ? attData : []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setTeachingPlans([]);
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCiaan]);

  const allRows = useMemo(() => {
    return teachingPlans.flatMap((weekPlan) =>
      (weekPlan.plans || []).map((plan) => {
        let chapterNo = "";
        let chapterName = plan.chapter || "";
        if (plan.chapter && plan.chapter.startsWith("Unit - ")) {
          const parts = plan.chapter.split(". ");
          if (parts.length > 1) {
            chapterNo = parts[0].replace("Unit - ", "");
            chapterName = parts.slice(1).join(". ");
          }
        }

        const attendance = attendanceRecords.find(
          (att) => att.topic === plan.subTopic,
        );

        return {
          chapterNo,
          chapterName,
          endDate: plan.startDate || "",
          attendance: !!attendance,
          subTopic: plan.subTopic || "",
          teachingMethod: plan.teachingMethod || "Lecture",
        };
      }),
    );
  }, [teachingPlans, attendanceRecords]);

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

  const handleOpenModal = (row) => {
    if (row.attendance) return;
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  if (!selectedCiaan) {
    return (
      <div className="theory-page">
        <div className="theory-card">
          <h2 className="theory-title">Mark Theory Attendance</h2>
          <p className="theory-subtitle">
            No CIAAN selected. Please choose a CIAAN card first.
          </p>
        </div>
      </div>
    );
  }

  const markedCount = allRows.filter((row) => row.attendance).length;
  const pendingCount = allRows.length - markedCount;

  return (
    <div className="theory-page">
      <div className="theory-card">
        <header className="theory-header">
          <div className="theory-header-main">
            <p className="theory-eyebrow">Attendance Console</p>
            <h2 className="theory-title">Mark Theory Attendance</h2>
            <p className="theory-subtitle">
              {selectedCiaan.subject?.name} ({selectedCiaan.subject?.code})
            </p>
          </div>
          <div className="theory-header-meta">
            <div>
              <span>Division</span>
              <strong>{selectedCiaan.division || "N/A"}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{selectedCiaan.department?.name || "N/A"}</strong>
            </div>
            <div>
              <span>Semester</span>
              <strong>{selectedCiaan.semester || "N/A"}</strong>
            </div>
          </div>
        </header>

        <section className="theory-metrics">
          <div className="metric-card">
            <span>Topics</span>
            <strong>{allRows.length}</strong>
          </div>
          <div className="metric-card success">
            <span>Marked</span>
            <strong>{markedCount}</strong>
          </div>
          <div className="metric-card warning">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </section>

        <section className="theory-table-section">
          <div className="theory-table-head">
            <div>
              <h3>Topics Overview</h3>
              <p>Click the checkbox to mark attendance for a topic.</p>
            </div>
            <div className="theory-badge">CIAAN ID {selectedCiaan.CiaanId}</div>
          </div>

          <div className="theory-table-container">
            {loading ? (
              <div className="theory-loading">Loading topics...</div>
            ) : allRows.length === 0 ? (
              <div className="theory-empty">
                <h4>No teaching plan data yet</h4>
                <p>Add a teaching plan first to start marking attendance.</p>
              </div>
            ) : (
              <table className="theory-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Chapter</th>
                    <th>Planned Date</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, index) => (
                    <tr key={`${row.subTopic}-${index}`}>
                      <td data-label="Unit">
                        {row.chapterNo ? `Unit ${row.chapterNo}` : "-"}
                      </td>
                      <td data-label="Chapter">
                        {row.chapterName || row.subTopic || "-"}
                      </td>
                      <td data-label="Planned Date">{row.endDate || "-"}</td>
                      <td data-label="Attendance">
                        <label
                          className={`checkbox-pill ${row.attendance ? "is-locked" : ""}`}
                          onClick={() => handleOpenModal(row)}
                          title={
                            row.attendance
                              ? "Attendance already marked"
                              : "Click to mark attendance"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={row.attendance}
                            readOnly
                          />
                          <span>{row.attendance ? "Marked" : "Mark"}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {allRows.length > 0 && (
          <div className="theory-pagination">
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

      {isModalOpen && selectedRow && (
        <AttendanceForm
          chapterNo={
            selectedRow.chapterNo ? `Unit - ${selectedRow.chapterNo}` : ""
          }
          chapterName={selectedRow.subTopic}
          endDate={selectedRow.endDate}
          CiaanData={selectedCiaan}
          onClose={closeModal}
          onSubmit={(actualDate, remark) => {
            navigate("/final-attendance", {
              state: {
                CiaanId: selectedCiaan.CiaanId,
                CiaanData: selectedCiaan,
                topic: selectedRow.subTopic,
                date: actualDate,
                remark: remark,
                chapter: selectedRow.chapterNo,
                chapterName: selectedRow.chapterName,
                startDate: selectedRow.endDate,
                teachingMethod: selectedRow.teachingMethod || "Lecture",
              },
            });
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default TheoryAt;
