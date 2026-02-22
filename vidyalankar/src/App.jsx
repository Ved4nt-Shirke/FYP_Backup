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
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

// Student Components
import StudentLayout from "./student/StudentLayout";
import StudentDashboard from "./student/StudentDashboard";
import StudyMaterial from "./student/StudyMaterial";
import ElibraryCoursewise from "./student/ElibraryCoursewise";
import ElibrarySearch from "./student/ElibrarySearch";
import MockTestExamList from "./student/MockTestExamList";
import MockTestExamResult from "./student/MockTestExamResult";
import Results from "./student/Results";
import Notices from "./student/Notices";
import Exams from "./student/Exams";
import StudentPracticalExamList from "./student/StudentPracticalExamList";
import StudentPracticalExamUpload from "./student/StudentPracticalExamUpload";

// CIANN / Edit CIANN Components
import CreateCiann from "./components/CreateCiann";
import EditCiann from "./components/EditCiann";
import CourseDiary from "./editCiann/CourseDiary";
import CourseDiary2 from "./editCiann/CourseDiary2";
import TimeTable from "./editCiann/Timetable";
import Syllabus from "./editCiann/Syllabus";
import LabPlanningSheet from "./editCiann/LabPlanningSheet";
import TeachingPlanSheet from "./editCiann/TeachingPlanSheet";
import Studentlist from "./editCiann/studentlist";

// Subject Details
import SubjectDetails from "./SubjectDetails/SubjectDetails";
import LectureSchedule from "./SubjectDetails/LectureSchedule";
import OfficeHours from "./SubjectDetails/OfficeHours";
import COsWithPOs from "./SubjectDetails/COsWithPOs";
import COsWithPSOs from "./SubjectDetails/COsWithPSOs";
import PastResult from "./SubjectDetails/PastResult";
import KnowledgeMap from "./SubjectDetails/KnowledgeMap";
import Objectives from "./SubjectDetails/Objectives";
import CourseOutcomes from "./SubjectDetails/CourseOutcomes";
import Recommendations from "./SubjectDetails/Recommendations";
import Resources from "./SubjectDetails/Resources";
import Rubric from "./SubjectDetails/Rubric";

// Attendance Components
import MarkAttendance from "./components/MarkAttendance";
import ViewAttendance from "./components/ViewAttendance";
import EditAttendance from "./components/EditAttendance";
import TheoryCiannCards from "./Attendance/TheoryAttend";
import ExtraTheoryCiannCards from "./Attendance/EtheoryCard";
import ExtraPracticalCiannCards from "./Attendance/EpractCard";
import TutorialCiannCards from "./Attendance/tutCard";
import PracticalCiannCards from "./Attendance/PracticalCiannCards";
import PracticalAttendance from "./Attendance/PracticalAttendance";
import PracticalAttendanceForm from "./Attendance/PracticalAttendanceForm";
import PracticalFinalAtt from "./Attendance/PracticalFinalAtt";
import PracticalBatchDistribution from "./Attendance/PracticalBatchDistribution";
import TheoryEdit from "./Attendance/TheoryEdit";
import AttendanceForm from "./Attendance/Theory";
import FinalAttendance from "./Attendance/FinalAtt";
import ExtraTheory from "./Attendance/ExtraTheory";
import StudentExtraAttendance from "./Attendance/Extratattend";
import ExtraAttendanceForm from "./Attendance/ExtraPract";
import ExtraAttendance from "./Attendance/Tutorial";
import StudentAttendancePage from "./Attendance/Extrapattend";
import StudentAttendance from "./Attendance/Tutattend";

