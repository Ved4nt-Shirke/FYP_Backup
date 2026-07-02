import React, { useEffect, useState, useRef } from "react";

const PDFViewer = ({ url, title }) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadPdfjs = async () => {
      try {
        // Dynamically load PDF.js if not already loaded
        if (!window.pdfjsLib) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
          script.async = true;
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load PDF viewer scripts."));
          });
        }

        if (!active) return;

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!active) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error("PDF loading error:", err);
        if (active) {
          setError(err.message || "Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadPdfjs();

    // Prevent copy, save, and print shortcuts
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p" || e.key === "c")) {
        e.preventDefault();
        alert("Downloading, printing, and copying are disabled for this book.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      active = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        height: "100%",
        width: "100%",
        backgroundColor: "#525659",
        padding: "20px 0",
        boxSizing: "border-box",
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none"
      }}
    >
      {loading && (
        <div style={{ color: "white", marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }}
          />
          <span>Loading secure preview...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {error && (
        <div style={{ color: "#fee2e2", padding: "20px", backgroundColor: "#ef4444", borderRadius: "8px", marginTop: "40px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && pdfDoc && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", alignItems: "center" }}>
          {Array.from(new Array(numPages), (el, index) => (
            <PDFPageRenderer key={index} pdfDoc={pdfDoc} pageNum={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const PDFPageRenderer = ({ pdfDoc, pageNum }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    pdfDoc.getPage(pageNum).then((page) => {
      if (!active) return;

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNum]);

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280"
          }}
        >
          Rendering page {pageNum}...
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          backgroundColor: "white",
          maxWidth: "95vw",
          height: "auto",
          display: "block"
        }}
      />
    </div>
  );
};

export default PDFViewer;
