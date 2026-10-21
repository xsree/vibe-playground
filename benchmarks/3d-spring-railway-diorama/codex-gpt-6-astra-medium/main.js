import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ======================================================
// CONFIG · metres in a small, carefully arranged world
// ======================================================
const CYCLE = 42;
const STOP_X = -11.2 + 1.72 * (8.6 + 4.2 / 2);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .1, 260);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#scene'), antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const world = new THREE.Group();
scene.add(world);
let seed = 57051;
const rand = (a = 0, b = 1) => { seed = (seed * 1664525 + 1013904223) >>> 0; return a + (b - a) * seed / 4294967296; };
const clamp = THREE.MathUtils.clamp;
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const vec = (x, y, z) => new THREE.Vector3(x, y, z);

// ======================================================
// MATERIALS · chalk, enamel, painted wood, tinted glazing
// ======================================================
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .02, ...extra });
const M = {
  base: mat('#d4d2bc'), rim: mat('#f4edda'), grass: mat('#aaba80'), lawn: mat('#bcca94'),
  hill: [mat('#8eae77'), mat('#9bb782'), mat('#a6be88'), mat('#789b68')],
  stone: mat('#a4aaa2'), concrete: mat('#d5d4bd'), pale: mat('#f8f2df'), white: mat('#f6f5e9'),
  road: mat('#939f9c'), walk: mat('#cdcbb8'), wood: mat('#a87c55'), bark: mat('#795c4d'),
  teal: mat('#528c83'), tealDark: mat('#3d6963'), roof: mat('#668885'), metal: mat('#526768'),
  rail: mat('#7e8989', { metalness: .6, roughness: .34 }), sleeper: mat('#706c61'), ballast: mat('#b7bbb0'),
  glass: mat('#345b63', { roughness: .21, metalness: .3 }), glassLight: mat('#92bbb9', { roughness: .3 }),
  yellow: mat('#edd784'), pink: mat('#e6a5b5'), dark: mat('#35474a'), black: mat('#233033'),
  petals: [mat('#f5c0cf'), mat('#f6cbd5'), mat('#fce0de'), mat('#e9acc2'), mat('#efb7ce')],
  hedge: [mat('#72976c'), mat('#91ac76'), mat('#b4c98b')], red: mat('#d26e62'),
  lamp: mat('#fff6d5', { emissive: '#ffdc96', emissiveIntensity: .45 }),
};
const GEO = { box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.IcosahedronGeometry(1, 1), bloom: new THREE.IcosahedronGeometry(1, 2), cylinder: new THREE.CylinderGeometry(1, 1, 1, 8), leaf: new THREE.IcosahedronGeometry(1, 0) };
for (const material of M.hill) { material.clippingPlanes = [new THREE.Plane(vec(-1, 0, 0), -8.42)]; material.clipShadows = true; }
const staticBuckets = new Map();

