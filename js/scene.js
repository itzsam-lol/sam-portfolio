/* ============================================================
   SCENE: the interlude. One car, two renderings.
   Right of the red line: an ink drawing made from the car's own
   normals and depth (silhouette, creases, a little hatching).
   Left of it: the same car, lit. Scroll moves the line and swings
   the camera from a side elevation to a front three-quarter view.

   three.js is only fetched once the reader starts down the page,
   and frames are only drawn when something actually changed.
   ============================================================ */

const stage = document.querySelector('.machine-stage');
const canvas = document.getElementById('machineCanvas');
const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 861;
const M = (window.__machine = window.__machine || { p: 0, active: false, near: false });
const capture = new URLSearchParams(location.search).get('capture');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}
const lowTier = (navigator.deviceMemory || 4) <= 2 || (navigator.hardwareConcurrency || 4) <= 2;

if (!stage || !canvas) {
  // nothing to do
} else if (!webglOK() || lowTier) {
  stillImage();
} else {
  // fetch three.js (~1 MB with the car) only for readers who are on their way:
  // when the section is half a screen off, or once they have started scrolling
  let started = false;
  const go = () => {
    if (started) return;
    started = true; io.disconnect(); removeEventListener('scroll', onScroll);
    start().catch(fail);
  };
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) go(); }, { rootMargin: '50% 0px 50% 0px' });
  const onScroll = () => { if (scrollY > innerHeight * 0.35) go(); };
  io.observe(stage);
  addEventListener('scroll', onScroll, { passive: true });
  if (capture) go();
}

// the pre-rendered drawing is only downloaded when it is actually shown
function stillImage() {
  root.classList.add('no-webgl');
  const img = document.getElementById('machineFallback');
  if (img && !img.src) img.src = img.dataset.src;
}

function fail(err) {
  console.warn('[scene] falling back to the drawing:', err);
  stillImage();
  // the interlude just lost its long scroll, so every trigger below it moved
  if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
}

