import React from 'react';

const Microproject = () => {
  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h4 className="mb-0">
                <i className="bi bi-diagram-3 me-2"></i>
                PT Microproject Management
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>PT Microproject Overview</h5>
                  <p className="text-muted">
                    Manage student PT microprojects, track progress, and evaluate submissions.
                  </p>
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-warning">
                      <i className="bi bi-plus-circle me-2"></i>
                      Create New PT Microproject
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-list-check me-2"></i>
                      View All Projects
                    </button>
                    <button className="btn btn-outline-info">
                      <i className="bi bi-graph-up me-2"></i>
                      Track Progress
                    </button>
                    <button className="btn btn-outline-success">
                      <i className="bi bi-check-circle me-2"></i>
                      Evaluate Submissions
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <h5>Project Statistics</h5>
                  <div className="row">
                    <div className="col-6">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h3 className="text-primary">0</h3>
                          <small>Active Projects</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h3 className="text-success">0</h3>
                          <small>Completed</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h6>Recent Activities</h6>
                    <div className="list-group">
                      <div className="list-group-item">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">No PT microprojects found</h6>
                          <small>-</small>
                        </div>
                        <p className="mb-1">Create your first PT microproject to get started.</p>
                      </div>
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

export default Microproject;
