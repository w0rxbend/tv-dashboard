/**
 * AppLogo — animated inline SVG brand mark for the Aurora dashboard.
 *
 * Structure (mirrors logo.svg design):
 *  • Rounded-square squircle (rx=116/512 ≈ 22%)
 *  • Diagonal warm/cool split — golden-orange upper-left, cobalt lower-right
 *  • Warm half: glowing sun disc
 *  • Cool half: three animated water-drop teardrops
 *
 * GSAP animations:
 *  • Sun disc + glow pulse (scale, opacity yoyo)
 *  • Sun glow halo breathes
 *  • Drops fall staggered and loop endlessly
 *  • Separator line has a subtle shimmer
 */

import gsap from 'gsap';
import { onMount, onCleanup } from 'solid-js';

export default function AppLogo(props) {
  const sz = () => props.size ?? 44;

  let sunG, glowC, drop1, drop2, drop3, sepLine;

  onMount(() => {
    const ctx = gsap.context(() => {
      // Sun glow breathes
      gsap.to(glowC, {
        scale: 1.18,
        opacity: 0.8,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        svgOrigin: '170 180',
      });

      // Sun disc pulses very subtly (warmth feel)
      gsap.to(sunG, {
        scale: 1.04,
        duration: 4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        svgOrigin: '170 180',
      });

      // Drops fall staggered and loop
      gsap.fromTo(
        [drop1, drop2, drop3],
        { y: 0, opacity: 0.92 },
        {
          y: 28,
          opacity: 0,
          duration: 1.1,
          ease: 'power1.in',
          stagger: { each: 0.22 },
          repeat: -1,
          repeatDelay: 0.5,
        }
      );

      // Diagonal separator shimmers
      gsap.to(sepLine, {
        opacity: 0.36,
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });

    onCleanup(() => ctx.revert());
  });

  return (
    <svg
      width={sz()} height={sz()}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', 'border-radius': 'var(--shape-md)', overflow: 'hidden' }}
      aria-label="Aurora"
    >
      <defs>
        {/* Warm half gradient */}
        <linearGradient id="lg-warm" x1="0" y1="0" x2="380" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#FFD84D"/>
          <stop offset="100%" stop-color="#EF6E1A"/>
        </linearGradient>

        {/* Cool half gradient */}
        <linearGradient id="lg-cool" x1="512" y1="0" x2="132" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#5B9BD5"/>
          <stop offset="100%" stop-color="#1A3A7C"/>
        </linearGradient>

        {/* Sun radial glow */}
        <radialGradient id="lg-sun" cx="170" cy="175" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#FFFDE0"/>
          <stop offset="42%"  stop-color="#FFE555"/>
          <stop offset="100%" stop-color="#FFAA00" stop-opacity="0"/>
        </radialGradient>

        {/* Drop gradient */}
        <linearGradient id="lg-drop" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stop-color="#C8E8FF"/>
          <stop offset="100%" stop-color="#5490D8"/>
        </linearGradient>

        {/* Shadow under drops */}
        <filter id="lg-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="7" flood-color="#0A2060" flood-opacity="0.35"/>
        </filter>

        {/* Sun bloom filter */}
        <filter id="lg-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Squircle clip */}
        <clipPath id="lg-sq">
          <rect width="512" height="512" rx="116"/>
        </clipPath>
      </defs>

      <g clip-path="url(#lg-sq)">
        {/* ── Background halves ──────────────────────── */}
        <path d="M 0 0 L 512 0 L 0 512 Z"   fill="url(#lg-warm)"/>
        <path d="M 512 0 L 512 512 L 0 512 Z" fill="url(#lg-cool)"/>

        {/* Diagonal seam shimmer */}
        <line ref={sepLine}
          x1="544" y1="-32" x2="-32" y2="544"
          stroke="rgba(255,255,255,0.24)" stroke-width="3" opacity="0.24"
        />

        {/* ── Sun (warm half) ───────────────────────── */}
        {/* Outer glow halo — breathes */}
        <circle ref={glowC} cx="170" cy="175" r="122" fill="url(#lg-sun)" opacity="0.75"/>

        {/* Main sun disc — subtle scale pulse */}
        <g ref={sunG} filter="url(#lg-bloom)">
          <circle cx="170" cy="175" r="76" fill="#FFE44D" stroke="#E89000" stroke-width="8"/>
          {/* Specular highlight */}
          <ellipse cx="148" cy="150" rx="34" ry="26" fill="rgba(255,255,230,0.32)"/>
        </g>

        {/* ── Rain drops (cool half) ─────────────────── */}
        {/*
          Teardrop formula: M cx,tip  L cx-r,base  A r r 0 0 0 cx+r,base  Z
          Arc: from (cx-r,base) counter-clockwise to (cx+r,base) with radius r
               → sweeps the bottom semicircle
        */}
        <path ref={drop1}
          d="M 350 204 L 308 276 A 42 42 0 0 0 392 276 Z"
          fill="url(#lg-drop)" filter="url(#lg-shadow)"/>

        <path ref={drop2}
          d="M 412 290 L 381 346 A 31 31 0 0 0 443 346 Z"
          fill="url(#lg-drop)" filter="url(#lg-shadow)" opacity="0.88"/>

        <path ref={drop3}
          d="M 328 354 L 304 398 A 24 24 0 0 0 352 398 Z"
          fill="url(#lg-drop)" filter="url(#lg-shadow)" opacity="0.78"/>
      </g>
    </svg>
  );
}
