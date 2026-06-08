import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";
import { showSuccessAlert, showErrorAlert } from "../../utils/alertUtils";
import "./CourseDetailsModal.css";

const CourseDetailsModal = ({ isOpen, onClose, subject, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyList, setCopyList] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState("");

  const [formData, setFormData] = useState({
    courseCode: "",
    courseTitle: "",
    abbreviation: "",
    courseCategory: "",
    credits: 0,
    paperDuration: "",
    learningScheme: {
      cl: "-",
      tl: "-",
      ll: "-",
      slh: "-",
      nlh: "-",
    },
    assessmentScheme: {
      theory: {
        faThMax: "-",
        saThMax: "-",
        total: "-",
        min: "-",
      },
      practical: {
        faPrMax: "-",
        faPrMin: "-",
        saPrMax: "-",
        saPrMin: "-",
      },
      sla: {
        max: "-",
        min: "-",
      },
      totalMarks: "-",
    },
    courseOutcomes: [],
  });

  // Fetch existing details for the subject
  useEffect(() => {
    if (!isOpen || !subject) return;

    const fetchDetailsAndCopyList = async () => {
      setLoading(true);
      try {
        // Fetch copy list
        const copyRes = await axios.get(config.courseDetails.listAll);
        if (copyRes.data.success) {
          // Filter out the current subject details if any
          setCopyList(
            copyRes.data.courseDetailsList.filter(
              (item) => item.subjectId?._id !== subject._id
            )
          );
        }

        // Fetch subject details
        const res = await axios.get(config.courseDetails.bySubject(subject._id));
        if (res.data.success && res.data.courseDetails) {
          const details = res.data.courseDetails;
          setFormData({
            courseCode: details.courseCode || "",
            courseTitle: details.courseTitle || "",
            abbreviation: details.abbreviation || "",
            courseCategory: details.courseCategory || "",
            credits: details.credits || 0,
            paperDuration: details.paperDuration || "",
            learningScheme: {
              cl: details.learningScheme?.cl || "-",
              tl: details.learningScheme?.tl || "-",
              ll: details.learningScheme?.ll || "-",
              slh: details.learningScheme?.slh || "-",
              nlh: details.learningScheme?.nlh || "-",
            },
            assessmentScheme: {
              theory: {
                faThMax: details.assessmentScheme?.theory?.faThMax || "-",
                saThMax: details.assessmentScheme?.theory?.saThMax || "-",
                total: details.assessmentScheme?.theory?.total || "-",
                min: details.assessmentScheme?.theory?.min || "-",
              },
              practical: {
                faPrMax: details.assessmentScheme?.practical?.faPrMax || "-",
                faPrMin: details.assessmentScheme?.practical?.faPrMin || "-",
                saPrMax: details.assessmentScheme?.practical?.saPrMax || "-",
                saPrMin: details.assessmentScheme?.practical?.saPrMin || "-",
              },
              sla: {
                max: details.assessmentScheme?.sla?.max || "-",
                min: details.assessmentScheme?.sla?.min || "-",
              },
              totalMarks: details.assessmentScheme?.totalMarks || "-",
            },
            courseOutcomes: details.courseOutcomes || [],
          });
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // If not found, prepopulate with subject defaults
          setFormData({
            courseCode: subject.code || "",
            courseTitle: subject.name || "",
            abbreviation: "",
            courseCategory: "",
            credits: subject.courseId?.credits || 0,
            paperDuration: "",
            learningScheme: {
              cl: "-",
              tl: "-",
              ll: "-",
              slh: "-",
              nlh: "-",
            },
            assessmentScheme: {
              theory: { faThMax: "-", saThMax: "-", total: "-", min: "-" },
              practical: { faPrMax: "-", faPrMin: "-", saPrMax: "-", saPrMin: "-" },
              sla: { max: "-", min: "-" },
              totalMarks: "-",
            },
            courseOutcomes: [
              { coNumber: "CO1", description: "" },
            ],
          });
        } else {
          showErrorAlert("Failed to load course details structure");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailsAndCopyList();
  }, [isOpen, subject]);

  // Parse numeric parts for calculations
  const parseVal = (val) => {
    if (!val || val === "-") return 0;
    const parsed = parseInt(val.replace(/[^0-9]/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Handle simple form fields
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle learning scheme fields
  const handleLearningChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      learningScheme: {
        ...prev.learningScheme,
        [field]: value,
      },
    }));
  };

  // Handle assessment scheme fields & auto-calculate totals
  const handleAssessmentChange = (section, field, value) => {
    setFormData((prev) => {
      const updatedAssessment = { ...prev.assessmentScheme };
      
      if (section === "theory") {
        updatedAssessment.theory = {
          ...updatedAssessment.theory,
          [field]: value,
        };
        // Auto-calculate Theory Total
        const fa = parseVal(updatedAssessment.theory.faThMax);
        const sa = parseVal(updatedAssessment.theory.saThMax);
        const totalSum = fa + sa;
        updatedAssessment.theory.total = totalSum > 0 ? String(totalSum) : "-";
      } else if (section === "practical") {
        updatedAssessment.practical = {
          ...updatedAssessment.practical,
          [field]: value,
        };
      } else if (section === "sla") {
        updatedAssessment.sla = {
          ...updatedAssessment.sla,
          [field]: value,
        };
      }

      // Auto-calculate Final Total Marks
      const theoryTotal = parseVal(updatedAssessment.theory.total);
      const prFa = parseVal(updatedAssessment.practical.faPrMax);
      const prSa = parseVal(updatedAssessment.practical.saPrMax);
      const sla = parseVal(updatedAssessment.sla.max);
      const grandTotal = theoryTotal + prFa + prSa + sla;
      
      updatedAssessment.totalMarks = grandTotal > 0 ? String(grandTotal) : "-";

      return {
        ...prev,
        assessmentScheme: updatedAssessment,
      };
    });
  };

  // CO outcomes management
  const handleCOChange = (index, value) => {
    setFormData((prev) => {
      const nextCOs = [...prev.courseOutcomes];
      nextCOs[index].description = value;
      return { ...prev, courseOutcomes: nextCOs };
    });
  };

  const addCO = () => {
    setFormData((prev) => {
      const nextCOs = [...prev.courseOutcomes];
      const nextNum = nextCOs.length + 1;
      nextCOs.push({ coNumber: `CO${nextNum}`, description: "" });
      return { ...prev, courseOutcomes: nextCOs };
    });
  };

  const removeCO = (index) => {
    setFormData((prev) => {
      const nextCOs = prev.courseOutcomes.filter((_, i) => i !== index);
      // Re-number COs
      const renumbered = nextCOs.map((co, i) => ({
        ...co,
        coNumber: `CO${i + 1}`,
      }));
      return { ...prev, courseOutcomes: renumbered };
    });
  };

  // Copy structure from another course details configuration
  const handleCopyStructure = async (e) => {
    const copyId = e.target.value;
    setSelectedCopyId(copyId);
    if (!copyId) return;

    try {
      const res = await axios.get(config.courseDetails.bySubject(copyId));
      if (res.data.success && res.data.courseDetails) {
        const details = res.data.courseDetails;
        setFormData((prev) => ({
          ...prev,
          // Preserving current subject details but copying structure
          courseCode: details.courseCode || prev.courseCode,
          courseTitle: details.courseTitle || prev.courseTitle,
          abbreviation: details.abbreviation || prev.abbreviation,
          courseCategory: details.courseCategory || prev.courseCategory,
          credits: details.credits || prev.credits,
          paperDuration: details.paperDuration || prev.paperDuration,
          learningScheme: {
            cl: details.learningScheme?.cl || "-",
            tl: details.learningScheme?.tl || "-",
            ll: details.learningScheme?.ll || "-",
            slh: details.learningScheme?.slh || "-",
            nlh: details.learningScheme?.nlh || "-",
          },
          assessmentScheme: {
            theory: {
              faThMax: details.assessmentScheme?.theory?.faThMax || "-",
              saThMax: details.assessmentScheme?.theory?.saThMax || "-",
              total: details.assessmentScheme?.theory?.total || "-",
              min: details.assessmentScheme?.theory?.min || "-",
            },
            practical: {
              faPrMax: details.assessmentScheme?.practical?.faPrMax || "-",
              faPrMin: details.assessmentScheme?.practical?.faPrMin || "-",
              saPrMax: details.assessmentScheme?.practical?.saPrMax || "-",
              saPrMin: details.assessmentScheme?.practical?.saPrMin || "-",
            },
            sla: {
              max: details.assessmentScheme?.sla?.max || "-",
              min: details.assessmentScheme?.sla?.min || "-",
            },
            totalMarks: details.assessmentScheme?.totalMarks || "-",
          },
          courseOutcomes: details.courseOutcomes || [],
        }));
        showSuccessAlert("Structure loaded successfully from selected subject!");
      }
    } catch (error) {
      showErrorAlert("Failed to copy structure from selected subject");
    }
  };

  // Submit Handler
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        subjectId: subject._id,
        ...formData,
      };

      const res = await axios.post(config.courseDetails.save, payload);
      if (res.data.success) {
        showSuccessAlert("Course details & CO mapping saved successfully!");
        onSaveSuccess();
        onClose();
      } else {
        showErrorAlert(res.data.message || "Failed to save details");
      }
    } catch (error) {
      showErrorAlert(error.response?.data?.message || "Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="course-details-modal-overlay">
      <div className="course-details-modal-container">
        <div className="course-details-modal-header">
          <div>
            <h3>Course Details & CO Mapping</h3>
            <p className="subject-meta-text">
              Subject: <strong>{subject?.name} ({subject?.code})</strong>
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading course details...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="course-details-modal-body">
            
            {/* Copy Structure Control */}
            {copyList.length > 0 && (
              <div className="copy-structure-section card-banner">
                <i className="bi bi-copy"></i>
                <div className="copy-control">
                  <label htmlFor="copy-select">Copy structure from another subject:</label>
                  <select
                    id="copy-select"
                    value={selectedCopyId}
                    onChange={handleCopyStructure}
                  >
                    <option value="">-- Choose Subject to Copy --</option>
                    {copyList.map((item) => (
                      <option key={item.subjectId?._id} value={item.subjectId?._id}>
                        {item.subjectId?.name} ({item.subjectId?.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* A. BASIC COURSE DETAILS */}
            <div className="form-section-card">
              <h4 className="section-title"><i className="bi bi-card-text"></i> Basic Course Details</h4>
              <div className="modal-grid-row">
                <div className="modal-form-field">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => handleFieldChange("courseCode", e.target.value)}
                    placeholder="e.g. 316313"
                    required
                  />
                </div>
                <div className="modal-form-field double-span">
                  <label>Course Title</label>
                  <input
                    type="text"
                    value={formData.courseTitle}
                    onChange={(e) => handleFieldChange("courseTitle", e.target.value)}
                    placeholder="e.g. Emerging Trends..."
                    required
                  />
                </div>
              </div>
              <div className="modal-grid-row">
                <div className="modal-form-field">
                  <label>Abbreviation</label>
                  <input
                    type="text"
                    value={formData.abbreviation}
                    onChange={(e) => handleFieldChange("abbreviation", e.target.value)}
                    placeholder="e.g. ETI"
                  />
                </div>
                <div className="modal-form-field">
                  <label>Course Category</label>
                  <input
                    type="text"
                    value={formData.courseCategory}
                    onChange={(e) => handleFieldChange("courseCategory", e.target.value)}
                    placeholder="e.g. DSC"
                  />
                </div>
                <div className="modal-form-field">
                  <label>Credits</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleFieldChange("credits", parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="modal-form-field">
                  <label>Paper Duration (Hrs)</label>
                  <input
                    type="text"
                    value={formData.paperDuration}
                    onChange={(e) => handleFieldChange("paperDuration", e.target.value)}
                    placeholder="e.g. 1.5"
                  />
                </div>
              </div>
            </div>

            {/* B. LEARNING SCHEME SECTION */}
            <div className="form-section-card">
              <h4 className="section-title"><i className="bi bi-clock-history"></i> Learning Scheme</h4>
              <div className="learning-scheme-grid">
                <div className="modal-form-field">
                  <label>CL (Class Lecture)</label>
                  <input
                    type="text"
                    value={formData.learningScheme.cl}
                    onChange={(e) => handleLearningChange("cl", e.target.value)}
                  />
                </div>
                <div className="modal-form-field">
                  <label>TL (Tutorial Lecture)</label>
                  <input
                    type="text"
                    value={formData.learningScheme.tl}
                    onChange={(e) => handleLearningChange("tl", e.target.value)}
                  />
                </div>
                <div className="modal-form-field">
                  <label>LL (Lab Lecture)</label>
                  <input
                    type="text"
                    value={formData.learningScheme.ll}
                    onChange={(e) => handleLearningChange("ll", e.target.value)}
                  />
                </div>
                <div className="modal-form-field">
                  <label>SLH (Self Learning Hrs)</label>
                  <input
                    type="text"
                    value={formData.learningScheme.slh}
                    onChange={(e) => handleLearningChange("slh", e.target.value)}
                  />
                </div>
                <div className="modal-form-field">
                  <label>NLH (Net Learning Hrs)</label>
                  <input
                    type="text"
                    value={formData.learningScheme.nlh}
                    onChange={(e) => handleLearningChange("nlh", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* C. ASSESSMENT SCHEME SECTION */}
            <div className="form-section-card">
              <h4 className="section-title"><i className="bi bi-award"></i> Assessment Scheme</h4>
              
              <div className="assessment-subsection">
                <h5>Theory Assessment</h5>
                <div className="assessment-grid">
                  <div className="modal-form-field">
                    <label>FA-TH Max</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.theory.faThMax}
                      onChange={(e) => handleAssessmentChange("theory", "faThMax", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>SA-TH Max</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.theory.saThMax}
                      onChange={(e) => handleAssessmentChange("theory", "saThMax", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>Theory Total (Calculated)</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.theory.total}
                      disabled
                      className="calculated-input"
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>Theory Min Passing</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.theory.min}
                      onChange={(e) => handleAssessmentChange("theory", "min", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="assessment-subsection">
                <h5>Practical Assessment (Based on LL & TL)</h5>
                <div className="assessment-grid">
                  <div className="modal-form-field">
                    <label>FA-PR Max</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.practical.faPrMax}
                      onChange={(e) => handleAssessmentChange("practical", "faPrMax", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>FA-PR Min</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.practical.faPrMin}
                      onChange={(e) => handleAssessmentChange("practical", "faPrMin", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>SA-PR Max</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.practical.saPrMax}
                      onChange={(e) => handleAssessmentChange("practical", "saPrMax", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>SA-PR Min</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.practical.saPrMin}
                      onChange={(e) => handleAssessmentChange("practical", "saPrMin", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="assessment-subsection">
                <h5>Based on SL (Self Learning Assessment)</h5>
                <div className="assessment-grid-3">
                  <div className="modal-form-field">
                    <label>SLA Max</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.sla.max}
                      onChange={(e) => handleAssessmentChange("sla", "max", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>SLA Min</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.sla.min}
                      onChange={(e) => handleAssessmentChange("sla", "min", e.target.value)}
                    />
                  </div>
                  <div className="modal-form-field">
                    <label>Grand Total Marks (Calculated)</label>
                    <input
                      type="text"
                      value={formData.assessmentScheme.totalMarks}
                      disabled
                      className="calculated-input grand-total"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* D. COURSE OUTCOMES (CO) */}
            <div className="form-section-card">
              <div className="section-title-row">
                <h4 className="section-title"><i className="bi bi-list-stars"></i> Course Outcomes (CO)</h4>
                <button type="button" className="btn-add-co" onClick={addCO}>
                  <i className="bi bi-plus-circle"></i> Add CO
                </button>
              </div>

              {formData.courseOutcomes.length === 0 ? (
                <div className="no-cos-banner">
                  <p>No Course Outcomes added yet. Click "+ Add CO" to define one.</p>
                </div>
              ) : (
                <div className="co-list-container">
                  {formData.courseOutcomes.map((co, index) => (
                    <div className="co-row-item" key={index}>
                      <span className="co-number-badge">{co.coNumber}</span>
                      <div className="co-description-field">
                        <input
                          type="text"
                          value={co.description}
                          onChange={(e) => handleCOChange(index, e.target.value)}
                          placeholder={`Enter outcome description for ${co.coNumber}...`}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="co-delete-btn"
                        onClick={() => removeCO(index)}
                        title="Delete this outcome"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  "Save Course Details"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsModal;
