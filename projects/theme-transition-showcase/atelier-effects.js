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
   * Helper to apply an SVG data-URI mask to a DOM node.
   */
  const imageMask = (node, body, w, h) => {
    const svg = `<svg xmlns="${ns}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
    node.style.maskImage = node.style.webkitMaskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    node.style.maskSize = node.style.webkitMaskSize = '100% 100%';
  };

  /**
   * 求解斐波那契黄金分割嵌套矩形与对数螺旋采样点。
   * 采用黄金比例 phi = 0.6180339887，沿四方顺时针依次剖分主画幅，
   * 返回各分区的包围盒坐标、中心点以及内切圆弧采样控制点。
   */
  function goldenBoxes(w, h) {
    const phi = 0.6180339887;
    let x = 0;
    let y = 0;
    let rw = w;
    let rh = h;
    const boxes = [];

    for (let i = 0; i < 6; i++) {
      const dir = i % 4;
      if (dir === 0) {
        const bw = rw * phi;
        boxes.push({ x, y, w: bw, h: rh, cx: x + bw / 2, cy: y + rh / 2 });
        x += bw;
        rw -= bw;
      } else if (dir === 1) {
        const bh = rh * phi;
        boxes.push({ x, y, w: rw, h: bh, cx: x + rw / 2, cy: y + bh / 2 });
        y += bh;
        rh -= bh;
      } else if (dir === 2) {
        const bw = rw * phi;
        boxes.push({ x: x + rw - bw, y, w: bw, h: rh, cx: x + rw - bw / 2, cy: y + rh / 2 });
        rw -= bw;
      } else {
        const bh = rh * phi;
        boxes.push({ x, y: y + rh - bh, w: rw, h: bh, cx: x + rw / 2, cy: y + rh - bh / 2 });
        rh -= bh;
      }
    }
    boxes.push({ x, y, w: rw, h: rh, cx: x + rw / 2, cy: y + rh / 2 });
    return boxes;
  }

  /**
   * 12 种工坊与印艺（Atelier & Printcraft）转场效果元数据
   */
  window.ATELIER_EFFECTS = [
    {
      id: 'aurora',
      name: '极光帷幕',
      en: 'AURORA CURTAIN',
      tag: '天际流光',
      short: '多层垂向极光摆动，随波浪前沿换夜或换昼',
      description: '天际垂下翠绿、青金与暖珀交织的极光纱幕，随正弦波轻柔摆动；光幕拂过之处，画面平滑落入新主题。',
      mode: 'container'
    },
    {
      id: 'sundial',
      name: '日晷寻影',
      en: 'SUNDIAL GNOMON',
      tag: '光阴刻度',
      short: '以日月为晷针圆心，光影携刻度盘旋扫过',
      description: '围绕天体中心浮现日晷刻度盘，一道带有柔和半影的晷针长影顺时针扫过周天，将界面带入新的时刻。',
      mode: 'scene'
    },
    {
      id: 'tidal',
      name: '潮汐漫滩',
      en: 'TIDAL SHORELINE',
      tag: '海浪呼吸',
      short: '弧形潮水携白沫与湿沙反光漫过画面',
      description: '带有细腻泡沫边线与湿润反光带的潮水自岸边涌起，伴随轻柔的回浪呼吸漫过山川与文字，退定后完成换场。',
      mode: 'container'
    },
    {
      id: 'fan',
      name: '折扇开合',
      en: 'FOLDING FAN',
      tag: '扇骨折面',
      short: '十一根扇骨携明暗交替的扇面徐徐展开',
      description: '以画面下方为扇轴枢钮，十一根修长扇骨携折面次第展开；奇偶折面随受光呈现深浅层次，展平后隐去扇骨。',
      mode: 'container'
    },
    {
      id: 'rubbing',
      name: '碑拓敷墨',
      en: 'INK RUBBING',
      tag: '传拓肌理',
      short: '先显黑白碑刻肌理，拓包依次轻扑上墨',
      description: '模拟传统传拓工艺：画面先浮现高对比度的纸本碑刻肌理，随后多处圆形拓包依次轻扑晕染，将新主题墨色均匀吃透。',
      mode: 'scene'
    },
    {
      id: 'movable',
      name: '活字归版',
      en: 'MOVABLE TYPE',
      tag: '印版落锁',
      short: '版式字块错峰微抬换墨，配铜线规矩归位',
      description: '页头、标题、插画与页脚化作独立的活字印版，在裁切规矩线与铜线框中错峰微抬、换上新墨，再严丝合缝地落锁归版。',
      mode: 'scene'
    },
    {
      id: 'tiltshift',
      name: '移轴微缩',
      en: 'TILT-SHIFT FOCUS',
      tag: '浅景深扫掠',
      short: '倾斜焦平面扫过柔焦散景，所经之处恢复清晰',
      description: '画面暂化作柔和的浅景深散景，一道微倾的清晰焦平面携取景框线扫过界面，定焦后展现清晰的新主题。',
      mode: 'container'
    },
    {
      id: 'birefringence',
      name: '双折射叠影',
      en: 'BIREFRINGENCE',
      tag: '偏振寻常光',
      short: '方解石分离冷暖偏振双影，旋移后精准重合',
      description: '模拟冰洲石双折射现象：画面沿偏振轴短暂分离为冷暖两束微错的重影，随晶体旋移重新严密重合成新画面。',
      mode: 'container'
    },
    {
      id: 'darkroom',
      name: '暗房显影',
      en: 'DARKROOM DEVELOPER',
      tag: '安全灯显像',
      short: '琥珀安全灯下微晃显影盘，色阶次第浮现',
      description: '界面浸入暗房琥珀红安全灯与银盐底片质感，伴随显影液面的轻柔晃动，高光、中间调与暗部依次显影定影。',
      mode: 'scene'
    },
    {
      id: 'louvers',
      name: '建筑百叶',
      en: 'ARCHITECTURAL LOUVERS',
      tag: '立体格栅',
      short: '十片立体格栅依次翻转，带厚度高光与受光变化',
      description: '十片宽幅建筑遮阳百叶沿纵向波浪依次做三维翻转，叶片切面呈现真实的受光高光与背阴明暗，合拢后融为完整平面。',
      mode: 'container'
    },
    {
      id: 'halftone',
      name: '半调网点',
      en: 'EDITORIAL HALFTONE',
      tag: '画报网屏',
      short: '复古印刷网点由细变粗，沿对角波前融合成面',
      description: '致敬复古印刷画报：交接区域化作规则排列的半调圆点矩阵，网点由细变粗直至融合成平滑新画面。',
      mode: 'container'
    },
    {
      id: 'fibonacci',
      name: '黄金螺旋',
      en: 'FIBONACCI APERTURE',
      tag: '古典构图',
      short: '沿黄金分割矩形与螺线由外向内次第展开',
      description: '画面按斐波那契黄金矩形层层向内剖分，金色螺线与构图框短暂浮现，各黄金分区由外向内依次舒展为新主题。',
      mode: 'container'
    }
  ];

  // Stage layer class compatibility alias
  class AtelierTransitionLayer extends window.PhysicalTransitionLayer {}
  window.AtelierTransitionLayer = AtelierTransitionLayer;

  // --- Handlers for 12 Atelier Transition Effects ---

  // 1. aurora (极光帷幕)
  window.registerTransitionHandler('aurora', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    const layer = stage.dimensions(stage.vector('aurora', 4, true), w, h);
    const waveCount = 36;
    const sweep = (dark ? t : 1 - t) * (w * 1.3) - w * 0.15;

    // 构建波浪形极光边缘
    const wavePoints = Array.from({ length: waveCount + 1 }, (_, i) => {
      const y = (i / waveCount) * h;
      const angle = (i / waveCount) * Math.PI * 3 + t * 4;
      const x = sweep + Math.sin(angle) * (w * 0.08) * pulse;
      return [x, y];
    });

    const boundaryX = dark ? 0 : w;
    const curtainPath = polygon([[boundaryX, 0], ...wavePoints, [boundaryX, h]]);
    demo.next.style.clipPath = raw === 1 ? 'none' : `path('${curtainPath}')`;
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 绘制 4 层半透明极光飘带
    layer.paths.forEach((path, idx) => {
      const offset = (idx - 1.5) * (w * 0.04) * pulse;
      const ribPoints = wavePoints.map(([x, y]) => [x + offset, y]);
      path.setAttribute('d', `M${ribPoints.map(point).join('L')}`);
      path.setAttribute('stroke', idx % 2 === 0 ? '#4de8b2' : '#7cb8ff');
      path.setAttribute('stroke-width', String(Math.max(1, w * 0.015 * pulse)));
      path.setAttribute('opacity', String(pulse * (0.4 + idx * 0.15)));
      path.style.filter = `blur(${w * (0.008 + idx * 0.003)}px)`;
    });

    layer.svg.style.opacity = String(pulse * 0.85);
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.25);
    overlay.style.backgroundImage = `linear-gradient(${dark ? '90deg' : '270deg'}, #3de6b022, #7aa5d833, transparent)`;
  });

  // 2. sundial (日晷寻影)
  window.registerTransitionHandler('sundial', (stage, frame) => {
    const { demo, helpers } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    // 以日晷为圆心（默认锚定在天体附近）
    const cx = w * 0.71;
    const cy = h * 0.26;
    const radius = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.1;

    // 顺时针旋转角度 0 ~ 360deg
    const angle = t * 360;
    const mask = `conic-gradient(from -90deg at ${cx}px ${cy}px, #000 0deg, #000 ${angle}deg, transparent ${angle}deg, transparent 360deg)`;
    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 1 ? 'none' : mask;
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 绘制日晷刻度环与晷针长影
    const layer = stage.dimensions(stage.vector('sundial', 13), w, h);
    const gnomonLen = radius * 0.95;
    const rad = ((angle - 90) * Math.PI) / 180;
    const gx = cx + Math.cos(rad) * gnomonLen;
    const gy = cy + Math.sin(rad) * gnomonLen;

    // 第 0 条线为晷针阴影
    layer.paths[0].setAttribute('d', `M${cx} ${cy}L${n(gx)} ${n(gy)}`);
    layer.paths[0].setAttribute('stroke', dark ? '#0a1612' : '#2a3d2e');
    layer.paths[0].setAttribute('stroke-width', String(Math.max(1.5, w * 0.006)));
    layer.paths[0].setAttribute('opacity', String(pulse * 0.85));
    layer.paths[0].style.filter = `blur(${w * 0.003}px)`;

    // 12 个时辰径向刻度线
    for (let i = 0; i < 12; i++) {
      const tickRad = ((i * 30 - 90) * Math.PI) / 180;
      const r0 = radius * 0.22;
      const r1 = radius * 0.32;
      const x0 = cx + Math.cos(tickRad) * r0;
      const y0 = cy + Math.sin(tickRad) * r0;
      const x1 = cx + Math.cos(tickRad) * r1;
      const y1 = cy + Math.sin(tickRad) * r1;
      const p = layer.paths[i + 1];
      p.setAttribute('d', `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`);
      p.setAttribute('stroke', '#d8c28a');
      p.setAttribute('stroke-width', i % 3 === 0 ? '1.2' : '0.6');
      p.setAttribute('opacity', String(pulse * (0.2 + (i % 3 === 0 ? 0.35 : 0.15))));
    }

    layer.svg.style.opacity = String(pulse * 0.8);
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.2);
    overlay.style.backgroundImage = `radial-gradient(circle at ${cx}px ${cy}px, #fcedc533 0%, transparent 60%)`;

    // 场景天体联动
    stage.withPart('.land-sun', sun => {
      sun.style.transform = `translate(${-28 * t}px, ${-10 * t}px) rotate(${angle * 0.5}deg) scale(${1 - 0.24 * t})`;
    });
  });

  // 3. tidal (潮汐漫滩)
  window.registerTransitionHandler('tidal', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    const layer = stage.dimensions(stage.vector('tidal', 3), w, h);
    const waveCount = 48;
    const lead = h * (1.2 - t * 1.4);

    // 潮汐波前曲线
    const wave = offset =>
      Array.from({ length: waveCount + 1 }, (_, i) => {
        const x = (i / waveCount) * w;
        const s = Math.sin((i / waveCount) * Math.PI * 4 + t * 5);
        const y = lead + s * (h * 0.05 * pulse) + offset;
        return [x, y];
      });

    const crest = wave(0);
    const tidePath = polygon([[0, h], ...crest, [w, h]]);
    demo.next.style.clipPath = raw === 1 ? 'none' : `path('${tidePath}')`;
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 浪花白沫边线
    layer.paths[0].setAttribute('d', `M${crest.map(point).join('L')}`);
    layer.paths[0].setAttribute('stroke', '#e4f7f2');
    layer.paths[0].setAttribute('stroke-width', String(Math.max(1, w * 0.005)));
    layer.paths[0].setAttribute('stroke-dasharray', '8 4');
    layer.paths[0].setAttribute('opacity', String(pulse * 0.75));

    // 回浪湿润水渍
    const foam = wave(h * 0.03 * pulse);
    layer.paths[1].setAttribute('d', `M${foam.map(point).join('L')}`);
    layer.paths[1].setAttribute('stroke', '#9ed9cb');
    layer.paths[1].setAttribute('stroke-width', '0.8');
    layer.paths[1].setAttribute('opacity', String(pulse * 0.5));

    // 漫滩高光
    const sandGlow = wave(-h * 0.02 * pulse);
    layer.paths[2].setAttribute('d', `M${sandGlow.map(point).join('L')}`);
    layer.paths[2].setAttribute('stroke', '#fffbe6');
    layer.paths[2].setAttribute('stroke-width', '0.6');
    layer.paths[2].setAttribute('opacity', String(pulse * 0.6));

    layer.svg.style.opacity = String(pulse * 0.85);
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.22);
    overlay.style.backgroundImage = 'linear-gradient(to top, #caede444, transparent 70%)';
  });

  // 4. fan (折扇开合)
  window.registerTransitionHandler('fan', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    // 扇轴设在画面底部中央下方
    const pivot = [w / 2, h * 1.15];
    const reach = Math.hypot(w / 2, h * 1.15) * 1.1;
    const ribCount = 11;
    const maxHalfAngle = (68 * Math.PI) / 180;
    const currentSpan = maxHalfAngle * t;

    // 生成当前扇面展开的边界多边形
    const arcSamples = 24;
    const arcPoints = Array.from({ length: arcSamples + 1 }, (_, i) => {
      const a = -Math.PI / 2 - currentSpan + (i / arcSamples) * currentSpan * 2;
      return [pivot[0] + Math.cos(a) * reach, pivot[1] + Math.sin(a) * reach];
    });

    const fanClip = polygon([pivot, ...arcPoints]);
    demo.next.style.clipPath = raw === 1 ? 'none' : `path('${fanClip}')`;
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 绘制 11 根骨扇骨与折面阴影
    const layer = stage.dimensions(stage.vector('fan', ribCount * 2), w, h);
    for (let i = 0; i < ribCount; i++) {
      const a = -Math.PI / 2 - currentSpan + (i / (ribCount - 1)) * currentSpan * 2;
      const endPt = [pivot[0] + Math.cos(a) * reach, pivot[1] + Math.sin(a) * reach];

      // 扇骨
      const rib = layer.paths[i];
      rib.setAttribute('d', `M${point(pivot)}L${point(endPt)}`);
      rib.setAttribute('stroke', '#a38a5e');
      rib.setAttribute('stroke-width', String(Math.max(0.6, w * 0.0015)));
      rib.setAttribute('opacity', String(pulse * 0.8));

      // 折面受光面
      if (i < ribCount - 1) {
        const nextA = -Math.PI / 2 - currentSpan + ((i + 1) / (ribCount - 1)) * currentSpan * 2;
        const nextPt = [pivot[0] + Math.cos(nextA) * reach, pivot[1] + Math.sin(nextA) * reach];
        const facet = layer.paths[ribCount + i];
        facet.setAttribute('d', polygon([pivot, endPt, nextPt]));
        facet.setAttribute('fill', i % 2 === 0 ? '#ffffff14' : '#0000001a');
        facet.setAttribute('opacity', String(pulse * 0.55));
      }
    }

    layer.svg.style.opacity = String(pulse * 0.9);
  });

  // 5. rubbing (碑拓敷墨)
  window.registerTransitionHandler('rubbing', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    // 拓包轻扑的 6 个核心浸润点
    const pads = [
      [0.25, 0.35],
      [0.68, 0.28],
      [0.45, 0.58],
      [0.78, 0.68],
      [0.18, 0.75],
      [0.85, 0.2]
    ];
    const reach = Math.hypot(w, h);

    const masks = pads
      .map(([px, py], i) => {
        const padProgress = phase(i * 0.06, 0.65 + i * 0.06, t);
        const radius = reach * Math.pow(padProgress, 1.4) * 0.7;
        return `radial-gradient(circle at ${px * 100}% ${py * 100}%, #000 ${radius * 0.7}px, transparent ${Math.max(0.1, radius)}px)`;
      })
      .join(',');

    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 1 ? 'none' : masks;
    demo.next.style.opacity = String(phase(0, 0.15, t));

    // 碑刻肌理滤镜与扑墨质感
    demo.base.style.filter = `contrast(${1 + pulse * 0.6}) grayscale(${pulse * 0.8})`;

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.35);
    overlay.style.backgroundImage = 'radial-gradient(circle, #10261daa 1px, transparent 1px)';
    overlay.style.backgroundSize = `${Math.max(3, w * 0.012)}px ${Math.max(3, w * 0.012)}px`;

    // 场景文字呈现拓印加粗与淡入
    stage.withPart('.scene-copy h3', title => {
      title.style.letterSpacing = `${pulse * 0.02 * w}px`;
    });
  });

  // 6. movable (活字归版)
  window.registerTransitionHandler('movable', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, dark } = frame;
    const pulse = Math.sin(Math.PI * t);

    stage.mix(t);

    // 各版块错峰微抬与换墨位移 (模拟活字字模抬起落锁)
    const blocks = [
      { sel: '.scene-topbar', delay: 0.05, lift: -12 },
      { sel: '.scene-copy', delay: 0.15, lift: -18 },
      { sel: '.landscape', delay: 0.25, lift: -22 },
      { sel: '.scene-bottom', delay: 0.35, lift: -10 }
    ];

    blocks.forEach(({ sel, delay, lift }) => {
      const p = phase(delay, 0.6 + delay, t);
      const liftZ = Math.sin(Math.PI * p) * lift;
      stage.withPart(sel, el => {
        el.style.transform = `translateY(${liftZ}px)`;
        el.style.boxShadow = `0 ${Math.abs(liftZ) * 0.8}px ${Math.abs(liftZ) * 1.5}px rgba(12, 28, 20, 0.35)`;
      });
    });

    // 绘制铜线版框与裁切规矩线
    const layer = stage.dimensions(stage.vector('movable', 8), w, h);
    const pad = w * 0.04;
    layer.paths[0].setAttribute('d', `M${pad} ${pad}H${w - pad}V${h - pad}H${pad}Z`);
    layer.paths[0].setAttribute('stroke', '#d4af37');
    layer.paths[0].setAttribute('stroke-width', '1');
    layer.paths[0].setAttribute('stroke-dasharray', `${w * 0.04} 8`);
    layer.paths[0].setAttribute('opacity', String(pulse * 0.7));

    // 4 处角规矩标尺
    const markLen = w * 0.025;
    const marks = [
      [pad, pad + markLen, pad, pad, pad + markLen, pad],
      [w - pad - markLen, pad, w - pad, pad, w - pad, pad + markLen],
      [pad, h - pad - markLen, pad, h - pad, pad + markLen, h - pad],
      [w - pad - markLen, h - pad, w - pad, h - pad, w - pad, h - pad - markLen]
    ];
    marks.forEach((pts, i) => {
      layer.paths[i + 1].setAttribute('d', `M${pts[0]} ${pts[1]}L${pts[2]} ${pts[3]}L${pts[4]} ${pts[5]}`);
      layer.paths[i + 1].setAttribute('stroke', '#b8860b');
      layer.paths[i + 1].setAttribute('stroke-width', '1.2');
      layer.paths[i + 1].setAttribute('opacity', String(pulse * 0.8));
    });

    layer.svg.style.opacity = String(pulse * 0.85);
  });

  // 7. tiltshift (移轴微缩)
  window.registerTransitionHandler('tiltshift', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    // 倾斜焦平面横扫：中心线 y 坐标由上至下扫描
    const focalY = t * h * 1.2 - h * 0.1;
    const bandWidth = h * 0.28;

    // 景深柔焦散景模糊
    const blurAmount = pulse * w * 0.012;
    demo.base.style.filter = `blur(${blurAmount}px)`;
    demo.next.style.filter = `blur(${blurAmount * (1 - phase(0.4, 1, t))}px)`;

    // 焦平面区域清晰显现新主题
    const mask = `linear-gradient(105deg, transparent 0%, #000 ${Math.max(0, focalY - bandWidth * 0.5)}px, #000 ${focalY + bandWidth * 0.5}px, transparent ${focalY + bandWidth * 1.2}px)`;
    demo.next.style.maskImage = demo.next.style.webkitMaskImage = raw === 1 ? 'none' : mask;
    demo.next.style.opacity = String(phase(0, 0.2, t));

    // 绘制移轴取景框线与光标刻度
    const layer = stage.dimensions(stage.vector('tiltshift', 4), w, h);
    layer.paths[0].setAttribute('d', `M0 ${n(focalY - bandWidth * 0.4)}L${w} ${n(focalY - bandWidth * 0.2)}`);
    layer.paths[0].setAttribute('stroke', '#fff4ce');
    layer.paths[0].setAttribute('stroke-width', '0.8');
    layer.paths[0].setAttribute('stroke-dasharray', '6 4');

    layer.paths[1].setAttribute('d', `M0 ${n(focalY + bandWidth * 0.2)}L${w} ${n(focalY + bandWidth * 0.4)}`);
    layer.paths[1].setAttribute('stroke', '#fff4ce');
    layer.paths[1].setAttribute('stroke-width', '0.8');
    layer.paths[1].setAttribute('stroke-dasharray', '6 4');

    layer.svg.style.opacity = String(pulse * 0.7);
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.28);
    overlay.style.backgroundImage = `linear-gradient(105deg, transparent, #ffffff22 ${focalY}px, transparent)`;
  });

  // 8. birefringence (双折射叠影)
  window.registerTransitionHandler('birefringence', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    // 寻常光(o-ray)与非常光(e-ray)偏振位移量
    const splitX = Math.cos(t * Math.PI) * (w * 0.016 * pulse);
    const splitY = Math.sin(t * Math.PI) * (h * 0.012 * pulse);

    demo.base.style.transform = `translate(${splitX}px, ${splitY}px)`;
    demo.next.style.transform = `translate(${-splitX}px, ${-splitY}px)`;
    demo.base.style.filter = `drop-shadow(${splitX * 1.5}px 0 3px rgba(64, 180, 220, 0.5))`;
    demo.next.style.filter = `drop-shadow(${-splitX * 1.5}px 0 3px rgba(240, 140, 70, 0.5))`;

    demo.next.style.opacity = String(t);

    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.35);
    overlay.style.backgroundImage = `radial-gradient(circle at 50% 50%, #8ae0ea33, #f5b08c22 45%, transparent 70%)`;
  });

  // 9. darkroom (暗房显影)
  window.registerTransitionHandler('darkroom', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const overlay = demo.overlay;

    // 琥珀安全灯色调浸染
    stage.mix(phase(0.2, 0.9, t));

    demo.base.style.filter = `sepia(${pulse * 0.85}) hue-rotate(-25deg) brightness(${1 - pulse * 0.25})`;

    // 显影液波动波纹
    const layer = stage.dimensions(stage.vector('darkroom', 5), w, h);
    for (let i = 0; i < 5; i++) {
      const cy = h * (0.2 + i * 0.16) + Math.sin(t * 6 + i) * (h * 0.02 * pulse);
      layer.paths[i].setAttribute('d', `M0 ${n(cy)}Q${w * 0.5} ${n(cy + h * 0.04 * pulse)} ${w} ${n(cy)}`);
      layer.paths[i].setAttribute('stroke', '#e06020');
      layer.paths[i].setAttribute('stroke-width', '0.6');
      layer.paths[i].setAttribute('opacity', String(pulse * (0.3 + i * 0.1)));
    }

    layer.svg.style.opacity = String(pulse * 0.75);
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.52);
    overlay.style.backgroundImage = 'radial-gradient(circle at 50% 20%, #d8451888 0%, #300804bb 85%)';
    overlay.style.mixBlendMode = 'hard-light';
  });

  // 10. louvers (建筑百叶)
  window.registerTransitionHandler('louvers', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const slatCount = 10;
    const slatHeight = h / slatCount;

    // 百叶窗多边形遮罩依次翻转
    let maskBody = '';
    for (let i = 0; i < slatCount; i++) {
      const slatT = phase(i * 0.05, 0.5 + i * 0.05, t);
      const slatAngle = slatT * 180;
      const y = i * slatHeight;
      const scaleY = Math.cos((slatAngle * Math.PI) / 180);
      const openH = slatHeight * Math.abs(scaleY);
      const offsetY = (slatHeight - openH) / 2;

      if (slatT > 0.5) {
        maskBody += `<rect x="0" y="${y}" width="${w}" height="${slatHeight}" fill="white"/>`;
      } else {
        maskBody += `<rect x="0" y="${y + offsetY}" width="${w}" height="${openH}" fill="white"/>`;
      }
    }

    imageMask(demo.next, maskBody, w, h);
    if (raw === 1) demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 绘制立体百叶高光与背阴线
    const layer = stage.dimensions(stage.vector('louvers', slatCount), w, h);
    for (let i = 0; i < slatCount; i++) {
      const y = (i + 1) * slatHeight;
      const slatT = phase(i * 0.05, 0.5 + i * 0.05, t);
      const edge = layer.paths[i];
      edge.setAttribute('d', `M0 ${n(y)}H${w}`);
      edge.setAttribute('stroke', slatT < 0.5 ? '#fff3c8' : '#14281f');
      edge.setAttribute('stroke-width', '1');
      edge.setAttribute('opacity', String(pulse * 0.65));
    }

    layer.svg.style.opacity = String(pulse * 0.8);
  });

  // 11. halftone (半调网点)
  window.registerTransitionHandler('halftone', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const cols = 22;
    const rows = 14;
    const stepX = w / cols;
    const stepY = h / rows;
    const maxR = Math.hypot(stepX, stepY) * 0.85;

    let circles = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * stepX;
        const cy = (r + 0.5) * stepY;
        const distRatio = (c / cols + r / rows) / 2;
        const dotT = phase(distRatio * 0.4, 0.6 + distRatio * 0.4, t);
        const radius = maxR * Math.pow(dotT, 1.2);
        if (radius > 0.1) {
          circles += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="white"/>`;
        }
      }
    }

    imageMask(demo.next, circles, w, h);
    if (raw === 1) demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 叠加复古报纸双色套印光晕
    const overlay = demo.overlay;
    overlay.hidden = false;
    overlay.style.opacity = String(pulse * 0.22);
    overlay.style.backgroundImage = 'radial-gradient(#d4ad6533 1px, transparent 1px)';
    overlay.style.backgroundSize = `${stepX}px ${stepY}px`;
  });

  // 12. fibonacci (黄金螺旋)
  window.registerTransitionHandler('fibonacci', (stage, frame) => {
    const { demo } = stage;
    const { width: w, height: h, t, progress: raw, dark } = frame;
    const pulse = Math.sin(Math.PI * t);
    const boxes = goldenBoxes(w, h);

    // 各斐波那契黄金矩形由外向内依次舒展
    let maskBody = '';
    boxes.forEach((box, i) => {
      const boxT = phase(i * 0.08, 0.5 + i * 0.08, t);
      const curW = box.w * boxT;
      const curH = box.h * boxT;
      const curX = box.cx - curW / 2;
      const curY = box.cy - curH / 2;
      maskBody += `<rect x="${n(curX)}" y="${n(curY)}" width="${n(curW)}" height="${n(curH)}" fill="white"/>`;
    });

    imageMask(demo.next, maskBody, w, h);
    if (raw === 1) demo.next.style.maskImage = demo.next.style.webkitMaskImage = 'none';
    demo.next.style.opacity = raw === 0 ? '0' : '1';

    // 绘制金色构图分割线与黄金对数螺旋曲线
    const layer = stage.dimensions(stage.vector('fibonacci', boxes.length + 1), w, h);
    boxes.forEach((box, i) => {
      const p = layer.paths[i];
      p.setAttribute('d', `M${n(box.x)} ${n(box.y)}H${n(box.x + box.w)}V${n(box.y + box.h)}H${n(box.x)}Z`);
      p.setAttribute('stroke', '#d4af37');
      p.setAttribute('stroke-width', '0.75');
      p.setAttribute('opacity', String(pulse * 0.7));
    });

    // 螺旋中心线
    const spiralPts = boxes.map(b => point([b.cx, b.cy]));
    const spiralPath = layer.paths[boxes.length];
    spiralPath.setAttribute('d', `M${spiralPts.join('L')}`);
    spiralPath.setAttribute('stroke', '#f3e5ab');
    spiralPath.setAttribute('stroke-width', '1.2');
    spiralPath.setAttribute('opacity', String(pulse * 0.85));

    layer.svg.style.opacity = String(pulse * 0.85);
  });
})();