// Edit Attendance Routes
import EditAttendance1 from "./Attendance/edit/EditAttendance1";
import EditAttendance2 from "./Attendance/edit/EditAttendance2";
import EditIndividualAttendance from "./Attendance/edit/EditIndividualAttendance";
import EditExtraTheoryAttendance1 from "./Attendance/edit/EditExtraTheoryAttendance1";
import EditExtraTheoryAttendance2 from "./Attendance/edit/EditExtraTheoryAttendance2";
import EditIndividualExtraTheoryAttendance from "./Attendance/edit/EditIndividualExtraTheoryAttendance";
import EditPracticalAttendance1 from "./Attendance/edit/EditPracticalAttendance1";
import EditPracticalAttendance2 from "./Attendance/edit/EditPracticalAttendance2";
import EditIndividualPracticalAttendance from "./Attendance/edit/EditIndividualPracticalAttendance";
import EditTutorialAttendance1 from "./Attendance/edit/EditTutorialAttendance1";
import EditTutorialAttendance2 from "./Attendance/edit/EditTutorialAttendance2";
import EditIndividualTutorialAttendance from "./Attendance/edit/EditIndividualTutorialAttendance";
import EditExistingPracticalAttendance from "./Attendance/edit/EditExistingPracticalAttendance";
import EditExtraPracticalAttendance1 from "./Attendance/edit/EditExtraPracticalAttendance1";
import EditExtraPracticalAttendance2 from "./Attendance/edit/EditExtraPracticalAttendance2";
import EditIndividualExtraPracticalAttendance from "./Attendance/edit/EditIndividualExtraPracticalAttendance";

// View Attendance Routes
import ViewAttend1 from "./Attendance/view/ViewAttend1";
import ViewAttend2 from "./Attendance/view/ViewAttend2";
import ViewPractical1 from "./Attendance/view/ViewPractical1";
import ViewPractical2 from "./Attendance/view/ViewPractical2";
import ViewPractical3 from "./Attendance/view/ViewPractical3";
import ViewExtraPractical1 from "./Attendance/view/ViewExtraPractical1";
import ViewExtraPractical2 from "./Attendance/view/ViewExtraPractical2";
import ViewExtraPractical3 from "./Attendance/view/ViewExtraPractical3";
import ViewExtraTheory1 from "./Attendance/view/ViewET1";
import ViewExtraTheory2 from "./Attendance/view/ViewET2";
import ViewT1 from "./Attendance/view/ViewTut";
import ViewT2 from "./Attendance/view/ViewTut2";

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

import OfficeDashboard from "./office/OfficeDashboard";
import OfficeSidebar from "./office/OfficeSidebar";
import OfficeHeader from "./office/OfficeHeader";

// Assessment Components
import SummaryCards from "./components/SummaryCards";
import SummaryPage from "./components/SummaryPage";
import AssismentCiaanCards from "./Assessment/assess/assismentCiaan";
import AssessBatchSelect from "./Assessment/assess/assessBatchselect";
import AssessPA from "./Assessment/assess/AssessPA";
import AssessPA2 from "./Assessment/assess/AssessPA2";
import AssessPA3 from "./Assessment/assess/AssessPA3";
import AssessPAStudentlist from "./Assessment/assess/AssessPAStudentlist";
import AssessmentStudentSelectForm from "./Assessment/assess/AssessmentStudentSelectForm";
import AssessmentDashboard from "./Assessment/AssessmentDashboard";
import ProgressiveAssessment from "./Assessment/ProgressiveAssessment";
import ExperimentAttendance from "./Assessment/ExperimentAttendance";
import EditAssess from "./Assessment/EditAssess";
import EditProgAssess from "./Assessment/EditProgAssess";
import EditBatchSelect from "./Assessment/edit/EditBatchSelect";
import EditCard from "./Assessment/edit/EditCard";
import EditAssessedStudentList from "./Assessment/edit/EditAssessedStudentList";
import EditAssessmentOverview from "./Assessment/edit/EditAssessmentOverview";
import ViewAssessmentCard from "./Assessment/view/ViewAssessmentCard";
import ViewAssessmentBatchSelect from "./Assessment/view/ViewAssessmentBatchSelect";
import ViewAssessmentOverview from "./Assessment/view/ViewAssessmentOverview";
import ViewAssessedStudentList from "./Assessment/view/ViewAssessedStudentList";
import ViewPA1 from "./Assessment/view/ViewPA1";
import ViewPA2 from "./Assessment/view/ViewPA2";
import ViewPA3 from "./Assessment/view/ViewPA3";

