const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");
const OfficeStaff = require("../models/OfficeStaff");
const { authenticate, authorizeAdmin, authorizeOffice } = require("../middleware/auth");
const Institution = require("../models/Institution");
const VisionMission = require("../models/VisionMission");
const Classroom = require("../models/Classroom");
const Lab = require("../models/Lab");
const Student = require("../models/Student");
const StudentAcademicHistory = require("../models/StudentAcademicHistory");
const Ciann = require("../models/Ciann");
const Division = require("../models/Division");
const Course = require("../models/Course");

const generateSafePassword = (length = 8) => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
// Institution and department mappings
// Departments will be fetched dynamically from the database
const institutionDepartments = {};

// Get institution departments
router.get("/departments/:institution", (req, res) => {
  const institution = req.params.institution;
  const departments = institutionDepartments[institution] || [];
  res.json({ departments });
});

// Get current admin's institution theme/palette
router.get("/theme", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const code = req.user.college;
    const institution = await Institution.findOne(
      { code },
      "name code palette",
    );
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found for current admin",
      });
    }
    res.json({
      success: true,
      institution: {
        name: institution.name,
        code: institution.code,
        palette: institution.palette,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching theme",
      error: err.message,
    });
  }
});

// Create faculty user
router.post(
  "/create-faculty",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      console.log("Creating faculty with data:", req.body);
      const { fullName, email, whatsappPhone, skills, institution, department } = req.body;

      // Check if the institution matches the admin's institution (from auth middleware)
      if (req.user && req.user.college && req.user.college !== institution) {
        return res.status(403).json({
          success: false,
          message: "You can only create users for your own institution",
        });
      }

      // Generate username from full name (e.g., "Shlok Lokhande" -> "shlok.lokhande")
      const username = fullName
        .toLowerCase()
        .replace(/\s+/g, ".") // Replace spaces with dots
        .replace(/[^a-z0-9.]/g, ""); // Remove special characters

      // Generate employee ID
      const employeeId = `FAC${Date.now().toString().slice(-6)}`;

      // Generate random password
      const password = generateSafePassword(8);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log("Creating user with:", {
        username,
        college: institution,
        role: req.body.role || "faculty",
      });

      // Create user
      const newUser = new User({
        username,
        password: hashedPassword,
        college: institution,
        role: req.body.role || "faculty",
      });

      await newUser.save();
      console.log("User created successfully");

      // Create faculty record
      const Faculty = require("../models/Faculty");
      const newFaculty = new Faculty({
        fullName,
        email,
        employeeId,
        department: department || null,
        institution,
        skills: skills || [],
        whatsappPhone: whatsappPhone || "",
        generatedUsername: username,
        currentPassword: password, // store plain password for admin reference
        createdBy: req.user._id,
        role: req.body.role || "faculty",
      });

      console.log("Creating faculty record with:", {
        fullName,
        email,
        employeeId,
        department: department || null,
        institution,
        skills: skills || [],
        whatsappPhone: whatsappPhone || "",
        generatedUsername: username,
      });

      await newFaculty.save();
      console.log("Faculty created successfully");

      res.json({
        success: true,
        username,
        password,
        message: "Faculty user created successfully",
      });
    } catch (error) {
      console.error("Error creating faculty user:", error);
      console.error("Error details:", error.errors || error);

      // Handle specific error types
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists. Please use a different ${field}.`,
          error: error.message,
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error creating faculty user",
        error: error.message,
      });
    }
  },
);

// Create office staff user (DEPRECATED - use /office-staff instead)
router.post(
  "/create-office-staff",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      console.log("Creating office staff with data:", req.body);
      const { fullName, email, institution, department } = req.body;

      // Check if the institution matches the admin's institution
      if (req.user.college && req.user.college !== institution) {
        return res.status(403).json({
          success: false,
          message: "You can only create users for your own institution",
        });
      }

      // Generate username from full name (e.g., "John Doe" -> "john.doe.office")
      const username =
        fullName
          .toLowerCase()
          .replace(/\s+/g, ".") // Replace spaces with dots
          .replace(/[^a-z0-9.]/g, "") + ".office"; // Remove special characters and add .office

      // Generate employee ID
      const employeeId = `OFF${Date.now().toString().slice(-6)}`;

      // Generate random password
      const password = generateSafePassword(8);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log("Creating user with:", {
        username,
        college: institution,
        role: "office",
      });

      // Create user
      const newUser = new User({
        username,
        password: hashedPassword,
        college: institution,
        role: "office",
        department: department || null,
      });

      await newUser.save();
      console.log("User created successfully");

      // Create office staff record
      const newOfficeStaff = new OfficeStaff({
        fullName,
        email,
        employeeId,
        department: department || null,
        institution,
        generatedUsername: username,
      });

      console.log("Creating office staff record with:", {
        fullName,
        email,
        employeeId,
        department: department || null,
        institution,
        generatedUsername: username,
      });

      await newOfficeStaff.save();
      console.log("Office staff created successfully");

      res.json({
        success: true,
        username,
        password,
        message: "Office staff user created successfully",
      });
    } catch (error) {
      console.error("Error creating office staff user:", error);
      console.error("Error details:", error.errors || error);

      // Handle specific error types
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists. Please use a different ${field}.`,
          error: error.message,
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error creating office staff user",
        error: error.message,
      });
    }
  },
);

// Create Department
router.post("/departments", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, code, institution } = req.body;

    // Check if the institution matches the admin's institution
    if (req.user.college && req.user.college !== institution) {
      return res.status(403).json({
        success: false,
        message: "You can only create departments for your own institution",
      });
    }

    // Check if department with same name or code already exists
    const existingDepartmentByName = await Department.findOne({
      name,
      institution,
    });
    const existingDepartmentByCode = await Department.findOne({
      code,
      institution,
    });

    if (existingDepartmentByName) {
      return res.status(400).json({
        success: false,
        message: "Department with this name already exists in the institution",
      });
    }

    if (existingDepartmentByCode) {
      return res.status(400).json({
        success: false,
        message: "Department with this code already exists in the institution",
      });
    }

    // Create new department
    const newDepartment = new Department({
      name,
      code: code.toUpperCase(),
      institution,
      createdBy: req.user._id,
    });

    await newDepartment.save();

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: {
        _id: newDepartment._id,
        name: newDepartment.name,
        code: newDepartment.code,
        institution: newDepartment.institution,
      },
    });
  } catch (error) {
    console.error("Error creating department:", error);

    if (error.code === 11000) {
      const keyPattern = error.keyPattern || {};
      const keyValue = error.keyValue || {};

      if (keyPattern.name || keyPattern.code) {
        return res.status(409).json({
          success: false,
          message:
            "Department duplicate index conflict detected. If this happens across institutions, run `npm run fix:catalog-indexes` in backend and retry.",
          duplicateKey: keyValue,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Department already exists in this institution",
        duplicateKey: keyValue,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating department",
      error: error.message,
    });
  }
});