async function start() {
  const [THREE, { GLTFLoader }, { DRACOLoader }, { RoomEnvironment }] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/DRACOLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]);

  let needs = true;                      // textures report in while the model is still loading
  const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!capture });
  renderer.setPixelRatio(DPR);
  // Neutral keeps the red red; ACES pushes it towards orange
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-5, 9, 6);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 200);

  /* ---------- normal + depth pass for the drawing ---------- */
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
  rt.depthTexture = new THREE.DepthTexture(4, 4);

  const normalMat = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN;
      void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec3 vN;
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float lit = clamp(dot(n, normalize(vec3(-.45, .8, .55))), 0., 1.);
        gl_FragColor = vec4(n * .5 + .5, lit); }`,
  });

  const ink = new THREE.Vector3();
  const edgeMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      tN: { value: rt.texture }, tD: { value: rt.depthTexture },
      res: { value: new THREE.Vector2(4, 4) }, near: { value: camera.near }, far: { value: camera.far },
      ink: { value: ink }, hatch: { value: small ? 0 : 1 }, px: { value: DPR },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      uniform sampler2D tN; uniform sampler2D tD; uniform vec2 res; uniform float near; uniform float far;
      uniform vec3 ink; uniform float hatch; uniform float px;
      varying vec2 vUv;
      float lin(float z){ float n = z * 2. - 1.; return 2. * near * far / (far + near - n * (far - near)); }
      vec3 N(vec2 o){ return texture2D(tN, vUv + o * px / res).rgb; }
      float Z(vec2 o){ return lin(texture2D(tD, vUv + o * px / res).r); }
      float cov(vec2 o){ return step(texture2D(tD, vUv + o * px / res).r, .9999); }
      void main(){
        float c0 = cov(vec2(0.));
        float ring = 0.;
        for (int i = 0; i < 8; i++) { float a = float(i) * .785398; ring += cov(vec2(cos(a), sin(a)) * 1.6); }
        float sil = (c0 > .5) ? step(ring, 7.5) : step(.5, ring);
        vec3 gx = -N(vec2(-1,-1)) - 2.*N(vec2(-1,0)) - N(vec2(-1,1)) + N(vec2(1,-1)) + 2.*N(vec2(1,0)) + N(vec2(1,1));
        vec3 gy = -N(vec2(-1,-1)) - 2.*N(vec2(0,-1)) - N(vec2(1,-1)) + N(vec2(-1,1)) + 2.*N(vec2(0,1)) + N(vec2(1,1));
        float crease = smoothstep(.9, 1.6, (length(gx) + length(gy)) * c0) * .85;
        float z0 = Z(vec2(0.));
        float zx = abs(Z(vec2(1,0)) - Z(vec2(-1,0))), zy = abs(Z(vec2(0,1)) - Z(vec2(0,-1)));
        float stp = smoothstep(.02, .05, (zx + zy) / max(z0, 1e-3)) * c0;
        vec2 p = vUv * res / px;
        float lit = texture2D(tN, vUv).a;
        float h = hatch * c0 * step(.5, fract((p.x + p.y) / 7.)) * (1. - smoothstep(.12, .3, lit)) * .45;
        float a = clamp(max(max(sil, crease), max(stp, h)), 0., 1.);
        gl_FragColor = vec4(ink * a, a);
      }`,
  });
  const qScene = new THREE.Scene();
  qScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat));
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ---------- the car ---------- */
  const TEX = small
    ? { base: 'assets/car/basecolor_1k.webp', orm: 'assets/car/orm_1k.webp', norm: 'assets/car/normal_1k.webp' }
    : { base: 'assets/car/basecolor.webp', orm: 'assets/car/orm.webp', norm: 'assets/car/normal.webp' };
  const tl = new THREE.TextureLoader();
  const tex = (u, srgb) => { const t = tl.load(u, () => (needs = true)); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.flipY = false;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; };
  const orm = tex(TEX.orm);
  const mBody = new THREE.MeshStandardMaterial({ map: tex(TEX.base, true), normalMap: tex(TEX.norm), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 1.05 });
  const mChrome = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: 0.14, metalness: 1 });
  const mMatte = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.72, metalness: 0.1 });

  const car = new THREE.Group();
  scene.add(car);

  // soft contact shadow, lit side only
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const g = sc.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.5, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.7),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.27;
  scene.add(shadow);

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const box = new THREE.Box3();
  const corners = [];
  await new Promise((resolve, reject) => {
    loader.load('assets/car/car.glb', (gltf) => {
      const m = gltf.scene;
      m.traverse((o) => {
        if (!o.isMesh) return;
        const n = (o.material && o.material.name || '').toLowerCase();
        o.material = n.includes('mirror') ? mChrome : n.includes('filler') ? mMatte : mBody;
        o.frustumCulled = false;
      });
      // scale first, then centre on the scaled box. The mesh arrives mirrored
      // (its livery text reads backwards on both sides), so flip it across its
      // lateral axis; three.js swaps the winding for the negative determinant
      const s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
      const k = 4.2 / Math.max(s.x, s.y, s.z);
      m.scale.set(k, k, -k);
      m.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(m), c = b.getCenter(new THREE.Vector3());
      m.position.x -= c.x; m.position.z -= c.z; m.position.y -= b.min.y + 1.0;
      car.add(m);
      car.updateMatrixWorld(true);
      box.setFromObject(car);
      for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
      resolve();
    }, undefined, reject);
  });

  /* ---------- shot: side elevation to front three-quarter ---------- */
  const D2R = Math.PI / 180;
  const centre = new THREE.Vector3(0, -0.55, 0);
  const look = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const wUp = new THREE.Vector3(0, 1, 0);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function shot(p) {
    const portrait = camera.aspect < 1;
    const t = ss(0.05, 0.95, p);
    // film the car's right side: nose pointing right, the way the page reads
    const az = 180 + 38 * t;
    const el = 2 + (13 - 2) * t;
    const fov = portrait ? 34 : 21;
    const dist = (portrait ? 13.5 : 13.4) - (portrait ? 1.5 : 2.4) * t;
    const fx = portrait ? 0.5 : 0.625, fy = portrait ? 0.62 : 0.56;
    // keep the car inside the frame on narrow screens
    const need = 5.2 / (2 * Math.tan(fov * 0.5 * D2R) * Math.max(0.45, camera.aspect));
    const d = Math.max(dist, need);
    const ce = Math.cos(el * D2R);
    camera.fov = fov;
    camera.position.set(centre.x + d * ce * Math.sin(az * D2R), centre.y + d * Math.sin(el * D2R), centre.z + d * ce * Math.cos(az * D2R));
    fwd.copy(centre).sub(camera.position).normalize();
    right.crossVectors(fwd, wUp).normalize();
    up.crossVectors(right, fwd).normalize();
    const h = 2 * d * Math.tan(fov * 0.5 * D2R), w = h * camera.aspect;
    look.copy(centre).addScaledVector(right, -(fx - 0.5) * w).addScaledVector(up, -(0.5 - fy) * h);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    return az - 180;
  }

  // where the car sits on screen, so the line sweeps across the car and not empty paper
  const v = new THREE.Vector3();
  function carSpan() {
    let lo = 1, hi = 0;
    for (const c of corners) { v.copy(c).project(camera); const x = (v.x + 1) / 2; lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return [Math.max(0, lo - 0.04), Math.min(1, hi + 0.04)];
  }

  /* ---------- size + theme ---------- */
  let W = 1, H = 1;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const bw = Math.round(W * DPR), bh = Math.round(H * DPR);
    rt.setSize(bw, bh);
    edgeMat.uniforms.res.value.set(bw, bh);
    needs = true;
  }
  function readInk() {
    const hex = getComputedStyle(root).getPropertyValue('--ink').trim() || '#131312';
    const n = parseInt(hex.replace('#', ''), 16);
    ink.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    needs = true;
  }
  resize(); readInk();
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('themechange', () => requestAnimationFrame(readInk));

  /* ---------- draw ---------- */
  const meterDeg = document.getElementById('machineDeg');
  const meterPct = document.getElementById('machinePct');
  const scanEl = document.getElementById('machineScan');
  let ps = calm ? 0.55 : M.p, drawnAt = -1;

  function draw(p) {
    const az = shot(p);
    // the line: 0 = all drawing, 1 = all machine
    const k = ss(0.14, 0.84, p);
    const [lo, hi] = carSpan();
    const split = k <= 0 ? 0 : k >= 1 ? 1 : lo + (hi - lo) * k;
    const sx = Math.round(W * split);

    renderer.setRenderTarget(rt);
    renderer.clear();
    scene.overrideMaterial = normalMat; shadow.visible = false;
    renderer.render(scene, camera);
    scene.overrideMaterial = null; shadow.visible = true;

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.setScissorTest(true);
    if (sx > 0) { renderer.setScissor(0, 0, sx, H); renderer.setViewport(0, 0, W, H); renderer.render(scene, camera); }
    if (sx < W) { renderer.setScissor(sx, 0, W - sx, H); renderer.setViewport(0, 0, W, H); renderer.render(qScene, qCam); }
    renderer.setScissorTest(false);

    stage.style.setProperty('--scan', (split * 100).toFixed(3) + '%');
    if (scanEl) scanEl.style.opacity = split > 0.001 && split < 0.999 ? 1 : 0;
    if (meterDeg) meterDeg.textContent = String(Math.round(Math.abs(az))).padStart(3, '0') + '°';
    if (meterPct) meterPct.textContent = Math.round(k * 100) + '%';
    stage.style.setProperty('--mp', k.toFixed(3));
    drawnAt = p;
  }

  function frame() {
    if (!M.near && !needs && drawnAt >= 0) return;
    if (!calm) ps += (M.p - ps) * 0.14;
    if (needs || Math.abs(ps - drawnAt) > 0.0004) { needs = false; draw(ps); }
  }
  if (window.gsap && !calm) window.gsap.ticker.add(frame);
  else if (!calm) {
    // GSAP never arrived (blocked CDN): read progress straight off the scroll position
    const sec = document.getElementById('machine');
    (function tick() {
      const r = sec.getBoundingClientRect();
      M.p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      M.near = r.top < innerHeight * 1.5 && r.bottom > -innerHeight * 0.5;
      frame();
      requestAnimationFrame(tick);
    })();
  } else { draw(ps); document.addEventListener('themechange', () => setTimeout(() => draw(ps), 30)); new ResizeObserver(() => draw(ps)).observe(stage); }

  // headless capture hook (used to make the no-WebGL fallback image)
  window.__sceneCapture = (p) => { ps = p; draw(p); return true; };
  window.__ready = true;
  root.classList.add('webgl-ready');
}
