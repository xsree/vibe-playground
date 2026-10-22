"use strict";

const effects = [
  { id: 'circle', name: '圆形扩散', en: 'CIRCULAR REVEAL', tag: '径向展开', short: '从按钮中心扩散', description: '新主题从右上角的日月按钮向外展开。' },
  { id: 'colors', name: '柔和渐变', en: 'COLOR INTERPOLATION', tag: '当前画廊', short: '每一种颜色慢慢变化', description: '当前画廊采用的效果：背景、文字等各自缓缓变色；此示例的插画也会连续变形，没有叠影。' },
  { id: 'fade', name: '交叉淡化', en: 'CROSS DISSOLVE', tag: '整幅叠化', short: '两幅画面交叉淡入淡出', description: '新画面逐渐显现，旧画面逐渐隐去；中途是两幅主题的叠加。' },
  { id: 'sweep', name: '柔边扫光', en: 'SOFT LIGHT SWEEP', tag: '推荐试试', short: '柔和的光幕扫过', description: '一道有宽阔柔边的光幕扫过。切到深色从右向左，浅色反向。' },
  { id: 'diagonal', name: '斜向擦除', en: 'DIAGONAL WIPE', tag: '干净利落', short: '沿一条斜线切换', description: '新旧主题沿清晰的斜向边界交接，像将一张新纸铺到画面上。' },
  { id: 'curtain', name: '帘幕开合', en: 'CENTER CURTAIN', tag: '左右对称', short: '从中间向两侧打开', description: '新主题从画面中心向两侧展开，像一道对称打开的帘幕。' },
  { id: 'stagger', name: '分区错峰', en: 'STAGGERED ZONES', tag: '依次换光', short: '页头、内容、页脚依次变化', description: '页头先变色，内容区随后，最后是页脚。拖动进度看各区域的时间差。' },
  { id: 'blinds', name: '百叶条带', en: 'VENETIAN BLINDS', tag: '鲜明节奏', short: '多条横向色带同时打开', description: '多条横向的“百叶窗”同时展开，新主题逐条替换旧主题。' },
  { id: 'blur', name: '模糊溶解', en: 'BLUR DISSOLVE', tag: '朦胧柔焦', short: '先虚化，再重新清晰', description: '画面在交接时轻微失焦，再以新主题重新清晰；与普通淡化对比更明显。' },
  { id: 'push', name: '整页推移', en: 'SLIDING PUSH', tag: '空间位移', short: '新旧画面相接着移出移入', description: '新主题将旧主题整幅推走，像两张相邻的画纸。切到深色向左推，浅色向右推。' },
  { id: 'flip', name: '卡片翻面', en: 'PERSPECTIVE FLIP', tag: '立体转场', short: '转过背面，换一种光', description: '整张界面绕竖轴翻转，带着透视和侧面的明暗变化；转到背面时呈现另一种主题。' },
  { id: 'grain', name: '颗粒溶解', en: 'GRAIN DISSOLVE', tag: '逐点显现', short: '固定颗粒逐渐换成新主题', description: '细小颗粒按固定的随机顺序切换，逐渐拼成新主题。拖回同一进度，颗粒的位置也完全相同。' },
  { id: 'ripple', name: '水波折射', en: 'RIPPLE REFRACTION', tag: '流动光线', short: '波纹扩散，画面轻轻扭曲', description: '一圈水波从画面中央展开，带出新主题；波动期间画面轻微折射，波纹远去后恢复平静。' },
  { id: 'exposure', name: '曝光过渡', en: 'EXPOSURE FADE', tag: '光线换场', short: '经过暗场或亮场再进入新主题', description: '切到深色时先沉入暗场，切到浅色时先漫入亮场，再显出目标主题。中间停在一片纯粹的光或暗。' },
  ...window.AUTHORED_EFFECTS,
  ...window.CRAFT_EFFECTS,
  ...window.PHYSICAL_EFFECTS
];

const $ = selector => document.querySelector(selector);
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - Math.pow(1 - clamp(value), 3);
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionAllowed = false;
let demoSequence = 0;
const colorProperties = ['--scene-bg', '--scene-ink', '--scene-muted', '--scene-line', '--scene-accent', '--sky', '--sun', '--far', '--near', '--front', '--river'];

// Share one fixed texture and cache so scrubbing never re-rolls the grain.
const grainMasks = new Map();
let grainCanvas;
let grainPixels;
const grainRanks = new Uint8Array(160 * 100);
let grainSeed = 1729;
for (let index = 0; index < grainRanks.length; index++) {
  grainSeed ^= grainSeed << 13;
  grainSeed ^= grainSeed >>> 17;
  grainSeed ^= grainSeed << 5;
  grainRanks[index] = (grainSeed >>> 0) % 64;
}

