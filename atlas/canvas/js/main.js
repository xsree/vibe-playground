/* Canvas Visual Lab — 页面装配：板块选项卡 / 卡片渲染 / 代码高亮 / 主题切换 */
(function () {
  'use strict';

  /* ===== 极简语法高亮 ===== */
  function highlight(src) {
    var esc = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return esc
      .replace(/(\/\/[^\n]*)/g, '<span class="tok-c">$1</span>')
      .replace(/('[^'\n]*')/g, '<span class="tok-s">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|of|in|new|typeof)\b/g, '<span class="tok-k">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-n">$1</span>');
  }

  /* ===== 主题切换 ===== */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  var themeLabel = document.getElementById('themeLabel');

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeLabel.textContent = t === 'dark' ? '浅色模式' : '深色模式';
    try { localStorage.setItem('cvl-theme', t); } catch (e) { /* 忽略 */ }
  }
  var saved = null;
  try { saved = localStorage.getItem('cvl-theme'); } catch (e) { /* 忽略 */ }
  applyTheme(saved || 'dark');
  themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ===== 板块选项卡 ===== */
  var lab = document.getElementById('lab');
  var tabsNav = document.getElementById('sectionTabs');
  var CW = 520, CH = 320;
  var cleanups = [];
  var activeKey = null;

  CANVAS_SECTIONS.forEach(function (sec) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab';
    btn.dataset.key = sec.key;
    btn.innerHTML = sec.title + ' <span class="tab-count">' + sec.demos.length + '</span>';
    btn.addEventListener('click', function () { switchSection(sec.key); });
    tabsNav.appendChild(btn);
  });

  function switchSection(key) {
    if (key === activeKey) return;
    activeKey = key;

    /* 停止上一板块的所有动画循环 */
    cleanups.forEach(function (fn) { if (typeof fn === 'function') fn(); });
    cleanups = [];

    var tabs = tabsNav.querySelectorAll('.tab');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.key === key);
    });

    lab.innerHTML = '';
    var sec = null;
    CANVAS_SECTIONS.forEach(function (s) { if (s.key === key) sec = s; });
    if (!sec) return;

    /* 板块标题 */
    var head = document.createElement('div');
    head.className = 'sec-head';
    head.innerHTML = '<h2>' + sec.title + '</h2><p>' + sec.desc + '</p>';
    lab.appendChild(head);

    sec.demos.forEach(function (demo) {
      lab.appendChild(buildCard(demo));
    });
  }

  /* ===== 卡片装配：左代码 + 右实时画布 ===== */
  function buildCard(demo) {
    var card = document.createElement('section');
    card.className = 'card';

    var head = document.createElement('header');
    head.className = 'card-head';
    head.innerHTML =
      '<span class="num">' + demo.id + '</span>' +
      '<div><h2>' + demo.title + '</h2><p>' + demo.sub + '</p></div>';

    var body = document.createElement('div');
    body.className = 'card-body';

    /* 左：代码面板 */
    var codeWrap = document.createElement('div');
    codeWrap.className = 'code-wrap';
    var codeTab = document.createElement('div');
    codeTab.className = 'code-tab';
    codeTab.textContent = demo.file + '.js';
    var pre = document.createElement('pre');
    pre.className = 'code';
    var code = document.createElement('code');
    code.innerHTML = highlight(demo.fn.toString());
    pre.appendChild(code);
    codeWrap.appendChild(codeTab);
    codeWrap.appendChild(pre);

    /* 右：实时舞台 */
    var stage = document.createElement('div');
    stage.className = 'stage';
    var stageTab = document.createElement('div');
    stageTab.className = 'stage-tab';
    stageTab.innerHTML =
      '<span>' + (demo.webgl ? 'webgl context' : '2d context') + ' · ' + CW + ' × ' + CH + '</span>' +
      '<span class="live">live</span>';
    var canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    stage.appendChild(stageTab);
    stage.appendChild(canvas);

    body.appendChild(codeWrap);
    body.appendChild(stage);
    card.appendChild(head);
    card.appendChild(body);

    /* 启动演示，动画类演示返回 cleanup 供板块切换时停止 */
    var ret;
    if (demo.webgl) {
      ret = demo.fn(canvas, CW, CH);
    } else {
      var ctx = canvas.getContext('2d');
      ret = demo.fn(ctx, CW, CH, canvas);
    }
    if (typeof ret === 'function') cleanups.push(ret);

    return card;
  }

  /* 默认打开第一个板块 */
  switchSection(CANVAS_SECTIONS[0].key);
})();
