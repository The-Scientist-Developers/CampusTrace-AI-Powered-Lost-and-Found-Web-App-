import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  FilePlus,
  Sparkles,
  Bell,
  ChevronDown,
  Users,
  Menu,
  X,
  CheckCircle2,
  Package,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Clock,
  MessageCircle,
  Heart,
  TrendingUp,
  Award,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import logo from "../../Images/Logo.svg";

// Animated counter component with enhanced animation
const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = countRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={countRef} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Enhanced FAQ Item Component with better animations
const FAQItem = ({ question, answer, isOpen, onToggle, index }) => {
  return (
    <div
      className="border-b border-neutral-200 dark:border-neutral-800 last:border-0 transform transition-all duration-300 hover:scale-[1.01]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full py-6 px-4 flex justify-between items-center text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-300 group"
      >
        <h3 className="text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-500 transition-colors">
          {question}
        </h3>
        <div
          className={`p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-48 opacity-100 pb-6" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-neutral-600 dark:text-zinc-400 px-4 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

// Floating animation component
const FloatingElement = ({ children, delay = 0 }) => {
  return (
    <div
      className="animate-float"
      style={{
        animationDelay: `${delay}s`,
        animation: `float 6s ease-in-out ${delay}s infinite`,
      }}
    >
      {children}
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <div
      className="group relative p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:-translate-y-2 hover:scale-105 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 to-primary-600/0 group-hover:from-primary-600/5 group-hover:to-primary-500/5 transition-all duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-primary-600 dark:text-primary-500" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 text-center">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-zinc-400 text-center leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

// Testimonial Card
const TestimonialCard = ({ name, role, content, rating }) => {
  return (
    <div className="group bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-neutral-300 dark:text-neutral-600"
            }`}
          />
        ))}
      </div>
      <p className="text-neutral-600 dark:text-zinc-400 mb-4 italic">
        "{content}"
      </p>
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mr-3" />
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">
            {name}
          </p>
          <p className="text-sm text-neutral-500 dark:text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enhanced features data
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description:
        "Smart algorithms analyze text and images to find your items instantly",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description:
        "Your information is protected and only shared when you approve",
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description: "Instant notifications when potential matches are found",
    },
    {
      icon: Users,
      title: "Campus Community",
      description: "Connect with verified members from your university",
    },
    {
      icon: MessageCircle,
      title: "Easy Communication",
      description: "Built-in messaging to coordinate item returns safely",
    },
    {
      icon: TrendingUp,
      title: "95% Success Rate",
      description: "Proven track record of reuniting items with their owners",
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content:
        "Found my laptop within 2 hours! The AI matching feature is incredible.",
      rating: 5,
    },
    {
      name: "Mike Johnson",
      role: "Engineering Student",
      content:
        "So much better than the old bulletin board system. Love the notifications!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Medical Student",
      content:
        "Recovered my expensive textbooks thanks to CampusTrace. Lifesaver!",
      rating: 5,
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does the AI-powered 'Possible Matches' feature work?",
      answer:
        "When you report a 'Lost' item, our AI automatically scans all 'Found' items, analyzing text and images for similarities. High-probability matches appear on your main dashboard to help you get your item back faster.",
    },
    {
      question: "How do I claim an item that I think is mine?",
      answer:
        "On the 'Browse All' page, click a 'Found' item and then 'Claim This Item.' You must provide a unique detail that only the owner would know. This message is sent privately to the finder to verify your ownership.",
    },
    {
      question: "Is my contact information shared publicly?",
      answer:
        "No. Your primary email address is only shared between two users after a claim on a 'Found' item has been officially approved by the finder. Any optional contact information you add to a post will be visible.",
    },
    {
      question: "Why must I use my university email to sign up?",
      answer:
        "This policy ensures that only verified students, faculty, and staff from your university can access the platform, creating a trusted and secure community environment.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 text-neutral-800 dark:text-zinc-300 flex flex-col overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Animated background gradient that follows mouse */}
      <div
        className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`,
        }}
      />

      {/* Header with enhanced animations */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg shadow-sm border-b border-neutral-200/50 dark:border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="flex items-center gap-3 text-3xl font-extrabold text-primary-600 dark:text-primary-500 tracking-tight group"
              >
                <img
                  src={logo}
                  alt="Campus Trace Logo"
                  className="h-10 w-auto rounded-full group-hover:scale-110 transition-transform duration-300"
                />
                <span className="hidden sm:inline bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  CampusTrace
                </span>
              </Link>
            </div>

            {/* Desktop Navigation with hover effects */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { to: "/learn-more", label: "How It Works" },
                { to: "/about", label: "About Us" },
                { to: "/register-university", label: "For Universities" },
              ].map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative text-base font-medium text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors duration-200 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 dark:bg-primary-500 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
              <Link
                to="/login"
                className="relative px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10">Log In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>

            {/* Mobile menu button with animation */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? "opacity-0 rotate-180"
                      : "opacity-100 rotate-0"
                  }`}
                />
                <X
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? "opacity-100 rotate-0"
                      : "opacity-0 -rotate-180"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Enhanced Mobile Navigation */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-500 ${
              mobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
            }`}
          >
            <div className="space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              {[
                { to: "/learn-more", label: "How It Works" },
                { to: "/about", label: "About Us" },
                { to: "/register-university", label: "For Universities" },
              ].map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-4 py-3 text-base font-medium text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: mobileMenuOpen
                      ? "slideInLeft 0.3s ease-out forwards"
                      : "",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                className="block mx-4 mt-4 py-3 text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white text-base font-semibold rounded-xl shadow-lg"
                style={{
                  animationDelay: "150ms",
                  animation: mobileMenuOpen
                    ? "slideInLeft 0.3s ease-out forwards"
                    : "",
                }}
              >
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-20 relative z-10">
        {/* Enhanced Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-primary-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 dark:bg-primary-800/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-400 dark:bg-primary-700/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Reconnect with Your Lost Items,{" "}
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent animate-gradient bg-300">
                  Effortlessly
                </span>
              </h1>
            </div>

            <p className="mt-6 md:mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-neutral-600 dark:text-zinc-400 animate-fade-in-up animation-delay-200">
              Our AI-powered platform simplifies the search for lost and found
              items on campus, connecting you with your belongings faster and
              more accurately than ever before.
            </p>

            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Link
                to="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <Link
                to="/learn-more"
                className="px-8 py-4 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-zinc-700 text-neutral-700 dark:text-zinc-300 text-lg font-bold rounded-xl hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 animate-fade-in animation-delay-600">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-zinc-400">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm">Verified Users Only</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-zinc-400">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm">Instant Matching</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-zinc-400">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-sm">Community Driven</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="py-20 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                Why Choose{" "}
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  CampusTrace?
                </span>
              </h2>
              <p className="text-lg text-neutral-600 dark:text-zinc-400 max-w-2xl mx-auto">
                Experience the future of campus lost and found with our
                innovative features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FeatureCard {...feature} delay={index * 100} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section
        <section className="py-20 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                What Students Are Saying
              </h2>
              <p className="text-lg text-neutral-600 dark:text-zinc-400">
                Join thousands of satisfied users on campus
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.name}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <TestimonialCard {...testimonial} />
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* Enhanced How It Works Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/5 to-transparent dark:via-primary-900/5" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-neutral-600 dark:text-zinc-400">
                Three simple steps to recover your lost items
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connection lines for desktop */}
              <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800" />

              {[
                {
                  icon: FilePlus,
                  title: "Report Your Item",
                  description:
                    "Quickly post details about a lost or found item using our simple form with photo upload.",
                },
                {
                  icon: Sparkles,
                  title: "AI Does the Work",
                  description:
                    "Our smart system analyzes and instantly searches for potential matches across campus.",
                },
                {
                  icon: Bell,
                  title: "Get Connected",
                  description:
                    "Receive instant notifications and connect securely through the app.",
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="text-center group">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary-600 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative flex items-center justify-center h-20 w-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full mx-auto mb-6 group-hover:scale-110 transform transition-all duration-300 shadow-lg">
                        <step.icon className="w-10 h-10 text-primary-600 dark:text-primary-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced FAQ Section */}
        <section className="py-20 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-neutral-600 dark:text-zinc-400">
                Everything you need to know about CampusTrace
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-xl animate-fade-in-up animation-delay-200">
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

        {/* Enhanced CTA Section */}
        <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white text-center relative overflow-hidden animate-gradient bg-300">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black opacity-10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay opacity-10 animate-blob" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay opacity-10 animate-blob animation-delay-2000" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Ready to Join Your Campus Community?
              </h2>
              <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                Register with your university email to start finding and
                reporting items today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="group relative px-10 py-4 bg-white text-primary-600 text-lg font-bold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap justify-center gap-8 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Free for students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Setup in 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white dark:bg-neutral-950 py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-1 md:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-3 text-2xl font-extrabold text-primary-600 dark:text-primary-500 mb-4"
              >
                <img
                  src={logo}
                  alt="Campus Trace Logo"
                  className="h-10 w-auto rounded-full"
                />
                <span>CampusTrace</span>
              </Link>
              <p className="text-neutral-600 dark:text-zinc-400 mb-6 max-w-md">
                The smart way to recover lost items on campus. Powered by AI,
                driven by community.
              </p>
              <div className="flex gap-4">{/* Social links can go here */}</div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/learn-more"
                    className="text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register-university"
                    className="text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                  >
                    For Universities
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Contact
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:contact@campustrace.com"
                    className="text-neutral-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                  >
                    contact@campustrace.com
                  </a>
                </li>
                <li className="text-neutral-600 dark:text-zinc-400">
                  Available 24/7
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-center sm:flex sm:justify-between sm:items-center">
              <p className="text-neutral-500 dark:text-zinc-500 mb-4 sm:mb-0">
                © {new Date().getFullYear()} CampusTrace. All rights reserved.
              </p>
              <div className="text-neutral-500 dark:text-zinc-500 text-sm">
                <p>A project by: Bugauisan, Respicio, & Cacho</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Add required CSS animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
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

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .bg-300 {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}
