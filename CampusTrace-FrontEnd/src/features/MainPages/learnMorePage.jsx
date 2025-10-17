import React from "react";
import { Link } from "react-router-dom";
import {
  Server,
  BrainCircuit,
  ShieldCheck,
  UserPlus,
  LogIn,
  Settings,
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
    <div className="text-neutral-600 dark:text-neutral-400 text-lg space-y-4 leading-relaxed border-l-2 border-neutral-200 dark:border-neutral-800 pl-8 ml-5">
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
    <div className="bg-white dark:bg-black text-neutral-700 dark:text-zinc-300 min-h-screen pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16 animate-fade-in-up">
          <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-2">
            How Campus Trace Works
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white">
            Detailed Guide
          </h1>
        </header>

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
              page from the landing page. Fill out the form with your
              university's name, your full name, your official university email,
              and a secure password.
            </StepCard>
            <StepCard icon={LogIn} title="Instant Activation & Login" step="2">
              Upon submission, your university is instantly registered, your
              administrator account is created and activated, and your email
              domain is automatically whitelisted. You can then immediately
              proceed to the{" "}
              <Link to="/login" className="text-primary-600 hover:underline">
                login page
              </Link>
              .
            </StepCard>
            <StepCard icon={Settings} title="Configure Your Campus" step="3">
              Once logged in, you'll be directed to the Admin Dashboard. From
              the "Settings" page, you can add more allowed email domains (e.g.,
              for students vs. staff) and manage other campus-specific settings.
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

        {/* Section for General Users */}
        <FeatureSection title="Our Technology" icon={Server}>
          <p>
            Campus Trace is built to scale. Each university operates in its own
            secure, isolated environment using a **multi-tenant architecture**.
            An admin from one university can only view and manage data belonging
            to their own institution.
          </p>
          <p>
            This is enforced at the database level using Supabase's powerful
            **Row Level Security (RLS)**, ensuring data is never accidentally
            exposed across university boundaries.
          </p>
        </FeatureSection>

        <FeatureSection title="AI-Powered Intelligence" icon={BrainCircuit}>
          <p>
            We leverage the **Google Gemini AI API** to make finding items
            smarter and faster. When a user posts an item, our backend sends the
            description to Gemini for analysis.
          </p>
          <p>
            The AI automatically extracts relevant keywords and tags, which
            enhances our search algorithm and powers a proactive matching system
            to suggest possible reunions between lost items and their owners.
          </p>
        </FeatureSection>

        <FeatureSection title="Secure & Verified Community" icon={ShieldCheck}>
          <p>
            Trust is essential. We ensure every user is a verified member of
            their campus community by requiring sign-ups with an official
            university email address that has been approved by the campus
            administrator.
          </p>
          <p>
            This password-based method is highly secure and confirms that the
            user genuinely belongs to that institution.
          </p>
        </FeatureSection>
      </div>
    </div>
  );
}
