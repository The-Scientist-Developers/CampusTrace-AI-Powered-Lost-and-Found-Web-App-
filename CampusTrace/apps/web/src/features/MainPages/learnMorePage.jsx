import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Server,
  BrainCircuit,
  ShieldCheck,
  UserPlus,
  LogIn,
  Settings,
  FilePlus,
  Search,
  CheckCircle,
  Users,
  BarChart2,
  Bell,
  MessageSquare,
  Camera,
  KeyRound,
  Database,
  Mail,
  University,
  Home,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import logo from "../../Images/Logo.svg";

const FeatureSection = ({ icon: Icon, title, children }) => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-16"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary-100 dark:bg-primary-500/10 p-4 rounded-xl shadow-sm">
          <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="text-neutral-600 dark:text-neutral-400 text-lg space-y-5 leading-relaxed border-l-4 border-primary-500/30 pl-8 ml-6">
        {children}
      </div>
    </motion.section>
  );
};

const StepCard = ({ icon: Icon, title, step, children, index }) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className="flex gap-6 relative"
    >
      {index < 3 && (
        <div className="absolute left-[23px] top-14 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -z-10"></div>
      )}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg ring-4 ring-primary-100 dark:ring-primary-900/30 mb-2">
          {step}
        </div>
      </div>
      <div className="pb-12 pt-1">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">
            {title}
          </h3>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed">
          {children}
        </p>
      </div>
    </motion.div>
  );
};

