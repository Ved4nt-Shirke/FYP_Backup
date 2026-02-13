import React, { useState, useEffect } from "react";
import Header from "../basic/Header";
import Sidebar from "../basic/Sidebar";
import EditCiann from "./EditCiann.jsx";
import { config } from "../config/api";
import "./CreateCiann.css";

const CreateCiann = ({
  onBack: propOnBack,
  onCiannCreated,
  ciannData,
  isEditMode,
}) => {
  const [formData, setFormData] = useState({
    department: "",
    division: "",
    class: "",
    academicYear: "",
    subject: "",
    semester: "",
  });

  const [ciannList, setCiannList] = useState([]);
  const [showEditCiann, setShowEditCiann] = useState(false);

  // Sidebar state for mobile/desktop
  const [isSidebarVisible, setIsSidebarVisible] = useState(
    window.innerWidth >= 769
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

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
    if (isEditMode && ciannData) {
      setFormData({
        department: ciannData.department.value || "",
        division: ciannData.division || "",
        class: ciannData.class || "",
        academicYear: ciannData.academicYear || "",
        subject: ciannData.subject.code || "",
        semester: ciannData.semester || "",
      });
      setCiannList((prevList) => [...prevList, ciannData]);
      setShowEditCiann(true);
    }
  }, [ciannData, isEditMode]);

  const departments = [
    { value: "computer-engineering", label: "Computer Engineering" },
    {
      value: "electronics-telecommunication",
      label: "Electronics and Telecommunication",
    },
    { value: "information-technology", label: "Information Technology" },
  ];

  const divisions = [
    { value: "A", label: "Division A" },
    { value: "B", label: "Division B" },
    { value: "C", label: "Division C" },
  ];

  const semesters = [
    { value: "1", label: "Semester 1", type: "odd" },
    { value: "2", label: "Semester 2", type: "even" },
    { value: "3", label: "Semester 3", type: "odd" },
    { value: "4", label: "Semester 4", type: "even" },
    { value: "5", label: "Semester 5", type: "odd" },
    { value: "6", label: "Semester 6", type: "even" },
  ];

  const academicYears = [
    { value: "2023-24", label: "2023-24" },
    { value: "2024-25", label: "2024-25" },
    { value: "2025-26", label: "2025-26" },
  ];

  const subjectData = {
    "computer-engineering": {
      1: [
        { code: "22101", name: "Applied Mathematics" },
        { code: "22102", name: "Applied Physics" },
        { code: "22103", name: "Applied Chemistry" },
        { code: "22104", name: "Engineering Drawing" },
        { code: "22105", name: "English" },
      ],
      2: [
        { code: "22201", name: "Applied Mathematics" },
        { code: "22202", name: "Applied Physics" },
        { code: "22203", name: "Applied Chemistry" },
        { code: "22204", name: "Engineering Drawing" },
        { code: "22205", name: "Communication Skills" },
      ],
      3: [
        { code: "22301", name: "Object Oriented Programming using C++" },
        { code: "22302", name: "Data Structure using C" },
        { code: "22303", name: "Computer Graphics" },
        { code: "22304", name: "Digital Techniques" },
        { code: "22305", name: "Computer Organization" },
      ],
      4: [
        { code: "22401", name: "Java Programming" },
        { code: "22402", name: "Software Engineering" },
        { code: "22403", name: "Database Management System" },
        { code: "22404", name: "Operating System" },
        { code: "22405", name: "Microprocessor" },
      ],
      5: [
        { code: "22501", name: "Advanced Java Programming" },
        { code: "22502", name: "Software Testing" },
        { code: "22503", name: "Web Programming" },
        { code: "22504", name: "Computer Networks" },
        { code: "22505", name: "Environmental Studies" },
      ],
      6: [
        { code: "22601", name: "Mobile Application Development" },
        { code: "22602", name: "Artificial Intelligence" },
        { code: "22603", name: "Project Work" },
        { code: "22604", name: "Industrial Training" },
        { code: "22605", name: "Entrepreneurship" },
      ],
    },
    "electronics-telecommunication": {
      1: [
        { code: "22101", name: "Applied Mathematics" },
        { code: "22102", name: "Applied Physics" },
        { code: "22103", name: "Applied Chemistry" },
        { code: "22104", name: "Engineering Drawing" },
        { code: "22105", name: "English" },
      ],
      2: [
        { code: "22201", name: "Applied Mathematics" },
        { code: "22202", name: "Applied Physics" },
        { code: "22203", name: "Applied Chemistry" },
        { code: "22204", name: "Engineering Drawing" },
        { code: "22205", name: "Communication Skills" },
      ],
      3: [
        { code: "22311", name: "Electronic Devices and Circuits" },
        { code: "22312", name: "Network Theory" },
        { code: "22313", name: "Digital Electronics" },
        { code: "22314", name: "Electronic Instruments" },
        { code: "22315", name: "Computer Programming" },
      ],
      4: [
        { code: "22411", name: "Linear Integrated Circuits" },
        { code: "22412", name: "Communication Systems" },
        { code: "22413", name: "Microprocessor and Applications" },
        { code: "22414", name: "Power Electronics" },
        { code: "22415", name: "Control Systems" },
      ],
      5: [
        { code: "22511", name: "Mobile Communication" },
        { code: "22512", name: "Optical Communication" },
        { code: "22513", name: "Embedded Systems" },
        { code: "22514", name: "Television Engineering" },
        { code: "22515", name: "Environmental Studies" },
      ],
      6: [
        { code: "22610", name: "Artificial Intelligence" },
        { code: "22611", name: "Satellite Communication" },
        { code: "22612", name: "Wireless Communication" },
        { code: "22613", name: "Project Work" },
        { code: "22614", name: "Industrial Training" },
        { code: "22615", name: "Entrepreneurship" },
      ],
    },
    "information-technology": {
      1: [
        { code: "22101", name: "Applied Mathematics" },
        { code: "22102", name: "Applied Physics" },
        { code: "22103", name: "Applied Chemistry" },
        { code: "22104", name: "Engineering Drawing" },
        { code: "22105", name: "English" },
      ],
      2: [
        { code: "22201", name: "Applied Mathematics" },
        { code: "22202", name: "Applied Physics" },
        { code: "22203", name: "Applied Chemistry" },
        { code: "22204", name: "Engineering Drawing" },
        { code: "22205", name: "Communication Skills" },
      ],
      3: [
        { code: "22321", name: "Programming in C" },
        { code: "22322", name: "Digital Electronics" },
        { code: "22323", name: "Computer Organization" },
        { code: "22324", name: "Data Communication" },
        { code: "22325", name: "Web Page Designing" },
      ],
      4: [
        { code: "22421", name: "Object Oriented Programming using Java" },
        { code: "22422", name: "Data Structures" },
        { code: "22423", name: "Computer Networks" },
        { code: "22424", name: "Database Management Systems" },
        { code: "22425", name: "Operating Systems" },
      ],
      5: [
        { code: "22521", name: "Advanced Java" },
        { code: "22522", name: "Software Engineering" },
        { code: "22523", name: "Internet Programming" },
        { code: "22524", name: "Management" },
        { code: "22525", name: "Environmental Studies" },
      ],
      6: [
        { code: "22621", name: "Mobile Applications" },
        { code: "22622", name: "Emerging Technologies" },
        { code: "22623", name: "Project Work" },
        { code: "22624", name: "Industrial Training" },
        { code: "22625", name: "Entrepreneurship" },
      ],
    },
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "department" && { subject: "" }),
      ...(field === "semester" && { subject: "" }),
    }));
  };

  const getAvailableSubjects = () => {
    if (!formData.department || !formData.semester) return [];
    return subjectData[formData.department]?.[formData.semester] || [];
  };

  const getSemesterType = () => {
    const sem = semesters.find((s) => s.value === formData.semester);
    return sem ? sem.type : "";
  };

  const handleSubmit = async () => {
    if (
      !formData.department ||
      !formData.division ||
      !formData.semester ||
      !formData.academicYear ||
      !formData.subject
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedSubject = getAvailableSubjects().find(
      (s) => s.code === formData.subject
    );
    const selectedDept = departments.find(
      (d) => d.value === formData.department
    );

    const newCiannData = {
      department: selectedDept,
      division: formData.division,
      class: formData.class,
      semester: formData.semester,
      semesterType: getSemesterType(),
      academicYear: formData.academicYear,
      subject: selectedSubject,
      // createdAt is handled by backend timestamps; avoid sending locale string that fails Date cast
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
        department: "",
        division: "",
        class: "",
        academicYear: "",
        subject: "",
        semester: "",
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
      department: selectedCiann.department.value,
      division: selectedCiann.division,
      class: selectedCiann.class,
      academicYear: selectedCiann.academicYear,
      subject: selectedCiann.subject.code,
      semester: selectedCiann.semester,
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
        <div className="form-grid">
          <div className="form-group">
            <label>Select Department</label>
            <select
              value={formData.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
            >
              <option value="">--- Select Department ---</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Select Division</label>
            <select
              value={formData.division}
              onChange={(e) => handleInputChange("division", e.target.value)}
            >
              <option value="">--- Select Division ---</option>
              {divisions.map((div) => (
                <option key={div.value} value={div.value}>
                  {div.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Select Class</label>
            <select
              value={formData.class}
              onChange={(e) => handleInputChange("class", e.target.value)}
            >
              <option value="">--- Select Class ---</option>
              <option value="FY">First Year</option>
              <option value="SY">Second Year</option>
              <option value="TY">Third Year</option>
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
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
            >
              <option value="">--- Select Subject & Subject Code ---</option>
              {getAvailableSubjects().map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => handleInputChange("semester", e.target.value)}
            >
              <option value="">--- Select Semester ---</option>
              {semesters.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label} ({sem.type})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-submit">
          <button className="btn-submit" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCiann;
