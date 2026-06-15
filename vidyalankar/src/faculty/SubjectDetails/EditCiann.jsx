import React from 'react';
import Header from '../basic/Header';

const EditCiann = ({ ciannDataList, onBack, onEdit, isSidebarVisible, setIsSidebarVisible }) => {
  return (
    <>
      <Header showSearch={false} />
      {/* Bootstrap CDN */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossOrigin="anonymous"
      />
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossOrigin="anonymous"
        async
      ></script>

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">Edit CIAAN</h2>
        </div>
        <div className="ciann-card-container d-flex flex-wrap justify-content-center gap-3 p-3">
          {ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData, index) => (
              <div key={ciannData.ciannId} className="card" style={{ width: '18rem' }}>
                <div className="card-body text-center">
                  <div className="ciann-icon-container mb-2">
                    <span role="img" aria-label="pencil" className="ciann-icon" style={{ fontSize: '2rem', color: '#28a745' }}>✏️</span>
                  </div>
                  <h5 className="card-title text-primary">CIAAN ID: {ciannData.ciannId}</h5>
                  <p className="card-text">
                    <strong>Subject:</strong> {ciannData.subject.name} ({ciannData.subject.code})
                  </p>
                  <p className="card-text">
                    <strong>Division:</strong> {ciannData.division}
                  </p>
                  <div className="ciann-actions">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={() => onBack(index)}
                    >
                      Back to Create
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => onEdit(index)}
                    >
                      Edit CIAAN
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">No CIAAN data available. Create a new CIAAN to see cards.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default EditCiann;
