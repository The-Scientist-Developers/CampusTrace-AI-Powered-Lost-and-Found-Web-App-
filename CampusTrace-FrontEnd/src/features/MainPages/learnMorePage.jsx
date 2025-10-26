import React from "react";
import { Link } from "react-router-dom";
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
  BarChart2, // Changed from BarChart3 for variety if needed, or keep BarChart3
  Bell,
  MessageSquare, // Added for messaging
  Camera, // Added for visual search
  KeyRound, // Added for claim process
  Database, // Added for database/security
  Mail, // Added for email verification
} from "lucide-react";
import { motion } from "framer-motion"; // Import motion
import { useInView } from "react-intersection-observer"; // Use react-intersection-observer

// --- Feature Section Component (Reused with animation) ---
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

// --- Step Card Component (Reused with animation) ---
const StepCard = ({ icon: Icon, title, step, children, index }) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className="flex gap-6 relative" // Added relative positioning
    >
      {/* Connecting line for all but the last card */}
      {index < 3 && ( // Assuming 4 steps, adjust if different
        <div className="absolute left-[23px] top-14 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -z-10"></div>
      )}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg ring-4 ring-primary-100 dark:ring-primary-900/30 mb-2">
          {step}
        </div>
        {/* Removed the vertical line div here, handled by absolute line above */}
      </div>
      <div className="pb-12 pt-1">
        {" "}
        {/* Adjusted padding */}
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">
            {title}
          </h3>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed">
          {" "}
          {/* Adjusted text size */}
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
    <div className="bg-white dark:bg-[#1a1a1a] text-neutral-700 dark:text-gray-100 min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          ref={headerRef.ref}
          initial={{ opacity: 0, y: -30 }}
          animate={headerRef.inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 sm:mb-20"
        >
          <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-3 text-sm">
            Inside CampusTrace
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            How It All Works
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            A comprehensive guide to using CampusTrace, for both users and
            administrators.
          </p>
        </motion.header>

        {/* --- Section for General Users --- */}
        <div className="mb-20 sm:mb-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral-800 dark:text-white mb-12 sm:mb-16 border-b-2 border-primary-500/30 pb-4 inline-block mx-auto">
            For Students & Staff 🧑‍🎓👩‍🏫
          </h2>
          <div className="relative">
            {" "}
            {/* Added relative for line positioning */}
            <StepCard
              icon={UserPlus}
              title="Easy & Secure Sign Up"
              step="1"
              index={0} // Add index for animation delay
            >
              Join using your official university email (e.g.,
              `yourname@university.edu`). Our system verifies your domain
              against your university's approved list, granting immediate
              access. Don't have one? Use the **Manual Registration** option
              with your personal email and university ID photo – an admin will
              verify your request. Includes **Google reCAPTCHA** for security.
            </StepCard>
            <StepCard
              icon={FilePlus}
              title="Report Lost or Found Items"
              step="2"
              index={1}
            >
              Click "Post New Item". Describe the item (color, brand, unique
              marks), specify the category and location. Uploading a clear photo
              is highly recommended. Use the **AI Helper (powered by Google
              Gemini)** to automatically enhance your description and generate
              relevant keyword tags for better searchability.
            </StepCard>
            <StepCard
              icon={Search}
              title="Find Items & AI Matches"
              step="3"
              index={2}
            >
              Browse all approved items on the "Browse All" page using filters
              (status, category, date) and text search. For lost items, check
              your main dashboard for **AI-Powered Matches** generated by
              comparing text and image embeddings (using SentenceTransformers &
              CLIP) with 'Found' items. You can also perform a **Visual Search**
              by uploading an image.
            </StepCard>
            <StepCard
              icon={KeyRound} // Changed icon
              title="Claim & Communicate Securely"
              step="4"
              index={3}
            >
              Found your item? Click "Claim This Item" and provide a unique
              identifying detail. The finder reviews your claim privately. If
              approved, a **secure in-app chat** is created automatically in the
              "Messages" section. Use this chat to coordinate a safe return on
              campus without sharing personal contact info unless you choose to.
            </StepCard>
          </div>
          {/* User CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerRef.inView ? { opacity: 1, y: 0 } : {}} // Trigger based on header view
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105 hover:-translate-y-1 duration-300"
            >
              Sign Up or Log In <LogIn size={20} />
            </Link>
          </motion.div>
        </div>

        {/* Section for University Admins */}
        <div className="mb-20 sm:mb-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral-800 dark:text-white mb-12 sm:mb-16 border-b-2 border-primary-500/30 pb-4 inline-block mx-auto">
            For University Admins 🛡️
          </h2>
          <div className="relative">
            {" "}
            {/* Added relative for line positioning */}
            <StepCard
              icon={UserPlus}
              title="Register Your University"
              step="1"
              index={0}
            >
              Visit the{" "}
              <Link
                to="/register-university"
                className="text-primary-600 hover:underline font-medium"
              >
                "For Universities"
              </Link>{" "}
              page. Provide your university's name and your official admin
              email. This creates the initial admin account and automatically
              registers your email domain. You'll receive a verification email.
            </StepCard>
            <StepCard
              icon={LogIn}
              title="Access the Admin Dashboard"
              step="2"
              index={1}
            >
              After verifying your email and logging in, you'll be directed to
              the Admin Dashboard. Here you get an **Overview** with key
              statistics (users, pending items, recovery rate) and activity
              charts, updated in real-time.
            </StepCard>
            <StepCard
              icon={Settings}
              title="Configure Campus Settings"
              step="3"
              index={2}
            >
              Go to "Settings" to customize CampusTrace for your institution.
              Set the public site name, add **multiple allowed email domains**
              (e.g., for students, faculty, alumni), enable/disable
              auto-approval for new posts, and create a **keyword blacklist** to
              automatically flag posts for review.
            </StepCard>
            <StepCard
              icon={Users}
              title="Manage Users & Moderate Content"
              step="4"
              index={3}
            >
              Use "User Management" to view, search, assign roles (Member,
              Moderator, Admin), and ban users. Approve or reject ID
              verification requests in "Manual Verifications". Review new item
              posts in "Post Moderation", view details (including images), and
              approve/reject them, triggering notifications to the user.
            </StepCard>
          </div>
          {/* Admin CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerRef.inView ? { opacity: 1, y: 0 } : {}} // Trigger based on header view
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

        {/* Technology Sections */}
        <FeatureSection title="Core Technology" icon={Server}>
          <p>
            CampusTrace runs on a modern stack: a **FastAPI (Python)** backend
            for high performance and asynchronous operations, paired with a
            **React (Vite)** frontend for a smooth, interactive user experience.
          </p>
          <p>
            The foundation is **Supabase**, providing a managed **PostgreSQL**
            database with vector support (pgvector), secure authentication, file
            storage for images, and real-time updates via websockets for
            notifications and messaging.
          </p>
        </FeatureSection>

        <FeatureSection title="AI Integration" icon={BrainCircuit}>
          <p>
            Multiple AI models enhance CampusTrace:
            <ul className="list-disc space-y-2 pl-6 mt-3">
              <li>
                **Google Gemini:** Powers the "Enhance with AI" feature for post
                descriptions and generates relevant keyword tags automatically
                upon posting.
              </li>
              <li>
                **CLIP Model:** Generates vector embeddings from uploaded item
                images, enabling powerful visual search capabilities.
              </li>
              <li>
                **SentenceTransformers:** Creates vector embeddings from item
                titles and descriptions for semantic text matching alongside
                visual matching.
              </li>
              <li>
                **MediaPipe Face Detection:** Runs in the browser during profile
                picture upload/capture to ensure a valid face is present,
                enhancing community trust (no data sent to server for this).
              </li>
            </ul>
          </p>
        </FeatureSection>

        <FeatureSection title="Security & Verification" icon={ShieldCheck}>
          <p>
            Security is paramount:
            <ul className="list-disc space-y-2 pl-6 mt-3">
              <li>
                **Domain Whitelisting:** Admins control allowed university email
                domains for standard registration.
              </li>
              <li>
                **Manual Verification:** A secure process for users with
                personal emails, requiring admin approval of uploaded university
                IDs stored securely in Supabase Storage.
              </li>
              <li>
                **Google reCAPTCHA:** Protects both standard and manual sign-up
                forms from bots.
              </li>
              <li>
                **Multi-Tenancy with RLS:** Supabase Row Level Security strictly
                isolates data (posts, users, messages) between different
                universities, ensuring privacy.
              </li>
              <li>
                **Secure Claims & Messaging:** The claim process and in-app chat
                prevent premature sharing of personal contact information.
              </li>
            </ul>
          </p>
        </FeatureSection>

        {/* Final CTA */}
        <motion.div
          ref={ctaRef.ref}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ctaRef.inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-20 text-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-neutral-800 dark:to-neutral-900 p-10 sm:p-14 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-5">
            Ready to Experience Smarter Lost & Found?
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8">
            Join CampusTrace today and help build a more connected and helpful
            campus community.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105 hover:-translate-y-1 duration-300"
          >
            Get Started <LogIn size={20} />
          </Link>
        </motion.div>
      </div>
      {/* Basic CSS for animations if not using Tailwind animations directly */}
      <style jsx>{`
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
