/**
 * MODULE 12: CSS MATH & TYPOGRAPHY - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['12-css-math-typography'] = {
  id: '12-css-math-typography',
  title: '现代 CSS 数学函数与流体排版工程',

  init: function () {
    this.initClampResizer();
    this.initSubgridToggle();
    this.initTextWrapSelect();
  },

  initClampResizer: function () {
    const resizer = document.getElementById('clamp-resizer');
    const container = document.getElementById('clamp-fluid-container');
    const widthText = document.getElementById('clamp-width-display');
    const fontBadge = document.getElementById('clamp-computed-font');
    const title = document.getElementById('clamp-fluid-title');

    if (!resizer || !container) return;

    resizer.oninput = (e) => {
      const w = e.target.value;
      container.style.width = w + 'px';
      if (widthText) widthText.textContent = w + 'px';

      setTimeout(() => {
        if (title && fontBadge) {
          const fs = window.getComputedStyle(title).fontSize;
          fontBadge.textContent = '实时字号: ' + Math.round(parseFloat(fs)) + 'px';
        }
      }, 50);
    };
  },

  initSubgridToggle: function () {
    const btn = document.getElementById('btn-toggle-subgrid');
    const grid = document.getElementById('subgrid-parent-grid');
    const badge = document.getElementById('subgrid-state-badge');

    if (!btn || !grid) return;

    let isEnabled = false;

    btn.onclick = () => {
      isEnabled = !isEnabled;
      grid.classList.toggle('enable-subgrid', isEnabled);
      if (isEnabled) {
        btn.textContent = '切换: 关闭 Subgrid 对齐';
        badge.textContent = 'Subgrid: ON (底边像素级对齐 ✓)';
        badge.style.color = 'var(--accent-success)';
        if (window.LabCore) window.LabCore.showToast('Subgrid 已激活：子卡片继承父网格轨道，底边严丝合缝');
      } else {
        btn.textContent = '切换: 开启 Subgrid 子网格对齐';
        badge.textContent = 'Subgrid: OFF (按钮参差不齐)';
        badge.style.color = 'var(--text-muted)';
      }
    };
  },

  initTextWrapSelect: function () {
    const select = document.getElementById('select-text-wrap');
    const heading = document.getElementById('wrap-heading-target');

    if (!select || !heading) return;

    select.onchange = (e) => {
      const val = e.target.value;
      heading.className = `wrap-heading ${val}-mode`;
      if (window.LabCore) window.LabCore.showToast(`text-wrap 已切换为: ${val}`);
    };
  }
};
