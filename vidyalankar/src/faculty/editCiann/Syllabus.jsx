import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import "./Syllabus.css";
import EditSyllabusForm from "./EditSyllabusForm";
import "./EditCiannModern.css";
import axios from "../../utils/axiosConfig";
import { config } from "../../config/api";

function Syllabus() {
  const location = useLocation();
  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  useEffect(() => {
    console.log("CIAAN data in Syllabus:", CiaanData);

    if (!CiaanData) {
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

      const localCiaanData = localStorage.getItem("CiaanData");
      if (localCiaanData) {
        try {
          const parsedData = JSON.parse(localCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
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
      sessionStorage.setItem("currentCiaanData", JSON.stringify(CiaanData));
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    }
  }, [CiaanData]);

  useEffect(() => {
    if (!CiaanData?.CiaanId) return;
    const fetchSyllabus = async () => {
      try {
        const res = await axios.get(`${config.subjectDetails}/syllabus/${CiaanData.CiaanId}`);
        if (res.data.success && Array.isArray(res.data.images) && res.data.images.length > 0) {
          setImages(res.data.images);
          setSelectedPage(0);
          setCurrentImage(res.data.images[0] || null);
          return;
        }
      } catch (error) {
        console.error("Error fetching syllabus images from database:", error);
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(`syllabusImages:${CiaanData.CiaanId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setImages(parsed);
            setSelectedPage(0);
            setCurrentImage(parsed[0] || null);
          }
        }
      } catch (error) {
        console.error("Error loading syllabus images from storage:", error);
      }
    };
    fetchSyllabus();
  }, [CiaanData?.CiaanId]);

  const convertFileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImagesSubmit = async (selectedFiles) => {
    let updatedImages = [...images];
    if (updatedImages.length === 0) {
      updatedImages = ["", "", "", ""];
    }

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      if (file) {
        try {
          const dataUrl = await convertFileToDataUrl(file);
          updatedImages[index] = dataUrl;
        } catch (error) {
          console.error("Error converting syllabus image:", error);
        }
      }
    }

    setImages(updatedImages);
    setSelectedPage(0);
    setCurrentImage(updatedImages[0] || null);

    if (CiaanData?.CiaanId) {
      try {
        await axios.post(`${config.subjectDetails}/syllabus`, {
          CiaanId: CiaanData.CiaanId,
          images: updatedImages
        });
        localStorage.setItem(
          `syllabusImages:${CiaanData.CiaanId}`,
          JSON.stringify(updatedImages),
        );
      } catch (error) {
        console.error("Error saving syllabus images to database:", error);
      }
    }

    setShowEditForm(false);
  };

  const handlePageClick = (img, index) => {
    setCurrentImage(img);
    setSelectedPage(index);
  };

  return (
    <div className="timetable-layout">
      <div className="timetable-main-row">
        <div className="timetable-secondary-sidebar-wrapper">
          <SecondarySidebar
            CiaanData={CiaanData}
            isSecondarySidebarVisible={isSecondarySidebarVisible}
            setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
          />
        </div>

        <div className="timetable-main-content syllabus-main-content">
          <div className="page-layout">
            <div className="syllabus-container">
              <button
                className="edit-btn"
                type="button"
                onClick={() => setShowEditForm(true)}
              >
                Edit Syllabus Content
              </button>

              <h2 className="syllabus-title">Syllabus Content</h2>
              <p className="note">
                Note: Upload only <span>Theory</span> and <span>Practical</span>{" "}
                images
              </p>

              <div className="pages">
                {images.length > 0 ? (
                  images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageClick(img, index)}
                      className={`page-btn ${selectedPage === index ? "active" : ""
                        }`}
                    >
                      Page {index + 1}
                    </button>
                  ))
                ) : (
                  <span>No pages</span>
                )}
              </div>

              <div className="image-box">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="syllabus content"
                    className="flip-image"
                  />
                ) : (
                  <span style={{ color: "#aaa" }}>No image selected</span>
                )}
              </div>

              <div className="bottom-buttons">
                <button
                  className="nav-btn"
                  onClick={() => {
                    if (images.length > 0) {
                      const newIndex =
                        (selectedPage - 1 + images.length) % images.length;
                      handlePageClick(images[newIndex], newIndex);
                    }
                  }}
                  disabled={images.length === 0}
                >
                  ← Previous
                </button>
                <button
                  className="nav-btn"
                  onClick={() => {
                    if (images.length > 0) {
                      const newIndex = (selectedPage + 1) % images.length;
                      handlePageClick(images[newIndex], newIndex);
                    }
                  }}
                  disabled={images.length === 0}
                >
                  Next →
                </button>
              </div>
            </div>

            {showEditForm && (
              <EditSyllabusForm
                onClose={() => setShowEditForm(false)}
                onImagesSubmit={handleImagesSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Syllabus;
