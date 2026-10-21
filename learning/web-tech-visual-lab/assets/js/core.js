/**
 * WEB TECH VISUAL LAB - ULTIMATE RUNTIME ENGINE
 * Features: 13-Module Encyclopedia, Sticky Floating TOC Bar,
 *           High-Precision Scroll-Spy, Syntax Highlighter,
 *           DevTools HUD, Mastery Tracking, PWA Offline
 */

(function () {
  'use strict';

  window.LabModules = window.LabModules || {};

  const App = {
    currentModule: '01-html-semantics',
    activeStyleNode: null,
    _onScrollHandler: null,
    moduleList: [
      '01-html-semantics',
      '06-browser-pipeline',
      '11-web-security-defense',
      '02-css-selectors',
      '07-css-next-animations',
      '12-css-math-typography',
      '04-tailwind-recipes',
      '03-js-runtime',
      '08-advanced-web-apis',
      '13-async-concurrency-net',
      '05-native-components',
      '09-framework-paradigms',
      '10-web-graphics-audio'
    ],
    searchIndex: [
      // 01. HTML5 原生交互与语义
      { id: 'sec-01-dialog', module: '01-html-semantics', moduleTitle: 'HTML5 原生交互与语义', title: '<dialog> 原生模态对话框与 Top Layer', tag: 'HTML5 / Top Layer API', keywords: 'dialog modal 模态框 弹窗 backdrop 遮罩 esc 焦点锁定' },
      { id: 'sec-01-details', module: '01-html-semantics', moduleTitle: 'HTML5 原生交互与语义', title: '<details> 与 <summary> 原生折叠手风琴', tag: 'HTML5 / Details & Summary', keywords: 'details summary 折叠 手风琴 accordion 下拉 faq' },
      { id: 'sec-01-validation', module: '01-html-semantics', moduleTitle: 'HTML5 原生交互与语义', title: '表单约束验证 API 与 :user-invalid', tag: 'Form / Constraint Validation', keywords: 'form validation input pattern required datalist user-invalid 校验' },
      { id: 'sec-01-picture', module: '01-html-semantics', moduleTitle: 'HTML5 原生交互与语义', title: '<picture> 响应式媒体与视口艺术指导', tag: 'HTML5 / Picture & Source', keywords: 'picture source srcset media avif webp 响应式图片' },

      // 06. 关键渲染路径与管线
      { id: 'sec-06-crp', module: '06-browser-pipeline', moduleTitle: '关键渲染路径与管线', title: '重排 (Reflow) / 重绘 (Repaint) / GPU 合成', tag: 'CRP / Rendering Pipeline', keywords: 'crp reflow repaint composite 重排 重绘 合成 性能 掉帧' },
      { id: 'sec-06-script', module: '06-browser-pipeline', moduleTitle: '关键渲染路径与管线', title: '脚本加载时序 <script> vs defer vs async', tag: 'HTML / Script Loading', keywords: 'script defer async type module 加载时序 阻塞' },
      { id: 'sec-06-popover', module: '06-browser-pipeline', moduleTitle: '关键渲染路径与管线', title: '现代轻量弹出层：Popover API', tag: 'HTML / Popover API', keywords: 'popover popovertarget light dismiss 气泡菜单' },

      // 11. 现代 Web 安全与防御体系
      { id: 'sec-11-csp', module: '11-web-security-defense', moduleTitle: '现代 Web 安全与防护体系', title: 'CSP 内容安全策略：XSS 脚本注入拦截', tag: 'Security / CSP', keywords: 'csp content security policy xss 脚本注入 default-src nonce' },
      { id: 'sec-11-cors', module: '11-web-security-defense', moduleTitle: '现代 Web 安全与防护体系', title: 'CORS 跨域资源共享：简单请求 vs OPTIONS 预检', tag: 'Security / CORS', keywords: 'cors 跨域 预检 options preflight 跨站 握手' },
      { id: 'sec-11-cookie', module: '11-web-security-defense', moduleTitle: '现代 Web 安全与防护体系', title: 'Cookie 核心安全属性防御矩阵 (HttpOnly/SameSite)', tag: 'Security / Cookie', keywords: 'cookie httponly samesite secure csrf token 鉴权' },

      // 02. CSS 选择器与现代布局
      { id: 'sec-02-has', module: '02-css-selectors', moduleTitle: 'CSS 选择器与现代布局', title: 'CSS 父选择器与关系伪类 :has()', tag: 'CSS / Relational Selector', keywords: 'has selector 父选择器 关系选择器 状态联动' },
      { id: 'sec-02-is-where', module: '02-css-selectors', moduleTitle: 'CSS 选择器与现代布局', title: '特异性权重控制 :is() vs :where()', tag: 'CSS / Specificity', keywords: 'is where 特异性 specificity 权重 重置样式' },
      { id: 'sec-02-flex', module: '02-css-selectors', moduleTitle: 'CSS 选择器与现代布局', title: 'Flexbox 弹性轴与 flex-grow 空间瓜分', tag: 'CSS / Flexbox', keywords: 'flex flexbox justify-content align-items flex-grow 弹性盒' },
      { id: 'sec-02-grid', module: '02-css-selectors', moduleTitle: 'CSS 选择器与现代布局', title: 'CSS Grid 自适应网格 repeat(auto-fit)', tag: 'CSS / Grid Matrix', keywords: 'grid css grid auto-fit auto-fill minmax 响应式网格' },
      { id: 'sec-02-container', module: '02-css-selectors', moduleTitle: 'CSS 选择器与现代布局', title: '容器查询 @container (组件级响应式)', tag: 'CSS / Container Queries', keywords: 'container queries 容器查询 cqw inline-size 组件响应式' },

      // 07. 下一代 CSS 动画与色彩
      { id: 'sec-07-scroll-anim', module: '07-css-next-animations', moduleTitle: '下一代 CSS 动画与色彩', title: '滚动驱动动画（Scroll-Driven Animations）', tag: 'CSS / Scroll Animations', keywords: 'scroll driven animations animation-timeline 滚动动画 视差 进度条' },
      { id: 'sec-07-view-trans', module: '07-css-next-animations', moduleTitle: '下一代 CSS 动画与色彩', title: '视图过渡 API（View Transitions API）', tag: 'DOM / View Transitions', keywords: 'startViewTransition view transition 视图过渡 单页动画' },
      { id: 'sec-07-layers', module: '07-css-next-animations', moduleTitle: '下一代 CSS 动画与色彩', title: 'CSS 现代级联层 @layer 与 @scope', tag: 'CSS / Cascading Layers', keywords: 'layer scope 级联层 作用域 特异性覆盖' },
      { id: 'sec-07-color', module: '07-css-next-animations', moduleTitle: '下一代 CSS 动画与色彩', title: '下一代色彩空间 OKLCH 与 color-mix()', tag: 'CSS / Color Level 4', keywords: 'oklch color-mix 混色 色彩模型 调色盘' },

      // 12. 现代 CSS 数学与排版艺术
      { id: 'sec-12-clamp', module: '12-css-math-typography', moduleTitle: '现代 CSS 数学与排版工程', title: '流体排版数学函数 clamp(MIN, VAL, MAX)', tag: 'CSS / Math clamp', keywords: 'clamp fluid typography 流体排版 响应式数学 min max' },
      { id: 'sec-12-subgrid', module: '12-css-math-typography', moduleTitle: '现代 CSS 数学与排版工程', title: 'CSS Grid 进阶：Subgrid 跨层级子网格对齐', tag: 'CSS / Subgrid', keywords: 'subgrid 子网格 网格继承 跨层级对齐' },
      { id: 'sec-12-text-wrap', module: '12-css-math-typography', moduleTitle: '现代 CSS 数学与排版工程', title: '现代文字排版控制：text-wrap: balance vs pretty', tag: 'CSS / Typography', keywords: 'text-wrap balance pretty 标题换行 防孤字 排版' },

      // 04. Tailwind CSS 原子化实战
      { id: 'sec-04-utility', module: '04-tailwind-recipes', moduleTitle: 'Tailwind CSS 原子化实战', title: 'Utility-First 原子积木与任意值', tag: 'Tailwind / Utility-First', keywords: 'tailwind utility 原子化 任意值 tokens' },
      { id: 'sec-04-group-peer', module: '04-tailwind-recipes', moduleTitle: 'Tailwind CSS 原子化实战', title: '跨层级状态修饰符 group 与 peer', tag: 'Tailwind / group & peer', keywords: 'group peer group-hover peer-focus 状态联动' },
      { id: 'sec-04-recipes', module: '04-tailwind-recipes', moduleTitle: 'Tailwind CSS 原子化实战', title: '生产级精工 UI 组件配方库', tag: 'Tailwind / Recipes', keywords: 'toggle shimmer metric avatar 组件配方' },

      // 03. JavaScript 运行时与内核
      { id: 'sec-03-loop', module: '03-js-runtime', moduleTitle: 'JavaScript 运行时与内核', title: '事件循环（Event Loop）与任务调度队列', tag: 'JS / Event Loop', keywords: 'event loop 事件循环 call stack microtask macrotask promise setTimeout' },
      { id: 'sec-03-proxy', module: '03-js-runtime', moduleTitle: 'JavaScript 运行时与内核', title: '响应式代理 Proxy 与 Reflect', tag: 'JS / Proxy & Reflect', keywords: 'proxy reflect 响应式 拦截器 代理 数据驱动' },
      { id: 'sec-03-observer', module: '03-js-runtime', moduleTitle: 'JavaScript 运行时与内核', title: '视口交叉监听 IntersectionObserver', tag: 'JS / IntersectionObserver', keywords: 'intersection observer 懒加载 曝光统计 视口监听' },
      { id: 'sec-03-abort', module: '03-js-runtime', moduleTitle: 'JavaScript 运行时与内核', title: '异步中止信号 AbortController', tag: 'JS / AbortController', keywords: 'abort controller 中止请求 fetch signal 防竞态' },

      // 08. 高级 Web API 与多线程
      { id: 'sec-08-workers', module: '08-advanced-web-apis', moduleTitle: '高级 Web API 与多线程', title: '多线程并行计算：Web Workers', tag: 'HTML5 / Web Workers', keywords: 'web worker 多线程 后台计算 主线程卡死 60fps' },
      { id: 'sec-08-streams', module: '08-advanced-web-apis', moduleTitle: '高级 Web API 与多线程', title: '流式数据与管道：ReadableStream', tag: 'WHATWG / Streams API', keywords: 'streams readable stream 流式管道 打字机 llm' },
      { id: 'sec-08-weakmap', module: '08-advanced-web-apis', moduleTitle: '高级 Web API 与多线程', title: 'WeakMap 弱引用与自动垃圾回收 (GC)', tag: 'ECMAScript / Memory & GC', keywords: 'weakmap weakset 内存泄漏 垃圾回收 gc 弱引用' },
      { id: 'sec-08-storage', module: '08-advanced-web-apis', moduleTitle: '高级 Web API 与多线程', title: '浏览器离线存储方案全景矩阵', tag: 'Storage / IndexedDB & OPFS', keywords: 'localstorage indexeddb opfs 存储 文件系统' },

      // 13. 异步并发赛马场与网络传输
      { id: 'sec-13-promise', module: '13-async-concurrency-net', moduleTitle: '异步并发调度赛马场与网络传输', title: 'Promise 6 大并发组合器同屏竞速赛马场', tag: 'JS / Promises', keywords: 'promise all allsettled race any 并发 竞速 调度' },
      { id: 'sec-13-protocols', module: '13-async-concurrency-net', moduleTitle: '异步并发调度赛马场与网络传输', title: '实时网络通信协议对决：SSE vs WebSocket', tag: 'Network / Protocols', keywords: 'sse server-sent events websocket 实时通信 轮询' },

      // 05. Web Components 原生组件
      { id: 'sec-05-shadow', module: '05-native-components', moduleTitle: 'Web Components 原生组件', title: 'Shadow DOM 样式作用域强隔离', tag: 'Web Components / Shadow DOM', keywords: 'shadow dom 样式隔离 shadowRoot 作用域' },
      { id: 'sec-05-custom', module: '05-native-components', moduleTitle: 'Web Components 原生组件', title: '原生自定义元素与生命周期', tag: 'Web Components / Custom Elements', keywords: 'custom elements 自定义标签 define attributeChangedCallback connectedCallback' },
      { id: 'sec-05-template', module: '05-native-components', moduleTitle: 'Web Components 原生组件', title: '模板骨架与具名插槽投射', tag: 'Web Components / Template & Slot', keywords: 'template slot 模版 插槽 cloneNode' },

      // 09. 响应式内核大对决
      { id: 'sec-09-reactivity', module: '09-framework-paradigms', moduleTitle: '响应式内核大对决', title: 'Signals vs Vue3 Proxy vs React VDOM', tag: 'Framework / Reactivity Paradigms', keywords: 'signals solidjs vue3 proxy react vdom diff 响应式 对决' },
      { id: 'sec-09-broadcast', module: '09-framework-paradigms', moduleTitle: '响应式内核大对决', title: '跨标签页原生通信：BroadcastChannel', tag: 'HTML5 / BroadcastChannel', keywords: 'broadcast channel 多标签页 跨页面同步' },

      // 10. 图像滤镜与音频合成
      { id: 'sec-10-canvas', module: '10-web-graphics-audio', moduleTitle: '图像滤镜与音频合成', title: 'Canvas 2D 像素处理：矩阵卷积核滤镜', tag: 'HTML5 / Canvas ImageData', keywords: 'canvas 2d imagedata 像素 卷积 滤镜 边缘检测 sobel' },
      { id: 'sec-10-audio', module: '10-web-graphics-audio', moduleTitle: '图像滤镜与音频合成', title: 'Web Audio API 原生音频振荡合成器', tag: 'W3C / Web Audio API', keywords: 'web audio oscillator 振荡器 音频合成 示波器 和弦' }
    ]
  };

  // 1. Theme Management
  function initTheme() {
    const saved = localStorage.getItem('web-visual-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (saved === 'dark' || prefersDark) {
      document.documentElement.classList.add('dark');
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('web-visual-theme', isDark ? 'dark' : 'light');
      };
    }
  }

  // 2. Pure Native Syntax Tokenizer
  function highlightCode(rawCode) {
    let esc = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    esc = esc.replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|&lt;!--[\s\S]*?--&gt;|#[^\n]*)/g, '<span class="tok-comment">$1</span>');
    esc = esc.replace(/(&quot;[\s\S]*?&quot;|'[^'\n]*'|`[^`]*`)/g, '<span class="tok-str">$1</span>');
    esc = esc.replace(/\b(const|let|var|function|class|return|if|else|import|export|from|new|async|await|try|catch|static|extends|while|for|switch|case|break|default)\b/g, '<span class="tok-kw">$1</span>');
    esc = esc.replace(/\b(\d+(?:\.\d+)?(?:px|ms|s|%|rem|em|deg|vh|vw|cqw)?)\b/g, '<span class="tok-num">$1</span>');
    esc = esc.replace(/(&lt;\/?[a-zA-Z0-9\-]+)/g, '<span class="tok-tag">$1</span>');

    return esc;
  }

  function applySyntaxHighlighting() {
    document.querySelectorAll('.code-content').forEach(block => {
      if (block.dataset.highlighted) return;
      block.innerHTML = highlightCode(block.innerText.trim());
      block.dataset.highlighted = 'true';
    });
  }

  // 3. DevTools Real-Time HUD (FPS & Specificity & DOM)
  function initDevToolsHUD() {
    const triggerBtn = document.getElementById('hud-trigger-btn');
    const drawer = document.getElementById('devtools-hud-drawer');
    const closeBtn = document.getElementById('hud-close-btn');

    const fpsDisplay = document.getElementById('hud-fps-val');
    const fpsText = document.getElementById('hud-fps-text');
    const fpsDot = document.getElementById('hud-fps-dot');
    const domCountDisplay = document.getElementById('hud-dom-count');
    const specInput = document.getElementById('hud-spec-input');
    const specScore = document.getElementById('hud-spec-score');

    if (!triggerBtn || !drawer) return;

    triggerBtn.onclick = (e) => {
      e.stopPropagation();
      drawer.classList.toggle('open');
    };

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        drawer.classList.remove('open');
      };
    }

    // 点击外部区域自动收起抽屉
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !triggerBtn.contains(e.target)) {
        drawer.classList.remove('open');
      }
    });

    // FPS Ticker
    let lastTime = performance.now();
    let frames = 0;
    function tickFps(now) {
      frames++;
      if (now >= lastTime + 500) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        if (fpsDisplay) fpsDisplay.textContent = fps + ' FPS';
        if (fpsText) fpsText.textContent = fps + ' FPS';
        if (fpsDot) {
          if (fps < 45) fpsDot.classList.add('warn');
          else fpsDot.classList.remove('warn');
        }
        frames = 0;
        lastTime = now;
        if (domCountDisplay) domCountDisplay.textContent = document.getElementsByTagName('*').length;
      }
      requestAnimationFrame(tickFps);
    }
    requestAnimationFrame(tickFps);

    // Specificity Calculator
    if (specInput && specScore) {
      specInput.oninput = (e) => {
        const s = e.target.value.trim();
        if (!s) {
          specScore.textContent = 'Specificity: (0, 0, 0)';
          return;
        }
        let ids = (s.match(/#[a-zA-Z0-9_-]+/g) || []).length;
        let classes = (s.match(/\.[a-zA-Z0-9_-]+/g) || []).length +
                      (s.match(/\[[^\]]+\]/g) || []).length +
                      (s.match(/:[a-zA-Z0-9_-]+/g) || []).filter(p => !p.startsWith('::') && !p.startsWith(':is') && !p.startsWith(':where') && !p.startsWith(':not')).length;
        let tags = (s.match(/^[a-zA-Z0-9-]+|\s+[a-zA-Z0-9-]+/g) || []).length + (s.match(/::[a-zA-Z0-9_-]+/g) || []).length;
        if (s.includes(':where')) {
          specScore.innerHTML = `Specificity: (${ids}, ${classes}, ${tags}) <span style="color: var(--accent-success)">(:where 权重为0)</span>`;
        } else {
          specScore.textContent = `Specificity: (${ids}, ${classes}, ${tags}) [ID: ${ids}, Class: ${classes}, Tag: ${tags}]`;
        }
      };
    }
  }

  // 4. Mastery Tracking System (LocalStorage)
  function getMasteredSections() {
    try {
      return JSON.parse(localStorage.getItem('web-visual-mastery') || '[]');
    } catch {
      return [];
    }
  }

  function toggleMastery(sectionId) {
    const list = getMasteredSections();
    const idx = list.indexOf(sectionId);
    if (idx >= 0) {
      list.splice(idx, 1);
      showToast('已取消掌握标记');
    } else {
      list.push(sectionId);
      showToast('已标记为已掌握 ✓');
    }
    localStorage.setItem('web-visual-mastery', JSON.stringify(list));
    updateMasteryUI();
  }

  function updateMasteryUI() {
    const mastered = getMasteredSections();
    const totalCount = App.searchIndex.length;
    const masteredCount = mastered.length;

    const fillBar = document.getElementById('global-progress-fill');
    const countDisplay = document.getElementById('global-progress-text');
    if (fillBar && countDisplay) {
      const pct = Math.round((masteredCount / totalCount) * 100);
      fillBar.style.width = pct + '%';
      countDisplay.textContent = `${masteredCount} / ${totalCount} (${pct}%)`;
    }

    document.querySelectorAll('.spec-section').forEach(sec => {
      const id = sec.id;
      const isMastered = mastered.includes(id);
      sec.classList.toggle('is-mastered', isMastered);

      let header = sec.querySelector('.spec-section-header');
      if (header) {
        let actionArea = header.querySelector('.spec-header-actions');
        if (!actionArea) {
          actionArea = document.createElement('div');
          actionArea.className = 'spec-header-actions';
          const metaTag = header.querySelector('.spec-meta-tag');
          if (metaTag) actionArea.appendChild(metaTag);
          header.appendChild(actionArea);
        }

        let masteryBtn = header.querySelector('.mastery-btn');
        if (!masteryBtn) {
          masteryBtn = document.createElement('button');
          masteryBtn.className = 'mastery-btn';
          masteryBtn.onclick = () => toggleMastery(id);
          actionArea.appendChild(masteryBtn);
        }

        masteryBtn.className = 'mastery-btn' + (isMastered ? ' active' : '');
        masteryBtn.innerHTML = isMastered ? '✓ 已掌握' : '○ 标记掌握';
      }
    });

    App.moduleList.forEach(modId => {
      const modSections = App.searchIndex.filter(s => s.module === modId).map(s => s.id);
      const modMastered = modSections.filter(id => mastered.includes(id)).length;
      const navBtn = document.querySelector(`.nav-item[data-module="${modId}"]`);
      if (navBtn) {
        const badge = navBtn.querySelector('.badge');
        if (badge) {
          if (modMastered === modSections.length && modSections.length > 0) {
            badge.classList.add('done');
            badge.textContent = `${modMastered}/${modSections.length} ✓`;
          } else if (modMastered > 0) {
            badge.classList.remove('done');
            badge.textContent = `${modMastered}/${modSections.length}`;
          }
        }
      }
    });
  }

  // 5. STICKY FLOATING TOC & HIGH-PRECISION SCROLL-SPY
  function initScrollSpy() {
    const pills = document.querySelectorAll('.toc-pill');
    const sections = Array.from(document.querySelectorAll('.spec-section, .spec-reference-section'));
    if (pills.length === 0 || sections.length === 0) return;

    // 默认高亮第 1 项
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === 0);
    });

    // 绑定 TOC 胶囊点击：平滑滚动 + 立即高亮
    pills.forEach(pill => {
      pill.onclick = (e) => {
        e.preventDefault();
        const href = pill.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const targetY = targetEl.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });

          targetEl.style.borderColor = 'var(--text-primary)';
          setTimeout(() => { targetEl.style.borderColor = ''; }, 1200);

          history.replaceState(null, '', `#${App.currentModule}/${targetId}`);
        }
      };
    });

    // 滚动监听精确判断当前可视章节（带防抖）
    let scrollTimer = null;
    function onScroll() {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;

        // 如果在页面顶部（距离顶端 < 80px），激活第 1 项
        if (window.pageYOffset < 80) {
          pills.forEach((p, idx) => p.classList.toggle('active', idx === 0));
          return;
        }

        // 如果在页面最底端，激活最后一项
        const scrollBottom = window.innerHeight + window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight;
        if (scrollBottom >= docHeight - 40) {
          pills.forEach((p, idx) => p.classList.toggle('active', idx === pills.length - 1));
          return;
        }

        // 计算哪个 section 处于当前视口阅读线（距离视口顶部 140px 处）
        let activeId = null;
        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom > 140) {
            activeId = sections[i].id;
            break;
          }
        }

        if (activeId) {
          pills.forEach(p => {
            const href = p.getAttribute('href');
            p.classList.toggle('active', href === '#' + activeId);
          });
        }
      }, 30);
    }

    if (App._onScrollHandler) {
      window.removeEventListener('scroll', App._onScrollHandler);
    }
    App._onScrollHandler = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 6. Dynamic Module Loader & Deep-Linking
  async function loadModule(moduleId, targetSectionId = null) {
    const viewport = document.getElementById('app-viewport');
    const breadcrumbCurrent = document.getElementById('current-module-title');

    const navBtn = document.querySelector(`.nav-item[data-module="${moduleId}"]`);
    if (navBtn) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      navBtn.classList.add('active');
      const label = navBtn.querySelector('.nav-label');
      if (label && breadcrumbCurrent) {
        breadcrumbCurrent.textContent = label.textContent;
      }
    }

    try {
      const res = await fetch(`modules/${moduleId}/template.html`);
      if (res.ok) {
        const html = await res.text();
        viewport.innerHTML = html;
        injectModuleCss(moduleId);

        const oldScript = document.getElementById('module-script-' + moduleId);
        if (!oldScript) {
          const script = document.createElement('script');
          script.id = 'module-script-' + moduleId;
          script.src = `modules/${moduleId}/script.js`;
          script.onload = () => {
            if (window.LabModules[moduleId] && typeof window.LabModules[moduleId].init === 'function') {
              window.LabModules[moduleId].init();
            }
          };
          document.body.appendChild(script);
        } else {
          if (window.LabModules[moduleId] && typeof window.LabModules[moduleId].init === 'function') {
            window.LabModules[moduleId].init();
          }
        }

        App.currentModule = moduleId;
        bindCodeCopyButtons();
        applySyntaxHighlighting();
        updateMasteryUI();
        initScrollSpy();

        if (targetSectionId) {
          history.replaceState(null, '', `#${moduleId}/${targetSectionId}`);
          setTimeout(() => scrollToSection(targetSectionId), 250);
        } else {
          history.replaceState(null, '', `#${moduleId}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('模块装载异常:', err);
      showToast('模块装载异常', 'error');
    }
  }

  function injectModuleCss(moduleId) {
    if (App.activeStyleNode) {
      App.activeStyleNode.remove();
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `modules/${moduleId}/style.css`;
    document.head.appendChild(link);
    App.activeStyleNode = link;
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) {
      const targetY = target.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      target.style.borderColor = 'var(--text-primary)';
      setTimeout(() => { target.style.borderColor = ''; }, 1500);
    }
  }

  // 7. URL Deep Linking Initializer
  function handleUrlHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    if (hash.includes('/')) {
      const [mod, sec] = hash.split('/');
      if (App.moduleList.includes(mod) && mod !== App.currentModule) {
        loadModule(mod, sec);
      } else if (sec) {
        scrollToSection(sec);
      }
    } else if (App.moduleList.includes(hash) && hash !== App.currentModule) {
      loadModule(hash);
    }
  }

  // 8. Search Engine (Ctrl + K)
  function initSearch() {
    const searchTrigger = document.getElementById('search-trigger');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchModal) return;

    function openSearch() {
      searchModal.classList.add('open');
      searchInput.value = '';
      renderResults('');
      setTimeout(() => searchInput.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('open');
    }

    function renderResults(q) {
      const query = q.toLowerCase().trim();
      const filtered = App.searchIndex.filter(item => {
        if (!query) return true;
        return item.title.toLowerCase().includes(query) ||
               item.tag.toLowerCase().includes(query) ||
               item.keywords.toLowerCase().includes(query);
      });

      if (filtered.length === 0) {
        searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">无匹配结果</div>';
        return;
      }

      searchResults.innerHTML = filtered.map((item, i) => `
        <div class="search-result-item ${i === 0 ? 'selected' : ''}" data-target-id="${item.id}" data-module="${item.module}">
          <div>
            <div class="search-result-title">${item.title}</div>
            <div class="search-result-desc">${item.moduleTitle} · ${item.tag}</div>
          </div>
          <span class="badge">Go</span>
        </div>
      `).join('');

      searchResults.querySelectorAll('.search-result-item').forEach(el => {
        el.onclick = () => {
          const targetId = el.getAttribute('data-target-id');
          const targetModule = el.getAttribute('data-module');
          closeSearch();
          if (App.currentModule !== targetModule) {
            loadModule(targetModule, targetId);
          } else {
            scrollToSection(targetId);
          }
        };
      });
    }

    if (searchTrigger) searchTrigger.onclick = openSearch;
    searchInput.oninput = (e) => renderResults(e.target.value);
    searchModal.onclick = (e) => { if (e.target === searchModal) closeSearch(); };

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchModal.classList.contains('open') ? closeSearch() : openSearch();
      }
      if (e.key === 'Escape') {
        if (searchModal.classList.contains('open')) closeSearch();
        const drawer = document.getElementById('devtools-hud-drawer');
        if (drawer) drawer.classList.remove('open');
      }
    });
  }

  // 9. Keyboard Shortcuts ([ / ] and Alt + Numbers)
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      const currIdx = App.moduleList.indexOf(App.currentModule);

      if (e.key === ']') {
        e.preventDefault();
        const nextIdx = (currIdx + 1) % App.moduleList.length;
        loadModule(App.moduleList[nextIdx]);
        showToast(`切换到模块 [${nextIdx + 1}]: ${App.moduleList[nextIdx]}`);
      } else if (e.key === '[') {
        e.preventDefault();
        const prevIdx = (currIdx - 1 + App.moduleList.length) % App.moduleList.length;
        loadModule(App.moduleList[prevIdx]);
        showToast(`切换到模块 [${prevIdx + 1}]: ${App.moduleList[prevIdx]}`);
      } else if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const targetMod = App.moduleList[parseInt(e.key, 10) - 1];
        if (targetMod) loadModule(targetMod);
      } else if (e.altKey && e.key === '0') {
        e.preventDefault();
        loadModule(App.moduleList[9]);
      }
    });
  }

  // 10. Code Copy
  function bindCodeCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = async () => {
        const pane = btn.closest('.code-preview-pane');
        const code = pane ? pane.querySelector('.code-content') : null;
        if (!code) return;

        try {
          await navigator.clipboard.writeText(code.innerText.trim());
          const original = btn.innerHTML;
          btn.innerHTML = '已复制';
          showToast('代码已复制到剪贴板');
          setTimeout(() => { btn.innerHTML = original; }, 1500);
        } catch (err) {
          showToast('复制失败', 'error');
        }
      };
    });
  }

  // 11. Toast Notifications
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      toast.style.transition = 'all 0.15s ease';
      setTimeout(() => toast.remove(), 150);
    }, 2000);
  }

  // 12. Sidebar Controller (Desktop Collapse & Mobile Drawer)
  function initSidebar() {
    const toggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggleBtn || !sidebar) return;

    toggleBtn.onclick = () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
      }
    };

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 13. Navigation Bindings
  function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.onclick = () => {
        const mod = btn.getAttribute('data-module');
        if (mod && mod !== App.currentModule) {
          loadModule(mod);
          const sidebar = document.getElementById('sidebar');
          if (sidebar) sidebar.classList.remove('open');
        }
      };
    });
  }

  // 14. PWA Offline Service Worker Registration
  function initPWA() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // 15. Bootstrap
  function bootstrap() {
    initTheme();
    initSearch();
    initSidebar();
    initNavigation();
    initKeyboardShortcuts();
    initDevToolsHUD();
    initPWA();
    bindCodeCopyButtons();
    applySyntaxHighlighting();
    updateMasteryUI();
    initScrollSpy();

    if (window.location.hash) {
      handleUrlHash();
    } else if (window.LabModules['01-html-semantics'] && typeof window.LabModules['01-html-semantics'].init === 'function') {
      window.LabModules['01-html-semantics'].init();
    }

    window.addEventListener('hashchange', handleUrlHash);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  window.LabCore = { showToast, loadModule, updateMasteryUI, applySyntaxHighlighting, initScrollSpy };

})();
