const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Institution = require("../models/Institution");
const User = require("../models/user");
const { authenticate, authorizeSuperAdmin } = require("../middleware/auth");
const enhancedSecurity = require("../middleware/enhancedSecurity");

// Apply authentication middleware to all routes
router.use(authenticate, authorizeSuperAdmin);

// Debug route to test if the route is being hit
router.get("/debug/institution/:id", async (req, res) => {
  console.log(
    "DEBUG GET /debug/institution/:id called with id:",
    req.params.id,
  );
  try {
    const institution = await Institution.findById(req.params.id);
    console.log("DEBUG Found institution:", institution);
    if (!institution) {
      console.log("DEBUG Institution not found");
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    // Exclude password field
    const institutionData = {
      _id: institution._id,
      name: institution.name,
      code: institution.code,
      adminUsername: institution.adminUsername,
      palette: institution.palette,
      createdAt: institution.createdAt,
    };

    res.json({
      success: true,
      institution: institutionData,
    });
  } catch (error) {
    console.error("DEBUG Error fetching institution:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching institution",
      error: error.message,
    });
  }
});

// Get a single institution by ID
router.get("/institution/:id", async (req, res) => {
  console.log("GET /institution/:id called with id:", req.params.id);
  try {
    const institution = await Institution.findById(req.params.id);
    console.log("Found institution:", institution);
    if (!institution) {
      console.log("Institution not found");
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    // Exclude password field
    const institutionData = {
      _id: institution._id,
      name: institution.name,
      code: institution.code,
      adminUsername: institution.adminUsername,
      palette: institution.palette,
      createdAt: institution.createdAt,
    };

    res.json({
      success: true,
      institution: institutionData,
    });
  } catch (error) {
    console.error("Error fetching institution:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching institution",
      error: error.message,
    });
  }
});

// Create a new institution with admin credentials
router.post("/create-institution", async (req, res) => {
  try {
    const { name, code, adminUsername, adminPassword, palette } = req.body;

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [{ name }, { code }],
    });

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: "Institution with this name or code already exists",
      });
    }

    // Generate admin credentials if not provided
    let finalAdminUsername, finalAdminPassword, hashedPassword;

    if (adminUsername && adminPassword) {
      // Use provided credentials
      finalAdminUsername = adminUsername;
      finalAdminPassword = adminPassword;
      hashedPassword = await bcrypt.hash(adminPassword, 10);
    } else {
      // Generate credentials
      finalAdminUsername = `${code.toLowerCase()}.admin`;
      finalAdminPassword = Math.random().toString(36).slice(-10);
      hashedPassword = await bcrypt.hash(finalAdminPassword, 10);
    }

    // Create institution record
    const newInstitution = new Institution({
      name,
      code,
      adminUsername: finalAdminUsername,
      adminPassword: hashedPassword,
      ...(palette ? { palette } : {}),
    });

    await newInstitution.save();

    // Also create the admin user in the User collection
    // For institution admins, we'll set the role to 'admin' and college to the institution code
    const adminUser = new User({
      username: finalAdminUsername,
      password: hashedPassword,
      college: code, // This will be the institution code
      role: "admin",
    });

    // Save the admin user
    await adminUser.save();

    res.json({
      success: true,
      institution: {
        name: newInstitution.name,
        code: newInstitution.code,
        adminUsername: newInstitution.adminUsername,
        palette: newInstitution.palette,
        adminPassword: finalAdminPassword, // Send unhashed password only once
      },
      message: "Institution and admin user created successfully",
    });
  } catch (error) {
    console.error("Error creating institution:", error);
    res.status(500).json({
      success: false,
      message: "Error creating institution",
      error: error.message,
    });
  }
});

// Update institution details (name and code)
router.put(
  "/update-institution/:id",
  enhancedSecurity("UPDATE_INSTITUTION"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, palette } = req.body;

      // Find the institution
      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({
          success: false,
          message: "Institution not found",
        });
      }

      // Check if the new code is already taken by another institution
      if (code && code !== institution.code) {
        const existingInstitution = await Institution.findOne({
          code,
          _id: { $ne: id }, // Exclude current institution
        });

        if (existingInstitution) {
          return res.status(400).json({
            success: false,
            message: "Institution code already taken by another institution",
          });
        }
      }

      // Check if the new name is already taken by another institution
      if (name && name !== institution.name) {
        const existingInstitution = await Institution.findOne({
          name,
          _id: { $ne: id }, // Exclude current institution
        });

        if (existingInstitution) {
          return res.status(400).json({
            success: false,
            message: "Institution name already taken by another institution",
          });
        }
      }

      // Update institution details
      if (name) {
        institution.name = name;
      }

      if (code) {
        institution.code = code;
      }

      // Update palette if provided
      if (palette && typeof palette === "object") {
        console.log("Updating palette with:", palette);
        // Complete replacement of the palette with the new one
        institution.palette = {
          name: palette.name || "custom",
          colors: {
            primary: palette.colors?.primary || "#10b981",
            primaryLight: palette.colors?.primaryLight || "#ecfdf5",
            background: palette.colors?.background || "#f9fafb",
            surface: palette.colors?.surface || "#ffffff",
            border: palette.colors?.border || "#e5e7eb",
            text: palette.colors?.text || "#111827",
            textMuted: palette.colors?.textMuted || "#6b7280",
            accent: palette.colors?.accent || "#f59e0b",
          },
        };
        console.log("New institution palette:", institution.palette);
      }

      const oldCode = institution.code; // Store old code before updating
      await institution.save();

      // If the institution code changed, update the admin user's college field
      if (code && code !== oldCode) {
        const adminUser = await User.findOne({
          username: institution.adminUsername,
          college: oldCode,
          role: "admin",
        });

        if (adminUser) {
          adminUser.college = code;
          await adminUser.save();
        }
      }

      res.json({
        success: true,
        institution: {
          _id: institution._id,
          name: institution.name,
          code: institution.code,
          adminUsername: institution.adminUsername,
          palette: institution.palette,
        },
        message: "Institution details updated successfully",
      });
    } catch (error) {
      console.error("Error updating institution details:", error);
      res.status(500).json({
        success: false,
        message: "Error updating institution details",
        error: error.message,
      });
    }
  },
);

