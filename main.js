/* ============================================================
   SUBSCRIPTION GRAVEYARD v3
   Scroll-scrubbed video hero + effect sections.
   The scrollbar is the hero video's timeline; every decorative
   effect is vanilla JS/CSS with a reduced-motion static fallback.
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;

  const $ = (id) => document.getElementById(id);
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const COUNTER_TARGET = 3532;

  /* scroll-linked updaters, driven by the main rAF loop */
  const scrollFx = [];

  /* ------------------------------------------------------------
     Reduced motion: static page. Populate JS-rendered text, skip
     every animation and the scrub engine entirely.
     ------------------------------------------------------------ */
  if (reducedMotion.matches) {
    document.documentElement.classList.add("reduced-motion");
    $("typewriter").textContent = $("typewriter").dataset.text;
    $("counter").textContent = fmt(COUNTER_TARGET);
    buildManifesto(true);
    initTestimonials(false);
    initHeader();
    initCtaButton();
    return;
  }

  /* ------------------------------------------------------------ */
  initEngine();
  initRail();

  initTypewriter();
  initEmbers("hero-embers", isMobile ? 30 : 60);
  initEmbers("stats-embers", isMobile ? 16 : 34);
  buildManifesto(false);
  initFlipWords();
  initGraveGlow();
  initHeader();
  initMeteors();
  initCounter();
  initGlints();
  initTimeline();
  initBeams();
  initDashboard();
  initTestimonials(true);
  initVault();
  initLamp();
  initCtaButton();

  /* ============================================================
     SCRUB ENGINE — the scrollbar is the playhead
     (play-chase + canvas fallbacks self-arm if a browser misbehaves)
     ============================================================ */
  function initEngine() {
    const rig = $("rig");
    const video = $("scrub-video");
    const dots = Array.from(document.querySelectorAll(".rail__dot"));

    video.src = isMobile ? "media/journey-scrub-mobile.mp4" : "media/journey-scrub.mp4";
    video.load();

    /* reveal over the poster as soon as ANY frame is renderable —
       canplaythrough may never fire while constant seeking keeps
       the buffer state low */
    const reveal = () => video.classList.add("is-ready");
    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplaythrough", reveal, { once: true });

    const unlock = () => {
      const p = video.play();
      if (p && p.then) p.then(() => video.pause()).catch(() => {});
      window.removeEventListener("touchend", unlock);
    };
    window.addEventListener("touchend", unlock, { passive: true });

    const LERP = 0.14;
    const DEADBAND = 1 / 60;

    const TRACKS = [
      { el: $("ov-hero"), a: 0,    b: 0,    c: 0.05, d: 0.09 },
      { el: $("ov-hint"), a: 0,    b: 0,    c: 0.04, d: 0.08 },
      { el: $("ov-cap1"), a: 0.10, b: 0.14, c: 0.20, d: 0.25 },
      { el: $("ov-cap2"), a: 0.28, b: 0.32, c: 0.44, d: 0.49 },
      { el: $("ov-cap3"), a: 0.53, b: 0.57, c: 0.69, d: 0.74 },
      { el: $("ov-cap4"), a: 0.78, b: 0.82, c: 0.94, d: 0.99 },
    ];
    const ACT_BOUNDS = [0, 0.25, 0.50, 0.75];

    let progress = 0;
    let playhead = 0;
    let mode = "scrub";      // "scrub" | "chase"
    let painting = "video";  // "video" | "canvas"
    let lastSeekSet = 0;
    let seekIssuedAt = 0;
    let paintCtx = null;
    let lastPaintT = -1;
    let wdLastCt = -1, wdIssuedSpan = 0, wdStuckSince = 0;

    Object.defineProperty(window, "__SG", {
      value: {
        get mode() { return mode; },
        get painting() { return painting; },
        get progress() { return progress; },
        get targetTime() { return targetTime(); },
        get currentTime() { return video.currentTime; },
        get playing() { return !video.paused; },
      },
    });

    const latencies = [];
    video.addEventListener("seeked", () => {
      if (!seekIssuedAt) return;
      latencies.push(performance.now() - seekIssuedAt);
      seekIssuedAt = 0;
      if (latencies.length === 24 && painting === "video") {
        const sorted = [...latencies].sort((x, y) => x - y);
        if (sorted[Math.floor(sorted.length / 2)] > 180) enterCanvasMode();
      }
    });

    function enterCanvasMode() {
      painting = "canvas";
      const canvas = document.createElement("canvas");
      canvas.className = "stage__canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      paintCtx = canvas.getContext("2d");
      video.insertAdjacentElement("afterend", canvas);
      video.classList.remove("is-ready");
    }

    function computeProgress() {
      const rect = rig.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      return runway > 0 ? clamp01(-rect.top / runway) : 0;
    }

    function targetTime() {
      return progress * ((video.duration || 26.13) - 0.08);
    }

    function issueSeek(t) {
      if (Math.abs(t - lastSeekSet) < DEADBAND) return;
      const stale = video.seeking && seekIssuedAt && performance.now() - seekIssuedAt > 250;
      if (!video.seeking || stale) {
        wdIssuedSpan += Math.abs(t - lastSeekSet);
        lastSeekSet = t;
        seekIssuedAt = performance.now();
        video.currentTime = t;
      }
    }

    /* seeks issued but the film never moves → switch to play-chase */
    function watchdog() {
      const ct = video.currentTime;
      if (Math.abs(ct - wdLastCt) > 0.01) {
        wdLastCt = ct; wdIssuedSpan = 0; wdStuckSince = 0;
        return;
      }
      if (wdIssuedSpan > 1.5) {
        if (!wdStuckSince) wdStuckSince = performance.now();
        else if (performance.now() - wdStuckSince > 700) mode = "chase";
      }
    }

    function chaseStep(target) {
      const gap = target - video.currentTime;
      const resume = video.paused ? 0.08 : 0.02;
      if (gap > resume) {
        if (gap > 3.5) issueSeek(target - 0.35);
        video.playbackRate = Math.min(4, Math.max(0.5, gap * 3));
        if (video.paused) {
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        }
      } else if (gap < -0.15) {
        if (!video.paused) video.pause();
        issueSeek(video.currentTime + gap * 0.2);
      } else if (!video.paused) {
        video.pause();
      }
    }

    function trackOpacity(t, p) {
      const fin = t.b > t.a ? (p - t.a) / (t.b - t.a) : (p >= t.a ? 1 : 0);
      const fout = t.d > t.c ? (t.d - p) / (t.d - t.c) : 1;
      return clamp01(Math.min(fin, fout));
    }

    function updateOverlays(p) {
      for (const t of TRACKS) {
        const o = trackOpacity(t, p);
        t.el.style.opacity = o.toFixed(3);
        t.el.style.visibility = o <= 0 ? "hidden" : "visible";
        t.el.style.transform = "translate3d(0, " + (16 * (1 - o)).toFixed(1) + "px, 0)";
      }
      let act = 0;
      for (let i = 0; i < ACT_BOUNDS.length; i++) if (p >= ACT_BOUNDS[i]) act = i;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === act));
    }

    (function frame() {
      progress = computeProgress();
      updateOverlays(progress);
      for (const fx of scrollFx) fx();

      if (video.readyState >= 2 && !video.classList.contains("is-ready") && painting === "video") reveal();

      if (video.readyState >= 1 && video.duration) {
        const target = targetTime();
        if (mode === "scrub") {
          playhead += (target - playhead) * LERP;
          if (Math.abs(target - playhead) < 0.002) playhead = target;
          issueSeek(playhead);
          watchdog();
        } else {
          chaseStep(target);
        }
        if (painting === "canvas" && paintCtx && Math.abs(video.currentTime - lastPaintT) > 0.01) {
          lastPaintT = video.currentTime;
          paintCtx.drawImage(video, 0, 0, paintCtx.canvas.width, paintCtx.canvas.height);
        }
      }
      requestAnimationFrame(frame);
    })();
  }

  function initRail() {
    const rig = $("rig");
    document.querySelectorAll(".rail__dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const p = parseFloat(dot.dataset.target);
        window.scrollTo({ top: p * (rig.offsetHeight - window.innerHeight), behavior: "smooth" });
      });
    });
  }

  /* ============================================================
     TYPEWRITER — hero tagline, ~40ms/char, cursor blinks then fades
     ============================================================ */
  function initTypewriter() {
    const el = $("typewriter");
    const cursor = $("type-cursor");
    const text = el.dataset.text;
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 40);
      else cursor.classList.add("is-done");
    };
    setTimeout(tick, 600);
  }

  /* ============================================================
     EMBERS — drifting graveyard fireflies (canvas particles)
     ============================================================ */
  function initEmbers(canvasId, density) {
    const canvas = $(canvasId);
    const ctx = canvas.getContext("2d");
    const COLORS = ["122,108,240", "240,201,110"];
    let parts = [], w = 0, h = 0, running = false, raf = 0;

    function size() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, r.width);
      h = canvas.height = Math.max(1, r.height);
    }
    function spawn() {
      parts = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.1,
        vy: -(0.08 + Math.random() * 0.22),
        vx: (Math.random() - 0.5) * 0.12,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        tw: Math.random() * Math.PI * 2,
        ts: 0.008 + Math.random() * 0.02,
      }));
    }
    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.tw += p.ts;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = "rgba(" + p.c + "," + a.toFixed(3) + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }
    size(); spawn();
    window.addEventListener("resize", () => { size(); spawn(); });

    new IntersectionObserver((es) => {
      const vis = es[0].isIntersecting && !document.hidden;
      if (vis && !running) { running = true; step(); }
      else if (!vis && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && running) { running = false; cancelAnimationFrame(raf); }
    });
  }

  /* ============================================================
     MANIFESTO — scroll-driven word reveal
     ============================================================ */
  function buildManifesto(staticMode) {
    const el = $("manifesto-text");
    const text = el.dataset.text;
    const green = el.dataset.green;
    const gStart = text.indexOf(green);
    const words = [];
    let pos = 0;
    for (const wtxt of text.split(" ")) {
      const span = document.createElement("span");
      span.className = "w";
      if (gStart >= 0 && pos >= gStart && pos < gStart + green.length) span.classList.add("green");
      span.textContent = wtxt;
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
      words.push(span);
      pos += wtxt.length + 1;
    }
    if (staticMode) { words.forEach((s) => s.classList.add("lit")); return; }

    const section = $("manifesto");
    scrollFx.push(() => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = Math.round(prog * words.length);
      words.forEach((s, i) => s.classList.toggle("lit", i < lit));
    });
  }

  /* ============================================================
     FLIP WORDS — cycling headline word
     ============================================================ */
  function initFlipWords() {
    const WORDS = ["StreamFlix.", "GymRat+.", "CloudVault.", "that free trial.", "all of them."];
    const holder = $("flip-words");
    holder.innerHTML = "";
    const spans = WORDS.map((wtxt, i) => {
      const s = document.createElement("span");
      s.className = "flip__word" + (i === 0 ? " is-in" : "");
      s.textContent = wtxt;
      holder.appendChild(s);
      return s;
    });
    let idx = 0;
    setInterval(() => {
      spans[idx].classList.remove("is-in");
      spans[idx].classList.add("is-out");
      const prev = idx;
      idx = (idx + 1) % spans.length;
      spans[idx].classList.remove("is-out");
      spans[idx].classList.add("is-in");
      setTimeout(() => spans[prev].classList.remove("is-out"), 500);
    }, 2200);
  }

  /* ============================================================
     TOMBSTONES — pointer-following border glow + bury
     ============================================================ */
  function initGraveGlow() {
    if (isCoarse) return;
    document.querySelectorAll(".glow-card").forEach((card) => {
      const stone = card.querySelector(".grave__stone");
      card.addEventListener("pointermove", (e) => {
        const r = stone.getBoundingClientRect();
        stone.style.setProperty("--mx", (e.clientX - r.left) + "px");
        stone.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* sticky header — slides in after 20% of the first viewport so it
     never covers the film's opening frame */
  function initHeader() {
    const head = $("site-head");
    const onScroll = () =>
      head.classList.toggle("show", window.scrollY > window.innerHeight * 0.2);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     HAUNTING TOTAL — meteors, count-up, sparkle glints
     ============================================================ */
  function initMeteors() {
    const holder = $("meteors");
    const n = isMobile ? 8 : 20;
    for (let i = 0; i < n; i++) {
      const m = document.createElement("span");
      m.className = "meteor";
      m.style.setProperty("--mt", (Math.random() * 60) + "%");
      m.style.setProperty("--ml", (10 + Math.random() * 90) + "%");
      m.style.setProperty("--mdelay", (Math.random() * 6).toFixed(2) + "s");
      m.style.setProperty("--md", (3 + Math.random() * 3).toFixed(2) + "s");
      holder.appendChild(m);
    }
  }

  function initCounter() {
    const counter = $("counter");
    /* static $3,532 stays in the HTML for crawlers/no-JS; only zero it
       out when we can actually animate it back up */
    if (!("IntersectionObserver" in window)) return;
    counter.firstChild.textContent = "$0";
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      (function tick(now) {
        const t = Math.min(1, (now - t0) / 1800);
        counter.firstChild.textContent = fmt(COUNTER_TARGET * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 });
    io.observe(counter);
  }

  function initGlints() {
    const counter = $("counter");
    const SPOTS = [
      ["-6%", "8%"], ["18%", "-14%"], ["45%", "-10%"], ["72%", "-16%"],
      ["101%", "12%"], ["88%", "78%"], ["38%", "96%"], ["4%", "72%"],
    ];
    SPOTS.forEach(([gx, gy], i) => {
      const g = document.createElement("span");
      g.className = "glint";
      g.textContent = "✦";
      g.setAttribute("aria-hidden", "true");
      g.style.setProperty("--gx", gx);
      g.style.setProperty("--gy", gy);
      g.style.setProperty("--gd", (i * 0.37).toFixed(2) + "s");
      g.style.setProperty("--gs", (0.55 + Math.random() * 0.5).toFixed(2) + "rem");
      g.style.setProperty("--gc", i % 3 === 2 ? "#e9e7ff" : "#f0c96e");
      counter.appendChild(g);
    });
  }

  /* ============================================================
     TIMELINE — scroll-driven progress line
     ============================================================ */
  function initTimeline() {
    const tl = $("tl");
    const bar = $("tl-progress");
    const items = Array.from(tl.querySelectorAll(".tl__item"));
    scrollFx.push(() => {
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = clamp01((vh * 0.72 - r.top) / r.height);
      bar.style.height = (prog * 100).toFixed(1) + "%";
      const lineY = r.top + prog * r.height;
      for (const it of items) {
        it.classList.toggle("lit", it.getBoundingClientRect().top + 14 <= lineY);
      }
    });
  }

  /* ============================================================
     RECKONING — pulse beams + dashboard tilt-up
     ============================================================ */
  function initBeams() {
    document.querySelectorAll(".beams__pulse").forEach((p) => p.setAttribute("pathLength", "1000"));
  }

  function initDashboard() {
    const dash = $("dash");
    scrollFx.push(() => {
      const r = dash.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = clamp01((vh * 0.92 - r.top) / (vh * 0.55));
      dash.style.setProperty("--tilt", ((1 - prog) * 22).toFixed(2) + "deg");
      dash.style.setProperty("--dsc", (0.94 + prog * 0.06).toFixed(3));
    });
  }

  /* ============================================================
     TESTIMONIALS — stacked avatars + crossfading quotes
     ============================================================ */
  function initTestimonials(autoplay) {
    const avatars = Array.from(document.querySelectorAll(".testi__avatar"));
    const quotes = Array.from(document.querySelectorAll(".testi__quote"));
    const wrap = $("testi-wrap");
    const N = quotes.length;
    let idx = 0, timer = 0;

    function render() {
      avatars.forEach((a) => a.setAttribute("data-pos", String((Number(a.dataset.i) - idx + N) % N)));
      quotes.forEach((q) => q.classList.toggle("is-active", Number(q.dataset.i) === idx));
    }
    function next(step) {
      idx = (idx + step + N) % N;
      render();
    }
    $("testi-prev").addEventListener("click", () => { next(-1); restart(); });
    $("testi-next").addEventListener("click", () => { next(1); restart(); });

    function restart() {
      if (!autoplay) return;
      clearInterval(timer);
      timer = setInterval(() => next(1), 5200);
    }
    if (autoplay) {
      restart();
      wrap.addEventListener("pointerenter", () => clearInterval(timer));
      wrap.addEventListener("pointerleave", restart);
      new IntersectionObserver((es) => {
        if (es[0].isIntersecting) restart();
        else clearInterval(timer);
      }).observe(wrap);
    }
    render();
  }

  /* ============================================================
     PRIVACY — evervault-style scrambling matrix
     ============================================================ */
  function initVault() {
    if (isCoarse) return;
    const vault = $("vault");
    const matrix = $("vault-matrix");
    const CHARS = "ABCDEF0123456789abcdef$&#@%*+=?!<>[]{}";
    let timer = 0;

    function scramble() {
      let out = "";
      for (let i = 0; i < 900; i++) out += CHARS[(Math.random() * CHARS.length) | 0];
      matrix.textContent = out;
    }
    scramble();

    vault.addEventListener("pointermove", (e) => {
      const r = vault.getBoundingClientRect();
      matrix.style.setProperty("--mx", (e.clientX - r.left) + "px");
      matrix.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    vault.addEventListener("pointerenter", () => {
      clearInterval(timer);
      timer = setInterval(scramble, 90);
    });
    vault.addEventListener("pointerleave", () => clearInterval(timer));
  }

  /* ============================================================
     LAMP — scroll-driven: widens as you approach, reverses back
     ============================================================ */
  function initLamp() {
    const cta = $("cta");
    const lamp = cta.querySelector(".lamp");
    let lp = 0;
    scrollFx.push(() => {
      const r = lamp.getBoundingClientRect();
      const vh = window.innerHeight;
      const target = clamp01((vh * 0.92 - r.top) / (vh * 0.6));
      lp += (target - lp) * 0.18;
      if (Math.abs(target - lp) < 0.001) lp = target;
      cta.style.setProperty("--lp", lp.toFixed(4));
    });
  }

  /* ============================================================
     CTA — every primary action leads to /login (waitlist until
     Google auth ships)
     ============================================================ */
  function initCtaButton() {
    const cta = $("cta-btn");
    const label = cta.querySelector("span");
    cta.addEventListener("click", () => {
      label.textContent = "Summoning…";
      setTimeout(() => (window.location.href = "/login"), 350);
    });
    document.querySelectorAll(".btn-gold").forEach((b) =>
      b.addEventListener("click", () => (window.location.href = "/login"))
    );
  }
})();
