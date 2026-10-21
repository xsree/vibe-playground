/**
 * MODULE 04: TAILWIND RECIPES & COMPONENT PATTERNS - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['04-tailwind-recipes'] = {
  id: '04-tailwind-recipes',
  title: 'Tailwind CSS 原子化实战与组件配方',

  init: function () {
    this.initUtilityBuilder();
    this.initRecipeToggle();
  },

  // 1. Utility Builder
  initUtilityBuilder: function () {
    const card = document.getElementById('tw-dynamic-card');
    const classPill = document.getElementById('tw-generated-class');
    const optRounded = document.getElementById('tw-opt-rounded');
    const optGradient = document.getElementById('tw-opt-gradient');
    const optShadow = document.getElementById('tw-opt-shadow');
    const optHover = document.getElementById('tw-opt-hover');

    if (!card || !classPill) return;

    function updateCardClasses() {
      const classes = ['p-6', 'transition-all'];
      if (optRounded && optRounded.checked) {
        classes.push('rounded-2xl');
        card.classList.add('rounded-2xl');
      } else {
        card.classList.remove('rounded-2xl');
      }

      if (optGradient && optGradient.checked) {
        classes.push('bg-gradient-to-r');
        card.classList.add('bg-gradient-to-r');
      } else {
        card.classList.remove('bg-gradient-to-r');
      }

      if (optShadow && optShadow.checked) {
        classes.push('shadow-2xl');
        card.classList.add('shadow-2xl');
      } else {
        card.classList.remove('shadow-2xl');
      }

      if (optHover && optHover.checked) {
        classes.push('hover:scale-105');
        card.classList.add('hover-scale');
      } else {
        card.classList.remove('hover-scale');
      }

      classPill.textContent = `class="${classes.join(' ')}"`;
    }

    if (optRounded) optRounded.onchange = updateCardClasses;
    if (optGradient) optGradient.onchange = updateCardClasses;
    if (optShadow) optShadow.onchange = updateCardClasses;
    if (optHover) optHover.onchange = updateCardClasses;
  },

  // 2. Recipe Toggle
  initRecipeToggle: function () {
    const chkToggle = document.getElementById('recipe-chk-toggle');
    const label = document.getElementById('toggle-state-label');

    if (!chkToggle || !label) return;

    chkToggle.onchange = () => {
      if (chkToggle.checked) {
        label.textContent = '状态: 启用';
        label.style.color = 'var(--accent-emerald)';
        if (window.LabCore) window.LabCore.showToast('Tailwind Toggle 已开启');
      } else {
        label.textContent = '状态: 关闭';
        label.style.color = 'var(--text-muted)';
        if (window.LabCore) window.LabCore.showToast('Tailwind Toggle 已关闭');
      }
    };
  }
};
