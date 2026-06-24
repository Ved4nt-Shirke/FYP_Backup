import React, { useEffect, useMemo, useState } from "react";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../../utils/institutionBranding";
import { config } from "../../config/api";
import "./PrintCiann.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const times = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:15 - 11:15",
  "11:15 - 12:15",
  "12:45 - 01:45",
  "01:45 - 02:45",
  "03:00 - 04:00",
  "04:00 - 05:00",
  "05:15 - 06:15",
  "06:15 - 07:15",
];

const DEFAULT_POS = [
  {
    code: "PO 1",
    name: "Basic and Discipline specific knowledge",
    description: "Apply knowledge of basic mathematics, science and engineering fundamentals and engineering specialization to solve the engineering problems."
  },
  {
    code: "PO 2",
    name: "Problem analysis",
    description: "Identify and analyse well-defined engineering problems using codified standard methods."
  },
  {
    code: "PO 3",
    name: "Design/ development of solutions",
    description: "Design solutions for well-defined technical problems and assist with the design of systems components or processes to meet specified needs."
  },
  {
    code: "PO 4",
    name: "Engineering Tools, Experimentation and Testing",
    description: "Apply modern engineering tools and appropriate technique to conduct standard tests and measurements."
  },
  {
    code: "PO 5",
    name: "Engineering practices for society, sustainability and environment",
    description: "Apply appropriate technology in context of society, sustainability, environment and ethical practices."
  },
  {
    code: "PO 6",
    name: "Project Management",
    description: "Use engineering management principles individually, as a team member or a leader to manage projects and effectively communicate about well-defined engineering activities."
  },
  {
    code: "PO 7",
    name: "Life-long learning",
    description: "Ability to analyse individual needs and engage in updating in the context of technological changes."
  }
];

const DEFAULT_PSOS = [
  {
    code: "PSO 1",
    name: "Computer Software and Hardware Usage",
    description: "Use state-of-the-art technologies for operation and application of computer software and hardware."
  },
  {
    code: "PSO 2",
    name: "Computer Engineering Maintenance",
    description: "Maintain computer engineering related software and hardware systems."
  }
];

const getAcademicContext = (data) => {
  const program =
    data?.department?.label || data?.department?.name || data?.department || "";
  const className = data?.class || data?.className || "";
  const course = data?.subject?.name || data?.subjectName || "";
  return {
    program: String(program || "").trim(),
    className: String(className || "").trim(),
    course: String(course || "").trim(),
  };
};

const getInstitutionBranding = () => {
  const code = (
    localStorage.getItem("institutionCode") ||
    localStorage.getItem("college") ||
    "VP"
  ).toUpperCase();
  const name = localStorage.getItem("institutionName") || code;
  const logoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const fallback = getInstitutionInitials(name, code);
  return { code, name, logoUrl, fallback };
};

const extractValue = (data, ...possibleKeys) => {
  if (!data) return null;
  for (const key of possibleKeys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && value.name) return value.name;
      if (typeof value === "object" && value.code) return value.code;
      if (typeof value === "string") return value;
    }
  }
  return null;
};

const getClassAndDiv = (ciannData) => {
  if (!ciannData) return "N/A";
  const deptCode = ciannData.department?.code || "";
  const sem = ciannData.semester || "";
  const scheme = ciannData.scheme || "";
  const div = ciannData.division || "";
  if (deptCode || sem || scheme || div) {
    return `${deptCode}${sem}${scheme}${div}`.toUpperCase();
  }
  return "N/A";
};

const getSubjectAndCode = (ciannData) => {
  if (!ciannData) return "N/A";
  const name = ciannData.subject?.name || extractValue(ciannData, "subjectName", "subject");
  const code = ciannData.subject?.code || extractValue(ciannData, "subjectCode", "code");
  if (name && code) return `${name} (${code})`;
  return name || "N/A";
};

const getDepartment = (ciannData) => {
  return (
    ciannData?.department?.label ||
    ciannData?.department?.name ||
    ciannData?.department ||
    ciannData?.branch ||
    "N/A"
  );
};

