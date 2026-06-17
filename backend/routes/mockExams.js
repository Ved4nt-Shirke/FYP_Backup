const express = require("express");
const mongoose = require("mongoose");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const MockExam = require("../models/MockExam");
const ExamAttempt = require("../models/ExamAttempt");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const normalizeText = (value = "") => String(value || "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sameObjectId = (left, right) => String(left || "") === String(right || "");

const isFacultyOrAdmin = (req, res, next) => {
  if (!["faculty", "admin", "superadmin", "hod", "academic_coordinator"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  return next();
};

const isStudentRole = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({ success: false, message: "Student access only" });
  }
  return next();
};

async function findStudentForUser(user) {
  const username = normalizeText(user?.username).toLowerCase();
  if (!username) return null;

  const usernameRegex = new RegExp(`^${escapeRegex(username)}$`, "i");
  let student = await Student.findOne({ username: usernameRegex })
    .populate("courseId", "semester scheme courseCode")
    .populate("divisionId", "name");

  if (!student && normalizeText(user?.enrollmentNo)) {
    student = await Student.findOne({ enrollmentNo: normalizeText(user.enrollmentNo) })
      .populate("courseId", "semester scheme courseCode")
      .populate("divisionId", "name");
  }

  return student;
}

function getExamStatus(exam, now = new Date()) {
  const start = new Date(exam.startTime).getTime();
  const end = new Date(exam.endTime).getTime();
  const current = now.getTime();

  if (current < start) return "upcoming";
  if (current >= start && current <= end) return "active";
  return "completed";
}

function calculateResult(exam, answers = []) {
  const answerLookup = new Map(
    (answers || []).map((entry) => [String(entry.questionId), String(entry.answer || "").trim()]),
  );

  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;

  const evaluatedAnswers = (exam.questions || []).map((question) => {
    const submittedAnswer = answerLookup.get(String(question._id)) || "";
    const normalizedCorrect = String(question.correctAnswer || "").trim();
    const isCorrect = Boolean(
      normalizedCorrect && submittedAnswer && normalizedCorrect.toLowerCase() === submittedAnswer.toLowerCase(),
    );
    const marksAwarded = isCorrect ? Number(question.marks || 0) : 0;

    if (isCorrect) {
      correctAnswers += 1;
      score += marksAwarded;
    } else if (submittedAnswer) {
      wrongAnswers += 1;
    }

    return {
      questionId: question._id,
      answer: submittedAnswer,
      marksAwarded,
      isCorrect,
    };
  });

  return {
    score: Math.max(0, score),
    correctAnswers,
    wrongAnswers,
    totalMarks: Number(exam.totalMarks || 0),
    evaluatedAnswers,
  };
}

async function validateSelection(req, selection) {
  const [course, division, subject] = await Promise.all([
    Course.findById(selection.courseId),
    Division.findById(selection.divisionId),
    Subject.findById(selection.subjectId),
  ]);

  if (!course || !division || !subject) {
    const error = new Error("Selected course, division, or subject was not found");
    error.statusCode = 400;
    throw error;
  }

  if (String(course.institution || "").trim().toLowerCase() !== String(req.user.college || "").trim().toLowerCase()) {
    const error = new Error("Course does not belong to your institution");
    error.statusCode = 403;
    throw error;
  }

  if (!sameObjectId(division.courseId, course._id)) {
    const error = new Error("Division is not linked to the selected course");
    error.statusCode = 400;
    throw error;
  }

  if (!sameObjectId(subject.courseId, course._id)) {
    const error = new Error("Subject is not linked to the selected course");
    error.statusCode = 400;
    throw error;
  }

  const semester = Number(selection.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    const error = new Error("Semester must be a number between 1 and 8");
    error.statusCode = 400;
    throw error;
  }

  if (Number(course.semester) !== semester) {
    const error = new Error("Selected semester must match the chosen course semester");
    error.statusCode = 400;
    throw error;
  }

  return { course, division, subject, semester };
}

router.use(authenticate);

router.get("/catalog", isFacultyOrAdmin, async (req, res) => {
  try {
    const institution = String(req.user?.college || "").trim();
    const [departments, courses, divisions, subjects] = await Promise.all([
      Department.find({ institution }).select("_id name code").sort({ name: 1 }),
      Course.find({ institution }).select("_id semester scheme courseCode departmentId").sort({ semester: 1, courseCode: 1 }),
      Division.find({ institution }).select("_id name courseId departmentId").sort({ name: 1 }),
      Subject.find({ institution }).select("_id name code departmentId courseId").sort({ name: 1 }),
    ]);

    res.json({ success: true, departments, courses, divisions, subjects });
  } catch (error) {
    console.error("Error fetching mock exam catalog:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post("/", isFacultyOrAdmin, async (req, res) => {
  try {
    const {
      academicYear,
      courseId,
      divisionId,
      semester,
      subjectId,
      title,
      duration,
      totalMarks,
      examType,
      questions,
      isPublished,
      startTime,
      endTime,
      shuffleQuestions,
      shuffleOptions,
      negativeMarking,
    } = req.body || {};

    if (!academicYear || !courseId || !divisionId || !semester || !subjectId || !title || !duration || !totalMarks || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing required exam fields" });
    }

    if (!isValidObjectId(courseId) || !isValidObjectId(divisionId) || !isValidObjectId(subjectId)) {
      return res.status(400).json({ success: false, message: "Invalid course, division, or subject ID" });
    }

    const selected = await validateSelection(req, { courseId, divisionId, subjectId, semester });

    const normalizedQuestions = Array.isArray(questions)
      ? questions.map((question) => {
          const type = String(question.type || "MCQ").toUpperCase();
          const normalized = {
            type,
            question: normalizeText(question.question),
            options: Array.isArray(question.options)
              ? question.options.map((option) => normalizeText(option)).filter(Boolean)
              : [],
            correctAnswer: normalizeText(question.correctAnswer),
            marks: Number(question.marks || 0),
            explanation: normalizeText(question.explanation),
          };

          if (!normalized.question) {
            const error = new Error("Each question must include text");
            error.statusCode = 400;
            throw error;
          }

          if (type === "MCQ" && normalized.options.length !== 4) {
            const error = new Error("MCQ questions must include exactly 4 options");
            error.statusCode = 400;
            throw error;
          }

          return normalized;
        })
      : [];

    const mockExam = await MockExam.create({
      academicYear: normalizeText(academicYear),
      courseId: selected.course._id,
      divisionId: selected.division._id,
      semester: selected.semester,
      subjectId: selected.subject._id,
      title: normalizeText(title),
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      examType: String(examType || "MIXED").toUpperCase(),
      questions: normalizedQuestions,
      createdBy: req.user._id,
      isPublished: Boolean(isPublished),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      shuffleQuestions: Boolean(shuffleQuestions),
      shuffleOptions: Boolean(shuffleOptions),
      negativeMarking: Number(negativeMarking || 0),
    });

    res.status(201).json({ success: true, message: "Mock exam created successfully", exam: mockExam });
  } catch (error) {
    console.error("Error creating mock exam:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/", isFacultyOrAdmin, async (req, res) => {
  try {
    const { courseId, divisionId, subjectId, status } = req.query;
    const query = ["faculty", "hod", "academic_coordinator"].includes(req.user.role) ? { createdBy: req.user._id } : {};

    if (courseId && isValidObjectId(courseId)) query.courseId = courseId;
    if (divisionId && isValidObjectId(divisionId)) query.divisionId = divisionId;
    if (subjectId && isValidObjectId(subjectId)) query.subjectId = subjectId;

    const exams = await MockExam.find(query)
      .populate("courseId", "semester scheme courseCode departmentId")
      .populate("divisionId", "name")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 });

    const now = new Date();
    const attemptsByExam = exams.length
      ? await ExamAttempt.aggregate([
          { $match: { examId: { $in: exams.map((exam) => exam._id) } } },
          { $group: { _id: "$examId", attempts: { $sum: 1 } } },
        ])
      : [];

    const attemptMap = new Map(attemptsByExam.map((item) => [String(item._id), item.attempts]));

    const responseExams = exams
      .map((exam) => ({
        ...exam.toObject(),
        examStatus: getExamStatus(exam, now),
        attempts: attemptMap.get(String(exam._id)) || 0,
      }))
      .filter((exam) => !status || status === "all" || exam.examStatus === status);

    res.json({ success: true, exams: responseExams });
  } catch (error) {
    console.error("Error fetching mock exams:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id)
      .populate("courseId", "semester scheme courseCode departmentId")
      .populate("divisionId", "name")
      .populate("subjectId", "name code");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, exam: { ...exam.toObject(), examStatus: getExamStatus(exam) } });
  } catch (error) {
    console.error("Error fetching mock exam:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const payload = req.body || {};
    const needsSelectionValidation = payload.courseId || payload.divisionId || payload.subjectId || payload.semester;
    if (needsSelectionValidation) {
      const selected = await validateSelection(req, {
        courseId: payload.courseId || exam.courseId,
        divisionId: payload.divisionId || exam.divisionId,
        subjectId: payload.subjectId || exam.subjectId,
        semester: payload.semester || exam.semester,
      });
      exam.courseId = selected.course._id;
      exam.divisionId = selected.division._id;
      exam.subjectId = selected.subject._id;
      exam.semester = selected.semester;
    }

    if (payload.academicYear !== undefined) exam.academicYear = normalizeText(payload.academicYear);
    if (payload.title !== undefined) exam.title = normalizeText(payload.title);
    if (payload.duration !== undefined) exam.duration = Number(payload.duration);
    if (payload.totalMarks !== undefined) exam.totalMarks = Number(payload.totalMarks);
    if (payload.examType !== undefined) exam.examType = String(payload.examType || "MIXED").toUpperCase();
    if (payload.startTime !== undefined) exam.startTime = new Date(payload.startTime);
    if (payload.endTime !== undefined) exam.endTime = new Date(payload.endTime);
    if (payload.isPublished !== undefined) exam.isPublished = Boolean(payload.isPublished);
    if (payload.shuffleQuestions !== undefined) exam.shuffleQuestions = Boolean(payload.shuffleQuestions);
    if (payload.shuffleOptions !== undefined) exam.shuffleOptions = Boolean(payload.shuffleOptions);
    if (payload.negativeMarking !== undefined) exam.negativeMarking = Number(payload.negativeMarking);

    if (Array.isArray(payload.questions)) {
      exam.questions = payload.questions.map((question) => ({
        type: String(question.type || "MCQ").toUpperCase(),
        question: normalizeText(question.question),
        options: Array.isArray(question.options)
          ? question.options.map((option) => normalizeText(option)).filter(Boolean)
          : [],
        correctAnswer: normalizeText(question.correctAnswer),
        marks: Number(question.marks || 0),
        explanation: normalizeText(question.explanation),
      }));
    }

    await exam.save();
    res.json({ success: true, message: "Mock exam updated successfully", exam });
  } catch (error) {
    console.error("Error updating mock exam:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post("/:id/questions", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { questions = [] } = req.body || {};
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Questions must be an array" });
    }

    exam.questions = questions.map((question) => ({
      type: String(question.type || "MCQ").toUpperCase(),
      question: normalizeText(question.question),
      options: Array.isArray(question.options)
        ? question.options.map((option) => normalizeText(option)).filter(Boolean)
        : [],
      correctAnswer: normalizeText(question.correctAnswer),
      marks: Number(question.marks || 0),
      explanation: normalizeText(question.explanation),
    }));

    await exam.save();
    res.json({ success: true, message: "Questions saved successfully", questions: exam.questions });
  } catch (error) {
    console.error("Error saving mock exam questions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:id/duplicate", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const duplicatedExam = await MockExam.create({
      ...exam.toObject(),
      _id: undefined,
      title: `${exam.title} Copy`,
      isPublished: false,
      createdBy: req.user._id,
      createdAt: undefined,
      updatedAt: undefined,
    });

    res.status(201).json({ success: true, message: "Mock exam duplicated", exam: duplicatedExam });
  } catch (error) {
    console.error("Error duplicating mock exam:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/publish", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    exam.isPublished = Boolean(req.body?.isPublished);
    await exam.save();

    res.json({ success: true, message: `Mock exam ${exam.isPublished ? "published" : "unpublished"}`, exam });
  } catch (error) {
    console.error("Error updating mock exam publish status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const exam = await MockExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    if (String(exam.createdBy) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await ExamAttempt.deleteMany({ examId: exam._id });
    await exam.deleteOne();
    res.json({ success: true, message: "Mock exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting mock exam:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/results/summary", isFacultyOrAdmin, async (req, res) => {
  try {
    const { courseId, divisionId, subjectId, examId } = req.query;
    const examQuery = ["faculty", "hod", "academic_coordinator"].includes(req.user.role) ? { createdBy: req.user._id } : {};

    if (examId && isValidObjectId(examId)) examQuery._id = examId;
    if (courseId && isValidObjectId(courseId)) examQuery.courseId = courseId;
    if (divisionId && isValidObjectId(divisionId)) examQuery.divisionId = divisionId;
    if (subjectId && isValidObjectId(subjectId)) examQuery.subjectId = subjectId;

    const exams = await MockExam.find(examQuery).select("_id title totalMarks duration subjectId courseId divisionId semester");
    const examIds = exams.map((exam) => exam._id);

    const attempts = await ExamAttempt.find({ examId: { $in: examIds } })
      .populate("studentId", "studentName rollNo enrollmentNo divisionId courseId")
      .populate("examId", "title duration totalMarks subjectId courseId divisionId semester")
      .sort({ submittedAt: -1 });

    res.json({ success: true, attempts });
  } catch (error) {
    console.error("Error fetching mock exam results:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/student/exams", isStudentRole, async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    if (!student.courseId || !student.divisionId) {
      return res.status(400).json({ success: false, message: "Student is missing course or division assignment" });
    }

    const exams = await MockExam.find({
      isPublished: true,
      courseId: student.courseId._id || student.courseId,
      divisionId: student.divisionId._id || student.divisionId,
      semester: Number(student.courseId.semester || 0),
    })
      .populate("subjectId", "name code")
      .sort({ startTime: 1 });

    const attempts = await ExamAttempt.find({
      examId: { $in: exams.map((exam) => exam._id) },
      studentId: student._id,
    }).select("examId score submittedAt timeTaken totalMarks");

    const attemptMap = new Map(attempts.map((attempt) => [String(attempt.examId), attempt]));
    const now = new Date();

    const items = exams.map((exam) => {
      const attempt = attemptMap.get(String(exam._id));
      const status = attempt ? "completed" : getExamStatus(exam, now);

      return {
        _id: exam._id,
        subject: exam.subjectId?.name || "Subject",
        subjectCode: exam.subjectId?.code || "",
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.questions.length,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status,
        attempt: attempt
          ? {
              score: attempt.score,
              submittedAt: attempt.submittedAt,
              timeTaken: attempt.timeTaken,
              totalMarks: attempt.totalMarks,
            }
          : null,
      };
    });

    res.json({ success: true, exams: items, student: { _id: student._id, studentName: student.studentName } });
  } catch (error) {
    console.error("Error fetching student mock exams:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/student/exams/:id", isStudentRole, async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const exam = await MockExam.findById(req.params.id)
      .populate("subjectId", "name code")
      .populate("courseId", "semester scheme courseCode")
      .populate("divisionId", "name");

    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    const eligible =
      sameObjectId(exam.courseId._id || exam.courseId, student.courseId?._id || student.courseId) &&
      sameObjectId(exam.divisionId._id || exam.divisionId, student.divisionId?._id || student.divisionId) &&
      Number(exam.semester) === Number(student.courseId?.semester || 0);

    if (!eligible) {
      return res.status(403).json({ success: false, message: "You are not eligible for this exam" });
    }

    const attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id }).select("_id score submittedAt timeTaken status");
    const status = attempt ? "completed" : getExamStatus(exam);
    const canAttempt = !attempt && status === "active";

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        academicYear: exam.academicYear,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        examType: exam.examType,
        subject: exam.subjectId?.name || "Subject",
        subjectCode: exam.subjectId?.code || "",
        course: exam.courseId?.courseCode || "",
        division: exam.divisionId?.name || "",
        semester: exam.semester,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status,
        canAttempt,
        questions: canAttempt ? exam.questions.map((question) => ({
          _id: question._id,
          type: question.type,
          question: question.question,
          options: Array.isArray(question.options) ? question.options : [],
          marks: question.marks || 0,
        })) : [],
      },
      attempt: attempt || null,
    });
  } catch (error) {
    console.error("Error fetching student mock exam details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/student/exams/:id/submit", isStudentRole, async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const exam = await MockExam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
    }

    const eligible =
      sameObjectId(exam.courseId, student.courseId?._id || student.courseId) &&
      sameObjectId(exam.divisionId, student.divisionId?._id || student.divisionId) &&
      Number(exam.semester) === Number(student.courseId?.semester || 0);

    if (!eligible) {
      return res.status(403).json({ success: false, message: "You are not eligible for this exam" });
    }

    const existingAttempt = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id });
    if (existingAttempt) {
      return res.status(409).json({ success: false, message: "You have already submitted this exam" });
    }

    const submittedAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const timeTaken = Number(req.body?.timeTaken || 0);
    const result = calculateResult(exam, submittedAnswers);

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: student._id,
      answers: result.evaluatedAnswers,
      score: result.score,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      totalMarks: result.totalMarks,
      submittedAt: new Date(),
      timeTaken: Math.min(Math.max(timeTaken, 0), Number(exam.duration) * 60),
      submittedBy: req.user._id,
      status: new Date() > new Date(exam.endTime) ? "auto-submitted" : "submitted",
    });

    res.status(201).json({
      success: true,
      message: "Exam submitted successfully",
      result: {
        attemptId: attempt._id,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        totalMarks: attempt.totalMarks,
        percentage: attempt.totalMarks ? ((attempt.score / attempt.totalMarks) * 100).toFixed(2) : "0.00",
        submittedAt: attempt.submittedAt,
        timeTaken: attempt.timeTaken,
        status: attempt.status,
      },
    });
  } catch (error) {
    console.error("Error submitting mock exam:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/student/results", isStudentRole, async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const attempts = await ExamAttempt.find({ studentId: student._id })
      .populate({
        path: "examId",
        select: "title totalMarks duration examType startTime endTime subjectId",
        populate: { path: "subjectId", select: "name code" },
      })
      .sort({ submittedAt: -1 });

    const results = attempts.map((attempt) => ({
      _id: attempt._id,
      examTitle: attempt.examId?.title || "Mock Exam",
      subject: attempt.examId?.subjectId?.name || "Subject",
      subjectCode: attempt.examId?.subjectId?.code || "",
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      totalMarks: attempt.totalMarks,
      percentage: attempt.totalMarks ? ((attempt.score / attempt.totalMarks) * 100).toFixed(2) : "0.00",
      submittedAt: attempt.submittedAt,
      timeTaken: attempt.timeTaken,
      duration: attempt.examId?.duration || 0,
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching student mock results:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;