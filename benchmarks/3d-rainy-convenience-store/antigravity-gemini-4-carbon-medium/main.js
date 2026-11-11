import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================================
// 1. SCENE, RENDERER, CAMERA & POST-PROCESSING
// ============================================================================
const container = document.getElementById('stage');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
{
  const skyCvs = document.createElement('canvas');
  skyCvs.width = 4;
  skyCvs.height = 512;
  const sctx = skyCvs.getContext('2d');
  const grad = sctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#091122');
  grad.addColorStop(0.48, '#152645');
  grad.addColorStop(0.76, '#1c3257');
  grad.addColorStop(1.0, '#0b1426');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(skyCvs);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
}
scene.fog = new THREE.FogExp2(0x111f38, 0.012);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.2, 160);
camera.position.set(15.2, 9.6, 16.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.35, 1.72, 0.35);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6.5;
controls.maxDistance = 42.0;
controls.maxPolarAngle = Math.PI * 0.485;
controls.minPolarAngle = 0.12;
controls.panSpeed = 0.7;
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.28, // subtle anime glow without washing out interior details
  0.48,
  0.84
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

const diorama = new THREE.Group();
scene.add(diorama);

// Shared animation state registry
const animState = {
  autoDoorLeft: null,
  autoDoorRight: null,
  doorSpillLight: null,
  flickerItems: [],
  trafficLenses: {},
  trafficLight: null,
  wetRoadUniforms: null,
  rainPositions: null,
  rainGeo: null,
  rainVelocities: [],
  eaveDrops: [],
  ripples: [],
  glassDrops: []
};

// ============================================================================
// 2. CEL-SHADING (三渲二) & INK OUTLINE TOOLKIT
// ============================================================================
function createToonRamp(stops) {
  const data = new Uint8Array(stops.length * 4);
  for (let i = 0; i < stops.length; i++) {
    const v = stops[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, stops.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const ramp4 = createToonRamp([78, 138, 202, 255]);
const ramp3 = createToonRamp([92, 175, 255]);

const inkEdgeMat = new THREE.LineBasicMaterial({
  color: 0x101726,
  transparent: true,
  opacity: 0.72
});
const warmInkEdgeMat = new THREE.LineBasicMaterial({
  color: 0x3b2c24,
  transparent: true,
  opacity: 0.52
});
const hullOutlineMat = new THREE.MeshBasicMaterial({
  color: 0x0e1522,
  side: THREE.BackSide
});

const matCache = new Map();
function toonMat(color, opts = {}) {
  const key = opts.map ? null : `${color}_${opts.warm || 0}_${opts.opacity || 1}_${opts.emissive || 0}`;
  if (key && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: opts.soft ? ramp4 : ramp3,
    map: opts.map || null,
    transparent: Boolean(opts.transparent),
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    emissiveMap: opts.emissiveMap || null,
    side: opts.side ?? THREE.FrontSide
  });
  if (key) matCache.set(key, m);
  return m;
}

function emissiveMat(color, intensity = 1.15, map = null) {
  return new THREE.MeshStandardMaterial({
    color: map ? 0xffffff : color,
    map,
    emissive: map ? 0xffffff : color,
    emissiveMap: map,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.05
  });
}

function addInkOutline(mesh, { warm = false, threshold = 24, hull = 0 } = {}) {
  if (threshold > 0) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
    const line = new THREE.LineSegments(edges, warm ? warmInkEdgeMat : inkEdgeMat);
    mesh.add(line);
  }
  if (hull > 0) {
    const hullMesh = new THREE.Mesh(mesh.geometry, hullOutlineMat);
    hullMesh.scale.setScalar(1 + hull);
    mesh.add(hullMesh);
  }
  return mesh;
}

function makeBox(w, h, d, mat, { x = 0, y = 0, z = 0, shadow = true, recv = true, outline = true, warm = false } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = recv;
  if (outline) addInkOutline(mesh, { warm });
  return mesh;
}

// ============================================================================
// 3. PROCEDURAL ANIME GRAPHICS & TEXTURES
// ============================================================================
function makeCanvasTex(w, h, drawFn, repeatX = 1, repeatY = 1) {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.anisotropy = 4;
  return tex;
}

function createStoreSignTex(mainText = 'ほしのマート', subText = '24H  コンビニ • 酒 • たばこ • ATM') {
  return makeCanvasTex(1024, 220, (ctx, w, h) => {
    ctx.fillStyle = '#fdfaf2';
    ctx.fillRect(0, 0, w, h);
    // Iconic konbini tri-color top & bottom ribbons
    ctx.fillStyle = '#1ea4ff';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#ff6b3b';
    ctx.fillRect(0, 34, w, 20);
    ctx.fillStyle = '#1ec988';
    ctx.fillRect(0, h - 32, w, 32);

    // Emblem star badge
    ctx.fillStyle = '#1d315c';
    ctx.beginPath();
    ctx.roundRect(42, 66, 108, 108, 18);
    ctx.fill();
    ctx.fillStyle = '#ffd15c';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 96, 114);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('24H', 96, 154);

    // Store title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#17294d';
    ctx.font = '900 68px "Hiragino Sans", "Yu Gothic", "Microsoft YaHei", sans-serif';
    ctx.fillText(mainText, 178, 108);
    ctx.fillStyle = '#2d639e';
    ctx.font = 'bold 28px "Hiragino Sans", "Microsoft YaHei", sans-serif';
    ctx.fillText(subText, 182, 160);
  });
}

function createPylonSignTex() {
  return makeCanvasTex(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1ea4ff';
    ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = '#ff6b3b';
    ctx.fillRect(0, 64, w, 24);
    ctx.fillStyle = '#1ec988';
    ctx.fillRect(0, h - 54, w, 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OPEN 24H', w / 2, 44);
    ctx.fillStyle = '#192b52';
    ctx.font = '900 42px "Microsoft YaHei", sans-serif';
    ctx.fillText('ほしの', w / 2, 156);
    ctx.fillText('マート', w / 2, 208);
    ctx.fillStyle = '#ff5c33';
    ctx.beginPath();
    ctx.roundRect(38, 240, w - 76, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('酒 • たばこ', w / 2, 277);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ATM • 駐車場', w / 2, h - 20);
  });
}

function createInteriorFloorTex() {
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f6eedc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e2d4ba';
    ctx.lineWidth = 3;
    const step = 64;
    for (let i = 0; i <= w; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 240, 210, 0.35)';
    for (let y = 0; y < h; y += step * 2) {
      for (let x = 0; x < w; x += step * 2) {
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
      }
    }
  }, 3, 3);
}

function createExteriorTileTex() {
  return makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d7dde6';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b4becd';
    ctx.lineWidth = 2;
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      const off = (y / 32) % 2 === 0 ? 0 : 32;
      for (let x = off; x <= w; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke();
      }
    }
  }, 4, 2);
}

function createPosterTex(bg, accent, title, price) {
  return makeCanvasTex(192, 256, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(10, 10, w - 20, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 45);
    ctx.fillStyle = '#fff9ec';
    ctx.beginPath();
    ctx.arc(w / 2, 132, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w / 2, 132, 33, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2438';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(price, w / 2, 218);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  });
}

function createAisleSignTex(bg, label, sub) {
  return makeCanvasTex(384, 96, (ctx, w, h) => {
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 18, h);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = '#1b2944';
    ctx.font = 'bold 34px "Microsoft YaHei", sans-serif';
    ctx.fillText(label, 32, 46);
    ctx.fillStyle = '#5c6f8c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(sub, 34, 74);
  });
}

function createRoadSignTex() {
  return makeCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1857a8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('星野町 2丁目', w / 2, 56);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Hoshino-cho 2-chome', w / 2, 92);
  });
}

// ============================================================================
// 4. LIGHTING SYSTEM (WARM KONBINI INTERIOR vs COOL RAINY NIGHT)
// ============================================================================
function setupLighting() {
  const hemi = new THREE.HemisphereLight(0x4e73ab, 0x151e30, 0.88);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0x273859, 0.48);
  scene.add(ambient);

  const moonDir = new THREE.DirectionalLight(0x789fd6, 0.82);
  moonDir.position.set(11, 18, 13);
  moonDir.castShadow = true;
  moonDir.shadow.mapSize.set(2048, 2048);
  moonDir.shadow.camera.near = 2;
  moonDir.shadow.camera.far = 48;
  const d = 13.5;
  moonDir.shadow.camera.left = -d;
  moonDir.shadow.camera.right = d;
  moonDir.shadow.camera.top = d;
  moonDir.shadow.camera.bottom = -d;
  moonDir.shadow.bias = -0.0005;
  scene.add(moonDir);

  // Warm interior konbini lights
  const storeLightPositions = [
    [-3.4, 3.25, -1.2, 2.5, 11.5, 0xffdd9e],
    [0.6, 3.25, -1.2, 2.7, 12.0, 0xffe4b5],
    [-1.2, 3.25, -4.4, 2.3, 10.5, 0xffdfb0],
    [1.6, 3.15, -4.4, 2.2, 10.0, 0xfff0d4]
  ];
  for (const [x, y, z, intensity, dist, col] of storeLightPositions) {
    const pl = new THREE.PointLight(col, intensity, dist, 1.55);
    pl.position.set(x, y, z);
    diorama.add(pl);
  }

  // Warm spill through automatic doors & storefront canopy
  const doorSpill = new THREE.PointLight(0xffca7a, 1.45, 8.5, 1.6);
  doorSpill.position.set(-0.8, 2.2, 2.35);
  diorama.add(doorSpill);
  animState.doorSpillLight = doorSpill;

  const cornerSpill = new THREE.PointLight(0xffd796, 1.3, 8.5, 1.6);
  cornerSpill.position.set(3.6, 2.1, 1.8);
  diorama.add(cornerSpill);

  // Vending machines cool-cyan night glow
  const vendLight = new THREE.PointLight(0x6fd0ff, 1.35, 6.8, 1.6);
  vendLight.position.set(4.55, 1.5, -4.65);
  diorama.add(vendLight);

  // Streetlamp overhead pool
  const lampSpot = new THREE.SpotLight(0xdcecff, 3.6, 15, Math.PI * 0.36, 0.65, 1.3);
  lampSpot.position.set(5.15, 5.85, 1.9);
  lampSpot.target.position.set(5.6, 0.0, 3.8);
  lampSpot.castShadow = true;
  lampSpot.shadow.bias = -0.0006;
  diorama.add(lampSpot);
  diorama.add(lampSpot.target);

  // Back-alley warm lantern glow
  const alleyLight = new THREE.PointLight(0xff9442, 1.55, 6.5, 1.7);
  alleyLight.position.set(-7.8, 2.55, -2.6);
  diorama.add(alleyLight);

  // Distant traffic light dynamic reflection light
  const trafficPt = new THREE.PointLight(0x25e698, 1.5, 9.5, 1.6);
  trafficPt.position.set(7.6, 4.3, 7.6);
  diorama.add(trafficPt);
  animState.trafficLight = trafficPt;
}

