// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// --- Middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Your frontend
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// --- Public Routes ---

// Public endpoint to fetch institutions for login page
app.get("/api/institutions", async (req, res) => {
  try {
    const Institution = require("./models/Institution");
    const institutions = await Institution.find({}, "name code"); // Only fetch name and code
    res.json({
      success: true,
      institutions,
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
    timestamp: new Date().toISOString(),
  });
});

// CIAAN Routes
app.use("/api/cianns", require("./routes/cianns"));

// Student Portal Routes
app.use("/api/student-portal", require("./routes/studentPortal"));

// Student Routes
app.use("/api/students", require("./routes/students"));

// Planning Routes
app.use("/api/teaching-plan", require("./routes/teachingPlan"));
app.use("/api/lab-planning", require("./routes/labPlanning"));

// Attendance Routes
app.use("/api/theory-attendance", require("./routes/theoryAttendance"));
app.use("/api/extra-attendance", require("./routes/extraAttendance"));
app.use("/api/tutorial-attendance", require("./routes/tutorialAttendance"));
app.use("/api/extra-pract", require("./routes/extraPract"));

// View Attendance Routes
app.use("/api/attendance", require("./routes/viewTheory"));
app.use(
  "/api/view-practical-attendance",
  require("./routes/viewPracticalAttendance")
);
app.use("/api/view-extra-practical", require("./routes/viewExtraPractical"));

// --- PRACTICAL ATTENDANCE ROUTE (NEW) ---
app.use("/api/practical-attendance", require("./routes/practicalAttendance"));

// Slot Routes
app.use("/api/slots", require("./routes/slots"));

// Authentication Routes
app.use("/api/auth", require("./routes/auth"));

// Subject Details Routes
app.use("/api/subject-details", require("./routes/subjectDetails"));

// Summary Routes
app.use("/api/summary", require("./routes/summary"));

// Experiment Routes
app.use("/api/get-experiments", require("./routes/experiments"));

// Course Chapters Routes
app.use("/api/course-chapters", require("./routes/courseChapters"));

// Assessment Routes
app.use("/api/assessments", require("./routes/assessments"));

// CT Marks Routes
app.use("/api/ct-marks", require("./routes/ctMarks"));

// Admin Routes
const { authenticate, authorizeAdmin } = require("./middleware/auth");
app.use("/api/admin", authenticate, authorizeAdmin, require("./routes/admin"));

// Office Staff Routes (NEW)
app.use("/api/office", require("./routes/office"));

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
