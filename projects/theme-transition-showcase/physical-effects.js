"use strict";

(() => {
  const ns = 'http://www.w3.org/2000/svg';

  // Math & utility helpers
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => {
    const t = clamp(x);
    return t * t * (3 - 2 * t);
  };
  const phase = (a, b, t) => smooth((t - a) / (b - a));
  const n = x => Number(x.toFixed(4));
  const point = ([x, y]) => `${n(x)} ${n(y)}`;
  const polygon = points => `M${points.map(point).join('L')}Z`;

  /**
   * Helper to create an SVG element with given namespace and attributes.
   */
  const svgNode = (tag, attrs = {}) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) {
      node.setAttribute(key, String(value));
    }
    return node;
  };

  /**
   * Linear interpolation between two RGB color arrays.
   */
  const rgb = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const color = values => `rgb(${values.join(',')})`;

  /**
   * 求解 2D 矩形条带到 3D 空间任意凸四边形投影像平面的透视变换矩阵（Projective Transformation Matrix）。
   * 将源矩形区域 [left, 0] ~ [left + width, height] 映射至四个投影后顶点 [p0, p1, p2, p3]，
   * 保证相邻切片在曲面或纸面翻转折叠过程中共享接缝，严丝合缝，不留空隙。
   */
  function quadMatrix([p0, p1, p2, p3], left, width, height) {
    const dx1 = p1[0] - p2[0];
    const dx2 = p3[0] - p2[0];
    const dx3 = p0[0] - p1[0] + p2[0] - p3[0];
    const dy1 = p1[1] - p2[1];
    const dy2 = p3[1] - p2[1];
    const dy3 = p0[1] - p1[1] + p2[1] - p3[1];
    const denominator = dx1 * dy2 - dx2 * dy1;

    const g = Math.abs(denominator) > 1e-8 ? (dx3 * dy2 - dx2 * dy3) / denominator : 0;
    const h = Math.abs(denominator) > 1e-8 ? (dx1 * dy3 - dx3 * dy1) / denominator : 0;

    const a = (p1[0] - p0[0] + g * p1[0]) / width;
    const b = (p3[0] - p0[0] + h * p3[0]) / height;
    const d = (p1[1] - p0[1] + g * p1[1]) / width;
    const e = (p3[1] - p0[1] + h * p3[1]) / height;

    return [
      a, d, 0, g / width,
      b, e, 0, h / height,
      0, 0, 1, 0,
      p0[0] - a * left, p0[1] - d * left, 0, 1 - (g * left) / width
    ];
  }

  /**
   * Set an SVG mask on the provided DOM element.
   */
  const imageMask = (node, body, w, h) => {
    const svg = `<svg xmlns="${ns}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
    node.style.maskImage = node.style.webkitMaskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    node.style.maskSize = node.style.webkitMaskSize = '100% 100%';
  };

  /**
   * 解析光场与域扭曲方程（Analytical Optical Field & Domain Warping）：
   * 不依赖耗时的物理网格模拟或粒子追踪，完全由封闭形式的三角函数解析波前构造。
   * 包含：
   * 1. 焦散光纹（Caustic Light）：多频高斯光脊叠加模拟水下曲率聚焦；
   * 2. 流体互溶（Liquid Advection）：空间坐标经多级正弦域扭曲生成卷曲界面；
   * 3. 薄膜干涉（Thin Film）：利用膜厚相位调制模拟牛顿环与珠光色散。
   * 配合有限尺寸 Canvas 与有界 LRU 缓存，实现任意进度的 O(1) 确定性回拖与内存自控。
   */
  const fieldCache = new Map();
  let fieldCanvas;
  let maskPixels;
  let lightPixels;

  function opticalField(kind, progress, dark) {
    const step = Math.round(progress * 120);
    const t = step / 120;
    const key = `${kind}:${step}:${dark}`;
    if (fieldCache.has(key)) return fieldCache.get(key);

    if (!fieldCanvas) {
      fieldCanvas = document.createElement('canvas');
      fieldCanvas.width = 160;
      fieldCanvas.height = 96;
      const ctx = fieldCanvas.getContext('2d');
      maskPixels = ctx.createImageData(160, 96);
      lightPixels = ctx.createImageData(160, 96);
    }

    const pulse = Math.sin(Math.PI * t);

    for (let y = 0; y < 96; y++) {
      for (let x = 0; x < 160; x++) {
        const u = (dark ? x : 159 - x) / 159;
        const v = y / 95;
        const offset = (y * 160 + x) * 4;
        let alpha = 0;
        let glow = 0;
        let r = 231;
        let g = 244;
        let b = 211;

        if (kind === 'liquid') {
          // 二级正弦域扭曲
          const a = u + 0.07 * Math.sin(10 * v + Math.sin(7 * u + t * 5)) * pulse;
          const q = v + 0.11 * Math.sin(8 * u - t * 4) * pulse;
          const front = a + pulse * (0.16 * Math.sin(q * 9 + t * 3) + 0.055 * Math.sin(q * 27 - a * 17 - t * 4));
          const distance = t * 1.6 - 0.3 - front;
          alpha = smooth(distance / 0.026 + 0.5);
          glow = Math.exp(-((distance / 0.026) ** 2)) * 0.45 * pulse;
          r = dark ? 177 : 220;
          g = dark ? 218 : 207;
          b = dark ? 193 : 168;
        } else if (kind === 'caustic') {
          // 焦散波形干涉脊
          const f = Math.sin(u * 13 + t * 3) + Math.sin(v * 15 - t * 2) + 0.65 * Math.sin((u + v) * 18 + t * 2);
          const ridge = Math.exp(-Math.abs(f) * 10);
          alpha = smooth((t * 1.6 - 0.3 - (f / 5.3 + 0.5)) / 0.07 + 0.5);
          glow = ridge * 0.7 * pulse;
        } else {
          // 薄膜干涉光谱相位
          const thickness = 6 * u + 2 * Math.sin(v * 5 + t * 2) + Math.sin(u * 5 - v * 4 + t * 3);
          const specular = Math.exp(-(((u - 0.5 - 0.16 * Math.sin(v * 5 + t * 2)) / 0.27) ** 2));
          r = 220 + 30 * Math.cos(thickness * 2.1);
          g = 225 + 25 * Math.cos(thickness * 2.1 + 2.1);
          b = 228 + 26 * Math.cos(thickness * 2.1 + 4.2);
          glow = specular * 0.37 * pulse;
        }

        maskPixels.data[offset] = 255;
        maskPixels.data[offset + 1] = 255;
        maskPixels.data[offset + 2] = 255;
        maskPixels.data[offset + 3] = Math.round(alpha * 255);

        lightPixels.data[offset] = r;
        lightPixels.data[offset + 1] = g;
        lightPixels.data[offset + 2] = b;
        lightPixels.data[offset + 3] = Math.round(glow * 255);
      }
    }

    const ctx = fieldCanvas.getContext('2d');
    ctx.putImageData(maskPixels, 0, 0);
    const mask = `url("${fieldCanvas.toDataURL()}")`;

    ctx.putImageData(lightPixels, 0, 0);
    const light = `url("${fieldCanvas.toDataURL()}")`;

    const result = { mask, light };
    fieldCache.set(key, result);
    if (fieldCache.size > 96) {
      fieldCache.delete(fieldCache.keys().next().value);
    }
    return result;
  }

  /**
   * 10 Physical & Spatial Transition Effects Metadata
   */
  window.PHYSICAL_EFFECTS = [
    {
      id: 'caustic',
      name: '焦散游移',
      en: 'CAUSTIC LIGHT',
      tag: '水下光纹',
      short: '聚散的光纹缓缓游过界面',
      description: '弯曲的光纹像阳光穿过水面一样聚集、散开，新主题在连贯的光场中显现，最后光纹安静退去。',
      mode: 'container'
    },
    {
      id: 'volumetric',
      name: '体积光换场',
      en: 'VOLUMETRIC LIGHT',
      tag: '光与空气',
      short: '斜光穿过薄雾，照明随之转向',
      description: '斜向光束带着柔软边缘与细小尘光穿过画面，山川、文字和背景依次进入新的照明。',
      mode: 'scene'
    },
    {
      id: 'liquid',
      name: '流体互溶',
      en: 'LIQUID ADVECTION',
      tag: '流动惯性',
      short: '弯曲分支相互渗透，逐渐归于平静',
      description: '两种主题沿流动的细长边界相互渗透，卷曲的分支带着柔和亮边，最终连成完整的新画面。',
      mode: 'container'
    },
    {
      id: 'crystal',
      name: '晶体相变',
      en: 'CRYSTAL GROWTH',
      tag: '有序生长',
      short: '从晶核长出晶面，再恢复平整',
      description: '新主题从少数晶核附近向外生长，六边晶面依次展开，短暂的折光与棱线随后隐去。',
      mode: 'container'
    },
    {
      id: 'prism',
      name: '棱镜归色',
      en: 'PRISMATIC ALIGNMENT',
      tag: '微妙色散',
      short: '棱镜掠过，光谱轻轻分开再归位',
      description: '棱镜滑过界面，镜内的颜色出现轻微色散；不同色光在离开镜缘时准确合拢，留下新配色。',
      mode: 'container'
    },
    {
      id: 'origami',
      name: '折纸地形',
      en: 'ORIGAMI TERRAIN',
      tag: '山脊折面',
      short: '沿山景折成地形，再平整展开',
      description: '界面沿山景附近的折线隆起，连接的三角纸面随受光方向改变明暗，再以新主题重新铺平。',
      mode: 'scene'
    },
    {
      id: 'room',
      name: '连续空间转角',
      en: 'CONTINUOUS ROOM',
      tag: '空间连续',
      short: '镜头绕过墙角，另一面进入视野',
      description: '两幅主题成为相邻墙面，镜头绕过共同的转角；透视、遮挡与墙面明暗一起变化，最后正对新画面。',
      mode: 'container'
    },
    {
      id: 'constellation',
      name: '星图归位',
      en: 'CONSTELLATION MORPH',
      tag: '有目的的轨迹',
      short: '山川特征化作星图，再沿弧线归位',
      description: '文字与山川附近的关键位置化为星图，沿有组织的弧线散开，再回到新主题中的对应位置。',
      mode: 'container'
    },
    {
      id: 'film',
      name: '薄膜干涉',
      en: 'THIN FILM LIGHT',
      tag: '克制珠光',
      short: '透明薄膜绷紧，珠光随角度流动',
      description: '透明薄膜缓缓绷紧，起伏处浮出细微珠光；色彩顺着膜面流动，表面展平后进入新主题。',
      mode: 'container'
    },
    {
      id: 'mobius',
      name: '莫比乌斯翻带',
      en: 'MOBIUS RIBBON',
      tag: '连续曲面',
      short: '界面化作螺旋扭转宽带，波前换光后展平',
      description: '画面沿横贯全屏的三维螺旋宽带柔和扭转，新主题顺着曲面波前流淌推进，最后平整展开。',
      mode: 'scene'
    }
  ];

  // Stage layer class compatibility alias
  class PhysicalTransitionLayer extends window.CraftTransitionLayer {}
  window.PhysicalTransitionLayer = PhysicalTransitionLayer;

  // --- Handlers for 10 Physical Transition Effects ---

  // 1. caustic (焦散游移) & 3. liquid (流体互溶)
  const handleOpticField = (id, stage, frame) => {
    const { demo } = stage;
    const { t, progress: raw, dark } = frame;
    const overlay = demo.overlay;
    const field = opticalField(id, t, dark);

    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 0 || raw === 1 ? 'none' : field.mask;
    demo.next.style.maskSize = demo.next.style.webkitMaskSize = '100% 100%';
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    overlay.hidden = false;
    overlay.style.backgroundImage = field.light;
    overlay.style.backgroundSize = '100% 100%';
    overlay.style.mixBlendMode = id === 'caustic' ? 'screen' : 'normal';
  };

  window.registerTransitionHandler('caustic', (stage, frame) => handleOpticField('caustic', stage, frame));
  window.registerTransitionHandler('liquid', (stage, frame) => handleOpticField('liquid', stage, frame));

  // 2. volumetric (体积光换场)
  window.registerTransitionHandler('volumetric', (stage, frame) => {
    const { demo, helpers } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    stage.mix(phase(0.08, 0.98, t));

    const zoneIntervals = [
      ['.scene-content', 0.03, 0.85],
      ['.scene-topbar', 0.20, 0.94],
      ['.scene-bottom', 0.30, 1.00]
    ];
    for (const [selector, a, b] of zoneIntervals) {
      stage.withPart(selector, node => {
        helpers.mixColors(node, demo.palettes[demo.from], demo.palettes[demo.to], phase(a, b, t));
      });
    }

    const layer = stage.dimensions(stage.vector('volumetric', 12), w, h);
    if (!layer.light) {
      const defs = svgNode('defs');
      const gradient = svgNode('linearGradient', { id: `${demo.id}-beam`, x1: 0, y1: 0, x2: 0, y2: 1 });
      gradient.append(
        svgNode('stop', { offset: 0, 'stop-color': '#fff3c7', 'stop-opacity': 0.72 }),
        svgNode('stop', { offset: 1, 'stop-color': '#e8f3dd', 'stop-opacity': 0 })
      );
      defs.append(gradient);
      layer.svg.append(defs);
      layer.light = true;
    }

    const source = w * (dark ? -0.25 + t * 1.1 : 1.25 - t * 1.1);

    layer.paths.forEach((path, index) => {
      if (index < 4) {
        const spread = w * (0.09 + index * 0.035);
        const landing = source + w * (dark ? 0.55 : -0.55) + Math.sin(t * 2 + index) * w * 0.04;
        path.setAttribute('d', polygon([[source, -h * 0.2], [landing - spread, h * 1.2], [landing + spread, h * 1.2]]));
        path.setAttribute('fill', `url(#${demo.id}-beam)`);
        path.setAttribute('opacity', String(0.15 + index * 0.055));
        path.style.filter = `blur(${w * (0.004 + index * 0.002)}px)`;
      } else {
        const x = w * (0.12 + ((index * 0.173) % 0.72) + t * 0.05);
        const y = h * (0.13 + ((index * 0.191) % 0.70) + t * 0.025);
        const r = Math.max(0.5, w * 0.0013);
        path.setAttribute('d', `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`);
        path.setAttribute('fill', '#fff1c8');
        path.setAttribute('opacity', '.6');
      }
    });

    layer.svg.style.opacity = String(pulse * 0.75);
  });

  // 4. crystal (晶体相变)
  window.registerTransitionHandler('crystal', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('crystal', 72), w, h);
    let mask = '';

    layer.paths.forEach((path, index) => {
      const col = index % 9;
      const row = Math.floor(index / 9) - 1;
      const cx = (col * w) / 8;
      const cy = (row + 0.5 * (col % 2)) * (h / 5);
      const distance = Math.min(
        Math.hypot(cx / w - 0.28, cy / h - 0.38),
        Math.hypot(cx / w - 0.78, cy / h - 0.65)
      );
      const amount = phase(distance * 0.48, 0.49 + distance * 0.48, t);
      const vertices = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return [cx + (Math.cos(a) * w) / 12, cy + (Math.sin(a) * h) / (Math.sqrt(3) * 5)];
      });
      const d = polygon(vertices);

      mask += `<path d="${d}" fill="white" transform="translate(${cx} ${cy}) scale(${amount}) translate(${-cx} ${-cy})"/>`;
      path.setAttribute('d', `${d}M${point(vertices[0])}L${cx} ${cy}L${point(vertices[2])}M${cx} ${cy}L${point(vertices[4])}`);
      path.setAttribute('stroke', dark ? '#d6efdb' : '#64887a');
      path.setAttribute('stroke-width', '.65');
      path.setAttribute('fill', index % 3 ? '#deffff0a' : '#c1dbec20');
      path.setAttribute('opacity', String(amount));
    });

    imageMask(demo.next, mask, w, h);
    if (raw === 1) {
      demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    }
    demo.next.style.opacity = raw === 0 ? '0' : '1';
    layer.svg.style.opacity = String(pulse * 0.65);
  });

  // 5. prism (棱镜归色)
  window.registerTransitionHandler('prism', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const group = stage.sceneGroup('prism', 3);
    const ids = stage.prismFilters();
    const band = w * 0.17;
    const x = dark
      ? -band + t * (w + 2 * band)
      : w + band - t * (w + 2 * band);
    const vertices = [
      [x - band, 0],
      [x + band, 0],
      [x + band * 0.6, h],
      [x - band * 0.6, h]
    ];

    group.root.style.clipPath = `path('${polygon(vertices)}')`;
    group.root.style.backgroundColor = '#000';
    group.root.style.isolation = 'isolate';

    const reveal = clamp(x / w) * 100;
    demo.next.style.clipPath = dark ? `inset(0 ${100 - reveal}% 0 0)` : `inset(0 0 0 ${reveal}%)`;

    group.scenes.forEach((node, index) => {
      node.dataset.theme = demo.to;
      node.style.filter = `url(#${ids[index]})`;
      node.style.mixBlendMode = 'screen';
      node.style.transform = `translateX(${(index - 1) * w * 0.004 * pulse}px)`;
    });

    const layer = stage.dimensions(stage.vector('prism-rim', 1), w, h);
    layer.paths[0].setAttribute('d', polygon(vertices));
    layer.paths[0].setAttribute('stroke', '#e0ecda');
    layer.paths[0].setAttribute('stroke-width', '.8');
    layer.svg.style.opacity = String(pulse * 0.48);
  });

  // 6. origami (折纸地形)
  // 八面体三角剖分：中央山脊隆起，通过空间平面方程 z = Ax + By + C 求解各片元的法线明暗。
  window.registerTransitionHandler('origami', (stage, frame) => {
    const { demo, helpers } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const group = stage.sceneGroup('origami', 8);
    const center = [w * 0.68, h * 0.55];
    const boundary = [
      [0, 0], [w / 2, 0], [w, 0], [w, h / 2],
      [w, h], [w / 2, h], [0, h], [0, h / 2]
    ];

    demo.base.style.opacity = demo.next.style.opacity = '0';
    group.root.style.perspective = `${w * 2.2}px`;
    group.root.style.transformStyle = 'preserve-3d';

    for (let index = 0; index < 8; index++) {
      const a = boundary[index];
      const b = boundary[(index + 1) % 8];
      const height = h * 0.22 * pulse;
      const za = index % 2 ? -height * 0.08 : 0;
      const zb = (index + 1) % 2 ? -height * 0.08 : 0;

      const ax = a[0] - center[0];
      const ay = a[1] - center[1];
      const bx = b[0] - center[0];
      const by = b[1] - center[1];
      const determinant = ax * by - bx * ay;

      const slopeX = ((za - height) * by - (zb - height) * ay) / determinant;
      const slopeY = (ax * (zb - height) - bx * (za - height)) / determinant;
      const intercept = height - slopeX * center[0] - slopeY * center[1];

      const node = group.scenes[index];
      const colorProgress = phase(0.12, 0.88, t);
      node.dataset.theme = demo.from;
      helpers.mixColors(node, demo.palettes[demo.from], demo.palettes[demo.to], colorProgress);
      helpers.mixLandscape(node, dark ? colorProgress : 1 - colorProgress);

      node.style.clipPath = `path('${polygon([center, a, b])}')`;
      node.style.transformOrigin = '0 0';
      node.style.transform = `matrix3d(1,0,${slopeX},0,0,1,${slopeY},0,0,0,1,0,0,0,${intercept},1)`;

      const lighting = (-slopeX * (dark ? 0.4 : -0.4) + slopeY * 0.6 + 0.7) / Math.hypot(slopeX, slopeY, 1);
      node.style.filter = `brightness(${1 + pulse * (lighting * 0.5 - 0.35)})`;
    }
  });

  // 7. room (连续空间转角)
  window.registerTransitionHandler('room', (stage, frame) => {
    const { demo } = stage;
    const { width: w, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const direction = dark ? 1 : -1;
    const overlay = demo.overlay;

    demo.base.style.transformOrigin = dark ? '100% 50%' : '0 50%';
    demo.next.style.transformOrigin = dark ? '0 50%' : '100% 50%';
    demo.base.style.transform = `perspective(${w * 2}px) translateX(${-direction * w * t}px) rotateY(${-direction * 90 * t}deg)`;
    demo.next.style.transform = `perspective(${w * 2}px) translateX(${direction * w * (1 - t)}px) rotateY(${direction * 90 * (1 - t)}deg)`;
    demo.base.style.filter = `brightness(${1 - 0.32 * pulse})`;
    demo.next.style.filter = `brightness(${1 - 0.20 * pulse})`;
    demo.base.style.backfaceVisibility = demo.next.style.backfaceVisibility = 'hidden';

    const seam = (dark ? 1 - t : t) * 100;
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.24);
    overlay.style.backgroundImage = `linear-gradient(90deg,transparent ${seam - 5}%,#091b16 ${seam}%,transparent ${seam + 5}%)`;
  });

  // 8. constellation (星图归位)
  window.registerTransitionHandler('constellation', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    stage.mix(t);
    demo.base.style.filter = `brightness(${n(1 - 0.3 * pulse)}) saturate(${n(1 - 0.22 * pulse)})`;

    overlay.hidden = false;
    overlay.style.opacity = String(n(pulse * 0.62));
    overlay.style.backgroundImage = 'radial-gradient(circle at 72% 38%, rgba(34, 62, 50, .38), rgba(12, 24, 19, .88) 78%)';

    const anchors = [
      [0.470, 0.72, 1.15], [0.540, 0.55, 0.88], [0.612, 0.42, 1.45], [0.690, 0.58, 0.92], [0.790, 0.75, 1.08],
      [0.590, 0.83, 0.88], [0.680, 0.69, 1.02], [0.795, 0.52, 1.45], [0.870, 0.64, 0.92], [0.938, 0.76, 1.08],
      [0.705, 0.73, 0.86], [0.755, 0.68, 0.88], [0.810, 0.78, 0.92],
      [0.120, 0.36, 1.25], [0.180, 0.32, 0.92], [0.250, 0.35, 1.15], [0.310, 0.41, 0.95], [0.220, 0.48, 1.08], [0.140, 0.46, 0.88]
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4], [1, 6], [2, 7],
      [5, 6], [6, 7], [7, 8], [8, 9], [6, 10], [10, 11], [11, 12], [7, 11],
      [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 13], [14, 17],
      [19, 20], [20, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 19]
    ];

    const starCount = anchors.length + 8;
    const pathCount = 3 + edges.length + starCount * 2;
    const layer = stage.dimensions(stage.vector('constellation', pathCount), w, h);

    const p = smooth(raw);
    const spread = Math.sin(Math.PI * p);
    const darkness = dark ? p : 1 - p;

    const poleX = (0.799 - 0.033 * darkness) * w;
    const poleY = (0.418 - 0.016 * darkness) * h;
    const coronaR = Math.min(w, h) * 0.135 * (1 - 0.12 * darkness);

    const coords = anchors.map(([nx, ny, size], index) => {
      const ox = nx * w;
      const oy = ny * h;
      const dx = ox - poleX;
      const dy = oy - poleY;
      const dist = Math.hypot(dx, dy);
      const baseAngle = Math.atan2(dy, dx);
      const swirl = (dark ? 1 : -1) * spread * 0.2 * (1 - Math.min(1, dist / (w * 0.85 + 0.001)));
      const radial = 1 + spread * 0.09 * Math.sin(index * 1.7);
      const liftY = spread * Math.cos(index * 0.9) * h * 0.022;

      return [
        poleX + Math.cos(baseAngle + swirl) * dist * radial,
        poleY + Math.sin(baseAngle + swirl) * dist * radial - liftY,
        size
      ];
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + (dark ? 1 : -1) * p * 0.45;
      const r = coronaR * (1 + spread * (i % 2 ? 0.16 : 0.26));
      coords.push([poleX + Math.cos(angle) * r, poleY + Math.sin(angle) * r, i % 2 ? 0.92 : 1.28]);
    }

    let cursor = 0;
    [0.82, 1.42, 2.15].forEach((mult, ringIndex) => {
      const radius = coronaR * mult * (1 + spread * 0.08);
      const a0 = -2.5 + (dark ? p : -p) * 0.4 + ringIndex * 0.45;
      const a1 = a0 + 1.95 + ringIndex * 0.22;
      const x0 = poleX + Math.cos(a0) * radius;
      const y0 = poleY + Math.sin(a0) * radius;
      const x1 = poleX + Math.cos(a1) * radius;
      const y1 = poleY + Math.sin(a1) * radius;

      const path = layer.paths[cursor++];
      path.setAttribute('d', `M${point([x0, y0])}A${n(radius)} ${n(radius)} 0 0 1 ${point([x1, y1])}`);
      path.setAttribute('stroke', ringIndex === 1 ? '#eddba8' : '#a9c7b5');
      path.setAttribute('stroke-width', ringIndex === 1 ? '.8' : '.55');
      path.setAttribute('stroke-dasharray', ringIndex % 2 ? '3 4' : 'none');
      path.setAttribute('opacity', String(n((0.2 + ringIndex * 0.06) * pulse)));
    });

    edges.forEach(([i, j], edgeIndex) => {
      const a = coords[i];
      const b = coords[j];
      const isCorona = edgeIndex >= 21;
      const weight = phase((edgeIndex % 6) * 0.03, 0.55 + (edgeIndex % 4) * 0.05, pulse);
      const path = layer.paths[cursor++];
      path.setAttribute('d', `M${point(a)}L${point(b)}`);
      path.setAttribute('stroke', isCorona ? '#eddba8' : '#c4decb');
      path.setAttribute('stroke-width', isCorona ? '.85' : '.68');
      path.setAttribute('opacity', String(n((0.22 + 0.46 * weight) * pulse)));
    });

    coords.forEach(([x, y, size], index) => {
      const unit = Math.max(1.5, w * 0.0034) * size * (0.86 + 0.32 * pulse);
      const halo = layer.paths[cursor++];
      const hr = unit * 2.4;
      halo.setAttribute('d', `M${n(x - hr)} ${n(y)}a${n(hr)} ${n(hr)} 0 1 0 ${n(hr * 2)} 0a${n(hr)} ${n(hr)} 0 1 0 ${n(-hr * 2)} 0Z`);
      halo.setAttribute('fill', index >= 19 || index % 3 === 0 ? '#f5e4b3' : '#cde6d4');
      halo.setAttribute('opacity', String(n(0.18 * pulse)));

      const star = layer.paths[cursor++];
      if (size >= 1.1) {
        const s = unit * 1.5;
        const c = unit * 0.27;
        star.setAttribute('d', `M${n(x)} ${n(y - s)}L${n(x + c)} ${n(y - c)}L${n(x + s)} ${n(y)}L${n(x + c)} ${n(y + c)}L${n(x)} ${n(y + s)}L${n(x - c)} ${n(y + c)}L${n(x - s)} ${n(y)}L${n(x - c)} ${n(y - c)}Z`);
      } else {
        const r = unit * 0.74;
        star.setAttribute('d', `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`);
      }
      star.setAttribute('fill', size >= 1.1 ? '#fff7df' : '#e0efe3');
      star.setAttribute('opacity', String(n(0.6 + 0.4 * pulse)));
    });

    layer.svg.style.opacity = String(n(pulse));
  });

  // 9. film (薄膜干涉)
  window.registerTransitionHandler('film', (stage, frame) => {
    const { demo } = stage;
    const { t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    stage.mix(t);
    const field = opticalField('film', t, dark);

    overlay.hidden = false;
    overlay.style.backgroundImage = field.light;
    overlay.style.backgroundSize = '100% 100%';
    overlay.style.mixBlendMode = dark ? 'screen' : 'multiply';
    demo.base.style.filter = `saturate(${1 - 0.15 * pulse})`;
  });

  // 10. mobius (莫比乌斯翻带)
  window.registerTransitionHandler('mobius', (stage, frame) => {
    const { demo, helpers } = stage;
    const { width: w, height: h, t, dark } = frame;
    const count = 24;
    const group = stage.sceneGroup('mobius', count);

    demo.base.style.opacity = demo.next.style.opacity = '0';
    const morph = Math.sin(Math.PI * t);
    const dir = dark ? 1 : -1;

    // 参数化曲面投影函数
    const project = (x, y) => {
      const u = x / w;
      const v = y / h - 0.5;
      const wave = (u - 0.5) * Math.PI * 1.35 + dir * (t - 0.5) * Math.PI * 1.5;
      const twist = morph * 0.82 * Math.sin(wave);
      const archY = morph * h * 0.075 * Math.sin(wave - 0.45);
      const archZ = morph * w * 0.085 * Math.cos(wave);
      const gatherX = x + morph * w * 0.036 * Math.sin((u - 0.5) * Math.PI) * Math.cos(wave * 0.7);

      const dy = v * h * Math.cos(twist);
      const dz = v * h * Math.sin(twist) * 0.58;
      const dx = -v * h * Math.sin(twist) * morph * 0.14 * Math.cos(wave);

      const px = gatherX + dx - w / 2;
      const py = archY + dy;
      const z = archZ + dz;

      const perspective = w * 2.2;
      const scale = perspective / (perspective - z);
      return [w / 2 + px * scale, h / 2 + py * scale, z];
    };

    const topPoints = [];
    const bottomPoints = [];

    group.scenes.forEach((node, index) => {
      const x = (index * w) / count;
      const span = w / count;
      const a = project(x, 0);
      const b = project(x + span, 0);
      const c = project(x + span, h);
      const d = project(x, h);

      if (index === 0) {
        topPoints.push(a);
        bottomPoints.push(d);
      }
      topPoints.push(b);
      bottomPoints.push(c);

      const matrix = quadMatrix([a, b, c, d], x, span, h);
      const order = dark ? 1 - index / (count - 1) : index / (count - 1);
      const localT = phase(order * 0.34, 0.66 + order * 0.34, t);

      node.dataset.theme = demo.from;
      helpers.mixColors(node, demo.palettes[demo.from], demo.palettes[demo.to], localT);
      helpers.mixLandscape(node, dark ? localT : 1 - localT);

      node.style.clipPath = `inset(0 ${Math.max(0, w - x - span - 0.65)}px 0 ${Math.max(0, x - 0.65)}px)`;
      node.style.transformOrigin = '0 0';
      node.style.transform = `matrix3d(${matrix.join(',')})`;
      node.style.zIndex = String(Math.round((a[2] + b[2] + d[2]) / 3 + w));

      const waveAngle = ((index + 0.5) / count - 0.5) * Math.PI * 1.35 + dir * (t - 0.5) * Math.PI * 1.5;
      const sheen = Math.sin(waveAngle) * morph;
      node.style.filter = `brightness(${n(1 + sheen * 0.13)}) contrast(${n(1 + Math.abs(sheen) * 0.05)})`;
    });

    const trim = stage.dimensions(stage.vector('mobius-trim', 3), w, h);
    const shadowPoints = [...topPoints, ...[...bottomPoints].reverse()].map(([px, py]) => [px, py + h * 0.028 * morph]);

    trim.paths[0].setAttribute('d', polygon(shadowPoints));
    trim.paths[0].setAttribute('fill', '#0d1d17');
    trim.paths[0].setAttribute('opacity', String(n(morph * 0.16)));

    trim.paths[1].setAttribute('d', `M${topPoints.map(point).join('L')}`);
    trim.paths[1].setAttribute('stroke', dark ? '#dfeadb' : '#6a8370');
    trim.paths[1].setAttribute('stroke-width', '1.15');

    trim.paths[2].setAttribute('d', `M${bottomPoints.map(point).join('L')}`);
    trim.paths[2].setAttribute('stroke', dark ? '#a9c2b2' : '#91a290');
    trim.paths[2].setAttribute('stroke-width', '.95');

    trim.svg.style.opacity = String(n(morph * 0.68));
    group.root.style.backgroundColor = color(rgb(demo.palettes[demo.from]['--scene-bg'], demo.palettes[demo.to]['--scene-bg'], t));
  });
})();
