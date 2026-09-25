// Mission 4: the Moonspire, a ruined fae temple above the clouds. Walked south to north, terrace to terrace.
//   The Moonstair Landing (first Moonwell) → the Broken Bridge → the Terrace of Chimes → the Pilgrim's Stair
//   → the Moon Gate (Varkh holds it) → the Garden of Still Water (second Moonwell) → Briar Seal
//   → the Crown of the Spire (Silkclaw, the Moonless Blade). Off the Terrace of Chimes, over a bridge: the Starlit Library.
import * as THREE from 'three';
import { boxGeo, scaleUV } from '../world.js';
import { ring, pathSides } from './shape.js';

const LIBRARY = { x: -36, z: 60, r: 9 };
const LANDING = { x: 0, z: 0, r: 10 }, GATEHALL = { x: 0, z: 122, r: 10 }, CROWN = { x: 0, z: 184, r: 17 };
const BRIDGE = [[0, 9.66, 2.6], [0, 21.5, 2.6], [0, 27, 5.4], [0, 32.5, 2.6], [0, 44, 2.6]];
const STAIR = [[0, 76, 3], [8, 84, 3], [-5, 96, 3], [4, 106, 3], [0, 112.5, 3]];
// The garden's rail, from the gate round to the seal corridor (the left side mirrors it).
const GARDEN = [[3.1, 131.5], [10, 132], [18, 136], [18, 158], [3.8, 160], [3.8, 167.4]];

