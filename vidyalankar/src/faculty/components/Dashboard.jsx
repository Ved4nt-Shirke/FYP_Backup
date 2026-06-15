import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./Dashboard.css";

const cardsData = [
  {
    label: "THEORY ATTENDANCE",
    icon: "bi-calendar-check",
    path: "/theory-ciann-cards",
  },
  {
    label: "PRACTICAL ATTENDANCE",
    icon: "bi-calendar-check-fill",
    path: "/practical-ciann-cards",
  },
  {
    label: "EXTRA THEORY ATTENDANCE",
    icon: "bi-calendar-plus",
    path: "/extra-theory-ciann-cards",
  },
  {
    label: "EXTRA PRACTICAL ATTENDANCE",
    icon: "bi-calendar-plus-fill",
    path: "/extra-practical-ciann-cards",
  },
  {
    label: "TUTORIAL ATTENDANCE",
    icon: "bi-journals",
    path: "/tutorial-ciann-cards",
  },
  {
    label: "VIEW THEORY ATTENDANCE",
    icon: "bi-eye",
    path: "/view-theory-attendance",
  },
  {
    label: "VIEW PRACTICAL ATTENDANCE",
    icon: "bi-eye-fill",
    path: "/view-practical-attendance",
  },
  {
    label: "CREATE CIANN",
    icon: "bi-file-earmark-plus",
    path: "/create-ciann",
  },
  { label: "EDIT CIANN", icon: "bi-pencil-square", path: "/edit-ciann" },
  { label: "PRINT CIANN", icon: "bi-printer-fill", path: "/summary-cards" },
  {
    label: "VIEW EXTRA THEORY",
    icon: "bi-eye",
    message: "View Extra Theory functionality is not yet implemented.",
  },
];

const attendanceSourceMeta = [
  { key: "theory", label: "Theory" },
  { key: "practical", label: "Practical" },
  { key: "tutorial", label: "Tutorial" },
  { key: "extraTheory", label: "Extra Theory" },
  { key: "extraPractical", label: "Extra Practical" },
];

