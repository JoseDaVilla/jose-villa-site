// Experience 3D: a deck of role cards that keeps reshuffling. Every few
// seconds the front card swings out to the side and slides in at the back,
// like flipping through a résumé. Same toon-and-ink look as the hero window.
import { Group, Mesh, SphereGeometry } from 'three';
import { PALETTE, blobGeometry, createStage, easeOut, plate, swayer } from './scene-kit';

const CW = 2.7, CH = 1.75;
const HOLD = 1.6, MOVE = 1.0; // seconds each card rests, then travels

const slot = (s: number) => ({ x: s * 0.26, y: s * 0.24, z: -s * 0.42, rz: s * 0.06 });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function mountStackScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 8 });
  const { scene, toon, inked, track } = stage;

  const paperMat = toon(PALETTE.paper);
  paperMat.emissive.set(PALETTE.paper).multiplyScalar(0.28);
  const inkMat = toon(PALETTE.ink);
  const lineMat = toon('#D9CFC1');
  const chipMat = toon(PALETTE.surface);

  const rig = new Group();
  scene.add(rig);

  // Each card: a coloured header band with a logo dot, a title, two lines and two chips.
  const accents = [PALETTE.orange, PALETTE.sky, PALETTE.leaf, PALETTE.sun];
  const cards = accents.map((accent) => {
    const card = new Group();
    card.add(inked(plate(CW, CH, 0.22, 0.12), paperMat, 0.03));
    const f = 0.12;
    const band = new Mesh(track(plate(CW - 0.2, 0.5, 0.14, 0.02, 0)), toon(accent));
    band.position.set(0, CH / 2 - 0.35, f);
    card.add(band);
    const logo = inked(new SphereGeometry(0.17, 22, 14), toon(PALETTE.paper), 0.1);
    logo.position.set(-CW / 2 + 0.4, CH / 2 - 0.35, f + 0.06);
    card.add(logo);
    const bits: [number, number, number, typeof inkMat][] = [
      [1.2, 0.13, 0.12, inkMat],
      [1.7, 0.09, -0.12, lineMat],
      [1.3, 0.09, -0.3, lineMat],
    ];
    bits.forEach(([w, h, y, m]) => {
      const l = new Mesh(track(plate(w, h, h / 2, 0.02, 0)), m);
      l.position.set(-CW / 2 + 0.25 + w / 2, y, f);
      card.add(l);
    });
    [0.5, 0.42].forEach((w, i) => {
      const c = new Mesh(track(plate(w, 0.2, 0.1, 0.02, 0)), chipMat);
      c.position.set(-CW / 2 + 0.25 + w / 2 + i * 0.6, -CH / 2 + 0.3, f);
      card.add(c);
    });
    rig.add(card);
    return card;
  });
  const N = cards.length;

  const blobs = [
    { r: 0.4, color: PALETTE.sky, pos: [-2.4, 1.35, -1.2], seed: 5.1 },
    { r: 0.3, color: PALETTE.orange, pos: [2.35, -1.35, 0.4], seed: 6.3 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], phase: i * 2.1 };
    scene.add(m);
    return m;
  });

  const sway = swayer({ idle: 0.6, reach: 0.8 });
  stage.run((t) => {
    rig.scale.setScalar(0.85 + 0.15 * easeOut(t / 1));
    sway.apply(rig, t, stage.pointer);
    rig.position.set(-0.35, -0.25 + Math.sin(t * 0.8) * 0.07, 0);

    const k = t / (HOLD + MOVE);
    const step = Math.floor(k);
    const f = smooth(((k - step) * (HOLD + MOVE) - HOLD) / MOVE);
    cards.forEach((card, i) => {
      const s = (((i - step) % N) + N) % N;
      const to = s === 0 ? N - 1 : s - 1;
      const a = slot(s), b = slot(to);
      const arc = s === 0 ? Math.sin(f * Math.PI) : 0;
      card.position.set(lerp(a.x, b.x, f) + arc * 3.1, lerp(a.y, b.y, f) + arc * 0.5, lerp(a.z, b.z, f) + arc * 0.6);
      card.rotation.set(0, -arc * 0.5, lerp(a.rz, b.rz, f) - arc * 0.35);
    });

    for (const b of blobs) {
      b.position.y = b.userData.base + Math.sin(t * 0.9 + b.userData.phase) * 0.2;
      b.rotation.set(t * 0.3, t * 0.2, 0);
    }
  });
  return stage.dispose;
}
