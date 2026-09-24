// Mission 5: the Frostmere, a frozen mere north of the Moonspire where the stolen moonlight ran. Walked south to north.
//   The Shivering Pass (first Moonwell) → the Rimefall Stair → the Icefisher's Hamlet → the Causeway
//   → the Knight's Vigil (the Rime Knight holds the ice wall) → the Frozen Court (second Moonwell)
//   → Briar Seal → the Mirror of the Mere (the Winter Court: the Rat King and the Frost-Hexer, together).
import * as THREE from 'three';
import { ring, pathSides, distToPath, ringCliffs } from './shape.js';

const PASS = { x: 0, z: 0, r: 11 }, HAMLET = { x: 0, z: 68, r: 17 }, VIGIL = { x: 0, z: 110, r: 11 }, MERE = { x: 0, z: 184, r: 18 };
const STAIR = [[0, 10.6, 3.5], [-3, 20, 3.8], [-1, 29, 4.2], [5, 37, 4.5], [4, 45, 4], [0, 51.5, 4]];
// The causeway's low ice banks, hamlet to vigil (the left side mirrors it).
const CAUSEWAY = [[3.78, 84.6], [2.8, 87.5], [2.8, 96.5], [3.4, 99.5]];
// The court's walls, from the ice wall round to the seal corridor, and on to the mere (the left side mirrors it).
const COURT = [[3.4, 120.5], [10, 121.8], [19.5, 124], [19.5, 152], [12, 156], [4, 157], [4, 166.5]];
const ICE = 0xbfe6ff, AURORA = 0x7fffc8;

function playable(x, z, m = 0) {
  const near = (c, r) => Math.hypot(x - c.x, z - c.z) < r + m;
  return near(PASS, PASS.r + 2) || distToPath(STAIR, x, z) < 6.5 + m || near(HAMLET, HAMLET.r + 2.5) || (Math.abs(x) < 6 + m && z > 82 && z < 101)
    || near(VIGIL, VIGIL.r + 2.5) || (Math.abs(x) < 21 + m && z > 119 - m && z < 159 + m) || (Math.abs(x) < 6 && z > 155 && z < 168) || near(MERE, MERE.r + 3);
}

