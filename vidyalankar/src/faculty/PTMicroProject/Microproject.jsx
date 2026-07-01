import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ActivityCard from "./ActivityCard";
import MaxMarksSelector from "./MaxMarksSelector";
import StudentMarksGrid from "./StudentMarksGrid";
import { config } from "../../config/api";
import "./Microproject.css";

const Microproject = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedMaxMarks, setSelectedMaxMarks] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [, setShowMaxMarksSelector] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [Ciaans, setCiaans] = useState([]);
  const [selectedCiaanId, setSelectedCiaanId] = useState("");
  const [loadingCiaans, setLoadingCiaans] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [marksRefreshToken, setMarksRefreshToken] = useState(0);
  const [savedMarksMap, setSavedMarksMap] = useState({});
  const isStep3Page = location.pathname.endsWith("/step-3");

  const currentStep = !selectedActivity
    ? 1
    : !selectedDepartment || !selectedClass || !selectedCiaanId
      ? 2
      : 3;

  const buildWizardSearch = (overrides = {}) => {
    const params = new URLSearchParams();

    const nextActivity = overrides.selectedActivity ?? selectedActivity;
    const nextDepartment = overrides.selectedDepartment ?? selectedDepartment;
    const nextClass = overrides.selectedClass ?? selectedClass;
    const nextCiaanId = overrides.selectedCiaanId ?? selectedCiaanId;
    const nextMaxMarks = overrides.selectedMaxMarks ?? selectedMaxMarks;
    const nextStep = overrides.step ?? currentStep;

    if (nextActivity) params.set("activity", nextActivity);
    if (nextDepartment) params.set("departmentId", nextDepartment);
    if (nextClass) params.set("classId", nextClass);
    if (nextCiaanId) params.set("CiaanId", nextCiaanId);
    if (nextMaxMarks) params.set("maxMarks", String(nextMaxMarks));
    params.set("step", String(nextStep));

    return `?${params.toString()}`;
  };

  const activities = [
    {
      id: "Microproject",
      title: "Microproject",
      icon: "bi-diagram-3",
    },
    {
      id: "Assignment",
      title: "Assignment",
      icon: "bi-file-text",
    },
    {
      id: "Other Activity",
      title: "Other Activity",
      icon: "bi-star",
    },
  ];

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if no token
      navigate("/login");
    }
    fetchDepartments();
  }, []); // Only run once on mount

  // Restore wizard state from URL so dedicated step pages keep context.
  useEffect(() => {
    const urlActivity = searchParams.get("activity");
    const urlDepartment = searchParams.get("departmentId");
    const urlClass = searchParams.get("classId");
    const urlCiaanId = searchParams.get("CiaanId");
    const urlMaxMarks = Number(searchParams.get("maxMarks"));
    const urlStep = Number(searchParams.get("step"));

    if (urlActivity) setSelectedActivity(urlActivity);
    if (urlDepartment) setSelectedDepartment(urlDepartment);
    if (urlClass) setSelectedClass(urlClass);
    if (urlCiaanId) setSelectedCiaanId(urlCiaanId);
    if (!Number.isNaN(urlMaxMarks) && urlMaxMarks > 0) {
      setSelectedMaxMarks(urlMaxMarks);
    }

    if (urlStep === 3) {
      setShowMaxMarksSelector(false);
    }
  }, []);

  // Keep wizard stage reflected in URL so each stage has a distinct URL state.
  useEffect(() => {
    setSearchParams(new URLSearchParams(buildWizardSearch().slice(1)), {
      replace: true,
    });
  }, [
    currentStep,
    selectedActivity,
    selectedDepartment,
    selectedClass,
    selectedCiaanId,
    selectedMaxMarks,
    setSearchParams,
  ]);

  useEffect(() => {
    if (selectedActivity && selectedCiaanId) {
      loadActivitySettings(selectedActivity, selectedCiaanId);
    } else if (selectedActivity) {
      setSelectedMaxMarks(null);
      setShowMaxMarksSelector(true);
      setStudents([]);
    }
  }, [selectedActivity, selectedCiaanId]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchClasses(selectedDepartment);
    } else {
      setClasses([]);
      setSelectedClass("");
      setCiaans([]);
      setSelectedCiaanId("");
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedClass) {
      fetchCiaans(selectedDepartment, selectedClass);
    } else {
      setCiaans([]);
      setSelectedCiaanId("");
    }
  }, [selectedDepartment, selectedClass]);

  useEffect(() => {
    if (
      selectedActivity &&
      selectedMaxMarks &&
      selectedDepartment &&
      selectedClass &&
      selectedCiaanId
    ) {
      fetchStudents(selectedMaxMarks);
      fetchSavedMarks();
    }
  }, [
    selectedActivity,
    selectedMaxMarks,
    selectedDepartment,
    selectedClass,
    selectedCiaanId,
    marksRefreshToken,
  ]);

  const fetchDepartments = async () => {
    setLoadingCatalog(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(config.catalog.departments, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setDepartments(result.departments || []);
      } else {
        setError("Failed to fetch departments");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Error fetching departments. Please try again.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchClasses = async (departmentId) => {
    setLoadingCatalog(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(config.catalog.courses(departmentId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setClasses(result.courses || []);
      } else {
        setClasses([]);
        setError("Failed to fetch classes");
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
      setError("Error fetching classes. Please try again.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadActivitySettings = async (activityId, CiaanId) => {
    setLoadingSettings(true);
    try {
      const token = localStorage.getItem("token");
      const college = localStorage.getItem("college");

      const response = await fetch(
        `/api/pt-microproject/activity-settings/${activityId}?institution=${college}&CiaanId=${CiaanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (result.success && result.data && result.data.maxMarks) {
        // If already selected before, load it and fetch students
        setSelectedMaxMarks(result.data.maxMarks);
        setShowMaxMarksSelector(true);
      } else {
        // First time selecting this activity, show selector
        setSelectedMaxMarks(null);
        setShowMaxMarksSelector(true);
        setStudents([]);
      }
    } catch (err) {
      console.error("Error loading activity settings:", err);
      // If error, show selector to let user choose
      setSelectedMaxMarks(null);
      setShowMaxMarksSelector(true);
      setStudents([]);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchCiaans = async (departmentId, courseId) => {
    setLoadingCiaans(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(config.Ciaans, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Ciaan list");
      }

      const result = await response.json();
      const selectedCourseObj = classes.find(
        (course) => course._id === courseId,
      );
      const selectedCourseCode = selectedCourseObj?.courseCode;

      const filtered = (result || []).filter((Ciaan) => {
        const CiaanDepartmentId = Ciaan?.department?._id || Ciaan?.department;
        const CiaanCourseId = Ciaan?.courseId?._id || Ciaan?.courseId;
        const CiaanCourseCode = Ciaan?.courseCode || Ciaan?.class;

        const deptMatches =
          CiaanDepartmentId?.toString() === departmentId?.toString();
        const courseMatches =
          CiaanCourseId?.toString() === courseId?.toString() ||
          (selectedCourseCode &&
            CiaanCourseCode?.toString() === selectedCourseCode?.toString());

        return deptMatches && courseMatches;
      });

      setCiaans(filtered);
      setSelectedCiaanId("");
    } catch (err) {
      console.error("Error fetching Ciaan list:", err);
      setCiaans([]);
      setSelectedCiaanId("");
      setError("Error fetching Ciaan list. Please try again.");
    } finally {
      setLoadingCiaans(false);
    }
  };

  // Step 1: Activity Selection
  const handleActivitySelect = (activityId) => {
    setSelectedActivity(selectedActivity === activityId ? null : activityId);
    setError("");
  };

  // Step 2: Max Marks Selection
  const handleMaxMarksSelect = async (maxMarks) => {
    setSelectedMaxMarks(maxMarks);
    // Note: Max marks are saved to DB automatically when first mark is saved
    // This API call just reads the last saved maxMarks for this activity
    setShowMaxMarksSelector(true);
  };

  const fetchStudents = async (maxMarks) => {
    setLoadingStudents(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const college = localStorage.getItem("college");

      const response = await fetch(
        `/api/pt-microproject/students?institution=${college}&departmentId=${selectedDepartment}&courseId=${selectedClass}${selectedCiaan?.divisionId ? `&divisionId=${selectedCiaan.divisionId}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        setStudents(result.data || []);
      } else {
        setError("Failed to fetch students");
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Error fetching students. Please try again.");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSavedMarks = async () => {
    try {
      const token = localStorage.getItem("token");
      const college = localStorage.getItem("college");

      const params = new URLSearchParams();
      if (college) params.append("institution", college);
      if (selectedCiaanId) params.append("CiaanId", selectedCiaanId);
      if (selectedClass) params.append("courseId", selectedClass);

      const response = await fetch(
        `/api/pt-microproject/activity/${selectedActivity}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const nextMap = {};

        result.data.forEach((item) => {
          const studentKey = item?.studentId?._id || item?.studentId;
          if (studentKey !== undefined && item?.marks !== undefined) {
            nextMap[studentKey] = item.marks;
          }
        });

        setSavedMarksMap(nextMap);
      }
    } catch (err) {
      console.error("Error fetching saved marks:", err);
    }
  };

  const handleSaveMarks = async (marksData, options = {}) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/pt-microproject/save-marks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(marksData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to save marks");
      }

      if (!options.silent) {
        setSuccessMessage(`Saved marks for ${marksData.studentName}.`);
        setTimeout(() => setSuccessMessage(""), 2000);
      }

      setSavedMarksMap((prev) => ({
        ...prev,
        [marksData.studentId]: marksData.marks,
      }));

      if (!options.skipRefresh) {
        setMarksRefreshToken((prev) => prev + 1);
      }

      return result;
    } catch (err) {
      setError(err.message || "Error saving marks");
      throw err;
    }
  };

  const handleBackToActivity = () => {
    setSelectedActivity(null);
    setSelectedMaxMarks(null);
    setShowMaxMarksSelector(false);
    setSelectedDepartment("");
    setSelectedClass("");
    setCiaans([]);
    setSelectedCiaanId("");
    setClasses([]);
    setStudents([]);

    navigate("/pt-microproject/microproject?step=1");
  };

  const selectedCiaan = Ciaans.find(
    (item) => String(item.CiaanId) === String(selectedCiaanId),
  );
  const selectedSubjectName =
    selectedCiaan?.subject?.name ||
    selectedCiaan?.subject?.subjectName ||
    "Unknown Subject";
  const selectedSubjectId =
    selectedCiaan?.subject?._id || selectedCiaan?.subjectId || "";

  const handleBulkSaveComplete = (savedCount) => {
    setSuccessMessage(`Saved marks for ${savedCount} students successfully.`);
    setTimeout(() => setSuccessMessage(""), 2500);
    setMarksRefreshToken((prev) => prev + 1);
  };

  return (
    <div className="container-fluid p-4 ptm-shell">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card ptm-hero-card">
            <div className="card-header ptm-hero-header">
              <h4 className="mb-0">
                <i className="bi bi-diagram-3 me-2"></i>
                PT Microproject - Marks Entry
              </h4>
            </div>
            <div className="card-body ptm-hero-body">
              <p className="mb-0 text-muted">
                <strong>Step 1:</strong> Select activity type |
                <strong> Step 2:</strong> Select department, class, and Ciaan |
                <strong> Step 3:</strong> Select marks (out of) and enter
                student marks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="row mb-3">
          <div className="col-12">
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {successMessage && (
        <div className="row mb-3">
          <div className="col-12">
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              {successMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuccessMessage("")}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Activity Selection */}
      {!selectedActivity && !isStep3Page && (
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3 ptm-step-title">
              <i className="bi bi-1-circle me-2"></i>
              Step 1: Select Activity Type
            </h5>
            <div className="row g-3">
              {activities.map((activity) => (
                <div key={activity.id} className="col-md-4">
                  <ActivityCard
                    title={activity.title}
                    icon={activity.icon}
                    isSelected={selectedActivity === activity.id}
                    onClick={() => handleActivitySelect(activity.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Department and Class Selection */}
      {selectedActivity && !isStep3Page && (
        <div className="row mb-4">
          <div className="col-lg-8 offset-lg-2">
            <div className="card ptm-panel">
              <div className="card-header ptm-panel-header">
                <h5 className="mb-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span>
                    <i className="bi bi-2-circle me-2"></i>
                    Step 2: Select Department, Class, and Ciaan
                  </span>
                  <button
                    className="btn btn-sm ptm-back-btn"
                    onClick={handleBackToActivity}
                  >
                    <i className="bi bi-chevron-left me-1"></i>
                    Back
                  </button>
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Department</label>
                    <select
                      className="form-select"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      disabled={loadingCatalog}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>
                          {department.code ? `${department.code} - ` : ""}
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Class</label>
                    <select
                      className="form-select"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      disabled={!selectedDepartment || loadingCatalog}
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((course) => (
                        <option key={course._id} value={course._id}>
                          Sem {course.semester} - {course.courseCode} (
                          {course.scheme})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">
                      Ciaan (Subject Context)
                    </label>
                    <select
                      className="form-select"
                      value={selectedCiaanId}
                      onChange={(e) => setSelectedCiaanId(e.target.value)}
                      disabled={
                        !selectedDepartment || !selectedClass || loadingCiaans
                      }
                    >
                      <option value="">-- Select Ciaan --</option>
                      {Ciaans.map((Ciaan) => (
                        <option key={Ciaan._id} value={Ciaan.CiaanId}>
                          Ciaan-{Ciaan.CiaanId} |{" "}
                          {Ciaan.subject?.name ||
                            Ciaan.subject?.subjectName ||
                            "Unknown Subject"}
                        </option>
                      ))}
                    </select>
                    {selectedCiaan && (
                      <div className="alert ptm-info-alert mt-3 mb-0">
                        <i className="bi bi-journal-bookmark me-2"></i>
                        <strong>Selected Subject:</strong> {selectedSubjectName}
                      </div>
                    )}
                  </div>

                  <div className="col-12 d-flex justify-content-end mt-2">
                    <button
                      className="btn ptm-edit-btn"
                      disabled={
                        !selectedDepartment ||
                        !selectedClass ||
                        !selectedCiaanId
                      }
                      onClick={() =>
                        navigate(
                          `/pt-microproject/microproject/step-3${buildWizardSearch({ step: 3 })}`,
                        )
                      }
                    >
                      Continue to Step 3
                      <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Max Marks + Student Marks Entry */}
      {selectedActivity && isStep3Page && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <button
                className="btn btn-sm ptm-back-btn"
                onClick={() =>
                  navigate(
                    `/pt-microproject/microproject${buildWizardSearch({ step: 2 })}`,
                  )
                }
              >
                <i className="bi bi-chevron-left me-1"></i>
                Back to Step 2
              </button>
              <h5 className="mb-0 ptm-step-title">
                <i className="bi bi-3-circle me-2"></i>
                Step 3: Select Max Marks and Enter Student Marks
              </h5>
              {loadingSettings && (
                <div
                  className="spinner-border spinner-border-sm text-warning ms-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
            </div>

            {!selectedDepartment || !selectedClass || !selectedCiaanId ? (
              <div className="alert ptm-warn-alert mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Please select department, class, and Ciaan first.
              </div>
            ) : (
              <>
                <div className="col-lg-8 offset-lg-2">
                  <MaxMarksSelector
                    selectedMaxMarks={selectedMaxMarks}
                    onSelect={handleMaxMarksSelect}
                  />
                </div>

                {selectedMaxMarks ? (
                  <div className="mt-4">
                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                      <span className="badge ptm-chip ms-2">
                        {selectedActivity} - Out Of {selectedMaxMarks}
                      </span>
                      <span className="badge ptm-chip-secondary ms-2">
                        Subject: {selectedSubjectName}
                      </span>
                    </div>

                    <StudentMarksGrid
                      students={students}
                      maxMarks={selectedMaxMarks}
                      activityType={selectedActivity}
                      loading={loadingStudents}
                      onSaveMarks={(marksData) =>
                        handleSaveMarks(
                          {
                            ...marksData,
                            CiaanId: Number(selectedCiaanId),
                            subjectId: selectedSubjectId,
                            subjectName: selectedSubjectName,
                            divisionId:
                              selectedCiaan?.divisionId || marksData.divisionId,
                          },
                          { silent: true, skipRefresh: true },
                        )
                      }
                      onBulkSaveComplete={handleBulkSaveComplete}
                      courseId={selectedClass}
                      submission={savedMarksMap}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Microproject;
