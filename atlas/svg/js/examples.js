/* SVG Visual Lab 示例库
 * 每个示例：title 标题 / tag 核心元素 / q 场景化提问 / lang 代码语言 / code 最小可运行代码
 * lang = "svg"：code 为 SVG 标记，直接注入右侧渲染
 * lang = "js" ：code 为 JS 函数体，接收 mount 参数（右侧容器），动态生成 SVG
 */

const SECTIONS = [

/* ============ 一、基本语法 ============ */
{
  id: "basic",
  title: "基本语法",
  desc: "声明式图元与坐标系 —— SVG 的字母表",
  items: [
    {
      title: "六种基础形状",
      tag: "rect circle ellipse line polygon polyline",
      q: "不写一行绘图代码，怎么摆出几何图形？—— 六种内置图元直接声明",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="36" width="64" height="46" rx="9" fill="#4c8dff"/>
  <circle cx="122" cy="59" r="26" fill="#e8833a"/>
  <ellipse cx="192" cy="59" rx="34" ry="20" fill="#3fae7a"/>
  <line x1="244" y1="82" x2="300" y2="38" stroke="#c95f8f" stroke-width="4" stroke-linecap="round"/>
  <polygon points="48,124 80,178 16,178" fill="#8a6fe0"/>
  <polyline points="118,178 148,138 178,168 208,132" fill="none"
            stroke="#d8b93c" stroke-width="4" stroke-linejoin="round"/>
  <rect x="242" y="128" width="60" height="50" fill="none"
        stroke="#4c8dff" stroke-width="2" stroke-dasharray="6 4"/>
</svg>`
    },
    {
      title: "path 路径：画任意轮廓",
      tag: "<path> M C Z",
      q: "爱心、Logo 这种没有现成形状的轮廓怎么画？—— path 用贝塞尔曲线描述一切",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <!-- M 移动画笔  C 三次贝塞尔曲线  Z 闭合路径 -->
  <path d="M160 152
           C 92 106, 62 62, 96 40
           C 122 25, 150 40, 160 64
           C 170 40, 198 25, 224 40
           C 258 62, 228 106, 160 152 Z"
        fill="#e8566d" stroke="#b23a4d" stroke-width="3"
        stroke-linejoin="round"/>
</svg>`
    },
    {
      title: "描边系统：端点 / 拐角 / 虚线",
      tag: "stroke-linecap linejoin dasharray",
      q: "线条两端和拐角太生硬？—— linecap 管端点、linejoin 管拐角、dasharray 管虚实",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <!-- 三种端点：butt 平头 / round 圆头 / square 方头 -->
  <line x1="70" y1="40" x2="250" y2="40" stroke="#4c8dff" stroke-width="10" stroke-linecap="butt"/>
  <line x1="70" y1="70" x2="250" y2="70" stroke="#4c8dff" stroke-width="10" stroke-linecap="round"/>
  <line x1="70" y1="100" x2="250" y2="100" stroke="#4c8dff" stroke-width="10" stroke-linecap="square"/>
  <!-- 拐角：miter 尖 / round 圆 / bevel 切 -->
  <polyline points="60,170 110,130 160,170" fill="none" stroke="#e8833a"
            stroke-width="8" stroke-linejoin="miter"/>
  <polyline points="170,170 220,130 270,170" fill="none" stroke="#e8833a"
            stroke-width="8" stroke-linejoin="round"/>
  <!-- 虚线：实 12 空 6 -->
  <line x1="60" y1="192" x2="270" y2="192" stroke="#3fae7a"
        stroke-width="3" stroke-dasharray="12 6"/>
</svg>`
    },
    {
      title: "fill-rule：镂空判定",
      tag: "fill-rule nonzero / evenodd",
      q: "两个嵌套轮廓，里面那块到底填不填？—— fill-rule 决定「里面算不算里面」",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <!-- 同一条「大三角套小三角」路径，两种填充规则 -->
  <path d="M30 170 L90 40 L150 170 Z  M65 140 L90 80 L115 140 Z"
        fill="#4c8dff" fill-rule="nonzero"/>
  <path d="M170 170 L230 40 L290 170 Z  M205 140 L230 80 L255 140 Z"
        fill="#e8833a" fill-rule="evenodd"/>
  <text x="90" y="192" text-anchor="middle" font-size="11" fill="currentColor">nonzero 同向不镂空</text>
  <text x="230" y="192" text-anchor="middle" font-size="11" fill="currentColor">evenodd 奇偶镂空</text>
</svg>`
    },
    {
      title: "transform：平移 / 旋转 / 缩放 / 斜切",
      tag: "transform",
      q: "想整体挪动、旋转、压扁一组图形？—— 六种变换可以串联叠加（虚线是原始位置）",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="70" width="46" height="46" fill="none"
        stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  <rect x="40" y="70" width="46" height="46" fill="#4c8dff"
        transform="translate(60, 0)"/>
  <rect x="40" y="70" width="46" height="46" fill="#e8833a"
        transform="translate(140, 0) rotate(20 63 93)"/>
  <rect x="40" y="70" width="46" height="46" fill="#3fae7a"
        transform="translate(220, 12) scale(0.7)"/>
  <rect x="40" y="70" width="46" height="46" fill="#c95f8f"
        transform="translate(260, 0) skewX(-18)"/>
  <text x="160" y="180" text-anchor="middle" font-size="11" fill="currentColor">
    translate → rotate → scale → skewX（按书写顺序依次作用）
  </text>
</svg>`
    },
    {
      title: "viewBox：永不失真的秘密",
      tag: "viewBox preserveAspectRatio",
      q: "同一张图放大三倍为什么不糊？—— viewBox 定义的是坐标系，渲染时再映射到任意像素",
      lang: "svg",
      code: `<!-- 三个不同尺寸的 <svg>，共享同一个 viewBox 坐标系 -->
<svg viewBox="0 0 100 100" style="width:22%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#4c8dff"/>
  <circle cx="50" cy="50" r="22" fill="#e8b93c"/>
</svg>
<svg viewBox="0 0 100 100" style="width:32%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#4c8dff"/>
  <circle cx="50" cy="50" r="22" fill="#e8b93c"/>
</svg>
<svg viewBox="0 0 100 100" style="width:44%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#4c8dff"/>
  <circle cx="50" cy="50" r="22" fill="#e8b93c"/>
</svg>`
    }
  ]
},

/* ============ 二、高级语法 ============ */
{
  id: "advanced",
  title: "高级语法",
  desc: "填充、裁剪、复用与文本 —— 让图形有组织",
  items: [
    {
      title: "渐变：线性 + 径向",
      tag: "linearGradient radialGradient",
      q: "纯色太平淡？—— stop 色标定义渐变，还能 stop-opacity 带透明度",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gLin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4c8dff"/>
      <stop offset="1" stop-color="#8a6fe0"/>
    </linearGradient>
    <radialGradient id="gRad" cx="0.5" cy="0.4" r="0.65">
      <stop offset="0" stop-color="#ffe9a8"/>
      <stop offset="0.6" stop-color="#e8b93c"/>
      <stop offset="1" stop-color="#b06a1a"/>
    </radialGradient>
  </defs>
  <rect x="24" y="40" width="120" height="120" rx="14" fill="url(#gLin)"/>
  <circle cx="226" cy="100" r="62" fill="url(#gRad)"/>
</svg>`
    },
    {
      title: "pattern：图案平铺填充",
      tag: "<pattern>",
      q: "想要网格纸、波点、斜纹？—— 定义一个小单元，自动平铺填满任意形状",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="pDots" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="2.6" fill="#4c8dff"/>
    </pattern>
    <pattern id="pLines" width="10" height="10" patternUnits="userSpaceOnUse"
             patternTransform="rotate(45)">
      <rect width="4" height="10" fill="#e8833a"/>
    </pattern>
  </defs>
  <circle cx="86" cy="100" r="64" fill="url(#pDots)"/>
  <rect x="176" y="38" width="120" height="124" rx="14" fill="url(#pLines)"/>
</svg>`
    },
    {
      title: "clipPath：硬边裁剪",
      tag: "<clipPath>",
      q: "怎么把内容切成圆形头像、六边形封面？—— 裁剪路径之外的一律不画",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="cHex">
      <polygon points="160,26 226,64 226,140 160,178 94,140 94,64"/>
    </clipPath>
  </defs>
  <!-- 这组图形超出六边形的部分被直接裁掉 -->
  <g clip-path="url(#cHex)">
    <rect x="80" y="20" width="80" height="170" fill="#4c8dff"/>
    <rect x="160" y="20" width="80" height="170" fill="#e8833a"/>
    <circle cx="160" cy="102" r="46" fill="#e8b93c"/>
  </g>
  <polygon points="160,26 226,64 226,140 160,178 94,140 94,64"
           fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
</svg>`
    },
    {
      title: "mask：软边遮罩（渐变淡出）",
      tag: "<mask>",
      q: "想让边缘渐渐隐去而不是一刀切？—— 遮罩亮度决定透明度（轮播两侧渐隐就是它）",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="mFade">
      <rect width="320" height="200" fill="url(#mGrad)"/>
    </mask>
  </defs>
  <!-- 越靠右越透明：mask 越暗 → 内容越透明 -->
  <g mask="url(#mFade)">
    <rect x="20" y="50" width="300" height="34" rx="8" fill="#4c8dff"/>
    <rect x="20" y="96" width="300" height="34" rx="8" fill="#e8833a"/>
    <rect x="20" y="142" width="300" height="34" rx="8" fill="#3fae7a"/>
  </g>
</svg>`
    },
    {
      title: "marker：自动箭头",
      tag: "<marker>",
      q: "画带箭头的连线、坐标轴？—— marker 自动装在路径的起点 / 拐点 / 终点",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="mArrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M1 1 L9 5 L1 9" fill="none" stroke="#e8566d"
            stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <!-- marker-end：终点箭头 -->
  <path d="M40 150 C 100 150, 110 60, 170 60" fill="none"
        stroke="currentColor" stroke-width="2" marker-end="url(#mArrow)"/>
  <!-- marker-mid：每个拐点都装箭头 -->
  <polyline points="200,160 240,110 250,140 290,80" fill="none"
            stroke="currentColor" stroke-width="2" marker-mid="url(#mArrow)"/>
  <!-- marker-start：起点箭头（orient 自动翻转） -->
  <line x1="60" y1="40" x2="140" y2="40" stroke="currentColor"
        stroke-width="2" marker-start="url(#mArrow)"/>
</svg>`
    },
    {
      title: "文本：tspan 逐字 + textPath 沿路径",
      tag: "<text> <tspan> <textPath>",
      q: "文字想一个字一个字摆、还想绕着圆排？—— tspan 逐字定位，textPath 把字绑在曲线上",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path id="tArc" d="M50 160 C 100 70, 220 70, 270 160" fill="none"/>
  </defs>
  <!-- 文字沿 path 排列 -->
  <text font-size="16" fill="#4c8dff" font-weight="600">
    <textPath href="#tArc" startOffset="8">文字沿着曲线排排坐</textPath>
  </text>
  <!-- tspan：每个字单独 dy / rotate -->
  <text x="60" y="52" font-size="22" font-weight="600">
    <tspan fill="#e8566d" dy="0">逐</tspan><tspan fill="#e8833a" dy="-6">字</tspan><tspan fill="#3fae7a" dy="6" rotate="8">定</tspan><tspan fill="#8a6fe0" dy="-4" rotate="-8">位</tspan>
  </text>
  <text x="160" y="196" text-anchor="middle" font-size="11" fill="currentColor">
    text-anchor 控制对齐 · startOffset 控制起点
  </text>
</svg>`
    },
    {
      title: "symbol + use：定义一次，全站复用",
      tag: "<symbol> <use>",
      q: "同一个图标要用 20 次、还要不同颜色尺寸？—— 图标雪碧图的标准做法",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="iStar" viewBox="0 0 100 100">
      <polygon points="50,8 62,38 95,40 69,61 78,93 50,74 22,93 31,61 5,40 38,38"/>
    </symbol>
  </defs>
  <!-- use 克隆 symbol，各自指定 fill / 尺寸 / 位置 -->
  <use href="#iStar" x="30"  y="50" width="60"  height="60"  fill="#e8b93c"/>
  <use href="#iStar" x="120" y="34" width="92"  height="92"  fill="#e8566d"/>
  <use href="#iStar" x="242" y="58" width="48"  height="48"  fill="#4c8dff"/>
  <text x="160" y="176" text-anchor="middle" font-size="11" fill="currentColor">
    一份定义，三次实例化 —— use 还能跨文件引用 icons.svg#iStar
  </text>
</svg>`
    },
    {
      title: "currentColor：图标跟随文字变色",
      tag: "fill=\"currentColor\"",
      q: "深色模式下图标颜色不对？—— 不写死颜色，继承父级 color，CSS 一改全改",
      lang: "svg",
      code: `<!-- fill="currentColor" 继承元素自身的 color 属性 -->
<svg viewBox="0 0 100 100" style="width:26%;color:#4c8dff" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="34" r="16" fill="currentColor"/>
  <path d="M18 88 C 22 62, 78 62, 82 88 Z" fill="currentColor"/>
</svg>
<svg viewBox="0 0 100 100" style="width:26%;color:#e8566d" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="34" r="16" fill="currentColor"/>
  <path d="M18 88 C 22 62, 78 62, 82 88 Z" fill="currentColor"/>
</svg>
<svg viewBox="0 0 100 100" style="width:26%;color:#3fae7a" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="34" r="16" fill="currentColor"/>
  <path d="M18 88 C 22 62, 78 62, 82 88 Z" fill="currentColor"/>
</svg>`
    }
  ]
},

/* ============ 三、复杂功能 ============ */
{
  id: "complex",
  title: "复杂功能",
  desc: "滤镜、动画与脚本 —— SVG 的超能力",
  items: [
    {
      title: "滤镜流水线：手写柔和投影",
      tag: "feGaussianBlur feOffset feMerge",
      q: "投影不是现成属性？—— 模糊 → 位移 → 染色 → 合并，滤镜就是声明式像素流水线",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="fShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
      <feOffset dx="0" dy="6" result="off"/>
      <feFlood flood-color="#1a2240" flood-opacity="0.45"/>
      <feComposite in2="off" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="50" y="55" width="90" height="90" rx="16" fill="#4c8dff" filter="url(#fShadow)"/>
  <circle cx="220" cy="100" r="46" fill="#e8833a" filter="url(#fShadow)"/>
</svg>`
    },
    {
      title: "feColorMatrix：一键换色调",
      tag: "feColorMatrix",
      q: "灰度、反色、复古色调、色相旋转？—— 一个 4×5 颜色矩阵统统搞定",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="fGray"><feColorMatrix type="saturate" values="0"/></filter>
    <filter id="fHue"><feColorMatrix type="hueRotate" values="120"/></filter>
  </defs>
  <g>
    <rect x="16"  y="60" width="86" height="80" rx="12" fill="#e8566d"/>
    <circle cx="59" cy="100" r="24" fill="#e8b93c"/>
    <text x="59" y="176" text-anchor="middle" font-size="11" fill="currentColor">原图</text>
  </g>
  <g filter="url(#fGray)">
    <rect x="117" y="60" width="86" height="80" rx="12" fill="#e8566d"/>
    <circle cx="160" cy="100" r="24" fill="#e8b93c"/>
    <text x="160" y="176" text-anchor="middle" font-size="11" fill="currentColor">saturate 0 灰度</text>
  </g>
  <g filter="url(#fHue)">
    <rect x="218" y="60" width="86" height="80" rx="12" fill="#e8566d"/>
    <circle cx="261" cy="100" r="24" fill="#e8b93c"/>
    <text x="261" y="176" text-anchor="middle" font-size="11" fill="currentColor">hueRotate 120°</text>
  </g>
</svg>`
    },
    {
      title: "feTurbulence：程序化自然纹理",
      tag: "feTurbulence",
      q: "大理石、云朵、纸张纹理不想贴图？—— 柏林噪声现场生成，改参数就是换材质",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="fMarble">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.75  0 0 0 0 0.55  0 0 0 1 0"/>
    </filter>
    <filter id="fCloud">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.5  0 0 0 0 0.9  0 0 0 1.2 -0.15"/>
    </filter>
  </defs>
  <rect x="16" y="30" width="140" height="140" rx="12" filter="url(#fMarble)"/>
  <rect x="164" y="30" width="140" height="140" rx="12" filter="url(#fCloud)"/>
</svg>`
    },
    {
      title: "feDisplacementMap：水下折射",
      tag: "feDisplacementMap",
      q: "想让文字像沉在水底一样晃动？—— 噪声图当「高度场」，逐像素推挤源图形",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="fWater" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="turbulence" baseFrequency="0.02 0.09"
                    numOctaves="2" result="n">
        <animate attributeName="baseFrequency"
                 values="0.02 0.09; 0.035 0.11; 0.02 0.09"
                 dur="6s" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="14"/>
    </filter>
  </defs>
  <g filter="url(#fWater)">
    <text x="160" y="112" text-anchor="middle" font-size="52"
          font-weight="700" fill="#3f9edb">水波荡漾</text>
  </g>
</svg>`
    },
    {
      title: "gooey 黏合：模糊 + 对比度",
      tag: "feGaussianBlur + feColorMatrix",
      q: "两个球靠近就自动「融合」的液态效果？—— 先糊成一片，再把半透明区踢出去",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <style>
    .gooL { animation: gooL 3.2s ease-in-out infinite; }
    .gooR { animation: gooR 3.2s ease-in-out infinite; }
    @keyframes gooL { 0%,100% { cx: 100px; } 50% { cx: 165px; } }
    @keyframes gooR { 0%,100% { cx: 220px; } 50% { cx: 155px; } }
  </style>
  <defs>
    <filter id="fGoo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>
      <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/>
    </filter>
  </defs>
  <g filter="url(#fGoo)">
    <circle class="gooL" cy="100" r="24" fill="#e8566d"/>
    <circle class="gooR" cy="100" r="24" fill="#e8b93c"/>
  </g>
</svg>`
    },
    {
      title: "stroke-dashoffset：自己画出来的线条",
      tag: "dasharray 描边动画",
      q: "签名手写、轮廓描绘效果？—— pathLength 归一化后，把虚线偏移量从 100 推到 0",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <style>
    .draw {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: draw 2.6s ease-in-out infinite alternate;
    }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  </style>
  <!-- pathLength="100" 把任意长度的路径归一化为 100 份 -->
  <path class="draw" pathLength="100"
        d="M40 150 C 60 60, 120 40, 160 90 C 200 140, 260 120, 285 55"
        fill="none" stroke="#4c8dff" stroke-width="4" stroke-linecap="round"/>
  <path class="draw" pathLength="100" style="animation-delay:0.6s"
        d="M60 170 C 100 130, 220 130, 265 165"
        fill="none" stroke="#e8833a" stroke-width="4" stroke-linecap="round"/>
</svg>`
    },
    {
      title: "animateMotion：沿轨道飞行",
      tag: "animateMotion + mpath",
      q: "想让元素沿任意曲线运动还自动转头？—— SMIL 声明式动画，零 JS",
      lang: "svg",
      code: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
  <path id="track" d="M30 150 C 90 30, 230 30, 290 150"
        fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-dasharray="5 5" opacity="0.4"/>
  <!-- rotate="auto"：机身始终对准运动切线方向 -->
  <polygon points="0,-8 16,0 0,8 5,0" fill="#e8833a">
    <animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto">
      <mpath href="#track"/>
    </animateMotion>
  </polygon>
  <circle r="5" fill="#4c8dff">
    <animateMotion dur="3.6s" begin="-1.8s" repeatCount="indefinite">
      <mpath href="#track"/>
    </animateMotion>
  </circle>
</svg>`
    },
    {
      title: "交互：SVG 就是 DOM",
      tag: "JS 事件绑定",
      q: "图形想响应点击？—— 内联 SVG 是普通 DOM 节点，直接 addEventListener",
      lang: "js",
      note: "点我试试 →",
      code: `const colors = ['#4c8dff', '#e8566d', '#e8b93c', '#3fae7a', '#8a6fe0'];

mount.innerHTML =
  '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">' +
    '<circle id="btn" cx="160" cy="100" r="56" fill="#4c8dff"' +
    ' style="cursor:pointer;transition:r .2s"/>' +
    '<text id="label" x="160" y="106" text-anchor="middle" font-size="15"' +
    ' fill="#fff" style="pointer-events:none">点击我 x 0</text>' +
  '</svg>';

const c = mount.querySelector('#btn');
const t = mount.querySelector('#label');
let n = 0;

c.addEventListener('click', function () {
  n = n + 1;
  c.setAttribute('fill', colors[n % colors.length]);
  c.setAttribute('r', 46 + (n % 4) * 9);
  t.textContent = '点击我 x ' + n;
});`
    },
    {
      title: "数据可视化：JS 驱动生成图表",
      tag: "数据 → SVG",
      q: "D3、ECharts 的底层在干什么？—— 遍历数据算坐标，拼出 rect/text 节点",
      lang: "js",
      note: "悬停柱条可高亮",
      code: `const data = [['一月',42],['二月',68],['三月',55],['四月',80],['五月',61],['六月',92]];
const W = 320, H = 200, pad = 30;
const max = Math.max.apply(null, data.map(function (d) { return d[1]; }));

let s = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">';
s += '<style>rect.bar{transition:fill .15s}rect.bar:hover{fill:#e8833a}</style>';
s += '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - 8) +
     '" y2="' + (H - pad) + '" stroke="currentColor" opacity="0.35"/>';

data.forEach(function (d, i) {
  const bw = 30, gap = 15;
  const x = pad + 8 + i * (bw + gap);
  const bh = (H - pad * 2) * d[1] / max;
  const y = H - pad - bh;
  s += '<rect class="bar" x="' + x + '" y="' + y + '" width="' + bw +
       '" height="' + bh + '" rx="4" fill="#4c8dff">' +
       '<title>' + d[0] + '：' + d[1] + '</title></rect>';
  s += '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle"' +
       ' font-size="11" fill="currentColor">' + d[1] + '</text>';
  s += '<text x="' + (x + bw / 2) + '" y="' + (H - pad + 15) + '" text-anchor="middle"' +
       ' font-size="10" fill="currentColor" opacity="0.6">' + d[0] + '</text>';
});

s += '</svg>';
mount.innerHTML = s;`
    }
  ]
}
];