// ============================================================================
// 5. COLLECTIBLE SQUARE PLINTH, WET ASPHALT, PUDDLES & STREET MARKINGS
// ============================================================================
function buildDioramaBaseAndRoad() {
  const grp = new THREE.Group();

  // Collectible architectural scale-model square plinth (20.8 x 20.8)
  const outerPlinth = makeBox(20.9, 0.76, 20.9, toonMat(0x1b273d), {
    y: -0.45, shadow: false, recv: true
  });
  grp.add(outerPlinth);

  const trimPlate = makeBox(20.42, 0.16, 20.42, toonMat(0x415a82), {
    y: -0.06, shadow: false, recv: true
  });
  grp.add(trimPlate);

  const subBase = makeBox(20.06, 0.42, 20.06, toonMat(0x23314a), {
    y: -0.21, shadow: false, recv: true
  });
  grp.add(subBase);

  // Real-time planar mirror reflector under wet roads, parking & alley puddles
  const reflector = new Reflector(new THREE.PlaneGeometry(19.94, 19.94), {
    clipBias: 0.003,
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0xa6bee0
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0.005;
  grp.add(reflector);

  // Cel-styled wet asphalt overlay with procedural organic puddles & ripple sheen
  const wetUniforms = { uTime: { value: 0 } };
  animState.wetRoadUniforms = wetUniforms;
  const wetAsphaltMat = new THREE.ShaderMaterial({
    uniforms: wetUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vWorldXZ;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldXZ = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vWorldXZ;

      float puddleField(vec2 p) {
        float m = 0.0;
        m = max(m, smoothstep(2.6, 0.7, length((p - vec2(0.8, 6.8)) * vec2(0.75, 1.15))));
        m = max(m, smoothstep(2.4, 0.6, length((p - vec2(6.3, 6.2)) * vec2(0.9, 0.85))));
        m = max(m, smoothstep(2.1, 0.5, length((p - vec2(-6.9, 3.5)) * vec2(0.85, 1.1))));
        m = max(m, smoothstep(2.2, 0.6, length((p - vec2(7.3, -1.6)) * vec2(1.1, 0.75))));
        m = max(m, smoothstep(1.8, 0.4, length((p - vec2(-7.0, -2.2)) * vec2(1.2, 0.7))));
        m = max(m, smoothstep(2.0, 0.5, length((p - vec2(-3.2, 7.7)) * vec2(0.8, 1.15))));
        float n = sin(p.x * 1.7) * cos(p.y * 1.9) * 0.14;
        return clamp(m + n * m, 0.0, 1.0);
      }

      void main() {
        vec2 p = vWorldXZ;
        float pud = puddleField(p);
        float grain = fract(sin(dot(floor(p * 18.0), vec2(12.9898, 78.233))) * 43758.5453);
        vec3 dryCol = vec3(0.058, 0.082, 0.135) + (grain - 0.5) * 0.015;
        vec3 pudTint = vec3(0.075, 0.115, 0.195);

        // Warm konbini window & neon sign wet road sheen
        float storeGlow = exp(-length((p - vec2(-0.4, 5.9)) * vec2(0.28, 0.55)));
        float cornerGlow = exp(-length((p - vec2(5.7, 2.2)) * vec2(0.55, 0.32)));
        float vendGlow = exp(-length((p - vec2(5.9, -4.6)) * vec2(0.65, 0.45)));
        vec3 lightSheen = vec3(1.0, 0.76, 0.42) * (storeGlow * 0.22 + cornerGlow * 0.16)
                        + vec3(0.32, 0.78, 1.0) * (vendGlow * 0.22 + storeGlow * 0.08);

        // Subtle anime concentric raindrop rings inside puddles
        float r1 = length(fract(p * 0.55 + vec2(0.17, 0.31)) - 0.5);
        float wave1 = smoothstep(0.035, 0.0, abs(r1 - fract(uTime * 0.45) * 0.46)) * (1.0 - fract(uTime * 0.45));
        float r2 = length(fract(p * 0.42 + vec2(0.63, 0.79)) - 0.5);
        float wave2 = smoothstep(0.035, 0.0, abs(r2 - fract(uTime * 0.38 + 0.5) * 0.46)) * (1.0 - fract(uTime * 0.38 + 0.5));
        float ring = (wave1 + wave2) * pud * 0.42;

        vec3 col = mix(dryCol, pudTint, pud) + lightSheen * (0.45 + 0.55 * pud) + vec3(0.52, 0.74, 1.0) * ring;
        float alpha = mix(0.86, 0.21, pud);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const roadSurface = new THREE.Mesh(new THREE.PlaneGeometry(19.96, 19.96), wetAsphaltMat);
  roadSurface.rotation.x = -Math.PI / 2;
  roadSurface.position.y = 0.013;
  roadSurface.receiveShadow = true;
  grp.add(roadSurface);

  diorama.add(grp);
  buildSidewalksAndMarkings(grp);
}

function buildSidewalksAndMarkings(grp) {
  const walkMat = toonMat(0x505d73, { soft: true });
  const curbMat = toonMat(0x6e7d96);
  const gutterMat = toonMat(0x283347);
  const grateMat = toonMat(0x1b2230);
  const paintMat = toonMat(0xdce6f5, { transparent: true, opacity: 0.78 });
  const tactileMat = toonMat(0xe5b82e);

  // Raised sidewalk pads (masking reflector cleanly while leaving roads, parking & alley wet)
  grp.add(makeBox(10.7, 0.16, 11.6, walkMat, { x: -0.4, y: 0.08, z: -4.16, shadow: false }));
  grp.add(makeBox(9.5, 0.16, 3.5, walkMat, { x: 0.2, y: 0.08, z: 3.4, shadow: false }));
  grp.add(makeBox(1.62, 0.16, 11.6, walkMat, { x: -9.15, y: 0.08, z: -4.16, shadow: false }));
  grp.add(makeBox(1.42, 0.16, 1.42, walkMat, { x: 9.25, y: 0.08, z: 9.25, shadow: false }));

  // Curb stones & curbside concrete drainage gutters (排水沟 + 雨水桝)
  grp.add(makeBox(9.6, 0.18, 0.16, curbMat, { x: 0.2, y: 0.09, z: 5.15, shadow: false }));
  grp.add(makeBox(0.16, 0.18, 15.1, curbMat, { x: 4.95, y: 0.09, z: -2.4, shadow: false }));
  grp.add(makeBox(9.7, 0.012, 0.34, gutterMat, { x: 0.2, y: 0.019, z: 5.4, shadow: false, outline: false }));
  grp.add(makeBox(0.34, 0.012, 15.2, gutterMat, { x: 5.2, y: 0.019, z: -2.4, shadow: false, outline: false }));

  for (const [gx, gz, rot] of [[-1.6, 5.4, 0], [2.1, 5.4, 0], [5.2, 0.6, Math.PI / 2], [5.2, -4.8, Math.PI / 2]]) {
    const grate = makeBox(0.54, 0.02, 0.28, grateMat, { x: gx, y: 0.023, z: gz, shadow: false });
    grate.rotation.y = rot;
    grp.add(grate);
  }

  // Yellow tactile paving strips at corner crosswalk approaches
  grp.add(makeBox(1.75, 0.02, 0.32, tactileMat, { x: 3.35, y: 0.17, z: 4.86, shadow: false }));
  grp.add(makeBox(0.32, 0.02, 1.75, tactileMat, { x: 4.66, y: 0.17, z: 2.85, shadow: false }));

  // Reflective Zebra Crosswalks (反光斑马线) across both intersection arms
  for (let i = 0; i < 6; i++) {
    grp.add(makeBox(1.85, 0.008, 0.36, paintMat, {
      x: 3.35, y: 0.022, z: 5.85 + i * 0.64, shadow: false, outline: false
    }));
    grp.add(makeBox(0.36, 0.008, 1.85, paintMat, {
      x: 5.8 + i * 0.64, y: 0.022, z: 2.85, shadow: false, outline: false
    }));
  }
  // Stop lines & dashed center road lines
  grp.add(makeBox(0.22, 0.008, 2.1, paintMat, { x: 1.7, y: 0.022, z: 6.6, shadow: false, outline: false }));
  grp.add(makeBox(2.1, 0.008, 0.22, paintMat, { x: 6.5, y: 0.022, z: 1.2, shadow: false, outline: false }));
  for (let i = 0; i < 4; i++) {
    grp.add(makeBox(1.25, 0.008, 0.14, paintMat, { x: -8.6 + i * 2.6, y: 0.022, z: 7.65, shadow: false, outline: false }));
    grp.add(makeBox(0.14, 0.008, 1.25, paintMat, { x: 7.55, y: 0.022, z: -8.4 + i * 2.6, shadow: false, outline: false }));
  }

  // Konbini Front-Left Parking Stalls (停车位 x2 + 車止め wheel stops)
  for (const px of [-9.55, -7.15, -4.75]) {
    grp.add(makeBox(0.1, 0.008, 3.1, paintMat, { x: px, y: 0.022, z: 3.45, shadow: false, outline: false }));
  }
  grp.add(makeBox(4.9, 0.008, 0.1, paintMat, { x: -7.15, y: 0.022, z: 1.9, shadow: false, outline: false }));
  for (const cx of [-8.35, -5.95]) {
    for (const dx of [-0.52, 0.52]) {
      grp.add(makeBox(0.55, 0.11, 0.16, curbMat, { x: cx + dx, y: 0.065, z: 2.25 }));
      grp.add(makeBox(0.32, 0.03, 0.17, tactileMat, { x: cx + dx, y: 0.09, z: 2.25, shadow: false, outline: false }));
    }
    // Painted 'P' emblem in stall
    grp.add(makeBox(0.08, 0.008, 0.52, paintMat, { x: cx - 0.18, y: 0.022, z: 4.1, shadow: false, outline: false }));
    grp.add(makeBox(0.32, 0.008, 0.08, paintMat, { x: cx, y: 0.022, z: 3.88, shadow: false, outline: false }));
    grp.add(makeBox(0.32, 0.008, 0.08, paintMat, { x: cx, y: 0.022, z: 4.12, shadow: false, outline: false }));
    grp.add(makeBox(0.08, 0.008, 0.26, paintMat, { x: cx + 0.14, y: 0.022, z: 4.0, shadow: false, outline: false }));
  }
}

// ============================================================================
// 6. CONVENIENCE STORE BUILDING, GLASS FACADE, AUTO DOORS & AWNING
// ============================================================================
function buildStoreBuilding() {
  const store = new THREE.Group();
  const tileTex = createExteriorTileTex();
  const wallOuterMat = toonMat(0xdce2ec, { map: tileTex });
  const wallInnerMat = toonMat(0xfff6e5, { emissive: 0xffdca8, emissiveIntensity: 0.18 });
  const plinthMat = toonMat(0x283244);
  const frameMat = toonMat(0x1f2736);
  const roofMat = toonMat(0x364359);

  // Interior warm ceramic floor
  const floorMat = toonMat(0xfff8eb, {
    map: createInteriorFloorTex(),
    emissive: 0xffe0ad,
    emissiveIntensity: 0.24
  });
  store.add(makeBox(8.84, 0.05, 8.26, floorMat, { x: -1.1, y: 0.185, z: -2.58, shadow: false, outline: false }));

  // Back wall & Left wall (exterior tiled + warm bright interior liner)
  store.add(makeBox(9.0, 3.55, 0.18, wallOuterMat, { x: -1.1, y: 1.94, z: -6.72 }));
  store.add(makeBox(8.76, 3.35, 0.05, wallInnerMat, { x: -1.1, y: 1.88, z: -6.6, shadow: false, outline: false }));
  store.add(makeBox(0.18, 3.55, 8.44, wallOuterMat, { x: -5.52, y: 1.94, z: -2.58 }));
  store.add(makeBox(0.05, 3.35, 8.2, wallInnerMat, { x: -5.4, y: 1.88, z: -2.58, shadow: false, outline: false }));

  // Right-rear solid wall (behind chillers & exterior vending machines)
  store.add(makeBox(0.18, 3.55, 3.68, wallOuterMat, { x: 3.32, y: 1.94, z: -4.96 }));
  store.add(makeBox(0.05, 3.35, 3.6, wallInnerMat, { x: 3.2, y: 1.88, z: -4.96, shadow: false, outline: false }));

  // Front-left corner pillar & window kick-plates
  store.add(makeBox(1.36, 3.55, 0.2, wallOuterMat, { x: -4.92, y: 1.94, z: 1.54 }));
  store.add(makeBox(2.3, 0.36, 0.2, plinthMat, { x: -3.1, y: 0.35, z: 1.54 }));
  store.add(makeBox(3.08, 0.36, 0.2, plinthMat, { x: 1.88, y: 0.35, z: 1.54 }));
  store.add(makeBox(0.2, 0.36, 4.76, plinthMat, { x: 3.32, y: 0.35, z: -0.74 }));

  // Mullion columns framing windows & corner jewel-box glass
  for (const [mx, mz] of [[-4.24, 1.55], [-1.96, 1.55], [0.36, 1.55], [1.86, 1.55], [3.34, 1.55], [3.34, -0.8], [3.34, -3.12]]) {
    store.add(makeBox(0.1, 2.95, 0.12, frameMat, { x: mx, y: 1.65, z: mz }));
  }
  store.add(makeBox(7.7, 0.1, 0.14, frameMat, { x: -0.44, y: 3.06, z: 1.55 }));
  store.add(makeBox(0.14, 0.1, 4.75, frameMat, { x: 3.34, y: 3.06, z: -0.78 }));

  // Clear anime display glass panes (transparent so interior stays super crisp)
  const glassPaneMat = new THREE.MeshStandardMaterial({
    color: 0xbfe4ff,
    transparent: true,
    opacity: 0.15,
    roughness: 0.08,
    metalness: 0.1,
    depthWrite: false
  });
  store.add(makeBox(2.24, 2.5, 0.03, glassPaneMat, { x: -3.1, y: 1.78, z: 1.55, shadow: false, outline: false }));
  store.add(makeBox(2.94, 2.5, 0.03, glassPaneMat, { x: 1.85, y: 1.78, z: 1.55, shadow: false, outline: false }));
  store.add(makeBox(0.03, 2.5, 4.64, glassPaneMat, { x: 3.34, y: 1.78, z: -0.78, shadow: false, outline: false }));

  buildAutoDoorsSignAndRoof(store, frameMat, glassPaneMat, roofMat);
  diorama.add(store);
}

function buildAutoDoorsSignAndRoof(store, frameMat, glassPaneMat, roofMat) {
  // Automatic Sliding Doors (自动门 x ∈ [-1.96, 0.36], center = -0.8)
  store.add(makeBox(2.32, 0.14, 0.18, frameMat, { x: -0.8, y: 2.58, z: 1.55 }));
  store.add(makeBox(2.24, 0.42, 0.03, glassPaneMat, { x: -0.8, y: 2.84, z: 1.55, shadow: false, outline: false }));
  store.add(makeBox(0.46, 0.1, 0.14, toonMat(0x11151f), { x: -0.8, y: 2.66, z: 1.66, shadow: false }));

  const createDoorLeaf = (baseX) => {
    const leaf = new THREE.Group();
    leaf.position.set(baseX, 1.35, 1.56);
    leaf.userData.closedX = baseX;
    leaf.add(makeBox(1.08, 2.32, 0.05, glassPaneMat, { shadow: false, outline: false }));
    leaf.add(makeBox(1.1, 0.07, 0.07, frameMat, { y: 1.13, shadow: false }));
    leaf.add(makeBox(1.1, 0.09, 0.07, frameMat, { y: -1.12, shadow: false }));
    leaf.add(makeBox(0.06, 2.32, 0.07, frameMat, { x: -0.52, shadow: false }));
    leaf.add(makeBox(0.06, 2.32, 0.07, frameMat, { x: 0.52, shadow: false }));
    leaf.add(makeBox(0.98, 0.06, 0.06, emissiveMat(0x28a9ff, 0.5), { y: 0.05, shadow: false, outline: false }));
    store.add(leaf);
    return leaf;
  };
  animState.autoDoorLeft = createDoorLeaf(-1.35);
  animState.autoDoorRight = createDoorLeaf(-0.25);

  // Entrance floor mats (门口地垫 - outside & inside)
  store.add(makeBox(1.95, 0.025, 0.85, toonMat(0x232b3b), { x: -0.8, y: 0.175, z: 2.08, shadow: false }));
  store.add(makeBox(1.75, 0.015, 0.68, toonMat(0x36445c), { x: -0.8, y: 0.185, z: 2.08, shadow: false, outline: false }));
  store.add(makeBox(1.85, 0.02, 0.72, toonMat(0x2c364a), { x: -0.8, y: 0.215, z: 1.08, shadow: false, warm: true }));

  // Ceiling slab, roof & parapet
  store.add(makeBox(9.12, 0.22, 8.58, roofMat, { x: -1.06, y: 3.68, z: -2.56 }));
  store.add(makeBox(9.26, 0.52, 0.22, toonMat(0x4a5973), { x: -1.06, y: 4.02, z: -6.76 }));
  store.add(makeBox(0.22, 0.52, 8.62, toonMat(0x4a5973), { x: -5.58, y: 4.02, z: -2.56 }));
  // Rooftop HVAC & power mast
  store.add(makeBox(1.8, 0.72, 1.3, toonMat(0x6c7c96), { x: -3.2, y: 4.15, z: -4.5 }));
  store.add(makeBox(0.95, 0.5, 0.95, toonMat(0x5a6880), { x: 0.8, y: 4.04, z: -4.8 }));
  store.add(makeBox(0.1, 1.25, 0.1, frameMat, { x: 2.75, y: 4.35, z: -1.4 }));

  // Wrap-around Illuminated Konbini Fascia Signboard (便利店招牌)
  const signTexFront = createStoreSignTex('ほしのマート', '24H  コンビニ • 酒 • たばこ • ATM');
  const signTexSide = createStoreSignTex('HOSHINO MART', 'OPEN 24 HOURS • 弁当 • おでん • COFFEE');
  const signBacking = toonMat(0x1d2738);
  store.add(makeBox(9.28, 0.96, 0.26, signBacking, { x: -1.04, y: 3.66, z: 1.68 }));
  store.add(makeBox(9.16, 0.88, 0.05, emissiveMat(0xffffff, 0.95, signTexFront), {
    x: -1.04, y: 3.66, z: 1.82, shadow: false, outline: false
  }));
  store.add(makeBox(0.26, 0.96, 8.66, signBacking, { x: 3.48, y: 3.66, z: -2.52 }));
  const sideSignFace = makeBox(0.05, 0.88, 8.52, emissiveMat(0xffffff, 0.92, signTexSide), {
    x: 3.62, y: 3.66, z: -2.52, shadow: false, outline: false
  });
  store.add(sideSignFace);

  // Translucent Ribbed Rain Canopy / Awning (屋檐雨棚)
  const canopyMat = new THREE.MeshToonMaterial({
    color: 0x3b689c,
    gradientMap: ramp4,
    transparent: true,
    opacity: 0.74
  });
  const frontAwning = makeBox(9.2, 0.08, 1.18, canopyMat, { x: -1.02, y: 2.96, z: 2.22 });
  frontAwning.rotation.x = 0.09;
  store.add(frontAwning);
  store.add(makeBox(9.24, 0.09, 0.08, frameMat, { x: -1.02, y: 2.91, z: 2.81 }));

  const sideAwning = makeBox(1.06, 0.08, 7.85, canopyMat, { x: 3.98, y: 2.96, z: -2.18 });
  sideAwning.rotation.z = -0.09;
  store.add(sideAwning);
  store.add(makeBox(0.08, 0.09, 7.88, frameMat, { x: 4.5, y: 2.91, z: -2.18 }));
}

// ============================================================================
// 7. STORE INTERIOR: CEILING, FLOOR SIGNS, CHECKOUT, COFFEE, ODEN & COOLERS
// ============================================================================
function buildStoreInterior() {
  const inter = new THREE.Group();
  const warmWhite = toonMat(0xfdf6e9, { warm: true });
  const woodMat = toonMat(0xd9a166, { warm: true });
  const steelMat = toonMat(0xb8c4d4, { warm: true });
  const darkMetal = toonMat(0x262f40, { warm: true });

  // Warm glowing ceiling LED light strips
  for (const lx of [-3.7, -1.1, 1.5]) {
    for (const lz of [-4.4, -1.1]) {
      inter.add(makeBox(1.85, 0.05, 2.2, emissiveMat(0xfff1d6, 1.05), {
        x: lx, y: 3.53, z: lz, shadow: false, outline: false
      }));
    }
  }

  // Floor Directional Decals (地面导视 - queue markers & aisle guide strips)
  const guideBlue = toonMat(0x2494eb);
  const guideOrange = toonMat(0xff773d);
  for (let i = 0; i < 3; i++) {
    inter.add(makeBox(0.58, 0.008, 0.24, guideBlue, {
      x: -1.65, y: 0.214, z: -0.45 - i * 0.85, shadow: false, outline: false
    }));
    inter.add(makeBox(0.14, 0.01, 0.16, warmWhite, {
      x: -1.75, y: 0.216, z: -0.45 - i * 0.85, shadow: false, outline: false
    }));
    inter.add(makeBox(0.14, 0.01, 0.16, warmWhite, {
      x: -1.55, y: 0.216, z: -0.45 - i * 0.85, shadow: false, outline: false
    }));
  }
  inter.add(makeBox(0.16, 0.008, 2.4, guideOrange, { x: -0.8, y: 0.214, z: -0.3, shadow: false, outline: false }));
  inter.add(makeBox(2.2, 0.008, 0.16, guideBlue, { x: 0.4, y: 0.214, z: -5.15, shadow: false, outline: false }));

  // L-Shaped Checkout Counter (收银台)
  inter.add(makeBox(0.86, 0.96, 3.3, warmWhite, { x: -2.68, y: 0.68, z: -1.05, warm: true }));
  inter.add(makeBox(0.94, 0.07, 3.38, woodMat, { x: -2.68, y: 1.18, z: -1.05, warm: true }));
  inter.add(makeBox(2.1, 0.96, 0.82, warmWhite, { x: -4.15, y: 0.68, z: 0.18, warm: true }));
  inter.add(makeBox(2.16, 0.07, 0.88, woodMat, { x: -4.15, y: 1.18, z: 0.18, warm: true }));
  // Decorative front stripe on counter
  inter.add(makeBox(0.03, 0.16, 3.28, guideBlue, { x: -2.24, y: 0.95, z: -1.05, shadow: false, outline: false }));

  // POS Cash Registers
  for (const rz of [-1.95, -2.45]) {
    inter.add(makeBox(0.34, 0.14, 0.36, darkMetal, { x: -2.68, y: 1.28, z: rz, warm: true }));
    inter.add(makeBox(0.06, 0.28, 0.32, darkMetal, { x: -2.74, y: 1.46, z: rz, warm: true }));
    inter.add(makeBox(0.03, 0.22, 0.26, emissiveMat(0x8be0ff, 0.7), {
      x: -2.7, y: 1.46, z: rz, shadow: false, outline: false
    }));
  }

  // Konbini Coffee Machine (咖啡机) + Cup Dispenser
  inter.add(makeBox(0.48, 0.68, 0.44, darkMetal, { x: -2.65, y: 1.55, z: 0.28, warm: true }));
  inter.add(makeBox(0.04, 0.2, 0.32, emissiveMat(0xffbe6b, 0.85), {
    x: -2.4, y: 1.72, z: 0.28, shadow: false, outline: false
  }));
  for (const cz of [0.62, 0.74]) {
    const cups = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.38, 10), warmWhite);
    cups.position.set(-2.55, 1.4, cz);
    addInkOutline(cups, { warm: true, threshold: 35 });
    inter.add(cups);
  }

  // Oden Counter (关东煮柜台) & Hot Snack Warmer
  inter.add(makeBox(0.56, 0.16, 0.66, steelMat, { x: -2.58, y: 1.28, z: -0.52, warm: true }));
  inter.add(makeBox(0.48, 0.04, 0.58, emissiveMat(0xe8a848, 0.55), {
    x: -2.58, y: 1.365, z: -0.52, shadow: false, outline: false
  }));
  // Oden ingredients (daikon, tamago, skewers) + sneeze hood + mini lantern tag
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const col = (r + c) % 2 === 0 ? 0xf7ebd2 : 0xd99b52;
      inter.add(makeBox(0.11, 0.06, 0.11, toonMat(col), {
        x: -2.68 + c * 0.18, y: 1.39, z: -0.7 + r * 0.18, shadow: false, warm: true
      }));
    }
  }
  const sneezeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false });
  inter.add(makeBox(0.58, 0.28, 0.68, sneezeMat, { x: -2.58, y: 1.5, z: -0.52, shadow: false, outline: false }));
  inter.add(makeBox(0.16, 0.22, 0.16, emissiveMat(0xff6b3b, 0.9), { x: -2.35, y: 1.72, z: -0.22, shadow: false }));

  // Hot snack warmer case
  inter.add(makeBox(0.5, 0.42, 0.54, emissiveMat(0xffba63, 0.55), { x: -2.58, y: 1.42, z: -1.24, warm: true }));

  buildInteriorCoolersAndShelves(inter, warmWhite, woodMat, steelMat, darkMetal);
  diorama.add(inter);
}

