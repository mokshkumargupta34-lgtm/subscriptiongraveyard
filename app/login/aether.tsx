"use client";

import { useEffect, useRef } from "react";

/* Aether-flow particle network (ported from the static login page):
   drifting violet particles, connecting lines, cursor repulsion. */
export function AetherBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };
    type P = { x: number; y: number; dx: number; dy: number; size: number };
    let particles: P[] = [];
    let raf = 0;
    let running = false;

    function init() {
      particles = [];
      const n = Math.min(180, (canvas!.width * canvas!.height) / 9000);
      for (let i = 0; i < n; i++) {
        const size = Math.random() * 2 + 1;
        particles.push({
          x: Math.random() * (canvas!.width - size * 4) + size * 2,
          y: Math.random() * (canvas!.height - size * 4) + size * 2,
          dx: Math.random() * 0.4 - 0.2,
          dy: Math.random() * 0.4 - 0.2,
          size,
        });
      }
    }

    function step(p: P) {
      if (p.x > canvas!.width || p.x < 0) p.dx = -p.dx;
      if (p.y > canvas!.height || p.y < 0) p.dy = -p.dy;
      if (mouse.x !== null && mouse.y !== null) {
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (dist < mouse.radius + p.size && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (mdx / dist) * force * 5;
          p.y -= (mdy / dist) * force * 5;
        }
      }
      p.x += p.dx;
      p.y += p.dy;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(170, 155, 255, 0.8)";
      ctx!.fill();
    }

    function connect() {
      const threshold = (canvas!.width / 7) * (canvas!.height / 7);
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= threshold) continue;
          const o = Math.max(0, Math.min(1, 1 - distSq / 20000));
          if (o <= 0) continue;
          let near = false;
          if (mouse.x !== null && mouse.y !== null) {
            const mdx = particles[a].x - mouse.x;
            const mdy = particles[a].y - mouse.y;
            near = Math.sqrt(mdx * mdx + mdy * mdy) < mouse.radius;
          }
          ctx!.strokeStyle = near
            ? `rgba(233, 231, 255, ${o.toFixed(3)})`
            : `rgba(150, 135, 245, ${(o * 0.55).toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(particles[a].x, particles[a].y);
          ctx!.lineTo(particles[b].x, particles[b].y);
          ctx!.stroke();
        }
      }
    }

    function animate() {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      ctx!.fillStyle = "#07071c";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) step(p);
      connect();
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onOut = () => { mouse.x = null; mouse.y = null; };
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; animate(); }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onOut);
    document.addEventListener("visibilitychange", onVis);
    running = true;
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onOut);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="lg-aether" aria-hidden="true" />;
}
