// Experience 3D: a briefcase ("portafolio") whose lid swings open on a loop
// and lets three role cards float out, then tucks them back in.
import { BoxGeometry, Group, Mesh, TorusGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, blobGeometry, createStage, easeOut, swayer } from './scene-kit';

const W = 2.8, BODY_H = 1.55, D = 1.0, LID_H = 0.42;

export function mountBriefcaseScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 9.4 });
  const { scene, toon, inked, track } = stage;

  const rig = new Group();
  rig.position.y = -0.35;
  scene.add(rig);

  // Body
  const body = inked(new RoundedBoxGeometry(W, BODY_H, D, 5, 0.18), toon(PALETTE.orange));
  body.position.y = -BODY_H / 2;
  rig.add(body);
  // Belt across the front
  const belt = inked(new RoundedBoxGeometry(W + 0.04, 0.22, D + 0.04, 3, 0.08), toon(PALETTE.blue), 0.03);
  belt.position.y = -BODY_H * 0.62;
  rig.add(belt);

  // Lid hinged along the back top edge: the pivot sits at the hinge.
  const hinge = new Group();
  hinge.position.set(0, 0, -D / 2);
  rig.add(hinge);
  const lid = new Group();
  lid.position.set(0, LID_H / 2, D / 2);
  hinge.add(lid);
  lid.add(inked(new RoundedBoxGeometry(W, LID_H, D, 5, 0.16), toon(PALETTE.orange)));
  // Handle on the lid
  const handle = inked(new TorusGeometry(0.38, 0.09, 14, 40, Math.PI), toon(PALETTE.blue), 0.05);
  handle.position.y = LID_H / 2 + 0.02;
  lid.add(handle);
  // Clasps on the front of the lid
  const claspGeo = new RoundedBoxGeometry(0.34, 0.26, 0.12, 3, 0.05);
  for (const x of [-0.85, 0.85]) {
    const c = inked(claspGeo, toon(PALETTE.sun), 0.06);
    c.position.set(x, -0.02, D / 2 + 0.04);
    lid.add(c);
  }

  // Role cards: start inside the body, rise when the lid opens.
  const cardGeo = new RoundedBoxGeometry(1.7, 1.05, 0.05, 2, 0.04);
  const lineGeo = track(new BoxGeometry(1, 0.07, 0.02));
  const inkMat = toon(PALETTE.ink);
  const headMat = toon(PALETTE.orange);
  const cards = [PALETTE.paper, PALETTE.sky, PALETTE.leaf].map((color, i) => {
    const card = new Group();
    card.add(inked(cardGeo, toon(color), 0.03));
    // A heading bar and two text lines, like a résumé card.
    [[0.9, 0.28, -0.25], [1.25, 0.06, 0], [1.0, -0.14, -0.12]].forEach(([w, y, x], j) => {
      const l = new Mesh(lineGeo, j === 0 ? headMat : inkMat);
      l.scale.set(w, j === 0 ? 1.6 : 1, 1);
      l.position.set(x, y, 0.04);
      card.add(l);
    });
    card.position.set((i - 1) * 0.42, -0.6, (i - 1) * 0.18);
    card.rotation.z = (i - 1) * -0.18;
    card.userData = { phase: i * 0.18, x: (i - 1) * 0.42, rz: (i - 1) * -0.18 };
    rig.add(card);
    return card;
  });

  // A couple of drifting blobs to tie it to the hero.
  const blobs = [
    { r: 0.42, color: PALETTE.sky, pos: [-2.4, 1.4, -1], seed: 5.1 },
    { r: 0.32, color: PALETTE.sun, pos: [2.4, -1.1, -0.4], seed: 6.3 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], phase: i * 2.1 };
    scene.add(m);
    return m;
  });

  const sway = swayer({ idle: 0.8 });
  const CYCLE = 6; // seconds: open, show cards, close, rest
  stage.run((t) => {
    sway.apply(rig, t, stage.pointer);
    rig.position.y = -0.35 + Math.sin(t * 0.8) * 0.08;

    const c = (t % CYCLE) / CYCLE;
    // 0-0.15 opening, 0.15-0.65 open, 0.65-0.8 closing, then rest
    const open = c < 0.15 ? easeOut(c / 0.15) : c < 0.65 ? 1 : c < 0.8 ? 1 - easeOut((c - 0.65) / 0.15) : 0;
    hinge.rotation.x = -open * 1.15;

    cards.forEach((card) => {
      const lift = easeOut((open - card.userData.phase) / (1 - card.userData.phase));
      card.position.y = -0.6 + lift * (1.3 + card.userData.phase * 1.3) + Math.sin(t * 2 + card.userData.phase * 10) * 0.04 * lift;
      card.position.x = card.userData.x * (1 + lift * 0.9);
      card.rotation.z = card.userData.rz * (1 + lift);
      card.visible = lift > 0.01;
    });

    for (const b of blobs) {
      b.position.y = b.userData.base + Math.sin(t * 0.9 + b.userData.phase) * 0.2;
      b.rotation.set(t * 0.3, t * 0.2, 0);
    }
  });
  return stage.dispose;
}