function buildInteriorCoolersAndShelves(inter, warmWhite, woodMat, steelMat, darkMetal) {
  // Back-of-counter shelves & glowing menu lightboxes
  inter.add(makeBox(0.32, 2.25, 2.85, warmWhite, { x: -5.2, y: 1.32, z: -1.35, warm: true }));
  const cigaretteColors = [0x2aa8ff, 0xff6b4a, 0x2ecc71, 0xf1c40f, 0x9b59b6];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      inter.add(makeBox(0.14, 0.2, 0.26, toonMat(cigaretteColors[(row + col) % 5]), {
        x: -5.02, y: 1.25 + row * 0.26, z: -2.52 + col * 0.32, shadow: false, outline: false
      }));
    }
  }
  inter.add(makeBox(0.08, 0.48, 2.5, emissiveMat(0xffe0a6, 0.8), {
    x: -5.05, y: 2.75, z: -1.35, shadow: false
  }));

  // Staff Backroom Door (后场门) + Parcel / Staff Lockers (储物柜) + ATM
  inter.add(makeBox(1.02, 2.18, 0.1, toonMat(0xe8decc), { x: -4.72, y: 1.3, z: -6.52, warm: true }));
  inter.add(makeBox(0.28, 0.38, 0.12, emissiveMat(0xffd79c, 0.5), { x: -4.72, y: 1.72, z: -6.51, shadow: false }));
  inter.add(makeBox(0.96, 2.05, 0.56, toonMat(0x3ba39c), { x: -3.55, y: 1.24, z: -6.28, warm: true }));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      inter.add(makeBox(0.4, 0.42, 0.04, warmWhite, {
        x: -3.77 + c * 0.44, y: 0.5 + r * 0.48, z: -5.99, shadow: false, warm: true
      }));
    }
  }
  // Compact Konbini ATM beside lockers
  inter.add(makeBox(0.62, 1.42, 0.64, warmWhite, { x: -2.68, y: 0.92, z: -6.22, warm: true }));
  inter.add(makeBox(0.46, 0.34, 0.06, emissiveMat(0x63d2ff, 0.8), { x: -2.68, y: 1.32, z: -5.89, shadow: false }));

  // 5-Door Walk-In Beverage Coolers (饮料柜 z = -6.15, x ∈ [-2.15, 3.05])
  inter.add(makeBox(5.2, 2.48, 0.68, darkMetal, { x: 0.45, y: 1.45, z: -6.18, warm: true }));
  inter.add(makeBox(5.04, 2.26, 0.06, emissiveMat(0xf4fbff, 0.82), {
    x: 0.45, y: 1.44, z: -6.42, shadow: false, outline: false
  }));
  const drinkPalette = [0x35c978, 0x29a6ff, 0xff5a4f, 0xffb838, 0xf7f9fc, 0x8e63d9, 0x4cd9c0];
  for (let tier = 0; tier < 5; tier++) {
    const sy = 0.54 + tier * 0.43;
    inter.add(makeBox(5.02, 0.04, 0.52, steelMat, { x: 0.45, y: sy, z: -6.14, shadow: false, outline: false }));
    for (let b = 0; b < 22; b++) {
      const col = drinkPalette[(b + tier * 3) % drinkPalette.length];
      inter.add(makeBox(0.15, 0.28, 0.16, toonMat(col), {
        x: -1.92 + b * 0.215, y: sy + 0.16, z: -6.08, shadow: false, outline: false
      }));
    }
  }
  // Cooler glass door mullions
  for (let d = 0; d <= 5; d++) {
    inter.add(makeBox(0.06, 2.36, 0.08, steelMat, { x: -2.1 + d * 1.02, y: 1.45, z: -5.82, shadow: false }));
  }

  // Open Bento & Onigiri Refrigerated Case (便当区、饭团陈列 x = 2.86, z ∈ [-5.6, -3.1])
  inter.add(makeBox(0.68, 1.98, 2.52, warmWhite, { x: 2.84, y: 1.2, z: -4.38, warm: true }));
  inter.add(makeBox(0.06, 1.75, 2.38, emissiveMat(0xfff5de, 0.72), {
    x: 3.1, y: 1.22, z: -4.38, shadow: false, outline: false
  }));
  for (let t = 0; t < 4; t++) {
    const ty = 0.56 + t * 0.39;
    inter.add(makeBox(0.56, 0.04, 2.4, steelMat, { x: 2.8, y: ty, z: -4.38, shadow: false, warm: true }));
    for (let k = 0; k < 8; k++) {
      const kz = -5.4 + k * 0.29;
      if (t >= 2) {
        // Triangular Onigiri (饭团: white rice prism + dark nori band)
        const oni = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 3), warmWhite);
        oni.position.set(2.74, ty + 0.09, kz);
        oni.rotation.y = Math.PI / 6;
        inter.add(oni);
        inter.add(makeBox(0.07, 0.08, 0.09, toonMat(0x1b2822), {
          x: 2.69, y: ty + 0.06, z: kz, shadow: false, outline: false
        }));
      } else {
        // Colorful Bento Boxes (便当)
        inter.add(makeBox(0.32, 0.08, 0.23, toonMat(k % 2 === 0 ? 0xd94e3b : 0x2b3240), {
          x: 2.74, y: ty + 0.06, z: kz, shadow: false, warm: true
        }));
        inter.add(makeBox(0.26, 0.03, 0.18, toonMat(k % 3 === 0 ? 0xf7cf65 : 0xf29f58), {
          x: 2.74, y: ty + 0.11, z: kz, shadow: false, outline: false
        }));
      }
    }
  }

  buildGondolasFreezerMagazinesAndSigns(inter, warmWhite, woodMat, steelMat, darkMetal);
}

