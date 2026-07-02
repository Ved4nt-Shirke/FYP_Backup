import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { config } from "../config/api";
import PDFViewer from "../basic/PDFViewer";
import "./StudentELibrary.css";

const StudentELibrary = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [error, setError] = useState("");

  const fileBaseUrl = config.apiBaseUrl.replace("/api", "");

  useEffect(() => {
    fetchMyEbooks();
  }, []);

  const fetchMyEbooks = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(config.ebooks, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setEbooks(data.ebooks || []);
      } else {
        setError(data.message || "Failed to load library resources");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch library resources from server");
    } finally {
      setLoading(false);
    }
  };

  const filteredEbooks = ebooks.filter((book) => {
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.authors.some((a) => a.toLowerCase().includes(q)) ||
      (book.publicationName && book.publicationName.toLowerCase().includes(q)) ||
      book.domains.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="student-elibrary-container animate-fadeIn">
      {/* Header block */}
      <div className="student-elibrary-header">
        <h1 className="student-elibrary-title">VP E-Library</h1>
        <p className="student-elibrary-subtitle">
          Access digital textbooks, reference books, and journals mapped to your curriculum.
        </p>
      </div>

      {error && <div className="student-alert error">{error}</div>}

      {/* Search block */}
      <div className="student-search-bar-row">
        <input
          type="text"
          placeholder="Search eBooks by title, author, domain, subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="student-search-input"
        />
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="student-loading-wrapper">
          <div className="student-loading-ring" />
          <span>Loading E-Books...</span>
        </div>
      ) : filteredEbooks.length === 0 ? (
        <div className="student-empty-state">
          <h3>No E-Books Available</h3>
          <p>No digital resources have been mapped to your division/semester yet.</p>
        </div>
      ) : (
        <div className="student-ebooks-grid">
          {filteredEbooks.map((book) => (
            <div key={book._id} className="student-ebook-card">
              <div className="student-ebook-cover-wrapper">
                {book.coverImagePath ? (
                  <img
                    src={`${fileBaseUrl}/${book.coverImagePath}`}
                    alt={book.title}
                    className="student-ebook-cover-img"
                  />
                ) : (
                  <div className="student-ebook-cover-placeholder">
                    <span>📖</span>
                    <small>No Cover Image</small>
                  </div>
                )}
                <button
                  className="student-read-btn"
                  onClick={() => setSelectedBook(book)}
                >
                  Quick Read
                </button>
              </div>
              <div className="student-ebook-info">
                <h3 className="student-ebook-title" title={book.title}>
                  {book.title}
                </h3>
                <p className="student-ebook-authors">
                  By {book.authors.join(", ") || "Unknown"}
                </p>
                {book.publicationName && (
                  <p className="student-ebook-pub">{book.publicationName}</p>
                )}
                {book.domains && book.domains.length > 0 && (
                  <div className="student-ebook-domains">
                    {book.domains.slice(0, 2).map((d, i) => (
                      <span key={i} className="student-domain-pill">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF View Modal Overlay */}
      {selectedBook && createPortal(
        <div className="elibrary-preview-overlay" onContextMenu={(e) => e.preventDefault()}>
          {/* Top Header Bar */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "56px",
            backgroundColor: "#1e293b",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            zIndex: 100000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontFamily: "Inter, sans-serif"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "20px" }}>📖</span>
              <span style={{ fontWeight: 600, fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedBook.title}
              </span>
            </div>
            <button
              onClick={() => setSelectedBook(null)}
              style={{
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px 8px",
                lineHeight: 1,
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "white"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              ✕
            </button>
          </div>
          
          {/* PDF Viewer container with top padding to clear the header */}
          <div style={{ width: "100%", height: "100%", paddingTop: "56px", boxSizing: "border-box" }}>
            <PDFViewer
              url={`${fileBaseUrl}/${selectedBook.filePath}`}
              title={selectedBook.title}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentELibrary;
