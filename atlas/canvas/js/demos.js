/* Canvas Visual Lab — 演示函数库（六大板块，共 30 个演示）
 * 约定：
 *   普通演示签名为 (ctx, W, H, canvas)；webgl: true 的签名为 (canvas, W, H)。
 *   带动画 / 自建图层的演示返回 cleanup 函数，切换板块时统一调用。
 *   左侧代码面板直接展示 fn.toString()，保证所见即所跑。 */

/* ==================== 板块一：绘图基础 ==================== */
/* 心智模型：画布是"即时模式"——画完即忘，只认坐标与路径 */

/* 直线与路径：moveTo / lineTo / closePath */
function demoLinePath(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 折线：moveTo 定起点，lineTo 依次连线
  ctx.beginPath();
  ctx.moveTo(40, 260);
  ctx.lineTo(140, 60);
  ctx.lineTo(240, 200);
  ctx.lineTo(340, 90);
  ctx.lineTo(460, 160);
  ctx.strokeStyle = '#7F77DD';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 封闭图形：closePath 自动闭合首尾
  ctx.beginPath();
  ctx.moveTo(80, 300);
  ctx.lineTo(160, 300);
  ctx.lineTo(120, 250);
  ctx.closePath();
  ctx.fillStyle = '#1D9E75';
  ctx.fill();

  // 多子路径：一个 beginPath 里画多条独立线段
  ctx.beginPath();
  for (let x = 300; x <= 480; x += 30) {
    ctx.moveTo(x, 230);
    ctx.lineTo(x, 300);
  }
  ctx.strokeStyle = '#D85A30';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* 矩形家族：fillRect / strokeRect / clearRect / roundRect */
function demoRect(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // fillRect：实心矩形
  ctx.fillStyle = '#378ADD';
  ctx.fillRect(40, 40, 180, 110);

  // strokeRect：描边矩形
  ctx.strokeStyle = '#D4537E';
  ctx.lineWidth = 6;
  ctx.strokeRect(260, 40, 180, 110);

  // clearRect：在实心矩形上"擦出"透明洞
  ctx.clearRect(90, 70, 80, 50);

  // roundRect：圆角矩形（数组可分别指定四角半径）
  ctx.beginPath();
  ctx.roundRect(40, 190, 180, 90, [10, 30, 10, 30]);
  ctx.fillStyle = '#EF9F27';
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(260, 190, 180, 90, 45);
  ctx.strokeStyle = '#1D9E75';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/* 圆与圆弧：arc / arcTo */
function demoArc(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 完整圆：0 到 2π
  ctx.beginPath();
  ctx.arc(90, 90, 55, 0, Math.PI * 2);
  ctx.fillStyle = '#7F77DD';
  ctx.fill();

  // 扇形：arc 配合圆心闭合
  ctx.beginPath();
  ctx.moveTo(250, 90);
  ctx.arc(250, 90, 55, 0.3, Math.PI * 1.3);
  ctx.closePath();
  ctx.fillStyle = '#D85A30';
  ctx.fill();

  // 逆时针弧线（anticlockwise = true）
  ctx.beginPath();
  ctx.arc(410, 90, 55, 0, Math.PI * 1.5, true);
  ctx.strokeStyle = '#1D9E75';
  ctx.lineWidth = 10;
  ctx.stroke();

  // arcTo：两条直线之间倒出圆弧角
  ctx.beginPath();
  ctx.moveTo(60, 290);
  ctx.lineTo(60, 210);
  ctx.arcTo(60, 180, 120, 180, 30);
  ctx.lineTo(240, 180);
  ctx.strokeStyle = '#378ADD';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 同心半圆环
  for (let r = 60; r >= 20; r -= 20) {
    ctx.beginPath();
    ctx.arc(400, 250, r, Math.PI, 0);
    ctx.strokeStyle = r % 40 ? '#D4537E' : '#BA7517';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
}

/* 贝塞尔曲线：quadraticCurveTo / bezierCurveTo */
function demoBezier(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 二次贝塞尔：1 个控制点
  ctx.beginPath();
  ctx.moveTo(40, 140);
  ctx.quadraticCurveTo(130, 20, 220, 140);
  ctx.strokeStyle = '#7F77DD';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 控制点辅助线（虚线）
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(40, 140); ctx.lineTo(130, 20); ctx.lineTo(220, 140);
  ctx.strokeStyle = '#888780';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // 三次贝塞尔：2 个控制点
  ctx.beginPath();
  ctx.moveTo(280, 140);
  ctx.bezierCurveTo(320, 20, 420, 20, 480, 140);
  ctx.strokeStyle = '#1D9E75';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 用两条三次贝塞尔拼一颗心
  ctx.beginPath();
  ctx.moveTo(260, 235);
  ctx.bezierCurveTo(260, 215, 215, 215, 215, 240);
  ctx.bezierCurveTo(215, 268, 260, 285, 260, 300);
  ctx.bezierCurveTo(260, 285, 305, 268, 305, 240);
  ctx.bezierCurveTo(305, 215, 260, 215, 260, 235);
  ctx.fillStyle = '#E24B4A';
  ctx.fill();

  // 连续二次贝塞尔画波浪
  ctx.beginPath();
  ctx.moveTo(340, 260);
  for (let i = 0; i < 3; i++) {
    ctx.quadraticCurveTo(360 + i * 45, 220, 385 + i * 45, 260);
  }
  ctx.strokeStyle = '#D4537E';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/* 坐标系与 DPR：Retina 屏为什么不模糊 */
function demoHiDPI(ctx, W, H, canvas) {
  const dpr = window.devicePixelRatio || 1;

  // 高清屏适配套路（本实验室画布固定 520×320 故未启用）：
  //   canvas.width  = cssW * dpr;
  //   canvas.height = cssH * dpr;
  //   ctx.scale(dpr, dpr);   // 之后仍用 CSS 坐标绘图
  ctx.font = '14px system-ui';
  ctx.fillStyle = '#888780';
  ctx.fillText('当前 devicePixelRatio = ' + dpr, 30, 34);
  ctx.fillText('本画布物理像素 = ' + canvas.width + ' × ' + canvas.height, 30, 58);

  // 对比 1：位图放大必模糊
  const tiny = document.createElement('canvas');
  tiny.width = 60; tiny.height = 60;
  const t = tiny.getContext('2d');
  t.fillStyle = '#7F77DD';
  t.beginPath(); t.arc(30, 30, 26, 0, 7); t.fill();
  t.fillStyle = '#fff';
  t.font = '700 24px system-ui';
  t.fillText('A', 22, 39);

  ctx.drawImage(tiny, 50, 90, 180, 180);   // 60px 放大到 180px
  ctx.fillStyle = '#888780';
  ctx.fillText('位图放大 3 倍：模糊', 60, 298);

  // 对比 2：矢量指令按物理像素重新光栅化，永远清晰
  ctx.beginPath();
  ctx.arc(370, 180, 90, 0, 7);
  ctx.fillStyle = '#1D9E75';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 76px system-ui';
  ctx.fillText('A', 338, 207);
  ctx.fillStyle = '#888780';
  ctx.font = '14px system-ui';
  ctx.fillText('矢量重绘：永远清晰', 300, 298);
}

/* ==================== 板块二：样式与状态 ==================== */
/* 心智模型：ctx 是台状态机——样式"设置即全局"，save/restore 是唯一的后悔药 */

/* 线条样式：lineCap / lineJoin / lineWidth */
function demoStrokeStyle(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);
  ctx.font = '12px system-ui';

  // lineCap：线段端点形态
  const caps = ['butt', 'round', 'square'];
  caps.forEach(function (cap, i) {
    const y = 50 + i * 45;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(240, y);
    ctx.lineCap = cap;
    ctx.strokeStyle = '#7F77DD';
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.fillStyle = '#888780';
    ctx.fillText(cap, 255, y + 4);
  });

  // lineJoin：折线转角形态
  const joins = ['miter', 'round', 'bevel'];
  joins.forEach(function (j, i) {
    const x = 60 + i * 90;
    ctx.beginPath();
    ctx.moveTo(x, 250);
    ctx.lineTo(x + 35, 190);
    ctx.lineTo(x + 70, 250);
    ctx.lineJoin = j;
    ctx.strokeStyle = '#D85A30';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.fillStyle = '#888780';
    ctx.fillText(j, x + 12, 275);
  });

  // lineWidth 对比
  [1, 4, 10].forEach(function (w, i) {
    ctx.beginPath();
    ctx.moveTo(360, 60 + i * 40);
    ctx.lineTo(480, 60 + i * 40);
    ctx.lineWidth = w;
    ctx.strokeStyle = '#1D9E75';
    ctx.stroke();
  });
}

/* 渐变：createLinearGradient / createRadialGradient */
function demoGradient(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 线性渐变（水平三色）
  const lg = ctx.createLinearGradient(40, 0, 240, 0);
  lg.addColorStop(0, '#378ADD');
  lg.addColorStop(0.5, '#7F77DD');
  lg.addColorStop(1, '#D4537E');
  ctx.fillStyle = lg;
  ctx.fillRect(40, 40, 200, 110);

  // 径向渐变（从圆心向外）
  const rg = ctx.createRadialGradient(360, 95, 10, 360, 95, 75);
  rg.addColorStop(0, '#FAC775');
  rg.addColorStop(1, '#993C1D');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(360, 95, 70, 0, 7);
  ctx.fill();

  // 对角彩虹渐变带
  const dg = ctx.createLinearGradient(40, 190, 480, 300);
  for (let i = 0; i <= 10; i++) {
    dg.addColorStop(i / 10, 'hsl(' + (i * 36) + ' 70% 60%)');
  }
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.roundRect(40, 190, 440, 90, 14);
  ctx.fill();
}

/* 阴影：shadowColor / shadowBlur / shadowOffset */
function demoShadow(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 基础投影
  ctx.shadowColor = 'rgba(60, 52, 137, .6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#7F77DD';
  ctx.fillRect(50, 50, 130, 90);

  // 文字发光：偏移归零 + 大模糊半径
  ctx.shadowColor = '#EF9F27';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = '500 40px system-ui';
  ctx.fillStyle = '#FAEEDA';
  ctx.fillText('Glow', 250, 110);

  // 用完务必重置，否则影响后续所有绘制（状态机！）
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 彩色光晕圆
  ctx.shadowColor = 'rgba(29, 158, 117, .5)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(120, 230, 50, 0, 7);
  ctx.fillStyle = '#1D9E75';
  ctx.fill();

  ctx.shadowColor = 'rgba(224, 75, 74, .6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(250, 190, 200, 80, 16);
  ctx.fillStyle = '#E24B4A';
  ctx.fill();
}

/* 文本：font / fillText / strokeText / 对齐 / 测量 */
function demoText(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 填充文字
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillStyle = '#378ADD';
  ctx.fillText('fillText 填充', 30, 60);

  // 描边文字
  ctx.strokeStyle = '#D4537E';
  ctx.lineWidth = 1.5;
  ctx.strokeText('strokeText 描边', 30, 115);

  // textAlign 水平对齐（灰线为基准 x）
  ctx.font = '16px system-ui';
  ctx.fillStyle = '#888780';
  ctx.strokeStyle = 'rgba(136, 135, 128, .3)';
  ctx.beginPath(); ctx.moveTo(260, 140); ctx.lineTo(260, 240); ctx.stroke();
  ctx.textAlign = 'left';   ctx.fillText('left 对齐', 260, 160);
  ctx.textAlign = 'center'; ctx.fillText('center 对齐', 260, 190);
  ctx.textAlign = 'right';  ctx.fillText('right 对齐', 260, 220);

  // textBaseline 垂直对齐（灰线为基准 y）
  ctx.textAlign = 'left';
  ctx.beginPath(); ctx.moveTo(30, 275); ctx.lineTo(480, 275); ctx.stroke();
  ['top', 'middle', 'bottom'].forEach(function (b, i) {
    ctx.textBaseline = b;
    ctx.fillText(b, 60 + i * 120, 275);
  });

  // measureText：精确测量文本宽度
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText('测量我').width;
  ctx.strokeStyle = '#1D9E75';
  ctx.strokeRect(380, 284, w, 22);
  ctx.fillStyle = '#1D9E75';
  ctx.fillText('测量我', 380, 300);
}

/* 变换：translate / rotate / scale / setTransform */
function demoTransform(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // translate + rotate：旋转色块阵
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate(130, 140);
    ctx.rotate((Math.PI / 4) * i);
    ctx.fillStyle = 'hsl(' + (i * 45) + ' 70% 60%)';
    ctx.fillRect(40, -12, 70, 24);
    ctx.restore();
  }

  // scale(-1, 1)：水平镜像
  ctx.save();
  ctx.translate(340, 60);
  ctx.fillStyle = '#378ADD';
  ctx.font = '500 28px system-ui';
  ctx.fillText('正常', 0, 0);
  ctx.scale(-1, 1);
  ctx.fillText('镜像', 0, 50);
  ctx.restore();

  // setTransform：直接设置矩阵实现斜切
  ctx.setTransform(1, 0.15, -0.3, 1, 330, 220);
  ctx.fillStyle = '#D85A30';
  ctx.fillRect(0, 0, 120, 70);
  ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置为单位矩阵
}

/* 图案填充：createPattern */
function demoPattern(ctx, W, H) {
  // 离屏小画布做"图案单元"
  const tile = document.createElement('canvas');
  tile.width = 24; tile.height = 24;
  const t = tile.getContext('2d');
  t.fillStyle = '#3C3489';
  t.fillRect(0, 0, 24, 24);
  t.fillStyle = '#7F77DD';
  t.beginPath();
  t.arc(12, 12, 6, 0, 7);
  t.fill();

  // repeat：双向平铺
  const p1 = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = p1;
  ctx.beginPath();
  ctx.roundRect(30, 30, 220, 120, 12);
  ctx.fill();

  // repeat-x：仅水平平铺
  ctx.fillStyle = ctx.createPattern(tile, 'repeat-x');
  ctx.fillRect(280, 30, 210, 50);

  // no-repeat：只画一次
  ctx.fillStyle = ctx.createPattern(tile, 'no-repeat');
  ctx.fillRect(280, 100, 210, 50);

  // 图案同样可用于描边和文字
  ctx.strokeStyle = p1;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(140, 245, 55, 0, 7);
  ctx.stroke();

  ctx.font = '700 56px system-ui';
  ctx.fillStyle = p1;
  ctx.fillText('PATTERN', 235, 268);
}

/* 虚线：setLineDash / lineDashOffset 流动动画 */
function demoLineDash(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // setLineDash：实虚长度交替的数组
  const dashes = [[8, 6], [2, 6], [16, 6, 4, 6]];
  dashes.forEach(function (dash, i) {
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.moveTo(40, 55 + i * 40);
    ctx.lineTo(480, 55 + i * 40);
    ctx.strokeStyle = '#378ADD';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#888780';
    ctx.font = '12px system-ui';
    ctx.fillText('[' + dash.join(', ') + ']', 40, 44 + i * 40);
  });

  // lineDashOffset：每帧偏移，让虚线"流动"起来
  let offset = 0;
  let raf = 0;
  function frame() {
    ctx.clearRect(30, 165, 460, 140);
    offset -= 0.6;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = offset;

    // 蚂蚁线边框
    ctx.strokeStyle = '#1D9E75';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 185, 200, 95);

    // 流动虚线正弦波
    ctx.beginPath();
    for (let x = 290; x <= 460; x += 5) {
      const y = 235 + Math.sin(x * 0.05) * 30;
      x === 290 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#D4537E';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* 状态栈：save / restore */
function demoSaveRestore(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#378ADD';
  ctx.fillRect(30, 30, 90, 90);   // 蓝色：默认状态

  ctx.save();                      // 入栈 1
  ctx.fillStyle = '#D85A30';
  ctx.translate(180, 0);
  ctx.fillRect(30, 30, 90, 90);   // 橙色 + 平移 180

  ctx.save();                      // 入栈 2
  ctx.fillStyle = '#1D9E75';
  ctx.translate(180, 0);
  ctx.fillRect(30, 30, 90, 90);   // 绿色 + 平移 360
  ctx.restore();                   // 弹栈 → 回到入栈 1 的状态

  ctx.fillRect(30, 150, 90, 90);  // 仍是橙色、平移 180

  ctx.restore();                   // 再弹栈 → 回到最初

  ctx.fillRect(30, 150, 90, 90);  // 蓝色、无平移

  ctx.fillStyle = '#888780';
  ctx.font = '13px system-ui';
  ctx.fillText('save() 把颜色 / 变换 / 裁剪等状态压栈，restore() 弹栈恢复', 40, 290);
}

/* ==================== 板块三：图像与像素 ==================== */
/* 心智模型：Canvas 的底色是位图——图像进来是像素，出去也是像素 */

/* 合成模式：globalCompositeOperation */
function demoComposite(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);
  const modes = ['source-over', 'multiply', 'screen', 'xor', 'destination-in', 'destination-out'];
  modes.forEach(function (mode, i) {
    const x = 50 + (i % 3) * 160;
    const y = 40 + ((i / 3) | 0) * 140;

    // 先画目标（destination）
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(x + 45, y + 45, 40, 0, 7);
    ctx.fillStyle = '#378ADD';
    ctx.fill();

    // 再设置模式画源（source），观察交叠结果
    ctx.globalCompositeOperation = mode;
    ctx.beginPath();
    ctx.arc(x + 85, y + 45, 40, 0, 7);
    ctx.fillStyle = '#E24B4A';
    ctx.fill();

    // 恢复默认并标注
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#888780';
    ctx.font = '12px system-ui';
    ctx.fillText(mode, x + 20, y + 110);
  });
}

/* 裁剪：clip 限制后续绘制区域 */
function demoClip(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // 圆形视窗：clip 之后的绘制只在圆内生效
  ctx.save();
  ctx.beginPath();
  ctx.arc(130, 130, 90, 0, 7);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, 40, 0, 220);
  sky.addColorStop(0, '#185FA5');
  sky.addColorStop(1, '#85B7EB');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 260, 260);
  ctx.fillStyle = '#FAC775';
  ctx.beginPath(); ctx.arc(160, 90, 26, 0, 7); ctx.fill();
  ctx.fillStyle = '#0F6E56';
  ctx.beginPath();
  ctx.moveTo(20, 220); ctx.lineTo(110, 130); ctx.lineTo(200, 220);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // 星形视窗：渐变 + 装饰斜线被裁进五角星
  ctx.save();
  ctx.translate(380, 140);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 === 0 ? 90 : 38;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = r * Math.cos(a), py = r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.clip();
  const g = ctx.createLinearGradient(-90, 0, 90, 0);
  g.addColorStop(0, '#D4537E');
  g.addColorStop(1, '#EF9F27');
  ctx.fillStyle = g;
  ctx.fillRect(-100, -100, 200, 200);
  ctx.strokeStyle = 'rgba(255, 255, 255, .35)';
  for (let i = -100; i < 100; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, -100); ctx.lineTo(i + 100, 100);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#888780';
  ctx.font = '13px system-ui';
  ctx.fillText('clip() 之后的一切绘制都被限制在路径内部', 100, 295);
}

/* 图像绘制：drawImage 的三种形态 */
function demoDrawImage(ctx, W, H) {
  // 离屏画布当作"图片"来源（也可以是 <img> / <video> / ImageBitmap）
  const off = document.createElement('canvas');
  off.width = 200; off.height = 200;
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 200, 200);
  g.addColorStop(0, '#7F77DD');
  g.addColorStop(1, '#1D9E75');
  o.fillStyle = g;
  o.fillRect(0, 0, 200, 200);
  o.fillStyle = 'rgba(255, 255, 255, .85)';
  o.font = '700 60px system-ui';
  o.fillText('IMG', 45, 115);

  // 形态一：drawImage(img, dx, dy, dw, dh) 缩放绘制
  ctx.drawImage(off, 30, 20, 160, 160);
  ctx.drawImage(off, 230, 20, 100, 100);

  // 形态二：九宫格切片，源区域 → 目标区域
  // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.drawImage(off, 50, 50, 100, 100, 370, 20, 130, 130);

  // 平铺：循环小图绘制
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 10; x++) {
      ctx.drawImage(off, 30 + x * 48, 210 + y * 48, 44, 44);
    }
  }
}

