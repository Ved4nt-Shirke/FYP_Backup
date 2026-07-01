import React, { useState, useEffect, useRef } from "react";
import { CiaanUtils } from "../../utils/ciannUtils";

const CiaanCommentsSection = ({ isOpen, onClose, CiaanId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const fetchComments = async () => {
    if (!CiaanId) return;
    try {
      const Ciaan = await CiaanUtils.fetchCiaanById(CiaanId);
      setComments(Ciaan.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  useEffect(() => {
    if (isOpen && CiaanId) {
      setLoading(true);
      fetchComments().finally(() => setLoading(false));

      // Polling for new comments every 8 seconds when open
      const interval = setInterval(fetchComments, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, CiaanId]);

  useEffect(() => {
    // Scroll to bottom when comments list updates
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !CiaanId) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await CiaanUtils.addComment(CiaanId, newComment.trim());
      if (result.success) {
        setComments(result.comments || []);
        setNewComment("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (username) => {
    if (!username) return "?";
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {isOpen && <div className="Ciaan-comments-drawer-overlay" onClick={onClose}></div>}
      <div className={`Ciaan-comments-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="Ciaan-comments-header">
          <h5 className="Ciaan-comments-title">
            <i className="bi bi-chat-left-text-fill text-info"></i>
            Ciaan Discussion
          </h5>
          <button type="button" className="Ciaan-comments-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* List of comments */}
        <div className="Ciaan-comments-list" ref={listRef}>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info"></div>
              <p className="text-muted mt-2">Loading discussions...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={comment._id || index} className="Ciaan-comment-item">
                <div className="Ciaan-comment-avatar">
                  {getInitials(comment.username)}
                </div>
                <div className="Ciaan-comment-content">
                  <div className="Ciaan-comment-author-info">
                    <span className="Ciaan-comment-author">{comment.username}</span>
                    <span className="Ciaan-comment-time">
                      {newComment ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="Ciaan-comment-text">{comment.comment}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="Ciaan-comments-empty">
              <i className="bi bi-chat-square-dots text-muted" style={{ fontSize: "2rem" }}></i>
              <p className="mt-2 mb-0">No comments posted yet.</p>
              <small className="text-muted">Start the discussion with other co-faculty and collaborators!</small>
            </div>
          )}
        </div>

        {/* Footer form */}
        <div className="Ciaan-comments-footer">
          {error && <div className="text-danger small mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="Ciaan-comment-form">
            <textarea
              className="Ciaan-comment-input"
              placeholder="Write a message to collaborators..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              maxLength={400}
            />
            <button
              type="submit"
              className="Ciaan-comment-submit-btn"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i> Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CiaanCommentsSection;
