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
  const className = extractValue(
    ciannData,
    "className",
    "class",
    "classname",
    "Class",
    "ClassName",
    "semester",
    "year",
  );
  const division = extractValue(
    ciannData,
    "division",
    "div",
    "section",
    "Division",
    "Div",
    "Section",
  );
  return className && division
    ? `${className} - ${division}`
    : className || "N/A";
};

const getSubjectAndCode = (ciannData) => {
  const name =
    extractValue(
      ciannData,
      "subjectName",
      "subject",
      "subjectname",
      "Subject",
      "SubjectName",
      "title",
      "courseName",
      "name",
    ) || ciannData?.subject?.name;
  const code =
    extractValue(
      ciannData,
      "subjectCode",
      "code",
      "subject_code",
      "SubjectCode",
      "Code",
      "courseCode",
      "subjectId",
      "id",
    ) || ciannData?.subject?.code;
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
      const syllabusKey = `syllabusImages:${parsedData.ciannId}`;
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
          Go back
        </button>
        <button className="btn btn-success" onClick={printNow}>
          Print
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
              <p>
                <strong>Date:</strong> {new Date().toLocaleString()}
              </p>
            </div>

            <div className="diary-info-table">
              <div className="diary-row">
                <span className="label">Name of Subject Teacher</span>
                <span className="value">{localStorage.getItem("username") || "-"}</span>
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

        <section className="print-block">
          <h2 className="section-title">2. Time Table &amp; Load</h2>
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

        <section className="print-block">
          <h2 className="section-title">3. Syllabus Contents</h2>
          {syllabusImages.length > 0 ? (
            <div className="syllabus-image-grid">
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
          ) : (
            <>
              <p className="small-note">
                Syllabus images not found. Showing chapter/experiment content.
              </p>
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
            </>
          )}
        </section>

        <section className="print-block">
          <h2 className="section-title">4. Subject Details</h2>
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

        <section className="print-block">
          <h2 className="section-title">5. Teaching Plan (TP)</h2>
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
                    <th>Start Date</th>
                    <th>End Date</th>
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
                          <td>{plan?.endDate || ""}</td>
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

        <section className="print-block">
          <h2 className="section-title">6. Laboratory Plan (LP)</h2>
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
                        <td>{plan?.exptName || ""}</td>
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

        {loading && (
          <p className="ciann-print-loading">Loading complete CIANN content...</p>
        )}
      </div>
    </div>
  );
};

export default PrintCiann;