const PrintCiann = () => {
  const [ciannData, setCiannData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [institutionBranding] = useState(getInstitutionBranding);

  const formatUsername = (rawUsername) => {
    if (!rawUsername) return "";
    const localUser = localStorage.getItem("username");
    const facultyName = localStorage.getItem("facultyName");
    if (localUser && rawUsername && localUser.trim().toLowerCase() === rawUsername.trim().toLowerCase() && facultyName) {
      return facultyName;
    }
    if (rawUsername.includes(".")) {
      return rawUsername
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
    return rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
  };

  const getTeacherNames = () => {
    if (!ciannData) return formatUsername(localStorage.getItem("username") || "-");

    const primaryOwner = formatUsername(ciannData.ownerUsername || ciannData.owner?.username || ciannData.owner || "N/A");
    const coFaculty = [];
    const contributors = [];

    if (Array.isArray(ciannData.sharedWith)) {
      ciannData.sharedWith.forEach((share) => {
        const name = share.user?.username || share.username || (typeof share.user === 'string' ? share.user : null);
        if (name) {
          const formatted = formatUsername(name);
          if (share.permission === "edit") {
            coFaculty.push(formatted);
          } else {
            contributors.push(formatted);
          }
        }
      });
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div>
          <strong>{primaryOwner}</strong> <span style={{ fontSize: "0.85em", color: "#16a34a", marginLeft: "4px" }}>(Primary Owner)</span>
        </div>
        {coFaculty.map((name, i) => (
          <div key={`co-${i}`} style={{ fontSize: "0.95em" }}>
            {name} <span style={{ fontSize: "0.8em", color: "#2563eb", marginLeft: "4px" }}>(Co-Faculty)</span>
          </div>
        ))}
        {contributors.map((name, i) => (
          <div key={`cont-${i}`} style={{ fontSize: "0.95em" }}>
            {name} <span style={{ fontSize: "0.8em", color: "#475569", marginLeft: "4px" }}>(Contributor)</span>
          </div>
        ))}
      </div>
    );
  };

  const [teachingPlans, setTeachingPlans] = useState([]);
  const [labPlans, setLabPlans] = useState([]);
  const [slots, setSlots] = useState({});
  const [chapters, setChapters] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [knowledgeMap, setKnowledgeMap] = useState([]);
  const [bookResources, setBookResources] = useState([]);
  const [webResources, setWebResources] = useState([]);
  const [moocCourses, setMoocCourses] = useState([]);
  const [syllabusImages, setSyllabusImages] = useState([]);
  const [instVisionMission, setInstVisionMission] = useState(null);
  const [deptVisionMission, setDeptVisionMission] = useState(null);

  // MSBTE Formats states
  const [students, setStudents] = useState([]);
  const [k3Assessments, setK3Assessments] = useState([]);
  const [k3Experiments, setK3Experiments] = useState([]);
  const [k4Marks, setK4Marks] = useState({});
  const [k4MaxMarks, setK4MaxMarks] = useState("");
  const [k5CtMarksMap, setK5CtMarksMap] = useState({});
  const [theoryAttendance, setTheoryAttendance] = useState([]);
  const [practicalAttendance, setPracticalAttendance] = useState([]);
  const [tutorialAttendance, setTutorialAttendance] = useState([]);
  const [extraTheoryAttendance, setExtraTheoryAttendance] = useState([]);

  useEffect(() => {
    const storedCiannData = localStorage.getItem("ciannData");
    if (!storedCiannData) {
      setLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(storedCiannData);
      if (!parsedData?.ciannId) {
        setLoading(false);
        return;
      }

      setCiannData(parsedData);
      fetchPrintData(parsedData);
    } catch (error) {
      console.error("Failed to parse ciannData for printing:", error);
      setLoading(false);
    }
  }, []);

  const fetchPrintData = async (data) => {
    const token = localStorage.getItem("token");
    const requestHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const ciannId = data?.ciannId;
    const deptId = data?.department?._id || data?.department;
    const { program, className, course } = getAcademicContext(data);

    try {
      const responses = await Promise.allSettled([
        fetch(`${config.teachingPlan}/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.labPlanning}/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(config.slots, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.course.chapters}/get-chapters`, {
          method: "POST",
          headers: requestHeaders,
          credentials: "include",
          body: JSON.stringify({ program, className, course }),
        }),
        fetch(`${config.apiBaseUrl}/get-experiments/get-experiments`, {
          method: "POST",
          headers: requestHeaders,
          credentials: "include",
          body: JSON.stringify({ program, className, course }),
        }),
        fetch(`${config.subjectDetails}/course-outcomes/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/objectives/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/knowledge-map/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/book-resources/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/web-resources/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/mooc-courses/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${config.subjectDetails}/syllabus/${ciannId}`, {
          headers: requestHeaders,
          credentials: "include",
        }),
      ]);

      const toJson = async (result, fallback) => {
        if (result.status !== "fulfilled") return fallback;
        if (!result.value.ok) return fallback;
        try {
          return await result.value.json();
        } catch {
          return fallback;
        }
      };

      const [
        teaching,
        lab,
        timetableSlots,
        chapterPayload,
        experimentPayload,
        outcomes,
        objectiveData,
        kmData,
        books,
        web,
        moocs,
        syllabusRes,
      ] = await Promise.all([
        toJson(responses[0], []),
        toJson(responses[1], []),
        toJson(responses[2], []),
        toJson(responses[3], { chp: [] }),
        toJson(responses[4], { experiments: [] }),
        toJson(responses[5], []),
        toJson(responses[6], []),
        toJson(responses[7], []),
        toJson(responses[8], []),
        toJson(responses[9], []),
        toJson(responses[10], []),
        toJson(responses[11], { images: [] }),
      ]);

      const slotMap = {};
      (Array.isArray(timetableSlots) ? timetableSlots : []).forEach((slot) => {
        slotMap[`${slot.time}-${slot.weekday}`] = slot.label;
      });

      setTeachingPlans(Array.isArray(teaching) ? teaching : []);
      setLabPlans(Array.isArray(lab) ? lab : []);
      setSlots(slotMap);
      setChapters(Array.isArray(chapterPayload?.chp) ? chapterPayload.chp : []);
      setExperiments(
        Array.isArray(experimentPayload?.experiments)
          ? experimentPayload.experiments
          : [],
      );
      setCourseOutcomes(Array.isArray(outcomes) ? outcomes : []);
      setObjectives(Array.isArray(objectiveData) ? objectiveData : []);
      setKnowledgeMap(Array.isArray(kmData) ? kmData : []);
      setBookResources(Array.isArray(books) ? books : []);
      setWebResources(Array.isArray(web) ? web : []);
      setMoocCourses(Array.isArray(moocs) ? moocs : []);

      if (Array.isArray(syllabusRes?.images) && syllabusRes.images.length > 0) {
        setSyllabusImages(syllabusRes.images.filter(Boolean));
      } else {
        const syllabusKey = `syllabusImages:${ciannId}`;
        const storedSyllabus = localStorage.getItem(syllabusKey);
        if (storedSyllabus) {
          try {
            const parsed = JSON.parse(storedSyllabus);
            if (Array.isArray(parsed)) {
              setSyllabusImages(parsed.filter(Boolean));
            }
          } catch {
            setSyllabusImages([]);
          }
        }
      }

      // Fetch Vision & Mission separately to ensure it doesn't fail silently
      try {
        const instVMUrl = `${config.catalog.visionMission}`;
        const instVMResponse = await fetch(instVMUrl, {
          headers: requestHeaders,
          credentials: "include",
        });
        if (instVMResponse.ok) {
          const instVMData = await instVMResponse.json();
          if (instVMData?.success && instVMData?.data) {
            setInstVisionMission(instVMData.data);
          }
        } else {
          console.warn("[PrintCiann] Institute Vision/Mission fetch failed:", instVMResponse.status);
        }
      } catch (err) {
        console.error("[PrintCiann] Error fetching institute vision/mission:", err);
      }

      try {
        const deptVMUrl = `${config.catalog.visionMission}?departmentId=${deptId}`;
        const deptVMResponse = await fetch(deptVMUrl, {
          headers: requestHeaders,
          credentials: "include",
        });
        if (deptVMResponse.ok) {
          const deptVMData = await deptVMResponse.json();
          if (deptVMData?.success && deptVMData?.data) {
            setDeptVisionMission(deptVMData.data);
          }
        } else {
          console.warn("[PrintCiann] Department Vision/Mission fetch failed:", deptVMResponse.status);
        }
      } catch (err) {
        console.error("[PrintCiann] Error fetching department vision/mission:", err);
      }

      // ─── MSBTE Formats Loading Logic ───
      let resolvedDivName = data?.division || "";
      const resolvedDeptId = data?.department?._id || data?.department;

      // Fetch division students
      let studentList = [];
      try {
        const query = new URLSearchParams();
        if (resolvedDivName) query.set("division", resolvedDivName);
        if (resolvedDeptId) query.set("departmentId", resolvedDeptId);
        if (data?.academicYear) query.set("academicYear", data.academicYear);
        if (data?.semester) query.set("semester", data.semester);

        const studentsRes = await fetch(
          `${config.students}?${query.toString()}`,
          { headers: requestHeaders }
        );
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          studentList = Array.isArray(studentsData) ? studentsData : [];
          setStudents(studentList);
        }
      } catch (err) {
        console.error("Failed to fetch students for formats:", err);
      }

      // Fetch K3 Assessments & Experiments
      if (studentList.length > 0) {
        try {
          const studentNames = studentList.map((s) => s.studentName);
          const assessmentsRes = await fetch(`${config.assessments}/by-students`, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({ studentNames }),
          });
          if (assessmentsRes.ok) {
            const assessmentsData = await assessmentsRes.json();
            setK3Assessments(Array.isArray(assessmentsData?.data) ? assessmentsData.data : []);
          }
        } catch (err) {
          console.error("Failed to fetch K3 assessments:", err);
        }
      }

      try {
        const experimentsQuery = new URLSearchParams();
        const prg = data?.department?.name || data?.department?.label || "";
        const clsName = data?.class || data?.division || "";
        const cName = data?.subject?.name || "";

        if (prg) experimentsQuery.set("program", prg);
        if (clsName) experimentsQuery.set("className", clsName);
        if (cName) experimentsQuery.set("course", cName);

        const experimentsRes = await fetch(
          `${config.assessments}/get-experiments?${experimentsQuery.toString()}`,
          { headers: requestHeaders }
        );
        if (experimentsRes.ok) {
          const experimentsData = await experimentsRes.json();
          setK3Experiments(Array.isArray(experimentsData?.experiments) ? experimentsData.experiments : []);
        }
      } catch (err) {
        console.error("Failed to fetch K3 experiments:", err);
      }

      // Fetch SA-PR K4 Marks
      if (ciannId && resolvedDivName) {
        try {
          const k4Res = await fetch(
            `${config.msbte}/sa-pr-k4?ciannId=${encodeURIComponent(ciannId)}&division=${encodeURIComponent(resolvedDivName)}`,
            { headers: requestHeaders }
          );
          if (k4Res.ok) {
            const k4Data = await k4Res.json();
            const record = k4Data?.data;
            if (record) {
              if (record.maxMarks !== undefined && record.maxMarks !== null) {
                setK4MaxMarks(String(record.maxMarks));
              }
              const mapByKey = {};
              record.students.forEach((item) => {
                const key = `${item.rollNo || ""}::${item.studentName || ""}`;
                mapByKey[key] = item.marks;
              });

              const marksMap = {};
              studentList.forEach((student) => {
                const key = `${student.rollNo || student.rollId || ""}::${student.studentName || student.name || ""}`;
                if (mapByKey[key] !== undefined && mapByKey[key] !== null) {
                  marksMap[student._id] = mapByKey[key];
                }
              });
              setK4Marks(marksMap);
            }
          }
        } catch (err) {
          console.error("Failed to fetch K4 marks:", err);
        }
      }

      // Fetch K5 class test marks
      if (ciannId) {
        try {
          const k5Res = await fetch(`${config.apiBaseUrl}/ct-marks/${ciannId}`, {
            headers: requestHeaders,
          });
          if (k5Res.ok) {
            const k5Data = await k5Res.json();
            const allMarks = Array.isArray(k5Data?.data) ? k5Data.data : [];
            const byStudent = {};

            const toMarksOutOf30 = (marks, totalMarks) => {
              const value = Number(marks);
              const total = Number(totalMarks || 20);
              if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
                return null;
              }
              return Number(((value / total) * 30).toFixed(2));
            };

            const buildStudentKey = (studentName, rollNo) => {
              return `${String(rollNo || "").trim()}::${String(studentName || "").trim().toLowerCase()}`;
            };

            allMarks.forEach((entry) => {
              const key = buildStudentKey(entry.studentName, entry.rollNo);
              if (!byStudent[key]) {
                byStudent[key] = {};
              }
              if (entry.ctNumber === 1) {
                byStudent[key].ct1 = toMarksOutOf30(entry.marks, entry.totalMarks);
              }
              if (entry.ctNumber === 2) {
                byStudent[key].ct2 = toMarksOutOf30(entry.marks, entry.totalMarks);
              }
            });
            setK5CtMarksMap(byStudent);
          }
        } catch (err) {
          console.error("Failed to fetch K5 class test marks:", err);
        }
      }

      // Fetch Theory, Practical, Tutorial, and Extra Theory Attendance
      let theoryList = [];
      let practicalList = [];
      let tutorialList = [];
      let extraList = [];
      try {
        const theoryRes = await fetch(
          `${config.apiBaseUrl}/theory-attendance?ciannId=${encodeURIComponent(ciannId)}`,
          { headers: requestHeaders }
        );
        if (theoryRes.ok) {
          const tData = await theoryRes.json();
          theoryList = Array.isArray(tData) ? tData : [];
        }
      } catch (err) {
        console.error("Failed to fetch theory attendance:", err);
      }

      try {
        const practicalRes = await fetch(
          `${config.apiBaseUrl}/practical-attendance?ciannId=${encodeURIComponent(ciannId)}`,
          { headers: requestHeaders }
        );
        if (practicalRes.ok) {
          const pData = await practicalRes.json();
          practicalList = Array.isArray(pData) ? pData : [];
        }
      } catch (err) {
        console.error("Failed to fetch practical attendance:", err);
      }

      try {
        const tutorialRes = await fetch(
          `${config.attendance.tutorial}?ciannId=${encodeURIComponent(ciannId)}`,
          { headers: requestHeaders }
        );
        if (tutorialRes.ok) {
          const tutData = await tutorialRes.json();
          tutorialList = Array.isArray(tutData) ? tutData : [];
        }
      } catch (err) {
        console.error("Failed to fetch tutorial attendance:", err);
      }

      try {
        const extraRes = await fetch(
          `${config.attendance.extraTheory}/ciann/${encodeURIComponent(ciannId)}`,
          { headers: requestHeaders }
        );
        if (extraRes.ok) {
          const extData = await extraRes.json();
          extraList = Array.isArray(extData) ? extData : [];
        }
      } catch (err) {
        console.error("Failed to fetch extra theory attendance:", err);
      }

      setTheoryAttendance(theoryList);
      setPracticalAttendance(practicalList);
      setTutorialAttendance(tutorialList);
      setExtraTheoryAttendance(extraList);
    } catch (error) {
      console.error("Error fetching print CIANN data:", error);
    } finally {
      setLoading(false);
    }
  };

  const subjectDetailSections = useMemo(
    () => [
      {
        title: "Course Outcomes",
        data: courseOutcomes,
        mapText: (item) => item?.description || item?.text || "",
      },
      {
        title: "Objectives",
        data: objectives,
        mapText: (item) => item?.description || item?.text || "",
      },
      {
        title: "Knowledge Map",
        data: knowledgeMap,
        mapText: (item) => item?.topic || item?.description || "",
      },
      {
        title: "Book Resources",
        data: bookResources,
        mapText: (item) => item?.title || item?.bookName || "",
      },
      {
        title: "Web Resources",
        data: webResources,
        mapText: (item) => item?.title || item?.url || "",
      },
      {
        title: "MOOC Courses",
        data: moocCourses,
        mapText: (item) => item?.courseName || item?.title || "",
      },
    ],
    [
      courseOutcomes,
      objectives,
      knowledgeMap,
      bookResources,
      webResources,
      moocCourses,
    ],
  );

  const getTeachingPlansForWeek = (weekNo) => {
    const found = teachingPlans.find((item) => Number(item.weekNo) === weekNo);
    const plans = found?.plans || [];
    const padded = [...plans];
    while (padded.length < 5) {
      padded.push({});
    }
    return padded.slice(0, 5);
  };

  const getLabPlansForWeek = (weekNo) => {
    const found = labPlans.find((item) => Number(item.weekNo) === weekNo);
    const plans = Array.isArray(found?.plans) ? found.plans : [];
    if (plans.length > 0) return plans;
    return [
      { batch: "B1" },
      { batch: "B2" },
      { batch: "B3" },
    ];
  };

  const renderTimeTableCell = (time, day, tIdx) => {
    const key = `${time}-${day}`;
    const value = slots[key];
    const isPractical =
      typeof value === "string" && value.startsWith("Practical");

    if (tIdx > 0) {
      const prevKey = `${times[tIdx - 1]}-${day}`;
      if (isPractical && slots[prevKey] === value) {
        return null;
      }
    }

    if (isPractical && tIdx < times.length - 1) {
      const nextKey = `${times[tIdx + 1]}-${day}`;
      if (slots[nextKey] === value) {
        return (
          <td key={key} rowSpan={2} className="tt-cell">
            {value}
          </td>
        );
      }
    }

    return (
      <td key={key} className="tt-cell">
        {value || ""}
      </td>
    );
  };



  const normalizeMark = (mark, maxMarks) => {
    const numeric = Number(mark);
    if (!Number.isFinite(numeric)) return null;
    if (maxMarks === 25) return numeric;
    if (numeric <= maxMarks) return numeric;
    return Math.round((numeric / 25) * maxMarks);
  };

  const k3ExperimentColumns = useMemo(() => {
    const fromExperiments = k3Experiments
      .map((exp) => {
        const number = Number(exp.practicalNo || exp.experimentNo || exp.number);
        if (!Number.isFinite(number)) return null;
        return { number };
      })
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);

    if (fromExperiments.length > 0) return fromExperiments;

    const numbers = new Set();
    k3Assessments.forEach((student) => {
      if (student.assessments && typeof student.assessments === "object") {
        Object.keys(student.assessments).forEach((key) => {
          const number = Number(key);
          if (Number.isFinite(number)) numbers.add(number);
        });
      }
    });

    return Array.from(numbers)
      .sort((a, b) => a - b)
      .map((number) => ({ number }));
  }, [k3Assessments, k3Experiments]);

  const k3Rows = useMemo(() => {
    const map = new Map(k3Assessments.map((item) => [item.studentName, item]));
    return students.map((student) => ({
      ...student,
      assessments: map.get(student.studentName)?.assessments || {},
    }));
  }, [k3Assessments, students]);

  const attendanceSessionsLog = useMemo(() => {
    const list = [];

    theoryAttendance.forEach((record) => {
      const presentCount = (record.students || []).filter(s => s.status === 'Present').length;
      const totalStudents = (record.students || []).length;
      list.push({
        id: record._id || `theory-${record.date}-${record.topic}`,
        date: record.date || record.startDate || "",
        type: "Theory",
        details: record.topic ? `${record.chapter ? record.chapter + ' - ' : ''}${record.topic}` : "Theory Lecture",
        presentCount,
        totalStudents,
        pct: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0",
        rawDate: new Date(record.date || record.startDate || 0)
      });
    });

    practicalAttendance.forEach((record) => {
      const presentCount = (record.students || []).filter(s => s.status === 'Present').length;
      const totalStudents = (record.students || []).length;
      list.push({
        id: record._id || `practical-${record.actualDate}-${record.exptNo}`,
        date: record.actualDate || "",
        type: `Practical (Batch ${record.batch || 'All'})`,
        details: `Expt No. ${record.exptNo}: ${record.exptName}`,
        presentCount,
        totalStudents,
        pct: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0",
        rawDate: new Date(record.actualDate || 0)
      });
    });

    return list.sort((a, b) => a.rawDate - b.rawDate);
  }, [theoryAttendance, practicalAttendance]);

  const studentAttendanceStats = useMemo(() => {
    return students.map((student) => {
      const sName = (student.studentName || student.name || "").trim().toLowerCase();
      const sRoll = (student.rollNo || student.rollId || student.regNumber || "").trim().toLowerCase();

      let theoryConducted = 0;
      let theoryAttended = 0;
      let practicalConducted = 0;
      let practicalAttended = 0;

      theoryAttendance.forEach((record) => {
        const studentInRecord = (record.students || []).find((s) => {
          const nameMatch = s.studentName && s.studentName.trim().toLowerCase() === sName;
          const rollMatch = s.rollNo && s.rollNo.trim().toLowerCase() === sRoll;
          return nameMatch || rollMatch;
        });

        theoryConducted++;
        if (studentInRecord && studentInRecord.status === "Present") {
          theoryAttended++;
        }
      });

      practicalAttendance.forEach((record) => {
        const studentInRecord = (record.students || []).find((s) => {
          const nameMatch = s.studentName && s.studentName.trim().toLowerCase() === sName;
          const rollMatch = s.rollNo && s.rollNo.trim().toLowerCase() === sRoll;
          return nameMatch || rollMatch;
        });

        if (studentInRecord) {
          practicalConducted++;
          if (studentInRecord.status === "Present") {
            practicalAttended++;
          }
        }
      });

      const totalConducted = theoryConducted + practicalConducted;
      const totalAttended = theoryAttended + practicalAttended;
      const overallPct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(2) : "0.00";

      return {
        rollNo: student.rollNo || student.rollId || student.regNumber || "-",
        enrollmentNo: student.enrollmentNo || "-",
        studentName: student.studentName || student.name || "-",
        theoryAttended,
        theoryConducted,
        practicalAttended,
        practicalConducted,
        overallPct
      };
    });
  }, [students, theoryAttendance, practicalAttendance]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const rollA = a.rollNo || a.rollId || "";
      const rollB = b.rollNo || b.rollId || "";
      const numA = parseInt(rollA.replace(/\D/g, ""), 10);
      const numB = parseInt(rollB.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [students]);

  const getRecordDateStr = (record, type) => {
    let d = "";
    if (type === "theory") d = record.date || record.startDate || "";
    else if (type === "practical") d = record.actualDate || record.date || "";
    else if (type === "tutorial") d = record.actualDate || record.date || "";
    else if (type === "extra") d = record.date || record.actualDate || "";
    return typeof d === "string" ? d.split("T")[0] : "";
  };

  const getDayNumber = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.getDate();
  };

  const getMonthName = (dateStr) => {
    if (!dateStr) return "Month";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Month";
    return d.toLocaleString("default", { month: "short" });
  };

  const getMonthHeaders = (sessions, type) => {
    const groups = [];
    let currentMonth = null;
    let currentCount = 0;

    sessions.forEach((session) => {
      const dateStr = getRecordDateStr(session, type);
      const month = getMonthName(dateStr);
      if (month === currentMonth) {
        currentCount++;
      } else {
        if (currentMonth !== null) {
          groups.push({ month: currentMonth, span: currentCount });
        }
        currentMonth = month;
        currentCount = 1;
      }
    });

    if (currentMonth !== null) {
      groups.push({ month: currentMonth, span: currentCount });
    }

    return groups;
  };

  const getStudentAttendanceMark = (student, session, type) => {
    const sName = (student.studentName || student.name || "").trim().toLowerCase();
    const sRoll = (student.rollNo || student.rollId || "").trim().toLowerCase();

    const studentsList = session.students || [];

    if (type === "theory" || type === "practical") {
      const match = studentsList.find((s) => {
        const nameMatch = s.studentName && s.studentName.trim().toLowerCase() === sName;
        const rollMatch = s.rollNo && s.rollNo.trim().toLowerCase() === sRoll;
        return nameMatch || rollMatch;
      });
      if (match) {
        return match.status === "Present" ? "P" : match.status === "Absent" ? "A" : "";
      }
    } else {
      const match = studentsList.find((s) => {
        const nameMatch = s.name && s.name.trim().toLowerCase() === sName;
        const rollMatch = s.rollId && s.rollId.trim().toLowerCase() === sRoll;
        return nameMatch || rollMatch;
      });
      if (match) {
        return match.attendance === "Present" ? "P" : match.attendance === "Absent" ? "A" : "";
      }
    }
    return "";
  };

  const practicalBatches = useMemo(() => {
    const batches = new Set();
    practicalAttendance.forEach((record) => {
      if (record.batch) {
        batches.add(record.batch.trim().toUpperCase());
      }
    });
    if (batches.size === 0) return ["B1", "B2", "B3"];
    return Array.from(batches).sort();
  }, [practicalAttendance]);

  const tutorialGroups = useMemo(() => {
    const groups = new Set();
    tutorialAttendance.forEach((record) => {
      if (record.division) {
        groups.add(record.division.trim());
      }
    });
    if (groups.size === 0) return [null];
    return Array.from(groups).sort();
  }, [tutorialAttendance]);

  const renderAttendanceLedgerPage = (type, title, sessions, pageIndex, batchName = null) => {
    const startSr = pageIndex * 30 + 1;
    const endSr = (pageIndex + 1) * 30;
    
    // Sort sessions chronologically
    const sortedSessions = [...sessions].sort((a, b) => {
      const da = getRecordDateStr(a, type);
      const db = getRecordDateStr(b, type);
      return new Date(da) - new Date(db);
    });

    const monthGroups = getMonthHeaders(sortedSessions, type);
    
    // Day numbers header row
    const dayCells = sortedSessions.map(s => getDayNumber(getRecordDateStr(s, type)));
    while (dayCells.length < 32) {
      dayCells.push("");
    }
    
    // Row data
    const rows = [];
    for (let sr = startSr; sr <= endSr; sr++) {
      const student = sortedStudents[sr - 1] || null;
      rows.push({ sr, student });
    }

    return (
      <div className="attendance-sheet-landscape page-break-before" key={`${type}-${batchName || ""}-page-${pageIndex}`}>
        <div className="ledger-header-info">
          <div className="ledger-left">
            Class & Div. : <span className="ledger-value">{getClassAndDiv(ciannData)}</span>
          </div>
          <div className="ledger-center">
            {title}{batchName ? ` - ${batchName}` : ""}
          </div>
          <div className="ledger-right">
            Page {pageIndex + 1}
          </div>
        </div>

        <table className="ledger-table">
          <thead>
            {/* Month Row */}
            <tr>
              <th rowSpan={3} className="ledger-sr-col">Sr. No.</th>
              <th rowSpan={3} className="ledger-roll-col">Roll ID</th>
              {monthGroups.map((g, idx) => (
                <th key={`m-${idx}`} colSpan={g.span} className="ledger-month-header">
                  {g.month}
                </th>
              ))}
              {sortedSessions.length < 32 && (
                <th colSpan={32 - sortedSessions.length} className="ledger-month-header empty-header">Month</th>
              )}
              <th rowSpan={3} className="ledger-sig-col">Signature of Student</th>
              <th rowSpan={3} className="ledger-sr-col">Sr. No.</th>
            </tr>
            {/* Date Row */}
            <tr>
              {dayCells.map((day, idx) => (
                <th key={`day-${idx}`} className="ledger-date-header">
                  {day}
                </th>
              ))}
            </tr>
            {/* Column Index Row */}
            <tr>
              {[...Array(32)].map((_, idx) => (
                <th key={`index-${idx}`} className="ledger-index-header">
                  {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sr, student }) => {
              return (
                <tr key={`row-${sr}`}>
                  <td className="ledger-sr-cell">{sr}</td>
                  <td className="ledger-roll-cell">
                    {student ? (student.rollNo || student.rollId || student.regNumber || "-") : ""}
                  </td>
                  {[...Array(32)].map((_, colIdx) => {
                    const session = sortedSessions[colIdx];
                    let mark = "";
                    if (student && session) {
                      mark = getStudentAttendanceMark(student, session, type);
                    }
                    return (
                      <td key={`mark-${sr}-${colIdx}`} className="ledger-mark-cell">
                        {mark}
                      </td>
                    );
                  })}
                  <td className="ledger-sig-cell"></td>
                  <td className="ledger-sr-cell">{sr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const printNow = () => window.print();

  if (!ciannData && !loading) {
    return (
      <div className="ciann-print-empty">
        <h3>No CIANN selected</h3>
        <p>Select a CIANN from Print CIANN cards first.</p>
      </div>
    );
  }

  return (
    <div className="ciann-print-page">
      <div className="ciann-print-toolbar no-print">
        <button
          className="btn btn-outline-secondary"
          onClick={() => window.history.back()}
        >
          ← Go Back
        </button>
        <button className="btn btn-success" onClick={printNow}>
          🖨️ Print CIANN
        </button>
      </div>

      <div className="ciann-print-sheet">
        <section className="print-block front-page-block">
          <h2 className="section-title">1. Front Page</h2>
          <div className="course-diary-card">
            <div className="course-diary-header-row">
              <div className="course-diary-logo-cell">
                {institutionBranding.logoUrl ? (
                  <img
                    src={institutionBranding.logoUrl}
                    alt={`${institutionBranding.name} Logo`}
                    className="course-diary-logo"
                  />
                ) : (
                  <div className="course-diary-logo-fallback">
                    {institutionBranding.fallback}
                  </div>
                )}
              </div>
              <div className="course-diary-title">COURSE DIARY</div>
            </div>

            <div className="course-diary-body-center">
              <p className="institution-name">{institutionBranding.name}</p>
              <h3 className="ciann-name">CIAAN</h3>
              <p>Curriculum Implementation and Assessment Norms</p>
              <p>
                <strong>Academic Year:</strong> {ciannData?.academicYear || "-"}
              </p>
              <p>
                <strong>INST. CODE:</strong> 0568
              </p>
            </div>

            <div className="diary-info-table">
              <div className="diary-row">
                <span className="label">Name of Subject Teacher</span>
                <span className="value">{getTeacherNames()}</span>
              </div>
              <div className="diary-row">
                <span className="label">Class & Div.</span>
                <span className="value">{getClassAndDiv(ciannData)}</span>
              </div>
              <div className="diary-row">
                <span className="label">Subject & Subject Code</span>
                <span className="value">{getSubjectAndCode(ciannData)}</span>
              </div>
              <div className="diary-row">
                <span className="label">Department</span>
                <span className="value">{getDepartment(ciannData)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="print-block page-break-before vision-mission-print-block">
          <h2 className="section-title">2. Institute Vision &amp; Mission</h2>
          <div className="vision-mission-print-container">
            <div className="branding-header">
              <div className="branding-logo-title">
                {institutionBranding.logoUrl ? (
                  <img src={institutionBranding.logoUrl} alt="Logo" className="branding-logo" />
                ) : (
                  <div className="branding-logo-fallback">{institutionBranding.fallback}</div>
                )}
                <div className="branding-title-text">
                  <h3>{institutionBranding.name}</h3>
                  <h4>COURSE DIARY</h4>
                </div>
              </div>
            </div>

            <div className="vm-print-section-header">
              <h3>Institute Vision</h3>
            </div>
            <div className="vm-print-content">
              <p>{instVisionMission?.vision || "To achieve excellence in imparting technical education so as to meet the professional and societal needs."}</p>
            </div>

            <div className="vm-print-section-header">
              <h3>Institute Mission</h3>
            </div>
            <div className="vm-print-content">
              {instVisionMission?.mission && instVisionMission.mission.length > 0 ? (
                <ul className="vm-print-list">
                  {instVisionMission.mission.map((m, idx) => (
                    <li key={`inst-m-${idx}`}>➢ {m}</li>
                  ))}
                </ul>
              ) : (
                <ul className="vm-print-list">
                  <li>➢ Developing technical skills by imparting knowledge and providing hands on experience.</li>
                  <li>➢ Creating an environment that nurtures ethics, leadership and team building.</li>
                  <li>➢ Providing industrial exposure for minimizing the gap between academics &amp; industry.</li>
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="print-block page-break-before vision-mission-print-block">
          <h2 className="section-title">3. Department Vision, Mission &amp; PEO</h2>
          <div className="vision-mission-print-container">
            <div className="branding-header">
              <div className="branding-logo-title">
                {institutionBranding.logoUrl ? (
                  <img src={institutionBranding.logoUrl} alt="Logo" className="branding-logo" />
                ) : (
                  <div className="branding-logo-fallback">{institutionBranding.fallback}</div>
                )}
                <div className="branding-title-text">
                  <h3>{institutionBranding.name}</h3>
                  <h4>COURSE DIARY</h4>
                </div>
              </div>
            </div>

            <div className="vm-print-section-header">
              <h3>Department Vision, Mission, PEO</h3>
            </div>

            <div className="vm-print-sub-section">
              <h4>Vision</h4>
              <p>{deptVisionMission?.vision || "To empower students with domain knowledge of Computer Engineering and interpersonal skills to cater to the industrial and societal needs."}</p>
            </div>

            <div className="vm-print-sub-section">
              <h4>Mission</h4>
              {deptVisionMission?.mission && deptVisionMission.mission.length > 0 ? (
                <ul className="vm-print-list">
                  {deptVisionMission.mission.map((m, idx) => (
                    <li key={`dept-m-${idx}`}>➢ {m}</li>
                  ))}
                </ul>
              ) : (
                <ul className="vm-print-list">
                  <li>➢ Developing technical skills by explaining the rationale behind learning.</li>
                  <li>➢ Developing interpersonal skills to serve the society in the best possible manner.</li>
                  <li>➢ Creating awareness about the ever changing professional practices to build industrial adaptability.</li>
                </ul>
              )}
            </div>

            <div className="vm-print-sub-section">
              <h4>PEO</h4>
              {deptVisionMission?.peos && deptVisionMission.peos.length > 0 ? (
                <ul className="vm-print-list">
                  {deptVisionMission.peos.map((peo, idx) => (
                    <li key={`dept-peo-${idx}`}>➢ {peo}</li>
                  ))}
                </ul>
              ) : (
                <ul className="vm-print-list">
                  <li>➢ Provide socially responsible, environment friendly solutions to Computer engineering related broad-based problems adapting professional ethics.</li>
                  <li>➢ Adapt state-of-the-art Computer engineering broad-based technologies to work in multidisciplinary work environments.</li>
                  <li>➢ Solve broad-based problems individually and as a team member communicating effectively in the world of work.</li>
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="print-block page-break-before vision-mission-print-block">
          <h2 className="section-title">4. Department Program Specific Outcomes, Program Outcomes</h2>
          <div className="vision-mission-print-container">
            <div className="branding-header">
              <div className="branding-logo-title">
                {institutionBranding.logoUrl ? (
                  <img src={institutionBranding.logoUrl} alt="Logo" className="branding-logo" />
                ) : (
                  <div className="branding-logo-fallback">{institutionBranding.fallback}</div>
                )}
                <div className="branding-title-text">
                  <h3>{institutionBranding.name}</h3>
                  <h4>COURSE DIARY</h4>
                </div>
              </div>
            </div>

            <div className="vm-print-section-header">
              <h3>Program Outcomes (PO)</h3>
            </div>
            <div className="vm-print-outcomes-list">
              {(deptVisionMission?.pos && deptVisionMission.pos.length > 0 ? deptVisionMission.pos : DEFAULT_POS).map((po, idx) => (
                <p key={`print-po-${idx}`} className="outcome-item">
                  <strong>{po.code}. {po.name}:</strong> {po.description}
                </p>
              ))}
            </div>

            <div className="vm-print-section-header" style={{ marginTop: "20px" }}>
              <h3>Program Specific Outcomes (PSO)</h3>
            </div>
            <div className="vm-print-outcomes-list">
              {(deptVisionMission?.psos && deptVisionMission.psos.length > 0 ? deptVisionMission.psos : DEFAULT_PSOS).map((pso, idx) => (
                <p key={`print-pso-${idx}`} className="outcome-item">
                  <strong>{pso.code}. {pso.name}:</strong> {pso.description}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="print-block page-break-before">
          <h2 className="section-title">5. Time Table &amp; Load</h2>
          <table className="print-grid timetable-print-table">
            <thead>
              <tr>
                <th>Time</th>
                {days.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((time, tIdx) => (
                <tr key={time}>
                  <td className="time-col">{time}</td>
                  {days.map((day) => renderTimeTableCell(time, day, tIdx))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="print-block page-break-before">
          <h2 className="section-title">6. Syllabus Contents</h2>
          {syllabusImages.length > 0 && (
            <div className="syllabus-image-grid" style={{ marginBottom: "24px" }}>
              {syllabusImages.map((image, index) => (
                <div key={`syllabus-${index}`} className="syllabus-image-block">
                  <div className="syllabus-page-label">Page {index + 1}</div>
                  <img
                    src={image}
                    alt={`Syllabus page ${index + 1}`}
                    className="syllabus-image"
                  />
                </div>
              ))}
            </div>
          )}
          {syllabusImages.length === 0 && (
            <p className="small-note">
              Syllabus images not found. Showing chapter/experiment content.
            </p>
          )}
          <div className="two-col-grid">
            <div>
              <h4>Course Chapters</h4>
              <ol>
                {chapters.length > 0 ? (
                  chapters.map((item, index) => (
                    <li key={`ch-${item.chapterNo || index}`}>
                      {item.chapterNo ? `${item.chapterNo}. ` : ""}
                      {item.chapterName || "-"}
                    </li>
                  ))
                ) : (
                  <li>No chapter data available.</li>
                )}
              </ol>
            </div>
            <div>
              <h4>Experiments / Practicals</h4>
              <ol>
                {experiments.length > 0 ? (
                  experiments.map((item, index) => (
                    <li key={`ex-${item.practicalNo || index}`}>
                      {item.practicalNo ? `${item.practicalNo}. ` : ""}
                      {item.practicalName || "-"}
                    </li>
                  ))
                ) : (
                  <li>No experiment data available.</li>
                )}
              </ol>
            </div>
          </div>
        </section>

        <section className="print-block page-break-before">
          <h2 className="section-title">7. Subject Details</h2>
          {subjectDetailSections.map((section) => (
            <div className="subject-section" key={section.title}>
              <h4>{section.title}</h4>
              <table className="print-grid">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>No.</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {section.data.length > 0 ? (
                    section.data.map((item, index) => (
                      <tr key={`${section.title}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{section.mapText(item) || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2}>No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <section className="print-block page-break-before">
          <h2 className="section-title">8. Teaching Plan (TP)</h2>
          {[1, 2, 3, 4].map((page) => (
            <div className="plan-page" key={`tp-page-${page}`}>
              <div className="plan-page-title">Page {page}</div>
              <table className="print-grid tp-table">
                <thead>
                  <tr>
                    <th>Chapter No.</th>
                    <th>Name of Chapter</th>
                    <th>Topics / Sub-topics</th>
                    <th>Entry No.</th>
                    <th>Date</th>
                    <th>Teaching Methods</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].flatMap((_, index) => {
                    const weekNo = (page - 1) * 4 + index + 1;
                    const weekPlans = getTeachingPlansForWeek(weekNo);
                    return weekPlans.map((plan, rowIndex) => {
                      const chapterParts =
                        plan?.chapter?.split("Unit - ")[1]?.split(".") || [];
                      const chapterNo = chapterParts[0]?.trim() || "";
                      const chapterName =
                        plan?.chapter?.split(". ").slice(1).join(". ") || "";
                      return (
                        <tr key={`tp-${weekNo}-${rowIndex}`}>
                          <td>{chapterNo ? `Unit - ${chapterNo}` : ""}</td>
                          <td>{chapterName}</td>
                          <td>{plan?.subTopic || ""}</td>
                          {rowIndex === 0 && (
                            <td rowSpan={5} className="entry-no-cell">
                              {weekNo}
                            </td>
                          )}
                          <td>{plan?.startDate || ""}</td>
                          <td>{plan?.teachingMethod || ""}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <section className="print-block page-break-before">
          <h2 className="section-title">9. Laboratory Plan (LP)</h2>
          {[1, 2, 3, 4].map((page) => (
            <div className="plan-page" key={`lp-page-${page}`}>
              <div className="plan-page-title">Page {page}</div>
              <table className="print-grid lp-table">
                <thead>
                  <tr>
                    <th>Week No.</th>
                    <th>Expt. No.</th>
                    <th>Name of Experiment</th>
                    <th>Batch</th>
                    <th>Date of Performance (Planned)</th>
                    <th>Date of Completion (Actual)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].flatMap((_, index) => {
                    const weekNo = (page - 1) * 4 + index + 1;
                    const weekPlans = getLabPlansForWeek(weekNo);
                    return weekPlans.map((plan, rowIndex) => (
                      <tr key={`lp-${weekNo}-${rowIndex}`}>
                        {rowIndex === 0 && <td rowSpan={weekPlans.length}>{weekNo}</td>}
                        <td>{plan?.exptNo || ""}</td>
                        <td style={{ whiteSpace: "pre-line" }}>{plan?.exptName || ""}</td>
                        <td>{plan?.batch || ""}</td>
                        <td>{plan?.date || ""}</td>
                        <td>{plan?.actualDate || "--"}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* Section 10. Format K3 (FA-PA) */}
        <section className="print-block page-break-before k3-format-section">
          <div className="k3-sheet-header">
            <div className="k3-sheet-title">
              <div className="k3-sheet-board">Maharashtra State Board of Technical Education</div>
              <div className="k3-sheet-subtitle">FORMATIVE ASSESSMENT OF PRACTICAL (FA-PA)</div>
            </div>
            <div className="k3-sheet-format">Format K3</div>
          </div>

          <div className="k3-meta">
            <div><strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}</div>
            <div><strong>Course and Code:</strong> {ciannData?.courseCode || ciannData?.class || "C05K-A"}</div>
            <div><strong>Subject and Code:</strong> {ciannData?.subject?.name || "CLOUD COMPUTING"} ({ciannData?.subject?.code || "315325"})</div>
            <div><strong>Name of Faculty:</strong> {formatUsername(localStorage.getItem("username") || "") || "Faculty"}</div>
            <div><strong>Division:</strong> {ciannData?.division || "-"}</div>
          </div>

          <table className="k3-table">
            <thead>
              <tr>
                <th rowSpan={2}>Roll No.</th>
                <th rowSpan={2}>Enrollment<br />Number</th>
                <th rowSpan={2}>Exam Seat<br />No.</th>
                <th rowSpan={2}>Name of the Student</th>
                <th colSpan={k3ExperimentColumns.length || 1}>Experiment / Practical / Tutorial (Marks out of 25 per experiment)</th>
                <th rowSpan={2}>Total Marks<br />(out of {25 * (k3ExperimentColumns.length || 1)})</th>
                <th rowSpan={2}>FA marks of practical<br />converted (max marks 25)</th>
                <th rowSpan={2}>Signature of<br />Student</th>
              </tr>
              <tr>
                {k3ExperimentColumns.length > 0 ? (
                  k3ExperimentColumns.map((column) => <th key={column.number}>{String(column.number).padStart(2, "0")}</th>)
                ) : (
                  <th>--</th>
                )}
              </tr>
            </thead>
            <tbody>
              {k3Rows.length === 0 ? (
                <tr>
                  <td colSpan={8 + (k3ExperimentColumns.length || 1)} className="k3-empty">No student data available.</td>
                </tr>
              ) : (
                k3Rows.map((student) => {
                  const total = k3ExperimentColumns.reduce((sum, column) => {
                    const raw = student.assessments?.[column.number]?.marks;
                    const normalized = normalizeMark(raw, 25);
                    return sum + (Number.isFinite(normalized) ? normalized : 0);
                  }, 0);

                  const converted = k3ExperimentColumns.length > 0
                    ? Math.round((total / (25 * k3ExperimentColumns.length)) * 25)
                    : "-";

                  return (
                    <tr key={`${student.rollNo}-${student.studentName}`}>
                      <td>{student.rollNo || "-"}</td>
                      <td>{student.enrollmentNo || "-"}</td>
                      <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                      <td className="k3-name">{student.studentName || "-"}</td>
                      {k3ExperimentColumns.length > 0 ? (
                        k3ExperimentColumns.map((column) => {
                          const raw = student.assessments?.[column.number]?.marks;
                          const normalized = normalizeMark(raw, 25);
                          return <td key={`${student._id}-${column.number}`}>{Number.isFinite(normalized) ? normalized : "-"}</td>;
                        })
                      ) : (
                        <td>-</td>
                      )}
                      <td>{k3ExperimentColumns.length > 0 ? total : "-"}</td>
                      <td>{converted}</td>
                      <td></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="k3-signature-row">
            <div>
              <strong>{formatUsername(localStorage.getItem("username") || "") || "Faculty"}</strong>
              <div className="k3-sign-label">(Name & Signature of Faculty)</div>
            </div>
            <div>
              <strong>_________________________</strong>
              <div className="k3-sign-label">(Name & Signature of HoD)</div>
            </div>
          </div>
        </section>

        {/* Section 11. Format K4 (SA-PR) */}
        <section className="print-block page-break-before k4-format-section">
          <div className="k4-print-sheet">
            <table className="k4-print-table k4-structure-table">
              <colgroup>
                <col className="k4-col-roll" />
                <col className="k4-col-enroll" />
                <col className="k4-col-name" />
                <col className="k4-col-seat" />
                <col className="k4-col-marks" />
              </colgroup>
              <thead>
                <tr>
                  <th colSpan="5" className="k4-sheet-title-cell">
                    <div className="k4-sheet-title-inner">
                      <div>
                        <div className="k4-print-board">
                          Maharashtra State Board of Technical Education
                        </div>
                        <div className="k4-print-subtitle">
                          SUMMATIVE ASSESSMENT OF PRACTICAL (SA-PR)
                        </div>
                      </div>
                      <div className="k4-print-format">Format K4</div>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th colSpan="3" className="k4-meta-left">
                    <div>
                      <strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}
                    </div>
                  </th>
                  <th colSpan="2" className="k4-meta-right">
                    <strong>Subject and Code:</strong> {ciannData?.subject?.name || "-"} ({ciannData?.subject?.code || "-"})
                  </th>
                </tr>
                <tr>
                  <th colSpan="2" className="k4-meta-left">
                    <strong>Course and Code:</strong> {ciannData?.courseCode || ciannData?.class || "C05K-A"}
                  </th>
                  <th colSpan="3" className="k4-meta-center">
                    <strong>Marks: Max:</strong> {k4MaxMarks || "25"} &nbsp;&nbsp;
                    <strong>Min</strong> 0 &nbsp;&nbsp;
                    <strong>Date of Examination :</strong> {new Date().toISOString().slice(0, 10)}
                  </th>
                </tr>
                <tr>
                  <th>Roll No.</th>
                  <th>Enrollment<br />Number</th>
                  <th>Name of the Student</th>
                  <th>Exam Seat<br />No.</th>
                  <th>Marks obtained in SA<br />part of Practical as per<br />L-A Scheme (Max Marks)</th>
                </tr>
                <tr>
                  <th></th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.rollNo || student.rollId || student.regNumber || "-"}</td>
                      <td>{student.enrollmentNo || "-"}</td>
                      <td className="text-start">{student.studentName || student.name || "-"}</td>
                      <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                      <td>{k4Marks[student._id] || ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="k4-print-signatures">
              <div className="k4-sign-column">
                <div className="k4-sign-title">Signature of Internal Examiner</div>
                <div>Name: ______________________</div>
                <div>Designation: _______________</div>
                <div>Mobile No.: ________________</div>
              </div>
              <div className="k4-sign-column">
                <div className="k4-sign-title">Signature of External Examiner</div>
                <div>Name: ______________________</div>
                <div>Designation: _______________</div>
                <div>Mobile No.: ________________</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 12. Format K5 (FA-TH) */}
        <section className="print-block page-break-before k5-format-section">
          <div className="k5-sheet">
            <table className="k5-table">
              <thead>
                <tr>
                  <th colSpan="8" className="k5-title-cell">
                    <div className="k5-title-top">Maharashtra State Board of Technical Education</div>
                    <div className="k5-title-sub">FORMATIVE ASSESSMENT OF THEORY (FA-TH)</div>
                    <div className="k5-format">Format K5</div>
                  </th>
                </tr>
                <tr>
                  <th colSpan="4" className="k5-meta-left">
                    <div><strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}</div>
                    <div><strong>Course and Code:</strong> {ciannData?.courseCode || ciannData?.class || "C05K-A"}</div>
                    <div><strong>Marks:</strong> Max: 30&nbsp;&nbsp; Min 00</div>
                  </th>
                  <th colSpan="4" className="k5-meta-right">
                    <div><strong>Date of Examination :</strong> </div>
                    <div>
                      <strong>Subject and Code:</strong> {ciannData?.subject?.name || "-"} ({ciannData?.subject?.code || "-"})
                    </div>
                  </th>
                </tr>
                <tr>
                  <th>Roll No.</th>
                  <th>Enrollment<br />Number</th>
                  <th>Name of the Student</th>
                  <th>Exam Seat<br />No.</th>
                  <th>Marks of Class Test-1<br />(Out of 30)</th>
                  <th>Marks of Class Test-2<br />(Out of 30)</th>
                  <th>Average of 5 &amp; 6<br />(Out of 30)</th>
                  <th>Signature of<br />Student</th>
                </tr>
                <tr>
                  <th></th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="k5-empty">No students found for this CIANN.</td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const rollNo = student.rollNo || student.rollId || student.regNumber || "";
                    const name = student.studentName || student.name || "";
                    const key = `${String(rollNo).trim()}::${String(name).trim().toLowerCase()}`;
                    const ctData = k5CtMarksMap[key] || {};
                    const ct1 = Number.isFinite(ctData.ct1) ? ctData.ct1 : null;
                    const ct2 = Number.isFinite(ctData.ct2) ? ctData.ct2 : null;

                    const formatAverage = (first, second) => {
                      const values = [first, second].filter((value) => Number.isFinite(value));
                      if (values.length === 0) return "-";
                      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
                      return avg.toFixed(2);
                    };

                    return (
                      <tr key={student._id}>
                        <td>{rollNo || "-"}</td>
                        <td>{student.enrollmentNo || "-"}</td>
                        <td className="k5-name">{name}</td>
                        <td>{student.examSeatNo || student.seatNo || student.examSeat || "-"}</td>
                        <td>{Number.isFinite(ct1) ? ct1.toFixed(2) : "-"}</td>
                        <td>{Number.isFinite(ct2) ? ct2.toFixed(2) : "-"}</td>
                        <td>{formatAverage(ct1, ct2)}</td>
                        <td></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="k5-signatures">
              <div>
                <div><strong>Signature of Faculty</strong></div>
                <div>Name: {formatUsername(localStorage.getItem("username") || "")}</div>
              </div>
              <div>
                <div><strong>Signature of HoD</strong></div>
                <div>Name: __________________________</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 13. Attendance Records */}
        <section className="print-block page-break-before attendance-records-section">
          <div className="attendance-header-top">
            <div className="attendance-title-box">
              <div className="attendance-board">Maharashtra State Board of Technical Education</div>
              <div className="attendance-subtitle">ATTENDANCE LOGS AND CUMULATIVE RECORD</div>
            </div>
            <div className="attendance-format-label">Attendance Record</div>
          </div>

          <div className="attendance-meta">
            <div><strong>Academic Year:</strong> {ciannData?.academicYear || "2025 - 2026"}</div>
            <div><strong>Course/Semester:</strong> {ciannData?.class || "-"} ({ciannData?.division || "-"})</div>
            <div><strong>Subject and Code:</strong> {ciannData?.subject?.name || "-"} ({ciannData?.subject?.code || "-"})</div>
            <div><strong>Subject Teacher:</strong> {formatUsername(localStorage.getItem("username") || "") || "Faculty"}</div>
          </div>

          <h3 className="attendance-table-title">13.1 Attendance Sessions Log</h3>
          <table className="attendance-log-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Sr. No.</th>
                <th style={{ width: "15%" }}>Date</th>
                <th style={{ width: "22%" }}>Session Type</th>
                <th>Details (Topic / Expt.)</th>
                <th style={{ width: "15%" }}>Present / Total</th>
                <th style={{ width: "12%" }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {attendanceSessionsLog.length === 0 ? (
                <tr>
                  <td colSpan="6" className="attendance-empty">No conducted sessions recorded.</td>
                </tr>
              ) : (
                attendanceSessionsLog.map((session, index) => (
                  <tr key={session.id}>
                    <td>{index + 1}</td>
                    <td>{session.date}</td>
                    <td>{session.type}</td>
                    <td className="text-start">{session.details}</td>
                    <td>{session.presentCount} / {session.totalStudents}</td>
                    <td>{session.pct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h3 className="attendance-table-title page-break-before">13.2 Student Cumulative Attendance Summary</h3>
          <table className="attendance-summary-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Roll No.</th>
                <th style={{ width: "18%" }}>Enrollment No.</th>
                <th>Name of the Student</th>
                <th style={{ width: "18%" }}>Theory lectures (Attended/Conducted)</th>
                <th style={{ width: "18%" }}>Practical labs (Attended/Conducted)</th>
                <th style={{ width: "15%" }}>Overall Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {studentAttendanceStats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="attendance-empty">No student records found.</td>
                </tr>
              ) : (
                studentAttendanceStats.map((stat) => (
                  <tr key={`${stat.rollNo}-${stat.studentName}`}>
                    <td>{stat.rollNo}</td>
                    <td>{stat.enrollmentNo}</td>
                    <td className="text-start">{stat.studentName}</td>
                    <td>{stat.theoryAttended} / {stat.theoryConducted}</td>
                    <td>{stat.practicalAttended} / {stat.practicalConducted}</td>
                    <td>{stat.overallPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="attendance-signatures">
            <div>
              <strong>{formatUsername(localStorage.getItem("username") || "") || "Subject Teacher"}</strong>
              <div className="sign-label">(Name & Signature of Subject Teacher)</div>
            </div>
            <div>
              <strong>_________________________</strong>
              <div className="sign-label">(Name & Signature of HoD)</div>
            </div>
          </div>
        </section>

        {/* Section 14. Landscape Attendance Ledger Sheets */}
        {/* 14.1 Theory Attendance Ledger */}
        {[0, 1, 2].map((pageIdx) =>
          renderAttendanceLedgerPage(
            "theory",
            "Theory Lectures Attendance Ledger",
            theoryAttendance,
            pageIdx
          )
        )}

        {/* 14.2 Practical Attendance Ledger (per batch) */}
        {practicalBatches.flatMap((batch) =>
          [0, 1, 2].map((pageIdx) =>
            renderAttendanceLedgerPage(
              "practical",
              "Practical Lab Attendance Ledger",
              practicalAttendance.filter(
                (r) =>
                  r.batch &&
                  r.batch.trim().toUpperCase() === batch
              ),
              pageIdx,
              `Batch ${batch}`
            )
          )
        )}

        {/* 14.3 Tutorial Attendance Ledger (per group) */}
        {tutorialGroups.flatMap((group) =>
          [0, 1, 2].map((pageIdx) =>
            renderAttendanceLedgerPage(
              "tutorial",
              "Tutorial Session Attendance Ledger",
              group
                ? tutorialAttendance.filter(
                    (r) => r.division && r.division.trim() === group
                  )
                : tutorialAttendance,
              pageIdx,
              group || "All"
            )
          )
        )}

        {/* 14.4 Extra Theory Attendance Ledger */}
        {[0, 1, 2].map((pageIdx) =>
          renderAttendanceLedgerPage(
            "extra",
            "Extra Theory Lectures Attendance Ledger",
            extraTheoryAttendance,
            pageIdx
          )
        )}

        {loading && (
          <p className="ciann-print-loading">Loading complete CIANN content...</p>
        )}
      </div>
    </div>
  );
};

export default PrintCiann;
