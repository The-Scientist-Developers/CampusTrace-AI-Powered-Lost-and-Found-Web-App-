import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

/**
 * A general-purpose error fallback component.
 * This is displayed by an ErrorBoundary when the app encounters a runtime crash.
 */
export default function ErrorFallback({ error }) {
  return (
    <div
      className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4"
      role="alert"
    >
      <div className="w-full max-w-md text-center">
        <div className="bg-white dark:bg-[#2a2a2a] p-8 sm:p-12 rounded-2xl shadow-xl border border-red-200 dark:border-red-500/30">
          <AlertTriangle className="mx-auto h-20 w-20 text-red-500 mb-6" />

          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
            Oops! Something Went Wrong
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            We're sorry, but the application encountered an unexpected error.
            Please try again.
          </p>

          {/* Optional: Show error message in development */}
          {process.env.NODE_ENV === "development" && error && (
            <pre className="text-left text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-x-auto mb-6">
              {error.message}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-sm rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
