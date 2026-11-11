(async () => {
  const loadingEl = document.getElementById('loading');
  const loadingText = document.getElementById('loading-text');

  let THREE, OrbitControls;
  try {
    THREE = await import('three');
    ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
  } catch (err) {
    try {
      THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
      ({ OrbitControls } = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js'));
    } catch (fallbackErr) {
      loadingText.textContent = 'Three.js 模块加载失败，请检查网络连接后刷新重试。';
      console.error(fallbackErr);
      return;
    }
  }

  const wrap = document.getElementById('canvas-wrap');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Procedural Sky Dome with Day / Golden-Hour Uniforms
  const skyUniforms = {
    uTopColor: { value: new THREE.Color('#6db8e8') },
    uMidColor: { value: new THREE.Color('#cbeaf8') },
    uBotColor: { value: new THREE.Color('#fff2d6') }
  };
  const skyGeo = new THREE.SphereGeometry(42, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uBotColor;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y, -0.15, 1.0);
        vec3 col = h < 0.25
          ? mix(uBotColor, uMidColor, clamp((h + 0.15) / 0.40, 0.0, 1.0))
          : mix(uMidColor, uTopColor, clamp((h - 0.25) / 0.75, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3.35, 2.75, 6.05);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0.0, 1.55, -0.15);
  controls.minDistance = 2.2;
  controls.maxDistance = 13.5;
  controls.maxPolarAngle = Math.PI * 0.51;

  // Lighting Rig
  const hemiLight = new THREE.HemisphereLight('#e8f6ff', '#c9ad86', 0.95);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff8e6', 2.35);
  sunLight.position.set(-4.5, 7.8, 4.8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 22;
  const sc = 4.6;
  sunLight.shadow.camera.left = -sc;
  sunLight.shadow.camera.right = sc;
  sunLight.shadow.camera.top = sc;
  sunLight.shadow.camera.bottom = -sc;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const seaBounce = new THREE.DirectionalLight('#5ec8dc', 0.55);
  seaBounce.position.set(2.5, 1.5, -5.0);
  scene.add(seaBounce);
  // Shared Stylized-PBR Materials
  const mats = {
    frameTeal: new THREE.MeshPhysicalMaterial({ color: '#1b8a82', roughness: 0.24, metalness: 0.18, clearcoat: 0.85, clearcoatRoughness: 0.15 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e6edf5', roughness: 0.16, metalness: 0.92 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#2b3440', roughness: 0.42, metalness: 0.68 }),
    tire: new THREE.MeshStandardMaterial({ color: '#20262e', roughness: 0.82, metalness: 0.05 }),
    whitewall: new THREE.MeshStandardMaterial({ color: '#faf3e3', roughness: 0.58, metalness: 0.02 }),
    leather: new THREE.MeshStandardMaterial({ color: '#964f26', roughness: 0.48, metalness: 0.08 }),
    brass: new THREE.MeshStandardMaterial({ color: '#f5b82e', roughness: 0.22, metalness: 0.88 }),
    wicker: new THREE.MeshStandardMaterial({ color: '#cf9b56', roughness: 0.76, metalness: 0.04 }),
    fishSilver: new THREE.MeshStandardMaterial({ color: '#7ea6c4', roughness: 0.26, metalness: 0.62 }),
    plumage: new THREE.MeshStandardMaterial({ color: '#fcfdff', roughness: 0.62, metalness: 0.02 }),
    plumageGrey: new THREE.MeshStandardMaterial({ color: '#cfd9e3', roughness: 0.64, metalness: 0.03 }),
    wingTip: new THREE.MeshStandardMaterial({ color: '#273446', roughness: 0.58, metalness: 0.06 }),
    crownGold: new THREE.MeshStandardMaterial({ color: '#fde282', roughness: 0.65, metalness: 0.02 }),
    upperBill: new THREE.MeshStandardMaterial({ color: '#fba343', roughness: 0.36, metalness: 0.05 }),
    billHook: new THREE.MeshStandardMaterial({ color: '#d93b2b', roughness: 0.32, metalness: 0.06 }),
    pouch: new THREE.MeshPhysicalMaterial({
      color: '#f79829', emissive: '#6e3200', emissiveIntensity: 0.18,
      roughness: 0.38, metalness: 0.02, clearcoat: 0.25, side: THREE.DoubleSide
    }),
    legOrange: new THREE.MeshStandardMaterial({ color: '#f4731f', roughness: 0.46, metalness: 0.04 }),
    scarfRed: new THREE.MeshStandardMaterial({ color: '#de493c', roughness: 0.56, side: THREE.DoubleSide }),
    scarfCream: new THREE.MeshStandardMaterial({ color: '#fff8e7', roughness: 0.56, side: THREE.DoubleSide }),
    eyeDark: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.08, metalness: 0.1 }),
    woodDeck: new THREE.MeshStandardMaterial({ color: '#c4a882', roughness: 0.85, metalness: 0.02 }),
    woodPlankA: new THREE.MeshStandardMaterial({ color: '#e3cca8', roughness: 0.78, metalness: 0.02 }),
    woodPlankB: new THREE.MeshStandardMaterial({ color: '#d2b48c', roughness: 0.82, metalness: 0.02 }),
    seawall: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.68, metalness: 0.04 }),
    rock: new THREE.MeshStandardMaterial({ color: '#788c99', roughness: 0.88, flatShading: true }),
    plinthWood: new THREE.MeshStandardMaterial({ color: '#3d281c', roughness: 0.42, metalness: 0.08 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#2e90a8', roughness: 0.14, metalness: 0.08,
      transparent: true, opacity: 0.88, clearcoat: 0.9
    })
  };

  // Scratch vectors for zero-GC animation & IK
  const _vDir = new THREE.Vector3();
  const _vMid = new THREE.Vector3();
  const _vPerp = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _qTmp = new THREE.Quaternion();

  function orientBone(mesh, p1, p2) {
    _vDir.subVectors(p2, p1);
    const len = _vDir.length();
    if (len < 1e-5) return;
    _vMid.addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(_vMid);
    mesh.scale.set(1, len, 1);
    _vDir.divideScalar(len);
    _qTmp.setFromUnitVectors(_up, _vDir);
    mesh.quaternion.copy(_qTmp);
  }

  function makeSegment(p1, p2, r1, r2, mat, segs = 16) {
    const geo = new THREE.CylinderGeometry(r2, r1, 1, segs);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    orientBone(mesh, p1, p2);
    return mesh;
  }

  function solveTwoBoneIK3D(hip, ankle, L1, L2, poleDir, outKnee) {
    _vDir.subVectors(ankle, hip);
    const rawDist = _vDir.length();
    const dist = Math.min(Math.max(rawDist, 0.05), L1 + L2 - 0.002);
    _vDir.normalize();
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    _vPerp.copy(poleDir).addScaledVector(_vDir, -poleDir.dot(_vDir));
    if (_vPerp.lengthSq() < 1e-6) _vPerp.set(1, 0, 0);
    _vPerp.normalize();
    outKnee.copy(hip).addScaledVector(_vDir, a).addScaledVector(_vPerp, h);
  }
  // 1. 3D MINIATURE COASTAL ISLAND DIORAMA
  const envGroup = new THREE.Group();
  scene.add(envGroup);

  const R_ISLAND = 4.18;
  // Museum Walnut Plinth & Brass Ring
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.34, 4.46, 0.44, 72), mats.plinthWood);
  plinth.position.y = -0.52;
  plinth.receiveShadow = true;
  envGroup.add(plinth);

  const brassTrim = new THREE.Mesh(new THREE.TorusGeometry(4.36, 0.028, 14, 84), mats.brass);
  brassTrim.rotation.x = Math.PI / 2;
  brassTrim.position.y = -0.31;
  envGroup.add(brassTrim);

  // Sculpted Boardwalk Deck (Front Circular Segment z > -1.05)
  const wallZ = -1.05;
  const alpha = Math.asin(Math.abs(wallZ) / R_ISLAND); // ~0.254 rad
  const deckShape = new THREE.Shape();
  deckShape.absarc(0, 0, R_ISLAND, -alpha, Math.PI + alpha, false);
  deckShape.closePath(); // Note: rotateX(+PI/2) maps shape +Y -> world +Z!
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, curveSegments: 64 });
  deckGeo.rotateX(Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckGeo, mats.woodDeck);
  deckMesh.position.y = -0.01;
  deckMesh.receiveShadow = true;
  envGroup.add(deckMesh);

  // Stone Seawall Coping Along z = -1.05
  const wallHalfX = Math.sqrt(R_ISLAND * R_ISLAND - wallZ * wallZ) - 0.04;
  const curbMesh = new THREE.Mesh(new THREE.BoxGeometry(wallHalfX * 2, 0.14, 0.18), mats.seawall);
  curbMesh.position.set(0, 0.06, wallZ);
  curbMesh.castShadow = true;
  curbMesh.receiveShadow = true;
  envGroup.add(curbMesh);

  // Ocean Bay Basin & Animated Vertex Wave Mesh (Rear Circular Segment z < -1.05)
  const seaFloorShape = new THREE.Shape();
  seaFloorShape.absarc(0, 0, R_ISLAND - 0.02, Math.PI + alpha, Math.PI * 2 - alpha, false);
  seaFloorShape.closePath();
  const seaFloorGeo = new THREE.ExtrudeGeometry(seaFloorShape, { depth: 0.12, bevelEnabled: false, curveSegments: 56 });
  seaFloorGeo.rotateX(Math.PI / 2);
  const seaFloor = new THREE.Mesh(seaFloorGeo, new THREE.MeshStandardMaterial({ color: '#1b5e73', roughness: 0.7 }));
  seaFloor.position.y = -0.22;
  envGroup.add(seaFloor);

  const waterGeo = new THREE.PlaneGeometry(8.2, 3.2, 52, 24);
  waterGeo.rotateX(-Math.PI / 2);
  const posAttr = waterGeo.attributes.position;
  // Mask vertices outside circular island radius R_ISLAND - 0.04
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    let vz = posAttr.getZ(i) - 2.62;
    const r = Math.hypot(vx, vz);
    if (r > R_ISLAND - 0.05) {
      const s = (R_ISLAND - 0.05) / r;
      posAttr.setX(i, vx * s);
      vz *= s;
    }
    if (vz > wallZ - 0.02) vz = wallZ - 0.02;
    posAttr.setZ(i, vz);
  }
  waterGeo.computeVertexNormals();
  const waterBaseY = new Float32Array(posAttr.count);
  const waterMesh = new THREE.Mesh(waterGeo, mats.water);
  waterMesh.position.y = -0.14;
  waterMesh.receiveShadow = true;
  envGroup.add(waterMesh);

  // Zero-Slip Scrolling Boardwalk Planks & Seawall Bollards
  const plankUnitGeo = new THREE.BoxGeometry(0.31, 0.022, 1);
  const planks = [];
  const PLANK_COUNT = 22, PLANK_STEP = 0.36;
  for (let i = 0; i < PLANK_COUNT; i++) {
    const m = new THREE.Mesh(plankUnitGeo, i % 2 === 0 ? mats.woodPlankA : mats.woodPlankB);
    m.position.y = 0.008;
    m.receiveShadow = true;
    envGroup.add(m);
    planks.push({ mesh: m, baseOffset: (i - PLANK_COUNT / 2) * PLANK_STEP });
  }

  const bollardGeo = new THREE.CylinderGeometry(0.048, 0.056, 0.52, 12);
  const bollardCapGeo = new THREE.SphereGeometry(0.052, 12, 8);
  const bollards = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(bollardGeo, mats.seawall);
    post.position.y = 0.26;
    post.castShadow = true;
    const cap = new THREE.Mesh(bollardCapGeo, mats.brass);
    cap.position.y = 0.52;
    g.add(post, cap);
    g.position.set(0, 0.08, wallZ);
    envGroup.add(g);
    bollards.push({ group: g, baseOffset: (i - 4) * 0.92 });
  }
  // Coastal Rocks, Striped Lighthouse & Rotating Beacon
  const lhGroup = new THREE.Group();
  lhGroup.position.set(-2.05, -0.14, -2.55);
  envGroup.add(lhGroup);
  [[-0.25, 0.12, 0.15, 0.42], [0.22, 0.08, -0.1, 0.34], [0, 0.18, 0, 0.48]].forEach(([rx, ry, rz, rs]) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rs, 0), mats.rock);
    rock.position.set(rx, ry, rz);
    rock.scale.set(1.25, 0.68, 1.1);
    rock.castShadow = true;
    rock.receiveShadow = true;
    lhGroup.add(rock);
  });
  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.42, 16), mats.seawall);
  lhBase.position.y = 0.48;
  lhBase.castShadow = true;
  const lhStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.16, 0.32, 16), mats.scarfRed);
  lhStripe.position.y = 0.85;
  lhStripe.castShadow = true;
  const lhTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.22, 16), mats.seawall);
  lhTop.position.y = 1.12;
  const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.16, 12), new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#f59e0b', emissiveIntensity: 1.4 }));
  lhLantern.position.y = 1.31;
  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 16), mats.scarfRed);
  lhRoof.position.y = 1.47;
  lhGroup.add(lhBase, lhStripe, lhTop, lhLantern, lhRoof);

  const beaconPivot = new THREE.Group();
  beaconPivot.position.y = 1.31;
  const beamGeo = new THREE.ConeGeometry(0.36, 1.9, 20, 1, true);
  beamGeo.translate(0, -0.95, 0);
  beamGeo.rotateZ(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  const beaconBeam = new THREE.Mesh(beamGeo, beamMat);
  beaconPivot.add(beaconBeam);
  lhGroup.add(beaconPivot);

  // Bobbing 3D Sailboat
  const boatGroup = new THREE.Group();
  boatGroup.position.set(1.65, -0.12, -2.35);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.56, 12), mats.leather);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(0.45, 1, 0.65);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.72, 8), mats.woodDeck);
  mast.position.y = 0.36;
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.lineTo(0, 0.58); sailShape.quadraticCurveTo(0.18, 0.24, 0.28, 0.02); sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), mats.scarfCream);
  sail.position.set(0.01, 0.08, 0);
  boatGroup.add(hull, mast, sail);
  envGroup.add(boatGroup);

  // 3 Circling 3D Seagulls
  const gulls = [];
  for (let i = 0; i < 3; i++) {
    const gull = new THREE.Group();
    const gBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.10, 6, 8), mats.plumage);
    gBody.rotation.z = Math.PI / 2;
    const wGeo = new THREE.BoxGeometry(0.06, 0.008, 0.18);
    wGeo.translate(0, 0, 0.09);
    const wL = new THREE.Mesh(wGeo, mats.plumage);
    const wR = wL.clone();
    wR.rotation.y = Math.PI;
    gull.add(gBody, wL, wR);
    scene.add(gull);
    gulls.push({ group: gull, wL, wR, angle: i * 2.1 + 0.8, radius: 2.6 + i * 0.55, height: 4.15 + i * 0.32, speed: 0.42 + i * 0.08 });
  }

  // 2. 3D VINTAGE TEAL BICYCLE
  const bikeGroup = new THREE.Group();
  scene.add(bikeGroup);

  const R_WHEEL = 0.68; // Outer tire touches y = 0 when hub is at y = 0.68
  function createWheel3D() {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.618, 0.062, 20, 64), mats.tire);
    tire.castShadow = true;
    const wwL = new THREE.Mesh(new THREE.TorusGeometry(0.575, 0.024, 12, 56), mats.whitewall);
    wwL.position.z = 0.036;
    const wwR = wwL.clone();
    wwR.position.z = -0.036;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.545, 0.026, 14, 56), mats.chrome);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.13, 16), mats.chrome);
    hub.rotation.x = Math.PI / 2;
    wg.add(tire, wwL, wwR, rim, hub);

    const pHub = new THREE.Vector3(), pRim = new THREE.Vector3();
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const side = i % 2 === 0 ? 0.052 : -0.052;
      pHub.set(Math.cos(ang - 0.18) * 0.036, Math.sin(ang - 0.18) * 0.036, side);
      pRim.set(Math.cos(ang) * 0.54, Math.sin(ang) * 0.54, 0);
      wg.add(makeSegment(pHub, pRim, 0.0055, 0.0055, mats.chrome, 6));
    }
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 8), mats.brass);
    valve.position.set(0, 0.50, 0);
    const vCap = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), mats.billHook);
    vCap.position.set(0, 0.465, 0);
    wg.add(valve, vCap);
    return wg;
  }

  const rearWheel = createWheel3D();
  rearWheel.position.set(-1.12, R_WHEEL, 0);
  const frontWheel = createWheel3D();
  frontWheel.position.set(1.12, R_WHEEL, 0);
  bikeGroup.add(rearWheel, frontWheel);
  // Fenders, Diamond Frame, Dual Stays & Curved Dual Fork
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const BB = v3(-0.16, 0.66, 0);
  const SEAT_CL = v3(-0.48, 1.68, 0);
  const SADDLE_MT = v3(-0.56, 1.93, 0);
  const HEAD_BOT = v3(0.78, 1.56, 0);
  const HEAD_TOP = v3(0.68, 1.88, 0);

  // Painted Teal Fenders (Partial Torus Arcs)
  const rearFender = new THREE.Mesh(new THREE.TorusGeometry(0.725, 0.036, 12, 40, Math.PI * 0.92), mats.frameTeal);
  rearFender.position.set(-1.12, R_WHEEL, 0);
  rearFender.rotation.z = Math.PI * 0.10;
  rearFender.scale.set(1, 1, 1.9);
  const frontFender = new THREE.Mesh(new THREE.TorusGeometry(0.725, 0.036, 12, 36, Math.PI * 0.78), mats.frameTeal);
  frontFender.position.set(1.12, R_WHEEL, 0);
  frontFender.rotation.z = Math.PI * 0.24;
  frontFender.scale.set(1, 1, 1.9);
  bikeGroup.add(rearFender, frontFender);

  // Main Diamond Frame Tubes
  const bbShell = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.17, 20), mats.frameTeal);
  bbShell.rotation.x = Math.PI / 2;
  bbShell.position.copy(BB);
  bikeGroup.add(
    bbShell,
    makeSegment(BB, SEAT_CL, 0.038, 0.036, mats.frameTeal),
    makeSegment(BB, v3(0.75, 1.60, 0), 0.042, 0.040, mats.frameTeal),
    makeSegment(v3(-0.46, 1.64, 0), v3(0.70, 1.82, 0), 0.035, 0.035, mats.frameTeal),
    makeSegment(v3(0.80, 1.50, 0), v3(0.66, 1.93, 0), 0.046, 0.046, mats.frameTeal),
    makeSegment(SEAT_CL, SADDLE_MT, 0.026, 0.026, mats.chrome),
    makeSegment(HEAD_TOP, v3(0.62, 2.13, 0), 0.026, 0.026, mats.chrome),
    makeSegment(v3(0.62, 2.13, 0), v3(0.73, 2.15, 0), 0.026, 0.026, mats.chrome)
  );

  // Dual-Sided Rear Stays, Fender Stays, Dual Curved Front Fork & Swept Cruiser Bars
  [-1, 1].forEach((s) => {
    bikeGroup.add(
      makeSegment(v3(-0.16, 0.66, 0.066 * s), v3(-1.12, R_WHEEL, 0.082 * s), 0.024, 0.018, mats.frameTeal),
      makeSegment(v3(-0.47, 1.64, 0.036 * s), v3(-1.12, R_WHEEL, 0.082 * s), 0.022, 0.017, mats.frameTeal),
      makeSegment(v3(-1.12, R_WHEEL, 0.082 * s), v3(-1.82, 0.78, 0.04 * s), 0.008, 0.008, mats.chrome, 8),
      makeSegment(v3(1.12, R_WHEEL, 0.082 * s), v3(0.45, 0.88, 0.04 * s), 0.008, 0.008, mats.chrome, 8)
    );
    const forkCurve = new THREE.CatmullRomCurve3([
      v3(0.79, 1.51, 0.02 * s), v3(0.84, 1.40, 0.082 * s),
      v3(0.96, 1.04, 0.086 * s), v3(1.12, R_WHEEL, 0.082 * s)
    ]);
    const forkMesh = new THREE.Mesh(new THREE.TubeGeometry(forkCurve, 20, 0.024, 12, false), mats.frameTeal);
    forkMesh.castShadow = true;
    bikeGroup.add(forkMesh);

    const barCurve = new THREE.CatmullRomCurve3([
      v3(0.73, 2.15, 0), v3(0.71, 2.18, 0.19 * s),
      v3(0.57, 2.19, 0.36 * s), v3(0.38, 2.165, 0.405 * s)
    ]);
    const barMesh = new THREE.Mesh(new THREE.TubeGeometry(barCurve, 20, 0.021, 12, false), mats.chrome);
    barMesh.castShadow = true;
    bikeGroup.add(barMesh);
    bikeGroup.add(makeSegment(v3(0.55, 2.186, 0.372 * s), v3(0.37, 2.164, 0.406 * s), 0.030, 0.030, mats.leather, 14));

    const nutR = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 12), mats.chrome);
    nutR.rotation.x = Math.PI / 2; nutR.position.set(-1.12, R_WHEEL, 0.095 * s);
    const nutF = nutR.clone(); nutF.position.set(1.12, R_WHEEL, 0.095 * s);
    bikeGroup.add(nutR, nutF);
  });

  // Brass Bell & Wicker Front Basket with 2 Wiggling 3D Fish
  const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), mats.brass);
  bellDome.scale.set(1, 0.68, 1);
  bellDome.position.set(0.66, 2.23, 0.21);
  bikeGroup.add(bellDome);

  const basketGroup = new THREE.Group();
  basketGroup.position.set(0.96, 1.80, 0);
  const basketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 18), mats.wicker);
  basketBody.scale.set(0.85, 1, 1.25);
  basketBody.castShadow = true;
  const basketRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 28), mats.wicker);
  basketRim.rotation.x = Math.PI / 2;
  basketRim.position.y = 0.17;
  basketRim.scale.set(0.85, 1.25, 1);
  basketGroup.add(basketBody, basketRim);
  bikeGroup.add(basketGroup, makeSegment(v3(0.82, 1.44, 0), v3(0.95, 1.63, 0), 0.012, 0.012, mats.chrome, 8));

  const basketFish = [];
  [-0.08, 0.09].forEach((fz, idx) => {
    const fg = new THREE.Group();
    fg.position.set(0.02, 0.18, fz);
    fg.rotation.z = idx === 0 ? -0.35 : 0.28;
    const fBody = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.22, 12), mats.fishSilver);
    fBody.scale.set(0.65, 1, 1);
    const fTail = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.09, 4), mats.fishSilver);
    fTail.position.y = 0.13;
    fTail.rotation.x = Math.PI;
    fTail.scale.set(0.25, 1, 1.1);
    fg.add(fBody, fTail);
    basketGroup.add(fg);
    basketFish.push(fg);
  });
  // 3D Drivetrain: Spinning Chainring, Rear Cog & 36 Marching 3D Roller Chain Links
  const Z_CHAIN = 0.102;
  const chainringGroup = new THREE.Group();
  chainringGroup.position.set(BB.x, BB.y, Z_CHAIN);
  chainringGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 10, 40), mats.chrome));
  chainringGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.018, 16).rotateX(Math.PI / 2), mats.chrome));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    chainringGroup.add(makeSegment(v3(0, 0, 0), v3(Math.cos(a) * 0.175, Math.sin(a) * 0.175, 0), 0.012, 0.009, mats.chrome, 8));
  }
  const rearCog = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.018, 18), mats.darkSteel);
  rearCog.rotation.x = Math.PI / 2;
  rearCog.position.set(-1.12, R_WHEEL, Z_CHAIN);
  bikeGroup.add(chainringGroup, rearCog);

  const chainPts = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.5 - (i / 10) * Math.PI;
    chainPts.push(v3(BB.x + Math.cos(a) * 0.184, BB.y + Math.sin(a) * 0.184, Z_CHAIN));
  }
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 0.5 - (i / 10) * Math.PI;
    chainPts.push(v3(-1.12 + Math.cos(a) * 0.090, R_WHEEL + Math.sin(a) * 0.090, Z_CHAIN));
  }
  const chainCurve = new THREE.CatmullRomCurve3(chainPts, true);
  const chainLinks = [];
  const linkGeo = new THREE.BoxGeometry(0.042, 0.022, 0.024);
  for (let i = 0; i < 36; i++) {
    const lm = new THREE.Mesh(linkGeo, i % 2 === 0 ? mats.darkSteel : mats.chrome);
    bikeGroup.add(lm);
    chainLinks.push(lm);
  }

  // Vintage Honey-Leather Saddle with Coil Springs & Brass Rivets
  const saddleGroup = new THREE.Group();
  saddleGroup.position.set(-0.56, 1.97, 0);
  const sShape = new THREE.Shape();
  sShape.moveTo(-0.22, -0.15);
  sShape.bezierCurveTo(-0.24, 0.15, -0.24, 0.15, -0.22, 0.15);
  sShape.bezierCurveTo(-0.08, 0.16, 0.08, 0.06, 0.24, 0.045);
  sShape.bezierCurveTo(0.27, 0.02, 0.27, -0.02, 0.24, -0.045);
  sShape.bezierCurveTo(0.08, -0.06, -0.08, -0.16, -0.22, -0.15);
  const sGeo = new THREE.ExtrudeGeometry(sShape, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, curveSegments: 24 });
  sGeo.rotateX(Math.PI / 2);
  const saddlePad = new THREE.Mesh(sGeo, mats.leather);
  saddlePad.position.y = 0.03;
  saddlePad.castShadow = true;
  saddleGroup.add(saddlePad);
  [-0.09, 0.09].forEach((sz) => {
    const spr = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.07, 10), mats.chrome);
    spr.position.set(-0.16, -0.04, sz);
    const riv = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mats.brass);
    riv.position.set(-0.20, 0.035, sz);
    saddleGroup.add(spr, riv);
  });
  bikeGroup.add(saddleGroup);

  // Dual 3D Cranks & Level Pedals (Right side s=+1, Left side s=-1)
  const R_CRANK = 0.29;
  const pedals = [-1, 1].map((s) => {
    const crankArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 1, 12), mats.chrome);
    crankArm.castShadow = true;
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.12, 10), mats.chrome);
    spindle.rotation.x = Math.PI / 2;
    const platGroup = new THREE.Group();
    const platBody = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.034, 0.115), mats.darkSteel);
    platBody.castShadow = true;
    const reflF = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.075), mats.brass);
    reflF.position.x = 0.092;
    const reflB = reflF.clone(); reflB.position.x = -0.092;
    platGroup.add(platBody, reflF, reflB);
    bikeGroup.add(crankArm, spindle, platGroup);
    return { side: s, crankArm, spindle, platGroup, pinPos: v3(0, 0, 0), footTarget: v3(0, 0, 0) };
  });
  // 3. 3D SCULPTED PELICAN (Torso, Tapered S-Neck, Scarf, Head, 3D Beak & Parametric Gular Pouch)
  const pelicanRoot = new THREE.Group();
  scene.add(pelicanRoot);

  // Plump Sculpted Aquatic Bird Torso (Smooth Pole-Free Teardrop Ovoid)
  const torsoGeo = new THREE.SphereGeometry(0.36, 32, 24);
  const tPos = torsoGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    let tx = tPos.getX(i), ty = tPos.getY(i), tz = tPos.getZ(i);
    const taper = tx < 0 ? (1.0 + 0.35 * (tx / 0.36)) : (1.0 - 0.08 * (tx / 0.36));
    tx *= (tx < 0 ? 1.38 : 1.16);
    ty *= 0.90 * Math.max(0.45, taper);
    tz *= 0.84 * Math.max(0.42, taper);
    tPos.setXYZ(i, tx, ty, tz);
  }
  torsoGeo.computeVertexNormals();
  const torsoMesh = new THREE.Mesh(torsoGeo, mats.plumage);
  torsoMesh.position.set(-0.32, 2.24, 0);
  torsoMesh.rotation.z = 0.14;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  pelicanRoot.add(torsoMesh);

  // Golden Breeding Breast Wash
  const breastPatch = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), mats.crownGold);
  breastPatch.scale.set(0.72, 0.84, 0.86);
  breastPatch.position.set(-0.07, 2.28, 0);
  pelicanRoot.add(breastPatch);

  // Fanned 3D Tail Feathers
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.76, 2.27, 0);
  for (let i = -2; i <= 2; i++) {
    const fBlade = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.34, 8), Math.abs(i) === 2 ? mats.wingTip : mats.plumage);
    fBlade.scale.set(0.26, 1, 1);
    fBlade.rotation.z = Math.PI * 0.42 + Math.abs(i) * 0.03;
    fBlade.rotation.y = i * 0.17;
    fBlade.position.set(-0.12, 0.04, i * 0.045);
    fBlade.castShadow = true;
    tailGroup.add(fBlade);
  }
  pelicanRoot.add(tailGroup);

  // Tapered Organic S-Curved 3D Neck
  const neckCurve = new THREE.CatmullRomCurve3([
    v3(-0.06, 2.34, 0), v3(-0.05, 2.58, 0), v3(-0.10, 2.82, 0), v3(0.08, 3.05, 0)
  ]);
  const neckGeo = new THREE.TubeGeometry(neckCurve, 28, 1.0, 18, false);
  const nPos = neckGeo.attributes.position;
  const cPt = new THREE.Vector3();
  for (let i = 0; i < nPos.count; i++) {
    const u = Math.min(1, Math.floor(i / 19) / 28);
    neckCurve.getPointAt(u, cPt);
    const rad = 0.165 * (1 - u) + 0.102 * u;
    nPos.setXYZ(i, cPt.x + (nPos.getX(i) - cPt.x) * rad, cPt.y + (nPos.getY(i) - cPt.y) * rad, cPt.z + (nPos.getZ(i) - cPt.z) * rad);
  }
  neckGeo.computeVertexNormals();
  const neckMesh = new THREE.Mesh(neckGeo, mats.plumage);
  neckMesh.castShadow = true;
  pelicanRoot.add(neckMesh);

  // Coastal Red-and-Cream Striped Scarf (Collar + Waving 3D Ribbon)
  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.038, 12, 24), mats.scarfRed);
  scarfCollar.rotation.x = Math.PI * 0.52;
  scarfCollar.rotation.y = -0.15;
  scarfCollar.position.set(-0.05, 2.53, 0);
  pelicanRoot.add(scarfCollar);

  const scarfGeo = new THREE.PlaneGeometry(0.68, 0.115, 20, 2);
  scarfGeo.translate(-0.34, 0, 0);
  // Vertex colors for crisp red & cream seaside stripes
  const sCount = scarfGeo.attributes.position.count;
  const sCols = new Float32Array(sCount * 3);
  const cRed = new THREE.Color('#de493c'), cCream = new THREE.Color('#fff8e7');
  for (let i = 0; i < sCount; i++) {
    const sx = Math.abs(scarfGeo.attributes.position.getX(i));
    const stripe = Math.floor(sx / 0.11) % 2 === 1 ? cCream : cRed;
    sCols[i * 3] = stripe.r; sCols[i * 3 + 1] = stripe.g; sCols[i * 3 + 2] = stripe.b;
  }
  scarfGeo.setAttribute('color', new THREE.BufferAttribute(sCols, 3));
  const scarfRibbonMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide });
  const scarfRibbon = new THREE.Mesh(scarfGeo, scarfRibbonMat);
  scarfRibbon.position.set(-0.15, 2.55, 0.05);
  scarfRibbon.rotation.y = 0.12;
  scarfRibbon.castShadow = true;
  pelicanRoot.add(scarfRibbon);
  // Pelican Head, Crest, Bilateral Blinking Eyes, 3D Upper Bill & Elastic 3D Gular Pouch
  const headGroup = new THREE.Group();
  headGroup.position.set(0.09, 3.06, 0);
  pelicanRoot.add(headGroup);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.155, 22, 18), mats.plumage);
  cranium.scale.set(1.15, 0.96, 0.88);
  cranium.castShadow = true;
  const crownCap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), mats.crownGold);
  crownCap.scale.set(1.08, 0.65, 0.82);
  crownCap.position.set(0.02, 0.055, 0);
  headGroup.add(cranium, crownCap);

  // Occipital Crest Feathers
  [[0, 0.11, 0.35], [-0.03, 0.07, 0.52], [0.03, 0.07, 0.52]].forEach(([cz, cy, rotZ]) => {
    const cf = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.19, 8), mats.plumage);
    cf.position.set(-0.17, cy, cz);
    cf.rotation.z = Math.PI * 0.5 + rotZ;
    headGroup.add(cf);
  });

  // Bilateral Expressive 3D Eyes & Blinking Eyelids
  const eyelids = [];
  [-1, 1].forEach((s) => {
    const eyeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.016, 16), mats.crownGold);
    eyeRing.rotation.x = Math.PI / 2;
    eyeRing.position.set(0.065, 0.035, 0.122 * s);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 12), mats.eyeDark);
    pupil.position.set(0.072, 0.035, 0.130 * s);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), mats.plumage);
    glint.position.set(0.084, 0.047, 0.152 * s);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.plumage);
    lid.position.copy(pupil.position);
    lid.scale.set(1, 0.05, 1);
    headGroup.add(eyeRing, pupil, glint, lid);
    eyelids.push(lid);
  });

  // Long Sculpted 3D Upper Bill (0.92m, Wide & Vertically Flattened) & Coral Hook Nail
  const billMain = makeSegment(v3(0.11, 0.020, 0), v3(1.01, -0.082, 0), 0.095, 0.032, mats.upperBill, 18);
  billMain.geometry.scale(0.40, 1, 1.16);
  const billHookCap = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mats.billHook);
  billHookCap.position.set(1.012, -0.084, 0);
  billHookCap.scale.set(1.1, 0.75, 0.85);
  const billHook = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.072, 12), mats.billHook);
  billHook.position.set(1.018, -0.116, 0);
  billHook.rotation.z = Math.PI * 0.94;
  billHook.scale.set(1, 1, 0.78);
  headGroup.add(billMain, billHookCap, billHook);

  // Parametric 3D Volumetric Golden-Amber Gular Throat Pouch (18 x 14 Grid)
  const U_SEG = 18, V_SEG = 14;
  const pouchGeo = new THREE.PlaneGeometry(1, 1, U_SEG, V_SEG);
  function updatePouchGeometry(jiggle) {
    const pa = pouchGeo.attributes.position;
    let idx = 0;
    for (let iv = 0; iv <= V_SEG; iv++) {
      const v = (iv / V_SEG) * 2 - 1; // -1 left mandible rim .. +1 right mandible rim
      const crossSag = Math.cos(v * Math.PI * 0.5);
      for (let iu = 0; iu <= U_SEG; iu++) {
        const u = iu / U_SEG;
        const x = 0.11 + u * 0.90;
        const yRim = 0.005 - u * 0.092;
        const halfW = (0.092 * Math.sin(Math.pow(u, 0.65) * Math.PI) + 0.018 * (1 - u));
        const z = v * halfW * (1 + 0.22 * crossSag);
        const lenSag = Math.sin(Math.pow(u, 0.70) * Math.PI);
        const y = yRim - (0.31 + jiggle) * lenSag * Math.pow(Math.max(0, crossSag), 0.82);
        pa.setXYZ(idx++, x, y, z);
      }
    }
    pa.needsUpdate = true;
    pouchGeo.computeVertexNormals();
  }
  updatePouchGeometry(0);
  const pouchMesh = new THREE.Mesh(pouchGeo, mats.pouch);
  pouchMesh.castShadow = true;
  headGroup.add(pouchMesh);

  // 4. ARTICULATED 3D DUAL WINGS (Rounded Feathered Ellipsoids Locked on Grips)
  const wings = [-1, 1].map((s) => {
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), mats.plumage);
    upper.geometry.scale(0.24, 1.18, 0.11);
    upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), mats.plumageGrey);
    fore.geometry.scale(0.19, 1.16, 0.095);
    fore.castShadow = true;
    // Charcoal-Slate Primary Wingtips Curling Over Leather Grip at (0.46, 2.175, 0.39*s)
    const handGroup = new THREE.Group();
    handGroup.position.set(0.46, 2.18, 0.39 * s);
    for (let k = 0; k < 3; k++) {
      const pf = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.22, 10), mats.wingTip);
      pf.scale.set(0.48, 1, 0.85);
      pf.rotation.z = -Math.PI * 0.46 + k * 0.08;
      pf.position.set(-0.04 + k * 0.02, 0.01 - k * 0.012, 0.012 * s);
      handGroup.add(pf);
    }
    scene.add(upper, fore, handGroup);
    return { side: s, upper, fore, handGroup, shoulder: v3(0, 0, 0), elbow: v3(0, 0, 0), wrist: v3(0.39, 2.18, 0.39 * s) };
  });
  // 3D Two-Bone IK Legs, Feathered Thigh Tufts & Broad 3-Toed Webbed Feet
  const legs = [-1, 1].map((s) => {
    const thighTuft = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 12), mats.plumage);
    thighTuft.scale.set(1.05, 1.25, 0.92);
    thighTuft.castShadow = true;
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, 1, 14), mats.legOrange);
    thigh.castShadow = true;
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), mats.legOrange);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 1, 14), mats.legOrange);
    shin.castShadow = true;

    // Sculpted 3D Totipalmate Webbed Foot
    const footGroup = new THREE.Group();
    const fShape = new THREE.Shape();
    fShape.moveTo(-0.06, -0.028);
    fShape.lineTo(0.15, -0.075);
    fShape.quadraticCurveTo(0.18, -0.03, 0.165, 0.0);
    fShape.quadraticCurveTo(0.18, 0.03, 0.15, 0.075);
    fShape.lineTo(-0.06, 0.028);
    fShape.closePath();
    const webGeo = new THREE.ExtrudeGeometry(fShape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, curveSegments: 12 });
    webGeo.rotateX(Math.PI / 2);
    const webMesh = new THREE.Mesh(webGeo, mats.legOrange);
    webMesh.position.y = 0.022;
    webMesh.castShadow = true;
    footGroup.add(webMesh);
    [-0.28, 0, 0.28].forEach((ang) => {
      const toe = makeSegment(v3(-0.03, 0.024, 0), v3(0.15 * Math.cos(ang), 0.022, 0.15 * Math.sin(ang)), 0.012, 0.007, mats.legOrange, 8);
      footGroup.add(toe);
    });
    const ankleJoint = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), mats.legOrange);
    ankleJoint.position.set(-0.03, 0.035, 0);
    footGroup.add(ankleJoint);

    scene.add(thighTuft, thigh, knee, shin, footGroup);
    return {
      side: s, thighTuft, thigh, knee, shin, footGroup,
      hip: v3(0, 0, 0), kneePos: v3(0, 0, 0), ankle: v3(0, 0, 0),
      pole: v3(1, 0.16, 0.10 * s).normalize(),
      wingPole: v3(-0.55, -0.68, 0.45 * s).normalize()
    };
  });

  // HUD State, Reduced-Motion Support & Smooth Camera Presets
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playing = !reducedMotion;
  let speedMult = 1.0;
  let isSunset = false;
  let simTime = 0.35; // Initial scenic crank angle when paused

  const btnPlay = document.getElementById('btn-play');
  const btnSpeed = document.getElementById('btn-speed');
  const btnMood = document.getElementById('btn-mood');
  const btnShot = document.getElementById('btn-shot');

  function syncPlayUI() {
    btnPlay.textContent = playing ? '暂停' : '播放';
    btnPlay.setAttribute('aria-pressed', String(!playing));
  }
  syncPlayUI();

  btnPlay.addEventListener('click', () => { playing = !playing; syncPlayUI(); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); playing = !playing; syncPlayUI(); }
  });

  const speeds = [[1.0, '1.0× 巡航'], [1.75, '1.75× 冲刺'], [0.45, '0.45× 慢镜']];
  let speedIdx = 0;
  btnSpeed.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    speedMult = speeds[speedIdx][0];
    btnSpeed.textContent = speeds[speedIdx][1];
  });

  btnMood.addEventListener('click', () => {
    isSunset = !isSunset;
    btnMood.textContent = isSunset ? '晴昼海岸' : '落日金辉';
    skyUniforms.uTopColor.value.set(isSunset ? '#2c3e66' : '#6db8e8');
    skyUniforms.uMidColor.value.set(isSunset ? '#d97854' : '#cbeaf8');
    skyUniforms.uBotColor.value.set(isSunset ? '#ffd180' : '#fff2d6');
    sunLight.color.set(isSunset ? '#ffae52' : '#fff8e6');
    sunLight.intensity = isSunset ? 2.75 : 2.35;
    sunLight.position.set(isSunset ? -6.5 : -4.5, isSunset ? 3.4 : 7.8, 4.2);
    hemiLight.color.set(isSunset ? '#ffb88c' : '#e8f6ff');
    beamMat.opacity = isSunset ? 0.38 : 0.14;
  });
  const camPresets = {
    hero:  { pos: v3(3.35, 2.75, 6.05), target: v3(0.0, 1.55, -0.15) },
    side:  { pos: v3(-0.05, 1.75, 5.85), target: v3(-0.05, 1.55, 0) },
    front: { pos: v3(4.85, 2.25, 1.85), target: v3(0.15, 1.75, 0) },
    low:   { pos: v3(2.55, 0.92, 4.15), target: v3(0.10, 1.72, 0) }
  };
  let activeTransition = null;
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      camBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = camPresets[btn.dataset.cam];
      if (preset) {
        activeTransition = {
          fromPos: camera.position.clone(), toPos: preset.pos.clone(),
          fromTgt: controls.target.clone(), toTgt: preset.target.clone(),
          progress: 0
        };
      }
    });
  });
  controls.addEventListener('start', () => { activeTransition = null; });

  btnShot.addEventListener('click', () => {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'antigravity-gemini-4-carbon-3d-pelican-bicycle.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Scratch vectors for per-frame loop
  const _ptA = v3(0, 0, 0), _ptB = v3(0, 0, 0), _tan = v3(0, 0, 0);
  const SPAN_PLANK = PLANK_COUNT * PLANK_STEP;
  const SPAN_BOLLARD = 9 * 0.92;
  const scarfBasePos = scarfGeo.attributes.position.array.slice();

  function updateScene(t) {
    const omega = 3.9;
    const wheelAng = t * omega;
    const linearDist = wheelAng * R_WHEEL;

    // 1. Wheels & Drivetrain
    rearWheel.rotation.z = -wheelAng;
    frontWheel.rotation.z = -wheelAng;
    chainringGroup.rotation.z = -wheelAng;
    rearCog.rotation.z = -wheelAng * 2.0;
    for (let i = 0; i < chainLinks.length; i++) {
      const u = (((i / chainLinks.length) + (wheelAng / (Math.PI * 2)) * 0.85) % 1 + 1) % 1;
      chainCurve.getPointAt(u, _ptA);
      chainCurve.getTangentAt(u, _tan);
      chainLinks[i].position.copy(_ptA);
      chainLinks[i].rotation.z = Math.atan2(_tan.y, _tan.x);
    }

    // 2. Zero-Slip Boardwalk Planks & Bollards Clipped to Circular Island
    const R_CLIP = 4.04;
    for (let i = 0; i < planks.length; i++) {
      const x = ((((planks[i].baseOffset - linearDist) % SPAN_PLANK) + SPAN_PLANK) % SPAN_PLANK) - SPAN_PLANK * 0.5;
      if (Math.abs(x) < R_CLIP) {
        const zMax = Math.sqrt(R_CLIP * R_CLIP - x * x);
        const zMin = wallZ + 0.10;
        if (zMax > zMin + 0.08) {
          planks[i].mesh.visible = true;
          planks[i].mesh.position.set(x, 0.008, (zMin + zMax) * 0.5);
          planks[i].mesh.scale.set(1, 1, zMax - zMin);
          continue;
        }
      }
      planks[i].mesh.visible = false;
    }
    for (let i = 0; i < bollards.length; i++) {
      const x = ((((bollards[i].baseOffset - linearDist * 0.72) % SPAN_BOLLARD) + SPAN_BOLLARD) % SPAN_BOLLARD) - SPAN_BOLLARD * 0.5;
      const edgeFade = Math.max(0, Math.min(1, (wallHalfX - 0.15 - Math.abs(x)) * 2.2));
      bollards[i].group.visible = edgeFade > 0.02;
      bollards[i].group.position.x = x;
      bollards[i].group.scale.setScalar(edgeFade);
    }

    // 3. Ocean Waves, Lighthouse Beacon, Sailboat & Flapping Seagulls
    const wPos = waterGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const wx = wPos.getX(i), wz = wPos.getZ(i);
      wPos.setY(i, waterBaseY[i] + Math.sin(wx * 2.2 + t * 2.4) * 0.028 + Math.cos(wz * 3.1 - t * 1.9) * 0.022);
    }
    wPos.needsUpdate = true;
    beaconPivot.rotation.y = t * 0.85;
    boatGroup.position.y = -0.12 + Math.sin(t * 1.8) * 0.025;
    boatGroup.rotation.z = Math.sin(t * 1.5) * 0.06;
    gulls.forEach((g, idx) => {
      const ga = g.angle + t * g.speed;
      g.group.position.set(Math.cos(ga) * g.radius, g.height + Math.sin(t * 1.6 + idx) * 0.08, -2.2 + Math.sin(ga) * g.radius * 0.45);
      g.group.rotation.y = -ga + Math.PI * 0.5;
      const flap = Math.sin(t * 6.5 + idx * 1.7) * 0.52;
      g.wL.rotation.x = flap;
      g.wR.rotation.x = flap;
    });

    // 4. Pelican Cadence, Pouch Jiggle, Scarf Wave, Eye Blink, Cranks & 3D Two-Bone IK
    const bobY = -0.032 * Math.cos(wheelAng * 2);
    pelicanRoot.position.y = bobY;
    pelicanRoot.rotation.z = 0.018 * Math.sin(wheelAng * 2);
    saddleGroup.position.y = 1.97 + bobY * 0.45;
    headGroup.rotation.z = 0.032 * Math.sin(wheelAng * 2 - 0.45);
    tailGroup.rotation.z = 0.055 * Math.sin(wheelAng * 2 - 0.6);
    updatePouchGeometry(0.042 * Math.sin(wheelAng * 2 - 0.95));

    // Scarf vertex wave
    const sp = scarfGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const bx = scarfBasePos[i * 3], by = scarfBasePos[i * 3 + 1];
      const dist = Math.abs(bx);
      sp.setY(i, by + Math.sin(dist * 9.5 - t * 11.0) * 0.048 * (dist / 0.68));
      sp.setZ(i, Math.cos(dist * 7.5 - t * 9.5) * 0.055 * (dist / 0.68));
    }
    sp.needsUpdate = true;
    scarfGeo.computeVertexNormals();

    // Periodic Eye Blink & Basket Fish Wiggle
    const blinkCycle = (t % 3.4);
    const lidScale = (blinkCycle > 1.55 && blinkCycle < 1.72) ? Math.sin(((blinkCycle - 1.55) / 0.17) * Math.PI) : 0.04;
    eyelids.forEach((lid) => { lid.scale.y = Math.max(0.04, lidScale); });
    basketFish.forEach((fg, idx) => { fg.rotation.x = Math.sin(t * 9.5 + idx * 2.1) * 0.18; });
    bellDome.rotation.z = Math.sin(t * 18) * ( (t % 2.8 < 0.35) ? 0.12 : 0 );

    // Dual Cranks, Counter-Rotated Level Pedals, Leg 2-Bone IK & Wing 2-Bone IK
    pedals.forEach((p, idx) => {
      const s = p.side;
      const phi = wheelAng + (s === 1 ? 0 : Math.PI);
      const px = BB.x + R_CRANK * Math.cos(phi);
      const py = BB.y - R_CRANK * Math.sin(phi);
      const cz = 0.142 * s, pz = 0.228 * s;
      _ptA.set(BB.x, BB.y, cz);
      _ptB.set(px, py, cz);
      orientBone(p.crankArm, _ptA, _ptB);
      p.spindle.position.set(px, py, 0.185 * s);
      p.platGroup.position.set(px, py, pz);
      const footTilt = 0.09 * Math.sin(phi);
      p.platGroup.rotation.z = footTilt;

      const leg = legs[idx];
      leg.hip.set(-0.33, 2.06 + bobY, 0.175 * s);
      leg.thighTuft.position.set(-0.34, 2.09 + bobY, 0.165 * s);
      leg.footGroup.position.set(px, py + 0.015, pz);
      leg.footGroup.rotation.z = footTilt;
      leg.ankle.set(px - 0.03, py + 0.048, pz);
      solveTwoBoneIK3D(leg.hip, leg.ankle, 0.86, 0.88, leg.pole, leg.kneePos);
      orientBone(leg.thigh, leg.hip, leg.kneePos);
      leg.knee.position.copy(leg.kneePos);
      orientBone(leg.shin, leg.kneePos, leg.ankle);

      const wing = wings[idx];
      wing.shoulder.set(-0.11, 2.38 + bobY, 0.21 * s);
      solveTwoBoneIK3D(wing.shoulder, wing.wrist, 0.36, 0.38, leg.wingPole, wing.elbow);
      orientBone(wing.upper, wing.shoulder, wing.elbow);
      orientBone(wing.fore, wing.elbow, wing.wrist);
    });
  }

  updateScene(simTime);
  loadingEl.classList.add('hidden');

  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (playing) {
      simTime += dt * speedMult;
      updateScene(simTime);
    }
    if (activeTransition) {
      activeTransition.progress = Math.min(1, activeTransition.progress + dt * 2.2);
      const k = 1 - Math.pow(1 - activeTransition.progress, 3);
      camera.position.lerpVectors(activeTransition.fromPos, activeTransition.toPos, k);
      controls.target.lerpVectors(activeTransition.fromTgt, activeTransition.toTgt, k);
      if (activeTransition.progress >= 1) activeTransition = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
