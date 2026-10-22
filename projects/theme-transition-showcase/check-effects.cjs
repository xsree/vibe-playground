"use strict";

// Dependency-free state/geometry checks; this does not replace visual browser QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const html = read('index.html');
const css = read('showcase.css');
assert.deepEqual([...html.matchAll(/<script src="([^"]+)" defer/g)].map(match => match[1]), ['authored-effects.js', 'craft-effects.js', 'physical-effects.js', 'showcase.js']);
const style = () => ({ setProperty(key, value) { this[key] = value; } });

class Node {
  constructor(tag = 'div') {
    Object.assign(this, {
      tagName: tag, style: style(), dataset: {}, attributes: {}, children: [],
      parts: new Map(), events: new Map(), hidden: false, value: '800',
      clientWidth: 780, clientHeight: 430, classList: { add() {} }
    });
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { if (key === 'style') this.style = style(); else delete this.attributes[key]; }
  append(...nodes) {
    for (const node of nodes) {
      if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node);
      node.parent = this;
      this.children.push(node);
    }
  }
  addEventListener(name, callback) { this.events.set(name, callback); }
  cloneNode() { return new Node(this.tagName); }
  querySelector(selector) {
    if (!this.parts.has(selector)) this.parts.set(selector, new Node());
    return this.parts.get(selector);
  }
  querySelectorAll(selector) {
    if (selector === '[data-zone]') return [0, 1, 2].map(index => this.querySelector(`zone-${index}`));
    return [...this.parts.values()];
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 32, height: 32 }; }
  focus() {}
  scrollIntoView() {}
  getContext() {
    return {
      createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: image => { this.pixels = image.data.slice(); }
    };
  }
  toDataURL() { return `data:image/png;base64,${Buffer.from(this.pixels).toString('base64')}`; }
}

const nodes = new Map();
for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
  const node = new Node();
  const value = match[0].match(/\bvalue="([^"]*)"/);
  if (value) node.value = value[1];
  nodes.set(`#${match[1]}`, node);
}
nodes.get('#scene-template').content = { firstElementChild: new Node() };
nodes.set('.workbench', new Node());
let time = 0, frameId = 0;
const frames = new Map();
const motion = { matches: false, addEventListener() {} };
const sandbox = {
  document: {
    querySelector(selector) { assert(nodes.has(selector), `Missing HTML selector: ${selector}`); return nodes.get(selector); },
    createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag), addEventListener() {}
  },
  window: { matchMedia: () => motion, addEventListener() {} },
  getComputedStyle(node) {
    const block = node.dataset.theme === 'dark'
      ? css.match(/\.scene\[data-theme="dark"\] \{([^}]+)/)[1]
      : css.match(/\.scene \{([^}]+)/)[1];
    return { getPropertyValue(key) { return block.match(new RegExp(`${key}:\\s*(#[a-f0-9]+)`))[1]; } };
  },
  performance: { now: () => time },
  requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
  cancelAnimationFrame: id => frames.delete(id)
};
vm.createContext(sandbox);
vm.runInContext(read('authored-effects.js'), sandbox);
vm.runInContext(read('craft-effects.js'), sandbox);
vm.runInContext(read('physical-effects.js'), sandbox);
vm.runInContext(read('showcase.js') + '\nthis.api = { Demo, effects, mainDemo, gridDemos, selectEffect, grainMask };', sandbox);
const { Demo, effects, mainDemo, gridDemos, selectEffect, grainMask } = sandbox.api;
assert.equal(effects.length, 42);
assert.equal(gridDemos.length, effects.length);
assert.equal(new Set(effects.map(effect => effect.id)).size, effects.length);
assert.equal(nodes.get('#effect-list').children.filter(node => node.className === 'effect-choice').length, 42);
assert.equal(nodes.get('#comparison-grid').children.filter(node => node.className === 'comparison-item').length, 42);
assert.equal(nodes.get('#effect-list').children.filter(node => node.className === 'effect-group').length, 5);

function advance() {
  time += 801;
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach(callback => callback(time));
}
function validate(node, visited = new Set()) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const value of [...Object.values(node.style), ...Object.values(node.attributes)]) {
    if (typeof value === 'string') assert(!/NaN|Infinity|undefined/.test(value), `Invalid geometry: ${value}`);
  }
  [...node.children, ...node.parts.values()].forEach(child => validate(child, visited));
}
function snapshot(node) {
  return JSON.stringify({ hidden: node.hidden, style: node.style, attributes: node.attributes,
    children: node.children.map(snapshot), parts: [...node.parts].map(([key, value]) => [key, snapshot(value)]) });
}

