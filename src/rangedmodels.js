// Models for the ranged weapons (ranged.js), built into the knight like the melee ones (knight.js): the bow in
// the left hand (aimed with the lb* channels), the rifle and cannon in the right with the left hand on the
// fore-end. Each rides on the back while carried, and shows in hand only while aimed.
import * as THREE from 'three';
import { clamp } from './util.js';

export function buildRanged({ THREE: T = THREE, mats, mesh, node, armR, armL, chest, backMount, V }) {
  mats.moon = mats.moon || new T.MeshStandardMaterial({ color: 0xdfe8ff, metalness: .7, roughness: .3, emissive: 0x334466, emissiveIntensity: .3 });
  const line = new T.MeshBasicMaterial({ color: 0xe8f4ff });
  const out = {};
  // Moonbow: two limbs curving back from the grip; the string runs from tip to tip through the nock point.
  {
    const n = node(armL.hand, 0, -.04, 0);
    const curve = new T.QuadraticBezierCurve3(V(0, -.58, -.16), V(0, 0, .16), V(0, .58, -.16));
    mesh(new T.TubeGeometry(curve, 20, .018, 6, false), mats.moon, n);
    mesh(new T.CylinderGeometry(.026, .026, .14, 8), mats.leather, n, 0, 0, .075);
    for (const s of [-1, 1]) mesh(new T.SphereGeometry(.026, 8, 6), mats.trim, n, 0, s * .58, -.16);
    const strGeo = new T.CylinderGeometry(.004, .004, 1, 4);
    const s1 = new T.Mesh(strGeo, line), s2 = new T.Mesh(strGeo, line); n.add(s1, s2);
    const arrow = new T.Group(); n.add(arrow);
    const shaft = new T.CylinderGeometry(.007, .007, .72, 5); shaft.rotateX(Math.PI / 2); shaft.translate(0, 0, .36);
    arrow.add(new T.Mesh(shaft, mats.shaft));
    const head = new T.ConeGeometry(.018, .07, 5); head.rotateX(Math.PI / 2); head.translate(0, 0, .75); arrow.add(new T.Mesh(head, mats.moon));
    const tips = [V(0, .58, -.16), V(0, -.58, -.16)], nock = V(0, 0, -.16);
    const set = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
    // The string meets at the draw hand (in the bow's space), pulled at most so far back.
    const update = (hand, drawn) => {
      if (hand && drawn) { nock.copy(hand); n.worldToLocal(nock); nock.x = 0; nock.y = clamp(nock.y, -.1, .1); nock.z = clamp(nock.z, -.72, -.16); }
      else nock.set(0, 0, -.16);
      set(s1, tips[0], nock); set(s2, tips[1], nock);
      arrow.position.set(0, nock.y, nock.z);
    };
    update(null, false);
    out.bow = { node: n, arrow, update, muzzle: node(n, 0, 0, .3), back: backMount(n, V(.12, .25, -.2), V(-.55, .8, -.1)), leftHand: true };
    n.visible = false;
  }
  // Starlock Rifle: stock behind the hand, lock and a long barrel ahead; the left hand holds the fore-end.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(new T.BoxGeometry(.05, .1, .34), mats.shaft, n, 0, -.03, -.2);
    mesh(new T.BoxGeometry(.055, .075, .34), mats.shaft, n, 0, .005, .14);
    const barrel = new T.CylinderGeometry(.018, .02, .82, 8); barrel.rotateX(Math.PI / 2); mesh(barrel, mats.iron, n, 0, .03, .62);
    for (const z of [.3, .6, .95]) { const b = new T.CylinderGeometry(.026, .026, .03, 8); b.rotateX(Math.PI / 2); mesh(b, mats.trim, n, 0, .03, z); }
    mesh(new T.OctahedronGeometry(.03), mats.visor, n, 0, .07, .12);
    mesh(new T.BoxGeometry(.02, .05, .06), mats.trim, n, 0, -.05, .02);
    out.rifle = { node: n, muzzle: node(n, 0, .03, 1.05), grip: .42, back: backMount(n, V(-.05, -.02, -.24), V(.95, .25, -.05)) };
    n.visible = false;
  }
  // Thunder Cannon: a short fat barrel on the shoulder, flared at the mouth, a handle beneath.
  {
    const n = node(armR.hand, 0, -.04, 0);
    const tube = new T.CylinderGeometry(.085, .075, 1.0, 12); tube.rotateX(Math.PI / 2); mesh(tube, mats.iron, n, 0, .08, .2);
    const mouth = new T.CylinderGeometry(.115, .09, .12, 12); mouth.rotateX(Math.PI / 2); mesh(mouth, mats.trim, n, 0, .08, .74);
    for (const z of [-.2, .15, .45]) { const b = new T.CylinderGeometry(.092, .092, .04, 12); b.rotateX(Math.PI / 2); mesh(b, mats.trim, n, 0, .08, z); }
    mesh(new T.BoxGeometry(.04, .1, .05), mats.shaft, n, 0, -.02, 0);
    mesh(new T.SphereGeometry(.05, 8, 6), mats.iron, n, 0, .08, -.32);
    out.cannon = { node: n, muzzle: node(n, 0, .08, .82), grip: .3, back: backMount(n, V(.02, -.05, -.26), V(.3, .95, -.05)) };
    n.visible = false;
  }
  for (const r of Object.values(out)) r.back.visible = false;
  return out;
}

