// Haikei-style organic shapes, generated at build time as SVG path data.
// Seeded so every build draws the same shapes (stable layout, cacheable HTML).

export type Point = [number, number];

/** Small deterministic PRNG (LCG). Same seed -> same sequence. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

const f = (n: number) => n.toFixed(1);

/** Catmull-Rom spline through the points, as cubic Bézier path commands. */
export function smoothPath(pts: Point[], closed: boolean): string {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.min(Math.max(i, 0), n - 1)]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/**
 * Closed organic blob inside a 100x100 box.
 * @param points  number of control points (5-8 reads as organic)
 * @param vary    radius variance, 0 = circle, 0.4 = very irregular
 */
export function blobPath(seed: number, points = 7, vary = 0.3): string {
  const r = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const radius = 50 * (1 - vary / 2 + r() * vary);
    pts.push([50 + Math.cos(a) * radius, 50 + Math.sin(a) * radius]);
  }
  return smoothPath(pts, true);
}

/**
 * Wave band: a smooth top edge around `base` (±amp), filled down to `height`.
 * Stack several with increasing `base` for Haikei's layered-waves look.
 */
export function wavePath(seed: number, width: number, height: number, base: number, amp: number, steps = 6): string {
  const r = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) pts.push([(i / steps) * width, base + (r() - 0.5) * 2 * amp]);
  return `${smoothPath(pts, false)} L${width},${height} L0,${height} Z`;
}
