import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowUpRight, Github, Landmark, Linkedin, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

import frank from "../../assets/john-franklin-portrait.png";
import william from "../../assets/william.jpg";
import jerome from "../../assets/jerome.jpg";
import PublicPageLayout, { DiagramLabel, PublicFigure, UniversityCallout } from "./PublicPageLayout.jsx";
import { accent, button, hero, heroActions, heroDescription, heroTitle, kicker, muted, rule, section, sectionTitle, textLink } from "./publicPageStyles.js";

const team = [
  {
    name: "John Franklin C. Bugauisan",
    role: "Project Lead / Full Stack AI-augmented Developer / UI Designer",
    portrait: frank,
    width: 1122,
    height: 1402,
    github: "https://github.com/ImFrankB",
    linkedin: "https://www.linkedin.com/in/john-franklin-bugauisan-86aa16309/",
  },
  {
    name: "William Ray M. Respicio",
    role: "Frontend AI-augmented Developer / UI Designer",
    portrait: william,
    width: 100,
    height: 99,
    github: "https://github.com/williamUser-ops",
    linkedin: "https://www.linkedin.com/in/respicio-william-ray-m-0b5969384/",
  },
  {
    name: "Jerome Ian N. Cacho",
    role: "Frontend AI-augmented Developer / UI Designer",
    portrait: jerome,
    width: 3072,
    height: 4096,
    github: "https://github.com/iiiiaannnnnnn",
    linkedin: "https://www.linkedin.com/in/jerome-ian-cacho-19a46233a/",
  },
];

const purpose = [
  {
    title: "One place to report what’s missing",
    description: "Paper forms and bulletin boards leave reports scattered. CampusTrace gives students, faculty, staff and campus administrators one place to post and browse lost and found items.",
  },
  {
    title: "Better leads for a search",
    description: "CampusTrace compares photos and descriptions from lost and found reports to surface possible matches within the same university.",
  },
  {
    title: "A safer way to arrange a return",
    description: "Campus verification keeps reports within the university community. Private in-app messaging lets people coordinate pickup, and a four-digit code confirms the handover.",
  },
];

const portraitGrid = [
  "linear-gradient(var(--ct-rule) 1px, transparent 1px) center / 1.2rem 1.2rem",
  "linear-gradient(90deg, var(--ct-rule) 1px, transparent 1px) center / 1.2rem 1.2rem",
  "var(--ct-wash)",
].join(", ");

const profileHeading = "text-[clamp(1.05rem,1.7vw,1.35rem)] font-extrabold leading-tight tracking-[-.035em]";
const profileLink = `grid size-11 place-items-center border hover:bg-[var(--ct-wash)] ${rule} ${accent}`;
const indexLabel = `font-mono text-[.8rem] font-bold ${accent}`;

const plaquePositions = {
  resting: { rotateX: 15, rotateY: -19, rotate: -10, y: "0cqw" },
  tilted: { rotateX: 8, rotateY: -10, rotate: -5, y: "-.75cqw" },
};

