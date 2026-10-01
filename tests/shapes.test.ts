import { describe, expect, it } from 'vitest';
import { blobPath, rng, smoothPath, wavePath } from '../src/lib/shapes';

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('rng', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = rng(7), b = rng(7);
    for (let i = 0; i < 50; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('blobPath', () => {
  it('returns the same closed path for the same seed', () => {
    expect(blobPath(3)).toBe(blobPath(3));
    expect(blobPath(3)).not.toBe(blobPath(4));
    expect(blobPath(3).endsWith('Z')).toBe(true);
  });

  it('keeps its anchor points inside the 100x100 box', () => {
    const d = blobPath(11, 7, 0.4);
    // Every 6th number after the move-to is an on-curve point; all coordinates
    // should stay near the box (control points may bulge slightly).
    for (const n of numbers(d)) {
      expect(n).toBeGreaterThan(-10);
      expect(n).toBeLessThan(110);
    }
  });

  it('draws one cubic segment per control point', () => {
    expect(blobPath(5, 6).match(/C/g)).toHaveLength(6);
  });
});

describe('wavePath', () => {
  it('spans the full width and closes along the bottom', () => {
    const d = wavePath(2, 1000, 140, 60, 20, 5);
    expect(d.startsWith('M0.0,')).toBe(true);
    expect(d).toContain('L1000,140 L0,140 Z');
    expect(d.match(/C/g)).toHaveLength(5);
  });
});

describe('smoothPath', () => {
  it('passes through every input point', () => {
    const pts: [number, number][] = [[0, 0], [10, 5], [20, 0], [30, 5]];
    const d = smoothPath(pts, false);
    for (const [x, y] of pts.slice(1)) expect(d).toContain(` ${x.toFixed(1)},${y.toFixed(1)}`);
  });
});
