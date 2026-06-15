import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";

import "./AssessPA.css";

export default function AssessPA() {
  const location = useLocation();
  const navigate = useNavigate();
  const batch = location.state?.batch;
  const ciannData = location.state?.ciannData;
  const program = location.state?.program;
  const className = location.state?.className;
  const course = location.state?.course;
  
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prefer experiments passed via navigation state (from previous page)
      const passedExperiments = Array.isArray(location.state?.experiments)
        ? location.state.experiments
        : [];

      // Build robust subject info similar to StudentWiseAssess
      const storageCiann = (() => {
        try { return JSON.parse(localStorage.getItem('ciannData') || 'null'); } catch (_) { return null; }
      })();

      const effectiveProgram = (
        program ||
        ciannData?.department?.program ||
        ciannData?.department?.name ||
        ciannData?.department?.label ||
        ciannData?.department?.value ||
        (typeof ciannData?.department === 'string' ? ciannData.department : '') ||
        storageCiann?.department?.program ||
        storageCiann?.department?.name ||
        storageCiann?.department?.label ||
        storageCiann?.department?.value ||
        (typeof storageCiann?.department === 'string' ? storageCiann.department : '')
      )?.toString().trim();

      const effectiveClass = (
        className ||
        ciannData?.class ||
        ciannData?.division ||
        storageCiann?.class ||
        storageCiann?.division
      )?.toString().trim();

      const effectiveCourse = (
        course ||
        ciannData?.subject?.name ||
        ciannData?.subject?.code ||
        storageCiann?.subject?.name ||
        storageCiann?.subject?.code
      )?.toString().trim();

      console.log('AssessPA - Subject Info computed:', { effectiveProgram, effectiveClass, effectiveCourse });

      if (!effectiveProgram || !effectiveCourse) {
        throw new Error(`Subject information is missing: program=${effectiveProgram}, className=${effectiveClass}, course=${effectiveCourse}`);
      }

      // If we already have experiments passed in, use them; otherwise fetch
      let allExperiments = passedExperiments;
      if (!allExperiments.length) {
        const params = new URLSearchParams({
          program: effectiveProgram,
          className: effectiveClass || '',
          course: effectiveCourse,
        });
        const response = await fetch(`http://localhost:5000/api/assessments/get-experiments?${params.toString()}`);
        const data = await response.json();
        console.log('AssessPA - API Response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch experiments');
        }
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch experiments');
        }
        allExperiments = data.experiments || [];
      } else {
        console.log('AssessPA - Using experiments from navigation state:', allExperiments.length);
      }

      // Fetch assessed experiments for this batch to filter them out
      try {
        const assessedResponse = await fetch(`http://localhost:5000/api/assessments/assessed-experiments?batch=${batch}`);
        const assessedData = await assessedResponse.json();

        if (assessedData.success) {
          const assessedExperimentIds = assessedData.experiments.map(exp => exp.id);
          const unassessedExperiments = allExperiments.filter(exp => !assessedExperimentIds.includes(exp.practicalNo));
          console.log('AssessPA - Total:', allExperiments.length, 'Assessed:', assessedExperimentIds.length, 'Unassessed:', unassessedExperiments.length);

          // If everything is already assessed, show a clearer message
          if (allExperiments.length > 0 && unassessedExperiments.length === 0) {
            setExperiments([]);
            setError(`All experiments are already assessed for batch ${batch}`);
          } else {
            setExperiments(unassessedExperiments);
          }
        } else {
          setExperiments(allExperiments);
          console.log('AssessPA - Experiments loaded (no filter):', allExperiments.length);
        }
      } catch (assessedError) {
        console.warn('AssessPA - Could not fetch assessed experiments, showing all:', assessedError);
        setExperiments(allExperiments);
      }
    } catch (error) {
      console.error('AssessPA - Error fetching experiments:', error);
      setError(error.message);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssess = (exp) => {
    navigate("/assess-pa-studentlist", {
      state: {
        experiment: {
          id: exp.practicalNo,
          name: exp.practicalName
        },
        batch,
        ciannData,
        program,
        className,
        course,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div 
          className="container-fluid"
          style={{ padding: '15px', maxWidth: 'none' }}
        >
          <h3 className="text-center bg-success text-white p-2 rounded">
            Course Diary - Progressive Assessment
          </h3>
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading experiments...</p>
          </div>
        </div>

      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <div 
        className="container-fluid"
        style={{ padding: '15px', maxWidth: 'none' }}
      >
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Progressive Assessment
        </h3>

        {batch && ciannData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>CIAAN ID:</strong> {ciannData.ciannId} <br />
            <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code}) <br />
            <strong>Division:</strong> {ciannData.division}
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchExperiments}
            >
              Retry
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-light">
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Exp ID</th>
                <th style={{ width: '70%' }}>Exp Name</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">
                    {error ? 'Failed to load experiments' : 'No experiments found for this subject'}
                  </td>
                </tr>
              ) : (
                experiments.map((exp) => (
                  <tr key={exp.practicalNo}>
                    <td style={{ textAlign: 'center' }}>{exp.practicalNo}</td>
                    <td>{exp.practicalName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-success"
                        onClick={() => handleAssess(exp)}
                      >
                        Assess
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  );
}
