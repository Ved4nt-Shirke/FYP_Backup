const mongoose = require("mongoose");

const CiaanSchema = new mongoose.Schema(
  {
    CiaanId: {
      type: Number,
      required: true,
      unique: true,
      min: 1000,
      max: 9999,
    },
    department: { type: Object, required: true },
    division: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    academicYearRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
    },
    scheme: { type: String, trim: true },
    subject: { type: Object, required: true },
    semester: { type: String, required: true, trim: true },
    semesterType: { type: String, trim: true },
    college: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerUsername: { type: String, required: true, trim: true },
    ownerRole: {
      type: String,
      enum: ["faculty", "admin", "superadmin", "office", "hod", "academic_coordinator"],
      required: true,
    },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        permission: {
          type: String,
          enum: ["read", "edit"],
          default: "read",
          required: true,
        },
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shareRequests: [
      {
        requester: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        permission: {
          type: String,
          enum: ["read", "edit"],
          default: "read",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
        },
        respondedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CiaanSchema.index({ owner: 1, CiaanId: 1 });
CiaanSchema.index({ college: 1, CiaanId: 1 });
CiaanSchema.index({ "sharedWith.user": 1, CiaanId: 1 });
CiaanSchema.index({ "shareRequests.requester": 1, "shareRequests.status": 1 });

module.exports = mongoose.model("Ciaan", CiaanSchema);
