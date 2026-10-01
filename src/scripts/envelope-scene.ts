// Contact 3D: an envelope whose flap opens to let a letter rise, with a paper
// plane circling it. When the form sends successfully ("contact:sent"), the
// plane takes off and comes back a few seconds later.
import {
  BoxGeometry, BufferGeometry, DoubleSide, EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute,
  Group, LineBasicMaterial, LineSegments, Mesh, Shape, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, blobGeometry, createStage, easeOut, swayer } from './scene-kit';

const W = 2.8, H = 1.8;

function slab(shape: Shape, depth: number) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function mountEnvelopeScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 9.2 });
  const { scene, toon, inked, track } = stage;

  const rig = new Group();
  rig.position.y = -0.45;
  scene.add(rig);

  // Back panel
  const back = inked(new RoundedBoxGeometry(W, H, 0.12, 3, 0.06), toon(PALETTE.sun));
  back.position.z = -0.14;
  rig.add(back);

  // Letter: sits between back and pocket, rises out of the top.
  const letter = new Group();
  letter.add(inked(new RoundedBoxGeometry(W - 0.4, H - 0.3, 0.04, 2, 0.03), toon(PALETTE.paper), 0.03));
  const lineGeo = track(new BoxGeometry(1, 0.08, 0.02));
  const inkMat = toon(PALETTE.ink);
  const blueMat = toon(PALETTE.blue);
  [[0.8, 0.5, -0.55, blueMat], [1.7, 0.22, 0, inkMat], [1.7, 0, 0, inkMat], [1.2, -0.22, -0.25, inkMat]].forEach(([w, y, x, m]) => {
    const l = new Mesh(lineGeo, m as typeof inkMat);
    l.scale.x = w as number;
    l.position.set(x as number, y as number, 0.035);
    letter.add(l);
  });
  rig.add(letter);

  // Front pocket with the classic V notch.
  const pocket = new Shape();
  pocket.moveTo(-W / 2, -H / 2);
  pocket.lineTo(W / 2, -H / 2);
  pocket.lineTo(W / 2, H * 0.22);
  pocket.lineTo(0, -H * 0.12);
  pocket.lineTo(-W / 2, H * 0.22);
  pocket.closePath();
  const front = inked(slab(pocket, 0.06), toon(PALETTE.orange), 0.02);
  front.position.z = 0.1;
  rig.add(front);

  // Top flap, hinged along the top edge.
  const flapShape = new Shape();
  flapShape.moveTo(-W / 2, 0);
  flapShape.lineTo(W / 2, 0);
  flapShape.lineTo(0, -H * 0.58);
  flapShape.closePath();
  const hinge = new Group();
  hinge.position.set(0, H / 2, 0.12);
  hinge.add(inked(slab(flapShape, 0.05), toon(PALETTE.orange), 0.02));
  rig.add(hinge);

  // Paper plane: two folded wings and a keel, nose along +z, with ink edges.
  const nose = [0, 0, 0.9], tailL = [-0.62, 0.12, -0.55], tailR = [0.62, 0.12, -0.55];
  const tailC = [0, 0.02, -0.55], keel = [0, -0.26, -0.55];
  const planeGeo = track(new BufferGeometry());
  planeGeo.setAttribute('position', new Float32BufferAttribute([
    ...nose, ...tailL, ...tailC,
    ...nose, ...tailC, ...tailR,
    ...nose, ...keel, ...tailC,
  ], 3));
  planeGeo.computeVertexNormals();
  const planeMat = toon(PALETTE.sky);
  planeMat.side = DoubleSide;
  const edges = track(new EdgesGeometry(planeGeo));
  const edgeMat = new LineBasicMaterial({ color: PALETTE.ink });
  const plane = new Group();
  plane.add(new Mesh(planeGeo, planeMat), new LineSegments(edges, edgeMat));
  plane.scale.setScalar(1.15);
  scene.add(plane);

  const blob = inked(blobGeometry(0.36, 7.7), toon(PALETTE.leaf), 0.06);
  blob.position.set(-2.4, -1.3, -0.8);
  scene.add(blob);

  // Take-off when the contact form reports a successful send.
  let launchAt = -1;
  const onSent = () => { launchAt = performance.now(); };
  window.addEventListener('contact:sent', onSent);

  const orbit = (t: number) => new Vector3(Math.cos(t) * 2.5, 1.15 + Math.sin(t * 2) * 0.35, Math.sin(t) * 1.4);
  const sway = swayer({ idle: 0.7 });
  const CYCLE = 6;
  stage.run((t) => {
    sway.apply(rig, t, stage.pointer);
    rig.position.y = -0.45 + Math.sin(t * 0.8) * 0.07;

    const c = (t % CYCLE) / CYCLE;
    // flap opens 0-0.15, letter up 0.15-0.32, hold, letter down 0.62-0.76, flap closes 0.76-0.9
    const flap = c < 0.15 ? easeOut(c / 0.15) : c < 0.76 ? 1 : c < 0.9 ? 1 - easeOut((c - 0.76) / 0.14) : 0;
    hinge.rotation.x = -flap * Math.PI * 0.98;
    // Once past vertical the flap tucks behind the letter so they never cross.
    hinge.position.z = 0.12 - Math.max(0, flap - 0.5) * 2 * 0.36;
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

    blob.position.y = -1.3 + Math.sin(t * 0.9) * 0.2;
    blob.rotation.set(t * 0.3, t * 0.2, 0);
  });

  return () => {
    window.removeEventListener('contact:sent', onSent);
    edgeMat.dispose();
    stage.dispose();
  };
}
