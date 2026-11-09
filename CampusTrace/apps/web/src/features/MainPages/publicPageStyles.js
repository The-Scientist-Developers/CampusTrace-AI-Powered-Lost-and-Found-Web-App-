export const accent = "text-[color:var(--ct-accent)]";
export const muted = "text-[color:var(--ct-muted)]";
export const rule = "border-[color:var(--ct-rule)]";
export const wash = "bg-[var(--ct-wash)]";

const action = "inline-flex min-h-11 w-fit items-center justify-center gap-3 font-bold [&>svg]:shrink-0";

export const button = `${action} min-h-[3.3rem] rounded px-5 py-3 bg-primary-700 text-white hover:bg-primary-800`;
export const textLink = `${action} ${accent} hover:underline underline-offset-4`;
export const kicker = `flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest ${muted}`;
export const hero = "grid items-center gap-[clamp(1.5rem,4vw,4.5rem)] py-[clamp(1.5rem,3.1vw,3.4rem)] min-[801px]:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]";
export const heroTitle = "mb-[.28em] mt-[.2em] max-w-[12ch] text-balance text-[clamp(3.2rem,10vw,5.5rem)] font-extrabold leading-[.99] tracking-[-.065em] min-[801px]:max-w-none min-[801px]:text-[clamp(3.2rem,6.35vw,6.8rem)]";
export const heroDescription = `text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed ${muted}`;
export const heroActions = "mt-[clamp(1.2rem,3vw,2.3rem)] flex flex-wrap gap-x-[clamp(1.1rem,2vw,2rem)] gap-y-2.5";

export const section = `grid items-start gap-4 border-t py-[clamp(2.5rem,7vw,6rem)] ${rule} min-[801px]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] min-[801px]:gap-[clamp(1.5rem,6vw,6rem)]`;
export const sectionTitle = "mb-[.5em] mt-[.25em] text-balance text-[clamp(2.1rem,4.1vw,4rem)] font-extrabold leading-[1.05] tracking-[-.073em]";
export const compactTitle = "mt-[.2em] text-balance text-[clamp(1.4rem,2.5vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-.06em]";
