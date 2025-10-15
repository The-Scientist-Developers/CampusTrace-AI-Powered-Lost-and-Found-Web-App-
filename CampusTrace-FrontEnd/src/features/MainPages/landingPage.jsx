import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search, Lightbulb } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function LandingPage({ onNavigateToLogin }) {
  const { theme } = useTheme();
  return (
    <div className="bg-white dark:bg-zinc-950 text-neutral-800 dark:text-zinc-300 min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="text-3xl font-extrabold text-primary-600 dark:text-primary-500 tracking-tight"
              >
                Campus Trace
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/about"
                className="text-base font-medium text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
              >
                About Us
              </Link>
              <Link
                to="/login"
                className="px-6 py-2 bg-primary-600 text-white text-base font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-20">
        <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-50">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-neutral-100 dark:from-zinc-950 dark:to-black"></div>
            <div className="absolute w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30 animate-blob top-0 left-1/4"></div>
            <div className="absolute w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000 bottom-0 right-1/4"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight animate-fade-in-up">
              The{" "}
              <span className="text-primary-600 dark:text-primary-500">
                single, trusted hub
              </span>{" "}
              for your university's lost and found.
            </h1>
            <p className="mt-6 md:mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-neutral-600 dark:text-zinc-400 animate-fade-in-up animation-delay-200">
              Stop scrolling through endless social media feeds. Campus Trace is
              a modern web app designed to efficiently connect lost items with
              their owners using smart, AI-powered technology.
            </p>
            <div className="mt-8 md:mt-12 flex justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Link
                to="/login"
                className="px-8 py-3 bg-primary-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                to="/learn-more"
                className="px-8 py-3 bg-transparent border-2 border-neutral-400 dark:border-zinc-500 text-neutral-700 dark:text-zinc-300 text-lg font-bold rounded-full shadow-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 hover:border-neutral-500 dark:hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-neutral-100 dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-primary-600 dark:text-primary-500 text-sm font-semibold uppercase tracking-wider block mb-2">
                Features
              </span>
              <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Why Choose Campus Trace?
              </h2>
              <p className="mt-4 text-xl text-neutral-600 dark:text-zinc-400 max-w-3xl mx-auto">
                A modern solution to an age-old problem, powered by cutting-edge
                technology and built for your campus community.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-primary-600/10 rounded-full mb-6">
                  <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
                  Secure & Verified
                </h3>
                <p className="mt-3 text-lg text-neutral-600 dark:text-zinc-400 leading-relaxed">
                  Magic-Link login ensures every user is a verified member of
                  your university, fostering a trustworthy community.
                </p>
              </div>

              <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-primary-600/10 rounded-full mb-6">
                  <Search className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
                  AI-Powered Search
                </h3>
                <p className="mt-3 text-lg text-neutral-600 dark:text-zinc-400 leading-relaxed">
                  Leveraging Gemini AI, our system analyzes descriptions and
                  images for smarter, faster, and more accurate search results.
                </p>
              </div>

              <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-primary-600/10 rounded-full mb-6">
                  <Lightbulb className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
                  Smart Matching & Alerts
                </h3>
                <p className="mt-3 text-lg text-neutral-600 dark:text-zinc-400 leading-relaxed">
                  Our custom algorithm proactively finds high-probability
                  matches and notifies you, so you can stop searching and start
                  recovering.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-white to-neutral-100 dark:from-zinc-950 dark:to-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6">
              Ready to Reconnect Your Campus?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-zinc-400 mb-10">
              Join Campus Trace today and experience a smarter way to manage
              lost and found items at your university.
            </p>
            <Link
              to="/login"
              className="px-10 py-4 bg-primary-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-100 dark:bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-neutral-500 dark:text-zinc-500">
              &copy; {new Date().getFullYear()} Campus Trace. All rights
              reserved.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end gap-6">
            <Link
              to="/about"
              className="text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 text-sm"
            >
              About Us
            </Link>
            <a
              href="mailto:contact@campustrace.com"
              className="text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 text-sm"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-6">
          <p className="text-neutral-500 dark:text-zinc-500 text-xs">
            A project by: Bugauisan, Respicio, & Cacho.
          </p>
        </div>
      </footer>
    </div>
  );
}