const initialActivityStats = {
  loading: true,
  studentsCount: 0,
  ciannCount: 0,
  studentsWithPortalCredentials: 0,
  totalAttendanceEntries: 0,
  presentEntries: 0,
  sessionsByType: {},
  tarByType: {},
};

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.students)) return payload.students;
  return [];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState("");
  const [ciannProgress, setCiannProgress] = useState({
    loading: true,
    total: 0,
    completed: 0,
    percentage: 0,
  });
  const [activityStats, setActivityStats] = useState(initialActivityStats);

  useEffect(() => {
    let isMounted = true;

    const fetchCiannProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!isMounted) return;
          setCiannProgress({
            loading: false,
            total: 0,
            completed: 0,
            percentage: 0,
          });
          return;
        }

        const requestOptions = {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const ciannResponse = await fetch(config.cianns, requestOptions);
        if (!ciannResponse.ok) {
          throw new Error(
            `Failed to fetch CIANN list (${ciannResponse.status})`,
          );
        }

        const ciannList = await ciannResponse.json();
        const cianns = Array.isArray(ciannList) ? ciannList : [];

        if (cianns.length === 0) {
          if (!isMounted) return;
          setCiannProgress({
            loading: false,
            total: 0,
            completed: 0,
            percentage: 0,
          });
          return;
        }

        const isNonEmptyArrayResponse = async (response) => {
          if (!response.ok) return false;
          const payload = await response.json();
          return Array.isArray(payload) && payload.length > 0;
        };

        const completionChecks = await Promise.all(
          cianns.map(async (ciann) => {
            const ciannId = ciann?.ciannId;
            if (!ciannId) return false;

            const [teachingResult, labResult] = await Promise.allSettled([
              fetch(`${config.teachingPlan}/${ciannId}`, requestOptions),
              fetch(`${config.labPlanning}/${ciannId}`, requestOptions),
            ]);

            let hasTeachingPlan = false;
            let hasLabPlan = false;

            if (teachingResult.status === "fulfilled") {
              hasTeachingPlan = await isNonEmptyArrayResponse(
                teachingResult.value,
              );
            }

            if (labResult.status === "fulfilled") {
              hasLabPlan = await isNonEmptyArrayResponse(labResult.value);
            }

            return hasTeachingPlan || hasLabPlan;
          }),
        );

        const completed = completionChecks.filter(Boolean).length;
        const total = cianns.length;
        const percentage = Math.round((completed / total) * 100);

        if (!isMounted) return;
        setCiannProgress({
          loading: false,
          total,
          completed,
          percentage,
        });
      } catch (error) {
        console.error("Error fetching Edit CIANN progress:", error);
        if (!isMounted) return;
        setCiannProgress({
          loading: false,
          total: 0,
          completed: 0,
          percentage: 0,
        });
      }
    };

    const fetchActivityStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!isMounted) return;
          setActivityStats({
            ...initialActivityStats,
            loading: false,
          });
          return;
        }

        const requestOptions = {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const fetchJson = async (endpoint) => {
          try {
            const response = await fetch(endpoint, requestOptions);
            if (!response.ok) return [];
            const payload = await response.json();
            return toArray(payload);
          } catch {
            return [];
          }
        };

        const [students, cianns] = await Promise.all([
          fetchJson(config.students),
          fetchJson(config.cianns),
        ]);

        const attendanceBuckets = {
          theory: [],
          practical: [],
          tutorial: [],
          extraTheory: [],
          extraPractical: [],
        };

        await Promise.all(
          cianns.map(async (ciann) => {
            const ciannId = ciann?.ciannId;
            if (!ciannId) return;

            const [theory, practical, tutorial, extraTheory, extraPractical] =
              await Promise.all([
                fetchJson(`${config.attendance.theory}?ciannId=${ciannId}`),
                fetchJson(`${config.attendance.practical}?ciannId=${ciannId}`),
                fetchJson(`${config.attendance.tutorial}?ciannId=${ciannId}`),
                fetchJson(`${config.attendance.extraTheory}/ciann/${ciannId}`),
                fetchJson(
                  `${config.attendance.extraPractical}?ciannId=${ciannId}`,
                ),
              ]);

            attendanceBuckets.theory.push(...theory);
            attendanceBuckets.practical.push(...practical);
            attendanceBuckets.tutorial.push(...tutorial);
            attendanceBuckets.extraTheory.push(...extraTheory);
            attendanceBuckets.extraPractical.push(...extraPractical);
          }),
        );

        const attendanceLists = [
          attendanceBuckets.theory,
          attendanceBuckets.practical,
          attendanceBuckets.tutorial,
          attendanceBuckets.extraTheory,
          attendanceBuckets.extraPractical,
        ];

        const sessionsByType = {
          theory: attendanceBuckets.theory.length,
          practical: attendanceBuckets.practical.length,
          tutorial: attendanceBuckets.tutorial.length,
          extraTheory: attendanceBuckets.extraTheory.length,
          extraPractical: attendanceBuckets.extraPractical.length,
        };

        let totalAttendanceEntries = 0;
        let presentEntries = 0;

        attendanceLists.flat().forEach((record) => {
          const studentsInRecord = Array.isArray(record?.students)
            ? record.students
            : [];
          totalAttendanceEntries += studentsInRecord.length;

          const presentInRecord = studentsInRecord.reduce((sum, student) => {
            const normalizedStatus = String(
              student?.status || student?.attendance || "",
            ).toLowerCase();
            return normalizedStatus === "present" ? sum + 1 : sum;
          }, 0);
          presentEntries += presentInRecord;
        });

        const getTypeTar = (records = []) => {
          let total = 0;
          let present = 0;

          records.forEach((record) => {
            const studentsInRecord = Array.isArray(record?.students)
              ? record.students
              : [];
            total += studentsInRecord.length;
            present += studentsInRecord.reduce((sum, student) => {
              const status = String(
                student?.status || student?.attendance || "",
              ).toLowerCase();
              return status === "present" ? sum + 1 : sum;
            }, 0);
          });

          return total > 0 ? Math.round((present / total) * 100) : 0;
        };

        const tarByType = {
          theory: getTypeTar(attendanceBuckets.theory),
          practical: getTypeTar(attendanceBuckets.practical),
          tutorial: getTypeTar(attendanceBuckets.tutorial),
          extraTheory: getTypeTar(attendanceBuckets.extraTheory),
          extraPractical: getTypeTar(attendanceBuckets.extraPractical),
        };

        const studentsWithPortalCredentials = students.reduce(
          (count, student) => {
            return student?.username ? count + 1 : count;
          },
          0,
        );

        if (!isMounted) return;
        setActivityStats({
          loading: false,
          studentsCount: students.length,
          ciannCount: cianns.length,
          studentsWithPortalCredentials,
          totalAttendanceEntries,
          presentEntries,
          sessionsByType,
          tarByType,
        });
      } catch (error) {
        console.error("Error fetching dashboard activity stats:", error);
        if (!isMounted) return;
        setActivityStats({
          ...initialActivityStats,
          loading: false,
        });
      }
    };

    fetchCiannProgress();
    fetchActivityStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const progressStatusText = useMemo(() => {
    if (ciannProgress.loading) return "Checking progress...";
    if (ciannProgress.total === 0)
      return "Create a CIANN to start tracking progress";
    if (ciannProgress.percentage === 100)
      return "Edit CIANN is fully completed";
    return "Continue Edit CIANN to reach 100%";
  }, [ciannProgress]);

  const chartBars = useMemo(() => {
    const values = attendanceSourceMeta.map((meta) => ({
      key: meta.key,
      label: meta.label,
      value: activityStats.sessionsByType?.[meta.key] || 0,
    }));

    const maxValue = Math.max(1, ...values.map((item) => item.value));
    return values.map((item) => ({
      ...item,
      height: item.value > 0 ? Math.round((item.value / maxValue) * 100) : 0,
    }));
  }, [activityStats.sessionsByType]);

  const tarComparisonRows = useMemo(() => {
    return attendanceSourceMeta.map((meta) => {
      const tar = activityStats.tarByType?.[meta.key] || 0;
      const sessions = activityStats.sessionsByType?.[meta.key] || 0;
      return {
        key: meta.key,
        label: meta.label,
        tar,
        sessions,
      };
    });
  }, [activityStats.tarByType, activityStats.sessionsByType]);

  const portalCoverage = activityStats.studentsCount
    ? Math.round(
        (activityStats.studentsWithPortalCredentials /
          activityStats.studentsCount) *
          100,
      )
    : 0;

  const attendancePresenceRate = activityStats.totalAttendanceEntries
    ? Math.round(
        (activityStats.presentEntries / activityStats.totalAttendanceEntries) *
          100,
      )
    : 0;

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
      return;
    }

    if (card.message) {
      setAlertMessage(card.message);
    }
  };

  return (
    <div className="scrollable-wrapper faculty-dashboard-shell">
      <section
        className="dashboard-hero-panel"
        aria-label="Dashboard highlights"
      >
        <div className="dashboard-hero-copy">
          <span className="dashboard-kicker">Faculty Command Center</span>
          <h2>Everything important for CIANN, attendance, and next actions</h2>
          <p>
            {ciannProgress.loading
              ? "Preparing your latest dashboard insights..."
              : `${ciannProgress.completed} of ${ciannProgress.total} CIANN records complete with ${attendancePresenceRate}% attendance presence.`}
          </p>
        </div>

        <div className="dashboard-progress-card">
          <div className="dashboard-progress-head">
            <span>Edit CIANN Progress</span>
            <strong>
              {ciannProgress.loading ? "--" : `${ciannProgress.percentage}%`}
            </strong>
          </div>
          <div className="dashboard-progress-track" role="presentation">
            <div
              className="dashboard-progress-fill"
              style={{ width: `${ciannProgress.percentage}%` }}
            ></div>
          </div>
          <div className="dashboard-progress-meta">
            <span>{progressStatusText}</span>
            <span>
              Total attendance sessions:{" "}
              {chartBars.reduce((sum, bar) => sum + bar.value, 0)}
            </span>
          </div>
        </div>
      </section>

      <div className="analytics-grid">
        <article className="analytics-card">
          <div className="analytics-card-head">
            <h3>CIANN Completion</h3>
            <span>
              {ciannProgress.completed}/{ciannProgress.total}
            </span>
          </div>
          <div
            className="donut-chart"
            style={{
              background: `conic-gradient(var(--primary-accent) ${ciannProgress.percentage}%, #dbe5ee 0)`,
            }}
            aria-label="CIANN completion chart"
          >
            <div className="donut-center">
              <strong>
                {ciannProgress.loading ? "--" : `${ciannProgress.percentage}%`}
              </strong>
              <span>Completed</span>
            </div>
          </div>
          <p className="analytics-note">{progressStatusText}</p>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-head">
            <h3>Attendance Activity</h3>
            <span>
              {chartBars.reduce((sum, bar) => sum + bar.value, 0)} sessions
            </span>
          </div>
          <div className="bar-chart" aria-label="Attendance sessions by type">
            {chartBars.map((bar) => (
              <div className="bar-item" key={bar.key}>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${bar.height}%` }}
                  ></div>
                </div>
                <strong>{bar.value}</strong>
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card analytics-card-wide">
          <div className="analytics-card-head">
            <h3>Module TAR Comparison</h3>
            <span>
              {activityStats.loading
                ? "Loading..."
                : "Attendance quality by module"}
            </span>
          </div>
          <div className="tar-module-chart">
            <div className="tar-chart-scale">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="tar-module-list">
              {tarComparisonRows.map((row) => (
                <div className="tar-row" key={row.key}>
                  <div className="tar-row-head">
                    <span>{row.label}</span>
                    <span>{row.sessions} sessions</span>
                  </div>
                  <div className="tar-track">
                    <div
                      className="tar-fill"
                      style={{ width: `${row.tar}%` }}
                    ></div>
                    <strong>{row.tar}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-head">
            <h3>Student Progress</h3>
            <span>{activityStats.studentsCount} students</span>
          </div>
          <div className="metric-block">
            <div className="metric-label-row">
              <span>Portal Credentials Ready</span>
              <strong>{portalCoverage}%</strong>
            </div>
            <div className="metric-track">
              <div
                className="metric-fill"
                style={{ width: `${portalCoverage}%` }}
              ></div>
            </div>
          </div>
          <div className="metric-block">
            <div className="metric-label-row">
              <span>Attendance Presence Rate</span>
              <strong>{attendancePresenceRate}%</strong>
            </div>
            <div className="metric-track">
              <div
                className="metric-fill metric-fill-secondary"
                style={{ width: `${attendancePresenceRate}%` }}
              ></div>
            </div>
          </div>
          <p className="analytics-note">
            Presence based on {activityStats.totalAttendanceEntries} attendance
            entries across all attendance modules.
          </p>
        </article>
      </div>

      <div className="dashboard-section-head">
        <h3>Quick Actions</h3>
        <span>Attendance, CIANN edits, and reports</span>
      </div>

      <div className="card-container">
        {alertMessage && (
          <div
            className="alert alert-info alert-dismissible fade show"
            role="alert"
            style={{ gridColumn: "1 / -1" }}
          >
            {alertMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setAlertMessage("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {cardsData.map((card) => (
          <div
            key={`${card.label}-${card.path || card.message}`}
            className="card-item"
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <i className={`card-icon ${card.icon}`}></i>
            <p className="card-label">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
