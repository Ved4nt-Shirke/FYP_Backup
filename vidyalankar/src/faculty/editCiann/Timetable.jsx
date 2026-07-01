import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import { config } from "../../config/api";
import "./Timetable.css";
import "./EditCiannModern.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const times = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:15 - 11:15",
  "11:15 - 12:15",
  "12:45 - 01:45",
  "01:45 - 02:45",
  "03:00 - 04:00",
  "04:00 - 05:00",
  "05:15 - 06:15",
  "06:15 - 07:15",
];
const DEFAULT_ROOMS = [
  "V201",
  "V202",
  "V203",
  "V208",
  "V209",
  "V207",
  "W008",
  "V002",
  "V003",
  "V004",
  "V009",
  "V012",
  "V013",
  "V014",
  "W001",
  "W002",
  "W003",
  "W004",
  "W005",
  "W006",
  "W007",
];
const batches = ["Batch 1", "Batch 2", "Batch 3"];
const DEFAULT_LABS = [
  "Programming Lab (V118)",
  "Programming Lab (V119)",
  "C (V120)",
  "Programming Lab (L003A)",
  "Programming Lab (L003B)",
  "Programming Lab (L003C)",
  "Programming Lab (L001A)",
  "Programming Lab (L001B)",
  "Programming Lab (L001C)",
  "Programming Lab (L004A)",
  "Programming Lab (L004B)",
  "Programming Lab (L004C)",
  "Electronics Lab (L015A)",
  "Electronics Lab (L016A)",
  "Electronics Lab (L016B)",
  "Electronics Lab (L017A)",
  "Electronics Lab (LO17B)",
  "Electronics Lab (L017C)",
  "Physics Lab (V005)",
  "Chemistry Lab (v006)",
  "Drawing Lab (L013)",
  "Electronics Lab (LO16C)",
  "Language Lab (LL)",
  "Programming Lab (L002)",
];

const TimeTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const [slots, setSlots] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [showPracticalPopup, setShowPracticalPopup] = useState(false);
  const [availableRooms, setAvailableRooms] = useState(DEFAULT_ROOMS);
  const [availableLabs, setAvailableLabs] = useState(DEFAULT_LABS);
  const [selectedBatch, setSelectedBatch] = useState("Batch 1");
  const [selectedLab, setSelectedLab] = useState(DEFAULT_LABS[0]);
  const [selectedPracticalIndex, setSelectedPracticalIndex] = useState(0);
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);
  const [selectedTutorialRoom, setSelectedTutorialRoom] = useState(DEFAULT_ROOMS[0]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedTime, setSelectedTime] = useState(times[0]);
  const [selectedRoom, setSelectedRoom] = useState(DEFAULT_ROOMS[0]);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    // If no CiaanData from location state, try to get it from storage
    if (!CiaanData) {
      // First try sessionStorage
      const storedCiaanData = sessionStorage.getItem("currentCiaanData");
      if (storedCiaanData) {
        try {
          const parsedData = JSON.parse(storedCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }

      // Then try localStorage
      const localCiaanData = localStorage.getItem("CiaanData");
      if (localCiaanData) {
        try {
          const parsedData = JSON.parse(localCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            // Also store in sessionStorage for consistency
            sessionStorage.setItem(
              "currentCiaanData",
              JSON.stringify(parsedData),
            );
            return;
          }
        } catch (error) {
          console.error("Error parsing local CIAAN data:", error);
        }
      }
    } else {
      // Store CIAAN data in sessionStorage for persistence across navigation
      sessionStorage.setItem("currentCiaanData", JSON.stringify(CiaanData));
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    }
  }, [CiaanData]);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };

    window.addEventListener(
      "faculty:toggle-secondary-sidebar",
      handleSecondaryToggle,
    );

    return () => {
      window.removeEventListener(
        "faculty:toggle-secondary-sidebar",
        handleSecondaryToggle,
      );
    };
  }, []);

  const handleAddTheorySlot = () => setShowPopup(true);

  // Ensure default practical start index when opening the popup
  useEffect(() => {
    if (showPracticalPopup) {
      for (let i = 0; i < times.length - 1; i++) {
        const [start, end] = times[i].split(" - ");
        const [nextStart] = times[i + 1].split(" - ");
        if (end === nextStart) {
          setSelectedPracticalIndex(i);
          setSelectedTime(times[i]);
          break;
        }
      }
    }
  }, [showPracticalPopup]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // Implement exponential backoff for API calls
        let response;
        for (let i = 0; i < 3; i++) {
          // Retry up to 3 times
          response = await fetch(config.slots, {
            headers: {
              ...getAuthHeaders(),
            },
          });
          if (response.ok) break;
          await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000)); // Exponential backoff
        }

        if (!response || !response.ok) {
          throw new Error(
            `HTTP error! Status: ${response ? response.status : "Unknown"}`,
          );
        }
        const data = await response.json();
        const formatted = {};
        data.forEach((slot) => {
          formatted[`${slot.time}-${slot.weekday}`] = slot.label;
        });
        setSlots(formatted);
      } catch (err) {
        console.error("Failed to fetch slots:", err.message);
        setSlots({});
      }
    };
    fetchSlots();
  }, []);

  useEffect(() => {
    const fetchRoomsAndLabs = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [roomsRes, labsRes] = await Promise.all([
          fetch(config.catalog.classrooms, { headers }),
          fetch(config.catalog.labs, { headers }),
        ]);

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          if (roomsData.success && roomsData.classrooms && roomsData.classrooms.length > 0) {
            const roomNames = roomsData.classrooms.map((r) => r.name);
            setAvailableRooms(roomNames);
            setSelectedRoom(roomNames[0]);
            setSelectedTutorialRoom(roomNames[0]);
          }
        }

        if (labsRes.ok) {
          const labsData = await labsRes.json();
          if (labsData.success && labsData.labs && labsData.labs.length > 0) {
            const labNames = labsData.labs.map((l) => l.name);
            setAvailableLabs(labNames);
            setSelectedLab(labNames[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching rooms/labs from catalog:", err);
      }
    };

    fetchRoomsAndLabs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = `${selectedTime}-${selectedDay}`;
    const value = `Theory (${selectedRoom})`;
    try {
      let response;
      for (let i = 0; i < 3; i++) {
        response = await fetch(config.slots, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            weekday: selectedDay,
            time: selectedTime,
            label: value,
          }),
        });
        if (response.ok) break;
        await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
      }

      if (!response || !response.ok) {
        throw new Error(
          `HTTP error! Status: ${response ? response.status : "Unknown"}`,
        );
      }
      setSlots((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error("Failed to save slot:", err.message);
      // Use a custom message box instead of alert
      // alert("Failed to save slot.");
    }
    setShowPopup(false);
  };

  const handlePracticalSubmit = async (e) => {
    e.preventDefault();

    const index = selectedPracticalIndex;
    if (typeof index !== "number" || index < 0 || index >= times.length - 1) {
      // Use a custom message box instead of alert
      // alert("Please select a start time that has a following hour available.");
      return;
    }

    const firstKey = `${times[index]}-${selectedDay}`;
    const secondKey = `${times[index + 1]}-${selectedDay}`;
    const value = `Practical (${selectedBatch}, ${selectedLab})`;

    try {
      const fetchPromises = [
        fetch(config.slots, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            weekday: selectedDay,
            time: times[index],
            label: value,
          }),
        }),
        fetch(config.slots, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            weekday: selectedDay,
            time: times[index + 1],
            label: value,
          }),
        }),
      ];

      const responses = await Promise.all(
        fetchPromises.map((promise) => {
          return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 3; i++) {
              try {
                const res = await promise;
                if (res.ok) {
                  resolve(res);
                  return;
                }
              } catch (error) {
                // Ignore network errors on retries for exponential backoff
              }
              await new Promise((res) =>
                setTimeout(res, Math.pow(2, i) * 1000),
              );
            }
            reject(new Error("Failed after retries"));
          });
        }),
      );

      if (!responses[0].ok || !responses[1].ok) {
        throw new Error("Failed to save both hours for the practical slot");
      }

      setSlots((prev) => ({ ...prev, [firstKey]: value, [secondKey]: value }));
    } catch (err) {
      console.error("Failed to save slot:", err.message);
      // Use a custom message box instead of alert
      // alert("Failed to save practical slot for 2 hours.");
    }

    setShowPracticalPopup(false);
  };

  const handleTutorialSubmit = async (e) => {
    e.preventDefault();
    const key = `${selectedTime}-${selectedDay}`;
    const value = `Tutorial (${selectedTutorialRoom})`;
    try {
      let response;
      for (let i = 0; i < 3; i++) {
        response = await fetch(config.slots, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            weekday: selectedDay,
            time: selectedTime,
            label: value,
          }),
        });
        if (response.ok) break;
        await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
      }

      if (!response || !response.ok) {
        throw new Error(
          `HTTP error! Status: ${response ? response.status : "Unknown"}`,
        );
      }
      setSlots((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error("Failed to save slot:", err.message);
      // Use a custom message box instead of alert
      // alert("Failed to save slot.");
    }
    setShowTutorialPopup(false);
  };

  const handleDelete = async (timesToDelete, day) => {
    console.log("Attempting to delete slots:", { timesToDelete, day });

    try {
      const deletePromises = timesToDelete.map((time) =>
        fetch(config.slots, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ weekday: day, time }),
        }),
      );

      const responses = await Promise.all(
        deletePromises.map((promise) => {
          return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 3; i++) {
              try {
                const res = await promise;
                if (res.ok) {
                  resolve(res);
                  return;
                }
              } catch (error) {
                // Ignore network errors on retries for exponential backoff
              }
              await new Promise((res) =>
                setTimeout(res, Math.pow(2, i) * 1000),
              );
            }
            reject(new Error("Failed after retries"));
          });
        }),
      );

      const allOk = responses.every((res) => res.ok);
      if (!allOk) {
        const errorData = await Promise.all(
          responses.map((res) => res.json()),
        ).catch(() => null);
        console.error("Delete failed for one or more slots:", errorData);
        // Use a custom message box instead of alert
        // alert(`Failed to delete one or more slots: ${errorData?.[0]?.message || "Unknown error"}`);
        return;
      }

      const updatedSlots = { ...slots };
      timesToDelete.forEach((time) => {
        const key = `${time}-${day}`;
        delete updatedSlots[key];
      });
      setSlots(updatedSlots);

      // Use a custom message box instead of alert
      // alert("Slot(s) deleted successfully!");
    } catch (err) {
      console.error("Error deleting slots:", err);
      // Use a custom message box instead of alert
      // alert("Failed to delete slot(s). Please try again.");
    }

    setShowDeletePopup(false);
  };

  // Navigation handlers for previous/forward buttons
  const handlePrevious = () => {
    navigate("/course-dairy", { state: { CiaanData } });
  };

  const handleForward = () => {
    navigate("/syllabus", { state: { CiaanData } });
  };

  return (
    <div className="timetable-layout">
      <div className="timetable-main-row">
        <div
          className={`timetable-secondary-sidebar-wrapper ${isSecondarySidebarVisible ? "visible" : ""}`}
        >
          <SecondarySidebar
            CiaanData={CiaanData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>
        <div className="timetable-main-content">
          <div className="plan-container">
            <div className="timetable-header">
              <div className="timetable-header-main">
                <h2>Time Table & Load</h2>
                <p>
                  Manage theory, practical, tutorial, and delete actions from
                  this toolbar.
                </p>
              </div>
              <div className="button-group">
                <button onClick={handleAddTheorySlot}>
                  <span>+</span> Add Theory
                </button>
                <button onClick={() => setShowPracticalPopup(true)}>
                  <span>+</span> Add Practical
                </button>
                <button onClick={() => setShowTutorialPopup(true)}>
                  <span>+</span> Add Tutorial
                </button>
                <button onClick={() => setShowDeletePopup(true)}>
                  <span>🗑</span> Delete Slot
                </button>
              </div>
            </div>
            {showPopup && (
              <div className="popup-overlay">
                <div className="popup">
                  <button
                    className="close-button"
                    onClick={() => setShowPopup(false)}
                  >
                    &times;
                  </button>
                  <h3>Add Theory Slot</h3>
                  <form onSubmit={handleSubmit}>
                    <label>
                      Weekday
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Time
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        {times.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Room
                      <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                      >
                        {availableRooms.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit">Save</button>
                  </form>
                </div>
              </div>
            )}
            {showPracticalPopup && (
              <div className="popup-overlay">
                <div className="popup">
                  <button
                    className="close-button"
                    onClick={() => setShowPracticalPopup(false)}
                  >
                    &times;
                  </button>
                  <h3>Add Practical Slot</h3>
                  <form onSubmit={handlePracticalSubmit}>
                    <label>
                      Weekday
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Time (2 hours)
                      <select
                        value={selectedPracticalIndex}
                        onChange={(e) => {
                          const i = parseInt(e.target.value, 10);
                          setSelectedPracticalIndex(i);
                          setSelectedTime(times[i]);
                        }}
                      >
                        {times.map((time, idx) => {
                          if (idx >= times.length - 1) return null;
                          const [start, end] = time.split(" - ");
                          const [nextStart, nextEnd] =
                            times[idx + 1].split(" - ");
                          if (end !== nextStart) return null;
                          return (
                            <option key={time} value={idx}>
                              {start} - {nextEnd}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label>
                      Batch
                      <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                      >
                        {batches.map((batch) => (
                          <option key={batch} value={batch}>
                            {batch}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Lab
                      <select
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                      >
                        {availableLabs.map((lab) => (
                          <option key={lab} value={lab}>
                            {lab}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit">Save</button>
                  </form>
                </div>
              </div>
            )}
            {showTutorialPopup && (
              <div className="popup-overlay">
                <div className="popup">
                  <button
                    className="close-button"
                    onClick={() => setShowTutorialPopup(false)}
                  >
                    &times;
                  </button>
                  <h3>Add Tutorial Slot</h3>
                  <form onSubmit={handleTutorialSubmit}>
                    <label>
                      Weekday
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Time
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        {times.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Room
                      <select
                        value={selectedTutorialRoom}
                        onChange={(e) =>
                          setSelectedTutorialRoom(e.target.value)
                        }
                      >
                        {availableRooms.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit">Save</button>
                  </form>
                </div>
              </div>
            )}
            {showDeletePopup && (
              <div className="popup-overlay">
                <div className="popup delete-popup">
                  <button
                    className="close-button"
                    onClick={() => setShowDeletePopup(false)}
                  >
                    &times;
                  </button>
                  <h3>Edit Slot</h3>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className="timetable delete-table">
                      <thead>
                        <tr>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Time
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Day
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Room
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Faculty
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Type
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Batch
                          </th>
                          <th
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "#f8f9fa",
                              zIndex: 1,
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const rows = [];
                          days.forEach((day) => {
                            for (let i = 0; i < times.length; i++) {
                              const key = `${times[i]}-${day}`;
                              const value = slots[key];
                              if (!value) continue;

                              const typeMatch = value.match(
                                /(Theory|Practical|Tutorial)/i,
                              );
                              const type = typeMatch
                                ? typeMatch[0].slice(0, 2).toUpperCase()
                                : "";
                              const roomMatch = value.match(/\((.*?)\)/);
                              const room = roomMatch ? roomMatch[1] : "";
                              const batchMatch = value.match(/Batch\s\d/);
                              const batch = batchMatch ? batchMatch[0] : "";

                              const isPractical =
                                typeof value === "string" &&
                                value.startsWith("Practical");
                              const hasNext = i < times.length - 1;
                              const nextSame =
                                hasNext &&
                                slots[`${times[i + 1]}-${day}`] === value;

                              if (isPractical && nextSame) {
                                const [start] = times[i].split(" - ");
                                const [, end] = times[i + 1].split(" - ");
                                rows.push({
                                  time: `${start} - ${end}`,
                                  day,
                                  room,
                                  type,
                                  batch,
                                  deleteTimes: [times[i], times[i + 1]],
                                });
                                i++; // skip the next hour as it's merged
                              } else {
                                rows.push({
                                  time: times[i],
                                  day,
                                  room,
                                  type,
                                  batch,
                                  deleteTimes: [times[i]],
                                });
                              }
                            }
                          });

                          if (rows.length === 0) {
                            return (
                              <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>
                                  No records
                                </td>
                              </tr>
                            );
                          }

                          return rows.map((row, idx) => (
                            <tr key={`${row.day}-${row.time}-${idx}`}>
                              <td>{row.time}</td>
                              <td>{row.day}</td>
                              <td>{row.room}</td>
                              <td>CGR</td>
                              <td>{row.type}</td>
                              <td>{row.batch}</td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleDelete(row.deleteTimes, row.day)
                                  }
                                  className="delete-button"
                                >
                                  🗑
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="table-scroll-shell">
              <table className="timetable">
                <thead>
                  <tr>
                    <th>Time</th>
                    {days.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {times.map((time, tIdx) => (
                    <tr key={time}>
                      <td>{time}</td>
                      {days.map((day) => {
                        const key = `${time}-${day}`;
                        const value = slots[key];
                        const isPractical =
                          typeof value === "string" &&
                          value.startsWith("Practical");

                        // If this cell is the continuation of a 2-hour practical,
                        // skip rendering because the previous row will have rowSpan=2
                        if (tIdx > 0) {
                          const prevKey = `${times[tIdx - 1]}-${day}`;
                          if (isPractical && slots[prevKey] === value) {
                            return null;
                          }
                        }

                        // If this is the start of a 2-hour practical, render with rowSpan=2
                        if (isPractical && tIdx < times.length - 1) {
                          const nextKey = `${times[tIdx + 1]}-${day}`;
                          if (slots[nextKey] === value) {
                            return (
                              <td key={key} rowSpan={2}>
                                {value}
                              </td>
                            );
                          }
                        }

                        // Default single-hour cell
                        return <td key={key}>{value || ""}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button onClick={handlePrevious}>← Previous</button>
              <button onClick={handleForward}>Forward →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTable;
