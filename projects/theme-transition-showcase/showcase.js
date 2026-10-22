"use strict";

const effects = [
  { id: 'circle', name: '圆形扩散', en: 'CIRCULAR REVEAL', tag: '当前画廊', short: '从按钮中心扩散', description: '当前画廊的效果：新主题从右上角的日月按钮向外展开。' },
  { id: 'colors', name: '柔和渐变', en: 'COLOR INTERPOLATION', tag: '轻柔克制', short: '每一种颜色慢慢变化', description: '背景、文字和插画各自缓缓变色，轮廓始终清晰，没有叠影。' },
  { id: 'fade', name: '交叉淡化', en: 'CROSS DISSOLVE', tag: '整幅叠化', short: '两幅画面交叉淡入淡出', description: '新画面逐渐显现，旧画面逐渐隐去；中途是两幅主题的叠加。' },
  { id: 'sweep', name: '柔边扫光', en: 'SOFT LIGHT SWEEP', tag: '推荐试试', short: '柔和的光幕扫过', description: '一道有宽阔柔边的光幕扫过。切到深色从右向左，浅色反向。' },
  { id: 'diagonal', name: '斜向擦除', en: 'DIAGONAL WIPE', tag: '干净利落', short: '沿一条斜线切换', description: '新旧主题沿清晰的斜向边界交接，像将一张新纸铺到画面上。' },
  { id: 'curtain', name: '帘幕开合', en: 'CENTER CURTAIN', tag: '左右对称', short: '从中间向两侧打开', description: '新主题从画面中心向两侧展开，像一道对称打开的帘幕。' },
  { id: 'stagger', name: '分区错峰', en: 'STAGGERED ZONES', tag: '依次换光', short: '页头、内容、页脚依次变化', description: '页头先变色，内容区随后，最后是页脚。拖动进度看各区域的时间差。' },
  { id: 'blinds', name: '百叶条带', en: 'VENETIAN BLINDS', tag: '鲜明节奏', short: '多条横向色带同时打开', description: '多条横向的“百叶窗”同时展开，新主题逐条替换旧主题。' },
  { id: 'blur', name: '模糊溶解', en: 'BLUR DISSOLVE', tag: '朦胧柔焦', short: '先虚化，再重新清晰', description: '画面在交接时轻微失焦，再以新主题重新清晰；与普通淡化对比更明显。' }
];

const $ = selector => document.querySelector(selector);
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - Math.pow(1 - clamp(value), 3);
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionAllowed = false;
const colorProperties = ['--scene-bg', '--scene-ink', '--scene-muted', '--scene-line', '--scene-accent', '--sky', '--sun', '--far', '--near', '--front', '--river'];

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
    element.append(this.base, this.next, this.toggle);
    this.palettes = { light: palette(this.base), dark: palette(this.next) };
    this.next.hidden = true;
    this.updateToggle();
    this.toggle.addEventListener('click', () => this.playing ? this.pause() : this.play());
  }

  clearStyles() {
    for (const node of [this.base, this.next]) {
      node.removeAttribute('style');
      node.querySelectorAll('[data-zone], .land-sun, .land-moon-cutout, .land-birds').forEach(child => child.removeAttribute('style'));
    }
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
    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    const dark = this.to === 'dark';
    const next = this.next;
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
  $('#active-index').textContent = `STUDY ${String(index + 1).padStart(2, '0')} / 09`;
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
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'effect-choice';
  button.innerHTML = `<span class="effect-number">${String(index + 1).padStart(2, '0')}</span><span><span class="effect-name">${effect.name}</span><span class="effect-en">${effect.en}</span></span><span class="choice-arrow" aria-hidden="true">↗</span>`;
  button.addEventListener('click', () => selectEffect(index));
  $('#effect-list').append(button);
  choiceButtons.push(button);

  const article = document.createElement('article');
  article.className = 'comparison-item';
  article.innerHTML = `<div class="comparison-item-heading"><span class="effect-number">${String(index + 1).padStart(2, '0')}</span><h3>${effect.name}</h3><span class="effect-en">${effect.en}</span></div><div class="demo"></div><div class="comparison-item-footer"><p>${effect.short}</p><button class="inspect-button" type="button">放大试映 ↗</button></div>`;
  $('#comparison-grid').append(article);
  const demo = new Demo(article.querySelector('.demo'), effect);
  gridDemos.push(demo);
  article.querySelector('.inspect-button').addEventListener('click', () => selectEffect(index, true));
});

$('#play-main').addEventListener('click', () => mainDemo.playing ? mainDemo.pause() : mainDemo.play());
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
