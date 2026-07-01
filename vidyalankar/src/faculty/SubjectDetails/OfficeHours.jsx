import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

export default function OfficeHours() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [CiaanId, setCiaanId] = useState(null);

  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [informed, setInformed] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formDay, setFormDay] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formInformed, setFormInformed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve CIAAN Data
      const stored = sessionStorage.getItem("currentCiaanData") || localStorage.getItem("CiaanData");
      if (!stored) {
        setError("No active CIAAN session found.");
        return;
      }

      const CiaanData = JSON.parse(stored);
      if (!CiaanData || !CiaanData.CiaanId) {
        setError("Invalid Ciaan session details.");
        return;
      }
      setCiaanId(CiaanData.CiaanId);

      const res = await axios.get(config.CiaanSubjectDetails.get(CiaanData.CiaanId));
      if (res.data.success && res.data.details?.officeHours) {
        const oh = res.data.details.officeHours;
        setDay(oh.day || "");
        setTime(oh.time || "");
        setVenue(oh.venue || "");
        setInformed(!!oh.informed);
      }
    } catch (err) {
      console.error("Failed to load office hours details:", err);
      setError(err.response?.data?.error || "Failed to load office hours.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        CiaanId,
        officeHours: {
          day: formDay,
          time: formTime,
          venue: formVenue,
          informed: formInformed
        }
      };

      const res = await axios.post(config.CiaanSubjectDetails.save, payload);
      if (res.data.success) {
        setDay(formDay);
        setTime(formTime);
        setVenue(formVenue);
        setInformed(formInformed);
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save office hours:", err);
      setError(err.response?.data?.error || "Failed to save office hours.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Lock background scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showForm]);

  return (
    <>
      <style>{`
        .office-hours-container {
          padding: 30px;
          font-family: 'Inter', sans-serif;
          background-color: #f8f9fa;
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
          box-sizing: border-box;
          color: #333;
        }

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
          color: var(--primary-color, #28a745);
        }

        .button {
          background-color: var(--primary-color, #4CAF50);
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
        .button:hover {
          background-color: var(--primary-accent-dark, #43A047);
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }
        .button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .instruction {
          font-size: 15px;
          margin-bottom: 20px;
          color: #555;
          font-weight: 500;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          table-layout: auto;
        }
        table th, table td {
          border: 1px solid #e0e0e0;
          padding: 12px 10px;
          text-align: center;
          vertical-align: middle;
          font-size: 14px;
        }
        table th {
          background-color: #f0f2f5;
          font-weight: 600;
          color: #495057;
        }
        table tbody tr:nth-child(even) {
          background-color: #fdfdfd;
        }
        table tbody tr:hover {
          background-color: #f5f5f5;
        }

        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
        }
        .modal-box {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          animation: fadeIn 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          background: #fff;
          color: #333;
          padding: 15px 25px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        .close-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .close-btn:hover {
          color: #dc3545;
          transform: rotate(90deg);
        }
        .modal-body-content {
          padding: 25px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus {
          outline: none;
          border-color: var(--primary-color, #81c784);
          box-shadow: 0 0 0 3px var(--primary-light, rgba(76,175,80,0.2));
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #444;
          font-size: 14px;
        }

        .form-check {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .form-check-input {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          cursor: pointer;
        }
        .form-check-label {
          font-size: 14px;
          color: #555;
          cursor: pointer;
        }

        .btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 15px 25px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
        }
        .btn-save {
          background-color: var(--primary-color, #4CAF50);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-save:hover {
          background-color: var(--primary-accent-dark, #43A047);
        }
        .btn-cancel {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .btn-cancel:hover {
          background-color: #bb2d3b;
        }

        @media (max-width: 768px) {
          .office-hours-container {
            padding: 15px;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
          }
          .title {
            font-size: 1.7rem;
          }
          .button {
            width: 100%;
            text-align: center;
          }
          .modal-box {
            width: 95%;
          }
          .modal-body-content {
            padding: 20px;
          }
          .btn-row {
            flex-direction: column;
            gap: 10px;
          }
          .btn-save, .btn-cancel {
            width: 100%;
          }
        }
      `}</style>

      <div className="office-hours-container mb-5">
        <div className="header-row">
          <h2 className="title">3.2 Office Hours</h2>
          <button
            className="button"
            disabled={loading}
            onClick={() => {
              setFormDay(day);
              setFormTime(time);
              setFormVenue(venue);
              setFormInformed(informed);
              setShowForm(true);
            }}
          >
            Edit Office Hours
          </button>
        </div>
        <p className="instruction mb-3">
          Staff must remain at office in this duration for solving students query
        </p>

        {error && (
          <div className="alert alert-danger" style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading office hours details...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Informed</th>
                </tr>
              </thead>
              <tbody>
                {day || time || venue ? (
                  <tr>
                    <td>{day}</td>
                    <td>{time}</td>
                    <td>{venue}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={informed}
                        disabled
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'default',
                          accentColor: 'var(--primary-color, #4CAF50)'
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: '20px' }}>
                      No Data Entered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <span>Edit Office Hours</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <div className="modal-body-content">
                <label className="form-label">Select Weekday</label>
                <select
                  className="form-control"
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                >
                  <option value="">Select</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayOption) => (
                    <option key={dayOption} value={dayOption}>{dayOption}</option>
                  ))}
                </select>

                <label className="form-label">Time</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. 10:30 AM - 11:30 AM"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />

                <label className="form-label">Venue</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Staff Room 4"
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                />

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formInformed}
                    onChange={(e) => setFormInformed(e.target.checked)}
                    id="informedCheckbox"
                  />
                  <label className="form-check-label" htmlFor="informedCheckbox">
                    Tick if Informed Students
                  </label>
                </div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
