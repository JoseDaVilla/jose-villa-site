// Contact 3D: a short chat. An incoming message sits on top; the reply
// bubble below shows typing dots, then the dots turn into text and a check
// pops, on a loop. When the form sends ("contact:sent") the reply lands at
// once with a bigger check and a little bounce.
import { Group, Mesh, SphereGeometry } from 'three';
import { PALETTE, blobGeometry, createStage, easeOut, plate, swayer } from './scene-kit';

const LOOP = 5.2; // typing, sent, rest

export function mountChatScene(host: HTMLElement) {
  const stage = createStage(host, { cameraZ: 7.6 });
  const { scene, toon, inked, track } = stage;

  const paperMat = toon(PALETTE.paper);
  paperMat.emissive.set(PALETTE.paper).multiplyScalar(0.28);
  const lineMat = toon('#D9CFC1');
  const inkMat = toon(PALETTE.ink);
  const blueMat = toon(PALETTE.blue);

  const rig = new Group();
  scene.add(rig);

  // A bubble is a rounded plate plus a rotated square tucked behind one corner as the tail.
  const bubble = (w: number, h: number, mat: typeof paperMat, tailX: number) => {
    const g = new Group();
    g.add(inked(plate(w, h, 0.36, 0.16), mat, 0.035));
    const tail = inked(plate(0.42, 0.42, 0.08, 0.14), mat, 0.04);
    tail.rotation.z = Math.PI / 4;
    tail.position.set(tailX, -h / 2 + 0.08, -0.04);
    g.add(tail);
    return g;
  };
  const bar = (w: number, h: number, mat: typeof inkMat, x: number, y: number) => {
    const m = new Mesh(track(plate(w, h, h / 2, 0.02, 0)), mat);
    m.position.set(x, y, 0.16);
    return m;
  };

  // Incoming message.
  const inMsg = bubble(2.6, 1.05, paperMat, -1.05);
  inMsg.add(bar(1.45, 0.13, inkMat, -0.48, 0.25), bar(1.95, 0.09, lineMat, -0.25, 0.0), bar(1.2, 0.09, lineMat, -0.62, -0.22));
  inMsg.position.set(-0.5, 0.6, 0);
  rig.add(inMsg);
  const avatar = inked(new SphereGeometry(0.32, 26, 18), toon(PALETTE.orange), 0.06);
  avatar.position.set(-2.25, 0.25, 0.1);
  rig.add(avatar);

  // Reply: typing dots, then two lines of text.
  const outMsg = bubble(2.0, 0.85, blueMat, 0.8);
  const dots = [-0.3, 0, 0.3].map((x) => {
    const d = new Mesh(track(new SphereGeometry(0.1, 18, 12)), paperMat);
    d.position.set(x, 0, 0.18);
    outMsg.add(d);
    return d;
  });
  const text = new Group();
  text.add(bar(1.3, 0.11, paperMat, -0.12, 0.12), bar(0.9, 0.09, toon(PALETTE.sky), -0.32, -0.12));
  outMsg.add(text);
  outMsg.position.set(0.75, -0.75, 0.5);
  rig.add(outMsg);

  // Check badge on the reply.
  const check = new Group();
  check.add(inked(new SphereGeometry(0.22, 24, 16), toon(PALETTE.leaf), 0.1));
  const t1 = bar(0.16, 0.05, inkMat, -0.04, -0.02);
  const t2 = bar(0.3, 0.05, inkMat, 0.05, 0.03);
  t1.rotation.z = -0.8;
  t2.rotation.z = 0.9;
  t1.position.z = t2.position.z = 0.24;
  check.add(t1, t2);
  check.position.set(1.75, -1.12, 0.75);
  rig.add(check);

  const blobs = [
    { r: 0.36, color: PALETTE.sky, pos: [2.35, 1.3, -0.8], seed: 7.2 },
    { r: 0.28, color: PALETTE.sun, pos: [-2.3, -1.35, 0.2], seed: 8.4 },
  ].map((b, i) => {
    const m = inked(blobGeometry(b.r, b.seed), toon(b.color), 0.06);
    m.position.set(b.pos[0], b.pos[1], b.pos[2]);
    m.userData = { base: b.pos[1], phase: i * 2.1 };
    scene.add(m);
    return m;
  });

  // A successful send restarts the loop at the "sent" moment with a bigger pop.
  let sentAt = -Infinity;
  let now = 0;
  const onSent = () => { sentAt = now; };
  window.addEventListener('contact:sent', onSent);

  const sway = swayer({ idle: 0.6, reach: 0.8 });
  stage.run((t) => {
    now = t;
    rig.scale.setScalar(0.85 + 0.15 * easeOut(t / 1));
    sway.apply(rig, t, stage.pointer);
    rig.position.y = Math.sin(t * 0.8) * 0.07;

    const since = t - sentAt;
    const celebrating = since < 4;
    const c = celebrating ? 0.5 : (t % LOOP) / LOOP;
    const typing = c < 0.42;

    dots.forEach((d, i) => {
      d.visible = typing;
      d.position.y = Math.max(0, Math.sin(t * 7 - i * 0.7)) * 0.12;
    });
    text.visible = !typing;

    // The reply pops when it lands; the check follows.
    const land = celebrating ? since : (c - 0.42) * LOOP;
    const pop = typing ? 1 : 1 + 0.08 * Math.sin(Math.min(land / 0.35, 1) * Math.PI);
    outMsg.scale.setScalar(pop);
    const ck = typing ? 0 : easeOut((land - 0.2) / 0.35) * (1 + 0.25 * Math.sin(Math.min(Math.max((land - 0.2) / 0.35, 0), 1) * Math.PI));
    check.scale.setScalar(Math.max(0.001, ck * (celebrating ? 1.5 : 1)));
    check.visible = ck > 0.01;

    inMsg.position.y = 0.6 + Math.sin(t * 1.1) * 0.05;
    avatar.position.y = 0.25 + Math.sin(t * 1.1 + 0.6) * 0.06;
    for (const b of blobs) {
      b.position.y = b.userData.base + Math.sin(t * 0.9 + b.userData.phase) * 0.2;
      b.rotation.set(t * 0.3, t * 0.2, 0);
    }
  });

  return () => {
    window.removeEventListener('contact:sent', onSent);
    stage.dispose();
  };
}
