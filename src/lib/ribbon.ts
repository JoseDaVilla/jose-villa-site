// The hero's hairline ribbons, shared by the server render (t = 0) and the
// client loop that lets them drift and part around the cursor.
export const RW = 1440, RH = 900, STEPS = 72;

export interface Ribbon { n: number; y: (i: number, u: number, t: number) => number }

const { sin, cos, abs, PI } = Math;
export const ribbons: Ribbon[] = [
  // Main band: a wide S-curve across the lower half.
  {
    n: 26,
    y: (i, u, t) => {
      const spread = 8 * (0.18 + abs(cos(u * PI * 1.35 + 0.5 + t * 0.12)));
      return RH * 0.62 + sin(u * PI * 1.7 + 0.4 + t * 0.22) * 190 + (i - 13) * spread + sin(u * 9 + i * 0.12 + t * 0.7) * 5;
    },
  },
  // A thinner band crossing the top, drifting the other way.
  {
    n: 14,
    y: (i, u, t) => {
      const spread = 7 * (0.2 + abs(cos(u * PI * 1.1 + 1.6 - t * 0.1)));
      return RH * 0.26 + sin(u * PI * 1.25 + 2.3 - t * 0.18) * 140 + (i - 7) * spread + sin(u * 7 - i * 0.2 - t * 0.6) * 4;
    },
  },
];

export const ribbonPoints = (r: Ribbon, i: number, t: number) =>
  Array.from({ length: STEPS + 1 }, (_, k) => [(k / STEPS) * RW, r.y(i, k / STEPS, t)] as const);

export const toPath = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
