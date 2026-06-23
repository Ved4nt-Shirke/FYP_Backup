// API Configuration
// This file centralizes all API base URL configuration
// Use environment variables for easy deployment

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Normalize base URL and ensure /api is present exactly once
const trimmedBase = RAW_BASE_URL.replace(/\/$/, "");
const API_BASE_URL = trimmedBase.endsWith("/api")
  ? trimmedBase
  : `${trimmedBase}/api`;

// Export the base URL and common endpoints
export const config = {
  apiBaseUrl: API_BASE_URL,

  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    verify2fa: `${API_BASE_URL}/auth/verify-2fa`,
  },

  // CIANN endpoints
  cianns: `${API_BASE_URL}/cianns`,

  // Academic Year endpoints
  academicYear: {
    create: `${API_BASE_URL}/academic-year/create`,
    all: `${API_BASE_URL}/academic-year/all`,
    current: `${API_BASE_URL}/academic-year/current`,
    complete: (id) => `${API_BASE_URL}/academic-year/complete/${id}`,
    activate: (id) => `${API_BASE_URL}/academic-year/activate/${id}`,
    stats: (id) => `${API_BASE_URL}/academic-year/${id}/stats`,
    delete: (id) => `${API_BASE_URL}/academic-year/${id}`,
  },


  // Student endpoints
  students: `${API_BASE_URL}/students`,

  // Mock exam endpoints
  mockExams: `${API_BASE_URL}/mock-exams`,

  // Attendance endpoints
  attendance: {
    theory: `${API_BASE_URL}/theory-attendance`,
    practical: `${API_BASE_URL}/practical-attendance`,
    tutorial: `${API_BASE_URL}/tutorial-attendance`,
    extraTheory: `${API_BASE_URL}/extra-attendance`,
    extraPractical: `${API_BASE_URL}/extra-pract`,
  },

  // Assessment endpoints
  assessments: `${API_BASE_URL}/assessments`,

  // MSBTE Formats endpoints
  msbte: `${API_BASE_URL}/msbte`,

  // Course endpoints
  course: {
    chapters: `${API_BASE_URL}/course-chapters`,
    experiments: `${API_BASE_URL}/get-experiments`,
  },

  // Subject details
  subjectDetails: `${API_BASE_URL}/subject-details`,

  // Chat endpoints
  chat: {
    unreadCount: `${API_BASE_URL}/chat/unread-count`,
    conversations: `${API_BASE_URL}/chat/conversations`,
    messages: `${API_BASE_URL}/chat/messages`,
    startConversation: `${API_BASE_URL}/chat/conversations/start`,
    facultyList: `${API_BASE_URL}/chat/faculty-list`,
    conversationMessages: (conversationId) =>
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
    toggleMute: (conversationId) =>
      `${API_BASE_URL}/chat/conversations/${conversationId}/mute`,
    toggleArchive: (conversationId) =>
      `${API_BASE_URL}/chat/conversations/${conversationId}/archive`,
  },

  // Teaching & Lab Planning
  teachingPlan: `${API_BASE_URL}/teaching-plan`,
  labPlanning: `${API_BASE_URL}/lab-planning`,

  // Slots (timetable)
  slots: `${API_BASE_URL}/slots`,

  // Super admin
  superadmin: `${API_BASE_URL}/superadmin`,

  // Admin
  admin: {
    departments: `${API_BASE_URL}/admin/departments`,
    departmentsByInstitution: (institution) =>
      `${API_BASE_URL}/admin/departments/${institution}`,
    createFaculty: `${API_BASE_URL}/admin/create-faculty`,
    createOfficeStaff: `${API_BASE_URL}/admin/create-office-staff`,
    deleteDepartment: (id) => `${API_BASE_URL}/admin/departments/${id}`,
    // Faculty management endpoints
    faculty: `${API_BASE_URL}/admin/faculty`,
    facultyById: (id) => `${API_BASE_URL}/admin/faculty/${id}`,
    updateFaculty: (id) => `${API_BASE_URL}/admin/faculty/${id}`,
    deleteFaculty: (id) => `${API_BASE_URL}/admin/faculty/${id}`,
    facultyStats: `${API_BASE_URL}/admin/faculty-stats`,
    bulkImportFaculty: `${API_BASE_URL}/admin/faculty/bulk-import`,
    facultyCredentials: `${API_BASE_URL}/admin/faculty-credentials`,
    resetFacultyPassword: (id) =>
      `${API_BASE_URL}/admin/faculty/${id}/reset-password`,
    updateFacultyUsername: (id) =>
      `${API_BASE_URL}/admin/faculty/${id}/username`,
    updateFacultyPassword: (id) =>
      `${API_BASE_URL}/admin/faculty/${id}/password`,
    // Department-Faculty management
    updateFacultyDepartment: (id) =>
      `${API_BASE_URL}/admin/faculty/${id}/department`,
    getDepartmentFaculty: (id) =>
      `${API_BASE_URL}/admin/departments/${id}/faculty`,
    transferFaculty: (id) => `${API_BASE_URL}/admin/faculty/${id}/transfer`,
    // Office Staff management endpoints
    officeStaff: `${API_BASE_URL}/admin/office-staff`,
    officeStaffById: (id) => `${API_BASE_URL}/admin/office-staff/${id}`,
    updateOfficeStaff: (id) => `${API_BASE_URL}/admin/office-staff/${id}`,
    deleteOfficeStaff: (id) => `${API_BASE_URL}/admin/office-staff/${id}`,
    officeStaffCredentials: `${API_BASE_URL}/admin/office-staff-credentials`,
    resetOfficeStaffPassword: (id) =>
      `${API_BASE_URL}/admin/office-staff/${id}/reset-password`,
    updateOfficeStaffUsername: (id) =>
      `${API_BASE_URL}/admin/office-staff/${id}/username`,
    updateOfficeStaffPassword: (id) =>
      `${API_BASE_URL}/admin/office-staff/${id}/password`,
    updateOfficeStaffDepartment: (id) =>
      `${API_BASE_URL}/admin/office-staff/${id}/department`,
    transferOfficeStaff: (id) =>
      `${API_BASE_URL}/admin/office-staff/${id}/transfer`,
    visionMission: `${API_BASE_URL}/admin/vision-mission`,
    classrooms: `${API_BASE_URL}/admin/classrooms`,
    classroomById: (id) => `${API_BASE_URL}/admin/classrooms/${id}`,
    labs: `${API_BASE_URL}/admin/labs`,
    labById: (id) => `${API_BASE_URL}/admin/labs/${id}`,
    promotionsEligible: `${API_BASE_URL}/admin/promotions/eligible-students`,
    promoteStudents: `${API_BASE_URL}/admin/promotions/promote`,
    archiveSemesters: `${API_BASE_URL}/admin/archive/semesters`,
    freezeSemester: `${API_BASE_URL}/admin/archive/freeze`,
  },

  // Courses, divisions, subjects (Admin)
  courses: {
    create: `${API_BASE_URL}/courses`,
    listByDepartment: (departmentId) =>
      `${API_BASE_URL}/courses/${departmentId}`,
    update: (id) => `${API_BASE_URL}/courses/${id}`,
    delete: (id) => `${API_BASE_URL}/courses/${id}`,
  },
  divisions: {
    create: `${API_BASE_URL}/divisions`,
    listByCourse: (courseId) => `${API_BASE_URL}/divisions/${courseId}`,
    update: (id) => `${API_BASE_URL}/divisions/${id}`,
    delete: (id) => `${API_BASE_URL}/divisions/${id}`,
  },
  subjects: {
    create: `${API_BASE_URL}/subjects`,
    list: `${API_BASE_URL}/subjects`,
    update: (id) => `${API_BASE_URL}/subjects/${id}`,
    delete: (id) => `${API_BASE_URL}/subjects/${id}`,
    bulkImport: `${API_BASE_URL}/subjects/bulk-import`,
    deleteAll: `${API_BASE_URL}/subjects/delete-all`,
  },
  courseDetails: {
    save: `${API_BASE_URL}/course-details`,
    bySubject: (subjectId) => `${API_BASE_URL}/course-details/subject/${subjectId}`,
    listAll: `${API_BASE_URL}/course-details/list`,
  },
  ciannSubjectDetails: {
    get: (ciannId) => `${API_BASE_URL}/subject-details/ciann-subject-details/${ciannId}`,
    save: `${API_BASE_URL}/subject-details/ciann-subject-details`,
    uploadImage: `${API_BASE_URL}/subject-details/ciann-subject-details/knowledge-map-image`,
  },


  // Office Staff Panel Endpoints
  office: {
    theme: `${API_BASE_URL}/office/theme`,
    dashboardSummary: `${API_BASE_URL}/office/dashboard-summary`,
    students: `${API_BASE_URL}/office/students`,
    divisions: `${API_BASE_URL}/office/divisions`,
    batches: `${API_BASE_URL}/office/batches`,
    exportCredentials: `${API_BASE_URL}/office/export-credentials`,
    regeneratePassword: (studentId) =>
      `${API_BASE_URL}/office/regenerate-password/${studentId}`,
    studentById: (studentId) => `${API_BASE_URL}/office/student/${studentId}`,
    bulkImport: `${API_BASE_URL}/office/bulk-import`,
    clearStudents: `${API_BASE_URL}/office/students`,
    updateStudent: (studentId) => `${API_BASE_URL}/office/student/${studentId}`,
    deleteStudent: (studentId) => `${API_BASE_URL}/office/student/${studentId}`,
    saveSeatNumbers: `${API_BASE_URL}/office/students/seat-numbers`,
    bulkSeatNumbers: `${API_BASE_URL}/office/students/bulk-seat-numbers`,
    // New endpoints for department/course/division selection
    departments: `${API_BASE_URL}/office/departments`,
    courses: (departmentId) => `${API_BASE_URL}/office/courses/${departmentId}`,
    courseDivisions: (courseId) =>
      `${API_BASE_URL}/office/course-divisions/${courseId}`,
  },

  // Catalog endpoints (for fetching admin-created data: departments, courses, divisions, subjects)
  catalog: {
    departments: `${API_BASE_URL}/catalog/departments`,
    courses: (departmentId) =>
      `${API_BASE_URL}/catalog/courses/${departmentId}`,
    divisions: (courseId) => `${API_BASE_URL}/catalog/divisions/${courseId}`,
    subjects: `${API_BASE_URL}/catalog/subjects`,
    visionMission: `${API_BASE_URL}/catalog/vision-mission`,
    classrooms: `${API_BASE_URL}/catalog/classrooms`,
    labs: `${API_BASE_URL}/catalog/labs`,
  },

  mockExamsStudent: {
    list: `${API_BASE_URL}/mock-exams/student/exams`,
    results: `${API_BASE_URL}/mock-exams/student/results`,
    details: (id) => `${API_BASE_URL}/mock-exams/student/exams/${id}`,
    start: (id) => `${API_BASE_URL}/mock-exams/student/exams/${id}/start`,
    submit: (id) => `${API_BASE_URL}/mock-exams/student/exams/${id}/submit`,
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  return endpoint.startsWith("/")
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;
};

export default config;
