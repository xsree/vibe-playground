"use strict";

// 展示与对比独立于筛选控制器，使用普通脚本以支持 file:// 直接打开。
window.createPelicanView = function ({ onOpen, onReset }) {
  const $ = selector => document.querySelector(selector);
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  const preferencesKey = 'svg-pelican-bicycle:workspace:v1';
  const preferences = { view: 'gallery', density: 'standard', group: 'none', multi: false, background: 'light' };
  let allItems = [];
  let filteredItems = [];
  let chosen = [];
  let pinned = null;

  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey));
    for (const [key, values] of Object.entries({ view: ['gallery', 'matrix'], density: ['large', 'standard', 'compact'], group: ['none', 'vendor', 'model', 'harness'], background: ['light', 'dark', 'checker'] })) {
      if (values.includes(saved?.[key])) preferences[key] = saved[key];
    }
    preferences.multi = saved?.multi === true;
  } catch { /* 本地存储不可用时使用默认展示。 */ }

  function savePreferences() {
    try { localStorage.setItem(preferencesKey, JSON.stringify(preferences)); } catch { /* 不影响当前页面。 */ }
  }

  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function button(text, className, action) {
    const el = node('button', text, className);
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
  }

  const animated = item => Boolean(item.animated || item.file.includes('animated'));
  const identity = item => `${item.vendor}\u0000${item.model}`;
  function details(item) {
    const version = item.file.match(/-(v\d+)\.svg$/i)?.[1];
    return `${item.harness} · ${item.effort} · ${animated(item) ? '动态' : '静态'}${version ? ' · ' + version : ''}`;
  }
  const label = item => `${item.model} / ${details(item)}`;
  const sortItems = items => [...items].sort((a, b) => collator.compare(a.vendor, b.vendor) || collator.compare(a.model, b.model) || collator.compare(a.effort, b.effort) || collator.compare(a.harness, b.harness) || Number(animated(a)) - Number(animated(b)) || collator.compare(a.file, b.file));

  function image(item, lazy = true) {
    const img = node('img');
    img.src = encodeURI(item.file);
    img.alt = label(item);
    img.loading = lazy ? 'lazy' : 'eager';
    img.decoding = 'async';
    return img;
  }

  function announce(text) { $('#selection-status').textContent = text; }

  function toggleItem(item) {
    if (chosen.includes(item.file)) {
      chosen = chosen.filter(file => file !== item.file);
      if (pinned === item.file) pinned = null;
      announce(`已移除 ${item.model}，已选 ${chosen.length} 幅`);
    } else {
      if (chosen.length >= 4) {
        announce('最多对比 4 幅作品，请先移除一幅');
        return;
      }
      chosen.push(item.file);
      announce(`已选择 ${item.model}，已选 ${chosen.length} 幅`);
    }
    renderTray();
  }

  function pickButton(item) {
    const pick = button('', 'compare-pick', () => toggleItem(item));
    pick.dataset.file = item.file;
    pick.dataset.label = label(item);
    return pick;
  }

  function syncPicks() {
    document.querySelectorAll('.compare-pick').forEach(pick => {
      const selected = chosen.includes(pick.dataset.file);
      pick.textContent = selected ? '✓ 已选' : '+ 对比';
      pick.setAttribute('aria-pressed', String(selected));
      pick.setAttribute('aria-label', `${selected ? '移出' : '加入'}对比：${pick.dataset.label}`);
      pick.disabled = !selected && chosen.length >= 4;
      pick.title = pick.disabled ? '最多对比 4 幅，请先移除一幅' : pick.getAttribute('aria-label');
    });
  }

  function artwork(item, matrix = false, lazy = true) {
    const article = node('article', undefined, matrix ? 'matrix-art' : 'gallery-art');
    const open = button('', 'preview', () => onOpen(item));
    open.setAttribute('aria-label', `放大 ${label(item)}`);
    open.title = `放大 ${label(item)}`;
    open.append(image(item, lazy));
    article.append(open);
    if (animated(item)) article.append(node('span', '动态 SVG', 'motion-label'));
    article.append(pickButton(item));
    if (!matrix) {
      const caption = node('div', undefined, 'art-caption');
      const title = node('h3', item.model);
      title.title = item.model;
      caption.append(title, node('p', details(item)));
      article.append(caption);
    }
    return article;
  }

  function renderGallery(items) {
    const fragment = document.createDocumentFragment();
    const groups = new Map();
    for (const item of sortItems(items)) {
      const key = preferences.group === 'none' ? '' : item[preferences.group];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    const entries = [...groups.entries()];
    if (preferences.group !== 'none') entries.sort((a, b) => collator.compare(a[0], b[0]));
    let index = 0;
    for (const [name, group] of entries) {
      const section = node('section', undefined, 'gallery-section');
      if (name) {
        const heading = node('div', undefined, 'group-heading');
        heading.append(node('h2', name), node('span', `${group.length} 幅`));
        section.append(heading);
      }
      const grid = node('div', undefined, 'art-grid');
      for (const item of group) grid.append(artwork(item, false, index++ >= 10));
      section.append(grid);
      fragment.append(section);
    }
    $('#gallery').replaceChildren(fragment);
    $('#gallery').dataset.density = preferences.density;
  }

  function matrixItems(items) {
    if (!preferences.multi) return items;
    const platforms = new Map();
    for (const item of items) {
      const key = identity(item);
      if (!platforms.has(key)) platforms.set(key, new Set());
      platforms.get(key).add(item.harness);
    }
    return items.filter(item => platforms.get(identity(item)).size > 1);
  }

  function renderMatrix(items) {
    const columns = [...new Set(items.map(item => item.harness))].sort(collator.compare);
    const groups = new Map();
    for (const item of sortItems(items)) {
      const key = `${identity(item)}\u0000${item.effort}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    const heading = node('tr');
    for (const name of ['模型 / 思考强度', ...columns]) {
      const th = node('th', name);
      th.scope = 'col';
      heading.append(th);
    }
    $('#head').replaceChildren(heading);
    $('#matrix').querySelector('table').style.minWidth = `${190 + columns.length * 245}px`;
    const fragment = document.createDocumentFragment();
    for (const group of groups.values()) {
      const tr = node('tr');
      const th = node('th');
      th.scope = 'row';
      th.append(node('span', group[0].vendor, 'matrix-vendor'), node('span', group[0].model, 'model'), node('span', group[0].effort, 'effort'));
      tr.append(th);
      for (const column of columns) {
        const td = node('td');
        const entries = group.filter(item => item.harness === column);
        if (!entries.length) {
          td.textContent = '—';
          td.className = 'missing';
          td.setAttribute('aria-label', '尚无产物');
        } else {
          const wrap = node('div', undefined, 'cell-items');
          for (const item of entries) wrap.append(artwork(item, true));
          td.append(wrap);
        }
        tr.append(td);
      }
      fragment.append(tr);
    }
    $('#body').replaceChildren(fragment);
    return groups.size;
  }

  function renderWorkspace() {
    const matrix = preferences.view === 'matrix';
    const visible = matrix ? matrixItems(filteredItems) : filteredItems;
    $('#gallery').hidden = matrix || !visible.length;
    $('#matrix').hidden = !matrix || !visible.length;
    $('.gallery-options').hidden = matrix;
    $('.matrix-options').hidden = !matrix;
    $('#empty').hidden = visible.length > 0;
    document.querySelectorAll('[data-view]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.view === preferences.view)));
    document.querySelectorAll('button[data-density]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.density === preferences.density)));
    $('#group-by').value = preferences.group;
    $('#multi-platform').checked = preferences.multi;
    let specs = '';
    if (matrix) {
      $('#gallery').replaceChildren();
      specs = ` · ${renderMatrix(visible)} 组规格`;
    } else {
      $('#body').replaceChildren();
      renderGallery(visible);
    }
    $('#count').textContent = `${visible.length} / ${allItems.length} 幅作品${specs}`;
    $('#workspace-hint').textContent = matrix ? '仅显示有作品的平台列 · — 表示尚无产物' : '点击作品放大 · 选择 2–4 幅加入对比';
    syncPicks();
  }

  function renderTray() {
    const tray = $('#compare-tray');
    tray.hidden = !chosen.length;
    document.body.classList.toggle('has-comparison', chosen.length > 0);
    $('#compare-count').textContent = `已选 ${chosen.length} / 4`;
    $('#start-compare').disabled = chosen.length < 2;
    const fragment = document.createDocumentFragment();
    for (const file of chosen) {
      const item = allItems.find(entry => entry.file === file);
      const thumb = button('', 'tray-thumb', () => toggleItem(item));
      thumb.setAttribute('aria-label', `移除 ${label(item)}`);
      thumb.title = `移除 ${label(item)}`;
      thumb.append(image(item, false), node('span', '×'));
      fragment.append(thumb);
    }
    $('#compare-thumbs').replaceChildren(fragment);
    syncPicks();
  }

  function replaceItem(index, file) {
    if (chosen.includes(file) || chosen[index] === pinned) return;
    chosen[index] = file;
    renderTray();
    renderComparison();
    $('#compare-grid').querySelectorAll('.replace-select')[index]?.focus();
  }

  function renderComparison() {
    const grid = $('#compare-grid');
    grid.dataset.count = chosen.length;
    grid.dataset.background = preferences.background;
    $('#compare-background').value = preferences.background;
    const fragment = document.createDocumentFragment();
    chosen.forEach((file, index) => {
      const item = allItems.find(entry => entry.file === file);
      const fixed = file === pinned;
      const pane = node('article', undefined, 'compare-pane' + (fixed ? ' is-pinned' : ''));
      const bar = node('div', undefined, 'compare-pane-bar');
      const vendor = node('span', item.vendor, 'compare-vendor');
      const pin = button(fixed ? '● 已固定' : '固定参照', 'pin-button', () => {
        pinned = fixed ? null : file;
        renderComparison();
        grid.querySelectorAll('.pin-button')[index]?.focus();
      });
      pin.setAttribute('aria-pressed', String(fixed));
      pin.setAttribute('aria-label', `${fixed ? '取消固定' : '固定参照'} ${label(item)}`);
      bar.append(vendor, pin);
      const title = node('h3', item.model);
      const metadata = node('p', details(item), 'compare-metadata');
      const stage = node('div', undefined, 'compare-stage');
      stage.append(image(item, false));
      const controls = node('div', undefined, 'replace-controls');
      const select = node('select', undefined, 'replace-select');
      select.setAttribute('aria-label', `替换第 ${index + 1} 幅作品`);
      for (const candidate of sortItems(allItems)) {
        if (candidate.file !== file && chosen.includes(candidate.file)) continue;
        const option = node('option', label(candidate));
        option.value = candidate.file;
        option.selected = candidate.file === file;
        select.append(option);
      }
      select.disabled = fixed;
      select.addEventListener('change', () => replaceItem(index, select.value));
      const candidates = sortItems(allItems).filter(candidate => candidate.file === file || !chosen.includes(candidate.file));
      const next = button('下一幅 →', 'quiet-button next-artwork', () => {
        const current = candidates.findIndex(candidate => candidate.file === file);
        replaceItem(index, candidates[(current + 1) % candidates.length].file);
      });
      next.disabled = fixed || candidates.length < 2;
      next.setAttribute('aria-label', `切换第 ${index + 1} 幅作品`);
      controls.append(select, next);
      pane.append(bar, title, metadata, stage, controls);
      fragment.append(pane);
    });
    grid.replaceChildren(fragment);
  }

  document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => {
    preferences.view = el.dataset.view;
    savePreferences();
    renderWorkspace();
  }));
  document.querySelectorAll('button[data-density]').forEach(el => el.addEventListener('click', () => {
    preferences.density = el.dataset.density;
    savePreferences();
    $('#gallery').dataset.density = preferences.density;
    document.querySelectorAll('button[data-density]').forEach(btn => btn.setAttribute('aria-pressed', String(btn === el)));
  }));
  $('#group-by').addEventListener('change', event => {
    preferences.group = event.target.value;
    savePreferences();
    renderWorkspace();
  });
  $('#multi-platform').addEventListener('change', event => {
    preferences.multi = event.target.checked;
    savePreferences();
    renderWorkspace();
  });
  $('#empty-reset').addEventListener('click', () => {
    preferences.multi = false;
    savePreferences();
    onReset();
  });
  $('#clear-compare').addEventListener('click', () => {
    chosen = [];
    pinned = null;
    renderTray();
    announce('已清空对比选择');
  });
  $('#start-compare').addEventListener('click', () => {
    if (chosen.length < 2) return;
    renderComparison();
    $('#compare-dialog').showModal();
  });
  $('#close-compare').addEventListener('click', () => $('#compare-dialog').close());
  $('#compare-background').addEventListener('change', event => {
    preferences.background = event.target.value;
    savePreferences();
    $('#compare-grid').dataset.background = preferences.background;
  });
  $('#compare-dialog').addEventListener('close', () => {
    // 关闭后释放动效图片，避免隐藏的对比台继续消耗资源。
    $('#compare-grid').replaceChildren();
  });

  return {
    resetFilterOptions() {
      preferences.multi = false;
      savePreferences();
    },
    render(filtered, all) {
      allItems = all;
      filteredItems = filtered;
      const available = new Set(all.map(item => item.file));
      const previousCount = chosen.length;
      chosen = chosen.filter(file => available.has(file));
      if (!chosen.includes(pinned)) pinned = null;
      if (previousCount !== chosen.length) announce('部分已选作品已移除，对比选择已更新');
      renderWorkspace();
      renderTray();
      if ($('#compare-dialog').open) {
        if (chosen.length < 2) $('#compare-dialog').close();
        else renderComparison();
      }
    }
  };
};
