import React, { useEffect, useRef } from 'react';

const CELL = 6;
const GAP = 2;
const GREENS = ['#2f7a3e', '#3f9a4f', '#5cb56b', '#8fd39a'];

const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const draw = (canvas) => {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      const r = rnd();
      if (r > density * (checker ? 1 : 0.55)) continue;
      const shade = GREENS[Math.min(GREENS.length - 1, Math.floor(rnd() * GREENS.length * (0.6 + t)))];
      ctx.fillStyle = shade;
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

export const PixelMesh = () => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    draw(canvas);
    let raf;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(canvas));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      data-testid="pixel-mesh-bg"
      aria-hidden="true"
      className="pixel-mesh"
    />
  );
};

export default PixelMesh;