function buildGondolasFreezerMagazinesAndSigns(inter, warmWhite, woodMat, steelMat, darkMetal) {
  const snackColors = [0xff6b57, 0xffc43d, 0x3ec97a, 0x3ba8ff, 0xf279b8, 0xa56ef5, 0xf7eee1];

  // Two Double-Sided Gondola Shelves (整齐排列的货架 & 零食陈列)
  for (const gx of [-0.82, 1.02]) {
    inter.add(makeBox(0.08, 1.32, 3.4, warmWhite, { x: gx, y: 0.87, z: -2.75, warm: true }));
    inter.add(makeBox(0.76, 0.12, 3.44, darkMetal, { x: gx, y: 0.27, z: -2.75, warm: true }));
    // Endcap promotional display on front end of gondola
    inter.add(makeBox(0.74, 1.26, 0.26, warmWhite, { x: gx, y: 0.84, z: -0.96, warm: true }));

    for (let t = 0; t < 3; t++) {
      const sy = 0.56 + t * 0.36;
      inter.add(makeBox(0.74, 0.035, 3.36, warmWhite, { x: gx, y: sy, z: -2.75, shadow: false, warm: true }));
      inter.add(makeBox(0.76, 0.025, 3.38, toonMat(0xf5c842), {
        x: gx, y: sy - 0.015, z: -2.75, shadow: false, outline: false
      }));
      for (const side of [-0.21, 0.21]) {
        for (let i = 0; i < 11; i++) {
          const col = snackColors[(i * 2 + t + ( side > 0 ? 1 : 0 )) % snackColors.length];
          const h = 0.18 + ((i + t) % 3) * 0.04;
          inter.add(makeBox(0.24, h, 0.24, toonMat(col), {
            x: gx + side, y: sy + 0.02 + h / 2, z: -4.25 + i * 0.285, shadow: false, warm: true
          }));
        }
      }
    }
  }

  // Island Ice Cream / Frozen Foods Chest Freezer (冰柜)
  inter.add(makeBox(1.56, 0.78, 0.82, warmWhite, { x: 1.18, y: 0.6, z: 0.25, warm: true }));
  inter.add(makeBox(1.58, 0.12, 0.84, toonMat(0x2898eb), { x: 1.18, y: 0.9, z: 0.25, shadow: false, outline: false }));
  inter.add(makeBox(1.42, 0.05, 0.68, emissiveMat(0xd9f4ff, 0.65), {
    x: 1.18, y: 0.86, z: 0.25, shadow: false, outline: false
  }));
  for (let ix = 0; ix < 5; ix++) {
    for (let iz = 0; iz < 2; iz++) {
      inter.add(makeBox(0.22, 0.08, 0.24, toonMat(snackColors[(ix + iz * 2) % snackColors.length]), {
        x: 0.62 + ix * 0.28, y: 0.91, z: 0.09 + iz * 0.3, shadow: false, outline: false
      }));
    }
  }

  // Window-Side Magazine & Manga Racks (杂志架 - along front & right glass)
  inter.add(makeBox(2.45, 0.88, 0.38, warmWhite, { x: 1.82, y: 0.64, z: 1.28, warm: true }));
  for (let m = 0; m < 8; m++) {
    const mag = makeBox(0.24, 0.32, 0.04, toonMat(snackColors[m % snackColors.length]), {
      x: 0.78 + m * 0.29, y: 0.98, z: 1.26, shadow: false, warm: true
    });
    mag.rotation.x = -0.26;
    inter.add(mag);
  }
  inter.add(makeBox(0.38, 0.88, 2.2, warmWhite, { x: 3.04, y: 0.64, z: -1.45, warm: true }));
  for (let m = 0; m < 7; m++) {
    const mag = makeBox(0.04, 0.32, 0.24, toonMat(snackColors[(m + 3) % snackColors.length]), {
      x: 3.02, y: 0.98, z: -2.35 + m * 0.3, shadow: false, warm: true
    });
    mag.rotation.z = 0.26;
    inter.add(mag);
  }

  // Hanging In-Store Lightboxes (店内灯箱) & Window Promotional Posters (宣传海报)
  const signConfigs = [
    [-0.82, -2.7, '#ff773d', 'おかし・食品', 'SNACKS & NOODLES'],
    [1.02, -2.7, '#1ec988', 'お弁当・デザート', 'BENTO & SWEETS'],
    [0.45, -5.45, '#1ea4ff', 'お飲み物・お酒', 'COLD DRINKS']
  ];
  for (const [sx, sz, col, t1, t2] of signConfigs) {
    const tex = createAisleSignTex(col, t1, t2);
    inter.add(makeBox(1.38, 0.34, 0.06, emissiveMat(0xffffff, 0.75, tex), {
      x: sx, y: 2.95, z: sz, shadow: false
    }));
  }

  // Hanging window posters visible from outside
  const p1 = createPosterTex('#fff5e4', '#ff6338', 'おでん全品', '80円〜');
  const p2 = createPosterTex('#eef8ff', '#1e96f2', '挽きたて珈琲', '110円');
  inter.add(makeBox(0.48, 0.66, 0.02, emissiveMat(0xffffff, 0.55, p1), { x: -3.65, y: 2.18, z: 1.46, shadow: false }));
  inter.add(makeBox(0.48, 0.66, 0.02, emissiveMat(0xffffff, 0.55, p2), { x: 2.72, y: 2.18, z: 1.46, shadow: false }));
}

