// src/components/SearchResults.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { performSearch, handleSearchResultClick } from '../utils/searchUtils';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setIsLoading(true);
      performSearch(query)
        .then(setResults)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleResultClick = (result) => {
    handleSearchResultClick(result, navigate);
  };

  // Group results by category
  const groupedResults = results.reduce((groups, result) => {
    const category = result.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(result);
    return groups;
  }, {});

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <div className="search-results-header">
          <h2>Search Results</h2>
          {query && (
            <p className="search-query">
              Results for: <strong>"{query}"</strong>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="search-loading-page">
            <div className="loading-spinner"></div>
            <p>Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="search-results-content">
            {Object.entries(groupedResults).map(([category, categoryResults]) => (
              <div key={category} className="search-category-section">
                <h3 className="category-title">{category}</h3>
                <div className="category-results">
                  {categoryResults.map((result) => (
                    <div
                      key={result.id}
                      className="search-result-card"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="result-card-title">{result.title}</div>
                      {result.subtitle && (
                        <div className="result-card-subtitle">{result.subtitle}</div>
                      )}
                      <div className="result-card-category">{result.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No results found</h3>
            <p>No results found for "{query}". Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <div className="search-instructions">
            <div className="instructions-icon">💡</div>
            <h3>Start searching</h3>
            <p>Enter at least 2 characters to search for students, attendance records, or navigation items.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
