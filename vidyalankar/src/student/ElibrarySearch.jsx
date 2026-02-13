import React, { useState } from "react";
import "./StudentComponents.css";
import { elibraryService } from "./services/api";

const ElibrarySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const results = await elibraryService.searchResources(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "book": return "bi-book";
      case "journal": return "bi-journal";
      case "article": return "bi-file-earmark-text";
      case "video": return "bi-camera-video";
      default: return "bi-file";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "book": return "#4f46e5";
      case "journal": return "#10b981";
      case "article": return "#f59e0b";
      case "video": return "#ef4444";
      default: return "#64748b";
    }
  };

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>E-library Search</h1>
        <p>Search for books, journals, and other academic resources</p>
      </div>
      
      <div className="search-section">
        <div className="search-container" style={{ marginBottom: "30px", width: "100%", maxWidth: "600px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
            <input 
              type="text" 
              placeholder="Enter book title, author, or subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 15px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "1rem"
              }}
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                backgroundColor: loading ? "#94a3b8" : "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500"
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
        
        {error && (
          <div className="error-container" style={{ marginBottom: "20px" }}>
            <i className="bi bi-exclamation-triangle"></i>
            <p>{error}</p>
          </div>
        )}
        
        {searchResults.length > 0 ? (
          <div className="search-results">
            <h2>Search Results ({searchResults.length})</h2>
            <div className="results-grid">
              {searchResults.map((result) => (
                <div key={result._id || result.id} className="result-card">
                  <div className="result-icon" style={{ color: getTypeColor(result.type) }}>
                    <i className={`bi ${getTypeIcon(result.type)}`}></i>
                  </div>
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p className="result-author">by {result.author}</p>
                    <div className="result-meta">
                      <span className="result-type" style={{ 
                        backgroundColor: `${getTypeColor(result.type)}20`, 
                        color: getTypeColor(result.type) 
                      }}>
                        {result.type}
                      </span>
                      <span className="result-subject">{result.subject}</span>
                    </div>
                  </div>
                  <div className="result-actions">
                    <button className="view-btn">
                      <i className="bi bi-eye"></i> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !loading && searchQuery ? (
          <div className="no-results">
            <i className="bi bi-search"></i>
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="content-placeholder">
            <i className="bi bi-search"></i>
            <h3>Search Resources</h3>
            <p>Use the search bar above to find books, journals, and other academic materials.</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .search-results h2 {
          color: #2d3748;
          margin-bottom: 20px;
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .result-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .result-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        }
        
        .result-icon {
          font-size: 2rem;
        }
        
        .result-info {
          flex: 1;
        }
        
        .result-info h3 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .result-author {
          margin: 0 0 10px 0;
          color: #718096;
          font-size: 0.9rem;
        }
        
        .result-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .result-type {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .result-subject {
          color: #718096;
          font-size: 0.85rem;
        }
        
        .result-actions .view-btn {
          padding: 8px 15px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .result-actions .view-btn:hover {
          background-color: #4338ca;
        }
        
        @media (max-width: 768px) {
          .results-grid {
            grid-template-columns: 1fr;
          }
          
          .result-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ElibrarySearch;