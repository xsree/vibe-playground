/* 独立程序化场景。场景尺寸以微缩模型单位计。 */
(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111925');
  scene.fog = new THREE.FogExp2('#111925', 0.018);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const model = new THREE.Group(); scene.add(model);
  const palette = { ink: '#182530', wall: '#a4ac9e', teal: '#397d7d', cream: '#fff0cb', road: '#303f51', curb: '#7b8591', orange: '#ed8860' };
  const materials = new Map();
  function mat(color, glow = 0) {
    const key = color + ':' + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshToonMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), emissive: glow ? new THREE.Color(color).convertSRGBToLinear() : '#000000', emissiveIntensity: glow }));
    return materials.get(key);
  }
  const edgeMat = new THREE.LineBasicMaterial({ color: '#17232c', transparent: true, opacity: .64 });
  function box(w, h, d, x, y, z, color, parent = model, outline = true, glow = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, glow) : color);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    if (outline && Math.max(w, h, d) > .12) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat));
    return mesh;
  }
  function cyl(r, h, x, y, z, color, parent = model, top = r, segments = 16) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(top, r, h, segments), mat(color));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function rod(a, b, r, color, parent = model) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = cyl(r, delta.length(), 0, 0, 0, color, parent, r, 8);
    m.position.copy(start.add(end).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function textPanel(text, sub, w, h, x, y, z, bg, fg, parent = model) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
    const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    g.font = `600 ${c.height * (sub ? .48 : .61)}px "Yu Gothic", "Meiryo", sans-serif`;
    g.fillText(text, 512, c.height * (sub ? .39 : .51), 950);
    if (sub) { g.font = `500 ${c.height * .15}px sans-serif`; g.fillText(sub, 512, c.height * .81, 940); }
    const texture = new THREE.CanvasTexture(c); texture.encoding = THREE.sRGBEncoding; texture.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function light(color, intensity, distance, x, y, z) {
    const l = new THREE.PointLight(color, intensity, distance, 2); l.position.set(x, y, z); scene.add(l); return l;
  }
  scene.add(new THREE.HemisphereLight('#a7caff', '#394254', .4));
  const moon = new THREE.DirectionalLight('#b1caff', .48); moon.position.set(-5, 12, 5); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  moon.shadow.bias = -.0004; scene.add(moon);
  light('#ffc078', 1.45, 8, -1.4, 2.4, .1); light('#ffd193', 1.3, 6, -2, 2, -2.5);
  light('#ffc58c', .9, 7, -.8, 2.7, 2.2); light('#69d7e5', 1.1, 4, 2.75, 1.3, 1.6);

  // 完整方形底座与转角道路。
  box(12, .42, 12, 0, -.23, 0, '#243342');
  box(11.98, .07, 11.98, 0, .015, 0, palette.road);
  box(8.25, .2, 7.3, -1.63, .145, -1.73, '#777f85');
  box(8.35, .08, .18, -1.58, .25, 1.96, '#a6afb0');
  box(.18, .08, 7.4, 2.52, .25, -1.7, '#a6afb0');
  for (let x = -5.5; x < 2.5; x += .55) box(.013, .004, 1.2, x, .252, 1.3, '#515f6c', model, false);
  for (let z = -5.1; z < 1.9; z += .55) box(.75, .004, .015, 2.04, .252, z, '#515f6c', model, false);
  for (let i = 0; i < 7; i++) box(.43, .011, 1.65, -1.3 + i * .85, .059, 4.52, '#b9c6c8', model, false);
  for (let z = -4.7; z < 3; z += 1.9) box(.075, .012, .8, 4.25, .06, z, '#cfba83', model, false);
  for (let x = -5.3; x < -1; x += 1.7) box(.8, .012, .055, x, .06, 3.5, '#cfba83', model, false);
  box(.035, .012, 1.5, -5.2, .06, 4.45, '#97aeb9', model, false);
  box(2.4, .012, .035, -4, .06, 5.2, '#97aeb9', model, false);
  box(.035, .012, 1.5, -2.8, .06, 4.45, '#97aeb9', model, false);
  const parking = textPanel('止まれ', '', 1.3, .48, 4.7, .069, 2.9, '#303f51', '#c1cbd1'); parking.rotation.x = -Math.PI / 2; parking.rotation.z = Math.PI / 2;
  for (const [x, z, rot] of [[1.8, 2.15, 0], [-3.8, 2.15, 0], [2.7, -2.8, Math.PI / 2]]) {
    const grate = new THREE.Group(); grate.position.set(x, .065, z); grate.rotation.y = rot; model.add(grate);
    box(.8, .018, .28, 0, 0, 0, '#162a37', grate);
    for (let i = 0; i < 10; i++) box(.022, .02, .25, -.35 + .078 * i, .012, 0, '#687b88', grate, false);
  }

  // 商店主体：四面都具备完整细节，前立面与右侧通透。
  box(6.25, .18, 4.9, -1.4, .34, -1.02, '#d1c6aa');
  box(6.2, 2.82, .15, -1.4, 1.8, -3.45, palette.wall);
  box(.15, 2.82, 4.9, -4.48, 1.8, -1.02, palette.wall);
  box(6.2, .49, .15, -1.4, .65, 1.42, '#6c9b95');
  box(.15, .49, 4.85, 1.68, .65, -1.02, '#6c9b95');
  const glass = new THREE.MeshPhysicalMaterial({ color: '#a6d5d4', transparent: true, opacity: .11, roughness: .14, metalness: .1, depthWrite: false, side: THREE.DoubleSide });
  box(3.82, 1.95, .025, -2.48, 1.85, 1.43, glass, model, false);
  box(.025, 1.95, 4.55, 1.68, 1.85, -1.02, glass, model, false);
  for (const x of [-4.45, -3.15, -1.88, -.56, 1.66]) box(.065, 2.7, .13, x, 1.72, 1.44, '#34464a');
  for (const z of [-3.4, -2.1, -.75, .62, 1.4]) box(.11, 2.65, .07, 1.69, 1.72, z, '#34464a');
  box(6.2, .065, .14, -1.4, 2.88, 1.43, '#34464a');
  box(.14, .065, 4.9, 1.69, 2.88, -1.02, '#34464a');
  box(6.2, .045, .055, -1.4, 1.23, 1.49, '#e4cf8a');
  box(.055, .045, 4.9, 1.75, 1.23, -1.02, '#e4cf8a');
  const doors = [];
  for (let i = 0; i < 2; i++) {
    const door = new THREE.Group(); door.position.set(-.015 + i * 1.04, 0, 1.48); model.add(door); doors.push(door);
    box(1, 2.32, .028, 0, 1.61, 0, glass, door, false);
    for (const x of [-.5, .5]) box(.045, 2.32, .08, x, 1.61, 0, '#b9c9c4', door);
    for (const y of [.46, 1.25, 2.75]) box(1, .05, .08, 0, y, 0, '#a8b8b5', door);
    box(.045, .35, .08, i ? -.4 : .4, 1.42, .08, '#d6e2d6', door);
    textPanel('自動', '', .22, .15, 0, 1.67, .043, '#d7dec9', '#4f6765', door);
  }
  box(2.17, .11, .16, .51, 2.83, 1.5, '#35444c');
  box(.12, .06, .08, .5, 2.78, 1.59, '#162934');
  box(1.94, .025, .65, .51, .265, 1.87, '#375c62');
  for (let i = 0; i < 11; i++) box(1.8, .005, .013, .51, .28, 1.61 + i * .05, '#6e8b86', model, false);

  // 悬挑雨棚、陶瓷边线及双面灯箱。
  box(6.8, .19, 5.45, -1.4, 3.24, -1.03, '#637b78');
  box(6.92, .07, 5.54, -1.4, 3.36, -1.03, '#9eaaa0');
  box(6.6, .38, .19, -1.4, 3.05, 1.74, '#e9dfbd');
  box(6.64, .065, .22, -1.4, 2.85, 1.76, '#67b6ac', model, true, .35);
  box(6.64, .065, .22, -1.4, 3.26, 1.76, '#de9868');
  const sign = textPanel('灯 り マ ー ト', 'AKARI MART     ·     OPEN 24 HOURS', 5.35, .33, -1.6, 3.055, 1.842, '#f8eccb', '#256e6e');
  textPanel('24', '', .49, .32, 1.37, 3.05, 1.847, '#357d77', '#ffefcf');
  box(.16, .38, 4.92, 1.97, 3.05, -.92, '#e9dfbd');
  const sideSign = textPanel('灯りマート   24', '', 3.65, .29, 2.058, 3.05, -.7, '#f8eccb', '#256e6e'); sideSign.rotation.y = Math.PI / 2;
  for (let x = -4; x < 1; x += 1.4) box(.9, .025, .1, x, 2.91, 1.6, '#ffe5a8', model, false, 1.2);
  for (let i = 0; i < 12; i++) box(.016, .014, 5.18, -4.56 + i * .57, 3.405, -1.03, '#748984', model, false);
  box(1.6, .14, 1.05, -2.8, 3.46, -2.15, '#87938d');
  box(.9, .4, .75, -2.8, 3.71, -2.15, '#a4aaa0');
  for (let i = 0; i < 7; i++) box(.7, .017, .024, -2.8, 3.57 + i * .043, -1.76, '#596e72', model, false);
  rod([-4.57, 3.25, 1.5], [-4.57, .33, 1.5], .044, '#6e8886');

  // 室内的地砖、冷藏柜与成排商品。
  for (let x = -4.1; x < 1.5; x += .55) for (let z = -3.15; z < 1.3; z += .55) box(.53, .007, .53, x, .437, z, '#e1d5b9', model, false);
  const productColors = ['#e0b466', '#e78465', '#9cbe93', '#cdd6b0', '#79aab0', '#dccdc0'];
  let seed = 702;
  function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function products(x, y, z, n, spacing, parent = model, bottles = false) {
    for (let i = 0; i < n; i++) {
      const color = productColors[Math.floor(random() * productColors.length)];
      const height = bottles ? .22 : .13 + random() * .14;
      if (bottles) { cyl(.049, height, x + i * spacing, y + height / 2, z, color, parent, .04, 8); cyl(.026, .04, x + i * spacing, y + height + .015, z, '#d7dfcd', parent); }
      else box(.12, height, .13, x + i * spacing, y + height / 2, z, color, parent, false);
      box(.075, .045, .004, x + i * spacing, y + height * .58, z + .071, '#eee4c8', parent, false);
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = -3.72 + i * .93;
    box(.88, 1.98, .47, x, 1.45, -3.08, '#526b70');
    box(.76, 1.65, .025, x, 1.47, -2.829, '#abc6b3', model, false, .2);
    for (let j = 0; j < 4; j++) {
      box(.78, .035, .34, x, .7 + j * .39, -2.96, '#d7dac4');
      products(x - .29, .72 + j * .39, -2.87, 5, .145, model, true);
    }
    box(.027, 1.72, .04, x + .36, 1.48, -2.79, '#d4ddd3');
    textPanel('DRINKS', '', .76, .15, x, 2.35, -2.81, '#eee4c7', '#527774');
  }
  for (const [sx, sz] of [[-2.9, -.85], [-.7, -1.1]]) {
    box(1.65, .12, .58, sx, .51, sz, '#687c79');
    box(1.58, 1.06, .06, sx, 1.06, sz - .2, '#d8cfb4');
    for (let j = 0; j < 3; j++) {
      box(1.65, .045, .53, sx, .6 + j * .37, sz, '#e2ddc3');
      products(sx - .67, .63 + j * .37, sz + .13, 8, .185);
      box(1.6, .06, .023, sx, .61 + j * .37, sz + .28, '#eecc77', model, false);
      for (let k = 0; k < 5; k++) box(.15, .04, .008, sx - .6 + k * .3, .615 + j * .37, sz + .297, '#f1ecd6', model, false);
    }
    textPanel('おにぎり   ·   お弁当', '', 1.5, .18, sx, 1.65, sz - .165, '#ede2bc', '#576c62');
  }
  // 左侧收银区：终端、咖啡机、关东煮。
  box(1.8, .79, .63, -3.32, .84, .67, '#71978b');
  box(1.94, .085, .7, -3.32, 1.27, .67, '#e4d9bc');
  box(.39, .06, .27, -2.72, 1.34, .64, '#344650');
  const terminal = box(.32, .26, .06, -2.72, 1.49, .61, '#354952'); terminal.rotation.x = -.2;
  box(.24, .16, .012, -2.72, 1.5, .652, '#9dcbb7', model, false, .2);
  box(.35, .51, .31, -3.8, 1.56, .65, '#40514e');
  textPanel('COFFEE', '', .28, .08, -3.8, 1.72, .811, '#2d474a', '#eddcbb');
  cyl(.055, .1, -3.8, 1.39, .84, '#ede3c9');
  box(.48, .09, .35, -3.25, 1.36, .66, '#b6b6a4');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cyl(.05, .045, -3.4 + i * .15, 1.42, .58 + j * .15, '#d7b578');
  box(.5, .21, .015, -3.25, 1.51, .84, glass, model, false);
  textPanel('おでん', '', .4, .13, -3.25, 1.16, 1.027, '#eee1bf', '#9c6045');
  box(.68, 1.88, .055, .93, 1.38, -3.345, '#69867e');
  textPanel('STAFF ONLY', '', .5, .12, .93, 1.75, -3.31, '#69867e', '#e5dfc9');
  cyl(.025, .08, 1.14, 1.34, -3.29, '#d2ccae').rotation.x = Math.PI / 2;
  box(.52, .68, 1.06, 1.08, .8, -.6, '#c1d0bc');
  box(.55, .045, 1.1, 1.08, 1.16, -.6, '#84b3b0');
  box(.42, .02, .91, 1.08, 1.19, -.6, glass, model, false);
  for (let i = 0; i < 3; i++) {
    box(.65, .06, .26, -.9, .64 + i * .25, .82, '#708b82');
    for (let j = 0; j < 4; j++) { const magazine = box(.135, .25, .035, -1.15 + j * .17, .78 + i * .25, .82, productColors[(i + j) % 6]); magazine.rotation.x = -.22; }
  }
  textPanel('新発売', '季節のおいしさ', .51, .7, -3.78, 2.24, 1.467, '#e4b166', '#fff4d5');
  textPanel('夜の、ひと息。', 'HOT COFFEE   ¥120', .55, .69, -1.28, 2.22, 1.467, '#5d9390', '#fff0cd');
  for (const x of [-3, -.65]) box(1.42, .025, .16, x, 2.9, -.8, '#fff0c9', model, false, 1);

  // 贩卖机、伞架与分类垃圾桶。
  box(.83, 1.86, .72, 2.22, 1.18, .72, '#6b9eaa');
  box(.68, 1.19, .035, 2.22, 1.41, 1.1, '#c0ece0', model, true, .5);
  for (let j = 0; j < 3; j++) { products(1.98, 1.02 + j * .31, 1.13, 4, .16, model, true); box(.64, .035, .05, 2.22, 1 + j * .31, 1.17, '#f1eee0'); }
  box(.49, .17, .03, 2.16, .59, 1.095, '#1c3b47');
  box(.12, .23, .04, 2.5, .79, 1.11, '#354a55');
  textPanel('つめたい', '', .65, .15, 2.22, 2.03, 1.1, '#3e7e88', '#ecf6d7');
  for (let i = 0; i < 2; i++) {
    box(.42, .74, .46, -5.01, .62, -.2 - i * .52, i ? '#82948d' : '#6e8c92');
    box(.45, .12, .49, -5.01, 1.03, -.2 - i * .52, '#b0b8aa');
    box(.23, .11, .02, -5.01, 1.02, .055 - i * .52, '#243e47');
    textPanel(i ? 'びん' : 'かん', '', .25, .15, -5.01, .76, .037 - i * .52, '#cad2bd', '#456065');
  }
  box(.49, .1, .35, -4.13, .35, 1.83, '#617a7a');
  for (const x of [-4.35, -3.91]) rod([x, .35, 1.83], [x, .88, 1.83], .018, '#b0bcb1');
  rod([-4.35, .83, 1.83], [-3.91, .83, 1.83], .025, '#a7b7b0');
  for (let i = 0; i < 4; i++) {
    const x = -4.31 + i * .115;
    rod([x, .37, 1.83], [x + .035, 1.24, 1.83], .016, '#aeb9b1');
    const fabric = cyl(.063, .61, x, .67, 1.83, ['#82b4b1', '#c6b49c', '#637c9b', '#b2928b'][i], model, .019, 7); fabric.rotation.z = -.04;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(.044, .012, 6, 12, Math.PI), mat('#c1c6b6')); hook.position.set(x + .078, 1.24, 1.83); model.add(hook);
  }

  // 自行车的轮圈、辐条、三角车架与车篮。
  const bike = new THREE.Group(); bike.position.set(-3.58, .29, 2.52); bike.rotation.y = -.13; model.add(bike);
  const wheelCenters = [-.61, .61];
  for (const x of wheelCenters) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(.36, .034, 8, 32), mat('#23313e')); tire.position.set(x, .37, 0); bike.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.32, .012, 6, 32), mat('#a1b1b0')); rim.position.copy(tire.position); bike.add(rim);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rod([x, .37, 0], [x + Math.cos(a) * .31, .37 + Math.sin(a) * .31, 0], .006, '#899eaa', bike); }
  }
  for (const [a, b] of [ [[-.61,.37,0],[-.2,.87,0]], [[-.2,.87,0],[.04,.39,0]], [[.04,.39,0],[-.61,.37,0]], [[-.2,.87,0],[.45,.91,0]], [[.45,.91,0],[.04,.39,0]], [[.45,.91,0],[.61,.37,0]], [[-.2,.87,0],[-.23,1.04,0]], [[.45,.91,0],[.41,1.18,0]] ]) rod(a,b,.024,'#cb9976',bike);
  box(.27,.055,.17,-.23,1.06,0,'#30454e',bike);
  rod([.41,1.17,-.17],[.41,1.17,.17],.022,'#bac6bf',bike);
  rod([.04,.39,-.13],[.04,.39,.13],.026,'#75878c',bike);
  box(.18,.035,.08,.04,.39,.16,'#1b303b',bike);
  box(.34,.025,.27,.66,.92,0,'#718b8e',bike);
  for(let i=0;i<5;i++) { const x=.5+i*.08; rod([x,.92,.135],[x,1.18,.135],.008,'#a8b8b3',bike); rod([x,.92,-.135],[x,1.18,-.135],.008,'#a8b8b3',bike); }
  for(const z of [-.135,.135]) rod([.49,1.18,z],[.83,1.18,z],.014,'#b7c1b5',bike);
  rod([-.14,.55,0],[-.33,0,.23],.013,'#819296',bike);

  // 巷口后场、空调外机和公告栏。
  box(.65, .68, 1.08, -4.89, .64, -2.5, '#a3ada1');
  const fan = new THREE.Mesh(new THREE.TorusGeometry(.22, .022, 8, 24), mat('#596d73')); fan.rotation.y = Math.PI / 2; fan.position.set(-5.23, .66, -2.5); model.add(fan);
  for(let i=0;i<7;i++) box(.015,.012,.48,-5.24,.46+i*.064,-2.5,'#697b7b',model,false);
  rod([-4.9,.95,-2.9],[-4.9,2.1,-2.9],.028,'#667b79');
  box(.08,1.1,.85,-4.61,1.82,-.55,'#384e55');
  for(let i=0;i<3;i++) { const p=textPanel(['町内会','雨の日','お知らせ'][i],'',.24,.57,-4.657,1.85,-.84+i*.28,['#e4d9b9','#c2d4c8','#d7b7a0'][i],'#526967'); p.rotation.y=-Math.PI/2; }
  for(let i=0;i<5;i++) box(.45,.24,.35,-3.6+i*.5,.55,-4.1,'#6e8a82');
  box(6.1,.12,.2,-1.6,1.3,-5.13,'#697f87');
  for(let x=-4.55;x<1.5;x+=.65) rod([x,.25,-5.13],[x,1.36,-5.13],.026,'#687d85');

  // 路灯、电线杆、悬垂电线与街角护栏。
  cyl(.13,.19,4.88,.15,2.14,'#536571');
  cyl(.063,3.88,4.88,2.11,2.14,'#66868d');
  rod([4.88,4,2.14],[4.5,4.22,2.14],.052,'#789394');
  rod([4.5,4.22,2.14],[4.12,4.22,2.14],.052,'#789394');
  box(.53,.09,.24,4.14,4.19,2.14,'#71898b');
  box(.45,.028,.19,4.14,4.13,2.14,'#ffe6ad',model,false,2);
  light('#ffdeb2',3.1,7,4.14,3.98,2.14);
  cyl(.105,5.5,-5.3,2.96,-3.9,'#74828a');
  cyl(.105,5.05,4.94,2.61,-4.7,'#6c808b');
  for(const [x,z,y] of [[-5.3,-3.9,5.1],[4.94,-4.7,4.8]]) {
    rod([x-.54,y,z],[x+.54,y,z],.055,'#506672');
    for(const offset of [-.43,0,.43]) { cyl(.055,.17,x+offset,y+.13,z,'#a2b5b8'); }
    for(let i=0;i<4;i++) box(.23,.035,.2,x,1.1+i*.16,z,'#ac9b7c');
  }
  for(const off of [-.4,0,.4]) {
    const points=[]; for(let i=0;i<=36;i++) { const t=i/36; points.push(new THREE.Vector3(-5.3+off+10.24*t,5.3-.3*t-.75*Math.sin(Math.PI*t),-3.9-.8*t)); }
    model.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#182936'})));
  }
  const cablePoints=[]; for(let i=0;i<=24;i++) { const t=i/24; cablePoints.push(new THREE.Vector3(-5.3+3*t,4.6-1.15*t-.3*Math.sin(Math.PI*t),-3.9+.55*t)); }
  model.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePoints),edgeMat));
  for(const z of [-1.9,.05]) {
    for(const zz of [z-.63,z+.63]) rod([3.04,.06,zz],[3.04,.8,zz],.037,'#acbdb8');
    rod([3.04,.8,z-.63],[3.04,.8,z+.63],.037,'#a9bdb7');
    rod([3.04,.43,z-.63],[3.04,.43,z+.63],.024,'#829d9e');
    for(const zz of [z-.63,z+.63]) box(.075,.1,.075,3.04,.62,zz,'#dfae67',model,false);
  }
  rod([3.2,.06,3.12],[3.2,2.13,3.12],.032,'#8ca0a9');
  const roadSign=new THREE.Mesh(new THREE.CircleGeometry(.29,32),mat('#527f98')); roadSign.position.set(3.2,1.95,3.14); model.add(roadSign);
  textPanel('一方通行','',.48,.14,3.2,1.95,3.15,'#527f98','#eceddb');
  box(.6,.23,.23,4.7,3.71,-4.6,'#263e49');
  const signals=[]; for(let i=0;i<3;i++) { const s=new THREE.Mesh(new THREE.SphereGeometry(.064,12,8),new THREE.MeshBasicMaterial({color:i===0?'#89d7bd':'#4a6462'})); s.position.set(4.49+i*.21,3.71,-4.47); model.add(s); signals.push(s); }

  // 路面光斑：多层透明绘制，避免镜面把小景切成两半。
  function glowTexture(color) {
    const c=document.createElement('canvas'); c.width=128;c.height=256; const g=c.getContext('2d');
    const gradient=g.createRadialGradient(64,128,0,64,128,112); gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');
    g.fillStyle=gradient;g.fillRect(0,0,128,256); return new THREE.CanvasTexture(c);
  }
  const reflections=[];
  for(const [x,z,w,d,color] of [[-1.3,2.86,6.1,2.5,'#dfc797'],[2.2,2.7,1.1,2.9,'#75c9d1'],[4.13,3.25,1.3,3.1,'#d2b98d'],[-2.5,4.4,2,1,'#5c8199']]) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:glowTexture(color),transparent:true,opacity:.29,depthWrite:false,blending:THREE.AdditiveBlending})); m.rotation.x=-Math.PI/2;m.position.set(x,.074,z);model.add(m);reflections.push(m);
  }
  const puddleMat=new THREE.MeshPhysicalMaterial({color:'#77969f',metalness:.55,roughness:.13,transparent:true,opacity:.19,depthWrite:false});
  for(let i=0;i<35;i++) {
    const x=random()*9.2-4.6,z=random()*2.8+2.55;
    const m=new THREE.Mesh(new THREE.CircleGeometry(.12+random()*.34,24),puddleMat);m.rotation.x=-Math.PI/2;m.scale.set(1.4+random()*1.4,.35+random()*.4,1);m.position.set(x,.063+random()*.002,z);model.add(m);
  }
  for(let i=0;i<58;i++) {
    const x=-4.3+random()*6.2,z=2.18+random()*2;
    const stripe=box(.08+random()*.46,.002,.013+random()*.025,x,.081,z,new THREE.MeshBasicMaterial({color:i%3?'#b7b98e':'#7dd0c8',transparent:true,opacity:.1+random()*.15}),model,false); stripe.rotation.y=random()*.12;
  }
  // 雨丝限制在底座内，屋顶下方不会穿入室内。
  const rainCount=1050,rainPositions=new Float32Array(rainCount*6), rainData=[];
  for(let i=0;i<rainCount;i++) rainData.push({x:random()*11.8-5.9,y:random()*8+.3,z:random()*11.8-5.9,s:4+random()*3});
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#b7d3e1',transparent:true,opacity:.2,depthWrite:false}));rain.frustumCulled=false;model.add(rain);
  const ripples=[];
  for(let i=0;i<54;i++) {
    const m=new THREE.Mesh(new THREE.RingGeometry(.085,.092,24),new THREE.MeshBasicMaterial({color:'#a1c9cd',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.set(random()*11.4-5.7,.085,2.22+random()*3.55);model.add(m);ripples.push({m,phase:random(),speed:.35+random()*.4});
  }
  const drops=[];
  for(let i=0;i<26;i++) { const m=new THREE.Mesh(new THREE.SphereGeometry(.012,5,5),new THREE.MeshBasicMaterial({color:'#b8dce1',transparent:true,opacity:.6}));m.scale.y=2.7;model.add(m);drops.push({m,x:-4.75+random()*6.8,phase:random()}); }
  const glassStreaks=[];
  for(let i=0;i<32;i++) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.008,.06+random()*.13),new THREE.MeshBasicMaterial({color:'#d3edeb',transparent:true,opacity:.16,depthWrite:false}));m.position.set(-4.35+random()*3.6,1+random()*1.8,1.46);model.add(m);glassStreaks.push({m,speed:.025+random()*.065});
  }

  // 无界面手势控制：左键旋转，右键平移，滚轮和双指缩放。
  const view={theta:.61,phi:1.13,radius:24.5,target:new THREE.Vector3(0,1.25,0)};
  const goal={theta:view.theta,phi:view.phi,radius:view.radius};
  const pointers=new Map();let lastPinch=0;
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastPinch=0;});
  canvas.addEventListener('pointermove',e=>{
    const old=pointers.get(e.pointerId);if(!old)return;
    const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const p=[...pointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(lastPinch)goal.radius=Math.max(8,Math.min(39,goal.radius*lastPinch/distance));lastPinch=distance;}
    else if(e.buttons===2 || e.shiftKey){const factor=view.radius*.001;view.target.x-=Math.cos(view.theta)*dx*factor;view.target.z+=Math.sin(view.theta)*dx*factor;view.target.y+=dy*factor;view.target.clamp(new THREE.Vector3(-5,-1,-5),new THREE.Vector3(5,5,5));}
    else{goal.theta-=dx*.006;goal.phi=Math.max(.24,Math.min(1.49,goal.phi+dy*.005));}
  });
  function release(e){pointers.delete(e.pointerId);lastPinch=0;}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('wheel',e=>{e.preventDefault();goal.radius=Math.max(8,Math.min(39,goal.radius*Math.exp(e.deltaY*.001)));},{passive:false});
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  if(innerWidth<700){view.radius=goal.radius=29;}
  const clock=new THREE.Clock();let elapsed=0;
  function animate(){
    requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.045);elapsed+=dt;
    const smooth=1-Math.exp(-dt*10);for(const k of ['theta','phi','radius'])view[k]+=(goal[k]-view[k])*smooth;
    camera.position.set(view.target.x+view.radius*Math.sin(view.phi)*Math.sin(view.theta),view.target.y+view.radius*Math.cos(view.phi),view.target.z+view.radius*Math.sin(view.phi)*Math.cos(view.theta));camera.lookAt(view.target);
    rainData.forEach((r,i)=>{r.y-=r.s*dt;r.x-=dt*.21;const roof=r.x>-4.86&&r.x<2.08&&r.z>-3.81&&r.z<1.77;const floor=roof?3.43:.08;if(r.y<floor){r.y=7.8+random()*.6;r.x=random()*11.8-5.9;}if(r.x< -5.9)r.x=5.9;const n=i*6;rainPositions[n]=r.x;rainPositions[n+1]=r.y;rainPositions[n+2]=r.z;rainPositions[n+3]=r.x+.019;rainPositions[n+4]=r.y+.12+r.s*.012;rainPositions[n+5]=r.z;});rainGeo.attributes.position.needsUpdate=true;
    for(const r of ripples){const t=(elapsed*r.speed+r.phase)%1;r.m.scale.setScalar(.15+t*3.1);r.m.material.opacity=(1-t)*.3;}
    for(const d of drops){const t=(elapsed*.8+d.phase)%1;d.m.position.set(d.x,2.86-t*t*2.64,1.82);}
    for(const s of glassStreaks){s.m.position.y-=dt*s.speed;if(s.m.position.y<.97)s.m.position.y=2.83;}
    const cycle=elapsed%19;const openness=cycle>11&&cycle<16?Math.min(1,(cycle-11)*1.2,(16-cycle)*1.2):0;
    doors[0].position.x=-.015-openness*.9;doors[1].position.x=1.025+openness*.9;
    sign.material.color.setScalar(.97+.03*Math.sin(elapsed*1.3)*(Math.sin(elapsed*12)>.97?.35:1));
    reflections.forEach((m,i)=>m.material.opacity=.25+.025*Math.sin(elapsed*2+i));
    const signalIndex=Math.floor(elapsed/9)%3;signals.forEach((s,i)=>s.material.color.set(i===signalIndex?['#91dfc5','#e1ba6b','#de8272'][i]:'#3b555a'));
    renderer.render(scene,camera);
  }
  animate();
})();
