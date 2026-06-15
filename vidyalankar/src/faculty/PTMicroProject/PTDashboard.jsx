import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";

export default function PTDashboard() {
  const [ciannList, setCiannList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:5000/api/cianns", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        
        // Filter out CIANNs if they are not array (in case of error response)
        if (Array.isArray(data)) {
          setCiannList(data);
        } else {
          console.error("Invalid CIANN data:", data);
        }
      } catch (err) {
        console.error("Error fetching CIANNs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, [navigate]);

  const handleCardSelect = (ciann) => {
    setSelectedCard(selectedCard?._id === ciann._id ? null : ciann);
  };

  const handleSubjectSelect = async (ciann, subject) => {
    setCheckingConfig(true);
    try {
      const token = localStorage.getItem("token");
      const subjectId = subject._id || subject.subjectId || ciann.subject?._id;

      if (!subjectId) {
        alert("Invalid Subject Selection");
        return;
      }

      // Check if config exists
      const configRes = await fetch(
        `http://localhost:5000/api/pt-microproject/new/config/${ciann.ciannId}/${subjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const configData = await configRes.json();

      if (configData.success && configData.config) {
        // Configuration exists -> Open marks management
        navigate(`/pt-microproject/entry`, {
          state: {
            ciann,
            subject,
            config: configData.config,
          },
        });
      } else {
        // Configuration does NOT exist -> Redirect to Configuration
        navigate(`/pt-microproject/configuration`, {
          state: {
            ciann,
            subject,
          },
        });
      }
    } catch (error) {
      console.error("Error checking PT configuration:", error);
      alert("Error checking configuration. Please try again.");
    } finally {
      setCheckingConfig(false);
    }
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container-fluid py-4 px-md-5">
        {/* Page Title & Hero Header */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="p-5 rounded-4 shadow-lg text-white" style={{
              background: "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)",
              boxShadow: "0 10px 30px rgba(31, 64, 55, 0.2)"
            }}>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                  <i className="bi bi-diagram-3-fill fs-2"></i>
                </div>
                <div>
                  <h1 className="display-6 fw-bold mb-1">PT & Microproject Module</h1>
                  <p className="lead mb-0 text-white-50">Configure assessments, distribute SLA marks, and manage student performance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Info */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-3 p-3 bg-light">
              <span className="text-muted small uppercase fw-bold tracking-wider">Instructions</span>
              <div className="d-flex gap-4 mt-2 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success rounded-circle">1</span>
                  <span className="text-secondary small">Select a CIANN class card</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success rounded-circle">2</span>
                  <span className="text-secondary small">Choose the Subject</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success rounded-circle">3</span>
                  <span className="text-secondary small">Configure mark components and enter student marks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CIANN Cards */}
        <div className="row">
          <div className="col-12">
            <h3 className="fw-semibold mb-4 text-dark d-flex align-items-center gap-2">
              <i className="bi bi-card-text text-success"></i>
              Select CIANN Card
            </h3>
          </div>

          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading CIANNs...</span>
              </div>
              <p className="mt-3 text-muted">Loading your CIANN classes...</p>
            </div>
          ) : ciannList.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm p-5 text-center rounded-3 bg-light">
                <i className="bi bi-folder-x fs-1 text-muted mb-3"></i>
                <h4 className="text-muted">No CIANN cards found</h4>
                <p className="text-secondary mb-0">Please create a CIANN record or check your shared access before using this module.</p>
              </div>
            </div>
          ) : (
            ciannList.map((ciann) => {
              const deptName = ciann.department?.name || ciann.department || "N/A";
              const isSelected = selectedCard?._id === ciann._id;

              return (
                <div key={ciann._id} className="col-md-6 col-lg-4 mb-4">
                  <div 
                    className={`card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden cursor-pointer transition-all ${
                      isSelected ? "border-start border-success border-5 shadow" : ""
                    }`}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      transform: isSelected ? "translateY(-5px)" : "none",
                      backgroundColor: isSelected ? "#f4fcf7" : "#fff"
                    }}
                    onClick={() => handleCardSelect(ciann)}
                  >
                    <div className="card-body p-4">
                      {/* Badge / ID */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-semibold">
                          ID: {ciann.ciannId}
                        </span>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2">
                          {ciann.academicYear}
                        </span>
                      </div>

                      {/* Card Content */}
                      <h5 className="card-title fw-bold text-dark mb-1">
                        {deptName}
                      </h5>
                      <p className="text-muted small mb-3">
                        Semester {ciann.semester} &bull; Division {ciann.division}
                      </p>

                      <div className="p-3 bg-light rounded-3 mb-2">
                        <span className="text-muted small d-block mb-1">Subject</span>
                        <strong className="text-dark">{ciann.subject?.name || "Unknown Subject"}</strong>
                        <span className="text-secondary small d-block mt-1">Code: {ciann.subject?.code || "N/A"}</span>
                      </div>

                      {/* Subject Selection Trigger */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-top">
                          <span className="text-muted small d-block mb-2">Click below to proceed:</span>
                          <button
                            disabled={checkingConfig}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubjectSelect(ciann, ciann.subject);
                            }}
                            className="btn btn-success w-100 py-2 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
                          >
                            {checkingConfig ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <>
                                <span>Manage PT Marks</span>
                                <i className="bi bi-arrow-right-short fs-5"></i>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
