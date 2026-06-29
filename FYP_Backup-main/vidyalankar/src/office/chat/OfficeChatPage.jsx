import React, { useEffect, useMemo, useState } from "react";
import { config } from "../../config/api";
import "./OfficeChatPage.css";

const formatTime = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDayLabel = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isSameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const OfficeChatPage = () => {
  const role = localStorage.getItem("role") || "office";

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [composer, setComposer] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Student DM search
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentDM, setShowStudentDM] = useState(false);

  const token = localStorage.getItem("token");

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
    () =>
      conversations.find((item) => String(item._id) === String(selectedId)) ||
      null,
    [conversations, selectedId],
  );

  const departmentOptions = useMemo(() => {
    const unique = new Set(
      conversations
        .map((conversation) => String(conversation.departmentName || "").trim())
        .filter(Boolean),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [conversations]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (departmentFilter) params.set("department", departmentFilter);

      const response = await fetch(
        `${config.chat.conversations}${params.toString() ? `?${params.toString()}` : ""}`,
        { ...requestOptions, method: "GET" },
      );
      const payload = response.ok ? await response.json() : [];
      const list = Array.isArray(payload) ? payload : [];
      setConversations(list);

      if (list.length > 0 && !selectedId) {
        setSelectedId(String(list[0]._id));
      }

      if (
        selectedId &&
        !list.some((item) => String(item._id) === String(selectedId))
      ) {
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
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const response = await fetch(
        config.chat.conversationMessages(conversationId),
        {
          ...requestOptions,
          method: "GET",
        },
      );
      const payload = response.ok ? await response.json() : [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
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

  useEffect(() => {
    loadConversations();
  }, [search, departmentFilter]);

  useEffect(() => {
    loadMessages(selectedId);
  }, [selectedId]);

  // Debounce student search
  useEffect(() => {
    if (!showStudentDM) return;
    const timer = setTimeout(() => searchStudents(studentSearch), 350);
    return () => clearTimeout(timer);
  }, [studentSearch, showStudentDM]);

  // Load initial student list when panel opens
  useEffect(() => {
    if (showStudentDM && studentResults.length === 0) {
      searchStudents("");
    }
  }, [showStudentDM]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadConversations();
      if (selectedId) loadMessages(selectedId);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [selectedId, search, departmentFilter]);

  const sendMessage = async () => {
    const text = composer.trim();
    if (!text || !selectedId || sending) return;

    try {
      setSending(true);
      const response = await fetch(config.chat.messages, {
        ...requestOptions,
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedId,
          body: text,
        }),
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

  const handleStartConversationWithStudent = async (studentId) => {
    try {
      const response = await fetch(config.chat.startConversationWithStudent, {
        ...requestOptions,
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) return;
      const created = await response.json();
      await loadConversations();
      if (created?._id) {
        setSelectedId(String(created._id));
        setShowStudentDM(false);
      }
    } catch (error) {
      console.error("Failed to start conversation with student:", error);
    }
  };

  const toggleConversationState = async (action) => {
    if (!selectedId) return;
    const targetUrl =
      action === "mute"
        ? config.chat.toggleMute(selectedId)
        : config.chat.toggleArchive(selectedId);

    try {
      await fetch(targetUrl, {
        ...requestOptions,
        method: "POST",
      });
      await loadConversations();
      await loadMessages(selectedId);
    } catch (error) {
      console.error(`Failed to ${action} conversation:`, error);
    }
  };

  const messageBlocks = useMemo(() => {
    const rows = [];
    messages.forEach((message, index) => {
      const prev = messages[index - 1];
      const needsDayLabel =
        !prev || !isSameDay(prev.createdAt, message.createdAt);
      if (needsDayLabel) {
        rows.push({
          type: "day",
          id: `day-${message._id}`,
          label: formatDayLabel(message.createdAt),
        });
      }
      rows.push({ type: "message", id: message._id, payload: message });
    });
    return rows;
  }, [messages]);

  const isActiveRecently = useMemo(() => {
    if (!selectedConversation?.lastMessageAt) return false;
    return (
      Date.now() - new Date(selectedConversation.lastMessageAt).getTime() <
      5 * 60 * 1000
    );
  }, [selectedConversation]);

  return (
    <div className="office-chat-shell">
      <div className="office-chat-layout">
        {/* Left Panel: Conversation List */}
        <aside className="office-chat-list-panel">
          <div className="office-chat-panel-head">
            <h2>Messages</h2>
            <span>{conversations.length} chats</span>
          </div>

          <div className="office-chat-toolbar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
            />
            {departmentOptions.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All departments</option>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="office-new-dm-btn"
              onClick={() => setShowStudentDM((prev) => !prev)}
            >
              {showStudentDM ? "✕ Close" : "✉ Message Student"}
            </button>
          </div>

          {/* Student search DM panel */}
          {showStudentDM && (
            <div className="office-student-dm-panel">
              <div className="office-student-dm-head">Message a Student</div>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name, roll no, enrollment no…"
                className="office-student-dm-input"
              />
              <div className="office-student-dm-list">
                {loadingStudents ? (
                  <div className="office-student-dm-status">
                    <div className="office-chat-spinner small" /> Searching…
                  </div>
                ) : studentResults.length === 0 ? (
                  <div className="office-student-dm-status">No students found.</div>
                ) : (
                  studentResults.map((student) => (
                    <button
                      key={student.id}
                      className="office-student-dm-item"
                      onClick={() => handleStartConversationWithStudent(student.id)}
                      type="button"
                    >
                      <div className="office-student-dm-avatar">
                        {(student.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="office-student-dm-info">
                        <strong>{student.name}</strong>
                        <span>Roll: {student.rollNo} · {student.batch}{student.division ? ` · Div ${student.division}` : ""}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="office-conversation-list">
            {loadingConversations ? (
              <div className="office-chat-empty">
                <div className="office-chat-spinner" />
                Loading conversations…
              </div>
            ) : conversations.length === 0 ? (
              <div className="office-chat-empty">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 40, height: 40, marginBottom: 8, opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  className={`office-conversation-item ${String(conversation._id) === String(selectedId) ? "active" : ""}`}
                  onClick={() => setSelectedId(String(conversation._id))}
                  type="button"
                >
                  <div className="office-conv-avatar">
                    {(conversation.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="office-conv-info">
                    <div className="office-conv-row-top">
                      <strong>{conversation.displayName}</strong>
                      <span>{formatTime(conversation.lastMessageAt)}</span>
                    </div>
                    <div className="office-conv-row-bottom">
                      <p>{conversation.lastMessage || "No messages yet"}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="office-unread-dot" title="Unread messages">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right Panel: Chat Window */}
        <section className="office-chat-window-panel">
          {selectedConversation ? (
            <>
              <header className="office-chat-window-head">
                <div className="office-chat-head-info">
                  <div className="office-chat-head-avatar">
                    {(selectedConversation.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>
                      {selectedConversation.displayName}
                      {selectedConversation.departmentName
                        ? ` — ${selectedConversation.departmentName}`
                        : ""}
                    </h3>
                    <p className={isActiveRecently ? "status-online" : "status-offline"}>
                      {isActiveRecently ? "● Online" : "● Offline"}
                    </p>
                  </div>
                </div>
                <div className="office-chat-window-actions">
                  <button
                    type="button"
                    onClick={() => toggleConversationState("mute")}
                    title="Mute conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleConversationState("archive")}
                    title="Archive conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Archive
                  </button>
                </div>
              </header>

              <div className="office-message-feed" role="log" aria-live="polite">
                {loadingMessages ? (
                  <div className="office-chat-empty">
                    <div className="office-chat-spinner" />
                    Loading messages…
                  </div>
                ) : messageBlocks.length === 0 ? (
                  <div className="office-chat-empty">Start the conversation.</div>
                ) : (
                  messageBlocks.map((block) => {
                    if (block.type === "day") {
                      return (
                        <div key={block.id} className="office-day-separator">
                          <span>{block.label}</span>
                        </div>
                      );
                    }

                    const message = block.payload;
                    const own = message.senderRole === role;
                    const seen =
                      Array.isArray(message.seenBy) &&
                      message.seenBy.length > 1;

                    return (
                      <div
                        key={block.id}
                        className={`office-message-row ${own ? "outgoing" : "incoming"}`}
                      >
                        <div className="office-message-meta-name">
                          {own
                            ? "You"
                            : `${message.senderName || selectedConversation.displayName}:`}
                        </div>
                        <div className="office-message-bubble">{message.body}</div>
                        <div className="office-message-meta-time">
                          {formatTime(message.createdAt)}
                          {own ? ` · ${seen ? "Seen" : "Delivered"}` : ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="office-composer-box">
                <button
                  type="button"
                  className="office-attach-btn"
                  title="Attachments coming soon"
                  disabled
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="office-send-btn"
                  onClick={sendMessage}
                  disabled={sending || !composer.trim()}
                >
                  {sending ? (
                    <div className="office-chat-spinner small" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="office-chat-window-empty">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" style={{ width: 64, height: 64, opacity: 0.25, marginBottom: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <h3>Select a conversation</h3>
              <p>Choose a chat from the left panel to start messaging.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OfficeChatPage;
