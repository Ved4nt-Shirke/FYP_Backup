import React, { useEffect, useMemo, useRef, useState } from "react";
import { config } from "../../config/api";
import "./ChatPage.css";

const formatTime = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const formatDayLabel = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const isSameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase() || "?";
};

const AVATAR_PALETTE = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
const getAvatarColor = (name = "") => {
  let hash = 0;
  for (const c of String(name)) hash = (hash << 5) - hash + c.charCodeAt(0);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const ChatPage = () => {
  const role = localStorage.getItem("role") || "faculty";
  const isFaculty = role === "faculty" || role === "hod" || role === "academic_coordinator";
  const isStudent = role === "student";

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [composer, setComposer] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [facultyDirectory, setFacultyDirectory] = useState([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  // Student DM — for faculty/office to message students
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentDM, setShowStudentDM] = useState(false);

  const token = localStorage.getItem("token");
  const feedRef = useRef(null);

  const requestOptions = useMemo(
    () => ({
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  const selectedConversation = useMemo(
    () => conversations.find((item) => String(item._id) === String(selectedId)) || null,
    [conversations, selectedId],
  );

  const departmentOptions = useMemo(() => {
    const unique = new Set(
      conversations.map((c) => String(c.departmentName || "").trim()).filter(Boolean),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [conversations]);

  const filteredFaculty = useMemo(() => {
    const query = facultySearch.trim().toLowerCase();
    if (!query) return facultyDirectory;
    return facultyDirectory.filter((item) =>
      `${item.name} ${item.username} ${item.department}`.toLowerCase().includes(query),
    );
  }, [facultyDirectory, facultySearch]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (departmentFilter) params.set("department", departmentFilter);
      if (showArchived) params.set("includeArchived", "true");

      const response = await fetch(
        `${config.chat.conversations}${params.toString() ? `?${params.toString()}` : ""}`,
        { ...requestOptions, method: "GET" },
      );
      const payload = response.ok ? await response.json() : [];
      const list = Array.isArray(payload) ? payload : [];
      setConversations(list);
      if (list.length > 0 && !selectedId) setSelectedId(String(list[0]._id));
      if (selectedId && !list.some((item) => String(item._id) === String(selectedId))) {
        setSelectedId(list[0]?._id ? String(list[0]._id) : "");
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) { setMessages([]); return; }
    try {
      setLoadingMessages(true);
      const response = await fetch(config.chat.conversationMessages(conversationId), {
        ...requestOptions, method: "GET",
      });
      const payload = response.ok ? await response.json() : [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadFacultyDirectory = async () => {
    if (!isStudent) return;
    try {
      const response = await fetch(config.chat.facultyList, { ...requestOptions, method: "GET" });
      const payload = response.ok ? await response.json() : [];
      setFacultyDirectory(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to load faculty directory:", error);
      setFacultyDirectory([]);
    }
  };

  const searchStudents = async (query) => {
    try {
      setLoadingStudents(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      const response = await fetch(
        `${config.chat.studentList}${params.toString() ? `?${params.toString()}` : ""}`,
        { ...requestOptions, method: "GET" },
      );
      const payload = response.ok ? await response.json() : [];
      setStudentResults(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to search students:", error);
      setStudentResults([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => { loadConversations(); }, [search, departmentFilter, showArchived]);
  useEffect(() => { loadFacultyDirectory(); }, []);
  useEffect(() => {
    if (!showStudentDM) return;
    const timer = setTimeout(() => searchStudents(studentSearch), 350);
    return () => clearTimeout(timer);
  }, [studentSearch, showStudentDM]);
  useEffect(() => {
    if (showStudentDM && studentResults.length === 0) searchStudents("");
  }, [showStudentDM]);
  useEffect(() => { loadMessages(selectedId); }, [selectedId]);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      loadConversations();
      if (selectedId) loadMessages(selectedId);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [selectedId, search, departmentFilter, showArchived]);

  const sendMessage = async () => {
    const text = composer.trim();
    if (!text || !selectedId || sending) return;
    try {
      setSending(true);
      const response = await fetch(config.chat.messages, {
        ...requestOptions, method: "POST",
        body: JSON.stringify({ conversationId: selectedId, body: text }),
      });
      if (!response.ok) return;
      setComposer("");
      await loadMessages(selectedId);
      await loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (facultyId) => {
    try {
      const response = await fetch(config.chat.startConversation, {
        ...requestOptions, method: "POST",
        body: JSON.stringify({ facultyId }),
      });
      if (!response.ok) return;
      const created = await response.json();
      await loadConversations();
      if (created?._id) { setSelectedId(String(created._id)); setShowNewChat(false); }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleStartConversationWithStudent = async (studentId) => {
    try {
      const response = await fetch(config.chat.startConversationWithStudent, {
        ...requestOptions, method: "POST",
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) return;
      const created = await response.json();
      await loadConversations();
      if (created?._id) { setSelectedId(String(created._id)); setShowStudentDM(false); }
    } catch (error) {
      console.error("Failed to start conversation with student:", error);
    }
  };

  const toggleConversationState = async (action) => {
    if (!selectedId) return;
    const targetUrl = action === "mute" ? config.chat.toggleMute(selectedId) : config.chat.toggleArchive(selectedId);
    try {
      await fetch(targetUrl, { ...requestOptions, method: "POST" });
      await loadConversations();
    } catch (error) {
      console.error(`Failed to ${action} conversation:`, error);
    }
  };

  const messageBlocks = useMemo(() => {
    const rows = [];
    messages.forEach((message, index) => {
      const prev = messages[index - 1];
      const needsDayLabel = !prev || !isSameDay(prev.createdAt, message.createdAt);
      if (needsDayLabel) rows.push({ type: "day", id: `day-${message._id}`, label: formatDayLabel(message.createdAt) });
      rows.push({ type: "message", id: message._id, payload: message });
    });
    return rows;
  }, [messages]);

  const isActiveRecently = useMemo(() => {
    if (!selectedConversation?.lastMessageAt) return false;
    return Date.now() - new Date(selectedConversation.lastMessageAt).getTime() < 5 * 60 * 1000;
  }, [selectedConversation]);

  return (
    <div className="chat-page-shell">
      <div className="chat-layout">
        {/* ── Sidebar ── */}
        <aside className="chat-list-panel">
          {/* Header */}
          <div className="chat-panel-head">
            <div className="chat-panel-head-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-panel-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <h2>Messages</h2>
            </div>
            <div className="chat-panel-head-right">
              <span className="chat-count-badge">{conversations.length}</span>
              {/* Archive toggle */}
              <button
                type="button"
                className={`archive-toggle-btn ${showArchived ? "active" : ""}`}
                onClick={() => setShowArchived((prev) => !prev)}
                title={showArchived ? "Hide archived" : "Show archived chats"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {showArchived ? "Live" : "Archive"}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="chat-search-bar">
            <div className="chat-search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
              />
              {search && (
                <button type="button" className="chat-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            {isFaculty && departmentOptions.length > 0 && (
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="">All departments</option>
                {departmentOptions.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            )}
          </div>

          {/* Action buttons row */}
          <div className="chat-action-row">
            {isStudent && (
              <button
                type="button"
                className={`chat-action-btn primary ${showNewChat ? "active" : ""}`}
                onClick={() => setShowNewChat((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {showNewChat ? "Close" : "New Chat"}
              </button>
            )}
            {isFaculty && (
              <button
                type="button"
                className={`chat-action-btn primary ${showStudentDM ? "active" : ""}`}
                onClick={() => setShowStudentDM((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {showStudentDM ? "Close" : "Message Student"}
              </button>
            )}
          </div>

          {/* Student: Faculty directory */}
          {isStudent && showNewChat && (
            <div className="directory-panel">
              <div className="directory-panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Start New Chat
              </div>
              <div className="directory-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dir-search-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                <input
                  type="text"
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                  placeholder="Search faculty by name…"
                />
              </div>
              <div className="directory-list">
                {filteredFaculty.length === 0 ? (
                  <div className="directory-empty">No faculty found.</div>
                ) : (
                  filteredFaculty.map((faculty) => (
                    <button
                      key={faculty.id}
                      className="directory-item"
                      onClick={() => handleStartConversation(faculty.id)}
                      type="button"
                    >
                      <div className="dir-avatar" style={{ background: getAvatarColor(faculty.name) }}>
                        {getInitials(faculty.name)}
                      </div>
                      <div className="dir-info">
                        <strong>{faculty.name}</strong>
                        <span>{faculty.department || "Faculty"}</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dir-arrow">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Faculty/Office: Student DM panel */}
          {isFaculty && showStudentDM && (
            <div className="directory-panel">
              <div className="directory-panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                Message a Student
              </div>
              <div className="directory-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dir-search-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Name, roll no, or enrollment no…"
                />
              </div>
              <div className="directory-list">
                {loadingStudents ? (
                  <div className="directory-empty">
                    <span className="dir-spinner" /> Searching…
                  </div>
                ) : studentResults.length === 0 ? (
                  <div className="directory-empty">No students found.</div>
                ) : (
                  studentResults.map((student) => (
                    <button
                      key={student.id}
                      className="directory-item"
                      onClick={() => handleStartConversationWithStudent(student.id)}
                      type="button"
                    >
                      <div className="dir-avatar" style={{ background: getAvatarColor(student.name) }}>
                        {getInitials(student.name)}
                      </div>
                      <div className="dir-info">
                        <strong>{student.name}</strong>
                        <span>Roll: {student.rollNo} · {student.batch}{student.division ? ` · Div ${student.division}` : ""}</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dir-arrow">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Conversation list */}
          <div className="conversation-list">
            {loadingConversations ? (
              <div className="chat-list-loading">
                {[1, 2, 3].map((i) => <div key={i} className="conv-skeleton" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="chat-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="chat-empty-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <p>{showArchived ? "No archived conversations." : "No conversations yet."}</p>
                {isStudent && !showArchived && (
                  <button type="button" className="chat-empty-action" onClick={() => setShowNewChat(true)}>
                    Start a conversation
                  </button>
                )}
              </div>
            ) : (
              conversations.map((conversation) => {
                const avatarName = conversation.displayName || "?";
                return (
                  <button
                    key={conversation._id}
                    className={`conversation-item ${String(conversation._id) === String(selectedId) ? "active" : ""}`}
                    onClick={() => setSelectedId(String(conversation._id))}
                    type="button"
                  >
                    <div className="conv-avatar" style={{ background: getAvatarColor(avatarName) }}>
                      {getInitials(avatarName)}
                      {isActiveRecently && String(conversation._id) === String(selectedId) && (
                        <span className="conv-online-dot" />
                      )}
                    </div>
                    <div className="conv-content">
                      <div className="conv-top">
                        <strong className="conv-name">{conversation.displayName}</strong>
                        <span className="conv-time">{formatTime(conversation.lastMessageAt)}</span>
                      </div>
                      <div className="conv-bottom">
                        <p className="conv-preview">
                          {conversation.lastSenderRole === role && <span className="you-label">You: </span>}
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>
                        )}
                        {conversation.isMuted && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="muted-icon">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.78 9.22a5.25 5.25 0 010 5.56M19.04 7.97a7.5 7.5 0 010 8.06" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Window ── */}
        <section className="chat-window-panel">
          {selectedConversation ? (
            <>
              <header className="chat-window-head">
                <div className="chat-window-contact">
                  <div
                    className="chat-window-avatar"
                    style={{ background: getAvatarColor(selectedConversation.displayName) }}
                  >
                    {getInitials(selectedConversation.displayName)}
                  </div>
                  <div>
                    <h3>
                      {selectedConversation.displayName}
                      {selectedConversation.departmentName ? (
                        <span className="dept-badge">{selectedConversation.departmentName}</span>
                      ) : null}
                    </h3>
                    <p className={`status-indicator ${isActiveRecently ? "online" : ""}`}>
                      <span className="status-dot" />
                      {isActiveRecently ? "Active recently" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="chat-window-actions">
                  <button
                    type="button"
                    className={`action-chip ${selectedConversation.isMuted ? "active" : ""}`}
                    onClick={() => toggleConversationState("mute")}
                    title={selectedConversation.isMuted ? "Unmute" : "Mute notifications"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      {selectedConversation.isMuted
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      }
                    </svg>
                    {selectedConversation.isMuted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    className="action-chip danger"
                    onClick={() => toggleConversationState("archive")}
                    title="Archive this conversation"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Archive
                  </button>
                </div>
              </header>

              <div className="message-feed" ref={feedRef} role="log" aria-live="polite">
                {loadingMessages ? (
                  <div className="msg-loading">
                    <span className="dir-spinner" /> Loading messages…
                  </div>
                ) : messageBlocks.length === 0 ? (
                  <div className="msg-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                    </svg>
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messageBlocks.map((block) => {
                    if (block.type === "day") {
                      return (
                        <div key={block.id} className="day-separator">
                          <span>{block.label}</span>
                        </div>
                      );
                    }
                    const message = block.payload;
                    const own = message.senderRole === role;
                    const seen = Array.isArray(message.seenBy) && message.seenBy.length > 1;
                    return (
                      <div key={block.id} className={`message-row ${own ? "outgoing" : "incoming"}`}>
                        {!own && (
                          <div className="msg-avatar" style={{ background: getAvatarColor(message.senderName) }}>
                            {getInitials(message.senderName || selectedConversation.displayName)}
                          </div>
                        )}
                        <div className="message-content">
                          {!own && (
                            <div className="message-sender-name">
                              {message.senderName || selectedConversation.displayName}
                            </div>
                          )}
                          <div className="message-bubble">{message.body}</div>
                          <div className="message-meta">
                            <span>{formatTime(message.createdAt)}</span>
                            {own && (
                              <span className={`msg-status ${seen ? "seen" : "delivered"}`}>
                                {seen ? (
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 12.75l6 6 9-13.5" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                                {seen ? "Seen" : "Delivered"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="composer-box">
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                />
                <button
                  type="button"
                  className={`send-btn ${sending ? "sending" : ""}`}
                  onClick={sendMessage}
                  disabled={sending || !composer.trim()}
                >
                  {sending ? (
                    <span className="send-spinner" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="chat-window-empty">
              <div className="chat-empty-illustration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="72" height="72">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3>Your Messages</h3>
              <p>
                {isStudent
                  ? "Select a conversation or start chatting with your faculty."
                  : "Select a student conversation from the left panel."}
              </p>
              {isStudent && (
                <button type="button" className="chat-empty-action" onClick={() => setShowNewChat(true)}>
                  Start a new chat
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