// ============================================================================
// 8. NARROW SIDE ALLEYWAY, AC OUTDOOR UNITS & REAR UTILITY STRIP
// ============================================================================
function buildSideAlleyAndBackyard() {
  const alley = new THREE.Group();
  const darkWall = toonMat(0x2c3952);
  const trimSlate = toonMat(0x1e2738);
  const pipeMat = toonMat(0x8a9bb5);
  const acBodyMat = toonMat(0xd9e1ec);

  // Neighboring two-story building framing the narrow left alley (小巷入口)
  alley.add(makeBox(1.5, 5.35, 10.1, darkWall, { x: -9.16, y: 2.84, z: -3.65 }));
  alley.add(makeBox(1.62, 0.24, 10.22, trimSlate, { x: -9.14, y: 5.58, z: -3.65 }));
  // Corrugated metal eave over alley side door & glowing frosted window
  const eave = makeBox(0.62, 0.08, 2.4, toonMat(0x3a4d6b), { x: -8.18, y: 2.88, z: -2.6 });
  eave.rotation.z = -0.18;
  alley.add(eave);
  alley.add(makeBox(0.08, 1.95, 0.92, trimSlate, { x: -8.38, y: 1.15, z: -2.6 }));
  alley.add(makeBox(0.08, 0.68, 0.95, emissiveMat(0xffbd73, 0.65), { x: -8.39, y: 4.1, z: -1.3, shadow: false }));
  alley.add(makeBox(0.08, 0.56, 0.72, emissiveMat(0x7ca6d9, 0.35), { x: -8.39, y: 4.1, z: -5.2, shadow: false }));

  // Warm glowing alley lantern / vertical mini signboard (轻微闪烁灯箱之一)
  const lanternMat = emissiveMat(0xff9040, 1.2);
  const lantern = makeBox(0.24, 0.68, 0.24, lanternMat, { x: -8.08, y: 2.45, z: -1.75, shadow: false });
  alley.add(lantern);
  animState.flickerItems.push({ mat: lanternMat, base: 1.2, speed: 17.0, phase: 1.3 });

  // Gas meter & exterior conduit pipes on alley wall
  alley.add(makeBox(0.22, 0.32, 0.28, pipeMat, { x: -8.3, y: 1.25, z: 0.35 }));
  alley.add(makeBox(0.06, 4.6, 0.06, pipeMat, { x: -8.36, y: 2.5, z: 0.42, shadow: false }));

  // Detailed AC Outdoor Condenser Units (空调外机 x3) on store's left alley wall
  const makeACUnit = (x, y, z) => {
    const u = new THREE.Group();
    u.position.set(x, y, z);
    u.add(makeBox(0.36, 0.58, 0.82, acBodyMat));
    u.add(makeBox(0.42, 0.06, 0.86, trimSlate, { y: -0.32 }));
    const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 16), trimSlate);
    grille.rotation.z = Math.PI / 2;
    grille.position.set(-0.18, 0.02, -0.1);
    addInkOutline(grille, { threshold: 30 });
    u.add(grille);
    u.add(makeBox(0.06, 0.45, 0.06, toonMat(0xc78d5e), { x: 0.08, y: 0.46, z: 0.28, shadow: false }));
    return u;
  };
  alley.add(makeACUnit(-5.82, 0.85, -1.55));
  alley.add(makeACUnit(-5.82, 1.68, -1.55));
  alley.add(makeACUnit(-5.82, 0.85, -3.15));

  // Stacked plastic crates & alley bollard at alley mouth
  for (let i = 0; i < 3; i++) {
    alley.add(makeBox(0.42, 0.28, 0.52, toonMat(i % 2 === 0 ? 0x2678c9 : 0xe3ad2b), {
      x: -5.85, y: 0.16 + i * 0.29, z: -4.65
    }));
  }
  const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.68, 10), toonMat(0xd96b2b));
  bollard.position.set(-7.05, 0.35, 1.35);
  addInkOutline(bollard, { hull: 0.05 });
  alley.add(bollard);

  // Rear concrete block fence (ブロック塀) & dark manicured night shrubs
  alley.add(makeBox(10.5, 1.25, 0.2, toonMat(0x45536b), { x: -0.4, y: 0.78, z: -9.65 }));
  const shrubMat = toonMat(0x1c3d38, { soft: true });
  for (let s = 0; s < 7; s++) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46 + (s % 2) * 0.12, 1), shrubMat);
    bush.position.set(-4.8 + s * 1.45, 0.52, -8.85 + (s % 2) * 0.2);
    bush.castShadow = true;
    addInkOutline(bush, { threshold: 0, hull: 0.035 });
    alley.add(bush);
  }

  diorama.add(alley);
}

