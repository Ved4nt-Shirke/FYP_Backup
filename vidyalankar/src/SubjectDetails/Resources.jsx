import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MoocCourses from './MoocCourses';
import VacSection from './VacSection';
import StudySection from './StudySection';
import OtherContributionsSection from './OtherContributionsSection';
import BookResource from './BookResource';
import ModuleAvailabilityResource from './ModuleAvailabilityResource';
import RecommendedWebsiteResource from './RecommendedWebsiteResource';
import WebJournalResources from './WebJournalResources';

function Resources() {
  const { unifiedData, updateUnifiedData } = useOutletContext();
  return (
    <>
      <style>{`
        /* --- Overall container and typography (from Rubric) --- */
        .resources-container { /* Renamed from .rubric-container */
          padding: 30px;
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
          color: #333;
        }

        /* --- Header Row (from Rubric) --- */
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px 25px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .title {
          margin: 0;
          font-weight: 700;
          font-size: 2rem;
          color: #28a745;
        }

        /* --- Section Wrapper Card --- */
        /* New style to wrap each resource component in a card */
        .resource-section {
          background: #fff;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: #333;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        /* --- Generic Button Style (from Rubric) --- */
        /* Applies to .button, and is inherited by old class names */
        .button, .resources-button, .mooc-button {
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .button:hover, .resources-button:hover, .mooc-button:hover {
          background-color: #43A047;
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }

        /* --- Generic Table Styling (from Rubric) --- */
        /* Applies to all tables, including old class names */
        table, .table-resources, .mooc-table, .table3 {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        table th, .table-resources th, .mooc-table th, .table3 th {
          border: 1px solid #e0e0e0;
          padding: 12px 15px;
          text-align: left;
          vertical-align: middle;
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }
        table td, .table-resources td, .mooc-table td, .table3 td {
          border: 1px solid #e0e0e0;
          padding: 12px 15px;
          text-align: left;
          vertical-align: middle;
          font-size: 14px;
        }
        table tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        table tbody tr:hover {
          background-color: #f5f5f5;
        }

        /* --- Modal Styling (from Rubric) --- */
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; justify-content: center; align-items: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-box {
          background: white; border-radius: 16px; width: 90%;
          max-width: 900px; animation: fadeIn 0.3s ease-in-out;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden; padding: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff; color: #333; padding: 15px 25px;
          font-size: 20px; font-weight: 600; display: flex;
          justify-content: space-between; align-items: center;
          border-bottom: 1px solid #eee;
        }
        .close-btn {
          background: none; border: none; color: #999; font-size: 28px;
          cursor: pointer; transition: transform 0.2s ease, color 0.2s ease;
        }
        .close-btn:hover { color: #dc3545; transform: rotate(90deg); }
        .modal-body-content { padding: 25px; max-height: 70vh; overflow-y: auto; }

        /* --- Responsive Adjustments (from Rubric) --- */
        @media (max-width: 768px) {
          .resources-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
          .title { font-size: 1.7rem; }
          .button, .resources-button, .mooc-button { width: 100%; text-align: center; }
          .resource-section { padding: 15px; }
          .section-title { font-size: 1.2rem; }
        }
        @media (max-width: 480px) {
          .resources-container { padding: 10px; }
          .title { font-size: 1.5rem; }
        }
      `}</style>

      <div className="resources-container">
        <div className="header-row">
          <h2 className="title">Learning Resources</h2>
        </div>

        {/* Each component is wrapped in a styled section for a card-like appearance */}
        <div className="resource-section"><BookResource /></div>
        <div className="resource-section">
          <WebJournalResources unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
        <div className="resource-section">
          <ModuleAvailabilityResource unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
        <div className="resource-section">
          <RecommendedWebsiteResource unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
        <div className="resource-section"><MoocCourses /></div>
        <div className="resource-section">
          <VacSection unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
        <div className="resource-section">
          <StudySection unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
        <div className="resource-section">
          <OtherContributionsSection unifiedData={unifiedData} updateUnifiedData={updateUnifiedData} />
        </div>
      </div>
    </>
  );
}

export default Resources;
