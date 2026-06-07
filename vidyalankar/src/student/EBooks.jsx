import React, { useState, useEffect } from "react";
import { config } from "../config/api";
import "./EBooks.css";

const EBooks = () => {
  const [books, setBooks] = useState([]);
  const [webResources, setWebResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch book resources
      const booksRes = await fetch(`${config.API_URL}/api/book-resources`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const booksData = await booksRes.json();

      // Fetch web resources
      const webRes = await fetch(`${config.API_URL}/api/web-resources`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const webData = await webRes.json();

      setBooks(Array.isArray(booksData) ? booksData : []);
      setWebResources(Array.isArray(webData) ? webData : []);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWebResources = webResources.filter((resource) =>
    resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayItems =
    filterType === "all"
      ? [...filteredBooks, ...filteredWebResources]
      : filterType === "books"
      ? filteredBooks
      : filteredWebResources;

  return (
    <div className="ebooks-container">
      <div className="ebooks-header">
        <div className="header-content">
          <h1>📚 E-Books & Learning Resources</h1>
          <p>Access your digital library anytime, anywhere</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search books, authors, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterType === "books" ? "active" : ""}`}
            onClick={() => setFilterType("books")}
          >
            📖 Books
          </button>
          <button
            className={`filter-btn ${filterType === "web" ? "active" : ""}`}
            onClick={() => setFilterType("web")}
          >
            🌐 Web Resources
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading resources...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && displayItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Resources Available</h3>
          <p>Check back later for new learning materials</p>
        </div>
      )}

      {!loading && !error && displayItems.length > 0 && (
        <div className="resources-grid">
          {displayItems.map((item, index) => (
            <div key={`${item._id}-${index}`} className="resource-card">
              <div className="resource-icon">
                {item.author ? "📖" : "🌐"}
              </div>
              <div className="resource-content">
                <h3 className="resource-title">{item.title}</h3>
                {item.author && (
                  <p className="resource-author">By {item.author}</p>
                )}
                {item.description && (
                  <p className="resource-description">{item.description}</p>
                )}
                {item.edition && (
                  <span className="resource-badge">Edition: {item.edition}</span>
                )}
                {item.publication && (
                  <span className="resource-badge">{item.publication}</span>
                )}
              </div>
              <div className="resource-actions">
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn primary"
                  >
                    {item.author ? "📖 Open Book" : "🌐 Visit Link"}
                  </a>
                )}
                <button className="action-btn secondary">
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Study Tips Section */}
      <div className="study-tips-section">
        <h2>💡 Study Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📝</div>
            <h3>Take Notes</h3>
            <p>Summarize key points while reading</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h3>Set Goals</h3>
            <p>Plan your study sessions effectively</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔄</div>
            <h3>Review Regularly</h3>
            <p>Revise concepts to retain better</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">👥</div>
            <h3>Study Groups</h3>
            <p>Collaborate and learn together</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EBooks;
