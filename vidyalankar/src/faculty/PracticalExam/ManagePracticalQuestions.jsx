import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { config } from "../../config/api";
import "./ManagePracticalQuestions.css";

const ManagePracticalQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    questionNumber: "",
    questionText: "",
    marks: 1,
    difficulty: "Medium",
  });

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  useEffect(() => {
    if (location.state?.openAddQuestion) {
      resetForm();
      setShowForm(true);
    }
  }, [location.state]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();

      if (data.success && data.practicalExam) {
        setExam(data.practicalExam);
        setQuestions(data.practicalExam.questions || []);
      } else {
        setError("Failed to load practical exam");
      }
    } catch (err) {
      console.error("Error fetching exam:", err);
      setError("Failed to load practical exam");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "marks" || name === "questionNumber" ? parseInt(value) : value,
    });
  };

  const resetForm = () => {
    setFormData({
      questionNumber: questions.length + 1,
      questionText: "",
      marks: 1,
      difficulty: "Medium",
    });
    setEditingId(null);
  };

  const handleAddQuestion = () => {
    setEditingId(null);
    resetForm();
    setShowForm(true);
  };

  const handleEditQuestion = (index) => {
    const question = questions[index];
    setFormData(question);
    setEditingId(index);
    setShowForm(true);
  };

  const handleSaveQuestion = async () => {
    setError("");
    setSuccess("");

    if (!formData.questionText.trim()) {
      setError("Question text is required");
      return;
    }

    if (formData.marks <= 0) {
      setError("Marks must be greater than 0");
      return;
    }

    try {
      let updatedQuestions;

      if (editingId !== null) {
        updatedQuestions = questions.map((q, i) =>
          i === editingId ? formData : q,
        );
      } else {
        updatedQuestions = [
          ...questions,
          {
            ...formData,
            questionNumber: questions.length + 1,
          },
        ];
      }

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ questions: updatedQuestions }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setQuestions(updatedQuestions);
        setSuccess(
          editingId !== null ? "Question updated!" : "Question added!",
        );
        setShowForm(false);
        resetForm();
      } else {
        setError(data.message || "Failed to save question");
      }
    } catch (err) {
      console.error("Error saving question:", err);
      setError("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (index) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const updatedQuestions = questions.filter((_, i) => i !== index);

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ questions: updatedQuestions }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setQuestions(updatedQuestions);
        setSuccess("Question deleted!");
      } else {
        setError(data.message || "Failed to delete question");
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      setError("Failed to delete question");
    }
  };

  if (loading) {
    return (
      <div className="mpq-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="mpq-container">
      <div className="mpq-content">
        <div className="mpq-header">
          <div>
            <h2>Manage Questions</h2>
            {exam && <p className="mpq-exam-title">Exam: {exam.title}</p>}
          </div>
          <button
            className="mpq-btn mpq-btn-back"
            onClick={() => navigate("/faculty/practical-exams/manage")}
          >
            Back
          </button>
        </div>

        {error && <div className="mpq-error">{error}</div>}
        {success && <div className="mpq-success">{success}</div>}

        <div className="mpq-questions-section">
          <div className="mpq-questions-header">
            <h3>Questions ({questions.length})</h3>
            <button
              className="mpq-btn mpq-btn-primary"
              onClick={handleAddQuestion}
              disabled={showForm}
            >
              + Add Question
            </button>
          </div>

          {showForm && (
            <div className="mpq-form">
              <h4>
                {editingId !== null ? "Edit Question" : "Add New Question"}
              </h4>

              <div className="mpq-form-group">
                <label>Question Text *</label>
                <textarea
                  name="questionText"
                  value={formData.questionText}
                  onChange={handleFormChange}
                  placeholder="Enter question text"
                  rows="4"
                />
              </div>

              <div className="mpq-form-row">
                <div className="mpq-form-group">
                  <label>Marks *</label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleFormChange}
                    min="1"
                  />
                </div>

                <div className="mpq-form-group">
                  <label>Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleFormChange}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="mpq-form-actions">
                <button
                  type="button"
                  className="mpq-btn mpq-btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mpq-btn mpq-btn-primary"
                  onClick={handleSaveQuestion}
                >
                  {editingId !== null ? "Update" : "Add"} Question
                </button>
              </div>
            </div>
          )}

          <div className="mpq-questions-list">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <div key={index} className="mpq-question-card">
                  <div className="mpq-question-content">
                    <div className="mpq-question-header">
                      <h4>Question {index + 1}</h4>
                      <span
                        className={`mpq-difficulty mpq-difficulty-${question.difficulty?.toLowerCase()}`}
                      >
                        {question.difficulty || "Medium"}
                      </span>
                    </div>
                    <p className="mpq-question-text">{question.questionText}</p>
                    <p className="mpq-question-marks">
                      Marks: {question.marks}
                    </p>
                  </div>

                  <div className="mpq-question-actions">
                    <button
                      className="mpq-btn mpq-btn-edit"
                      onClick={() => handleEditQuestion(index)}
                      disabled={showForm}
                    >
                      Edit
                    </button>
                    <button
                      className="mpq-btn mpq-btn-delete"
                      onClick={() => handleDeleteQuestion(index)}
                      disabled={showForm}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="mpq-empty-state">
                No questions added yet. Click "Add Question" to get started.
              </p>
            )}
          </div>

          {questions.length > 0 && (
            <div className="mpq-summary">
              <p>
                Total Questions: <strong>{questions.length}</strong> | Total
                Marks:{" "}
                <strong>
                  {questions.reduce((sum, q) => sum + (q.marks || 0), 0)}
                </strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePracticalQuestions;
