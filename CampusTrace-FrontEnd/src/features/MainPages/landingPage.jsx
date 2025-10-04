import React from "react";
import { Link } from "react-router-dom";
const SecureIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-zinc-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-zinc-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-zinc-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z"
    />
  </svg>
);

export default function LandingPage({ onNavigateToLogin }) {
  return (
    <div className="bg-zinc-950 text-zinc-300">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red">Campus Trace</span>
            </div>
            <div className="flex items-center">
              <Link
                to="/login"
                className="px-5 py-2 bg-red text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2 focus:ring-offset-black transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="min-h-screen flex items-center pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
              The single, trusted hub for your university's lost and found.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-zinc-400">
              Stop scrolling through endless social media feeds. Campus Trace is
              a modern web app designed to efficiently connect lost items with
              their owners using smart, AI-powered technology.
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="px-8 py-3 bg-red text-white text-base font-semibold rounded-lg shadow-md hover:bg-red focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                Why Campus Trace?
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                A modern solution to an old problem.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-zinc-900 rounded-full">
                  <SecureIcon />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  Secure & Verified
                </h3>
                <p className="mt-2 text-zinc-400">
                  Using a Magic-Link sent to your official university email, we
                  ensure every user is a verified member of our campus
                  community.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-zinc-900 rounded-full">
                  <SearchIcon />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  AI-Powered Search
                </h3>
                <p className="mt-2 text-zinc-400">
                  Our system leverages Gemini AI to analyze descriptions and
                  extract relevant tags, making your search results faster and
                  more accurate.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-zinc-900 rounded-full">
                  <SparklesIcon />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  Smart Matching
                </h3>
                <p className="mt-2 text-zinc-400">
                  Our custom-built algorithm proactively finds high-probability
                  matches and notifies you, so you can stop searching and start
                  recovering.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500">
            &copy; 2025 Campus Trace. A project by Bugauisan, Respicio, & Cacho.
          </p>
        </div>
      </footer>
    </div>
  );
}
