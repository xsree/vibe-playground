"use strict";

(() => {
  // Math & geometry utility helpers
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const phase = (start, end, value) => smooth((value - start) / (end - start));
  const n = value => Number(value.toFixed(3));
  const point = ([x, y]) => `${n(x)} ${n(y)}`;
  const polygon = points => `M${points.map(point).join('L')}Z`;

  /**
   * Helper to set an SVG-based CSS mask on a node.
   */
  const imageMask = (node, content, w, h) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${content}</svg>`;
    node.style.maskImage = node.style.webkitMaskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    node.style.maskSize = node.style.webkitMaskSize = '100% 100%';
  };

  /**
   * Linearly interpolate between two RGB arrays.
   */
  const rgb = (from, to, t) => from.map((value, index) => Math.round(value + (to[index] - value) * t));

  /**
   * Interpolate ink color based on demo scene palettes.
   */
  const ink = (demo, t, alpha = 1) => {
    const fromInk = demo.palettes[demo.from]['--scene-ink'];
    const toInk = demo.palettes[demo.to]['--scene-ink'];
    const mixed = rgb(fromInk, toInk, t);
    return `rgba(${mixed.join(',')},${alpha})`;
  };

  /**
   * Voronoi 半平面交裁剪算法（Sutherland-Hodgman 凸多边形半平面交）：
   * 采用 12 个固定种子点（Seed Points），通过两两生成元之间的垂直平分线构成的半平面依次裁剪初始视口矩形。
   * 该算法生成数学意义上严格封闭且无缝拼接的凸多边形网格，保证 12 个珐琅拼片能够 100% 铺满视口全画幅。
   */
  function enamelCells(w, h) {
    const seedRatios = [
      [0.10, 0.16], [0.36, 0.12], [0.63, 0.19], [0.89, 0.10],
      [0.15, 0.48], [0.40, 0.43], [0.67, 0.49], [0.92, 0.46],
      [0.08, 0.84], [0.34, 0.87], [0.61, 0.81], [0.88, 0.88]
    ];
    const seeds = seedRatios.map(([rx, ry]) => [rx * w, ry * h]);

    return seeds.map((seed, index) => {
      let vertices = [[0, 0], [w, 0], [w, h], [0, h]];

      seeds.forEach((other, otherIndex) => {
        if (index === otherIndex) return;

        // 垂直平分线方程：a*x + b*y - c = 0
        const a = other[0] - seed[0];
        const b = other[1] - seed[1];
        const c = (other[0] ** 2 + other[1] ** 2 - seed[0] ** 2 - seed[1] ** 2) / 2;

        const output = [];
        vertices.forEach((start, i) => {
          const end = vertices[(i + 1) % vertices.length];
          const ds = a * start[0] + b * start[1] - c;
          const de = a * end[0] + b * end[1] - c;

          if (ds <= 1e-7) {
            output.push(start);
          }
          if ((ds < 0 && de > 0) || (ds > 0 && de < 0)) {
            const ratio = ds / (ds - de);
            output.push([
              start[0] + (end[0] - start[0]) * ratio,
              start[1] + (end[1] - start[1]) * ratio
            ]);
          }
        });
        vertices = output;
      });

      return { seed, vertices };
    });
  }

  /**
   * 12 组预定义陶瓷釉裂（Glaze Cracks）生长分支骨架
   */
  const cracks = [
    [[0.61, 0.35], [0.53, 0.47], [0.43, 0.50], [0.34, 0.64], [0.23, 0.70], [0.12, 0.90]],
    [[0.61, 0.35], [0.70, 0.46], [0.74, 0.61], [0.86, 0.72], [0.91, 0.94]],
    [[0.61, 0.35], [0.54, 0.23], [0.43, 0.19], [0.37, 0.05]],
    [[0.61, 0.35], [0.76, 0.29], [0.83, 0.15], [0.97, 0.10]],
    [[0.43, 0.50], [0.35, 0.40], [0.19, 0.43], [0.03, 0.30]],
    [[0.34, 0.64], [0.40, 0.77], [0.37, 0.94]],
    [[0.74, 0.61], [0.63, 0.70], [0.58, 0.86], [0.51, 1.00]],
    [[0.54, 0.23], [0.65, 0.14], [0.66, 0.00]],
    [[0.23, 0.70], [0.10, 0.65], [0.00, 0.73]],
    [[0.86, 0.72], [1.00, 0.67]],
    [[0.76, 0.29], [0.86, 0.40], [1.00, 0.35]],
    [[0.43, 0.19], [0.24, 0.15], [0.12, 0.02]]
  ];

  /**
   * 10 Craft Transition Effects Metadata
   */
  window.CRAFT_EFFECTS = [
    {
      id: 'iris',
      name: '机械光圈',
      en: 'MECHANICAL IRIS',
      tag: '精密仪式',
      short: '弧形叶片合拢，再打开新主题',
      description: '六枚弧形叶片旋转合拢，金属接缝掠过细微反光；光圈完全闭合时换场，再打开另一种光线。',
      mode: 'container'
    },
    {
      id: 'weave',
      name: '经纬织光',
      en: 'WOVEN LIGHT',
      tag: '交织成形',
      short: '经线与纬线交织出新主题',
      description: '新主题沿横纵细线逐渐交织成形，经纬交点带着细微明暗，最后织纹自然隐去。',
      mode: 'container'
    },
    {
      id: 'enamel',
      name: '珐琅拼片',
      en: 'ENAMEL MOSAIC',
      tag: '工艺拼色',
      short: '大块拼片换光，金属细线短暂浮现',
      description: '不规则的大块拼片依次舒展出新主题，接缝暂时显出暖金细线与柔和釉光，结束时恢复完整界面。',
      mode: 'container'
    },
    {
      id: 'relief',
      name: '浮雕换光',
      en: 'RELIEF LIGHTING',
      tag: '浅浮雕',
      short: '光源转向，浅浮雕的阴影随之移动',
      description: '文字、边框与山川短暂显出浅浮雕，光源从一侧移向另一侧；细小的亮边与投影随后收回纸面。',
      mode: 'scene'
    },
    {
      id: 'glaze',
      name: '釉裂透光',
      en: 'GLAZE CRACKS',
      tag: '纤细生长',
      short: '细裂纹生长，新光从裂隙渗入',
      description: '纤细的釉裂沿固定分支缓慢生长，新主题从裂隙中渗出并逐渐连成一片，最后裂纹轻轻愈合。',
      mode: 'container'
    },
    {
      id: 'grating',
      name: '光栅显像',
      en: 'OPTICAL GRATING',
      tag: '光学纹理',
      short: '两层细线网错动，图像逐渐凝聚',
      description: '两层细密线网以微小夹角错动，形成流动的干涉纹理；新的明暗逐渐凝聚成完整画面。',
      mode: 'container'
    },
    {
      id: 'fog',
      name: '雾面凝露',
      en: 'CONDENSATION',
      tag: '湿润空气',
      short: '雾面蒙起，清晰区域缓缓相连',
      description: '画面蒙上一层轻雾，少量清晰区域逐渐扩大、连成一片；凝露带着柔亮边缘滑落，留下新的光线。',
      mode: 'container'
    },
    {
      id: 'scroll',
      name: '卷轴舒展',
      en: 'SCROLL UNFURL',
      tag: '书卷气息',
      short: '旧纸沿圆柱收卷，新纸在身后舒展',
      description: '旧主题沿竖直卷轴收起，新主题在身后舒展；卷边以圆柱明暗、纸面厚度和随行投影呈现。',
      mode: 'container'
    },
    {
      id: 'retrace',
      name: '描边重铸',
      en: 'CONTOUR RECAST',
      tag: '重新绘制',
      short: '收敛轮廓，游光经过，再填入新色',
      description: '文字与山川暂时收敛为细轮廓，一束光沿描边游走，再逐渐填入新主题的颜色，像重新绘制一次界面。',
      mode: 'scene'
    },
    {
      id: 'lunar',
      name: '月相时序',
      en: 'DAY NIGHT CYCLE',
      tag: '时间流逝',
      short: '经过暮色或晨曦，日月落下再升起',
      description: '天空经过一段暮色或晨曦，日月落下再升起，山川随光线改变，文字与细线在随后的一拍渐渐亮起。',
      mode: 'scene'
    }
  ];

  // Stage layer class compatibility alias
  class CraftTransitionLayer extends window.AuthoredTransitionLayer {}
  window.CraftTransitionLayer = CraftTransitionLayer;

  // --- Handlers for 10 Craft Transition Effects ---

  // 1. iris (机械光圈)
  window.registerTransitionHandler('iris', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('iris', 7), w, h);
    const reach = Math.hypot(w / 2, h / 2) * 1.6;
    const aperture = reach * (1 - Math.sin(Math.PI * t));
    const rotation = (dark ? 1 : -1) * t * Math.PI / 3;

    const inner = angle => [
      w / 2 + Math.cos(angle) * aperture,
      h / 2 + Math.sin(angle) * aperture
    ];
    const outer = angle => [
      w / 2 + Math.cos(angle) * reach * 3,
      h / 2 + Math.sin(angle) * reach * 3
    ];

    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3 + rotation;
      const b = a + Math.PI / 3;
      const middle = inner((a + b) / 2);
      const path = layer.paths[index];
      path.setAttribute('d', `M${point(inner(a))}Q${point(middle)} ${point(inner(b))}L${point(outer(b))}L${point(outer(a))}Z`);
      path.setAttribute('fill', `hsl(${130 + index * 2} 15% ${18 + (index % 3) * 3}%)`);
      path.setAttribute('stroke', '#99a68b');
      path.setAttribute('stroke-width', '.7');
    }

    layer.paths[6].setAttribute('d', polygon(Array.from({ length: 6 }, (_, i) => inner(i * Math.PI / 3 + rotation))));
    layer.paths[6].setAttribute('stroke', '#e5d4a4');
    layer.paths[6].setAttribute('stroke-width', '1');

    layer.svg.style.opacity = String(phase(0, 0.09, t) * (1 - phase(0.91, 1, t)));
    layer.svg.style.filter = `drop-shadow(0 0 ${h * 0.018 * pulse}px #0b1b16aa)`;
    demo.next.style.opacity = raw < 0.5 ? '0' : '1';
  });

  // 2. weave (经纬织光)
  window.registerTransitionHandler('weave', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    const warp = phase(0, 1, t);
    const weft = phase(0.15, 1, t);
    const pitch = Math.max(5, w / 44);

    const weavePattern = `<defs><pattern id="weave" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><rect width="${pitch * warp}" height="${pitch}" fill="white"/><rect width="${pitch}" height="${pitch * weft}" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#weave)"/>`;
    imageMask(demo.next, weavePattern, w, h);

    if (raw === 1) {
      demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    }

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.24);
    overlay.style.backgroundImage = `repeating-linear-gradient(90deg,transparent 0 ${Math.max(0, pitch * warp - 0.7)}px,#fff3da99 ${pitch * warp}px,transparent ${pitch * warp + 0.7}px ${pitch}px),repeating-linear-gradient(0deg,transparent 0 ${Math.max(0, pitch * weft - 0.7)}px,#16332788 ${pitch * weft}px,transparent ${pitch * weft + 0.7}px ${pitch}px)`;
  });

  // 3. enamel (珐琅拼片)
  window.registerTransitionHandler('enamel', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw } = frame;
    const pulse = Math.sin(Math.PI * t);

    if (!stage.enamelLayout || stage.enamelLayout.w !== w || stage.enamelLayout.h !== h) {
      stage.enamelLayout = { w, h, cells: enamelCells(w, h) };
    }

    const layer = stage.dimensions(stage.vector('enamel', 12), w, h);
    let mask = '';

    stage.enamelLayout.cells.forEach((cell, index) => {
      const amount = phase(index * 0.035, 0.56 + index * 0.035, t);
      const d = polygon(cell.vertices);
      mask += `<path d="${d}" fill="white" transform="translate(${cell.seed.join(' ')}) scale(${amount}) translate(${-cell.seed[0]} ${-cell.seed[1]})"/>`;
      layer.paths[index].setAttribute('d', d);
      layer.paths[index].setAttribute('stroke', '#c0a775');
      layer.paths[index].setAttribute('stroke-width', String(Math.max(0.5, w * 0.0012)));
      layer.paths[index].setAttribute('fill', index % 2 ? '#fff5d51a' : '#8ea88e12');
    });

    imageMask(demo.next, mask, w, h);
    if (raw === 1) {
      demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    }
    layer.svg.style.opacity = String(pulse * 0.72);
  });

  // 4. relief (浮雕换光)
  window.registerTransitionHandler('relief', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t } = frame;
    const pulse = Math.sin(Math.PI * t);

    stage.mix(t);
    const radius = Math.min(w, h) * 0.006 * pulse;
    const dx = Math.cos(Math.PI * t) * radius;
    const dy = Math.sin(Math.PI * t) * radius * 0.55;

    const textTargets = ['.scene-copy h3', '.scene-brand', '.scene-link'];
    for (const selector of textTargets) {
      stage.withPart(selector, node => {
        node.style.textShadow = `${-dx}px ${-dy}px ${radius * 0.3}px #fffbe1c0, ${dx}px ${dy}px ${radius * 0.5}px #112b2077`;
      });
    }

    const boxTargets = ['.scene-topbar', '.scene-bottom', '.landscape'];
    for (const selector of boxTargets) {
      stage.withPart(selector, node => {
        node.style.boxShadow = `inset ${-dx}px ${-dy}px ${radius}px #fffae055, inset ${dx}px ${dy}px ${radius}px #142b2255`;
      });
    }

    const landscapeLayers = ['.land-far', '.land-near', '.land-front'];
    for (const selector of landscapeLayers) {
      stage.withPart(selector, node => {
        node.style.filter = `drop-shadow(${dx}px ${dy}px ${radius * 0.6}px #162e2477)`;
      });
    }

    demo.base.style.filter = `saturate(${1 - pulse * 0.55})`;
  });

  // 5. glaze (釉裂透光)
  window.registerTransitionHandler('glaze', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('glaze', cracks.length), w, h);
    let mask = '';

    cracks.forEach((branch, index) => {
      const d = `M${branch.map(([x, y]) => point([x * w, y * h])).join('L')}`;
      const growth = phase(index * 0.022, 0.5 + index * 0.022, t);
      const width = Math.max(0.5, Math.hypot(w, h) * 1.1 * phase(0.26, 1, t) ** 2);
      mask += `<path d="${d}" pathLength="100" stroke="white" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="${100 * (1 - growth)}"/>`;

      const path = layer.paths[index];
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '100');
      path.setAttribute('stroke', '#d6c599');
      path.setAttribute('stroke-width', String(Math.max(0.55, w * 0.001)));
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-dasharray', '100');
      path.setAttribute('stroke-dashoffset', String(100 * (1 - growth)));
    });

    mask += `<rect width="100%" height="100%" fill="white" opacity="${phase(0.8, 1, t)}"/>`;
    imageMask(demo.next, mask, w, h);
    demo.next.style.opacity = String(phase(0, 0.12, t));
    layer.svg.style.opacity = String(pulse * 0.8);
  });

  // 6. grating (光栅显像)
  window.registerTransitionHandler('grating', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    const pitch = Math.max(3, w / 170);
    const angle = 7 * pulse;

    const pattern = (id, rotation, offset) =>
      `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotation}) translate(${offset} 0)"><rect width="${pitch * t}" height="${pitch}" fill="white"/></pattern>`;

    imageMask(
      demo.next,
      `<defs>${pattern('a', 0, t * pitch * 2)}${pattern('b', angle, -t * pitch * 2)}</defs><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>`,
      w,
      h
    );

    if (raw === 1) {
      demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    }

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.28);
    overlay.style.backgroundImage = `repeating-linear-gradient(90deg,#15382888 0 .6px,transparent .6px ${pitch}px),repeating-linear-gradient(${90 + angle}deg,#f5edd2aa 0 .7px,transparent .7px ${pitch}px)`;
    overlay.style.backgroundPosition = `${t * pitch * 5}px 0, ${-t * pitch * 5}px 0`;
  });

  // 7. fog (雾面凝露)
  window.registerTransitionHandler('fog', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    const centers = [[0.22, 0.35], [0.68, 0.50], [0.46, 0.80], [0.86, 0.20], [0.08, 0.85]];
    const reach = Math.hypot(w, h);
    const masks = centers.map(([x, y], index) => {
      const radius = reach * phase(index * 0.035, 1, t) ** 1.7;
      return `radial-gradient(circle at ${x * 100}% ${y * 100}%,#000 ${radius * 0.64}px,transparent ${Math.max(0.01, radius)}px)`;
    }).join(',');

    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 1 ? 'none' : masks;
    demo.next.style.opacity = String(phase(0, 0.1, t));
    demo.base.style.filter = `blur(${pulse * w * 0.004}px)`;
    demo.next.style.filter = `blur(${pulse * w * 0.002}px)`;

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.32 * (1 - phase(0.55, 1, t)));
    overlay.style.backgroundImage = 'linear-gradient(120deg,#eff3e8,#c7d7cc99)';

    const layer = stage.dimensions(stage.vector('fog', 8), w, h);
    layer.paths.forEach((path, index) => {
      const x = w * (0.12 + (index * 0.137) % 0.8);
      const y = h * (0.14 + (index * 0.187) % 0.62) + h * 0.06 * t;
      const r = Math.min(w, h) * (0.009 + (index % 3) * 0.003);
      path.setAttribute('d', `M${n(x - r)} ${n(y)}a${r} ${r * 1.2} 0 1 0 ${r * 2} 0a${r} ${r * 1.2} 0 1 0 ${-r * 2} 0Z`);
      path.setAttribute('fill', '#ecf7eb18');
      path.setAttribute('stroke', '#f4ffe8aa');
      path.setAttribute('stroke-width', '.7');
    });
    layer.svg.style.opacity = String(pulse * 0.72);
  });

  // 8. scroll (卷轴舒展)
  window.registerTransitionHandler('scroll', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    const layer = stage.dimensions(stage.vector('scroll', 3, true), w, h);
    const x = w * (dark ? 1 - t : t);
    const band = Math.min(w, h) * 0.085 * pulse;

    demo.base.style.zIndex = '2';
    demo.next.style.zIndex = '1';
    demo.base.style.clipPath = dark ? `inset(0 ${w - x}px 0 0)` : `inset(0 0 0 ${x}px)`;

    const left = x - band;
    const right = x + band;

    layer.paths[0].setAttribute('d', `M${left} 0Q${x} ${-band * 0.7} ${right} 0L${right} ${h}Q${x} ${h + band * 0.7} ${left} ${h}Z`);
    layer.paths[0].style.filter = `drop-shadow(${(dark ? -1 : 1) * band * 0.16}px 0 ${band * 0.22}px #142c2266)`;

    layer.paths[1].setAttribute('d', `M${left} 0Q${x} ${band * 0.65} ${right} 0M${left} ${h}Q${x} ${h - band * 0.65} ${right} ${h}`);
    layer.paths[1].setAttribute('stroke', '#9b9c7f');
    layer.paths[1].setAttribute('stroke-width', '.8');

    layer.paths[2].setAttribute('d', `M${x + band * 0.35} 0V${h}`);
    layer.paths[2].setAttribute('stroke', '#fffce0aa');
    layer.paths[2].setAttribute('stroke-width', '1');

    for (const [name, value] of Object.entries({ x1: left, y1: 0, x2: right, y2: 0 })) {
      layer.shade.setAttribute(name, String(value));
    }
    layer.svg.style.opacity = String(phase(0, 0.04, t) * (1 - phase(0.96, 1, t)));
  });

  // 9. retrace (描边重铸)
  window.registerTransitionHandler('retrace', (stage, frame) => {
    const { demo } = stage;
    const { width: w, t } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    stage.mix(t);
    const outline = phase(0.03, 0.27, t) * (1 - phase(0.7, 0.98, t));

    stage.withPart('.scene-copy h3', heading => {
      heading.style.color = ink(demo, t, 1 - outline);
      heading.style.webkitTextStroke = `${Math.max(0.4, w * 0.0008)}px ${ink(demo, t, outline * 0.8)}`;
    });

    const contourLandscape = ['.land-far', '.land-near', '.land-front', '.land-river'];
    for (const selector of contourLandscape) {
      stage.withPart(selector, part => {
        part.style.fillOpacity = String(1 - outline * 0.96);
        part.style.stroke = ink(demo, t, outline * 0.8);
        part.style.strokeWidth = '1.3';
        part.style.strokeDasharray = '85 12';
        part.style.strokeDashoffset = String(-t * 460);
      });
    }

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.17);
    const x = -30 + t * 160;
    overlay.style.backgroundImage = `linear-gradient(110deg,transparent ${x - 4}%,#f0d7a2aa ${x}%,transparent ${x + 4}%)`;
  });

  // 10. lunar (月相时序)
  window.registerTransitionHandler('lunar', (stage, frame) => {
    const { demo } = stage;
    const { t, dark } = frame;

    stage.mix(phase(0.08, 0.96, t));

    const from = demo.palettes[demo.from]['--sky'];
    const to = demo.palettes[demo.to]['--sky'];
    const twilight = dark ? [153, 109, 108] : [192, 151, 120];
    const sky = t < 0.5 ? rgb(from, twilight, smooth(t * 2)) : rgb(twilight, to, smooth(t * 2 - 1));
    demo.base.style.setProperty('--sky', `rgb(${sky.join(',')})`);

    const darkness = dark ? t : 1 - t;
    const rise = Math.sin(Math.PI * t) * 280;
    const visibility = 1 - phase(85, 150, rise);

    stage.withPart('.land-sun', sun => {
      sun.style.transform = `translate(${-28 * darkness}px, ${rise - 10 * darkness}px) scale(${1 - 0.24 * darkness})`;
      sun.style.opacity = String(visibility);
    });

    stage.withPart('.land-moon-cutout', cutout => {
      cutout.style.transform = `translateY(${rise}px)`;
      cutout.style.opacity = String(darkness * visibility);
    });

    const textTargets = ['.scene-copy h3', '.scene-brand', '.scene-nav'];
    for (const selector of textTargets) {
      stage.withPart(selector, node => {
        node.style.color = ink(demo, phase(0.35, 1, t));
      });
    }

    stage.withPart('.scene-link', link => {
      stage.helpers.mixColors(link, demo.palettes[demo.from], demo.palettes[demo.to], phase(0.5, 1, t));
    });
  });
})();
