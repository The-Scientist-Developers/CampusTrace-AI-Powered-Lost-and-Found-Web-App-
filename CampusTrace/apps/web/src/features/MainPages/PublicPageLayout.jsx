import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../Images/Logo.svg";
import { accent, button, muted, rule, sectionTitle, textLink, wash } from "./publicPageStyles.js";

const navLink = `inline-flex min-h-11 items-center ${muted} hover:text-[color:var(--ct-accent)] aria-[current=page]:text-[color:var(--ct-accent)] aria-[current=page]:underline underline-offset-4`;
const nav = "flex flex-wrap gap-x-[clamp(1rem,3vw,2.5rem)] gap-y-1.5 text-sm";

const diagramBackground = [
  "linear-gradient(var(--scene-line) 1px, transparent 1px) center / 4.75% 6.27%",
  "linear-gradient(90deg, var(--scene-line) 1px, transparent 1px) center / 4.75% 6.27%",
  "radial-gradient(ellipse at 50% 38%, var(--color-primary-50), var(--color-primary-100) 78%)",
].join(", ");

function Brand() {
  return (
    <Link to="/" className="inline-flex w-fit items-center gap-2.5 text-xl font-extrabold tracking-[-.055em]" translate="no">
      <img src={logo} width="32" height="32" alt="" className="rounded-[7px]" />
      CampusTrace
    </Link>
  );
}

export function PublicFigure({ children, caption, controls, aspect }) {
  return (
    <figure className={`min-w-0 border ${rule}`}>
      <div
        className="relative isolate overflow-clip text-primary-900 [container-type:inline-size] [--scene-line:color-mix(in_srgb,var(--color-primary-500)_18%,transparent)]"
        style={{ aspectRatio: aspect, background: diagramBackground }}
        aria-hidden="true"
      >
        {children}
      </div>
      <figcaption className={`flex min-h-11 flex-wrap items-center justify-between gap-x-2.5 border-t px-2.5 font-mono text-[.625rem] font-semibold uppercase tracking-wider min-[561px]:px-3.5 min-[561px]:text-[.7rem] ${rule} ${muted}`}>
        <span className="py-1">FIG. 01 <span className={`mx-1 ${accent}`}>/</span> {caption}</span>
        {controls}
      </figcaption>
    </figure>
  );
}

export function DiagramLabel({ children }) {
  return (
    <span className="absolute left-[4%] top-[5%] font-mono text-[clamp(.55rem,1.65cqw,.78rem)] font-bold leading-none tracking-widest">
      {children}
    </span>
  );
}

export function UniversityCallout({ id, description }) {
  return (
    <section id={id} className={`flex flex-wrap items-end justify-between gap-6 border-t-2 border-[color:var(--ct-accent)] p-[clamp(1.5rem,5vw,4rem)] ${wash}`}>
      <div>
        <h2 className={`${sectionTitle} !mb-0 max-w-[17ch]`}>Bring CampusTrace to your university.</h2>
        <p className={`mt-2 max-w-[58ch] leading-relaxed ${muted}`}>{description}</p>
      </div>
      <Link className={button} to="/register-university">Register a university <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

export default function PublicPageLayout({ children, isHome = false }) {
  const { hash } = useLocation();
  const homePath = isHome ? "" : "/";

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div
      className="min-h-screen bg-[#fafaf9] font-sans text-[#171b23] [--ct-rule:#cdd3db] [--ct-muted:#4d5666] [--ct-accent:var(--color-primary-700)] [--ct-wash:var(--color-primary-100)]
        dark:bg-dark-bg dark:text-[#f2f4f8] dark:[color-scheme:dark] dark:[--ct-rule:#404750] dark:[--ct-muted:#b6becb] dark:[--ct-accent:var(--color-primary-300)] dark:[--ct-wash:color-mix(in_srgb,var(--color-primary-900)_40%,#1a1a1a)]
        [.theme-high-contrast_&]:[--ct-rule:white] [.theme-high-contrast_&]:[--ct-muted:white] [.theme-high-contrast_&]:[--ct-accent:cyan]
        [&_:is(a,button,summary)]:touch-manipulation [&_:is(a,button,summary):focus-visible]:outline [&_:is(a,button,summary):focus-visible]:outline-2 [&_:is(a,button,summary):focus-visible]:outline-offset-4 [&_:is(a,button,summary):focus-visible]:outline-[color:var(--ct-accent)] [&_[id]]:scroll-mt-4"
    >
      <a href="#ct-main" className="fixed left-3 top-3 z-10 -translate-y-[200%] bg-light-surface px-4 py-2.5 focus:translate-y-0 dark:bg-dark-bg">Skip to content</a>
      <div className="mx-auto w-[min(calc(100%_-_clamp(2rem,8vw,8rem)),86rem)]">
        <header className={`grid min-h-[4.65rem] grid-cols-[1fr_auto] items-center gap-x-2.5 border-b pt-2 min-[561px]:grid-cols-[auto_1fr_auto] min-[561px]:gap-x-[clamp(1rem,4vw,4rem)] min-[561px]:pt-0 ${rule}`}>
          <Brand />
          <nav
            aria-label="Main navigation"
            className={`${nav} col-span-2 row-start-2 justify-between gap-x-2 border-t text-[.77rem] max-[360px]:grid max-[360px]:grid-cols-2 min-[561px]:col-span-1 min-[561px]:row-auto min-[561px]:justify-end min-[561px]:gap-x-[clamp(1rem,3vw,2.5rem)] min-[561px]:border-none min-[561px]:text-sm ${rule}`}
          >
            <a className={navLink} href={homePath + "#how-it-works"}>How it works</a>
            <a className={navLink} href={homePath + "#screenshots"}>App preview</a>
            <NavLink className={navLink} to="/about">About us</NavLink>
            <Link className={navLink} to="/register-university">For universities</Link>
          </nav>
          <Link className={`${textLink} whitespace-nowrap text-sm`} to="/login">Sign in <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </header>

        <main id="ct-main" tabIndex={-1}>{children}</main>

        <footer className={`mt-[clamp(2.5rem,5vw,5rem)] flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t py-6 ${rule}`}>
          <Brand />
          <nav className={nav} aria-label="Footer navigation">
            <Link className={navLink} to="/about">About us</Link>
            <Link className={navLink} to="/privacy">Privacy</Link>
            <Link className={navLink} to="/terms">Terms</Link>
            <a className={navLink} href="mailto:contactCampustrace@gmail.com">Contact</a>
          </nav>
          <p className={`text-xs ${muted}`}>© {new Date().getFullYear()} CampusTrace<br />Bugauisan, Respicio &amp; Cacho · ISU Echague</p>
        </footer>
      </div>
    </div>
  );
}