// Get All Departments for Institution
router.get("/departments", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;

    const departments = await Department.find({ institution }).sort({
      name: 1,
    });

    res.json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching departments",
      error: error.message,
    });
  }
});

// Delete Department
router.delete(
  "/departments/:id",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body; // Get password from request body
      const institution = req.user.college;

      // Verify that the department belongs to the admin's institution
      const department = await Department.findOne({ _id: id, institution });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found or doesn't belong to your institution",
        });
      }

      // Verify admin password
      const admin = req.user;
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password",
        });
      }

      // Delete the department
      await Department.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting department",
        error: error.message,
      });
    }
  },
);

// ============================
// FACULTY MANAGEMENT ROUTES
// ============================

// Create Faculty Profile
router.post("/faculty", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const facultyData = req.body;
    const institution = req.user.college;

    // Check if the institution matches the admin's institution
    if (facultyData.institution && facultyData.institution !== institution) {
      return res.status(403).json({
        success: false,
        message: "You can only create faculty for your own institution",
      });
    }

    // Check if email already exists
    const existingFaculty = await Faculty.findOne({
      email: facultyData.email,
      institution,
    });

    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: "Faculty with this email already exists in the institution",
      });
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Faculty.findOne({
      employeeId: facultyData.employeeId,
      institution,
    });

    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty with this employee ID already exists in the institution",
      });
    }

    // Generate username from full name (e.g., "John Smith" -> "john.smith")
    const username = facultyData.fullName
      .toLowerCase()
      .replace(/\s+/g, ".") // Replace spaces with dots
      .replace(/[^a-z0-9.]/g, ""); // Remove special characters

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      // If username exists, append employee ID or random number
      const usernameWithId = `${username}.${facultyData.employeeId.slice(-3)}`;
      const existingUserWithId = await User.findOne({
        username: usernameWithId,
      });
      if (existingUserWithId) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to generate unique username. Please contact administrator.",
        });
      }
      // Use the username with employee ID
      facultyData.generatedUsername = usernameWithId;
    } else {
      facultyData.generatedUsername = username;
    }

    // Generate random password (8 characters)
    const generatedPassword = generateSafePassword(10);

    // Hash the password for User model
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create user account first
    const newUser = new User({
      username: facultyData.generatedUsername,
      password: hashedPassword,
      college: institution,
      role: facultyData.role || "faculty",
      department: facultyData.department || null,
    });

    const savedUser = await newUser.save();

    // Create new faculty profile
    const newFaculty = new Faculty({
      fullName: facultyData.fullName,
      email: facultyData.email,
      employeeId: facultyData.employeeId,
      department: facultyData.department || null,
      institution,
      skills: facultyData.skills || [],
      whatsappPhone: facultyData.whatsappPhone || "",
      generatedUsername: facultyData.generatedUsername,
      createdBy: req.user._id,
      currentPassword: generatedPassword, // Store plain text password for admin reference
      status: facultyData.status || "active",
      role: facultyData.role || "faculty",
    });

    await newFaculty.save();

    // Populate department information
    await newFaculty.populate("department", "name code");

    res.status(201).json({
      success: true,
      message: "Faculty profile and login credentials created successfully",
      faculty: newFaculty,
      loginCredentials: {
        username: facultyData.generatedUsername,
        password: generatedPassword,
      },
    });
  } catch (error) {
    console.error("Error creating faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error creating faculty profile",
      error: error.message,
    });
  }
});

