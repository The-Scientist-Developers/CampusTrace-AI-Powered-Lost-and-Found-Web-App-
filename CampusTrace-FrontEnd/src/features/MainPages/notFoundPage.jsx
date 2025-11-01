import React from "react";
import { Link } from "react-router-dom";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white dark:bg-[#2a2a2a] p-8 sm:p-12 rounded-2xl shadow-xl border border-neutral-200 dark:border-[#3a3a3a]">
          <SearchX className="mx-auto h-20 w-20 text-primary-600 dark:text-primary-400 mb-6" />

          <h1 className="text-4xl font-extrabold text-neutral-800 dark:text-white mb-3">
            404
          </h1>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
