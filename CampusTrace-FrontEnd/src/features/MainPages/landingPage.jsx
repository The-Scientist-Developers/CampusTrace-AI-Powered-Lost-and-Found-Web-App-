// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import { motion, useAnimation } from "framer-motion";
// import { useInView as useIntersectionObserver } from "react-intersection-observer"; // Renamed hook
// import {
//   ShieldCheck,
//   Search,
//   FilePlus,
//   Sparkles,
//   Bell,
//   ChevronDown,
//   MessageCircle,
//   Users,
//   Menu,
//   X,
//   ArrowRight,
//   Clock,
//   KeyRound,
//   UserCheck,
//   Award,
//   Map,
//   MessageSquare,
//   Zap,
//   LayoutDashboard,
//   Settings,
//   Lock,
//   University,
//   Eye, // Added Eye icon for visibility/showcase
// } from "lucide-react";
// import logo from "../../Images/Logo.svg"; // Ensure this path is correct

// // --- Custom Hook for Intersection Observer (using react-intersection-observer) ---
// const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
//   const { ref, inView } = useIntersectionObserver(options);
//   const animation = useAnimation();

//   useEffect(() => {
//     if (inView) {
//       animation.start("visible");
//     }
//   }, [animation, inView]);

//   return { ref, animation, inView };
// };

// // --- Parallax Hook ---
// const useParallax = (speed = 0.5) => {
//   const [offset, setOffset] = useState(0);

//   useEffect(() => {
//     const handleScroll = () => {
//       setOffset(window.pageYOffset * speed);
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [speed]);

//   return offset;
// };