/* 像素操作：getImageData 逐像素滤镜 */
function demoPixels(ctx, W, H) {
  // 离屏画一张测试图
  const off = document.createElement('canvas');
  off.width = 150; off.height = 120;
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 150, 120);
  g.addColorStop(0, '#378ADD');
  g.addColorStop(1, '#D4537E');
  o.fillStyle = g;
  o.fillRect(0, 0, 150, 120);
  o.fillStyle = '#FAEEDA';
  for (let i = 0; i < 12; i++) {
    o.beginPath();
    o.arc(Math.random() * 150, Math.random() * 120, 8 + Math.random() * 12, 0, 7);
    o.fill();
  }

  ctx.fillStyle = '#888780';
  ctx.font = '12px system-ui';

  ctx.drawImage(off, 30, 40);
  ctx.fillText('原图', 30, 30);

  // 滤镜 1：反色
  ctx.drawImage(off, 200, 40);
  filter(ctx, 200, 40, 150, 120, function (d, i) {
    d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
  });
  ctx.fillText('反色 invert', 200, 30);

  // 滤镜 2：灰度（亮度加权）
  ctx.drawImage(off, 370, 40);
  filter(ctx, 370, 40, 150, 120, function (d, i) {
    const v = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = v;
  });
  ctx.fillText('灰度 grayscale', 370, 30);

  // 滤镜 3：RGB 通道轮转
  ctx.drawImage(off, 185, 200);
  filter(ctx, 185, 200, 150, 120, function (d, i) {
    const r = d[i];
    d[i] = d[i + 1]; d[i + 1] = d[i + 2]; d[i + 2] = r;
  });
  ctx.fillText('通道交换', 185, 190);

  // 核心套路：getImageData → 逐像素改写 → putImageData
  function filter(c, x, y, w, h, fn) {
    const img = c.getImageData(x, y, w, h);
    for (let i = 0; i < img.data.length; i += 4) fn(img.data, i);
    c.putImageData(img, x, y);
  }
}