function grainMask(progress) {
  const step = Math.round(clamp(progress) * 64);
  if (grainMasks.has(step)) return grainMasks.get(step);
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 160;
    grainCanvas.height = 100;
    grainPixels = grainCanvas.getContext('2d').createImageData(160, 100);
  }
  for (let index = 0; index < grainRanks.length; index++) {
    const offset = index * 4;
    grainPixels.data[offset] = grainPixels.data[offset + 1] = grainPixels.data[offset + 2] = 255;
    grainPixels.data[offset + 3] = grainRanks[index] < step ? 255 : 0;
  }
  grainCanvas.getContext('2d').putImageData(grainPixels, 0, 0);
  const mask = `url("${grainCanvas.toDataURL()}")`;
  grainMasks.set(step, mask);
  return mask;
}

function setMask(node, mask) {
  node.style.maskImage = mask;
  node.style.webkitMaskImage = mask;
}

function palette(node) {
  const style = getComputedStyle(node);
  return Object.fromEntries(colorProperties.map(name => {
    const hex = style.getPropertyValue(name).trim().slice(1);
    return [name, [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16))];
  }));
}

function mixColors(node, from, to, progress) {
  for (const property of colorProperties) {
    const rgb = from[property].map((value, index) => Math.round(value + (to[property][index] - value) * progress));
    node.style.setProperty(property, `rgb(${rgb.join(',')})`);
  }
}

function mixLandscape(node, darkness) {
  node.querySelector('.land-sun').style.transform = `translate(${-28 * darkness}px, ${-10 * darkness}px) scale(${1 - .24 * darkness})`;
  node.querySelector('.land-moon-cutout').style.opacity = darkness;
  node.querySelector('.land-birds').style.opacity = 1 - .85 * darkness;
}

class Demo {
  constructor(element, effect, onChange = () => {}) {
    this.element = element;
    this.effect = effect;
    this.onChange = onChange;
    this.theme = 'light';
    this.progress = 0;
    this.prepared = false;
    this.playing = false;
    this.frame = null;
    this.lastFrom = null;
    this.id = `study-wave-${++demoSequence}`;
    this.base = $('#scene-template').content.firstElementChild.cloneNode(true);
    this.next = this.base.cloneNode(true);
    this.base.classList.add('scene-base');
    this.next.classList.add('scene-next');
    this.base.setAttribute('aria-hidden', 'true');
    this.next.setAttribute('aria-hidden', 'true');
    this.next.dataset.theme = 'dark';
    this.toggle = document.createElement('button');
    this.toggle.type = 'button';
    this.toggle.className = 'preview-toggle';
    this.toggle.dataset.dark = 'false';
    this.toggle.innerHTML = '<svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg><svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M20.3 14.5A8.6 8.6 0 0 1 9.5 3.7a8.6 8.6 0 1 0 10.8 10.8Z"/><path d="m18 3 .5 1.5L20 5l-1.5.5L18 7l-.5-1.5L16 5l1.5-.5Z"/></svg>';
    this.overlay = document.createElement('div');
    this.overlay.className = 'effect-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.hidden = true;
    element.append(this.base, this.next, this.overlay, this.toggle);
    this.palettes = { light: palette(this.base), dark: palette(this.next) };
    this.authored = new window.PhysicalTransitionLayer(this, { mixColors, mixLandscape });
    this.next.hidden = true;
    this.updateToggle();
    this.toggle.addEventListener('click', () => this.playing ? this.pause() : this.play());
  }

  clearStyles() {
    this.authored.reset();
    this.overlay.hidden = true;
    this.overlay.removeAttribute('style');
    for (const node of [this.base, this.next]) {
      node.removeAttribute('style');
      node.querySelectorAll('[data-zone], .land-sun, .land-moon-cutout, .land-birds').forEach(child => child.removeAttribute('style'));
    }
  }

