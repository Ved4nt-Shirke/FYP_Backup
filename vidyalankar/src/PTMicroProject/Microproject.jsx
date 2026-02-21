import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from './ActivityCard';
import MaxMarksSelector from './MaxMarksSelector';
import StudentMarksGrid from './StudentMarksGrid';
import { config } from '../config/api';

const Microproject = () => {
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedMaxMarks, setSelectedMaxMarks] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showMaxMarksSelector, setShowMaxMarksSelector] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [cianns, setCianns] = useState([]);
  const [selectedCiannId, setSelectedCiannId] = useState('');
  const [loadingCianns, setLoadingCianns] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [marksRefreshToken, setMarksRefreshToken] = useState(0);
  const [savedMarksMap, setSavedMarksMap] = useState({});

  const activities = [
    {
      id: 'Microproject',
      title: 'Microproject',
      icon: 'bi-diagram-3'
    },
    {
      id: 'Assignment',
      title: 'Assignment',
      icon: 'bi-file-text'
    },
    {
      id: 'Other Activity',
      title: 'Other Activity',
      icon: 'bi-star'
    }
  ];

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if no token
      navigate('/login');
    }
    fetchDepartments();
  }, []); // Only run once on mount

  useEffect(() => {
    if (selectedActivity && selectedCiannId) {
      loadActivitySettings(selectedActivity, selectedCiannId);
    } else if (selectedActivity) {
      setSelectedMaxMarks(null);
      setShowMaxMarksSelector(true);
      setStudents([]);
    }
  }, [selectedActivity, selectedCiannId]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchClasses(selectedDepartment);
    } else {
      setClasses([]);
      setSelectedClass('');
      setCianns([]);
      setSelectedCiannId('');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedClass) {
      fetchCianns(selectedDepartment, selectedClass);
    } else {
      setCianns([]);
      setSelectedCiannId('');
    }
  }, [selectedDepartment, selectedClass]);

  useEffect(() => {
    if (selectedActivity && selectedMaxMarks && selectedDepartment && selectedClass && selectedCiannId && !showMaxMarksSelector) {
      fetchStudents(selectedMaxMarks);
      fetchSavedMarks();
    }
  }, [selectedActivity, selectedMaxMarks, selectedDepartment, selectedClass, selectedCiannId, showMaxMarksSelector, marksRefreshToken]);

  const fetchDepartments = async () => {
    setLoadingCatalog(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(config.catalog.departments, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setDepartments(result.departments || []);
      } else {
        setError('Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Error fetching departments. Please try again.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchClasses = async (departmentId) => {
    setLoadingCatalog(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(config.catalog.courses(departmentId), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setClasses(result.courses || []);
      } else {
        setClasses([]);
        setError('Failed to fetch classes');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]);
      setError('Error fetching classes. Please try again.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadActivitySettings = async (activityId, ciannId) => {
    setLoadingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const college = localStorage.getItem('college');

      const response = await fetch(
        `/api/pt-microproject/activity-settings/${activityId}?institution=${college}&ciannId=${ciannId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success && result.data && result.data.maxMarks) {
        // If already selected before, load it and fetch students
        setSelectedMaxMarks(result.data.maxMarks);
        setShowMaxMarksSelector(false);
      } else {
        // First time selecting this activity, show selector
        setSelectedMaxMarks(null);
        setShowMaxMarksSelector(true);
        setStudents([]);
      }
    } catch (err) {
      console.error('Error loading activity settings:', err);
      // If error, show selector to let user choose
      setSelectedMaxMarks(null);
      setShowMaxMarksSelector(true);
      setStudents([]);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchCianns = async (departmentId, courseId) => {
    setLoadingCianns(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(config.cianns, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CIANN list');
      }

      const result = await response.json();
      const selectedCourseObj = classes.find((course) => course._id === courseId);
      const selectedCourseCode = selectedCourseObj?.courseCode;

      const filtered = (result || []).filter((ciann) => {
        const ciannDepartmentId = ciann?.department?._id || ciann?.department;
        const ciannCourseId = ciann?.courseId?._id || ciann?.courseId;
        const ciannCourseCode = ciann?.courseCode || ciann?.class;

        const deptMatches = ciannDepartmentId?.toString() === departmentId?.toString();
        const courseMatches =
          ciannCourseId?.toString() === courseId?.toString() ||
          (selectedCourseCode && ciannCourseCode?.toString() === selectedCourseCode?.toString());

        return deptMatches && courseMatches;
      });

      setCianns(filtered);
      setSelectedCiannId('');
    } catch (err) {
      console.error('Error fetching CIANN list:', err);
      setCianns([]);
      setSelectedCiannId('');
      setError('Error fetching CIANN list. Please try again.');
    } finally {
      setLoadingCianns(false);
    }
  };

  // Step 1: Activity Selection
  const handleActivitySelect = (activityId) => {
    setSelectedActivity(selectedActivity === activityId ? null : activityId);
    setError('');
  };

  // Step 2: Max Marks Selection
  const handleMaxMarksSelect = async (maxMarks) => {
    setSelectedMaxMarks(maxMarks);
    // Note: Max marks are saved to DB automatically when first mark is saved
    // This API call just reads the last saved maxMarks for this activity
    setShowMaxMarksSelector(false);
  };

  // Edit max marks (show selector again)
  const handleEditMaxMarks = () => {
    setShowMaxMarksSelector(true);
  };

  const fetchStudents = async (maxMarks) => {
    setLoadingStudents(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const college = localStorage.getItem('college');

      const response = await fetch(
        `/api/pt-microproject/students?institution=${college}&departmentId=${selectedDepartment}&courseId=${selectedClass}${selectedCiann?.divisionId ? `&divisionId=${selectedCiann.divisionId}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setStudents(result.data || []);
      } else {
        setError('Failed to fetch students');
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error fetching students. Please try again.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSavedMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const college = localStorage.getItem('college');

      const params = new URLSearchParams();
      if (college) params.append('institution', college);
      if (selectedCiannId) params.append('ciannId', selectedCiannId);
      if (selectedClass) params.append('courseId', selectedClass);

      const response = await fetch(
        `/api/pt-microproject/activity/${selectedActivity}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const nextMap = {};

        result.data.forEach((item) => {
          const studentKey = item?.studentId?._id || item?.studentId;
          if (
            studentKey !== undefined &&
            item?.marks !== undefined
          ) {
            nextMap[studentKey] = item.marks;
          }
        });

        setSavedMarksMap(nextMap);
      }
    } catch (err) {
      console.error('Error fetching saved marks:', err);
    }
  };

  const handleSaveMarks = async (marksData) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/pt-microproject/save-marks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(marksData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save marks');
      }

      // Show success message
      setSuccessMessage(`✓ Marks saved for ${marksData.studentName}!`);
      setTimeout(() => setSuccessMessage(''), 2000);
      setSavedMarksMap((prev) => ({
        ...prev,
        [marksData.studentId]: marksData.marks
      }));
      setMarksRefreshToken((prev) => prev + 1);

      return result;
    } catch (err) {
      setError(err.message || 'Error saving marks');
      throw err;
    }
  };

  const handleBackToActivity = () => {
    setSelectedActivity(null);
    setSelectedMaxMarks(null);
    setShowMaxMarksSelector(false);
    setSelectedDepartment('');
    setSelectedClass('');
    setCianns([]);
    setSelectedCiannId('');
    setClasses([]);
    setStudents([]);
  };

  const selectedCiann = cianns.find(
    (item) => String(item.ciannId) === String(selectedCiannId),
  );
  const selectedSubjectName =
    selectedCiann?.subject?.name || selectedCiann?.subject?.subjectName || 'Unknown Subject';
  const selectedSubjectId = selectedCiann?.subject?._id || selectedCiann?.subjectId || '';

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h4 className="mb-0">
                <i className="bi bi-diagram-3 me-2"></i>
                PT Microproject - Marks Entry
              </h4>
            </div>
            <div className="card-body">
              <p className="mb-0 text-muted">
                <strong>Step 1:</strong> Select activity type |
                <strong> Step 2:</strong> Select department, class, and CIANN |
                <strong> Step 3:</strong> Select marks (out of) |
                <strong> Step 4:</strong> Enter student marks
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
                onClick={() => setError('')}
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
                onClick={() => setSuccessMessage('')}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Activity Selection */}
      {!selectedActivity && (
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">
              <i className="bi bi-1-circle me-2"></i>
              Step 1: Select Activity Type
            </h5>
            <div className="row g-3">
              {activities.map(activity => (
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
      {selectedActivity && (
        <div className="row mb-4">
          <div className="col-lg-8 offset-lg-2">
            <div className="card">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-2-circle me-2"></i>
                  Step 2: Select Department, Class, and CIANN
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
                          {department.code ? `${department.code} - ` : ''}{department.name}
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
                          Sem {course.semester} - {course.courseCode} ({course.scheme})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">CIANN (Subject Context)</label>
                    <select
                      className="form-select"
                      value={selectedCiannId}
                      onChange={(e) => setSelectedCiannId(e.target.value)}
                      disabled={!selectedDepartment || !selectedClass || loadingCianns}
                    >
                      <option value="">-- Select CIANN --</option>
                      {cianns.map((ciann) => (
                        <option key={ciann._id} value={ciann.ciannId}>
                          CIANN-{ciann.ciannId} | {ciann.subject?.name || ciann.subject?.subjectName || 'Unknown Subject'}
                        </option>
                      ))}
                    </select>
                    {selectedCiann && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-journal-bookmark me-2"></i>
                        <strong>Selected Subject:</strong> {selectedSubjectName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Max Marks Selection or Display */}
      {selectedActivity && (
        <div className="row mb-4">
          <div className="col-lg-8 offset-lg-2">
            <div className="d-flex align-items-center gap-2 mb-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleBackToActivity}
              >
                <i className="bi bi-chevron-left me-1"></i>
                Back
              </button>
              <h5 className="mb-0">
                <i className="bi bi-3-circle me-2"></i>
                {showMaxMarksSelector ? 'Select Maximum Marks (Out Of)' : `Maximum Marks: ${selectedMaxMarks}`}
              </h5>
              {loadingSettings && (
                <div className="spinner-border spinner-border-sm text-warning ms-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
            </div>

            {/* Show selector if first time or editing */}
            {showMaxMarksSelector ? (
              !selectedDepartment || !selectedClass || !selectedCiannId ? (
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Please select department, class, and CIANN first.
                </div>
              ) : (
              <MaxMarksSelector
                selectedMaxMarks={selectedMaxMarks}
                onSelect={handleMaxMarksSelect}
              />
              )
            ) : (
              // Show summary card once selected
              <div className="card mb-4">
                <div className="card-body text-center py-4">
                  <div className="mb-3">
                    <div style={{ fontSize: '3rem', color: '#ffc107', fontWeight: 'bold' }}>
                      {selectedMaxMarks}
                    </div>
                    <p className="text-muted mb-0">Out of {selectedMaxMarks} marks</p>
                  </div>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={handleEditMaxMarks}
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit Marks
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Student Marks Entry */}
      {selectedActivity && selectedDepartment && selectedClass && selectedCiannId && selectedMaxMarks && !showMaxMarksSelector && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center gap-2 mb-3">
              <h5 className="mb-0">
                <i className="bi bi-4-circle me-2"></i>
                Step 4: Enter Student Marks
              </h5>
              <span className="badge bg-info ms-2">
                {selectedActivity} - Out Of {selectedMaxMarks}
              </span>
              <span className="badge bg-secondary ms-2">
                Subject: {selectedSubjectName}
              </span>
            </div>
            <StudentMarksGrid
              students={students}
              maxMarks={selectedMaxMarks}
              activityType={selectedActivity}
              loading={loadingStudents}
              onSaveMarks={(marksData) =>
                handleSaveMarks({
                  ...marksData,
                  ciannId: Number(selectedCiannId),
                  subjectId: selectedSubjectId,
                  subjectName: selectedSubjectName,
                  divisionId: selectedCiann?.divisionId || marksData.divisionId,
                })
              }
              courseId={selectedClass}
              submission={savedMarksMap}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Microproject;