/* 图片导出：toDataURL 点击下载 PNG */
function demoExport(ctx, W, H, canvas) {
  // 先在画布上画一幅"星空作品"
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0C447C');
  g.addColorStop(1, '#3C3489');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, 7);
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.9 + 0.1) + ')';
    ctx.fill();
  }
  ctx.font = '700 40px system-ui';
  ctx.fillStyle = '#FAEEDA';
  ctx.fillText('点击画布导出 PNG', 120, 175);

  // toDataURL：画布内容 → base64 图片 → 触发下载
  // 大图建议改用 canvas.toBlob()，不占内存、不卡主线程
  canvas.addEventListener('pointerdown', function () {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-export.png';
    a.click();
  });
}

/* ==================== 板块四：动画与交互 ==================== */
/* 心智模型：动画是"清屏重绘"的幻觉；交互是"自己算命中"——画布不记对象 */

/* 粒子网络动画：rAF + 近邻连线 */
function demoParticles(ctx, W, H) {
  const dots = Array.from({ length: 70 }, function () {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2,
      r: 2 + Math.random() * 3.5,
      c: 'hsl(' + (Math.random() * 360 | 0) + ' 70% 65%)'
    };
  });

  let raf = 0;
  function frame() {
    // 半透明覆盖 = 运动拖尾
    ctx.fillStyle = 'rgba(12, 20, 34, .22)';
    ctx.fillRect(0, 0, W, H);

    // 距离小于 60 的粒子间连线
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < 3600) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = 'rgba(127, 119, 221, ' + (1 - dist / 3600) * 0.5 + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    for (const p of dots) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = p.c;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* 鼠标跟随拖尾 */
function demoMouseTrail(ctx, W, H, canvas) {
  const mouse = { x: W / 2, y: H / 2 };
  const trail = [];

  canvas.addEventListener('pointermove', function (e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (W / rect.width);
    mouse.y = (e.clientY - rect.top) * (H / rect.height);
  });

  let raf = 0;
  function frame() {
    ctx.fillStyle = 'rgba(12, 20, 34, .18)';
    ctx.fillRect(0, 0, W, H);

    trail.push({ x: mouse.x, y: mouse.y });
    if (trail.length > 40) trail.shift();

    // 拖尾带：越新越粗、色相渐变
    for (let i = 1; i < trail.length; i++) {
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = 'hsl(' + (i * 8) + ' 80% 65%)';
      ctx.lineWidth = i * 0.6;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* 简单物理引擎：点击生成小球，重力 + 反弹 */
function demoPhysics(ctx, W, H, canvas) {
  const balls = [];

  canvas.addEventListener('pointerdown', function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);

    // 命中检测：点中已有小球则消除
    const hit = balls.findIndex(b => Math.hypot(b.x - x, b.y - y) < b.r);
    if (hit >= 0) {
      balls.splice(hit, 1);
    } else {
      balls.push({
        x: x, y: y,
        r: 12 + Math.random() * 12,
        vy: 0,
        c: 'hsl(' + (Math.random() * 360 | 0) + ' 75% 62%)'
      });
    }
  });

  let raf = 0;
  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (const b of balls) {
      b.vy += 0.35;                 // 重力加速度
      b.y += b.vy;
      if (b.y + b.r > H) {          // 落地反弹 + 能量损耗
        b.y = H - b.r;
        b.vy *= -0.72;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fillStyle = b.c;
      ctx.fill();
    }

    ctx.font = '13px system-ui';
    ctx.fillStyle = '#888780';
    ctx.fillText('点击生成小球 · 点中小球消除 · 当前 ' + balls.length + ' 个', 14, 24);
    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* 实时时钟：Date 驱动 + 旋转变换 */
function demoClock(ctx, W, H) {
  let raf = 0;
  function frame() {
    ctx.clearRect(0, 0, W, H);
    const cx = 160, cy = 160, r = 120;
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;

    // 表盘
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 7);
    ctx.fillStyle = 'rgba(127, 119, 221, .12)';
    ctx.fill();
    ctx.strokeStyle = '#7F77DD';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 60 根刻度，整点加粗
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30;
      const inner = i % 5 === 0 ? r - 16 : r - 8;
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
      ctx.lineTo(cx + (r - 2) * Math.cos(a), cy + (r - 2) * Math.sin(a));
      ctx.strokeStyle = i % 5 === 0 ? '#7F77DD' : '#888780';
      ctx.lineWidth = i % 5 === 0 ? 3 : 1;
      ctx.stroke();
    }

    // 指针 = translate 到圆心后 rotate 画同一根线
    function hand(angle, len, width, color) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }
    hand((h * Math.PI) / 6 - Math.PI / 2, 60, 7, '#378ADD');
    hand((m * Math.PI) / 30 - Math.PI / 2, 88, 5, '#1D9E75');
    hand((s * Math.PI) / 30 - Math.PI / 2, 105, 2, '#E24B4A');

    // 数字时间
    ctx.font = '500 30px ui-monospace, monospace';
    ctx.fillStyle = '#888780';
    ctx.fillText(now.toLocaleTimeString('zh-CN', { hour12: false }), 330, 150);
    ctx.font = '13px system-ui';
    ctx.fillText('Date 驱动 · 每帧全量重绘', 330, 180);

    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* 手绘板：pointer 事件 + 速度感应笔宽 */
function demoPaintBoard(ctx, W, H, canvas) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  let drawing = false;
  let last = null;

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener('pointerdown', function (e) {
    drawing = true;
    last = pos(e);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    const p = pos(e);
    // 速度越快，线条越细（模拟笔锋）
    const speed = Math.hypot(p.x - last.x, p.y - last.y);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#7F77DD';
    ctx.lineWidth = Math.max(2, 14 - speed * 0.35);
    ctx.stroke();
    last = p;
  });
  window.addEventListener('pointerup', function () { drawing = false; });

  // 双击清空画板
  canvas.addEventListener('dblclick', function () {
    ctx.clearRect(0, 0, W, H);
  });

  ctx.font = '13px system-ui';
  ctx.fillStyle = '#888780';
  ctx.fillText('按住拖动画画 · 双击清空', 14, 24);
}

/* 命中检测：isPointInPath 官方方案 */
function demoHitTest(ctx, W, H, canvas) {
  // 三个任意形状，悬停高亮——不用自己写几何判定
  const shapes = [
    { draw: function (c) { c.arc(120, 130, 60, 0, 7); }, fill: '#378ADD' },
    { draw: function (c) { c.roundRect(240, 70, 120, 120, 16); }, fill: '#1D9E75' },
    { draw: function (c) { c.moveTo(430, 60); c.lineTo(500, 190); c.lineTo(370, 190); c.closePath(); }, fill: '#D85A30' }
  ];
  let hovered = -1;

  canvas.addEventListener('pointermove', function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);

    hovered = -1;
    shapes.forEach(function (s, i) {
      // 关键套路：重建路径 → 交给 isPointInPath 判断
      ctx.beginPath();
      s.draw(ctx);
      if (ctx.isPointInPath(x, y)) hovered = i;
    });
    canvas.style.cursor = hovered >= 0 ? 'pointer' : 'crosshair';
    render();
  });

  function render() {
    ctx.clearRect(0, 0, W, H);
    shapes.forEach(function (s, i) {
      ctx.beginPath();
      s.draw(ctx);
      ctx.globalAlpha = hovered === i ? 1 : 0.55;
      ctx.fillStyle = s.fill;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (hovered === i) {
        ctx.strokeStyle = '#FAEEDA';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });
    ctx.font = '14px system-ui';
    ctx.fillStyle = '#888780';
    ctx.fillText('移动鼠标悬停形状 · isPointInPath 支持任意路径', 70, 265);
  }
  render();
}