  ensureWaveFilter() {
    if (this.waveDisplacement) return;
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.classList.add('effect-definitions');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    const defs = document.createElementNS(namespace, 'defs');
    const filter = document.createElementNS(namespace, 'filter');
    filter.id = this.id;
    for (const [name, value] of Object.entries({ x: '-8%', y: '-12%', width: '116%', height: '124%', 'color-interpolation-filters': 'sRGB' })) filter.setAttribute(name, value);
    const noise = document.createElementNS(namespace, 'feTurbulence');
    for (const [name, value] of Object.entries({ type: 'fractalNoise', baseFrequency: '.012 .06', numOctaves: '1', seed: '8', result: 'waves' })) noise.setAttribute(name, value);
    this.waveDisplacement = document.createElementNS(namespace, 'feDisplacementMap');
    for (const [name, value] of Object.entries({ in: 'SourceGraphic', in2: 'waves', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' })) this.waveDisplacement.setAttribute(name, value);
    filter.append(noise, this.waveDisplacement);
    defs.append(filter);
    svg.append(defs);
    this.element.append(svg);
  }

  updateToggle() {
    const dark = (this.prepared && this.progress > 0 ? this.to : this.theme) === 'dark';
    this.toggle.dataset.dark = String(dark);
    this.toggle.setAttribute('aria-label', `${this.effect.name}：${this.playing ? '暂停动画' : '切换明暗'}`);
    this.toggle.title = this.playing ? '暂停动画' : '切换明暗';
  }

  prepare(from = this.theme) {
    this.pause(false);
    this.clearStyles();
    this.from = from;
    this.to = from === 'light' ? 'dark' : 'light';
    this.lastFrom = from;
    this.base.dataset.theme = from;
    this.next.dataset.theme = this.to;
    this.next.hidden = false;
    this.prepared = true;
    this.progress = 0;
    this.sample(0);
  }

  sample(raw) {
    if (!this.prepared) this.prepare(this.lastFrom ?? this.theme);
    this.progress = clamp(raw);
    const p = ease(this.progress);
    const width = Math.max(1, this.element.clientWidth);
    const height = Math.max(1, this.element.clientHeight);
    const dark = this.to === 'dark';
    const next = this.next;
    const t = this.progress * this.progress * (3 - 2 * this.progress);
    switch (this.effect.id) {
      case 'circle': {
        const box = this.toggle.getBoundingClientRect();
        const stage = this.element.getBoundingClientRect();
        const x = box.left + box.width / 2 - stage.left;
        const y = box.top + box.height / 2 - stage.top;
        const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
        next.style.clipPath = `circle(${radius * p}px at ${x}px ${y}px)`;
        break;
      }
      case 'colors':
        next.hidden = true;
        mixColors(this.base, this.palettes[this.from], this.palettes[this.to], p);
        mixLandscape(this.base, dark ? p : 1 - p);
        break;
      case 'fade':
        next.style.opacity = p;
        break;
      case 'sweep': {
        const mask = `linear-gradient(to ${dark ? 'left' : 'right'}, #000 ${p * 140 - 40}%, transparent ${p * 140}%)`;
        next.style.maskImage = mask;
        next.style.webkitMaskImage = mask;
        break;
      }
      case 'diagonal':
        next.style.clipPath = dark
          ? `polygon(${100 - p * 150}% 0, 100% 0, 100% 100%, ${150 - p * 150}% 100%)`
          : `polygon(0 0, ${p * 150}% 0, ${p * 150 - 50}% 100%, 0 100%)`;
        break;
      case 'curtain':
        next.style.clipPath = `inset(0 ${(1 - p) * 50}%)`;
        break;
      case 'stagger':
        next.hidden = true;
        mixColors(this.base, this.palettes[this.from], this.palettes[this.to], p);
        this.base.querySelectorAll('[data-zone]').forEach((zone, index) => {
          mixColors(zone, this.palettes[this.from], this.palettes[this.to], ease((this.progress - index * .2) / .6));
        });
        {
          const contentProgress = ease((this.progress - .2) / .6);
          mixLandscape(this.base, dark ? contentProgress : 1 - contentProgress);
        }
        break;
      case 'blinds': {
        const band = height / 9;
        const mask = `repeating-linear-gradient(to bottom, #000 0px, #000 ${Math.max(0, band * p - .01)}px, transparent ${band * p}px, transparent ${band}px)`;
        next.style.maskImage = mask;
        next.style.webkitMaskImage = mask;
        break;
      }
      case 'blur': {
        const blur = Math.sin(Math.PI * this.progress) * width * .012;
        next.style.opacity = p;
        next.style.filter = `blur(${blur}px)`;
        this.base.style.filter = `blur(${blur}px)`;
        break;
      }
      case 'push': {
        const direction = dark ? -1 : 1;
        this.base.style.transform = `translateX(${direction * p * 100}%)`;
        next.style.transform = `translateX(${-direction * (1 - p) * 100}%)`;
        break;
      }
      case 'flip': {
        const direction = dark ? -1 : 1;
        const perspective = Math.max(1, width * 1.8);
        for (const node of [this.base, next]) {
          node.style.backfaceVisibility = 'hidden';
          node.style.filter = `brightness(${1 - .28 * Math.sin(Math.PI * t)})`;
        }
        this.base.style.transform = `perspective(${perspective}px) rotateY(${direction * t * 180}deg)`;
        next.style.transform = `perspective(${perspective}px) rotateY(${-direction * (1 - t) * 180}deg)`;
        break;
      }
      case 'grain':
        setMask(next, grainMask(t));
        next.style.maskSize = next.style.webkitMaskSize = '100% 100%';
        next.style.maskRepeat = next.style.webkitMaskRepeat = 'no-repeat';
        break;
      case 'ripple': {
        this.ensureWaveFilter();
        const strength = Math.sin(Math.PI * this.progress);
        this.waveDisplacement.setAttribute('scale', String(width * .035 * strength));
        this.base.style.filter = next.style.filter = `url(#${this.id})`;
        const band = width * .018;
        const radius = (Math.hypot(width / 2, height / 2) + band * 2) * t;
        setMask(next, this.progress === 1 ? 'none' : `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, radius - band)}px, transparent ${radius + band}px)`);
        next.style.opacity = this.progress === 0 ? '0' : '1';
        this.overlay.hidden = false;
        this.overlay.style.opacity = String(strength * .65);
        this.overlay.style.backgroundImage = `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, radius - band)}px, #d9f3eeb3 ${radius}px, transparent ${radius + band}px)`;
        break;
      }
      case 'exposure':
        next.style.opacity = this.progress < .5 ? '0' : '1';
        this.overlay.hidden = false;
        this.overlay.style.backgroundColor = dark ? '#0b1712' : '#fffcf2';
        this.overlay.style.opacity = String(1 - Math.abs(2 * t - 1));
        break;
      default:
        this.authored.sample(this.effect.id, { progress: this.progress, t, width, height, dark });
    }
    this.updateToggle();
    this.onChange(this);
  }

  commit() {
    this.theme = this.to;
    this.clearStyles();
    this.base.dataset.theme = this.theme;
    this.next.hidden = true;
    this.prepared = false;
    this.progress = 1;
    this.playing = false;
    this.frame = null;
    this.updateToggle();
    this.onChange(this);
  }

  play(replay = false) {
    this.pause(false);
    if (!replay && this.prepared && this.progress >= 1) this.commit();
    if (replay) this.prepare(this.lastFrom ?? this.theme);
    else if (!this.prepared || this.progress >= 1) this.prepare();
    if (motionPreference.matches && !motionAllowed) {
      this.sample(1);
      this.commit();
      return;
    }
    const duration = Number($('#duration').value);
    const start = performance.now() - this.progress * duration;
    this.playing = true;
    this.updateToggle();
    const step = now => {
      this.sample((now - start) / duration);
      if (this.progress < 1) this.frame = requestAnimationFrame(step);
      else this.commit();
    };
    this.frame = requestAnimationFrame(step);
    this.onChange(this);
  }

  pause(notify = true) {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.playing = false;
    this.updateToggle();
    if (notify) this.onChange(this);
  }

  scrub(progress) {
    this.pause(false);
    this.sample(progress);
  }

  reset(theme = 'light') {
    this.pause(false);
    this.clearStyles();
    this.theme = theme;
    this.from = theme;
    this.to = theme === 'light' ? 'dark' : 'light';
    this.lastFrom = null;
    this.progress = 0;
    this.prepared = false;
    this.base.dataset.theme = theme;
    this.next.hidden = true;
    this.updateToggle();
    this.onChange(this);
  }
}

function updateMainControls(demo) {
  $('#progress').value = demo.progress * 100;
  $('#progress-value').value = `${Math.round(demo.progress * 100)}%`;
  $('#playback-state').textContent = demo.playing ? '播放中' : demo.progress === 1 ? '已完成' : demo.prepared ? '已暂停' : '就绪';
  const target = demo.prepared ? demo.progress >= 1 ? demo.from : demo.to : demo.theme === 'light' ? 'dark' : 'light';
  $('#play-label').textContent = demo.playing ? '暂停动画' : demo.prepared && demo.progress < 1 ? '继续播放' : `切换到${target === 'dark' ? '深色' : '浅色'}`;
  const from = demo.prepared ? demo.from : demo.lastFrom ?? demo.theme;
  $('#direction-label').textContent = from === 'light' ? '浅色 → 深色' : '深色 → 浅色';
}

const mainDemo = new Demo($('#main-demo'), effects[0], updateMainControls);
const gridDemos = [];
const choiceButtons = [];

function selectEffect(index, focusStage = false) {
  mainDemo.pause(false);
  mainDemo.effect = effects[index];
  mainDemo.reset();
  choiceButtons.forEach((button, i) => button.setAttribute('aria-current', String(index === i)));
  $('#active-index').textContent = `STUDY ${String(index + 1).padStart(2, '0')} / ${String(effects.length).padStart(2, '0')}`;
  $('#active-title').textContent = effects[index].name;
  $('#active-tag').textContent = effects[index].tag;
  $('#active-description').textContent = effects[index].description;
  if (focusStage) {
    $('#active-title').setAttribute('tabindex', '-1');
    $('#active-title').focus({ preventScroll: true });
    $('.workbench').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
  }
}

effects.forEach((effect, index) => {
  const group = { 0: '基础过渡 / 01—09', 9: '空间与纹理 / 10—14', 14: '材质与叙事 / 15—22', 22: '工艺与显像 / 23—32', 32: '物理与空间 / 33—42' }[index];
  if (group) {
    const label = document.createElement('p');
    label.className = 'effect-group';
    label.textContent = group;
    $('#effect-list').append(label);
    const heading = document.createElement('h3');
    heading.className = 'comparison-group';
    heading.textContent = group;
    $('#comparison-grid').append(heading);
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'effect-choice';
  button.innerHTML = `<span class="effect-number">${String(index + 1).padStart(2, '0')}</span><span><span class="effect-name">${effect.name}</span><span class="effect-en">${effect.en}</span></span><span class="choice-arrow" aria-hidden="true">↗</span>`;
  button.addEventListener('click', () => selectEffect(index));
  $('#effect-list').append(button);
  choiceButtons.push(button);

  const article = document.createElement('article');
  article.className = 'comparison-item';
  article.id = `study-${effect.id}`;
  article.innerHTML = `<div class="comparison-item-heading"><span class="effect-number">${String(index + 1).padStart(2, '0')}</span><h3>${effect.name}</h3><span class="effect-en">${effect.en}</span></div><div class="demo"></div><div class="comparison-item-footer"><p>${effect.short}</p><button class="inspect-button" type="button">放大试映 ↗</button></div>`;
  $('#comparison-grid').append(article);
  const demo = new Demo(article.querySelector('.demo'), effect);
  gridDemos.push(demo);
  article.querySelector('.inspect-button').addEventListener('click', () => selectEffect(index, true));
});

$('#play-main').addEventListener('click', () => mainDemo.playing ? mainDemo.pause() : mainDemo.play());
$('#show-authored').addEventListener('click', () => selectEffect(14, true));
$('#show-craft').addEventListener('click', () => selectEffect(22, true));
$('#show-physical').addEventListener('click', () => selectEffect(32, true));
$('#replay-main').addEventListener('click', () => mainDemo.play(true));
$('#progress').addEventListener('input', event => mainDemo.scrub(Number(event.target.value) / 100));
$('#duration').addEventListener('input', event => {
  $('#duration-value').value = `${event.target.value} ms`;
});
let comparisonDark = false;
$('#play-all').addEventListener('click', () => {
  gridDemos.forEach(demo => {
    demo.reset(comparisonDark ? 'dark' : 'light');
    demo.play();
  });
  comparisonDark = !comparisonDark;
  $('#play-all').textContent = comparisonDark ? '全部切回浅色 ↗' : '播放全部 ↗';
});
$('#reset-all').addEventListener('click', () => {
  gridDemos.forEach(demo => demo.reset());
  comparisonDark = false;
  $('#play-all').textContent = '播放全部 ↗';
});

function updateMotionPreference() {
  $('#motion-notice').hidden = !motionPreference.matches || motionAllowed;
  if (motionPreference.matches && !motionAllowed) [mainDemo, ...gridDemos].forEach(demo => demo.pause());
}
$('#allow-motion').addEventListener('click', () => { motionAllowed = true; updateMotionPreference(); });
motionPreference.addEventListener('change', updateMotionPreference);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) [mainDemo, ...gridDemos].forEach(demo => demo.pause());
});
let resizeFrame = null;
window.addEventListener('resize', () => {
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    [mainDemo, ...gridDemos].filter(demo => demo.prepared && !demo.playing).forEach(demo => demo.sample(demo.progress));
    resizeFrame = null;
  });
});
selectEffect(0);
updateMotionPreference();