function CampusIllustration() {
  const reducedMotion = useReducedMotion();

  return (
    <PublicFigure aspect={1.5} caption="Isabela State University · Echague, Philippines">
      <DiagramLabel>PROJECT ORIGIN / 01</DiagramLabel>
      <motion.div
        className="absolute inset-0 grid place-items-center [perspective:760px]"
        initial="resting"
        animate="resting"
        whileHover={reducedMotion ? undefined : "tilted"}
      >
        <motion.div
          className="relative aspect-[1.43] w-[56%] [transform-style:preserve-3d]"
          variants={plaquePositions}
          transition={{ duration: .5, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-primary-900 shadow-[0_2.4cqw_4cqw_#172b5c45] [transform:translateZ(-1.4cqw)]" />
          <div
            className="absolute inset-0 grid content-between border border-primary-200 p-[7%] shadow-[inset_0_0_0_3px_var(--color-primary-50)]"
            style={{ background: "linear-gradient(90deg, var(--scene-line) 1px, transparent 1px) center / 8% 100%, linear-gradient(160deg, white, var(--color-primary-100))" }}
          >
            <span className="font-mono text-[1.55cqw] font-bold tracking-widest">CAMPUSTRACE / ISU</span>
            <Landmark className="absolute right-[7%] top-[21%] h-auto w-[32%] text-primary-600" strokeWidth={1.25} />
            <strong className="text-[5.1cqw] leading-[.99] tracking-[-.065em]">Isabela State<br />University</strong>
          </div>
        </motion.div>
      </motion.div>
      <div className="pointer-events-none absolute bottom-[7%] right-[5%] flex items-center gap-2 border border-primary-200 bg-white px-2.5 py-2 font-mono text-[clamp(.6rem,1.7cqw,.8rem)] font-bold leading-tight">
        <MapPin size={16} className="text-primary-600" /> Echague, Isabela
      </div>
    </PublicFigure>
  );
}
export default function AboutUsPage() {
  return (
    <PublicPageLayout>
      <Helmet>
        <title>About CampusTrace - AI-Powered Lost and Found for Universities</title>
        <meta
          name="description"
          content="CampusTrace is an AI-powered lost and found platform built for university communities. Learn about our mission, meet our team from Isabela State University, and discover how we're solving campus lost and found challenges."
        />
        <meta
          name="keywords"
          content="CampusTrace, about CampusTrace, team, student developers, Isabela State University, campus innovation, AI lost and found, university lost and found platform"
        />
        <link rel="canonical" href="https://campustrace.sanx.dev/about/" />

        {/* Open Graph */}
        <meta property="og:title" content="About CampusTrace - AI-Powered Lost and Found for Universities" />
        <meta property="og:description" content="Meet the team behind CampusTrace and learn about our mission to solve campus lost and found challenges with AI technology." />
        <meta property="og:url" content="https://campustrace.sanx.dev/about/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://campustrace.sanx.dev/og-image.png" />

        {/* Organization Schema for About Page */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
              "@type": "Organization",
              "name": "CampusTrace",
              "url": "https://campustrace.sanx.dev",
              "logo": "https://campustrace.sanx.dev/logo.png",
              "description": "CampusTrace is an AI-powered lost and found web application designed for university communities. We help students and staff find lost items quickly using intelligent AI matching technology, secure messaging, and verified campus networks.",
              "foundingDate": "2024",
              "founders": [
                {
                  "@type": "Person",
                  "name": "John Franklin C. Bugauisan",
                  "jobTitle": "Project Lead / Full Stack Developer",
                  "sameAs": ["https://github.com/ImFrankB", "https://www.linkedin.com/in/john-franklin-bugauisan-86aa16309/"]
                },
                {
                  "@type": "Person",
                  "name": "William Ray M. Respicio",
                  "jobTitle": "Frontend Developer / UI Designer",
                  "sameAs": ["https://github.com/williamUser-ops", "https://www.linkedin.com/in/respicio-william-ray-m-0b5969384/"]
                },
                {
                  "@type": "Person",
                  "name": "Jerome Ian N. Cacho",
                  "jobTitle": "Frontend Developer / UI Designer",
                  "sameAs": ["https://github.com/iiiiaannnnnnn", "https://www.linkedin.com/in/jerome-ian-cacho-19a46233a/"]
                }
              ],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Echague",
                "addressRegion": "Isabela",
                "addressCountry": "PH"
              },
              "sameAs": ["https://github.com/ImFrankB"]
            }
          })}
        </script>
      </Helmet>
      <section className={hero} aria-labelledby="ct-about-title">
        <div>
          <p className={kicker}><span className={`text-base leading-none ${accent}`} aria-hidden="true">+</span> About CampusTrace</p>
          <h1 id="ct-about-title" className={heroTitle}>Built on campus. <em className={`block not-italic ${accent}`}>For campus.</em></h1>
          <p className={`max-w-[36ch] ${heroDescription}`}>CampusTrace is an AI-powered lost and found platform built by student developers from Isabela State University.</p>
          <div className={heroActions}>
            <a className={button} href="#ct-team">Meet the team <ArrowDown size={18} aria-hidden="true" /></a>
            <Link className={textLink} to="/"><ArrowLeft size={17} aria-hidden="true" /> Back to home</Link>
          </div>
        </div>
        <CampusIllustration />
      </section>

      <section className={section} aria-labelledby="ct-about-purpose-title">
        <div>
          <p className={kicker}><span className={accent}>01</span> Why we built it</p>
          <h2 id="ct-about-purpose-title" className={sectionTitle}>Getting things back should be easier.</h2>
        </div>
        <ol>
          {purpose.map(({ title, description }, index) => (
            <li key={title} className={`grid grid-cols-[2.2rem_minmax(0,1fr)] gap-4 border-t py-5 last:border-b ${rule}`}>
              <span className={indexLabel} aria-hidden="true">0{index + 1}</span>
              <div>
                <h3 className={profileHeading}>{title}</h3>
                <p className={`mt-2 max-w-[66ch] leading-relaxed ${muted}`}>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${section} !grid-cols-1 !gap-6`} id="ct-team" aria-labelledby="ct-team-title">
        <div>
          <p className={kicker}><span className={accent}>02</span> The people behind it</p>
          <h2 id="ct-team-title" className={`${sectionTitle} !mb-[.15em]`}>Meet the team.</h2>
          <p className={`mt-2 leading-relaxed ${muted}`}>Student developers from Isabela State University in the Philippines.</p>
        </div>
        <ul className={`grid border min-[601px]:grid-cols-3 ${rule}`}>
          {team.map(({ name, role, portrait, width, height, github, linkedin }, index) => (
            <li key={name} className={`p-[clamp(.85rem,2vw,1.6rem)] [&+li]:border-t min-[601px]:[&+li]:border-l min-[601px]:[&+li]:border-t-0 ${rule}`}>
              <div className={`relative mb-5 grid min-h-32 place-items-center border p-[clamp(.75rem,2.2vw,1.65rem)] ${rule}`} style={{ background: portraitGrid }}>
                <img className={`aspect-square h-auto w-[min(72%,10rem)] border object-cover object-[center_35%] ${rule}`} src={portrait} width={width} height={height} alt="" loading="lazy" />
                <span className={`absolute left-2 top-2 bg-light-surface px-1.5 py-0.5 dark:bg-dark-bg ${indexLabel}`} aria-hidden="true">0{index + 1}</span>
              </div>
              <h3 className={profileHeading}>{name}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{role}</p>
              <div className="mt-2.5 flex gap-1.5">
                <a className={profileLink} href={github} target="_blank" rel="noopener noreferrer" aria-label={`${name} on GitHub (opens in a new tab)`}>
                  <Github size={18} aria-hidden="true" />
                </a>
                <a className={profileLink} href={linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${name} on LinkedIn (opens in a new tab)`}>
                  <Linkedin size={18} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <UniversityCallout description="Give your campus one place to report and return lost items." />
    </PublicPageLayout>
  );
}
