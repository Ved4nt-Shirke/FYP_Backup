const Ciann = require("../models/Ciann");

const checkCiannFreeze = async (req, res, next) => {
  try {
    // 1. Check if there's a direct ciannId in request params or body
    let ciannIdStr = req.params.ciannId || req.body.ciannId || req.query.ciannId;
    
    // If not found directly, check if we are updating a specific sub-resource by ID (e.g. attendance, marks)
    // and try to load that resource to find its parent ciannId.
    if (!ciannIdStr && req.params.id) {
      const id = req.params.id;
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Try looking up in various attendance / plan models
        const TheoryAttendance = require("../models/TheoryAttendance");
        const PracticalAttendance = require("../models/PracticalAttendance");
        const TutorialAttendance = require("../models/TutorialAttendance");
        const TeachingPlan = require("../models/TeachingPlan");
        const LabPlanning = require("../models/LabPlanning");
        const TutorialPlan = require("../models/TutorialPlan");

        const lookups = [
          TheoryAttendance.findById(id),
          PracticalAttendance.findById(id),
          TutorialAttendance.findById(id),
          TeachingPlan.findById(id),
          LabPlanning.findById(id),
          TutorialPlan.findById(id)
        ];

        const results = await Promise.allSettled(lookups);
        for (const res of results) {
          if (res.status === "fulfilled" && res.value) {
            ciannIdStr = res.value.ciannId;
            break;
          }
        }
      }
    }

    if (!ciannIdStr) {
      return next();
    }

    const numericCiannId = parseInt(ciannIdStr, 10);
    let ciann = null;

    if (isNaN(numericCiannId)) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(ciannIdStr)) {
        ciann = await Ciann.findById(ciannIdStr);
      }
    } else {
      ciann = await Ciann.findOne({ ciannId: numericCiannId });
    }

    if (ciann && (ciann.status === "completed" || ciann.status === "archived")) {
      return res.status(403).json({
        success: false,
        message: `This semester's data has been frozen (${ciann.status}). Editing is locked.`,
        isFrozen: true
      });
    }

    if (ciann) {
      const AcademicYear = require("../models/AcademicYear");
      let academicYearDoc = null;
      if (ciann.academicYearRef) {
        academicYearDoc = await AcademicYear.findById(ciann.academicYearRef);
      } else if (ciann.academicYear && ciann.college) {
        academicYearDoc = await AcademicYear.findOne({
          college: ciann.college,
          yearName: ciann.academicYear
        });
      }
      if (academicYearDoc && academicYearDoc.status === "completed") {
        return res.status(403).json({
          success: false,
          message: `The academic year ${academicYearDoc.yearName} has been completed/archived. Editing is locked.`,
          isFrozen: true
        });
      }
    }

    next();
  } catch (error) {
    console.error("Check freeze middleware error:", error);
    next();
  }
};

module.exports = checkCiannFreeze;
