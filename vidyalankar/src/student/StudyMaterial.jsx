import React, { useState, useEffect, useRef } from "react";
import "./StudentComponents.css";
import { studyMaterialsService } from "./services/api";

const StudyMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view states
  const [activeSubject, setActiveSubject] = useState("");
  const [activeTab, setActiveTab] = useState("chapters"); // chapters, docs, videos, exams, projects, recent
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedCategoryFolder, setSelectedCategoryFolder] = useState(null);

  // Offline Caching State
  const [offlineIds, setOfflineIds] = useState(new Set());
  const [cachingId, setCachingId] = useState(null);

  // Video Player modal state
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (selectedChapter && drawerRef.current) {
      setTimeout(() => {
        drawerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [selectedChapter]);

  // Rich Text modal state
  const [activeRichText, setActiveRichText] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    checkOfflineCache();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const allMaterials = await studyMaterialsService.getMaterials();
      setMaterials(allMaterials);

      // Pre-select first subject to keep layout populated on load
      const uniqueSubjects = [...new Set(allMaterials.map((m) => m.subject).filter(Boolean))];
      if (uniqueSubjects.length > 0 && !activeSubject) {
        setActiveSubject(uniqueSubjects[0]);
      }

      const recent = await studyMaterialsService.getRecentlyViewed();
      setRecentlyViewed(recent);

      const watchList = await studyMaterialsService.getContinueWatching();
      setContinueWatching(watchList);

      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Unable to load study materials. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Check offline cached files
  const checkOfflineCache = async () => {
    if (!("caches" in window)) return;
    try {
      const cache = await caches.open("study-materials-offline");
      const keys = await cache.keys();
      const ids = new Set();
      keys.forEach((request) => {
        const urlObj = new URL(request.url);
        const match = urlObj.pathname.match(/\/file\/([a-f0-9]+)$/);
        if (match && match[1]) {
          ids.add(match[1]);
        }
      });
      setOfflineIds(ids);
    } catch (err) {
      console.error("Cache verification error:", err);
    }
  };

  // Download for Offline
  const handleOfflineDownload = async (material) => {
    if (material.resourceType !== "file") return;
    setCachingId(material._id);
    try {
      const blob = await studyMaterialsService.downloadMaterial(material._id);
      if ("caches" in window) {
        const cache = await caches.open("study-materials-offline");
        const response = new Response(blob, {
          headers: {
            "Content-Type": material.fileMimeType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(material.fileName)}"`,
          },
        });
        await cache.put(`/api/study-materials/file/${material._id}`, response);
        const updated = new Set(offlineIds);
        updated.add(material._id);
        setOfflineIds(updated);
      }
    } catch (err) {
      console.error("Offline cache failed:", err);
      alert("Failed to download file for offline use.");
    } finally {
      setCachingId(null);
    }
  };

  const handleOpenMaterial = async (material) => {
    try {
      await studyMaterialsService.updateProgress(material._id, {});
      setTimeout(async () => {
        const recent = await studyMaterialsService.getRecentlyViewed();
        setRecentlyViewed(recent);
      }, 550);
    } catch (e) {
      console.error(e);
    }

    if (material.resourceType === "rich-text") {
      setActiveRichText(material);
      return;
    }

    if (material.category === "Video Lectures" || material.resourceType === "link" && material.externalUrl?.includes("youtube.com") || material.fileMimeType?.startsWith("video/")) {
      setActiveVideo(material);
      return;
    }

    if (material.resourceType === "link" && material.externalUrl) {
      window.open(material.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (offlineIds.has(material._id) && "caches" in window) {
      try {
        const cache = await caches.open("study-materials-offline");
        const cachedResponse = await cache.match(`/api/study-materials/file/${material._id}`);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank", "noopener,noreferrer");
          setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
          return;
        }
      } catch (err) {
        console.error("Cached access failed, falling back to download:", err);
      }
    }

    try {
      const blob = await studyMaterialsService.downloadMaterial(material._id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      console.error("Failed to load material:", err);
      alert("Failed to open file. Please try again.");
    }
  };

  const toggleBookmark = async (material, e) => {
    e.stopPropagation();
    const newStatus = !material.isBookmarked;
    try {
      await studyMaterialsService.updateProgress(material._id, { isBookmarked: newStatus });
      setMaterials(materials.map(m => m._id === material._id ? { ...m, isBookmarked: newStatus } : m));
      setRecentlyViewed(recentlyViewed.map(m => m._id === material._id ? { ...m, isBookmarked: newStatus } : m));
      setContinueWatching(continueWatching.map(m => m._id === material._id ? { ...m, isBookmarked: newStatus } : m));
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  const toggleCompleted = async (material, e) => {
    e.stopPropagation();
    const newStatus = !material.isCompleted;
    try {
      await studyMaterialsService.updateProgress(material._id, { isCompleted: newStatus });
      setMaterials(materials.map(m => m._id === material._id ? { ...m, isCompleted: newStatus } : m));
      setRecentlyViewed(recentlyViewed.map(m => m._id === material._id ? { ...m, isCompleted: newStatus } : m));
      setContinueWatching(continueWatching.map(m => m._id === material._id ? { ...m, isCompleted: newStatus } : m));
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  useEffect(() => {
    if (activeVideo && videoRef.current) {
      const videoElement = videoRef.current;
      const lastWatchedPercentage = activeVideo.videoProgress?.playedPercentage || 0;
      const lastWatchedSeconds = activeVideo.videoProgress?.playedSeconds || 0;
      
      const handleLoadedMetadata = () => {
        if (lastWatchedSeconds > 0 && lastWatchedPercentage < 95) {
          videoElement.currentTime = lastWatchedSeconds;
        }
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

      progressInterval.current = setInterval(async () => {
        if (videoElement.paused || videoElement.ended) return;
        const playedSeconds = videoElement.currentTime;
        const duration = videoElement.duration || 1;
        const playedPercentage = Math.round((playedSeconds / duration) * 100);

        try {
          await studyMaterialsService.updateProgress(activeVideo._id, {
            videoProgress: { playedSeconds, playedPercentage }
          });
        } catch (e) {
          console.error("Watch progress sync failed:", e);
        }
      }, 7000);

      return () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        if (progressInterval.current) clearInterval(progressInterval.current);
      };
    }
  }, [activeVideo]);

  const handleYouTubeClose = async (video) => {
    try {
      await studyMaterialsService.updateProgress(video._id, {
        videoProgress: { playedSeconds: 0, playedPercentage: 99 }
      });
      const allMaterials = await studyMaterialsService.getMaterials();
      setMaterials(allMaterials);
      const watchList = await studyMaterialsService.getContinueWatching();
      setContinueWatching(watchList);
    } catch (e) {
      console.error(e);
    }
    setActiveVideo(null);
  };

  // Dynamic Subject Lists
  const subjects = [...new Set(materials.map((m) => m.subject).filter(Boolean))];

  // Materials under active subject
  const subjectMaterials = materials.filter(
    (m) => m.subject && activeSubject && m.subject.toLowerCase() === activeSubject.toLowerCase()
  );

  const continueWatchingSubj = continueWatching.filter(
    (m) => m.subject && activeSubject && m.subject.toLowerCase() === activeSubject.toLowerCase()
  );
  const recentlyViewedSubj = recentlyViewed.filter(
    (m) => m.subject && activeSubject && m.subject.toLowerCase() === activeSubject.toLowerCase()
  );

  // Chapters map aggregation
  const chaptersMap = {};
  subjectMaterials.forEach((m) => {
    const chNo = m.chapterNo || 0;
    if (chNo === 0) return;
    if (!chaptersMap[chNo]) {
      chaptersMap[chNo] = {
        chapterNo: chNo,
        chapterName: m.chapterName || `Chapter ${chNo}`,
        materials: [],
        videosCount: 0,
        assignmentsCount: 0,
        completedCount: 0,
        lastUpdated: m.date,
      };
    }

    const ch = chaptersMap[chNo];
    ch.materials.push(m);
    if (
      m.category === "Video Lectures" ||
      m.fileMimeType?.startsWith("video/") ||
      (m.resourceType === "link" && m.externalUrl?.includes("youtube.com"))
    ) {
      ch.videosCount++;
    }
    if (m.category === "Assignments" || m.category === "Assignment") {
      ch.assignmentsCount++;
    }
    if (m.isCompleted) {
      ch.completedCount++;
    }
    if (new Date(m.date) > new Date(ch.lastUpdated)) {
      ch.lastUpdated = m.date;
    }
  });

  const chapters = Object.values(chaptersMap)
    .map((ch) => ({
      ...ch,
      completionPercentage: ch.materials.length > 0 ? Math.round((ch.completedCount / ch.materials.length) * 100) : 0,
    }))
    .sort((a, b) => a.chapterNo - b.chapterNo);

  const generalMaterials = subjectMaterials.filter((m) => !m.chapterNo || m.chapterNo === 0);

  // Category Icons Mapping
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Notes": return "bi-journal-text";
      case "PPT / Presentation": return "bi-easel";
      case "Assignments": return "bi-card-checklist";
      case "Question Bank": return "bi-question-circle";
      case "Previous Year Questions": return "bi-clock-history";
      case "Video Lectures": return "bi-play-btn";
      case "Important Questions": return "bi-exclamation-octagon";
      case "MCQ Quiz": return "bi-ui-checks-grid";
      case "Lab Manual": return "bi-prescription2";
      case "Practical Files": return "bi-folder-symlink";
      case "Reference PDFs": return "bi-file-pdf";
      case "E-books / EPA": return "bi-book-half";
      case "Case Studies": return "bi-mortarboard";
      case "Mini Projects": return "bi-cpu";
      case "External Links": return "bi-link-45deg";
      default: return "bi-file-earmark";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Notes": return "#4f46e5";
      case "PPT / Presentation": return "#db2777";
      case "Assignments": return "#7c3aed";
      case "Question Bank": return "#0d9488";
      case "Previous Year Questions": return "#0891b2";
      case "Video Lectures": return "#e11d48";
      case "Important Questions": return "#ea580c";
      case "MCQ Quiz": return "#ca8a04";
      case "Lab Manual": return "#2563eb";
      case "Practical Files": return "#16a34a";
      case "Reference PDFs": return "#dc2626";
      case "E-books / EPA": return "#9333ea";
      case "Case Studies": return "#475569";
      case "Mini Projects": return "#1e293b";
      case "External Links": return "#3b82f6";
      default: return "#64748b";
    }
  };

  // Preview panel tabs config
  const previewTabs = [
    { id: "chapters", label: "Chapters", icon: "bi-list-ul" },
    { id: "docs", label: "Documents", icon: "bi-file-earmark-text" },
    { id: "videos", label: "Videos", icon: "bi-play-circle" },
    { id: "exams", label: "Homework & Q&A", icon: "bi-journal-check" },
    { id: "projects", label: "Projects & Links", icon: "bi-cpu" },
    { id: "recent", label: "Recent & Progress", icon: "bi-clock-history" }
  ];

  // Helper to render materials explorer card
  const renderMaterialCard = (material) => (
    <div key={material._id} className="material-explorer-card">
      <div className="material-card-icon-area" onClick={() => handleOpenMaterial(material)}>
        {material.thumbnailPath ? (
          <img src={material.thumbnailPath} alt="" className="material-card-thumbnail" />
        ) : (
          <i className={`bi ${getCategoryIcon(material.category)}`} style={{ color: getCategoryColor(material.category) }}></i>
        )}
      </div>

      <div className="material-card-core-info" onClick={() => handleOpenMaterial(material)}>
        <h5>{material.title}</h5>
        <p>{material.description || "No description provided."}</p>
        <div className="meta-capsules">
          <span className="faculty-badge"><i className="bi bi-person"></i> {material.uploadedByName}</span>
          <span className="file-size-badge">{material.size}</span>
          {material.tags.map((t) => (
            <span key={t} className="tag-capsule">#{t}</span>
          ))}
          {offlineIds.has(material._id) && (
            <span className="offline-ready-badge"><i className="bi bi-check-circle-fill text-success"></i> Cached Offline</span>
          )}
        </div>
      </div>

      <div className="material-card-actions-area">
        {material.resourceType === "file" && (
          <button
            className={`action-icon-btn ${offlineIds.has(material._id) ? "active-offline" : ""}`}
            disabled={cachingId === material._id}
            onClick={() => handleOfflineDownload(material)}
            title={offlineIds.has(material._id) ? "Cached Offline" : "Download for Offline Use"}
          >
            {cachingId === material._id ? (
              <span className="spinner-mini"></span>
            ) : (
              <i className={`bi ${offlineIds.has(material._id) ? "bi-cloud-check-fill" : "bi-cloud-download"}`}></i>
            )}
          </button>
        )}

        <button
          className={`action-icon-btn ${material.isCompleted ? "active-completed" : ""}`}
          onClick={(e) => toggleCompleted(material, e)}
          title={material.isCompleted ? "Mark Uncompleted" : "Mark as Completed"}
        >
          <i className={`bi ${material.isCompleted ? "bi-check-circle-fill" : "bi-circle"}`}></i>
        </button>

        <button
          className={`action-icon-btn ${material.isBookmarked ? "active-bookmark" : ""}`}
          onClick={(e) => toggleBookmark(material, e)}
          title={material.isBookmarked ? "Remove Bookmark" : "Bookmark Material"}
        >
          <i className={`bi ${material.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
        </button>

        <button className="primary-action-btn" onClick={() => handleOpenMaterial(material)}>
          <i className={`bi ${material.resourceType === "link" ? "bi-box-arrow-up-right" : "bi-folder2-open"}`}></i>
          <span>{material.resourceType === "link" ? "Visit" : "View"}</span>
        </button>
      </div>
    </div>
  );

  // Tab Contents Renderers
  const renderChaptersTabContent = () => (
    <div className="tab-chapters-flow">
      <div className="chapters-grid">
        {generalMaterials.length > 0 && (
          <div
            className={`chapter-progress-card glass-card general-card-special ${selectedChapter?.chapterNo === 0 ? "active-border" : ""}`}
            onClick={() => {
              setSelectedChapter({
                chapterNo: 0,
                chapterName: "General & Course Resources",
                materials: generalMaterials,
              });
              setSelectedCategoryFolder(null);
            }}
          >
            <div className="chapter-header-row">
              <span className="chapter-badge general-badge">Intro</span>
              <span className="completion-text">
                {Math.round(
                  (generalMaterials.filter((m) => m.isCompleted).length / generalMaterials.length) * 100
                )}% Done
              </span>
            </div>
            <h3>General & Syllabus Resources</h3>
            <div className="chapter-progress-bar-container">
              <div
                className="chapter-progress-fill"
                style={{
                  width: `${Math.round(
                    (generalMaterials.filter((m) => m.isCompleted).length / generalMaterials.length) * 100
                  )}%`,
                }}
              ></div>
            </div>
            <div className="chapter-meta-footer">
              <span><i className="bi bi-file-earmark-text"></i> {generalMaterials.length} Files</span>
            </div>
          </div>
        )}

        {chapters.map((ch) => (
          <div
            key={ch.chapterNo}
            className={`chapter-progress-card glass-card ${selectedChapter?.chapterNo === ch.chapterNo ? "active-border" : ""}`}
            onClick={() => {
              setSelectedChapter(ch);
              setSelectedCategoryFolder(null);
            }}
          >
            <div className="chapter-header-row">
              <span className="chapter-badge">Module {ch.chapterNo}</span>
              <span className="completion-text">{ch.completionPercentage}% Done</span>
            </div>
            <h3>{ch.chapterName}</h3>

            <div className="chapter-progress-bar-container">
              <div className="chapter-progress-fill" style={{ width: `${ch.completionPercentage}%` }}></div>
            </div>

            <div className="chapter-meta-footer">
              <div className="meta-counters">
                <span><i className="bi bi-file-earmark-text"></i> {ch.materials.length} Files</span>
                <span><i className="bi bi-play-circle"></i> {ch.videosCount} Videos</span>
              </div>
              <span className="last-updated">Updated {new Date(ch.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedChapter && (
        <section ref={drawerRef} className="chapter-explorer-drawer glass-card">
          <div className="drawer-header">
            <div>
              <h3>
                <i className="bi bi-folder-fill text-warning"></i>{" "}
                Explorer: {selectedChapter.chapterNo === 0 ? "" : `Chapter ${selectedChapter.chapterNo} - `}{selectedChapter.chapterName}
              </h3>
              <p>Explore resources categorized across academic folders.</p>
            </div>
            <button className="close-drawer-btn" onClick={() => setSelectedChapter(null)}>&times;</button>
          </div>

          <div className="folders-grid">
            {Object.keys(
              selectedChapter.materials.reduce((acc, curr) => {
                acc[curr.category] = true;
                return acc;
              }, {})
            ).map((cat) => {
              const catMaterials = selectedChapter.materials.filter((m) => m.category === cat);
              const isCatActive = selectedCategoryFolder === cat;
              return (
                <div
                  key={cat}
                  className={`folder-card ${isCatActive ? "active-folder" : ""}`}
                  onClick={() => setSelectedCategoryFolder(isCatActive ? null : cat)}
                  style={{ "--folder-accent": getCategoryColor(cat) }}
                >
                  <div className="folder-icon-stack">
                    <i className="bi bi-folder-fill folder-back"></i>
                    <i className={`bi ${getCategoryIcon(cat)} folder-front`}></i>
                  </div>
                  <h4>{cat}</h4>
                  <span>{catMaterials.length} item{catMaterials.length > 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>

          {selectedCategoryFolder && (
            <div className="folder-contents-list">
              <h4>Folder: {selectedCategoryFolder}</h4>
              <div className="material-explorer-list">
                {selectedChapter.materials
                  .filter((m) => m.category === selectedCategoryFolder)
                  .map(renderMaterialCard)}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );

  const renderDocsTabContent = () => {
    const docCategories = ["Notes", "PPT / Presentation", "Lab Manual", "Practical Files", "Reference PDFs", "E-books / EPA"];
    const docsList = subjectMaterials.filter((m) => docCategories.includes(m.category));
    return (
      <div className="tab-direct-content">
        <h4>Documents & Lecture Notes</h4>
        {docsList.length === 0 ? (
          <div className="empty-tab-box"><i className="bi bi-file-earmark-lock"></i><p>No documents uploaded in this subject.</p></div>
        ) : (
          <div className="material-explorer-list">{docsList.map(renderMaterialCard)}</div>
        )}
      </div>
    );
  };

  const renderVideosTabContent = () => {
    const videosList = subjectMaterials.filter((m) => m.category === "Video Lectures" || m.fileMimeType?.startsWith("video/") || (m.resourceType === "link" && m.externalUrl?.includes("youtube.com")));
    return (
      <div className="tab-direct-content">
        <h4>Videos & Lecture Recordings</h4>
        {videosList.length === 0 ? (
          <div className="empty-tab-box"><i className="bi bi-play-circle-fill"></i><p>No video lectures published yet.</p></div>
        ) : (
          <div className="material-explorer-list">{videosList.map(renderMaterialCard)}</div>
        )}
      </div>
    );
  };

  const renderExamsTabContent = () => {
    const examCategories = ["Assignments", "Question Bank", "Previous Year Questions", "MCQ Quiz", "Important Questions"];
    const examsList = subjectMaterials.filter((m) => examCategories.includes(m.category));
    return (
      <div className="tab-direct-content">
        <h4>Homework, Question Banks & Important Questions</h4>
        {examsList.length === 0 ? (
          <div className="empty-tab-box"><i className="bi bi-clipboard2-check"></i><p>No assessments or question banks found.</p></div>
        ) : (
          <div className="material-explorer-list">{examsList.map(renderMaterialCard)}</div>
        )}
      </div>
    );
  };

  const renderProjectsTabContent = () => {
    const projectCategories = ["Mini Projects", "Case Studies", "External Links", "Other"];
    const projList = subjectMaterials.filter((m) => projectCategories.includes(m.category) || !m.category);
    return (
      <div className="tab-direct-content">
        <h4>Projects, References & External Links</h4>
        {projList.length === 0 ? (
          <div className="empty-tab-box"><i className="bi bi-cpu"></i><p>No project briefs or external references found.</p></div>
        ) : (
          <div className="material-explorer-list">{projList.map(renderMaterialCard)}</div>
        )}
      </div>
    );
  };

  const renderRecentTabContent = () => (
    <div className="tab-direct-content">
      {/* Continue Watching Section */}
      {continueWatchingSubj.length > 0 && (
        <div className="slider-wrapper recent-tab-slider">
          <h4 className="slider-title"><i className="bi bi-play-circle-fill text-danger"></i> Continue Watching</h4>
          <div className="horizontal-slider">
            {continueWatchingSubj.map((item) => (
              <div key={item._id} className="slider-item-card glass-card" onClick={() => handleOpenMaterial(item)}>
                <div className="slider-video-thumbnail">
                  {item.thumbnailPath ? (
                    <img src={item.thumbnailPath} alt={item.title} />
                  ) : (
                    <div className="fallback-video-icon"><i className="bi bi-file-earmark-play-fill"></i></div>
                  )}
                  <div className="progress-bar-overlay">
                    <div className="progress-fill" style={{ width: `${item.videoProgress?.playedPercentage || 0}%` }}></div>
                  </div>
                </div>
                <div className="slider-item-info">
                  <h4>{item.title}</h4>
                  <p>Chapter {item.chapterNo || 0}</p>
                  <span className="timestamp-resume">Resume at {Math.floor((item.videoProgress?.playedSeconds || 0) / 60)}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Section */}
      {recentlyViewedSubj.length > 0 && (
        <div className="slider-wrapper recent-tab-slider">
          <h4 className="slider-title"><i className="bi bi-clock-history text-primary"></i> Recently Viewed</h4>
          <div className="horizontal-slider">
            {recentlyViewedSubj.map((item) => (
              <div key={item._id} className="slider-item-card glass-card" onClick={() => handleOpenMaterial(item)}>
                <div className="slider-doc-icon" style={{ backgroundColor: `${getCategoryColor(item.category)}20`, color: getCategoryColor(item.category) }}>
                  {item.thumbnailPath ? (
                    <img src={item.thumbnailPath} alt="" className="thumb-mini" />
                  ) : (
                    <i className={`bi ${getCategoryIcon(item.category)}`}></i>
                  )}
                </div>
                <div className="slider-item-info">
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
                  <span className="timestamp-resume">{item.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {continueWatchingSubj.length === 0 && recentlyViewedSubj.length === 0 && (
        <div className="empty-tab-box"><i className="bi bi-clock"></i><p>No recently viewed resources for this subject.</p></div>
      )}
    </div>
  );

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="study-material-container">
        <header className="dashboard-header">
          <div className="header-info">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
          </div>
        </header>
        <div className="subjects-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="subject-card skeleton-card">
              <div className="skeleton skeleton-icon"></div>
              <div className="skeleton skeleton-title-sm"></div>
              <div className="skeleton skeleton-text-sm"></div>
              <div className="skeleton skeleton-progress"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-material-container">
        <div className="error-state">
          <i className="bi bi-shield-slash"></i>
          <p>{error}</p>
          <button className="retry-action-btn" onClick={fetchDashboardData}>Refresh Connection</button>
        </div>
      </div>
    );
  }

  // Render 2-Column Split Dashboard Layout
  return (
    <div className="study-material-container">
      <div className="split-dashboard-layout">
        {/* Left Column: Subject List Explorer */}
        <div className="dashboard-sidebar-panel">
          <header className="dashboard-header compact-header">
            <div className="header-info">
              <h1>Study Explorer</h1>
              <p>Select a subject to begin exploring.</p>
            </div>
          </header>

          <div className="compact-subjects-list">
            {subjects.length === 0 ? (
              <div className="no-materials-box glass-card">
                <i className="bi bi-folder-x"></i>
                <p>No study materials uploaded yet.</p>
              </div>
            ) : (
              subjects.map((subj) => {
                const isSelected = subj.toLowerCase() === activeSubject.toLowerCase();
                const subjMaterials = materials.filter((m) => m.subject.toLowerCase() === subj.toLowerCase());
                const totalChapters = [...new Set(subjMaterials.map((m) => m.chapterNo).filter(Boolean))].length;
                const completedCount = subjMaterials.filter((m) => m.isCompleted).length;
                const totalCount = subjMaterials.length;
                const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                // Circular Progress Parameters
                const radius = 22;
                const stroke = 3;
                const normalizedRadius = radius - stroke * 2;
                const circumference = normalizedRadius * 2 * Math.PI;
                const strokeDashoffset = circumference - (pct / 100) * circumference;

                return (
                  <div
                    key={subj}
                    className={`subject-card compact-subject-item glass-card ${isSelected ? "active-item" : ""}`}
                    onClick={() => {
                      setActiveSubject(subj);
                      setSelectedChapter(null);
                      setSelectedCategoryFolder(null);
                    }}
                  >
                    <div className="subject-card-top">
                      <div className="subject-card-icon"><i className="bi bi-book-half"></i></div>
                      <div className="progress-ring-wrapper">
                        <svg height="44" width="44">
                          <circle stroke="#e2e8f0" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="22" cy="22" />
                          <circle stroke="var(--accent-blue)" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} r={normalizedRadius} cx="22" cy="22" />
                          <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="9" fontWeight="bold" fill="var(--text-primary)">{pct}%</text>
                        </svg>
                      </div>
                    </div>

                    <h3>{subj}</h3>
                    
                    <div className="subject-card-stats">
                      <span><i className="bi bi-folder2"></i> {totalChapters} Chapter{totalChapters !== 1 ? 's' : ''}</span>
                      <span><i className="bi bi-file-earmark-text"></i> {totalCount} Item{totalCount !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="subject-card-actions">
                      <button className="card-action-btn primary-btn" onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubject(subj);
                        setSelectedChapter(null);
                        setSelectedCategoryFolder(null);
                        setActiveTab("chapters");
                      }}>
                        Open
                      </button>
                      <button className="card-action-btn secondary-btn" onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubject(subj);
                        setSelectedChapter(null);
                        setSelectedCategoryFolder(null);
                        setActiveTab("chapters");
                      }}>
                        Chapters
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Preview Panel */}
        <div className="dashboard-preview-panel glass-card">
          {activeSubject ? (
            <>
              <div className="preview-header">
                <div>
                  <h2>{activeSubject}</h2>
                  <p>Curated course files, video lectures, and syllabus resources.</p>
                </div>
                
                {/* Horizontal Progress indicator for active subject */}
                <div className="preview-header-stats">
                  <div className="progress-stat-pill">
                    <span className="stat-label">Subject Completion</span>
                    <div className="bar-wrapper">
                      <div className="bar-fill" style={{
                        width: `${Math.round(
                          (subjectMaterials.filter((m) => m.isCompleted).length / (subjectMaterials.length || 1)) * 100
                        )}%`
                      }}></div>
                    </div>
                    <span className="stat-val">
                      {Math.round(
                        (subjectMaterials.filter((m) => m.isCompleted).length / (subjectMaterials.length || 1)) * 100
                      )}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="preview-tabs-row">
                {previewTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`preview-tab-btn ${activeTab === tab.id ? "active-tab" : ""}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "chapters") setSelectedChapter(null);
                    }}
                  >
                    <i className={`bi ${tab.icon}`}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents Area */}
              <div className="tab-contents-container">
                {activeTab === "chapters" && renderChaptersTabContent()}
                {activeTab === "docs" && renderDocsTabContent()}
                {activeTab === "videos" && renderVideosTabContent()}
                {activeTab === "exams" && renderExamsTabContent()}
                {activeTab === "projects" && renderProjectsTabContent()}
                {activeTab === "recent" && renderRecentTabContent()}
              </div>
            </>
          ) : (
            <div className="empty-preview-state">
              <i className="bi bi-box2-heart"></i>
              <h3>Select a Subject</h3>
              <p>Choose a subject from the left panel to preview syllabus, files, lectures, and resources.</p>
            </div>
          )}
        </div>
      </div>

      {/* HTML5 and YouTube Video Player Modal */}
      {activeVideo && (
        <div className="video-player-modal" onClick={() => handleYouTubeClose(activeVideo)}>
          <div className="video-player-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{activeVideo.title}</h3>
              <button className="close-video-btn" onClick={() => handleYouTubeClose(activeVideo)}>&times;</button>
            </div>
            <div className="player-body">
              {activeVideo.resourceType === "link" && activeVideo.externalUrl?.includes("youtube.com") ? (
                <iframe
                  title={activeVideo.title}
                  src={`https://www.youtube.com/embed/${new URL(activeVideo.externalUrl).searchParams.get("v")}?autoplay=1&enablejsapi=1`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  src={activeVideo.downloadUrl}
                ></video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Viewer Modal */}
      {activeRichText && (
        <div className="rich-text-viewer-modal" onClick={() => setActiveRichText(null)}>
          <div className="rich-text-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{activeRichText.title}</h3>
              <button className="close-video-btn" onClick={() => setActiveRichText(null)}>&times;</button>
            </div>
            <div className="rich-text-body markdown-rendered" dangerouslySetInnerHTML={{ __html: activeRichText.richTextContent }}></div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .study-material-container {
          --bg-color: #f8fafc;
          --panel-bg: rgba(255, 255, 255, 0.85);
          --card-bg: #ffffff;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --border-color: #e2e8f0;
          --accent-blue: #2563eb;
          --accent-glow: rgba(37, 99, 235, 0.1);
          --input-bg: #ffffff;
          --folder-card-bg: #f8fafc;
          
          font-family: 'Inter', system-ui, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-primary);
          padding: 0px !important;
          min-height: calc(100vh - 110px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          width: 100% !important;
        }

        .dashboard-header.compact-header {
          margin-bottom: 16px;
        }

        .header-info h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, var(--accent-blue) 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-info p {
          color: var(--text-secondary);
          margin: 4px 0 0 0;
          font-size: 0.85rem;
        }

        /* 2-Column Dashboard Layout */
        .split-dashboard-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          align-items: start;
        }

        .dashboard-sidebar-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          scrollbar-width: none; /* Hide standard scrollbar */
          padding: 4px;
        }
        
        .dashboard-sidebar-panel::-webkit-scrollbar {
          display: none;
        }

        .compact-subjects-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .subject-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 20px !important;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          border-radius: 16px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          width: 100% !important;
        }

        .subject-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent-blue);
          box-shadow: 0 10px 20px -8px var(--accent-glow);
        }

        .compact-subject-item.active-item {
          border-color: var(--accent-blue) !important;
          background: linear-gradient(135deg, var(--card-bg) 0%, rgba(37, 99, 235, 0.02) 100%) !important;
          box-shadow: 0 8px 24px -6px var(--accent-glow) !important;
          border-width: 2px !important;
        }

        .subject-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .subject-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--accent-glow);
          color: var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .progress-ring-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .subject-card h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .subject-card-stats {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .subject-card-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .subject-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .card-action-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .card-action-btn.primary-btn {
          background: var(--accent-blue);
          color: #ffffff;
        }

        .card-action-btn.primary-btn:hover {
          background: #1d4ed8;
        }

        .card-action-btn.secondary-btn {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid var(--border-color);
        }

        .card-action-btn.secondary-btn:hover {
          background: #e2e8f0;
        }

        /* Dynamic Preview Panel */
        .dashboard-preview-panel {
          position: sticky;
          top: 10px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          scrollbar-width: thin;
          padding: 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .glass-card {
          background: var(--panel-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .preview-header h2 {
          margin: 0;
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .preview-header p {
          margin: 4px 0 0 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .preview-header-stats {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-stat-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .progress-stat-pill .bar-wrapper {
          width: 80px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-stat-pill .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue) 0%, #a855f7 100%);
          border-radius: 9999px;
        }

        .progress-stat-pill .stat-val {
          color: var(--accent-blue);
        }

        /* File manager style preview tabs */
        .preview-tabs-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }

        .preview-tabs-row::-webkit-scrollbar {
          display: none;
        }

        .preview-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .preview-tab-btn:hover {
          background: #f1f5f9;
          color: var(--text-primary);
        }

        .preview-tab-btn.active-tab {
          background: var(--accent-glow);
          color: var(--accent-blue);
          border-color: color-mix(in srgb, var(--accent-blue) 12%, transparent);
        }

        .tab-contents-container {
          flex: 1;
        }

        .tab-chapters-flow {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chapters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .chapter-progress-card {
          display: flex;
          flex-direction: column;
          padding: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          background: #ffffff;
        }

        .chapter-progress-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.05);
          border-color: var(--accent-blue);
        }

        .chapter-progress-card.active-border {
          border-color: var(--accent-blue) !important;
          box-shadow: 0 0 0 2px var(--accent-blue) !important;
        }

        .chapter-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .chapter-badge {
          background: var(--accent-glow);
          color: var(--accent-blue);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .completion-text {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--accent-blue);
        }

        .chapter-progress-bar-container {
          height: 5px;
          background: var(--border-color);
          border-radius: 9999px;
          overflow: hidden;
          margin: 10px 0;
          width: 100%;
        }

        .chapter-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue) 0%, #a855f7 100%);
          border-radius: 9999px;
        }

        .chapter-meta-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          color: var(--text-secondary);
          margin-top: 10px;
        }

        .meta-counters {
          display: flex;
          gap: 10px;
        }

        .meta-counters span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Inline Explorer Panel */
        .chapter-explorer-drawer {
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 20px;
          background: #ffffff;
          margin-top: 10px;
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .drawer-header h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
        }

        .drawer-header p {
          margin: 2px 0 0 0;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .close-drawer-btn {
          background: none;
          border: none;
          font-size: 1.6rem;
          cursor: pointer;
          color: var(--text-secondary);
          line-height: 1;
        }

        .folders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .folder-card {
          background: var(--folder-card-bg);
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .folder-card:hover {
          transform: translateY(-2px);
          border-color: var(--folder-accent);
        }

        .active-folder {
          background: #ffffff;
          border-color: var(--folder-accent);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .folder-icon-stack {
          position: relative;
          height: 36px;
          margin-bottom: 8px;
        }

        .folder-back {
          font-size: 2.2rem;
          color: var(--folder-accent);
          opacity: 0.85;
          position: absolute;
          left: 0;
          top: 0;
          line-height: 1;
        }

        .folder-front {
          position: absolute;
          left: 14px;
          top: 10px;
          font-size: 0.95rem;
          color: #ffffff;
          z-index: 2;
        }

        .folder-card h4 {
          margin: 0;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .folder-card span {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .folder-contents-list {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .folder-contents-list h4 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .material-explorer-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100% !important;
        }

        .material-explorer-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .material-explorer-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          border-color: var(--accent-blue);
        }

        .material-card-icon-area {
          flex: 0 0 46px;
          height: 46px;
          border-radius: 8px;
          background: var(--bg-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          overflow: hidden;
          cursor: pointer;
        }

        .material-card-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .material-card-core-info {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .material-card-core-info h5 {
          margin: 0 0 2px 0;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .material-card-core-info p {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-capsules {
          display: flex;
          gap: 6px;
          margin-top: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .faculty-badge, .file-size-badge, .tag-capsule, .offline-ready-badge {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          color: var(--text-secondary);
        }

        .offline-ready-badge {
          background: rgba(22, 163, 74, 0.1);
          color: #16a34a;
        }

        .material-card-actions-area {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-icon-btn:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }

        .action-icon-btn.active-bookmark {
          color: #eab308;
          background: rgba(234, 179, 8, 0.1);
          border-color: #eab308;
        }

        .action-icon-btn.active-completed {
          color: #16a34a;
          background: rgba(22, 163, 74, 0.1);
          border-color: #16a34a;
        }

        .action-icon-btn.active-offline {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.1);
          border-color: #2563eb;
        }

        .primary-action-btn {
          padding: 6px 12px;
          border-radius: 6px;
          background: var(--accent-blue);
          color: #ffffff;
          border: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 0.78rem;
        }

        .primary-action-btn:hover {
          background: #1d4ed8;
        }

        /* Direct Content list style helper */
        .tab-direct-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-direct-content h4 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .empty-tab-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary);
          border: 1px dashed var(--border-color);
          border-radius: 12px;
          background: #f8fafc;
        }

        .empty-tab-box i {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .empty-tab-box p {
          margin: 0;
          font-size: 0.85rem;
        }

        /* Sliders */
        .recent-tab-slider {
          margin-bottom: 16px;
        }

        .horizontal-slider {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
        }

        .slider-item-card {
          flex: 0 0 220px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 12px;
          background: #ffffff;
        }

        .slider-video-thumbnail {
          position: relative;
          height: 110px;
          background: #000;
          border-radius: 6px;
          overflow: hidden;
        }

        .slider-video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fallback-video-icon {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #334155;
          color: #ffffff;
          font-size: 2rem;
        }

        .slider-item-info h4 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .slider-item-info p {
          margin: 2px 0 0 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .slider-doc-icon {
          height: 110px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
        }

        .thumb-mini {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Empty Preview Panel placeholder */
        .empty-preview-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: var(--text-secondary);
          text-align: center;
          padding: 32px;
        }

        .empty-preview-state i {
          font-size: 3.5rem;
          color: #cbd5e0;
          margin-bottom: 16px;
        }

        .empty-preview-state h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .empty-preview-state p {
          margin: 6px 0 0 0;
          font-size: 0.85rem;
          max-width: 320px;
        }

        .back-subjects-btn {
          display: none; /* Only visible on mobile/tablets */
        }

        /* Loading Skeletons */
        .skeleton {
          background: #e2e8f0;
          border-radius: 4px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-card {
          pointer-events: none;
        }

        .skeleton-card .skeleton-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .skeleton-title {
          width: 200px;
          height: 28px;
          margin-bottom: 8px;
        }

        .skeleton-text {
          width: 340px;
          height: 16px;
        }

        .skeleton-title-sm {
          width: 140px;
          height: 18px;
          margin-bottom: 8px;
        }

        .skeleton-text-sm {
          width: 100px;
          height: 12px;
          margin-bottom: 12px;
        }

        .skeleton-progress {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          margin-top: auto;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        /* Modals overrides */
        .video-player-modal, .rich-text-viewer-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 2500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .split-dashboard-layout {
            grid-template-columns: 1fr;
          }

          .dashboard-sidebar-panel {
            max-height: none;
            overflow-y: visible;
          }

          .dashboard-preview-panel {
            position: relative;
            top: 0;
            max-height: none;
            overflow-y: visible;
          }

          .back-subjects-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #ffffff;
            border: 1px solid var(--border-color);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.8rem;
            color: var(--text-primary);
            cursor: pointer;
            width: fit-content;
          }

          .back-subjects-btn:hover {
            background: var(--accent-blue);
            color: #ffffff;
          }
        }

        @media (min-width: 1200px) {
          .subjects-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default StudyMaterial;