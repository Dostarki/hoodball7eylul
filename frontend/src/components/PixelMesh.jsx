import React, { useEffect, useRef } from 'react';

const CELL = 6;
const GAP = 2;
const GREENS = ['#2f7a3e', '#3f9a4f', '#5cb56b', '#8fd39a'];

const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const draw = (canvas, w, h, { dense, radial }) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const rnd = seeded(dense ? 2026 : 1907);
  const step = CELL + GAP;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);

  for (let y = 0; y < rows; y++) {
    const t = y / rows;
    const density = dense ? 0.85 : Math.pow(1 - t, 2.2) * 0.5 + 0.012;
    for (let x = 0; x < cols; x++) {
      const checker = (x + y) % 2 === 0;
      const r = rnd();
      if (r > density * (checker ? 1 : 0.55)) continue;
      const shadeIdx = dense ? Math.floor(rnd() * GREENS.length) : Math.floor(rnd() * GREENS.length * (0.6 + t));
      ctx.fillStyle = GREENS[Math.min(GREENS.length - 1, shadeIdx)];
      let alpha = dense ? 0.55 + rnd() * 0.35 : 0.22 + (1 - t) * 0.42;
      if (radial) {
        const dx = (x / cols - 0.5) * 2;
        const dy = (y / rows - 0.5) * 2;
        const d = Math.sqrt(dx * dx + dy * dy);
        alpha *= Math.max(0, 1 - Math.pow(d, 2.5));
      }
      ctx.globalAlpha = alpha;
      ctx.fillRect(x * step, y * step, CELL, CELL);
      if (rnd() < (dense ? 0.12 : 0.08 * (1 - t))) {
        ctx.fillRect((x + 1) * step, y * step, CELL, CELL);
        ctx.fillRect(x * step, (y + 1) * step, CELL, CELL);
      }
    }
  }
  ctx.globalAlpha = 1;
};

export const PixelMesh = ({ dense = false, radial = false, className = 'pixel-mesh', testId = 'pixel-mesh-bg' }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const target = dense ? canvas.parentElement : null;
    const render = () => {
      const w = target ? target.clientWidth : window.innerWidth;
      const h = target ? target.clientHeight : window.innerHeight;
      draw(canvas, w, h, { dense, radial });
    };
    render();
    let raf;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };
    const ro = target ? new ResizeObserver(schedule) : null;
    if (ro) ro.observe(target);
    else window.addEventListener('resize', schedule);
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [dense, radial]);

  return <canvas ref={ref} data-testid={testId} aria-hidden="true" className={className} />;
};

export default PixelMesh;