// ============================================================================
// 9. STOREFRONT PROPS: VENDING MACHINES, BINS, UMBRELLAS, NOTICEBOARD & PYLON
// ============================================================================
function buildStorefrontProps() {
  const props = new THREE.Group();
  const darkTrim = toonMat(0x1e2636);
  const steel = toonMat(0x9fb0c7);

  // Two Japanese Drink Vending Machines (自动贩卖机) on right sidewalk
  const makeVendingMachine = (zPos, bodyColor, glowColor) => {
    const vm = new THREE.Group();
    vm.position.set(3.8, 1.12, zPos);
    vm.add(makeBox(0.68, 1.9, 1.04, toonMat(bodyColor)));
    vm.add(makeBox(0.06, 0.92, 0.88, emissiveMat(glowColor, 0.95), { x: 0.33, y: 0.34, shadow: false }));
    const canCols = [0x29a6ff, 0xff5a4f, 0x35c978, 0xffc238, 0xf5f7fa];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        vm.add(makeBox(0.05, 0.16, 0.09, toonMat(canCols[(c + r * 2) % 5]), {
          x: 0.35, y: 0.14 + r * 0.38, z: -0.32 + c * 0.125, shadow: false, outline: false
        }));
      }
    }
    vm.add(makeBox(0.05, 0.24, 0.72, darkTrim, { x: 0.33, y: -0.62 }));
    vm.add(makeBox(0.06, 0.16, 0.16, emissiveMat(0x7be0ff, 0.8), { x: 0.33, y: -0.22, z: 0.32, shadow: false }));
    return vm;
  };
  props.add(makeVendingMachine(-4.08, 0xf2f6fc, 0xe8f7ff));
  props.add(makeVendingMachine(-5.24, 0xd9483b, 0xfff0d9));

  // 3-Bin Recycling Trash Station (垃圾桶)
  const binAccent = [0xe05246, 0x2a9df4, 0x2eb872];
  for (let b = 0; b < 3; b++) {
    const bz = -2.42 - b * 0.38;
    props.add(makeBox(0.46, 0.76, 0.34, toonMat(0xdbe2ed), { x: 3.74, y: 0.55, z: bz }));
    props.add(makeBox(0.48, 0.22, 0.36, toonMat(binAccent[b]), { x: 3.74, y: 1.02, z: bz }));
    props.add(makeBox(0.05, 0.1, 0.16, darkTrim, { x: 3.97, y: 1.02, z: bz, shadow: false }));
  }

  // Entrance Stainless Umbrella Stand (雨伞架) with umbrellas
  const umbX = 0.72, umbZ = 1.96;
  props.add(makeBox(0.48, 0.54, 0.28, steel, { x: umbX, y: 0.44, z: umbZ }));
  props.add(makeBox(0.42, 0.04, 0.22, darkTrim, { x: umbX, y: 0.22, z: umbZ, shadow: false }));
  const umbColors = [0xd8f0ff, 0xffd24c, 0xff6b6b, 0xcbe8ff, 0x4aa8ff];
  for (let u = 0; u < 5; u++) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.016, 0.76, 8),
      toonMat(umbColors[u], { transparent: u % 3 === 0, opacity: u % 3 === 0 ? 0.68 : 1 })
    );
    shaft.position.set(umbX - 0.16 + u * 0.08, 0.58, umbZ + (u % 2 === 0 ? -0.04 : 0.04));
    shaft.rotation.z = (u - 2) * 0.06;
    addInkOutline(shaft, { threshold: 35 });
    props.add(shaft);
    props.add(makeBox(0.06, 0.08, 0.03, darkTrim, {
      x: shaft.position.x + 0.02, y: 0.98, z: shaft.position.z, shadow: false
    }));
  }

  // Community Noticeboard / Poster Board (小型公告栏 + A型海报架)
  props.add(makeBox(0.08, 1.55, 0.08, toonMat(0x6b4e38), { x: -5.32, y: 0.94, z: 2.04 }));
  props.add(makeBox(0.08, 1.55, 0.08, toonMat(0x6b4e38), { x: -4.36, y: 0.94, z: 2.04 }));
  props.add(makeBox(1.08, 0.82, 0.1, toonMat(0xc9a372), { x: -4.84, y: 1.32, z: 2.04 }));
  props.add(makeBox(1.22, 0.12, 0.28, toonMat(0x286e56), { x: -4.84, y: 1.77, z: 2.06 }));
  const flyerCols = [0xfff6e0, 0xffd6d6, 0xd8f3ff, 0xe2ffd9, 0xffe8b8];
  for (let f = 0; f < 5; f++) {
    props.add(makeBox(0.16, 0.24, 0.02, emissiveMat(flyerCols[f], 0.35), {
      x: -5.2 + f * 0.18, y: 1.34 + (f % 2) * 0.12 - 0.06, z: 2.1, shadow: false
    }));
  }
  // A-frame sandwich poster stand near automatic door
  const aPoster = createPosterTex('#fff7e8', '#ff6b3b', '雨の日セール', 'HOT中華まん');
  const boardA = makeBox(0.52, 0.78, 0.05, emissiveMat(0xffffff, 0.45, aPoster), { x: -2.28, y: 0.56, z: 2.28 });
  boardA.rotation.x = -0.16;
  props.add(boardA);
  const boardB = makeBox(0.52, 0.78, 0.05, darkTrim, { x: -2.28, y: 0.56, z: 2.08 });
  boardB.rotation.x = 0.16;
  props.add(boardB);

  // Tall Street-Corner Pylon Sign (24H 便利店街角立柱招牌 - 轻微闪烁)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 4.9, 12), darkTrim);
  pole.position.set(4.32, 2.6, 4.32);
  pole.castShadow = true;
  addInkOutline(pole, { hull: 0.04, threshold: 0 });
  props.add(pole);

  const pylonFaceMat = emissiveMat(0xffffff, 1.02, createPylonSignTex());
  props.add(makeBox(0.96, 1.44, 0.24, darkTrim, { x: 4.32, y: 5.18, z: 4.32 }));
  props.add(makeBox(0.88, 1.36, 0.27, pylonFaceMat, { x: 4.32, y: 5.18, z: 4.32, shadow: false, outline: false }));
  animState.flickerItems.push({ mat: pylonFaceMat, base: 1.02, speed: 23.0, phase: 0.0 });

  diorama.add(props);
}

