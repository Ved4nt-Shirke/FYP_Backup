import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
          <h4 style={{ color: "#856404", margin: "0 0 10px 0" }}>
            <i className="bi bi-exclamation-triangle"></i> Component Error
          </h4>
          <p style={{ color: "#856404", margin: 0 }}>
            There was an error loading the rich text editor. Please refresh the page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details style={{ marginTop: "10px", color: "#666" }}>
              <summary>Error Details (Development Only)</summary>
              <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
