// The look: every frame is drawn into a half-float target exactly as it would be drawn to the screen (tone
// mapped, in sRGB, with the fog laid over afterwards), except that where glows pile up the light runs on past
// white. It is then composed onto the screen. Bloom is a chain of downsampled, blurred copies of what burns
// brightest (fires, glows, crystals, the Moonwell, a Flashcut). The grade gives each place its own cast of light
// and shadow. Then come a vignette and fine grain, and the moment's colour: red at the edges when health runs
// low, the Fae Shift's rose, an Umbral Realm's violet dusk, a split of colour on a Flashcut or a Thorn Counter,
// the grey of a fall.
import * as THREE from 'three';

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Bright parts only, with a soft knee so the bloom fades in rather than switching on.
const PREFILTER = `uniform sampler2D tIn; uniform float uThresh, uKnee; uniform vec2 uTexel; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tIn, vUv + uTexel * vec2(-.5, -.5)).rgb + texture2D(tIn, vUv + uTexel * vec2(.5, -.5)).rgb
         + texture2D(tIn, vUv + uTexel * vec2(-.5, .5)).rgb + texture2D(tIn, vUv + uTexel * vec2(.5, .5)).rgb;
  c *= .25;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThresh + uKnee, 0.0, 2.0 * uKnee); soft = soft * soft / (4.0 * uKnee + 1e-4);
  float w = max(soft, br - uThresh) / max(br, 1e-4);
  gl_FragColor = vec4(min(c * w, vec3(24.0)), 1.0);
}`;
// Dual-filter blur: down takes the centre and four diagonals, up spreads a tent over eight taps.
const DOWN = `uniform sampler2D tIn; uniform vec2 uTexel; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tIn, vUv).rgb * 4.0;
  c += texture2D(tIn, vUv + uTexel * vec2(-1., -1.)).rgb + texture2D(tIn, vUv + uTexel * vec2(1., -1.)).rgb
     + texture2D(tIn, vUv + uTexel * vec2(-1., 1.)).rgb + texture2D(tIn, vUv + uTexel * vec2(1., 1.)).rgb;
  gl_FragColor = vec4(c / 8.0, 1.0);
}`;
const UP = `uniform sampler2D tIn, tAdd; uniform vec2 uTexel; uniform float uMix; varying vec2 vUv;
void main() {
  vec2 o = uTexel;
  vec3 c = texture2D(tIn, vUv + vec2(-2. * o.x, 0.)).rgb + texture2D(tIn, vUv + vec2(2. * o.x, 0.)).rgb
         + texture2D(tIn, vUv + vec2(0., -2. * o.y)).rgb + texture2D(tIn, vUv + vec2(0., 2. * o.y)).rgb
         + (texture2D(tIn, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tIn, vUv + vec2(o.x, -o.y)).rgb
          + texture2D(tIn, vUv + vec2(-o.x, o.y)).rgb + texture2D(tIn, vUv + vec2(o.x, o.y)).rgb) * 2.0;
  gl_FragColor = vec4(c / 12.0 + texture2D(tAdd, vUv).rgb * uMix, 1.0);
}`;
const COMPOSE = `uniform sampler2D tScene, tBloom; uniform float uBloom, uVig, uGrain, uTime, uSat, uContrast, uHurt, uShift, uRealm, uSplit, uGrey, uBeat;
uniform vec3 uLift, uGain, uEdge; uniform vec2 uAspect; varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 d = vUv - .5;
  vec3 c;
  if (uSplit > .001) { vec2 o = d * uSplit * .018; c = vec3(texture2D(tScene, vUv + o).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv - o).b); }
  else c = texture2D(tScene, vUv).rgb;
  c += texture2D(tBloom, vUv).rgb * uBloom;
  c = c / (1.0 + max(c - .85, 0.0) * 1.2);   // a soft shoulder where the bloom piles past white
  c = clamp(c, 0.0, 1.0);
  // The place's grade: saturation, contrast about the middle, coloured shadows (lift) and light (gain).
  float l = dot(c, vec3(.2126, .7152, .0722));
  c = mix(vec3(l), c, uSat * (1.0 - uGrey));
  c = (c - .5) * uContrast + .5;
  c = c * uGain + uLift * (1.0 - c);
  // The moment: a Fae Shift warms toward rose, a realm sinks to violet.
  c = mix(c, c * vec3(1.12, .9, 1.1) + vec3(.03, 0., .04), uShift);
  c = mix(c, vec3(dot(c, vec3(.3, .5, .2))) * vec3(.82, .72, 1.15), uRealm * .45);
  // The vignette, with the edge colour (red when hurt) breathing in at the corners.
  float r = length(d * uAspect);
  float v = smoothstep(.35, 1.05, r);
  c *= 1.0 - v * uVig;
  c = mix(c, uEdge, clamp(v * (uHurt * (.55 + .45 * uBeat)) * 1.4, 0.0, .75));
  // Grain, evenly in shadow and light (it also breaks up banding in the fog).
  c += (hash(vUv * 1024.0 + fract(uTime) * 91.7) - .5) * uGrain;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

// Each place's cast. lift: the colour shadows take; gain: the colour light takes; sat, contrast.
const G0 = { lift: [.012, .014, .03], gain: [1, 1, 1.02], sat: 1.06, contrast: 1.06 };
export const GRADES = {
  keep: { lift: [.012, .016, .04], gain: [.98, 1, 1.05], sat: 1.04, contrast: 1.08 },
  rotwood: { lift: [.03, .016, .01], gain: [1.06, .99, .9], sat: 1.1, contrast: 1.06 },
  deep: { lift: [.005, .02, .03], gain: [.94, 1.02, 1.04], sat: 1.08, contrast: 1.1 },
  moonspire: { lift: [.02, .02, .035], gain: [1.02, 1.02, 1.05], sat: .96, contrast: 1.04 },
  frostmere: { lift: [.015, .025, .045], gain: [.95, 1.01, 1.08], sat: .92, contrast: 1.06 },
  abbey: { lift: [.005, .025, .03], gain: [.94, 1.02, 1.02], sat: 1.02, contrast: 1.08 },
  forge: { lift: [.04, .012, .005], gain: [1.08, .97, .86], sat: 1.12, contrast: 1.1 },
  thornwood: { lift: [.012, .025, .01], gain: [1.02, 1.04, .9], sat: 1.1, contrast: 1.05 },
  crater: { lift: [.025, .01, .04], gain: [1.02, .95, 1.08], sat: 1.08, contrast: 1.08 },
  court: { lift: [.02, .015, .03], gain: [1.05, 1.02, .98], sat: 1, contrast: 1.05 },
  shore: { lift: [.015, .02, .04], gain: [1, 1.02, 1.06], sat: .95, contrast: 1.06 },
  hollows: { lift: [.01, .02, .045], gain: [.96, 1.02, 1.08], sat: 1.1, contrast: 1.08 },
  necropolis: { lift: [.02, .02, .025], gain: [1.03, 1.02, .99], sat: .85, contrast: 1.1 },
  umbra: { lift: [.02, .005, .045], gain: [.98, .94, 1.08], sat: 1.05, contrast: 1.12 },
  heart: { lift: [.035, .01, .03], gain: [1.06, .96, 1.02], sat: 1.1, contrast: 1.08 },
  thornyard: { lift: [.02, .018, .03], gain: [1.04, 1.02, .98], sat: 1.04, contrast: 1.06 },
  map: { lift: [.01, .014, .03], gain: [1, 1.01, 1.03], sat: 1.08, contrast: 1.04 },
  twilight: { lift: [.045, .008, .015], gain: [1.08, .9, .9], sat: 1.05, contrast: 1.1 },
};

// Light keeps most of its own colour: a grade leans the highlights only a little, the shadows more.
for (const g of Object.values(GRADES)) g.gain = g.gain.map(v => 1 + (v - 1) * .3);

const quad = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return g;
})();

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    const ext = renderer.extensions;
    // Light brighter than white needs a float target; without one, the frame is drawn plainly.
    this.supported = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
    this.enabled = this.supported;
    this.hi = true;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    this.mesh = new THREE.Mesh(quad, null); this.mesh.frustumCulled = false; this.scene.add(this.mesh);
    const mat = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
    this.pre = mat(PREFILTER, { tIn: { value: null }, uThresh: { value: .78 }, uKnee: { value: .3 }, uTexel: { value: new THREE.Vector2() } });
    this.down = mat(DOWN, { tIn: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.up = mat(UP, { tIn: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() }, uMix: { value: 1 } });
    const v3 = a => ({ value: new THREE.Vector3(...a) });
    this.comp = mat(COMPOSE, {
      tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .55 }, uVig: { value: .34 }, uGrain: { value: .028 }, uTime: { value: 0 },
      uSat: { value: 1 }, uContrast: { value: 1 }, uLift: v3(G0.lift), uGain: v3(G0.gain), uEdge: v3([.45, .02, .05]), uAspect: { value: new THREE.Vector2(1, 1) },
      uHurt: { value: 0 }, uShift: { value: 0 }, uRealm: { value: 0 }, uSplit: { value: 0 }, uGrey: { value: 0 }, uBeat: { value: 0 },
    });
    this.fogWas = new THREE.Color(); this.bgWas = new THREE.Color(); this.rgb = { r: 0, g: 0, b: 0 };
    this.grade = { ...G0, lift: [...G0.lift], gain: [...G0.gain] };
    this.want = this.grade;
    this.fx = { hurt: 0, shift: 0, realm: 0, split: 0, grey: 0, bloom: 0 };
    this.w = this.h = 0;
  }

  // Width and height in device pixels.
  setSize(w, h) {
    w = Math.max(1, Math.floor(w)); h = Math.max(1, Math.floor(h));
    if (w === this.w && h === this.h && this.rt?.samples === (this.hi ? 4 : 0)) return;
    this.w = w; this.h = h;
    this.dispose();
    if (!this.supported) return;
    const o = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.rt = new THREE.WebGLRenderTarget(w, h, { ...o, depthBuffer: true, samples: this.hi ? 4 : 0 });
    // Drawn as the screen is: three.js tone maps and encodes to sRGB only for the screen, or for a target
    // flagged as XR's. (Fog and the clear colour are passed through in sRGB for it at render time.)
    this.rt.isXRRenderTarget = true; this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    this.mips = []; this.ups = [];
    let mw = w >> 1, mh = h >> 1;
    for (let i = 0; i < (this.hi ? 6 : 4) && mw >= 4 && mh >= 4; i++) {
      this.mips.push(new THREE.WebGLRenderTarget(mw, mh, o));
      this.ups.push(new THREE.WebGLRenderTarget(mw, mh, o));
      mw >>= 1; mh >>= 1;
    }
    this.comp.uniforms.uAspect.value.set(w / h, 1).multiplyScalar(1 / Math.max(1, w / h) * 1.15);
  }
  setQuality(hi) { if (this.hi !== hi) { this.hi = hi; const { w, h } = this; this.w = 0; if (w) this.setSize(w, h); } }
  dispose() { this.rt?.dispose(); for (const t of [...(this.mips || []), ...(this.ups || [])]) t.dispose(); this.rt = null; this.mips = []; this.ups = []; }

  // The place whose grade to ease toward (GRADES key), at once or over a second or two.
  setGrade(key, now = false) {
    this.want = GRADES[key] || G0;
    if (now) this.grade = { ...this.want, lift: [...this.want.lift], gain: [...this.want.gain] };
  }

  // The moment's colour, set each frame from the game: hurt 0-1, shift 0/1, realm 0-1, grey 0-1; split and
  // bloom are pulses that die away by themselves.
  pulse(kind, k = 1) { this.fx[kind] = Math.max(this.fx[kind], k); }

  pass(mat, target) { this.mesh.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }

  render(scene, camera, dt = 1 / 60, state = {}) {
    const r = this.renderer;
    if (!this.enabled || !this.rt) { r.setRenderTarget(null); r.render(scene, camera); return; }
    // Ease the grade and the moment's colour.
    const k = 1 - Math.exp(-dt * 1.6), g = this.grade, w = this.want;
    for (let i = 0; i < 3; i++) { g.lift[i] += (w.lift[i] - g.lift[i]) * k; g.gain[i] += (w.gain[i] - g.gain[i]) * k; }
    g.sat += (w.sat - g.sat) * k; g.contrast += (w.contrast - g.contrast) * k;
    const f = this.fx, ease = (a, b, s) => a + (b - a) * (1 - Math.exp(-dt * s));
    f.hurt = ease(f.hurt, state.hurt || 0, 3); f.shift = ease(f.shift, state.shift || 0, 2.5); f.realm = ease(f.realm, state.realm || 0, 1.5); f.grey = ease(f.grey, state.grey || 0, 1.2);
    f.split = Math.max(0, f.split - dt * 2.2); f.bloom = Math.max(0, f.bloom - dt * 1.4);
    this.t = (this.t || 0) + dt;

    // The scene, as the screen would show it, into light that can run past white. Off screen, three.js hands fog
    // and the clear colour to the shaders as linear; they are wanted in sRGB here, as for the screen.
    const fog = scene.fog, bg = scene.background?.isColor ? scene.background : null, rgb = this.rgb;
    if (fog) { this.fogWas.copy(fog.color); fog.color.getRGB(rgb, THREE.SRGBColorSpace); fog.color.setRGB(rgb.r, rgb.g, rgb.b, THREE.LinearSRGBColorSpace); }
    if (bg) { this.bgWas.copy(bg); bg.getRGB(rgb, THREE.SRGBColorSpace); bg.setRGB(rgb.r, rgb.g, rgb.b, THREE.LinearSRGBColorSpace); }
    r.setRenderTarget(this.rt); r.render(scene, camera);
    if (fog) fog.color.copy(this.fogWas);
    if (bg) bg.copy(this.bgWas);
    // Bloom: the bright parts at half size, halved again and again, then spread back up.
    const n = this.mips.length;
    this.pre.uniforms.tIn.value = this.rt.texture; this.pre.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
    this.pass(this.pre, this.mips[0]);
    for (let i = 1; i < n; i++) {
      this.down.uniforms.tIn.value = this.mips[i - 1].texture; this.down.uniforms.uTexel.value.set(1 / this.mips[i - 1].width, 1 / this.mips[i - 1].height);
      this.pass(this.down, this.mips[i]);
    }
    let src = this.mips[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      const u = this.up.uniforms;
      u.tIn.value = src.texture; u.tAdd.value = this.mips[i].texture; u.uTexel.value.set(.5 / src.width, .5 / src.height); u.uMix.value = 1;
      this.pass(this.up, this.ups[i]); src = this.ups[i];
    }
    // Compose onto the screen.
    const c = this.comp.uniforms;
    c.tScene.value = this.rt.texture; c.tBloom.value = src.texture;
    c.uBloom.value = (.5 + f.shift * .25 + f.bloom * .6) / Math.max(1, n - 1) * 1.6;
    c.uTime.value = this.t; c.uSat.value = g.sat; c.uContrast.value = g.contrast; c.uLift.value.set(...g.lift); c.uGain.value.set(...g.gain);
    c.uHurt.value = f.hurt; c.uShift.value = f.shift * .5; c.uRealm.value = f.realm; c.uSplit.value = f.split; c.uGrey.value = f.grey * .85;
    c.uBeat.value = Math.pow(Math.max(0, Math.sin(this.t * 5.2)), 6);
    this.pass(this.comp, null);
  }
}
