import { useEffect, useRef, useState } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import { Check, Fingerprint, Landmark, Pause, Play } from "lucide-react";
import portrait from "../../assets/landing-id-portrait.jpg";
import { DiagramLabel, PublicFigure } from "./PublicPageLayout.jsx";
import { accent } from "./publicPageStyles.js";

const restingCard = "rotateX(12deg) rotateY(-20deg) rotateZ(-12deg)";
const tiltedCard = "rotateX(2deg) rotateY(15deg) rotateZ(-7deg)";
const repeat = { repeat: Infinity, ease: "easeInOut" };

const platformBackground = [
  "linear-gradient(var(--scene-line) 1px, transparent 1px) center / 8% 13%",
  "linear-gradient(90deg, var(--scene-line) 1px, transparent 1px) center / 8% 13%",
  "linear-gradient(155deg, white, var(--color-primary-100))",
].join(", ");

const targetBackground = "radial-gradient(circle, var(--color-primary-600) 0 1.2%, transparent 1.5% 22%, var(--color-primary-600) 22.4% 22.8%, transparent 23.2% 34%, var(--color-primary-600) 34.4% 34.8%, transparent 35.2% 46%, var(--color-primary-600) 46.4% 46.8%, transparent 47.2%)";

const cornerPositions = ["left-0 top-0", "right-0 top-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"];

function ScannerPlatform() {
  return (
    <>
      <div className="absolute left-[16%] top-[49%] h-[42%] w-[64%] [transform:rotateX(56deg)_rotateZ(-16deg)] [transform-style:preserve-3d]">
        <div
          className="absolute inset-0 rounded-[3%] bg-[#a9b7cc] [transform:translateZ(-2.8cqw)]"
          style={{ boxShadow: "0 -4px #8496b2, 0 -9px #a9b7cc, 0 -13px #c4cede, -1.8cqw 2.4cqw 3cqw #172b5c50" }}
        />
        <div className="absolute inset-0 rounded-[3%] border-2 border-white" style={{ background: platformBackground }}>
          <span className="absolute left-1/2 top-1/2 aspect-square w-[45%] -translate-x-1/2 -translate-y-1/2 opacity-80" style={{ background: targetBackground }} />
          <span className="absolute bottom-[7%] right-[6%] font-mono text-[clamp(.6rem,2cqw,.9rem)] font-bold leading-none">CT / 01</span>
        </div>
      </div>
      <div className="absolute left-[48%] top-[47%] h-[24%] border-l border-dashed border-primary-600" />
      <div className="absolute inset-[18%_16%_28%_21%]">
        {cornerPositions.map(position => (
          <i key={position} className={`absolute aspect-square w-[6%] border-l-2 border-t-2 border-primary-600 ${position}`} />
        ))}
      </div>
    </>
  );
}

function StudentId() {
  return (
    <div data-motion="lift" className="absolute left-1/4 top-[24%] z-[1] aspect-[1.59] w-[52%] [perspective:580px]">
      <div data-motion="turn" className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: restingCard }}>
        <div
          className="absolute inset-0 rounded-[5%/8%] bg-[#8496b2] [transform:translateZ(-1.5cqw)]"
          style={{ boxShadow: "2px 1px #98a8bf, 4px 1px #bac6d9, 6px 0 #d6e0ed" }}
        />
        <div className="absolute inset-0 overflow-hidden rounded-[5%/8%] border border-white bg-gradient-to-br from-white to-primary-100 shadow-[0_2.2cqw_4cqw_#172b5c45]">
          <div className="flex h-[30%] items-center justify-between gap-[.5em] bg-gradient-to-br from-primary-700 to-primary-900 px-[7%] text-white">
            <span className="flex items-center gap-[.4em] text-[2.65cqw] font-bold leading-[1.1] tracking-tight">
              <Landmark className="h-auto w-[3.6cqw] shrink-0" /> Isabela State University
            </span>
            <span className="shrink-0 font-mono text-[1.55cqw] font-bold leading-none">STUDENT ID</span>
          </div>
          <div className="grid h-[70%] grid-cols-[28%_1fr] items-center gap-[8%] px-[7%] py-[6%]">
            <div className="relative h-full border border-primary-200">
              <img src={portrait} width="736" height="817" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="z-[1] grid content-center gap-[.7cqw]">
              <strong className="text-[3.7cqw] leading-[1.1] tracking-[-.06em]">Mc Lovin</strong>
              <span className="font-mono text-[1.65cqw] font-bold leading-[1.1]">DEMO • CT-0248</span>
              <span
                className="mt-[1cqw] h-[3cqw] w-[62%]"
                style={{ background: "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 3px, currentColor 3px 5px, transparent 5px 6px, currentColor 6px 7px, transparent 7px 10px)" }}
              />
            </div>
            <Fingerprint className="absolute -bottom-[3%] right-[1%] h-auto w-[24%] opacity-[.13]" strokeWidth={1} />
          </div>
          <div
            data-motion="scan"
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              transform: "translateY(-110%)",
              background: "linear-gradient(transparent 45%, #ffffff75 49%, #ffffffb0 50%, transparent 55%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function RecoveryScene() {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const [scene, animate] = useAnimate();
  const animations = useRef([]);

  useEffect(() => {
    if (reducedMotion) return;

    const controls = [
      animate("[data-motion=lift]", { transform: ["translateY(0)", "translateY(-3cqw)", "translateY(0)"] }, { ...repeat, duration: 6 }),
      animate("[data-motion=turn]", { transform: [restingCard, tiltedCard, restingCard] }, { ...repeat, duration: 9 }),
      animate("[data-motion=scan]", { transform: ["translateY(-110%)", "translateY(-110%)", "translateY(110%)", "translateY(110%)"] }, { ...repeat, times: [0, .25, .72, 1], duration: 6 }),
    ];
    animations.current = controls;
    return () => {
      controls.forEach(animation => animation.cancel());
      animations.current = [];
    };
  }, [animate, reducedMotion]);

  useEffect(() => {
    animations.current.forEach(animation => {
      if (paused) animation.pause();
      else animation.play();
    });
  }, [paused, reducedMotion]);

  return (
    <PublicFigure
      aspect={1.4}
      caption="Campus recovery"
      controls={!reducedMotion && (
        <button type="button" className={`inline-flex min-h-11 items-center gap-2 hover:underline ${accent}`} onClick={() => setPaused(value => !value)}>
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    >
      <DiagramLabel>RECOVERY STUDY / 01</DiagramLabel>
      <span className="absolute left-[7%] top-1/4 border-b border-current pb-[.6em] font-mono text-[clamp(.55rem,1.65cqw,.78rem)] font-bold leading-none tracking-widest after:absolute after:-bottom-px after:left-full after:h-px after:w-[2.4em] after:origin-left after:rotate-[38deg] after:bg-current">
        STUDENT ID
      </span>
      <div ref={scene} className="pointer-events-none absolute inset-0 [perspective:780px]">
        <ScannerPlatform />
        <StudentId />
      </div>
      <div className="absolute bottom-[7%] right-[4%] z-[1] grid gap-[.4em] border border-primary-200 border-t-2 border-t-primary-600 bg-white px-[.9em] py-[.75em] text-[clamp(.55rem,2.15cqw,.94rem)] shadow-[0_.6em_1.8em_#172b5c24]">
        <span className="flex items-center gap-[.4em] font-mono text-[.73em] font-bold tracking-wider text-primary-800">
          <Check className="h-auto w-[1.1em]" /> POSSIBLE MATCH
        </span>
        <strong>Student ID</strong>
        <small className="text-[.8em] text-[#4d5666]">Example report</small>
      </div>
    </PublicFigure>
  );
}