// Practical Exam Components
import PracticalExamSection from "./PracticalExam/PracticalExamSection";
import PracticalExamDashboard from "./PracticalExam/PracticalExamDashboard";
import AddPractical from "./PracticalExam/AddPractical";
import ManagePractical from "./PracticalExam/ManagePractical";
import EnableDisablePractical from "./PracticalExam/EnableDisablePractical";
import ManagePracticalQuestions from "./PracticalExam/ManagePracticalQuestions";
import ViewStudentResponses from "./PracticalExam/ViewStudentResponses";
import EditPractical from "./PracticalExam/EditPractical";
import PublicPracticalExam from "./PracticalExam/PublicPracticalExam";

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

// CT / PT / Course Components
import CTCiannCards from "./CT/CTCiannCards";
import CTDashboard from "./CT/CTDashboard";
import Course1 from "./Course/Course1";
import Course2 from "./Course/Course2";
import Course3 from "./Course/Course3";
import Course4 from "./Course/Course4";
import ManageChapters1 from "./Course/managechp1";
import ManageChapters2 from "./Course/managechp2";
import UpdateChapter from "./Course/managechp3";
import Microproject from "./PTMicroProject/Microproject";

// Defaulters
import Defaulter from "./components/defaulter";
import DefaulterCard from "./Assessment/studentDefaulter/DefaulterCard";
import StudentWiseSelect from "./Assessment/studentDefaulter/StudentWiseSelect";
import StudentWiseAssess from "./Assessment/studentDefaulter/StudentWiseAssess";
import StudentAssessSetup from "./Assessment/studentDefaulter/StudentAssessSetup";

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

  const themeMap = {
    VSIT: { header: "#c62828", accent: "#ef4444", accentDark: "#b91c1c" },
    VIT: { header: "#1565c0", accent: "#3b82f6", accentDark: "#1d4ed8" },
    VP: { header: "#2e7d32", accent: "#10b981", accentDark: "#059669" },
  };

  const theme = themeMap[college] || themeMap.VP;

  root.style.setProperty("--app-header-bg", theme.header);
  root.style.setProperty("--primary-accent", theme.accent);
  root.style.setProperty("--primary-accent-dark", theme.accentDark);
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
    const isLoginPage = location.pathname === "/login";
    const isPublicPage = [
      "view-attend2",
      "view-practical3",
      "summary-pages",
    ].some((p) => location.pathname.includes(p));

    if (!token && !isLoginPage && !isPublicPage) {
      navigate("/login");
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
    ].includes(location.pathname) ||
    location.pathname.match(/^\/public\/practical-exam\/.*/);

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
            <Route
              path="elibrary/coursewise"
              element={<ElibraryCoursewise />}
            />
            <Route path="elibrary/search" element={<ElibrarySearch />} />
            <Route path="mock-test/exam-list" element={<MockTestExamList />} />
            <Route
              path="mock-test/exam-result"
              element={<MockTestExamResult />}
            />
            <Route path="mock-test/exams" element={<Exams />} />
            <Route path="practical-exams" element={<StudentPracticalExamList />} />
            <Route
              path="practical-exam-upload/:examId"
              element={<StudentPracticalExamUpload />}
            />
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
      ) : userRole === "office" ? (
        <OfficeHeader onMenuToggle={handleMenuToggle} />
      ) : userRole === "admin" ? (
        <AdminHeader onMenuToggle={handleMenuToggle} />
      ) : userRole !== "admin" ? (
        <Header
          onMenuToggle={handleMenuToggle}
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
            <Route path="/create-ciann" element={<CreateCiann />} />
            <Route path="/edit-ciann" element={<EditCiann />} />
            <Route path="/course-diary" element={<CourseDiary />} />
            <Route path="/course-diary2" element={<CourseDiary2 />} />
            <Route path="/timetable" element={<TimeTable />} />
            <Route path="/syllabus" element={<Syllabus />} />
            <Route path="/laboratory-plan" element={<LabPlanningSheet />} />
            <Route path="/teaching-plan" element={<TeachingPlanSheet />} />
            <Route path="/student-list" element={<Studentlist />} />
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
            <Route path="/msbte/attendance" element={<AttendanceReport />} />
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
            <Route path="/admin-faculty" element={<FacultyList />} />
            <Route path="/admin-create-faculty" element={<CreateFaculty />} />
            <Route path="/admin-edit-faculty/:id" element={<FacultyForm />} />
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
