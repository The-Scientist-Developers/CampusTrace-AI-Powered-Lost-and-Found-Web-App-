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
  Map,
  MessageSquare,
  Zap,
  LayoutDashboard,
  Settings,
  Lock,
  University,
} from "lucide-react";
import logo from "../../Images/Logo.svg";

// --- Enhanced Custom Hook for Intersection Observer ---
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated, options]);

  return { ref, isInView, hasAnimated };
};

// --- Parallax Hook ---
const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return offset;
};

// --- Scroll Progress Bar Component ---
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalHeight) * 100;
      setProgress(currentProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[60]">
      <div
        className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-all duration-150 shadow-lg shadow-primary-500/50"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// --- Feature Slider Component with Enhanced Animation ---
const FeatureSlider = ({ features }) => {
  const { ref, hasAnimated } = useInView();

  return (
    <div ref={ref} className="py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center">
        <p
          className={`text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider mb-6 sm:mb-8 transition-all duration-1000 px-4 ${
            hasAnimated
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          KEY FEATURES OF CAMPUSTRACE
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="animate-slide flex w-max">
            {[...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="w-64 sm:w-80 flex-shrink-0 flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 hover:scale-105 transition-transform duration-300"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-lg text-neutral-600 dark:text-neutral-300 truncate">
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

// --- FAQ Item Component with Smooth Animation ---
const FAQItem = ({ question, answer, isOpen, onToggle, index }) => {
  const { ref, hasAnimated } = useInView();

  return (
    <div
      ref={ref}
      className={`border-b border-neutral-200 dark:border-neutral-800 last:border-0 transition-all duration-700 ${
        hasAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full py-5 sm:py-6 px-4 flex justify-between items-center text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg group transition-all duration-300"
      >
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-4 sm:pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {question}
        </h3>
        <div
          className={`p-1.5 sm:p-2 rounded-full bg-primary-100 dark:bg-primary-500/10 transition-all duration-500 flex-shrink-0 ${
            isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"
          }`}
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-500 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 pb-5 sm:pb-6 px-4 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Enhanced Feature Card Component ---
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const { ref, hasAnimated } = useInView();
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      className={`transform transition-all duration-700 ${
        hasAnimated
          ? "opacity-100 translate-y-0 rotate-0"
          : "opacity-0 translate-y-20 rotate-1"
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
        transform: isHovered
          ? `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${
              mousePosition.x
            }deg) translateZ(10px)`
          : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`relative rounded-2xl bg-white dark:bg-[#2a2a2a] p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-500 h-full group ${
          isHovered ? "scale-105" : "scale-100"
        }`}
      >
        {/* Glow Effect */}
        {isHovered && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400/20 to-purple-400/20 blur-xl -z-10 animate-pulse" />
        )}

        <div className="relative mb-4 sm:mb-6">
          <div
            className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg transition-all duration-500 ${
              isHovered ? "scale-110 rotate-6" : ""
            }`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
          </div>
          {isHovered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500/20 rounded-lg blur-md animate-ping" />
            </div>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
          {description}
        </p>

        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-2xl">
          <div
            className={`absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500/10 to-transparent transform rotate-45 transition-all duration-500 ${
              isHovered ? "scale-150" : "scale-100"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

// --- Feature Section Component ---
const FeatureSection = ({ title, subtitle, features, startIndex = 0 }) => {
  const { ref, hasAnimated } = useInView();
  const titleParallax = useParallax(0.1);

  return (
    <section ref={ref} className="py-16 sm:py-20 relative">
      <div
        className="absolute inset-0 opacity-5 dark:opacity-[0.02]"
        style={{ transform: `translateY(${titleParallax}px)` }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center mb-10 sm:mb-12 relative transition-all duration-1000 ${
            hasAnimated
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 relative inline-block">
            {title}
            <span
              className={`absolute -bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ${
                hasAnimated ? "w-full" : "w-0"
              }`}
              style={{ transitionDelay: "500ms" }}
            />
          </h2>
          <p
            className={`text-sm sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 sm:mt-6 transition-all duration-1000 px-4 ${
              hasAnimated ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={startIndex + index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0);
  const heroParallax = useParallax(0.3);
  const gridParallax = useParallax(-0.2);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  // Quick features for the slider
  const quickFeatures = [
    { icon: Sparkles, title: "AI-Powered Matching" },
    { icon: Search, title: "Visual Search" },
    { icon: MessageCircle, title: "In-App Messaging" },
    { icon: Award, title: "Gamification & Leaderboard" },
    { icon: KeyRound, title: "Secure Claim Process" },
    { icon: Users, title: "Verified Community" },
  ];

  // Detailed features for students
  const studentFeatures = [
    {
      icon: Sparkles,
      title: "AI-Powered Search",
      description:
        "Our smart search understands both text and images. Describe an item or upload a photo to find visually similar results instantly, powered by CLIP models.",
    },
    {
      icon: Zap,
      title: "Proactive Matching",
      description:
        "When you report a lost item, our system doesn't wait. It actively scans new 'found' posts and notifies you of high-probability matches on your dashboard.",
    },
    {
      icon: KeyRound,
      title: "Secure Claim Process",
      description:
        "Prove ownership by providing a unique detail only you would know. Your claim is sent privately to the finder for verification before any contact info is shared.",
    },
    {
      icon: Bell,
      title: "Real-Time Notifications",
      description:
        "Stay in the loop with instant alerts for new matches, claims on your items, and updates on your posts' moderation status.",
    },
    {
      icon: FilePlus,
      title: "AI-Enhanced Posting",
      description:
        "Not sure what to write? Our AI Helper, powered by Google Gemini, can take your basic description and enhance it to be more detailed and effective.",
    },
    {
      icon: UserCheck,
      title: "Intelligent Profile Photos",
      description:
        "To build a trusted community, our system ensures you upload a valid profile picture by using in-browser AI to detect if a face is present.",
    },
  ];

  // Features for administrators
  const adminFeatures = [
    {
      icon: LayoutDashboard,
      title: "Centralized Dashboard",
      description:
        "Get a real-time overview of your campus activity, including total users, active posts, recovery rates, and weekly trends, all in one place.",
    },
    {
      icon: Users,
      title: "Full User Management",
      description:
        "Easily manage all users within your university. Assign roles like 'Moderator' or 'Admin', and maintain community safety by banning users if necessary.",
    },
    {
      icon: ShieldCheck,
      title: "Effortless Content Moderation",
      description:
        "Review, approve, or reject new posts from a simple, intuitive interface to ensure all content aligns with your community standards.",
    },
    {
      icon: Settings,
      title: "Campus Configuration",
      description:
        "Tailor the platform to your needs. Set the site name, add multiple approved email domains (e.g., for students and staff), and create keyword blacklists for auto-flagging.",
    },
    {
      icon: Lock,
      title: "Secure Data Isolation",
      description:
        "Your university's data is completely separate from others. Our multi-tenant architecture with Row Level Security ensures total privacy and security.",
    },
    {
      icon: University,
      title: "Verified Community",
      description:
        "Ensure every user is a legitimate member of your campus by controlling which email domains are allowed to register.",
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

  const howItWorksRef = useInView();
  const ctaRef = useInView();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 flex flex-col overflow-x-hidden">
      <ScrollProgress />

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src={logo}
                alt="Campus Trace Logo"
                className="h-8 w-8 sm:h-10 sm:w-auto rounded-full group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
              />
              <span className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-white">
                CampusTrace
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {[
                { to: "#how-it-works", label: "How It Works", isAnchor: true },
                { to: "#features", label: "Features", isAnchor: true },
                { to: "/about", label: "About Us", isAnchor: false },
                {
                  to: "/register-university",
                  label: "For Universities",
                  isAnchor: false,
                },
              ].map((link, index) =>
                link.isAnchor ? (
                  <a
                    key={link.to}
                    href={link.to}
                    className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
                    style={{
                      animation: `fadeInDown 0.5s ease-out ${
                        index * 100
                      }ms both`,
                    }}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
                    style={{
                      animation: `fadeInDown 0.5s ease-out ${
                        index * 100
                      }ms both`,
                    }}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                )
              )}
              <Link
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300"
                style={{
                  animation: "fadeInDown 0.5s ease-out 400ms both",
                }}
              >
                Log In
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          <div
            className={`md:hidden overflow-hidden transition-all duration-500 ${
              mobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
            }`}
          >
            <div className="space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              {[
                { to: "#how-it-works", label: "How It Works", isAnchor: true },
                { to: "#features", label: "Features", isAnchor: true },
                { to: "/about", label: "About Us", isAnchor: false },
                {
                  to: "/register-university",
                  label: "For Universities",
                  isAnchor: false,
                },
              ].map((link, index) =>
                link.isAnchor ? (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-300 ${
                      mobileMenuOpen ? `animate-slideInLeft` : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-300 ${
                      mobileMenuOpen ? `animate-slideInLeft` : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block mx-4 mt-4 py-3 text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white text-base font-semibold rounded-lg shadow-md"
              >
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-16 sm:pt-20 relative z-10">
        {/* Hero Section with Parallax */}
        <section className="min-h-[calc(70vh-64px)] sm:min-h-[calc(80vh-80px)] flex items-center justify-center text-center relative overflow-hidden px-4">
          {/* Animated Background Grid */}
          <div
            className="absolute inset-0 opacity-20 dark:opacity-5 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]"
            style={{ transform: `translateY(${gridParallax}px)` }}
          >
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

          {/* Floating orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 sm:left-20 w-32 h-32 sm:w-64 sm:h-64 bg-primary-400/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary-600/10 rounded-full blur-3xl animate-float-delayed" />
          </div>

          <div
            className="max-w-4xl mx-auto py-12 sm:py-16 relative"
            style={{ transform: `translateY(${heroParallax}px)` }}
          >
            <div className="animate-fade-in-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Reconnect with Your Lost Items,{" "}
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 dark:from-primary-400 dark:via-primary-500 dark:to-primary-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] block sm:inline mt-2 sm:mt-0">
                  Effortlessly
                </span>
              </h1>
            </div>

            <p
              className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-neutral-400 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              Our AI-powered platform simplifies the search for lost items on
              campus, connecting you with your belongings faster and more
              accurately than ever before.
            </p>

            <div
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <Link
                to="/login"
                className="group px-6 sm:px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Slider */}
        <FeatureSlider features={quickFeatures} />

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-16 sm:py-20 bg-white dark:bg-[#2a2a2a]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div
              ref={howItWorksRef.ref}
              className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${
                howItWorksRef.hasAnimated
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
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
              ].map((step, index) => {
                const stepRef = useInView();
                return (
                  <div
                    key={step.title}
                    ref={stepRef.ref}
                    className={`relative transition-all duration-700 ${
                      stepRef.hasAnimated
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="text-center group">
                      <div className="relative inline-block mb-4 sm:mb-6">
                        <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-primary-100 dark:bg-primary-500/10 rounded-full mx-auto ring-4 ring-white dark:ring-[#2a2a2a] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                          <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3">
                        {step.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-xs sm:text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features for Students */}
        <div id="features">
          <FeatureSection
            title="For Students & Staff"
            subtitle="Powerful tools designed to make finding and returning items effortless."
            features={studentFeatures}
            startIndex={0}
          />

          {/* Features for Administrators */}
          <section className="bg-white dark:bg-[#2a2a2a]">
            <FeatureSection
              title="For University Administrators"
              subtitle="A complete suite of tools to manage your campus community with ease."
              features={adminFeatures}
              startIndex={6}
            />
          </section>
        </div>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={ctaRef.ref}
          className={`py-16 sm:py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 text-white text-center relative overflow-hidden transition-all duration-1000 ${
            ctaRef.hasAnimated ? "opacity-100" : "opacity-50"
          }`}
        >
          {/* Animated background shapes */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse-delayed" />
          </div>

          <div
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative transition-all duration-1000 ${
              ctaRef.hasAnimated
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to Join Your Campus Community?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-white/90 max-w-2xl mx-auto">
              Register with your university email to start finding and reporting
              items today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="group px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary-600 text-base sm:text-lg font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <span className="relative z-10">Get Started Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/register-university"
                className="group px-8 sm:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-base sm:text-lg font-bold rounded-lg hover:bg-white/20 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300"
              >
                For Universities
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-[#1a1a1a] py-12 sm:py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 sm:mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4 group"
              >
                <img
                  src={logo}
                  alt="Campus Trace Logo"
                  className="h-8 w-8 sm:h-10 sm:w-auto rounded-full group-hover:rotate-12 transition-transform duration-500"
                />
                <span>CampusTrace</span>
              </Link>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
                The smart way to recover lost items on campus. Powered by AI,
                driven by community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register-university"
                    className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block"
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
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="mailto:contactCampustrace@gmail.com"
                    className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 break-words"
                  >
                    contactCampustrace@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center sm:flex sm:justify-between">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-0">
              © {new Date().getFullYear()} CampusTrace. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              A project by: Bugauisan, Respicio, & Cacho
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(-10deg);
          }
        }

        @keyframes pulse-delayed {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes slide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fadeIn 1s ease-out 200ms both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-pulse-delayed {
          animation: pulse-delayed 4s ease-in-out infinite;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        .animate-slide {
          animation: slide 30s linear infinite;
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
