/**
 * SmartAttendanceHub.jsx
 *
 * Unified attendance entry point for faculty.
 * 1. Shows all Ciaans as cards.
 * 2. On card click → modal asks: Theory or Practical?
 * 3. Auto-checks if a plan exists for the chosen type.
 * 4. If plan exists → navigate to existing page.
 * 5. If plan MISSING → show inline Quick-Create form, then navigate.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import { fetchCiaansWithAuth } from "../../utils/CiannFetch";
import { config } from "../../config/api";
import "./SmartAttendanceHub.css";

const TEACHING_METHODS = [
  "Lecture",
  "Tutorial",
  "Practical Demo",
  "Flipped Classroom",
  "Case Study",
  "Group Discussion",
];

// ── MODAL STATE MACHINE ────────────────────────────────────────────
// idle → type-select → checking → navigate | quick-create
const SmartAttendanceHub = () => {
  const navigate = useNavigate();
  const [Ciaans, setCiaans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedCiaan, setSelectedCiaan] = useState(null);
  const [modalState, setModalState] = useState("idle"); // idle | type-select | checking | create-theory | create-practical | error
  const [errorMsg, setErrorMsg] = useState("");

  // Quick-create: Teaching Plan
  const [tpForm, setTpForm] = useState({
    chapter: "",
    subTopic: "",
    startDate: today(),
    teachingMethod: "Lecture",
  });
  const [tpSaving, setTpSaving] = useState(false);

  // Quick-create: Lab Plan
  const [lpForm, setLpForm] = useState({
    batch: "B1",
    exptNo: "1",
    exptName: "",
    date: today(),
  });
  const [lpSaving, setLpSaving] = useState(false);

  // ── Fetch Ciaans ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCiaansWithAuth();
        setCiaans(data);
      } catch (err) {
        console.error("Failed to load Ciaans:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Open modal ───────────────────────────────────────────────────
  const openModal = (Ciaan) => {
    setSelectedCiaan(Ciaan);
    setModalState("type-select");
    setErrorMsg("");
    setTpForm({
      chapter: "",
      subTopic: "",
      startDate: today(),
      teachingMethod: "Lecture",
    });
    setLpForm({ batch: "B1", exptNo: "1", exptName: "", date: today() });
  };

  const closeModal = () => {
    setSelectedCiaan(null);
    setModalState("idle");
    setErrorMsg("");
  };

  // ── Handle type selection ────────────────────────────────────────
  const handleTypeSelect = async (type) => {
    const Ciaan = selectedCiaan;
    setModalState("checking");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      if (type === "theory") {
        const res = await fetch(`${config.teachingPlan}/${Ciaan.CiaanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const hasPlans =
          Array.isArray(data) &&
          data.length > 0 &&
          data.some((w) => w.plans?.length > 0);

        if (hasPlans) {
          // Plan exists — navigate directly
          navigate("/theory-edit", { state: { CiaanData: Ciaan } });
          closeModal();
        } else {
          // No plan — show quick-create
          setModalState("create-theory");
        }
      } else {
        // Practical
        const res = await fetch(`${config.labPlanning}/${Ciaan.CiaanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const hasPlans =
          Array.isArray(data) &&
          data.length > 0 &&
          data.some((w) => w.plans?.length > 0);

        if (hasPlans) {
          navigate("/practical-attendance", { state: { CiaanData: Ciaan } });
          closeModal();
        } else {
          setModalState("create-practical");
        }
      }
    } catch (err) {
      setErrorMsg("Network error while checking plan. Please try again.");
      setModalState("type-select");
    }
  };

  // ── Quick-Create Teaching Plan ───────────────────────────────────
  const handleSaveTeachingPlan = async (e) => {
    e.preventDefault();
    if (!tpForm.chapter.trim() || !tpForm.subTopic.trim()) {
      setErrorMsg("Chapter and Sub Topic are required.");
      return;
    }
    setTpSaving(true);
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(config.teachingPlan, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          CiaanId: selectedCiaan.CiaanId,
          weekNo: 1,
          plans: [
            {
              chapter: tpForm.chapter.trim(),
              subTopic: tpForm.subTopic.trim(),
              startDate: tpForm.startDate,
              endDate: tpForm.startDate,
              teachingMethod: tpForm.teachingMethod,
            },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create teaching plan.");
      }
      // Navigate to theory-edit
      navigate("/theory-edit", { state: { CiaanData: selectedCiaan } });
      closeModal();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setTpSaving(false);
    }
  };

  // ── Quick-Create Lab Plan ────────────────────────────────────────
  const handleSaveLabPlan = async (e) => {
    e.preventDefault();
    if (!lpForm.exptName.trim()) {
      setErrorMsg("Experiment Name is required.");
      return;
    }
    setLpSaving(true);
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(config.labPlanning, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          CiaanId: selectedCiaan.CiaanId,
          weekNo: 1,
          plans: [
            {
              batch: lpForm.batch,
              exptNo: lpForm.exptNo.trim(),
              exptName: lpForm.exptName.trim(),
              date: lpForm.date,
            },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create lab plan.");
      }
      navigate("/practical-attendance", {
        state: { CiaanData: selectedCiaan },
      });
      closeModal();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLpSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <Header showSearch={false} />
      <div className="sah-page">
        <div className="sah-header">
          <h1>Smart Attendance Hub</h1>
          <p>
            Select a Ciaan to mark Theory or Practical attendance in one place.
          </p>
        </div>

        <div className="sah-grid">
          {loading ? (
            <div className="sah-loading">Loading your Ciaans...</div>
          ) : Ciaans.length === 0 ? (
            <div className="sah-empty">
              <h3>No Ciaans Found</h3>
              <p>
                You haven't created any Ciaans yet. Go to Create Ciaan to get
                started.
              </p>
            </div>
          ) : (
            Ciaans.map((Ciaan) => (
              <div
                key={Ciaan._id}
                className="sah-card"
                onClick={() => openModal(Ciaan)}
              >
                <div className="sah-card-id">Ciaan ID: {Ciaan.CiaanId}</div>
                <div className="sah-card-subject">
                  {Ciaan.subject?.name || "Unknown Subject"}
                </div>
                <div className="sah-card-code">{Ciaan.subject?.code || ""}</div>
                <div className="sah-card-meta">
                  <span className="sah-tag">Div: {Ciaan.division}</span>
                  <span className="sah-tag">Sem {Ciaan.semester}</span>
                  <span className="sah-tag">
                    {Ciaan.department?.name || ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────── */}
      {selectedCiaan && modalState !== "idle" && (
        <div
          className="sah-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="sah-modal">
            {/* Modal Header */}
            <div className="sah-modal-header">
              <h2>
                {modalState === "type-select" && "Mark Attendance"}
                {modalState === "checking" && "Checking Plan..."}
                {modalState === "create-theory" && "Quick Setup: Teaching Plan"}
                {modalState === "create-practical" && "Quick Setup: Lab Plan"}
              </h2>
              <button className="sah-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            {/* Ciaan Info */}
            <div className="sah-modal-Ciaan-info">
              <p>
                {selectedCiaan.subject?.name} ({selectedCiaan.subject?.code})
              </p>
              <span>
                Ciaan {selectedCiaan.CiaanId} · Division{" "}
                {selectedCiaan.division} · Sem {selectedCiaan.semester}
              </span>
            </div>

            {/* Error Banner */}
            {errorMsg && <div className="sah-error-banner">{errorMsg}</div>}

            {/* ── State: Type Select ─────────────────────────────── */}
            {modalState === "type-select" && (
              <div className="sah-type-select">
                <button
                  className="sah-type-btn theory"
                  onClick={() => handleTypeSelect("theory")}
                >
                  <span className="sah-type-icon">📖</span>
                  <span className="sah-type-label">Theory</span>
                  <span className="sah-type-desc">Mark lecture attendance</span>
                </button>
                <button
                  className="sah-type-btn practical"
                  onClick={() => handleTypeSelect("practical")}
                >
                  <span className="sah-type-icon">🧪</span>
                  <span className="sah-type-label">Practical</span>
                  <span className="sah-type-desc">
                    Mark lab attendance by batch
                  </span>
                </button>
              </div>
            )}

            {/* ── State: Checking ────────────────────────────────── */}
            {modalState === "checking" && (
              <div className="sah-checking">
                ⏳ Checking plan details for Ciaan {selectedCiaan.CiaanId}...
              </div>
            )}

            {/* ── State: Quick-Create Teaching Plan ──────────────── */}
            {modalState === "create-theory" && (
              <div className="sah-quick-form">
                <div className="sah-quick-form-title">
                  📋 No Teaching Plan Found — Create one to continue
                </div>
                <form onSubmit={handleSaveTeachingPlan}>
                  <div className="sah-form-row">
                    <div className="sah-form-group">
                      <label>Chapter *</label>
                      <input
                        type="text"
                        placeholder="e.g. Chapter 1"
                        value={tpForm.chapter}
                        onChange={(e) =>
                          setTpForm({ ...tpForm, chapter: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="sah-form-group">
                      <label>Week No</label>
                      <input type="number" value={1} readOnly />
                    </div>
                  </div>
                  <div className="sah-form-group">
                    <label>Sub Topic *</label>
                    <input
                      type="text"
                      placeholder="e.g. Introduction to Data Structures"
                      value={tpForm.subTopic}
                      onChange={(e) =>
                        setTpForm({ ...tpForm, subTopic: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="sah-form-row">
                    <div className="sah-form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        value={tpForm.startDate}
                        max={today()}
                        onChange={(e) =>
                          setTpForm({ ...tpForm, startDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="sah-form-group">
                      <label>Teaching Method *</label>
                      <select
                        value={tpForm.teachingMethod}
                        onChange={(e) =>
                          setTpForm({
                            ...tpForm,
                            teachingMethod: e.target.value,
                          })
                        }
                      >
                        {TEACHING_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sah-form-actions">
                    <button
                      type="button"
                      className="sah-btn sah-btn-secondary"
                      onClick={() => setModalState("type-select")}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="sah-btn sah-btn-primary"
                      disabled={tpSaving}
                    >
                      {tpSaving ? "Creating..." : "✅ Create & Continue →"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── State: Quick-Create Lab Plan ───────────────────── */}
            {modalState === "create-practical" && (
              <div className="sah-quick-form">
                <div className="sah-quick-form-title">
                  🧪 No Lab Plan Found — Create one to continue
                </div>
                <form onSubmit={handleSaveLabPlan}>
                  <div className="sah-form-row">
                    <div className="sah-form-group">
                      <label>Batch *</label>
                      <select
                        value={lpForm.batch}
                        onChange={(e) =>
                          setLpForm({ ...lpForm, batch: e.target.value })
                        }
                      >
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B3">B3</option>
                      </select>
                    </div>
                    <div className="sah-form-group">
                      <label>Experiment No *</label>
                      <input
                        type="text"
                        placeholder="e.g. 1"
                        value={lpForm.exptNo}
                        onChange={(e) =>
                          setLpForm({ ...lpForm, exptNo: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="sah-form-group">
                    <label>Experiment Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Introduction to Arduino"
                      value={lpForm.exptName}
                      onChange={(e) =>
                        setLpForm({ ...lpForm, exptName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="sah-form-group">
                    <label>Planned Date *</label>
                    <input
                      type="date"
                      value={lpForm.date}
                      onChange={(e) =>
                        setLpForm({ ...lpForm, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="sah-form-actions">
                    <button
                      type="button"
                      className="sah-btn sah-btn-secondary"
                      onClick={() => setModalState("type-select")}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="sah-btn sah-btn-primary"
                      disabled={lpSaving}
                    >
                      {lpSaving ? "Creating..." : "✅ Create & Continue →"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Helper: today's date in YYYY-MM-DD
function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().split("T")[0];
}

export default SmartAttendanceHub;
