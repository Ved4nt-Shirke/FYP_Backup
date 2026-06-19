import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Layout & Basic Components
import Header from "./basic/Header";
import Sidebar from "./basic/Sidebar";
import Login from "./faculty/components/Login";
import Dashboard from "./faculty/components/Dashboard";
import Profile from "./basic/Profile";

// Student Components
import StudentLayout from "./student/StudentLayout";
import StudentDashboard from "./student/StudentDashboard";
import StudyMaterial from "./student/StudyMaterial";
import Results from "./student/Results";
import Notices from "./student/Notices";
import MockExamList from "./student/MockExamList";
import MockExamAttempt from "./student/MockExamAttempt";
import MockExamResult from "./student/MockExamResult";
import StudentPracticalExamList from "./student/StudentPracticalExamList";
import StudentPracticalExamUpload from "./student/StudentPracticalExamUpload";
import StudentTimetable from "./student/StudentTimetable";
import ChatPage from "./faculty/chat/ChatPage";

// CIANN / Edit CIANN Components
import CreateCiann from "./faculty/components/CreateCiann";
import EditCiann from "./faculty/components/EditCiann";
import CourseDiary from "./faculty/editCiann/CourseDiary";
import CourseDiary2 from "./faculty/editCiann/CourseDiary2";
import TimeTable from "./faculty/editCiann/Timetable";
import Syllabus from "./faculty/editCiann/Syllabus";
import LabPlanningSheet from "./faculty/editCiann/LabPlanningSheet";
import TeachingPlanSheet from "./faculty/editCiann/TeachingPlanSheet";
import TutorialPlanSheet from "./faculty/editCiann/TutorialPlanSheet";
import Studentlist from "./faculty/editCiann/studentlist";
import PrintCiann from "./faculty/editCiann/PrintCiann";

// Subject Details
import SubjectDetails from "./faculty/SubjectDetails/SubjectDetails";
import LectureSchedule from "./faculty/SubjectDetails/LectureSchedule";
import OfficeHours from "./faculty/SubjectDetails/OfficeHours";
import COsWithPOs from "./faculty/SubjectDetails/COsWithPOs";
import COsWithPSOs from "./faculty/SubjectDetails/COsWithPSOs";
import PastResult from "./faculty/SubjectDetails/PastResult";
import KnowledgeMap from "./faculty/SubjectDetails/KnowledgeMap";
import Objectives from "./faculty/SubjectDetails/Objectives";
import CourseOutcomes from "./faculty/SubjectDetails/CourseOutcomes";
import Recommendations from "./faculty/SubjectDetails/Recommendations";
import Resources from "./faculty/SubjectDetails/Resources";
import Rubric from "./faculty/SubjectDetails/Rubric";
import Tlo from "./faculty/SubjectDetails/Tlo";
import Llo from "./faculty/SubjectDetails/Llo";

// Attendance Components
import MarkAttendance from "./faculty/components/MarkAttendance";
import ViewAttendance from "./faculty/components/ViewAttendance";
import EditAttendance from "./faculty/components/EditAttendance";
import TheoryCiannCards from "./faculty/Attendance/TheoryAttend";
import SmartAttendanceHub from "./faculty/Attendance/SmartAttendanceHub";
import ExtraTheoryCiannCards from "./faculty/Attendance/EtheoryCard";
import ExtraPracticalCiannCards from "./faculty/Attendance/EpractCard";
import TutorialCiannCards from "./faculty/Attendance/tutCard";
import PracticalCiannCards from "./faculty/Attendance/PracticalCiannCards";
import PracticalAttendance from "./faculty/Attendance/PracticalAttendance";
import PracticalAttendanceForm from "./faculty/Attendance/PracticalAttendanceForm";
import PracticalFinalAtt from "./faculty/Attendance/PracticalFinalAtt";
import PracticalBatchDistribution from "./faculty/Attendance/PracticalBatchDistribution";
import TheoryEdit from "./faculty/Attendance/TheoryEdit";
import AttendanceForm from "./faculty/Attendance/Theory";
import FinalAttendance from "./faculty/Attendance/FinalAtt";
import ExtraTheory from "./faculty/Attendance/ExtraTheory";
import StudentExtraAttendance from "./faculty/Attendance/Extratattend";
import ExtraAttendanceForm from "./faculty/Attendance/ExtraPract";
import ExtraAttendance from "./faculty/Attendance/Tutorial";
import StudentAttendancePage from "./faculty/Attendance/Extrapattend";
import StudentAttendance from "./faculty/Attendance/Tutattend";