// // --- Scroll Progress Bar Component ---
// const ScrollProgress = () => {
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     const handleScroll = () => {
//       const totalHeight =
//         document.documentElement.scrollHeight - window.innerHeight;
//       const currentProgress = (window.pageYOffset / totalHeight) * 100;
//       setProgress(currentProgress);
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[60]">
//       <div
//         className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-all duration-150 shadow-lg shadow-primary-500/50"
//         style={{ width: `${progress}%` }}
//       />
//     </div>
//   );
// };

// // --- Feature Slider Component ---
// const FeatureSlider = ({ features }) => {
//   const controls = useAnimation();
//   const { ref, inView } = useIntersectionObserver({
//     threshold: 0.1,
//     triggerOnce: true,
//   });

//   useEffect(() => {
//     if (inView) {
//       controls.start("visible");
//     }
//   }, [controls, inView]);

//   return (
//     <motion.div
//       ref={ref}
//       animate={controls}
//       initial="hidden"
//       variants={{
//         visible: {
//           opacity: 1,
//           y: 0,
//           transition: { duration: 0.8, delay: 0.2 },
//         },
//         hidden: { opacity: 0, y: 20 },
//       }}
//       className="py-12 sm:py-16 overflow-hidden"
//     >
//       <div className="max-w-7xl mx-auto text-center">
//         <p className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider mb-6 sm:mb-8 px-4">
//           KEY FEATURES OF CAMPUSTRACE
//         </p>
//         <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
//           <div className="animate-slide flex w-max">
//             {[...features, ...features].map((feature, index) => {
//               const Icon = feature.icon;
//               return (
//                 <div
//                   key={index}
//                   className="w-64 sm:w-80 flex-shrink-0 flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 hover:scale-105 transition-transform duration-300"
//                 >
//                   <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
//                   <span className="font-semibold text-sm sm:text-lg text-neutral-600 dark:text-neutral-300 truncate">
//                     {feature.title}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// // --- FAQ Item Component ---
// const FAQItem = ({ question, answer, isOpen, onToggle, index }) => {
//   const controls = useAnimation();
//   const { ref, inView } = useIntersectionObserver({
//     threshold: 0.1,
//     triggerOnce: true,
//   });

//   useEffect(() => {
//     if (inView) {
//       controls.start({
//         opacity: 1,
//         x: 0,
//         transition: { duration: 0.5, delay: index * 0.1 },
//       });
//     }
//   }, [controls, inView, index]);

//   return (
//     <motion.div
//       ref={ref}
//       animate={controls}
//       initial={{ opacity: 0, x: -20 }}
//       className="border-b border-neutral-200 dark:border-neutral-800 last:border-0"
//     >
//       <button
//         onClick={onToggle}
//         className="w-full py-5 sm:py-6 px-4 flex justify-between items-center text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg group transition-all duration-300"
//       >
//         <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-4 sm:pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
//           {question}
//         </h3>
//         <motion.div
//           animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
//           transition={{ duration: 0.3 }}
//           className="p-1.5 sm:p-2 rounded-full bg-primary-100 dark:bg-primary-500/10 flex-shrink-0"
//         >
//           <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
//         </motion.div>
//       </button>
//       <motion.div
//         initial={false}
//         animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
//         transition={{ duration: 0.3, ease: "easeInOut" }}
//         className="overflow-hidden"
//       >
//         <div className="pb-5 sm:pb-6 px-4">
//           <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
//             {answer}
//           </p>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// // --- Feature Card Component ---
// const FeatureCard = ({ icon: Icon, title, description, index }) => {
//   const { ref, animation, inView } = useInView({
//     threshold: 0.2,
//     triggerOnce: true,
//   });
//   const [isHovered, setIsHovered] = useState(false);
//   const cardRef = useRef(null);
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

//   const handleMouseMove = (e) => {
//     if (!cardRef.current) return;
//     const rect = cardRef.current.getBoundingClientRect();
//     const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15; // Reduced intensity
//     const y = ((e.clientY - rect.top) / rect.height - 0.5) * 15; // Reduced intensity
//     setMousePosition({ x, y });
//   };

//   const handleMouseLeave = () => {
//     setIsHovered(false);
//     setMousePosition({ x: 0, y: 0 });
//   };

//   return (
//     <motion.div
//       ref={ref}
//       animate={animation}
//       initial="hidden"
//       variants={{
//         visible: {
//           opacity: 1,
//           y: 0,
//           rotate: 0,
//           transition: { duration: 0.6, delay: index * 0.1 },
//         },
//         hidden: { opacity: 0, y: 50, rotate: 2 },
//       }}
//       style={{
//         transform: isHovered
//           ? `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${
//               mousePosition.x
//             }deg) translateZ(5px)` // Reduced translateZ
//           : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)",
//       }}
//       transition={{ type: "spring", stiffness: 300, damping: 20 }} // Spring animation for hover
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseMove={handleMouseMove}
//       onMouseLeave={handleMouseLeave}
//     >
//       <div
//         ref={cardRef}
//         className={`relative rounded-2xl bg-white dark:bg-[#2a2a2a] p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 h-full group border border-transparent hover:border-primary-500/20`} // Added border effect
//       >
//         {/* Subtle Glow Effect on Hover */}
//         <div
//           className={`absolute -inset-px rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
//             isHovered
//               ? "bg-gradient-to-br from-primary-400/10 via-transparent to-purple-400/10"
//               : ""
//           }`}
//           aria-hidden="true"
//         />

//         <div className="relative mb-4 sm:mb-6">
//           <motion.div
//             animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 6 : 0 }}
//             transition={{ type: "spring", stiffness: 400, damping: 15 }}
//             className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg"
//           >
//             <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
//           </motion.div>
//         </div>

//         <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
//           {title}
//         </h3>

//         <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
//           {description}
//         </p>
//         {/* Corner Decoration */}
//         <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-tr-2xl rounded-bl-2xl">
//           <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500/10 to-transparent transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// // --- Feature Section Component ---
// const FeatureSection = ({ title, subtitle, features, id, startIndex = 0 }) => {
//   const { ref, animation, inView } = useInView({
//     threshold: 0.1,
//     triggerOnce: true,
//   });
//   const titleParallax = useParallax(0.1);

//   return (
//     <section
//       ref={ref}
//       id={id}
//       className="py-16 sm:py-20 relative overflow-hidden"
//     >
//       {/* Subtle background gradient */}
//       <div
//         className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent -z-10"
//         style={{ transform: `translateY(${titleParallax}px)` }}
//       />

//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           animate={animation}
//           initial="hidden"
//           variants={{
//             visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
//             hidden: { opacity: 0, y: 30 },
//           }}
//           className="text-center mb-10 sm:mb-14 relative"
//         >
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 relative inline-block px-4">
//             {title}
//             {/* Underline animation */}
//             <motion.span
//               initial={{ width: 0 }}
//               animate={inView ? { width: "60%" } : {}}
//               transition={{
//                 duration: 0.8,
//                 delay: 0.5,
//                 ease: [0.25, 1, 0.5, 1],
//               }} // Smoother ease
//               className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
//             />
//           </h2>
//           <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 sm:mt-6 px-4">
//             {subtitle}
//           </p>
//         </motion.div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
//           {features.map((feature, index) => (
//             <FeatureCard
//               key={feature.title}
//               {...feature}
//               index={startIndex + index}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// // --- Screenshot Section Component ---
// const ScreenshotSection = ({ screenshots }) => {
//   const { ref, animation, inView } = useInView({
//     threshold: 0.2,
//     triggerOnce: true,
//   });

//   return (
//     <section
//       ref={ref}
//       className="py-16 sm:py-20 bg-neutral-100 dark:bg-[#2a2a2a] overflow-hidden"
//     >
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.div
//           animate={animation}
//           initial="hidden"
//           variants={{
//             visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
//             hidden: { opacity: 0, y: 30 },
//           }}
//           className="text-center mb-10 sm:mb-14"
//         >
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 relative inline-block px-4">
//             See CampusTrace in Action
//             <motion.span
//               initial={{ width: 0 }}
//               animate={inView ? { width: "60%" } : {}}
//               transition={{
//                 duration: 0.8,
//                 delay: 0.5,
//                 ease: [0.25, 1, 0.5, 1],
//               }}
//               className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
//             />
//           </h2>
//           <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 sm:mt-6 px-4">
//             Take a visual tour of our key features and user-friendly interface.
//           </p>
//         </motion.div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
//           {screenshots.map((screenshot, index) => {
//             const itemControls = useAnimation();
//             const { ref: itemRef, inView: itemInView } =
//               useIntersectionObserver({ threshold: 0.2, triggerOnce: true });

//             useEffect(() => {
//               if (itemInView) {
//                 itemControls.start({
//                   opacity: 1,
//                   y: 0,
//                   scale: 1,
//                   transition: { duration: 0.6, delay: index * 0.15 },
//                 });
//               }
//             }, [itemControls, itemInView, index]);

//             return (
//               <motion.div
//                 key={index}
//                 ref={itemRef}
//                 animate={itemControls}
//                 initial={{ opacity: 0, y: 40, scale: 0.95 }}
//                 className="rounded-xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-700 aspect-[16/10] group" // Added aspect ratio
//               >
//                 <img
//                   src={screenshot.src}
//                   alt={screenshot.alt}
//                   className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-in-out" // Added hover scale
//                 />
//                 {/* Optional: Add a caption overlay */}
//                 {/* <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
//                      <p className="text-white text-sm font-medium">{screenshot.alt}</p>
//                  </div> */}
//               </motion.div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default function LandingPage() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [openFAQ, setOpenFAQ] = useState(0); // Start with the first FAQ open
//   const heroParallax = useParallax(0.3);
//   const gridParallax = useParallax(-0.2);

//   useEffect(() => {
//     document.documentElement.style.scrollBehavior = "smooth";
//     // Set overflow-x to hidden to prevent horizontal scroll during animations
//     document.body.style.overflowX = "hidden";
//     return () => {
//       document.documentElement.style.scrollBehavior = "auto";
//       document.body.style.overflowX = ""; // Reset on unmount
//     };
//   }, []);

//   // Quick features for the slider
//   const quickFeatures = [
//     { icon: Sparkles, title: "AI-Powered Matching" },
//     { icon: Search, title: "Visual & Text Search" }, // Updated
//     { icon: MessageSquare, title: "Secure In-App Messaging" }, // Updated
//     { icon: Award, title: "Leaderboard Recognition" }, // Updated
//     { icon: KeyRound, title: "Verified Claim Process" }, // Updated
//     { icon: ShieldCheck, title: "University-Verified Users" }, // Updated
//     { icon: LayoutDashboard, title: "Admin Management Tools" }, // Added
//   ];

//   // Detailed features for students
//   const studentFeatures = [
//     {
//       icon: Sparkles,
//       title: "AI-Powered Search & Matching",
//       description:
//         "Describe or upload a photo of your item. Our AI (CLIP & SentenceTransformers) finds visual and text matches, proactively notifying you of potential finds.",
//     },
//     {
//       icon: Zap,
//       title: "Real-Time Notifications",
//       description:
//         "Get instant alerts via dashboard and email (optional) for possible matches, claim updates, new messages, and post moderation status changes.",
//     },
//     {
//       icon: KeyRound,
//       title: "Secure Claim & Messaging",
//       description:
//         "Claim items with a unique detail. Once approved, securely chat in-app with the finder/claimant to arrange the return without sharing personal contact info initially.",
//     },
//     {
//       icon: FilePlus,
//       title: "AI-Enhanced Posting",
//       description:
//         "Struggling with the description? Our Google Gemini-powered AI Helper suggests improvements and relevant tags to increase visibility.",
//     },
//     {
//       icon: Award,
//       title: "Community Leaderboard",
//       description:
//         "Get recognized for helping others! Successfully returning items earns you points and a spot on the campus leaderboard.",
//     },
//     {
//       icon: UserCheck,
//       title: "Verified Profile Picture AI",
//       description:
//         "Ensure a safe community. Our AI checks for a valid face during profile picture uploads, promoting trust and accountability.",
//     },
//   ];

//   // Features for administrators
//   const adminFeatures = [
//     {
//       icon: LayoutDashboard,
//       title: "Comprehensive Admin Dashboard",
//       description:
//         "Monitor campus activity with real-time stats: user counts, pending posts/verifications, recovery rates, and activity charts.",
//     },
//     {
//       icon: Users,
//       title: "Robust User Management",
//       description:
//         "View, search, and manage all users within your university. Assign roles (Moderator, Admin), approve manual verifications, and ban users if needed.",
//     },
//     {
//       icon: ShieldCheck,
//       title: "Efficient Moderation Tools",
//       description:
//         "Quickly review and approve/reject new item posts. View post details, including images and descriptions, directly from the moderation queue.",
//     },
//     {
//       icon: Settings,
//       title: "Customizable Campus Settings",
//       description:
//         "Tailor CampusTrace: set the site name, manage allowed email domains for registration, configure auto-approval rules, and create keyword blacklists.",
//     },
//     {
//       icon: Bell,
//       title: "Admin Notifications",
//       description:
//         "Stay informed with notifications for new posts awaiting moderation and manual verification requests requiring your attention.",
//     },
//     {
//       icon: Lock,
//       title: "Secure Multi-Tenant System",
//       description:
//         "Rest easy knowing your university's data is isolated using Supabase Row Level Security, ensuring privacy and compliance.",
//     },
//   ];

//   const screenshots = [
//     { src: "/screenshots/user-dashboard.png", alt: "User Dashboard Overview" }, // Replace with your actual screenshot paths
//     { src: "/screenshots/browse-items.png", alt: "Browse All Items Page" },
//     {
//       src: "/screenshots/post-item-ai.png",
//       alt: "Post New Item with AI Helper",
//     },
//     {
//       src: "/screenshots/item-details-claim.png",
//       alt: "Item Details and Claim Modal",
//     },
//     { src: "/screenshots/messages.png", alt: "In-App Messaging Interface" },
//     {
//       src: "/screenshots/admin-dashboard.png",
//       alt: "Admin Dashboard Analytics",
//     },
//     // Add more as needed, e.g., admin moderation
//     // { src: "/screenshots/admin-moderation.png", alt: "Admin Post Moderation Queue" },
//   ];

//   const faqs = [
//     {
//       question: "How does the AI matching work for my lost item?",
//       answer:
//         "When you post a 'Lost' item, our AI analyzes its text (title, description, category) and image (if provided) using SentenceTransformers and CLIP models. It then compares this against all approved 'Found' items in your university, calculating similarity scores. High-scoring matches appear under 'AI-Powered Matches' on your dashboard.",
//     },
//     {
//       question: "How do I communicate securely after a claim is approved?",
//       answer:
//         "Once a finder approves a claim on their 'Found' item, a private chat conversation is automatically created between the finder and claimant. Both users receive a notification linking directly to this chat in the 'Messages' section. You can coordinate the return here without initially sharing external contact details.",
//     },
//     {
//       question: "What if I don't have a university email?",
//       answer:
//         "You can register using a personal email (like Gmail). During sign-up, choose the 'Register with your University ID instead' option. You'll select your university and upload a clear photo of your ID. An administrator from your university will review your request. You'll receive an email notification once approved.",
//     },
//     {
//       question: "Is my personal information safe?",
//       answer:
//         "Yes. Your primary login email is not displayed publicly. Contact information is only shared within the secure in-app chat after a claim is mutually approved. Optional contact details added to a post description are visible. We use Supabase's security features, including Row Level Security, to protect user data and isolate university information.",
//     },
//     {
//       question: "How does the Leaderboard work?",
//       answer:
//         "Successfully returning a 'Found' item to its owner (marked as 'Recovered' after claim approval) earns the finder points. The Leaderboard page ranks users within your university based on the number of items they've helped return, encouraging community participation.",
//     },
//   ];

//   const howItWorksRef = useInView({ threshold: 0.2, triggerOnce: true }); // Use custom hook
//   const ctaRef = useInView({ threshold: 0.3, triggerOnce: true }); // Use custom hook

//   return (
//     <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 flex flex-col overflow-x-hidden">
//       <ScrollProgress />

//       {/* Header */}
//       <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
//         <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16 sm:h-20">
//             {/* Logo and Brand Name */}
//             <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
//               <motion.img
//                 src={logo}
//                 alt="Campus Trace Logo"
//                 className="h-8 w-8 sm:h-10 sm:w-auto rounded-full"
//                 whileHover={{ scale: 1.15, rotate: 15 }}
//                 transition={{ type: "spring", stiffness: 400, damping: 10 }}
//               />
//               <span className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-white">
//                 CampusTrace
//               </span>
//             </Link>

//             {/* Desktop Navigation */}
//             <div className="hidden md:flex items-center gap-6">
//               {[
//                 { to: "#how-it-works", label: "How It Works", isAnchor: true },
//                 { to: "#features", label: "Features", isAnchor: true },
//                 { to: "#screenshots", label: "Showcase", isAnchor: true }, // New Showcase link
//                 { to: "/about", label: "About Us", isAnchor: false },
//                 {
//                   to: "/register-university",
//                   label: "For Universities",
//                   isAnchor: false,
//                 },
//               ].map((link, index) =>
//                 link.isAnchor ? (
//                   <a
//                     key={link.to}
//                     href={link.to}
//                     className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
//                   >
//                     {link.label}
//                     <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
//                   </a>
//                 ) : (
//                   <Link
//                     key={link.to}
//                     to={link.to}
//                     className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
//                   >
//                     {link.label}
//                     <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
//                   </Link>
//                 )
//               )}
//               <Link
//                 to="/login"
//                 className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300"
//               >
//                 Log In
//               </Link>
//             </div>

//             {/* Mobile Menu Button */}
//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
//               aria-label="Toggle menu"
//             >
//               {mobileMenuOpen ? (
//                 <X className="w-6 h-6" />
//               ) : (
//                 <Menu className="w-6 h-6" />
//               )}
//             </button>
//           </div>

//           {/* Mobile Menu */}
//           <motion.div
//             initial={false}
//             animate={{ height: mobileMenuOpen ? "auto" : 0 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//             className="md:hidden overflow-hidden"
//           >
//             <div className="pt-2 pb-4 space-y-1 border-t border-neutral-200 dark:border-neutral-800">
//               {[
//                 { to: "#how-it-works", label: "How It Works", isAnchor: true },
//                 { to: "#features", label: "Features", isAnchor: true },
//                 { to: "#screenshots", label: "Showcase", isAnchor: true },
//                 { to: "/about", label: "About Us", isAnchor: false },
//                 {
//                   to: "/register-university",
//                   label: "For Universities",
//                   isAnchor: false,
//                 },
//               ].map((link, index) =>
//                 link.isAnchor ? (
//                   <a
//                     key={link.to}
//                     href={link.to}
//                     onClick={() => setMobileMenuOpen(false)}
//                     className="block px-3 py-2 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
//                   >
//                     {link.label}
//                   </a>
//                 ) : (
//                   <Link
//                     key={link.to}
//                     to={link.to}
//                     onClick={() => setMobileMenuOpen(false)}
//                     className="block px-3 py-2 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
//                   >
//                     {link.label}
//                   </Link>
//                 )
//               )}
//               <Link
//                 to="/login"
//                 onClick={() => setMobileMenuOpen(false)}
//                 className="block w-full mt-3 py-3 text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white text-base font-semibold rounded-lg shadow-md"
//               >
//                 Log In
//               </Link>
//             </div>
//           </motion.div>
//         </nav>
//       </header>

//       <main className="flex-grow pt-16 sm:pt-20 relative z-10">
//         {/* Hero Section */}
//         <section className="min-h-[calc(70vh-64px)] sm:min-h-[calc(80vh-80px)] flex items-center justify-center text-center relative overflow-hidden px-4">
//           <div
//             className="absolute inset-0 opacity-20 dark:opacity-5 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]"
//             style={{ transform: `translateY(${gridParallax}px)` }}
//           >
//             {/* Grid pattern SVG */}
//             <svg
//               aria-hidden="true"
//               className="absolute inset-0 h-full w-full text-neutral-300 dark:text-neutral-800/50"
//             >
//               <defs>
//                 <pattern
//                   id="grid-pattern"
//                   width="72"
//                   height="72"
//                   patternUnits="userSpaceOnUse"
//                   x="50%"
//                   y="50%"
//                   patternTransform="translate(-36 -36)"
//                 >
//                   <path
//                     d="M0 72V.5H72"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1"
//                   ></path>
//                 </pattern>
//               </defs>
//               <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
//             </svg>
//           </div>

//           <div className="absolute inset-0 overflow-hidden -z-10">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.8 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 1.5, ease: "easeOut" }}
//               className="absolute top-10 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-primary-400/10 dark:bg-primary-500/10 rounded-full blur-3xl animate-float"
//             />
//             <motion.div
//               initial={{ opacity: 0, scale: 0.8 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
//               className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"
//             />
//           </div>

//           <motion.div
//             className="max-w-4xl mx-auto py-12 sm:py-16 relative z-10"
//             style={{ transform: `translateY(${heroParallax}px)` }}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.8, delay: 0.1 }}
//           >
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} // Smoother ease
//             >
//               <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
//                 Reconnect What's Lost,{" "}
//                 <span className="bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500 dark:from-primary-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] block sm:inline mt-2 sm:mt-0">
//                   Powered by AI
//                 </span>
//               </h1>
//             </motion.div>

