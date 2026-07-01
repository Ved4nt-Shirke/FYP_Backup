const Ciaan = require("../models/Ciann");

const checkCiaanFreeze = async (req, res, next) => {
  try {
    // 1. Check if there's a direct CiaanId in request params or body
    let CiaanIdStr = req.params.CiaanId || req.body.CiaanId || req.query.CiaanId;

    // If not found directly, check if we are updating a specific sub-resource by ID (e.g. attendance, marks)
    // and try to load that resource to find its parent CiaanId.
    if (!CiaanIdStr && req.params.id) {
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
            CiaanIdStr = res.value.CiaanId;
            break;
          }
        }
      }
    }

    if (!CiaanIdStr) {
      return next();
    }

    const numericCiaanId = parseInt(CiaanIdStr, 10);
    let Ciaan = null;

    if (isNaN(numericCiaanId)) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(CiaanIdStr)) {
        Ciaan = await Ciaan.findById(CiaanIdStr);
      }
    } else {
      Ciaan = await Ciaan.findOne({ CiaanId: numericCiaanId });
    }

    if (Ciaan && (Ciaan.status === "completed" || Ciaan.status === "archived")) {
      return res.status(403).json({
        success: false,
        message: `This semester's data has been frozen (${Ciaan.status}). Editing is locked.`,
        isFrozen: true
      });
    }

    if (Ciaan) {
      const AcademicYear = require("../models/AcademicYear");
      let academicYearDoc = null;
      if (Ciaan.academicYearRef) {
        academicYearDoc = await AcademicYear.findById(Ciaan.academicYearRef);
      } else if (Ciaan.academicYear && Ciaan.college) {
        academicYearDoc = await AcademicYear.findOne({
          college: Ciaan.college,
          yearName: Ciaan.academicYear
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

module.exports = checkCiaanFreeze;
