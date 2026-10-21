/**
 * MODULE 07: CSS NEXT & ANIMATIONS - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['07-css-next-animations'] = {
  id: '07-css-next-animations',
  title: '下一代 CSS 动画与现代色彩工程',

  init: function () {
    this.initScrollTimeline();
    this.initViewTransition();
    this.initColorMix();
  },

  initScrollTimeline: function () {
    const container = document.getElementById('scroll-timeline-container');
    const indicator = document.getElementById('scroll-progress-indicator');

    if (!container || !indicator) return;

    container.onscroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      const progress = (container.scrollTop / maxScroll) * 100;
      indicator.style.width = Math.min(100, Math.max(0, progress)) + '%';
    };
  },

  initViewTransition: function () {
    const btn = document.getElementById('btn-trigger-view-trans');
    const host = document.getElementById('view-trans-host');

    if (!btn || !host) return;

    btn.onclick = () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          host.classList.toggle('grid-mode');
          host.classList.toggle('list-mode');
        });
      } else {
        host.classList.toggle('grid-mode');
        host.classList.toggle('list-mode');
      }
      if (window.LabCore) window.LabCore.showToast('视图形态过渡已触发 (startViewTransition)');
    };
  },

  initColorMix: function () {
    const slider = document.getElementById('color-mix-ratio');
    const display = document.getElementById('mix-ratio-display');
    const swatch = document.getElementById('color-swatch-box');
    const label = document.getElementById('color-text-label');

    if (!slider || !swatch) return;

    slider.oninput = (e) => {
      const val = e.target.value;
      if (display) display.textContent = val + '%';
      swatch.style.backgroundColor = `color-mix(in oklch, #2563eb ${val}%, white)`;
      if (label) label.textContent = `color-mix(in oklch, #2563eb ${val}%, white)`;
    };
  }
};
