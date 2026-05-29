/**
 * WeatherIcon — premium SVG weather icons animated with GSAP.
 *
 * Design language (based on references):
 *  • White cloud outline, no fill — clean line-icon aesthetic
 *  • Amber/gold (#FFB830) accent for sun and lightning
 *  • Sky-blue (#5AAAE0) accent for rain / snow
 *  • Consistent stroke-width 3.5 throughout, rounded linecap/linejoin
 *  • Cloud shape: hand-traced 2-bump bezier path — each cloud uses a flat
 *    bottom and two rounded humps with a clear visible valley between them
 *  • All animations driven by GSAP timelines inside gsap.context() →
 *    fully cleaned up in onCleanup (no leaks)
 */

import gsap from 'gsap';
import { onMount, onCleanup, Switch, Match, For } from 'solid-js';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  cloud:  'rgba(255,255,255,0.07)',  // subtle cloud fill
  stroke: '#FFFFFF',
  sun:    '#FFB830',
  rain:   '#5AAAE0',
  snow:   '#78CCF4',
  bolt:   '#FFB830',
  fog:    'rgba(255,255,255,0.72)',
  sw:     3.5,
};

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const nextWeatherSvgId = (() => {
  let id = 0;
  return (prefix) => `${prefix}-${++id}`;
})();

// ─── Cloud paths ──────────────────────────────────────────────────────────────
// Constructed with cubic beziers so the two humps have a clear visible valley.
// Z always closes back to the start → flat bottom edge for free.

// Large: base y=78 — for standalone "cloudy"
const CL = [
  'M 18 78',
  'C 14 78 12 72 12 66',            // left outer edge going up
  'C 12 54 20 44 34 44',            // left side up to left-hump area
  'C 36 32 50 26 58 34',            // over left hump — peak ≈ y28
  'C 58 42 66 44 72 40',            // valley between humps  ≈ y42
  'C 72 28 86 22 94 32',            // over main hump — peak ≈ y24
  'C 102 28 110 44 108 60',         // right side going down
  'C 110 70 106 78 96 78 Z',        // right bottom corner
].join(' ');

// Small: base y=68 — conditions with effects below (rain, snow, lightning…)
const CS = [
  'M 18 68',
  'C 14 68 12 62 12 56',
  'C 12 46 20 36 32 36',
  'C 34 24 48 18 56 26',
  'C 56 34 64 36 70 32',
  'C 70 20 84 14 92 24',
  'C 100 20 108 36 106 50',
  'C 108 60 104 68 94 68 Z',
].join(' ');

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Render N evenly spaced sun rays radiating from (cx,cy). */
function Rays({ cx, cy, ri, ro, n = 8, stroke = C.sun, sw = C.sw }) {
  return (
    <For each={Array.from({ length: n }, (_, i) => i)}>
      {(i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            x1={(cx + Math.cos(a) * ri).toFixed(1)} y1={(cy + Math.sin(a) * ri).toFixed(1)}
            x2={(cx + Math.cos(a) * ro).toFixed(1)} y2={(cy + Math.sin(a) * ro).toFixed(1)}
            stroke={stroke} stroke-width={sw} stroke-linecap="round"
          />
        );
      }}
    </For>
  );
}

/** One snow asterisk centred at (cx,cy) with arm length `arm`. */
function Flake({ cx, cy, arm = 7 }) {
  const d = arm * 0.7;
  return (
    <g stroke={C.snow} stroke-width="2.8" stroke-linecap="round">
      <line x1={cx - arm} y1={cy} x2={cx + arm} y2={cy}/>
      <line x1={cx} y1={cy - arm} x2={cx} y2={cy + arm}/>
      <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d}/>
      <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d}/>
    </g>
  );
}

// ─── Condition components ─────────────────────────────────────────────────────