// Bulk Import Faculty Profiles
router.post(
  "/faculty/bulk-import",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { facultyList, departmentId } = req.body;
      const institution = req.user.college;

      if (!Array.isArray(facultyList) || facultyList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or empty faculty list",
        });
      }

      // Check if department exists if departmentId is provided
      if (departmentId) {
        const departmentExists = await Department.findOne({
          _id: departmentId,
          institution,
        });
        if (!departmentExists) {
          return res.status(404).json({
            success: false,
            message: "Department not found in your institution",
          });
        }
      }

      const results = {
        inserted: 0,
        skipped: 0,
        errors: [],
        generatedCredentials: [],
      };

      const baseTime = Date.now().toString().slice(-6);

      for (let i = 0; i < facultyList.length; i++) {
        const item = facultyList[i];
        const { fullName, email, whatsappPhone, skills } = item;

        if (!fullName || !email) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            name: fullName || "Unknown",
            error: "Full Name and Email are required",
          });
          continue;
        }

        const emailClean = email.toLowerCase().trim();

        // Check if email already exists in Faculty
        const existingFaculty = await Faculty.findOne({
          email: emailClean,
          institution,
        });

        if (existingFaculty) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            name: fullName,
            email: emailClean,
            error: "Faculty with this email already exists in this institution",
          });
          continue;
        }

        try {
          // Generate unique username
          let baseUsername = fullName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ".")
            .replace(/[^a-z0-9.]/g, "");

          let username = baseUsername;
          let exists = await User.findOne({ username });
          let counter = 1;
          while (exists) {
            username = `${baseUsername}${counter}`;
            exists = await User.findOne({ username });
            counter++;
          }

          // Generate employee ID (unique)
          const employeeId = `FAC${baseTime}${String(i).padStart(3, "0")}`;

          // Generate safe password
          const plainPassword = generateSafePassword(8);
          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          // Create User account document
          const newUser = new User({
            username,
            password: hashedPassword,
            college: institution,
            role: "faculty",
            department: departmentId || null,
          });

          await newUser.save();

          // Skills parsing (support both string and array)
          let parsedSkills = [];
          if (Array.isArray(skills)) {
            parsedSkills = skills;
          } else if (typeof skills === "string" && skills.trim()) {
            parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
          }

          // Phone parsing to string
          let finalPhone = "";
          if (whatsappPhone !== undefined && whatsappPhone !== null) {
            finalPhone = whatsappPhone.toString().trim();
          }

          // Create Faculty document
          const newFaculty = new Faculty({
            fullName: fullName.trim(),
            email: emailClean,
            employeeId,
            department: departmentId || null,
            institution,
            skills: parsedSkills,
            whatsappPhone: finalPhone,
            generatedUsername: username,
            currentPassword: plainPassword,
            createdBy: req.user._id,
            status: "active",
            role: "faculty",
          });

          await newFaculty.save();

          results.inserted++;
          results.generatedCredentials.push({
            fullName: fullName.trim(),
            employeeId,
            email: emailClean,
            username,
            plainPassword,
          });
        } catch (err) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            name: fullName,
            error: err.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${results.inserted} faculty. Skipped ${results.skipped}.`,
        inserted: results.inserted,
        skipped: results.skipped,
        errors: results.errors,
        generatedCredentials: results.generatedCredentials,
      });
    } catch (err) {
      console.error("Bulk import faculty error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error during bulk import",
        error: err.message,
      });
    }
  }
);

// Get All Faculty for Institution
router.get("/faculty", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { department, status, search, role } = req.query;

    let query = { institution };

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { specializations: { $in: [new RegExp(search, "i")] } },
        { subjectsTaught: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const faculty = await Faculty.find(query)
      .populate("department", "name code")
      .sort({ fullName: 1 });

    res.json({
      success: true,
      faculty,
      total: faculty.length,
    });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty",
      error: error.message,
    });
  }
});

// Get Single Faculty by ID
router.get("/faculty/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const institution = req.user.college;

    const faculty = await Faculty.findOne({ _id: id, institution })
      .populate("department", "name code")
      .populate("createdBy", "username");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.json({
      success: true,
      faculty,
    });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty",
      error: error.message,
    });
  }
});

// Update Faculty Profile
router.put("/faculty/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const institution = req.user.college;

    // Check if faculty exists and belongs to admin's institution
    const existingFaculty = await Faculty.findOne({ _id: id, institution });

    if (!existingFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found or doesn't belong to your institution",
      });
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== existingFaculty.email) {
      const emailExists = await Faculty.findOne({
        email: updateData.email,
        institution,
        _id: { $ne: id },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Faculty with this email already exists in the institution",
        });
      }
    }

    // Check if employee ID is being changed and if it's already taken
    if (
      updateData.employeeId &&
      updateData.employeeId !== existingFaculty.employeeId
    ) {
      const employeeIdExists = await Faculty.findOne({
        employeeId: updateData.employeeId,
        institution,
        _id: { $ne: id },
      });

      if (employeeIdExists) {
        return res.status(400).json({
          success: false,
          message:
            "Faculty with this employee ID already exists in the institution",
        });
      }
    }

    // Update faculty
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("department", "name code");

    // Also update the User role if role is changed
    if (updateData.role) {
      await User.findOneAndUpdate(
        { username: existingFaculty.generatedUsername },
        { role: updateData.role }
      );
    }

    res.json({
      success: true,
      message: "Faculty profile updated successfully",
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error("Error updating faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error updating faculty profile",
      error: error.message,
    });
  }
});

// Delete Faculty Profile
router.delete(
  "/faculty/:id",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const institution = req.user.college;

      // Check if faculty exists and belongs to admin's institution
      const faculty = await Faculty.findOne({ _id: id, institution });

      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found or doesn't belong to your institution",
        });
      }

      // Verify admin password
      const admin = req.user;
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password",
        });
      }

      // Delete the faculty
      await Faculty.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Faculty profile deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting faculty:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting faculty profile",
        error: error.message,
      });
    }
  },
);

// Get Faculty Statistics
router.get("/faculty-stats", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;

    const stats = await Faculty.aggregate([
      { $match: { institution } },
      {
        $group: {
          _id: null,
          totalFaculty: { $sum: 1 },
          activeFaculty: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          professors: {
            $sum: { $cond: [{ $eq: ["$designation", "Professor"] }, 1, 0] },
          },
          associateProfessors: {
            $sum: {
              $cond: [{ $eq: ["$designation", "Associate Professor"] }, 1, 0],
            },
          },
          assistantProfessors: {
            $sum: {
              $cond: [{ $eq: ["$designation", "Assistant Professor"] }, 1, 0],
            },
          },
          lecturers: {
            $sum: { $cond: [{ $eq: ["$designation", "Lecturer"] }, 1, 0] },
          },
          averageExperience: { $avg: "$experience.years" },
        },
      },
    ]);

    const departmentStats = await Faculty.aggregate([
      { $match: { institution } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $group: {
          _id: "$dept.name",
          count: { $sum: 1 },
          departmentCode: { $first: "$dept.code" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statsObj = stats[0] || {
      totalFaculty: 0,
      activeFaculty: 0,
      professors: 0,
      associateProfessors: 0,
      assistantProfessors: 0,
      lecturers: 0,
      averageExperience: 0,
    };
    statsObj.departmentsWithFaculty = departmentStats.length;

    res.json({
      success: true,
      stats: statsObj,
      departmentStats,
    });
  } catch (error) {
    console.error("Error fetching faculty stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty statistics",
      error: error.message,
    });
  }
});

// ============================
// FACULTY CREDENTIAL MANAGEMENT ROUTES
// ============================

// Get Faculty Login Credentials
router.get(
  "/faculty-credentials",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const institution = req.user.college;

      const faculty = await Faculty.find({ institution })
        .populate("department", "name code")
        .select(
          "fullName email employeeId generatedUsername currentPassword department status",
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        credentials: faculty,
      });
    } catch (error) {
      console.error("Error fetching faculty credentials:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching faculty credentials",
        error: error.message,
      });
    }
  },
);

// Reset Faculty Password
router.post(
  "/faculty/:id/reset-password",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const institution = req.user.college;

      // Find faculty
      const faculty = await Faculty.findOne({ _id: id, institution });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found",
        });
      }

      // Find user account
      const user = await User.findOne({ username: faculty.generatedUsername });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Generate new password
      const newPassword = generateSafePassword(10);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      user.password = hashedPassword;
      await user.save();

      // Update faculty current password
      faculty.currentPassword = newPassword;
      await faculty.save();

      res.json({
        success: true,
        message: "Password reset successfully",
        newCredentials: {
          username: faculty.generatedUsername,
          password: newPassword,
        },
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting password",
        error: error.message,
      });
    }
  },
);

// Update Faculty Username
router.put(
  "/faculty/:id/username",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newUsername } = req.body;
      const institution = req.user.college;

      // Validate username format
      if (!newUsername || !/^[a-z0-9.]+$/.test(newUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must contain only lowercase letters, numbers, and dots",
        });
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Find faculty
      const faculty = await Faculty.findOne({ _id: id, institution });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found",
        });
      }

      // Find and update user account
      const user = await User.findOne({ username: faculty.generatedUsername });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Update username
      user.username = newUsername;
      await user.save();

      // Update faculty record
      faculty.generatedUsername = newUsername;
      await faculty.save();

      res.json({
        success: true,
        message: "Username updated successfully",
        newUsername,
      });
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({
        success: false,
        message: "Error updating username",
        error: error.message,
      });
    }
  },
);

// Update Faculty Password
router.put(
  "/faculty/:id/password",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const institution = req.user.college;

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Find faculty
      const faculty = await Faculty.findOne({ _id: id, institution });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found",
        });
      }

      // Find and update user account
      const user = await User.findOne({ username: faculty.generatedUsername });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      await user.save();

      // Update faculty record with plain text password for display
      faculty.currentPassword = newPassword;
      await faculty.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({
        success: false,
        message: "Error updating password",
        error: error.message,
      });
    }
  },
);

// Update Faculty Department Assignment
router.put(
  "/faculty/:id/department",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;
      const institution = req.user.college;

      // Find faculty
      const faculty = await Faculty.findOne({ _id: id, institution });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found",
        });
      }

      // If departmentId is provided, verify it exists and belongs to the institution
      if (departmentId) {
        const department = await Department.findOne({
          _id: departmentId,
          institution,
        });
        if (!department) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }
      }

      // Update faculty department
      faculty.department = departmentId || null;
      await faculty.save();

      // Populate department information for response
      await faculty.populate("department", "name code");

      res.json({
        success: true,
        message: departmentId
          ? "Faculty assigned to department successfully"
          : "Faculty removed from department successfully",
        faculty,
      });
    } catch (error) {
      console.error("Error updating faculty department:", error);
      res.status(500).json({
        success: false,
        message: "Error updating faculty department",
        error: error.message,
      });
    }
  },
);

// ============================
// OFFICE STAFF MANAGEMENT ROUTES
// ============================

// Create Office Staff Profile
router.post("/office-staff", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const staffData = req.body;
    const institution = req.user.college;

    // Check if the institution matches the admin's institution
    if (staffData.institution && staffData.institution !== institution) {
      return res.status(403).json({
        success: false,
        message: "You can only create office staff for your own institution",
      });
    }

    // Check if email already exists
    const existingStaff = await OfficeStaff.findOne({
      email: staffData.email,
      institution,
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message:
          "Office staff with this email already exists in the institution",
      });
    }

    // Generate employee ID if not provided
    let employeeId = staffData.employeeId;
    if (!employeeId) {
      const currentYear = new Date().getFullYear();
      const instituteCode = institution;
      try {
        const existingStaff = await OfficeStaff.find({ institution });
        const lastNumber =
          existingStaff.length > 0
            ? Math.max(
              ...existingStaff.map((s) => {
                const match = s.employeeId?.match(
                  new RegExp(`${currentYear}${instituteCode}(\\d+)`),
                );
                return match ? parseInt(match[1]) : 0;
              }),
            )
            : 0;
        const nextNumber = (lastNumber + 1).toString().padStart(2, "0");
        employeeId = `${currentYear}${instituteCode}${nextNumber}`;
      } catch (err) {
        employeeId = `${currentYear}${instituteCode}01`;
      }
    }

    // Check if employee ID already exists
    const existingEmployeeId = await OfficeStaff.findOne({
      employeeId: employeeId,
      institution,
    });

    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message:
          "Office staff with this employee ID already exists in the institution",
      });
    }

    // Generate username from full name (e.g., "John Smith" -> "john.smith.office")
    const username =
      staffData.fullName
        .toLowerCase()
        .replace(/\s+/g, ".") // Replace spaces with dots
        .replace(/[^a-z0-9.]/g, "") + ".office"; // Remove special characters and add .office

    // Check if username already exists
    let finalUsername = username;
    const existingUser = await User.findOne({ username: finalUsername });
    if (existingUser) {
      // If username exists, append employee ID or random number
      finalUsername = `${username}.${employeeId.slice(-3)}`;
      const existingUserWithId = await User.findOne({
        username: finalUsername,
      });
      if (existingUserWithId) {
        // Try with timestamp
        finalUsername = `${username}.${Date.now().toString().slice(-4)}`;
        const existingUserWithTimestamp = await User.findOne({
          username: finalUsername,
        });
        if (existingUserWithTimestamp) {
          return res.status(400).json({
            success: false,
            message:
              "Unable to generate unique username. Please contact administrator.",
          });
        }
      }
    }
    staffData.generatedUsername = finalUsername;

    // Generate random password (8 characters)
    const generatedPassword = generateSafePassword(10);

    // Hash the password for User model
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create user account first
    const newUser = new User({
      username: staffData.generatedUsername,
      password: hashedPassword,
      college: institution,
      role: "office",
      department: staffData.department || null,
    });

    const savedUser = await newUser.save();

    // Create new office staff profile
    const newOfficeStaff = new OfficeStaff({
      fullName: staffData.fullName,
      email: staffData.email,
      employeeId: employeeId,
      department: staffData.department || null,
      institution,
      generatedUsername: staffData.generatedUsername,
      createdBy: req.user._id,
      currentPassword: generatedPassword, // Store plain text password for admin access
      status: staffData.status || "active",
    });

    await newOfficeStaff.save();

    // Populate department information
    await newOfficeStaff.populate("department", "name code");

    res.status(201).json({
      success: true,
      message:
        "Office staff profile and login credentials created successfully",
      username: staffData.generatedUsername,
      password: generatedPassword,
      officeStaff: newOfficeStaff,
      loginCredentials: {
        username: staffData.generatedUsername,
        password: generatedPassword,
      },
    });
  } catch (error) {
    console.error("Error creating office staff:", error);
    res.status(500).json({
      success: false,
      message: "Error creating office staff profile",
      error: error.message,
    });
  }
});

// Get All Office Staff for Institution
router.get("/office-staff", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { department, status, search } = req.query;

    if (!institution) {
      return res.status(400).json({
        success: false,
        message: "Institution not found in user data",
      });
    }

    let query = { institution };

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    // Check if OfficeStaff model is available
    if (!OfficeStaff) {
      console.error("OfficeStaff model is not defined");
      return res.status(500).json({
        success: false,
        message: "OfficeStaff model not available",
      });
    }

    const officeStaff = await OfficeStaff.find(query)
      .populate("department", "name code")
      .sort({ fullName: 1 });

    res.json({
      success: true,
      officeStaff: officeStaff || [],
      total: officeStaff ? officeStaff.length : 0,
    });
  } catch (error) {
    console.error("Error fetching office staff:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching office staff",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get Single Office Staff by ID
router.get(
  "/office-staff/:id",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const institution = req.user.college;

      const officeStaff = await OfficeStaff.findOne({ _id: id, institution })
        .populate("department", "name code")
        .populate("createdBy", "username");

      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      res.json({
        success: true,
        officeStaff,
      });
    } catch (error) {
      console.error("Error fetching office staff:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching office staff",
        error: error.message,
      });
    }
  },
);

// Update Office Staff Profile
router.put(
  "/office-staff/:id",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const institution = req.user.college;

      // Check if office staff exists and belongs to admin's institution
      const existingOfficeStaff = await OfficeStaff.findOne({
        _id: id,
        institution,
      });

      if (!existingOfficeStaff) {
        return res.status(404).json({
          success: false,
          message:
            "Office staff not found or doesn't belong to your institution",
        });
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== existingOfficeStaff.email) {
        const emailExists = await OfficeStaff.findOne({
          email: updateData.email,
          institution,
          _id: { $ne: id },
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message:
              "Office staff with this email already exists in the institution",
          });
        }
      }

      // Check if employee ID is being changed and if it's already taken
      if (
        updateData.employeeId &&
        updateData.employeeId !== existingOfficeStaff.employeeId
      ) {
        const employeeIdExists = await OfficeStaff.findOne({
          employeeId: updateData.employeeId,
          institution,
          _id: { $ne: id },
        });

        if (employeeIdExists) {
          return res.status(400).json({
            success: false,
            message:
              "Office staff with this employee ID already exists in the institution",
          });
        }
      }

      // Update office staff
      const updatedOfficeStaff = await OfficeStaff.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).populate("department", "name code");

      res.json({
        success: true,
        message: "Office staff profile updated successfully",
        officeStaff: updatedOfficeStaff,
      });
    } catch (error) {
      console.error("Error updating office staff:", error);
      res.status(500).json({
        success: false,
        message: "Error updating office staff profile",
        error: error.message,
      });
    }
  },
);

// Delete Office Staff Profile
router.delete(
  "/office-staff/:id",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const institution = req.user.college;

      // Check if office staff exists and belongs to admin's institution
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });

      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message:
            "Office staff not found or doesn't belong to your institution",
        });
      }

      // Verify admin password
      const admin = req.user;
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password",
        });
      }

      // Delete the office staff
      await OfficeStaff.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Office staff profile deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting office staff:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting office staff profile",
        error: error.message,
      });
    }
  },
);

// Get Office Staff Statistics
router.get(
  "/office-staff-stats",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const institution = req.user.college;

      if (!institution) {
        return res.status(400).json({
          success: false,
          message: "Institution not found in user data",
        });
      }

      // Check if OfficeStaff model is available
      if (!OfficeStaff) {
        console.error("OfficeStaff model is not defined");
        return res.status(500).json({
          success: true,
          stats: {
            totalStaff: 0,
            activeStaff: 0,
          },
          departmentStats: [],
        });
      }

      const stats = await OfficeStaff.aggregate([
        { $match: { institution } },
        {
          $group: {
            _id: null,
            totalStaff: { $sum: 1 },
            activeStaff: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
          },
        },
      ]);

      // Get department stats - simplified to avoid aggregation issues
      const allOfficeStaff = await OfficeStaff.find({ institution })
        .populate("department", "name code")
        .select("department");

      const deptMap = {};
      allOfficeStaff.forEach((staff) => {
        if (staff.department) {
          const deptName = staff.department.name;
          if (!deptMap[deptName]) {
            deptMap[deptName] = {
              _id: deptName,
              count: 0,
              departmentCode: staff.department.code,
            };
          }
          deptMap[deptName].count++;
        }
      });

      const departmentStats = Object.values(deptMap).sort(
        (a, b) => b.count - a.count,
      );

      res.json({
        success: true,
        stats: stats[0] || {
          totalStaff: 0,
          activeStaff: 0,
        },
        departmentStats: departmentStats || [],
      });
    } catch (error) {
      console.error("Error fetching office staff stats:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error fetching office staff statistics",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// Update Office Staff Department Assignment
router.put(
  "/office-staff/:id/department",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;
      const institution = req.user.college;

      // Find office staff
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });
      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      // If departmentId is provided, verify it exists and belongs to the institution
      if (departmentId) {
        const department = await Department.findOne({
          _id: departmentId,
          institution,
        });
        if (!department) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }
      }

      // Update office staff department
      officeStaff.department = departmentId || null;
      await officeStaff.save();

      // Populate department information for response
      await officeStaff.populate("department", "name code");

      res.json({
        success: true,
        message: departmentId
          ? "Office staff assigned to department successfully"
          : "Office staff removed from department successfully",
        officeStaff,
      });
    } catch (error) {
      console.error("Error updating office staff department:", error);
      res.status(500).json({
        success: false,
        message: "Error updating office staff department",
        error: error.message,
      });
    }
  },
);

// ============================
// OFFICE STAFF CREDENTIAL MANAGEMENT ROUTES
// ============================

// Get Office Staff Login Credentials
router.get(
  "/office-staff-credentials",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const institution = req.user.college;

      const officeStaff = await OfficeStaff.find({ institution })
        .populate("department", "name code")
        .select(
          "fullName email employeeId generatedUsername currentPassword department status",
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        credentials: officeStaff,
      });
    } catch (error) {
      console.error("Error fetching office staff credentials:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching office staff credentials",
        error: error.message,
      });
    }
  },
);

// Reset Office Staff Password
router.post(
  "/office-staff/:id/reset-password",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const institution = req.user.college;

      // Find office staff
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });
      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      // Find user account
      const user = await User.findOne({
        username: officeStaff.generatedUsername,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Generate new password
      const newPassword = generateSafePassword(10);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      user.password = hashedPassword;
      await user.save();

      // Update office staff current password
      officeStaff.currentPassword = newPassword;
      await officeStaff.save();

      res.json({
        success: true,
        message: "Password reset successfully",
        newCredentials: {
          username: officeStaff.generatedUsername,
          password: newPassword,
        },
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting password",
        error: error.message,
      });
    }
  },
);

// Update Office Staff Username
router.put(
  "/office-staff/:id/username",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newUsername } = req.body;
      const institution = req.user.college;

      // Validate username format
      if (!newUsername || !/^[a-z0-9.]+$/.test(newUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must contain only lowercase letters, numbers, and dots",
        });
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Find office staff
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });
      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      // Find and update user account
      const user = await User.findOne({
        username: officeStaff.generatedUsername,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Update username
      user.username = newUsername;
      await user.save();

      // Update office staff record
      officeStaff.generatedUsername = newUsername;
      await officeStaff.save();

      res.json({
        success: true,
        message: "Username updated successfully",
        newUsername,
      });
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({
        success: false,
        message: "Error updating username",
        error: error.message,
      });
    }
  },
);

// Update Office Staff Password
router.put(
  "/office-staff/:id/password",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const institution = req.user.college;

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Find office staff
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });
      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      // Find and update user account
      const user = await User.findOne({
        username: officeStaff.generatedUsername,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      await user.save();

      // Update office staff record with plain text password for display
      officeStaff.currentPassword = newPassword;
      await officeStaff.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({
        success: false,
        message: "Error updating password",
        error: error.message,
      });
    }
  },
);

// Get All Faculty (DEBUG - no institution filter)
router.get("/faculty-all-debug", async (req, res) => {
  try {
    const allFaculty = await Faculty.find({}).sort({
      fullName: 1,
    });

    console.log("All faculty in database:");
    allFaculty.forEach((f) => {
      console.log(
        `- ${f.fullName} (${f._id}): institution = ${f.institution}, department = ${f.department}`,
      );
    });

    res.json({
      success: true,
      faculty: allFaculty,
      count: allFaculty.length,
    });
  } catch (error) {
    console.error("Error fetching all faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty",
      error: error.message,
    });
  }
});

// Get Faculty and Office Staff by Department
router.get(
  "/departments/:id/faculty",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const institution = req.user.college;

      console.log(
        "Looking for department with ID:",
        id,
        "in institution:",
        institution,
      );

      // Verify department exists and belongs to institution
      const department = await Department.findOne({ _id: id, institution });
      console.log(
        "Department found:",
        department ? department.name : "NOT FOUND",
      );

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Get faculty assigned to this department
      const faculty = await Faculty.find({
        department: id,
        institution,
      })
        .populate("department", "name code")
        .sort({ fullName: 1 });

      console.log(
        `Found ${faculty.length} faculty assigned to department ${id}`,
      );
      faculty.forEach((f) => console.log(`- ${f.fullName} (${f.institution})`));

      // Get office staff assigned to this department
      const officeStaff = await OfficeStaff.find({
        department: id,
        institution,
      })
        .populate("department", "name code")
        .sort({ fullName: 1 });

      console.log(
        `Found ${officeStaff.length} office staff assigned to department ${id}`,
      );
      officeStaff.forEach((o) =>
        console.log(`- ${o.fullName} (${o.institution})`),
      );

      // Combine faculty and office staff
      const assignedStaff = [
        ...faculty.map((f) => ({ ...f.toObject(), staffType: "faculty" })),
        ...officeStaff.map((o) => ({ ...o.toObject(), staffType: "office" })),
      ].sort((a, b) => a.fullName.localeCompare(b.fullName));

      // Get faculty not assigned to any department
      const unassignedFaculty = await Faculty.find({
        $or: [
          { department: { $exists: false } },
          { department: null },
          { department: undefined },
        ],
        institution,
      })
        .populate("department", "name code")
        .sort({ fullName: 1 });

      console.log(`Found ${unassignedFaculty.length} unassigned faculty`);
      unassignedFaculty.forEach((f) =>
        console.log(`- ${f.fullName} (${f.institution})`),
      );

      // Get office staff not assigned to any department
      const unassignedOfficeStaff = await OfficeStaff.find({
        $or: [
          { department: { $exists: false } },
          { department: null },
          { department: undefined },
        ],
        institution,
      })
        .populate("department", "name code")
        .sort({ fullName: 1 });

      console.log(
        `Found ${unassignedOfficeStaff.length} unassigned office staff`,
      );
      unassignedOfficeStaff.forEach((o) =>
        console.log(`- ${o.fullName} (${o.institution})`),
      );

      // Combine unassigned staff
      const unassignedStaff = [
        ...unassignedFaculty.map((f) => ({
          ...f.toObject(),
          staffType: "faculty",
        })),
        ...unassignedOfficeStaff.map((o) => ({
          ...o.toObject(),
          staffType: "office",
        })),
      ].sort((a, b) => a.fullName.localeCompare(b.fullName));

      console.log(
        `Department ${id}: Found ${assignedStaff.length} assigned staff (${faculty.length} faculty, ${officeStaff.length} office), ${unassignedStaff.length} unassigned staff`,
      );

      res.json({
        success: true,
        department,
        assignedFaculty: assignedStaff, // Keeping the key for backward compatibility but now includes both types
        unassignedFaculty: unassignedStaff, // Keeping the key for backward compatibility
      });
    } catch (error) {
      console.error("Error fetching department faculty:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching department faculty",
        error: error.message,
      });
    }
  },
);

// Transfer Faculty between Departments
router.put(
  "/faculty/:id/transfer",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { fromDepartmentId, toDepartmentId } = req.body;
      const institution = req.user.college;

      // Find faculty
      const faculty = await Faculty.findOne({ _id: id, institution });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found",
        });
      }

      // Verify current department assignment
      if (
        fromDepartmentId &&
        faculty.department?.toString() !== fromDepartmentId
      ) {
        return res.status(400).json({
          success: false,
          message: "Faculty is not assigned to the specified department",
        });
      }

      // If transferring to a department, verify it exists
      if (toDepartmentId) {
        const toDepartment = await Department.findOne({
          _id: toDepartmentId,
          institution,
        });
        if (!toDepartment) {
          return res.status(404).json({
            success: false,
            message: "Target department not found",
          });
        }
      }

      // Update faculty department
      faculty.department = toDepartmentId || null;
      await faculty.save();

      // Populate department information for response
      await faculty.populate("department", "name code");

      res.json({
        success: true,
        message: toDepartmentId
          ? "Faculty transferred successfully"
          : "Faculty removed from department successfully",
        faculty,
      });
    } catch (error) {
      console.error("Error transferring faculty:", error);
      res.status(500).json({
        success: false,
        message: "Error transferring faculty",
        error: error.message,
      });
    }
  },
);

// Transfer Office Staff between Departments
router.put(
  "/office-staff/:id/transfer",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { fromDepartmentId, toDepartmentId } = req.body;
      const institution = req.user.college;

      // Find office staff
      const officeStaff = await OfficeStaff.findOne({ _id: id, institution });
      if (!officeStaff) {
        return res.status(404).json({
          success: false,
          message: "Office staff not found",
        });
      }

      // Verify current department assignment
      if (
        fromDepartmentId &&
        officeStaff.department?.toString() !== fromDepartmentId
      ) {
        return res.status(400).json({
          success: false,
          message: "Office staff is not assigned to the specified department",
        });
      }

      // If transferring to a department, verify it exists
      if (toDepartmentId) {
        const toDepartment = await Department.findOne({
          _id: toDepartmentId,
          institution,
        });
        if (!toDepartment) {
          return res.status(404).json({
            success: false,
            message: "Target department not found",
          });
        }
      }

      // Update office staff department
      officeStaff.department = toDepartmentId || null;
      await officeStaff.save();

      // Populate department information for response
      await officeStaff.populate("department", "name code");

      res.json({
        success: true,
        message: toDepartmentId
          ? "Office staff transferred successfully"
          : "Office staff removed from department successfully",
        officeStaff,
      });
    } catch (error) {
      console.error("Error transferring office staff:", error);
      res.status(500).json({
        success: false,
        message: "Error transferring office staff",
        error: error.message,
      });
    }
  },
);

const DEFAULT_POS = [
  {
    code: "PO 1",
    name: "Basic and Discipline specific knowledge",
    description: "Apply knowledge of basic mathematics, science and engineering fundamentals and engineering specialization to solve the engineering problems."
  },
  {
    code: "PO 2",
    name: "Problem analysis",
    description: "Identify and analyse well-defined engineering problems using codified standard methods."
  },
  {
    code: "PO 3",
    name: "Design/ development of solutions",
    description: "Design solutions for well-defined technical problems and assist with the design of systems components or processes to meet specified needs."
  },
  {
    code: "PO 4",
    name: "Engineering Tools, Experimentation and Testing",
    description: "Apply modern engineering tools and appropriate technique to conduct standard tests and measurements."
  },
  {
    code: "PO 5",
    name: "Engineering practices for society, sustainability and environment",
    description: "Apply appropriate technology in context of society, sustainability, environment and ethical practices."
  },
  {
    code: "PO 6",
    name: "Project Management",
    description: "Use engineering management principles individually, as a team member or a leader to manage projects and effectively communicate about well-defined engineering activities."
  },
  {
    code: "PO 7",
    name: "Life-long learning",
    description: "Ability to analyse individual needs and engage in updating in the context of technological changes."
  }
];

const DEFAULT_PSOS = [
  {
    code: "PSO 1",
    name: "Computer Software and Hardware Usage",
    description: "Use state-of-the-art technologies for operation and application of computer software and hardware."
  },
  {
    code: "PSO 2",
    name: "Computer Engineering Maintenance",
    description: "Maintain computer engineering related software and hardware systems."
  }
];

const mongoose = require("mongoose");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /admin/vision-mission
router.get("/vision-mission", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institutionCode = req.user.college;
    let departmentId = req.query.departmentId;
    if (!departmentId || departmentId === "null" || departmentId === "undefined" || departmentId === "") {
      departmentId = null;
    }
    if (departmentId && !isValidObjectId(departmentId)) {
      departmentId = null;
    }

    let config = await VisionMission.findOne({ institutionCode, departmentId });

    if (!config) {
      const isDept = departmentId !== null;
      config = {
        institutionCode,
        departmentId,
        vision: "",
        mission: [],
        peos: isDept ? ["", "", ""] : [],
        pos: isDept ? DEFAULT_POS : [],
        psos: isDept ? DEFAULT_PSOS : []
      };
    }

    res.json({
      success: true,
      data: config
    });
  } catch (err) {
    console.error("Error fetching vision-mission configuration:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching configuration",
      error: err.message
    });
  }
});

// POST /admin/vision-mission
router.post("/vision-mission", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institutionCode = req.user.college;
    let { departmentId, vision, mission, peos, pos, psos } = req.body;
    if (!departmentId || departmentId === "null" || departmentId === "undefined" || departmentId === "") {
      departmentId = null;
    }
    if (departmentId && !isValidObjectId(departmentId)) {
      departmentId = null;
    }

    if (!vision) {
      return res.status(400).json({
        success: false,
        message: "Vision is required"
      });
    }

    const updatedConfig = await VisionMission.findOneAndUpdate(
      { institutionCode, departmentId },
      {
        institutionCode,
        departmentId,
        vision,
        mission: mission || [],
        peos: peos || [],
        pos: pos || [],
        psos: psos || [],
        createdBy: req.user._id
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Configuration saved successfully",
      data: updatedConfig
    });
  } catch (err) {
    console.error("Error saving vision-mission configuration:", err);
    res.status(500).json({
      success: false,
      message: "Error saving configuration",
      error: err.message
    });
  }
});

// GET /admin/classrooms
router.get("/classrooms", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const classrooms = await Classroom.find({ institution }).sort({ name: 1 });
    res.json({ success: true, classrooms });
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    res.status(500).json({ success: false, message: "Error fetching classrooms", error: err.message });
  }
});

// POST /admin/classrooms
router.post("/classrooms", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Classroom name is required" });
    }

    const classroom = new Classroom({
      name: name.trim(),
      institution,
    });
    await classroom.save();
    res.json({ success: true, message: "Classroom added successfully", classroom });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Classroom already exists" });
    }
    console.error("Error adding classroom:", err);
    res.status(500).json({ success: false, message: "Error adding classroom", error: err.message });
  }
});

// DELETE /admin/classrooms/:id
router.delete("/classrooms/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const result = await Classroom.findOneAndDelete({ _id: req.params.id, institution });
    if (!result) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }
    res.json({ success: true, message: "Classroom deleted successfully" });
  } catch (err) {
    console.error("Error deleting classroom:", err);
    res.status(500).json({ success: false, message: "Error deleting classroom", error: err.message });
  }
});

// GET /admin/labs
router.get("/labs", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const labs = await Lab.find({ institution }).sort({ name: 1 });
    res.json({ success: true, labs });
  } catch (err) {
    console.error("Error fetching labs:", err);
    res.status(500).json({ success: false, message: "Error fetching labs", error: err.message });
  }
});

// POST /admin/labs
router.post("/labs", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Lab name is required" });
    }

    const lab = new Lab({
      name: name.trim(),
      institution,
    });
    await lab.save();
    res.json({ success: true, message: "Lab added successfully", lab });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Lab already exists" });
    }
    console.error("Error adding lab:", err);
    res.status(500).json({ success: false, message: "Error adding lab", error: err.message });
  }
});

// DELETE /admin/labs/:id
router.delete("/labs/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const result = await Lab.findOneAndDelete({ _id: req.params.id, institution });
    if (!result) {
      return res.status(404).json({ success: false, message: "Lab not found" });
    }
    res.json({ success: true, message: "Lab deleted successfully" });
  } catch (err) {
    console.error("Error deleting lab:", err);
    res.status(500).json({ success: false, message: "Error deleting lab", error: err.message });
  }
});

// GET /admin/promotions/eligible-students
// Fetch all students matching department, course, and division for promotion
router.get("/promotions/eligible-students", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { departmentId, courseId, divisionId } = req.query;

    if (!departmentId || !courseId || !divisionId) {
      return res.status(400).json({ success: false, message: "Department, Course, and Division are required" });
    }

    const query = {
      institution,
      departmentId,
      courseId,
      divisionId
    };

    const students = await Student.find(query).sort({ studentName: 1 });
    res.json({ success: true, students });
  } catch (err) {
    console.error("Error fetching eligible students for promotion:", err);
    res.status(500).json({ success: false, message: "Error fetching students", error: err.message });
  }
});

// POST /admin/promotions/promote
// Promote list of students to target department, course, division, and academic year
router.post("/promotions/promote", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const {
      sourceDepartmentId,
      sourceCourseId,
      sourceDivisionId,
      targetDepartmentId,
      targetCourseId,
      targetDivisionId,
      targetAcademicYear,
      studentIds
    } = req.body;

    if (!sourceDepartmentId || !sourceCourseId || !sourceDivisionId || !targetDepartmentId || !targetCourseId || !targetDivisionId || !targetAcademicYear || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "All source/target parameters and a non-empty studentIds array are required" });
    }

    // Resolve source and target semesters
    const sourceCourse = await Course.findById(sourceCourseId);
    const targetCourse = await Course.findById(targetCourseId);

    if (!sourceCourse || !targetCourse) {
      return res.status(400).json({ success: false, message: "Source or Target Course not found" });
    }

    const sourceSemester = sourceCourse.semester;
    const targetSemester = targetCourse.semester;

    // Process students promotion
    let promotedCount = 0;
    const adminUsername = req.user.username || "admin";

    for (const studentId of studentIds) {
      const student = await Student.findOne({ _id: studentId, institution });
      if (!student) continue;

      // 1. Create history log for the previous semester (which is now completed)
      try {
        let oldDivisionId = student.divisionId;
        if (!oldDivisionId && student.division) {
          const divDoc = await Division.findOne({ 
            name: { $regex: new RegExp(`^${student.division.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
            institution 
          });
          if (divDoc) oldDivisionId = divDoc._id;
        }

        await StudentAcademicHistory.findOneAndUpdate(
          {
            studentId: student._id,
            academicYear: student.academicYear || "unknown",
            semester: sourceSemester
          },
          {
            studentId: student._id,
            academicYear: student.academicYear || "unknown",
            semester: sourceSemester,
            divisionId: oldDivisionId,
            rollNo: student.rollNo,
            seatNo: student.seatNo || "",
            status: "completed",
            promotedAt: new Date(),
            promotedBy: adminUsername
          },
          { upsert: true, new: true }
        );
      } catch (historyErr) {
        console.error(`Error writing completed history for student ${student.enrollmentNo}:`, historyErr.message);
      }

      // 2. Update Student Master Document
      const oldAcademicYear = student.academicYear;
      student.departmentId = targetDepartmentId;
      student.courseId = targetCourseId;
      student.divisionId = targetDivisionId;
      student.academicYear = targetAcademicYear;
      student.seatNo = ""; // reset exam seat number for the new year
      await student.save();

      // 3. Create active history log for the promoted new semester
      try {
        await StudentAcademicHistory.findOneAndUpdate(
          {
            studentId: student._id,
            academicYear: targetAcademicYear,
            semester: targetSemester
          },
          {
            studentId: student._id,
            academicYear: targetAcademicYear,
            semester: targetSemester,
            divisionId: targetDivisionId,
            rollNo: student.rollNo,
            seatNo: "",
            status: "active",
            promotedAt: new Date(),
            promotedBy: adminUsername
          },
          { upsert: true, new: true }
        );
      } catch (historyErr2) {
        console.error(`Error writing active history for student ${student.enrollmentNo}:`, historyErr2.message);
      }

      promotedCount++;
    }

    // 4. Lock/Archive Ciann records for the source division of the old semester
    const sourceDivision = await Division.findById(sourceDivisionId);
    if (sourceDivision) {
      // Find one of the promoted students to get their old academic year if they had it
      // otherwise fallback to the current academic year calculated or standard logic
      const sampleStudent = await Student.findById(studentIds[0]);
      const oldAcadYearFilter = sampleStudent ? sampleStudent.academicYear : targetAcademicYear;

      const ciannUpdateResult = await Ciann.updateMany(
        {
          college: institution,
          division: sourceDivision.name,
          semester: String(sourceSemester)
        },
        { $set: { status: "completed" } }
      );
      console.log(`[PROMOTION] Locked Ciann records for division ${sourceDivision.name}, sem ${sourceSemester}. Count:`, ciannUpdateResult.modifiedCount);
    }

    res.json({
      success: true,
      message: `Successfully promoted ${promotedCount} students.`,
      promotedCount
    });
  } catch (err) {
    console.error("Error promoting students:", err);
    res.status(500).json({ success: false, message: "Error performing promotions", error: err.message });
  }
});

