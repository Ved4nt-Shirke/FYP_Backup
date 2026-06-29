// models/CiannSubjectDetails.js

const mongoose = require("mongoose");

const ciannSubjectDetailsSchema = new mongoose.Schema(
  {
    ciannId: { type: Number, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", unique: true, sparse: true },
    syllabusImages: { type: [String], default: [] },
    lectureSchedule: {
      clusterMentor: {
        name: { type: String, default: "" },
        designation: { type: String, default: "" },
        department: { type: String, default: "" },
        contact: { type: String, default: "" },
        email: { type: String, default: "" }
      },
      industryMentor: {
        name: { type: String, default: "" },
        designation: { type: String, default: "" },
        company: { type: String, default: "" },
        contact: { type: String, default: "" },
        email: { type: String, default: "" }
      }
    },
    officeHours: {
      day: { type: String, default: "" },
      time: { type: String, default: "" },
      venue: { type: String, default: "" },
      informed: { type: Boolean, default: false }
    },
    objectives: {
      cognitive: { type: String, default: "" },
      affective: { type: String, default: "" },
      behavioral: { type: String, default: "" }
    },
    cosWithPOs: { type: Array, default: [] }, // 6x12 matrix of strings
    cosWithPSOs: { type: Array, default: [] }, // Array of 6 objects {pso1, pso2}
    pastResults: {
      faculty: { type: [String], default: ["", "", "", ""] },
      subjectPass: { type: [String], default: ["", "", "", ""] },
      subjectTopper: { type: [String], default: ["", "", "", ""] },
      overallPass: { type: [String], default: ["", "", "", ""] }
    },
    recommendations: {
      facultyRecommendation: {
        cy1: { type: String, default: "" },
        cy2: { type: String, default: "" },
        cy3: { type: String, default: "" }
      },
      clusterRecommendation: {
        cmMeeting: { type: String, default: "" },
        imMeeting: { type: String, default: "" },
        cmDate: { type: String, default: "" },
        imDate: { type: String, default: "" }
      },
      subjectTeacherRecommendations: [{
        unitNo: { type: String, default: "" },
        practicalExpt: { type: String, default: "" },
        nptel: { type: Boolean, default: false },
        guestLecture: { type: Boolean, default: false },
        ivWorkshop: { type: Boolean, default: false },
        miniProject: { type: Boolean, default: false },
        valueAdded: { type: Boolean, default: false },
        other: { type: String, default: "" },
        details: { type: String, default: "" }
      }]
    },
    rubric: {
      attendance: { type: String, default: "" },
      assignments: { type: String, default: "" },
      performance: { type: String, default: "" },
      journal: { type: String, default: "" },
      tests: { type: String, default: "" },
      other: { type: String, default: "" },
      total: { type: String, default: "" }
    },
    knowledgeMap: {
      preSem: { type: [String], default: ["", "", ""] },
      preCourse: { type: [String], default: ["", "", ""] },
      futureSem: { type: [String], default: ["", "", ""] },
      futureCourse: { type: [String], default: ["", "", ""] },
      application: { type: String, default: "" },
      imagePath: { type: String, default: "" }
    },
    // Resources subcomponents
    webJournalResources: [{
      journal: String,
      magazine: String,
      module: String
    }],
    moduleAvailabilityResource: [{
      module: String,
      textbook: Boolean,
      referenceBook: Boolean,
      otherBook: Boolean,
      magazine: Boolean,
      journalRegular: Boolean,
      journalE: Boolean,
      available: String,
      details: String
    }],
    recommendedWebsiteResource: [{
      name: String,
      url: String,
      module: String
    }],
    vacSection: [{
      name: { type: String, default: "" },
      conductedBy: { type: String, default: "" },
      duration: { type: String, default: "" },
      certificate: { type: String, default: "" }
    }],
    studySection: {
      gq: { type: Boolean, default: false },
      notes: { type: Boolean, default: false },
      digital: { type: Boolean, default: false },
      ppt: { type: Boolean, default: false },
      eq: { type: Boolean, default: false },
      other: { type: String, default: "" }
    },
    otherContributionsSection: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CiannSubjectDetails ||
  mongoose.model("CiannSubjectDetails", ciannSubjectDetailsSchema);
