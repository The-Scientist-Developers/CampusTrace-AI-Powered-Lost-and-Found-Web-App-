import React from "react";
import { Link } from "react-router-dom";
import { Server, BrainCircuit, ShieldCheck } from "lucide-react";

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

export default function LearnMorePage() {
  return (
    <div className="bg-white dark:bg-black text-neutral-700 dark:text-zinc-300 min-h-screen pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16 animate-fade-in-up">
          <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-2">
            Our Technology
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white">
            How It Works
          </h1>
        </header>

        <FeatureSection title="Multi-Tenant Architecture" icon={Server}>
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
            their campus community by using **Supabase Magic-Link
            Authentication**.
          </p>
          <p>
            A secure, one-time link is sent to a user's official university
            email address. This passwordless method is highly secure and
            confirms that the user genuinely belongs to that institution.
          </p>
        </FeatureSection>

        <div className="text-center mt-16 animate-fade-in-up">
          <Link
            to="/login"
            className="px-8 py-3 bg-primary-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105"
          >
            Join Campus Trace
          </Link>
        </div>
      </div>
    </div>
  );
}