/* delta time：帧率无关的动画速度 */
function demoDeltaTime(ctx, W, H) {
  // 两个小球：左 = 每帧固定步长（帧率相关），右 = 速度 × dt（帧率无关）
  const a = { x: 40, v: 3 };        // 每帧 +3px，掉帧就变慢
  const b = { x: 40, v: 180 };      // 180 px/秒，任何帧率一致
  let last = performance.now();
  let raf = 0;

  function frame(now) {
    const dt = (now - last) / 1000; // 本帧距上帧的秒数
    last = now;
    ctx.clearRect(0, 0, W, H);

    a.x += a.v;
    if (a.x > W - 40 || a.x < 40) a.v *= -1;

    b.x += b.v * dt;                // 关键：位移 = 速度 × 时间
    if (b.x > W - 40 || b.x < 40) b.v *= -1;

    ctx.fillStyle = '#D85A30';
    ctx.beginPath(); ctx.arc(a.x, 110, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#1D9E75';
    ctx.beginPath(); ctx.arc(b.x, 220, 22, 0, 7); ctx.fill();

    ctx.font = '13px system-ui';
    ctx.fillStyle = '#888780';
    ctx.fillText('每帧 +3px：速度随帧率波动', 80, 114);
    ctx.fillText('180px/秒 × dt：帧率无关', 80, 224);
    ctx.fillText('本帧 dt = ' + (dt * 1000).toFixed(1) + ' ms', 340, 40);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return function () { cancelAnimationFrame(raf); };
}

/* ==================== 板块五：应用实战 ==================== */
/* 把前面的一切拼成完整的产品形态 */

/* 数据可视化：带动画的柱状图 */
function demoBarChart(ctx, W, H) {
  const data = [
    { label: '一月', value: 42 }, { label: '二月', value: 68 },
    { label: '三月', value: 55 }, { label: '四月', value: 91 },
    { label: '五月', value: 73 }, { label: '六月', value: 88 }
  ];
  const max = Math.max.apply(null, data.map(d => d.value));
  const padL = 46, padB = 40, padT = 30;
  const chartH = H - padT - padB;
  const barW = 44;
  const gap = (W - padL - 44 - data.length * barW) / (data.length - 1);

  let raf = 0, start = 0;
  function frame(ms) {
    if (!start) start = ms;
    const t = Math.min(1, (ms - start) / 900);  // 入场动画进度
    const ease = 1 - Math.pow(1 - t, 3);        // easeOutCubic
    ctx.clearRect(0, 0, W, H);

    // 坐标轴
    ctx.strokeStyle = '#888780';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.lineTo(W - 20, H - padB);
    ctx.stroke();

    // 网格与刻度值
    ctx.font = '11px system-ui';
    ctx.fillStyle = '#888780';
    for (let i = 0; i <= 4; i++) {
      const y = H - padB - (chartH * i) / 4;
      ctx.fillText(String(Math.round((max * i) / 4)), 10, y + 4);
      ctx.strokeStyle = 'rgba(136, 135, 128, .18)';
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - 20, y);
      ctx.stroke();
    }

    // 数据柱（渐变 + 圆角）
    data.forEach(function (d, i) {
      const h = (d.value / max) * chartH * ease;
      const x = padL + 14 + i * (barW + gap);
      const g = ctx.createLinearGradient(0, H - padB - h, 0, H - padB);
      g.addColorStop(0, '#7F77DD');
      g.addColorStop(1, '#378ADD');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, H - padB - h, barW, h, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#888780';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - padB + 20);
      if (t === 1) {
        ctx.fillStyle = '#7F77DD';
        ctx.fillText(String(d.value), x + barW / 2, H - padB - h - 8);
      }
    });

    if (t < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return function () { cancelAnimationFrame(raf); };
}

/* 打砖块：完整游戏循环（状态 → 碰撞 → 渲染） */
function demoBreakout(ctx, W, H, canvas) {
  const paddle = { w: 90, h: 12, x: W / 2 - 45 };
  const ball = { x: W / 2, y: H - 60, vx: 3.2, vy: -3.6, r: 8 };
  const bricks = [];
  const rows = 4, cols = 7, bw = 60, bh = 20, gap = 8, top = 40;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: 24 + c * (bw + gap),
        y: top + r * (bh + gap),
        alive: true,
        color: 'hsl(' + (r * 40 + 200) + ' 65% 60%)'
      });
    }
  }
  let score = 0;

  // 输入：鼠标横移控制挡板
  canvas.addEventListener('pointermove', function (e) {
    const rect = canvas.getBoundingClientRect();
    paddle.x = (e.clientX - rect.left) * (W / rect.width) - paddle.w / 2;
  });

  let raf = 0;
  function frame() {
    /* ---- 状态更新 ---- */
    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy *= -1;

    // 挡板反弹：击中位置偏移改变出射角
    if (ball.y + ball.r > H - 24 &&
        ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.04;
    }

    // 砖块碰撞（AABB 判定）
    for (const b of bricks) {
      if (b.alive &&
          ball.x > b.x && ball.x < b.x + bw &&
          ball.y > b.y && ball.y < b.y + bh) {
        b.alive = false;
        ball.vy *= -1;
        score += 10;
      }
    }

    // 掉底：重置一局
    if (ball.y > H + 20) {
      ball.x = W / 2; ball.y = H - 60;
      ball.vx = 3.2; ball.vy = -3.6;
      score = 0;
      bricks.forEach(function (b) { b.alive = true; });
    }

    /* ---- 渲染 ---- */
    ctx.clearRect(0, 0, W, H);
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, bw, bh, 5);
      ctx.fill();
    }
    ctx.fillStyle = '#7F77DD';
    ctx.beginPath();
    ctx.roundRect(paddle.x, H - 24, paddle.w, paddle.h, 6);
    ctx.fill();
    ctx.fillStyle = '#FAEEDA';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 7);
    ctx.fill();

    ctx.font = '14px system-ui';
    ctx.fillStyle = '#888780';
    ctx.fillText('得分 ' + score, 14, 22);
    ctx.fillText('移动鼠标控制挡板', W - 150, 22);
    raf = requestAnimationFrame(frame);
  }
  frame();
  return function () { cancelAnimationFrame(raf); };
}

