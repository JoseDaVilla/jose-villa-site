// Experience 3D: a briefcase ("portafolio") whose lid swings open on a loop
// and lets three role cards float out of it, then tucks them back in.
// The body is a real open box (floor + four walls) so the cards rise out of
// a cavity instead of slicing through a solid top, and the lid swings past
// vertical so the cards pass in front of it.
import { BoxGeometry, Group, Mesh, TorusGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, blobGeometry, createStage, easeOut, swayer } from './scene-kit';

const W = 2.9, H = 1.6, D = 1.1, WALL = 0.14, LID_H = 0.4;
const DEEP_BLUE = '#1E3F8A';

export function mountBriefcaseScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 8.4 });
  const { scene, toon, inked, track } = stage;

  const rig = new Group();
  scene.add(rig);

  const shell = toon(PALETTE.blue);
  const inside = toon(DEEP_BLUE);

  // --- Hollow body: floor and four walls, top at y = 0 ---
  const body = new Group();
  const piece = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const p = inked(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.45), shell, 0.02);
    p.position.set(x, y, z);
    body.add(p);
  };
  piece(W, WALL, D, 0, -H + WALL / 2, 0);                         // floor
  piece(W, H, WALL, 0, -H / 2, D / 2 - WALL / 2);                 // front
  piece(W, H, WALL, 0, -H / 2, -D / 2 + WALL / 2);                // back
  piece(WALL, H, D - 2 * WALL, -W / 2 + WALL / 2, -H / 2, 0);     // left
  piece(WALL, H, D - 2 * WALL, W / 2 - WALL / 2, -H / 2, 0);      // right
  // Darker lining so the cavity reads as depth when the lid is open.
  const lining = new Mesh(track(new BoxGeometry(W - 2 * WALL - 0.02, 0.02, D - 2 * WALL - 0.02)), inside);
  lining.position.y = -H + WALL + 0.02;
  body.add(lining);
  rig.add(body);

  // Belt across the front.
  const sunMat = toon(PALETTE.sun);
  const belt = inked(new RoundedBoxGeometry(W + 0.06, 0.26, 0.12, 3, 0.06), sunMat, 0.03);
  belt.position.set(0, -H * 0.6, D / 2 + 0.02);
  rig.add(belt);

  // --- Lid, hinged on the back top edge ---
  const hinge = new Group();
  hinge.position.set(0, 0, -D / 2);
  rig.add(hinge);
  const lid = new Group();
  lid.position.set(0, LID_H / 2, D / 2);
  hinge.add(lid);
  lid.add(inked(new RoundedBoxGeometry(W + 0.04, LID_H, D + 0.04, 4, 0.16), shell));
  const handle = inked(new TorusGeometry(0.4, 0.1, 16, 44, Math.PI), sunMat, 0.05);
  handle.position.y = LID_H / 2 + 0.02;
  lid.add(handle);
  const claspGeo = new RoundedBoxGeometry(0.38, 0.3, 0.14, 3, 0.06);
  const orangeMat = toon(PALETTE.orange);
  for (const x of [-0.9, 0.9]) {
    const c = inked(claspGeo, orangeMat, 0.05);
    c.position.set(x, -0.02, D / 2 + 0.06);
    lid.add(c);
  }

  // --- Role cards ---
  const cardGeo = new RoundedBoxGeometry(1.75, 1.1, 0.06, 2, 0.03);
  const lineGeo = track(new BoxGeometry(1, 0.08, 0.02));
  const inkMat = toon(PALETTE.ink);
  const headMat = toon(PALETTE.orange);
  const cards = [PALETTE.paper, PALETTE.sky, PALETTE.leaf].map((color, i) => {
    const card = new Group();
    card.add(inked(cardGeo, toon(color), 0.03));
    // A heading bar and two text lines, like a résumé card.
    [[0.9, 0.3, -0.27], [1.3, 0.07, 0], [1.0, -0.15, -0.14]].forEach(([w, y, x], j) => {
      const l = new Mesh(lineGeo, j === 0 ? headMat : inkMat);
      l.scale.set(w, j === 0 ? 1.6 : 1, 1);
      l.position.set(x, y, 0.045);
      card.add(l);
    });
    // Slightly forward of centre so the open lid (behind) never meets them.
    const z = 0.12 + (i - 1) * 0.12;
    card.userData = { phase: i * 0.16, x: (i - 1) * 0.4, rz: (i - 1) * -0.2, z };
    card.position.set(card.userData.x, -1.0, z);
    rig.add(card);
    return card;
  });

  // Drifting blobs tie it to the hero.
  const blobs = [
    { r: 0.42, color: PALETTE.sky, pos: [-2.5, 1.5, -1], seed: 5.1 },
    { r: 0.34, color: PALETTE.sun, pos: [2.5, -1.3, -0.4], seed: 6.3 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], phase: i * 2.1 };
    scene.add(m);
    return m;
  });

  const BASE_Y = -0.4;
  const sway = swayer({ idle: 0.75 });
  const CYCLE = 6.5; // seconds: open, show cards, close, rest
  stage.run((t) => {
    sway.apply(rig, t, stage.pointer);
    rig.position.y = BASE_Y + Math.sin(t * 0.8) * 0.08;

    const c = (t % CYCLE) / CYCLE;
    // 0-0.14 opening, hold, 0.66-0.8 closing, then rest closed.
    const open = c < 0.14 ? easeOut(c / 0.14) : c < 0.66 ? 1 : c < 0.8 ? 1 - easeOut((c - 0.66) / 0.14) : 0;
    hinge.rotation.x = -open * 1.95; // past vertical, leaning back

    cards.forEach((card) => {
      const { phase, x, rz } = card.userData;
      // Cards only start rising once the lid is well out of the way.
      const lift = easeOut((open - 0.35 - phase) / (0.65 - phase));
      const clear = Math.max(0, lift - 0.45) / 0.55; // spread only above the rim
      card.position.y = -1.0 + lift * (1.7 + phase * 0.9) + Math.sin(t * 2 + phase * 10) * 0.04 * lift;
      // Straight while inside the walls; fan out and tilt once above the rim.
      card.position.x = x * (1 + clear * 1.2);
      card.rotation.z = rz * clear * 2;
      card.visible = lift > 0.01;
    });

    for (const b of blobs) {
      b.position.y = b.userData.base + Math.sin(t * 0.9 + b.userData.phase) * 0.2;
      b.rotation.set(t * 0.3, t * 0.2, 0);
    }
  });
  return stage.dispose;
}
