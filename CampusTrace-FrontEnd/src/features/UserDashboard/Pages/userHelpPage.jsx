import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Search,
  Edit3,
  CheckCircle,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const faqData = [
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I post a new lost or found item?",
        answer:
          "Click the 'Post New Item' button in the top-right corner of your dashboard. Fill out the form with as much detail as possible—a good description, category, and location are key. Adding a clear photo significantly increases the chances of a successful recovery.",
      },
      {
        question: "What happens after I post an item?",
        answer:
          "Your post is sent to your university's administrator for a quick review. If auto-approval is off, it will be in 'Pending' status. Once approved, it becomes 'Active' and is visible on the 'Browse All' page. You can track all statuses on your 'My Posts' page.",
      },
      {
        question: "How does the AI-powered 'Possible Matches' feature work?",
        answer:
          "When you report a 'Lost' item, our AI automatically scans all 'Found' items, analyzing text and images for similarities. High-probability matches appear on your main dashboard to help you get your item back faster. You can also search for items using a photo.",
      },
    ],
  },
  {
    category: "Managing Items & Claims",
    items: [
      {
        question: "How do I claim an item that I think is mine?",
        answer:
          "On the 'Browse All' page, click an item to view its details. If it's a 'Found' item, click 'Claim This Item.' You must provide a unique detail that only the owner would know (e.g., a specific scratch, the lock screen image). This message is sent privately to the finder.",
      },
      {
        question: "Someone claimed my 'Found' item. What do I do?",
        answer:
          "You will receive a notification. Go to the 'My Posts' page and click the 'Claims on My Found Items' tab. Review the claimant's verification message. If you believe they are the owner, approve the claim. Contact details will then be shared between you both to arrange the return.",
      },
      {
        question: "What do the different post statuses mean?",
        answer:
          "'Active' means your post is live. 'Pending Review' is waiting for admin approval. 'Pending Return' means you've approved a claim on a 'Found' item. 'Recovered' closes the case after a successful return. 'Rejected' means an admin did not approve your post.",
      },
      {
        question: "How do I mark an item as 'Recovered'?",
        answer:
          "If you posted a 'Lost' item and found it, a 'Mark as Recovered' button will appear on the item card in your 'My Posts' page. If you posted a 'Found' item, this button appears after you've approved a claim. Either you or the claimant can then mark it as recovered.",
      },
      {
        question: "How do I delete a post I created?",
        answer:
          "Go to the 'My Posts' page and find the item you wish to remove. Hover over the card, and a trash icon will appear in the top-right corner. Click it to delete the post. Please note that this action is permanent.",
      },
    ],
  },
  {
    category: "Account & Privacy",
    items: [
      {
        question: "Why must I use my university email to sign up?",
        answer:
          "This policy ensures that only verified students, faculty, and staff from your university can access the platform. It creates a trusted, closed-community environment, which is crucial for safety and security.",
      },
      {
        question: "Is my contact information shared publicly?",
        answer:
          "No. Your primary email address is only shared between two users after a claim on a 'Found' item has been officially approved by the finder. Any optional contact information you voluntarily add to a post's description will be visible to anyone who can see that post.",
      },
      {
        question: "What is the safest way to meet someone to return an item?",
        answer:
          "We strongly recommend meeting in a public, well-lit area on campus, such as the university library, student center, or campus security office. Always inform a friend where you are going and avoid sharing unnecessary personal information.",
      },
      {
        question: "How do I change my name or profile picture?",
        answer:
          "You can update your personal information by navigating to the 'Profile' page from the sidebar menu. Click the 'Edit Profile' button to make changes.",
      },
    ],
  },
];

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 dark:border-[#3a3a3a] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-4 px-2"
      >
        <span className="text-lg font-medium text-neutral-800 dark:text-white">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 dark:text-gray-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-neutral-600 dark:text-neutral-400 pb-4 px-2 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const AccordionItemSkeleton = () => (
  <div className="border-b border-neutral-200 dark:border-[#3a3a3a]">
    <div className="w-full flex justify-between items-center py-4 px-2">
      <Skeleton height={24} width="70%" />
      <Skeleton width={20} height={20} />
    </div>
  </div>
);

const HelpPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <Skeleton circle width={48} height={48} className="mx-auto mb-4" />
      <Skeleton height={48} width={300} className="mx-auto" />
      <Skeleton height={24} width={400} className="mx-auto mt-4" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-12">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#2a2a2a] p-6 rounded-xl border border-neutral-200 dark:border-[#3a3a3a]"
        >
          <Skeleton circle width={48} height={48} className="mx-auto mb-4" />
          <Skeleton height={24} width="60%" className="mx-auto mb-2" />
          <Skeleton count={2} />
        </div>
      ))}
    </div>

    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-4 sm:p-6">
      <Skeleton height={30} width={200} className="mb-4" />
      {[...Array(3)].map((_, i) => (
        <AccordionItemSkeleton key={i} />
      ))}
      <Skeleton height={30} width={200} className="mt-8 mb-4" />
      {[...Array(4)].map((_, i) => (
        <AccordionItemSkeleton key={i} />
      ))}
    </div>

    <div className="mt-12 text-center">
      <Skeleton height={28} width={300} className="mx-auto" />
      <Skeleton height={20} width={400} className="mx-auto mt-2" />
      <Skeleton
        height={46}
        width={180}
        className="mx-auto mt-6"
        borderRadius={8}
      />
    </div>
  </div>
);

const loadingDelay = 1000;

export default function HelpPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, loadingDelay);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <HelpPageSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="text-center mb-16">
        <HelpCircle className="mx-auto h-12 w-12 text-primary-600 mb-4" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-800 dark:text-white">
          Help Center
        </h1>
        <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
          Your guide to finding and reporting items on Campus Trace.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
            <Edit3 className="mx-auto h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              1. Post an Item
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Whether you've lost something or found it, create a post with a
              clear photo and description.
            </p>
          </div>
          <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
            <Search className="mx-auto h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              2. Find a Match
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Our AI helps match lost items with found ones. You can also browse
              all posts or search by image.
            </p>
          </div>
          <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
            <CheckCircle className="mx-auto h-10 w-10 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              3. Reclaim Your Item
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Submit a claim with a unique detail to prove ownership and arrange
              a safe return with the finder.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white mb-8">
          Frequently Asked Questions
        </h2>
        {faqData.map((category, index) => (
          <div key={index} className="mb-10">
            <h3 className="text-2xl font-semibold text-neutral-800 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">
              {category.category}
            </h3>
            <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
              {category.items.map((faq, faqIndex) => (
                <AccordionItem
                  key={faqIndex}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center bg-neutral-100 dark:bg-[#2a2a2a]/50 p-8 rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
          Still have questions?
        </h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
          If you can't find the answer you're looking for, our support team is
          ready to help. Please contact your university's designated
          administrator for Campus Trace.
        </p>
        <a
          href="mailto:johnfranklinbugauisan0@gmail.com"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <Mail className="w-5 h-5" />
          Contact Support
        </a>
      </div>
    </div>
  );
}