/* ==================== 板块六：工程与进阶 ==================== */
/* 教程到这里结束，生产从这里开始 */

/* 离屏复用：静态内容预渲染，每帧只 drawImage 一次 */
function demoOffscreen(ctx, W, H) {
  // 300 个图形构成的复杂背景：一次性预渲染到离屏画布
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const b = bg.getContext('2d');
  for (let i = 0; i < 300; i++) {
    b.fillStyle = 'hsl(' + (i * 1.2) + ' 55% ' + (20 + (i % 5) * 8) + '%)';
    b.beginPath();
    b.arc(Math.random() * W, Math.random() * H, 4 + Math.random() * 20, 0, 7);
    b.fill();
  }
  b.fillStyle = 'rgba(250, 238, 218, .9)';
  b.font = '500 20px system-ui';
  b.fillText('300 个图形已预渲染为一张位图', 120, 165);

  let raf = 0, frames = 0, last = performance.now(), fps = 0;
  function frame(now) {
    // 每帧 1 次 drawImage，而不是重画 300 个图形
    ctx.drawImage(bg, 0, 0);

    // 前景动态元素：李萨如轨迹小球
    const t = now / 1000;
    ctx.fillStyle = '#FAEEDA';
    ctx.beginPath();
    ctx.arc(W / 2 + Math.cos(t * 2) * 170, H / 2 + Math.sin(t * 3) * 100, 14, 0, 7);
    ctx.fill();

    // FPS 统计
    frames++;
    if (now - last >= 1000) {
      fps = frames;
      frames = 0;
      last = now;
    }
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillStyle = '#5DCAA5';
    ctx.fillText('FPS ' + fps + ' · 背景零重绘（离屏复用）', 14, 24);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return function () { cancelAnimationFrame(raf); };
}

/* 分层渲染：静态背景层 + 动态前景层，各司其职 */
function demoLayered(ctx, W, H, canvas) {
  /* 本层（底层 canvas）：静态星空背景，只画一次 */
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0C447C');
  g.addColorStop(1, '#042C53');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.7 + 0.1) + ')';
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.4, 0, 7);
    ctx.fill();
  }
  ctx.font = '13px system-ui';
  ctx.fillStyle = 'rgba(255, 255, 255, .6)';
  ctx.fillText('底层：星空背景（只画 1 次，永不重绘）', 14, H - 16);

  /* 顶层 canvas：叠加在同一位置，专管动态元素 */
  const top = document.createElement('canvas');
  top.width = W; top.height = H;
  canvas.parentNode.style.position = 'relative';
  top.style.cssText = 'position:absolute;left:' + canvas.offsetLeft +
    'px;top:' + canvas.offsetTop + 'px;width:100%;height:auto;pointer-events:none;';
  canvas.parentNode.appendChild(top);
  const t = top.getContext('2d');

  let raf = 0;
  function frame(now) {
    // 每帧只清动态层，背景层零开销
    t.clearRect(0, 0, W, H);
    const s = now / 1000;
    for (let i = 0; i < 5; i++) {
      t.beginPath();
      t.arc(W / 2 + Math.cos(s * 1.4 + i * 1.256) * (60 + i * 22),
            H / 2 + Math.sin(s * 1.4 + i * 1.256) * (60 + i * 22), 10, 0, 7);
      t.fillStyle = 'hsl(' + (i * 60) + ' 75% 62%)';
      t.fill();
    }
    t.font = '13px system-ui';
    t.fillStyle = 'rgba(255, 255, 255, .85)';
    t.fillText('顶层：运动小球（每帧 clearRect 重绘）', 14, 26);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return function () {
    cancelAnimationFrame(raf);
    top.remove();
  };
}

