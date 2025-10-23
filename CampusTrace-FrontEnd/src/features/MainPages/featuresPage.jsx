import React from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles,
    Zap,
    KeyRound,
    Bell,
    FilePlus,
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Lock,
    UserCheck,
    University,
    ArrowRight
} from 'lucide-react';
import logo from "../../Images/Logo.svg";

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="flex items-center justify-center h-12 w-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg mb-4">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">{description}</p>
    </div>
);

const Section = ({ title, subtitle, children }) => (
    <section className="py-16">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {children}
        </div>
    </section>
);


export default function FeaturesPage() {
    return (
        <div className="bg-neutral-50 dark:bg-[#1a1a1a] min-h-screen pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-20 animate-fade-in-up">
                    <p className="text-primary-600 dark:text-primary-500 font-semibold tracking-widest uppercase mb-2">
                        CampusTrace Features
                    </p>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white">
                        Smart, Secure, and Simple
                    </h1>
                     <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-neutral-600 dark:text-zinc-400">
                        Explore the innovative tools that make CampusTrace the most effective lost and found platform for universities.
                    </p>
                </header>

                <Section
                    title="For Students & Staff"
                    subtitle="Powerful tools designed to make finding and returning items effortless."
                >
                    <FeatureCard
                        icon={Sparkles}
                        title="AI-Powered Search"
                        description="Our smart search understands both text and images. Describe an item or upload a photo to find visually similar results instantly, powered by CLIP models."
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Proactive Matching"
                        description="When you report a lost item, our system doesn't wait. It actively scans new 'found' posts and notifies you of high-probability matches on your dashboard."
                    />
                    <FeatureCard
                        icon={KeyRound}
                        title="Secure Claim Process"
                        description="Prove ownership by providing a unique detail only you would know. Your claim is sent privately to the finder for verification before any contact info is shared."
                    />
                    <FeatureCard
                        icon={Bell}
                        title="Real-Time Notifications"
                        description="Stay in the loop with instant alerts for new matches, claims on your items, and updates on your posts' moderation status."
                    />
                     <FeatureCard
                        icon={FilePlus}
                        title="AI-Enhanced Posting"
                        description="Not sure what to write? Our AI Helper, powered by Google Gemini, can take your basic description and enhance it to be more detailed and effective."
                    />
                     <FeatureCard
                        icon={UserCheck}
                        title="Intelligent Profile Photos"
                        description="To build a trusted community, our system ensures you upload a valid profile picture by using in-browser AI to detect if a face is present."
                    />
                </Section>

                <Section
                    title="For University Administrators"
                    subtitle="A complete suite of tools to manage your campus community with ease."
                >
                    <FeatureCard
                        icon={LayoutDashboard}
                        title="Centralized Dashboard"
                        description="Get a real-time overview of your campus activity, including total users, active posts, recovery rates, and weekly trends, all in one place."
                    />
                    <FeatureCard
                        icon={Users}
                        title="Full User Management"
                        description="Easily manage all users within your university. Assign roles like 'Moderator' or 'Admin', and maintain community safety by banning users if necessary."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Effortless Content Moderation"
                        description="Review, approve, or reject new posts from a simple, intuitive interface to ensure all content aligns with your community standards."
                    />
                    <FeatureCard
                        icon={Settings}
                        title="Campus Configuration"
                        description="Tailor the platform to your needs. Set the site name, add multiple approved email domains (e.g., for students and staff), and create keyword blacklists for auto-flagging."
                    />
                     <FeatureCard
                        icon={Lock}
                        title="Secure Data Isolation"
                        description="Your university's data is completely separate from others. Our multi-tenant architecture with Row Level Security ensures total privacy and security."
                    />
                     <FeatureCard
                        icon={University}
                        title="Verified Community"
                        description="Ensure every user is a legitimate member of your campus by controlling which email domains are allowed to register."
                    />
                </Section>

                 <section className="py-16 text-center">
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Ready to Get Started?</h2>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400 mt-4 mb-8">Join your campus community or register your university today.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/login" className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                             <span className="flex items-center justify-center gap-2">
                                Go to App
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                         <Link to="/register-university" className="px-8 py-4 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-zinc-700 text-neutral-700 dark:text-zinc-300 text-lg font-bold rounded-xl hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                           For Universities
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}