let samples = 0;
for (const effect of effects) {
  const demo = new Demo(new Node(), effect);
  for (const from of ['light', 'dark']) {
    demo.reset(from);
    for (const progress of [0, .01, .15, .25, .49, .5, .51, .75, .98, 1, .5, 0, 1]) {
      demo.scrub(progress);
      samples++;
      assert.equal(demo.progress, progress);
      assert.equal(demo.from, from);
      validate(demo.element);
    }
    demo.scrub(.5);
    const middle = snapshot(demo.element);
    demo.scrub(.1); demo.scrub(.9); demo.scrub(.5);
    assert.equal(snapshot(demo.element), middle, `${effect.id}: scrubbing must reproduce the same frame`);
    demo.sample(1);
    const modified = [...demo.authored.modified];
    demo.commit();
    assert.equal(demo.theme, from === 'light' ? 'dark' : 'light');
    assert(demo.next.hidden && demo.overlay.hidden);
    assert(demo.authored.extras.every(node => node.hidden));
    assert.equal(Object.keys(demo.base.style).length, 1);
    assert(modified.every(node => Object.keys(node.style).length === 1), `${effect.id}: source styles must be cleared`);
    demo.play(true); assert(demo.playing); advance(); assert(!demo.playing && demo.progress === 1);
    demo.reset(from); demo.play(); demo.pause(); assert.equal(frames.size, 0);
    motion.matches = true; demo.play(); assert(!demo.playing && demo.progress === 1); motion.matches = false;
  }
  for (const [width, height] of [[0, 0], [320, 213], [1440, 800]]) {
    demo.reset(); demo.element.clientWidth = width; demo.element.clientHeight = height;
    demo.scrub(.5); validate(demo.element); demo.reset();
    assert(demo.authored.extras.every(node => node.hidden));
  }
}

const enamel = new Demo(new Node(), effects.find(effect => effect.id === 'enamel'));
for (const [width, height] of [[320, 213], [1440, 800]]) {
  enamel.element.clientWidth = width; enamel.element.clientHeight = height;
  enamel.scrub(.5);
  const cells = enamel.authored.enamelLayout.cells;
  assert.equal(cells.length, 12);
  let area = 0;
  for (const { vertices } of cells) {
    assert(vertices.length >= 3);
    assert(vertices.every(([x, y]) => x >= -1e-6 && x <= width+1e-6 && y >= -1e-6 && y <= height+1e-6));
    area += Math.abs(vertices.reduce((sum, [x, y], index) => {
      const next = vertices[(index+1)%vertices.length];
      return sum+x*next[1]-next[0]*y;
    }, 0))/2;
  }
  assert(Math.abs(area-width*height) < width*height*1e-9, 'Enamel cells must cover the full frame');
}
for (const effect of effects.filter(effect => ['weave', 'enamel', 'grating', 'caustic', 'liquid', 'crystal'].includes(effect.id))) {
  const demo = new Demo(new Node(), effect);
  demo.scrub(1);
  assert.equal(demo.next.style.maskImage, 'none', `${effect.id}: remove the completed mask`);
}

