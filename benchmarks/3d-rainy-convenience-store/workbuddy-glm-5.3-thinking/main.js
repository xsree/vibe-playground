/* ============================================================
   雨夜便利店 · 微缩街角模型
   三渲二（Toon Shading）+ 体积描边 + 雨夜动效
   纯净无 UI，可自由拖拽 / 旋转 / 缩放的三维微缩模型
   ============================================================ */
(function () {
  'use strict';
  if (!window.THREE) return;

  /* ============================================================
     0. 调色板
     ============================================================ */
  var PAL = {
    nightTop: 0x070d1f,     // 天顶
    nightHorizon: 0x2b3a63, // 地平线
    wallStore: 0xf2f4f8,    // 便利店墙体
    bandBlue: 0x1d4ed8,     // 品牌深蓝
    cyan: 0x35c4c8,         // 品牌青
    magenta: 0xe3356f,      // 点缀品红
    signWhite: 0xffffff,
    interior: 0xffe6b8,     // 室内暖光
    neonCyan: 0x62e6ff,
    neonYellow: 0xffd166,
    asphalt: 0x2a3142,      // 湿沥青
    sidewalk: 0x6a7590,
    line: 0xd5dce8,         // 道路标线
    steel: 0x9aa3b5,        // 金属
    slate: 0x59647a,        // 路灯杆
    ink: 0x2c3242,          // 深色部件
    outline: 0x131a29       // 描边色
  };

  var animModules = [];     // 每帧回调 (dt, t)

  /* ============================================================
     1. 渲染器 / 场景 / 相机 / 控制
     ============================================================ */
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  document.body.appendChild(renderer.domElement);
  var loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1428, 30, 70);

  var camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(14.5, 10.5, 16.5);

  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 7;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 1.8, -0.4);
  }

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ============================================================
     2. 三渲二工具箱
     ============================================================ */
  var gradientMap = (function () {
    var c = document.createElement('canvas');
    c.width = 3; c.height = 1;
    var ctx = c.getContext('2d');
    var v = [70, 165, 255];
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgb(' + v[i] + ',' + v[i] + ',' + v[i] + ')';
      ctx.fillRect(i, 0, 1, 1);
    }
    var t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    return t;
  })();

  var toonCache = {};
  function TM(color) {                 // 缓存的 Toon 材质（只读共享）
    if (!toonCache[color]) toonCache[color] = toon(color);
    return toonCache[color];
  }
  function toon(color, opts) {          // 新建 Toon 材质
    opts = opts || {};
    var m = new THREE.MeshToonMaterial({
      color: color,
      gradientMap: gradientMap,
      transparent: !!opts.transparent,
      opacity: (opts.opacity != null) ? opts.opacity : 1,
      map: opts.map || null
    });
    return m;
  }
  function glow(color, k) {             // 自发光（灯箱 / 霓虹）
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(k || 1),
      toneMapped: false
    });
  }
  function basic(color, opts) {
    opts = opts || {};
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: !!opts.transparent,
      opacity: (opts.opacity != null) ? opts.opacity : 1,
      map: opts.map || null,
      fog: opts.fog !== false
    });
  }
  function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
  function cyl(rt, rb, h, seg, mat, open) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!open), mat);
  }

  function tex(w, h, drawFn) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    drawFn(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  /* —— 体积描边（BackSide 放大壳）—— */
  var outlineMat = new THREE.MeshBasicMaterial({ color: PAL.outline, side: THREE.BackSide });
  function outline(mesh, t) {
    var o = new THREE.Mesh(mesh.geometry, outlineMat);
    o.userData.isOutline = true;                    // 防止遍历时递归
    o.userData.noOutline = true;
    o.scale.multiplyScalar(1 + (t == null ? 0.03 : t));
    mesh.add(o);
    return o;
  }
  function applyOutlines(root) {
    root.traverse(function (obj) {
      if (!obj.isMesh) return;
      if (obj.userData.noOutline || obj.userData.hasOutline || obj.userData.isOutline) return;
      outline(obj, obj.userData.ot || 0.03);
      obj.userData.hasOutline = true;
    });
  }

  /* ============================================================
     3. 光照 & 天空
     ============================================================ */
  scene.add(new THREE.HemisphereLight(0x3a4d7a, 0x141a2e, 0.5));

  var coolFill = new THREE.DirectionalLight(0x8fb3ff, 0.3);
  coolFill.position.set(-10, 16, -8);
  scene.add(coolFill);

  /* —— 雨夜天空穹顶（渐变 + 远处城市光晕）—— */
  (function sky() {
    var skyTex = tex(64, 256, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#070d1f');
      g.addColorStop(0.62, '#182648');
      g.addColorStop(1, '#33456e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(60, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    dome.userData.noOutline = true;
    scene.add(dome);
  })();

  /* ============================================================
     4. 世界组
     ============================================================ */
  var world = new THREE.Group();
  scene.add(world);

  /* ============================================================
     5. 底座（20x20 完整正方形模型台）
     ============================================================ */
  var wetLayer = null;
  (function buildBase() {
    var ot = { ot: 0.012 };
    // 台体
    var base = box(20, 1.0, 20, TM(0x18213a));
    base.position.y = -0.5;
    base.userData = ot;
    world.add(base);

    // 湿润路面（带水洼光斑）
    var groundMap = tex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#2a3142';
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 30; i++) {
        var x = Math.random() * w, y = Math.random() * h, r = 12 + Math.random() * 30;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(96,130,200,0.4)');
        g.addColorStop(1, 'rgba(96,130,200,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
      for (var j = 0; j < 800; j++) {
        ctx.fillStyle = 'rgba(210,225,255,' + (Math.random() * 0.05) + ')';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
      }
    });
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      toon(0xffffff, { map: groundMap })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.02;
    ground.userData.noOutline = true;      // 无描边，靠贴图
    world.add(ground);

    // 积水反射呼吸层
    wetLayer = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ color: 0x4a6cc0, transparent: true, opacity: 0.08 })
    );
    wetLayer.rotation.x = -Math.PI / 2;
    wetLayer.position.y = 0.013;
    wetLayer.userData.noOutline = true;
    world.add(wetLayer);
  })();

  /* ============================================================
     6. 便利店主体（视觉中心）
     局部坐标原点在建筑中心地面：SW×SH×SD = 8.8×3.5×5.0
     ============================================================ */
  var store = new THREE.Group();
  store.position.set(0, 0, -0.4);
  world.add(store);
  var SW = 8.8, SH = 3.5, SD = 5.0;

  (function buildStore() {
    var i, s;

    /* —— 墙体 —— */
    function wall(w, h, d, x, y, z) {
      var m = box(w, h, d, TM(PAL.wallStore));
      m.position.set(x, y, z);
      m.userData = { ot: 0.022 };
      store.add(m);
      return m;
    }
    wall(SW, SH, 0.18, 0, SH / 2, -SD / 2);            // 北
    wall(0.18, SH, SD, -SW / 2, SH / 2, 0);            // 西
    wall(0.18, SH, SD, SW / 2, SH / 2, 0);             // 东
    wall(SW, 0.8, 0.22, 0, 0.4, SD / 2);              // 南墙裙
    wall(0.66, 3.5, 0.24, -(SW / 2 - 0.33), 1.75, SD / 2);   // 南西门柱
    wall(0.66, 3.5, 0.24, (SW / 2 - 0.33), 1.75, SD / 2);    // 南东门柱
    wall(SW - 1.7, 0.22, 0.2, 0, 3.42, SD / 2);       // 南面上楣梁（填玻璃顶缝）

    /* —— 南面大面积玻璃 —— */
    var glassMat = toon(0xbfe9ff, { transparent: true, opacity: 0.32 });
    var frontGlass = box(SW - 1.9, 2.55, 0.05, glassMat);
    frontGlass.position.set(0, 2.12, SD / 2 - 0.02);
    frontGlass.userData.noOutline = true;
    store.add(frontGlass);
    for (i = -3; i <= 3; i++) {                        // 竖框
      if (i === 0) continue;
      var mul = box(0.07, 2.55, 0.1, TM(0x8794ad));
      mul.position.set(i * 1.13, 2.12, SD / 2);
      mul.userData = { ot: 0.04 };
      store.add(mul);
    }

    /* —— 屋顶 —— */
    var eave = box(SW + 0.7, 0.14, SD + 0.7, TM(PAL.bandBlue));
    eave.position.set(0, SH + 0.07, 0);
    eave.userData = { ot: 0.015 };
    store.add(eave);
    var roof = box(SW + 0.5, 0.28, SD + 0.5, TM(0xd8dee9));
    roof.position.set(0, SH + 0.29, 0);
    roof.userData = { ot: 0.015 };
    store.add(roof);

    /* —— 雨棚 + 灯带 —— */
    var canopy = box(3.5, 0.16, 1.7, TM(0xd8dee9));
    canopy.position.set(0, 3.06, SD / 2 + 0.75);
    canopy.userData = { ot: 0.025 };
    store.add(canopy);
    var canopyLight = box(3.3, 0.05, 1.5, glow(PAL.interior, 1.0));
    canopyLight.position.set(0, 2.97, SD / 2 + 0.75);
    canopyLight.userData.noOutline = true;
    store.add(canopyLight);

    /* —— 屋顶发光招牌 —— */
    var face = tex(512, 224, function (ctx, w, h) {
      ctx.fillStyle = '#12325e'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#35c4c8';
      ctx.fillRect(0, h - 22, w, 7);
      ctx.fillRect(0, 14, w, 7);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 66px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('コンビニ', w / 2, h / 2 + 10);
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText('24 HOURS', w / 2, h - 30);
    });
    var side = glow(PAL.bandBlue, 0.9);
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.2, 0.5),
      [side, side, side, side, new THREE.MeshBasicMaterial({ map: face, toneMapped: false }), side]
    );
    sign.position.set(0, SH + 1.05, -0.15);
    sign.userData.noOutline = true;
    store.add(sign);
    var signFace = sign.material[4];
    animModules.push(function (dt, t) {                 // 招牌轻微闪烁
      var brown = (Math.sin(t * 31.7) * Math.sin(t * 17.3)) > 0.982 ? 0.35 : 1;
      var k = (0.9 + 0.1 * Math.sin(t * 2.2)) * brown;
      signFace.color.setScalar(k);
    });

    /* —— 西墙侧灯箱 —— */
    var sideFace = tex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#12325e'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#62e6ff';
      ctx.beginPath(); ctx.arc(w / 2, h / 2 - 14, 36, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHOP', w / 2, h / 2 + 38);
    });
    var sideSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: sideFace, toneMapped: false })
    );
    sideSign.position.set(-SW / 2 - 0.03, 2.3, -0.6);
    sideSign.rotation.y = -Math.PI / 2;
    sideSign.userData.noOutline = true;
    store.add(sideSign);
    var sideSignLight = new THREE.PointLight(PAL.neonCyan, 0.45, 6);
    sideSignLight.position.set(-SW / 2 - 0.7, 2.3, -0.6);
    store.add(sideSignLight);

    /* —— 侧墙海报栏（西墙南段） —— */
    var posterFace = tex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f4e9d8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e3356f'; ctx.fillRect(0, 0, w, 16);
      ctx.fillStyle = '#12325e';
      ctx.font = 'bold 30px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('今週の特売', w / 2, h / 2 - 4);
      ctx.fillStyle = '#8a5a3a';
      ctx.font = '20px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('お得な情報満載', w / 2, h / 2 + 30);
    });
    var board = box(1.45, 1.0, 0.1, TM(0x8a5a3a));
    board.position.set(-SW / 2 - 0.08, 1.75, 1.7);
    board.rotation.y = -Math.PI / 2;
    board.userData = { ot: 0.04 };
    store.add(board);
    var poster = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      toon(0xffffff, { map: posterFace })
    );
    poster.position.set(-SW / 2 - 0.15, 1.75, 1.7);
    poster.rotation.y = -Math.PI / 2;
    poster.userData.noOutline = true;
    store.add(poster);

    /* —— 自动门（偶尔开合） —— */
    var doorMat = toon(0xcfe9ff, { transparent: true, opacity: 0.48 });
    var doorL = box(0.74, 2.05, 0.05, doorMat);
    var doorR = box(0.74, 2.05, 0.05, doorMat);
    doorL.position.set(-0.39, 1.07, SD / 2 + 0.03);
    doorR.position.set(0.39, 1.07, SD / 2 + 0.03);
    doorL.userData.noOutline = doorR.userData.noOutline = true;
    store.add(doorL, doorR);
    var doorFrame = box(2.0, 0.1, 0.14, TM(0x8794ad));
    doorFrame.position.set(0, 2.62, SD / 2 + 0.03);
    doorFrame.userData = { ot: 0.04 };
    store.add(doorFrame);

    var door = { state: 'closed', timer: 3.5, k: 0 };   // 0=关 1=开
    animModules.push(function (dt) {
      door.timer -= dt;
      if (door.state === 'closed' && door.timer <= 0) { door.state = 'opening'; door.timer = 0; }
      else if (door.state === 'opening') {
        door.k = Math.min(1, door.k + dt / 0.5);
        if (door.k >= 1) { door.state = 'open'; door.timer = 1.6 + Math.random() * 1.2; }
      } else if (door.state === 'open' && door.timer <= 0) { door.state = 'closing'; }
      else if (door.state === 'closing') {
        door.k = Math.max(0, door.k - dt / 0.5);
        if (door.k <= 0) { door.state = 'closed'; door.timer = 5 + Math.random() * 6; }
      }
      var slide = door.k * 0.64;
      doorL.position.x = -0.39 - slide;
      doorR.position.x = 0.39 + slide;
    });

    /* —— 门口地垫 + 台阶 —— */
    var matFace = tex(256, 128, function (ctx, w, h) {
      ctx.fillStyle = '#31425f'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#5f7bb5';
      ctx.font = 'bold 42px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('欢迎光临', w / 2, h / 2 + 14);
    });
    var doormat = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.85), toon(0xffffff, { map: matFace }));
    doormat.rotation.x = -Math.PI / 2;
    doormat.position.set(0, 0.053, SD / 2 + 0.95);
    doormat.userData.noOutline = true;
    store.add(doormat);
    var step = box(2.4, 0.09, 0.55, TM(0xb9c2d6));
    step.position.set(0, 0.05, SD / 2 + 0.38);
    step.userData = { ot: 0.04 };
    store.add(step);

    /* —— 空调外机（东墙外侧） —— */
    var ac = box(1.15, 0.78, 0.55, TM(0xb8c0cf));
    ac.position.set(SW / 2 + 0.68, 2.95, -1.5);
    ac.userData = { ot: 0.045 };
    store.add(ac);
    var acFan = cyl(0.26, 0.26, 0.06, 14, basic(0x39435c, { fog: true }));
    acFan.rotation.z = Math.PI / 2;
    acFan.position.set(SW / 2 + 1.0, 2.95, -1.5);
    acFan.userData.noOutline = true;
    store.add(acFan);
    animModules.push(function (dt) { acFan.rotation.y += dt * 8; });
    var acPipe = cyl(0.05, 0.05, 1.7, 6, TM(0x8a94a8));
    acPipe.position.set(SW / 2 + 0.14, 2.1, -1.5);
    acPipe.userData = { ot: 0.06 };
    store.add(acPipe);

    /* ==================== 室内 ==================== */
    var interior = new THREE.Group();
    store.add(interior);

    // 内地板
    var floorMap = tex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#e9e2d3'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(140,120,90,.4)'; ctx.lineWidth = 2;
      for (var k = 0; k <= 8; k++) {
        ctx.beginPath(); ctx.moveTo(k * w / 8, 0); ctx.lineTo(k * w / 8, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k * h / 8); ctx.lineTo(w, k * h / 8); ctx.stroke();
      }
    });
    var ifloor = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.66), toon(0xffffff, { map: floorMap }));
    ifloor.rotation.x = -Math.PI / 2;
    ifloor.position.y = 0.06;
    ifloor.userData.noOutline = true;
    interior.add(ifloor);

    // 天花板
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.66), toon(0xfdf6ea));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 3.28;
    ceil.userData.noOutline = true;
    interior.add(ceil);

    // 室内暖光
    interior.add((function () {
      var l1 = new THREE.PointLight(0xffd9a0, 1.3, 9, 1.7); l1.position.set(-2.2, 2.9, 0.4);
      var l2 = new THREE.PointLight(0xffe6c0, 1.05, 9, 1.7); l2.position.set(2.6, 2.9, -1.1);
      return [l1, l2];
    })());
    [-2.2, 2.6].forEach(function (x, i) {
      var lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), glow(0xfff4dd, 1));
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(x, 3.26, i ? -1.1 : 0.4);
      lamp.userData.noOutline = true;
      interior.add(lamp);
    });

    /* —— 货架 ×3（沿北墙，层板 + 杂货小盒） —— */
    var skuColors = [0xe3356f, 0x35c4c8, 0xffd166, 0x6fbf73, 0x1d4ed8, 0xff8c42];
    function shelf(x, z) {
      var g = new THREE.Group();
      var frame = TM(0xcdd6e4);
      [[-0.85, -0.28], [0.85, -0.28], [-0.85, 0.28], [0.85, 0.28]].forEach(function (p) {
        var post = box(0.07, 2.0, 0.07, frame);
        post.position.set(p[0], 1.0, p[1]);
        post.userData = { ot: 0.05 };
        g.add(post);
      });
      [0.55, 1.1, 1.65].forEach(function (y) {
        var board = box(1.8, 0.05, 0.62, frame);
        board.position.set(0, y, 0);
        board.userData = { ot: 0.05 };
        g.add(board);
        for (var c = 0; c < 5; c++) {
          var cw = 0.15 + Math.random() * 0.1, ch = 0.13 + Math.random() * 0.15;
          var cub = box(cw, ch, 0.18, TM(skuColors[(Math.random() * 6) | 0]));
          cub.position.set(-0.72 + c * 0.36 + Math.random() * 0.05, y + ch / 2 + 0.035, (Math.random() - 0.5) * 0.14);
          cub.userData.noOutline = true;          // 杂货不描边
          g.add(cub);
        }
      });
      g.position.set(x, 0.06, z);
      return g;
    }
    interior.add(shelf(-2.4, -1.85), shelf(0, -1.85), shelf(2.4, -1.85));

    /* —— 便当保温陈列柜（中部，玻璃罩暖光） —— */
    var bento = box(0.95, 1.35, 0.8, TM(0xcdd6e4));
    bento.position.set(-1.3, 0.74, -0.55);
    bento.userData = { ot: 0.045 };
    interior.add(bento);
    var bentoGlass = box(0.8, 1.0, 0.15, toon(0xdff2ff, { transparent: true, opacity: 0.45 }));
    bentoGlass.position.set(-1.3, 0.95, -0.13);
    bentoGlass.userData.noOutline = true;
    interior.add(bentoGlass);
    var bentoGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), glow(0xffd9a0, 0.9));
    bentoGlow.position.set(-1.3, 0.95, -0.2);
    bentoGlow.rotation.y = Math.PI;
    bentoGlow.userData.noOutline = true;
    interior.add(bentoGlow);

    /* —— 饮料冷柜（沿西墙，门朝东） —— */
    var cooler = box(2.3, 2.15, 0.78, TM(0xd9e2ef));
    cooler.position.set(-3.85, 1.14, -0.5);
    cooler.userData = { ot: 0.035 };
    interior.add(cooler);
    var coolerGlass = box(2.1, 1.9, 0.1, toon(0xdff2ff, { transparent: true, opacity: 0.4 }));
    coolerGlass.position.set(-3.44, 1.2, -0.5);
    coolerGlass.rotation.y = Math.PI / 2;
    coolerGlass.userData.noOutline = true;
    interior.add(coolerGlass);
    var coolerStrip = box(2.0, 0.06, 0.5, glow(0xeaffff, 0.95));
    coolerStrip.position.set(-3.85, 2.28, -0.5);
    coolerStrip.userData.noOutline = true;
    interior.add(coolerStrip);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 7; c++) {
        var btl = cyl(0.055, 0.055, 0.27, 8, TM(skuColors[(r * 7 + c) % 6]));
        btl.position.set(-4.38 + c * 0.21, 0.66 + r * 0.56, -0.18 + (r % 2) * 0.1);
        btl.userData.noOutline = true;
        interior.add(btl);
      }
    }

    /* —— 收银台 —— */
    var counter = box(2.3, 1.05, 0.72, TM(0xf2e9dc));
    counter.position.set(2.7, 0.59, 1.35);
    counter.userData = { ot: 0.035 };
    interior.add(counter);
    var countertop = box(2.5, 0.07, 0.88, TM(0xe7dccb));
    countertop.position.set(2.7, 1.14, 1.35);
    countertop.userData = { ot: 0.035 };
    interior.add(countertop);
    var reg = box(0.36, 0.3, 0.26, TM(0x3c4457));
    reg.position.set(3.2, 1.32, 1.2);
    reg.userData = { ot: 0.05 };
    interior.add(reg);
    var regScr = box(0.3, 0.22, 0.02, glow(0x9fe8ff, 0.9));
    regScr.position.set(3.2, 1.35, 1.07);
    regScr.rotation.x = -0.35;
    regScr.userData.noOutline = true;
    interior.add(regScr);
    var tray = box(0.4, 0.05, 0.3, TM(0xd8dee9));
    tray.position.set(2.3, 1.19, 1.25);
    tray.userData.noOutline = true;
    interior.add(tray);

    /* —— 关东煮柜台 —— */
    var pot = box(0.9, 0.62, 0.58, TM(0x8a5a3a));
    pot.position.set(1.45, 0.37, 1.6);
    pot.userData = { ot: 0.045 };
    interior.add(pot);
    var potGlow = box(0.75, 0.05, 0.42, glow(0xffd9a0, 0.85));
    potGlow.position.set(1.45, 0.7, 1.6);
    potGlow.userData.noOutline = true;
    interior.add(potGlow);
    var potSteamLight = new THREE.PointLight(0xffca7a, 0.3, 3);
    potSteamLight.position.set(1.45, 0.85, 1.6);
    interior.add(potSteamLight);

    /* —— 咖啡机（东墙挂式） —— */
    var coffee = box(0.6, 0.9, 0.5, TM(0x3c4457));
    coffee.position.set(3.85, 1.68, 1.35);
    coffee.userData = { ot: 0.045 };
    interior.add(coffee);
    var cupLight = box(0.42, 0.3, 0.02, glow(0xffb37a, 1));
    cupLight.position.set(3.85, 1.6, 1.11);
    cupLight.userData.noOutline = true;
    interior.add(cupLight);

    /* —— 冰淇淋开柜（南窗前矮柜） —— */
    var icebox = box(1.9, 0.62, 0.75, TM(0xd9e2ef));
    icebox.position.set(1.0, 0.37, 0.55);
    icebox.userData = { ot: 0.035 };
    interior.add(icebox);
    var iceGlow = box(1.7, 0.05, 0.55, glow(0xbfe9ff, 0.7));
    iceGlow.position.set(1.0, 0.69, 0.55);
    iceGlow.userData.noOutline = true;
    interior.add(iceGlow);

    /* —— 杂志架（入口西内侧） —— */
    var rack = box(1.25, 1.15, 0.36, TM(0x8a94a8));
    rack.position.set(-3.7, 0.64, 1.65);
    rack.userData = { ot: 0.05 };
    interior.add(rack);
    for (i = 0; i < 6; i++) {
      var mg = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), basic(skuColors[i], { fog: true }));
      mg.position.set(-4.2 + i * 0.2, 1.0, 1.65 - (i % 2) * 0.1);
      mg.rotation.x = -0.3;
      mg.userData.noOutline = true;
      interior.add(mg);
    }

    /* —— 北墙海报 + 后场门 —— */
    var posterTex2 = tex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e3356f';
      ctx.beginPath(); ctx.arc(w / 2, h / 2 - 24, 44, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('新商品', w / 2, h / 2 - 14);
      ctx.fillStyle = '#12325e';
      ctx.font = '20px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('入荷しました', w / 2, h / 2 + 28);
    });
    [-1.6, 0.8].forEach(function (x) {
      var pt = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), toon(0xffffff, { map: posterTex2 }));
      pt.position.set(x, 2.0, -2.32);
      pt.userData.noOutline = true;
      interior.add(pt);
    });
    var backdoor = box(1.05, 2.05, 0.07, TM(0xb9c2d6));
    backdoor.position.set(3.3, 1.09, -2.34);
    backdoor.userData = { ot: 0.045 };
    interior.add(backdoor);

    /* —— 地面导视 —— */
    var guideTex = tex(64, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffb648';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.64); ctx.lineTo(w, h * 0.42);
      ctx.lineTo(w * 0.7, h * 0.42); ctx.lineTo(0, h * 0.64);
      ctx.fill();
    });
    var guide = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 3.0),
      new THREE.MeshBasicMaterial({ map: guideTex, transparent: true, toneMapped: false })
    );
    guide.rotation.x = -Math.PI / 2;
    guide.rotation.z = Math.PI;
    guide.position.set(0, 0.068, 0.6);
    guide.userData.noOutline = true;
    interior.add(guide);
  })();

  /* ============================================================
     7. 街道与街角元素
     ============================================================ */
  var street = new THREE.Group();
  /* ============================================================
     7. 街道与街角元素
     ============================================================ */
  var street = new THREE.Group();
  world.add(street);

  (function buildStreet() {
    /* —— 人行道贴图（砖缝 + 盲道）—— */
    var walkMap = tex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#6a7590'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(20,26,40,.55)'; ctx.lineWidth = 3;
      for (var k = 0; k <= 4; k++) {
        ctx.beginPath(); ctx.moveTo(k * w / 4, 0); ctx.lineTo(k * w / 4, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k * h / 4); ctx.lineTo(w, k * h / 4); ctx.stroke();
      }
      ctx.fillStyle = '#d8b56a';
      ctx.fillRect(w * 0.4, 0, w * 0.08, h);
    });
    walkMap.wrapS = walkMap.wrapT = THREE.RepeatWrapping;

    /* 南侧人行道 x∈[-5,4.9] z∈[3.6,7.2] */
    var walkSMap = walkMap.clone(); walkSMap.needsUpdate = true; walkSMap.repeat.set(4, 1);
    var walkS = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 3.6), toon(0xffffff, { map: walkSMap }));
    walkS.rotation.x = -Math.PI / 2;
    walkS.position.set(-0.1, 0.035, 5.4);
    walkS.userData.noOutline = true;
    street.add(walkS);

    /* 东侧人行道 x∈[5.1,8.7] z∈[-3.8,7.2] */
    var walkEMap = walkMap.clone(); walkEMap.needsUpdate = true; walkEMap.repeat.set(1, 3);
    var walkE = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 11.0), toon(0xffffff, { map: walkEMap }));
    walkE.rotation.x = -Math.PI / 2;
    walkE.position.set(6.9, 0.035, 1.7);
    walkE.userData.noOutline = true;
    street.add(walkE);

    /* —— 店前走道（门面到路缘）—— */
    var apron = box(9.8, 0.05, 1.5, TM(0x7d8aa6));
    apron.position.set(-0.1, 0.025, 2.85);
    apron.userData = { ot: 0.05 };
    street.add(apron);

    /* —— 路缘石 + 排水沟（沿店铺地界线）—— */
    var curbMat = TM(0x8a94a8);
    var gutMat = TM(0x3a4256);

    var c1 = box(10.2, 0.14, 0.28, curbMat);
    c1.position.set(-0.1, 0.07, 3.34);
    c1.userData = { ot: 0.05 };
    street.add(c1);
    var c2 = box(0.28, 0.14, 11.4, curbMat);
    c2.position.set(4.82, 0.07, 1.7);
    c2.userData = { ot: 0.05 };
    street.add(c2);

    var gr1 = box(10.2, 0.06, 0.6, gutMat);
    gr1.position.set(-0.1, 0.04, 3.68);
    gr1.userData = { ot: 0.05 };
    street.add(gr1);
    for (var b = 0; b < 17; b++) {
      var bar = box(0.5, 0.03, 0.09, TM(PAL.slate));
      bar.position.set(-4.95 + b * 0.61, 0.075, 3.68);
      bar.userData.noOutline = true;
      street.add(bar);
    }
    var gr2 = box(0.6, 0.06, 11.4, gutMat);
    gr2.position.set(5.0, 0.04, 1.7);
    gr2.userData = { ot: 0.05 };
    street.add(gr2);
    for (var b2 = 0; b2 < 18; b2++) {
      var bar2 = box(0.09, 0.03, 0.5, TM(PAL.slate));
      bar2.position.set(5.0, 0.075, -3.9 + b2 * 0.65);
      bar2.userData.noOutline = true;
      street.add(bar2);
    }

    /* —— 道路标线（南段路面 z∈[7.2,10]）—— */
    var lineMat = basic(PAL.line, { fog: true });
    for (var zz = 0; zz < 5; zz++) {                  // 反光斑马线（跨越南街）
      var stripe = box(2.2, 0.015, 0.45, lineMat);
      stripe.position.set(3.5, 0.045, 7.45 + zz * 0.55);
      stripe.userData.noOutline = true;
      street.add(stripe);
    }
    [[-2.0, 4.45], [0.4, 4.45]].forEach(function (p) {  // 停车位港湾
      var l1 = box(1.7, 0.015, 0.08, lineMat); l1.position.set(p[0], 0.045, p[1] + 0.55);
      var l2 = box(0.08, 0.015, 1.1, lineMat); l2.position.set(p[0] - 0.85, 0.045, p[1]);
      var l3 = box(0.08, 0.015, 1.1, lineMat); l3.position.set(p[0] + 0.85, 0.045, p[1]);
      [l1, l2, l3].forEach(function (m) { m.userData.noOutline = true; street.add(m); });
    });

    /* —— 街角护栏（沿人行道外缘 L 形）—— */
    function guardRun(ax, az, bx, bz) {
      var dx = bx - ax, dz = bz - az;
      var len = Math.sqrt(dx * dx + dz * dz);
      var n = Math.max(2, Math.round(len) + 1);
      var alongX = Math.abs(dz) < 0.01;
      for (var p = 0; p < n; p++) {
        var t = p / (n - 1);
        var post = cyl(0.035, 0.035, 0.72, 6, TM(PAL.slate));
        post.position.set(ax + dx * t, 0.395, az + dz * t);
        post.userData = { ot: 0.07 };
        street.add(post);
      }
      [0.44, 0.58].forEach(function (y) {
        var pl = len + 0.5;
        var pipe = alongX
          ? box(pl, 0.055, 0.055, TM(0xdde4f0))
          : box(0.055, 0.055, pl, TM(0xdde4f0));
        pipe.position.set((ax + bx) / 2, y, (az + bz) / 2);
        pipe.userData = { ot: 0.08 };
        street.add(pipe);
      });
    }
    guardRun(-7.5, 7.06, 1.2, 7.06);     // 南段·斑马线以西
    guardRun(4.6, 7.06, 8.62, 7.06);     // 南段·斑马线以东至路角
    guardRun(8.62, 7.06, 8.62, -3.7);    // 东段·向北

    /* —— 交通信号灯（南街东端，周期变化）—— */
    var lampR, lampY, lampG;
    (function signal() {
      var g = new THREE.Group();
      var pole = cyl(0.065, 0.09, 3.7, 8, TM(PAL.ink));
      pole.position.y = 1.85;
      pole.userData = { ot: 0.04 };
      g.add(pole);
      var arm = box(1.2, 0.08, 0.08, TM(PAL.ink));
      arm.position.set(0.6, 3.55, 0);
      arm.userData = { ot: 0.05 };
      g.add(arm);
      var housing = box(0.32, 0.92, 0.28, TM(0x1c212e));
      housing.position.set(1.15, 3.05, 0);
      housing.userData = { ot: 0.05 };
      g.add(housing);
      function sgn(y, hex) {
        var m = cyl(0.1, 0.1, 0.05, 10, glow(hex, 0.8));
        m.rotation.x = Math.PI / 2;
        m.position.set(1.15, y, 0.16);
        m.userData.noOutline = true;
        g.add(m);
        return m;
      }
      lampR = sgn(3.32, 0xff4b4b);
      lampY = sgn(3.05, 0xffd166);
      lampG = sgn(2.78, 0x53d769);
      g.position.set(6.0, 0.02, 9.05);
      g.rotation.y = 0.3;
      street.add(g);

      var dim = 0.12;
      animModules.push(function (dt, t) {
        var c = t % 12;
        var r = c < 4.5, yl = !r && c < 5, gn = c >= 5 && c < 11.2, ye2 = c >= 11.2;
        lampR.material.color.setHex(0xff4b4b).multiplyScalar(r ? 1 : dim);
        lampY.material.color.setHex(0xffd166).multiplyScalar((yl || ye2) ? 1 : dim);
        lampG.material.color.setHex(0x53d769).multiplyScalar(gn ? 1 : dim);
      });
    })();

    /* —— 路灯 ×2（暖光 + 湿地光斑）—— */
    function lamp(x, z, rotY) {
      var g = new THREE.Group();
      var pole = cyl(0.07, 0.1, 3.5, 8, TM(PAL.slate));
      pole.position.y = 1.75;
      pole.userData = { ot: 0.03 };
      g.add(pole);
      var arm = box(0.95, 0.08, 0.08, TM(PAL.slate));
      arm.position.set(0.48, 3.42, 0);
      arm.userData = { ot: 0.04 };
      g.add(arm);
      var head = box(0.6, 0.2, 0.32, TM(0xc9d2e2));
      head.position.set(0.9, 3.38, 0);
      head.userData = { ot: 0.04 };
      g.add(head);
      var bulb = box(0.48, 0.07, 0.24, glow(0xffe9c0, 1));
      bulb.position.set(0.9, 3.27, 0);
      bulb.userData.noOutline = true;
      g.add(bulb);
      var sp = new THREE.SpotLight(0xffd9a0, 0.85, 11, Math.PI / 5.5, 0.6, 1.5);
      sp.position.set(0.9, 3.24, 0);
      sp.target.position.set(0.9, 0, 1.8);
      g.add(sp, sp.target);
      g.position.set(x, 0.035, z);
      g.rotation.y = rotY;
      street.add(g);

      var pool = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.4),
        new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.12 })
      );
      pool.rotation.x = -Math.PI / 2;
      var wp = new THREE.Vector3(0.7, 0, 1.2)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
        .add(new THREE.Vector3(x, 0, z));
      pool.position.set(wp.x, 0.024, wp.z);
      pool.userData.noOutline = true;
      street.add(pool);
    }
    lamp(-6.5, 6.55, -Math.PI / 2);   // 南灯：臂伸向南侧路面
    lamp(8.25, 3.0, 0);               // 东灯：臂伸向东侧路肩

    /* —— 自动贩卖机 ×2（东人行道背靠护栏，面板朝西）—— */
    function vending(x, z, bodyHex, draw) {
      var g = new THREE.Group();
      var body = box(1.05, 2.05, 0.75, TM(bodyHex));
      body.position.y = 1.04;
      body.userData = { ot: 0.03 };
      g.add(body);
      var faceTex = tex(128, 256, draw);
      var panel = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.55),
        new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }));
      panel.position.set(-0.08, 1.3, 0.39);
      panel.userData.noOutline = true;
      g.add(panel);
      var pl = new THREE.PointLight(bodyHex, 0.5, 5.5);
      pl.position.set(0, 1.4, 0.9);
      g.add(pl);
      var halo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.3),
        new THREE.MeshBasicMaterial({ color: bodyHex, transparent: true, opacity: 0.09 })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(0, 0.018, 0.7);
      halo.userData.noOutline = true;
      g.add(halo);
      g.position.set(x, 0.035, z);
      g.rotation.y = -Math.PI / 2;
      street.add(g);
    }
    vending(8.0, -1.35, 0xe3356f, function (ctx, w, h) {
      ctx.fillStyle = '#2b1830'; ctx.fillRect(0, 0, w, h);
      var cols = ['#ffd166', '#62e6ff', '#ff5f9e', '#8ad4b8'];
      for (var r = 0; r < 4; r++)
        for (var c = 0; c < 3; c++) {
          ctx.fillStyle = cols[(r + c) % 4];
          ctx.fillRect(14 + c * 36, 20 + r * 34, 26, 24);
        }
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ドリンク', 34, h - 18);
    });
    vending(8.0, 0.65, 0x1d4ed8, function (ctx, w, h) {
      ctx.fillStyle = '#101c3a'; ctx.fillRect(0, 0, w, h);
      for (var r = 0; r < 3; r++)
        for (var c = 0; c < 2; c++) {
          ctx.fillStyle = r === 2 ? '#ffd166' : '#e8eef8';
          ctx.fillRect(20 + c * 46, 24 + r * 42, 34, 30);
        }
      ctx.fillStyle = '#62e6ff';
      ctx.font = '13px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('たばこ', 44, h - 16);
    });

    /* —— 自行车（东人行道，斜停）—— */
    (function bike() {
      var g = new THREE.Group();
      var tireMat = TM(0x232937);
      function wheel(x) {
        var t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 22), tireMat);
        t.rotation.y = Math.PI / 2;
        t.position.set(x, 0.33, 0);
        t.userData = { ot: 0.045 };
        g.add(t);
        for (var s = 0; s < 4; s++) {
          var sp = box(0.56, 0.016, 0.016, TM(PAL.steel));
          sp.position.set(x, 0.33, 0);
          sp.rotation.x = s * Math.PI / 4;
          sp.userData.noOutline = true;
          g.add(sp);
        }
      }
      wheel(-0.58); wheel(0.58);
      var frame = TM(PAL.cyan);
      var b1 = box(1.05, 0.05, 0.05, frame); b1.position.set(0, 0.45, 0); b1.rotation.z = 0.2;
      var b2 = box(1.05, 0.05, 0.05, frame); b2.position.set(0, 0.45, 0); b2.rotation.z = -0.6;
      b1.userData = b2.userData = { ot: 0.06 };
      g.add(b1); g.add(b2);
      var sp1 = cyl(0.025, 0.025, 0.42, 6, TM(PAL.ink));
      sp1.position.set(-0.36, 0.65, 0); sp1.userData = { ot: 0.08 };
      var sp2 = cyl(0.025, 0.025, 0.36, 6, TM(PAL.ink));
      sp2.position.set(0.42, 0.63, 0); sp2.userData = { ot: 0.08 };
      g.add(sp1); g.add(sp2);
      var seat = box(0.32, 0.06, 0.17, TM(PAL.magenta));
      seat.position.set(-0.42, 0.88, 0); seat.userData = { ot: 0.08 };
      var hbar = box(0.46, 0.05, 0.07, TM(PAL.steel));
      hbar.position.set(0.44, 0.8, 0); hbar.userData = { ot: 0.08 };
      var basket = box(0.36, 0.24, 0.26, TM(0xd8dee9));
      basket.position.set(0.66, 0.76, 0); basket.userData = { ot: 0.08 };
      g.add(seat); g.add(hbar); g.add(basket);
      var lockPost = cyl(0.045, 0.045, 0.68, 6, TM(PAL.slate));
      lockPost.position.set(1.1, 0.34, 0); lockPost.userData = { ot: 0.07 };
      g.add(lockPost);
      g.position.set(6.3, 0.04, -3.35);
      g.rotation.y = 0.55;
      street.add(g);
    })();

    /* —— 雨伞架（雨棚下西侧）—— */
    (function umbrellas() {
      var g = new THREE.Group();
      var pot = cyl(0.27, 0.31, 0.74, 10, TM(PAL.slate));
      pot.position.y = 0.37;
      pot.userData = { ot: 0.06 };
      g.add(pot);
      var cols = [PAL.magenta, PAL.cyan, PAL.neonYellow];
      for (var u = 0; u < 3; u++) {
        var stick = cyl(0.015, 0.015, 1.0, 5, TM(0x8a5a3a));
        stick.position.set(-0.1 + u * 0.1, 0.98 + (u % 2) * 0.06, (u - 1) * 0.08);
        stick.rotation.z = (u - 1) * 0.12;
        stick.userData = { ot: 0.1 };
        g.add(stick);
        var top = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 8, 1, true), TM(cols[u]));
        top.position.set(-0.12 + u * 0.11, 1.28 + (u % 2) * 0.06, (u - 1) * 0.08);
        top.userData = { ot: 0.1 };
        g.add(top);
      }
      g.position.set(-3.6, 0.05, 2.72);
      street.add(g);
    })();

    /* —— 垃圾桶（东人行道）—— */
    var can = cyl(0.32, 0.27, 0.8, 10, TM(0x3c4457));
    can.position.set(5.3, 0.44, -2.1);
    can.userData = { ot: 0.05 };
    street.add(can);
    var canLid = cyl(0.34, 0.31, 0.09, 10, TM(PAL.slate));
    canLid.position.set(5.3, 0.88, -2.1);
    canLid.userData = { ot: 0.05 };
    street.add(canLid);

    /* —— 路牌（西南，街角）—— */
    (function roadSign() {
      var g = new THREE.Group();
      var pole = cyl(0.05, 0.065, 2.7, 8, TM(PAL.slate));
      pole.position.y = 1.35;
      pole.userData = { ot: 0.07 };
      g.add(pole);
      var plateTex = tex(256, 128, function (ctx, w, h) {
        ctx.fillStyle = '#1e5fd0'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, w - 10, h - 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('北大道', w / 2, h / 2 + 12);
      });
      var plateMat = new THREE.MeshBasicMaterial({ map: plateTex, toneMapped: false });
      var p1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.52), plateMat);
      p1.position.set(0, 2.42, 0.035);
      var p2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.52), plateMat);
      p2.position.set(0, 2.42, -0.035);
      p2.rotation.y = Math.PI;
      p1.userData = p2.userData = { noOutline: true };
      g.add(p1); g.add(p2);
      g.position.set(-7.0, 0, 4.3);
      g.rotation.y = 0.4;
      street.add(g);
    })();

    /* —— 电线杆 + 电线 —— */
    (function powerPole() {
      var g = new THREE.Group();
      var pole = cyl(0.12, 0.16, 5.4, 10, TM(PAL.slate));
      pole.position.y = 2.7;
      pole.userData = { ot: 0.025 };
      g.add(pole);
      var cr1 = box(1.8, 0.11, 0.11, TM(0x8a5a3a));
      cr1.position.y = 5.0; cr1.userData = { ot: 0.05 }; g.add(cr1);
      var cr2 = box(1.3, 0.1, 0.1, TM(0x8a5a3a));
      cr2.position.y = 4.5; cr2.userData = { ot: 0.05 }; g.add(cr2);
      [-0.8, 0, 0.8].forEach(function (x) {
        var ins = cyl(0.04, 0.05, 0.12, 6, TM(0xcfe3ff));
        ins.position.set(x, 5.1, 0); ins.userData = { ot: 0.08 };
        g.add(ins);
      });
      var trans = box(0.52, 0.62, 0.42, TM(0x3c4457));
      trans.position.y = 4.1; trans.userData = { ot: 0.05 };
      g.add(trans);
      g.position.set(-8.4, 0, -6.6);
      street.add(g);

      var wireMat = basic(0x222838, { fog: true });
      [[5.05, 0], [4.55, 0.14], [4.55, -0.14]].forEach(function (cfg) {
        var pts = [
          new THREE.Vector3(-8.4, cfg[0], -6.6),
          new THREE.Vector3(-3.4, cfg[0] - 0.3, -3.2),
          new THREE.Vector3(2.6, cfg[0] - 0.42, -1.4),
          new THREE.Vector3(8.6, cfg[0] - 0.18, 1.8)
        ];
        var tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.014, 4, false), wireMat
        );
        tube.userData.noOutline = true;
        street.add(tube);
      });
    })();

    /* —— 店招暖光地晕（店前走道）—— */
    var storeHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 1.5),
      new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.08 })
    );
    storeHalo.rotation.x = -Math.PI / 2;
    storeHalo.position.set(0, 0.056, 2.95);
    storeHalo.userData.noOutline = true;
    street.add(storeHalo);
  })();

  /* ============================================================
     8. 邻里建筑（背景体块 + 窗灯贴图）
     ============================================================ */
  (function buildNeighbors() {
    function towerBox(w, h, d, x, z, hex) {
      var m = box(w, h, d, TM(hex));
      m.position.set(x, h / 2, z);
      m.userData = { ot: 0.012 };
      world.add(m);
      return m;
    }
    function windowsFor(x, y, z, rotY, w, h, seedArr) {
      var t = tex(256, 256, function (ctx, cw, ch) {
        ctx.fillStyle = '#1b2338'; ctx.fillRect(0, 0, cw, ch);
        for (var r = 0; r < 4; r++)
          for (var c = 0; c < 4; c++) {
            var lit = seedArr[(r * 4 + c) % seedArr.length];
            ctx.fillStyle = lit;
            ctx.fillRect(16 + c * 60, 14 + r * 62, 44, 46);
          }
      });
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(0xffffff, { map: t }));
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      m.userData.noOutline = true;
      world.add(m);
    }
    // 西侧邻居 + 巷道
    towerBox(3.4, 4.8, 3.6, -7.7, -2.8, 0x39415c);
    windowsFor(-6.0, 2.5, -2.8, Math.PI / 2, 2.6, 4.1,
      ['#ffd9a0', '#1a2138', '#62e6ff', '#1a2138', '#ffd9a0', '#233050', '#ff5f9e', '#1a2138']);
    // 北侧邻居1（正后方，低矮）
    towerBox(5.0, 3.1, 2.6, -1.6, -7.6, 0x333b55);
    windowsFor(-1.6, 1.6, -6.28, 0, 4.2, 2.2,
      ['#ffd9a0', '#1a2138', '#233050', '#62e6ff', '#1a2138', '#ffd9a0']);
    // 北侧邻居2（东北）
    towerBox(4.8, 5.5, 3.9, 7.0, -6.6, 0x39415c);
    windowsFor(7.0, 2.7, -4.62, 0, 3.7, 4.5,
      ['#ffd9a0', '#1a2138', '#62e6ff', '#1a2138', '#ffd9a0', '#233050', '#ff5f9e', '#1a2138']);
    // 巷道地面与杂物
    var alley = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.4), TM(0x1c2436));
    alley.rotation.x = -Math.PI / 2;
    alley.position.set(-4.85, 0.03, -2.8);
    alley.userData.noOutline = true;
    world.add(alley);
    var junk = box(0.95, 0.62, 0.72, TM(0x8a5a3a));
    junk.position.set(-4.85, 0.34, -3.85);
    junk.rotation.y = 0.35; junk.userData = { ot: 0.045 };
    world.add(junk);
    // 巷口矮墙 + 夏祭海报
    var lowWall = box(1.2, 2.3, 1.7, TM(0x454f6e));
    lowWall.position.set(-5.2, 1.17, -0.85); lowWall.userData = { ot: 0.02 };
    world.add(lowWall);
    var festTex = tex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#12325e'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff5f9e';
      ctx.font = 'bold 52px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('夏祭り', w / 2, h / 2 - 6);
      ctx.fillStyle = '#dffaff';
      ctx.font = '24px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('8/15 打上花火', w / 2, h / 2 + 42);
    });
    var fest = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), basic(0xffffff, { map: festTex }));
    fest.position.set(-5.2, 1.55, -0.0); fest.rotation.y = 0;
    fest.userData.noOutline = true;
    world.add(fest);
  })();

  /* ============================================================
     9. 应用描边
     ============================================================ */
  applyOutlines(world);

  /* ============================================================
     10. 动效：涟漪池 / 降雨 / 屋檐滴水 / 玻璃雨痕 / 积水呼吸
     ============================================================ */

  /* —— 涟漪池（共享） —— */
  var ripples = (function () {
    var N = 34;
    var geo = new THREE.RingGeometry(0.86, 1, 22);
    var pool = [];
    for (var i = 0; i < N; i++) {
      var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0x9fc3ef, transparent: true, opacity: 0, depthWrite: false
      }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.userData.noOutline = true;
      scene.add(m);
      pool.push({ mesh: m, life: 0, dur: 0.8 });
    }
    var cursor = 0;
    function spawn(x, z, dur) {
      var r = pool[cursor];
      cursor = (cursor + 1) % N;
      r.mesh.visible = true;
      r.life = 0;
      r.dur = dur || 0.8;
      r.mesh.position.set(x, 0.055, z);
    }
    animModules.push(function (dt) {
      pool.forEach(function (r) {
        if (!r.mesh.visible) return;
        r.life += dt;
        var k = r.life / r.dur;
        if (k >= 1) { r.mesh.visible = false; return; }
        r.mesh.scale.setScalar(0.12 + k * 1.5);
        r.mesh.material.opacity = 0.42 * (1 - k) * (1 - k);
      });
    });
    return { spawn: spawn };
  })();

  /* —— 持续降雨 —— */
  (function rain() {
    var N = 850;
    var arr = new Float32Array(N * 6);
    var vy = new Float32Array(N);
    var mat = new THREE.LineBasicMaterial({ color: 0x9fc3ef, transparent: true, opacity: 0.34 });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    var rain = new THREE.LineSegments(geo, mat);
    rain.frustumCulled = false;
    scene.add(rain);
    for (var i = 0; i < N; i++) {
      var x = (Math.random() - 0.5) * 26;
      var y = 2 + Math.random() * 13;
      var z = (Math.random() - 0.5) * 26;
      var v = 9.5 + Math.random() * 7;
      var j = i * 6;
      arr[j] = x; arr[j + 1] = y; arr[j + 2] = z;
      arr[j + 3] = x; arr[j + 4] = y - 0.6; arr[j + 5] = z;
      vy[i] = v;
    }
    geo.attributes.position.needsUpdate = true;
    animModules.push(function (dt) {
      for (var i = 0; i < N; i++) {
        var j = i * 6;
        arr[j + 1] -= vy[i] * dt;
        arr[j + 4] = arr[j + 1] - 0.6;
        if (arr[j + 1] < 0.15) {              // 落地：重置 + 偶发涟漪
          if (Math.random() < 0.16) {
            ripples.spawn(arr[j], arr[j + 5], 0.55 + Math.random() * 0.3);
          }
          arr[j + 1] = 15 + Math.random() * 3;
          arr[j] = (Math.random() - 0.5) * 26;
          arr[j + 2] = (Math.random() - 0.5) * 26;
        }
        arr[j + 3] = arr[j];
        arr[j + 5] = arr[j + 2];
      }
      geo.attributes.position.needsUpdate = true;
    });
  })();

  /* —— 屋檐滴水 —— */
  (function eaveDrips() {
    var sources = [
      new THREE.Vector3(1.75, 2.97, 2.85),    // 雨棚右缘
      new THREE.Vector3(-1.75, 2.97, 2.85),   // 雨棚左缘
      new THREE.Vector3(4.4, 3.64, -2.9),     // 屋檐北东
      new THREE.Vector3(-4.4, 3.64, 2.1),     // 屋檐南西
      new THREE.Vector3(4.4, 2.1, -2.1)       // 落水管低位
    ];
    var geo = new THREE.SphereGeometry(0.04, 4, 4);
    var mat = basic(0xcfe9ff, { transparent: true, opacity: 0.9 });
    var drops = sources.map(function (src) {
      var m = new THREE.Mesh(geo, mat);
      m.visible = false;
      m.userData.noOutline = true;
      scene.add(m);
      return { mesh: m, src: src, v: 0, wait: 0.4 + Math.random() * 2, on: false };
    });
    animModules.push(function (dt) {
      drops.forEach(function (d) {
        if (!d.on) {
          d.wait -= dt;
          if (d.wait <= 0) {
            d.on = true; d.v = 0;
            d.mesh.visible = true;
            d.mesh.position.copy(d.src);
          }
          return;
        }
        d.v += 14 * dt;
        d.mesh.position.y -= d.v * dt;
        d.mesh.scale.y = 1 + d.v * 0.1;
        if (d.mesh.position.y <= 0.06) {
          ripples.spawn(d.mesh.position.x, d.mesh.position.z, 1.0);
          d.on = false;
          d.mesh.visible = false;
          d.wait = 0.5 + Math.random() * 2.2;
        }
      });
    });
  })();

  /* —— 玻璃雨痕（南面） —— */
  (function glassStreaks() {
    var mat = new THREE.MeshBasicMaterial({
      color: 0xdff2ff, transparent: true, opacity: 0.4, depthWrite: false
    });
    var list = [];
    for (var i = 0; i < 8; i++) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.035 + Math.random() * 0.05, 0.7), mat
      );
      m.position.set(-3.5 + Math.random() * 7, 3.1, 2.54);
      m.userData.noOutline = true;
      scene.add(m);
      list.push({ mesh: m, speed: 0.3 + Math.random() * 0.55 });
    }
    animModules.push(function (dt) {
      list.forEach(function (s) {
        s.mesh.position.y -= s.speed * dt;
        if (s.mesh.position.y < 0.95) {
          s.mesh.position.y = 3.25 + Math.random() * 0.25;
          s.mesh.position.x = -3.5 + Math.random() * 7;
        }
      });
    });
  })();

  /* —— 积水反射呼吸 —— */
  if (wetLayer) {
    animModules.push(function (dt, t) {
      wetLayer.material.opacity = 0.06 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.55));
    });
  }

  /* ============================================================
     11. 主循环
     ============================================================ */
  var clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    for (var i = 0; i < animModules.length; i++) animModules[i](dt, t);
    if (controls) controls.update();
    renderer.render(scene, camera);
  })();
})();
