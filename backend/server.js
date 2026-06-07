// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// WhatsApp Bot (whatsapp-web.js) — optional, gracefully skipped if disabled
let startWhatsAppBot = null;
if (process.env.WHATSAPP_BOT_ENABLED !== "false") {
  try {
    ({ startWhatsAppBot } = require("./whatsapp/bot"));
  } catch (e) {
    console.warn("⚠️  WhatsApp bot module failed to load:", e.message);
  }
}

const app = express();

const isDummyInstitutionRecord = (institution) => {
  const matcher = /dummy|test|demo|sample/i;
  return (
    matcher.test(String(institution?.name || "")) ||
    matcher.test(String(institution?.code || ""))
  );
};

// --- Middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Your frontend
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(() => {
    console.log("MongoDB Connected Successfully");
    // Initialize superadmin user
    initializeSuperAdmin();
    // Start WhatsApp Attendance Bot
    if (startWhatsAppBot) {
      startWhatsAppBot();
    }
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

// --- Initialize Superadmin User ---
async function initializeSuperAdmin() {
  try {
    const bcrypt = require("bcryptjs");
    const User = require("./models/user");

    const superadminUsername = process.env.SUPERADMIN_USERNAME || "superadmin";
    const superadminPassword =
      process.env.SUPERADMIN_PASSWORD || "superadmin123";

    // Check if superadmin exists
    const existingSuperAdmin = await User.findOne({
      username: superadminUsername,
      college: "ALL",
      role: "superadmin",
    });

    if (!existingSuperAdmin) {
      console.log(
        "Superadmin user not found. Creating superadmin user from .env...",
      );

      // Hash password
      const hashedPassword = await bcrypt.hash(superadminPassword, 10);

      // Create superadmin user
      const superadmin = new User({
        username: superadminUsername,
        password: hashedPassword,
        college: "ALL",
        role: "superadmin",
      });

      await superadmin.save();
      console.log("✓ Superadmin user created successfully");
      console.log(`  Username: ${superadminUsername}`);
      console.log(`  College: ALL`);
      console.log(`  Role: superadmin`);
    } else {
      console.log("✓ Superadmin user already exists in database");
    }
  } catch (error) {
    console.error("Error initializing superadmin user:", error.message);
  }
}

// --- Public Routes ---

// Public endpoint to fetch institutions for login page
app.get("/api/institutions", async (req, res) => {
  try {
    const Institution = require("./models/Institution");
    const institutions = await Institution.find({}, "name code isActive");
    const filteredInstitutions = institutions.filter(
      (institution) => !isDummyInstitutionRecord(institution),
    );
    res.json({
      success: true,
      institutions: filteredInstitutions,
    });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching institutions",
      error: error.message,
    });
  }
});

// --- API Routes ---

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// CIAAN Routes
app.use("/api/cianns", require("./routes/cianns"));

// Student Portal Routes
app.use("/api/student-portal", require("./routes/studentPortal"));

// Study Materials Routes
app.use("/api/study-materials", require("./routes/studyMaterials"));

// Student Routes
app.use("/api/students", require("./routes/students"));

// Planning Routes
app.use("/api/teaching-plan", require("./routes/teachingPlan"));
app.use("/api/lab-planning", require("./routes/labPlanning"));
app.use("/api/tutorial-plan", require("./routes/tutorialPlan"));

// Attendance Routes
app.use("/api/theory-attendance", require("./routes/theoryAttendance"));
app.use("/api/extra-attendance", require("./routes/extraAttendance"));
app.use("/api/tutorial-attendance", require("./routes/tutorialAttendance"));
app.use("/api/extra-pract", require("./routes/extraPract"));

// View Attendance Routes
app.use("/api/attendance", require("./routes/viewTheory"));
app.use(
  "/api/view-practical-attendance",
  require("./routes/viewPracticalAttendance"),
);
app.use("/api/view-extra-practical", require("./routes/viewExtraPractical"));

// --- PRACTICAL ATTENDANCE ROUTE (NEW) ---
app.use("/api/practical-attendance", require("./routes/practicalAttendance"));

// Slot Routes
app.use("/api/slots", require("./routes/slots"));

// Student Timetable Routes (faculty managed for student panel)
app.use("/api/student-timetables", require("./routes/studentTimetables"));

// Authentication Routes
app.use("/api/auth", require("./routes/auth"));

// Chat Routes
app.use("/api/chat", require("./routes/chat"));

// Subject Details Routes
app.use("/api/subject-details", require("./routes/subjectDetails"));

// Course Details & CO Mapping Routes
app.use("/api/course-details", require("./routes/courseDetails"));

// Summary Routes
app.use("/api/summary", require("./routes/summary"));

// Experiment Routes
app.use("/api/get-experiments", require("./routes/experiments"));

// Course Chapters Routes
app.use("/api/course-chapters", require("./routes/courseChapters"));

// Assessment Routes
app.use("/api/assessments", require("./routes/assessments"));

// PT Microproject Routes
app.use("/api/pt-microproject", require("./routes/ptMicroProject"));

// Practical Exams Routes
app.use("/api/practical-exams", require("./routes/practicalExams"));

// Mock Exams Routes
app.use("/api/mock-exams", require("./routes/mockExams"));

// CT Marks Routes
app.use("/api/ct-marks", require("./routes/ctMarks"));

// MSBTE Formats Routes
app.use("/api/msbte", require("./routes/msbteFormats"));

// Admin Routes
const { authenticate, authorizeAdmin } = require("./middleware/auth");
app.use("/api/admin", authenticate, authorizeAdmin, require("./routes/admin"));

// Course, Division, Subject Routes (Admin)
app.use(
  "/api/courses",
  authenticate,
  authorizeAdmin,
  require("./routes/courses"),
);
app.use(
  "/api/divisions",
  authenticate,
  authorizeAdmin,
  require("./routes/divisions"),
);
app.use(
  "/api/subjects",
  authenticate,
  authorizeAdmin,
  require("./routes/subjects"),
);

// Office Staff Routes (NEW)
app.use("/api/office", require("./routes/office"));

// Catalog Routes (for fetching departments, courses, divisions, subjects)
app.use("/api/catalog", require("./routes/catalog"));

// Super Admin Routes
app.use("/api/superadmin", require("./routes/superadmin"));

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// --- 404 Handler ---
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.url);
  res.status(404).json({ message: "Route not found" });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
