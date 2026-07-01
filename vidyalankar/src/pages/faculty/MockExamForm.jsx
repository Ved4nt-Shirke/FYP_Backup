import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const MockExamForm = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(examId);

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState({ departments: [], courses: [], divisions: [], subjects: [] });
  const [academicYears, setAcademicYears] = useState([]);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [form, setForm] = useState({
    academicYear: "",
    departmentId: "",
    courseId: "",
    divisionId: "",
    semester: "",
    subjectId: "",
    title: "",
    duration: 60,
    totalMarks: 50,
    examType: "MIXED",
    startTime: "",
    endTime: "",
    isPublished: false,
    shuffleQuestions: false,
    shuffleOptions: false,
    negativeMarking: 0,
    attemptsAllowed: "SINGLE",
    maxAttempts: 1,
    resumeEnabled: true,
    passingMarks: 18,
    timerPerQuestion: false,
    timerPerQuestionDuration: 0,
    fullscreenRequired: false,
    preventTabSwitch: false,
    sections: [],
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [catalogResponse, yearsResponse, examResponse] = await Promise.all([
          axios.get(`${config.mockExams}/catalog`),
          axios.get(`${config.apiBaseUrl}/academic-year/all`),
          editing ? axios.get(`${config.mockExams}/${examId}`) : Promise.resolve(null),
        ]);

        setCatalog({
          departments: catalogResponse.data?.departments || [],
          courses: catalogResponse.data?.courses || [],
          divisions: catalogResponse.data?.divisions || [],
          subjects: catalogResponse.data?.subjects || [],
        });

        setAcademicYears(yearsResponse.data?.academicYears || []);

        if (examResponse?.data?.exam) {
          const exam = examResponse.data.exam;
          setForm({
            academicYear: exam.academicYear || "",
            departmentId: exam.courseId?.departmentId || "",
            courseId: exam.courseId?._id || exam.courseId || "",
            divisionId: exam.divisionId?._id || exam.divisionId || "",
            semester: String(exam.semester || ""),
            subjectId: exam.subjectId?._id || exam.subjectId || "",
            title: exam.title || "",
            duration: exam.duration || 60,
            totalMarks: exam.totalMarks || 50,
            examType: exam.examType || "MIXED",
            startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : "",
            endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : "",
            isPublished: Boolean(exam.isPublished),
            shuffleQuestions: Boolean(exam.shuffleQuestions),
            shuffleOptions: Boolean(exam.shuffleOptions),
            negativeMarking: exam.negativeMarking || 0,
            attemptsAllowed: exam.attemptsAllowed || "SINGLE",
            maxAttempts: exam.maxAttempts || 1,
            resumeEnabled: exam.resumeEnabled !== false,
            passingMarks: exam.passingMarks || 18,
            timerPerQuestion: Boolean(exam.timerPerQuestion),
            timerPerQuestionDuration: exam.timerPerQuestionDuration || 0,
            fullscreenRequired: Boolean(exam.fullscreenRequired),
            preventTabSwitch: Boolean(exam.preventTabSwitch),
            sections: exam.sections || [],
          });
          setExistingQuestions(exam.questions || []);
        }
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load exam form data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [editing, examId]);

  // Cascading Helpers
  const departments = catalog.departments;
  const filteredCourses = useMemo(() => {
    const selectedYear = academicYears.find(y => y.yearName === form.academicYear);
    return catalog.courses.filter((course) => {
      const matchDept = !form.departmentId || String(course.departmentId) === String(form.departmentId);
      const matchScheme = !selectedYear || !selectedYear.scheme || course.scheme === selectedYear.scheme;
      return matchDept && matchScheme;
    });
  }, [catalog.courses, form.departmentId, form.academicYear, academicYears]);

  const filteredDivisions = useMemo(
    () => catalog.divisions.filter((division) => !form.courseId || String(division.courseId) === String(form.courseId)),
    [catalog.divisions, form.courseId],
  );

  const filteredSubjects = useMemo(
    () => catalog.subjects.filter((subject) => !form.courseId || String(subject.courseId) === String(form.courseId)),
    [catalog.subjects, form.courseId],
  );

  // Auto-cascade selectors changes
  const handleAcademicYearChange = (yearName) => {
    setForm(prev => ({
      ...prev,
      academicYear: yearName,
      departmentId: "",
      courseId: "",
      divisionId: "",
      subjectId: "",
      semester: ""
    }));
  };

  const handleDepartmentChange = (deptId) => {
    setForm(prev => ({
      ...prev,
      departmentId: deptId,
      courseId: "",
      divisionId: "",
      subjectId: "",
      semester: ""
    }));
  };

  const handleCourseChange = (courseId) => {
    const course = catalog.courses.find(c => String(c._id) === String(courseId));
    setForm(prev => ({
      ...prev,
      courseId,
      semester: course ? String(course.semester) : "",
      divisionId: "",
      subjectId: ""
    }));
  };

  // Save Mock Exam
  const saveExam = async (publish) => {
    try {
      setError("");
      if (!form.academicYear || !form.courseId || !form.divisionId || !form.semester || !form.subjectId || !form.title) {
        setError("Please fill out all academic selectors and the exam Title.");
        return;
      }

      const payload = {
        ...form,
        semester: Number(form.semester),
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        negativeMarking: Number(form.negativeMarking),
        passingMarks: Number(form.passingMarks),
        maxAttempts: Number(form.maxAttempts),
        timerPerQuestionDuration: Number(form.timerPerQuestionDuration),
        isPublished: publish,
        questions: editing ? existingQuestions : [], // preserve existing questions if editing
      };

      if (editing) {
        await axios.put(`${config.mockExams}/${examId}`, payload);
      } else {
        await axios.post(config.mockExams, payload);
      }

      navigate("/faculty/mock-exams/manage");
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError.message || "Failed to save exam");
    }
  };

  if (loading) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status" />
          <div className="text-muted">Loading Exam Configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className="mock-exam-hero" style={{ padding: "20px 24px" }}>
          <div>
            <span className="mock-exam-pill">{editing ? "Configure Settings" : "New Exam Settings"}</span>
            <h1 className="mock-exam-title">{editing ? "Edit Exam Settings" : "Create Mock Exam"}</h1>
            <p className="mock-exam-subtitle">Configure academic details, security limits, timing restrictions, and passing scores.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="mock-exam-button secondary" onClick={() => navigate("/faculty/mock-exams/manage")}>Cancel</button>
            <button className="mock-exam-button" onClick={() => saveExam(editing ? form.isPublished : false)}>{editing ? "Update Settings" : "Create Exam"}</button>
          </div>
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
        {successMsg ? <div className="alert alert-success mb-3">{successMsg}</div> : null}

        <div className="d-flex flex-column gap-4">
          {/* Academic Selector Block */}
          <div className="mock-exam-card">
            <h3 className="mock-exam-card-title mb-3" style={{ fontSize: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
              <i className="bi bi-mortarboard-fill me-1" /> 1. Academic Configuration
            </h3>
            <div className="mock-exam-form-grid" style={{ gap: "16px" }}>
              <div className="custom-form-group">
                <label>Academic Year</label>
                <select className="mock-exam-select" value={form.academicYear} onChange={(e) => handleAcademicYearChange(e.target.value)}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => <option key={year._id} value={year.yearName}>{year.yearName} (Scheme {year.scheme})</option>)}
                </select>
              </div>
              <div className="custom-form-group">
                <label>Department</label>
                <select className="mock-exam-select" value={form.departmentId} onChange={(e) => handleDepartmentChange(e.target.value)} disabled={!form.academicYear}>
                  <option value="">Select Department</option>
                  {departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                </select>
              </div>
              <div className="custom-form-group">
                <label>Course</label>
                <select className="mock-exam-select" value={form.courseId} onChange={(e) => handleCourseChange(e.target.value)} disabled={!form.departmentId}>
                  <option value="">Select Course</option>
                  {filteredCourses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} - Sem {c.semester}</option>)}
                </select>
              </div>
              <div className="custom-form-group">
                <label>Division</label>
                <select className="mock-exam-select" value={form.divisionId} onChange={(e) => setForm((prev) => ({ ...prev, divisionId: e.target.value }))} disabled={!form.courseId}>
                  <option value="">Select Division</option>
                  {filteredDivisions.map((div) => <option key={div._id} value={div._id}>{div.name}</option>)}
                </select>
              </div>
              <div className="custom-form-group">
                <label>Semester</label>
                <input className="mock-exam-input" type="number" min="1" max="8" value={form.semester} readOnly style={{ background: "#f3f4f6", cursor: "not-allowed" }} />
              </div>
              <div className="custom-form-group">
                <label>Subject</label>
                <select className="mock-exam-select" value={form.subjectId} onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))} disabled={!form.courseId}>
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Exam Details Block */}
          <div className="mock-exam-card">
            <h3 className="mock-exam-card-title mb-3" style={{ fontSize: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
              <i className="bi bi-gear-fill me-1" /> 2. Exam Details
            </h3>
            <div className="mock-exam-form-grid" style={{ gap: "16px" }}>
              <div className="custom-form-group">
                <label>Exam Name</label>
                <input className="mock-exam-input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Mid-Semester Exam" />
              </div>
              <div className="custom-form-group">
                <label>Exam Type</label>
                <select className="mock-exam-select" value={form.examType} onChange={(e) => setForm((prev) => ({ ...prev, examType: e.target.value }))}>
                  <option value="MIXED">Mixed (MCQ + Theory)</option>
                  <option value="MCQ">MCQ Only</option>
                  <option value="THEORY">Theory Only</option>
                </select>
              </div>
              <div className="custom-form-group">
                <label>Duration (minutes)</label>
                <input className="mock-exam-input" type="number" min="1" value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))} />
              </div>
              <div className="custom-form-group">
                <label>Total Marks</label>
                <input className="mock-exam-input" type="number" min="1" value={form.totalMarks} onChange={(e) => setForm((prev) => ({ ...prev, totalMarks: e.target.value }))} />
              </div>
              <div className="custom-form-group">
                <label>Passing Marks</label>
                <input className="mock-exam-input" type="number" min="0" value={form.passingMarks} onChange={(e) => setForm((prev) => ({ ...prev, passingMarks: e.target.value }))} />
              </div>
              <div className="custom-form-group">
                <label>Negative Marking per incorrect MCQ</label>
                <input className="mock-exam-input" type="number" min="0" step="0.25" value={form.negativeMarking} onChange={(e) => setForm((prev) => ({ ...prev, negativeMarking: e.target.value }))} />
              </div>
              <div className="custom-form-group">
                <label>Start Date & Time (Scheduled Open)</label>
                <input className="mock-exam-input" type="datetime-local" value={form.startTime} onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))} />
              </div>
              <div className="custom-form-group">
                <label>End Date & Time (Scheduled Close)</label>
                <input className="mock-exam-input" type="datetime-local" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Settings & Attempt Controls */}
          <div className="mock-exam-card">
            <h3 className="mock-exam-card-title mb-3" style={{ fontSize: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
              <i className="bi bi-shield-fill-check me-1" /> 3. Attempt Settings & Security Controls
            </h3>
            <div className="row g-3">
              <div className="col-md-6 custom-form-group">
                <label>Attempts Mode</label>
                <select className="mock-exam-select" value={form.attemptsAllowed} onChange={(e) => setForm((prev) => ({ ...prev, attemptsAllowed: e.target.value, maxAttempts: e.target.value === "SINGLE" ? 1 : 2 }))}>
                  <option value="SINGLE">Single Attempt Only</option>
                  <option value="MULTIPLE">Multiple Attempts Allowed</option>
                </select>
              </div>
              {form.attemptsAllowed === "MULTIPLE" && (
                <div className="col-md-6 custom-form-group">
                  <label>Attempt Limit Count</label>
                  <input className="mock-exam-input" type="number" min="2" value={form.maxAttempts} onChange={(e) => setForm((prev) => ({ ...prev, maxAttempts: e.target.value }))} />
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-3 mt-4 border-top pt-3">
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Options & Security Rules</h4>
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="d-flex align-items-center gap-2 p-2 border rounded-3" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}>
                    <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))} />
                    <span>Shuffle Questions</span>
                  </label>
                </div>
                <div className="col-md-4">
                  <label className="d-flex align-items-center gap-2 p-2 border rounded-3" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}>
                    <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm((prev) => ({ ...prev, shuffleOptions: e.target.checked }))} />
                    <span>Shuffle Options</span>
                  </label>
                </div>
                <div className="col-md-4">
                  <label className="d-flex align-items-center gap-2 p-2 border rounded-3" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}>
                    <input type="checkbox" checked={form.resumeEnabled} onChange={(e) => setForm((prev) => ({ ...prev, resumeEnabled: e.target.checked }))} />
                    <span>Allow Auto-Resume</span>
                  </label>
                </div>
                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2 p-2 border rounded-3 text-danger border-danger-subtle" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, background: "rgba(239,68,68,0.02)" }}>
                    <input type="checkbox" checked={form.fullscreenRequired} onChange={(e) => setForm((prev) => ({ ...prev, fullscreenRequired: e.target.checked }))} />
                    <span>Enforce Fullscreen Mode</span>
                  </label>
                </div>
                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2 p-2 border rounded-3 text-danger border-danger-subtle" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, background: "rgba(239,68,68,0.02)" }}>
                    <input type="checkbox" checked={form.preventTabSwitch} onChange={(e) => setForm((prev) => ({ ...prev, preventTabSwitch: e.target.checked }))} />
                    <span>Prevent Tab Switching</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-3">
          <button className="mock-exam-button secondary" onClick={() => navigate("/faculty/mock-exams/manage")}>Cancel</button>
          <button className="mock-exam-button" onClick={() => saveExam(editing ? form.isPublished : false)}>{editing ? "Update Settings" : "Create Exam"}</button>
        </div>
      </div>
    </div>
  );
};

export default MockExamForm;