export default {
  id: 'moonspire',
  name: 'The Moonspire',
  blurb: 'A ruined fae temple above the clouds, where the moon comes close enough to touch. Something has been drinking from it.',
  level: 26,
  gatekeeper: { hp: 1, dmg: 1.4 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.25, dmg: 1.8 },
  map: { x: 9, z: 17 },   // where it sits on the Fae Crossroads
  seed: 8642,
  spire: true,
  tier: 2,
  leaves: true,
  leafColors: [0xffd8ec, 0xfff4fa, 0xf0c8ff],
  fog: { color: 0x141c34, byArea: { landing: .012, bridge: .01, terrace: .012, library: .012, stair: .011, gatehall: .016, garden: .013, crown: .008 }, base: .012 },
  light: { sky: 0x9fb4e8, ground: 0x2a2a44, hemi: 1.6, moonColor: 0xdfe8ff, moon: 2.3 },
  moon: { at: [0, 60, 420], glow: 280, size: 34 },
  enemyGlow: .16,
  intro: 'The Moonspire rises above the clouds.\nClimb to its crown, and end the Moonless Blade.',
  outro: 'Silkclaw falls from the Crown of the Spire, but the moon stays pale. The light he drank was never his to keep: it runs north in a river of frost, to the Frostmere, where a court of winter waits upon the ice.',
  exitToast: 'The Moonless Blade is gone. A Pixie Gate opens at the crown',
  motes: { base: 0xdfe8ff, garden: 0xffd8ec, crown: 0xc9b4ff },
  titleShrine: 'landing',

  areas: [
    { id: 'landing', name: 'The Moonstair Landing', x0: -12, x1: 12, z0: -12, z1: 9.7 },
    { id: 'bridge', name: 'The Broken Bridge', x0: -7, x1: 7, z0: 9.7, z1: 44 },
    { id: 'terrace', name: 'The Terrace of Chimes', x0: -17, x1: 17, z0: 44, z1: 76 },
    { id: 'library', name: 'The Starlit Library', x0: -46, x1: -17, z0: 50, z1: 70 },
    { id: 'stair', name: "The Pilgrim's Stair", x0: -9, x1: 12, z0: 76, z1: 112.5 },
    { id: 'gatehall', name: 'The Moon Gate', x0: -11, x1: 11, z0: 112.5, z1: 131.6 },
    { id: 'garden', name: 'The Garden of Still Water', x0: -19, x1: 19, z0: 131.6, z1: 164 },
    { id: 'crown', name: 'The Crown of the Spire', x0: -18, x1: 18, z0: 164, z1: 202 },
  ],

  shrines: {
    landing: { id: 'landing', name: 'Moonwell of the Landing', x: -3.5, z: -3.5, spawn: [-1.4, -1.8], yaw: .2 },
    garden: { id: 'garden', name: 'Moonwell of Still Water', x: -12, z: 137, spawn: [-10, 138.5], yaw: .7 },
  },

  spawns: [
    { id: 'l1', type: 'goblin-scout', x: 2.5, z: 5.5, yaw: Math.PI, idle: 'sleep' },
    // The Broken Bridge
    { id: 'b1', type: 'goblin-archer', x: 0, z: 41, yaw: Math.PI },
    { id: 'b2', type: 'goblin-skyguard', x: 0, z: 27, yaw: Math.PI },
    { id: 'b3', type: 'goblin-scout', x: .8, z: 17, yaw: Math.PI, patrol: [[.8, 17], [-.8, 31]] },
    // The Terrace of Chimes
    { id: 't1', type: 'goblin-warchanter', x: 0, z: 71, yaw: Math.PI },
    { id: 't2', type: 'goblin-skyguard', x: -5, z: 57, yaw: Math.PI },
    { id: 't3', type: 'goblin-skyguard', x: 5, z: 57, yaw: Math.PI },
    { id: 't4', type: 'ratman-shadowblade', x: 10, z: 67, yaw: -2.6 },
    { id: 't5', type: 'goblin-berserker', x: -10, z: 66, yaw: 2.6, idle: 'sleep' },
    { id: 't6', type: 'goblin-archer', x: -12.5, z: 72.5, yaw: 2.6 },
    { id: 't7', type: 'goblin-bomber', x: 12, z: 49, yaw: -2.4 },
    // The Pilgrim's Stair
    { id: 's1', type: 'ratman-shadowblade', x: 8, z: 84, yaw: -2.4 },
    { id: 's2', type: 'goblin-skyguard', x: -5, z: 96, yaw: 2.4 },
    { id: 's3', type: 'goblin-archer', x: 4, z: 106, yaw: Math.PI },
    // The Moon Gate
    { id: 'varkh', type: 'varkh', x: 0, z: 125, yaw: Math.PI, elite: 'warden' },
    // The Garden of Still Water
    { id: 'g1', type: 'goblin-warchanter', x: -10, z: 152, yaw: 2.6 },
    { id: 'g2', type: 'ratman-shadowblade', x: 10, z: 141, yaw: -2.6 },
    { id: 'g3', type: 'goblin-skyguard', x: 0, z: 146, yaw: Math.PI },
    { id: 'g4', type: 'goblin-spearguard', x: 8, z: 155, yaw: -2.8, patrol: [[8, 155], [-6, 157], [2, 150]] },
    { id: 'g5', type: 'ratman-assassin', x: -14, z: 145, yaw: 1.6, idle: 'sleep' },
    { id: 'g6', type: 'goblin-berserker', x: 13, z: 150, yaw: -2.6 },
    // The Starlit Library
    { id: 'y1', type: 'goblin-warchanter', x: -40, z: 60, yaw: Math.PI / 2 },
    { id: 'y2', type: 'goblin-skyguard', x: -29.5, z: 60, yaw: Math.PI / 2 },
    { id: 'y3', type: 'ratman-shadowblade', x: -36, z: 66, yaw: 2.2 },
    { id: 'y4', type: 'goblin-archer', x: -37, z: 53.5, yaw: 1.2 },
    // The Crown of the Spire
    { id: 'boss', type: 'silkclaw', x: 0, z: 191, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'shadow-clone', x: -8, z: 190, yaw: Math.PI, add: true },
    { id: 'add2', type: 'shadow-clone', x: 8, z: 190, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'shadowsilk',
  phase2Line: 'The Moonless Blade splits into shadow',

  messages: [
    { x: 1.5, z: -.5, text: 'Skyguards hold their shields to the front. Go round them, break the guard with heavy strikes, or catch them after they swing.' },
    { x: -1.6, z: 46, text: 'A Warchanter\'s chant emboldens its kin: they burn red, hit harder and will not flinch. Silence the chanter first.' },
    { x: 1.8, z: 77.5, text: 'Shadowblades step out of the dark behind you. When one vanishes, turn, or dash.' },
    { x: 2.2, z: 114, text: 'Varkh the Moon-Pike keeps the gate. His reach is long; get inside it.' },
    { x: 1.8, z: 161.5, text: 'At the crown of the spire, the Moonless Blade waits.' },
  ],

  items: [
    { id: 'glimmer1', x: -3.8, z: 27, kind: 'glimmer', amount: 2500, label: 'Glimmer Shard', desc: '+2500 Glimmer' },
    { id: 'c-lanternheart', x: 3.8, z: 27, kind: 'charm', charm: 'lanternheart', label: 'Charm' },
    { id: 'grace1', x: -14.5, z: 46, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'c-moonveil', x: -14.5, z: 60, kind: 'charm', charm: 'moonveil', label: 'Charm' },
    { id: 'glimmer2', x: 14.5, z: 74, kind: 'glimmer', amount: 2800, label: 'Glimmer Shard', desc: '+2800 Glimmer' },
    { id: 'c-windstep', x: -6.8, z: 97, kind: 'charm', charm: 'windstep', label: 'Charm' },
    { id: 'c-wildfang', x: 16, z: 140, kind: 'charm', charm: 'wildfang', label: 'Charm' },
    { id: 'glimmer3', x: 16, z: 157, kind: 'glimmer', amount: 3200, label: 'Glimmer Shard', desc: '+3200 Glimmer' },
    { id: 'fists', x: -33, z: 65.5, kind: 'weapon', weapon: 'fists', label: 'Starfists', desc: 'a pilgrim-monk\'s gauntlets, starlight in the knuckles',
      tip: 'The Starfists fight with punches and kicks, the quickest of all your arms. Flow: every hit wins back a little stamina and breaks posture harder.\nHigh stance kicks; Low stance strikes low and lifts foes off their feet.' },
    { id: 'art-storm', x: 12, z: 76.5, kind: 'art', art: 'storm', label: 'Stormbrand', desc: 'a Fae Art: a shard of a storm caught in glass',
      tip: 'Stormbrand makes your weapon crackle for thirty seconds: hits break posture harder and leap to a second foe nearby.\nFae Arts: T (or hold guard and press Moondew) uses the art at hand; Y (Select) changes it. Their uses return at every Moonwell.' },
    { id: 'glimmer-library', x: -31.4, z: 54.6, kind: 'glimmer', amount: 3000, label: 'Glimmer Shard', desc: '+3000 Glimmer', inside: 'lurn' },
    { id: 'grace-library', x: -43.2, z: 60, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
  ],
  letters: [
    { id: 'pilgrim', x: -2, z: 5.6, title: "A Pilgrim's Prayer, Carved in Marble", text: 'Moon above, come close:\nclose enough to touch, close enough to hear.\nWe climb the stair to be near you, not to hold you.\nForgive the ones who would hold you,\nfor they are only cold.' },
    { id: 'maelis4', x: -40.2, z: 64.2, title: 'A Fourth Letter, Tucked in a Book', text: 'The Moonless Blade drinks from the moon itself up here, at the crown, every night. But he does not keep it. At dawn he pours what he drank into a silver bowl, and it runs down the north face of the mountain in a thread of frost.\n\nI have seen where the thread ends: a mere of ice under green lights, and a court sitting upon it. A Rat King. A Hexer in a crown of ice.\n\nI go to ask them why. If I do not come back, the answer was not one I could carry.\n\n— M.' },
    { id: 'librarian', x: -32.4, z: 64.6, title: "The Librarian's Last Entry", text: 'The shelves have no readers now but me.\n\nVarkh keeps the Moon Gate and asks, when he is bored, what the books say. I tell him they say the moon belonged to everyone. He laughs and says that is why it was so easy to take.\n\nThe goblins have started burning the lower shelves to keep warm. I have hidden the star-charts in the urns. Let them find those, if they ever learn to read.' },
    { id: 'silkclaw', x: 12.4, z: 143.4, title: "Silkclaw's Note to the North", text: 'To the Court of Winter.\n\nThe bowl is full again. Send the Hexer\'s sledge.\n\nThe knight you froze at the Vigil last season had a friend. There is another on the stair now, in blue light, asking questions. I will cut this one myself at the crown, and the moon will be yours by midwinter.\n\n— the Moonless Blade' },
  ],
  pixies: [
    { id: 'p1', x: 7, z: 2.6 },
    { id: 'p2', x: 13.6, z: 66.4, inside: 'turn' },
    { id: 'p3', x: -36, z: 56.4, y: 1.35 },
    { id: 'p4', x: -43.4, z: 55, inside: 'lurn2' },
    { id: 'p5', x: -10.5, z: 157 },
  ],

  gate: { x: 0, z: 131.6, width: 6.4, guardian: 'varkh', style: 'portcullis', toast: 'The Moon Gate rises', banner: 'MOON-PIKE FELLED', charm: 'pikeband' },
  seal: { x: 0, z: 163.5, yaw: 0, width: 7.6, height: 6.8, inside: [0, 168] },
  exit: { x: 0, z: 191 },

  build(w, R) {
    const g = w.group, M = w.mats;
    M.blossom = new THREE.MeshStandardMaterial({ color: 0xf2c6e2, emissive: 0x6a3050, emissiveIntensity: .25, roughness: .9, flatShading: true });
    const avoid = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages];
    const clear = (x, z, d = 2) => avoid.every(s => Math.hypot(s.x - x, s.z - z) > d);

    // Floating floors, each on a slab of stone so its edge reads against the drop.
    const slabDisc = (c, r, mat = M.marble) => {
      w.disc(c.x, c.z, r, mat, 4);
      const s = new THREE.CylinderGeometry(r, r * .7, 4, 40, 1, true); s.translate(c.x, -2, c.z); w.batch('stone', s);
    };
    const slabRect = (x0, z0, x1, z1) => {
      w.floor(x0, z0, x1, z1, M.marble, 4, .005);
      const s = boxGeo(x1 - x0, 3, z1 - z0, 4); s.translate((x0 + x1) / 2, -1.5, (z0 + z1) / 2); w.batch('stone', s);
    };
    const strip = (a, b, hw) => {   // a floor strip between two path points
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), rot = Math.atan2(dx, dz);
      const f = scaleUV(new THREE.PlaneGeometry(hw * 2, L), hw / 2, L / 4); f.rotateX(-Math.PI / 2); f.rotateY(rot);
      const m = new THREE.Mesh(f, M.marble); m.position.set((a[0] + b[0]) / 2, .006, (a[1] + b[1]) / 2); m.receiveShadow = true; g.add(m);
      const s = boxGeo(hw * 2, 2.4, L, 4); s.rotateY(rot); s.translate((a[0] + b[0]) / 2, -1.2, (a[1] + b[1]) / 2); w.batch('stone', s);
    };
    slabDisc(LANDING, LANDING.r + .3);
    slabRect(-2.8, 9.4, 2.8, 44.2); slabDisc({ x: 0, z: 27 }, 5.6);
    slabRect(-16.3, 43.8, 16.3, 76.2);
    for (let i = 0; i < STAIR.length - 1; i++) strip(STAIR[i], STAIR[i + 1], 3.2);
    for (const [x, z] of STAIR.slice(1, -1)) slabDisc({ x, z }, 3.2);
    slabDisc(GATEHALL, GATEHALL.r + .3);
    slabRect(-18.3, 131.3, 18.3, 160.3); slabRect(-4.2, 159.8, 4.2, 168);
    const crownFloor = M.arena.clone(); crownFloor.color.setHex(0xb8bed8); crownFloor.emissive.setHex(0x0a0c20);
    slabDisc(CROWN, CROWN.r + .3, crownFloor);

    // Balustrades on every edge that looks down into the clouds.
    const ringRail = (c, r, n, skip) => { for (let i = 0; i < n; i++) if (!skip.includes(i)) w.balustrade(...ring(c, r, i / n * Math.PI * 2), ...ring(c, r, (i + 1) / n * Math.PI * 2)); };
    ringRail(LANDING, LANDING.r, 24, [11, 12]);
    for (const P of [BRIDGE, STAIR]) { const S = pathSides(P); w.balustradePath(S.L); w.balustradePath(S.R); }
    w.balustradePath([[-2.6, 44], [-16, 44], [-16, 57.6]]); w.balustradePath([[-16, 62.4], [-16, 76], [-3, 76]]);
    // The Starlit Library: a round platform over the clouds, reached by a bridge off the terrace's west side.
    slabRect(-27.6, 57.6, -16, 62.4);
    w.balustradePath([[-16, 57.6], [-27.4, 57.6]]); w.balustradePath([[-16, 62.4], [-27.4, 62.4]]);
    slabDisc(LIBRARY, LIBRARY.r + .3);
    ringRail(LIBRARY, LIBRARY.r, 24, [5, 6]);
    w.balustradePath([[2.6, 44], [16, 44], [16, 76], [3, 76]]);
    ringRail(CROWN, CROWN.r, 28, [0, 27]);
    for (const sx of [1, -1]) {
      const pts = GARDEN.map(([x, z]) => [x * sx, z]);
      w.balustradePath(pts.slice(0, 5));
      w.wall(...pts[4], ...pts[5], { mat: 'whitestone', h: 5, crenel: false });
    }
    // The Moon Gate hall: a ring of white walls, open south to the stair and north through the gate.
    for (let i = 0; i < 20; i++) {
      if ([0, 19, 9, 10].includes(i)) continue;
      w.wall(...ring(GATEHALL, GATEHALL.r, i / 20 * Math.PI * 2), ...ring(GATEHALL, GATEHALL.r, (i + 1) / 20 * Math.PI * 2), { mat: 'whitestone', h: 5.5, crenel: false });
    }
    w.arch(0, 131.6, 0, 7.4, 6.2);

    // Arches and chimes, broken pillars, pale blossoming trees and moonwater.
    w.arch(0, 9.2, 0, 5.6, 4.6); w.arch(0, 43.6, 0, 5.6, 5); w.arch(0, 76.4, 0, 6.4, 5.2);
    for (const [x, z] of [[-10, 50], [10, 50], [-10, 70], [10, 70]]) w.pillar(x, z, .55, 6, false, 'whitestone');
    for (const [x, z, b] of [[-6, 64, 1], [6, 64, 0], [-13.5, 56, 1], [13.5, 60, 0]]) if (clear(x, z, 1.5)) w.pillar(x, z, .6, 5.5, !!b, 'whitestone');
    for (let i = 0; i < 8; i++) { const [x, z] = ring(CROWN, 12.5, (i + .5) / 8 * Math.PI * 2); w.pillar(x, z, .75, 7, i % 3 === 0, 'whitestone'); }
    const paleTree = (x, z, h, seed) => {
      w.deadTree(x, z, h, seed, true, 'palebark');
      for (let i = 0; i < 4; i++) {
        const c = w.rock(h * (.18 + R() * .08), seed * 5 + i, .25); c.scale(1, .7, 1);
        c.translate(x + (R() - .5) * h * .5, h * (.8 + R() * .3), z + (R() - .5) * h * .5); w.batch('blossom', c);
      }
    };
    paleTree(6.5, -4.5, 5.5, 3); paleTree(-6.5, 4.5, 4.5, 7);
    for (const [x, z, h] of [[-15, 150, 6], [15, 146, 5.5], [-6, 134.5, 4.5], [6.5, 158, 5], [-16, 157, 4.8]]) if (clear(x, z, 2.2)) paleTree(x, z, h, Math.round(x * 3 + z));
    w.moonpool(0, 66, 2.2); w.moonpool(-8, 146, 2); w.moonpool(8, 148, 1.6); w.moonpool(0, 136.5, 1.3);

    // The library: shelves of books round the rim, a reading table, lecterns, and an orrery turning at the heart.
    const shelfMats = [0x6a2a2a, 0x2a3a6a, 0x3a5a2a, 0x6a5a2a, 0x4a2a5a].map((c, i) => (M['book' + i] = new THREE.MeshStandardMaterial({ color: c, roughness: .8 }), 'book' + i));
    for (let i = 0; i < 10; i++) {
      const a = (i + .5) / 10 * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < .5) continue;   // keep the bridge side open
      const [x, z] = ring(LIBRARY, LIBRARY.r - 1.1, a), ry = -a;   // books face the reading room
      const sh = boxGeo(2.4, 3.2, .55, 2); sh.translate(0, 1.6, 0); sh.rotateY(ry); sh.translate(x, 0, z); w.batch('whitestone', sh);
      for (let row = 0; row < 4; row++) for (let b = 0; b < 9; b++) {
        if (R() < .15) continue;
        const bh = .45 + R() * .2, book = boxGeo(.2, bh, .4, 1); book.translate(-1 + b * .25, .3 + row * .75 + bh / 2, .12); book.rotateY(ry); book.translate(x, 0, z);
        w.batch(shelfMats[Math.floor(R() * shelfMats.length)], book);
      }
      w.prop(w.addBox(x, z, 1.2, .3, ry, 3.2));
    }
    const table = new THREE.Group();
    const tt = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .12, 20), M.whitestone); tt.position.y = .9; table.add(tt);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.2, .35, .9, 10), M.whitestone); leg.position.y = .45; table.add(leg);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(boxGeo(.35, .08, .5, 1), M['book' + (i % 5)]); b.position.set((R() - .5) * 1.4, 1, (R() - .5) * 1.4); b.rotation.y = R() * 3; table.add(b); }
    table.position.set(-36, 0, 56.4); table.traverse(o => { o.castShadow = true; o.receiveShadow = true; }); g.add(table); w.prop(w.addCyl(-36, 56.4, 1.35, 1));
    const orrery = new THREE.Group(); orrery.position.set(-36, 2.6, 61.2); g.add(orrery);
    const brass = new THREE.MeshStandardMaterial({ color: 0xd8b86a, metalness: .9, roughness: .3, emissive: 0x3a2a08 });
    const rings = [1.4, 1.1, .8].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 6, 40), brass); m.rotation.x = i * .9; orrery.add(m); return m; });
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xb8c8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); heart.scale.setScalar(1.8); orrery.add(heart);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), new THREE.MeshBasicMaterial({ color: 0xeef2ff })); orrery.add(orb);
    const stand = new THREE.CylinderGeometry(.08, .3, 1.3, 8); stand.translate(-36, .65, 61.2); w.batch('whitestone', stand); w.prop(w.addCyl(-36, 61.2, .4, 2));
    w.anim.push(t => { rings.forEach((m, i) => { m.rotation.y = t * (.3 + i * .25); m.rotation.z = t * (.2 - i * .1); }); });
    w.flames.push({ x: -36, y: 2.6, z: 61.2, color: new THREE.Color(0xb8c8ff), base: 7, phase: 0, flick: 1 });
    for (const [x, z, ry] of [[-41.8, 58, 1.6], [-30.2, 64.8, -2]]) {
      const lec = new THREE.CylinderGeometry(.12, .25, 1.1, 8); lec.translate(x, .55, z); w.batch('whitestone', lec);
      const top = boxGeo(.7, .06, .5, 1); top.rotateX(-.4); top.rotateY(ry); top.translate(x, 1.15, z); w.batch('whitestone', top);
      w.prop(w.addCyl(x, z, .35, 1.2));
    }
    for (const [x, z, id] of [[-31.4, 54.6, 'lurn'], [-43.4, 55, 'lurn2'], [-41.4, 65.8], [-29.4, 57.2], [-34.4, 67.6]]) w.breakable('urn', x, z, { id, s: 1.1 });
    for (const [x, z] of [[-27.8, 55.6], [-27.8, 64.4]]) w.brazier(x, z, 0x8fb8ff);

    // Marble urns about the terraces and garden; the goblins' stores and blackpowder by the Moon Gate.
    for (const [x, z, id] of [[13.6, 66.4, 'turn'], [-13.8, 46.4], [13.8, 47], [-13.6, 73.6], [14.2, 72.4], [-6.8, 7.2], [7.8, -1.6], [-16.6, 138.6], [16.6, 152.4], [-16.8, 144.4]]) w.breakable('urn', x, z, { id });
    w.pile(-6.6, 118.6, [['crate', 0, 0], ['crate', 1, .2], ['barrel', .2, -1]], .4);
    w.pile(6.8, 117.4, [['keg', 0, 0], ['keg', .8, .3], ['keg', .1, .9]], 0);

    // Moon-blue lanterns along the climb.
    for (const [x, z] of [[-5.5, -7], [2.4, 42.5], [-2.4, 42.5], [-15, 75], [15, 75], [-2.8, 111], [2.8, 111], [-5, 159], [5, 159]]) w.brazier(x, z, 0x8fb8ff);
    for (let i = 0; i < 6; i++) { const [x, z] = ring(CROWN, CROWN.r - 1.2, (i + 1) / 7 * Math.PI * 2); w.brazier(x, z, 0xc9b4ff); }

    // Below: a sea of cloud and far peaks, so the terraces hang in the sky.
    const cloudMat = new THREE.SpriteMaterial({ map: w.glowTex, color: 0x8a98c8, transparent: true, opacity: .32, depthWrite: false, fog: false });
    for (let i = 0; i < 90; i++) {
      const c = new THREE.Sprite(cloudMat); const a = R() * 6.28, r = 20 + R() * 150;
      c.position.set(Math.sin(a) * r, -10 - R() * 22, 95 + Math.cos(a) * r * 1.3); c.scale.set(40 + R() * 50, 14 + R() * 12, 1); g.add(c);
    }
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x2a3050, roughness: 1, flatShading: true });
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.28, r = 110 + R() * 140, h = 60 + R() * 90;
      const m = new THREE.Mesh(new THREE.ConeGeometry(18 + R() * 26, h, 6), peakMat);
      m.position.set(Math.sin(a) * r, -70 + h / 2 - R() * 30, 95 + Math.cos(a) * r); m.rotation.y = R() * 6; g.add(m);
    }
  },
};
