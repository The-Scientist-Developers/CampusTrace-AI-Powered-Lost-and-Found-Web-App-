import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, ChevronDown, ClipboardPlus, Maximize2, ScanLine, ShieldCheck, Smartphone,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Download from "yet-another-react-lightbox/plugins/download";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import adminAnalytics from "../../assets/adminanalytics.png";
import browseAll from "../../assets/BrowseAll.png";
import claimItem from "../../assets/claimitem.png";
import dashboard from "../../assets/dashboarduser.png";
import messages from "../../assets/Messenger.png";
import postItem from "../../assets/PostItem.png";
import PublicPageLayout, { UniversityCallout } from "./PublicPageLayout.jsx";
import RecoveryScene from "./RecoveryScene.jsx";
import { accent, button, compactTitle, hero, heroActions, heroDescription, heroTitle, kicker, muted, rule, section, sectionTitle, textLink, wash } from "./publicPageStyles.js";

const steps = [
  { title: "Report it", icon: ClipboardPlus, description: "Post what you lost or found. Add a photo and where you last saw it." },
  { title: "Find a match", icon: ScanLine, description: "CampusTrace compares photos and descriptions to surface possible matches from your university." },
  { title: "Get it back", icon: ShieldCheck, description: "Arrange pickup in private chat and use a four-digit code to confirm the handover." },
];

const screens = [
  { src: dashboard, title: "Dashboard", description: "See your reports, possible matches and recent activity in one place.", width: 1900, height: 862 },
  { src: browseAll, title: "Browse items", description: "Search and filter lost and found reports from your campus.", width: 1890, height: 857 },
  { src: postItem, title: "Post an item", description: "Add a photo and use the AI helper to draft a clearer description and suggest tags.", width: 1895, height: 860 },
  { src: claimItem, title: "Claim an item", description: "Review the item details and submit evidence of ownership.", width: 1892, height: 855 },
  { src: messages, title: "Messages", description: "Coordinate a handover in private chat.", width: 1897, height: 852 },
  { src: adminAnalytics, title: "Admin analytics", description: "See campus activity and recovery trends from the university dashboard.", width: 1886, height: 863 },
].map((screen) => ({ ...screen, alt: `CampusTrace ${screen.title} screen` }));

const faqs = [
  ["How does AI matching work?", "CampusTrace compares the title, description, category and photo in a lost report with approved found reports from the same university. Possible matches appear on your dashboard."],
  ["What’s the difference between a lost and a found report?", "When someone says they found an item from your lost report, you can chat right away. To claim an item someone posted as found, provide proof of ownership and wait for them to approve the claim."],
  ["How do I contact the other person?", "CampusTrace opens a private chat when a claim is approved or someone reports finding your lost item. Use that chat to arrange the return."],
  ["Can I join without a university email?", "Yes. Choose the university ID option during sign-up and upload a photo of your ID. An administrator from your university will review your request."],
  ["Who can see my information?", "Your login email stays private. Anyone who can see a report can also see contact details you add to its description."],
  ["How do I confirm a handover?", "The person receiving the item generates a four-digit code. When you meet, the person returning the item enters the code to confirm the handover."],
  ["How do I earn points on the leaderboard?", "Confirm a return using the handover code to earn points and work toward Helper badges. The leaderboard ranks people within your university."],
];

