import React, { useState, useEffect } from "react";
import Header from "../../basic/Header.jsx";
import Sidebar from "../../basic/Sidebar.jsx";
import EditCiann from "./EditCiann.jsx";
import { config } from "../../config/api.js";
import "./CreateCiann.css";

const CreateCiann = ({
  onBack: propOnBack,
  onCiannCreated,
  ciannData,
  isEditMode,
}) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    courseId: "",
    divisionId: "",
    subjectId: "",
    academicYear: "",
  });

  const [ciannList, setCiannList] = useState([]);
  const [showEditCiann, setShowEditCiann] = useState(false);

  // Sidebar state for mobile/desktop
  const [isSidebarVisible, setIsSidebarVisible] = useState(
    window.innerWidth >= 769,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  // Catalog data (fetched from admin)
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(true);
      }
    };
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMenuToggle = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (isEditMode && ciannData) {
      setFormData({
        departmentId: ciannData.departmentId || "",
        courseId: ciannData.courseId || "",
        divisionId: ciannData.divisionId || "",
        subjectId: ciannData.subjectId || "",
        academicYear: ciannData.academicYear || "",
      });
      setCiannList((prevList) => [...prevList, ciannData]);
      setShowEditCiann(true);
    }
  }, [ciannData, isEditMode]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const res = await fetch(config.catalog.departments, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch departments");
      }

      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.catalog.courses(departmentId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async (courseId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.catalog.divisions(courseId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch divisions");
      }

      const data = await res.json();
      setDivisions(data.divisions || []);
    } catch (err) {
      console.error("Error fetching divisions:", err);
      setError("Failed to load divisions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (departmentId, courseId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (departmentId) params.append("departmentId", departmentId);
      if (courseId) params.append("courseId", courseId);

      const url = `${config.catalog.subjects}?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch subjects");
      }

      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const academicYears = [
    { value: "2023-24", label: "2023-24" },
    { value: "2024-25", label: "2024-25" },
    { value: "2025-26", label: "2025-26" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "departmentId") {
      setFormData((prev) => ({
        ...prev,
        courseId: "",
        divisionId: "",
        subjectId: "",
      }));
      setCourses([]);
      setDivisions([]);
      setSubjects([]);
      if (value) {
        fetchCourses(value);
        fetchSubjects(value, "");
      }
    }

    if (field === "courseId") {
      setFormData((prev) => ({
        ...prev,
        divisionId: "",
        subjectId: "",
      }));
      setDivisions([]);
      if (value) {
        fetchDivisions(value);
        if (formData.departmentId) {
          fetchSubjects(formData.departmentId, value);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.departmentId ||
      !formData.courseId ||
      !formData.divisionId ||
      !formData.subjectId ||
      !formData.academicYear
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedDept = departments.find(
      (d) => d._id === formData.departmentId,
    );
    const selectedCourse = courses.find((c) => c._id === formData.courseId);
    const selectedDivision = divisions.find(
      (d) => d._id === formData.divisionId,
    );
    const selectedSubject = subjects.find((s) => s._id === formData.subjectId);

    const newCiannData = {
      department: {
        _id: selectedDept._id,
        name: selectedDept.name,
        code: selectedDept.code,
      },
      division: selectedDivision.name,
      class: `Sem ${selectedCourse.semester}`,
      semester: selectedCourse.semester.toString(),
      semesterType: selectedCourse.semester % 2 === 0 ? "even" : "odd",
      academicYear: formData.academicYear,
      subject: {
        _id: selectedSubject._id,
        name: selectedSubject.name,
        code: selectedSubject.code,
      },
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch(config.cianns, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCiannData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save CIAAN");
      }

      const savedCiann = await response.json();
      setCiannList((prevList) => [...prevList, savedCiann]);
      setFormData({
        departmentId: "",
        courseId: "",
        divisionId: "",
        subjectId: "",
        academicYear: "",
      });

      if (onCiannCreated) {
        onCiannCreated(savedCiann);
      }
      setShowEditCiann(true);
    } catch (err) {
      alert("Failed to save CIAAN: " + err.message);
    }
  };

  const handleEdit = (index) => {
    const selectedCiann = ciannList[index];
    setFormData({
      departmentId: selectedCiann.department._id,
      courseId: selectedCiann.courseId,
      divisionId: selectedCiann.divisionId,
      subjectId: selectedCiann.subject._id,
      academicYear: selectedCiann.academicYear,
    });
    setShowEditCiann(false);
  };

  const handleBack = (index) => {
    if (index === -1) {
      setShowEditCiann(false);
    } else {
      setShowEditCiann(false);
    }
  };

  if (showEditCiann) {
    return (
      <div className="create-ciann-page">
        <Header showSearch={false} onMenuToggle={handleMenuToggle} />
        <Sidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
          ciannData={ciannData}
        />
        <EditCiann
          ciannDataList={ciannList}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </div>
    );
  }

  return (
    <div className="create-ciann-page">
      <Header showSearch={false} onMenuToggle={handleMenuToggle} />
      <Sidebar
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
        ciannData={ciannData}
      />
      <div className="create-ciann-header">
        <h2>Create CIAAN (Curriculum Implementation & Assessment Norms)</h2>
      </div>
      <div className="create-ciann-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label>Select Department</label>
            <select
              value={formData.departmentId}
              onChange={(e) =>
                handleInputChange("departmentId", e.target.value)
              }
              disabled={loading}
            >
              <option value="">--- Select Department ---</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Course</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleInputChange("courseId", e.target.value)}
              disabled={!formData.departmentId || loading}
            >
              <option value="">--- Select Course ---</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  Semester {course.semester} - {course.courseCode} (
                  {course.scheme})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Division</label>
            <select
              value={formData.divisionId}
              onChange={(e) => handleInputChange("divisionId", e.target.value)}
              disabled={!formData.courseId || loading}
            >
              <option value="">--- Select Division ---</option>
              {divisions.map((div) => (
                <option key={div._id} value={div._id}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Academic Year</label>
            <select
              value={formData.academicYear}
              onChange={(e) =>
                handleInputChange("academicYear", e.target.value)
              }
            >
              <option value="">--- Select Academic Year ---</option>
              {academicYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Subject & Subject Code</label>
            <select
              value={formData.subjectId}
              onChange={(e) => handleInputChange("subjectId", e.target.value)}
              disabled={!formData.departmentId || loading}
            >
              <option value="">--- Select Subject & Subject Code ---</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-submit">
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCiann;
