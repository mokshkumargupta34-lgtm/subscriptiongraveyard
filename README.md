# Subscription Graveyard 🪦

A dark, cinematic one-page site. The 26-second graveyard journey (`0704.mp4`) is a
scroll-scrubbed full-screen hero — the scrollbar is the video's timeline, forward and
backward — followed by a full set of themed sections, each carrying a signature
effect implemented in vanilla JS/CSS (no framework, no build step).

## Run locally

```bash
node serve.mjs          # → http://localhost:8123
```

**The server matters.** Scrubbing seeks constantly into unbuffered parts of the file,
so the server must handle HTTP Range requests correctly and concurrently. A server
with weak range support makes every seek hang — the symptom is a video that looks
**frozen while you scroll**. `serve.mjs` (bundled, zero dependencies) does ranges
properly, as do Netlify/Vercel/GitHub Pages in production. Never open `index.html`
via `file://`.

## Page anatomy

| Section | Effect |
|---|---|
| Video hero (800vh rig) | Scroll-scrub engine · moonbeam spotlight · ember particles · typewriter tagline · act captions · clickable act rail |
| Manifesto | Scroll-driven word-by-word text reveal ("the other 7" in money green) |
| The Séance | Aurora night-sky background · radar sweep with labeled blips (step 2) |
| The Instruments | 5-cell bento grid with hover glow |
| The Plots | Flip-words headline · tombstone cards with pointer-following border glow + rising ghost + bury toggle |
| The Haunting Total | Meteors · ember band · count-up to $3,532 with sparkle glints · border-beam "scanning" card |
| The Lifecycle | Scroll-driven timeline progress line with lighting dots |
| The Reckoning | Pulse beams converging into a perspective tilt-up dashboard |
| The Mourners | Stacked-avatar testimonials with crossfading quotes |
| The Vow | Evervault-style scramble matrix revealed under the cursor |
| The Tithe | Rotating violet/teal/gold shine-border pricing card |
| CTA | Drifting gradient blobs · shiny sweep button |
| Sign-up (`signup.html`) | Standalone glass auth card (adapted from a 21st.dev component): Aether Flow particle-network background (cursor-reactive constellation), traveling violet/gold border beams, Google-first sign-up (`gmail.readonly` note), email/password fallback with eye toggle — linked from "Exhume my inbox" and "Start burying" |

Design tokens: night `#07071C/#111133/#1C1A4A`, violet `#7A6CF0`, teal `#8FE8FF`
(scan/data), money green `#BFE9CD` (all $ amounts), gold `#F0C96E` (actions),
moon `#E9E7FF`. Cinzel headings, Spectral body, system mono for data labels.

## Routes & pages

| Route | Purpose |
|---|---|
| `/` | The cinematic landing page |
| `/login` | Waitlist capture (becomes Google sign-in in Phase 2) — all CTAs lead here |
| `/dashboard` | The dashboard app (rewritten from `dashboard/dist/` via `vercel.json`; `serve.mjs` mirrors it locally) |
| `/privacy` · `/terms` | Legal pages incl. the Google API Limited Use disclosure |
| `404.html` | "This plot is empty." |

SEO: OG/Twitter cards (`media/og.jpg`), canonical, JSON-LD `SoftwareApplication`
($4/mo), `robots.txt`, `sitemap.xml`, ghost favicon set. A sticky translucent header
appears after 20% of the first viewport so it never covers the film's opening.

## The live dashboard (`dashboard/`)

A separate React + TypeScript + Tailwind CSS v4 + Framer Motion app (Vite), linked
from the Reckoning section ("OPEN THE LIVE DASHBOARD →") and served statically from
`dashboard/dist/`. Components live in `src/components/ui/` (shadcn-style structure):

- **Sidebar** — spring `layoutId` active pill, staggered nav entrance, bobbing skull
- **Topbar** — border-beam "SCANNING INBOX" pill with rotating radar icon
- **Stat cards** — rAF count-ups, pointer-follow glow rings, self-drawing sparklines
  (`pathLength`), gold glints on the damage figure, spring-staggered entrances
- **Waste chart** — spring-growing violet bars, hover tooltips, direct label on '26
- **Plots table** — staggered rows, BURY IT → ghost floats up (AnimatePresence),
  status badge pops, live TOTAL EXTRACTION
- **Radar card** — conic sweep with pulsing labeled blips
- **Renewals** — animated progress bars, gold pulse on ≤3-day renewals
- **Activity feed** — staggered crypt log; **ambient ghosts** drift up behind it all

All animation respects `prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

```bash
cd dashboard && npm install && npm run build   # output → dashboard/dist/
npm run dev                                    # local dev server
```

## The scrub engine

- An 800vh rig (600vh mobile) wraps a `position: sticky` 100vh stage.
- Per frame: `p = clamp(-rig.top / (rigHeight − vh), 0, 1)`; target video time is
  `p × duration` (pure linear — the film always moves while you scroll).
- The playhead lerps toward the target and `currentTime` is assigned with a 1/60s
  deadband and a 250ms hung-seek escape hatch. All-intra encoding (`-g 1`) makes
  every seek frame-accurate.
- The video reveals over the poster on `loadeddata` (waiting for `canplaythrough`
  can leave the poster up forever while seeking keeps buffer state low).
- **Fallback 1:** median seek latency > 180ms → paint frames to a `<canvas>` (iOS).
- **Fallback 2:** seeks issued but `currentTime` frozen → switch to play-chase
  (play toward the target at 0.5–4×) so the film always visibly moves.

## Accessibility & performance

- `prefers-reduced-motion: reduce` → fully static page: poster hero, captions in
  flow, every effect replaced by its static state, video never downloads.
- Particle canvases pause when offscreen or the tab is hidden; testimonial
  autoplay pauses on hover and offscreen.
- Pointer-glow and the scramble matrix are disabled on touch devices.
- All interactive elements are keyboard-focusable with visible gold focus rings.
- Page weight: desktop ≈ 24.6 MB (video), mobile ≈ 13.5 MB; first paint never
  waits on the video.

## Regenerating media derivatives

```bash
ffmpeg -y -i 0704.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 30 -preset slow -g 1 -pix_fmt yuv420p -movflags +faststart media/journey-scrub.mp4
ffmpeg -y -i 0704.mp4 -an -vf scale=960:-2  -c:v libx264 -crf 26 -preset slow -g 1 -pix_fmt yuv420p -movflags +faststart media/journey-scrub-mobile.mp4
ffmpeg -y -i 0704.mp4 -vf "select=eq(n\,0)" -vframes 1 -q:v 2 media/poster.jpg
ffmpeg -y -sseof -0.1 -i 0704.mp4 -vframes 1 -q:v 2 -update 1 media/finale.jpg
```

## Deploying

Static output — push the folder to Netlify / Vercel / GitHub Pages as-is;
`.gitignore` already excludes the raw `0704.mp4` source.