function AppPreview() {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const screen = screens[selected];

  return (
    <section id="screenshots" className={section} aria-labelledby="ct-preview-title">
      <div>
        <p className={kicker}><span className={accent}>02</span> Inside the app</p>
        <h2 id="ct-preview-title" className={sectionTitle}>See the tools in action.</h2>
        <div className="grid grid-cols-2 min-[801px]:grid-cols-1" role="group" aria-label="Choose an app screen">
          {screens.map((item, index) => (
            <button className={`flex min-h-11 items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm first:border-t [&>svg]:shrink-0 max-[800px]:[&:nth-child(2)]:border-t hover:bg-[var(--ct-wash)] hover:text-[color:var(--ct-accent)] aria-pressed:bg-[var(--ct-wash)] aria-pressed:font-extrabold aria-pressed:text-[color:var(--ct-accent)] ${rule}`} key={item.title} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>
              {item.title}<ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <figure className={`min-w-0 border ${rule}`}>
        <div className={`flex items-center justify-between gap-2 border-b px-3.5 font-mono text-xs font-semibold ${muted} ${rule}`}>
          <span><span className="inline-block size-2 rounded-full bg-[var(--ct-accent)]" /> CampusTrace / Web app</span>
          <button type="button" className={`grid size-11 place-items-center hover:bg-[var(--ct-wash)] ${accent}`} onClick={() => setLightboxOpen(true)} aria-label="Enlarge screenshot">
            <Maximize2 size={17} aria-hidden="true" />
          </button>
        </div>
        <img className={`block aspect-[2.2] w-full object-contain ${wash}`} src={screen.src} alt={screen.alt} width={screen.width} height={screen.height} loading="lazy" />
        <figcaption className={`flex min-h-[3.3rem] items-center border-t px-3.5 py-2.5 text-sm ${muted} ${rule}`} aria-live="polite">{screen.description}</figcaption>
      </figure>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={selected}
        slides={screens}
        plugins={[Zoom, Fullscreen, Slideshow, Thumbnails, Download]}
        carousel={{ finite: true, imageFit: "contain" }}
      />
    </section>
  );
}

export default function LandingPage() {
  return (
    <PublicPageLayout isHome>
      <Helmet>
        <title>CampusTrace | AI-Powered Lost and Found for Universities</title>
        <meta
          name="description"
          content="CampusTrace is a smart, AI-powered lost and found web app designed for university communities. Find lost items with AI matching, secure messaging, and a verified campus network."
        />
        <meta
          name="keywords"
          content="CampusTrace, campus trace, lost and found, university lost and found, AI lost and found, campus lost items, college lost and found, Isabela State University, lost item finder, found item reporting"
        />
        <link rel="canonical" href="https://campustrace.sanx.dev/" />
        {/* Open Graph Tags */}
        <meta property="og:title" content="CampusTrace | AI-Powered Lost and Found for Universities" />
        <meta property="og:description" content="Find what's lost, return what's found. CampusTrace uses AI to make recovering lost items on campus simple and fast." />
        <meta property="og:image" content="https://campustrace.sanx.dev/og-image.png" />
        <meta property="og:url" content="https://campustrace.sanx.dev/" />
        {/* Twitter Tags */}
        <meta name="twitter:title" content="CampusTrace | AI-Powered Lost and Found for Universities" />
        <meta name="twitter:description" content="Find what's lost, return what's found. CampusTrace uses AI to make recovering lost items on campus simple and fast." />
        <meta name="twitter:image" content="https://campustrace.sanx.dev/og-image.png" />
      </Helmet>
      <section className={hero} aria-labelledby="ct-hero-title">
        <div>
          <p className={kicker}><span className={`text-base leading-none ${accent}`} aria-hidden="true">+</span> University lost &amp; found</p>
          <h1 id="ct-hero-title" className={heroTitle}>Lost on campus? <em className={`block not-italic ${accent}`}>Start here.</em></h1>
          <p className={`max-w-[32ch] ${heroDescription}`}>Lost your ID or found someone’s keys? Report it to your campus community and use AI matching to help get it back where it belongs.</p>
          <div className={heroActions}>
            <Link className={button} to="/login">Sign in <ArrowRight size={18} aria-hidden="true" /></Link>
            <a className={textLink} href="#how-it-works">How it works <ArrowDown size={17} aria-hidden="true" /></a>
          </div>
        </div>
        <RecoveryScene />
      </section>

      <section className={`grid gap-5 border-t pb-9 pt-6 min-[801px]:grid-cols-[1fr_3fr] ${rule}`} id="how-it-works" aria-labelledby="ct-workflow-title">
        <div id="student-features">
          <p className={kicker}><span className={accent}>01</span> The workflow</p>
          <h2 id="ct-workflow-title" className={compactTitle}>How it works</h2>
        </div>
        <ol id="features" className="grid min-[561px]:grid-cols-3">
          {steps.map(({ title, icon: Icon, description }, index) => (
            <li key={title} className={`border-t py-3.5 min-[561px]:border-l min-[561px]:border-t-0 min-[561px]:px-[clamp(.8rem,2vw,1.8rem)] min-[561px]:py-0 min-[561px]:max-[800px]:first:border-l-0 min-[561px]:max-[800px]:first:pl-0 ${rule}`}>
              <div className={`flex items-center justify-between font-mono text-[.8rem] font-bold ${accent}`}><span>0{index + 1}</span><Icon size={22} aria-hidden="true" /></div>
              <h3 className="mb-1 mt-2.5 text-[1.05rem] font-extrabold">{title}</h3>
              <p className={`text-sm leading-relaxed ${muted}`}>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <AppPreview />

      <section id="mobile-app" className={`grid items-center gap-x-6 gap-y-3.5 border-t px-[clamp(1rem,3vw,2rem)] py-6 min-[561px]:grid-cols-[auto_1fr_auto] ${rule} ${wash}`} aria-labelledby="ct-mobile-title">
        <div className={`hidden min-[561px]:block ${accent}`}><Smartphone size={36} aria-hidden="true" /></div>
        <div>
          <h2 id="ct-mobile-title" className={compactTitle}>CampusTrace for Android</h2>
          <p className={`mt-2 leading-relaxed ${muted}`}>Post items and get match notifications on your phone. Android may ask you to allow installation from your browser.</p>
        </div>
        <a href="https://expo.dev/artifacts/eas/bdjyMEobJ6Hway9QeqTqxA.apk" download className={textLink}>
          Download APK <ArrowDownToLine size={18} aria-hidden="true" />
        </a>
      </section>

      <section className={section} id="faq" aria-labelledby="ct-faq-title">
        <div>
          <p className={kicker}><span className={accent}>03</span> Before you start</p>
          <h2 id="ct-faq-title" className={sectionTitle}>Common questions.</h2>
          <Link className={textLink} to="/learn-more">Read the full guide <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question} className={`group border-t last:border-b ${rule}`}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 font-bold hover:text-[color:var(--ct-accent)] [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="shrink-0 group-open:rotate-180" size={18} aria-hidden="true" /></summary>
              <p className={`max-w-[62ch] pb-4 pr-6 leading-relaxed ${muted}`}>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <UniversityCallout
        id="admin-features"
        description="Give your campus one place to report and return lost items, with tools for staff to verify accounts, moderate reports and track recoveries."
      />
    </PublicPageLayout>
  );
}
