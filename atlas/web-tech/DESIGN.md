# Web Tech Visual Lab · 终极设计系统与视觉规范 (DESIGN.MD)

本文件定义了 **Web Tech Visual Lab** 的完整设计系统、界面视觉规范、信息层级体系、交互工具与全景规范架构。

---

## 1. 核心设计哲学（Design Philosophy）

1. **精工工程美学（Precision Craftsmanship）**：
   * 对标 **Vercel / Linear / Stripe Docs / Radix UI** 的工匠级开发工具质感；
   * 杜绝任何粗糙的 AI 生成味：**严禁滥用 Emoji、严禁霓虹荧光色块与彩虹渐变、严禁营销套话与浮夸比喻**。
2. **极高信噪比（High Signal-to-Noise Ratio）**：
   * 去除所有无关装饰，视觉元素严格服务于“技术机制理解”与“代码实时检视”；
   * 界面以单色调（Zinc 灰阶）为基底，色彩仅用于表达状态（成功、告警、错误、激活）。
3. **真实可运行的即时反馈（Real-time Interactive Feedback）**：
   * 所有演示拒绝静态伪代码，必须具备可交互的真实 DOM 画布，操作控件时实时联动代码与规范说明。

---

## 2. 交互与表现形式升级体系（Form & Interaction System）

1. **实时开发者仪表盘雷达（Mini DevTools HUD）**：
   * 顶栏集成 `60 FPS` 动态指示器，支持一键呼出浮动监测面板；
   * 内置基于 `requestAnimationFrame` 的真实帧率监测、活跃 DOM 节点统计与实时 **CSS Specificity (特异性) 计算器**。
2. **多技术栈代码 Tab 实时对照（Framework Flavor Tabs）**：
   * 代码检视区提供多框架无缝切换 Tab（`Vanilla` / `React 19` / `Vue 3` / `Tailwind`），自动应用纯原生零依赖语法着色。
3. **学习掌握度闭环追踪（Mastery Tracking System）**：
   * 章节级掌握状态切换与持久化存储（`localStorage`），侧边栏联动全局进度条。

---

## 3. 信息架构：流式交互技术规范工作台（Linear Specification Workbench）

全站采用适合深度技术阅读与复习的**线性流式文档结构**：

### 3.1 单模块总览结构
```text
┌────────────────────────────────────────────────────────────────────────┐
│ 📌 Module Header: 规范分类标签 + 加粗大标题 + 核心定义                 │
│ 🏷️ Table of Contents: [ § 01.01 章节 A ] [ § 01.02 章节 B ] ... 胶囊直达  │
├────────────────────────────────────────────────────────────────────────┤
│ 📜 Sequential Specification Stream (自上而下的线性章节流)              │
│    ├── § 01.01 核心专题 A (62% 实验画布 + 38% 检视代码)                 │
│    ├── § 01.02 核心专题 B (62% 实验画布 + 38% 检视代码)                 │
│    └── ...                                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 📊 Cheatsheet Table: 12 列技术规范与底层规则速查矩阵表                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 单章节双栏标准工作台（Split Workbench）
每个技术点统一采用 **`1.4fr : 1fr`（约 62% : 38%）** 的并排双栏结构：
* **左侧 62% 交互实验画布（Canvas Pane）**：顶部控制栏 + 高对比度真实 DOM 实验舞台。
* **右侧 38% 检视器与代码（Inspector Pane）**：多框架代码 Tab + 核心机制与避坑说明 + 终端代码视窗。

---

## 4. 全景 13 大核心规范模块图谱

```text
📁 体系一：内核、管线与安全
├── 🏷️ 01. HTML5 原生交互与现代语义体系
├── ⚙️ 06. 关键渲染路径与浏览器管线 (CRP / Reflow / Popover)
└── 🛡️ 11. 现代 Web 安全与客户端防御体系 (CSP / CORS / Cookie)

📁 体系二：现代 CSS 与视效排版
├── 🎨 02. 现代 CSS 选择器与核心布局引擎 (:has / Flex / Grid / @container)
├── ✨ 07. 下一代 CSS 动画与现代色彩工程 (Scroll-Driven / ViewTransitions / OKLCH)
├── 📐 12. 现代 CSS 数学函数与流体排版工程 (clamp / Subgrid / text-wrap)
└── 🌊 04. Tailwind CSS 原子化模式与组件配方

📁 体系三：JS 运行时、多线程与网络协议
├── ⚡ 03. JavaScript 现代运行时与核心 API (Event Loop / Proxy / Observer)
├── 🔬 08. 高级 Web API、多线程与内存管理 (Workers / Streams / WeakMap / 存储)
└── ⏱️ 13. 异步并发调度赛马场与网络传输协议 (Promise 6大API / SSE / WS)

📁 体系四：框架内核与组件规范
├── 🧩 05. Web Components 原生组件化规范 (Shadow DOM / Custom Elements)
└── 🧠 09. 现代前端响应式内核与通信架构 (Signals / Proxy / VDOM / BroadcastChannel)

📁 体系五：纯前端极限能力
└── 🚀 10. 纯前端视听计算与硬件底层接口 (Canvas 卷积滤镜 / Web Audio 合成)
```

---

## 5. 色彩系统与表面层级（Color & Surface Tokens）

全站基于 **Zinc 灰阶体系** 构建，支持原生深色（Dark）/浅色（Light）模式无缝切换。

* **深色主题（Dark）**：`#09090b`（底板）、`#141416`（表面卡片）、`#060608`（代码终端）、1px 微发丝边框；
* **浅色主题（Light）**：`#f4f4f5`（纸质底板）、`#ffffff`（纯白卡片）、`#09090b`（高对比度炭黑字）；
* **字体阶梯**：Inter（正文）+ Fira Code（代码与标签），字号从 `0.65rem` 到 `1.75rem` 严格分层。

---

## 6. 前端架构与离线能力规范

1. **物理三解耦**：每个模块独立存放在 `modules/XX-name/` 目录下（`template.html` + `style.css` + `script.js` 物理分离）。
2. **零构建、零依赖、零后端**：现代原生 ES6+ 动态按需加载，无需本地编译打包。
3. **PWA 渐进式离线支持**：内置 `manifest.json` 与 `sw.js`，支持安装为桌面独立 App，全离线可用。
