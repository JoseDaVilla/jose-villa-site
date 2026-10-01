// Contact 3D: a thick, chunky envelope whose flap opens to let a letter rise,
// with a solid paper plane circling it. When the form sends successfully
// ("contact:sent"), the plane takes off and comes back a few seconds later.
import { BoxGeometry, ExtrudeGeometry, Group, Mesh, Shape, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, blobGeometry, createStage, easeOut, swayer } from './scene-kit';

const W = 2.9, H = 1.9;

/** Extrude a flat shape into a rounded slab centred on z = 0. */
function slab(shape: Shape, depth: number, bevel = 0.05) {
  const g = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function triangle(a: [number, number], b: [number, number], c: [number, number]) {
  const s = new Shape();
  s.moveTo(...a);
  s.lineTo(...b);
  s.lineTo(...c);
  s.closePath();
  return s;
}

export function mountEnvelopeScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 8.7 });
  const { scene, toon, inked, track } = stage;

  const rig = new Group();
  scene.add(rig);
  const orange = toon(PALETTE.orange);

  // Back panel: a chunky rounded slab.
  const back = inked(new RoundedBoxGeometry(W, H, 0.32, 5, 0.12), toon(PALETTE.sun), 0.04);
  back.position.z = -0.3;
  rig.add(back);

  // Letter: sits between back and pocket, rises out of the top.
  const letter = new Group();
  letter.add(inked(new RoundedBoxGeometry(W - 0.45, H - 0.35, 0.1, 3, 0.04), toon(PALETTE.paper), 0.03));
  const lineGeo = track(new BoxGeometry(1, 0.09, 0.03));
  const inkMat = toon(PALETTE.ink);
  const blueMat = toon(PALETTE.blue);
  ([[0.8, 0.52, -0.55, blueMat], [1.75, 0.24, 0, inkMat], [1.75, 0.02, 0, inkMat], [1.2, -0.2, -0.27, inkMat]] as const)
    .forEach(([w, y, x, m]) => {
      const l = new Mesh(lineGeo, m);
      l.scale.x = w;
      l.position.set(x, y, 0.06);
      letter.add(l);
    });
  letter.position.z = -0.04;
  rig.add(letter);

  // Front pocket with the classic V notch.
  const pocket = new Shape();
  pocket.moveTo(-W / 2, -H / 2);
  pocket.lineTo(W / 2, -H / 2);
  pocket.lineTo(W / 2, H * 0.22);
  pocket.lineTo(0, -H * 0.1);
  pocket.lineTo(-W / 2, H * 0.22);
  pocket.closePath();
  const front = inked(slab(pocket, 0.14), orange, 0.03);
  front.position.z = 0.16;
  rig.add(front);

  // Top flap, hinged along the top edge.
  const hinge = new Group();
  const FLAP_Z = 0.32;
  hinge.position.set(0, H / 2, FLAP_Z);
  hinge.add(inked(slab(triangle([-W / 2, 0], [W / 2, 0], [0, -H * 0.58]), 0.12), orange, 0.03));
  rig.add(hinge);

  // Solid paper plane: two wings with a slight dihedral and a keel, nose +z.
  const plane = new Group();
  const paper = toon(PALETTE.sky);
  for (const side of [-1, 1]) {
    // Wing shape in its own XY plane (y = forward), laid flat into XZ.
    const geo = slab(triangle([0, 1.0], [side * 0.7, -0.6], [0, -0.6]), 0.05, 0.02);
    geo.rotateX(Math.PI / 2);
    const wing = inked(geo, paper, 0.05);
    wing.rotation.z = side * -0.28; // tips up
    plane.add(wing);
  }
  // Keel: shape in XY (x = forward, y = up), stood upright along z.
  const keelGeo = slab(triangle([1.0, 0], [-0.6, 0], [-0.6, -0.32]), 0.05, 0.02);
  keelGeo.rotateY(-Math.PI / 2);
  plane.add(inked(keelGeo, paper, 0.05));
  plane.scale.setScalar(0.95);
  scene.add(plane);

  const blob = inked(blobGeometry(0.38, 7.7), toon(PALETTE.leaf), 0.06);
  blob.position.set(-2.5, -1.35, -0.8);
  scene.add(blob);

  // Take-off when the contact form reports a successful send.
  let launchAt = -1;
  const onSent = () => { launchAt = performance.now(); };
  window.addEventListener('contact:sent', onSent);

  const orbit = (t: number) => new Vector3(Math.cos(t) * 2.55, 1.2 + Math.sin(t * 2) * 0.35, Math.sin(t) * 1.5);
  const BASE_Y = -0.4;
  const sway = swayer({ idle: 0.7 });
  const CYCLE = 6;
  stage.run((t) => {
    sway.apply(rig, t, stage.pointer);
    rig.position.y = BASE_Y + Math.sin(t * 0.8) * 0.07;

    const c = (t % CYCLE) / CYCLE;
    // flap opens 0-0.15, letter up 0.15-0.32, hold, letter down 0.62-0.76, flap closes 0.76-0.9
    const flap = c < 0.15 ? easeOut(c / 0.15) : c < 0.76 ? 1 : c < 0.9 ? 1 - easeOut((c - 0.76) / 0.14) : 0;
    hinge.rotation.x = -flap * Math.PI * 0.98;
    // Once past vertical the flap tucks behind the back panel so it never
    // crosses the rising letter.
    hinge.position.z = FLAP_Z - Math.max(0, flap - 0.5) * 2 * 0.96;
    const up = c < 0.15 ? 0 : c < 0.32 ? easeOut((c - 0.15) / 0.17) : c < 0.62 ? 1 : c < 0.76 ? 1 - easeOut((c - 0.62) / 0.14) : 0;
    letter.position.y = -0.05 + up * 1.15;
    letter.rotation.z = up * 0.06 * Math.sin(t * 2);

    // Plane: circle the envelope, or fly off after a successful send.
    const pos = orbit(t * 0.7);
    const ahead = orbit(t * 0.7 + 0.05);
    if (launchAt > 0) {
      const s = (performance.now() - launchAt) / 1000;
      if (s < 3.2) {
        const k = easeOut(Math.min(s / 1.4, 1));
        pos.add(new Vector3(6 * k, 4 * k, -2 * k));
        ahead.add(new Vector3(6 * k + 0.4, 4 * k + 0.3, -2 * k));
      } else launchAt = -1;
    }
    plane.position.copy(pos);
    plane.lookAt(ahead);
    plane.rotateZ(Math.sin(t * 1.4) * 0.35); // bank

    blob.position.y = -1.35 + Math.sin(t * 0.9) * 0.2;
    blob.rotation.set(t * 0.3, t * 0.2, 0);
  });

  return () => {
    window.removeEventListener('contact:sent', onSent);
    stage.dispose();
  };
}
