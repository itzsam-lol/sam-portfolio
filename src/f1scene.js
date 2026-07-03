import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

(function () {
  // Desktop only
  if (window.innerWidth < 860) return;

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  // ── Renderer ────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  // ── Scene ────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Camera ───────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(5.5, 2.2, 9.5);
  camera.lookAt(0, 0.1, 0);

  // ── Lights ───────────────────────────────────────────────────
  // Deep ambient — keep it very dark
  scene.add(new THREE.AmbientLight(0x080818, 5));

  // Key: cool-white from top-front-right
  const keyLight = new THREE.DirectionalLight(0xd8eeff, 4);
  keyLight.position.set(6, 9, 7);
  scene.add(keyLight);

  // Signature red rim from back-left (F1 racing light)
  const rimLight = new THREE.DirectionalLight(0xe8002b, 10);
  rimLight.position.set(-9, 2, -6);
  scene.add(rimLight);

  // Purple/violet underlight for ground reflection drama
  const underLight = new THREE.PointLight(0x5500bb, 5, 22);
  underLight.position.set(0, -5, 3);
  scene.add(underLight);

  // Soft front fill so the front face isn't pitch black
  const fillLight = new THREE.DirectionalLight(0x1a2233, 2);
  fillLight.position.set(3, 1, 12);
  scene.add(fillLight);

  // ── Car group ────────────────────────────────────────────────
  const carGroup = new THREE.Group();
  scene.add(carGroup);

  // ── Resize ───────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth || canvas.offsetWidth;
    const h = canvas.clientHeight || canvas.offsetHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement || canvas);

  // ── Load model ───────────────────────────────────────────────
  function loadModel() {
    const tl = new THREE.TextureLoader();
    const diffuse = tl.load('formula 1/Substance SpecGloss/Right ones/formula1_DefaultMaterial_Diffuse.png');
    const specularTex = tl.load('formula 1/Substance SpecGloss/Right ones/formula1_DefaultMaterial_Specular.png');
    const normalTex = tl.load('formula 1/Substance SpecGloss/Right ones/formula1_DefaultMaterial_Normal.png');
    diffuse.colorSpace = THREE.SRGBColorSpace;

    // Shared material — apply to every mesh in the OBJ
    const mat = new THREE.MeshPhongMaterial({
      map: diffuse,
      specularMap: specularTex,
      normalMap: normalTex,
      specular: new THREE.Color(0x999999),
      shininess: 140,
      transparent: true,
      opacity: 0,
    });

    // Mirror-like surfaces (secondary material for rims / body panels)
    const mirrorMat = new THREE.MeshPhongMaterial({
      color: 0x222222,
      specular: new THREE.Color(0xffffff),
      shininess: 300,
      transparent: true,
      opacity: 0,
    });

    new OBJLoader().load(
      'formula 1/Formula 1 mesh.obj',
      (obj) => {
        const allMats = [mat, mirrorMat];

        obj.traverse((child) => {
          if (!child.isMesh) return;
          const name = (child.material?.name || '').toLowerCase();
          if (name.includes('mirror') || name.includes('dark metal') || name.includes('black')) {
            child.material = mirrorMat;
          } else {
            child.material = mat;
          }
          child.castShadow = false;
          child.receiveShadow = false;
        });

        // Auto-centre & scale to a ~3.8 unit bounding box
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        obj.position.sub(center);
        obj.scale.setScalar(3.8 / Math.max(size.x, size.y, size.z));

        carGroup.add(obj);

        // ── Fade-in after loader ─────────────────────────────
        function fadeIn() {
          if (!window.gsap) {
            allMats.forEach((m) => { m.opacity = 1; });
            return;
          }
          const proxy = { v: 0 };
          window.gsap.to(proxy, {
            v: 1,
            duration: 2.8,
            ease: 'power2.out',
            onUpdate: () => {
              allMats.forEach((m) => { m.opacity = proxy.v; });
            },
          });
        }

        const loaderEl = document.getElementById('loader');
        if (loaderEl && loaderEl.classList.contains('done')) {
          setTimeout(fadeIn, 200);
        } else {
          document.addEventListener('loaderDone', fadeIn, { once: true });
        }
      },
      undefined,
      (err) => console.warn('[f1scene] OBJ load error:', err)
    );
  }

  // Delay model fetch so it doesn't compete with critical page assets
  setTimeout(loadModel, 800);

  // ── Scroll: car accelerates away ─────────────────────────────
  function setupScroll() {
    const G = window.gsap;
    const ST = window.ScrollTrigger;
    if (!G || !ST) return;

    G.to(canvas, {
      x: '22vw',
      opacity: 0,
      ease: 'power2.in',
      scrollTrigger: {
        trigger: '#top',
        start: '50% top',
        end: 'bottom top',
        scrub: 0.45,
      },
    });
  }
  // ScrollTrigger is registered synchronously (GSAP scripts run before module)
  setupScroll();

  // ── Animation loop ───────────────────────────────────────────
  const clock = new THREE.Clock();

  function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    // Slow idle rotation + gentle float
    carGroup.rotation.y += 0.0022;
    carGroup.position.y = Math.sin(t * 0.42) * 0.13;

    // Red rim breathes — feels alive
    rimLight.intensity = 10 + Math.sin(t * 1.6) * 1.8;
    underLight.intensity = 5 + Math.sin(t * 0.9 + 1) * 1.2;

    renderer.render(scene, camera);
  }
  loop();

  // Pause render when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop();
  });
})();
