import React, { useEffect, useMemo, useState, useRef } from "react";
import "./FacultyStudyMaterialManager.css";

const API_BASE = "/api";

const getToken = () => localStorage.getItem("token") || "";

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const categoryOptions = [
  "Notes",
  "PPT / Presentation",
  "Assignments",
  "Question Bank",
  "Previous Year Questions",
  "Video Lectures",
  "Important Questions",
  "MCQ Quiz",
  "Lab Manual",
  "Practical Files",
  "EPA",
  "Case Studies",
  "Other"
];

// Helper to load PDFJS dynamically for thumbnail rendering
const loadPdfJS = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const FacultyStudyMaterialManager = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Form Fields
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Chapter handling
  const [existingChapters, setExistingChapters] = useState([]);
  const [selectedChapterMode, setSelectedChapterMode] = useState("select"); // 'select' or 'custom'
  const [selectedChapterKey, setSelectedChapterKey] = useState(""); // chapterNo_chapterName
  const [customChapterNo, setCustomChapterNo] = useState("");
  const [customChapterName, setCustomChapterName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Notes");
  const [customCategory, setCustomCategory] = useState("");
  const [resourceType, setResourceType] = useState("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [richTextContent, setRichTextContent] = useState("");
  const [tags, setTags] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  // File Upload State
  const [resourceFile, setResourceFile] = useState(null);
  const [thumbnailBase64, setThumbnailBase64] = useState("");

  // Bulk Upload State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]); // Array of { file, category, title, thumbnailData }
  const [bulkProgress, setBulkProgress] = useState("");

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const dropZoneRef = useRef(null);

  const fileResourceCount = useMemo(
    () => materials.filter((item) => item.resourceType === "file").length,
    [materials],
  );

  const linkResourceCount = useMemo(
    () => materials.filter((item) => item.resourceType === "link").length,
    [materials],
  );

  const richTextResourceCount = useMemo(
    () => materials.filter((item) => item.resourceType === "rich-text").length,
    [materials],
  );

  // Auto file categorization based on file name extension
  const getAutoCategory = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["pdf", "doc", "docx"].includes(ext)) {
      const lower = filename.toLowerCase();
      if (lower.includes("manual") || lower.includes("lab")) return "Lab Manual";
      if (lower.includes("assignment")) return "Assignments";
      if (lower.includes("question") || lower.includes("pyq")) return "Question Bank";
      return "Notes";
    }
    if (["ppt", "pptx"].includes(ext)) return "PPT / Presentation";
    if (["zip", "rar", "tar", "gz"].includes(ext)) {
      return "Practical Files";
    }
    if (["mp4", "mov", "mkv", "avi"].includes(ext)) return "Video Lectures";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "Notes";
    return "Notes";
  };

  // Generate Thumbnail for PDF files
  const generatePdfThumbnail = async (file) => {
    if (file.type !== "application/pdf") return "";
    try {
      const pdfjsLib = await loadPdfJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL("image/png");
    } catch (err) {
      console.error("PDF Thumbnail generation failed:", err);
      return "";
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch(`${API_BASE}/academic-year/all`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data.academicYears || []);
        // Set current active academic year
        const active = data.academicYears?.find((ay) => ay.status === "active");
        if (active) setSelectedAcademicYear(active.yearName);
      }
    } catch (err) {
      console.error("Failed to load academic years:", err);
    }
  };

  const fetchDepartments = async () => {
    const response = await fetch(`${API_BASE}/catalog/departments`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch departments");
    const data = await response.json();
    setDepartments(Array.isArray(data.departments) ? data.departments : []);
  };

  const fetchCourses = async (departmentId) => {
    if (!departmentId) {
      setCourses([]);
      return;
    }
    const response = await fetch(`${API_BASE}/catalog/courses/${departmentId}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch courses");
    const data = await response.json();
    setCourses(Array.isArray(data.courses) ? data.courses : []);
  };

  const fetchDivisions = async (courseId) => {
    if (!courseId) {
      setDivisions([]);
      return;
    }
    const response = await fetch(`${API_BASE}/catalog/divisions/${courseId}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch divisions");
    const data = await response.json();
    setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
  };

  const fetchSubjects = async (departmentId, courseId) => {
    if (!departmentId) {
      setSubjects([]);
      return;
    }
    const params = new URLSearchParams();
    params.append("departmentId", departmentId);
    if (courseId) params.append("courseId", courseId);

    const response = await fetch(`${API_BASE}/catalog/subjects?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch subjects");
    const data = await response.json();
    setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
  };

  const fetchChapters = async () => {
    if (!selectedDepartment || !selectedCourse || !selectedSubject) {
      setExistingChapters([]);
      return;
    }
    const deptObj = departments.find((d) => d._id === selectedDepartment);
    const courseObj = courses.find((c) => c._id === selectedCourse);
    const divObj = divisions.find((d) => d._id === selectedDivision);

    if (!deptObj || !courseObj) return;

    try {
      const response = await fetch(`${API_BASE}/course-chapters/get-chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          program: deptObj.name,
          className: divObj ? divObj.name : "",
          course: selectedSubject, // Use Subject Name as stored by Course Manage Chapters
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setExistingChapters(data.chp || []);
        if (data.chp && data.chp.length > 0) {
          setSelectedChapterMode("select");
          setSelectedChapterKey(`${data.chp[0].chapterNo}_${data.chp[0].chapterName}`);
        } else {
          setSelectedChapterMode("custom");
        }
      }
    } catch (err) {
      console.error("Failed to fetch chapters:", err);
    }
  };

  const fetchMaterials = async () => {
    setListLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/study-materials/faculty`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch study materials");
      const data = await response.json();
      setMaterials(Array.isArray(data.materials) ? data.materials : []);
    } catch (err) {
      setError(err.message || "Failed to fetch study materials");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([fetchAcademicYears(), fetchDepartments(), fetchMaterials()]);
      } catch (err) {
        setError(err.message || "Unable to load study material configuration.");
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setCourses([]);
      setDivisions([]);
      setSubjects([]);
      setSelectedCourse("");
      setSelectedDivision("");
      setSelectedSubject("");
      return;
    }
    const run = async () => {
      try {
        setError("");
        setSelectedCourse("");
        setSelectedDivision("");
        setSelectedSubject("");
        setDivisions([]);
        setSubjects([]);
        await fetchCourses(selectedDepartment);
        await fetchSubjects(selectedDepartment, "");
      } catch (err) {
        setError(err.message || "Unable to fetch courses");
      }
    };
    run();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedDivision("");
      setDivisions([]);
      setSelectedSubject("");
      if (selectedDepartment) fetchSubjects(selectedDepartment, "");
      else setSubjects([]);
      return;
    }
    const run = async () => {
      try {
        setError("");
        setSelectedDivision("");
        setSelectedSubject("");
        await Promise.all([
          fetchDivisions(selectedCourse),
          fetchSubjects(selectedDepartment, selectedCourse),
        ]);
      } catch (err) {
        setError(err.message || "Unable to fetch divisions or subjects");
      }
    };
    run();
  }, [selectedCourse, selectedDepartment]);

  // Sync chapters list
  useEffect(() => {
    fetchChapters();
  }, [selectedCourse, selectedDepartment, selectedDivision, selectedSubject]);

  // Handle Drag & Drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) dropZoneRef.current.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) dropZoneRef.current.classList.remove("drag-over");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) dropZoneRef.current.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await processSelectedFiles(files);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processSelectedFiles(files);
  };

  const processSelectedFiles = async (files) => {
    if (files.length === 1) {
      const file = files[0];
      setResourceFile(file);
      setIsBulkMode(false);
      setCategory(getAutoCategory(file.name));
      setTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
      
      if (file.type === "application/pdf") {
        const thumb = await generatePdfThumbnail(file);
        setThumbnailBase64(thumb);
      } else {
        setThumbnailBase64("");
      }
    } else {
      // Bulk Mode
      setIsBulkMode(true);
      const mapped = await Promise.all(
        files.map(async (file) => {
          const autoCat = getAutoCategory(file.name);
          const thumb = file.type === "application/pdf" ? await generatePdfThumbnail(file) : "";
          return {
            file,
            category: autoCat,
            title: file.name.substring(0, file.name.lastIndexOf(".")) || file.name,
            thumbnailData: thumb,
          };
        })
      );
      setBulkFiles(mapped);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedSubject("");
    setCategory("Notes");
    setCustomCategory("");
    setResourceType("file");
    setExternalUrl("");
    setRichTextContent("");
    setTags("");
    setIsDraft(false);
    setResourceFile(null);
    setThumbnailBase64("");
    setIsBulkMode(false);
    setBulkFiles([]);
  };

  const handleChapterSave = async (deptId, courseId, divId, chNo, chName) => {
    const deptObj = departments.find((d) => d._id === deptId);
    const courseObj = courses.find((c) => c._id === courseId);
    const divObj = divisions.find((d) => d._id === divId);

    if (!deptObj || !courseObj || !divObj) return;

    // Call add-chapter API
    await fetch(`${API_BASE}/course-chapters/add-chapter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        program: deptObj.name,
        className: divObj.name,
        course: selectedSubject, // Save with Subject Name as expected by Course Manage Chapters
        chapterNo: chNo,
        chapterName: chName,
      }),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedDepartment || !selectedCourse || !selectedDivision || !selectedSubject) {
      setError("Please select department, course, division, and subject.");
      return;
    }

    let chNo = 0;
    let chName = "";

    if (selectedChapterMode === "select") {
      if (!selectedChapterKey) {
        setError("Please select a chapter from the dropdown list.");
        return;
      }
      const parts = selectedChapterKey.split("_");
      chNo = Number(parts[0]);
      chName = parts.slice(1).join("_");
    } else {
      chNo = Number(customChapterNo);
      chName = customChapterName.trim();
      if (!chNo || !chName) {
        setError("Please enter Chapter Number and Chapter Name.");
        return;
      }
      // Save custom chapter in course chapters db first
      try {
        await handleChapterSave(selectedDepartment, selectedCourse, selectedDivision, chNo, chName);
      } catch (e) {
        console.error("Chapter preservation failed:", e);
      }
    }

    const courseObj = courses.find((c) => c._id === selectedCourse);
    const semester = courseObj ? courseObj.semester : 1;

    setLoading(true);

    try {
      if (isBulkMode) {
        // Bulk uploading loop
        let successCount = 0;
        for (let i = 0; i < bulkFiles.length; i++) {
          const item = bulkFiles[i];
          setBulkProgress(`Uploading file ${i + 1} of ${bulkFiles.length}: ${item.title}`);
          
          const formData = new FormData();
          formData.append("title", item.title.trim());
          formData.append("description", description.trim());
          formData.append("subject", selectedSubject.trim());
          formData.append("category", item.category === "Other" ? (item.customCategory || "Other").trim() : item.category);
          formData.append("resourceType", "file");
          formData.append("departmentId", selectedDepartment);
          formData.append("courseId", selectedCourse);
          formData.append("divisionId", selectedDivision);
          formData.append("academicYear", selectedAcademicYear);
          formData.append("semester", semester);
          formData.append("chapterNo", chNo);
          formData.append("chapterName", chName);
          formData.append("tags", tags);
          formData.append("isDraft", isDraft);
          formData.append("resourceFile", item.file);
          if (item.thumbnailData) {
            formData.append("thumbnailData", item.thumbnailData);
          }

          const response = await fetch(`${API_BASE}/study-materials/faculty`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
          });

          if (response.ok) successCount++;
        }

        setSuccessMessage(`Bulk uploaded ${successCount} of ${bulkFiles.length} files successfully.`);
        resetForm();
        await fetchMaterials();
        await fetchChapters();
      } else {
        // Single Upload
        if (!title.trim()) {
          setError("Please enter title");
          setLoading(false);
          return;
        }

        if (resourceType === "file" && !resourceFile) {
          setError("Please select a file to upload");
          setLoading(false);
          return;
        }

        if (resourceType === "link" && !externalUrl.trim()) {
          setError("Please provide external link");
          setLoading(false);
          return;
        }

        if (resourceType === "rich-text" && !richTextContent.trim()) {
          setError("Please type content in rich text content");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("subject", selectedSubject.trim());
        formData.append("category", category === "Other" ? customCategory.trim() : category);
        formData.append("resourceType", resourceType);
        formData.append("externalUrl", resourceType === "link" ? externalUrl.trim() : "");
        formData.append("richTextContent", resourceType === "rich-text" ? richTextContent.trim() : "");
        formData.append("departmentId", selectedDepartment);
        formData.append("courseId", selectedCourse);
        formData.append("divisionId", selectedDivision);
        formData.append("academicYear", selectedAcademicYear);
        formData.append("semester", semester);
        formData.append("chapterNo", chNo);
        formData.append("chapterName", chName);
        formData.append("tags", tags);
        formData.append("isDraft", isDraft);
        if (resourceFile && resourceType === "file") {
          formData.append("resourceFile", resourceFile);
        }
        if (thumbnailBase64 && resourceType === "file") {
          formData.append("thumbnailData", thumbnailBase64);
        }

        const response = await fetch(`${API_BASE}/study-materials/faculty`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to publish study material");
        }

        setSuccessMessage("Study material published successfully and visible in student panel.");
        resetForm();
        await fetchMaterials();
        await fetchChapters();
      }
    } catch (err) {
      setError(err.message || "Unable to publish study material");
    } finally {
      setLoading(false);
      setBulkProgress("");
    }
  };

  const handleRemove = async (materialId) => {
    const confirmed = window.confirm("Remove this study material from student panel?");
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE}/study-materials/faculty/${materialId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove study material");
      }

      setSuccessMessage("Study material removed successfully.");
      await fetchMaterials();
    } catch (err) {
      setError(err.message || "Unable to remove study material");
    }
  };

  const handleOpen = async (material) => {
    try {
      if (material.resourceType === "link" && material.externalUrl) {
        window.open(material.externalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const response = await fetch(`${API_BASE}/study-materials/file/${material._id}`, {
        headers: authHeaders(),
      });

      if (!response.ok) throw new Error("Unable to open file");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      setError(err.message || "Unable to open study material");
    }
  };

  return (
    <div className="faculty-study-material-manager">
      <section className="fsm-hero">
        <div className="fsm-hero-copy">
          <h1>Study Material Hub</h1>
          <p>Publish curriculum notes, slides, videos and quizzes. Manage drafts and bulk categorizations easily.</p>
        </div>
        <div className="fsm-hero-stats">
          <div>
            <span>Total Materials</span>
            <strong>{materials.length}</strong>
          </div>
          <div>
            <span>Files & PDFs</span>
            <strong>{fileResourceCount}</strong>
          </div>
          <div>
            <span>Links & Videos</span>
            <strong>{linkResourceCount}</strong>
          </div>
        </div>
      </section>

      {error ? <div className="fsm-alert error">{error}</div> : null}
      {successMessage ? <div className="fsm-alert success">{successMessage}</div> : null}

      <form className="fsm-form" onSubmit={handleSubmit}>
        <div className="fsm-form-head">
          <h2>Upload Curriculum Content</h2>
          <p>Fill out the metadata options, select folders, and upload single or multiple files.</p>
        </div>

        <div className="fsm-form-grid">
          <label className="fsm-field">
            <span>Academic Year</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              required
            >
              <option value="">Select Year</option>
              {academicYears.map((ay) => (
                <option key={ay._id} value={ay.yearName}>
                  {ay.yearName} {ay.status === "active" ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="fsm-field">
            <span>Department</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </label>

          <label className="fsm-field">
            <span>Course / Scheme</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              disabled={!selectedDepartment}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode} | Sem {course.semester} | {course.scheme}
                </option>
              ))}
            </select>
          </label>

          <label className="fsm-field">
            <span>Division / Class</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              required
              disabled={!selectedCourse}
            >
              <option value="">Select division</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fsm-field">
            <span>Subject Code</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
              disabled={!selectedCourse}
            >
              <option value="">Select subject</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub.name}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </label>

          {/* Chapter Selector */}
          <div className="fsm-field chapter-selection-group">
            <span>Chapter / Module</span>
            <div className="chapter-mode-toggle">
              <label>
                <input
                  type="radio"
                  name="chapterMode"
                  value="select"
                  checked={selectedChapterMode === "select"}
                  disabled={existingChapters.length === 0}
                  onChange={() => setSelectedChapterMode("select")}
                />
                Choose Existing
              </label>
              <label>
                <input
                  type="radio"
                  name="chapterMode"
                  value="custom"
                  checked={selectedChapterMode === "custom"}
                  onChange={() => setSelectedChapterMode("custom")}
                />
                Add New Chapter
              </label>
            </div>

            {selectedChapterMode === "select" ? (
              <select
                value={selectedChapterKey}
                onChange={(e) => setSelectedChapterKey(e.target.value)}
                required
              >
                <option value="">Select chapter</option>
                {existingChapters.map((ch) => (
                  <option key={`${ch.chapterNo}_${ch.chapterName}`} value={`${ch.chapterNo}_${ch.chapterName}`}>
                    Chapter {ch.chapterNo}: {ch.chapterName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="custom-chapter-inputs">
                <input
                  type="number"
                  placeholder="Chapter No (e.g. 1)"
                  value={customChapterNo}
                  onChange={(e) => setCustomChapterNo(e.target.value)}
                  className="chapter-no-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Chapter Name (e.g. Intro)"
                  value={customChapterName}
                  onChange={(e) => setCustomChapterName(e.target.value)}
                  className="chapter-name-input"
                  required
                />
              </div>
            )}
          </div>

          <label className="fsm-field">
            <span>Folder Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={isBulkMode}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {category === "Other" && !isBulkMode && (
            <label className="fsm-field">
              <span>Custom Category Name</span>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                required
              />
            </label>
          )}

          <label className="fsm-field">
            <span>Resource Format</span>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              required
              disabled={isBulkMode}
            >
              <option value="file">File Upload</option>
              <option value="link">External Link</option>
              <option value="rich-text">Rich Text Article</option>
            </select>
          </label>

          <label className="fsm-field fsm-field-wide">
            <span>Title / Topic</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
              maxLength={180}
              disabled={isBulkMode}
              required={!isBulkMode}
            />
          </label>

          <label className="fsm-field fsm-field-wide">
            <span>Tags / Keywords</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. calculus, laboratory, chapter1 (comma-separated)"
            />
          </label>

          <label className="fsm-field fsm-field-wide">
            <span>Brief Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a context description for your students..."
              maxLength={2000}
            />
          </label>
        </div>

        {/* Dynamic upload block or Link or Rich Text */}
        {!isBulkMode && resourceType === "file" && (
          <div
            className="fsm-upload-block drag-drop-zone"
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-text">
              <h3>Drag & Drop File Here</h3>
              <p>Supports: PDF, DOC, PPT, ZIP, Video (MP4/MKV), Images. We categorize files automatically.</p>
            </div>
            <label className="fsm-file-label">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
              />
              <span>{resourceFile ? resourceFile.name : "Select File(s)"}</span>
            </label>
            {thumbnailBase64 && (
              <div className="pdf-thumbnail-preview">
                <img src={thumbnailBase64} alt="Thumbnail preview" />
                <span>PDF Thumbnail generated</span>
              </div>
            )}
          </div>
        )}

        {!isBulkMode && resourceType === "link" && (
          <div className="fsm-upload-block fsm-link-block">
            <label className="fsm-field fsm-field-wide">
              <span>External URL (YouTube / Google Drive / URL)</span>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </label>
          </div>
        )}

        {!isBulkMode && resourceType === "rich-text" && (
          <div className="fsm-upload-block rich-text-editor-container">
            <label className="fsm-field fsm-field-wide">
              <span>Rich Text Article Content (HTML allowed)</span>
              <textarea
                rows={10}
                value={richTextContent}
                onChange={(e) => setRichTextContent(e.target.value)}
                placeholder="<h1>Lecture Details</h1><p>Type your lesson plan notes here...</p>"
                required
              ></textarea>
            </label>
          </div>
        )}

        {/* Bulk Upload Table */}
        {isBulkMode && (
          <div className="bulk-upload-manager-panel">
            <h3>Bulk Upload Queue ({bulkFiles.length} files)</h3>
            <p>Modify auto file categories if necessary. All items will be saved under the selected subject and chapter.</p>
            <div className="bulk-table-container">
              <table className="bulk-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Guessed Folder Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkFiles.map((item, idx) => (
                    <tr key={idx}>
                      <td className="file-name-cell">{item.file.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const updated = [...bulkFiles];
                              updated[idx].category = e.target.value;
                              setBulkFiles(updated);
                            }}
                          >
                            {categoryOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {item.category === "Other" && (
                            <input
                              type="text"
                              value={item.customCategory || ""}
                              placeholder="Custom category"
                              onChange={(e) => {
                                const updated = [...bulkFiles];
                                updated[idx].customCategory = e.target.value;
                                setBulkFiles(updated);
                              }}
                              required
                              style={{ padding: '4px', fontSize: '12px' }}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="remove-queue-btn"
                          onClick={() => {
                            const updated = bulkFiles.filter((_, i) => i !== idx);
                            setBulkFiles(updated);
                            if (updated.length === 0) setIsBulkMode(false);
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bulkProgress && <div className="bulk-progress-badge"><i className="bi bi-cloud-upload"></i> {bulkProgress}</div>}
          </div>
        )}

        {/* Draft Option */}
        <div className="fsm-draft-row">
          <label className="fsm-checkbox-label">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
            />
            <span>Keep as Private Faculty Draft (hidden from students until published)</span>
          </label>
        </div>

        <div className="fsm-actions-row">
          <button type="submit" disabled={loading}>
            {loading ? "Publishing Uploads..." : isBulkMode ? `Publish Batch (${bulkFiles.length})` : "Publish Study Material"}
          </button>
        </div>
      </form>

      {/* Faculty list */}
      <section className="fsm-list">
        <div className="fsm-list-head">
          <h2>Your Published Materials</h2>
          <button type="button" onClick={fetchMaterials} disabled={listLoading}>
            {listLoading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {listLoading ? (
          <p className="fsm-empty-state">Loading materials from repository...</p>
        ) : materials.length === 0 ? (
          <p className="fsm-empty-state">No study materials published by you yet.</p>
        ) : (
          <div className="fsm-cards">
            {materials.map((item) => (
              <article key={item._id} className={`fsm-card ${item.isDraft ? "draft-glow" : ""}`}>
                <div className="fsm-card-meta">
                  <span className="cat-badge-lbl">{item.category}</span>
                  <span className="div-badge-lbl">{item.divisionId?.name || item.divisionName}</span>
                  {item.isDraft && <span className="draft-badge-lbl">Private Draft</span>}
                </div>
                <h3>{item.title}</h3>
                <p className="fsm-card-details">
                  Subject: {item.subject || "General"} <br />
                  Semester: {item.semester} | Chapter {item.chapterNo} {item.chapterName ? `- ${item.chapterName}` : ""}
                </p>
                {item.description ? <p className="fsm-card-desc">{item.description}</p> : null}
                <div className="fsm-card-footer-row">
                  <span className="pub-date-lbl">Uploaded {new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.tags?.length > 0 && (
                    <div className="card-tags-list">
                      {item.tags.map(t => <span key={t} className="card-tag">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="fsm-card-actions">
                  <button
                    type="button"
                    className="fsm-secondary"
                    onClick={() => handleOpen(item)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="fsm-danger"
                    onClick={() => handleRemove(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FacultyStudyMaterialManager;
