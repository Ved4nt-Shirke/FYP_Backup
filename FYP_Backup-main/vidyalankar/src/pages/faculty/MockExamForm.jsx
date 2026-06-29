import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { config } from "../../config/api";
import "../../styles/mockExam.css";

const blankQuestion = (type = "MCQ") => ({
  type,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
  explanation: "",
});

const MockExamForm = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(examId);

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState({ departments: [], courses: [], divisions: [], subjects: [] });
  const [form, setForm] = useState({
    academicYear: "",
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
  });
  const [questions, setQuestions] = useState([blankQuestion("MCQ")]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [catalogResponse, examResponse] = await Promise.all([
          axios.get(`${config.mockExams}/catalog`),
          editing ? axios.get(`${config.mockExams}/${examId}`) : Promise.resolve(null),
        ]);

        setCatalog({
          departments: catalogResponse.data?.departments || [],
          courses: catalogResponse.data?.courses || [],
          divisions: catalogResponse.data?.divisions || [],
          subjects: catalogResponse.data?.subjects || [],
        });

        if (examResponse?.data?.exam) {
          const exam = examResponse.data.exam;
          setForm({
            academicYear: exam.academicYear || "",
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
          });
          setQuestions(
            (exam.questions || []).map((question) => ({
              type: question.type || "MCQ",
              question: question.question || "",
              options: Array.isArray(question.options) ? [...question.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
              correctAnswer: question.correctAnswer || "",
              marks: question.marks || 1,
              explanation: question.explanation || "",
            })),
          );
        }
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load exam form data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [editing, examId]);

  const departments = catalog.departments;
  const filteredCourses = useMemo(
    () => catalog.courses.filter((course) => !form.departmentId || String(course.departmentId) === String(form.departmentId)),
    [catalog.courses, form.departmentId],
  );
  const filteredDivisions = useMemo(
    () => catalog.divisions.filter((division) => !form.courseId || String(division.courseId) === String(form.courseId)),
    [catalog.divisions, form.courseId],
  );
  const filteredSubjects = useMemo(
    () => catalog.subjects.filter((subject) => !form.courseId || String(subject.courseId) === String(form.courseId)),
    [catalog.subjects, form.courseId],
  );

  const updateQuestion = (index, key, value) => {
    setQuestions((previous) => previous.map((question, currentIndex) => (currentIndex === index ? { ...question, [key]: value } : question)));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) => previous.map((question, currentIndex) => {
      if (currentIndex !== questionIndex) return question;
      const nextOptions = [...question.options];
      nextOptions[optionIndex] = value;
      return { ...question, options: nextOptions };
    }));
  };

  const addQuestion = (type) => setQuestions((previous) => [...previous, blankQuestion(type)]);
  const deleteQuestion = (index) => setQuestions((previous) => previous.filter((_, currentIndex) => currentIndex !== index));

  const saveExam = async (publish) => {
    try {
      setError("");
      const payload = {
        ...form,
        semester: Number(form.semester),
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        negativeMarking: Number(form.negativeMarking),
        isPublished: publish,
        questions: questions.map((question) => ({
          type: question.type,
          question: question.question,
          options: question.type === "MCQ" ? question.options : [],
          correctAnswer: question.correctAnswer,
          marks: Number(question.marks || 0),
          explanation: question.explanation,
        })),
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
    return <div className="mock-exam-shell">Loading mock exam form...</div>;
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">{editing ? "Edit Exam" : "Create Exam"}</span>
            <h1 className="mock-exam-title">{editing ? "Edit Mock Exam" : "Create Mock Exam"}</h1>
            <p className="mock-exam-subtitle">All academic selectors are loaded from admin-created data.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="mock-exam-button secondary" onClick={() => navigate("/faculty/mock-exams/manage")}>Back</button>
            <button className="mock-exam-button secondary" onClick={() => saveExam(false)}>Save Draft</button>
            <button className="mock-exam-button" onClick={() => saveExam(true)}>{editing ? "Update & Publish" : "Publish"}</button>
          </div>
        </div>

        {error ? <div className="mock-exam-card mb-3" style={{ borderColor: "#fca5a5", color: "#fee2e2" }}>{error}</div> : null}

        <div className="mock-exam-card">
          <div className="mock-exam-form-grid">
            <div>
              <label>Academic Year</label>
              <input className="mock-exam-input" value={form.academicYear} onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))} placeholder="2025-2026" />
            </div>
            <div>
              <label>Department</label>
              <select className="mock-exam-select" value={form.departmentId || ""} onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value, courseId: "", divisionId: "", subjectId: "" }))}>
                <option value="">Select Department</option>
                {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
              </select>
            </div>
            <div>
              <label>Course</label>
              <select className="mock-exam-select" value={form.courseId} onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value, divisionId: "", subjectId: "", semester: filteredCourses.find((course) => String(course._id) === e.target.value)?.semester || prev.semester }))}>
                <option value="">Select Course</option>
                {filteredCourses.map((course) => <option key={course._id} value={course._id}>{course.courseCode} - Sem {course.semester}</option>)}
              </select>
            </div>
            <div>
              <label>Division</label>
              <select className="mock-exam-select" value={form.divisionId} onChange={(e) => setForm((prev) => ({ ...prev, divisionId: e.target.value }))}>
                <option value="">Select Division</option>
                {filteredDivisions.map((division) => <option key={division._id} value={division._id}>{division.name}</option>)}
              </select>
            </div>
            <div>
              <label>Semester</label>
              <input className="mock-exam-input" type="number" min="1" max="8" value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} />
            </div>
            <div>
              <label>Subject</label>
              <select className="mock-exam-select" value={form.subjectId} onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}>
                <option value="">Select Subject</option>
                {filteredSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
              </select>
            </div>
            <div>
              <label>Title</label>
              <input className="mock-exam-input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Mid Sem Mock Exam" />
            </div>
            <div>
              <label>Duration (minutes)</label>
              <input className="mock-exam-input" type="number" min="1" value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))} />
            </div>
            <div>
              <label>Total Marks</label>
              <input className="mock-exam-input" type="number" min="1" value={form.totalMarks} onChange={(e) => setForm((prev) => ({ ...prev, totalMarks: e.target.value }))} />
            </div>
            <div>
              <label>Exam Type</label>
              <select className="mock-exam-select" value={form.examType} onChange={(e) => setForm((prev) => ({ ...prev, examType: e.target.value }))}>
                <option value="MCQ">MCQ</option>
                <option value="THEORY">Theory</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div>
              <label>Start Date & Time</label>
              <input className="mock-exam-input" type="datetime-local" value={form.startTime} onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))} />
            </div>
            <div>
              <label>End Date & Time</label>
              <input className="mock-exam-input" type="datetime-local" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} />
            </div>
            <div>
              <label>Negative Marking</label>
              <input className="mock-exam-input" type="number" min="0" step="0.25" value={form.negativeMarking} onChange={(e) => setForm((prev) => ({ ...prev, negativeMarking: e.target.value }))} />
            </div>
          </div>

          <div className="mock-exam-action-row mt-3">
            <label className="mock-exam-card d-flex align-items-center gap-2"><input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))} /> Shuffle Questions</label>
            <label className="mock-exam-card d-flex align-items-center gap-2"><input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm((prev) => ({ ...prev, shuffleOptions: e.target.checked }))} /> Shuffle Options</label>
            <label className="mock-exam-card d-flex align-items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))} /> Publish immediately</label>
          </div>
        </div>

        <div className="mock-exam-section-title">Questions</div>
        <div className="d-flex gap-2 flex-wrap mb-3">
          <button className="mock-exam-button secondary" onClick={() => addQuestion("MCQ")}>Add MCQ</button>
          <button className="mock-exam-button secondary" onClick={() => addQuestion("THEORY")}>Add Theory</button>
        </div>

        {questions.map((question, index) => (
          <div key={`${index}-${question.type}`} className="mock-exam-question-card">
            <div className="mock-exam-question-top">
              <strong>Question {index + 1}</strong>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="mock-exam-select" value={question.type} onChange={(e) => updateQuestion(index, "type", e.target.value)} style={{ width: 150 }}>
                  <option value="MCQ">MCQ</option>
                  <option value="THEORY">Theory</option>
                </select>
                <button className="mock-exam-button danger" onClick={() => deleteQuestion(index)}>Delete</button>
              </div>
            </div>
            <textarea className="mock-exam-textarea" placeholder="Enter question" value={question.question} onChange={(e) => updateQuestion(index, "question", e.target.value)} />
            {question.type === "MCQ" ? (
              <div className="mock-exam-form-grid mt-3">
                {question.options.map((option, optionIndex) => (
                  <input key={optionIndex} className="mock-exam-input" value={option} placeholder={`Option ${optionIndex + 1}`} onChange={(e) => updateOption(index, optionIndex, e.target.value)} />
                ))}
                <input className="mock-exam-input" value={question.correctAnswer} placeholder="Correct answer" onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)} />
                <input className="mock-exam-input" type="number" min="0" value={question.marks} onChange={(e) => updateQuestion(index, "marks", e.target.value)} placeholder="Marks" />
              </div>
            ) : (
              <div className="mock-exam-form-grid mt-3">
                <textarea className="mock-exam-textarea" placeholder="Model answer / evaluation notes" value={question.explanation} onChange={(e) => updateQuestion(index, "explanation", e.target.value)} />
                <input className="mock-exam-input" type="number" min="0" value={question.marks} onChange={(e) => updateQuestion(index, "marks", e.target.value)} placeholder="Marks" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockExamForm;
