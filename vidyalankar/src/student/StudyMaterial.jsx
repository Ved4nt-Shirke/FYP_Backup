import React, { useState, useEffect } from "react";
import "./StudentComponents.css";
import { studyMaterialsService } from "./services/api";

const StudyMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await studyMaterialsService.getMaterials();
      setMaterials(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch study materials:", err);
      setError("Failed to load study materials. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Notes": return "bi-journal-text";
      case "Assignment": return "bi-card-checklist";
      case "Question Bank": return "bi-question-circle";
      case "Lab Manual": return "bi-beaker";
      case "Reference": return "bi-book";
      case "Presentation": return "bi-easel";
      default: return "bi-file";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Notes": return "#2563eb";
      case "Assignment": return "#7c3aed";
      case "Question Bank": return "#059669";
      case "Lab Manual": return "#ea580c";
      case "Reference": return "#1d4ed8";
      case "Presentation": return "#db2777";
      default: return "#64748b";
    }
  };

  const handleDownload = async (materialId) => {
    try {
      const blob = await studyMaterialsService.downloadMaterial(materialId);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      console.error("Failed to download material:", err);
      setError("Failed to open material. Please try again.");
    }
  };

  const handleOpenMaterial = async (material) => {
    if (material.resourceType === "link" && material.externalUrl) {
      window.open(material.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    await handleDownload(material._id || material.id);
  };

  // Filter materials based on search term and type filter
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (material.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.course || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || material.category === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading study materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-content-container">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchMaterials}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Study Material</h1>
        <p>Access your course materials, notes, and resources</p>
      </div>
      
      <div className="materials-section">
        <div className="section-header">
          <h2>Available Materials</h2>
          <div className="search-filter">
            <input 
              type="text" 
              placeholder="Search materials..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Notes">Notes</option>
              <option value="Assignment">Assignment</option>
              <option value="Question Bank">Question Bank</option>
              <option value="Lab Manual">Lab Manual</option>
              <option value="Reference">Reference</option>
              <option value="Presentation">Presentation</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        
        {filteredMaterials.length === 0 ? (
          <div className="no-results">
            <i className="bi bi-file-earmark-text"></i>
            <p>No study materials found matching your criteria</p>
          </div>
        ) : (
          <div className="materials-grid">
            {filteredMaterials.map((material) => (
              <div key={material._id || material.id} className="material-card">
                <div className="material-icon" style={{ color: getTypeColor(material.type) }}>
                  <i className={`bi ${getTypeIcon(material.type)}`}></i>
                </div>
                <div className="material-info">
                  <h3>{material.title}</h3>
                  <div className="material-meta">
                    <span className="material-type" style={{ backgroundColor: `${getTypeColor(material.category)}20`, color: getTypeColor(material.category) }}>
                      {material.category}
                    </span>
                    <span className="material-size">{material.size}</span>
                    <span className="material-date">{new Date(material.date).toLocaleDateString()}</span>
                    <span className="material-subject">{material.subject || "General"}</span>
                    {material.course ? <span className="material-subject">{material.course}</span> : null}
                    {material.division ? <span className="material-subject">{material.division}</span> : null}
                  </div>
                </div>
                <div className="material-actions">
                  <button className="download-btn" onClick={() => handleOpenMaterial(material)}>
                    <i className={`bi ${material.resourceType === "link" ? "bi-box-arrow-up-right" : "bi-download"}`}></i>
                    {material.resourceType === "link" ? " Open Link" : " Open File"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .section-header h2 {
          margin: 0;
          color: #2d3748;
        }
        
        .search-filter {
          display: flex;
          gap: 10px;
        }
        
        .search-input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.95rem;
        }
        
        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .material-card {
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
        
        .material-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        }
        
        .material-icon {
          font-size: 2rem;
        }
        
        .material-info {
          flex: 1;
        }
        
        .material-info h3 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .material-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .material-type {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .material-size, .material-date, .material-subject {
          color: #718096;
          font-size: 0.85rem;
        }
        
        .material-actions .download-btn {
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
        
        .material-actions .download-btn:hover {
          background-color: #4338ca;
        }
        
        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-filter {
            width: 100%;
          }
          
          .materials-grid {
            grid-template-columns: 1fr;
          }
          
          .material-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudyMaterial;