import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TheoryEdit.css";
import AttendanceForm from "./Theory"; 

const TheoryAt = () => {
  const [view, setView] = useState("sheet");
  const [week, setWeek] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [teachingPlans, setTeachingPlans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [planningStarted, setPlanningStarted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCiann = location.state?.ciannData;

  useEffect(() => {
    if (!selectedCiann) return;

    const fetchData = async () => {
      try {
        const ciannId = selectedCiann.ciannId;
        const planRes = await fetch(`http://localhost:5000/api/teaching-plan/${ciannId}`);

        if (planRes.status === 404) {
          setTeachingPlans([]);
          setPlanningStarted(false);
        } else if (!planRes.ok) {
          throw new Error(`HTTP error fetching plans! status: ${planRes.status}`);
        } else {
          const planData = await planRes.json();
          setTeachingPlans(Array.isArray(planData) ? planData : []);
          setPlanningStarted(Array.isArray(planData) && planData.length > 0);
        }

        const attRes = await fetch(`http://localhost:5000/api/theory-attendance?ciannId=${ciannId}`);

        if (attRes.status === 404) {
          setAttendanceRecords([]);
        } else if (!attRes.ok) {
          throw new Error(`HTTP error fetching attendance! status: ${attRes.status}`);
        } else {
          const attData = await attRes.json();
          setAttendanceRecords(Array.isArray(attData) ? attData : []);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setTeachingPlans([]);
        setAttendanceRecords([]);
        setPlanningStarted(false);
      }
    };

    fetchData();
  }, [selectedCiann]);

  if (!selectedCiann) {
    return (
      <div className="timetable-main-content">
        <div className="theory-attendance-container">
          <h3>No CIAAN selected. Please select a CIAAN card first.</h3>
        </div>
      </div>
    );
  }

  const allRows = teachingPlans.flatMap((weekPlan) =>
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
      
      // ✅ CORRECTED LOGIC: Find a match based on the topic only.
      const attendance = attendanceRecords.find(
        (att) => att.topic === plan.subTopic
      );

      return {
        chapterNo,
        chapterName,
        endDate: plan.startDate || "",
        attendance: !!attendance,
        subTopic: plan.subTopic || "",
      };
    })
  );

  const itemsPerPage = 5;
  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const paginatedRows = allRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCheckboxClick = (row) => {
    if (!row.attendance) {
      setSelectedRow(row);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const renderTable = () => {
    if (!planningStarted || !teachingPlans.length) {
      return (
        <table>
          <thead>
            <tr>
              <th>Chapter No.</th>
              <th>Name of Chapter</th>
              <th>Date of Completion of Topic</th>
              <th>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No data available
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
            <th>Chapter No.</th>
            <th>Name of Chapter</th>
            <th>Date of Completion of Topic</th>
            <th>Mark Attendance</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <tr key={index} style={{ borderBottom: index === paginatedRows.length - 1 ? "2px solid black" : "1px solid #ccc" }}>
              <td data-label="Chapter No.">{row.chapterNo ? `Unit - ${row.chapterNo}` : ""}</td>
              <td data-label="Name of Chapter">{row.chapterName || ""}</td>
              <td data-label="Date of Completion of Topic">{row.endDate || ""}</td>
              <td data-label="Mark Attendance">
                <label
                  className={`custom-checkbox ${row.attendance ? 'is-locked' : ''}`}
                  onClick={() => { if (!row.attendance) handleCheckboxClick(row); }}
                  title={row.attendance ? 'Attendance already marked' : 'Click to mark attendance'}
                >
                  <input
                    type="checkbox"
                    checked={!!row.attendance}
                    readOnly
                  />
                  <span className="checkmark" />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (view === "add" || view === "edit") {
    return (
      <div className="timetable-main-content">
        {/* Content for add/edit view would go here if implemented */}
      </div>
    );
  }

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Theory Attendance</h3>
        </div>
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
        {isModalOpen && selectedRow && (
          <AttendanceForm
            chapterNo={selectedRow.chapterNo ? `Unit - ${selectedRow.chapterNo}` : ""}
            chapterName={selectedRow.subTopic}
            endDate={selectedRow.endDate}
            onClose={closeModal}
            onSubmit={(actualDate, remark) => {
              navigate('/final-attendance', {
                state: {
              ciannId: selectedCiann.ciannId, // ✅ ADD THIS LINE
              ciannData: selectedCiann,      // ✅ Also pass the full ciannData for navigation back
               topic: selectedRow.subTopic,
             date: actualDate,
             remark: remark,
             chapter: selectedRow.chapterName,
      startDate: selectedRow.endDate, // Note: Your code aliases startDate as endDate
      teachingMethod: selectedRow.teachingMethod || 'Lecture'
  },
              });
              closeModal();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TheoryAt;
