/* Forma chrome mark: the three-bar F as thin plates of polished silver, lit by a studio panorama.
   Renders on the visitor's GPU with three.js (MIT, vendored in assets/vendor/). The same scene renders
   the brand stills (hero poster, share image, banners) through still mode. */
import * as THREE from './vendor/three.module.min.js';

// The studio as an HDR panorama (equirectangular, linear light). Chrome reads as chrome through contrast:
// a near-black room, one narrow horizon line and a few hard-edged softboxes. As the mark turns, a highlight
// travels across each plate instead of the whole face brightening at once.
function studioPanorama() {
  const W = 2048, H = 1024, data = new Float32Array(W * H * 4);
  // [centre (0..1 of the width), half-width, top (v), bottom (v), intensity]
  const boxes = [[0.06, 0.035, 0.18, 0.47, 9], [0.31, 0.022, 0.12, 0.49, 12], [0.58, 0.05, 0.22, 0.46, 6], [0.83, 0.026, 0.15, 0.48, 10]];
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1); // 0 = straight up, 0.5 = horizon, 1 = straight down
    const horizon = Math.exp(-Math.pow((v - 0.5) / 0.04, 2)) * 2;
    const glow = v < 0.5 ? 0.05 * Math.exp(-Math.pow((v - 0.42) / 0.12, 2)) : 0;
    const base = (v < 0.5 ? 0.006 : 0.003) + glow + horizon;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let s = 0;
      for (const [c, w, top, bottom, k] of boxes) {
        if (v < top || v > bottom) continue;
        let d = Math.abs(u - c);
        d = Math.min(d, 1 - d);
        if (d < w) s += k * (1 - Math.pow(d / w, 24));
      }
      const i = (y * W + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = base + s;
      data[i + 3] = 1;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// The mark's three bars, in the SVG's own coordinates (brand/forma-mark.svg).
const BARS = [
  [[150, 186], [368, 131.5], [368, 185.5], [150, 240]],
  [[150, 262], [328, 217.5], [328, 261.5], [150, 306]],
  [[150, 328], [210, 313], [210, 357], [150, 372]],
];
const CX = 259, CY = 251.75, UNIT = 1 / 100; // centre of the mark and SVG units per world unit

function buildMark(material) {
  const group = new THREE.Group();
  for (const pts of BARS) {
    const shape = new THREE.Shape();
    pts.forEach(([x, y], i) => {
      const X = (x - CX) * UNIT, Y = -(y - CY) * UNIT;
      if (i) shape.lineTo(X, Y); else shape.moveTo(X, Y);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.014, bevelSegments: 4, curveSegments: 1,
    });
    geo.translate(0, 0, -0.09);
    group.add(new THREE.Mesh(geo, material));
  }
  return group;
}

/**
 * createChrome(canvas, options)
 *  still: render one frame for export (no loop, preserves the drawing buffer)
 *  time: scene time for a still frame (seconds)
 *  fit: share of the canvas height the mark fills (default 0.8)
 *  maxDpr: device-pixel-ratio cap (default 1.75)
 *  camera: optional { x, y, z, lookX, lookY, fov } to frame a close-up still
 *  onReady: called after the first frame is drawn
 */
export function createChrome(canvas, options) {
  const opts = options || {};
  const still = !!opts.still;
  const reduceMotion = !still && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, preserveDrawingBuffer: still, powerPreference: still ? 'high-performance' : 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = opts.exposure || 0.95;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const panorama = studioPanorama();
  scene.environment = pmrem.fromEquirectangular(panorama).texture;
  panorama.dispose();
  pmrem.dispose();

  const silver = new THREE.MeshPhysicalMaterial({ color: 0xd4d4da, metalness: 1, roughness: 0.05, envMapIntensity: 1 });
  const mark = buildMark(silver);
  scene.add(mark);

  const camera = new THREE.PerspectiveCamera((opts.camera && opts.camera.fov) || 36, 1, 0.05, 100);
  const fit = opts.fit || 0.8;
  const MARK_H = (372 - 131.5) * UNIT, MARK_W = (368 - 150) * UNIT;

  function frame(width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (opts.camera) {
      const c = opts.camera;
      camera.position.set(c.x || 0, c.y || 0, c.z);
      camera.lookAt(c.lookX || 0, c.lookY || 0, 0);
    } else {
      // Distance at which the mark fills `fit` of the height (or of the width on tall, narrow canvases).
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const byHeight = (MARK_H / fit) / (2 * Math.tan(vFov / 2));
      const byWidth = (MARK_W / (fit * 0.92)) / (2 * Math.tan(vFov / 2) * camera.aspect);
      camera.position.set(0, 0, Math.max(byHeight, byWidth));
      camera.lookAt(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function pose(t) {
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    mark.rotation.y = -0.42 + Math.sin(t * 0.32) * 0.08 + pointer.x * 0.28;
    mark.rotation.x = -0.1 + Math.sin(t * 0.24) * 0.04 + pointer.y * 0.12;
    mark.rotation.z = 0.02;
    mark.position.y = Math.sin(t * 0.55) * 0.02;
    scene.environmentRotation.y = 0.9 + t * 0.045; // the studio turns slowly, so highlights travel across the plates
  }

  let width = 0, height = 0;
  function measure() {
    const w = Math.max(1, Math.round(opts.width || canvas.clientWidth || canvas.parentElement.clientWidth));
    const h = Math.max(1, Math.round(opts.height || canvas.clientHeight || canvas.parentElement.clientHeight));
    if (w !== width || h !== height) { width = w; height = h; frame(w, h); }
  }

  let ready = false;
  function draw(t) {
    measure();
    pose(t);
    renderer.render(scene, camera);
    if (!ready) { ready = true; if (opts.onReady) opts.onReady(); }
  }

  const POSTER_T = 1.2; // the poster image is this frame, so the live render takes over without a jump
  if (still) {
    pointer.x = pointer.tx = opts.pointerX || 0;
    pointer.y = pointer.ty = opts.pointerY || 0;
    draw(typeof opts.time === 'number' ? opts.time : POSTER_T);
    return { renderer, canvas, destroy() { renderer.dispose(); } };
  }

  // Live: animate while visible, then come to rest after a quiet spell and wake on pointer movement.
  const IDLE_MS = 12000;
  let raf = 0, visible = true, lastActive = performance.now();
  const start = performance.now() - POSTER_T * 1000;
  const loop = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    draw(reduceMotion ? POSTER_T : (performance.now() - start) / 1000);
    if (!reduceMotion && performance.now() - lastActive < IDLE_MS) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.tx = THREE.MathUtils.clamp(((e.clientX - (r.left + r.width / 2)) / Math.max(1, window.innerWidth)) * 2, -1, 1);
    pointer.ty = THREE.MathUtils.clamp(((e.clientY - (r.top + r.height / 2)) / Math.max(1, window.innerHeight)) * 2, -1, 1);
    lastActive = performance.now();
    kick();
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) { lastActive = performance.now(); kick(); }
  }, { rootMargin: '120px' }) : null;
  if (io) io.observe(canvas);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => kick()) : null;
  if (ro) ro.observe(canvas.parentElement);
  const onVis = () => { if (!document.hidden) { lastActive = performance.now(); kick(); } };
  document.addEventListener('visibilitychange', onVis);
  if (!reduceMotion) window.addEventListener('pointermove', onPointer, { passive: true });
  kick();

  return {
    renderer,
    canvas,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
