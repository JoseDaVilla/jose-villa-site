// Hero 3D: an app window that keeps itself busy. A dashboard with a live bar
// chart, plus two cards floating in front of it (a validated lead and a POS
// receipt), the kind of tools the site is about. Sways on its own; follows the
// cursor on hover.
import { Group, Mesh, SphereGeometry, type BufferGeometry, type Material } from 'three';
import { PALETTE, blobGeometry, createStage, easeOut, plate, swayer } from './scene-kit';

export function mountHeroScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 12 });
  const { scene, toon, inked, track } = stage;
  // Paper surfaces get a touch of self-light so they read white, not grey.
  const paper = () => {
    const m = toon(PALETTE.paper);
    m.emissive.set(PALETTE.paper).multiplyScalar(0.28);
    return m;
  };

  // Flat details on a face: no outline, sitting just above the surface.
  const decal = (geo: BufferGeometry, mat: Material, x: number, y: number, z: number) => {
    const m = new Mesh(track(geo), mat);
    m.position.set(x, y, z);
    return m;
  };

  const rig = new Group();
  scene.add(rig);

  // --- window ---
  const W = 4.6, H = 3.2, D = 0.28;
  const win = new Group();
  win.add(inked(plate(W, H, 0.32, D), paper(), 0.03));
  const face = D / 2 + 0.07;

  // Title bar: a band with three dots.
  const barMat = toon(PALETTE.bg);
  win.add(decal(plate(W - 0.24, 0.42, 0.16, 0.02, 0), barMat, 0, H / 2 - 0.34, face));
  [PALETTE.orange, PALETTE.sun, PALETTE.leaf].forEach((c, i) => {
    const dot = inked(new SphereGeometry(0.085, 20, 14), toon(c), 0.12);
    dot.position.set(-W / 2 + 0.38 + i * 0.28, H / 2 - 0.34, face + 0.04);
    win.add(dot);
  });

  // Sidebar and text lines.
  win.add(decal(plate(0.9, H - 0.95, 0.14, 0.02, 0), toon(PALETTE.sky), -W / 2 + 0.6, -0.28, face));
  const lineMat = toon('#D9CFC1');
  for (let i = 0; i < 4; i++) {
    win.add(decal(plate(0.5, 0.09, 0.045, 0.02, 0), paper(), -W / 2 + 0.56, 0.62 - i * 0.34, face + 0.02));
  }
  win.add(decal(plate(1.7, 0.16, 0.08, 0.02, 0), toon(PALETTE.ink), -0.05, 0.75, face));
  win.add(decal(plate(1.15, 0.1, 0.05, 0.02, 0), lineMat, -0.33, 0.48, face));

  // Bar chart: heights ease towards a new set every few seconds.
  const barColors = [PALETTE.blue, PALETTE.blue, PALETTE.orange, PALETTE.blue, PALETTE.blue];
  const bars = barColors.map((c, i) => {
    const geo = track(plate(0.3, 1, 0.08, 0.12, 0));
    geo.translate(0, 0.5, 0); // grow from the baseline
    const b = new Mesh(geo, toon(c));
    b.position.set(-0.75 + i * 0.46, -1.25, face + 0.04);
    b.scale.y = 0.05;
    win.add(b);
    return b;
  });
  const sets = [
    [0.55, 0.85, 1.35, 0.95, 1.2],
    [0.7, 0.6, 1.5, 1.1, 0.9],
    [0.45, 1.0, 1.25, 1.3, 1.05],
  ];
  win.add(decal(plate(2.4, 0.05, 0.02, 0.02, 0), lineMat, 0.17, -1.27, face));
  rig.add(win);

  // --- lead card (top right): avatar, two lines, a check that pops ---
  const lead = new Group();
  lead.add(inked(plate(2.0, 0.84, 0.22, 0.16), paper(), 0.04));
  const avatar = inked(new SphereGeometry(0.22, 24, 16), toon(PALETTE.leaf), 0.08);
  avatar.position.set(-0.62, 0, 0.16);
  lead.add(avatar);
  lead.add(decal(plate(0.8, 0.11, 0.05, 0.02, 0), toon(PALETTE.ink), 0.05, 0.12, 0.15));
  lead.add(decal(plate(0.55, 0.09, 0.045, 0.02, 0), lineMat, -0.07, -0.13, 0.15));
  const check = new Group();
  check.add(inked(new SphereGeometry(0.2, 24, 16), toon(PALETTE.leaf), 0.1));
  const tick = new Group();
  const tickMat = toon(PALETTE.ink);
  const t1 = decal(plate(0.16, 0.05, 0.025, 0.04, 0), tickMat, -0.04, -0.02, 0.23);
  t1.rotation.z = -0.8;
  const t2 = decal(plate(0.28, 0.05, 0.025, 0.04, 0), tickMat, 0.05, 0.03, 0.23);
  t2.rotation.z = 0.9;
  tick.add(t1, t2);
  check.add(tick);
  check.position.set(0.72, 0, 0.18);
  lead.add(check);
  lead.position.set(1.6, 1.25, 1.1);
  lead.rotation.set(0.05, -0.18, 0.06);
  rig.add(lead);

  // --- POS receipt (bottom left) ---
  const receipt = new Group();
  receipt.add(inked(plate(1.15, 1.55, 0.16, 0.14), paper(), 0.04));
  for (let i = 0; i < 3; i++) {
    receipt.add(decal(plate(i === 1 ? 0.55 : 0.75, 0.08, 0.04, 0.02, 0), lineMat, i === 1 ? -0.1 : 0, 0.45 - i * 0.24, 0.14));
  }
  receipt.add(decal(plate(0.8, 0.26, 0.1, 0.02, 0), toon(PALETTE.sun), 0, -0.42, 0.14));
  receipt.position.set(-1.95, -1.2, 1.2);
  receipt.rotation.set(-0.04, 0.2, -0.08);
  rig.add(receipt);

  // --- a couple of brand blobs ---
  const blobs = [
    { r: 0.36, color: PALETTE.orange, pos: [2.55, -1.45, 0.3], seed: 3.7 },
    { r: 0.24, color: PALETTE.sky, pos: [-2.45, 1.6, -0.4], seed: 1.3 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], phase: i * 2.1 };
    rig.add(m);
    return m;
  });

  const sway = swayer({ idle: 0.7, reach: 0.8 });
  stage.run((t) => {
    const hover = stage.pointer.hover;
    rig.scale.setScalar(0.8 + 0.14 * easeOut(t / 1.1));
    sway.apply(rig, t, stage.pointer);
    rig.position.y = Math.sin(t * 0.8) * 0.1 * (1 - hover * 0.6);

    // Chart: grow in, then drift between data sets.
    const set = sets[Math.floor(t / 3.2) % sets.length];
    const grow = easeOut((t - 0.3) / 1.2);
    bars.forEach((b, i) => {
      const target = Math.max(0.05, set[i] * grow);
      b.scale.y += (target - b.scale.y) * 0.06;
    });

    // Cards float a little out of phase; the check re-pops every few seconds.
    lead.position.y = 1.25 + Math.sin(t * 1.1) * 0.08;
    receipt.position.y = -1.2 + Math.sin(t * 0.9 + 1.4) * 0.09;
    const beat = (t % 3.2) / 3.2;
    check.scale.setScalar(beat < 0.12 ? 0.6 + 0.4 * easeOut(beat / 0.12) * (1 + 0.25 * Math.sin((beat / 0.12) * Math.PI)) : 1);

    for (const b of blobs) {
      const ph = b.userData.phase;
      b.position.y = b.userData.base + Math.sin(t * 0.9 + ph) * 0.18;
      b.rotation.x = t * 0.35 + ph;
      b.rotation.y = t * 0.25;
    }
  });
  return stage.dispose;
}
