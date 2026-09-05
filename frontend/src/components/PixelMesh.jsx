import React, { useEffect, useRef } from 'react';

const CELL = 6;
const GAP = 2;
const GREENS = ['#2f7a3e', '#3f9a4f', '#5cb56b', '#8fd39a'];

const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const setupCanvas = (canvas, w, h) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
};

const drawStatic = (canvas, w, h) => {
  const ctx = setupCanvas(canvas, w, h);
  ctx.clearRect(0, 0, w, h);
  const rnd = seeded(1907);
  const step = CELL + GAP;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  for (let y = 0; y < rows; y++) {
    const t = y / rows;
    const density = Math.pow(1 - t, 2.2) * 0.5 + 0.012;
    for (let x = 0; x < cols; x++) {
      const checker = (x + y) % 2 === 0;
      if (rnd() > density * (checker ? 1 : 0.55)) continue;
      const idx = Math.min(GREENS.length - 1, Math.floor(rnd() * GREENS.length * (0.6 + t)));
      ctx.fillStyle = GREENS[idx];
      ctx.globalAlpha = 0.22 + (1 - t) * 0.42;
      ctx.fillRect(x * step, y * step, CELL, CELL);
      if (rnd() < 0.08 * (1 - t)) {
        ctx.fillRect((x + 1) * step, y * step, CELL, CELL);
        ctx.fillRect(x * step, (y + 1) * step, CELL, CELL);
      }
    }
  }
  ctx.globalAlpha = 1;
};

const buildParticles = (w, h) => {
  const rnd = seeded(2026);
  const step = CELL + GAP;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  const list = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (rnd() > 0.96) continue;
      const dx = (x / cols - 0.5) * 2;
      const dy = (y / rows - 0.5) * 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      const fade = Math.max(0, 1 - Math.pow(d, 3.2));
      if (fade <= 0.02) continue;
      list.push({
        ox: x * step, oy: y * step, px: x * step, py: y * step, vx: 0, vy: 0,
        color: GREENS[Math.floor(rnd() * GREENS.length)],
        alpha: (0.78 + rnd() * 0.22) * fade,
      });
    }
  }
  return list;
};

const useStaticMesh = (ref) => {
  useEffect(() => {
    const canvas = ref.current;
    const render = () => drawStatic(canvas, window.innerWidth, window.innerHeight);
    render();
    let raf;
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    window.addEventListener('resize', schedule);
    return () => { window.removeEventListener('resize', schedule); cancelAnimationFrame(raf); };
  }, [ref]);
};

const useRippleMesh = (ref) => {
  useEffect(() => {
    const canvas = ref.current;
    const target = canvas.parentElement;
    let ctx, particles = [], w = 0, h = 0;
    const mouse = { x: -9999, y: -9999 };
    const RADIUS = 110;

    const rebuild = () => {
      w = target.clientWidth; h = target.clientHeight;
      ctx = setupCanvas(canvas, w, h);
      particles = buildParticles(w, h);
    };
    rebuild();

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    const ro = new ResizeObserver(rebuild);
    ro.observe(target);

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const dx = p.px - mouse.x, dy = p.py - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < RADIUS) {
          const f = (1 - dist / RADIUS) * 3.2;
          p.vx += (dx / dist) * f; p.vy += (dy / dist) * f;
        }
        p.vx += (p.ox - p.px) * 0.06; p.vy += (p.oy - p.py) * 0.06;
        p.vx *= 0.82; p.vy *= 0.82;
        p.px += p.vx; p.py += p.vy;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.px), Math.round(p.py), CELL, CELL);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [ref]);
};

const StaticMesh = ({ className, testId }) => {
  const ref = useRef(null);
  useStaticMesh(ref);
  return <canvas ref={ref} data-testid={testId} aria-hidden="true" className={className} />;
};

const RippleMesh = ({ className, testId }) => {
  const ref = useRef(null);
  useRippleMesh(ref);
  return <canvas ref={ref} data-testid={testId} aria-hidden="true" className={className} />;
};

export const PixelMesh = ({ dense = false, className = 'pixel-mesh', testId = 'pixel-mesh-bg' }) =>
  dense ? <RippleMesh className={className} testId={testId} /> : <StaticMesh className={className} testId={testId} />;

export default PixelMesh;