function ClearIcon() {
  let sunG, glowC;
  const glowId = nextWeatherSvgId('cl-glow');
  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(glowC, { scale: 1.16, opacity: 0.55, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true, svgOrigin: '60 60' });
      gsap.to(sunG,  { rotation: 360, duration: 22, ease: 'none', repeat: -1, svgOrigin: '60 60' });
    });
    onCleanup(() => ctx.revert());
  });

  return (
    <>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#FFD840" stop-opacity="0.38"/>
          <stop offset="60%"  stop-color="#FFAA00" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#FF8800" stop-opacity="0"/>
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <circle ref={glowC} cx="60" cy="60" r="54" fill={`url(#${glowId})`} opacity="0.8"/>

      {/* Rotating group */}
      <g ref={sunG} fill="none">
        <Rays cx={60} cy={60} ri={34} ro={47} n={8} sw={3.5}/>
        <circle cx="60" cy="60" r="23" stroke={C.sun} stroke-width="3.5" fill="rgba(255,184,48,0.12)"/>
      </g>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PartlyCloudyIcon() {
  let sunG, cloudP;
  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(sunG,   { rotation: 360, duration: 26, ease: 'none', repeat: -1, svgOrigin: '82 32' });
      gsap.to(cloudP, { y: -7, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
    onCleanup(() => ctx.revert());
  });

  return (
    <>
      {/* Sun — drawn first so cloud appears in front */}
      <g ref={sunG} fill="none">
        <Rays cx={82} cy={32} ri={23} ro={34} n={8} sw={3}/>
        <circle cx="82" cy="32" r="17" stroke={C.sun} stroke-width="3" fill="rgba(255,184,48,0.12)"/>
      </g>

      {/* Cloud — CS centred, floats */}
      <path ref={cloudP} d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CloudyIcon() {
  let frontC, backC;
  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(frontC, { y: -8, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to(backC,  { y: -5, duration: 4.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 });
    });
    onCleanup(() => ctx.revert());
  });

  return (
    <>
      {/* Background smaller cloud for depth */}
      <path ref={backC}
        d={CL}
        stroke="rgba(255,255,255,0.32)" stroke-width="3" fill="none"
        transform="translate(8,14) scale(0.76)"
        style={{ 'transform-box': 'fill-box', 'transform-origin': 'center' }}
      />
      {/* Main cloud */}
      <path ref={frontC} d={CL} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RainyIcon() {
  let cloudP;
  const drops = [];

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(cloudP, { y: -5, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.fromTo(drops,
        { y: 0, opacity: 1 },
        { y: 18, opacity: 0, duration: 0.75, ease: 'power1.in', stagger: { each: 0.18 }, repeat: -1, repeatDelay: 0.3 }
      );
    });
    onCleanup(() => ctx.revert());
  });

  // 4 diagonal rain lines
  const RD = [[32,74,25,90], [50,72,43,88], [68,74,61,90], [86,72,79,88]];

  return (
    <>
      <path ref={cloudP} d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
      {RD.map(([x1,y1,x2,y2], i) => (
        <line ref={el => drops[i] = el} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C.rain} stroke-width="3.5" stroke-linecap="round"/>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function HeavyRainIcon() {
  let cloudP;
  const lines = [];

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(cloudP, { y: -5, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.fromTo(lines,
        { y: 0, opacity: 0.95 },
        { y: 22, opacity: 0, duration: 0.55, ease: 'power2.in', stagger: { each: 0.08 }, repeat: -1, repeatDelay: 0.1 }
      );
    });
    onCleanup(() => ctx.revert());
  });

  // 8 heavy diagonal lines in 2 rows
  const HL = [
    [22,72,12,92], [38,70,28,90], [54,72,44,92], [70,70,60,90], [86,72,76,92], [102,70,92,90],
    [30,94,20,114], [46,92,36,112], [62,94,52,114], [78,92,68,112], [94,94,84,114],
  ];

  return (
    <>
      <path ref={cloudP} d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
      {HL.map(([x1,y1,x2,y2], i) => (
        <line ref={el => lines[i] = el} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C.rain} stroke-width="4" stroke-linecap="round"/>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ThunderstormIcon() {
  let cloudP, boltG, bloom;
  const glowId = nextWeatherSvgId('th-glow');

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(cloudP, { x: 4, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true });

      gsap.set([boltG, bloom], { autoAlpha: 0 });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
      tl.to([boltG, bloom], { autoAlpha: 1, duration: 0.04 })
        .to([boltG, bloom], { autoAlpha: 0, duration: 0.09, delay: 0.07 })
        .to([boltG, bloom], { autoAlpha: 1, duration: 0.04 })
        .to([boltG, bloom], { autoAlpha: 0, duration: 0.22, delay: 0.05 });
    });
    onCleanup(() => ctx.revert());
  });

  return (
    <>
      <defs>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <path ref={cloudP} d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>

      {/* Glow bloom behind bolt */}
      <ellipse ref={bloom} cx="62" cy="93" rx="18" ry="12" fill={C.bolt} opacity="0.24"/>

      {/* Lightning bolt */}
      <g ref={boltG} filter={`url(#${glowId})`}>
        <path d="M 70 70 L 52 94 L 64 92 L 46 116 L 76 90 L 64 92 Z"
              stroke={C.bolt} stroke-width="2.5" stroke-linejoin="round"
              fill={C.bolt} fill-opacity="0.9"/>
      </g>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SnowyIcon() {
  let cloudP;
  const flakeGs = [];

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(cloudP, { y: -5, duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.fromTo(flakeGs,
        { y: 0, x: 0, opacity: 0.95 },
        { y: 22, x: -4, opacity: 0, duration: 1.8, ease: 'power1.inOut',
          stagger: { each: 0.32 }, repeat: -1, repeatDelay: 0.5 }
      );
    });
    onCleanup(() => ctx.revert());
  });

  const FK = [[34,80,7], [60,76,7], [86,80,7], [47,102,6], [73,102,6]];

  return (
    <>
      <path ref={cloudP} d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
      {FK.map(([cx, cy, arm], i) => (
        <g ref={el => flakeGs[i] = el}>
          <Flake cx={cx} cy={cy} arm={arm}/>
        </g>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function WindyIcon() {
  let cloudP;
  const wls = [];

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(cloudP, { x: 6, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true });

      // Stroke-dashoffset creates a "wind rushing" draw-on effect
      wls.forEach((el, i) => {
        if (!el) return;
        const len = [94, 80, 68][i] ?? 80;
        gsap.set(el, { attr: { 'stroke-dasharray': `${len} 28` } });
        gsap.to(el, {
          attr: { 'stroke-dashoffset': -(len + 28) },
          duration: 1.0 - i * 0.1,
          ease: 'none',
          repeat: -1,
          delay: i * 0.26,
        });
      });
    });
    onCleanup(() => ctx.revert());
  });

  return (
    <>
      {/* Cloud shifted left so wind lines have room on right */}
      <g ref={cloudP} transform="translate(-6,0)">
        <path d={CS} stroke={C.stroke} stroke-width={C.sw} stroke-linejoin="round" stroke-linecap="round" fill={C.cloud}/>
      </g>

      {/* Wind swoosh lines */}
      <path ref={el => wls[0] = el}
        d="M 8 78 C 26 70 50 80 72 70 C 90 62 102 70 116 64"
        stroke="rgba(255,255,255,0.80)" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path ref={el => wls[1] = el}
        d="M 12 92 C 30 84 54 94 76 85 C 94 76 104 84 116 80"
        stroke="rgba(255,255,255,0.65)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path ref={el => wls[2] = el}
        d="M 16 106 C 34 98 56 108 78 100 C 96 92 108 100 116 96"
        stroke="rgba(255,255,255,0.50)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function FoggyIcon() {
  const bars = [];

  onMount(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      bars.forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
          x: i % 2 === 0 ? 9 : -9,
          opacity: 0.45,
          duration: 2.6 + i * 0.35,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.45,
        });
      });
    });
    onCleanup(() => ctx.revert());
  });

  const BAR_Y = [28, 50, 68, 86, 104];

  return (
    <>
      {BAR_Y.map((y, i) => (
        <line
          ref={el => bars[i] = el}
          x1={i % 2 === 0 ? 14 : 8} y1={y}
          x2={i % 2 === 0 ? 106 : 112} y2={y}
          stroke={C.fog} stroke-width={i === 0 || i === 4 ? 7 : 8}
          stroke-linecap="round" opacity="0.82"
        />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeatherIcon(props) {
  const sz = () => props.size ?? 120;
  return (
    <svg
      width={sz()} height={sz()}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <Switch fallback={<CloudyIcon/>}>
        <Match when={props.condition === 'clear'}>         <ClearIcon/> </Match>
        <Match when={props.condition === 'partly_cloudy'}> <PartlyCloudyIcon/> </Match>
        <Match when={props.condition === 'cloudy'}>        <CloudyIcon/> </Match>
        <Match when={props.condition === 'rainy'}>         <RainyIcon/> </Match>
        <Match when={props.condition === 'heavy_rain'}>    <HeavyRainIcon/> </Match>
        <Match when={props.condition === 'thunderstorm'}>  <ThunderstormIcon/> </Match>
        <Match when={props.condition === 'snowy'}>         <SnowyIcon/> </Match>
        <Match when={props.condition === 'windy'}>         <WindyIcon/> </Match>
        <Match when={props.condition === 'foggy'}>         <FoggyIcon/> </Match>
      </Switch>
    </svg>
  );
}
