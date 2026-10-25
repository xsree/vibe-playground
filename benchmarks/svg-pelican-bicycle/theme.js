"use strict";

// 在样式表加载前应用主题，避免刷新时闪出另一种配色。
(() => {
  const root = document.documentElement;
  const storageKey = 'svg-pelican-bicycle:theme:v1';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference = null;
  let transitionTimer;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // 本地存储受限时仍允许在当前页面切换。
  }

  root.dataset.theme = preference || (systemTheme.matches ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    const label = document.querySelector('#theme-label');

    function applyTheme(theme) {
      root.dataset.theme = theme;
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
      button.title = dark ? '切换到浅色模式' : '切换到深色模式';
      label.textContent = dark ? '深色' : '浅色';
    }

    applyTheme(root.dataset.theme);

    function changeTheme(theme) {
      window.clearTimeout(transitionTimer);
      if (reducedMotion.matches) {
        root.classList.remove('theme-fading');
        applyTheme(theme);
        return;
      }

      root.classList.add('theme-fading');
      // 先提交过渡样式，让本次配色变化从当前颜色平滑开始。
      void root.offsetWidth;
      applyTheme(theme);
      transitionTimer = window.setTimeout(() => root.classList.remove('theme-fading'), 600);
    }

    button.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      preference = nextTheme;
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // 不影响主题切换。
      }

      changeTheme(nextTheme);
    });

    systemTheme.addEventListener('change', () => {
      if (!preference) changeTheme(systemTheme.matches ? 'dark' : 'light');
    });
  });
})();
