/**
 * MODULE 02: CSS SELECTORS - INTERACTION CONTROLLERS & LIVE CODE BINDING
 */

window.LabModules = window.LabModules || {};

window.LabModules['02-css-selectors'] = {
  id: '02-css-selectors',
  title: 'CSS 选择器与现代布局',

  init: function () {
    this.initHasSelector();
    this.initSpecificityArena();
    this.initFlexboxSandbox();
    this.initGridSandbox();
    this.initContainerQuery();
  },

  initHasSelector: function () {
    const card = document.getElementById('smart-task-card');
    const chkUrgent = document.getElementById('chk-urgent');
    const chkDanger = document.getElementById('chk-danger');
    const indicator = card ? card.querySelector('.task-state-indicator') : null;

    if (!card || !chkUrgent || !chkDanger) return;

    function updateState() {
      if (chkDanger.checked) {
        if (indicator) indicator.textContent = 'Critical State (:has danger)';
      } else if (chkUrgent.checked) {
        if (indicator) indicator.textContent = 'Urgent State (:has urgent)';
      } else {
        if (indicator) indicator.textContent = 'Default State';
      }
    }

    chkUrgent.onchange = updateState;
    chkDanger.onchange = updateState;
  },

  initSpecificityArena: function () {
    const btnToggle = document.getElementById('btn-toggle-override');
    const whereBtn = document.querySelector('.where-target');
    const isBtn = document.querySelector('.is-target');
    const whereStatus = document.getElementById('where-status');
    const isStatus = document.getElementById('is-status');

    if (!btnToggle || !whereBtn || !isBtn) return;

    let overridden = false;

    btnToggle.onclick = () => {
      overridden = !overridden;
      if (overridden) {
        whereBtn.classList.add('btn-override');
        isBtn.classList.add('btn-override');
        btnToggle.textContent = '移除下游单类名覆盖 (.btn-override)';
        if (whereStatus) whereStatus.textContent = '已成功覆写为绿色 (.btn-override 生效)';
        if (isStatus) isStatus.textContent = '仍然保持原有颜色 (is 权重更高覆写失败)';
        if (window.LabCore) window.LabCore.showToast(':where() 权重为 0 被成功覆盖，:is() 权重更高阻挡覆盖');
      } else {
        whereBtn.classList.remove('btn-override');
        isBtn.classList.remove('btn-override');
        btnToggle.textContent = '注入下游单类名覆盖 (.btn-override)';
        if (whereStatus) whereStatus.textContent = '默认基础样式';
        if (isStatus) isStatus.textContent = '默认基础样式';
      }
    };
  },

  initFlexboxSandbox: function () {
    const select = document.getElementById('flex-justify-select');
    const slider = document.getElementById('flex-item2-grow');
    const growDisplay = document.getElementById('grow-val-display');
    const container = document.getElementById('flex-sandbox-container');
    const dynamicItem = document.getElementById('flex-dynamic-item');
    const statText = document.getElementById('item2-stat-text');

    if (!select || !slider || !container || !dynamicItem) return;

    select.onchange = (e) => {
      container.style.justifyContent = e.target.value;
    };

    slider.oninput = (e) => {
      const val = e.target.value;
      if (growDisplay) growDisplay.textContent = val;
      dynamicItem.style.flexGrow = val;
      if (statText) statText.textContent = 'grow: ' + val;
    };
  },

  initGridSandbox: function () {
    const slider = document.getElementById('grid-min-slider');
    const display = document.getElementById('grid-min-display');
    const modeSelect = document.getElementById('grid-mode-select');
    const grid = document.getElementById('grid-demo-wall');

    if (!slider || !grid || !modeSelect) return;

    function updateGrid() {
      const minW = slider.value + 'px';
      const mode = modeSelect.value;
      if (display) display.textContent = minW;
      grid.style.gridTemplateColumns = `repeat(${mode}, minmax(${minW}, 1fr))`;
    }

    slider.oninput = updateGrid;
    modeSelect.onchange = updateGrid;
  },

  initContainerQuery: function () {
    const resizer = document.getElementById('container-resizer');
    const wrapper = document.getElementById('morph-container-wrapper');
    const display = document.getElementById('container-width-display');
    const badge = document.getElementById('container-morph-badge');

    if (!resizer || !wrapper) return;

    resizer.oninput = (e) => {
      const w = e.target.value;
      wrapper.style.width = w + 'px';
      if (display) display.textContent = w + 'px';

      if (w >= 650) {
        if (badge) badge.textContent = '宽屏形态 (@container ≥ 650px)';
      } else if (w >= 480) {
        if (badge) badge.textContent = '中屏双列形态 (@container ≥ 480px)';
      } else {
        if (badge) badge.textContent = '紧凑窄屏形态 (@container < 480px)';
      }
    };
  }
};
