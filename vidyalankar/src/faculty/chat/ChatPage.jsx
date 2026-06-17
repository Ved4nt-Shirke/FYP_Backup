import React, { useEffect, useMemo, useState } from "react";
import { config } from "../../config/api";
import "./ChatPage.css";

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
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [facultyDirectory, setFacultyDirectory] = useState([]);
  const [facultySearch, setFacultySearch] = useState("");

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

  const filteredFaculty = useMemo(() => {
    const query = facultySearch.trim().toLowerCase();
    if (!query) return facultyDirectory;
    return facultyDirectory.filter((item) => {
      const hay =
        `${item.name} ${item.username} ${item.department}`.toLowerCase();
      return hay.includes(query);
    });
  }, [facultyDirectory, facultySearch]);

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

  const loadFacultyDirectory = async () => {
    if (!isStudent) return;

    try {
      const response = await fetch(config.chat.facultyList, {
        ...requestOptions,
        method: "GET",
      });
      const payload = response.ok ? await response.json() : [];
      setFacultyDirectory(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to load faculty directory:", error);
      setFacultyDirectory([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [search, departmentFilter]);

  useEffect(() => {
    loadFacultyDirectory();
  }, []);

  useEffect(() => {
    const activeConversationId = selectedId;
    loadMessages(activeConversationId);
  }, [selectedId]);

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

  const handleStartConversation = async (facultyId) => {
    try {
      const response = await fetch(config.chat.startConversation, {
        ...requestOptions,
        method: "POST",
        body: JSON.stringify({ facultyId }),
      });

      if (!response.ok) return;
      const created = await response.json();
      await loadConversations();
      if (created?._id) {
        setSelectedId(String(created._id));
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
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
    <div className="chat-page-shell">
      <div className="chat-layout">
        <aside className="chat-list-panel">
          <div className="chat-panel-head">
            <h2>Messages</h2>
            <span>{conversations.length} chats</span>
          </div>

          <div className="chat-toolbar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
            />
            {isFaculty && (
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
          </div>

          {isStudent && (
            <div className="faculty-directory-card">
              <div className="faculty-directory-head">Start New Chat</div>
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name"
              />
              <div className="faculty-directory-list">
                {filteredFaculty.map((faculty) => (
                  <button
                    key={faculty.id}
                    className="faculty-directory-item"
                    onClick={() => handleStartConversation(faculty.id)}
                    type="button"
                  >
                    <strong>{faculty.name}</strong>
                    <span>{faculty.department || "Department"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="conversation-list">
            {loadingConversations ? (
              <div className="chat-empty">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="chat-empty">No conversations yet.</div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  className={`conversation-item ${String(conversation._id) === String(selectedId)
                      ? "active"
                      : ""
                    }`}
                  onClick={() => setSelectedId(String(conversation._id))}
                  type="button"
                >
                  <div className="conversation-row-top">
                    <strong>{conversation.displayName}</strong>
                    <span>{formatTime(conversation.lastMessageAt)}</span>
                  </div>
                  <div className="conversation-row-bottom">
                    <p>{conversation.lastMessage || "No messages yet"}</p>
                    {conversation.unreadCount > 0 && (
                      <span className="unread-dot" title="Unread messages">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="chat-window-panel">
          {selectedConversation ? (
            <>
              <header className="chat-window-head">
                <div>
                  <h3>
                    {selectedConversation.displayName}
                    {selectedConversation.departmentName
                      ? ` - ${selectedConversation.departmentName}`
                      : ""}
                  </h3>
                  <p>{isActiveRecently ? "Online" : "Offline"}</p>
                </div>
                <div className="chat-window-actions">
                  <button
                    type="button"
                    onClick={() => toggleConversationState("mute")}
                  >
                    Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleConversationState("archive")}
                  >
                    Archive
                  </button>
                </div>
              </header>

              <div className="message-feed" role="log" aria-live="polite">
                {loadingMessages ? (
                  <div className="chat-empty">Loading messages...</div>
                ) : messageBlocks.length === 0 ? (
                  <div className="chat-empty">Start the conversation.</div>
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
                    const seen =
                      Array.isArray(message.seenBy) &&
                      message.seenBy.length > 1;

                    return (
                      <div
                        key={block.id}
                        className={`message-row ${own ? "outgoing" : "incoming"}`}
                      >
                        <div className="message-meta-name">
                          {own
                            ? "You"
                            : `${message.senderName || selectedConversation.displayName}:`}
                        </div>
                        <div className="message-bubble">{message.body}</div>
                        <div className="message-meta-time">
                          {formatTime(message.createdAt)}
                          {own ? ` - ${seen ? "Seen" : "Delivered"}` : ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="composer-box">
                <button
                  type="button"
                  className="attach-btn"
                  title="Attachments coming soon"
                  disabled
                >
                  <i className="bi bi-paperclip"></i>
                </button>
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Type message..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                ></textarea>
                <button
                  type="button"
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={sending}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="chat-window-empty">
              <h3>Select a conversation</h3>
              <p>
                {isStudent
                  ? "Start by selecting faculty from the list on the left."
                  : "Open a student conversation from the left panel."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
