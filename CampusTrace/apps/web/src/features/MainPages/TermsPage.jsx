import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scale,
  ArrowLeft,
} from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "January 2025";

  const sections = [
    {
      icon: CheckCircle,
      title: "Acceptance of Terms",
      content: `By accessing or using CampusTrace, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service. These terms apply to all users, including students, faculty, staff, and university administrators.`,
    },
    {
      icon: FileText,
      title: "Service Description",
      content: `CampusTrace is a lost and found platform designed exclusively for university communities. Our service helps users report lost items, post found items, and facilitate the return of belongings to their rightful owners. The platform includes features such as AI-powered image matching, secure messaging, claim verification, and gamification elements.`,
    },
    {
      icon: CheckCircle,
      title: "Eligibility & Account Registration",
      items: [
        "You must be 18 years or older and affiliated with a registered university to use CampusTrace",
        "You must register using your official university email address",
        "You are responsible for maintaining the confidentiality of your account credentials",
        "You must provide accurate and complete information during registration",
        "You may not create multiple accounts or share your account with others",
        "Your account may be suspended or terminated if you violate these terms",
      ],
    },
    {
      icon: Scale,
      title: "User Responsibilities",
      items: [
        "Provide accurate descriptions and photos of lost or found items",
        "Respond promptly to messages and claim requests",
        "Verify ownership before claiming items",
        "Return found items to their rightful owners in good faith",
        "Respect other users' privacy and personal information",
        "Use the platform only for legitimate lost and found purposes",
        "Report any suspicious activity or policy violations",
        "Maintain respectful and professional communication",
      ],
    },
    {
      icon: XCircle,
      title: "Prohibited Conduct",
      items: [
        "Posting false, misleading, or fraudulent item reports",
        "Claiming items that do not belong to you",
        "Harassing, threatening, or abusing other users",
        "Sharing inappropriate, offensive, or illegal content",
        "Attempting to circumvent security measures or access controls",
        "Using the platform for commercial purposes or advertising",
        "Scraping, data mining, or automated data collection",
        "Impersonating other users or university officials",
        "Interfering with the proper functioning of the platform",
      ],
    },
    {
      icon: AlertTriangle,
      title: "Content & Intellectual Property",
      subsections: [
        {
          subtitle: "Your Content",
          text: "You retain ownership of content you post (descriptions, photos, messages). By posting content, you grant CampusTrace a non-exclusive license to use, display, and distribute it for service operation purposes.",
        },
        {
          subtitle: "Platform Content",
          text: "CampusTrace and its original content, features, and functionality are owned by CampusTrace and protected by copyright, trademark, and other intellectual property laws.",
        },
        {
          subtitle: "User-Generated Content",
          text: "We reserve the right to remove any content that violates these terms or is otherwise objectionable. We are not responsible for user-generated content.",
        },
      ],
    },
    {
      icon: Scale,
      title: "Liability & Disclaimers",
      subsections: [
        {
          subtitle: "Service Availability",
          text: 'CampusTrace is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.',
        },
        {
          subtitle: "Item Recovery",
          text: "While we facilitate connections between users, we cannot guarantee the recovery of lost items or the return of found items. Users are responsible for verifying ownership and arranging item returns.",
        },
        {
          subtitle: "User Interactions",
          text: "We are not responsible for disputes, damages, or losses arising from interactions between users. Users engage with each other at their own risk.",
        },
        {
          subtitle: "Limitation of Liability",
          text: "To the maximum extent permitted by law, CampusTrace shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: "Account Termination",
      content: `We reserve the right to suspend or terminate your account at any time for violations of these terms, suspicious activity, or at the request of your university. You may also delete your account at any time through your settings. Upon termination, your access to the service will cease, though some information may be retained for legal compliance.`,
    },
    {
      icon: FileText,
      title: "University Policies",
      content: `CampusTrace operates in conjunction with university policies and regulations. Users must comply with their institution's code of conduct, IT policies, and other applicable rules. Universities may have additional terms or restrictions for CampusTrace usage on their campus.`,
    },
    {
      icon: Scale,
      title: "Dispute Resolution",
      subsections: [
        {
          subtitle: "Informal Resolution",
          text: "If you have a dispute with CampusTrace, please contact us first to attempt an informal resolution.",
        },
        {
          subtitle: "Governing Law",
          text: "These terms are governed by the laws of the jurisdiction where CampusTrace operates, without regard to conflict of law principles.",
        },
        {
          subtitle: "Arbitration",
          text: "Any disputes that cannot be resolved informally may be subject to binding arbitration, as permitted by law.",
        },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Terms of Service - CampusTrace</title>
        <meta
          name="description"
          content="Read CampusTrace's Terms of Service. Understand your rights and responsibilities when using our lost and found platform."
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
                <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                  Terms of Service
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Last updated: {lastUpdated}
                </p>
              </div>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Please read these terms carefully before using CampusTrace. By
              using our service, you agree to these terms.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Introduction */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Welcome to CampusTrace
            </h2>
            <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
              These Terms of Service govern your use of CampusTrace, a lost and
              found platform for university communities. By creating an account
              or using our services, you acknowledge that you have read,
              understood, and agree to be bound by these terms.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section key={index} className="scroll-mt-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                      {section.title}
                    </h2>

                    {section.content && (
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {section.content}
                      </p>
                    )}

                    {section.items && (
                      <ul className="space-y-3">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.subsections && (
                      <div className="space-y-6">
                        {section.subsections.map((sub, idx) => (
                          <div key={idx}>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                              {sub.subtitle}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {sub.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Changes to Terms */}
          <section className="mt-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">
              Changes to Terms
            </h2>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              We reserve the right to modify these terms at any time. We will
              notify users of material changes via email or platform
              notification. Continued use of CampusTrace after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section className="mt-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Questions About These Terms?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              If you have questions or concerns about these Terms of Service,
              please contact us:
            </p>
            <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
              <p>
                <strong>Email:</strong> legal@campustrace.com
              </p>
              <p>
                <strong>Support:</strong> support@campustrace.com
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-6 justify-center text-sm">
            <Link
              to="/privacy"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Privacy Policy
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
