import React from "react";
import ErrorFallback from "./features/MainPages/errorFallbackPage.jsx"; // Import the UI component

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
