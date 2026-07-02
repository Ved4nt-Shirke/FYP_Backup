import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const blankQuestion = (type = "MCQ") => ({
  type,
  question: "",
  options: [
    { text: "", image: "" },
    { text: "", image: "" },
    { text: "", image: "" },
    { text: "", image: "" }
  ],
  correctAnswer: "",
  marks: 1,
  difficulty: "MEDIUM",
  chapter: "",
  tags: [],
  image: "",
  images: [],
  imageAlignment: "center",
  isFavorite: false,
});

// Client-side image compression using Canvas
const compressImageFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1000;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/webp", 0.82);
        resolve(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const MockExamQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Exam Configurations
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQIndex, setSelectedQIndex] = useState(0);

  // Sidebar Filter / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

  // Right Workspace Tab: "single" | "excel" | "pdf" | "bank"
  const [rightTab, setRightTab] = useState("single");

  // Excel Bulk Upload States
  const [excelQuestions, setExcelQuestions] = useState([]);
  const [excelErrors, setExcelErrors] = useState([]);
  const [excelSummary, setExcelSummary] = useState(null);

  // PDF Extract States
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfQuestions, setPdfQuestions] = useState([]);

  // Question Bank Drawer States
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSearch, setBankSearch] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [bankChapter, setBankChapter] = useState("");
  const [bankFavoriteOnly, setBankFavoriteOnly] = useState(false);

  // Image Utilities States
  const [zoomImage, setZoomImage] = useState(null);
  const [showMathHelper, setShowMathHelper] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Canvas Editor / Drawing States
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorSource, setEditorSource] = useState({ type: "question", index: 0, imgUrl: "" });
  const [editorMode, setEditorMode] = useState("draw"); // "draw" | "crop"
  const [brushColor, setBrushColor] = useState("#ff0000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropEnd, setCropEnd] = useState(null);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Load Exam Details & Questions list
  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.mockExams}/${examId}`);
      if (res.data?.exam) {
        setExam(res.data.exam);
        const examQuestions = (res.data.exam.questions || []).map((q) => {
          // Normalize options to object format: { text: "", image: "" }
          const rawOpts = Array.isArray(q.options) ? q.options : [];
          const normalizedOpts = ["", "", "", ""].map((_, idx) => {
            const optVal = rawOpts[idx];
            if (typeof optVal === "object" && optVal !== null) {
              return {
                text: optVal.text || "",
                image: optVal.image || ""
              };
            }
            return {
              text: optVal || "",
              image: ""
            };
          });

          return {
            type: q.type || "MCQ",
            question: q.question || "",
            options: normalizedOpts,
            correctAnswer: q.correctAnswer || "",
            marks: q.marks || 1,
            difficulty: q.difficulty || "MEDIUM",
            chapter: q.chapter || "",
            tags: q.tags || [],
            image: q.image || "",
            images: Array.isArray(q.images) ? q.images : (q.image ? [q.image] : []),
            imageAlignment: q.imageAlignment || "center",
            isFavorite: Boolean(q.isFavorite),
          };
        });
        setQuestions(examQuestions);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load exam details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  // Load Question Bank when subject is selected or bank tab is opened
  useEffect(() => {
    if (exam?.subjectId?._id && rightTab === "bank") {
      fetchQuestionBank();
    }
  }, [exam?.subjectId?._id, rightTab, bankSearch, bankDifficulty, bankChapter, bankFavoriteOnly]);

  const fetchQuestionBank = async () => {
    try {
      const params = {
        subjectId: exam.subjectId._id,
        search: bankSearch,
        difficulty: bankDifficulty,
        chapter: bankChapter,
        isFavorite: bankFavoriteOnly ? "true" : undefined
      };
      const res = await axios.get(`${config.mockExams}/question-bank`, { params });
      setBankQuestions(res.data?.questions || []);
    } catch (err) {
      console.error("Failed to load Question Bank:", err);
    }
  };

  // Warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in question bank setup. Leave anyway?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Manual & Debounced Auto-Save Questions handler
  const saveQuestionsToServer = async (isAuto = false) => {
    if (!exam || questions.length === 0) return;
    try {
      if (!isAuto) setSaving(true);
      const payload = {
        ...exam,
        courseId: exam.courseId?._id || exam.courseId,
        divisionId: exam.divisionId?._id || exam.divisionId,
        subjectId: exam.subjectId?._id || exam.subjectId,
        questions: questions.map((q) => ({
          type: q.type,
          question: q.question,
          options: q.type === "MCQ" ? q.options : [],
          correctAnswer: q.correctAnswer,
          marks: Number(q.marks || 0),
          difficulty: q.difficulty,
          chapter: q.chapter,
          image: q.images && q.images.length > 0 ? q.images[0] : q.image,
          images: q.images || [],
          imageAlignment: q.imageAlignment || "center",
          tags: q.tags,
          isFavorite: q.isFavorite
        })),
      };

      await axios.put(`${config.mockExams}/${examId}`, payload);
      setIsDirty(false);
      setLastSaved(new Date().toLocaleTimeString());

      // Auto-import newly created questions to Question Bank in background
      const qBankItems = questions.map((q) => ({
        subjectId: exam.subjectId?._id || exam.subjectId,
        chapter: q.chapter,
        type: q.type,
        question: q.question,
        options: q.type === "MCQ" ? q.options : [],
        correctAnswer: q.correctAnswer,
        marks: Number(q.marks || 0),
        difficulty: q.difficulty,
        image: q.images && q.images.length > 0 ? q.images[0] : q.image,
        images: q.images || [],
        imageAlignment: q.imageAlignment || "center",
        tags: q.tags,
      }));
      await axios.post(`${config.mockExams}/question-bank/import`, { questions: qBankItems }).catch(() => {});

      if (!isAuto) {
        setSuccessMsg("Questions saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Failed to save questions");
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  const togglePublishStatus = async () => {
    if (!exam) return;
    try {
      setError("");
      setSaving(true);
      const nextPublished = !exam.isPublished;
      
      // Auto-save questions first
      await saveQuestionsToServer(true);
      
      await axios.patch(`${config.mockExams}/${examId}/publish`, { isPublished: nextPublished });
      
      setExam((prev) => ({ ...prev, isPublished: nextPublished }));
      setSuccessMsg(nextPublished ? "Mock Exam published successfully!" : "Mock Exam unpublished successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update publication status.");
    } finally {
      setSaving(false);
    }
  };

  // Debounce Auto-Save
  useEffect(() => {
    if (!isDirty || !exam) return;
    const timer = setTimeout(() => {
      saveQuestionsToServer(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [questions, isDirty]);

  // Real-time totals validations
  const allocatedMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
  }, [questions]);

  const marksMismatch = useMemo(() => {
    if (!exam) return false;
    return Number(allocatedMarks) !== Number(exam.totalMarks);
  }, [allocatedMarks, exam]);

  // Sidebar questions filter logic
  const filteredQuestionsIndices = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        const matchSearch = !searchQuery || q.question.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDiff = !filterDifficulty || q.difficulty === filterDifficulty;
        const matchChapter = !filterChapter || q.chapter.toLowerCase().includes(filterChapter.toLowerCase());
        return matchSearch && matchDiff && matchChapter;
      })
      .map(({ idx }) => idx);
  }, [questions, searchQuery, filterDifficulty, filterChapter]);

  // Selected Question Accessor
  const activeQuestion = questions[selectedQIndex] || null;

  // Single Question mutators
  const updateActiveQuestion = (key, value) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === selectedQIndex ? { ...q, [key]: value } : q)));
    setIsDirty(true);
  };

  const updateActiveOption = (optIdx, textValue, imageValue = undefined) => {
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== selectedQIndex) return q;
      const nextOpts = [...q.options];
      nextOpts[optIdx] = {
        text: textValue !== undefined ? textValue : nextOpts[optIdx].text,
        image: imageValue !== undefined ? imageValue : nextOpts[optIdx].image
      };
      return { ...q, options: nextOpts };
    }));
    setIsDirty(true);
  };

  // Up/Down reorder list buttons
  const moveQuestion = (index, dir) => {
    if (dir === "up" && index === 0) return;
    if (dir === "down" && index === questions.length - 1) return;

    const nextIndex = dir === "up" ? index - 1 : index + 1;
    const nextQList = [...questions];
    const temp = nextQList[index];
    nextQList[index] = nextQList[nextIndex];
    nextQList[nextIndex] = temp;

    setQuestions(nextQList);
    setSelectedQIndex(nextIndex);
    setIsDirty(true);
  };

  const duplicateQuestion = (index) => {
    const qToCopy = questions[index];
    if (!qToCopy) return;

    const duplicate = {
      ...qToCopy,
      question: `${qToCopy.question} (Copy)`,
      options: qToCopy.options.map(o => ({ ...o })),
      images: Array.isArray(qToCopy.images) ? [...qToCopy.images] : [],
      tags: [...qToCopy.tags],
    };

    setQuestions((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
    setSelectedQIndex(index + 1);
    setIsDirty(true);
  };

  const deleteQuestion = (index) => {
    if (questions.length <= 1) {
      alert("An exam must contain at least one question.");
      return;
    }
    if (!window.confirm(`Delete Question ${index + 1}?`)) return;

    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedQIndex((prevIdx) => Math.max(0, prevIdx - 1));
    setIsDirty(true);
  };

  const appendNewQuestion = (type) => {
    const newQ = blankQuestion(type);
    setQuestions((prev) => [...prev, newQ]);
    setSelectedQIndex(questions.length);
    setRightTab("single");
    setIsDirty(true);
  };

  // Copy images from previous question helper
  const copyImagesFromPreviousQuestion = () => {
    if (selectedQIndex <= 0) {
      alert("No previous question exists to copy images from.");
      return;
    }
    const prevQ = questions[selectedQIndex - 1];
    if (prevQ && Array.isArray(prevQ.images) && prevQ.images.length > 0) {
      updateActiveQuestion("images", [...(activeQuestion.images || []), ...prevQ.images]);
      setSuccessMsg("Copied images from Question " + selectedQIndex);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      alert("Previous question does not have any images.");
    }
  };

  // Rich Text Helpers (Simple tag injection)
  const formatText = (tag) => {
    const textarea = document.getElementById("q-text-editor");
    if (!textarea || !activeQuestion) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formatted = "";
    if (tag === "bold") formatted = `**${selectedText || "bold text"}**`;
    else if (tag === "italic") formatted = `*${selectedText || "italic text"}*`;
    else if (tag === "underline") formatted = `<u>${selectedText || "underlined text"}</u>`;

    const updatedText = text.substring(0, start) + formatted + text.substring(end);
    updateActiveQuestion("question", updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selectedText || "text").length);
    }, 50);
  };

  const insertCodeBlock = (lang) => {
    const textarea = document.getElementById("q-text-editor");
    if (!textarea || !activeQuestion) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const codeTemplate = `\n\`\`\`${lang}\n// Type your ${lang} code here\n\n\`\`\`\n`;

    const updatedText = text.substring(0, start) + codeTemplate + text.substring(end);
    updateActiveQuestion("question", updatedText);
  };

  const insertMathEquation = (eqText) => {
    const textarea = document.getElementById("q-text-editor");
    if (!textarea || !activeQuestion) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const updatedText = text.substring(0, start) + eqText + text.substring(end);
    updateActiveQuestion("question", updatedText);
    textarea.focus();
  };

  // Image Uploading to backend
  const uploadImageToServer = async (fileOrBase64) => {
    try {
      let res;
      if (typeof fileOrBase64 === "string") {
        res = await axios.post(`${config.mockExams}/upload-image`, { image: fileOrBase64 });
      } else {
        const formData = new FormData();
        formData.append("image", fileOrBase64);
        res = await axios.post(`${config.mockExams}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      return res.data?.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload image to server.");
      return null;
    }
  };

  const handleImageUpload = async (file, type, optionIndex = 0) => {
    if (!file) return;
    setSaving(true);
    try {
      const compressedBase64 = await compressImageFile(file);
      const url = await uploadImageToServer(compressedBase64);
      if (url) {
        if (type === "question") {
          const currentImages = activeQuestion.images || [];
          updateActiveQuestion("images", [...currentImages, url]);
        } else if (type === "option") {
          updateActiveOption(optionIndex, undefined, url);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Direct paste support
  const handleImagePaste = async (e, type, optionIndex = 0) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        await handleImageUpload(file, type, optionIndex);
        break;
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragover");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
  };

  const handleDrop = async (e, type, optionIndex = 0) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleImageUpload(files[0], type, optionIndex);
    }
  };

  // True/False helper
  const setupTrueFalse = (value) => {
    if (!activeQuestion) return;
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== selectedQIndex) return q;
      return {
        ...q,
        options: [
          { text: "True", image: "" },
          { text: "False", image: "" },
          { text: "", image: "" },
          { text: "", image: "" }
        ],
        correctAnswer: value,
      };
    }));
    setIsDirty(true);
  };

  // Simulated OCR Scanner
  const handleOCRScan = (imageUrl) => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrLoading(false);
      const mockOCRResults = [
        "Simplify the algebraic expression:\n$$3x(x - 5) + 2(x^2 - 4)$$\nSelect the correct simplified option below.",
        "What is the output of the following Java snippet?\n```java\nint x = 5;\nSystem.out.println(x++ + ++x);\n```",
        "Given a right-angled triangle with base $b = 8$ and height $h = 6$, calculate the hypotenuse length.\nA) 10\nB) 14\nC) 12\nD) 15",
        "Under MSBTE curriculum standards, what is the weightage of the End Semester Exam?\nA) 70 Marks\nB) 30 Marks\nC) 50 Marks\nD) 100 Marks"
      ];
      const parsedText = mockOCRResults[Math.floor(Math.random() * mockOCRResults.length)];
      const approve = window.confirm(`OCR Extracted Text:\n\n"${parsedText}"\n\nWould you like to import this text into the question field?`);
      if (approve) {
        updateActiveQuestion("question", parsedText);
      }
    }, 1800);
  };

  // Question Bank Importer
  const importFromBank = (bankQ) => {
    const isDup = questions.some(q => q.question.toLowerCase().trim() === bankQ.question.toLowerCase().trim());
    if (isDup && !window.confirm("A similar question already exists in this exam. Add anyway?")) return;

    const rawOpts = Array.isArray(bankQ.options) ? bankQ.options : [];
    const normalizedOpts = ["", "", "", ""].map((_, idx) => {
      const optVal = rawOpts[idx];
      if (typeof optVal === "object" && optVal !== null) {
        return { text: optVal.text || "", image: optVal.image || "" };
      }
      return { text: optVal || "", image: "" };
    });

    const imported = {
      type: bankQ.type,
      question: bankQ.question,
      options: normalizedOpts,
      correctAnswer: bankQ.correctAnswer,
      marks: bankQ.marks || 1,
      difficulty: bankQ.difficulty || "MEDIUM",
      chapter: bankQ.chapter || "",
      tags: bankQ.tags || [],
      isFavorite: bankQ.isFavorite || false,
      image: bankQ.image || "",
      images: Array.isArray(bankQ.images) ? bankQ.images : (bankQ.image ? [bankQ.image] : []),
      imageAlignment: bankQ.imageAlignment || "center",
    };

    setQuestions((prev) => [...prev, imported]);
    setSelectedQIndex(questions.length);
    setRightTab("single");
    setIsDirty(true);
    setSuccessMsg("Imported from Central Question Bank!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const toggleBankFavorite = async (bankQ) => {
    try {
      const res = await axios.post(`${config.mockExams}/question-bank/toggle-favorite/${bankQ._id}`);
      if (res.data?.success) {
        fetchQuestionBank();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excel Bulk Upload Parser
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length <= 1) {
        setError("Uploaded Excel template contains no data records.");
        return;
      }

      const headers = jsonData[0].map(h => String(h || "").trim());
      const rows = jsonData.slice(1);
      const parsedQuestions = [];
      const validationErrors = [];

      rows.forEach((row, rIdx) => {
        const rowNumber = rIdx + 2;
        const qObj = {};
        headers.forEach((h, colIdx) => {
          qObj[h] = row[colIdx];
        });

        const questionText = qObj["Question"];
        const optA = qObj["Option A"];
        const optB = qObj["Option B"];
        const optC = qObj["Option C"];
        const optD = qObj["Option D"];
        const correctAns = qObj["Correct Answer"];
        const marksVal = qObj["Marks"];
        const difficulty = String(qObj["Difficulty Level"] || "MEDIUM").trim().toUpperCase();
        const chapter = qObj["Chapter"] || "";
        const tags = qObj["Tags"] ? String(qObj["Tags"]).split(",").map(t => t.trim()) : [];

        const rowErrors = [];
        if (!questionText) rowErrors.push("Question text is empty");

        const isMCQ = Boolean(optA || optB || optC || optD);
        const marks = Number(marksVal);
        if (isNaN(marks) || marks < 0) rowErrors.push("Marks must be a positive number");

        if (isMCQ) {
          if (!optA || !optB || !optC || !optD) rowErrors.push("MCQ question requires Option A, B, C, and D");
          if (!correctAns) {
            rowErrors.push("Correct Answer option label is missing");
          } else {
            const correctStr = String(correctAns).trim().toLowerCase();
            const matchingOpt = [optA, optB, optC, optD].some(o => String(o).trim().toLowerCase() === correctStr);
            const matchingLetter = ["a", "b", "c", "d"].includes(correctStr);

            if (!matchingOpt && !matchingLetter) {
              rowErrors.push(`Correct Answer '${correctAns}' must match one of Option A/B/C/D or be A, B, C, or D`);
            }
          }
        }

        if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
          rowErrors.push("Difficulty Level must be EASY, MEDIUM, or HARD");
        }

        if (rowErrors.length > 0) {
          validationErrors.push({ rowNumber, errors: rowErrors });
        } else {
          let resolvedCorrectAnswer = String(correctAns).trim();
          if (isMCQ && ["A", "B", "C", "D", "a", "b", "c", "d"].includes(resolvedCorrectAnswer)) {
            const idx = ["a", "b", "c", "d"].indexOf(resolvedCorrectAnswer.toLowerCase());
            resolvedCorrectAnswer = String([optA, optB, optC, optD][idx]);
          }

          parsedQuestions.push({
            type: isMCQ ? "MCQ" : "THEORY",
            question: String(questionText).trim(),
            options: isMCQ ? [
              { text: String(optA || "").trim(), image: "" },
              { text: String(optB || "").trim(), image: "" },
              { text: String(optC || "").trim(), image: "" },
              { text: String(optD || "").trim(), image: "" }
            ] : [],
            correctAnswer: resolvedCorrectAnswer,
            marks: marks || 1,
            difficulty,
            chapter: String(chapter).trim(),
            tags,
            image: "",
            images: [],
            imageAlignment: "center",
            isFavorite: false,
          });
        }
      });

      setExcelQuestions(parsedQuestions);
      setExcelErrors(validationErrors);
      setExcelSummary({
        totalParsed: rows.length,
        validCount: parsedQuestions.length,
        invalidCount: validationErrors.length
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const importValidExcelQuestions = () => {
    if (excelQuestions.length === 0) return;
    setQuestions((prev) => {
      const current = prev.length === 1 && !prev[0].question ? [] : prev;
      return [...current, ...excelQuestions];
    });
    setSuccessMsg(`Successfully imported ${excelQuestions.length} questions from Excel!`);
    setExcelQuestions([]);
    setExcelErrors([]);
    setExcelSummary(null);
    setRightTab("single");
    setSelectedQIndex(questions.length);
    setIsDirty(true);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Marks", "Difficulty Level", "Chapter", "Tags"],
      ["What is the default port for React Vite dev server?", "3000", "5173", "8080", "5000", "5173", 1, "EASY", "Vite", "React,WebDev"],
      ["Mongoose is an ODM library for MongoDB.", "True", "False", "", "", "True", 2, "EASY", "Database", "MongoDB,Mongoose"],
      ["Explain the concept of Virtual DOM in React.", "", "", "", "", "", 5, "MEDIUM", "React Core", "React,Interview"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Mock Questions Template");
    XLSX.writeFile(wb, "mock_questions_template.xlsx");
  };

  // PDF upload extraction
  const triggerPdfExtraction = async () => {
    if (!pdfFile) return;
    setPdfParsing(true);
    setError("");
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const res = await axios.post(`${config.mockExams}/upload-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        const parsed = (res.data.questions || []).map(q => ({
          ...q,
          options: q.type === "MCQ" ? (q.options || []).map(opt => ({ text: opt, image: "" })) : [],
          images: [],
          imageAlignment: "center"
        }));
        setPdfQuestions(parsed);
      } else {
        setError("Failed to extract questions from PDF.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to parse PDF questions");
    } finally {
      setPdfParsing(false);
    }
  };

  const importPdfQuestions = () => {
    if (pdfQuestions.length === 0) return;
    setQuestions((prev) => {
      const current = prev.length === 1 && !prev[0].question ? [] : prev;
      return [...current, ...pdfQuestions];
    });
    setSuccessMsg(`Successfully imported ${pdfQuestions.length} questions from PDF!`);
    setPdfQuestions([]);
    setPdfFile(null);
    setRightTab("single");
    setSelectedQIndex(questions.length);
    setIsDirty(true);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Canvas Annotations Modal Initializer
  const openCanvasEditor = (type, index, imgUrl) => {
    setEditorSource({ type, index, imgUrl });
    setShowEditorModal(true);
    setEditorMode("draw");
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = imgUrl;
    }, 100);
  };

  const startCanvasDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || editorMode !== "draw") return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const canvasDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (editorMode === "draw" && isDrawing) {
      const ctx = canvas.getContext("2d");
      ctx.lineTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else if (editorMode === "crop" && cropStart) {
      setCropEnd({ x, y });
    }
  };

  const stopCanvasDrawing = () => {
    if (editorMode === "draw") {
      setIsDrawing(false);
    } else if (editorMode === "crop" && cropStart && cropEnd) {
      // Execute Crop
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropStart.x - cropEnd.x);
      const h = Math.abs(cropStart.y - cropEnd.y);

      if (w > 10 && h > 10) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(tempCanvas, 0, 0);
      }
      setCropStart(null);
      setCropEnd(null);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (editorMode === "draw") {
      startCanvasDrawing(e);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      setCropStart({ x, y });
      setCropEnd({ x, y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    canvasDraw(e);
  };

  const handleCanvasMouseUp = () => {
    stopCanvasDrawing();
  };

  const saveEditedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/webp", 0.85);
    setSaving(true);
    setShowEditorModal(false);
    try {
      const url = await uploadImageToServer(base64);
      if (url) {
        if (editorSource.type === "question") {
          const updatedImages = [...(activeQuestion.images || [])];
          updatedImages[editorSource.index] = url;
          updateActiveQuestion("images", updatedImages);
        } else if (editorSource.type === "option") {
          updateActiveOption(editorSource.index, undefined, url);
        }
        setSuccessMsg("Edited image saved!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Preview formatted text helper
  const RenderFormattedText = ({ text }) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="formatted-text-container">
        {parts.map((part, index) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : "code";
            const code = match ? match[2] : part.slice(3, -3);
            return (
              <div key={index} className="code-block-wrapper my-2">
                <div className="code-block-header">{lang}</div>
                <pre className="m-0"><code>{code}</code></pre>
              </div>
            );
          }
          let innerHTML = part
            .replace(/\$\$(.*?)\$\$/g, '<div class="text-center p-2 my-2 border rounded bg-light font-monospace text-dark">$1</div>')
            .replace(/\$(.*?)\$/g, '<span class="px-1 font-monospace text-danger bg-light border rounded">$1</span>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
            .replace(/\n/g, '<br />');
          return (
            <span key={index} dangerouslySetInnerHTML={{ __html: innerHTML }} />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status" />
          <div className="text-muted">Loading Questions Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        {/* Header Details Card */}
        <div className="mock-exam-hero" style={{ padding: "20px 24px" }}>
          <div>
            <span className="mock-exam-pill"><i className="bi bi-gear-wide-connected" /> Question Workspace</span>
            <h1 className="mock-exam-title">{exam?.title || "Exam Questions"}</h1>
            <p className="mock-exam-subtitle" style={{ margin: "4px 0" }}>
              Subject: <strong>{exam?.subjectId?.name} ({exam?.subjectId?.code})</strong> | Semester: <strong>Sem {exam?.semester}</strong>
            </p>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <span className={`badge ${exam?.isPublished ? "bg-success" : "bg-warning text-dark"}`}>
                {exam?.isPublished ? "Published" : "Draft / Unpublished"}
              </span>
              <span className="badge bg-light text-dark border">Max Marks: {exam?.totalMarks}</span>
              <span className="badge bg-light text-dark border">Questions: {questions.length}</span>
              <span className={`badge ${marksMismatch ? "bg-danger" : "bg-success"}`}>
                <i className={`bi ${marksMismatch ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} me-1`} />
                Allocated Marks: {allocatedMarks} / {exam?.totalMarks}
              </span>
              {lastSaved && (
                <div className="autosave-badge-container ms-2">
                  <div className="autosave-dot" />
                  <span>Saved at {lastSaved}</span>
                </div>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className={`mock-exam-button ${exam?.isPublished ? "secondary" : "primary"}`} onClick={togglePublishStatus} disabled={saving} style={{ background: exam?.isPublished ? "" : "var(--primary-color)" }}>
              {exam?.isPublished ? <><i className="bi bi-eye-slash" /> Unpublish</> : <><i className="bi bi-eye" /> Publish Exam</>}
            </button>
            <button className="mock-exam-button secondary" onClick={() => navigate("/faculty/mock-exams/manage")}>
              Exit
            </button>
            <button className="mock-exam-button" onClick={() => saveQuestionsToServer(false)} disabled={saving}>
              {saving ? "Saving..." : "Save Questions"}
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
        {successMsg ? <div className="alert alert-success mb-3">{successMsg}</div> : null}

        {/* Workspace Columns */}
        <div className="questions-workspace">
          
          {/* Left Panel: Question List Navigation */}
          <div className="questions-sidebar">
            <div className="border-bottom pb-2">
              <h3 className="mock-exam-card-title m-0" style={{ fontSize: "0.9rem" }}>Questions List</h3>
            </div>
            
            {/* Quick Filter Controls */}
            <div className="d-flex flex-column gap-2">
              <input 
                className="mock-exam-input" 
                placeholder="Search question text..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{ padding: "6px 10px", fontSize: "0.82rem" }}
              />
              <div className="d-flex gap-2">
                <select className="mock-exam-select" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ padding: "4px 8px", fontSize: "0.8rem", width: "50%" }}>
                  <option value="">Difficulty</option>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
                <input 
                  className="mock-exam-input" 
                  placeholder="Chapter..." 
                  value={filterChapter} 
                  onChange={(e) => setFilterChapter(e.target.value)} 
                  style={{ padding: "4px 8px", fontSize: "0.8rem", width: "50%" }}
                />
              </div>
            </div>

            {/* Questions list */}
            <div className="questions-list-scrollable">
              {filteredQuestionsIndices.map((idx) => {
                const q = questions[idx];
                const isActive = idx === selectedQIndex;
                return (
                  <div 
                    key={idx} 
                    className={`question-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setSelectedQIndex(idx);
                      setRightTab("single");
                    }}
                  >
                    <div className="question-nav-details">
                      <div className="question-nav-text">
                        Q{idx + 1}. {q.question || <span className="text-muted italic">Blank Question</span>}
                      </div>
                      <div className="question-nav-meta text-muted">
                        <span className="badge bg-light text-dark border">{q.type}</span>
                        <span className="badge bg-light text-dark border">{q.marks}M</span>
                        {q.difficulty && <span className={`badge ${q.difficulty === 'EASY' ? 'bg-success-light text-success' : q.difficulty === 'HARD' ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning'}`} style={{ textTransform: "lowercase", fontSize: "0.68rem" }}>{q.difficulty}</span>}
                      </div>
                    </div>

                    <div className="d-flex gap-1 align-items-center">
                      <div className="reorder-button-group">
                        <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, "up"); }} disabled={idx === 0} title="Move Up">
                          ▲
                        </button>
                        <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, "down"); }} disabled={idx === questions.length - 1} title="Move Down">
                          ▼
                        </button>
                      </div>
                      <button className="btn btn-sm text-secondary p-1" onClick={(e) => { e.stopPropagation(); duplicateQuestion(idx); }} title="Duplicate">
                        <i className="bi bi-files" />
                      </button>
                      <button className="btn btn-sm text-danger p-1" onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }} title="Delete">
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredQuestionsIndices.length === 0 && (
                <div className="text-center text-muted py-4" style={{ fontSize: "0.82rem" }}>
                  No questions match your filters.
                </div>
              )}
            </div>

            <div className="d-flex gap-2 border-top pt-3 mt-2">
              <button className="mock-exam-button secondary w-100 py-2" onClick={() => appendNewQuestion("MCQ")} style={{ fontSize: "0.8rem" }}>
                + MCQ Q
              </button>
              <button className="mock-exam-button secondary w-100 py-2" onClick={() => appendNewQuestion("THEORY")} style={{ fontSize: "0.8rem" }}>
                + Theory Q
              </button>
            </div>
          </div>

          {/* Right Panel: Workspace Tabs & Editors */}
          <div className="workspace-right-pane">
            <div className="mock-exam-tabs mb-4">
              <button className={`mock-exam-tab ${rightTab === "single" ? "active" : ""}`} onClick={() => setRightTab("single")} disabled={!activeQuestion}>
                <i className="bi bi-pencil-square me-1" /> Single Editor
              </button>
              <button className={`mock-exam-tab ${rightTab === "excel" ? "active" : ""}`} onClick={() => setRightTab("excel")}>
                <i className="bi bi-file-earmark-excel me-1" /> Excel Import
              </button>
              <button className={`mock-exam-tab ${rightTab === "pdf" ? "active" : ""}`} onClick={() => setRightTab("pdf")}>
                <i className="bi bi-file-earmark-pdf me-1" /> PDF Extractor
              </button>
              <button className={`mock-exam-tab ${rightTab === "bank" ? "active" : ""}`} onClick={() => setRightTab("bank")}>
                <i className="bi bi-bank me-1" /> Question Bank
              </button>
            </div>

            {/* 1. Single Question Editor */}
            {rightTab === "single" && activeQuestion && (
              <div className="mock-exam-card p-0 border-0 shadow-none">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Editing Question {selectedQIndex + 1}</h4>
                  <div className="d-flex gap-2 align-items-center">
                    {selectedQIndex > 0 && (
                      <button className="btn btn-sm btn-light border text-dark" onClick={copyImagesFromPreviousQuestion}>
                        <i className="bi bi-copy me-1" /> Copy Image from Previous Q
                      </button>
                    )}
                    <span className="badge bg-secondary">{activeQuestion.type}</span>
                  </div>
                </div>

                <div className="custom-form-group mb-3">
                  <label className="d-flex justify-content-between">
                    <span>Question Text (Markdown & LaTeX Supported)</span>
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>Type $x^2$ for equations, or ```js for code blocks</span>
                  </label>
                  
                  {/* Rich Text Toolbar */}
                  <div className="rich-editor-bar flex-wrap gap-1">
                    <button className="rich-editor-btn" type="button" onClick={() => formatText("bold")} title="Bold">B</button>
                    <button className="rich-editor-btn" type="button" onClick={() => formatText("italic")} title="Italic">I</button>
                    <button className="rich-editor-btn" type="button" onClick={() => formatText("underline")} title="Underline">U</button>
                    
                    <div className="vr mx-1" style={{ width: 1, background: "#d1d5db", height: 28 }} />
                    
                    <button className="rich-editor-btn" type="button" onClick={() => setShowMathHelper(!showMathHelper)} title="Insert Math Equation">
                      <strong style={{ fontSize: "0.8rem" }}>√x</strong>
                    </button>
                    <button className="rich-editor-btn" type="button" onClick={() => insertCodeBlock("js")} title="Insert Code Block">
                      <i className="bi bi-code-slash" />
                    </button>

                    <div className="vr mx-1" style={{ width: 1, background: "#d1d5db", height: 28 }} />

                    <input type="file" id="q-workspace-img-upload" style={{ display: "none" }} accept="image/jpeg, image/png, image/jpg, image/webp" onChange={(e) => handleImageUpload(e.target.files[0], "question")} />
                    <button className="rich-editor-btn" type="button" onClick={() => document.getElementById("q-workspace-img-upload").click()} title="Attach Image File">
                      <i className="bi bi-image" />
                    </button>

                    <button className="rich-editor-btn" type="button" onClick={() => {
                      const pasteBox = prompt("Paste base64 image data (e.g. data:image/png;base64,...):");
                      if (pasteBox) uploadImageToServer(pasteBox).then(url => {
                        if (url) updateActiveQuestion("images", [...(activeQuestion.images || []), url]);
                      });
                    }} title="Paste Base64 Link">
                      <i className="bi bi-clipboard" />
                    </button>

                    <div className="vr mx-1" style={{ width: 1, background: "#d1d5db", height: 28 }} />
                    
                    {/* Image Align controls */}
                    <select className="mock-exam-select py-1 px-2 border" style={{ width: "auto", fontSize: "0.8rem" }} value={activeQuestion.imageAlignment || "center"} onChange={(e) => updateActiveQuestion("imageAlignment", e.target.value)}>
                      <option value="left">Align Left</option>
                      <option value="center">Align Center</option>
                      <option value="right">Align Right</option>
                    </select>
                  </div>

                  {/* Math Symbols Picker */}
                  {showMathHelper && (
                    <div className="math-expression-panel mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>Quick Math Symbol Helper</span>
                        <button className="btn btn-close btn-sm p-1" onClick={() => setShowMathHelper(false)} style={{ fontSize: "0.7rem" }}></button>
                      </div>
                      <div className="math-symbols-grid">
                        {["²", "³", "√x", "π", "θ", "∫", "α", "β", "λ", "∑", "±", "≠", "≤", "≥", "→", "$x^2$", "$$\\frac{a}{b}$$"].map((sym) => (
                          <button key={sym} className="math-symbol-btn" type="button" onClick={() => insertMathEquation(sym)}>
                            {sym.replace(/\$/g, "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    id="q-text-editor"
                    className="mock-exam-textarea rich-editor-textarea"
                    placeholder="Type your question here. Paste image directly or drag onto dropzone below..."
                    value={activeQuestion.question}
                    onPaste={(e) => handleImagePaste(e, "question")}
                    onChange={(e) => updateActiveQuestion("question", e.target.value)}
                  />
                </div>

                {/* Drag and Drop Zone for Question */}
                <div 
                  className="drag-drop-zone mb-3" 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={(e) => handleDrop(e, "question")}
                >
                  <i className="bi bi-cloud-upload-fill" />
                  <p>Drag and drop a question image here, or paste screenshot directly into the text editor.</p>
                </div>

                {/* Question Image Gallery */}
                {activeQuestion.images && activeQuestion.images.length > 0 && (
                  <div className="mb-3">
                    <label className="d-block mb-1">Attached Images ({activeQuestion.images.length})</label>
                    <div className="multiple-images-list" style={{ justifyContent: activeQuestion.imageAlignment === "left" ? "flex-start" : activeQuestion.imageAlignment === "right" ? "flex-end" : "center" }}>
                      {activeQuestion.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="question-image-container">
                          <img src={imgUrl} alt={`Q Graphic ${imgIdx + 1}`} onClick={() => setZoomImage(imgUrl)} />
                          <div className="image-action-overlay">
                            <button className="image-action-btn" type="button" onClick={() => openCanvasEditor("question", imgIdx, imgUrl)} title="Annotate / Crop Image">
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="image-action-btn" type="button" onClick={() => handleOCRScan(imgUrl)} title="Extract Text (OCR)">
                              <i className="bi bi-search" />
                            </button>
                            <button className="image-action-btn delete" type="button" onClick={() => {
                              const nextImgs = activeQuestion.images.filter((_, idx) => idx !== imgIdx);
                              updateActiveQuestion("images", nextImgs);
                            }} title="Delete Image">
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated OCR Scanner line indicator */}
                {ocrLoading && (
                  <div className="alert alert-info py-2 d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm text-info" role="status" />
                    <span>Scanning image structure... Running OCR engine...</span>
                  </div>
                )}

                {/* Question Formatting Live Preview */}
                <div className="mb-4 p-3 border rounded-3 bg-light">
                  <span className="badge bg-secondary mb-2" style={{ fontSize: "0.68rem" }}>Live Format Preview</span>
                  <div className="text-dark" style={{ minHeight: "24px" }}>
                    <RenderFormattedText text={activeQuestion.question} />
                  </div>
                </div>

                {/* Options Layout (MCQ type only) */}
                {activeQuestion.type === "MCQ" ? (
                  <div className="mb-3">
                    <label className="mb-2" style={{ fontWeight: 800 }}>Answer Options Cards (2x2 Grid)</label>
                    
                    <div className="options-editor-grid">
                      {activeQuestion.options.map((opt, oIdx) => {
                        const label = ["A", "B", "C", "D"][oIdx];
                        return (
                          <div key={oIdx} className="option-editor-card">
                            <div className="option-editor-header">
                              <span className="option-label-badge">Option {label}</span>
                              {opt.image && (
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-light border p-1" type="button" onClick={() => openCanvasEditor("option", oIdx, opt.image)} title="Draw on Image">
                                    <i className="bi bi-pencil text-muted" />
                                  </button>
                                  <button className="btn btn-sm btn-danger p-1" type="button" onClick={() => updateActiveOption(oIdx, undefined, "")} title="Remove Option Image">
                                    <i className="bi bi-trash" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Option image preview if attached */}
                            {opt.image ? (
                              <div className="image-thumbnail-preview">
                                <img src={opt.image} alt={`Option ${label}`} onClick={() => setZoomImage(opt.image)} />
                              </div>
                            ) : (
                              <div 
                                className="drag-drop-zone py-2 px-1 border-1 text-center" 
                                style={{ borderRadius: 6, fontSize: "0.78rem" }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, "option", oIdx)}
                              >
                                <p style={{ fontSize: "0.72rem" }} className="mb-0">
                                  Drop image here, paste, or select below.
                                </p>
                                <input 
                                  type="file" 
                                  id={`opt-${oIdx}-img`} 
                                  style={{ display: "none" }} 
                                  accept="image/*" 
                                  onChange={(e) => handleImageUpload(e.target.files[0], "option", oIdx)} 
                                />
                                <button className="btn btn-sm btn-light border py-0 px-2 mt-1" style={{ fontSize: "0.68rem" }} onClick={() => document.getElementById(`opt-${oIdx}-img`).click()}>
                                  + Upload
                                </button>
                              </div>
                            )}

                            {/* Text Input */}
                            <input 
                              className="mock-exam-input" 
                              value={opt.text || ""} 
                              placeholder={`Option ${label} Text (Or leave blank if Image only)`} 
                              onPaste={(e) => handleImagePaste(e, "option", oIdx)}
                              onChange={(e) => updateActiveOption(oIdx, e.target.value)} 
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mock-exam-form-grid mt-3" style={{ gap: "16px" }}>
                      <div className="custom-form-group">
                        <label>Correct Answer option</label>
                        <select className="mock-exam-select" value={activeQuestion.correctAnswer} onChange={(e) => updateActiveQuestion("correctAnswer", e.target.value)}>
                          <option value="">Select Correct Option</option>
                          {activeQuestion.options.map((opt, idx) => {
                            const label = ["A", "B", "C", "D"][idx];
                            const textVal = opt.text || `Option ${label}`;
                            return (
                              <option key={idx} value={textVal}>
                                {label}. {opt.text ? opt.text : "[Image Only]"}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="custom-form-group">
                        <label>Marks</label>
                        <input className="mock-exam-input" type="number" min="1" value={activeQuestion.marks} onChange={(e) => updateActiveQuestion("marks", Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="mt-3 d-flex gap-2 align-items-center">
                      <span className="text-muted" style={{ fontSize: "0.82rem" }}>Quick T/F setup:</span>
                      <button className="btn btn-sm btn-light border text-dark" type="button" onClick={() => setupTrueFalse("True")}>Set True</button>
                      <button className="btn btn-sm btn-light border text-dark" type="button" onClick={() => setupTrueFalse("False")}>Set False</button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="custom-form-group mb-3">
                      <label>Model Answer / Evaluation Criteria</label>
                      <textarea className="mock-exam-textarea" placeholder="Descriptive answer evaluation notes..." value={activeQuestion.explanation || ""} onChange={(e) => updateActiveQuestion("explanation", e.target.value)} style={{ minHeight: 90 }} />
                    </div>
                    <div className="custom-form-group">
                      <label>Question Marks</label>
                      <input className="mock-exam-input" type="number" min="1" value={activeQuestion.marks} onChange={(e) => updateActiveQuestion("marks", Number(e.target.value))} />
                    </div>
                  </div>
                )}

                <div className="mock-exam-form-grid mt-3 border-top pt-3" style={{ gap: "16px" }}>
                  <div className="custom-form-group">
                    <label>Difficulty</label>
                    <select className="mock-exam-select" value={activeQuestion.difficulty} onChange={(e) => updateActiveQuestion("difficulty", e.target.value)}>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                  <div className="custom-form-group">
                    <label>Chapter</label>
                    <input className="mock-exam-input" placeholder="e.g. Chapter 2" value={activeQuestion.chapter} onChange={(e) => updateActiveQuestion("chapter", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {rightTab === "single" && !activeQuestion && (
              <div className="text-center text-muted py-5">
                <i className="bi bi-pencil-square" style={{ fontSize: "2.5rem" }} />
                <p className="mt-2">No question selected. Click a question on the left or add a new one to begin editing.</p>
              </div>
            )}

            {/* 2. Excel Bulk Upload */}
            {rightTab === "excel" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 style={{ fontWeight: 800, margin: 0 }}><i className="bi bi-file-earmark-excel-fill text-success" /> Excel Question Import</h4>
                  <button className="mock-exam-button secondary py-1 px-3" onClick={downloadExcelTemplate} style={{ fontSize: "0.82rem" }}>
                    <i className="bi bi-download" /> Download Template
                  </button>
                </div>
                <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                  Download the template, fill in your questions, options, correct answers, and upload it to import in bulk.
                </p>
                <input type="file" className="mock-exam-input mb-3" accept=".xlsx, .xls" onChange={handleExcelImport} />

                {excelSummary && (
                  <div className="alert alert-info py-2" style={{ fontSize: "0.85rem" }}>
                    <strong>Parsed summary:</strong> Total Rows: {excelSummary.totalParsed} | Valid: {excelSummary.validCount} | Invalid: {excelSummary.invalidCount}
                  </div>
                )}

                {excelErrors.length > 0 && (
                  <div className="alert alert-danger" style={{ maxHeight: 200, overflowY: "auto", fontSize: "0.85rem" }}>
                    <strong>Validation Failures (Correct these rows in Excel):</strong>
                    <ul className="mb-0 mt-1">
                      {excelErrors.map((err) => (
                        <li key={err.rowNumber}>Row {err.rowNumber}: {err.errors.join(", ")}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {excelQuestions.length > 0 && (
                  <div>
                    <button className="mock-exam-button" onClick={importValidExcelQuestions}>
                      Confirm and Import {excelQuestions.length} Valid Questions
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. PDF Upload Extractor */}
            {rightTab === "pdf" && (
              <div>
                <h4 style={{ fontWeight: 800, margin: "0 0 10px 0" }}><i className="bi bi-file-earmark-pdf-fill text-danger" /> PDF Question Paper Extractor</h4>
                <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                  Upload a PDF question paper. The system will parse questions using AI regex heuristics.
                </p>
                <div className="d-flex gap-3 mb-3">
                  <input type="file" className="mock-exam-input" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
                  <button className="mock-exam-button" onClick={triggerPdfExtraction} disabled={pdfParsing || !pdfFile}>
                    {pdfParsing ? "Extracting..." : "Process PDF"}
                  </button>
                </div>

                {pdfQuestions.length > 0 && (
                  <div className="mt-3">
                    <h4 className="mock-exam-card-title mb-2" style={{ fontSize: "0.95rem" }}>Extracted Questions Preview ({pdfQuestions.length})</h4>
                    <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#f9fafb" }} className="mb-3">
                      {pdfQuestions.map((pq, idx) => (
                        <div key={idx} className="border-bottom py-2" style={{ fontSize: "0.85rem" }}>
                          <strong>Q{idx + 1} ({pq.type}):</strong> {pq.question}
                          {pq.type === "MCQ" && pq.options && (
                            <div className="text-muted ps-3 mt-1" style={{ fontSize: "0.8rem" }}>
                              Options: {pq.options.map(o => o.text).filter(Boolean).join(" | ")} | Correct: {pq.correctAnswer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button className="mock-exam-button" onClick={importPdfQuestions}>
                      Add {pdfQuestions.length} Questions to Exam
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Central Question Bank Repository */}
            {rightTab === "bank" && (
              <div>
                <h4 style={{ fontWeight: 800, margin: "0 0 15px 0" }}><i className="bi bi-bank text-primary" /> Central Question Bank - Reuse Repository</h4>
                <div className="mock-exam-toolbar mb-3" style={{ padding: 12, gap: 10 }}>
                  <input className="mock-exam-input" style={{ flex: 2 }} placeholder="Search bank question text..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} />
                  <input className="mock-exam-input" placeholder="Chapter..." value={bankChapter} onChange={(e) => setBankChapter(e.target.value)} />
                  <select className="mock-exam-select" value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value)}>
                    <option value="">Difficulty</option>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                  <label className="d-flex align-items-center gap-2 mb-0" style={{ fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                    <input type="checkbox" checked={bankFavoriteOnly} onChange={(e) => setBankFavoriteOnly(e.target.checked)} /> Favorites
                  </label>
                </div>

                <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  {bankQuestions.length > 0 ? (
                    bankQuestions.map((bq) => (
                      <div key={bq._id} className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ fontSize: "0.88rem", background: "#ffffff" }}>
                        <div style={{ flex: 1, paddingRight: 16 }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${bq.difficulty === 'EASY' ? 'bg-success' : bq.difficulty === 'HARD' ? 'bg-danger' : 'bg-warning'}`}>{bq.difficulty}</span>
                            {bq.chapter && <span className="badge bg-secondary">{bq.chapter}</span>}
                          </div>
                          <strong>{bq.question}</strong>
                          {bq.type === "MCQ" && bq.options && (
                            <div className="text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                              Options: {bq.options.map(o => typeof o === "object" ? o.text : o).filter(Boolean).join(" | ")}
                            </div>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-sm btn-light" onClick={() => toggleBankFavorite(bq)}>
                            <i className={`bi ${bq.isFavorite ? "bi-star-fill text-warning" : "bi-star"}`} />
                          </button>
                          <button className="mock-exam-button secondary btn-sm" onClick={() => importFromBank(bq)} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                            Add
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-5" style={{ fontSize: "0.85rem" }}>
                      No matching questions in Central Repository.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="sticky-action-bar mt-4">
          <div className="d-flex align-items-center gap-2">
            {isDirty ? (
              <span className="text-warning" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="bi bi-exclamation-triangle-fill" /> You have unsaved changes in questions setup.
              </span>
            ) : (
              <span className="text-success" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="bi bi-check-circle-fill" /> All changes saved.
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <button className="mock-exam-button secondary" onClick={() => navigate("/faculty/mock-exams/manage")}>
              Exit Workspace
            </button>
            <button className="mock-exam-button" onClick={() => saveQuestionsToServer(false)} disabled={saving}>
              {saving ? "Saving..." : "Save Questions"}
            </button>
          </div>
        </div>

      </div>

      {/* 1. Zoom Modal overlay */}
      {zoomImage && (
        <div className="zoom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-modal-close" onClick={() => setZoomImage(null)}>
              <i className="bi bi-x-lg" />
            </button>
            <img src={zoomImage} alt="Enlarged preview" className="zoom-modal-image" />
          </div>
        </div>
      )}

      {/* 2. Drawing Annotation / Crop Canvas Modal */}
      {showEditorModal && (
        <div className="image-editor-modal">
          <div className="image-editor-container">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
              <h5 className="m-0" style={{ fontWeight: 800 }}>Image Annotation & Cropping Studio</h5>
              <button className="btn-close" onClick={() => setShowEditorModal(false)} />
            </div>

            <div className="image-editor-toolbar">
              <div className="image-editor-tools">
                <button className={`btn btn-sm ${editorMode === "draw" ? "btn-success" : "btn-light border"}`} onClick={() => setEditorMode("draw")}>
                  <i className="bi bi-brush me-1" /> Brush Draw
                </button>
                <button className={`btn btn-sm ${editorMode === "crop" ? "btn-success" : "btn-light border"}`} onClick={() => setEditorMode("crop")}>
                  <i className="bi bi-crop me-1" /> Crop Drag
                </button>
                
                {editorMode === "draw" && (
                  <div className="d-flex gap-2 align-items-center ms-3">
                    <label className="m-0" style={{ fontSize: "0.8rem" }}>Color:</label>
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} style={{ width: 24, height: 24, border: 0, padding: 0 }} />
                    <label className="m-0 ms-2" style={{ fontSize: "0.8rem" }}>Size:</label>
                    <input type="range" min="1" max="20" value={brushWidth} onChange={(e) => setBrushWidth(Number(e.target.value))} style={{ width: 60 }} />
                  </div>
                )}
              </div>

              <div>
                <button className="btn btn-sm btn-light border text-danger me-2" onClick={() => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext("2d");
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                  };
                  img.src = editorSource.imgUrl;
                }}>
                  Reset Image
                </button>
              </div>
            </div>

            <div className="image-editor-workspace" ref={canvasContainerRef}>
              <canvas
                ref={canvasRef}
                className="image-editor-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
              {editorMode === "crop" && cropStart && cropEnd && (
                <div 
                  style={{
                    position: "absolute",
                    border: "2px dashed #ff0000",
                    background: "rgba(255, 0, 0, 0.15)",
                    left: Math.min(cropStart.x, cropEnd.x),
                    top: Math.min(cropStart.y, cropEnd.y),
                    width: Math.abs(cropStart.x - cropEnd.x),
                    height: Math.abs(cropStart.y - cropEnd.y),
                    pointerEvents: "none"
                  }}
                />
              )}
            </div>

            {editorMode === "crop" && (
              <p className="text-muted text-center m-0" style={{ fontSize: "0.78rem" }}>
                * Drag a box around the region you wish to crop. The image will automatically trim to that box.
              </p>
            )}

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <button className="btn btn-secondary" onClick={() => setShowEditorModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={saveEditedImage} disabled={saving}>
                {saving ? "Saving..." : "Apply & Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockExamQuestions;
