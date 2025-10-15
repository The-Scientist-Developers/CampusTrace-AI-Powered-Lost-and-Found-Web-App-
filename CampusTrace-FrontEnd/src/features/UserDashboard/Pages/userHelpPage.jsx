// import React, { useState } from "react";
// import { HelpCircle, ChevronDown, Mail } from "lucide-react";

// const faqData = [
//   {
//     question: "How do I post a new lost or found item?",
//     answer:
//       "Navigate to your dashboard and click the 'Post New Item' button in the header. Fill out the form with as much detail as possible, including a photo if you have one, and submit it for review.",
//   },
//   {
//     question: "What happens after I post an item?",
//     answer:
//       "Your post is sent to the university admin for moderation. Once approved, it will become visible on the 'Browse All' page. You can check the status of your submissions on the 'My Posts' page.",
//   },
//   {
//     question: "How does the 'Possible Matches' feature work?",
//     answer:
//       "When you post a 'Lost' item, our system uses AI to find 'Found' items from other users that have a similar category or description. These potential matches are shown on your main dashboard to help you recover your item faster.",
//   },
//   {
//     question: "How do I delete a post I created?",
//     answer:
//       "Go to the 'My Posts' page, find the item you wish to remove, and a 'Delete' button will appear when you hover over the card. Please note that this action is permanent.",
//   },
//   {
//     question:
//       "What should I do if I find an item that matches something I lost?",
//     answer:
//       "You should use the contact information provided in the post details to get in touch with the person who found the item. Campus Trace facilitates the connection but does not handle the physical exchange of items.",
//   },
// ];

// const AccordionItem = ({ question, answer }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="border-b border-neutral-800">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full flex justify-between items-center text-left py-4 px-2"
//       >
//         <span className="text-lg font-medium text-white">{question}</span>
//         <ChevronDown
//           className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
//             isOpen ? "rotate-180" : ""
//           }`}
//         />
//       </button>
//       <div
//         className={`grid transition-all duration-300 ease-in-out ${
//           isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
//         }`}
//       >
//         <div className="overflow-hidden">
//           <p className="text-neutral-400 pb-4 px-2 leading-relaxed">{answer}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function HelpPage() {
//   return (
//     <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
//       {/* Header */}
//       <div className="text-center mb-12">
//         <HelpCircle className="mx-auto h-12 w-12 text-red mb-4" />
//         <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
//           Help Center
//         </h1>
//         <p className="mt-4 text-lg text-neutral-400">
//           Find answers to common questions about using Campus Trace.
//         </p>
//       </div>

//       {/* FAQ Section */}
//       <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-4 sm:p-6">
//         {faqData.map((faq, index) => (
//           <AccordionItem
//             key={index}
//             question={faq.question}
//             answer={faq.answer}
//           />
//         ))}
//       </div>

//       {/* Contact Support Section */}
//       <div className="mt-12 text-center">
//         <h2 className="text-2xl font-bold text-white">Still have questions?</h2>
//         <p className="mt-2 text-neutral-400">
//           If you can't find the answer you're looking for, feel free to reach
//           out to our support team.
//         </p>
//         <a
//           href="mailto:support@campustrace.com"
//           className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-red text-white font-semibold rounded-lg hover:bg-red/80 transition-colors shadow-md"
//         >
//           <Mail className="w-5 h-5" />
//           Contact Support
//         </a>
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import { HelpCircle, ChevronDown, Mail } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const faqData = [
  {
    question: "How do I post a new lost or found item?",
    answer:
      "Navigate to your dashboard and click the 'Post New Item' button in the header. Fill out the form with as much detail as possible, including a photo if you have one, and submit it for review.",
  },
  {
    question: "What happens after I post an item?",
    answer:
      "Your post is sent to the university admin for moderation. Once approved, it will become visible on the 'Browse All' page. You can check the status of your submissions on the 'My Posts' page.",
  },
  {
    question: "How does the 'Possible Matches' feature work?",
    answer:
      "When you post a 'Lost' item, our system uses AI to find 'Found' items from other users that have a similar category or description. These potential matches are shown on your main dashboard to help you recover your item faster.",
  },
  {
    question: "How do I delete a post I created?",
    answer:
      "Go to the 'My Posts' page, find the item you wish to remove, and a 'Delete' button will appear when you hover over the card. Please note that this action is permanent.",
  },
  {
    question:
      "What should I do if I find an item that matches something I lost?",
    answer:
      "You should use the contact information provided in the post details to get in touch with the person who found the item. Campus Trace facilitates the connection but does not handle the physical exchange of items.",
  },
];

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-4 px-2"
      >
        <span className="text-lg font-medium text-neutral-900 dark:text-white">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-600 dark:text-zinc-400 transition-transform duration-300 ${
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

export default function HelpPage() {
  const { theme } = useTheme();
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <HelpCircle className="mx-auto h-12 w-12 text-red mb-4" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white">
          Help Center
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Find answers to common questions about using Campus Trace.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 sm:p-6">
        {faqData.map((faq, index) => (
          <AccordionItem
            key={index}
            question={faq.question}
            answer={faq.answer}
          />
        ))}
      </div>

      {/* Contact Support Section */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Still have questions?
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          If you can't find the answer you're looking for, feel free to reach
          out to our support team.
        </p>
        <a
          href="mailto:support@campustrace.com"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-red text-white font-semibold rounded-lg hover:bg-red/80 transition-colors shadow-md"
        >
          <Mail className="w-5 h-5" />
          Contact Support
        </a>
      </div>
    </div>
  );
}