// Update institution admin credentials
router.put(
  "/update-institution-admin/:id",
  enhancedSecurity("UPDATE_INSTITUTION_ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUsername, adminPassword } = req.body;

      // Find the institution
      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({
          success: false,
          message: "Institution not found",
        });
      }

      // Store the old username for finding the user record
      const oldAdminUsername = institution.adminUsername;

      // Check if the new username is already taken by another institution
      if (adminUsername && adminUsername !== institution.adminUsername) {
        const existingInstitution = await Institution.findOne({
          adminUsername,
          _id: { $ne: id }, // Exclude current institution
        });

        if (existingInstitution) {
          return res.status(400).json({
            success: false,
            message: "Admin username already taken by another institution",
          });
        }
      }

      // Update institution credentials
      if (
        adminUsername !== undefined &&
        adminUsername !== null &&
        adminUsername !== ""
      ) {
        institution.adminUsername = adminUsername;
      }

      if (
        adminPassword !== undefined &&
        adminPassword !== null &&
        adminPassword !== ""
      ) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        institution.adminPassword = hashedPassword;
      }

      await institution.save();

      // Also update the corresponding user record
      // Find user with the OLD username
      console.log("Searching for user to update:", {
        oldAdminUsername,
        college: institution.code,
      });
      const user = await User.findOne({
        username: oldAdminUsername,
        college: institution.code,
        role: "admin",
      });
      console.log("User found for update:", user);

      if (user) {
        // Update user with new credentials
        if (
          adminUsername !== undefined &&
          adminUsername !== null &&
          adminUsername !== ""
        ) {
          user.username = adminUsername;
        }

        if (
          adminPassword !== undefined &&
          adminPassword !== null &&
          adminPassword !== ""
        ) {
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          user.password = hashedPassword;
        }

        // Ensure college is set correctly (should match institution code)
        user.college = institution.code;

        await user.save();
        console.log("User updated successfully");
      } else {
        console.log(
          "WARNING: User not found for update. This could cause login issues.",
        );
        // Try to find user with just the username (in case college is different)
        const userByUsername = await User.findOne({
          username: oldAdminUsername,
          role: "admin",
        });
        console.log("User found by username only:", userByUsername);

        if (userByUsername) {
          // Update this user instead
          if (
            adminUsername !== undefined &&
            adminUsername !== null &&
            adminUsername !== ""
          ) {
            userByUsername.username = adminUsername;
          }

          if (
            adminPassword !== undefined &&
            adminPassword !== null &&
            adminPassword !== ""
          ) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            userByUsername.password = hashedPassword;
          }

          // Ensure college is set correctly
          userByUsername.college = institution.code;

          await userByUsername.save();
          console.log("User updated successfully by username only");
        }
      }

      res.json({
        success: true,
        institution: {
          name: institution.name,
          code: institution.code,
          adminUsername: institution.adminUsername,
        },
        message: "Institution admin credentials updated successfully",
      });
    } catch (error) {
      console.error("Error updating institution admin credentials:", error);
      res.status(500).json({
        success: false,
        message: "Error updating institution admin credentials",
        error: error.message,
      });
    }
  },
);

// Delete an institution
router.delete(
  "/delete-institution/:id",
  enhancedSecurity("DELETE_INSTITUTION"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find the institution
      const institution = await Institution.findById(id);
      if (!institution) {
        return res.status(404).json({
          success: false,
          message: "Institution not found",
        });
      }

      // Delete the institution
      await Institution.findByIdAndDelete(id);

      // Also delete the corresponding admin user
      await User.findOneAndDelete({
        username: institution.adminUsername,
        college: institution.code,
        role: "admin",
      });

      res.json({
        success: true,
        message: `Institution '${institution.name}' and its admin user deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting institution:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting institution",
        error: error.message,
      });
    }
  },
);

// Update superadmin credentials
router.put(
  "/update-superadmin-credentials",
  enhancedSecurity("UPDATE_SUPERADMIN_CREDENTIALS"),
  async (req, res) => {
    try {
      const { newUsername, newPassword } = req.body;

      if (!newUsername && !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Either new username or new password must be provided",
        });
      }

      // Find the superadmin user
      const superadmin = await User.findOne({
        role: "superadmin",
        college: "ALL",
      });
      if (!superadmin) {
        return res.status(404).json({
          success: false,
          message: "Superadmin user not found",
        });
      }

      // Update credentials
      if (newUsername) {
        superadmin.username = newUsername;
      }

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        superadmin.password = hashedPassword;
      }

      await superadmin.save();

      res.json({
        success: true,
        message: "Superadmin credentials updated successfully",
        updatedFields: {
          username: newUsername ? "Updated" : "Not changed",
          password: newPassword ? "Updated" : "Not changed",
        },
      });
    } catch (error) {
      console.error("Error updating superadmin credentials:", error);
      res.status(500).json({
        success: false,
        message: "Error updating superadmin credentials",
        error: error.message,
      });
    }
  },
);

// Get all institutions
router.get("/institutions", async (req, res) => {
  try {
    const institutions = await Institution.find({}, "-adminPassword"); // Exclude password field
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

module.exports = router;
