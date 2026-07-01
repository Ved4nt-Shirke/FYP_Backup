const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const MockExam = require("../models/MockExam");
const ExamAttempt = require("../models/ExamAttempt");
const MockQuestion = require("../models/MockQuestion");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const fs = require("fs");
const path = require("path");
const examUploadDir = path.join(__dirname, "../uploads/mock-exams");
if (!fs.existsSync(examUploadDir)) {
  fs.mkdirSync(examUploadDir, { recursive: true });
}
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, examUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
const uploadImage = multer({ storage: diskStorage });

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
  return "expired";
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

// Endpoint to upload question & option images
router.post("/upload-image", isFacultyOrAdmin, uploadImage.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const url = `/uploads/mock-exams/${req.file.filename}`;
      return res.json({ success: true, url });
    }

    if (req.body.image && req.body.image.startsWith("data:image/")) {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const mimeMatch = req.body.image.match(/^data:(image\/\w+);base64,/);
      let ext = ".png";
      if (mimeMatch && mimeMatch[1]) {
        ext = "." + mimeMatch[1].split("/")[1];
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `image-base64-${uniqueSuffix}${ext}`;
      const filePath = path.join(examUploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const url = `/uploads/mock-exams/${filename}`;
      return res.json({ success: true, url });
    }

    return res.status(400).json({ success: false, message: "No image file or base64 data provided" });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────
// Catalog Endpoint
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Heuristic PDF Question Extraction Endpoint
// ──────────────────────────────────────────────
router.post("/upload-pdf", isFacultyOrAdmin, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const parsed = await pdfParse(req.file.buffer);
    const text = parsed.text;

    const questions = [];
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let currentQuestion = null;

    const questionRegex = /^(?:Q|q)?(?:uestion)?\s*(\d+)[\.\s:-]+(.*)$/;
    const optionRegex = /^\s*([A-Da-d])[\.\)\s:-]+(.*)$/;
    const marksRegex = /(?:\[|\()(?:\s*marks?\s*:\s*)?(\d+)\s*(?:marks?|m)?(?:\s*\]|\))/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const qMatch = line.match(questionRegex);
      if (qMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        let qText = qMatch[2].trim();
        let marks = 1;

        const marksMatch = qText.match(marksRegex);
        if (marksMatch) {
          marks = parseInt(marksMatch[1], 10);
          qText = qText.replace(marksRegex, "").trim();
        }

        currentQuestion = {
          type: "THEORY",
          question: qText,
          options: [],
          correctAnswer: "",
          marks,
          difficulty: "MEDIUM",
          chapter: "",
          explanation: ""
        };
        continue;
      }

      const oMatch = line.match(optionRegex);
      if (oMatch && currentQuestion) {
        currentQuestion.type = "MCQ";
        const optText = oMatch[2].trim();
        currentQuestion.options.push(optText);
        continue;
      }

      if (currentQuestion && !line.match(questionRegex) && !line.match(optionRegex)) {
        const ansMatch = line.match(/^(?:Answer|CorrectAnswer|Correct|Ans)[\s:-]+([A-D|True|False|a-d])\s*$/i);
        if (ansMatch) {
          currentQuestion.correctAnswer = ansMatch[1].trim().toUpperCase();
        } else {
          currentQuestion.question += " " + line;
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    const formattedQuestions = questions.map(q => {
      if (q.type === "MCQ") {
        while (q.options.length < 4) {
          q.options.push(`Option ${q.options.length + 1}`);
        }
        q.options = q.options.slice(0, 4);

        if (["A", "B", "C", "D"].includes(q.correctAnswer)) {
          const idx = ["A", "B", "C", "D"].indexOf(q.correctAnswer);
          q.correctAnswer = q.options[idx] || "";
        }
      }
      return q;
    });

    res.json({ success: true, questions: formattedQuestions });
  } catch (error) {
    console.error("PDF parse error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────
// Question Bank Endpoints
// ──────────────────────────────────────────────
router.get("/question-bank", isFacultyOrAdmin, async (req, res) => {
  try {
    const { subjectId, chapter, difficulty, search, isFavorite, tags } = req.query;
    const query = {};

    if (subjectId && isValidObjectId(subjectId)) {
      query.subjectId = subjectId;
    }
    if (chapter) {
      query.chapter = new RegExp(escapeRegex(chapter), "i");
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === "true";
    }
    if (tags) {
      const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagArr.length > 0) {
        query.tags = { $in: tagArr };
      }
    }
    if (search) {
      query.question = new RegExp(escapeRegex(search), "i");
    }

    const questions = await MockQuestion.find(query)
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 });

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/question-bank", isFacultyOrAdmin, async (req, res) => {
  try {
    const { subjectId, chapter, type, question, options, correctAnswer, marks, difficulty, tags, isFavorite } = req.body;
    if (!subjectId || !type || !question) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const duplicate = await MockQuestion.findOne({
      subjectId,
      question: { $regex: new RegExp(`^${escapeRegex(question.trim())}$`, "i") }
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: "Question already exists in Question Bank", isDuplicate: true });
    }

    const item = await MockQuestion.create({
      subjectId,
      chapter,
      type,
      question,
      options: type === "MCQ" ? (options || []).map(o => {
        if (typeof o === "object" && o !== null) {
          return { text: normalizeText(o.text), image: o.image || "" };
        }
        return normalizeText(o);
      }) : [],
      correctAnswer,
      marks,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      isFavorite: Boolean(isFavorite),
      image: req.body.image || "",
      images: Array.isArray(req.body.images) ? req.body.images : [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, question: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/question-bank/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const question = await MockQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const fields = req.body;
    if (fields.subjectId !== undefined) question.subjectId = fields.subjectId;
    if (fields.chapter !== undefined) question.chapter = fields.chapter;
    if (fields.type !== undefined) question.type = fields.type;
    if (fields.question !== undefined) question.question = fields.question;
    if (fields.options !== undefined) {
      question.options = fields.options.map(o => {
        if (typeof o === "object" && o !== null) {
          return { text: normalizeText(o.text), image: o.image || "" };
        }
        return normalizeText(o);
      });
    }
    if (fields.correctAnswer !== undefined) question.correctAnswer = fields.correctAnswer;
    if (fields.marks !== undefined) question.marks = fields.marks;
    if (fields.difficulty !== undefined) question.difficulty = fields.difficulty;
    if (fields.tags !== undefined) question.tags = fields.tags;
    if (fields.isFavorite !== undefined) question.isFavorite = fields.isFavorite;
    if (fields.image !== undefined) question.image = fields.image;
    if (fields.images !== undefined) question.images = fields.images;

    await question.save();
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/question-bank/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const question = await MockQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    await question.deleteOne();
    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/question-bank/toggle-favorite/:id", isFacultyOrAdmin, async (req, res) => {
  try {
    const question = await MockQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    question.isFavorite = !question.isFavorite;
    await question.save();
    res.json({ success: true, isFavorite: question.isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/question-bank/import", isFacultyOrAdmin, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Questions must be an array" });
    }

    const imported = [];
    const duplicates = [];

    for (const q of questions) {
      const duplicate = await MockQuestion.findOne({
        subjectId: q.subjectId,
        question: { $regex: new RegExp(`^${escapeRegex(q.question.trim())}$`, "i") }
      });

      if (duplicate) {
        duplicates.push(q);
        continue;
      }

      const item = await MockQuestion.create({
        subjectId: q.subjectId,
        chapter: q.chapter || "",
        type: q.type || "MCQ",
        question: q.question,
        options: q.type === "MCQ" ? (q.options || []).map(o => {
          if (typeof o === "object" && o !== null) {
            return { text: normalizeText(o.text), image: o.image || "" };
          }
          return normalizeText(o);
        }) : [],
        correctAnswer: q.correctAnswer || "",
        marks: q.marks || 1,
        difficulty: q.difficulty || "MEDIUM",
        tags: Array.isArray(q.tags) ? q.tags : [],
        isFavorite: false,
        image: q.image || "",
        images: Array.isArray(q.images) ? q.images : [],
        createdBy: req.user._id
      });
      imported.push(item);
    }

    res.json({ success: true, importedCount: imported.length, duplicatesCount: duplicates.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────
// Exam CRUD routes
// ──────────────────────────────────────────────
router.post("/", isFacultyOrAdmin, async (req, res) => {
  try {
    const fields = req.body || {};
    const { academicYear, courseId, divisionId, semester, subjectId, title, duration, totalMarks } = fields;

    if (!academicYear || !courseId || !divisionId || !semester || !subjectId || !title || !duration || !totalMarks) {
      return res.status(400).json({ success: false, message: "Missing required exam fields" });
    }

    const selected = await validateSelection(req, { courseId, divisionId, subjectId, semester });

    const normalizedQuestions = Array.isArray(fields.questions)
      ? fields.questions.map((question) => ({
          type: String(question.type || "MCQ").toUpperCase(),
          question: normalizeText(question.question),
          options: Array.isArray(question.options) ? question.options.map(o => {
            if (typeof o === "object" && o !== null) {
              return {
                text: normalizeText(o.text),
                image: o.image || ""
              };
            }
            return normalizeText(o);
          }).filter(o => {
            if (typeof o === "object") {
              return o.text || o.image;
            }
            return o !== "";
          }) : [],
          correctAnswer: normalizeText(question.correctAnswer),
          marks: Number(question.marks || 0),
          explanation: normalizeText(question.explanation),
          difficulty: question.difficulty || "MEDIUM",
          chapter: normalizeText(question.chapter),
          image: question.image || "",
          images: Array.isArray(question.images) ? question.images : [],
          tags: Array.isArray(question.tags) ? question.tags : [],
          isFavorite: Boolean(question.isFavorite)
        }))
      : [];

    const mockExam = await MockExam.create({
      ...fields,
      courseId: selected.course._id,
      divisionId: selected.division._id,
      semester: selected.semester,
      subjectId: selected.subject._id,
      questions: normalizedQuestions,
      createdBy: req.user._id,
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
      .populate("createdBy", "username role")
      .sort({ createdAt: -1 });

    const now = new Date();
    const attemptsByExam = exams.length
      ? await ExamAttempt.aggregate([
          { $match: { examId: { $in: exams.map((exam) => exam._id) }, status: { $ne: "in-progress" } } },
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
      .populate("subjectId", "name code")
      .populate("createdBy", "username role");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Mock exam not found" });
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
    if (payload.attemptsAllowed !== undefined) exam.attemptsAllowed = payload.attemptsAllowed;
    if (payload.maxAttempts !== undefined) exam.maxAttempts = Number(payload.maxAttempts);
    if (payload.resumeEnabled !== undefined) exam.resumeEnabled = Boolean(payload.resumeEnabled);
    if (payload.passingMarks !== undefined) exam.passingMarks = Number(payload.passingMarks);
    if (payload.timerPerQuestion !== undefined) exam.timerPerQuestion = Boolean(payload.timerPerQuestion);
    if (payload.timerPerQuestionDuration !== undefined) exam.timerPerQuestionDuration = Number(payload.timerPerQuestionDuration);
    if (payload.fullscreenRequired !== undefined) exam.fullscreenRequired = Boolean(payload.fullscreenRequired);
    if (payload.preventTabSwitch !== undefined) exam.preventTabSwitch = Boolean(payload.preventTabSwitch);
    if (payload.sections !== undefined) exam.sections = payload.sections;

    if (Array.isArray(payload.questions)) {
      exam.questions = payload.questions.map((question) => ({
        type: String(question.type || "MCQ").toUpperCase(),
        question: normalizeText(question.question),
        options: Array.isArray(question.options) ? question.options.map(o => {
          if (typeof o === "object" && o !== null) {
            return {
              text: normalizeText(o.text),
              image: o.image || ""
            };
          }
          return normalizeText(o);
        }).filter(o => {
          if (typeof o === "object") {
            return o.text || o.image;
          }
          return o !== "";
        }) : [],
        correctAnswer: normalizeText(question.correctAnswer),
        marks: Number(question.marks || 0),
        explanation: normalizeText(question.explanation),
        difficulty: question.difficulty || "MEDIUM",
        chapter: normalizeText(question.chapter),
        image: question.image || "",
        images: Array.isArray(question.images) ? question.images : [],
        tags: Array.isArray(question.tags) ? question.tags : [],
        isFavorite: Boolean(question.isFavorite)
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

    const { questions = [] } = req.body || {};
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Questions must be an array" });
    }

    exam.questions = questions.map((question) => ({
      type: String(question.type || "MCQ").toUpperCase(),
      question: normalizeText(question.question),
      options: Array.isArray(question.options) ? question.options.map(o => normalizeText(o)).filter(Boolean) : [],
      correctAnswer: normalizeText(question.correctAnswer),
      marks: Number(question.marks || 0),
      explanation: normalizeText(question.explanation),
      difficulty: question.difficulty || "MEDIUM",
      chapter: normalizeText(question.chapter),
      image: question.image || "",
      tags: Array.isArray(question.tags) ? question.tags : [],
      isFavorite: Boolean(question.isFavorite)
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

    await ExamAttempt.deleteMany({ examId: exam._id });
    await exam.deleteOne();
    res.json({ success: true, message: "Mock exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting mock exam:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────
// Results summary (faculty/admin) with dynamic Topper ranking logic
// ──────────────────────────────────────────────
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

    const attempts = await ExamAttempt.find({ examId: { $in: examIds }, status: { $ne: "in-progress" } })
      .populate("studentId", "studentName rollNo enrollmentNo divisionId courseId")
      .populate("examId", "title duration totalMarks subjectId courseId divisionId semester")
      .sort({ submittedAt: -1 });

    const attemptsGroupedByExam = {};
    attempts.forEach((attempt) => {
      const eId = String(attempt.examId?._id || attempt.examId);
      if (!attemptsGroupedByExam[eId]) {
        attemptsGroupedByExam[eId] = [];
      }
      attemptsGroupedByExam[eId].push(attempt);
    });

    const rankedAttempts = [];
    Object.keys(attemptsGroupedByExam).forEach((eId) => {
      const group = attemptsGroupedByExam[eId];

      group.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.timeTaken !== b.timeTaken) {
          return a.timeTaken - b.timeTaken;
        }
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      });

      group.forEach((attempt, index) => {
        const attemptObj = attempt.toObject();
        attemptObj.rank = index + 1;
        rankedAttempts.push(attemptObj);
      });
    });

    res.json({ success: true, attempts: rankedAttempts });
  } catch (error) {
    console.error("Error fetching mock exam results:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────
// Student portal Mock Exams
// ──────────────────────────────────────────────
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
    }).select("examId score submittedAt timeTaken totalMarks status attemptNumber");

    const attemptsByExam = {};
    attempts.forEach(att => {
      const key = String(att.examId);
      if (!attemptsByExam[key]) attemptsByExam[key] = [];
      attemptsByExam[key].push(att);
    });

    const now = new Date();

    const items = exams.map((exam) => {
      const examAttempts = attemptsByExam[String(exam._id)] || [];
      const completedAttempt = examAttempts.find(att => att.status !== "in-progress");
      const inProgressAttempt = examAttempts.find(att => att.status === "in-progress");

      const attempt = completedAttempt || inProgressAttempt;
      const status = completedAttempt ? "completed" : getExamStatus(exam, now);

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
        attemptsAllowed: exam.attemptsAllowed || "SINGLE",
        maxAttempts: exam.maxAttempts || 1,
        attemptsCount: examAttempts.filter(att => att.status !== "in-progress").length,
        status,
        inProgress: Boolean(inProgressAttempt),
        attempt: attempt
          ? {
              score: attempt.score,
              submittedAt: attempt.submittedAt,
              timeTaken: attempt.timeTaken,
              totalMarks: attempt.totalMarks,
              status: attempt.status,
              attemptNumber: attempt.attemptNumber
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

    const examAttempts = await ExamAttempt.find({ examId: exam._id, studentId: student._id });
    const completedAttemptsCount = examAttempts.filter(att => att.status !== "in-progress").length;
    const inProgressAttempt = examAttempts.find(att => att.status === "in-progress");

    const status = completedAttemptsCount > 0 && exam.attemptsAllowed === "SINGLE" ? "completed" : getExamStatus(exam);

    const hasAttemptsLeft = exam.attemptsAllowed === "MULTIPLE" ? (completedAttemptsCount < exam.maxAttempts) : (completedAttemptsCount === 0);
    const canAttempt = status === "active" && (hasAttemptsLeft || Boolean(inProgressAttempt));

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
        attemptsAllowed: exam.attemptsAllowed || "SINGLE",
        maxAttempts: exam.maxAttempts || 1,
        passingMarks: exam.passingMarks || 18,
        timerPerQuestion: exam.timerPerQuestion || false,
        timerPerQuestionDuration: exam.timerPerQuestionDuration || 0,
        fullscreenRequired: exam.fullscreenRequired || false,
        preventTabSwitch: exam.preventTabSwitch || false,
        sections: exam.sections || [],
        shuffleQuestions: exam.shuffleQuestions || false,
        shuffleOptions: exam.shuffleOptions || false,
        status,
        canAttempt,
        questions: canAttempt ? exam.questions.map((question) => ({
          _id: question._id,
          type: question.type,
          question: question.question,
          options: Array.isArray(question.options) ? question.options : [],
          marks: question.marks || 0,
          difficulty: question.difficulty || "MEDIUM",
          chapter: question.chapter || "",
          image: question.image || "",
          tags: question.tags || [],
        })) : [],
      },
      attempt: inProgressAttempt || examAttempts[0] || null,
      completedAttemptsCount,
    });
  } catch (error) {
    console.error("Error fetching student mock exam details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Exam: Initializes an in-progress attempt
router.post("/student/exams/:id/start", isStudentRole, async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const exam = await MockExam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: "Mock exam not found or unpublished" });
    }

    const examAttempts = await ExamAttempt.find({ examId: exam._id, studentId: student._id });
    const inProgressAttempt = examAttempts.find(att => att.status === "in-progress");

    if (inProgressAttempt) {
      return res.json({ success: true, message: "Resuming existing attempt", attempt: inProgressAttempt });
    }

    const completedCount = examAttempts.filter(att => att.status !== "in-progress").length;
    const hasAttemptsLeft = exam.attemptsAllowed === "MULTIPLE" ? (completedCount < exam.maxAttempts) : (completedCount === 0);

    if (!hasAttemptsLeft) {
      return res.status(403).json({ success: false, message: "You have reached the maximum number of attempts allowed for this exam" });
    }

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: student._id,
      attemptNumber: completedCount + 1,
      answers: [],
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalMarks: exam.totalMarks,
      timeTaken: 0,
      submittedBy: req.user._id,
      status: "in-progress",
    });

    res.json({ success: true, message: "Attempt started", attempt });
  } catch (error) {
    console.error("Error starting exam attempt:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Auto-saves / submits mock exam answers
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

    const submittedAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const timeTaken = Number(req.body?.timeTaken || 0);
    const isAutoSave = Boolean(req.body?.isAutoSave);
    const result = calculateResult(exam, submittedAnswers);

    let attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id, status: "in-progress" });

    if (!attempt) {
      // Find latest completed attempt or create one if not exists (fallback)
      attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id }).sort({ attemptNumber: -1 });
    }

    const targetStatus = isAutoSave 
      ? "in-progress" 
      : (new Date() > new Date(exam.endTime) ? "auto-submitted" : "submitted");

    if (attempt) {
      attempt.answers = result.evaluatedAnswers;
      attempt.score = result.score;
      attempt.correctAnswers = result.correctAnswers;
      attempt.wrongAnswers = result.wrongAnswers;
      attempt.totalMarks = result.totalMarks;
      attempt.timeTaken = Math.min(Math.max(timeTaken, 0), Number(exam.duration) * 60);
      attempt.status = targetStatus;
      attempt.submittedAt = new Date();
      await attempt.save();
    } else {
      const completedCount = await ExamAttempt.countDocuments({ examId: exam._id, studentId: student._id, status: { $ne: "in-progress" } });
      attempt = await ExamAttempt.create({
        examId: exam._id,
        studentId: student._id,
        attemptNumber: completedCount + 1,
        answers: result.evaluatedAnswers,
        score: result.score,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        totalMarks: result.totalMarks,
        submittedAt: new Date(),
        timeTaken: Math.min(Math.max(timeTaken, 0), Number(exam.duration) * 60),
        submittedBy: req.user._id,
        status: targetStatus,
      });
    }

    res.json({
      success: true,
      message: isAutoSave ? "Exam progress auto-saved" : "Exam submitted successfully",
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

    const attempts = await ExamAttempt.find({ studentId: student._id, status: { $ne: "in-progress" } })
      .populate({
        path: "examId",
        select: "title totalMarks duration examType startTime endTime subjectId attemptsAllowed maxAttempts passingMarks",
        populate: { path: "subjectId", select: "name code" },
      })
      .sort({ submittedAt: -1 });

    const results = attempts.map((attempt) => ({
      _id: attempt._id,
      examId: attempt.examId?._id || "",
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
      attemptNumber: attempt.attemptNumber,
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching student mock results:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;