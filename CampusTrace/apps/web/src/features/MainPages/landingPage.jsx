import adminAnalytics from "../../assets/adminanalytics.png";
import browseAllItem from "../../assets/BrowseAll.png";
import claimItem from "../../assets/claimitem.png";
import dashboardUser from "../../assets/dashboarduser.png";
import messageImg from "../../assets/Messenger.png";
import postNewItem from "../../assets/PostItem.png";
import logo from "../../Images/Logo.svg";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useInView as useIntersectionObserver } from "react-intersection-observer";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
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
  Eye,
  Maximize2,
  Download as DownloadIcon,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Tablet,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Star,
  TrendingUp,
  Camera,
} from "lucide-react";
const ProfessionalScreenshotGallery = ({ screenshots }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});

  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleImageLoad = (index) => {
    setImageLoadStates((prev) => ({ ...prev, [index]: "loaded" }));
  };

  const handleImageError = (index) => {
    setImageLoadStates((prev) => ({ ...prev, [index]: "error" }));
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:auto-rows-[minmax(250px,_auto)] gap-6 sm:gap-8">
        {screenshots.map((screenshot, index) => {
          const itemControls = useAnimation();
          const { ref: itemRef, inView: itemInView } = useIntersectionObserver({
            threshold: 0.2,
            triggerOnce: true,
          });

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

          const bentoClasses = [
            "lg:col-span-2 lg:row-span-2",
            "lg:col-span-1",
            "lg:col-span-1",
            "lg:col-span-1",
            "lg:col-span-1",
            "lg:col-span-1",
          ];

          return (
            <motion.div
              key={index}
              ref={itemRef}
              animate={itemControls}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              className={`group relative rounded-xl overflow-hidden bg-white dark:bg-neutral-800 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 ${
                bentoClasses[index] || "lg:col-span-1"
              }`}
              onClick={() => openLightbox(index)}
            >
              {/* Aspect Ratio Container */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                {/* Loading Skeleton */}
                {imageLoadStates[index] !== "loaded" &&
                  imageLoadStates[index] !== "error" && (
                    <div className="absolute inset-0 animate-pulse">
                      <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-neutral-400 dark:text-neutral-600">
                          <svg
                            className="animate-spin h-8 w-8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Error State */}
                {imageLoadStates[index] === "error" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                    <X className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Failed to load image
                    </div>
                    <div className="text-sm text-red-500 dark:text-red-300 text-center">
                      {screenshot.alt}
                    </div>
                  </div>
                ) : (
                  /* Lazy Loaded Image */
                  <LazyLoadImage
                    src={screenshot.src}
                    alt={screenshot.alt}
                    effect="blur"
                    afterLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    wrapperClassName="w-full h-full"
                    threshold={100}
                  />
                )}

                {/* Premium Overlay Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                          {screenshot.alt}
                        </h3>
                        <p className="text-white/90 text-sm drop-shadow-md">
                          Click to view in fullscreen
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                      >
                        <Maximize2 className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Top Icons */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20"
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </div>

                {/* Badge */}
                {screenshot.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Featured
                  </div>
                )}

                {/* Image Number Badge */}
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {index + 1} / {screenshots.length}
                </div>
              </div>

              {/* REMOVED THIS SECTION: This is what created the "attached" look.
                The title is already in the hover overlay, which is cleaner.
              */}
              {/* <div className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate pr-2">
                    {screenshot.alt}
                  </span>
                  <Eye className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                </div>
              </div> 
              */}
            </motion.div>
          );
        })}
      </div>

      {/* Professional Lightbox (No changes here) */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={screenshots.map((s) => ({
          src: s.src,
          alt: s.alt,
          title: s.alt,
          description: s.description,
        }))}
        plugins={[Zoom, Fullscreen, Slideshow, Thumbnails, Download]}
        carousel={{
          finite: true,
          preload: 2,
          imageFit: "contain",
          imageProps: {
            style: {
              maxHeight: "90vh",
              maxWidth: "90vw",
              objectFit: "contain",
            },
          },
        }}
        zoom={{
          maxZoomPixelRatio: 4,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        fullscreen={{
          auto: false,
        }}
        slideshow={{
          autoplay: false,
          delay: 3000,
        }}
        thumbnails={{
          position: "bottom",
          width: 100,
          height: 60,
          border: 2,
          borderRadius: 4,
          padding: 4,
          gap: 16,
          imageFit: "cover",
          vignette: true,
        }}
        animation={{
          fade: 250,
          swipe: 500,
          navigation: 250,
        }}
        toolbar={{
          buttons: [
            "close",
            <button
              key="custom-zoom"
              type="button"
              aria-label="Zoom"
              className="yarl__button"
              onClick={() => {}}
            >
              <Maximize2 className="w-5 h-5" />
            </button>,
          ],
        }}
        styles={{
          root: {
            "--yarl__color_backdrop": "rgba(0, 0, 0, 0.95)",
            "--yarl__color_button": "rgba(255, 255, 255, 0.9)",
            "--yarl__color_button_active": "rgba(255, 255, 255, 1)",
          },
          container: {
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(10px)",
          },
          thumbnailsContainer: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
          },
          thumbnail: {
            border: "2px solid transparent",
            filter: "brightness(0.8)",
            "&:hover": {
              filter: "brightness(1)",
            },
          },
          thumbnailActive: {
            border: "2px solid #3b82f6",
            filter: "brightness(1)",
          },
        }}
        render={{
          slide: ({ slide, rect }) => {
            return (
              <div className="flex flex-col items-center justify-center h-full">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  style={{
                    filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))",
                  }}
                />
                {/* Caption */}
                <div className="absolute bottom-20 left-0 right-0 text-center p-4">
                  <h3 className="text-white text-xl font-semibold mb-2 drop-shadow-lg">
                    {slide.title}
                  </h3>
                  {slide.description && (
                    <p className="text-white/80 text-sm max-w-2xl mx-auto drop-shadow-md">
                      {slide.description}
                    </p>
                  )}
                </div>
              </div>
            );
          },
          iconPrev: () => <ChevronLeft className="w-8 h-8" />,
          iconNext: () => <ChevronRight className="w-8 h-8" />,
          iconClose: () => <X className="w-6 h-6" />,
          iconZoomIn: () => <span>+</span>,
          iconZoomOut: () => <span>−</span>,
          iconDownload: () => <DownloadIcon className="w-5 h-5" />,
        }}
        on={{
          click: () => {},
          entering: () => {
            document.body.style.overflow = "hidden";
          },
          exiting: () => {
            document.body.style.overflow = "unset";
          },
        }}
      />
    </>
  );
};

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
        <p className="text-sm sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider mb-8 sm:mb-8 px-4">
          KEY FEATURES OF CAMPUSTRACE
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="animate-slide flex w-max">
            {[...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="w-72 sm:w-80 flex-shrink-0 flex items-center justify-center gap-4 sm:gap-4 px-8 sm:px-8 hover:scale-105 transition-transform duration-300"
                >
                  <Icon className="w-6 h-6 sm:w-6 sm:h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <span className="font-semibold text-base sm:text-lg text-neutral-600 dark:text-neutral-300 truncate">
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
        className="w-full py-4 sm:py-5 md:py-6 px-3 sm:px-4 flex justify-between items-center text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg group transition-all duration-300"
      >
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-900 dark:text-white pr-3 sm:pr-4 md:pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 leading-snug">
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          className="p-1 sm:p-1.5 md:p-2 rounded-full bg-primary-100 dark:bg-primary-500/10 flex-shrink-0"
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
        <div className="pb-4 sm:pb-5 md:pb-6 px-3 sm:px-4">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 15;
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
            }deg) translateZ(5px)`
          : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`relative rounded-xl sm:rounded-2xl bg-white dark:bg-[#2a2a2a] p-5 sm:p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300 h-full group border border-transparent hover:border-primary-500/20`}
      >
        <div
          className={`absolute -inset-px rounded-xl sm:rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
            isHovered
              ? "bg-gradient-to-br from-primary-400/10 via-transparent to-blue-400/10"
              : ""
          }`}
          aria-hidden="true"
        />

        <div className="relative mb-4 sm:mb-5 md:mb-6">
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 6 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 bg-primary-100 dark:bg-primary-500/10 rounded-lg shadow-sm"
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400" />
          </motion.div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
          {description}
        </p>

        <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-tr-2xl rounded-bl-2xl">
          <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500/10 to-transparent transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </motion.div>
  );
};

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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 relative inline-block px-4">
            {title}
            <motion.span
              initial={{ width: 0 }}
              animate={inView ? { width: "60%" } : {}}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary-500 rounded-full"
            />
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 px-4">
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

