import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./MSBTEPages.css";

const PASSING_HEADS = [
  { key: "ct1",       label: "CT-1",        isEditable: true,  indent: true },
  { key: "ct2",       label: "CT-2",        isEditable: true,  indent: true },
  { key: "finalFaTh", label: "Final (Avg)", isEditable: false, indent: true },
  { key: "saTh",      label: "SA-TH",       isEditable: true,  indent: false },
  { key: "faPr",      label: "FA-PR",       isEditable: true,  indent: false },
  { key: "saPr",      label: "SA-PR",       isEditable: true,  indent: false },
  { key: "sla",       label: "SLA",         isEditable: true,  indent: false },
];

const DEFAULT_ACTIVE_KEYS = ["ct1", "ct2", "finalFaTh", "faTh", "saTh", "faPr", "saPr", "sla"];

const FIELD_LABELS = {
  ct1: "CT-1", ct2: "CT-2", finalFaTh: "Final (Avg)", faTh: "FA-TH", saTh: "SA-TH", faPr: "FA-PR", saPr: "SA-PR", sla: "SLA",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Compute summary stats for a given array of numeric values (nulls = absent) */
function computeStats(values, maxMark) {
  const present = values.filter(v => v !== null && v !== undefined && v !== "");
  if (present.length === 0) return { lowest: "", highest: "", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
  const nums = present.map(Number);
  const appeared = nums.length;
  const passed   = nums.filter(n => n >= maxMark * 0.4).length;
  const above60  = nums.filter(n => n >= maxMark * 0.6).length;
  return {
    lowest:     String(Math.min(...nums)),
    highest:    String(Math.max(...nums)),
    appeared,
    passed,
    passPct:    Math.round((passed  / appeared) * 100),
    above60Pct: Math.round((above60 / appeared) * 100),
  };
}

/** Recompute the Final (CT Avg) row from ct1 and ct2 columns */
function recomputeFinalRow(studentRows, maxMark) {
  const avgs = studentRows.map(row => {
    const v1 = row.ct1, v2 = row.ct2;
    if (v1 !== null && v2 !== null && v1 !== "" && v2 !== "") return (Number(v1) + Number(v2)) / 2;
    if (v1 !== null && v1 !== "") return Number(v1);
    if (v2 !== null && v2 !== "") return Number(v2);
    return null;
  });
  return computeStats(avgs, maxMark);
}

/** Derive Calculated Stats (Final & FA-TH) from CT-1 and CT-2 stats */
function deriveCalculatedStats(courseStats) {
  const updated = { ...courseStats };
  const c1 = updated["ct1"] || { lowest: "", highest: "", appeared: "", passed: "", passPct: "", above60Pct: "" };
  const c2 = updated["ct2"] || { lowest: "", highest: "", appeared: "", passed: "", passPct: "", above60Pct: "" };

  // 1. Calculate Final (average of CT-1 and CT-2)
  const finalApp = Math.max(Number(c1.appeared || 0), Number(c2.appeared || 0)) || "";
  const finalPas = Math.round((Number(c1.passed || 0) + Number(c2.passed || 0)) / 2) || "";
  const finalPassPct = finalApp > 0 ? Math.round((Number(finalPas) / Number(finalApp)) * 100) : "";
  const finalLowest = (c1.lowest !== "" && c2.lowest !== "") ? String(Math.round((Number(c1.lowest) + Number(c2.lowest)) / 2)) : (c1.lowest || c2.lowest || "");
  const finalHighest = (c1.highest !== "" && c2.highest !== "") ? String(Math.round((Number(c1.highest) + Number(c2.highest)) / 2)) : (c1.highest || c2.highest || "");
  const finalAbove60 = Math.round((Number(c1.above60Pct || 0) + Number(c2.above60Pct || 0)) / 2) || "";

  updated["finalFaTh"] = {
    passingHead: "finalFaTh",
    lowest: finalLowest,
    highest: finalHighest,
    appeared: finalApp,
    passed: finalPas,
    passPct: finalPassPct,
    above60Pct: finalAbove60
  };

  // 2. Calculate FA-TH (identical to Final average out of 30)
  updated["faTh"] = {
    passingHead: "faTh",
    lowest: finalLowest,
    highest: finalHighest,
    appeared: finalApp,
    passed: finalPas,
    passPct: finalPassPct,
    above60Pct: finalAbove60
  };

  return updated;
}


// ─── component ────────────────────────────────────────────────────────────────

const K7Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── URL params ──────────────────────────────────────────────────────────────
  const [academicYear,  setAcademicYear]  = useState("");
  const [semester,      setSemester]      = useState("");
  const [departmentId,  setDepartmentId]  = useState("");
  const [divisionId,    setDivisionId]    = useState("");

  // ── metadata ────────────────────────────────────────────────────────────────
  const [departmentName, setDepartmentName] = useState("");
  const [divisionName,   setDivisionName]   = useState("");
  const [instituteName,  setInstituteName]  = useState("");

  // ── subjects (one per course code found in the semester) ────────────────────
  // subjects: [{ courseCode, courseName, maxMarks: { ct1, ct2, faTh, saTh, faPr, saPr, sla } }]
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);

  // ── student marks table: [{ studentId, rollNo, studentName, ct1, ct2, saTh, faPr, saPr, sla }]
  const [studentRows, setStudentRows] = useState([]);

  // ── summary stats per subject: { [courseCode]: { [headKey]: { lowest, highest, appeared, passed, passPct, above60Pct } } }
  const [summaryStats, setSummaryStats] = useState({});

  // ── which passing heads are shown in the summary panel (per subject) ─────────
  // activeHeads: { [courseCode]: [headKey, ...] }
  const [activeHeads, setActiveHeads] = useState({});
  const [addHeadSelect, setAddHeadSelect] = useState("");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState("summary"); // default to summary

  // ── CIANN manual input state ────────────────────────────────────────────────
  const [ciannId, setCiannId] = useState("");
  const [ciannData, setCiannData] = useState(null);

  const handleLoadCiann = async (cid, urlDivId = "") => {
    if (!cid) return;
    setLoading(true);
    try {
      const res = await axios.get(`/cianns/${cid}`);
      if (res.data) {
        const ciann = res.data;
        setCiannData(ciann);
        
        // Resolve target fields
        const deptId = ciann.department?._id || ciann.department;
        const divisionName = ciann.division;
        const semester = ciann.semester;
        const academicYear = ciann.academicYear;
        const courseCode = ciann.subject?.code;

        setAcademicYear(academicYear);
        setSemester(semester);
        setDepartmentId(deptId);
        setDivisionName(divisionName);

        // Re-run init logic with the new parameters
        await init(academicYear, semester, deptId, urlDivId, divisionName, cid, courseCode);
      } else {
        alert("CIANN not found or access denied.");
      }
    } catch (err) {
      console.error("Failed to load CIANN:", err);
      alert("Error loading CIANN. Please verify the CIANN ID.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const ay    = p.get("academicYear")  || "";
    const sem   = p.get("semester")      || "";
    const deptId= p.get("departmentId") || "";
    const divId = p.get("divisionId")   || "";
    const divName = p.get("divisionName") || "";
    const urlCiannId = p.get("ciannId") || "";
    const urlCourseCode = p.get("courseCode") || "";

    setAcademicYear(ay); setSemester(sem);
    setDepartmentId(deptId);
    setInstituteName(localStorage.getItem("institutionName") || "");

    if (urlCiannId) {
      setCiannId(urlCiannId);
      handleLoadCiann(urlCiannId, divId);
    } else if (ay && sem && deptId) {
      init(ay, sem, deptId, divId, divName, "", urlCourseCode);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const init = async (ay, sem, deptId, divId, divName, urlCiannId, urlCourseCode) => {
    setLoading(true);
    try {
      // 1. department name
      const deptRes = await axios.get("/catalog/departments");
      if (deptRes.data?.success) {
        const d = deptRes.data.departments?.find(d => d._id === deptId);
        if (d) setDepartmentName(d.name);
      }

      // 2. division name / ID lookup
      let targetDivId = divId;
      const courseRes = await axios.get(`/catalog/courses/${deptId}`);
      if (courseRes.data?.success && Array.isArray(courseRes.data.courses)) {
        let found = false;
        for (const c of courseRes.data.courses) {
          if (Number(c.semester) !== Number(sem)) continue;
          const divRes = await axios.get(`/catalog/divisions/${c._id}`);
          if (divRes.data?.success) {
            if (divId) {
              const dv = divRes.data.divisions?.find(d => d._id === divId);
              if (dv) {
                setDivisionName(dv.name);
                targetDivId = dv._id;
                setDivisionId(dv._id);
                found = true;
                break;
              }
            } else if (divName) {
              const dv = divRes.data.divisions?.find(d => d.name.toLowerCase() === divName.toLowerCase());
              if (dv) {
                setDivisionName(dv.name);
                targetDivId = dv._id;
                setDivisionId(dv._id);
                found = true;
                break;
              }
            }
          }
        }
      }

      if (!targetDivId) {
        console.warn("Could not find divisionId for divisionName:", divName);
        setLoading(false);
        return;
      }

      // 3. fetch saved K7 record
      const k7Res = await axios.get(
        `/msbte/k7?academicYear=${ay}&semester=${sem}&departmentId=${deptId}&divisionId=${targetDivId}`
      );

      if (k7Res.data?.success && k7Res.data.data) {
        const rec = k7Res.data.data;
        const hasCourse = urlCourseCode && (rec.courseConfigs || []).some(
          c => c.courseCode.toLowerCase() === urlCourseCode.toLowerCase()
        );
        if (urlCourseCode && !hasCourse) {
          await autoPopulate(ay, sem, deptId, targetDivId, urlCiannId, urlCourseCode);
        } else {
          loadFromRecord(rec, urlCourseCode);
        }
      } else {
        // populate from DB (auto)
        await autoPopulate(ay, sem, deptId, targetDivId, urlCiannId, urlCourseCode);
      }
    } catch (err) {
      console.error("Init failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromRecord = (rec, urlCourseCode) => {
    // subjects from courseConfigs
    let subs = (rec.courseConfigs || []).map(c => ({
      courseCode: c.courseCode,
      courseName: c.courseName,
      maxMarks: c.maxMarks || defaultMaxMarks(),
    }));

    if (urlCourseCode) {
      subs = subs.filter(s => s.courseCode.toLowerCase() === urlCourseCode.toLowerCase());
    }
    setSubjects(subs);

    // student rows
    const rows = (rec.studentMarks || []).map(s => {
      const base = { studentId: s.studentId, rollNo: s.rollNo || "", studentName: s.studentName || "" };
      const courseMap = {};
      (s.courses || []).forEach(c => { courseMap[c.courseCode] = c; });
      return { ...base, courseMap };
    });
    setStudentRows(rows);

    // active heads + summary stats per course
    const ah = {}, ss = {};
    (rec.courseStats || []).forEach(cs => {
      const keys = (cs.stats || []).map(s => s.passingHead);
      const mergedKeys = [...keys];
      DEFAULT_ACTIVE_KEYS.forEach(k => {
        if (!mergedKeys.includes(k)) mergedKeys.push(k);
      });
      ah[cs.courseCode] = mergedKeys;
      
      const statsObj = {};
      DEFAULT_ACTIVE_KEYS.forEach(k => {
        statsObj[k] = { passingHead: k, lowest: "", highest: "", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
      });
      (cs.stats || []).forEach(s => { statsObj[s.passingHead] = s; });
      ss[cs.courseCode] = deriveCalculatedStats(statsObj);
    });

    subs.forEach(sub => {
      if (!ah[sub.courseCode]) {
        ah[sub.courseCode] = DEFAULT_ACTIVE_KEYS;
        const statsObj = {};
        DEFAULT_ACTIVE_KEYS.forEach(k => {
          statsObj[k] = { passingHead: k, lowest: "", highest: "", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
        });
        ss[sub.courseCode] = deriveCalculatedStats(statsObj);
      }
    });

    setActiveHeads(ah);
    setSummaryStats(ss);
  };

  const autoPopulate = async (ay, sem, deptId, divId, urlCiannId, urlCourseCode) => {
    try {
      const res = await axios.get(
        `/msbte/k7/populate?academicYear=${ay}&semester=${sem}&departmentId=${deptId}&divisionId=${divId}${urlCiannId ? `&ciannId=${urlCiannId}` : ''}`
      );
      if (!res.data?.success) return;

      let subs = (res.data.courseConfigs || []).map(c => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        maxMarks: c.maxMarks || defaultMaxMarks(),
      }));

      if (urlCourseCode) {
        subs = subs.filter(s => s.courseCode === urlCourseCode);
      }
      setSubjects(subs);

      const rows = (res.data.studentMarks || []).map(s => {
        const courseMap = {};
        (s.courses || []).forEach(c => { courseMap[c.courseCode] = c; });
        return { studentId: s.studentId, rollNo: s.rollNo || "", studentName: s.studentName || "", courseMap };
      });
      setStudentRows(rows);

      const ah = {}, ss = {};
      subs.forEach(sub => {
        const code = sub.courseCode;
        ah[code] = DEFAULT_ACTIVE_KEYS;
        const statsObj = {};
        DEFAULT_ACTIVE_KEYS.forEach(k => {
          statsObj[k] = { passingHead: k, lowest: "", highest: "", appeared: 0, passed: 0, passPct: 0, above60Pct: 0 };
        });
        ss[code] = deriveCalculatedStats(statsObj);
      });
      setActiveHeads(ah);
      setSummaryStats(ss);
    } catch (err) {
      console.error("Auto-populate failed:", err);
    }
  };


  // ─────────────────────────────────────────────────────────────────────────────
  //  STATS COMPUTATION
  // ─────────────────────────────────────────────────────────────────────────────
  const defaultMaxMarks = () => ({ ct1: 30, ct2: 30, finalFaTh: 30, faTh: 30, saTh: 70, faPr: 25, saPr: 25, sla: 25 });

  const getMaxForKey = (maxMarks, key) => {
    if (key === "ct1")      return maxMarks?.ct1      ?? 30;
    if (key === "ct2")      return maxMarks?.ct2      ?? 30;
    if (key === "finalFaTh")return maxMarks?.ct1      ?? 30; // CT avg uses CT max
    if (key === "faTh")     return maxMarks?.faTh     ?? 30;
    if (key === "saTh")     return maxMarks?.saTh     ?? 70;
    if (key === "faPr")     return maxMarks?.faPr     ?? 25;
    if (key === "saPr")     return maxMarks?.saPr     ?? 25;
    if (key === "sla")      return maxMarks?.sla      ?? 25;
    return 100;
  };

  const computeAllHeadStats = (rows, courseCode, maxMarks) => {
    const result = {};
    PASSING_HEADS.forEach(h => {
      const maxMark = getMaxForKey(maxMarks, h.key);
      if (h.key === "finalFaTh") {
        result[h.key] = recomputeFinalRow(
          rows.map(r => ({ ct1: r.courseMap?.[courseCode]?.ct1 ?? null, ct2: r.courseMap?.[courseCode]?.ct2 ?? null })),
          maxMark
        );
      } else {
        const vals = rows.map(r => r.courseMap?.[courseCode]?.[h.key] ?? null);
        result[h.key] = computeStats(vals, maxMark);
      }
    });
    return result;
  };

  // Recompute summary stats for the currently selected subject whenever studentRows changes
  const recomputeForSubject = useCallback((rows, subIdx, allSubjects) => {
    if (!allSubjects || allSubjects.length === 0) return;
    const sub = allSubjects[subIdx];
    if (!sub) return;
    const code = sub.courseCode;
    const headStats = computeAllHeadStats(rows, code, sub.maxMarks);
    setSummaryStats(prev => ({ ...prev, [code]: headStats }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  //  MARK ENTRY HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleMarkChange = (rowIdx, field, rawVal) => {
    const val = rawVal === "" ? null : Number(rawVal);
    const currentSubject = subjects[selectedSubjectIdx];
    if (!currentSubject) return;
    const code = currentSubject.courseCode;

    setStudentRows(prev => {
      const updated = prev.map((row, i) => {
        if (i !== rowIdx) return row;
        const courseEntry = { ...(row.courseMap?.[code] || {}), courseCode: code };
        courseEntry[field] = val;
        return { ...row, courseMap: { ...row.courseMap, [code]: courseEntry } };
      });
      // recalculate stats after state update
      setTimeout(() => recomputeForSubject(updated, selectedSubjectIdx, subjects), 0);
      return updated;
    });
  };

  const handleMaxMarkChange = (field, rawVal) => {
    const val = rawVal === "" ? 0 : Number(rawVal);
    setSubjects(prev => prev.map((s, i) => {
      if (i !== selectedSubjectIdx) return s;
      const maxMarks = { ...s.maxMarks, [field]: val };
      return { ...s, maxMarks };
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  SUMMARY HEADS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const currentCode = subjects[selectedSubjectIdx]?.courseCode || "";
  const currentActiveHeads = activeHeads[currentCode] || [];
  const availableToAdd = PASSING_HEADS.filter(h => !currentActiveHeads.includes(h.key));

  const addHead = () => {
    if (!addHeadSelect || !currentCode) return;
    if (currentActiveHeads.includes(addHeadSelect)) return;
    const ordered = PASSING_HEADS.map(h => h.key).filter(
      k => k === addHeadSelect || currentActiveHeads.includes(k)
    );
    setActiveHeads(prev => ({ ...prev, [currentCode]: ordered }));
    setAddHeadSelect("");
  };

  const removeHead = (key) => {
    setActiveHeads(prev => ({
      ...prev,
      [currentCode]: (prev[currentCode] || []).filter(k => k !== key),
    }));
  };

  // Manual override of a summary stat cell
  const handleSummaryStatChange = (headKey, field, rawVal) => {
    if (!currentCode) return;
    
    setSummaryStats(prev => {
      const courseStats = prev[currentCode] || {};
      const headStats = courseStats[headKey] || {
        passingHead: headKey,
        lowest: "",
        highest: "",
        appeared: "",
        passed: "",
        passPct: "",
        above60Pct: ""
      };

      const val = field === "lowest" || field === "highest" ? rawVal : (rawVal === "" ? "" : Number(rawVal));
      const updatedHead = { ...headStats, [field]: val };

      // Auto-calculate passPct if appeared or passed is updated
      if (field === "appeared" || field === "passed") {
        const app = field === "appeared" ? (val === "" ? "" : Number(val)) : (updatedHead.appeared === "" ? "" : Number(updatedHead.appeared || 0));
        const pas = field === "passed" ? (val === "" ? "" : Number(val)) : (updatedHead.passed === "" ? "" : Number(updatedHead.passed || 0));
        if (app !== "" && pas !== "" && Number(app) > 0) {
          updatedHead.passPct = Math.round((Number(pas) / Number(app)) * 100);
        } else {
          updatedHead.passPct = "";
        }
      }

      let updatedCourseStats = {
        ...courseStats,
        [headKey]: updatedHead
      };

      // Recalculate Final and FA-TH stats if ct1 or ct2 changes
      if (headKey === "ct1" || headKey === "ct2") {
        updatedCourseStats = deriveCalculatedStats(updatedCourseStats);
      }

      return {
        ...prev,
        [currentCode]: updatedCourseStats
      };
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  SAVE
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!academicYear || !semester || !departmentId || !divisionId) {
      alert("Missing required context. Please navigate back and select correctly.");
      return;
    }
    setSaving(true);
    try {
      // Build courseConfigs
      const courseConfigs = subjects.map(s => ({
        courseCode: s.courseCode,
        courseName: s.courseName,
        maxMarks: s.maxMarks,
      }));

      // Build courseStats
      const courseStats = subjects.map(s => {
        const code  = s.courseCode;
        let heads = activeHeads[code] || [];
        const ss    = summaryStats[code] || {};

        // Map finalFaTh stats to faTh in the database
        if (!heads.includes("faTh")) {
          heads = [...heads, "faTh"];
        }

        return {
          courseCode: code,
          stats: heads.map(key => {
            const statSource = key === "faTh" ? (ss["finalFaTh"] || {}) : (ss[key] || {});
            return {
              passingHead:  key,
              lowest:       statSource.lowest      ?? "",
              highest:      statSource.highest     ?? "",
              appeared:     statSource.appeared    ?? 0,
              passed:       statSource.passed      ?? 0,
              passPct:      statSource.passPct     ?? 0,
              above60Pct:   statSource.above60Pct  ?? 0,
            };
          }),
        };
      });

      // Build student marks for backend (minimal dummy array since studentMarks is not used)
      const studentMarks = studentRows.map(row => ({
        studentId:   row.studentId,
        rollNo:      row.rollNo,
        studentName: row.studentName,
        courses: Object.values(row.courseMap || {}),
      }));

      await axios.post("/msbte/k7/save", {
        academicYear, semester, departmentId, divisionId,
        courseConfigs, studentMarks, courseStats,
      });

      alert("Result analysis saved successfully!");
      navigate("/msbte/k7/report-selector");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving result analysis.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  const currentSubject = subjects[selectedSubjectIdx];
  const currentMaxMarks = currentSubject?.maxMarks || defaultMaxMarks();

  const entryColumns = [
    { field: "faTh",     label: "FA-TH", max: currentMaxMarks.faTh ?? 40 },
    { field: "saTh",     label: "SA-TH", max: currentMaxMarks.saTh ?? 70 },
    { field: "faPr",     label: "FA-PR", max: currentMaxMarks.faPr ?? 25 },
    { field: "saPr",     label: "SA-PR", max: currentMaxMarks.saPr ?? 25 },
    { field: "sla",      label: "SLA",   max: currentMaxMarks.sla  ?? 25 },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  //  LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="main-content d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted fw-semibold">Loading result analysis worksheet…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="main-content" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "28px 20px" }}>
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>

        {/* ── top bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}
            style={{ background: "#64748b", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "600" }}>
            <i className="bi bi-arrow-left" /> Back to Dashboard
          </button>
          
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !currentSubject}
            style={{ background: "#4f46e5", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "8px", fontWeight: "600", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-up-fill"></i> Save Result Analysis
              </>
            )}
          </button>
        </div>

        {!currentSubject ? (
          <div className="text-center py-5 card" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "45px 20px" }}>
            <i className="bi bi-journal-x" style={{ fontSize: "3.5rem", color: "#94a3b8" }}></i>
            <h5 className="mt-3" style={{ fontWeight: "600", color: "#334155" }}>Result Analysis Worksheet Empty</h5>
            <p className="text-muted" style={{ maxWidth: "500px", margin: "10px auto 0" }}>
              Please check your URL parameters. We could not find a subject/course configuration matching this selection.
            </p>
          </div>
        ) : (
          <>
            {/* ── gradient header card ── */}
            <div className="card mb-4" style={{ borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", color: "#fff", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <span className="badge mb-2" style={{ background: "#4f46e5", color: "#fff", fontWeight: "600", fontSize: "0.8rem", padding: "6px 12px", borderRadius: "20px" }}>
                      MSBTE K7 Format Part B
                    </span>
                    <h2 style={{ fontWeight: "700", fontSize: "1.8rem", margin: "0 0 8px 0" }}>
                      {currentSubject.courseName}
                    </h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: "0.95rem" }}>
                      Course Code: <strong style={{ color: "#fff" }}>{currentSubject.courseCode}</strong> &bull; Semester: <strong style={{ color: "#fff" }}>{semester}</strong> &bull; Division: <strong style={{ color: "#fff" }}>{divisionName}</strong>
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Academic Year</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>{academicYear}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── main summary stats entry table ── */}
            <div className="card mb-4" style={{ borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table mb-0" style={{ minWidth: "1000px" }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ width: "16%", fontWeight: "600", color: "#475569", paddingLeft: "20px" }}>Passing Head</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>Marks obtained Lowest</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>Marks Obtained Highest</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>No. of students Appeared</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>No. of student Passed</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>% Pass (Auto-calculated)</th>
                        <th style={{ width: "14%", fontWeight: "600", color: "#475569" }}>% of students above 60%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PASSING_HEADS.map((head) => {
                        const hStats = summaryStats[currentCode]?.[head.key] || {
                          lowest: "", highest: "", appeared: "", passed: "", passPct: "", above60Pct: ""
                        };
                        
                        return (
                          <React.Fragment key={head.key}>
                            {head.key === "ct1" && (
                              <tr style={{ background: "#e0e7ff" }}>
                                <td colSpan="7" style={{ fontWeight: "700", color: "#1e1b4b", padding: "12px 20px" }}>
                                  FA-TH (Formative Assessment - Theory)
                                </td>
                              </tr>
                            )}
                            <tr style={!head.isEditable ? { background: "#f8fafc" } : {}}>
                              <td style={{ 
                                fontWeight: "600", 
                                color: !head.isEditable ? "#475569" : "#0f172a", 
                                verticalAlign: "middle", 
                                paddingLeft: head.indent ? "35px" : "20px",
                                fontStyle: !head.isEditable ? "italic" : "normal"
                              }}>
                                {head.indent ? `├── ${head.label}` : head.label}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={!head.isEditable ? "Calculated" : "Lowest"}
                                  value={hStats.lowest ?? ""}
                                  onChange={(e) => handleSummaryStatChange(head.key, "lowest", e.target.value)}
                                  disabled={!head.isEditable}
                                  style={{ borderRadius: "6px", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={!head.isEditable ? "Calculated" : "Highest"}
                                  value={hStats.highest ?? ""}
                                  onChange={(e) => handleSummaryStatChange(head.key, "highest", e.target.value)}
                                  disabled={!head.isEditable}
                                  style={{ borderRadius: "6px", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder={!head.isEditable ? "Calculated" : "Appeared"}
                                  value={hStats.appeared ?? ""}
                                  onChange={(e) => handleSummaryStatChange(head.key, "appeared", e.target.value)}
                                  disabled={!head.isEditable}
                                  style={{ borderRadius: "6px", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder={!head.isEditable ? "Calculated" : "Passed"}
                                  value={hStats.passed ?? ""}
                                  onChange={(e) => handleSummaryStatChange(head.key, "passed", e.target.value)}
                                  disabled={!head.isEditable}
                                  style={{ borderRadius: "6px", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                />
                              </td>
                              <td>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder={!head.isEditable ? "Calculated" : "Pass %"}
                                    value={hStats.passPct ?? ""}
                                    onChange={(e) => handleSummaryStatChange(head.key, "passPct", e.target.value)}
                                    disabled={!head.isEditable}
                                    style={{ borderRadius: "6px", borderRight: "none", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                  />
                                  <span className="input-group-text" style={{ borderLeft: "none", background: "#f8fafc", color: "#64748b", fontWeight: "600" }}>%</span>
                                </div>
                              </td>
                              <td>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder={!head.isEditable ? "Calculated" : "> 60%"}
                                    value={hStats.above60Pct ?? ""}
                                    onChange={(e) => handleSummaryStatChange(head.key, "above60Pct", e.target.value)}
                                    disabled={!head.isEditable}
                                    style={{ borderRadius: "6px", borderRight: "none", background: !head.isEditable ? "#f1f5f9" : "#fff" }}
                                  />
                                  <span className="input-group-text" style={{ borderLeft: "none", background: "#f8fafc", color: "#64748b", fontWeight: "600" }}>%</span>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── bottom save action bar ── */}
            <div className="d-flex justify-content-end align-items-center mt-4 mb-5">
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}
                style={{ background: "#4f46e5", border: "none", color: "#fff", padding: "12px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "1rem", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" }}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving changes...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill"></i> Save Results
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default K7Generate;
