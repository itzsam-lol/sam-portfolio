/* ============================================================
   SCENE — one WebGL scene behind the whole page.
   The camera rig is keyframed per section and interpolated by
   real scroll position, so the car is the site's spine rather
   than hero wallpaper.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const BOOT = () => window.BOOT || { scene() {}, sceneFailed() {} };

/* ---------- capability gate ---------- */
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const canvas = document.getElementById('scene');

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

const mem = navigator.deviceMemory || 4;
const cores = navigator.hardwareConcurrency || 4;
const small = innerWidth < 861;
const lowTier = mem <= 2 || cores <= 2;

if (calm || !canvas || !webglOK() || lowTier) {
  BOOT().sceneFailed();
} else {
  start();
}

function start() {
  const TEX = small
    ? { base: 'assets/car/basecolor_1k.webp', orm: 'assets/car/orm_1k.webp', norm: 'assets/car/normal_1k.webp' }
    : { base: 'assets/car/basecolor.webp',    orm: 'assets/car/orm.webp',    norm: 'assets/car/normal.webp' };

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: !small, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 220);

  /* scroll readers — track the *visually smoothed* position when
     ScrollSmoother is running, so the camera never leads the content */
  const scrollY = () => (window.__scrollY ? window.__scrollY() : (window.scrollY || 0));
  const maxScroll = () => (window.__maxScroll
    ? window.__maxScroll()
    : Math.max(1, document.documentElement.scrollHeight - innerHeight));

  /* ---------- studio environment (garage strip lights) ---------- */
  function buildEnv() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0a0e'; g.fillRect(0, 0, 512, 256);

    // two long overhead strips → the long specular highlights on bodywork
    const strip = (y, h, a) => {
      const gr = g.createLinearGradient(0, y - h, 0, y + h);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, `rgba(230,240,255,${a})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, y - h, 512, h * 2);
    };
    strip(52, 26, 0.95);
    strip(104, 14, 0.4);

    const blob = (x, y, r, col) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(96, 150, 130, 'rgba(232,0,43,.55)');     // red pit wall
    blob(400, 132, 110, 'rgba(37,229,255,.28)');  // cool bounce
    blob(268, 232, 150, 'rgba(90,90,110,.25)');   // floor

    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(t).texture;
    pmrem.dispose(); t.dispose();
    return env;
  }
  scene.environment = buildEnv();

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0x0a0a14, 2.2));

  const key = new THREE.DirectionalLight(0xd8ecff, 2.6);
  key.position.set(6, 9, 7); scene.add(key);

  const rim = new THREE.DirectionalLight(0xe8002b, 7);
  rim.position.set(-9, 2.5, -6.5); scene.add(rim);

  const cool = new THREE.DirectionalLight(0x2a6cff, 1.6);
  cool.position.set(8, 1.5, -7); scene.add(cool);

  const under = new THREE.PointLight(0x6600cc, 4.5, 26);
  under.position.set(0, -4.5, 3); scene.add(under);

  /* ---------- rig ---------- */
  const carGroup = new THREE.Group();
  const carPivot = new THREE.Group();      // scroll-driven yaw + push-away
  carPivot.add(carGroup);
  scene.add(carPivot);

  /* ---------- contact shadow ---------- */
  (function shadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,.72)');
    gr.addColorStop(0.45, 'rgba(0,0,0,.34)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 5.2),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c), transparent: true,
        depthWrite: false, opacity: 0.85,
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = -1.28;
    carGroup.add(m);
  })();

  /* ---------- speed streaks ---------- */
  const streaks = (function () {
    const N = small ? 90 : 200;
    const pos = new Float32Array(N * 6);
    const dir = new Float32Array(N * 2);
    const rnd = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3.4 + Math.random() * 12;
      const x = Math.cos(a) * r, y = (Math.random() - 0.4) * 9, z = -30 + Math.random() * 60;
      for (let k = 0; k < 2; k++) {
        pos[i * 6 + k * 3] = x; pos[i * 6 + k * 3 + 1] = y; pos[i * 6 + k * 3 + 2] = z;
        dir[i * 2 + k] = k;                       // 0 = head, 1 = tail
        rnd[i * 2 + k] = 0.35 + Math.random() * 0.65;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 1));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uLen: { value: 0 }, uOp: { value: 0 }, uT: { value: 0 } },
      vertexShader: `
        attribute float aDir; attribute float aRnd;
        uniform float uLen; uniform float uT;
        varying float vA;
        void main(){
          vec3 p = position;
          p.z = mod(p.z + uT * aRnd * 9.0 + 30.0, 60.0) - 30.0;
          p.z += aDir * uLen * aRnd;
          vA = (1.0 - aDir) * aRnd;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform float uOp; varying float vA;
        void main(){ gl_FragColor = vec4(0.92,0.95,1.0, vA * uOp); }`,
    });
    const ls = new THREE.LineSegments(geo, mat);
    ls.frustumCulled = false;
    scene.add(ls);
    return mat;
  })();

  /* ---------- shot list ----------
     One shot per section, interpolated by real scroll position.

     Shots are described in *composition* terms rather than world coordinates,
     so the framing survives any viewport:
       dist / az / el  — an orbit around the car
       fov             — vertical field of view
       rel             — the car's heading RELATIVE to the camera, so changing
                         the azimuth never swings us round to a different side
                         of the model; world yaw is derived as rel + azimuth
       frame [x,y]     — where the car should land on screen, as a fraction of
                         the viewport (0.5,0.5 = dead centre)
       push            — the car's own travel along z (used to launch it away)
       op              — canvas opacity, so the car recedes behind copy

     Hand-tuned world positions break the moment the window resizes; this
     survives it. A 4.4 × 0.9 unit car is also a thin sliver on a portrait
     screen, so narrow viewports get their own head-on `portrait` overrides
     rather than a scaled-down version of the desktop framing. */
  const D2R = Math.PI / 180;
  const SHOTS = [
    // id          dist   az°    el°  fov  rel     push  opacity  frame [x,y]
    { id: 'top',     dist: 14.5, az: 37,   el: 15, fov: 23, rel: 0.29,  push: 0,   op: 1.00, frame: [0.60, 0.42],
      portrait: { dist: 8.6, az: 16, el: 11, fov: 33, rel: 1.44, frame: [0.50, 0.34] } },
    { id: 'driver',  dist: 13.0, az: -72,  el: 8,  fov: 22, rel: -0.31, push: 0,   op: 0.30, frame: [0.66, 0.54],
      portrait: { dist: 10.5, fov: 30, frame: [0.50, 0.50] } },
    { id: 'setup',   dist: 13.5, az: 12,   el: 78, fov: 26, rel: 0.54,  push: 0,   op: 0.22, frame: [0.52, 0.48],
      portrait: { dist: 10.5, fov: 34 } },
    { id: 'history', dist: 19.0, az: 45,   el: 14, fov: 20, rel: -0.16, push: 0,   op: 0.20, frame: [0.26, 0.60],
      portrait: { dist: 14.0, fov: 28, frame: [0.40, 0.56] } },
    { id: 'garage',  dist: 12.5, az: 190,  el: 12, fov: 29, rel: 1.04,  push: 0,   op: 0.28, frame: [0.50, 0.44],
      portrait: { dist: 9.0, fov: 36 } },
    { id: 'crew',    dist: 15.0, az: -130, el: 34, fov: 26, rel: -0.41, push: 0,   op: 0.22, frame: [0.70, 0.40],
      portrait: { dist: 12.0, fov: 32, frame: [0.55, 0.44] } },
    { id: 'pitlane', dist: 13.5, az: 0,    el: 8,  fov: 34, rel: -2.91, push: -19, op: 0.85, frame: [0.50, 0.46],
      portrait: { dist: 9.5, fov: 42, push: -14 } },
  ];

  let ACTIVE = SHOTS;
  function pickShots() {
    const portrait = camera.aspect < 1.15;
    ACTIVE = SHOTS.map((s) => (portrait && s.portrait ? Object.assign({}, s, s.portrait) : s));
  }

  // unwrap azimuths once so the camera always takes the short way between
  // consecutive shots — and so the derived yaw never jumps a full turn
  for (let i = 1; i < SHOTS.length; i++) {
    while (SHOTS[i].az - SHOTS[i - 1].az > 180) SHOTS[i].az -= 360;
    while (SHOTS[i].az - SHOTS[i - 1].az < -180) SHOTS[i].az += 360;
  }

  const CAR_CENTRE = new THREE.Vector3(0, -0.55, 0);
  const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3();
  const _wUp = new THREE.Vector3(0, 1, 0);

  /* Turn a shot description into a camera position + lookAt for the current viewport. */
  function compose(dist, az, el, fov, fx, fy, outCam, outLook) {
    const a = camera.aspect;
    // safety net against extreme aspects — sized for a head-on car, since the
    // portrait shots are head-on and the wide ones already sit far enough back
    const need = 2.8 / (2 * Math.tan(fov * 0.5 * D2R) * Math.max(0.35, a));
    const d = Math.max(dist, need);

    const ce = Math.cos(el * D2R), se = Math.sin(el * D2R);
    outCam.set(
      CAR_CENTRE.x + d * ce * Math.sin(az * D2R),
      CAR_CENTRE.y + d * se,
      CAR_CENTRE.z + d * ce * Math.cos(az * D2R)
    );

    _fwd.copy(CAR_CENTRE).sub(outCam).normalize();
    _right.crossVectors(_fwd, _wUp).normalize();
    _up.crossVectors(_right, _fwd).normalize();

    // world size of the frustum at the car's distance
    const h = 2 * d * Math.tan(fov * 0.5 * D2R);
    const w = h * a;

    // put the car at (fx, fy) by sliding the aim point the other way
    outLook.copy(CAR_CENTRE)
      .addScaledVector(_right, -(fx - 0.5) * w)
      .addScaledVector(_up, -(0.5 - fy) * h);
  }

  // layout-based document offset — unaffected by ScrollSmoother's transform
  function docTop(el) {
    let y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  let stops = SHOTS.map((_, i) => i / (SHOTS.length - 1));
  function measure() {
    const max = maxScroll();
    stops = SHOTS.map((s) => {
      const el = document.getElementById(s.id);
      if (!el) return 0;
      return Math.min(1, Math.max(0, (docTop(el) + el.offsetHeight * 0.35) / max));
    });
    // guarantee monotonic
    for (let i = 1; i < stops.length; i++) if (stops[i] <= stops[i - 1]) stops[i] = stops[i - 1] + 0.001;
  }

  const vCam = new THREE.Vector3();
  const vLook = new THREE.Vector3();
  const tCam = new THREE.Vector3();
  const tLook = new THREE.Vector3();
  let tFov = SHOTS[0].fov, tYaw = SHOTS[0].yaw, tPush = 0, tOp = 1;

  function sample(p) {
    let i = 0;
    while (i < stops.length - 2 && p > stops[i + 1]) i++;
    const a = ACTIVE[i], b = ACTIVE[i + 1] || ACTIVE[i];
    const span = Math.max(1e-4, stops[i + 1] - stops[i]);
    let t = Math.min(1, Math.max(0, (p - stops[i]) / span));
    t = t * t * (3 - 2 * t);                       // smoothstep
    const mix = (u, v) => u + (v - u) * t;

    // interpolate the *description*, then compose — so every in-between
    // frame is a valid composition rather than a lerp through world space
    tFov = mix(a.fov, b.fov);
    tPush = mix(a.push, b.push);
    tOp = mix(a.op, b.op);

    const az = mix(a.az, b.az);
    tYaw = mix(a.rel, b.rel) + az * D2R;

    compose(
      mix(a.dist, b.dist), az, mix(a.el, b.el), tFov,
      mix(a.frame[0], b.frame[0]), mix(a.frame[1], b.frame[1]),
      tCam, tLook
    );
  }

  // seeded after the first resize(), once camera.aspect is real
  function seedRig() { sample(0); vCam.copy(tCam); vLook.copy(tLook); }

  /* ---------- resize ---------- */
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pickShots();
    measure();
  }
  resize();
  seedRig();
  addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 200); });
  addEventListener('load', measure);
  document.addEventListener('launched', () => setTimeout(measure, 400));
  // pinning changes document height, so re-measure whenever ScrollTrigger does
  if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', measure);

  /* ---------- pointer parallax ---------- */
  let px = 0, py = 0, pxT = 0, pyT = 0;
  addEventListener('pointermove', (e) => {
    pxT = (e.clientX / innerWidth - 0.5) * 2;
    pyT = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- load the car ---------- */
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/draco/gltf/');
  draco.setDecoderConfig({ type: 'js' });

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const tl = new THREE.TextureLoader();
  function tex(url, srgb) {
    const t = tl.load(url);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;                               // glTF convention
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  const mBody = new THREE.MeshStandardMaterial({
    map: tex(TEX.base, true),
    normalMap: tex(TEX.norm, false),
    roughnessMap: tex(TEX.orm, false),
    metalnessMap: tex(TEX.orm, false),
    roughness: 1, metalness: 1,
    envMapIntensity: 1.5,
    transparent: true, opacity: 0,
  });
  const mChrome = new THREE.MeshStandardMaterial({
    color: 0x9aa0aa, roughness: 0.09, metalness: 1,
    envMapIntensity: 2.2, transparent: true, opacity: 0,
  });
  const mMatte = new THREE.MeshStandardMaterial({
    color: 0x0a0a0d, roughness: 0.72, metalness: 0.1,
    envMapIntensity: 0.5, transparent: true, opacity: 0,
  });
  const ALL = [mBody, mChrome, mMatte];

  let loaded = false;

  loader.load('assets/car/car.glb',
    (gltf) => {
      const root = gltf.scene;
      root.traverse((o) => {
        if (!o.isMesh) return;
        const n = (o.material && o.material.name || '').toLowerCase();
        o.material = n.includes('mirror') ? mChrome
                   : n.includes('filler') ? mMatte
                   : mBody;
        o.castShadow = o.receiveShadow = false;
        o.frustumCulled = false;
      });

      // scale FIRST, then re-measure and centre — centring on the unscaled
      // box would offset by 1/scale and throw the car out of frame entirely
      const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
      root.scale.setScalar(4.2 / Math.max(size.x, size.y, size.z));
      root.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(root);
      const ctr = box.getCenter(new THREE.Vector3());
      root.position.x -= ctr.x;
      root.position.z -= ctr.z;
      root.position.y -= box.min.y + 1.0;      // wheels just above the shadow plane
      carGroup.add(root);

      loaded = true;
      BOOT().scene(1);

      const reveal = () => {
        if (!window.gsap) { ALL.forEach((m) => (m.opacity = 1)); return; }
        const o = { v: 0 };
        window.gsap.to(o, {
          v: 1, duration: 2.2, ease: 'power2.out',
          onUpdate: () => ALL.forEach((m) => (m.opacity = o.v)),
          onComplete: () => ALL.forEach((m) => { m.transparent = false; m.opacity = 1; }),
        });
      };
      document.addEventListener('launched', reveal, { once: true });
      // if we somehow load after launch, don't wait forever
      setTimeout(() => { if (ALL[0].opacity === 0) reveal(); }, 7000);
    },
    (ev) => {
      if (ev.lengthComputable) BOOT().scene(Math.min(0.98, ev.loaded / ev.total));
      else BOOT().scene(0.5);
    },
    (err) => { console.warn('[scene] car failed to load:', err); BOOT().sceneFailed(); }
  );

  // small handle for debugging in the console
  window.__scene = { scene, camera, carGroup, carPivot, renderer, mats: ALL, SHOTS, get loaded() { return loaded; } };

  /* ---------- render loop (shares the GSAP ticker) ---------- */
  const clock = new THREE.Clock();
  let lastY = 0, vel = 0, streakLen = 0, streakOp = 0, tAcc = 0, reveal = 0;

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    const y = scrollY();
    const max = maxScroll();
    const p = Math.min(1, Math.max(0, y / max));

    const rawV = (y - lastY) / Math.max(0.008, dt);
    vel += (rawV - vel) * 0.14;
    lastY = y;

    sample(p);

    // ease the rig toward the sampled shot
    const k = 1 - Math.pow(0.001, dt);
    px += (pxT - px) * k * 0.55;
    py += (pyT - py) * k * 0.55;

    vCam.lerp(tCam, k * 0.75);
    vLook.lerp(tLook, k * 0.75);

    camera.position.set(
      vCam.x + px * 0.85,
      vCam.y - py * 0.55 + Math.sin(t * 0.5) * 0.09,
      vCam.z
    );
    camera.lookAt(vLook);
    camera.fov += (tFov - camera.fov) * k * 0.6;
    camera.updateProjectionMatrix();

    carPivot.rotation.y += (tYaw - carPivot.rotation.y) * k * 0.55;
    carPivot.position.z += (tPush - carPivot.position.z) * k * 0.5;
    // gentle life, but never enough to destroy a composed shot
    carGroup.rotation.y = Math.sin(t * 0.17) * 0.055;
    carGroup.rotation.z = Math.sin(t * 0.23 + 1.1) * 0.012;
    carGroup.position.y = Math.sin(t * 0.45) * 0.1;

    // lights breathe
    rim.intensity = 7 + Math.sin(t * 1.5) * 1.6;
    under.intensity = 4.5 + Math.sin(t * 0.85 + 1) * 1.1;

    // streaks respond to scroll speed
    const sp = Math.min(1, Math.abs(vel) / 2600);
    streakLen += (sp * 26 - streakLen) * k * 0.5;
    streakOp += (sp * 0.55 - streakOp) * k * 0.4;
    tAcc += dt * (0.4 + sp * 5);
    streaks.uniforms.uLen.value = streakLen;
    streaks.uniforms.uOp.value = streakOp;
    streaks.uniforms.uT.value = tAcc;

    // one-way fade-in once the model is in, then pure shot-driven opacity
    reveal += ((loaded ? 1 : 0) - reveal) * k * 0.25;
    canvas.style.opacity = (tOp * reveal).toFixed(3);

    renderer.render(scene, camera);
  }

  // GSAP already sleeps/wakes its ticker with document visibility — no extra handler needed
  if (window.gsap) window.gsap.ticker.add(frame);
  else (function raf() { requestAnimationFrame(raf); frame(); })();
}
