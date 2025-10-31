import React from "react";
// --- THIS IS THE FIX ---
// Added the .jsx file extension to the import path
import ErrorFallback from "./errorFallback.jsx"; // Import the UI component

/**
 * A React Error Boundary.
 * This class component catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI (ErrorFallback) instead of crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // state holds information about the error
    this.state = { hasError: false, error: null };
  }

  /**
   * This lifecycle method is triggered when an error is thrown by a descendant component.
   * It updates the state so the next render will show the fallback UI.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  /**
   * This lifecycle method is also triggered after an error.
   * It's a good place to log the error to a reporting service.
   */
  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  /**
   * Renders the children if no error occurred, or the ErrorFallback component if an error was caught.
   */
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <ErrorFallback error={this.state.error} />;
    }

    // Normally, just render the children
    return this.props.children;
  }
}

export default ErrorBoundary;
