// Models for the armory's weapons (armory.js), built from primitives into the knight's hands like the first five.
// A held weapon points along its hand's +Z with its edge along ±Y; bare weapons (claws, tonfas) sit on the
// gauntlet and follow the forearm (-Y). Each entry: node (and off, for a pair), tip / base for the trail, grip
// (where the other hand holds, along the blade), and back (how it rides on the back when carried, not drawn).

export function buildArmory({ THREE, mats, mesh, node, armR, armL, chest, backMount, V, sword, fangGeo }) {
  const out = {};
  const hide = (...ns) => { for (const n of ns) n.visible = false; };
  const along = (geo, z) => { geo.rotateX(Math.PI / 2); geo.translate(0, 0, z); return geo; };
  const bladeShape = (w, len, tipLen = .12, curve = 0) => {
    const s = new THREE.Shape();
    s.moveTo(-w, 0); s.quadraticCurveTo(-w + curve * .5, len * .5, -w * .85 + curve, len - tipLen); s.lineTo(curve * .8, len);
    s.lineTo(w * .85 + curve, len - tipLen); s.quadraticCurveTo(w + curve * .5, len * .5, w, 0); s.lineTo(-w, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: .008, bevelEnabled: true, bevelThickness: .003, bevelSize: .004, bevelSegments: 1 });
    g.translate(0, 0, -.004); g.rotateZ(Math.PI / 2); g.rotateY(-Math.PI / 2);   // length along +Z, edge along ±Y
    return g;
  };
  const empty = () => { const g = new THREE.Group(); chest.add(g); g.visible = false; return g; };
  mats.hex = new THREE.MeshStandardMaterial({ color: 0x1a3a18, emissive: 0x6aff5a, emissiveIntensity: 1.6 });
  mats.silk = new THREE.MeshStandardMaterial({ color: 0xf4e4f8, roughness: .7, side: THREE.DoubleSide, emissive: 0x3a2a44, emissiveIntensity: .3 });
  mats.bone = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: .6 });

  // Warblade: a long two-handed blade; the right hand at the guard, the left toward the pommel.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.02, .022, .4, 8), -.08), mats.leather, n);
    mesh(new THREE.SphereGeometry(.035, 8, 6), mats.trim, n, 0, 0, -.3);
    mesh(new THREE.BoxGeometry(.04, .34, .06), mats.trim, n, 0, 0, .13);
    mesh(bladeShape(.055, 1.5, .2), mats.blade, n, 0, 0, .15);
    out.great = { node: n, tip: node(n, 0, 0, 1.64), base: node(n, 0, 0, .35), grip: -.22, back: backMount(n, V(-.14, .3, -.22), V(.3, -.94, -.05)) };
    hide(n);
  }
  // Warden's Aegis: the sword, and a round shield on the left forearm.
  {
    const n = sword.clone(true); armR.hand.add(n);
    const sh = node(armL.el, -.07, -.17, 0);
    const disc = new THREE.CylinderGeometry(.3, .3, .045, 22); disc.rotateZ(Math.PI / 2);
    mesh(disc, mats.steel, sh);
    const rim = new THREE.TorusGeometry(.3, .02, 6, 26); rim.rotateY(Math.PI / 2); mesh(rim, mats.trim, sh);
    mesh(new THREE.SphereGeometry(.07, 10, 8), mats.trim, sh, -.03, 0, 0).scale.set(.6, 1, 1);
    const star = new THREE.OctahedronGeometry(.05); mesh(star, mats.visor, sh, -.06, 0, 0);
    out.aegis = { node: n, off: sh, tip: node(n, 0, 0, 1.08), base: node(n, 0, 0, .2), grip: -.11, back: backMount(n, V(-.16, .42, -.21), V(.38, -.92, -.05)) };
    hide(n, sh);
  }
  // Thorn Daggers: two short straight blades.
  {
    const dagger = hand => {
      const d = node(hand, 0, -.04, 0);
      mesh(along(new THREE.CylinderGeometry(.015, .015, .12, 6), 0), mats.leather, d);
      mesh(new THREE.BoxGeometry(.02, .1, .025), mats.trim, d, 0, 0, .07);
      mesh(bladeShape(.028, .34, .1), mats.blade, d, 0, 0, .08);
      d.visible = false;
      return { d, tip: node(d, 0, 0, .44), base: node(d, 0, 0, .12) };
    };
    const R = dagger(armR.hand), L = dagger(armL.hand);
    const back = new THREE.Group(); chest.add(back); back.add(backMount(R.d, V(-.12, -.12, -.2), V(.75, -.6, -.1)), backMount(R.d, V(.12, -.12, -.2), V(-.75, -.6, -.1)));
    for (const c of back.children) c.visible = true; back.visible = false;
    out.daggers = { node: R.d, off: L.d, tip: R.tip, base: R.base, tip2: L.tip, base2: L.base, grip: -.11, back };
  }
  // Twin Hatchets: a short haft and a bearded head, edge leading (+Y).
  {
    const hatchet = hand => {
      const h = node(hand, 0, -.04, 0);
      mesh(along(new THREE.CylinderGeometry(.018, .02, .5, 6), .12), mats.shaft, h);
      const head = node(h, 0, .05, .36);
      mesh(new THREE.BoxGeometry(.022, .16, .12), mats.iron, head, 0, .02, 0);
      const edge = new THREE.BoxGeometry(.012, .05, .18); mesh(edge, mats.blade, head, 0, .12, 0);
      mesh(new THREE.ConeGeometry(.025, .08, 4), mats.trim, head, 0, -.08, 0).rotation.x = Math.PI;
      h.visible = false;
      return { h, tip: node(h, 0, .2, .38), base: node(h, 0, 0, .2) };
    };
    const R = hatchet(armR.hand), L = hatchet(armL.hand);
    const back = new THREE.Group(); chest.add(back); back.add(backMount(R.h, V(-.13, -.1, -.2), V(.7, -.65, -.1)), backMount(R.h, V(.13, -.1, -.2), V(-.7, -.65, -.1)));
    for (const c of back.children) c.visible = true; back.visible = false;
    out.hatchets = { node: R.h, off: L.h, tip: R.tip, base: R.base, tip2: L.tip, base2: L.base, grip: -.11, back };
  }
  // Briar Chain: a grip and weight in hand; the chain and its sickle are a rope the player drapes each frame
  // from the hand toward the tip, where the swing would put the sickle.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.02, .02, .18, 6), 0), mats.leather, n);
    mesh(new THREE.SphereGeometry(.045, 8, 6), mats.iron, n, 0, 0, -.12);
    // The chain: one short iron link per segment, stretched between the rope's points each frame.
    const N = 14, line = new THREE.Group(); line.visible = false;
    const linkGeo = new THREE.CylinderGeometry(.016, .016, 1, 5);
    for (let i = 0; i < N; i++) { const m = new THREE.Mesh(linkGeo, mats.steel); m.castShadow = true; m.frustumCulled = false; line.add(m); }
    const sickle = new THREE.Group(); sickle.visible = false;
    const blade = new THREE.Shape(); blade.moveTo(0, 0); blade.quadraticCurveTo(.2, .05, .3, .26); blade.quadraticCurveTo(.12, .1, 0, .06); blade.lineTo(0, 0);
    const bg = new THREE.ExtrudeGeometry(blade, { depth: .01, bevelEnabled: false }); bg.translate(0, 0, -.005);
    sickle.add(new THREE.Mesh(bg, mats.blade), new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .14, 6).translate(0, -.05, 0), mats.shaft));
    out.chain = { node: n, tip: node(n, 0, 0, 2.7), base: node(n, 0, 0, 1.2), grip: .24, back: empty(), rope: { N, len: 2.7, line, sickle, pts: [] } };
    hide(n);
  }
  // Harvest Moon: a long black haft and a great crescent blade at its head, edge along +Y.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.02, .024, 1.9, 8), .35), mats.dark, n);
    for (const z of [-.1, .9, 1.28]) mesh(along(new THREE.CylinderGeometry(.028, .028, .05, 8), z), mats.trim, n);
    const s = new THREE.Shape(); s.moveTo(0, -.03); s.quadraticCurveTo(.5, -.05, .78, -.42); s.quadraticCurveTo(.42, -.14, 0, .05); s.lineTo(0, -.03);
    const g = new THREE.ExtrudeGeometry(s, { depth: .008, bevelEnabled: true, bevelThickness: .003, bevelSize: .004, bevelSegments: 1 });
    g.translate(0, 0, -.004); g.rotateZ(Math.PI / 2); g.rotateY(-Math.PI / 2);
    mesh(g, mats.blade, n, 0, 0, 1.28);
    out.scythe = { node: n, tip: node(n, 0, .78, .86), base: node(n, 0, .1, 1.28), grip: .3, back: backMount(n, V(.05, .12, -.24), V(-.42, .9, -.08)) };
    hide(n);
  }
  // Wolf Claws: gauntlets with three hooked blades over the knuckles.
  {
    const claw = hand => {
      const g = node(hand, 0, 0, 0);
      mesh(new THREE.BoxGeometry(.1, .1, .115), mats.dark, g, 0, -.06, .01);
      mesh(new THREE.CylinderGeometry(.064, .056, .13, 8), mats.dark, g, 0, .05, 0);
      for (const x of [-.035, 0, .035]) { const c = new THREE.ConeGeometry(.012, .3, 4); c.rotateX(Math.PI); c.translate(0, -.26, 0); const m = mesh(c, mats.blade, g, x, 0, .05); m.rotation.x = -.18; }
      g.visible = false;
      return { g, tip: node(g, 0, -.42, .1), base: node(g, 0, -.1, .05) };
    };
    const R = claw(armR.hand), L = claw(armL.hand);
    out.claws = { node: R.g, off: L.g, tip: R.tip, base: R.base, tip2: L.tip, base2: L.base, grip: 0, bare: true, back: empty() };
  }
  // Grinder's Wheel: a haft and a toothed saw-disc that turns in the plane of the haft.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.026, .03, 1.1, 8), .25), mats.shaft, n);
    const hub = node(n, 0, 0, .98);
    const disc = new THREE.Group(); hub.add(disc);
    const d = new THREE.CylinderGeometry(.3, .3, .025, 28); d.rotateZ(Math.PI / 2); disc.add(new THREE.Mesh(d, mats.iron));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, t = new THREE.ConeGeometry(.03, .08, 3); const m = new THREE.Mesh(t, mats.blade); m.position.set(0, Math.cos(a) * .32, Math.sin(a) * .32); m.rotation.x = a; disc.add(m); }
    disc.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), mats.trim));
    out.saw = { node: n, tip: node(n, 0, 0, 1.3), base: node(n, 0, 0, .7), grip: .22, disc, back: backMount(n, V(.02, .1, -.24), V(-.4, .9, -.1)) };
    hide(n);
  }
  // Seer's Hexblade: the sword with a hex-orb set in its guard and runes along the fuller.
  {
    const n = sword.clone(true); armR.hand.add(n);
    const orb = mesh(new THREE.SphereGeometry(.045, 10, 8), mats.hex, n, 0, 0, .1);
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(.012, .008, .06), mats.hex, n, 0, 0, .3 + i * .15);
    out.hexblade = { node: n, tip: node(n, 0, 0, 1.08), base: node(n, 0, 0, .2), grip: -.11, orb, back: backMount(n, V(-.16, .42, -.21), V(.38, -.92, -.05)) };
    hide(n);
  }
  // Moonstaff: a long pole shod in moon-silver at both ends, held a third of the way along.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.022, .022, 2.05, 8), .2), mats.shaft, n);
    for (const z of [-.8, 1.2]) { mesh(along(new THREE.CylinderGeometry(.03, .03, .16, 8), z), mats.steel, n); mesh(new THREE.SphereGeometry(.035, 8, 6), mats.trim, n, 0, 0, z + Math.sign(z) * .09); }
    for (const z of [.02, .4]) mesh(along(new THREE.CylinderGeometry(.027, .027, .04, 8), z), mats.trim, n);
    out.staff = { node: n, tip: node(n, 0, 0, 1.28), base: node(n, 0, 0, .7), grip: .38, back: backMount(n, V(.05, .12, -.24), V(-.42, .9, -.08)) };
    hide(n);
  }
  // Moth Fans: two folding war-fans of silk on steel ribs, opening along the blade.
  {
    const fan = hand => {
      const f = node(hand, 0, -.04, 0);
      const silk = new THREE.CircleGeometry(.36, 14, -Math.PI * .42, Math.PI * .84); silk.rotateY(-Math.PI / 2); silk.rotateX(-Math.PI / 2);
      mesh(silk, mats.silk, f, 0, 0, .02);
      for (let i = 0; i < 7; i++) { const a = -Math.PI * .42 + i / 6 * Math.PI * .84, r = new THREE.BoxGeometry(.006, .006, .36); r.translate(0, 0, .18); const m = mesh(r, mats.steel, f); m.rotation.x = -a; }
      f.visible = false;
      return { f, tip: node(f, 0, 0, .38), base: node(f, 0, 0, .1) };
    };
    const R = fan(armR.hand), L = fan(armL.hand);
    const back = new THREE.Group(); chest.add(back); back.add(backMount(R.f, V(-.12, .05, -.22), V(.6, -.7, -.1)), backMount(R.f, V(.12, .05, -.22), V(-.6, -.7, -.1)));
    for (const c of back.children) c.visible = true; back.visible = false;
    out.fans = { node: R.f, off: L.f, tip: R.tip, base: R.base, tip2: L.tip, base2: L.base, grip: -.11, back };
  }
  // Moon Tonfas: batons along each forearm, held by the side handle, the long end past the elbow.
  {
    const tonfa = hand => {
      const g = node(hand, 0, 0, 0);
      mesh(new THREE.BoxGeometry(.1, .1, .115), mats.steel, g, 0, -.06, .01);
      const stick = new THREE.CylinderGeometry(.024, .026, .56, 8); mesh(stick, mats.shaft, g, 0, .12, .08);
      mesh(new THREE.SphereGeometry(.03, 8, 6), mats.trim, g, 0, -.16, .08);
      mesh(new THREE.CylinderGeometry(.03, .03, .05, 8), mats.trim, g, 0, .38, .08);
      g.visible = false;
      return { g, tip: node(g, 0, -.18, .08), base: node(g, 0, .38, .08) };
    };
    const R = tonfa(armR.hand), L = tonfa(armL.hand);
    out.tonfas = { node: R.g, off: L.g, tip: R.tip, base: R.base, tip2: L.tip, base2: L.base, grip: 0, bare: true, back: empty() };
  }
  // Silkclaw's Rapier: a long needle blade and a swept basket hilt.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.015, .015, .16, 6), 0), mats.leather, n);
    mesh(new THREE.SphereGeometry(.028, 8, 6), mats.trim, n, 0, 0, -.1);
    for (const r of [0, 1.1, -1.1]) { const b = new THREE.TorusGeometry(.07, .008, 5, 12, Math.PI); b.rotateY(Math.PI / 2); const m = mesh(b, mats.trim, n, 0, 0, .06); m.rotation.z = r; }
    mesh(bladeShape(.012, 1.15, .1), mats.blade, n, 0, 0, .1);
    out.rapier = { node: n, tip: node(n, 0, 0, 1.25), base: node(n, 0, 0, .25), grip: -.11, back: backMount(n, V(-.16, .42, -.21), V(.38, -.92, -.05)) };
    hide(n);
  }
  // Rimeblade: a curved, single-edged blade with a round guard.
  {
    const n = node(armR.hand, 0, -.04, 0);
    mesh(along(new THREE.CylinderGeometry(.018, .018, .28, 6), -.04), mats.dark, n);
    mesh(along(new THREE.CylinderGeometry(.06, .06, .012, 16), .11), mats.trim, n);
    mesh(bladeShape(.026, 1.0, .12, .05), mats.blade, n, 0, 0, .12);
    out.katana = { node: n, tip: node(n, 0, .06, 1.12), base: node(n, 0, 0, .25), grip: -.14, back: backMount(n, V(-.16, .42, -.21), V(.38, -.92, -.05)) };
    hide(n);
  }
  // Moonring: a bladed ring held at its grip.
  {
    const n = node(armR.hand, 0, -.04, 0);
    const ring = node(n, 0, 0, .22);
    const t = new THREE.TorusGeometry(.2, .028, 6, 24); t.rotateY(Math.PI / 2); ring.add(new THREE.Mesh(t, mats.blade));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = new THREE.ConeGeometry(.02, .1, 3); const m = new THREE.Mesh(c, mats.trim); m.position.set(0, Math.cos(a) * .25, Math.sin(a) * .25); m.rotation.x = a; ring.add(m); }
    ring.traverse(o => { if (o.isMesh) o.castShadow = true; });
    out.ring = { node: n, tip: node(n, 0, 0, .44), base: node(n, 0, 0, .02), grip: -.11, back: empty() };
    hide(n);
  }
  return out;
}