function projectMatrix(node,x,y) {
  const m=node.style.transform.slice(9,-1).split(',').map(Number);
  assert.equal(m.length,16);
  const weight=m[3]*x+m[7]*y+m[15];
  const result=[(m[0]*x+m[4]*y+m[12])/weight,(m[1]*x+m[5]*y+m[13])/weight];
  assert(result.every(Number.isFinite),'Projected coordinates must remain finite');
  return result;
}
const ribbon=new Demo(new Node(),effects.find(effect=>effect.id==='mobius'));
for(const [width,height] of [[320,213],[1440,800]]) {
  ribbon.element.clientWidth=width;ribbon.element.clientHeight=height;
  for(const progress of [0,.18,.37,.5,.68,.84,1]) {
    ribbon.scrub(progress);
    const {scenes}=ribbon.authored.sceneGroups.get('mobius');
    for(let index=0;index<scenes.length-1;index++)for(const y of [0,height]) {
      const x=(index+1)*width/scenes.length;
      const a=projectMatrix(scenes[index],x,y),b=projectMatrix(scenes[index+1],x,y);
      assert(Math.hypot(a[0]-b[0],a[1]-b[1])<.01,'Adjacent ribbon corners must stay joined');
    }
    if(progress===0||progress===1)for(let index=0;index<scenes.length;index++)for(const y of [0,height]) {
      const x=index*width/scenes.length,position=projectMatrix(scenes[index],x,y);
      assert(Math.hypot(position[0]-x,position[1]-y)<.01,'Ribbon endpoints must unfold to the original plane');
    }
  }
}
function inside([x,y],vertices) {
  let contained=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
    const a=vertices[i],b=vertices[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])contained=!contained;
  }
  return contained;
}
const crystal=new Demo(new Node(),effects.find(effect=>effect.id==='crystal'));
crystal.scrub(.98);
const maskSvg=decodeURIComponent(crystal.next.style.maskImage.match(/^url\("data:image\/svg\+xml,(.*)"\)$/)[1]);
const facets=[...maskSvg.matchAll(/<path d="([^"]+)" fill="white" transform="translate\(([^)]+)\) scale\(([^)]+)\)/g)].map(match=>{
  const values=match[1].match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number);
  const [cx,cy]=match[2].split(' ').map(Number),scale=Number(match[3]);
  return Array.from({length:values.length/2},(_,index)=>[cx+(values[index*2]-cx)*scale,cy+(values[index*2+1]-cy)*scale]);
});
assert.equal(facets.length,72);
for(let x=0;x<19;x++)for(let y=0;y<13;y++) {
  const sample=[(x+.37)/19*780,(y+.41)/13*430];
  assert(facets.some(vertices=>inside(sample,vertices)),'Grown crystal facets must cover the complete frame');
}
const paperMesh=new Demo(new Node(),effects.find(effect=>effect.id==='origami'));
for(const progress of [0,.23,.5,.79,1]) {
  paperMesh.scrub(progress);
  const {scenes}=paperMesh.authored.sceneGroups.get('origami');
  scenes.forEach((node,index)=>{
    const next=scenes[(index+1)%scenes.length];
    const vertices=scene=>{
      const values=scene.style.clipPath.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number);
      return Array.from({length:values.length/2},(_,i)=>[values[i*2],values[i*2+1]]);
    };
    const shared=vertices(node).filter(a=>vertices(next).some(b=>Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7));
    assert.equal(shared.length,2);
    const depth=(scene,[x,y])=>{
      const matrix=scene.style.transform.slice(9,-1).split(',').map(Number);
      return matrix[2]*x+matrix[6]*y+matrix[14];
    };
    for(const vertex of shared)assert(Math.abs(depth(node,vertex)-depth(next,vertex))<1e-4,'Folded paper must keep shared vertices connected');
    if(progress===0||progress===1)for(const vertex of vertices(node))assert(Math.abs(depth(node,vertex))<1e-6,'Paper mesh must flatten at both endpoints');
  });
}

for (let index = 14; index < effects.length; index++) {
  selectEffect(index);
  nodes.get('#progress').events.get('input')({ target: { value: '50' } });
  assert.equal(mainDemo.effect, effects[index]);
  assert.equal(mainDemo.progress, .5);
  assert(nodes.get('#active-index').textContent.endsWith('/ 42'));
}
const extrasCount=mainDemo.authored.extras.length;
for(let index=32;index<effects.length;index++) {selectEffect(index);mainDemo.scrub(.47);}
assert.equal(mainDemo.authored.extras.length,extrasCount,'Repeated selections must reuse auxiliary scenes');
nodes.get('#show-authored').events.get('click')();
assert.equal(mainDemo.effect.id, 'paper');
nodes.get('#show-craft').events.get('click')();
assert.equal(mainDemo.effect.id, 'iris');
nodes.get('#show-physical').events.get('click')();
assert.equal(mainDemo.effect.id, 'caustic');
nodes.get('#play-all').events.get('click')();
assert(gridDemos.every(demo => demo.playing)); advance();
assert(gridDemos.every(demo => demo.theme === 'dark' && !demo.playing));
nodes.get('#play-all').events.get('click')(); advance();
assert(gridDemos.every(demo => demo.theme === 'light'));
nodes.get('#reset-all').events.get('click')();
assert(gridDemos.every(demo => demo.progress === 0 && demo.overlay.hidden));
assert.equal(grainMask(.5), grainMask(.5));
const alpha = progress => Buffer.from(grainMask(progress).match(/base64,([^\"]+)/)[1], 'base64').filter((_, index) => index % 4 === 3);
assert(alpha(0).every(value => value === 0));
assert(alpha(1).every(value => value === 255));
assert.equal(frames.size, 0);
console.log(`PASS: ${effects.length} effects, ${samples} bidirectional samples; deterministic scrubbing; replay/pause/reset; reduced motion; viewport sizes; tessellation/crystal coverage; ribbon/paper continuity; layer reuse; UI controls and play-all.`);