const ScreenshotSection = ({ screenshots }) => {
  const { ref, animation, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      id="screenshots"
      className="py-16 sm:py-20 bg-neutral-100 dark:bg-[#2a2a2a] overflow-hidden scroll-mt-28"
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 relative inline-block px-4">
            See CampusTrace in Action
            <motion.span
              initial={{ width: 0 }}
              animate={inView ? { width: "60%" } : {}}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary-500 rounded-full"
            />
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-4 px-4">
            Take a visual tour of our key features and user-friendly interface.
            Click any image to view it in full size.
          </p>
        </motion.div>

        {/* Use the new Professional Screenshot Gallery */}
        <ProfessionalScreenshotGallery screenshots={screenshots} />
      </div>
    </section>
  );
};

// Mobile App Section Component
const MobileAppSection = () => {
  const { ref, animation, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      id="mobile-app"
      ref={ref}
      className="py-16 sm:py-24 bg-gradient-to-br from-primary-50 via-blue-50 to-primary-100 dark:from-primary-900/10 dark:via-[#1a1a1a] dark:to-primary-900/5 relative overflow-hidden scroll-mt-28"
    >
      {/* Background decorations - Blue Theme Only */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse-delayed" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          animate={animation}
          initial="hidden"
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            hidden: { opacity: 0, y: 30 },
          }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-500/10 rounded-full mb-6">
            <Smartphone className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              NOW AVAILABLE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 px-4">
            CampusTrace On The Go
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
            Take CampusTrace with you everywhere. Download our mobile app for
            Android devices and never miss a match notification.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Left side - Features */}
          <motion.div
            animate={animation}
            initial="hidden"
            variants={{
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.8, delay: 0.2 },
              },
              hidden: { opacity: 0, x: -30 },
            }}
            className="space-y-4 sm:space-y-5 md:space-y-6"
          >
            {[
              {
                icon: Bell,
                title: "Push Notifications",
                description:
                  "Receive instant alerts for AI matches, claims, and messages directly on your phone.",
              },
              {
                icon: Camera,
                title: "Quick Photo Capture",
                description:
                  "Snap and post lost or found items on the spot with your phone's camera.",
              },
              {
                icon: MessageSquare,
                title: "Chat Anywhere",
                description:
                  "Stay connected and coordinate item returns while you're on the move.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Optimized mobile experience with offline support and fast loading times.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex gap-3 sm:gap-4 items-start bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-500/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right side - Download CTA */}
          <motion.div
            animate={animation}
            initial="hidden"
            variants={{
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.8, delay: 0.4 },
              },
              hidden: { opacity: 0, x: 30 },
            }}
            className="relative mt-8 md:mt-0"
          >
            <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-white shadow-2xl">
              <div className="flex items-center justify-center mb-5 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  <Smartphone className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center">
                Download for Android
              </h3>

              <p className="text-white/90 text-center mb-6 sm:mb-8 text-xs sm:text-sm md:text-base px-2">
                Get the CampusTrace APK file and install it on your Android
                device. Not yet available on Google Play Store.
              </p>

              <div className="space-y-3 sm:space-y-4">
                <a
                  href="https://expo.dev/artifacts/eas/5Fz1uzKQiPgRk4C8CtmVQ2.apk"
                  className="block w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-white text-primary-600 rounded-xl font-bold text-center hover:bg-neutral-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
                  onClick={(e) => {
                    const confirmed = window.confirm(
                      "⚠️ IMPORTANT SECURITY NOTICE\n\n" +
                        "You are about to download the CampusTrace APK file.\n\n" +
                        "Before installing:\n" +
                        "1. Enable 'Install from Unknown Sources' in your Android settings\n" +
                        "2. This APK is safe and built by the CampusTrace team\n" +
                        "3. Your device may show a warning - this is normal for APK files\n\n" +
                        "Do you want to proceed with the download?"
                    );
                    if (!confirmed) {
                      e.preventDefault();
                    }
                  }}
                  download
                >
                  <div className="flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download APK</span>
                  </div>
                </a>

                <div className="flex items-center justify-center gap-2 text-white/80 text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Safe & Secure Download</span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20">
                <p className="text-xs sm:text-xs text-white/70 text-center px-2">
                  <strong className="text-white">Note:</strong> Enable "Install
                  from Unknown Sources" in your Android settings before
                  installing.
                </p>
              </div>
            </div>

            {/* Decorative elements - Blue Theme Only */}
            <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-20 h-20 sm:w-24 sm:h-24 bg-primary-200 dark:bg-primary-800/30 rounded-full blur-2xl -z-10"></div>
            <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200 dark:bg-blue-800/30 rounded-full blur-2xl -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Stats Section Component
const StatsSection = () => {
  const { ref, animation, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const stats = [
    { icon: TrendingUp, label: "Platform Launch", value: "2024", suffix: "" },
    {
      icon: ShieldCheck,
      label: "University-Verified",
      value: "100",
      suffix: "%",
    },
    { icon: Users, label: "Active Community", value: "Growing", suffix: "" },
    {
      icon: CheckCircle2,
      label: "AI-Powered Matching",
      value: "Smart",
      suffix: "",
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-white dark:bg-[#2a2a2a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={animation}
          initial="hidden"
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            hidden: { opacity: 0, y: 30 },
          }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Building a Better Campus Community
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            CampusTrace is a new platform designed to revolutionize how
            universities handle lost and found items.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 bg-neutral-50 dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-300"
            >
              <stat.icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <div className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                {stat.value}
                <span className="text-primary-600 dark:text-primary-400">
                  {stat.suffix}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Trust & Security Section
const TrustSection = () => {
  const { ref, animation, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className="py-16 sm:py-20 bg-neutral-100 dark:bg-[#1a1a1a]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={animation}
          initial="hidden"
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            hidden: { opacity: 0, y: 30 },
          }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Built With Security & Privacy in Mind
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Your safety and privacy are our top priorities. Here's how we
            protect your data and ensure a trusted community.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: University,
              title: "University Verification",
              description:
                "Only verified students and staff from registered universities can join, ensuring a trusted community.",
            },
            {
              icon: Lock,
              title: "Data Encryption",
              description:
                "All data is encrypted and isolated using Supabase Row Level Security for maximum privacy protection.",
            },
            {
              icon: UserCheck,
              title: "AI Face Verification",
              description:
                "Profile pictures are verified with AI to ensure authentic users and prevent fake accounts.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 dark:border-neutral-700"
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
                <item.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Main Landing Page Component ---
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroParallax = useParallax(0.3);
  const gridParallax = useParallax(-0.2);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.overflowX = "hidden";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.overflowX = "";
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Quick features for the slider
  const quickFeatures = [
    { icon: Sparkles, title: "AI-Powered Matching" },
    { icon: Search, title: "Visual & Text Search" },
    { icon: MessageSquare, title: "Secure In-App Messaging" },
    { icon: Award, title: "Leaderboard Recognition" },
    { icon: KeyRound, title: "Verified Claim Process" },
    { icon: ShieldCheck, title: "University-Verified Users" },
    { icon: LayoutDashboard, title: "Admin Management Tools" },
  ];

  const studentFeatures = [
    {
      icon: Sparkles,
      title: "AI-Powered Search & Matching",
      description:
        "Describe or upload a photo of your item. Our AI (jina AI) finds visual and text matches, proactively notifying you of potential finds.",
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
    {
      src: dashboardUser,
      alt: "User Dashboard Overview",
      description:
        "Clean and intuitive dashboard showing your active posts, AI-powered matches, and recent activity",
      featured: true,
    },
    {
      src: browseAllItem,
      alt: "Browse All Items Page",
      description:
        "Easily search and filter through all lost and found items in your campus community",
    },
    {
      src: postNewItem,
      alt: "Post New Item with AI Helper",
      description:
        "Create detailed posts with the help of our AI assistant for better descriptions and tags",
    },
    {
      src: claimItem,
      alt: "Item Details and Claim Modal",
      description:
        "View detailed item information and submit claims with verification details",
    },
    {
      src: messageImg,
      alt: "In-App Messaging Interface",
      description:
        "Secure messaging system to coordinate item returns without sharing personal contact info",
    },
    {
      src: adminAnalytics,
      alt: "Admin Dashboard Analytics",
      description:
        "Comprehensive analytics and management tools for university administrators",
    },
  ];

  const faqs = [
    {
      question: "How does the AI matching work for my lost item?",
      answer:
        "When you post a 'Lost' item, our AI analyzes its text (title, description, category) and image (if provided) using Jina AI. It then compares this against all approved 'Found' items in your university, calculating similarity scores. High-scoring matches appear under 'AI-Powered Matches' on your dashboard.",
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

  const howItWorksRef = useInView({ threshold: 0.2, triggerOnce: true });
  const ctaRef = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 flex flex-col overflow-x-hidden">
      <Helmet>
        <title>CampusTrace - AI-Powered Lost and Found for Universities</title>
        <meta
          name="description"
          content="CampusTrace is an intelligent lost and found platform for universities. Report lost items, claim found belongings, and reconnect with what matters using AI-powered matching technology."
        />
        <meta
          name="keywords"
          content="campustrace, lost and found, university platform, campus lost items, AI matching, student community, campus security, item recovery"
        />
      </Helmet>

      {/* Mobile App Alert Banner */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          type: "spring",
          stiffness: 100,
        }}
        className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white py-2.5 sm:py-3 shadow-lg backdrop-blur-sm"
        style={{
          backgroundSize: "200% 100%",
          animation: "gradientShift 8s ease infinite",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </motion.div>
            <p className="text-xs sm:text-sm font-semibold">
              <span className="hidden sm:inline">🎉 New! </span>
              CampusTrace Mobile App Now Available for Android
              <span className="hidden md:inline"> - Download APK Today!</span>
            </p>
            <motion.a
              href="#mobile-app"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-white text-primary-600 rounded-full text-xs sm:text-sm font-bold hover:bg-neutral-100 transition-all duration-300 flex-shrink-0"
            >
              Get App
            </motion.a>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <header
        className={`fixed top-[42px] sm:top-[48px] left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <nav className="px-6 sm:px-8 md:px-16 py-6">
          <div className="flex justify-between items-center">
            {/* Logo and Brand Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                src={logo}
                alt="CampusTrace logo"
                className="h-10 w-10 sm:h-11 sm:w-11"
                whileHover={{ scale: 1.05 }}
              />
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-2xl sm:text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white"
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                CampusTrace
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-12">
              {[
                {
                  to: "#how-it-works",
                  label: "How It Works",
                  number: "01",
                  isAnchor: true,
                },
                {
                  to: "#features",
                  label: "Features",
                  number: "02",
                  isAnchor: true,
                },
                {
                  to: "#screenshots",
                  label: "Showcase",
                  number: "03",
                  isAnchor: true,
                },
                {
                  to: "/about",
                  label: "About Us",
                  number: "04",
                  isAnchor: false,
                },
                {
                  to: "/register-university",
                  label: "For Universities",
                  number: "05",
                  isAnchor: false,
                },
              ].map((link) =>
                link.isAnchor ? (
                  <a key={link.to} href={link.to}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="relative group"
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                        {link.number}
                      </span>
                      <span className="text-sm tracking-wider text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </motion.div>
                  </a>
                ) : (
                  <Link key={link.to} to={link.to}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="relative group"
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                        {link.number}
                      </span>
                      <span className="text-sm tracking-wider text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </motion.div>
                  </Link>
                )
              )}
              <Link
                to="/login"
                className="ml-4 px-5 py-2 bg-primary-600 text-white text-sm font-medium tracking-wider rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                Log In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative w-10 h-10 md:hidden"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={{
                  rotate: mobileMenuOpen ? 45 : 0,
                  y: mobileMenuOpen ? 0 : -4,
                }}
                className="absolute left-0 w-full h-[1px] bg-black dark:bg-white"
              />
              <motion.span
                animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
                className="absolute left-0 w-full h-[1px] bg-black dark:bg-white"
              />
              <motion.span
                animate={{
                  rotate: mobileMenuOpen ? -45 : 0,
                  y: mobileMenuOpen ? 0 : 4,
                }}
                className="absolute left-0 w-full h-[1px] bg-black dark:bg-white"
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.5,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="fixed inset-0 bg-white dark:bg-[#1a1a1a] z-40 md:hidden"
          >
            <div className="flex flex-col justify-center items-center h-full">
              {[
                {
                  to: "#how-it-works",
                  label: "How It Works",
                  number: "01",
                  isAnchor: true,
                },
                {
                  to: "#features",
                  label: "Features",
                  number: "02",
                  isAnchor: true,
                },
                {
                  to: "#screenshots",
                  label: "Showcase",
                  number: "03",
                  isAnchor: true,
                },
                {
                  to: "/about",
                  label: "About Us",
                  number: "04",
                  isAnchor: false,
                },
                {
                  to: "/register-university",
                  label: "For Universities",
                  number: "05",
                  isAnchor: false,
                },
              ].map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {link.isAnchor ? (
                    <a
                      href={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-4"
                    >
                      <span className="text-gray-400 dark:text-gray-500 text-xs mr-3">
                        {link.number}
                      </span>
                      <span
                        className="text-2xl font-semibold text-neutral-800 dark:text-white"
                        style={{
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {link.label}
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-4"
                    >
                      <span className="text-gray-400 dark:text-gray-500 text-xs mr-3">
                        {link.number}
                      </span>
                      <span
                        className="text-2xl font-semibold text-neutral-800 dark:text-white"
                        style={{
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block mt-8 px-8 py-3 bg-primary-600 text-white text-base font-medium rounded-md hover:bg-primary-700 transition-colors"
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Log In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-[100px] sm:pt-[110px] md:pt-[120px] relative z-10">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-120px)] md:min-h-[calc(80vh-120px)] flex items-center justify-center text-center relative overflow-hidden px-4 sm:px-6">
          {/* Animated Gradient Background - Blue Theme Only */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-primary-100 dark:from-[#1a1a1a] dark:via-primary-900/10 dark:to-primary-900/5" />

          {/* Floating particles - Blue Theme */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-400/20 dark:bg-primary-400/10 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [
                  Math.random() * window.innerHeight,
                  Math.random() * window.innerHeight,
                ],
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth,
                ],
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 10 + Math.random() * 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

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

          {/* Animated gradient blobs - Blue Theme Only */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-5 left-5 sm:top-10 sm:left-20 w-40 h-40 sm:w-72 sm:h-72 bg-gradient-to-br from-primary-400/15 to-blue-400/15 dark:from-primary-500/10 dark:to-blue-500/8 rounded-full blur-3xl animate-float"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className="absolute bottom-5 right-5 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400/15 to-primary-400/15 dark:from-blue-500/8 dark:to-primary-500/10 rounded-full blur-3xl animate-float-delayed"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-primary-300/8 to-blue-300/8 dark:from-primary-600/5 dark:to-blue-600/5 rounded-full blur-3xl"
            />
          </div>

          <motion.div
            className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16 relative z-10 w-full"
            style={{
              transform: `translateY(${heroParallax}px)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary-500/10 to-blue-500/10 dark:from-primary-400/20 dark:to-blue-400/20 border border-primary-200 dark:border-primary-500/30 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent">
                AI-Powered Lost & Found Platform
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 1, 0.5, 1],
                delay: 0.2,
              }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight px-2">
                <span className="inline-block">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="inline-block"
                  >
                    Reconnect
                  </motion.span>{" "}
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="inline-block"
                  >
                    What's
                  </motion.span>{" "}
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="inline-block"
                  >
                    Lost,
                  </motion.span>
                </span>{" "}
                <span className="relative inline-block mt-2 sm:mt-0">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="relative inline-block bg-gradient-to-r from-primary-600 via-blue-600 to-blue-700 dark:from-primary-400 dark:via-blue-400 dark:to-blue-500 bg-clip-text text-transparent"
                  >
                    Powered by AI
                  </motion.span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary-600 via-blue-600 to-blue-700 dark:from-primary-400 dark:via-blue-400 dark:to-blue-500 rounded-full"
                  />
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              className="mt-4 sm:mt-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed px-2"
            >
              CampusTrace uses{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                smart technology
              </span>{" "}
              to make finding lost items on campus simple and fast. Join your
              university's secure lost and found network today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row justify-center items-center gap-3 px-4"
            >
              <Link
                to="/login"
                className="group relative px-8 py-3.5 sm:px-7 sm:py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 flex items-center justify-center gap-2 text-base w-full sm:w-auto shadow-lg hover:shadow-2xl hover:shadow-primary-500/50 transform hover:scale-105"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
                  <div className="w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
              </Link>
              <Link
                to="/learn-more"
                className="group relative px-8 py-3.5 sm:px-7 sm:py-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg transition-all duration-300 border-2 border-neutral-300 dark:border-neutral-600 w-full sm:w-auto text-center text-base shadow-lg hover:shadow-xl hover:border-primary-500 dark:hover:border-primary-400 transform hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  Learn More
                  <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 px-4"
            >
              {[
                { icon: ShieldCheck, text: "University Verified" },
                { icon: Sparkles, text: "AI-Powered" },
                { icon: Lock, text: "Secure & Private" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700"
                >
                  <item.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <FeatureSlider features={quickFeatures} />

        {/* How It Works Section */}
        <section
          id="how-it-works"
          ref={howItWorksRef.ref}
          className="py-16 sm:py-20 bg-white dark:bg-[#2a2a2a] scroll-mt-28"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              animate={howItWorksRef.animation}
              initial="hidden"
              variants={{
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
                hidden: { opacity: 0, y: 30 },
              }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
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
                  icon: MessageSquare,
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
                    className="relative text-center group px-4"
                  >
                    <div className="relative inline-block mb-4 sm:mb-5 md:mb-8">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        }}
                        className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 bg-primary-100 dark:bg-primary-500/10 rounded-full mx-auto ring-4 ring-white dark:ring-[#2a2a2a] shadow-md"
                      >
                        <step.icon className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600 dark:text-primary-400" />
                      </motion.div>
                      {/* Animated Ring */}
                      <span className="absolute inset-0 rounded-full ring-2 ring-primary-500/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 px-2">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm sm:text-base px-2">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <div id="features" className="scroll-mt-28">
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
              startIndex={studentFeatures.length}
            />
          </section>
        </div>

        {/* Enhanced Screenshot Showcase Section */}
        <ScreenshotSection screenshots={screenshots} />

        {/* Stats Section - New Platform Highlight */}
        <StatsSection />

        {/* Mobile App Download Section */}
        <MobileAppSection />

        {/* Trust & Security Section */}
        <TrustSection />

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-3">
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
          ref={ctaRef.ref}
          className="py-20 sm:py-28 bg-primary-600 text-white text-center relative overflow-hidden"
        >
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse-delayed translate-x-1/2 translate-y-1/2" />
          </div>

          <motion.div
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Simplify Lost & Found?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-white/90 max-w-2xl mx-auto">
              Join your campus community on CampusTrace. Sign up with your
              university email or ID today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="group px-8 sm:px-8 py-3 sm:py-3 bg-white text-primary-600 text-base sm:text-base font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all duration-300 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span className="relative z-10">Sign Up / Log In</span>
                <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              <Link
                to="/register-university"
                className="px-8 sm:px-8 py-3 sm:py-3 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white text-base sm:text-base font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 w-full sm:w-auto text-center"
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
                className="flex items-center gap-3 text-xl font-bold text-primary-600 dark:text-primary-400 mb-5 group"
              >
                <motion.img
                  src={logo}
                  alt="CampusTrace logo"
                  className="h-8 w-8"
                  whileHover={{ rotate: 15 }}
                />
                <span
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  CampusTrace
                </span>
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm leading-relaxed">
                Simplifying lost and found on campus with AI-powered matching
                and a secure, verified community.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-base">
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
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-5 text-base">
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
                </li>
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
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center sm:flex sm:justify-between sm:items-center">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mb-4 sm:mb-0">
              © {new Date().getFullYear()} CampusTrace. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
              Project By: Bugauisan, Respicio, & Cacho (ISU - Echague)
            </p>
          </div>
        </div>
      </footer>

      <style>{`
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
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(147, 51, 234, 0.4);
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
        }
        .animate-pulse-delayed {
          animation: pulse-delayed 4s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }
        .animate-slide {
          animation: slide 40s linear infinite;
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

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
