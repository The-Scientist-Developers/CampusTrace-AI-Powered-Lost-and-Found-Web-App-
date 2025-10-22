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
  BarChart2,
  Bell,
} from "lucide-react";

const FeatureSection = ({ icon: Icon, title, children }) => (
  <section className="mb-16 animate-fade-in-up">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-primary-600/10 p-3 rounded-full">
        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
        {title}
      </h2>
    </div>
    <div className="text-neutral-600 dark:text-neutral-400 text-lg space-y-4 leading-relaxed border-l-2 border-neutral-200 dark:border-[#3a3a3a] pl-8 ml-5">
      {children}
    </div>
  </section>
);

const StepCard = ({ icon: Icon, title, step, children }) => (
  <div className="flex gap-6">
    <div className="flex flex-col items-center">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
        {step}
      </div>
      <div className="w-px h-full bg-neutral-200 dark:bg-neutral-700"></div>
    </div>
    <div className="pb-12">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400">{children}</p>
    </div>
  </div>
);

export default function LearnMorePage() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] text-neutral-700 dark:text-gray-100 min-h-screen pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16 animate-fade-in-up">
          <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-2">
            How CampusTrace Works
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white">
            A Detailed Guide
          </h1>
        </header>

        {/* --- Section for General Users --- */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white mb-12">
            For Students & Staff
          </h2>
          <div>
            <StepCard
              icon={UserPlus}
              title="Sign Up with Your University Email"
              step="1"
            >
              To ensure a secure community, you must sign up using your official
              university email address. Our system verifies that your email
              domain is on your university's approved list, instantly connecting
              you to your campus's private lost and found network.
            </StepCard>
            <StepCard
              icon={FilePlus}
              title="Post a Lost or Found Item"
              step="2"
            >
              Use the simple form to post details about your item. You can write
              a basic description and use our **AI Helper** to enhance it with
              key details. If you lost an item, our system immediately starts
              looking for matches.
            </StepCard>
            <StepCard icon={Search} title="Find and Claim Your Item" step="3">
              If you lost an item, check your dashboard for AI-powered "Possible
              Matches." You can also browse all "Found" items or use our
              **Visual Search** by uploading an image. When you see yours, click
              "Claim This Item" and provide a secret detail to prove ownership.
              The finder will be notified privately to review your claim.
            </StepCard>
            <StepCard
              icon={CheckCircle}
              title="Approve Claims & Recover"
              step="4"
            >
              If you found an item, you'll receive a notification when someone
              claims it. Review their claim on your "My Posts" page. Once a
              claim is approved, the system securely shares contact details so
              you can coordinate a safe return on campus.
            </StepCard>
          </div>
          <div className="text-center mt-8 animate-fade-in-up">
            <Link
              to="/login"
              className="px-8 py-3 bg-primary-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Section for University Admins */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white mb-12">
            For University Administrators
          </h2>
          <div>
            <StepCard icon={UserPlus} title="Register Your University" step="1">
              Navigate to the{" "}
              <Link
                to="/register-university"
                className="text-primary-600 hover:underline"
              >
                "For Universities"
              </Link>{" "}
              page. Fill out the form with your university's name and your
              official admin email to create the master account for your
              institution.
            </StepCard>
            <StepCard icon={LogIn} title="Instant Activation & Login" step="2">
              Upon submission, your university is instantly registered, your
              administrator account is created, and your email domain is
              automatically whitelisted for sign-ups. You can then immediately
              proceed to the{" "}
              <Link to="/login" className="text-primary-600 hover:underline">
                login page
              </Link>
              .
            </StepCard>
            <StepCard icon={Settings} title="Configure Your Campus" step="3">
              From the Admin Dashboard, you can manage user roles, moderate
              posts, view analytics, and configure campus-specific settings like
              adding more allowed email domains (e.g., `student.university.edu`
              vs `staff.university.edu`) or setting up keyword blacklists for
              content filtering.
            </StepCard>
            <StepCard icon={Users} title="Manage Your Community" step="4">
              The admin dashboard provides a comprehensive user management
              interface. You can view all registered users, assign roles
              (Member, Moderator, Admin), and ban users if necessary to maintain
              a safe and productive environment.
            </StepCard>
          </div>
          <div className="text-center mt-8 animate-fade-in-up">
            <Link
              to="/register-university"
              className="px-8 py-3 bg-primary-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105"
            >
              Register Your University Now
            </Link>
          </div>
        </div>

        {/* Section for Technology */}
        <FeatureSection title="Our Technology Stack" icon={Server}>
          <p>
            CampusTrace is built on a modern, scalable tech stack. The backend
            is powered by **FastAPI**, a high-performance Python framework,
            chosen for its speed and asynchronous capabilities. The frontend is
            a dynamic **React** single-page application built with Vite,
            ensuring a fast and responsive user experience.
          </p>
          <p>
            Our entire infrastructure is built on **Supabase**, an open-source
            Firebase alternative, which provides a robust **PostgreSQL**
            database, authentication, file storage, and real-time capabilities.
            This allows for rapid development and a highly reliable and scalable
            platform.
          </p>
        </FeatureSection>

        <FeatureSection title="AI-Powered Intelligence" icon={BrainCircuit}>
          <p>
            We leverage a multi-faceted AI approach. For text analysis,
            description enhancement, and generating keyword tags, we use the
            powerful **Google Gemini AI API**. For image-based searching and
            matching, we utilize the **CLIP (Contrastive Language–Image
            Pre-training) model** and **SentenceTransformers** to create vector
            embeddings of images and text.
          </p>
          <p>
            This dual-AI strategy allows our search algorithm to understand both
            the textual and visual context of an item, powering a proactive
            matching system that suggests reunions with high accuracy.
          </p>
        </FeatureSection>

        <FeatureSection title="Secure & Verified Community" icon={ShieldCheck}>
          <p>
            Trust is essential. We ensure every user is a verified member of
            their campus community by requiring sign-ups with an official
            university email address. This is enforced by a domain whitelist
            controlled by each university's administrator. We also integrate
            **Google reCAPTCHA** to protect against automated sign-ups.
          </p>
          <p>
            Furthermore, each university operates in its own secure, isolated
            environment using a **multi-tenant architecture**. This is enforced
            at the database level using Supabase's powerful **Row Level Security
            (RLS)**, ensuring data is never accidentally exposed across
            university boundaries.
          </p>
        </FeatureSection>
      </div>
    </div>
  );
}