// ============================================================================
// 10. PARKED MAMACHARI BICYCLE, CURB GUARDRAILS & JAPANESE ROAD SIGNS
// ============================================================================
function buildBicycleAndStreetFurniture() {
  const grp = new THREE.Group();
  const tireMat = toonMat(0x1b202b);
  const chromeMat = toonMat(0xc5d2e3);
  const bikePaint = toonMat(0x4ac2a8);
  const leatherMat = toonMat(0x6e442b);

  // Detailed Japanese Mamachari Bicycle (自行车)
  const bike = new THREE.Group();
  bike.position.set(2.15, 0.16, 2.28);
  bike.rotation.y = -0.36;
  bike.rotation.x = 0.06; // slight lean on kickstand

  for (const wx of [-0.52, 0.52]) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.036, 10, 24), tireMat);
    tire.position.set(wx, 0.34, 0);
    tire.castShadow = true;
    addInkOutline(tire, { threshold: 0, hull: 0.03 });
    bike.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 8), chromeMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(wx, 0.34, 0);
    bike.add(hub);
    for (let s = 0; s < 4; s++) {
      const spoke = makeBox(0.58, 0.012, 0.012, chromeMat, { x: wx, y: 0.34, shadow: false, outline: false });
      spoke.rotation.z = (s * Math.PI) / 4;
      bike.add(spoke);
    }
  }
  // Step-through frame tubes, fork, seatpost & handlebars
  const downTube = makeBox(0.68, 0.04, 0.04, bikePaint, { x: 0.08, y: 0.52 });
  downTube.rotation.z = 0.42;
  bike.add(downTube);
  const chainStay = makeBox(0.56, 0.035, 0.04, bikePaint, { x: -0.25, y: 0.36 });
  bike.add(chainStay);
  const seatTube = makeBox(0.04, 0.52, 0.04, bikePaint, { x: -0.14, y: 0.58 });
  seatTube.rotation.z = 0.18;
  bike.add(seatTube);
  const fork = makeBox(0.04, 0.64, 0.05, bikePaint, { x: 0.45, y: 0.64 });
  fork.rotation.z = 0.22;
  bike.add(fork);
  // Saddle, handlebar, front wire basket & rear rack + kickstand
  bike.add(makeBox(0.22, 0.07, 0.16, leatherMat, { x: -0.2, y: 0.86 }));
  bike.add(makeBox(0.05, 0.05, 0.48, chromeMat, { x: 0.36, y: 0.96 }));
  bike.add(makeBox(0.26, 0.22, 0.3, toonMat(0x3a4659), { x: 0.55, y: 0.78 }));
  bike.add(makeBox(0.36, 0.03, 0.18, chromeMat, { x: -0.5, y: 0.69 }));
  const stand = makeBox(0.03, 0.34, 0.2, chromeMat, { x: -0.52, y: 0.2, z: -0.06 });
  stand.rotation.x = 0.22;
  bike.add(stand);
  grp.add(bike);

  // Japanese White Pipe Curb Guardrails (街角护栏)
  const railWhite = toonMat(0xeaf0f8);
  const addGuardrailSpan = (x1, z1, x2, z2) => {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const span = new THREE.Group();
    span.position.set((x1 + x2) / 2, 0.16, (z1 + z2) / 2);
    span.rotation.y = -Math.atan2(dz, dx);
    for (const px of [-len / 2, 0, len / 2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.74, 8), railWhite);
      post.position.set(px, 0.37, 0);
      post.castShadow = true;
      addInkOutline(post, { hull: 0.04, threshold: 0 });
      span.add(post);
    }
    span.add(makeBox(len, 0.055, 0.055, railWhite, { y: 0.68 }));
    span.add(makeBox(len, 0.045, 0.045, railWhite, { y: 0.42 }));
    grp.add(span);
  };
  addGuardrailSpan(-4.2, 4.92, -1.3, 4.92);
  addGuardrailSpan(-0.7, 4.92, 2.1, 4.92);
  addGuardrailSpan(4.74, 1.65, 4.74, -1.8);
  addGuardrailSpan(4.74, -2.5, 4.74, -6.4);

  // Japanese Road Signs (路牌: 町名案内板 + 止まれ inverted red triangle)
  const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.9, 10), chromeMat);
  signPole.position.set(2.18, 1.6, 4.88);
  signPole.castShadow = true;
  addInkOutline(signPole, { hull: 0.04, threshold: 0 });
  grp.add(signPole);
  grp.add(makeBox(0.92, 0.44, 0.05, toonMat(0xffffff, { map: createRoadSignTex() }), {
    x: 2.18, y: 2.86, z: 4.88
  }));
  const stopTri = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 3), toonMat(0xd93832));
  stopTri.rotation.x = Math.PI / 2;
  stopTri.rotation.z = Math.PI;
  stopTri.position.set(2.18, 2.28, 4.92);
  addInkOutline(stopTri, { threshold: 25 });
  grp.add(stopTri);

  diorama.add(grp);
}

