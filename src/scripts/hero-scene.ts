// Hero 3D: the JV monogram as a studio object. A satin-black J and a frosted
// orange glass blade (the mark's fade, made physical) stand on two stacked
// plinths under soft room light. The pieces assemble on load; then the piece
// turns slowly and follows the cursor on hover.
import { ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, PlaneGeometry, Shape, ShadowMaterial, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createStage, easeOut, swayer } from './scene-kit';

// JVMark.astro geometry (viewBox 8 0 90 100, y down) mapped to world units, centred.
const S = 1 / 36;
const P = (x: number, y: number): [number, number] => [(x - 53) * S, (50 - y) * S];

function jShape() {
  const s = new Shape();
  s.moveTo(...P(14, 0));
  s.lineTo(...P(38, 0));
  s.lineTo(...P(56, 72));
  const [cx, cy] = P(32, 72);
  s.absarc(cx, cy, 24 * S, 0, Math.PI, true);
  s.lineTo(...P(32, 72));
  s.closePath();
  return s;
}
function armShape() {
  const s = new Shape();
  s.moveTo(...P(74, 0));
  s.lineTo(...P(98, 0));
  s.lineTo(...P(64, 100));
  s.lineTo(...P(42, 100));
  s.closePath();
  return s;
}
const extrude = (shape: Shape, depth: number) => {
  const g = new ExtrudeGeometry(shape, {
    depth, curveSegments: 48, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 5,
  });
  g.translate(0, 0, -depth / 2);
  return g;
};

export function mountHeroScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 11.5, fov: 28, soft: true });
  const { scene, key, track } = stage;
  key.position.set(-3.5, 8, 6);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -4;
  sc.right = sc.top = 4;
  sc.near = 1;
  sc.far = 25;

  const mats: { dispose: () => void }[] = [];
  const physical = (o: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) => {
    const m = new MeshPhysicalMaterial(o);
    mats.push(m);
    return m;
  };
  const ink = physical({ color: '#1C1916', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.22 });
  const glass = physical({
    color: '#FF9A5C', roughness: 0.1, transmission: 0.9, thickness: 0.7, ior: 1.45,
    attenuationColor: '#E8561F', attenuationDistance: 0.55, clearcoat: 1, transparent: true,
  });
  const stone = physical({ color: '#F1EDE7', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const stoneLow = physical({ color: '#E4DED6', roughness: 0.6 });

  const mesh = (geo: BufferGeometry, m: MeshPhysicalMaterial, cast = true) => {
    const x = new Mesh(track(geo), m);
    x.castShadow = cast;
    x.receiveShadow = true;
    return x;
  };

  // The outer group holds a fixed three-quarter view; the inner one sways.
  const view = new Group();
  view.rotation.set(0.3, -0.42, 0);
  view.position.y = 0.35;
  view.scale.setScalar(0.82);
  scene.add(view);
  const rig = new Group();
  view.add(rig);

  // Plinths.
  const base = mesh(new RoundedBoxGeometry(4.2, 0.28, 2.5, 6, 0.13), stoneLow);
  base.position.y = -1.86;
  const top = mesh(new RoundedBoxGeometry(3.5, 0.24, 2.0, 6, 0.11), stone);
  top.position.y = -1.6;
  rig.add(base, top);

  // The monogram stands on the top plinth.
  const mark = new Group();
  const j = mesh(extrude(jShape(), 0.42), ink);
  const arm = mesh(extrude(armShape(), 0.36), glass, false);
  arm.position.z = 0.05;
  mark.add(j, arm);
  const restY = -1.48 + 50 * S;
  mark.position.y = restY;
  rig.add(mark);

  // Soft contact shadow on an invisible floor.
  const floorMat = new ShadowMaterial({ opacity: 0.1 });
  mats.push(floorMat);
  const floor = new Mesh(track(new PlaneGeometry(14, 14)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.0;
  floor.receiveShadow = true;
  rig.add(floor);

  const sway = swayer({ idle: 0.5, reach: 0.65 });
  stage.run((t) => {
    // Assemble like the intro: the J slides down its diagonal, then the blade falls in.
    const a = easeOut((t - 0.1) / 0.9);
    const b = easeOut((t - 0.5) / 0.9);
    j.position.set(-(1 - a) * 18 * S, (1 - a) * 72 * S, 0);
    j.scale.setScalar(Math.max(0.001, a));
    arm.position.set((1 - b) * 34 * S, (1 - b) * 100 * S, 0.05);
    glass.opacity = b;
    arm.visible = b > 0.01;

    sway.apply(rig, t, stage.pointer);
    rig.position.y = Math.sin(t * 0.8) * 0.05;
    mark.position.y = restY + Math.sin(t * 1.1) * 0.04;
  });

  return () => {
    mats.forEach((m) => m.dispose());
    stage.dispose();
  };
}