// Edit Attendance Routes
import EditAttendance1 from "./faculty/Attendance/edit/EditAttendance1";
import EditAttendance2 from "./faculty/Attendance/edit/EditAttendance2";
import EditIndividualAttendance from "./faculty/Attendance/edit/EditIndividualAttendance";
import EditExtraTheoryAttendance1 from "./faculty/Attendance/edit/EditExtraTheoryAttendance1";
import EditExtraTheoryAttendance2 from "./faculty/Attendance/edit/EditExtraTheoryAttendance2";
import EditIndividualExtraTheoryAttendance from "./faculty/Attendance/edit/EditIndividualExtraTheoryAttendance";
import EditPracticalAttendance1 from "./faculty/Attendance/edit/EditPracticalAttendance1";
import EditPracticalAttendance2 from "./faculty/Attendance/edit/EditPracticalAttendance2";
import EditIndividualPracticalAttendance from "./faculty/Attendance/edit/EditIndividualPracticalAttendance";
import EditTutorialAttendance1 from "./faculty/Attendance/edit/EditTutorialAttendance1";
import EditTutorialAttendance2 from "./faculty/Attendance/edit/EditTutorialAttendance2";
import EditIndividualTutorialAttendance from "./faculty/Attendance/edit/EditIndividualTutorialAttendance";
import EditExistingPracticalAttendance from "./faculty/Attendance/edit/EditExistingPracticalAttendance";
import EditExtraPracticalAttendance1 from "./faculty/Attendance/edit/EditExtraPracticalAttendance1";
import EditExtraPracticalAttendance2 from "./faculty/Attendance/edit/EditExtraPracticalAttendance2";
import EditIndividualExtraPracticalAttendance from "./faculty/Attendance/edit/EditIndividualExtraPracticalAttendance";

// View Attendance Routes
import ViewAttend1 from "./faculty/Attendance/view/ViewAttend1";
import ViewAttend2 from "./faculty/Attendance/view/ViewAttend2";
import ViewPractical1 from "./faculty/Attendance/view/ViewPractical1";
import ViewPractical2 from "./faculty/Attendance/view/ViewPractical2";
import ViewPractical3 from "./faculty/Attendance/view/ViewPractical3";
import ViewExtraPractical1 from "./faculty/Attendance/view/ViewExtraPractical1";
import ViewExtraPractical2 from "./faculty/Attendance/view/ViewExtraPractical2";
import ViewExtraPractical3 from "./faculty/Attendance/view/ViewExtraPractical3";
import ViewExtraTheory1 from "./faculty/Attendance/view/ViewET1";
import ViewExtraTheory2 from "./faculty/Attendance/view/ViewET2";
import ViewT1 from "./faculty/Attendance/view/ViewTut";
import ViewT2 from "./faculty/Attendance/view/ViewTut2";

// Admin & Office Components
import AdminPanel from "./admin/AdminPanel";
import AdminDashboard from "./admin/AdminDashboard";
import AdminSidebar from "./admin/AdminSidebar";
import AdminHeader from "./admin/AdminHeader";
import DepartmentList from "./admin/DepartmentList";
import DepartmentForm from "./admin/DepartmentForm";
import DepartmentManagement from "./admin/DepartmentManagement";
import DepartmentCourses from "./admin/departments/DepartmentCourses";
import DepartmentPracticalExams from "./admin/DepartmentPracticalExams";
import FacultyList from "./admin/FacultyList";
import FacultyForm from "./admin/FacultyForm";
import CreateFaculty from "./admin/CreateFaculty";
import OfficeStaffList from "./admin/OfficeStaffList";
import OfficeStaffForm from "./admin/OfficeStaffForm";
import CreateOfficeStaff from "./admin/CreateOfficeStaff";
import SubjectManagement from "./admin/subjects/SubjectManagement";
import SubjectsView from "./admin/subjects/SubjectsView";
import CourseDetailsView from "./admin/subjects/CourseDetailsView";
import VisionMissionManager from "./admin/VisionMissionManager";
import ManageRooms from "./admin/ManageRooms";
import StudentPromotions from "./admin/StudentPromotions";

import OfficeDashboard from "./office/OfficeDashboard";
import OfficeSidebar from "./office/OfficeSidebar";

// Assessment Components
import SummaryCards from "./faculty/components/SummaryCards";
import AttendanceSummaryCards from "./faculty/components/AttendanceSummaryCards";
import SummaryPage from "./faculty/components/SummaryPage";
import AssismentCiaanCards from "./faculty/Assessment/assess/assismentCiaan";
import AssessBatchSelect from "./faculty/Assessment/assess/assessBatchselect";
import AssessPA from "./faculty/Assessment/assess/AssessPA";
import AssessPA2 from "./faculty/Assessment/assess/AssessPA2";
import AssessPA3 from "./faculty/Assessment/assess/AssessPA3";
import AssessPAStudentlist from "./faculty/Assessment/assess/AssessPAStudentlist";
import AssessmentStudentSelectForm from "./faculty/Assessment/assess/AssessmentStudentSelectForm";
import AssessmentDashboard from "./faculty/Assessment/AssessmentDashboard";
import ProgressiveAssessment from "./faculty/Assessment/ProgressiveAssessment";
import ExperimentAttendance from "./faculty/Assessment/ExperimentAttendance";
import EditAssess from "./faculty/Assessment/EditAssess";
import EditProgAssess from "./faculty/Assessment/EditProgAssess";
import EditBatchSelect from "./faculty/Assessment/edit/EditBatchSelect";
import EditCard from "./faculty/Assessment/edit/EditCard";
import EditAssessedStudentList from "./faculty/Assessment/edit/EditAssessedStudentList";
import EditAssessmentOverview from "./faculty/Assessment/edit/EditAssessmentOverview";
import ViewAssessmentCard from "./faculty/Assessment/view/ViewAssessmentCard";
import ViewAssessmentBatchSelect from "./faculty/Assessment/view/ViewAssessmentBatchSelect";
import ViewAssessmentOverview from "./faculty/Assessment/view/ViewAssessmentOverview";
import ViewAssessedStudentList from "./faculty/Assessment/view/ViewAssessedStudentList";
import ViewPA1 from "./faculty/Assessment/view/ViewPA1";
import ViewPA2 from "./faculty/Assessment/view/ViewPA2";
import ViewPA3 from "./faculty/Assessment/view/ViewPA3";