export default {
  id: 'frostmere',
  name: 'The Frostmere',
  blurb: 'A frozen mere under the aurora, where the moonlight the warlords stole runs north to pool beneath the ice. A court of winter sits upon it.',
  level: 48,
  seed: 9753,
  frost: true,
  snow: true,
  tier: 2.4,
  map: { x: 20, z: 30 },   // where it sits on the Fae Crossroads
  aurora: { a: 0x3cff9a, b: 0x9a5aff },
  fog: { color: 0x1a2436, byArea: { pass: .02, stair: .024, hamlet: .02, causeway: .015, vigil: .018, court: .02, mere: .011 }, base: .02 },
  light: { sky: 0xa8c0e8, ground: 0x3a4660, hemi: 1.75, moonColor: 0xe0ecff, moon: 2.1 },
  moon: { at: [140, 120, 360], glow: 120, size: 16 },
  enemyGlow: .14,
  intro: 'The moonlight did not stay with the Moonless Blade.\nIt ran north, to the Frostmere. Cross the ice, and face the Winter Court.',
  outro: 'The Winter Court falls on the mirror of the mere.',
  endingTitle: 'THE WINTER BREAKS',
  ending: 'The Rat King and the Frost-Hexer fall together on the mirror of the mere, and the ice sings as it breaks. The moonlight they hoarded pours back into the sky: far to the south the Moonspire shines, the Rotwood grows green, the Deep goes quiet, and the old keep warms in the light.\nThe paths are still. Walk them again, and every foe will remember you.',
  exitToast: 'The ice sings. A Pixie Gate rises from the mere',
  motes: { base: 0xdff4ff, hamlet: 0xffc890, court: 0xbfe6ff, mere: 0xc9f0ff },
  leafColors: [0xffffff, 0xe8f0ff, 0xdfe8ff],
  titleShrine: 'pass',

  areas: [
    { id: 'pass', name: 'The Shivering Pass', x0: -13, x1: 13, z0: -13, z1: 10.6 },
    { id: 'stair', name: 'The Rimefall Stair', x0: -10, x1: 12, z0: 10.6, z1: 51.5 },
    { id: 'hamlet', name: "The Icefisher's Hamlet", x0: -20, x1: 20, z0: 51.5, z1: 85 },
    { id: 'causeway', name: 'The Causeway', x0: -6, x1: 6, z0: 85, z1: 99.5 },
    { id: 'vigil', name: "The Knight's Vigil", x0: -13, x1: 13, z0: 99.5, z1: 121.5 },
    { id: 'court', name: 'The Frozen Court', x0: -21, x1: 21, z0: 121.5, z1: 160 },
    { id: 'mere', name: 'The Mirror of the Mere', x0: -21, x1: 21, z0: 160, z1: 205 },
  ],

  shrines: {
    pass: { id: 'pass', name: 'Moonwell of the Shivering Pass', x: -3.5, z: -3.5, spawn: [-1.4, -1.8], yaw: .25 },
    court: { id: 'court', name: 'Moonwell of the Frozen Court', x: -14, z: 127.5, spawn: [-12, 129], yaw: .8 },
  },

  spawns: [
    { id: 'p1', type: 'ratman-frostfang', x: 2.5, z: 6, yaw: Math.PI, idle: 'sleep' },
    // The Rimefall Stair
    { id: 's1', type: 'ratman-snowdelver', x: -2.5, z: 22, yaw: Math.PI },
    { id: 's2', type: 'goblin-rimecaller', x: -1, z: 31, yaw: Math.PI },
    { id: 's3', type: 'ratman-frostfang', x: 3, z: 37, yaw: Math.PI, patrol: [[3, 37], [-2, 27], [5, 40]] },
    { id: 's4', type: 'goblin-hailslinger', x: 4.5, z: 46, yaw: Math.PI },
    // The Icefisher's Hamlet
    { id: 'h1', type: 'goblin-rimebreaker', x: 0, z: 78, yaw: Math.PI },
    { id: 'h2', type: 'goblin-rimecaller', x: -11, z: 75, yaw: 2.6 },
    { id: 'h3', type: 'goblin-hailslinger', x: 11.5, z: 78, yaw: -2.6 },
    { id: 'h4', type: 'ratman-frostfang', x: -7, z: 61, yaw: Math.PI },
    { id: 'h5', type: 'ratman-frostfang', x: 7.5, z: 60, yaw: -2.6, idle: 'sleep' },
    { id: 'h6', type: 'goblin-rimeguard', x: 5, z: 81, yaw: Math.PI, patrol: [[5, 81], [-5, 80], [0, 74]] },
    { id: 'h7', type: 'goblin-warchanter', x: -5, z: 82.5, yaw: Math.PI },
    { id: 'h8', type: 'goblin-archer', x: 13.5, z: 65, yaw: -2.2 },
    // The Causeway
    { id: 'c1', type: 'goblin-rimeguard', x: 0, z: 93, yaw: Math.PI },
    { id: 'c2', type: 'ratman-shadowblade', x: 1, z: 97.5, yaw: Math.PI },
    // The Knight's Vigil
    { id: 'knight', type: 'rime-knight', x: 0, z: 113, yaw: Math.PI, elite: 'warden' },
    // The Frozen Court
    { id: 'k1', type: 'ratman-rimebrute', x: 0, z: 141, yaw: Math.PI, patrol: [[0, 141], [-8, 136], [8, 134]] },
    { id: 'k2', type: 'goblin-rimecaller', x: -12, z: 150, yaw: 2.6 },
    { id: 'k3', type: 'goblin-rimecaller', x: 12.5, z: 136, yaw: -2.6 },
    { id: 'k4', type: 'ratman-frostfang', x: -6, z: 131, yaw: Math.PI },
    { id: 'k5', type: 'ratman-frostfang', x: 7, z: 128, yaw: Math.PI, patrol: [[7, 128], [12, 144], [3, 136]] },
    { id: 'k6', type: 'goblin-rimeguard', x: 8, z: 150.5, yaw: Math.PI },
    { id: 'k7', type: 'ratman-snowdelver', x: -10, z: 140, yaw: 2.4 },
    { id: 'k8', type: 'goblin-warchanter', x: 0, z: 153, yaw: Math.PI },
    { id: 'k9', type: 'goblin-rimebreaker', x: 15, z: 145, yaw: -2.2, idle: 'sleep' },
    // The Mirror of the Mere
    { id: 'king', type: 'rat-king', x: -4.5, z: 190, yaw: Math.PI, elite: 'boss' },
    { id: 'hexer', type: 'frost-hexer', x: 4.5, z: 193, yaw: Math.PI, elite: 'boss' },
  ],
  boss: ['king', 'hexer'],
  bossCharm: 'wintercrown',
  // When the first of the pair falls, the ice gives way here.
  breaks: [{ x: -9.5, z: 180, r: 2.5 }, { x: 9, z: 187.5, r: 2.3 }, { x: -3.5, z: 195, r: 2 }, { x: 5.5, z: 175, r: 1.9 }, { x: -11, z: 191, r: 1.8 }],

  messages: [
    { x: 1.5, z: -1, text: 'The cold bites here. Icy blows and freezing ground build chill; when it fills, you are Frostbitten: slow on your feet and slow to catch your breath.\nMoondew thaws you, and so does a Moonwell.' },
    { x: -2.2, z: 12.5, text: 'Rimecallers send ice racing along the ground. Step off the line, leap it, or dash through as it reaches you.' },
    { x: 2.6, z: 53, text: 'Hail pots burst in rime and leave the ground freezing. Keep off it.' },
    { x: 2.4, z: 87, text: 'The Rime Knight fences as you do. It turns quick cuts aside and answers at once.\nBreak through with heavy strikes, or strike as its own blows end. Deflect it, and Flashcut.' },
    { x: 1.8, z: 158, text: 'The Winter Court waits on the mere: the Rat King and his Frost-Hexer, both at once.\nWhen one falls, the other grieves, and the ice will not hold.' },
  ],

  items: [
    { id: 'c-hearthstone', x: 6.5, z: -5, kind: 'charm', charm: 'hearthstone', label: 'Charm' },
    { id: 'glimmer1', x: 4, z: 32.5, kind: 'glimmer', amount: 3400, label: 'Glimmer Shard', desc: '+3400 Glimmer' },
    { id: 'grace1', x: -13.5, z: 63.5, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'c-winterbloom', x: 3.5, z: 70.5, kind: 'charm', charm: 'winterbloom', label: 'Charm' },
    { id: 'glimmer2', x: 13.8, z: 71, kind: 'glimmer', amount: 3800, label: 'Glimmer Shard', desc: '+3800 Glimmer' },
    { id: 'glimmer3', x: -7.5, z: 105, kind: 'glimmer', amount: 4000, label: 'Glimmer Shard', desc: '+4000 Glimmer' },
    { id: 'c-iceheart', x: -16, z: 150, kind: 'charm', charm: 'iceheart', label: 'Charm' },
    { id: 'glimmer4', x: 17, z: 127, kind: 'glimmer', amount: 4500, label: 'Glimmer Shard', desc: '+4500 Glimmer' },
  ],

  gate: { x: 0, z: 121.3, width: 6.8, guardian: 'knight', style: 'ice', toast: 'The ice wall shatters', banner: 'RIME KNIGHT FELLED', charm: 'mirrorguard' },
  seal: { x: 0, z: 160.5, yaw: 0, width: 7.6, height: 6.8, inside: [0, 166] },
  exit: { x: 0, z: 185.5 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const avoid = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.breaks];
    const clear = (x, z, d = 2.2) => avoid.every(s => Math.hypot(s.x - x, s.z - z) > d + (s.r || 0));

    // Ground: snow everywhere, the mere's ice to the north, flagstones in the court.
    w.floor(-90, -60, 90, 165, 'snow', 5, -.01);
    w.floor(-120, 158, 120, 330, 'lake', 7, -.012);
    w.disc(MERE.x, MERE.z, MERE.r + .5, 'lake', 6, .006);
    w.floor(-70, 86, 70, 99, 'lake', 7, -.006);   // open ice either side of the causeway
    const courtFloor = M.floor.clone(); courtFloor.color.setHex(0xc8d2e4); courtFloor.emissive = new THREE.Color(0x0c1424);
    w.floor(-19.5, 121, 19.5, 157.5, courtFloor, 4, .004);
    w.floor(-4, 157, 4, 167, courtFloor, 4, .004);
    w.disc(VIGIL.x, VIGIL.z, VIGIL.r - .3, 'lake', 5, .006);   // the vigil is a frozen pool
    w.floor(-2.8, 84.5, 2.8, 100, courtFloor, 4, .004);   // the causeway's paving

    // Rock walls, capped with snow.
    ringCliffs(w, PASS, PASS.r, 20, [9, 10], 8, 3, R, 1.8);
    ringCliffs(w, HAMLET, HAMLET.r, 28, [0, 27, 13, 14], 9, 3, R, 2);
    ringCliffs(w, VIGIL, VIGIL.r, 20, [0, 19, 9, 10], 9, 3, R, 2);
    const S = pathSides(STAIR);
    for (const side of [S.L, S.R]) for (let i = 0; i < side.length - 1; i++) w.cliff(...side[i], ...side[i + 1], { h: 9 + R() * 3, th: 2 });
    // A frozen waterfall hangs down the stair's eastern wall.
    w.icefall(S.R[2][0] - .9, S.R[2][1], S.R[3][0] - .9, S.R[3][1] - .5, 11);
    // The causeway runs between low banks of ice, open to the mere on either side.
    for (const sx of [1, -1]) {
      const pts = CAUSEWAY.map(([x, z]) => [x * sx, z]);
      for (let i = 0; i < pts.length - 1; i++) w.prop(w.icefall(...pts[i], ...pts[i + 1], 1.3));
    }
    // The Frozen Court: a ruined winter palace, its walls crusted with snow.
    for (const sx of [1, -1]) {
      const pts = COURT.map(([x, z]) => [x * sx, z]);
      for (let i = 0; i < pts.length - 1; i++) {
        const last = i === pts.length - 2;
        w.wall(...pts[i], ...pts[i + 1], { h: last ? 5 : 6.5, crenel: !last });
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), rot = Math.atan2(-(z1 - z0), x1 - x0);
        const cap = w.rock(1, i + (sx > 0 ? 0 : 20), .12); cap.scale(L / 2 + .6, .22, .85); cap.rotateY(rot); cap.translate((x0 + x1) / 2, (last ? 5 : 6.5) + .15, (z0 + z1) / 2); w.batch('snowcap', cap);
      }
    }
    // The mere's rim: pressure ridges of ice the camera can see over, and great ice spires between.
    for (let i = 1; i < 27; i++) {
      const a0 = i / 28 * Math.PI * 2, a1 = (i + 1) / 28 * Math.PI * 2;
      w.prop(w.icefall(...ring(MERE, MERE.r, a0), ...ring(MERE, MERE.r, a1), 2.4 + R() * 1.4));
    }
    for (let i = 0; i < 9; i++) { const [x, z] = ring(MERE, MERE.r + .8, (i + .75) / 9 * Math.PI * 2); w.crystal(x, z, 5 + R() * 3, ICE, 700 + i, i % 2 === 0); }
    for (const b of this.breaks) w.iceBreak(b.x, b.z, b.r);

    // The Shivering Pass: firs under snow, standing stones and a blue lantern.
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * 6.28 + .3, x = -3.5 + Math.sin(a) * 4.6, z = -3.5 + Math.cos(a) * 4.6, h = 1.4 + R() * 1.1;
      if (!clear(x, z, 1.4)) continue;
      const st = w.rock(.55, i + 3, .15); st.scale(.9, h / 1.1, .6); st.rotateY(a); st.translate(x, h * .45, z); w.batch('rock', st);
      const cap = w.rock(.5, i + 9, .1); cap.scale(.9, .25, .6); cap.rotateY(a); cap.translate(x, h * .92, z); w.batch('snowcap', cap);
      w.prop(w.addCyl(x, z, .4, h));
    }
    for (const [x, z, h] of [[7.5, 4, 7], [-7, 6, 8], [8, -6.5, 6.5], [-8.5, -6.5, 7.5]]) if (clear(x, z, 1.8)) w.snowPine(x, z, h, Math.round(x * z + 7), true);

    // The Icefisher's Hamlet: snow-heaped huts round a frozen pond with holes cut for the lines.
    w.disc(2, 70, 6.5, 'lake', 5, .008);
    for (const [x, z, r] of [[.5, 68, .6], [4, 72.5, .5], [4.8, 67, .45]]) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(r, 16), M.water); hole.rotation.x = -Math.PI / 2; hole.position.set(x, .012, z); g.add(hole);
      const rim = new THREE.TorusGeometry(r + .08, .13, 5, 18); rim.rotateX(Math.PI / 2); rim.scale(1, .6, 1); rim.translate(x, .04, z); w.batch('snowcap', rim);
    }
    w.hut(-10, 60, 2.3, .8, 'snowcap'); w.hut(10.5, 60.5, 2.3, -.8, 'snowcap'); w.hut(-14, 70, 2.5, 1.7, 'snowcap'); w.hut(13.5, 76, 2.4, -1.9, 'snowcap');
    for (const [x, z] of [[-4.6, 84.4], [4.6, 84.4], [-3.3, 52.6], [3.3, 52.6]]) w.totem(x, z, 3);
    for (const [x, z, s] of [[-6.5, 71, .9], [8.5, 64.5, .7], [-9, 80, .7]]) w.campfire(x, z, s);
    // Fish on drying racks.
    for (const [x, z, r] of [[-11.5, 65.5, .7], [12, 69, -1.2]]) {
      const rack = new THREE.Group();
      for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 2.2, 5), M.stake); post.position.set(s * .9, 1.1, 0); rack.add(post); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2, 5), M.stake); bar.rotation.z = Math.PI / 2; bar.position.y = 2; rack.add(bar);
      const fishMat = new THREE.MeshStandardMaterial({ color: 0x8aa0b0, metalness: .5, roughness: .4 });
      for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .35, 3, 6), fishMat); f.position.set(-.7 + i * .35, 1.65, 0); rack.add(f); }
      rack.position.set(x, 0, z); rack.rotation.y = r; rack.traverse(o => { o.castShadow = true; }); g.add(rack); w.prop(w.addBox(x, z, 1, .15, r, 2.2));
    }
    // A goblin boat, frozen in where the pond iced over.
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(.7, .5, 3, 8, 1, true, 0, Math.PI), M.wood); hull.rotation.set(Math.PI / 2, 0, Math.PI); hull.material.side = THREE.DoubleSide; boat.add(hull);
    boat.position.set(-1.5, .1, 73.5); boat.rotation.set(.12, .5, .15); boat.traverse(o => { o.castShadow = true; }); g.add(boat); w.prop(w.addBox(-1.5, 73.5, .7, 1.5, .5, 1));

    // The Knight's Vigil: a ring of broken ice-hung pillars round the dais.
    for (let i = 0; i < 8; i++) {
      const [x, z] = ring(VIGIL, VIGIL.r - 2.2, (i + .5) / 8 * Math.PI * 2);
      if (Math.abs(z - VIGIL.z) < 9 && clear(x, z, 1.6)) w.pillar(x, z, .55, 6.5, i % 3 === 1);
    }
    for (const [x, z] of [[-3.8, 119.3], [3.8, 119.3], [-3, 101.5], [3, 101.5]]) w.brazier(x, z, 0x8fd0ff);

    // Court dressing: ice-sheathed pillars, fallen statues and frozen banners.
    for (const [x, z, b] of [[-9, 130, 0], [9, 130, 0], [-9, 146, 1], [9, 146, 0], [-15, 138, 1], [15, 138, 0]]) if (clear(x, z, 1.6)) {
      w.pillar(x, z, .65, 7, !!b);
      const sheath = new THREE.CylinderGeometry(.78, .9, 3.2, 8); sheath.translate(x, 1.6, z); w.batch('ice', sheath);
    }
    w.banner(-4.6, 156.6, 0, 0x2a3a6a, 3.6); w.banner(4.6, 156.6, 0, 0x2a3a6a, 3.6);
    for (const [x, z] of [[-5, 158.2], [5, 158.2]]) w.brazier(x, z, 0xff5030);
    w.brazier(-14, 124.5, 0x6fd8ff); w.brazier(-6.2, -6.5, 0x6fd8ff);
    for (const [x, z, h, c] of [[-16, 147, 2.4, ICE], [16.5, 131, 2, ICE], [-3, 150, 1.5, AURORA], [12, 153, 1.8, ICE]]) if (clear(x, z, 1.8)) w.crystal(x, z, h, c, Math.round(x * 7 + z), true);
    for (let i = 0; i < 26; i++) {
      const x = -18 + R() * 36, z = 123 + R() * 33;
      if (clear(x, z, 2)) w.drift(x, z, 1 + R() * 1.8, i + 40);
    }

    // Snow in drifts along every wall; boulders and firs fill the dark beyond.
    for (let i = 0; i < 60; i++) {
      const C = [PASS, HAMLET, VIGIL][i % 3], a = R() * Math.PI * 2, [x, z] = ring(C, C.r - 1, a);
      if (Math.abs(Math.sin(a / 2)) < .2 || Math.abs(Math.cos(a / 2)) < .2 || !clear(x, z, 2.5)) continue;
      if (i % 4 === 0) w.snowBoulder(x, z, .7 + R() * .9, 400 + i); else w.drift(x, z, 1.2 + R() * 1.4, 400 + i);
    }
    let placed = 0;
    for (let tries = 0; placed < 240 && tries < 5000; tries++) {
      const x = -80 + R() * 160, z = -50 + R() * 210;
      if (playable(x, z, .5)) continue;
      if (z > 84 && z < 101 && Math.abs(x) < 30) continue;   // the mere stays open beside the causeway
      const far = playable(x, z, 12) ? 1 : 1.35;
      w.snowPine(x, z, (8 + R() * 8) * far, placed);
      placed++;
    }
    // Out on the mere: floes and bergs of old ice, and mountains beyond.
    for (let i = 0; i < 40; i++) {
      const a = R() * Math.PI * 2, r = MERE.r + 6 + R() * 50, x = Math.sin(a) * r, z = MERE.z + Math.cos(a) * r * .8;
      if (z < 162 || playable(x, z, 3)) continue;
      const b = w.rock(1.5 + R() * 3, 800 + i, .3); b.scale(1, .5 + R() * .8, 1); b.translate(x, 0, z); w.batch('ice', b);
    }
    for (let i = 0; i < 18; i++) { const x = (R() - .5) * 60, z = 86 + R() * 14; if (Math.abs(x) > 5) { const b = w.rock(.8 + R() * 1.2, 900 + i, .3); b.scale(1, .4, 1); b.translate(x, 0, z); w.batch('ice', b); } }
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x5a6680, roughness: 1, flatShading: true }), capMat = new THREE.MeshStandardMaterial({ color: 0xe8f0ff, roughness: .9, flatShading: true, emissive: 0x1a2438 });
    for (let i = 0; i < 22; i++) {
      const a = -1.3 + R() * 2.6, r = 170 + R() * 110, h = 45 + R() * 60, rad = 28 + R() * 26, x = Math.sin(a) * r, z = 120 + Math.cos(a) * r;
      const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 6), peakMat); m.position.set(x, h / 2 - 8, z); m.rotation.y = R() * 6; g.add(m);
      const c = new THREE.Mesh(new THREE.ConeGeometry(rad * .42, h * .42, 6), capMat); c.position.set(x, h - 8 - h * .21 + .5, z); c.rotation.y = m.rotation.y; g.add(c);
    }
  },
};