// ============================================================================
// 11. UTILITY POLES, OVERHEAD POWER LINES, STREETLAMP & TRAFFIC SIGNAL
// ============================================================================
function buildPolesWiresAndTrafficLight() {
  const grp = new THREE.Group();
  const concretePoleMat = toonMat(0x7c8a9e);
  const darkIron = toonMat(0x222b3b);
  const hazardYellow = toonMat(0xe8b928);

  const makeUtilityPole = (px, pz, h) => {
    const p = new THREE.Group();
    p.position.set(px, 0.16, pz);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, h, 12), concretePoleMat);
    shaft.position.y = h / 2;
    shaft.castShadow = true;
    addInkOutline(shaft, { hull: 0.035, threshold: 0 });
    p.add(shaft);
    // Hazard stripes near bottom
    for (let b = 0; b < 3; b++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.162, 0.14, 12), b % 2 === 0 ? hazardYellow : darkIron);
      band.position.y = 1.05 + b * 0.16;
      p.add(band);
    }
    // Crossarms
    p.add(makeBox(1.35, 0.08, 0.09, darkIron, { y: h - 0.55 }));
    p.add(makeBox(1.1, 0.07, 0.08, darkIron, { y: h - 1.15 }));
    return p;
  };

  const pole1 = makeUtilityPole(4.62, 1.12, 7.25);
  // Pole transformer drum (柱上変圧器)
  const trans = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.68, 12), toonMat(0x5d6b80));
  trans.position.set(-0.28, 4.95, 0.22);
  addInkOutline(trans, { threshold: 30 });
  pole1.add(trans);

  // Curved Japanese Streetlamp (路灯) + Volumetric Misty Light Cone
  const arm = makeBox(1.05, 0.06, 0.06, darkIron, { x: 0.48, y: 5.65, z: 0.36 });
  arm.rotation.z = 0.22;
  arm.rotation.y = -0.5;
  pole1.add(arm);
  pole1.add(makeBox(0.46, 0.1, 0.22, toonMat(0xdbe4f0), { x: 0.88, y: 5.76, z: 0.68 }));
  pole1.add(makeBox(0.38, 0.05, 0.16, emissiveMat(0xe8f4ff, 1.4), {
    x: 0.88, y: 5.71, z: 0.68, shadow: false, outline: false
  }));
  const coneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float fade = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
        gl_FragColor = vec4(0.82, 0.92, 1.0, fade * 0.095);
      }
    `
  });
  const lightCone = new THREE.Mesh(new THREE.ConeGeometry(2.35, 5.6, 24, 1, true), coneMat);
  lightCone.position.set(5.55, 3.05, 1.95);
  lightCone.rotation.z = -0.08;
  grp.add(lightCone);
  grp.add(pole1);

  const pole2 = makeUtilityPole(-4.42, 4.88, 6.75);
  grp.add(pole2);

  // Overhead Sagging Power Lines (电线)
  const wireMat = new THREE.LineBasicMaterial({ color: 0x263754, transparent: true, opacity: 0.9 });
  const addWire = (pA, pB, sag = 0.55) => {
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(22));
    grp.add(new THREE.Line(geo, wireMat));
  };
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  addWire(v(4.1, 6.86, 1.12), v(-3.95, 6.36, 4.88), 0.65);
  addWire(v(5.1, 6.86, 1.12), v(-4.9, 6.36, 4.88), 0.72);
  addWire(v(4.62, 6.26, 1.12), v(-4.42, 5.76, 4.88), 0.58);
  addWire(v(4.35, 6.26, 1.12), v(2.75, 4.92, -1.4), 0.42);
  addWire(v(-4.65, 5.76, 4.88), v(-8.4, 5.15, -0.8), 0.52);
  addWire(v(4.62, 6.86, 1.12), v(4.65, 6.7, -9.6), 0.68);

  // Distant Intersection Traffic Signal (远处交通信号灯) & Convex Mirror (カーブミラー)
  const sigPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.1, 10), toonMat(0x8c9bb0));
  sigPole.position.set(9.12, 2.7, 9.12);
  sigPole.castShadow = true;
  addInkOutline(sigPole, { hull: 0.04, threshold: 0 });
  grp.add(sigPole);
  grp.add(makeBox(1.85, 0.09, 0.09, toonMat(0x8c9bb0), { x: 8.22, y: 4.85, z: 9.12 }));
  grp.add(makeBox(1.18, 0.38, 0.34, darkIron, { x: 7.68, y: 4.85, z: 9.08 }));

  const lensGreen = emissiveMat(0x1ff0a0, 1.35);
  const lensYellow = emissiveMat(0xffbe2e, 0.08);
  const lensRed = emissiveMat(0xff3b3b, 0.08);
  animState.trafficLenses = { green: lensGreen, yellow: lensYellow, red: lensRed };
  const lenses = [[7.34, lensGreen], [7.68, lensYellow], [8.02, lensRed]];
  for (const [lx, lmat] of lenses) {
    for (const lz of [8.9, 9.26]) {
      const lMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.08, 14), lmat);
      lMesh.rotation.x = Math.PI / 2;
      lMesh.position.set(lx, 4.85, lz);
      grp.add(lMesh);
    }
  }

  // Orange Japanese Convex Street Mirror (カーブミラー)
  const mirHood = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 18), toonMat(0xf06d24));
  mirHood.rotation.x = Math.PI / 2;
  mirHood.rotation.z = 0.65;
  mirHood.position.set(9.35, 3.1, 8.85);
  addInkOutline(mirHood, { threshold: 30 });
  grp.add(mirHood);

  diorama.add(grp);
}

// ============================================================================
// 12. DYNAMIC RAINY NIGHT WEATHER & MICRO-ANIMATION EFFECTS
// ============================================================================
function buildWeatherAndLifeEffects() {
  const fx = new THREE.Group();

  // 1) Continuous Anime Rain Streaks (持续降雨 - outside store volume)
  const rainCount = 1050;
  const positions = new Float32Array(rainCount * 6);
  const velocities = new Float32Array(rainCount);

  const respawnRaindrop = (i, randomY = false) => {
    let rx = 0, rz = 0;
    for (let tries = 0; tries < 8; tries++) {
      rx = (Math.random() - 0.5) * 19.4;
      rz = (Math.random() - 0.5) * 19.4;
      // Keep rain strictly outside the indoor convenience store volume
      if (!(rx > -5.55 && rx < 3.45 && rz > -6.75 && rz < 1.62)) break;
    }
    const ry = randomY ? 0.5 + Math.random() * 10.8 : 9.8 + Math.random() * 2.2;
    const len = 0.44 + Math.random() * 0.24;
    const idx = i * 6;
    positions[idx] = rx;
    positions[idx + 1] = ry;
    positions[idx + 2] = rz;
    positions[idx + 3] = rx - 0.045;
    positions[idx + 4] = ry - len;
    positions[idx + 5] = rz + 0.025;
    velocities[i] = 12.5 + Math.random() * 4.5;
  };

  for (let i = 0; i < rainCount; i++) respawnRaindrop(i, true);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xa8ccf5,
    transparent: true,
    opacity: 0.36,
    depthWrite: false
  });
  fx.add(new THREE.LineSegments(rainGeo, rainMat));
  animState.rainGeo = rainGeo;
  animState.rainPositions = positions;
  animState.rainVelocities = velocities;
  animState.respawnRaindrop = respawnRaindrop;

  // 2) Eaves Water Drips from Awning Edges (屋檐滴水)
  const dripMat = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.8 });
  const dripGeo = new THREE.BoxGeometry(0.024, 0.13, 0.024);
  for (let d = 0; d < 16; d++) {
    const onFront = d < 10;
    const dx = onFront ? -5.1 + d * 0.92 : 4.52;
    const dz = onFront ? 2.83 : -5.6 + (d - 10) * 1.15;
    const mesh = new THREE.Mesh(dripGeo, dripMat);
    mesh.position.set(dx, 2.88, dz);
    fx.add(mesh);
    animState.eaveDrops.push({
      mesh,
      baseY: 2.88,
      groundY: 0.18,
      progress: Math.random(),
      speed: 0.55 + Math.random() * 0.35
    });
  }

  // 3) Expanding Concentric Puddle Ripples (地面积水波纹)
  const rippleSpots = [
    [0.8, 6.8, 0.024], [1.6, 7.2, 0.024], [-0.2, 6.4, 0.024],
    [6.1, 6.2, 0.024], [6.8, 5.6, 0.024], [5.7, 7.0, 0.024],
    [-6.9, 3.5, 0.024], [-6.3, 4.1, 0.024], [7.2, -1.6, 0.024],
    [-7.0, -2.2, 0.024], [-3.2, 7.7, 0.024], [-1.2, 2.83, 0.175],
    [1.4, 2.83, 0.175], [4.52, -1.2, 0.175]
  ];
  const ringGeo = new THREE.RingGeometry(0.13, 0.165, 24);
  ringGeo.rotateX(-Math.PI / 2);
  for (let r = 0; r < 26; r++) {
    const spot = rippleSpots[r % rippleSpots.length];
    const rMat = new THREE.MeshBasicMaterial({
      color: 0xbce0ff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, rMat);
    ring.position.set(
      spot[0] + (Math.random() - 0.5) * 0.9,
      spot[2],
      spot[1] + (Math.random() - 0.5) * 0.9
    );
    fx.add(ring);
    animState.ripples.push({ mesh: ring, mat: rMat, phase: Math.random(), speed: 0.48 + Math.random() * 0.3 });
  }

  // 4) Raindrops Sliding Down Glass Storefront Windows (雨水沿玻璃滑落)
  const beadGeo = new THREE.BoxGeometry(0.022, 0.085, 0.015);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xdcf0ff, transparent: true, opacity: 0.68 });
  for (let g = 0; g < 38; g++) {
    const bead = new THREE.Mesh(beadGeo, beadMat);
    const seg = g % 3;
    if (seg === 0) {
      bead.position.set(-4.05 + Math.random() * 1.95, 0.65 + Math.random() * 2.25, 1.585);
    } else if (seg === 1) {
      bead.position.set(0.5 + Math.random() * 2.7, 0.65 + Math.random() * 2.25, 1.585);
    } else {
      bead.position.set(3.375, 0.65 + Math.random() * 2.25, -2.95 + Math.random() * 4.35);
      bead.rotation.y = Math.PI / 2;
    }
    fx.add(bead);
    animState.glassDrops.push({ mesh: bead, t: Math.random() * 10, speed: 0.22 + Math.random() * 0.25 });
  }

  diorama.add(fx);
}

// ============================================================================
// 13. SCENE ASSEMBLY & REAL-TIME ANIMATION LOOP
// ============================================================================
setupLighting();
buildDioramaBaseAndRoad();
buildStoreBuilding();
buildStoreInterior();
buildSideAlleyAndBackyard();
buildStorefrontProps();
buildBicycleAndStreetFurniture();
buildPolesWiresAndTrafficLight();
buildWeatherAndLifeEffects();

const clock = new THREE.Clock();

function smoothstep01(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (animState.wetRoadUniforms) {
    animState.wetRoadUniforms.uTime.value = elapsed;
  }

  // 1) Update falling rain streaks
  if (animState.rainPositions) {
    const pos = animState.rainPositions;
    const vels = animState.rainVelocities;
    const count = vels.length;
    for (let i = 0; i < count; i++) {
      const idx = i * 6;
      const stepY = vels[i] * dt;
      const stepX = stepY * 0.085;
      pos[idx] -= stepX;
      pos[idx + 1] -= stepY;
      pos[idx + 3] -= stepX;
      pos[idx + 4] -= stepY;
      if (pos[idx + 4] < 0.08) {
        animState.respawnRaindrop(i, false);
      }
    }
    animState.rainGeo.attributes.position.needsUpdate = true;
  }

  // 2) Update eaves water drips
  for (const d of animState.eaveDrops) {
    d.progress = (d.progress + dt * d.speed) % 1;
    if (d.progress < 0.28) {
      // Forming bead on awning lip
      d.mesh.position.y = d.baseY;
      const s = 0.4 + (d.progress / 0.28) * 0.7;
      d.mesh.scale.set(1, s, 1);
    } else {
      const f = (d.progress - 0.28) / 0.72;
      d.mesh.position.y = d.baseY - f * f * (d.baseY - d.groundY);
      d.mesh.scale.set(0.85, 1.35, 0.85);
    }
  }

  // 3) Update expanding puddle ripples
  for (const r of animState.ripples) {
    r.phase = (r.phase + dt * r.speed) % 1;
    const s = 0.22 + r.phase * 1.65;
    r.mesh.scale.setScalar(s);
    r.mat.opacity = (1 - r.phase) * (1 - r.phase) * 0.52;
  }

  // 4) Update raindrops sliding down glass windows
  for (const gd of animState.glassDrops) {
    const pulse = 0.25 + 0.75 * Math.max(0, Math.sin(elapsed * 2.8 + gd.t));
    gd.mesh.position.y -= dt * gd.speed * pulse;
    if (gd.mesh.position.y < 0.58) {
      gd.mesh.position.y = 2.94;
    }
  }

  // 5) Automatic sliding doors occasional open/close (every 11.5s cycle)
  if (animState.autoDoorLeft && animState.autoDoorRight) {
    const cyc = elapsed % 11.5;
    let openAmt = 0;
    if (cyc > 2.5 && cyc < 3.6) openAmt = smoothstep01((cyc - 2.5) / 1.1);
    else if (cyc >= 3.6 && cyc < 5.7) openAmt = 1;
    else if (cyc >= 5.7 && cyc < 6.8) openAmt = 1 - smoothstep01((cyc - 5.7) / 1.1);

    const slide = openAmt * 0.54;
    animState.autoDoorLeft.position.x = animState.autoDoorLeft.userData.closedX - slide;
    animState.autoDoorRight.position.x = animState.autoDoorRight.userData.closedX + slide;
    if (animState.doorSpillLight) {
      animState.doorSpillLight.intensity = 1.45 + openAmt * 0.75;
    }
  }

  // 6) Subtle fluorescent signboard / lantern flicker
  for (const item of animState.flickerItems) {
    const n = Math.sin(elapsed * item.speed + item.phase) * Math.sin(elapsed * 3.7 + item.phase);
    const dip = n > 0.86 ? 0.68 : 1.0 - Math.max(0, n - 0.6) * 0.25;
    item.mat.emissiveIntensity = item.base * dip;
  }

  // 7) Distant traffic signal cycle & wet road light tint
  const tCyc = elapsed % 16.0;
  const { green, yellow, red } = animState.trafficLenses;
  if (green && yellow && red && animState.trafficLight) {
    if (tCyc < 7.5) {
      green.emissiveIntensity = 1.4; yellow.emissiveIntensity = 0.06; red.emissiveIntensity = 0.06;
      animState.trafficLight.color.setHex(0x1ff0a0);
    } else if (tCyc < 9.6) {
      green.emissiveIntensity = 0.06; yellow.emissiveIntensity = 1.4; red.emissiveIntensity = 0.06;
      animState.trafficLight.color.setHex(0xffbe2e);
    } else {
      green.emissiveIntensity = 0.06; yellow.emissiveIntensity = 0.06; red.emissiveIntensity = 1.45;
      animState.trafficLight.color.setHex(0xff4242);
    }
  }

  controls.update();
  composer.render();
}

animate();
