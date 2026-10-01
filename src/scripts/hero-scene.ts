// Hero 3D mark: a "</>" built from extruded capsules plus a few organic
// blobs. Sways on its own; follows the cursor on hover.
import { ExtrudeGeometry, Group, Shape, type BufferGeometry } from 'three';
import { PALETTE, blobGeometry, createStage, easeOut, swayer } from './scene-kit';

function capsuleGeometry(length: number, radius: number, depth: number): BufferGeometry {
  const h = length / 2;
  const s = new Shape();
  s.moveTo(-h, -radius);
  s.lineTo(h, -radius);
  s.absarc(h, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-h, radius);
  s.absarc(-h, 0, radius, Math.PI / 2, (3 * Math.PI) / 2, false);
  const g = new ExtrudeGeometry(s, {
    depth, curveSegments: 28, bevelEnabled: true,
    bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5,
  });
  g.center();
  return g;
}

export function mountHeroScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 12 });
  const { scene, toon, inked } = stage;

  // --- "</>" ---
  const mark = new Group();
  const arm = capsuleGeometry(1.35, 0.25, 0.5);
  const tilt = (38 * Math.PI) / 180;
  const chevron = (color: string, dir: 1 | -1) => {
    const c = new Group();
    const mat = toon(color);
    for (const side of [1, -1]) {
      const a = inked(arm, mat);
      a.rotation.z = side * tilt * dir;
      a.position.set(dir * Math.cos(tilt) * 0.675, side * Math.sin(tilt) * 0.675, 0);
      c.add(a);
    }
    return c;
  };
  const lt = chevron(PALETTE.orange, 1);
  lt.position.x = -2.1;
  const gt = chevron(PALETTE.sun, -1);
  gt.position.x = 2.1;
  const slash = inked(capsuleGeometry(2.3, 0.25, 0.5), toon(PALETTE.blue));
  slash.rotation.z = (68 * Math.PI) / 180;
  // Sits slightly in front so it never intersects the chevrons.
  slash.position.z = 0.25;
  mark.add(lt, slash, gt);
  scene.add(mark);

  // --- blobs ---
  const blobs = [
    { r: 0.55, color: PALETTE.sky, pos: [-2.35, 1.55, -1.4], seed: 1.3 },
    { r: 0.6, color: PALETTE.leaf, pos: [2.35, -1.55, -1.2], seed: 2.1 },
    { r: 0.3, color: PALETTE.orange, pos: [2.2, 1.7, -0.6], seed: 3.7 },
    { r: 0.28, color: PALETTE.sun, pos: [-2.05, -1.7, 0], seed: 4.4 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], baseX: b.pos[0], phase: i * 1.7 };
    scene.add(m);
    return m;
  });

  const sway = swayer();
  stage.run((t) => {
    const hover = stage.pointer.hover;
    mark.scale.setScalar(0.82 + 0.18 * easeOut(t / 1.1));
    sway.apply(mark, t, stage.pointer);
    mark.position.y = Math.sin(t * 0.8) * 0.14 * (1 - hover * 0.6);

    // The chevrons "breathe" open and closed; the slash rocks slightly.
    const breathe = Math.sin(t * 1.1) * 0.14 * (1 - hover * 0.5);
    lt.position.x = -2.1 - breathe;
    gt.position.x = 2.1 + breathe;
    slash.rotation.z = (68 * Math.PI) / 180 + Math.sin(t * 0.9) * 0.06;

    for (const b of blobs) {
      const ph = b.userData.phase;
      b.position.y = b.userData.base + Math.sin(t * 0.9 + ph) * 0.26;
      b.position.x = b.userData.baseX + Math.cos(t * 0.6 + ph) * 0.16;
      b.rotation.x = t * 0.35 + ph;
      b.rotation.y = t * 0.25;
      b.scale.setScalar(1 + Math.sin(t * 1.4 + ph) * 0.05);
    }
  });
  return stage.dispose;
}