// Practical Exam Components
import PracticalExamSection from "./faculty/PracticalExam/PracticalExamSection";
import PracticalExamDashboard from "./faculty/PracticalExam/PracticalExamDashboard";
import AddPractical from "./faculty/PracticalExam/AddPractical";
import ManagePractical from "./faculty/PracticalExam/ManagePractical";
import EnableDisablePractical from "./faculty/PracticalExam/EnableDisablePractical";
import ManagePracticalQuestions from "./faculty/PracticalExam/ManagePracticalQuestions";
import ViewStudentResponses from "./faculty/PracticalExam/ViewStudentResponses";
import EditPractical from "./faculty/PracticalExam/EditPractical";
import PublicPracticalExam from "./faculty/PracticalExam/PublicPracticalExam";

// MSBTE Formats Pages
import FAPRK3CiannCards from "./pages/msbte/FAPRK3CiannCards";
import FAPRK3Generate from "./pages/msbte/FAPRK3Generate";
import FAPRK3Print from "./pages/msbte/FAPRK3Print";
import SAPRK4CiannCards from "./pages/msbte/SAPRK4CiannCards";
import SAPRK4Generate from "./pages/msbte/SAPRK4Generate";
import SAPRK4Edit from "./pages/msbte/SAPRK4Edit";
import SAPRK4Print from "./pages/msbte/SAPRK4Print";
import FATHK5CiannCards from "./pages/msbte/FATHK5CiannCards";
import FATHK5Print from "./pages/msbte/FATHK5Print";
import AttendanceReport from "./pages/msbte/AttendanceReport";
import SATHCiannCards from "./pages/msbte/SATHCiannCards";
import SATHGenerate from "./pages/msbte/SATHGenerate";
import SATHEdit from "./pages/msbte/SATHEdit";
import SATHPrint from "./pages/msbte/SATHPrint";
import IndustrialVisitK8 from "./pages/msbte/IndustrialVisitK8";
import IndustrialVisitK8Generate from "./pages/msbte/IndustrialVisitK8Generate";
import IndustrialVisitK8Edit from "./pages/msbte/IndustrialVisitK8Edit";
import IndustrialVisitK8Print from "./pages/msbte/IndustrialVisitK8Print";
import ExpertLectureK9 from "./pages/msbte/ExpertLectureK9";
import ExpertLectureK9Generate from "./pages/msbte/ExpertLectureK9Generate";
import ExpertLectureK9Edit from "./pages/msbte/ExpertLectureK9Edit";
import ExpertLectureK9Print from "./pages/msbte/ExpertLectureK9Print";
import TermAnalysisK7 from "./pages/msbte/TermAnalysisK7";
import TermAnalysisK7Print from "./pages/msbte/TermAnalysisK7Print";
import K7CiannSelection from "./pages/msbte/K7CiannSelection";
import K7Generate from "./pages/msbte/K7Generate";
import K7Print from "./pages/msbte/K7Print";
import K7Placeholder from "./pages/msbte/K7Placeholder";
import K7ReportSelector from "./pages/msbte/K7ReportSelector";
import StudentTimetableManager from "./pages/faculty/StudentTimetableManager";
import FacultyStudyMaterialManager from "./pages/faculty/FacultyStudyMaterialManager";
import MockExamDashboard from "./pages/faculty/MockExamDashboard";
import MockExamForm from "./pages/faculty/MockExamForm";
import MockExamManage from "./pages/faculty/MockExamManage";
import MockExamResults from "./pages/faculty/MockExamResults";

// CT / PT / Course Components
import CTCiannCards from "./faculty/CT/CTCiannCards";
import CTDashboard from "./faculty/CT/CTDashboard";
import Course1 from "./faculty/Course/Course1";
import Course2 from "./faculty/Course/Course2";
import Course3 from "./faculty/Course/Course3";
import Course4 from "./faculty/Course/Course4";
import ManageChapters1 from "./faculty/Course/managechp1";
import ManageChapters2 from "./faculty/Course/managechp2";
import UpdateChapter from "./faculty/Course/managechp3";
import Microproject from "./faculty/PTMicroProject/Microproject";
import PTDashboard from "./faculty/PTMicroProject/PTDashboard";
import PTConfiguration from "./faculty/PTMicroProject/PTConfiguration";
import PTMarksEntry from "./faculty/PTMicroProject/PTMarksEntry";

// Defaulters
import Defaulter from "./faculty/components/defaulter";
import DefaulterCard from "./faculty/Assessment/studentDefaulter/DefaulterCard";
import StudentWiseSelect from "./faculty/Assessment/studentDefaulter/StudentWiseSelect";
import StudentWiseAssess from "./faculty/Assessment/studentDefaulter/StudentWiseAssess";
import StudentAssessSetup from "./faculty/Assessment/studentDefaulter/StudentAssessSetup";

// Super Admin
import SuperAdminDashboard from "./superadmin/SuperAdminDashboard";
import CreateInstitution from "./superadmin/CreateInstitution";
import ViewInstitutions from "./superadmin/ViewInstitutions";
import ManageInstitution from "./superadmin/ManageInstitution";
import SuperAdminNavbar from "./superadmin/SuperAdminNavbar";