// GET /admin/archive/semesters
// Retrieve list of unique semesters/divisions for freezing/archiving
router.get("/archive/semesters", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const cianns = await Ciann.find({ college: institution })
      .select("academicYear division semester status")
      .lean();

    const groupsMap = {};
    cianns.forEach((c) => {
      const key = `${c.academicYear}-${c.division}-${c.semester}`;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          academicYear: c.academicYear,
          division: c.division,
          semester: c.semester,
          status: c.status || "active",
          count: 0
        };
      }
      groupsMap[key].count++;
    });

    const semestersList = Object.values(groupsMap).sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return b.academicYear.localeCompare(a.academicYear);
      }
      return a.division.localeCompare(b.division);
    });

    res.json({ success: true, semesters: semestersList });
  } catch (err) {
    console.error("Error fetching semester archive list:", err);
    res.status(500).json({ success: false, message: "Error fetching semester lists", error: err.message });
  }
});

// POST /admin/archive/freeze
// Freeze, unfreeze, or archive Ciann documents for a specific semester
router.post("/archive/freeze", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const institution = req.user.college;
    const { academicYear, division, semester, action } = req.body;

    if (!academicYear || !division || !semester || !action) {
      return res.status(400).json({ success: false, message: "Academic Year, Division, Semester, and Action are required" });
    }

    let status = "active";
    if (action === "freeze") status = "completed";
    if (action === "unfreeze") status = "active";
    if (action === "archive") status = "archived";

    const result = await Ciann.updateMany(
      {
        college: institution,
        academicYear,
        division,
        semester
      },
      { $set: { status } }
    );

    res.json({
      success: true,
      message: `Successfully updated status to '${status}' for ${result.modifiedCount} CIANN sheets.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error freezing/unfreezing semester:", err);
    res.status(500).json({ success: false, message: "Error updating semester status", error: err.message });
  }
});

module.exports = router;