// ======================================================
// GEOMETRY HELPERS · static detail is batched by material
// ======================================================
function mesh(geo, material, x, y, z, parent = world) {
  const o = new THREE.Mesh(geo, material);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function box(w, h, d, x, y, z, material, parent = world) {
  const o = mesh(GEO.box, material, x, y, z, parent); o.scale.set(w, h, d); return o;
}
function round(w, h, d, r, x, y, z, material, parent = world) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, r), material, x, y, z, parent);
}
function blob(x, y, z, sx, sy, sz, material, parent = world, geo = GEO.sphere) {
  const o = mesh(geo, material, x, y, z, parent); o.scale.set(sx, sy, sz); o.rotation.set(rand(-.3, .3), rand(0, 6), rand(-.2, .2)); return o;
}
function rod(a, b, radius, material, parent = world) {
  const delta = b.clone().sub(a);
  const o = mesh(GEO.cylinder, material, ...a.clone().add(b).multiplyScalar(.5).toArray(), parent);
  o.scale.set(radius, delta.length(), radius); o.quaternion.setFromUnitVectors(vec(0, 1, 0), delta.normalize()); return o;
}
function wire(points, material = M.dark, radius = .014, parent = world) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => vec(...p))), 24, radius, 4, false), material, 0, 0, 0, parent);
}
function label(text, w, h, x, y, z, options = {}, parent = world) {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w);
  const ctx = c.getContext('2d'); ctx.fillStyle = options.bg || '#f4f0df'; ctx.fillRect(0, 0, c.width, c.height);
  if (options.stripe) { ctx.fillStyle = options.stripe; ctx.fillRect(0, c.height * .72, c.width, c.height * .1); }
  ctx.fillStyle = options.color || '#365852'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(c.height * (options.size || .43))}px "Yu Gothic", "Microsoft YaHei", sans-serif`;
  ctx.fillText(text, c.width / 2, c.height * (options.stripe ? .4 : .51));
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const o = mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: texture, roughness: .8 }), x, y, z, parent);
  if (options.rotation) o.rotation.y = options.rotation;
  return o;
}
function fence(x1, x2, z, y = .15, height = .65, material = M.pale) {
  for (let x = x1; x <= x2; x += .48) box(.075, height, .075, x, y + height / 2, z, material);
  for (const h of [.23, .52]) box(x2 - x1, .065, .06, (x1 + x2) / 2, y + h, z, material);
}
function bench(x, z, parent = world, y = .2) {
  for (let i = 0; i < 4; i++) box(1.35, .06, .075, x, y + .39, z + i * .09, M.wood, parent);
  for (let i = 0; i < 3; i++) box(1.35, .07, .05, x, y + .6 + i * .1, z - .055, M.wood, parent);
  for (const dx of [-.49, .49]) {
    box(.055, .7, .06, x + dx, y + .35, z - .05, M.metal, parent);
    box(.055, .38, .06, x + dx, y + .19, z + .28, M.metal, parent);
  }
}

// ======================================================
// DIORAMA BASE · a floating, layered architectural plinth
// ======================================================
round(30, 1.2, 23, .34, 0, -.68, 0, M.base);
round(30.08, .22, 23.08, .14, 0, -.12, 0, M.rim);
round(29.8, .13, 22.8, .18, 0, .035, 0, M.grass);
box(13.8, .018, .035, 5, -.61, 11.512, M.wood);
label('春 待 ち 駅', 3.35, .42, -6.4, -.62, 11.523, { bg: '#d4d2bc', color: '#6d7560', size: .52 });
label('HARUMACHI  /  05', 2.4, .26, 11.2, -.63, 11.524, { bg: '#d4d2bc', color: '#6d7560' });

// ======================================================
// ROADS · one little level crossing and a quiet backstreet
// ======================================================
box(2.6, .06, 21.9, -5.15, .12, 0, M.road);
box(18.8, .06, 2.3, 4.5, .12, 7.5, M.road);
box(18.8, .1, .5, 4.5, .16, 5.99, M.walk);
box(18.8, .1, .42, 4.5, .16, 9.0, M.walk);
box(.35, .08, 8.5, -6.64, .15, 6.5, M.walk);
box(.35, .08, 7.0, -3.65, .15, -7.2, M.walk);
box(17.8, .04, 1.45, 5.2, .14, -7.1, M.walk);
for (let z = -10; z <= 10; z += 1.7) if (Math.abs(z) > 3) box(.055, .014, .67, -5.15, .16, z, M.white);
for (let x = -2.6; x < 14; x += 1.7) box(.7, .012, .055, x, .16, 7.5, M.white);
for (const z of [-3.8, 3.6]) box(2.25, .018, .12, -5.15, .17, z, M.white);
for (let i = 0; i < 6; i++) box(.16, .014, 1.5, -3.1 + i * .3, .17, 7.5, M.white);
for (let x = -2; x < 14; x += .5) box(.027, .012, .4, x, .219, 6, M.stone);

// ======================================================
// RAILWAY · ballast, fasteners, sleepers, rails, drains
// ======================================================
const trackZ = [-1.55, 1.25];
for (const z of trackZ) {
  box(29.4, .12, 2.35, 0, .17, z, M.ballast);
  for (let x = -14.5; x <= 14.5; x += .38) {
    box(.15, .1, 1.86, x, .27, z, M.sleeper);
    for (const dz of [-.62, .62]) box(.22, .035, .22, x, .34, z + dz, M.dark);
  }
  for (const dz of [-.62, .62]) {
    box(29.5, .11, .072, 0, .365, z + dz, M.rail);
    box(29.5, .035, .14, 0, .42, z + dz, M.rail);
  }
  for (let i = 0; i < 1100; i++) {
    const x = rand(-14.6, 14.6), dz = rand(-1.15, 1.15);
    blob(x, .25, z + dz, rand(.035, .10), rand(.025, .065), rand(.035, .095), i % 3 ? M.ballast : M.stone, world, GEO.leaf);
  }
}
for (const z of [-2.9, 2.6]) {
  box(21.5, .07, .18, 3.1, .14, z, M.stone);
  box(21.5, .02, .085, 3.1, .18, z, M.dark);
  for (let x = -7; x < 14; x += 2) box(.25, .03, .2, x, .2, z, M.concrete);
}
for (const z of trackZ) for (const dz of [-.96, 0, .96]) box(2.6, .07, .42, -5.15, .36, z + dz, M.road);

// ======================================================
// TUNNEL & TERRAIN · faceted ridges, two masonry portals
// ======================================================
function createTunnel(z) {
  const outer = new THREE.Shape();
  outer.moveTo(-1.45, 0); outer.lineTo(-1.45, 1.6); outer.absarc(0, 1.6, 1.45, Math.PI, 0, true); outer.lineTo(1.45, 0);
  outer.lineTo(1.05, 0); outer.lineTo(1.05, 1.58); outer.absarc(0, 1.58, 1.05, 0, Math.PI, false); outer.lineTo(-1.05, 0); outer.closePath();
  const portal = mesh(new THREE.ExtrudeGeometry(outer, { depth: .6, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 1, curveSegments: 20 }), M.concrete, -8.05, .18, z);
  portal.rotation.y = Math.PI / 2;
  const cavity = new THREE.Shape(); cavity.moveTo(-1.08, 0); cavity.lineTo(-1.08, 1.58); cavity.absarc(0, 1.58, 1.08, Math.PI, 0, true); cavity.lineTo(1.08, 0);
  const dark = mesh(new THREE.ShapeGeometry(cavity), mat('#142a28', { side: THREE.DoubleSide }), -8.4, .18, z); dark.rotation.y = Math.PI / 2;
  for (let i = 0; i < 13; i++) {
    const a = (i + .5) / 13 * Math.PI;
    const stone = box(.13, .32, .31, -7.39, 1.78 + Math.sin(a) * 1.26, z + Math.cos(a) * 1.26, i % 2 ? M.stone : M.concrete);
    stone.rotation.x = a - Math.PI / 2;
  }
  for (const dz of [-1.28, 1.28]) for (let i = 0; i < 5; i++) box(.1, .024, .28, -7.38, .4 + i * .28, z + dz, M.stone);
  box(.28, 1.4, .65, -7.9, .88, z - 1.7, M.stone);
  box(.28, 1.4, .65, -7.9, .88, z + 1.7, M.stone);
}
createTunnel(trackZ[0]); createTunnel(trackZ[1]);
// The hillside begins behind the portals, leaving their openings unobstructed.
for (const a of [ [-11.7,1.1,-3.1,3.0,3.5,3.8], [-12,1.4,2.0,2.6,3.7,3.4], [-11.7,.5,-7.2,3,2.5,3.2], [-12.1,.7,6,2.6,2.5,3.7], [-9.9,2.9,-.3,2.1,2,3.4], [-9.6,.5,-5.0,2.2,2.6,2.2] ]) {
  blob(...a, M.hill[Math.floor(rand(0, 4))]);
}
box(2.8, 2.3, 7.1, -10.05, 1.22, -.1, M.hill[0]);
for (let i = 0; i < 28; i++) {
  const x = rand(-14, -8.2), z = rand(-10.5, 10.3);
  if (Math.abs(z) < 3.3) continue;
  blob(x, .3, z, rand(.2, .55), rand(.25, .6), rand(.2, .6), M.stone);
}
for (let i = 0; i < 12; i++) {
  const x = rand(-13.8, -10), z = rand(-8, 7), y = Math.abs(z) < 5 ? rand(3.5, 4.3) : rand(1.5, 2.4);
  rod(vec(x, y, z), vec(x, y + 1.6, z), .07, M.bark);
  for (let j = 0; j < 3; j++) mesh(new THREE.ConeGeometry(.65 - j * .12, .95, 7), M.hedge[j], x, y + .8 + j * .42, z);
}

// ======================================================
// STATION · tactile edges and an open timber canopy
// ======================================================
round(16.2, .52, 2.7, .09, 5.3, .39, -3.65, M.concrete);
box(16.1, .055, 2.61, 5.3, .675, -3.65, M.walk);
box(15.9, .026, .19, 5.3, .718, -2.46, M.yellow);
for (let x = -2.55; x < 13.2; x += .4) {
  box(.36, .11, .14, x, .58, -2.3, M.pale);
  box(.04, .02, .11, x, .736, -2.46, M.wood);
}
for (let x = -2.4; x < 13; x += .8) box(.012, .014, 2.3, x, .712, -3.7, M.stone);
for (let i = 0; i < 4; i++) box(1.3, .14 * (i + 1), .36, -3.2 + i * .32, .07 * (i + 1) + .14, -3.7, M.concrete);
for (const x of [.0, 3.3, 6.6, 9.9]) {
  box(.13, 2.5, .13, x, 1.94, -4.1, M.wood);
  box(.3, .18, .3, x, .77, -4.1, M.stone);
  rod(vec(x, 2.3, -4.1), vec(x, 2.98, -3.3), .06, M.wood);
  rod(vec(x, 2.3, -4.1), vec(x, 2.98, -4.8), .06, M.wood);
  box(.12, .12, 2.75, x, 3.04, -3.7, M.wood);
}
box(11.6, .11, .13, 5, 2.96, -4.12, M.wood);
for (const side of [-1, 1]) {
  const roof = box(12.1, .1, 1.6, 5, 3.27, -3.7 + side * .74, M.roof); roof.rotation.x = side * .13;
  for (let x = -.95; x <= 11; x += .26) { const rib = box(.023, .035, 1.6, x, 3.34, -3.7 + side * .74, M.tealDark); rib.rotation.x = side * .13; }
}
box(12.2, .08, .12, 5, 3.42, -3.7, M.tealDark);
box(12.2, .09, .1, 5, 3.13, -2.18, M.pale);
for (const x of [1.8, 7.4]) {
  rod(vec(x, 3, -2.5), vec(x, 2.65, -2.5), .016, M.metal);
  box(1.8, .5, .07, x, 2.43, -2.5, M.tealDark);
  label('春待ち  Harumachi', 1.7, .4, x, 2.44, -2.455, { stripe: '#70a59b', size: .35 });
}
for (const x of [-1.2, 12.2]) {
  for (const dx of [-.7, .7]) box(.06, 1.45, .06, x + dx, 1.4, -3.7, M.tealDark);
  box(1.6, .62, .09, x, 1.96, -3.7, M.pale);
  label('はるまち', 1.5, .52, x, 1.97, -3.644, { stripe: '#5c9185' });
}
bench(3, -4.5, world, .7); bench(8.5, -4.5, world, .7);
fence(-2.6, 13.3, -5.04, .7, .7, M.tealDark);

function vending(x, z, color = M.red, ground = .71) {
  round(.68, 1.3, .52, .06, x, ground + .65, z, color);
  box(.54, .63, .025, x, ground + .87, z + .268, M.pale);
  for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) {
    box(.074, .115, .035, x - .18 + k * .12, ground + .67 + j * .2, z + .29, [M.teal, M.yellow, M.pink, M.white][(k + j) % 4]);
    box(.07, .022, .03, x - .18 + k * .12, ground + .595 + j * .2, z + .293, M.glass);
  }
  box(.38, .12, .03, x - .04, ground + .23, z + .27, M.dark);
  box(.08, .14, .035, x + .22, ground + .43, z + .285, M.dark);
  label('DRINKS', .5, .11, x, ground + 1.23, z + .272, { bg: '#e9ddd0', size: .65 });
}
vending(5.3, -4.65); vending(6.1, -4.65, M.white);
for (const x of [10.4, 10.85]) {
  round(.32, .65, .35, .035, x, 1.035, -4.6, M.teal);
  box(.2, .09, .02, x, 1.22, -4.416, M.black);
}

// ======================================================
// BUILDINGS · gables, tile seams, sashes, little balconies
// ======================================================
function createHouse(x, z, w, d, h, wall, roofMat, facing = 0, station = false) {
  const g = new THREE.Group(); g.position.set(x, .17, z); g.rotation.y = facing; world.add(g);
  box(w + .12, .22, d + .12, 0, .11, 0, M.stone, g);
  box(w, h, d, 0, h / 2 + .2, 0, wall, g);
  const rise = w * .3;
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rise); tri.closePath();
  mesh(new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), wall, 0, h + .2, -d / 2, g);
  for (const side of [-1, 1]) {
    const rw = Math.hypot(w / 2 + .23, rise);
    const r = box(rw, .12, d + .5, side * (w / 4 + .1), h + .2 + rise / 2, 0, roofMat, g); r.rotation.z = -side * Math.atan2(rise, w / 2 + .23);
    for (let zz = -d / 2 - .2; zz < d / 2 + .3; zz += .19) {
      const rib = box(rw, .027, .025, side * (w / 4 + .1), h + .275 + rise / 2, zz, roofMat, g); rib.rotation.z = r.rotation.z;
    }
  }
  box(.14, .12, d + .58, 0, h + .27 + rise, 0, roofMat, g);
  box(w + .4, .14, .1, 0, h + .08, d / 2 + .2, M.wood, g);
  const floors = h > 2.7 ? [1, 2.5] : [1.2];
  for (const yy of floors) for (const xx of [-w * .28, w * .28]) {
    box(.82, .88, .08, xx, yy, d / 2 + .04, M.pale, g);
    box(.70, .74, .018, xx, yy, d / 2 + .088, M.glass, g);
    box(.035, .76, .025, xx, yy, d / 2 + .103, M.wood, g);
    box(.74, .035, .025, xx, yy, d / 2 + .103, M.wood, g);
    box(.93, .075, .17, xx, yy - .48, d / 2 + .07, M.wood, g);
  }
  for (const side of [-1, 1]) for (const zz of [-d * .24, d * .24]) {
    box(.06, .7, .74, side * (w / 2 + .015), h * .58, zz, M.pale, g);
    box(.025, .6, .64, side * (w / 2 + .052), h * .58, zz, M.glassLight, g);
    box(.03, .63, .03, side * (w / 2 + .07), h * .58, zz, M.wood, g);
  }
  box(.66, 1.42, .07, 0, .9, d / 2 + .05, M.wood, g);
  box(.48, .76, .025, 0, 1.08, d / 2 + .095, M.glass, g);
  box(.04, .1, .05, .21, .77, d / 2 + .12, M.yellow, g);
  box(1.2, .11, .65, 0, 1.82, d / 2 + .25, roofMat, g);
  box(1.1, .14, .6, 0, .15, d / 2 + .25, M.concrete, g);
  rod(vec(-w / 2 + .08, .3, d / 2 + .1), vec(-w / 2 + .08, h + .1, d / 2 + .1), .035, M.metal, g);
  box(.5, .34, .25, w / 2 + .15, .55, -.4, M.pale, g);
  for (let i = 0; i < 5; i++) box(.03, .22, .025, w / 2 + .29, .55, -.48 + i * .045, M.metal, g);
  if (h > 2.7) {
    box(1.25, .1, .55, w * .25, 2.05, d / 2 + .25, M.concrete, g);
    for (let i = 0; i < 7; i++) box(.04, .47, .04, w * .25 - .55 + i * .18, 2.3, d / 2 + .5, M.metal, g);
    box(1.25, .045, .045, w * .25, 2.55, d / 2 + .5, M.metal, g);
  }
  if (station) label('春 待 ち 駅', 2, .42, 0, h - .26, d / 2 + .085, { bg: '#f4edda', color: '#456c63' }, g);
  return g;
}
createHouse(5.0, -6, 3.9, 1.75, 2.25, M.pale, M.tealDark, 0, true);
createHouse(-.9, -9.05, 2.5, 2.65, 3.25, mat('#e9d9c0'), M.roof);
createHouse(9.1, -9.15, 2.8, 2.6, 2.45, mat('#e7e5d3'), mat('#88829a'));
createHouse(12.5, -8.8, 2.1, 2.8, 3.0, mat('#d8e3d3'), M.tealDark);
createHouse(1, 4.45, 2.7, 2.05, 2.75, mat('#f0e5d5'), mat('#a1776a'), 0);
createHouse(12.4, 4.35, 2.6, 2.1, 3.15, mat('#eddbca'), M.roof);
// Shop curtain and fabric awning.
for (let i = 0; i < 5; i++) box(.45, .42, .035, .1 + i * .45, 1.65, 5.52, i % 2 ? M.pale : M.teal);
label('喫 茶  は な', 1.7, .35, 1, 2.1, 5.535, { bg: '#eae0c8', color: '#795b45' });

// ======================================================
// CHERRY TREES · branching silhouettes, many petal lobes
// ======================================================
const crowns = [];
function createCherryTree(x, z, s = 1, ground = .15) {
  const tree = new THREE.Group(); tree.position.set(x, ground, z); tree.rotation.y = rand(0, 6.28); tree.scale.setScalar(s); world.add(tree);
  rod(vec(0, 0, 0), vec(.08, 1.8, .04), .115, M.bark, tree);
  rod(vec(.08, .9, .04), vec(-.46, 2.1, .14), .075, M.bark, tree);
  rod(vec(.04, 1.1, 0), vec(.55, 2.25, -.2), .07, M.bark, tree);
  const crown = new THREE.Group(); tree.add(crown); crowns.push({ o: crown, phase: rand(0, 6) });
  const clusters = [[0, 2.8, 0, .9], [-.75, 2.38, .08, .74], [.72, 2.55, -.2, .79], [.1, 2.42, .68, .68], [-.12, 2.68, -.65, .72], [-.5, 3.1, -.2, .65], [.53, 3.02, .36, .72]];
  for (let j = 0; j < clusters.length; j++) {
    const [cx, cy, cz, r] = clusters[j];
    rod(vec(.06, 1.65, 0), vec(cx, cy - .3, cz), .038, M.bark, tree);
    blob(cx, cy, cz, r, r * .72, r * .86, M.petals[j % 5], crown, GEO.bloom);
    for (let k = 0; k < 8; k++) {
      const a = rand(0, 6.28), yy = rand(-.48, .5), rr = Math.sqrt(1 - yy * yy);
      blob(cx + Math.cos(a) * r * rr * .8, cy + yy * r, cz + Math.sin(a) * r * rr * .8, r * .28, r * .23, r * .28, M.petals[Math.floor(rand(0, 5))], crown);
    }
  }
  const planter = mesh(new THREE.CylinderGeometry(.52, .6, .14, 12), M.concrete, 0, .07, 0, tree);
  for (let i = 0; i < 14; i++) blob(rand(-1.2, 1.2), .015, rand(-1.1, 1.1), .065, .016, .04, M.petals[i % 5], tree, GEO.leaf);
}
for (const p of [[-7.1,5.4,1.2],[-8.6,8.9,1.15],[-11.9,9.4,1.3],[-2.45,3.75,1.04],[-2.9,-9.8,.93],[14,8.4,1.12],[9.4,-5.9,1.0],[-1.3,10.0,1.15],[5.8,9.9,1.05],[12.4,10.0,1.1],[-7.0,-6.2,1.15],[2.6,-9.8,1.1],[6.0,-9.7,.9],[13.4,-5.6,1.02],[-1.7,-5.65,.9]]) createCherryTree(...p);

// ======================================================
// CROSSING · alternating lamps and a lifting mechanism
// ======================================================
const crossingLights = [], barriers = [];
function createCrossing(z, direction) {
  const x = -5.15 + direction * 1.3;
  box(.42, .27, .42, x, .27, z, M.concrete);
  rod(vec(x, .3, z), vec(x, 2.6, z), .065, M.yellow);
  for (let i = 0; i < 7; i++) box(.135, .13, .135, x, .52 + i * .28, z, M.dark);
  for (const r of [-Math.PI / 4, Math.PI / 4]) { const b = box(.88, .13, .095, x, 2.58, z, M.yellow); b.rotation.z = r; }
  box(.92, .22, .15, x, 2.08, z, M.dark);
  for (const dx of [-.28, .28]) {
    const red = mat('#6e3534', { emissive: '#ff3423', emissiveIntensity: 0 });
    const lamp = mesh(new THREE.CylinderGeometry(.12, .12, .1, 16), red, x + dx, 2.09, z + .12); lamp.rotation.x = Math.PI / 2;
    const visor = box(.3, .055, .24, x + dx, 2.25, z + .1, M.dark);
    crossingLights.push({ material: red, phase: dx > 0 ? 0 : Math.PI });
  }
  box(.3, .66, .38, x, .61, z + .38, M.yellow);
  const pivot = new THREE.Group(); pivot.position.set(x, 1, z + .38); world.add(pivot);
  const length = 2.36;
  box(length, .1, .1, -direction * length / 2, 0, 0, M.yellow, pivot);
  for (let i = 0; i < 8; i++) box(.14, .105, .105, -direction * (.12 + i * .3), 0, 0, M.dark, pivot);
  barriers.push({ o: pivot, direction });
}
createCrossing(3.12, 1); createCrossing(-3.25, -1);

// ======================================================
// UTILITY POLES · slim wires with a little sag
// ======================================================
for (const x of [-6.7, -.6, 6.0, 12.8]) {
  for (const z of [-2.95, 2.75]) {
    rod(vec(x, .15, z), vec(x, 4.1, z), .065, M.metal);
    box(.28, .34, .28, x, .31, z, M.concrete);
  }
  rod(vec(x, 4.06, -2.95), vec(x, 4.06, 2.75), .052, M.metal);
  rod(vec(x, 3.55, -2.95), vec(x, 4.06, -2.2), .035, M.metal);
  rod(vec(x, 3.55, 2.75), vec(x, 4.06, 2), .035, M.metal);
  for (const z of trackZ) {
    rod(vec(x, 4.08, z), vec(x, 3.73, z), .029, M.dark);
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(.07, .07, .045, 8), M.pale, x, 3.9 + i * .065, z);
  }
}
for (const z of trackZ) {
  const xs = [-14.5, -6.7, -.6, 6, 12.8, 14.6];
  for (let i = 0; i < xs.length - 1; i++) {
    wire([[xs[i], 4.14, z], [(xs[i] + xs[i + 1]) / 2, 3.84, z], [xs[i + 1], 4.14, z]], M.dark, .011);
    wire([[xs[i], 3.72, z], [xs[i + 1], 3.72, z]], M.metal, .009);
    for (let x = xs[i] + 1; x < xs[i + 1]; x += 1.2) rod(vec(x, 3.72, z), vec(x, 3.9, z), .008, M.dark);
  }
}
const streetPoles = [-3.25, 3.8, 10.0];
for (const x of streetPoles) {
  rod(vec(x, .15, 8.92), vec(x, 4.75, 8.92), .075, M.wood);
  box(.14, .14, 1.15, x, 4.43, 8.92, M.wood);
  for (const dz of [-.44, 0, .44]) { rod(vec(x, 4.4, 8.92 + dz), vec(x, 4.75, 8.92 + dz), .03, M.metal); blob(x, 4.7, 8.92 + dz, .09, .12, .09, M.pale); }
  mesh(new THREE.CylinderGeometry(.18, .18, .48, 12), M.stone, x + .14, 3.9, 8.92);
}
for (let i = 0; i < streetPoles.length - 1; i++) for (const dz of [-.44, .44]) wire([[streetPoles[i], 4.74, 8.92 + dz], [(streetPoles[i] + streetPoles[i + 1]) / 2, 4.17, 8.92 + dz], [streetPoles[i + 1], 4.74, 8.92 + dz]], M.dark, .012);

// ======================================================
// ENVIRONMENT DETAILS · bicycle shelter, gardens, people
// ======================================================
function bike(x, z, color, angle = 0) {
  const g = new THREE.Group(); g.position.set(x, .19, z); g.rotation.y = angle; world.add(g);
  for (const xx of [-.38, .38]) {
    mesh(new THREE.TorusGeometry(.26, .025, 5, 18), M.dark, xx, .27, 0, g);
    mesh(new THREE.TorusGeometry(.225, .012, 4, 18), M.rail, xx, .27, 0, g);
    for (let j = 0; j < 6; j++) rod(vec(xx, .27, 0), vec(xx + Math.cos(j * Math.PI / 3) * .23, .27 + Math.sin(j * Math.PI / 3) * .23, 0), .006, M.rail, g);
  }
  const a = vec(-.38, .27, 0), b = vec(-.12, .62, 0), c = vec(.03, .27, 0), d = vec(.27, .64, 0), e = vec(.38, .27, 0);
  for (const [p, q] of [[a,b],[b,c],[a,c],[b,d],[c,d],[d,e]]) rod(p, q, .021, color, g);
  box(.21, .055, .13, -.12, .7, 0, M.bark, g);
  rod(d, vec(.26, .83, 0), .019, M.rail, g); rod(vec(.26, .83, -.14), vec(.26, .83, .14), .017, M.dark, g);
  box(.25, .18, .25, .4, .68, 0, M.concrete, g);
}
box(3.35, .08, 1.5, 5.0, .19, 3.38, M.walk);
for (const x of [3.45, 6.55]) for (const z of [2.95, 3.95]) rod(vec(x, .2, z), vec(x, 1.85, z), .037, M.metal);
const shelterRoof = box(3.6, .07, 1.55, 5, 1.88, 3.4, M.glassLight); shelterRoof.rotation.x = -.12;
for (let i = 0; i < 4; i++) bike(3.9 + i * .72, 3.55, i % 2 ? M.red : M.teal, Math.PI / 2);
bench(8.1, 9.5); bench(-10, 10.2);
function person(x, y, z, coat, angle = 0) {
  const g = new THREE.Group(); g.position.set(x,y,z); g.rotation.y = angle; world.add(g);
  const legs=[];
  for (const dx of [-.08,.08]) {
    const leg=new THREE.Group();leg.position.set(dx,.4,0);g.add(leg);legs.push(leg);
    rod(vec(0,-.34,0),vec(0,0,0),.045,M.dark,leg);box(.09,.07,.17,0,-.35,.04,M.dark,leg);
  }
  mesh(new THREE.CylinderGeometry(.12,.15,.35,8),coat,0,.54,0,g);
  blob(0,.86,0,.11,.13,.11,M.wood,g);
  blob(0,.93,-.015,.12,.07,.115,M.bark,g);
  rod(vec(-.13,.67,0),vec(-.18,.4,.03),.038,coat,g); rod(vec(.13,.67,0),vec(.18,.43,.03),.038,coat,g);
  box(.14,.22,.11,.2,.35,.03,M.wood,g);
  g.userData.legs=legs;return g;
}
person(-2.9,.2,6.2,M.teal,.8); person(7.9,.2,9.9,M.red,1.3);
const passengers=Array.from({length:6},(_,i)=>{
  const doorX=STOP_X-Math.floor(i/2)*3.65+(i%2?-.8:.8);
  const o=person(doorX,.73,-3.13,[M.teal,M.pink,M.pale,M.red,M.yellow,M.roof][i]);
  o.userData.animated=true;
  return {o,doorX,waitZ:-3.13-(i%2)*.22};
});
function lamp(x, z, base = .15) {
  rod(vec(x,base,z),vec(x,base+2.8,z),.038,M.tealDark);
  rod(vec(x,base+2.8,z),vec(x+.4,base+2.8,z),.035,M.tealDark);
  box(.5,.09,.2,x+.27,base+2.79,z,M.tealDark);
  box(.36,.025,.14,x+.27,base+2.733,z,M.lamp);
}
lamp(-2.4,-4.7,.7); lamp(12.8,-4.7,.7); lamp(7.9,6.05); lamp(-2.8,9.0); lamp(13.7,9);
for (const [x,z] of [[-6.7,3.6],[-3.25,-5.4],[12.9,2.9]]) {
  box(.45,.74,.39,x,.53,z,M.concrete);
  box(.025,.65,.43,x+.23,.55,z,M.stone);
  for(let i=0;i<5;i++) box(.28,.025,.012,x,.55+i*.07,z+.203,M.metal);
}
for (const [x,z] of [[-3.2,2.65],[13.2,-2.75]]) {
  rod(vec(x,.16,z),vec(x,2.45,z),.045,M.metal);
  round(.29,.69,.22,.12,x,2.29,z,M.dark);
  for(const [dy,col] of [[.17,'#c76f61'],[-.17,'#b8d5ad']]) {
    const signal=mesh(new THREE.CylinderGeometry(.082,.082,.035,12),mat(col,{emissive:col,emissiveIntensity:.25}),x,2.29+dy,z+.125); signal.rotation.x=Math.PI/2;
  }
}
fence(-2.8,13.9,2.87,.14,.6,M.pale);
fence(-2.5,13.9,-10.7,.14,.7,M.wood);
fence(-2.6,13.9,10.93,.14,.65,M.pale);
for (let x = -2.4; x < 14; x += 1.7) { box(.08,.53,.08,x,.44,6.13,M.pale); box(1.6,.07,.06,x+.75,.65,6.13,M.pale); }
for (const [x,z,w] of [[-1,9.45,2.5],[9.2,10.1,2.2],[2.8,-8,1.5],[8.5,5.65,1.0],[-7.2,8.9,1]]) {
  box(w,.22,.5,x,.25,z,M.wood); box(w-.1,.04,.4,x,.38,z,M.bark);
  for(let i=0;i<Math.floor(w*8);i++) { const xx=x+rand(-w/2+.08,w/2-.08),zz=z+rand(-.16,.16); rod(vec(xx,.38,zz),vec(xx,.58,zz),.012,M.hedge[0]); blob(xx,.59,zz,.07,.065,.07,i%2?M.yellow:M.petals[i%5],world,GEO.leaf); }
}
for (let i=0;i<155;i++) {
  const x=rand(-14,14),z=rand(-10.7,10.7);
  if (Math.abs(z)<3 || (x>-6.8&&x<-3.4) || (z>6&&z<9.2) || (x>-3&&z<-6) || (z>3&&z<6&&x>-3)) continue;
  blob(x,.24,z,rand(.13,.35),rand(.15,.4),rand(.15,.34),M.hedge[i%3],world,GEO.leaf);
  for(let j=0;j<3;j++) rod(vec(x+j*.06,.16,z),vec(x+.07+j*.06,.35+rand(0,.1),z+.04),.012,M.hedge[0]);
}
// A convex mirror and quiet streetside notices.
rod(vec(-3.45,.2,5.8),vec(-3.45,2,5.8),.035,M.red);
const mirror=mesh(new THREE.CylinderGeometry(.25,.25,.05,20),M.red,-3.45,2.05,5.8); mirror.rotation.x=Math.PI/2;
const silver=mesh(new THREE.CircleGeometry(.21,20),M.glassLight,-3.45,2.05,5.832);
rod(vec(13.5,.15,6),vec(13.5,1.8,6),.027,M.metal);
label('止まれ',.42,.42,13.5,1.65,6.02,{bg:'#b6675d',color:'#fff2dc',size:.33});

// ======================================================
// TRAIN · three carriages, glazing, bogies, pantographs
// ======================================================
const train = new THREE.Group(); world.add(train);
const trainDoors=[];
const trainMaterials = new Map();
function tm(material) {
  if (!trainMaterials.has(material)) {
    const copy=material.clone(); copy.clippingPlanes=[new THREE.Plane(vec(1,0,0),8.32),new THREE.Plane(vec(-1,0,0),14.85)]; copy.clipShadows=true; trainMaterials.set(material,copy);
  }
  return trainMaterials.get(material);
}
function createTrain() {
  for(let i=0;i<3;i++) {
    const car=new THREE.Group(); car.position.x=-i*3.65; train.add(car);
    round(3.42,1.32,1.46,.19,0,1.38,0,M.white,car);
    round(3.31,.24,1.42,.10,0,2.07,0,M.concrete,car);
    box(3.2,.21,1.2,0,.72,0,M.dark,car);
    for(const z of [-.735,.735]) {
      box(3.13,.14,.025,0,1.17,z,M.teal,car);
      box(3.13,.065,.025,0,1.32,z,M.pink,car);
      for(const x of [-1.15,-.43,.43,1.15]) {
        round(.54,.5,.033,.055,x,1.65,z,M.glass,car);
        box(.018,.44,.012,x-.15,1.65,z+Math.sign(z)*.02,M.glassLight,car);
      }
      for(const x of [-.8,.8]) {
        box(.51,1.06,.025,x,1.36,z+Math.sign(z)*.045,M.black,car);
        for(const side of [-1,1]) {
          const door=new THREE.Group();door.position.set(x+side*.125,0,z+Math.sign(z)*.085);car.add(door);
          door.userData.animated=true;
          box(.25,1.04,.04,0,1.36,0,M.concrete,door);
          box(.19,.41,.023,0,1.64,Math.sign(z)*.035,M.glass,door);
          box(.24,.14,.024,0,1.17,Math.sign(z)*.035,M.teal,door);
          box(.24,.065,.024,0,1.32,Math.sign(z)*.035,M.pink,door);
          trainDoors.push({o:door,closedX:door.position.x,side,platform:z<0});
        }
      }
      box(.3,.16,.027,0,1.45,z+Math.sign(z)*.025,M.tealDark,car);
    }
    for(const x of [-1.06,1.06]) {
      box(.69,.22,.94,x,.56,0,M.dark,car);
      for(const dx of [-.23,.23]) for(const z of [-.52,.52]) {
        const wheel=mesh(new THREE.CylinderGeometry(.19,.19,.11,12),M.dark,x+dx,.48,z,car); wheel.rotation.x=Math.PI/2;
        const hub=mesh(new THREE.CylinderGeometry(.095,.095,.12,10),M.rail,x+dx,.48,z,car); hub.rotation.x=Math.PI/2;
      }
    }
    for(const x of [-.8,.8]) {
      round(.67,.17,.8,.04,x,2.26,0,M.stone,car);
      for(let j=0;j<5;j++) box(.48,.015,.028,x,2.354,-.25+j*.12,M.metal,car);
    }
    for(const sign of [-1,1]) {
      round(.04,.65,1.15,.09,sign*1.711,1.65,0,M.glass,car);
      box(.035,.56,.045,sign*1.739,1.64,0,M.pale,car);
      box(.04,.11,1.19,sign*1.731,1.20,0,M.teal,car);
      box(.04,.055,1.2,sign*1.73,1.31,0,M.pink,car);
      box(.04,.13,.64,sign*1.734,1.98,0,M.dark,car);
      for(const z of [-.47,.47]) {
        box(.049,.13,.16,sign*1.74,1.0,z,sign>0&&i===0?M.lamp:M.red,car);
        rod(vec(sign*1.75,1.42,z*.6),vec(sign*1.75,1.65,z*.6-.12),.012,M.dark,car);
      }
      box(.17,.15,.38,sign*1.8,.63,0,M.dark,car);
    }
    if(i<2) {
      round(.26,.8,.88,.06,-1.83,1.24,0,M.dark,car);
      for(let j=0;j<5;j++) box(.023,.83,.91,-1.73-j*.048,1.24,0,M.metal,car);
    }
    if(i===1) {
      for(const z of [-.3,.3]) {
        rod(vec(-.25,2.25,z),vec(.1,2.67,z),.019,M.dark,car);
        rod(vec(.1,2.67,z),vec(-.25,3.26,z),.019,M.dark,car);
      }
      box(.22,.05,.95,-.25,3.28,0,M.dark,car);
    }
  }
  train.traverse(o=>{ if(o.isMesh) o.material=tm(o.material); });
}
createTrain(); train.position.set(-12,.13,trackZ[0]);

// ======================================================
// STATIC BATCHING · preserve detail without draw-call cost
// ======================================================
// Leave the train and gently moving tree crowns independent.
world.updateMatrixWorld(true);
const animatedCrowns = new Set(crowns.map(c=>c.o));
const toRemove=[];
world.traverse(o=>{
  if(!o.isMesh || o.material.map) return;
  let p=o.parent; while(p&&p!==world) { if(p===train || p.userData.animated || animatedCrowns.has(p) || barriers.some(b=>b.o===p)) return; p=p.parent; }
  if(!staticBuckets.has(o.material)) staticBuckets.set(o.material,[]);
  const geometry=o.geometry.clone(); geometry.applyMatrix4(o.matrixWorld);
  if(geometry.index) { const non=geometry.toNonIndexed(); geometry.dispose(); staticBuckets.get(o.material).push(non); }
  else staticBuckets.get(o.material).push(geometry);
  toRemove.push(o);
});
for(const o of toRemove) o.removeFromParent();
for(const [material,geometries] of staticBuckets) {
  const merged=mergeGeometries(geometries,false);
  if(merged) { const o=mesh(merged,material,0,0,0); o.name='batched scenery'; }
  for(const g of geometries) g.dispose();
}
// The individual crown meshes share geometries; merge each crown's lobes by colour.
for(const {o:crown} of crowns) {
  const bins=new Map();
  for(const child of [...crown.children]) {
    child.updateMatrix(); let g=child.geometry.clone(); g.applyMatrix4(child.matrix);
    if(g.index) { const n=g.toNonIndexed();g.dispose();g=n; }
    if(!bins.has(child.material)) bins.set(child.material,[]); bins.get(child.material).push(g); child.removeFromParent();
  }
  for(const [m,gs] of bins) { mesh(mergeGeometries(gs),m,0,0,0,crown);gs.forEach(g=>g.dispose()); }
}
// Merge each train material in train-local coordinates while retaining clipping.
train.updateMatrixWorld(true);
for(const material of trainMaterials.values()) {
  const gs=[],remove=[]; const inv=train.matrixWorld.clone().invert();
  train.traverse(o=>{if(o.isMesh&&o.material===material&&!o.parent.userData.animated) { let g=o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}gs.push(g);remove.push(o); }});
  remove.forEach(o=>o.removeFromParent());
  if(gs.length) { mesh(mergeGeometries(gs),material,0,0,0,train);gs.forEach(g=>g.dispose()); }
}

// ======================================================
// PETALS · a restrained drift, individual 3D silhouettes
// ======================================================
const petalShape=new THREE.Shape(); petalShape.moveTo(0,-.065);petalShape.quadraticCurveTo(.08,.005,.025,.065);petalShape.lineTo(0,.043);petalShape.lineTo(-.024,.065);petalShape.quadraticCurveTo(-.065,.01,0,-.065);
const petalMaterial=mat('#f8c7d3',{side:THREE.DoubleSide});
const PETAL_COUNT=360;
const petalMesh=new THREE.InstancedMesh(new THREE.ShapeGeometry(petalShape,3),petalMaterial,PETAL_COUNT);petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);petalMesh.frustumCulled=false;scene.add(petalMesh);
const petalData=Array.from({length:PETAL_COUNT},()=>({x:rand(-13,14),y:rand(.2,7),z:rand(-9,10),speed:rand(.13,.28),phase:rand(0,6.28),scale:rand(.65,1.45)}));
const dummy=new THREE.Object3D();
function updatePetals(t) {
  petalData.forEach((p,i)=>{
    dummy.position.set(p.x+Math.sin(t*.26+p.phase)*.55, .25+((p.y-t*p.speed)%7+7)%7,p.z+Math.sin(t*.18+p.phase)*.42);
    dummy.rotation.set(t*.5+p.phase,t*.35+p.phase,Math.sin(t*.6+p.phase));dummy.scale.setScalar(p.scale);dummy.updateMatrix();petalMesh.setMatrixAt(i,dummy.matrix);
  });petalMesh.instanceMatrix.needsUpdate=true;
}

// ======================================================
// LIGHTING · warm afternoon key and cool open-sky fill
// ======================================================
scene.add(new THREE.AmbientLight('#fff0df',.5));
scene.add(new THREE.HemisphereLight('#e5f4ff','#9f9575',2.1));
const sun=new THREE.DirectionalLight('#ffebcb',3.5);sun.position.set(-12,25,15);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.camera.near=1;sun.shadow.camera.far=75;
sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;sun.target.position.set(0,0,0);scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight('#d0e8ed',.7);fill.position.set(12,9,-15);scene.add(fill);

// ======================================================
// CAMERA · freely inspect the miniature from the first frame
// ======================================================
const controls=new OrbitControls(camera,renderer.domElement);
controls.enabled=true;controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=true;
controls.minDistance=3;controls.maxDistance=180;controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI*.495;
controls.screenSpacePanning=true;
let elapsed=0,environmentTime=0,last=performance.now();
function updateTrain(t) {
  const phase=t%CYCLE;
  t=phase;
  // Constant speed before braking; a quadratic distance curve reaches zero velocity.
  const start=3.6, brake=12.2, stop=16.4, speed=1.72;
  let distance=0;
  if(t>start&&t<=brake) distance=(t-start)*speed;
  else if(t>brake) {const dt=clamp(t-brake,0,stop-brake);distance=(brake-start)*speed+speed*(dt-dt*dt/(2*(stop-brake)));}
  train.position.x=-11.2+distance;
  if(t>25) {
    const dt=Math.min(t-25,13);
    // Smooth acceleration, then a steady departure; reset only beyond the plinth.
    train.position.x=STOP_X+(dt<4?.3*dt*dt:4.8+(dt-4)*2.4);
  }
  const doorOpen=smooth((t-16.8)/.9)*(1-smooth((t-23.4)/1.1));
  for(const door of trainDoors) door.o.position.x=door.closedX+(door.platform?door.side*.245*doorOpen:0);
  const gateOpen=smooth((t-16.1)/1.9)*(1-smooth((t-39.8)/1.8));
  for(const b of barriers) b.o.rotation.z=b.direction*gateOpen*Math.PI*.46;
  for(const l of crossingLights) l.material.emissiveIntensity=t<16.3||t>39.8?(Math.sin(t*7+l.phase)>0?2.1:.08):0;
  updatePassengers(phase);
}
function updatePassengers(t) {
  passengers.forEach((p,i)=>{
    const o=p.o;
    const boardingStart=18+i*.42;
    const boardingEnd=boardingStart+1.8;
    const arrivalStart=31+i*.38;
    const arrivalEnd=arrivalStart+6;
    o.visible=t<boardingEnd||t>=arrivalStart;
    let walking=false;
    if(t<boardingStart) {
      o.position.set(p.doorX,.73,p.waitZ);o.rotation.y=0;
    } else if(t<boardingEnd) {
      const u=smooth((t-boardingStart)/1.8);
      o.position.set(p.doorX,.73+smooth((u-.55)/.4)*.12,THREE.MathUtils.lerp(p.waitZ,-1.94,u));
      o.rotation.y=0;walking=true;
    } else if(t>=arrivalStart) {
      const u=smooth((t-arrivalStart)/6);
      // Walk from the platform's access stairs, then turn into a door queue.
      const from=vec(-3.65,.18,-3.7),step=vec(-2.55,.73,-3.7),end=vec(p.doorX,.73,p.waitZ);
      if(u<.18)o.position.lerpVectors(from,step,u/.18);
      else o.position.lerpVectors(step,end,(u-.18)/.82);
      o.rotation.y=u<.98?Math.PI/2:0;walking=t<arrivalEnd;
    }
    // Passengers enter the dark doorway before becoming occluded inside the car.
    const stride=walking?Math.sin(t*10+i)*.38:0;
    o.userData.legs[0].rotation.x=stride;o.userData.legs[1].rotation.x=-stride;
    if(walking)o.position.y+=Math.abs(Math.sin(t*10+i))*.018;
  });
}
function resetView() {
  const p=vec(33,29,38),target=vec(0,.4,0);
  const portrait=Math.max(1,1.15/camera.aspect);
  if(portrait>1) p.sub(target).multiplyScalar(Math.min(portrait,2.8)).add(target);
  // Clear any remaining damping before placing the camera at the overview.
  controls.enableDamping=false;controls.reset();camera.position.copy(p);controls.target.copy(target);controls.update();controls.saveState();controls.enableDamping=true;
}
function resize() {
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:1.8));renderer.setSize(innerWidth,innerHeight);
}
addEventListener('resize',resize);
renderer.domElement.addEventListener('dblclick',resetView);
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')resetView();});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#error').textContent='图形上下文已暂停，请刷新页面恢复场景。';document.querySelector('#error').hidden=false;});
resetView();updateTrain(0);
document.querySelector('#hint').classList.add('visible');
function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.max(0,(now-last)/1000);last=now;
  if(document.hidden)return;
  environmentTime+=dt;
  elapsed=(elapsed+dt)%CYCLE;updateTrain(elapsed);
  controls.update();
  if(!reducedMotion) {
    updatePetals(environmentTime);
    for(const c of crowns) c.o.rotation.z=Math.sin(environmentTime*.5+c.phase)*.006;
  }
  renderer.render(scene,camera);
}
updatePetals(0);requestAnimationFrame(animate);