//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
//               className="mt-5 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400"
//             >
//               CampusTrace uses smart technology to make finding lost items on
//               campus simple and fast. Join your university's secure lost and
//               found network today.
//             </motion.p>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
//               className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6"
//             >
//               <Link
//                 to="/login"
//                 className="group px-7 sm:px-9 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden text-base sm:text-lg w-full sm:w-auto"
//               >
//                 <span className="relative z-10">Get Started</span>
//                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
//                 <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//               </Link>
//               <a
//                 href="#features" // Link to features section
//                 className="group px-7 sm:px-9 py-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto text-center"
//               >
//                 Learn More
//               </a>
//             </motion.div>
//           </motion.div>
//         </section>

//         <FeatureSlider features={quickFeatures} />

//         {/* How It Works Section */}
//         <section
//           id="how-it-works"
//           ref={howItWorksRef.ref} // Use ref from custom hook
//           className="py-16 sm:py-20 bg-white dark:bg-[#2a2a2a]"
//         >
//           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
//             <motion.div // Animate the section header
//               animate={howItWorksRef.animation}
//               initial="hidden"
//               variants={{
//                 visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
//                 hidden: { opacity: 0, y: 30 },
//               }}
//               className="text-center mb-12 sm:mb-16"
//             >
//               <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
//                 How It Works
//               </h2>
//               <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
//                 Recovering lost items is simple with CampusTrace.
//               </p>
//             </motion.div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative">
//               {/* Connecting Line */}
//               <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-1 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 -translate-y-1/2"></div>

