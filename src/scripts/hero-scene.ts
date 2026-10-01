// Hero 3D mark: a "</>" built from extruded capsules with toon shading, so
// every face resolves to two or three flat tones (no gradients), plus a few
// organic blobs drifting around it. Sways on its own; follows the cursor on hover.
import {
  AmbientLight, Color, DataTexture, DirectionalLight, ExtrudeGeometry, Group,
  IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter,
  PerspectiveCamera, RedFormat, Scene, Shape, WebGLRenderer, BackSide,
  type BufferGeometry, type Material,
} from 'three';

const COLORS = {
  orange: '#FF8A3D',
  blue: '#2B59C3',
  sun: '#FFCB57',
  sky: '#9CCBFF',
  leaf: '#9FD6A8',
  ink: '#24211D',
};

/** Three-step ramp: shadow, mid, lit. NearestFilter keeps the bands hard. */
function toonRamp(): DataTexture {
  const tex = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat);
  tex.minFilter = tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

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

/** Icosphere with smooth, seeded bumps: an organic pebble. */
function blobGeometry(radius: number, seed: number): BufferGeometry {
  const g = new IcosahedronGeometry(radius, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.08 * Math.sin(x * 2.4 + seed) * Math.cos(y * 2.1 - seed) + 0.04 * Math.sin(z * 3 + seed * 2);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export function mountHeroScene(host: HTMLElement): () => void {
  const canvas = host.querySelector('canvas')!;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  scene.add(new AmbientLight(0xffffff, 1.15));
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 4, 6);
  scene.add(sun);

  const ramp = toonRamp();
  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const toon = (hex: string) => { const m = new MeshToonMaterial({ color: new Color(hex), gradientMap: ramp }); mats.push(m); return m; };
  const outline = new MeshBasicMaterial({ color: new Color(COLORS.ink), side: BackSide });
  mats.push(outline);

  /** Mesh plus an inverted-hull ink outline, like a drawn illustration. */
  const inked = (geo: BufferGeometry, mat: Material, line = 0.045) => {
    geos.push(geo);
    const g = new Group();
    g.add(new Mesh(geo, mat));
    const hull = new Mesh(geo, outline);
    hull.scale.setScalar(1 + line);
    g.add(hull);
    return g;
  };

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
  const lt = chevron(COLORS.orange, 1);
  lt.position.x = -2.1;
  const gt = chevron(COLORS.sun, -1);
  gt.position.x = 2.1;
  const slash = inked(capsuleGeometry(2.3, 0.25, 0.5), toon(COLORS.blue));
  slash.rotation.z = (68 * Math.PI) / 180;
  // Sits slightly in front so it never intersects the chevrons.
  slash.position.z = 0.25;
  mark.add(lt, slash, gt);
  scene.add(mark);

  // --- blobs ---
  const blobs = [
    { r: 0.55, color: COLORS.sky, pos: [-2.35, 1.55, -1.4], seed: 1.3 },
    { r: 0.6, color: COLORS.leaf, pos: [2.35, -1.55, -1.2], seed: 2.1 },
    { r: 0.3, color: COLORS.orange, pos: [2.2, 1.7, -0.6], seed: 3.7 },
    { r: 0.28, color: COLORS.sun, pos: [-2.05, -1.7, 0], seed: 4.4 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], baseX: b.pos[0], phase: i * 1.7 };
    scene.add(m);
    return m;
  });

  // --- sizing ---
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole composition in frame on narrow (tall) and wide boxes.
    camera.position.z = camera.aspect < 1 ? 12 / camera.aspect ** 0.85 : 12;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // --- pointer ---
  // Over the mark, rotation follows the cursor (relative to the scene box).
  // Elsewhere it runs a livelier idle loop. `hover` eases 0..1 between the two.
  let px = 0, py = 0, over = false, hover = 0, rx = 0, ry = 0, rz = 0;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onEnter = (e: PointerEvent) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') over = true; };
  const onLeave = () => { over = false; };
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointerleave', onLeave);

  // --- loop (only while visible) ---
  let running = false, raf = 0, t0 = performance.now(), first = true;
  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const intro = Math.min(t / 1.1, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    mark.scale.setScalar(0.82 + 0.18 * ease);

    hover += ((over ? 1 : 0) - hover) * 0.06;

    // Idle: a slow figure-eight sway with a little roll.
    const idleX = Math.sin(t * 0.7) * 0.2;
    const idleY = Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.3) * 0.06;
    const idleZ = Math.sin(t * 0.4) * 0.07;
    // Hover: follow the cursor with more reach than the idle sway.
    const aimX = py * 0.4;
    const aimY = px * 0.65;

    const k = 0.05 + hover * 0.07; // respond faster while hovered
    rx += (idleX * (1 - hover) + aimX * hover - rx) * k;
    ry += (idleY * (1 - hover) + aimY * hover - ry) * k;
    rz += (idleZ * (1 - hover) - rz) * 0.05;
    mark.rotation.set(rx, ry, rz);
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
    renderer.render(scene, camera);
    if (first) { first = false; host.dataset.ready = ''; }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
  io.observe(host);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  return () => {
    stop(); io.disconnect(); ro.disconnect();
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerenter', onEnter);
    host.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); ramp.dispose(); renderer.dispose();
  };
}
