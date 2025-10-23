import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  FilePlus,
  Sparkles,
  Bell,
  ChevronDown,
  MessageCircle,
  Users,
  Menu,
  X,
  ArrowRight,
  Clock,
  KeyRound,
  UserCheck,
  Award,
  Map, // New Icon
  MessageSquare, // New Icon for messaging
} from "lucide-react";
import logo from "../../Images/Logo.svg";

// --- Custom Hook for Intersection Observer ---
const useInView = (ref, options) => {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, options);
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current && observer) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);
  return isInView;
};

// --- Feature Slider Component ---
const FeatureSlider = ({ features }) => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider mb-8">
          KEY FEATURES OF CAMPUSTRACE
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="animate-slide flex w-max">
            {[...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="w-80 flex-shrink-0 flex items-center justify-center gap-4 px-8"
                >
                  <Icon className="w-6 h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <span className="font-semibold text-lg text-neutral-600 dark:text-neutral-300 truncate">
                    {feature.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- FAQ Item Component ---
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-6 px-4 flex justify-between items-center text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg group"
      >
        <h3 className="text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {question}
        </h3>
        <div
          className={`p-2 rounded-full bg-primary-100 dark:bg-primary-500/10 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-neutral-600 dark:text-neutral-400 pb-6 px-4 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Feature Card Component with Glowing Border ---
const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="group relative p-1 bg-gradient-to-br from-white/50 to-white/50 dark:from-neutral-800/50 dark:to-neutral-800/50 rounded-2xl transition-all duration-300 h-full">
      <div className="absolute -inset-px bg-gradient-to-br from-primary-500/50 via-purple-500/50 to-pink-500/50 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-300"></div>
      <div className="relative p-8 bg-white dark:bg-[#2a2a2a] rounded-xl h-full">
        <div className="flex items-center justify-center h-12 w-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg mb-4">
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0); // Default to first FAQ open

  // --- UPDATED features array to reflect new functionality ---
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description:
        "Smart text & image analysis suggests potential matches for lost items.",
    },
    {
      icon: Search,
      title: "Visual Search",
      description:
        "Can't describe it? Upload a photo to find visually similar found items.",
    },
    {
      icon: MessageCircle,
      title: "In-App Messaging",
      description:
        "Communicate safely with other users directly on the platform to arrange returns.",
    },
    {
      icon: Award,
      title: "Gamification & Leaderboard",
      description:
        "Earn badges and climb the leaderboard by helping return items to their owners.",
    },
    {
      icon: KeyRound,
      title: "Secure Claim Process",
      description:
        "Verify ownership privately before any contact details are shared.",
    },
    {
      icon: Users,
      title: "Verified Community",
      description:
        "Join via university email or manual ID verification for a trusted environment.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI-powered 'Possible Matches' feature work?",
      answer:
        "When you report a 'Lost' item, our AI automatically scans all 'Found' items, analyzing text and images for similarities. High-probability matches appear on your main dashboard to help you get your item back faster.",
    },
    {
      question: "How do I communicate with someone about an item?",
      answer:
        "You can use the 'Message Poster' button on any item page to start a private, in-app conversation. After a claim is approved, a chat is automatically created for you and the other person to coordinate the return safely.",
    },
    {
      question: "What if I don't have a university email?",
      answer:
        "No problem! You can still sign up with a personal email (like Gmail). You will be prompted to select your university and upload a photo of your university ID for manual verification by an administrator.",
    },
    {
      question: "Why must I be verified to use the platform?",
      answer:
        "Verification ensures that only members of the campus community can participate. This creates a trusted and secure environment for everyone, which is our top priority.",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 flex flex-col overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="Campus Trace Logo"
                className="h-10 w-auto rounded-full group-hover:scale-110 transition-transform duration-300"
              />
              <span className="hidden sm:inline text-xl font-bold text-neutral-800 dark:text-white">
                CampusTrace
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {[
                { to: "/features", label: "Features" },
                { to: "/learn-more", label: "How It Works" },
                { to: "/about", label: "About Us" },
                { to: "/register-university", label: "For Universities" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 dark:bg-primary-400 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
              <Link
                to="/login"
                className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Log In
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ${
              mobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
            }`}
          >
            <div className="space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              {[
                { to: "/features", label: "Features" },
                { to: "/learn-more", label: "How It Works" },
                { to: "/about", label: "About Us" },
                { to: "/register-university", label: "For Universities" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block mx-4 mt-4 py-3 text-center bg-primary-600 text-white text-base font-semibold rounded-lg shadow-md"
              >
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-20 relative z-10">
        <section className="min-h-[calc(80vh-80px)] flex items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-5 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]">
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full text-neutral-300 dark:text-neutral-800"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  width="80"
                  height="80"
                  patternUnits="userSpaceOnUse"
                  x="50%"
                  y="100%"
                  patternTransform="translate(0 -1)"
                >
                  <path
                    d="M0 80V.5H80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></path>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
            </svg>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Reconnect with Your Lost Items,{" "}
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent">
                  Effortlessly
                </span>
              </h1>
            </div>

            <p
              className="mt-6 max-w-2xl mx-auto text-lg text-neutral-600 dark:text-neutral-400 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              Our AI-powered platform simplifies the search for lost items on
              campus, connecting you with your belongings faster and more
              accurately than ever before.
            </p>

            <div
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <Link
                to="/login"
                className="group px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        <FeatureSlider features={features} />

        <section className="py-20 bg-white dark:bg-[#2a2a2a]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Three simple steps to recover your lost items.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 -translate-y-1/2"></div>
              {[
                {
                  icon: FilePlus,
                  title: "1. Report Your Item",
                  description:
                    "Quickly post details and a photo of a lost or found item using our simple form.",
                },
                {
                  icon: Sparkles,
                  title: "2. AI Does the Work",
                  description:
                    "Our smart system analyzes your post and searches for potential matches across campus.",
                },
                {
                  icon: Bell,
                  title: "3. Get Connected",
                  description:
                    "Receive instant notifications for matches and claims, then securely arrange the return.",
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="text-center group">
                    <div className="relative inline-block mb-6">
                      <div className="flex items-center justify-center h-16 w-16 bg-primary-100 dark:bg-primary-500/10 rounded-full mx-auto ring-4 ring-white dark:ring-[#2a2a2a]">
                        <step.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Key Features
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Built with students and administrators in mind.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FeatureCard {...feature} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-[#2a2a2a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-primary-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Your Campus Community?
            </h2>
            <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto">
              Register with your university email to start finding and reporting
              items today.
            </p>
            <Link
              to="/login"
              className="group px-10 py-4 bg-white text-primary-600 text-lg font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-[#1a1a1a] py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-3 text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4"
              >
                <img
                  src={logo}
                  alt="Campus Trace Logo"
                  className="h-10 w-auto rounded-full"
                />
                <span>CampusTrace</span>
              </Link>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
                The smart way to recover lost items on campus. Powered by AI,
                driven by community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/learn-more"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register-university"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    For Universities
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Contact
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:contact@campustrace.com"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    contact@campustrace.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center sm:flex sm:justify-between">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-0">
              © {new Date().getFullYear()} CampusTrace. All rights reserved.
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              A project by: Bugauisan, Respicio, & Cacho
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