import TestStudents from "./TestStudents";
import "./App.css";
import {
  applyPalette,
  loadAndApplyAdminTheme,
  loadAndApplyOfficeTheme,
  attachAdminThemeAutoRefresh,
} from "./utils/theme";

// Merged Theme Application Logic
const applyTheme = async (college, role) => {
  console.log("Applying theme for:", college, "Role:", role);
  const root = document.documentElement;
  const institutionPaletteRaw = localStorage.getItem("institutionPalette");
  const cachedPaletteRaw = localStorage.getItem(`palette:${college}`);

  const parsePalette = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const institutionPalette = parsePalette(institutionPaletteRaw);
  const cachedPalette = parsePalette(cachedPaletteRaw);

  if (institutionPalette) {
    applyPalette(institutionPalette);
  } else if (cachedPalette) {
    applyPalette(cachedPalette);
  }

  if (role === "admin") {
    await loadAndApplyAdminTheme(college);
    return;
  }

  if (role === "office") {
    await loadAndApplyOfficeTheme(college);
    return;
  }

  // For faculty/other roles, apply institution palette from backend
  // or use fallback to hardcoded theme
  if (!institutionPalette && !cachedPalette) {
    // Create a complete fallback theme palette and apply it
    const themeMap = {
      VSIT: { header: "#c62828", accent: "#ef4444", accentDark: "#b91c1c" },
      VIT: { header: "#1565c0", accent: "#3b82f6", accentDark: "#1d4ed8" },
      VP: { header: "#2e7d32", accent: "#10b981", accentDark: "#059669" },
    };

    const theme = themeMap[college] || themeMap.VP;

    // Create a palette object and apply it using the same applyPalette function
    // This ensures ALL CSS variables are set consistently
    const fallbackPalette = {
      name: `fallback-${college}`,
      colors: {
        primary: theme.header,
        primaryLight: theme.accent, // Use accent as light variant
        background: "#f9fafb",
        surface: "#ffffff",
        border: "#e5e7eb",
        text: "#111827",
        textMuted: "#6b7280",
        accent: theme.accent,
      },
    };

    applyPalette(fallbackPalette);
  }
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(
    window.innerWidth >= 769,
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentTab, setCurrentTab] = useState("upload");
  const userDropdownRef = useRef(null);

  const userRole = localStorage.getItem("role") || "faculty";
  const college = localStorage.getItem("college") || "VP";
  const isAdminDashboard =
    userRole === "admin" && location.pathname === "/admin-dashboard";
  const hasLeftSidebar = userRole !== "superadmin";

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || "faculty";
    const isLoginPage = location.pathname === "/login";
    const isPublicPage = [
      "view-attend2",
      "view-practical3",
      "view-extra-practical3",
      "view-extra-theory-attend2",
      "view-tutorial-attendance2",
      "summary-pages",
      "edit-ciann-print",
      "public/practical-exam",
    ].some((p) => location.pathname.includes(p));

    if (!token) {
      if (!isLoginPage && !isPublicPage) {
        navigate("/login");
      }
    } else {
      // If logged in and hitting login page, redirect to dashboard
      if (isLoginPage) {
        navigate("/dashboard");
        return;
      }

      const path = location.pathname;

      // Restrict superadmin routes to only superadmin role
      if (path.startsWith("/superadmin-") || path.startsWith("/superadmin/")) {
        if (role !== "superadmin") {
          navigate("/dashboard");
          return;
        }
      }

      // Restrict admin routes to only admin or superadmin role
      if (path.startsWith("/admin-") || path.startsWith("/admin/")) {
        if (role !== "admin" && role !== "superadmin") {
          navigate("/dashboard");
          return;
        }
      }

      // Restrict office routes to only office or superadmin role
      if (path.startsWith("/office-") || path.startsWith("/office/")) {
        if (role !== "office" && role !== "superadmin") {
          navigate("/dashboard");
          return;
        }
      }

      // Restrict faculty-only pages for students
      const isFacultyOrAdminPath = ![
        "/dashboard",
        "/study-material",
        "/messages",
        "/mock-exams",
        "/practical-exams",
        "/practical-exam-upload",
        "/timetable",
        "/results",
        "/notices",
        "/profile"
      ].some((p) => path === p || path.startsWith(p + "/")) && !isPublicPage;

      if (role === "student" && isFacultyOrAdminPath && path !== "/") {
        navigate("/dashboard");
        return;
      }
    }
  }, [location.pathname, navigate]);

  // Responsive Sidebar Toggle
  useEffect(() => {
    const handleResize = () => setIsSidebarVisible(window.innerWidth >= 769);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Allow secondary pages (e.g., CIANN flows) to toggle the main faculty sidebar
  useEffect(() => {
    const handleExternalMainSidebarToggle = () => {
      setIsSidebarVisible((prev) => !prev);
    };

    window.addEventListener(
      "faculty:toggle-main-sidebar",
      handleExternalMainSidebarToggle,
    );

    return () => {
      window.removeEventListener(
        "faculty:toggle-main-sidebar",
        handleExternalMainSidebarToggle,
      );
    };
  }, []);

  // Theme Application
  useEffect(() => {
    applyTheme(college, userRole);
    if (userRole !== "admin") return;

    const cleanup = attachAdminThemeAutoRefresh(college);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [college, userRole]);

  // Sync auth checks to prevent layout flash before redirect
  const token = localStorage.getItem("token");
  const isLoginPage = location.pathname === "/login";
  const isPublicPage = [
    "view-attend2",
    "view-practical3",
    "view-extra-practical3",
    "view-extra-theory-attend2",
    "view-tutorial-attendance2",
    "summary-pages",
    "edit-ciann-print",
    "public/practical-exam",
  ].some((p) => location.pathname.includes(p));

  if (!token && !isLoginPage && !isPublicPage) {
    return <Navigate to="/login" replace />;
  }

  if (token && isLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleMenuToggle = () => setIsSidebarVisible((prev) => !prev);

  const isSpecialPage =
    [
      "/login",
      "/view-attend2",
      "/view-practical3",
      "/view-extra-practical3",
      "/view-extra-theory-attend2",
      "/view-tutorial-attendance2",
      "/summary-pages",
      "/edit-ciann-print",
    ].includes(location.pathname) ||
    location.pathname.match(/^\/public\/practical-exam\/.*/);

  const showGlobalSecondaryToggle = [
    "/course-diary",
    "/course-diary2",
    "/timetable",
    "/syllabus",
    "/teaching-plan",
    "/laboratory-plan",
    "/tutorial-plan",
    "/student-list",
    "/subject-details",
  ].some((path) => location.pathname.startsWith(path));

  if (isSpecialPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/view-attend2" element={<ViewAttend2 />} />
        <Route path="/view-practical3" element={<ViewPractical3 />} />
        <Route
          path="/view-extra-practical3"
          element={<ViewExtraPractical3 />}
        />
        <Route
          path="/view-extra-theory-attend2"
          element={<ViewExtraTheory2 />}
        />
        <Route path="/view-tutorial-attendance2" element={<ViewT2 />} />
        <Route path="/summary-pages" element={<SummaryPage />} />
        <Route path="/edit-ciann-print" element={<PrintCiann />} />
        <Route
          path="/public/practical-exam/:publicLink"
          element={<PublicPracticalExam />}
        />
      </Routes>
    );
  }

  if (userRole === "student") {
    return (
      <div className="student-app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="study-material" element={<StudyMaterial />} />
            <Route path="messages" element={<ChatPage />} />
            <Route path="mock-exams" element={<MockExamList />} />
            <Route path="mock-exams/:examId/attempt" element={<MockExamAttempt />} />
            <Route path="mock-exams/result" element={<MockExamResult />} />
            <Route
              path="practical-exams"
              element={<StudentPracticalExamList />}
            />
            <Route
              path="practical-exam-upload/:examId"
              element={<StudentPracticalExamUpload />}
            />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="results" element={<Results />} />
            <Route path="notices" element={<Notices />} />
          </Route>
        </Routes>
      </div>
    );
  }

  return (
    <div
      className={`app-container ${hasLeftSidebar && isSidebarVisible ? "sidebar-visible" : "sidebar-collapsed"} ${userRole}-page ${isAdminDashboard ? "admin-dashboard-page" : ""}`}
    >
      {/* Sidebar logic */}
      {userRole === "superadmin" ? null : userRole === "admin" ? (
        <AdminSidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
        />
      ) : userRole === "office" ? (
        <OfficeSidebar
          isVisible={isSidebarVisible}
          setIsVisible={setIsSidebarVisible}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onLogout={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        />
      ) : (
        <Sidebar
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
        />
      )}

      {/* Header logic */}
      {userRole === "superadmin" ? (
        <SuperAdminNavbar />
      ) : userRole === "office" ? null : userRole === "admin" ? (
        <AdminHeader onMenuToggle={handleMenuToggle} />
      ) : userRole !== "admin" ? (
        <Header
          onMenuToggle={handleMenuToggle}
          onSecondaryMenuToggle={
            showGlobalSecondaryToggle
              ? () => {
                window.dispatchEvent(
                  new CustomEvent("faculty:toggle-secondary-sidebar"),
                );
              }
              : undefined
          }
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          userDropdownRef={userDropdownRef}
        />
      ) : null}

      <div className="main-content-wrapper">
        <div className="scrollable-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={
                userRole === "superadmin" ? (
                  <SuperAdminDashboard />
                ) : userRole === "admin" ? (
                  <AdminDashboard />
                ) : userRole === "office" ? (
                  <OfficeDashboard
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                  />
                ) : (
                  <Dashboard />
                )
              }
            />
            {/* General Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/create-ciann" element={<CreateCiann />} />
            <Route path="/edit-ciann" element={<EditCiann />} />
            <Route path="/course-diary" element={<CourseDiary />} />
            <Route path="/course-diary2" element={<CourseDiary2 />} />
            <Route path="/timetable" element={<TimeTable />} />
            <Route
              path="/faculty/student-timetable"
              element={<StudentTimetableManager />}
            />
            <Route
              path="/faculty/study-material"
              element={<FacultyStudyMaterialManager />}
            />
            <Route path="/faculty/mock-exams" element={<MockExamDashboard />} />
            <Route path="/faculty/mock-exams/create" element={<MockExamForm />} />
            <Route path="/faculty/mock-exams/edit/:examId" element={<MockExamForm />} />
            <Route path="/faculty/mock-exams/manage" element={<MockExamManage />} />
            <Route path="/faculty/mock-exams/results" element={<MockExamResults />} />
            <Route path="/messages" element={<ChatPage />} />
            <Route path="/syllabus" element={<Syllabus />} />
            <Route path="/laboratory-plan" element={<LabPlanningSheet />} />
            <Route path="/teaching-plan" element={<TeachingPlanSheet />} />
            <Route path="/tutorial-plan" element={<TutorialPlanSheet />} />
            <Route path="/student-list" element={<Studentlist />} />
            <Route path="/tlo" element={<Tlo />} />
            <Route path="/llo" element={<Llo />} />
            {/* Subject Details Sub-routes */}
            <Route path="/subject-details" element={<SubjectDetails />}>
              <Route path="lecture-schedule" element={<LectureSchedule />} />
              <Route path="office-hours" element={<OfficeHours />} />
              <Route path="map-cos-pos" element={<COsWithPOs />} />
              <Route path="cos-with-psos" element={<COsWithPSOs />} />
              <Route path="past-result" element={<PastResult />} />
              <Route path="knowledge-map" element={<KnowledgeMap />} />
              <Route path="objectives" element={<Objectives />} />
              <Route path="cos" element={<CourseOutcomes />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="resources" element={<Resources />} />
              <Route path="rubric" element={<Rubric />} />
              <Route index element={<Navigate to="lecture-schedule" />} />
            </Route>
            {/* Attendance Routes */}
            <Route path="/mark-attendance" element={<MarkAttendance />} />
            <Route path="/view-attendance" element={<ViewAttendance />} />
            <Route path="/edit-attendance" element={<EditAttendance />} />
            <Route path="/smart-attendance" element={<SmartAttendanceHub />} />
            <Route path="/theory-ciann-cards" element={<TheoryCiannCards />} />
            <Route
              path="/extra-theory-ciann-cards"
              element={<ExtraTheoryCiannCards />}
            />
            <Route
              path="/extra-practical-ciann-cards"
              element={<ExtraPracticalCiannCards />}
            />
            <Route
              path="/tutorial-ciann-cards"
              element={<TutorialCiannCards />}
            />
            <Route
              path="/practical-ciann-cards"
              element={<PracticalCiannCards />}
            />
            <Route
              path="/practical-attendance"
              element={<PracticalAttendance />}
            />
            <Route path="/PracticalFinalAtt" element={<PracticalFinalAtt />} />
            <Route
              path="/practical-batch-distribution"
              element={<PracticalBatchDistribution />}
            />
            <Route
              path="/prac-form/:ciannId/:weekNo/:batch/:exptNo"
              element={<PracticalAttendanceForm />}
            />
            <Route path="/theory-edit" element={<TheoryEdit />} />
            <Route path="/attendance-form" element={<AttendanceForm />} />
            <Route path="/final-attendance" element={<FinalAttendance />} />
            <Route path="/extra-theory" element={<ExtraTheory />} />
            <Route path="/extra-practical" element={<ExtraAttendanceForm />} />
            <Route path="/tutorial-attendance" element={<ExtraAttendance />} />
            <Route
              path="/student-extra-attendance/:id"
              element={<StudentExtraAttendance />}
            />
            <Route
              path="/student-attendance-page"
              element={<StudentAttendancePage />}
            />
            <Route path="/extrapattend" element={<StudentAttendancePage />} />
            <Route path="/student-attendance" element={<StudentAttendance />} />
            {/* Edit Attendance */}
            <Route path="/edit-attendance1" element={<EditAttendance1 />} />
            <Route path="/edit-attendance2" element={<EditAttendance2 />} />
            <Route
              path="/edit-individual-attendance"
              element={<EditIndividualAttendance />}
            />
            <Route
              path="/edit-extra-theory-attendance1"
              element={<EditExtraTheoryAttendance1 />}
            />
            <Route
              path="/edit-extra-theory-attendance2"
              element={<EditExtraTheoryAttendance2 />}
            />
            <Route
              path="/edit-individual-extra-theory-attendance"
              element={<EditIndividualExtraTheoryAttendance />}
            />
            <Route
              path="/edit-practical-attendance1"
              element={<EditPracticalAttendance1 />}
            />
            <Route
              path="/edit-practical-attendance2"
              element={<EditPracticalAttendance2 />}
            />
            <Route
              path="/edit-individual-practical-attendance"
              element={<EditIndividualPracticalAttendance />}
            />
            <Route
              path="/edit-tutorial-attendance1"
              element={<EditTutorialAttendance1 />}
            />
            <Route
              path="/edit-tutorial-attendance2"
              element={<EditTutorialAttendance2 />}
            />
            <Route
              path="/edit-individual-tutorial-attendance"
              element={<EditIndividualTutorialAttendance />}
            />
            <Route
              path="/edit-existing-practical-attendance"
              element={<EditExistingPracticalAttendance />}
            />
            <Route
              path="/edit-extra-practical-attendance1"
              element={<EditExtraPracticalAttendance1 />}
            />
            <Route
              path="/edit-extra-practical-attendance2"
              element={<EditExtraPracticalAttendance2 />}
            />
            <Route
              path="/edit-individual-extra-practical-attendance"
              element={<EditIndividualExtraPracticalAttendance />}
            />
            {/* View Attendance */}
            <Route path="/view-attend1" element={<ViewAttend1 />} />
            <Route path="/view-practical1" element={<ViewPractical1 />} />
            <Route path="/view-practical2" element={<ViewPractical2 />} />
            <Route
              path="/view-extra-practical1"
              element={<ViewExtraPractical1 />}
            />
            <Route
              path="/view-extra-practical2"
              element={<ViewExtraPractical2 />}
            />
            <Route
              path="/view-extra-theory-attend"
              element={<ViewExtraTheory1 />}
            />
            <Route path="/view-tutorial-attendance" element={<ViewT1 />} />
            {/* Assessment Routes */}
            <Route path="/summary-cards" element={<SummaryCards />} />
            <Route
              path="/attendance-summary-cards"
              element={<AttendanceSummaryCards />}
            />
            <Route path="/assess-ciann" element={<AssismentCiaanCards />} />
            <Route
              path="/assess-batch-select"
              element={<AssessBatchSelect />}
            />
            <Route path="/assess-pa" element={<AssessPA />} />
            <Route path="/assess-pa2" element={<AssessPA2 />} />
            <Route path="/assess-pa3" element={<AssessPA3 />} />
            <Route
              path="/assess-pa-studentlist"
              element={<AssessPAStudentlist />}
            />
            <Route
              path="/assesspastudentlist"
              element={<AssessPAStudentlist />}
            />
            <Route
              path="/assessment-student-select"
              element={<AssessmentStudentSelectForm />}
            />
            <Route
              path="/assessment-dashboard"
              element={<AssessmentDashboard />}
            />
            <Route
              path="/progressive-assessment"
              element={<ProgressiveAssessment />}
            />
            <Route
              path="/experiment-attendance"
              element={<ExperimentAttendance />}
            />
            <Route path="/edit-assess" element={<EditAssess />} />
            <Route
              path="/edit-assessment-overview"
              element={<EditAssessmentOverview />}
            />
            <Route path="/assessment/edit-prog" element={<EditProgAssess />} />
            <Route path="/edit-batch-select" element={<EditBatchSelect />} />
            <Route path="/edit-card" element={<EditCard />} />
            <Route
              path="/edit-assessed-students"
              element={<EditAssessedStudentList />}
            />
            <Route path="/view-assessment" element={<ViewAssessmentCard />} />{" "}
            <Route
              path="/view-assessment-overview"
              element={<ViewAssessmentOverview />}
            />
            <Route
              path="/view-assessed-students"
              element={<ViewAssessedStudentList />}
            />{" "}
            <Route
              path="/view-batch-select"
              element={<ViewAssessmentBatchSelect />}
            />
            <Route path="/view-pa/b1" element={<ViewPA1 />} />
            <Route path="/view-pa/b2" element={<ViewPA2 />} />
            <Route path="/view-pa/b3" element={<ViewPA3 />} />
            {/* Practical Exams Routes */}
            <Route
              path="/faculty/practical-exams"
              element={<PracticalExamSection />}
            />
            <Route
              path="/faculty/practical-exams/dashboard"
              element={<PracticalExamDashboard />}
            />
            <Route
              path="/faculty/practical-exams/add"
              element={<AddPractical />}
            />
            <Route
              path="/faculty/practical-exams/manage"
              element={<ManagePractical />}
            />
            <Route
              path="/faculty/practical-exams/status"
              element={<EnableDisablePractical />}
            />
            <Route
              path="/faculty/practical-exams/edit/:examId"
              element={<EditPractical />}
            />
            <Route
              path="/faculty/practical-exams/questions/:examId"
              element={<ManagePracticalQuestions />}
            />
            <Route
              path="/faculty/practical-exams/:examId/responses"
              element={<ViewStudentResponses />}
            />
            {/* Defaulter Routes */}
            <Route path="/defaulter" element={<Defaulter />} />
            <Route path="/studentwise-defaulters" element={<DefaulterCard />} />
            <Route path="/studentwise-select" element={<StudentWiseSelect />} />
            <Route path="/studentwise-assess" element={<StudentWiseAssess />} />
            <Route path="/studentwise-setup" element={<StudentAssessSetup />} />
            {/* CT & PT Routes */}
            <Route path="/ct-cianns" element={<CTCiannCards />} />
            <Route path="/ct-dashboard/:ciannId" element={<CTDashboard />} />
            <Route
              path="/pt-microproject/microproject"
              element={<Microproject />}
            />
            <Route
              path="/pt-microproject/microproject/step-3"
              element={<Microproject />}
            />
            <Route
              path="/pt-microproject/dashboard"
              element={<PTDashboard />}
            />
            <Route
              path="/pt-microproject/configuration"
              element={<PTConfiguration />}
            />
            <Route
              path="/pt-microproject/entry"
              element={<PTMarksEntry />}
            />
            {/* Course Management */}
            <Route path="/chapters" element={<ManageChapters1 />} />
            <Route path="/add-chapters" element={<ManageChapters2 />} />
            <Route path="/update-chapter" element={<UpdateChapter />} />
            <Route path="/experiment" element={<Course1 />} />
            <Route path="/course2" element={<Course2 />} />
            <Route path="/course3" element={<Course3 />} />
            <Route path="/course4" element={<Course4 />} />
            {/* MSBTE Formats Routes */}
            <Route
              path="/msbte/fa-pr-k3/cianns"
              element={<FAPRK3CiannCards />}
            />
            <Route
              path="/msbte/sa-pr-k4/cianns"
              element={<SAPRK4CiannCards />}
            />
            <Route
              path="/msbte/fa-th-k5/cianns"
              element={<FATHK5CiannCards />}
            />
            <Route
              path="/msbte/fa-pr-k3/generate"
              element={<FAPRK3Generate />}
            />
            <Route path="/msbte/fa-pr-k3/print" element={<FAPRK3Print />} />
            <Route path="/msbte/fa-th-k5/print" element={<FATHK5Print />} />
            <Route
              path="/msbte/sa-pr-k4/generate"
              element={<SAPRK4Generate />}
            />
            <Route path="/msbte/sa-pr-k4/edit" element={<SAPRK4Edit />} />
            <Route path="/msbte/sa-pr-k4/print" element={<SAPRK4Print />} />
            <Route
              path="/msbte/sa-th/cianns"
              element={<SATHCiannCards />}
            />
            <Route
              path="/msbte/sa-th/generate"
              element={<SATHGenerate />}
            />
            <Route path="/msbte/sa-th/edit" element={<SATHEdit />} />
            <Route path="/msbte/sa-th/print" element={<SATHPrint />} />
            <Route path="/msbte/attendance" element={<AttendanceReport />} />
            <Route
              path="/msbte/industrial-visit/k8"
              element={<IndustrialVisitK8 />}
            />
            <Route
              path="/msbte/industrial-visit/k8/generate"
              element={<IndustrialVisitK8Generate />}
            />
            <Route
              path="/msbte/industrial-visit/k8/edit"
              element={<IndustrialVisitK8Edit />}
            />
            <Route
              path="/msbte/industrial-visit/k8/print"
              element={<IndustrialVisitK8Print />}
            />
            <Route
              path="/msbte/expert-lecture/k9"
              element={<ExpertLectureK9 />}
            />
            <Route
              path="/msbte/expert-lecture/k9/generate"
              element={<ExpertLectureK9Generate />}
            />
            <Route
              path="/msbte/expert-lecture/k9/edit"
              element={<ExpertLectureK9Edit />}
            />
            <Route
              path="/msbte/expert-lecture/k9/print"
              element={<ExpertLectureK9Print />}
            />
            <Route
              path="/msbte/term-analysis"
              element={<TermAnalysisK7 />}
            />
            <Route
              path="/msbte/term-analysis/print"
              element={<TermAnalysisK7Print />}
            />
            {/* K7 Routes */}
            <Route
              path="/msbte/k7/cianns"
              element={<K7CiannSelection />}
            />
            <Route
              path="/msbte/k7/generate"
              element={<K7Generate />}
            />
            <Route
              path="/msbte/k7/print"
              element={<K7Print />}
            />
            <Route
              path="/msbte/k7/report-selector"
              element={<K7ReportSelector />}
            />
            <Route
              path="/msbte/k7/placeholder/:partName"
              element={<K7Placeholder />}
            />
            {/* Admin/Panel Routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/admin-departments" element={<DepartmentList />} />
            <Route
              path="/admin-create-department"
              element={<DepartmentForm />}
            />
            <Route
              path="/admin-department-management/:id"
              element={<DepartmentManagement />}
            />
            <Route
              path="/admin/departments/:id/courses"
              element={<DepartmentCourses />}
            />
            <Route
              path="/admin/departments/:id/practical-exams"
              element={<DepartmentPracticalExams />}
            />
            <Route path="/admin-faculty" element={<FacultyList filterRole="faculty" />} />
            <Route path="/admin-create-faculty" element={<CreateFaculty defaultRole="faculty" />} />
            <Route path="/admin-edit-faculty/:id" element={<FacultyForm />} />
            <Route path="/admin-hod" element={<FacultyList filterRole="hod" />} />
            <Route path="/admin-create-hod" element={<CreateFaculty defaultRole="hod" />} />
            <Route path="/admin-academic-coordinator" element={<FacultyList filterRole="academic_coordinator" />} />
            <Route path="/admin-create-academic-coordinator" element={<CreateFaculty defaultRole="academic_coordinator" />} />
            <Route path="/admin-office-staff" element={<OfficeStaffList />} />
            <Route
              path="/admin-create-office-staff"
              element={<CreateOfficeStaff />}
            />
            <Route
              path="/admin-edit-office-staff/:id"
              element={<OfficeStaffForm />}
            />
            <Route path="/admin/subjects" element={<SubjectManagement />} />
            <Route path="/admin/subjects-view" element={<SubjectsView />} />
            <Route
              path="/admin/course-details-view/:subjectId"
              element={<CourseDetailsView />}
            />
            <Route
              path="/admin/vision-mission"
              element={<VisionMissionManager />}
            />
            <Route
              path="/admin/rooms"
              element={<ManageRooms />}
            />
            <Route
              path="/admin/promotions"
              element={<StudentPromotions />}
            />
            {/* SuperAdmin Routes */}
            <Route
              path="/superadmin-dashboard"
              element={<SuperAdminDashboard />}
            />
            <Route
              path="/superadmin-create-institution"
              element={<CreateInstitution />}
            />
            <Route
              path="/superadmin-view-institutions"
              element={<ViewInstitutions />}
            />
            <Route
              path="/superadmin-manage-institution/:id"
              element={<ManageInstitution />}
            />
            <Route path="/test-students" element={<TestStudents />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