//               {[
//                 {
//                   icon: FilePlus,
//                   title: "1. Report Item",
//                   description:
//                     "Quickly post details and a photo of a lost or found item. Use the AI Helper for better descriptions.",
//                 },
//                 {
//                   icon: Sparkles,
//                   title: "2. AI Matches",
//                   description:
//                     "Our smart system analyzes text and images, suggesting potential matches on your dashboard.",
//                 },
//                 {
//                   icon: MessageSquare, // Changed icon
//                   title: "3. Connect Securely",
//                   description:
//                     "Claim items with a unique detail. Chat safely in-app after approval to arrange the return.",
//                 },
//               ].map((step, index) => {
//                 const stepView = useInView({
//                   threshold: 0.3,
//                   triggerOnce: true,
//                 });
//                 return (
//                   <motion.div
//                     key={step.title}
//                     ref={stepView.ref}
//                     animate={stepView.animation}
//                     initial="hidden"
//                     variants={{
//                       visible: {
//                         opacity: 1,
//                         y: 0,
//                         transition: { duration: 0.6, delay: index * 0.15 },
//                       },
//                       hidden: { opacity: 0, y: 40 },
//                     }}
//                     className="relative text-center group"
//                   >
//                     <div className="relative inline-block mb-5 sm:mb-8">
//                       <motion.div
//                         whileHover={{ scale: 1.1, rotate: 10 }}
//                         transition={{
//                           type: "spring",
//                           stiffness: 300,
//                           damping: 10,
//                         }}
//                         className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/10 dark:to-primary-500/20 rounded-full mx-auto ring-4 ring-white dark:ring-[#2a2a2a]"
//                       >
//                         <step.icon className="w-7 h-7 sm:w-9 sm:h-9 text-primary-600 dark:text-primary-400" />
//                       </motion.div>
//                       {/* Animated Ring */}
//                       <span className="absolute inset-0 rounded-full ring-2 ring-primary-500/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//                     </div>
//                     <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
//                       {step.title}
//                     </h3>
//                     <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm sm:text-base">
//                       {step.description}
//                     </p>
//                   </motion.div>
//                 );
//               })}
//             </div>
//           </div>
//         </section>

//         {/* Features Section */}
//         <div id="features">
//           <FeatureSection
//             title="For Students & Staff"
//             subtitle="Smart tools designed for effortless item recovery within your trusted campus community."
//             features={studentFeatures}
//             id="student-features"
//             startIndex={0}
//           />

//           <section className="bg-neutral-100 dark:bg-[#2a2a2a]">
//             <FeatureSection
//               title="For University Administrators"
//               subtitle="Manage your campus lost and found efficiently with powerful, secure admin tools."
//               features={adminFeatures}
//               id="admin-features"
//               startIndex={studentFeatures.length} // Continue index count
//             />
//           </section>
//         </div>

//         {/* Screenshot Showcase Section */}
//         <ScreenshotSection screenshots={screenshots} />

//         {/* FAQ Section */}
//         <section className="py-16 sm:py-20 bg-white dark:bg-[#1a1a1a]">
//           <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center mb-10 sm:mb-14">
//               <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
//                 Got Questions?
//               </h2>
//               <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
//                 Find quick answers to common queries about CampusTrace.
//               </p>
//             </div>
//             <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-2 sm:p-4 shadow-lg border border-neutral-200 dark:border-neutral-700/50">
//               {faqs.map((faq, index) => (
//                 <FAQItem
//                   key={index}
//                   question={faq.question}
//                   answer={faq.answer}
//                   isOpen={openFAQ === index}
//                   onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
//                   index={index}
//                 />
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section
//           ref={ctaRef.ref} // Use ref from custom hook
//           className="py-20 sm:py-28 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white text-center relative overflow-hidden"
//         >
//           {/* Animated background shapes */}
//           <div className="absolute inset-0 opacity-20">
//             <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" />
//             <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse-delayed translate-x-1/2 translate-y-1/2" />
//           </div>

//           <motion.div // Animate CTA content
//             animate={ctaRef.animation}
//             initial="hidden"
//             variants={{
//               visible: {
//                 opacity: 1,
//                 y: 0,
//                 transition: { duration: 0.8, delay: 0.2 },
//               },
//               hidden: { opacity: 0, y: 30 },
//             }}
//             className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
//           >
//             <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-8">
//               Ready to Simplify Lost & Found?
//             </h2>
//             <p className="text-lg sm:text-xl md:text-2xl mb-10 sm:mb-12 text-white/90 max-w-2xl mx-auto">
//               Join your campus community on CampusTrace. Sign up with your
//               university email or ID today.
//             </p>
//             <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
//               <Link
//                 to="/login"
//                 className="group px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary-600 text-base sm:text-lg font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2 relative overflow-hidden w-full sm:w-auto"
//               >
//                 <span className="relative z-10">Sign Up / Log In</span>
//                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
//                 <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//               </Link>
//               <Link
//                 to="/register-university"
//                 className="group px-8 sm:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white text-base sm:text-lg font-bold rounded-lg hover:bg-white/20 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center"
//               >
//                 For Universities
//               </Link>
//             </div>
//           </motion.div>
//         </section>
//       </main>

