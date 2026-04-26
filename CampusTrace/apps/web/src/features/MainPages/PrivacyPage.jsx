import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Mail,
  ArrowLeft,
} from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "January 2025";

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Account Information",
          text: "When you register for CampusTrace, we collect your full name, university email address, and university affiliation. This information is necessary to verify your identity and ensure you're part of your university community.",
        },
        {
          subtitle: "Profile Information",
          text: "You may optionally provide additional information such as a profile picture, contact preferences, and notification settings to personalize your experience.",
        },
        {
          subtitle: "Item Information",
          text: "When you report lost or found items, we collect descriptions, photos, locations, and timestamps. This information helps reunite items with their owners.",
        },
        {
          subtitle: "Communication Data",
          text: "Messages exchanged through our platform are stored to facilitate item returns and maintain conversation history.",
        },
        {
          subtitle: "Usage Data",
          text: "We automatically collect information about how you interact with CampusTrace, including pages visited, features used, and timestamps. This helps us improve our service.",
        },
      ],
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Delivery",
          text: "We use your information to provide and maintain CampusTrace services, including matching lost and found items, facilitating communication, and managing your account.",
        },
        {
          subtitle: "Communication",
          text: "We send you notifications about item matches, messages, claims, and important service updates. You can control notification preferences in your settings.",
        },
        {
          subtitle: "Security & Verification",
          text: "Your university email is used to verify your affiliation and maintain a trusted community within your campus.",
        },
        {
          subtitle: "Improvement & Analytics",
          text: "We analyze usage patterns to improve CampusTrace features, fix bugs, and enhance user experience. All analytics are aggregated and anonymized.",
        },
        {
          subtitle: "Legal Compliance",
          text: "We may use your information to comply with legal obligations, enforce our terms, and protect the rights and safety of our users.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Data Security",
      content: [
        {
          subtitle: "Encryption",
          text: "All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols.",
        },
        {
          subtitle: "Row-Level Security",
          text: "We use Supabase Row Level Security (RLS) to ensure your university's data is completely isolated from other institutions. You can only access data from your own university.",
        },
        {
          subtitle: "Access Controls",
          text: "We implement strict access controls and authentication mechanisms to prevent unauthorized access to your data.",
        },
        {
          subtitle: "Regular Security Audits",
          text: "Our systems undergo regular security reviews and updates to protect against emerging threats.",
        },
      ],
    },
    {
      icon: Eye,
      title: "Data Sharing & Disclosure",
      content: [
        {
          subtitle: "Within Your University",
          text: "Your profile information and posted items are visible to other verified members of your university community. This is essential for the lost and found matching process.",
        },
        {
          subtitle: "Service Providers",
          text: "We use trusted third-party services (Supabase for database, Cloudinary for image storage) that help us operate CampusTrace. These providers are contractually obligated to protect your data.",
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, court order, or to protect the rights, property, or safety of CampusTrace, our users, or others.",
        },
        {
          subtitle: "No Selling of Data",
          text: "We never sell, rent, or trade your personal information to third parties for marketing purposes.",
        },
      ],
    },
    {
      icon: UserCheck,
      title: "Your Rights & Choices",
      content: [
        {
          subtitle: "Access & Correction",
          text: "You can access and update your profile information at any time through your account settings.",
        },
        {
          subtitle: "Data Deletion",
          text: "You can request deletion of your account and associated data by contacting your university administrator or our support team. Some information may be retained for legal compliance.",
        },
        {
          subtitle: "Notification Preferences",
          text: "You can control what notifications you receive and how you receive them through your notification settings.",
        },
        {
          subtitle: "Data Portability",
          text: "You can request a copy of your data in a machine-readable format by contacting support.",
        },
      ],
    },
    {
      icon: Mail,
      title: "Cookies & Tracking",
      content: [
        {
          subtitle: "Essential Cookies",
          text: "We use cookies to maintain your login session and remember your preferences. These are necessary for the service to function.",
        },
        {
          subtitle: "Analytics",
          text: "We use analytics tools to understand how users interact with CampusTrace. You can opt out of analytics tracking in your browser settings.",
        },
        {
          subtitle: "No Third-Party Advertising",
          text: "We do not use cookies for advertising purposes or share your data with advertising networks.",
        },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy - CampusTrace</title>
        <meta
          name="description"
          content="Learn how CampusTrace protects your privacy and handles your data. Our commitment to security and transparency."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Link
              to="/"
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                  Privacy Policy
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Last updated: {lastUpdated}
                </p>
              </div>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              At CampusTrace, we take your privacy seriously. This policy
              explains how we collect, use, protect, and share your information.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Introduction */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Our Commitment to Privacy
            </h2>
            <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
              CampusTrace is designed with privacy at its core. We only collect
              information necessary to provide our lost and found services, and
              we use industry-leading security measures to protect your data.
              Your information is never sold to third parties, and we maintain
              strict data isolation between universities.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section
                key={index}
                className="scroll-mt-8"
                id={section.title.toLowerCase().replace(/\s+/g, "-")}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                </div>
                <div className="space-y-6 ml-16">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Children's Privacy */}
          <section className="mt-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">
              Children's Privacy
            </h2>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              CampusTrace is intended for use by university students, faculty,
              and staff who are 18 years or older. We do not knowingly collect
              information from individuals under 18. If you believe we have
              inadvertently collected such information, please contact us
              immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or for legal, operational, or regulatory
              reasons. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400 ml-4">
              <li>
                Posting the updated policy on this page with a new "Last
                Updated" date
              </li>
              <li>
                Sending an email notification to your registered email address
              </li>
              <li>Displaying a prominent notice on the CampusTrace platform</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-4">
              Your continued use of CampusTrace after any changes indicates your
              acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="mt-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this
              Privacy Policy or how we handle your data, please contact us:
            </p>
            <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
              <p>
                <strong>Email:</strong> privacy@campustrace.com
              </p>
              <p>
                <strong>Support:</strong> support@campustrace.com
              </p>
              <p>
                <strong>University Administrators:</strong> Contact your campus
                IT department
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-6 justify-center text-sm">
            <Link
              to="/terms"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              to="/"
              className="text-neutral-600 dark:text-neutral-400 hover:underline"
            >
              Home
            </Link>
            <Link
              to="/learn-more"
              className="text-neutral-600 dark:text-neutral-400 hover:underline"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
