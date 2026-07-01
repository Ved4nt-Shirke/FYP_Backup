import React from 'react';

const CT1 = () => {
  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-1-circle me-2"></i>
                Class Test 1 (CT1)
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>CT1 Management</h5>
                  <p className="text-muted">
                    Manage Class Test 1 assessments, schedules, and results.
                  </p>
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-plus-circle me-2"></i>
                      Create CT1 Assessment
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-eye me-2"></i>
                      View CT1 Results
                    </button>
                    <button className="btn btn-outline-info">
                      <i className="bi bi-calendar me-2"></i>
                      Schedule CT1
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <h5>Recent CT1 Activities</h5>
                  <div className="list-group">
                    <div className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">No CT1 assessments found</h6>
                        <small>-</small>
                      </div>
                      <p className="mb-1">Create your first CT1 assessment to get started.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CT1;