//       {/* Footer */}
//       <footer className="bg-neutral-100 dark:bg-[#111111] py-16 sm:py-20 border-t border-neutral-200 dark:border-neutral-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-12 mb-10 sm:mb-14">
//             {/* Brand Info */}
//             <div className="col-span-1 md:col-span-2 lg:col-span-2">
//               <Link
//                 to="/"
//                 className="flex items-center gap-3 text-2xl font-bold text-primary-600 dark:text-primary-400 mb-5 group"
//               >
//                 <motion.img
//                   src={logo}
//                   alt="Campus Trace Logo"
//                   className="h-9 w-9 sm:h-11 sm:w-auto rounded-lg"
//                   whileHover={{ rotate: 15 }}
//                 />
//                 <span>CampusTrace</span>
//               </Link>
//               <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm leading-relaxed">
//                 Simplifying lost and found on campus with AI-powered matching
//                 and a secure, verified community.
//               </p>
//             </div>

//             {/* Quick Links */}
//             <div>
//               <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
//                 Quick Links
//               </h3>
//               <ul className="space-y-3">
//                 <li>
//                   <a href="#how-it-works" className="footer-link">
//                     How It Works
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#features" className="footer-link">
//                     Features
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#screenshots" className="footer-link">
//                     Showcase
//                   </a>
//                 </li>
//                 <li>
//                   <Link to="/about" className="footer-link">
//                     About Us
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             {/* Resources */}
//             <div>
//               <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
//                 Resources
//               </h3>
//               <ul className="space-y-3">
//                 <li>
//                   <Link to="/register-university" className="footer-link">
//                     For Universities
//                   </Link>
//                 </li>
//                 <li>
//                   <Link to="/learn-more" className="footer-link">
//                     Detailed Guide
//                   </Link>
//                 </li>
//                 <li>
//                   <a href="#faq" className="footer-link">
//                     FAQ
//                   </a>
//                 </li>{" "}
//                 {/* Link to FAQ section */}
//               </ul>
//             </div>

//             {/* Contact */}
//             <div>
//               <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
//                 Contact
//               </h3>
//               <ul className="space-y-3">
//                 <li>
//                   <a
//                     href="mailto:contactCampustrace@gmail.com"
//                     className="footer-link break-words"
//                   >
//                     contactCampustrace@gmail.com
//                   </a>
//                 </li>
//                 {/* Add Social Links if available */}
//                 {/* <li className="flex gap-4 pt-2">
//                                 <a href="#" className="text-neutral-500 hover:text-primary-600"><Github size={20}/></a>
//                                 <a href="#" className="text-neutral-500 hover:text-primary-600"><Linkedin size={20}/></a>
//                             </li> */}
//               </ul>
//             </div>
//           </div>

//           {/* Bottom Bar */}
//           <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center sm:flex sm:justify-between sm:items-center">
//             <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mb-4 sm:mb-0">
//               © {new Date().getFullYear()} CampusTrace. All rights reserved.
//             </p>
//             <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
//               Project By: Bugauisan, Respicio, & Cacho (ISU - Cauayan)
//             </p>
//           </div>
//         </div>
//       </footer>

//       <style jsx>{`
//         .footer-link {
//           @apply text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block;
//         }

//         /* Keyframes */
//         @keyframes fadeInDown {
//           from {
//             opacity: 0;
//             transform: translateY(-15px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }
//         @keyframes slideInLeft {
//           from {
//             opacity: 0;
//             transform: translateX(-15px);
//           }
//           to {
//             opacity: 1;
//             transform: translateX(0);
//           }
//         }
//         @keyframes float {
//           0%,
//           100% {
//             transform: translateY(0px) rotate(0deg);
//           }
//           50% {
//             transform: translateY(-15px) rotate(5deg);
//           }
//         }
//         @keyframes float-delayed {
//           0%,
//           100% {
//             transform: translateY(0px) rotate(0deg);
//           }
//           50% {
//             transform: translateY(-20px) rotate(-5deg);
//           }
//         }
//         @keyframes pulse-delayed {
//           0%,
//           100% {
//             opacity: 0.5;
//           }
//           50% {
//             opacity: 0.7;
//           }
//         }
//         @keyframes gradient {
//           0%,
//           100% {
//             background-position: 0% 50%;
//           }
//           50% {
//             background-position: 100% 50%;
//           }
//         }
//         @keyframes slide {
//           from {
//             transform: translateX(0);
//           }
//           to {
//             transform: translateX(-50%);
//           }
//         }

//         /* Apply animations */
//         .animate-fade-in-up {
//           animation: fade-in-up 0.8s ease-out forwards;
//         }
//         .animate-slideInLeft {
//           animation: slideInLeft 0.3s ease-out forwards;
//         }
//         .animate-float {
//           animation: float 7s ease-in-out infinite;
//         }
//         .animate-float-delayed {
//           animation: float-delayed 9s ease-in-out infinite 0.5s;
//         } /* Added delay */
//         .animate-pulse-delayed {
//           animation: pulse-delayed 4s ease-in-out infinite;
//         }
//         .animate-gradient {
//           animation: gradient 4s ease infinite;
//         } /* Slower gradient shift */
//         .animate-slide {
//           animation: slide 40s linear infinite;
//         } /* Slower slide */

//         @keyframes fade-in-up {
//           from {
//             opacity: 0;
//             transform: translateY(25px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//       `}</style>
//     </div>
//   );
// }



import adminAnalytics from "../../assets/adminanalytics.png";
import browseAllItem from "../../assets/browseallitem.png";
import claimItem from "../../assets/claimitem.png";
import dashboardUser from "../../assets/dashboaruser.png";
import messageImg from "../../assets/message.png";
import postNewItem from "../../assets/postnewitem.png";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView as useIntersectionObserver } from "react-intersection-observer"; // Renamed hook
import {
  ShieldCheck,
  Search,
  FilePlus,
  Sparkles,
  Bell,
  ChevronDown,
  MessageCircle,
  Users,
  Menu,
  X,
  ArrowRight,
  Clock,
  KeyRound,
  UserCheck,
  Award,
  Map,
  MessageSquare,
  Zap,
  LayoutDashboard,
  Settings,
  Lock,
  University,
  Eye, // Added Eye icon for visibility/showcase
} from "lucide-react";
import logo from "../../Images/Logo.svg"; // Ensure this path is correct

