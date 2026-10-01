// Shared look and plumbing for the site's 3D illustrations: toon shading (two
// or three flat tones per face, never a gradient), inverted-hull ink outlines,
// a render loop that only runs while the scene is on screen, and a pointer
// model that blends an idle sway with cursor-follow on hover.
import {
  AmbientLight, BackSide, Color, DataTexture, DirectionalLight, Group, IcosahedronGeometry,
  Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, PerspectiveCamera, RedFormat,
  Scene, WebGLRenderer, type BufferGeometry, type Material, type Object3D,
} from 'three';

export const PALETTE = {
  bg: '#FBF7F2',
  paper: '#FFFDF8',
  orange: '#FF8A3D',
  blue: '#2B59C3',
  sun: '#FFCB57',
  sky: '#9CCBFF',
  leaf: '#9FD6A8',
  ink: '#24211D',
} as const;

export interface Pointer {
  /** Cursor position inside the scene box, -1..1 on each axis. */
  px: number;
  py: number;
  /** 0 = idle, 1 = hovered; eased every frame. */
  hover: number;
}

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  pointer: Pointer;
  toon: (hex: string) => MeshToonMaterial;
  /** Mesh plus an ink outline, like a drawn illustration. */
  inked: (geo: BufferGeometry, mat: Material, line?: number) => Group;
  /** Register geometry created outside `inked` so it is disposed. */
  track: <T extends BufferGeometry>(geo: T) => T;
  /** Start the loop. `update(t, dt)` runs before each render. */
  run: (update: (t: number, dt: number) => void) => void;
  dispose: () => void;
}

export function createStage(host: HTMLElement, opts: { cameraZ: number; fov?: number }): Stage {
  const canvas = host.querySelector('canvas')!;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new Scene();
  const camera = new PerspectiveCamera(opts.fov ?? 30, 1, 0.1, 100);
  camera.position.set(0, 0, opts.cameraZ);

  scene.add(new AmbientLight(0xffffff, 1.15));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // Three-step ramp: shadow, mid, lit. NearestFilter keeps the bands hard.
  const ramp = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat);
  ramp.minFilter = ramp.magFilter = NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;

  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const outline = new MeshBasicMaterial({ color: new Color(PALETTE.ink), side: BackSide });
  mats.push(outline);

  const toon = (hex: string) => {
    const m = new MeshToonMaterial({ color: new Color(hex), gradientMap: ramp });
    mats.push(m);
    return m;
  };
  const track = <T extends BufferGeometry>(geo: T) => { geos.push(geo); return geo; };
  const inked = (geo: BufferGeometry, mat: Material, line = 0.045) => {
    track(geo);
    const g = new Group();
    g.add(new Mesh(geo, mat));
    const hull = new Mesh(geo, outline);
    hull.scale.setScalar(1 + line);
    g.add(hull);
    return g;
  };

  // Keep the whole composition in frame on narrow (tall) and wide boxes.
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = camera.aspect < 1 ? opts.cameraZ / camera.aspect ** 0.85 : opts.cameraZ;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const pointer: Pointer = { px: 0, py: 0, hover: 0 };
  let over = false;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    pointer.py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onEnter = (e: PointerEvent) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') over = true; };
  const onLeave = () => { over = false; };
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointerleave', onLeave);

  let running = false, raf = 0, first = true, last = 0;
  const t0 = performance.now();
  let update: (t: number, dt: number) => void = () => {};
  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    pointer.hover += ((over ? 1 : 0) - pointer.hover) * 0.06;
    update(t, dt);
    renderer.render(scene, camera);
    if (first) { first = false; host.dataset.ready = ''; }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  let io: IntersectionObserver | null = null;
  const onVis = () => (document.hidden ? stop() : start());

  return {
    scene, camera, pointer, toon, inked, track,
    run(fn) {
      update = fn;
      io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
      io.observe(host);
      document.addEventListener('visibilitychange', onVis);
    },
    dispose() {
      stop(); io?.disconnect(); ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      ramp.dispose();
      renderer.dispose();
    },
  };
}

/**
 * Eased rotation that blends an idle figure-eight sway with cursor-follow.
 * Call `apply` every frame with the target object.
 */
export function swayer(opts: { idle?: number; reach?: number } = {}) {
  const idle = opts.idle ?? 1;
  const reach = opts.reach ?? 1;
  let rx = 0, ry = 0, rz = 0;
  return {
    apply(obj: Object3D, t: number, p: Pointer) {
      const h = p.hover;
      const idleX = Math.sin(t * 0.7) * 0.2 * idle;
      const idleY = (Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.3) * 0.06) * idle;
      const idleZ = Math.sin(t * 0.4) * 0.07 * idle;
      const k = 0.05 + h * 0.07; // respond faster while hovered
      rx += (idleX * (1 - h) + p.py * 0.4 * reach * h - rx) * k;
      ry += (idleY * (1 - h) + p.px * 0.65 * reach * h - ry) * k;
      rz += (idleZ * (1 - h) - rz) * 0.05;
      obj.rotation.set(rx, ry, rz);
    },
  };
}

/** Icosphere with smooth, seeded bumps: an organic pebble. */
export function blobGeometry(radius: number, seed: number): BufferGeometry {
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

/** Ease-out cubic, clamped to 0..1. */
export const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
