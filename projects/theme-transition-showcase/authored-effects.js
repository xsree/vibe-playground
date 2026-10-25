"use strict";

(() => {
  const namespace = 'http://www.w3.org/2000/svg';

  // Math & geometry utility helpers
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const phase = (start, end, value) => smooth((value - start) / (end - start));
  const number = value => Number(value.toFixed(3));
  const point = ([x, y]) => `${number(x)} ${number(y)}`;
  const polygon = points => `M${points.map(point).join('L')}Z`;

  /**
   * Helper to create an SVG element with given namespace and attributes.
   */
  const svgNode = (name, attributes = {}) => {
    const node = document.createElementNS(namespace, name);
    for (const [key, value] of Object.entries(attributes)) {
      node.setAttribute(key, String(value));
    }
    return node;
  };

  /**
   * Global transition handler registry for O(1) effect dispatching.
   * Maps effect ID -> handler(stage, frame).
   */
  const TRANSITION_REGISTRY = new Map();
  window.TRANSITION_REGISTRY = TRANSITION_REGISTRY;
  window.registerTransitionHandler = (id, handler) => {
    TRANSITION_REGISTRY.set(id, handler);
  };

  /**
   * 8 Authored Transition Effects Metadata
   */
  window.AUTHORED_EFFECTS = [
    {
      id: 'paper',
      name: '纸页卷角',
      en: 'PAPER CURL',
      tag: '柔软纸面',
      short: '弯曲纸边与随行投影',
      description: '右上角的纸面逐渐卷开，弯曲的纸背与投影沿折痕移动，露出另一种主题。',
      mode: 'container'
    },
    {
      id: 'eclipse',
      name: '日蚀投影',
      en: 'ECLIPSE SHADOW',
      tag: '光线叙事',
      short: '半影经过，山川先换光',
      description: '柔软的半影掠过界面，山川先进入新的光线，文字与细线随后回应；日月也在同一画面中连续变化。',
      mode: 'scene'
    },
    {
      id: 'lens',
      name: '玻璃透镜',
      en: 'GLASS LENS',
      tag: '透明折射',
      short: '透镜放大，留下另一种光',
      description: '透明透镜滑过画面，镜内的文字与山景被轻微放大；弧形镜缘带着细微反光，身后留下新主题。',
      mode: 'container'
    },
    {
      id: 'silk',
      name: '丝绸换光',
      en: 'SILK ILLUMINATION',
      tag: '曲面光泽',
      short: '宽阔褶皱携着光泽流动',
      description: '宽阔的曲面褶皱缓缓流过，亮脊、柔影与反光一起移动，让新主题顺着丝绸的起伏展开。',
      mode: 'container'
    },
    {
      id: 'contour',
      name: '等高线涌动',
      en: 'CONTOUR FLOW',
      tag: '地形韵律',
      short: '沿山景长出有序曲线',
      description: '从山景附近长出疏密有序的地形曲线，新主题沿不规则的等高边界展开，线条随涌动逐渐消隐。',
      mode: 'container'
    },
    {
      id: 'glyph',
      name: '字形开幕',
      en: 'TYPOGRAPHIC REVEAL',
      tag: '编辑海报',
      short: '光与夜成为主题的窗口',
      description: '巨大的「夜」或「光」成为新主题的窗口；字形舒展开来，轮廓轻轻退去，最后让整个画面归于完整。',
      mode: 'container'
    },
    {
      id: 'spatial',
      name: '空间换景',
      en: 'SPATIAL PARALLAX',
      tag: '景深层次',
      short: '前景与远山在不同深度移动',
      description: '文字、画框、远山与近景以不同幅度轻微移动，像镜头转入同一空间的另一种光线，结束时各层回到原位。',
      mode: 'scene'
    },
    {
      id: 'ink',
      name: '墨色显影',
      en: 'INK DEVELOPMENT',
      tag: '从容显色',
      short: '先收墨色，再渗底色与强调色',
      description: '画面先收敛为墨色，新的底色随后缓慢渗入；山川与文字逐渐显色，强调色在最后一拍回到画面。',
      mode: 'scene'
    }
  ];

  /**
   * Unified Stage Controller Class: AuthoredTransitionLayer
   * Encapsulates all stage rendering, layer management, SVG vector creation,
   * 3D scene group cloning, and safe node manipulation.
   */
  class AuthoredTransitionLayer {
    constructor(demo, helpers) {
      this.demo = demo;
      this.helpers = helpers;
      this.modified = new Set();
      this.extras = [];
      this.layers = new Map();
      this.sceneGroups = new Map();
      this.enamelLayout = null;
    }

    /**
     * Mark a DOM node as modified so its inline styles can be wiped during reset.
     */
    touch(node) {
      if (node) {
        this.modified.add(node);
      }
      return node;
    }

    /**
     * Safe selector query on base scene with automatic modification tracking.
     */
    part(selector) {
      const node = this.demo.base.querySelector(selector);
      if (node) {
        this.touch(node);
      }
      return node;
    }

    /**
     * Safe execution hook on a scene-level part.
     */
    withPart(selector, callback) {
      const node = this.part(selector);
      if (node && callback) {
        callback(node);
      }
      return node;
    }

    /**
     * Reset stage styles and hide auxiliary extras.
     */
    reset() {
      for (const node of this.modified) {
        node.removeAttribute('style');
      }
      this.modified.clear();

      for (const node of this.extras) {
        node.hidden = true;
      }
    }

    /**
     * Lazy vector layer generator: creates and caches an overlay SVG with paths and optional linearGradient.
     */
    vector(key, pathCount, gradient = false) {
      if (this.layers.has(key)) {
        const layer = this.layers.get(key);
        layer.svg.hidden = false;
        return layer;
      }

      const svg = svgNode('svg', {
        class: 'authored-vector',
        'aria-hidden': 'true',
        preserveAspectRatio: 'none'
      });

      let shade;
      const gradientId = `${this.demo.id}-${key}`;
      if (gradient) {
        const defs = svgNode('defs');
        shade = svgNode('linearGradient', {
          id: gradientId,
          gradientUnits: 'userSpaceOnUse'
        });

        const colorStops = [
          ['0%', '#151f1a'],
          ['30%', '#c8c6b4'],
          ['52%', '#fff9e9'],
          ['75%', '#dedbc6'],
          ['100%', '#6d7b6c']
        ];
        for (const [offset, color] of colorStops) {
          shade.append(svgNode('stop', { offset, 'stop-color': color }));
        }

        defs.append(shade);
        svg.append(defs);
      }

      const paths = Array.from({ length: pathCount }, (_, index) => {
        const path = svgNode('path', {
          fill: gradient && index === 0 ? `url(#${gradientId})` : 'none'
        });
        svg.append(path);
        return path;
      });

      const layer = { svg, paths, shade };
      this.demo.element.append(svg);
      this.extras.push(svg);
      this.layers.set(key, layer);
      return layer;
    }

    /**
     * Set responsive viewBox on an SVG layer.
     */
    dimensions(layer, width, height) {
      layer.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      return layer;
    }

    /**
     * Continuously interpolate base theme colors and landscape illustration.
     */
    mix(progress) {
      const { demo, helpers } = this;
      demo.next.hidden = true;
      helpers.mixColors(demo.base, demo.palettes[demo.from], demo.palettes[demo.to], progress);
      helpers.mixLandscape(demo.base, demo.to === 'dark' ? progress : 1 - progress);
    }

    /**
     * Lazy 3D Scene Group cloner: creates multiple cloned scenes within a shared stage container.
     */
    sceneGroup(key, count) {
      if (!this.sceneGroups) {
        this.sceneGroups = new Map();
      }

      if (this.sceneGroups.has(key)) {
        const group = this.sceneGroups.get(key);
        group.root.hidden = false;
        return group;
      }

      const root = document.createElement('div');
      root.className = 'physics-stage';
      root.setAttribute('aria-hidden', 'true');

      const template = document.querySelector('#scene-template');
      const scenes = Array.from({ length: count }, () => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.classList.add('physics-face');
        root.append(node);
        return node;
      });

      this.demo.element.append(root);
      this.extras.push(root);

      const group = { root, scenes };
      this.sceneGroups.set(key, group);
      return group;
    }

    /**
     * Lazy SVG Color Matrix filter definitions for RGB chromatic aberration / prism effects.
     */
    prismFilters() {
      if (this.prismFilterIds) {
        return this.prismFilterIds;
      }

      const svg = svgNode('svg', {
        class: 'effect-definitions',
        width: 0,
        height: 0,
        'aria-hidden': 'true'
      });

      const defs = svgNode('defs');
      this.prismFilterIds = [0, 1, 2].map(channel => {
        const id = `${this.demo.id}-spectrum-${channel}`;
        const filter = svgNode('filter', {
          id,
          x: '-10%',
          y: '-10%',
          width: '120%',
          height: '120%',
          'color-interpolation-filters': 'sRGB'
        });

        const matrix = Array.from({ length: 20 }, (_, index) => (index === 18 ? 1 : 0));
        matrix[channel * 5 + channel] = 1;
        filter.append(svgNode('feColorMatrix', { type: 'matrix', values: matrix.join(' ') }));
        defs.append(filter);
        return id;
      });

      svg.append(defs);
      this.demo.element.append(svg);
      return this.prismFilterIds;
    }

    /**
     * Dispatch to registered effect handler in O(1) time without switch-case nesting.
     */
    sample(id, frame) {
      const handler = TRANSITION_REGISTRY.get(id);
      if (handler) {
        handler(this, frame);
      }
    }
  }

  // --- Handlers for 8 Authored Transition Effects ---

  // 1. paper (纸页卷角)
  TRANSITION_REGISTRY.set('paper', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('paper', 3, true), w, h);
    if (!layer.ordered) {
      layer.svg.append(layer.paths[1], layer.paths[0], layer.paths[2]);
      layer.ordered = true;
    }

    const k = (w + h) * (1 - t);
    const a = k > w ? [w, h - (k - w)] : [k, h];
    const b = k > h ? [k - h, 0] : [0, h - k];
    const curl = Math.min(w, h) * 0.22 * pulse;
    const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const crease = [middle[0] - curl * 0.12, middle[1] + curl * 0.12];

    let edge = `M0 ${h}`;
    if (k > w) edge += `L${w} ${h}`;
    edge += `L${point(a)}Q${point(crease)} ${point(b)}`;
    if (k > h) edge += 'L0 0';
    edge += 'Z';

    demo.base.style.zIndex = '2';
    demo.next.style.zIndex = '1';
    demo.base.style.clipPath = `path('${edge}')`;
    demo.base.style.opacity = raw === 1 ? '0' : '1';

    const back = [middle[0] - curl, middle[1] + curl];
    layer.paths[0].setAttribute('d', `M${point(a)}Q${point(crease)} ${point(b)}Q${point(back)} ${point(a)}Z`);
    layer.paths[1].setAttribute('d', `M${point(a)}Q${point([middle[0] + curl * 0.25, middle[1] - curl * 0.25])} ${point(b)}`);
    layer.paths[1].setAttribute('stroke', '#0a1712');
    layer.paths[1].setAttribute('stroke-width', String(Math.max(1, curl * 0.24)));
    layer.paths[1].setAttribute('opacity', '.12');
    layer.paths[1].style.filter = `blur(${curl * 0.14}px)`;

    layer.paths[2].setAttribute('d', `M${point(a)}Q${point(crease)} ${point(b)}`);
    layer.paths[2].setAttribute('stroke', '#fff9e2');
    layer.paths[2].setAttribute('stroke-width', '.8');

    const gradientCoords = {
      x1: middle[0] + curl * 0.12,
      y1: middle[1] - curl * 0.12,
      x2: middle[0] - curl * 0.52,
      y2: middle[1] + curl * 0.52
    };
    for (const [prop, val] of Object.entries(gradientCoords)) {
      layer.shade.setAttribute(prop, String(val));
    }
    layer.svg.style.opacity = String(pulse);
  });

  // 2. eclipse (日蚀投影)
  TRANSITION_REGISTRY.set('eclipse', (stage, frame) => {
    const { demo, helpers } = stage;
    const { t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    stage.mix(phase(0.12, 0.96, t));

    const zoneIntervals = [
      ['.scene-content', 0.06, 0.79],
      ['.scene-topbar', 0.27, 0.93],
      ['.scene-bottom', 0.34, 1.0]
    ];
    for (const [selector, start, end] of zoneIntervals) {
      stage.withPart(selector, node => {
        helpers.mixColors(node, demo.palettes[demo.from], demo.palettes[demo.to], phase(start, end, t));
      });
    }

    const landscapeProgress = dark ? phase(0.06, 0.79, t) : 1 - phase(0.06, 0.79, t);
    helpers.mixLandscape(demo.base, landscapeProgress);

    stage.withPart('.land-moon-cutout', moonCutout => {
      moonCutout.style.transform = `translate(${pulse * (dark ? -32 : 32)}px, ${pulse * 5}px)`;
    });

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.42);
    const x = dark ? 125 - t * 170 : -25 + t * 170;
    overlay.style.backgroundImage = `radial-gradient(ellipse 85% 150% at ${x}% 30%, #091912b3 0%, #10261d66 38%, transparent 72%)`;
  });

  // 3. lens (玻璃透镜)
  TRANSITION_REGISTRY.set('lens', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    if (!stage.lensWindow) {
      stage.lensWindow = document.createElement('div');
      stage.lensWindow.className = 'lens-window';
      stage.lensWindow.setAttribute('aria-hidden', 'true');

      const template = document.querySelector('#scene-template');
      stage.lensContent = template.content.firstElementChild.cloneNode(true);
      stage.lensWindow.append(stage.lensContent);

      stage.lensRim = document.createElement('div');
      stage.lensRim.className = 'lens-rim';
      stage.lensRim.setAttribute('aria-hidden', 'true');

      demo.element.append(stage.lensWindow, stage.lensRim);
      stage.extras.push(stage.lensWindow, stage.lensRim);
    }

    const radius = h * 0.7;
    const x = dark
      ? -radius + (w + 2 * radius) * t
      : w + radius - (w + 2 * radius) * t;
    const reveal = clamp(x / w) * 100;

    demo.next.style.clipPath = dark
      ? `inset(0 ${100 - reveal}% 0 0)`
      : `inset(0 0 0 ${reveal}%)`;

    stage.lensWindow.hidden = stage.lensRim.hidden = false;
    stage.lensContent.dataset.theme = demo.to;
    stage.lensWindow.style.clipPath = `circle(${radius}px at ${x}px ${h / 2}px)`;
    stage.lensContent.style.transformOrigin = `${x}px ${h / 2}px`;
    stage.lensContent.style.transform = 'scale(1.065)';

    stage.lensRim.style.width = stage.lensRim.style.height = `${radius * 2}px`;
    stage.lensRim.style.left = `${x - radius}px`;
    stage.lensRim.style.top = `${h / 2 - radius}px`;
    stage.lensRim.style.opacity = String(pulse * 0.8);
  });

  // 4. silk (丝绸换光)
  TRANSITION_REGISTRY.set('silk', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('silk', 3, true), w, h);
    const center = w * (t * 1.5 - 0.25);
    const amplitude = w * 0.13 * pulse;

    const wave = offset => Array.from({ length: 49 }, (_, index) => {
      const y = (index / 48) * h;
      const x = center + Math.sin((index / 48) * Math.PI * 1.6 + t * 1.8) * amplitude + offset;
      return [dark ? x : w - x, y];
    });

    const edge = wave(0);
    const boundary = dark ? 0 : w;
    demo.next.style.clipPath = `path('${polygon([[boundary, 0], ...edge, [boundary, h]])}')`;

    const band = w * 0.075 * pulse;
    layer.paths[0].setAttribute('d', polygon([...wave(-band), ...wave(band).reverse()]));
    layer.paths[1].setAttribute('d', `M${wave(-band * 0.45).map(point).join('L')}`);
    layer.paths[1].setAttribute('stroke', '#fffbe4');
    layer.paths[1].setAttribute('stroke-width', String(Math.max(0.5, band * 0.09)));
    layer.paths[1].setAttribute('opacity', '.55');

    layer.paths[2].setAttribute('d', `M${wave(band * 0.65).map(point).join('L')}`);
    layer.paths[2].setAttribute('stroke', '#132b20');
    layer.paths[2].setAttribute('stroke-width', String(Math.max(0.5, band * 0.2)));
    layer.paths[2].setAttribute('opacity', '.14');

    const cx = dark ? center : w - center;
    for (const [name, value] of Object.entries({
      x1: cx - band * 1.8,
      y1: 0,
      x2: cx + band * 1.8,
      y2: 0
    })) {
      layer.shade.setAttribute(name, String(value));
    }
    layer.svg.style.opacity = String(pulse * 0.82);
  });

  // 5. contour (等高线涌动)
  TRANSITION_REGISTRY.set('contour', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('contour', 6), w, h);
    const cx = w * 0.68;
    const cy = h * 0.55;
    const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy) / 0.83);
    const spacing = Math.min(w, h) * 0.065;
    const radius = (reach + spacing * 7) * t - spacing * 3;

    const contour = offset => polygon(Array.from({ length: 97 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      const ripple = (Math.sin(angle * 3 + 0.8) + 0.45 * Math.cos(angle * 5 - t)) * spacing * 0.75 * pulse;
      const r = Math.max(0, radius + offset + ripple);
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.83];
    }));

    demo.next.style.clipPath = raw === 1 ? 'none' : `path('${contour(0)}')`;
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    layer.paths.forEach((path, index) => {
      path.setAttribute('d', contour((index - 2) * spacing));
      path.setAttribute('stroke', dark ? '#c9ddbc' : '#45674f');
      path.setAttribute('stroke-width', index === 2 ? '1.1' : '.65');
      path.setAttribute('opacity', String((1 - Math.abs(index - 2) * 0.16) * 0.48));
    });
    layer.svg.style.opacity = String(pulse);
  });

  // 6. glyph (字形开幕)
  TRANSITION_REGISTRY.set('glyph', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const glyph = dark ? '夜' : '光';
    const size = Math.min(w, h) * (0.18 + 5.6 * t * t);
    const fill = phase(0.62, 0.98, t);
    const mask = `<svg xmlns="${namespace}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white" opacity="${fill}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="SimSun,Songti SC,serif" font-weight="bold" font-size="${size}" fill="white">${glyph}</text></svg>`;
    const image = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;

    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 1 ? 'none' : image;
    demo.next.style.opacity = String(phase(0, 0.15, t));

    if (!stage.glyphOutline) {
      stage.glyphOutline = document.createElement('div');
      stage.glyphOutline.className = 'glyph-outline';
      stage.glyphOutline.setAttribute('aria-hidden', 'true');
      demo.element.append(stage.glyphOutline);
      stage.extras.push(stage.glyphOutline);
    }

    stage.glyphOutline.hidden = false;
    stage.glyphOutline.textContent = glyph;
    stage.glyphOutline.style.fontSize = `${size}px`;
    stage.glyphOutline.style.opacity = String(pulse * (1 - fill) * 0.45);
    stage.glyphOutline.style.webkitTextStrokeColor = dark ? '#d2ddc3' : '#405d46';
  });

  // 7. spatial (空间换景)
  TRANSITION_REGISTRY.set('spatial', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const direction = dark ? 1 : -1;
    const overlay = demo.overlay;

    stage.mix(t);

    stage.withPart('.scene-copy', copy => {
      copy.style.transform = `translate(${-w * 0.018 * pulse * direction}px, ${-h * 0.008 * pulse}px)`;
    });

    stage.withPart('.landscape', landscape => {
      landscape.style.transform = `translate(${w * 0.014 * pulse * direction}px, ${h * 0.005 * pulse}px) scale(${1 + pulse * 0.018})`;
    });

    const depthMap = [
      ['.land-far', 3],
      ['.land-near', 8],
      ['.land-front', 17],
      ['.land-river', 22]
    ];
    for (const [selector, depth] of depthMap) {
      stage.withPart(selector, part => {
        part.style.transform = `translate(${-depth * pulse * direction}px, ${depth * 0.16 * pulse}px)`;
      });
    }

    stage.withPart('.scene-topbar', topbar => {
      topbar.style.transform = `translateX(${-w * 0.004 * pulse * direction}px)`;
    });

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.12);
    overlay.style.backgroundImage = `radial-gradient(ellipse at ${dark ? 85 : 15}% 20%, #f8e6bd, transparent 68%)`;
  });

  // 8. ink (墨色显影)
  TRANSITION_REGISTRY.set('ink', (stage, frame) => {
    const { demo, helpers } = stage;
    const { t } = frame;

    stage.mix(phase(0.22, 0.83, t));

    const saturation = 1 - phase(0.02, 0.28, t) * (1 - phase(0.69, 0.98, t));
    demo.base.style.filter = `saturate(${saturation})`;

    const accentProgress = phase(0.73, 1, t);
    const accentTargets = ['.scene-brand > span', '.scene-link', '.scene-bottom-dot'];
    for (const selector of accentTargets) {
      stage.withPart(selector, node => {
        helpers.mixColors(node, demo.palettes[demo.from], demo.palettes[demo.to], accentProgress);
      });
    }
  });

  // Export stage layer classes
  window.AuthoredTransitionLayer = AuthoredTransitionLayer;
  window.CraftTransitionLayer = AuthoredTransitionLayer;
  window.PhysicalTransitionLayer = AuthoredTransitionLayer;
})();