// --- Screenshot Modal Component ---
const ScreenshotModal = ({ isOpen, onClose, screenshot, allScreenshots, currentIndex }) => {
  const [currentIdx, setCurrentIdx] = useState(currentIndex);

  useEffect(() => {
    setCurrentIdx(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIdx((prev) => (prev === 0 ? allScreenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev === allScreenshots.length - 1 ? 0 : prev + 1));
  };

  const currentScreenshot = allScreenshots[currentIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Previous Button */}
      {allScreenshots.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
      )}

      {/* Next Button */}
      {allScreenshots.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronDown className="w-6 h-6 -rotate-90" />
        </button>
      )}

      {/* Image Container */}
      <motion.div
        key={currentIdx}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-7xl w-full max-h-[90vh] bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-2xl"
      >
        <img
          src={currentScreenshot.src}
          alt={currentScreenshot.alt}
          className="w-full h-full object-contain"
        />
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <p className="text-white text-lg font-semibold text-center">
            {currentScreenshot.alt}
          </p>
          {allScreenshots.length > 1 && (
            <p className="text-white/70 text-sm text-center mt-2">
              {currentIdx + 1} / {allScreenshots.length}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Screenshot Placeholder Component ---
const ScreenshotPlaceholder = ({ alt }) => (
  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
      CampusTrace
    </div>
    <div className="text-lg text-gray-600 dark:text-gray-300 text-center">
      {alt}
    </div>
    <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
      Screenshot Coming Soon
    </div>
  </div>
);




// --- Custom Hook for Intersection Observer (using react-intersection-observer) ---
const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
  const { ref, inView } = useIntersectionObserver(options);
  const animation = useAnimation();

  useEffect(() => {
    if (inView) {
      animation.start("visible");
    }
  }, [animation, inView]);

  return { ref, animation, inView };
};

// --- Parallax Hook ---
const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return offset;
};

// --- Scroll Progress Bar Component ---
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalHeight) * 100;
      setProgress(currentProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[60]">
      <div
        className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-all duration-150 shadow-lg shadow-primary-500/50"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// --- Feature Slider Component ---
const FeatureSlider = ({ features }) => {
  const controls = useAnimation();
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, delay: 0.2 },
        },
        hidden: { opacity: 0, y: 20 },
      }}
      className="py-12 sm:py-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider mb-6 sm:mb-8 px-4">
          KEY FEATURES OF CAMPUSTRACE
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="animate-slide flex w-max">
            {[...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="w-64 sm:w-80 flex-shrink-0 flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 hover:scale-105 transition-transform duration-300"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-lg text-neutral-600 dark:text-neutral-300 truncate">
                    {feature.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- FAQ Item Component ---
const FAQItem = ({ question, answer, isOpen, onToggle, index }) => {
  const controls = useAnimation();
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, delay: index * 0.1 },
      });
    }
  }, [controls, inView, index]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial={{ opacity: 0, x: -20 }}
      className="border-b border-neutral-200 dark:border-neutral-800 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-5 sm:py-6 px-4 flex justify-between items-center text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg group transition-all duration-300"
      >
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-4 sm:pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          className="p-1.5 sm:p-2 rounded-full bg-primary-100 dark:bg-primary-500/10 flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="pb-5 sm:pb-6 px-4">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Feature Card Component ---
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const { ref, animation, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15; // Reduced intensity
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 15; // Reduced intensity
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      animate={animation}
      initial="hidden"
      variants={{
        visible: {
          opacity: 1,
          y: 0,
          rotate: 0,
          transition: { duration: 0.6, delay: index * 0.1 },
        },
        hidden: { opacity: 0, y: 50, rotate: 2 },
      }}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${
              mousePosition.x
            }deg) translateZ(5px)` // Reduced translateZ
          : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }} // Spring animation for hover
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`relative rounded-2xl bg-white dark:bg-[#2a2a2a] p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 h-full group border border-transparent hover:border-primary-500/20`} // Added border effect
      >
        {/* Subtle Glow Effect on Hover */}
        <div
          className={`absolute -inset-px rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
            isHovered
              ? "bg-gradient-to-br from-primary-400/10 via-transparent to-purple-400/10"
              : ""
          }`}
          aria-hidden="true"
        />

        <div className="relative mb-4 sm:mb-6">
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 6 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg"
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
          </motion.div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
          {description}
        </p>
        {/* Corner Decoration */}
        <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-tr-2xl rounded-bl-2xl">
          <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500/10 to-transparent transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </motion.div>
  );
};

