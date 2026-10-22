"use strict";

// 在样式表加载前应用主题，避免刷新时闪出另一种配色。
(() => {
  const root = document.documentElement;
  const storageKey = 'svg-pelican-bicycle:theme:v1';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference = null;
  let switching = false;

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
      button.title = dark ? '切换到浅色模式' : '切换到深色模式';
      label.textContent = dark ? '深色' : '浅色';
    }

    applyTheme(root.dataset.theme);

    button.addEventListener('click', async () => {
      if (switching) return;
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      preference = nextTheme;
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // 不影响主题切换。
      }

      if (reducedMotion.matches) {
        applyTheme(nextTheme);
        return;
      }

      switching = true;
      try {
        if (typeof document.startViewTransition === 'function') {
          const rect = button.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
          root.style.setProperty('--theme-x', `${x}px`);
          root.style.setProperty('--theme-y', `${y}px`);
          root.style.setProperty('--theme-radius', `${radius}px`);
          const transition = document.startViewTransition(() => applyTheme(nextTheme));
          // 页面切到后台时过渡可能被跳过，主题仍应正常生效。
          await transition.finished;
        } else {
          root.classList.add('theme-fading');
          applyTheme(nextTheme);
          await new Promise(resolve => window.setTimeout(resolve, 600));
        }
      } catch {
        applyTheme(nextTheme);
      } finally {
        root.classList.remove('theme-fading');
        switching = false;
      }
    });

    systemTheme.addEventListener('change', () => {
      if (!preference) applyTheme(systemTheme.matches ? 'dark' : 'light');
    });
  });
})();