/* WebGL：同一个 <canvas> 切换 3D 渲染上下文 */
function demoWebGL(canvas, W, H) {
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  // 顶点着色器：随时间旋转
  // 注意：顶点着色器 float 默认 highp，片元里是 mediump，
  // 同名 uniform 精度必须一致，否则 link 失败（画布全黑）
  const vs = 'precision mediump float;' +
    'attribute vec2 p;uniform float t;' +
    'void main(){float c=cos(t),s=sin(t);' +
    'gl_Position=vec4(mat2(c,-s,s,c)*p,0.,1.);}';
  // 片元着色器：随时间变色
  const fs = 'precision mediump float;uniform float t;' +
    'void main(){gl_FragColor=vec4(.5+.5*cos(t),.5+.5*sin(t*1.3),.8,1.);}';

  function makeShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([0, 0.7, -0.7, -0.5, 0.7, -0.5]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 't');

  let raf = 0;
  function frame(ms) {
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.05, 0.07, 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, ms / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return function () { cancelAnimationFrame(raf); };
}

/* ==================== 演示注册表（六板块） ==================== */
const CANVAS_SECTIONS = [
  {
    key: 'drawing',
    title: '绘图基础',
    desc: '即时模式心智：画完即忘，只认坐标与路径',
    demos: [
      { id: '01', title: '直线与路径', sub: 'moveTo / lineTo / closePath', file: 'demoLinePath', fn: demoLinePath },
      { id: '02', title: '矩形家族', sub: 'fillRect / strokeRect / clearRect / roundRect', file: 'demoRect', fn: demoRect },
      { id: '03', title: '圆与圆弧', sub: 'arc / arcTo / 扇形', file: 'demoArc', fn: demoArc },
      { id: '04', title: '贝塞尔曲线', sub: 'quadraticCurveTo / bezierCurveTo', file: 'demoBezier', fn: demoBezier },
      { id: '05', title: '坐标系与 DPR', sub: 'Retina 屏适配 · 位图 vs 矢量', file: 'demoHiDPI', fn: demoHiDPI }
    ]
  },
  {
    key: 'style',
    title: '样式与状态',
    desc: 'ctx 是台状态机：设置即全局，save/restore 是唯一的后悔药',
    demos: [
      { id: '06', title: '线条样式', sub: 'lineCap / lineJoin / lineWidth', file: 'demoStrokeStyle', fn: demoStrokeStyle },
      { id: '07', title: '渐变', sub: '线性渐变 / 径向渐变', file: 'demoGradient', fn: demoGradient },
      { id: '08', title: '阴影', sub: 'shadowColor / shadowBlur / 发光', file: 'demoShadow', fn: demoShadow },
      { id: '09', title: '文本绘制', sub: 'fillText / strokeText / 对齐 / 测量', file: 'demoText', fn: demoText },
      { id: '10', title: '坐标变换', sub: 'translate / rotate / scale / setTransform', file: 'demoTransform', fn: demoTransform },
      { id: '11', title: '图案填充', sub: 'createPattern 四种平铺模式', file: 'demoPattern', fn: demoPattern },
      { id: '12', title: '虚线与流动', sub: 'setLineDash / lineDashOffset', file: 'demoLineDash', fn: demoLineDash },
      { id: '13', title: '状态栈', sub: 'save / restore 嵌套恢复', file: 'demoSaveRestore', fn: demoSaveRestore }
    ]
  },
  {
    key: 'pixels',
    title: '图像与像素',
    desc: 'Canvas 的底色是位图：图像进来是像素，出去也是像素',
    demos: [
      { id: '14', title: '合成模式', sub: 'globalCompositeOperation 六种模式', file: 'demoComposite', fn: demoComposite },
      { id: '15', title: '裁剪区域', sub: 'clip 限制绘制范围', file: 'demoClip', fn: demoClip },
      { id: '16', title: '图像绘制', sub: 'drawImage 缩放 / 切片 / 平铺', file: 'demoDrawImage', fn: demoDrawImage },
      { id: '17', title: '像素滤镜', sub: 'getImageData 逐像素处理', file: 'demoPixels', fn: demoPixels },
      { id: '18', title: '导出图片', sub: 'toDataURL / toBlob 下载 PNG', file: 'demoExport', fn: demoExport }
    ]
  },
  {
    key: 'animation',
    title: '动画与交互',
    desc: '动画是清屏重绘的幻觉，交互是自己算的命中',
    demos: [
      { id: '19', title: '粒子网络', sub: 'rAF 动画 + 近邻连线', file: 'demoParticles', fn: demoParticles },
      { id: '20', title: '鼠标拖尾', sub: 'pointermove 跟随轨迹', file: 'demoMouseTrail', fn: demoMouseTrail },
      { id: '21', title: '物理小球', sub: '点击生成 / 重力 / 反弹', file: 'demoPhysics', fn: demoPhysics },
      { id: '22', title: '实时时钟', sub: 'Date 驱动 + 旋转变换', file: 'demoClock', fn: demoClock },
      { id: '23', title: '手绘板', sub: 'pointer 事件 + 速度感应笔宽', file: 'demoPaintBoard', fn: demoPaintBoard },
      { id: '24', title: '命中检测', sub: 'isPointInPath 官方方案', file: 'demoHitTest', fn: demoHitTest },
      { id: '25', title: 'delta time', sub: '帧率无关的动画速度', file: 'demoDeltaTime', fn: demoDeltaTime }
    ]
  },
  {
    key: 'apps',
    title: '应用实战',
    desc: '把前面的一切拼成完整的产品形态',
    demos: [
      { id: '26', title: '柱状图', sub: '数据可视化 + 入场动画', file: 'demoBarChart', fn: demoBarChart },
      { id: '27', title: '打砖块', sub: '完整游戏循环：状态 → 碰撞 → 渲染', file: 'demoBreakout', fn: demoBreakout }
    ]
  },
  {
    key: 'engineering',
    title: '工程与进阶',
    desc: '教程到这里结束，生产从这里开始',
    demos: [
      { id: '28', title: '离屏复用', sub: '预渲染静态内容 · FPS 实测', file: 'demoOffscreen', fn: demoOffscreen },
      { id: '29', title: '分层渲染', sub: '背景层 + 动态层各司其职', file: 'demoLayered', fn: demoLayered },
      { id: '30', title: 'WebGL 上下文', sub: '同一 canvas 切换 3D 管线', file: 'demoWebGL', fn: demoWebGL, webgl: true }
    ]
  }
];