// --- Feature Section Component ---
const FeatureSection = ({ title, subtitle, features, id, startIndex = 0 }) => {
  const { ref, animation, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const titleParallax = useParallax(0.1);

  return (
    <section
      ref={ref}
      id={id}
      className="py-16 sm:py-20 relative overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div
        className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent -z-10"
        style={{ transform: `translateY(${titleParallax}px)` }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={animation}
          initial="hidden"
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            hidden: { opacity: 0, y: 30 },
          }}
          className="text-center mb-10 sm:mb-14 relative"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 relative inline-block px-4">
            {title}
            {/* Underline animation */}
            <motion.span
              initial={{ width: 0 }}
              animate={inView ? { width: "60%" } : {}}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.25, 1, 0.5, 1],
              }} // Smoother ease
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
            />
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 sm:mt-6 px-4">
            {subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={startIndex + index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Screenshot Section Component ---
// --- Screenshot Section Component with Placeholder Support ---
// --- Screenshot Section Component with Click-to-View ---
const ScreenshotSection = ({ screenshots }) => {
  const { ref, animation, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  const [imageErrors, setImageErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageClick = (index) => {
    if (!imageErrors[index]) {
      setSelectedIndex(index);
      setModalOpen(true);
    }
  };

  return (
    <>
      <section
        ref={ref}
        id="screenshots"
        className="py-16 sm:py-20 bg-neutral-100 dark:bg-[#2a2a2a] overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={animation}
            initial="hidden"
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
              hidden: { opacity: 0, y: 30 },
            }}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 relative inline-block px-4">
              See CampusTrace in Action
              <motion.span
                initial={{ width: 0 }}
                animate={inView ? { width: "60%" } : {}}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
              />
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 sm:mt-6 px-4">
              Take a visual tour of our key features and user-friendly interface. Click any image to view it in full size.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {screenshots.map((screenshot, index) => {
              const itemControls = useAnimation();
              const { ref: itemRef, inView: itemInView } =
                useIntersectionObserver({ threshold: 0.2, triggerOnce: true });

              useEffect(() => {
                if (itemInView) {
                  itemControls.start({
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.6, delay: index * 0.15 },
                  });
                }
              }, [itemControls, itemInView, index]);

              return (
                <motion.div
                  key={index}
                  ref={itemRef}
                  animate={itemControls}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  onClick={() => handleImageClick(index)}
                  className="rounded-xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-700 aspect-[16/10] group bg-white dark:bg-neutral-800 cursor-pointer relative"
                >
                  {imageErrors[index] ? (
                    <ScreenshotPlaceholder alt={screenshot.alt} />
                  ) : (
                    <>
                      <img
                        src={screenshot.src}
                        alt={screenshot.alt}
                        onError={() => handleImageError(index)}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                          <Eye className="w-8 h-8 text-white" />
                          <span className="text-white text-sm font-semibold">Click to view</span>
                        </div>
                      </div>
                      {/* Caption */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm font-medium text-center">
                          {screenshot.alt}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal */}
      <ScreenshotModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        screenshot={screenshots[selectedIndex]}
        allScreenshots={screenshots}
        currentIndex={selectedIndex}
      />
    </>
  );
};
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0); // Start with the first FAQ open
  const heroParallax = useParallax(0.3);
  const gridParallax = useParallax(-0.2);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    // Set overflow-x to hidden to prevent horizontal scroll during animations
    document.body.style.overflowX = "hidden";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.overflowX = ""; // Reset on unmount
    };
  }, []);

  // Quick features for the slider
  const quickFeatures = [
    { icon: Sparkles, title: "AI-Powered Matching" },
    { icon: Search, title: "Visual & Text Search" }, // Updated
    { icon: MessageSquare, title: "Secure In-App Messaging" }, // Updated
    { icon: Award, title: "Leaderboard Recognition" }, // Updated
    { icon: KeyRound, title: "Verified Claim Process" }, // Updated
    { icon: ShieldCheck, title: "University-Verified Users" }, // Updated
    { icon: LayoutDashboard, title: "Admin Management Tools" }, // Added
  ];

  // Detailed features for students
  const studentFeatures = [
    {
      icon: Sparkles,
      title: "AI-Powered Search & Matching",
      description:
        "Describe or upload a photo of your item. Our AI (CLIP & SentenceTransformers) finds visual and text matches, proactively notifying you of potential finds.",
    },
    {
      icon: Zap,
      title: "Real-Time Notifications",
      description:
        "Get instant alerts via dashboard and email (optional) for possible matches, claim updates, new messages, and post moderation status changes.",
    },
    {
      icon: KeyRound,
      title: "Secure Claim & Messaging",
      description:
        "Claim items with a unique detail. Once approved, securely chat in-app with the finder/claimant to arrange the return without sharing personal contact info initially.",
    },
    {
      icon: FilePlus,
      title: "AI-Enhanced Posting",
      description:
        "Struggling with the description? Our Google Gemini-powered AI Helper suggests improvements and relevant tags to increase visibility.",
    },
    {
      icon: Award,
      title: "Community Leaderboard",
      description:
        "Get recognized for helping others! Successfully returning items earns you points and a spot on the campus leaderboard.",
    },
    {
      icon: UserCheck,
      title: "Verified Profile Picture AI",
      description:
        "Ensure a safe community. Our AI checks for a valid face during profile picture uploads, promoting trust and accountability.",
    },
  ];

  // Features for administrators
  const adminFeatures = [
    {
      icon: LayoutDashboard,
      title: "Comprehensive Admin Dashboard",
      description:
        "Monitor campus activity with real-time stats: user counts, pending posts/verifications, recovery rates, and activity charts.",
    },
    {
      icon: Users,
      title: "Robust User Management",
      description:
        "View, search, and manage all users within your university. Assign roles (Moderator, Admin), approve manual verifications, and ban users if needed.",
    },
    {
      icon: ShieldCheck,
      title: "Efficient Moderation Tools",
      description:
        "Quickly review and approve/reject new item posts. View post details, including images and descriptions, directly from the moderation queue.",
    },
    {
      icon: Settings,
      title: "Customizable Campus Settings",
      description:
        "Tailor CampusTrace: set the site name, manage allowed email domains for registration, configure auto-approval rules, and create keyword blacklists.",
    },
    {
      icon: Bell,
      title: "Admin Notifications",
      description:
        "Stay informed with notifications for new posts awaiting moderation and manual verification requests requiring your attention.",
    },
    {
      icon: Lock,
      title: "Secure Multi-Tenant System",
      description:
        "Rest easy knowing your university's data is isolated using Supabase Row Level Security, ensuring privacy and compliance.",
    },
  ];

  const screenshots = [
  { src: dashboardUser, alt: "User Dashboard Overview" },
  { src: browseAllItem, alt: "Browse All Items Page" },
  { src: postNewItem, alt: "Post New Item with AI Helper" },
  { src: claimItem, alt: "Item Details and Claim Modal" },
  { src: messageImg, alt: "In-App Messaging Interface" },
  { src: adminAnalytics, alt: "Admin Dashboard Analytics" },
];

  const faqs = [
    {
      question: "How does the AI matching work for my lost item?",
      answer:
        "When you post a 'Lost' item, our AI analyzes its text (title, description, category) and image (if provided) using SentenceTransformers and CLIP models. It then compares this against all approved 'Found' items in your university, calculating similarity scores. High-scoring matches appear under 'AI-Powered Matches' on your dashboard.",
    },
    {
      question: "How do I communicate securely after a claim is approved?",
      answer:
        "Once a finder approves a claim on their 'Found' item, a private chat conversation is automatically created between the finder and claimant. Both users receive a notification linking directly to this chat in the 'Messages' section. You can coordinate the return here without initially sharing external contact details.",
    },
    {
      question: "What if I don't have a university email?",
      answer:
        "You can register using a personal email (like Gmail). During sign-up, choose the 'Register with your University ID instead' option. You'll select your university and upload a clear photo of your ID. An administrator from your university will review your request. You'll receive an email notification once approved.",
    },
    {
      question: "Is my personal information safe?",
      answer:
        "Yes. Your primary login email is not displayed publicly. Contact information is only shared within the secure in-app chat after a claim is mutually approved. Optional contact details added to a post description are visible. We use Supabase's security features, including Row Level Security, to protect user data and isolate university information.",
    },
    {
      question: "How does the Leaderboard work?",
      answer:
        "Successfully returning a 'Found' item to its owner (marked as 'Recovered' after claim approval) earns the finder points. The Leaderboard page ranks users within your university based on the number of items they've helped return, encouraging community participation.",
    },
  ];

  const howItWorksRef = useInView({ threshold: 0.2, triggerOnce: true }); // Use custom hook
  const ctaRef = useInView({ threshold: 0.3, triggerOnce: true }); // Use custom hook

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 flex flex-col overflow-x-hidden">
      <ScrollProgress />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Brand Name */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <motion.img
                src={logo}
                alt="Campus Trace Logo"
                className="h-8 w-8 sm:h-10 sm:w-auto rounded-full"
                whileHover={{ scale: 1.15, rotate: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
              <span className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-white">
                CampusTrace
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { to: "#how-it-works", label: "How It Works", isAnchor: true },
                { to: "#features", label: "Features", isAnchor: true },
                { to: "#screenshots", label: "Showcase", isAnchor: true }, // New Showcase link
                { to: "/about", label: "About Us", isAnchor: false },
                {
                  to: "/register-university",
                  label: "For Universities",
                  isAnchor: false,
                },
              ].map((link, index) =>
                link.isAnchor ? (
                  <a
                    key={link.to}
                    href={link.to}
                    className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                )
              )}
              <Link
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300"
              >
                Log In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            initial={false}
            animate={{ height: mobileMenuOpen ? "auto" : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="pt-2 pb-4 space-y-1 border-t border-neutral-200 dark:border-neutral-800">
              {[
                { to: "#how-it-works", label: "How It Works", isAnchor: true },
                { to: "#features", label: "Features", isAnchor: true },
                { to: "#screenshots", label: "Showcase", isAnchor: true },
                { to: "/about", label: "About Us", isAnchor: false },
                {
                  to: "/register-university",
                  label: "For Universities",
                  isAnchor: false,
                },
              ].map((link, index) =>
                link.isAnchor ? (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full mt-3 py-3 text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white text-base font-semibold rounded-lg shadow-md"
              >
                Log In
              </Link>
            </div>
          </motion.div>
        </nav>
      </header>

      <main className="flex-grow pt-16 sm:pt-20 relative z-10">
        {/* Hero Section */}
        <section className="min-h-[calc(70vh-64px)] sm:min-h-[calc(80vh-80px)] flex items-center justify-center text-center relative overflow-hidden px-4">
          <div
            className="absolute inset-0 opacity-20 dark:opacity-5 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]"
            style={{ transform: `translateY(${gridParallax}px)` }}
          >
            {/* Grid pattern SVG */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full text-neutral-300 dark:text-neutral-800/50"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  width="72"
                  height="72"
                  patternUnits="userSpaceOnUse"
                  x="50%"
                  y="50%"
                  patternTransform="translate(-36 -36)"
                >
                  <path
                    d="M0 72V.5H72"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></path>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
            </svg>
          </div>

          <div className="absolute inset-0 overflow-hidden -z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-10 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-primary-400/10 dark:bg-primary-500/10 rounded-full blur-3xl animate-float"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"
            />
          </div>

          <motion.div
            className="max-w-4xl mx-auto py-12 sm:py-16 relative z-10"
            style={{ transform: `translateY(${heroParallax}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} // Smoother ease
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Reconnect What's Lost,{" "}
                <span className="bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500 dark:from-primary-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] block sm:inline mt-2 sm:mt-0">
                  Powered by AI
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="mt-5 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400"
            >
              CampusTrace uses smart technology to make finding lost items on
              campus simple and fast. Join your university's secure lost and
              found network today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6"
            >
              <Link
                to="/login"
                className="group px-7 sm:px-9 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden text-base sm:text-lg w-full sm:w-auto"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <a
                href="#features" // Link to features section
                className="group px-7 sm:px-9 py-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto text-center"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </section>

        <FeatureSlider features={quickFeatures} />

        {/* How It Works Section */}
        <section
          id="how-it-works"
          ref={howItWorksRef.ref} // Use ref from custom hook
          className="py-16 sm:py-20 bg-white dark:bg-[#2a2a2a]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div // Animate the section header
              animate={howItWorksRef.animation}
              initial="hidden"
              variants={{
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
                hidden: { opacity: 0, y: 30 },
              }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                Recovering lost items is simple with CampusTrace.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-1 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 -translate-y-1/2"></div>

              {[
                {
                  icon: FilePlus,
                  title: "1. Report Item",
                  description:
                    "Quickly post details and a photo of a lost or found item. Use the AI Helper for better descriptions.",
                },
                {
                  icon: Sparkles,
                  title: "2. AI Matches",
                  description:
                    "Our smart system analyzes text and images, suggesting potential matches on your dashboard.",
                },
                {
                  icon: MessageSquare, // Changed icon
                  title: "3. Connect Securely",
                  description:
                    "Claim items with a unique detail. Chat safely in-app after approval to arrange the return.",
                },
              ].map((step, index) => {
                const stepView = useInView({
                  threshold: 0.3,
                  triggerOnce: true,
                });
                return (
                  <motion.div
                    key={step.title}
                    ref={stepView.ref}
                    animate={stepView.animation}
                    initial="hidden"
                    variants={{
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, delay: index * 0.15 },
                      },
                      hidden: { opacity: 0, y: 40 },
                    }}
                    className="relative text-center group"
                  >
                    <div className="relative inline-block mb-5 sm:mb-8">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        }}
                        className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/10 dark:to-primary-500/20 rounded-full mx-auto ring-4 ring-white dark:ring-[#2a2a2a]"
                      >
                        <step.icon className="w-7 h-7 sm:w-9 sm:h-9 text-primary-600 dark:text-primary-400" />
                      </motion.div>
                      {/* Animated Ring */}
                      <span className="absolute inset-0 rounded-full ring-2 ring-primary-500/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm sm:text-base">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <div id="features">
          <FeatureSection
            title="For Students & Staff"
            subtitle="Smart tools designed for effortless item recovery within your trusted campus community."
            features={studentFeatures}
            id="student-features"
            startIndex={0}
          />

          <section className="bg-neutral-100 dark:bg-[#2a2a2a]">
            <FeatureSection
              title="For University Administrators"
              subtitle="Manage your campus lost and found efficiently with powerful, secure admin tools."
              features={adminFeatures}
              id="admin-features"
              startIndex={studentFeatures.length} // Continue index count
            />
          </section>
        </div>

        {/* Screenshot Showcase Section */}
        <ScreenshotSection screenshots={screenshots} />

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
                Got Questions?
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
                Find quick answers to common queries about CampusTrace.
              </p>
            </div>
            <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-2 sm:p-4 shadow-lg border border-neutral-200 dark:border-neutral-700/50">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={ctaRef.ref} // Use ref from custom hook
          className="py-20 sm:py-28 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white text-center relative overflow-hidden"
        >
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse-delayed translate-x-1/2 translate-y-1/2" />
          </div>

          <motion.div // Animate CTA content
            animate={ctaRef.animation}
            initial="hidden"
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, delay: 0.2 },
              },
              hidden: { opacity: 0, y: 30 },
            }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-8">
              Ready to Simplify Lost & Found?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl mb-10 sm:mb-12 text-white/90 max-w-2xl mx-auto">
              Join your campus community on CampusTrace. Sign up with your
              university email or ID today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
              <Link
                to="/login"
                className="group px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary-600 text-base sm:text-lg font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2 relative overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10">Sign Up / Log In</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/register-university"
                className="group px-8 sm:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white text-base sm:text-lg font-bold rounded-lg hover:bg-white/20 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center"
              >
                For Universities
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-100 dark:bg-[#111111] py-16 sm:py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-12 mb-10 sm:mb-14">
            {/* Brand Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-3 text-2xl font-bold text-primary-600 dark:text-primary-400 mb-5 group"
              >
                <motion.img
                  src={logo}
                  alt="Campus Trace Logo"
                  className="h-9 w-9 sm:h-11 sm:w-auto rounded-lg"
                  whileHover={{ rotate: 15 }}
                />
                <span>CampusTrace</span>
              </Link>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm leading-relaxed">
                Simplifying lost and found on campus with AI-powered matching
                and a secure, verified community.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#how-it-works" className="footer-link">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="footer-link">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#screenshots" className="footer-link">
                    Showcase
                  </a>
                </li>
                <li>
                  <Link to="/about" className="footer-link">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/register-university" className="footer-link">
                    For Universities
                  </Link>
                </li>
                <li>
                  <Link to="/learn-more" className="footer-link">
                    Detailed Guide
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="footer-link">
                    FAQ
                  </a>
                </li>{" "}
                {/* Link to FAQ section */}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-lg">
                Contact
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:contactCampustrace@gmail.com"
                    className="footer-link break-words"
                  >
                    contactCampustrace@gmail.com
                  </a>
                </li>
                {/* Add Social Links if available */}
                {/* <li className="flex gap-4 pt-2">
                                <a href="#" className="text-neutral-500 hover:text-primary-600"><Github size={20}/></a>
                                <a href="#" className="text-neutral-500 hover:text-primary-600"><Linkedin size={20}/></a>
                            </li> */}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center sm:flex sm:justify-between sm:items-center">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mb-4 sm:mb-0">
              © {new Date().getFullYear()} CampusTrace. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
              Project By: Bugauisan, Respicio, & Cacho (ISU - Cauayan)
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer-link {
          @apply text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hover:translate-x-1 inline-block;
        }

        /* Keyframes */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(-5deg);
          }
        }
        @keyframes pulse-delayed {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes slide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        /* Apply animations */
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out forwards;
        }
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 9s ease-in-out infinite 0.5s;
        } /* Added delay */
        .animate-pulse-delayed {
          animation: pulse-delayed 4s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        } /* Slower gradient shift */
        .animate-slide {
          animation: slide 40s linear infinite;
        } /* Slower slide */

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