export default function LearnMorePage() {
  const headerRef = useInView({ threshold: 0.5, triggerOnce: true });
  const ctaRef = useInView({ threshold: 0.5, triggerOnce: true });

  return (
    <div className="bg-white dark:bg-[#1a1a1a] text-neutral-700 dark:text-gray-100 min-h-screen">
      <Helmet>
        <title>How CampusTrace Works - Learn More About Our Platform</title>
        <meta
          name="description"
          content="Discover how CampusTrace works with AI-powered matching, secure authentication, and real-time notifications. Learn about our intelligent lost and found platform for universities."
        />
        <meta
          name="keywords"
          content="how campustrace works, lost and found platform, AI matching, university system, campus security, item recovery process"
        />
      </Helmet>

      {/* Header with Logo and Back Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="CampusTrace logo"
                className="h-10 w-10 sm:h-11 sm:w-11 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
              />
              <span
                className="text-2xl sm:text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white"
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                CampusTrace
              </span>
            </Link>

            {/* Back to Home Button */}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-primary-700 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <Home className="w-4 h-4 sm:hidden" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.header
            ref={headerRef.ref}
            initial={{ opacity: 0, y: -30 }}
            animate={headerRef.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 sm:mb-20"
          >
            <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-3 text-xs">
              Platform Overview
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              How CampusTrace Works
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              A comprehensive guide to leveraging our intelligent lost and found
              platform for your university community.
            </p>
          </motion.header>

          <div className="mb-20 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-neutral-800 dark:text-white mb-12 sm:mb-16 border-b-2 border-primary-500/30 pb-4 inline-block mx-auto">
              For Students & Staff
            </h2>
            <div className="relative">
              <StepCard
                icon={UserPlus}
                title="Secure Registration Process"
                step="1"
                index={0}
              >
                Register seamlessly using your institutional email address
                (e.g., yourname@university.edu). Our system automatically
                verifies your domain against the university's authorized list,
                providing instant access. For users without institutional email,
                our Manual Registration pathway allows submission with personal
                email and student ID verification, subject to administrative
                approval. All registrations are protected by Google reCAPTCHA
                for enhanced security.
              </StepCard>
              <StepCard
                icon={FilePlus}
                title="Report Lost or Found Items"
                step="2"
                index={1}
              >
                Navigate to "Post New Item" to create a detailed report. Include
                comprehensive descriptions (color, brand, distinguishing
                features), select appropriate categories, and specify the
                location. Upload high-quality photographs to improve visibility.
                Our AI Assistant, powered by Google Gemini, automatically
                enhances descriptions and generates relevant tags to maximize
                discoverability.
              </StepCard>
              <StepCard
                icon={Search}
                title="Advanced Search & AI Matching"
                step="3"
                index={2}
              >
                Access the "Browse All" page to explore approved items using
                advanced filters (status, category, date range) and keyword
                search. For lost items, your dashboard displays AI-generated
                matches created by analyzing text and image embeddings through
                Jina AI. Additionally, utilize our Visual Search feature by
                uploading an image for instant matching.
              </StepCard>
              <StepCard
                icon={KeyRound}
                title="Secure Claims & Communication"
                step="4"
                index={3}
              >
                Initiate a claim by selecting "Claim This Item" and providing
                unique identifying information. The item owner reviews claims
                privately and, upon approval, an encrypted in-app messaging
                channel is automatically established. This secure communication
                system enables coordination for item return while maintaining
                privacy—personal contact information remains protected unless
                voluntarily shared.
              </StepCard>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={headerRef.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center mt-12"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105 hover:-translate-y-1 duration-300"
              >
                Get Started <LogIn size={20} />
              </Link>
            </motion.div>
          </div>

          <div className="mb-20 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-neutral-800 dark:text-white mb-12 sm:mb-16 border-b-2 border-primary-500/30 pb-4 inline-block mx-auto">
              For University Administrators
            </h2>
            <div className="relative">
              <StepCard
                icon={UserPlus}
                title="University Registration"
                step="1"
                index={0}
              >
                Access the{" "}
                <Link
                  to="/register-university"
                  className="text-primary-600 hover:underline font-medium"
                >
                  "For Universities"
                </Link>{" "}
                portal to initiate registration. Submit your institution's
                official name and administrative email address. This process
                establishes the primary administrator account and automatically
                configures your email domain for authentication. Email
                verification is required for activation.
              </StepCard>
              <StepCard
                icon={LogIn}
                title="Administrative Dashboard Access"
                step="2"
                index={1}
              >
                Following email verification and authentication, administrators
                gain access to the comprehensive Admin Dashboard. This
                centralized control panel provides real-time analytics including
                user metrics, pending item reviews, recovery rates, and
                interactive activity visualizations for data-driven decision
                making.
              </StepCard>
              <StepCard
                icon={Settings}
                title="Platform Configuration"
                step="3"
                index={2}
              >
                Navigate to "Settings" to customize CampusTrace for your
                institution's specific requirements. Configure the public-facing
                site identity, manage multiple email domain authorizations
                (accommodating students, faculty, and alumni), establish
                auto-approval policies for content, and implement keyword
                filtering for automated content moderation.
              </StepCard>
              <StepCard
                icon={Users}
                title="User Management & Content Moderation"
                step="4"
                index={3}
              >
                Utilize the User Management interface to search, view profiles,
                assign roles (Member, Moderator, Administrator), and enforce
                access restrictions. Process identity verification requests
                through the Manual Verifications queue. Review submitted items
                in the Post Moderation panel, with capabilities to examine full
                details including images, approve or reject submissions, and
                trigger automated user notifications.
              </StepCard>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={headerRef.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-center mt-12"
            >
              <Link
                to="/register-university"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105 hover:-translate-y-1 duration-300"
              >
                Register Your University <University size={20} />
              </Link>
            </motion.div>
          </div>

          <motion.div
            ref={ctaRef.ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={ctaRef.inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mt-20 text-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-neutral-800 dark:to-neutral-900 p-10 sm:p-14 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-5">
              Transform Your Campus Lost & Found Experience
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8">
              Join thousands of universities leveraging intelligent technology
              to reunite community members with their belongings.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105 hover:-translate-y-1 duration-300"
            >
              Get Started Today <LogIn size={20} />
            </Link>
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
