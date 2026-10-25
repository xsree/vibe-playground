"use strict";

let results = window.PELICAN_RESULTS;
const $ = selector => document.querySelector(selector);
const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'});

// All unique harnesses
let allHarnesses = [...new Set(results.map(item => item.harness))].sort(collator.compare);
$('#summary').textContent = `${results.length} 件作品 / ${allHarnesses.length} 个 Harness`;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function openArtwork(item) {
  const isAnimated = Boolean(item.animated || item.file.includes('animated'));
  const title = `${item.model} · ${item.effort} ${isAnimated ? '(动态 SVG)' : ''} / ${item.harness}`;
  $('#viewer-title').textContent = title;
  $('#large').src = encodeURI(item.file);
  $('#large').alt = `${title}：鹈鹕骑自行车`;
  $('#original').href = encodeURI(item.file);
  $('#filename').textContent = item.file;
  $('#viewer').showModal();
}

// Global Filter State (Cascading: harness -> vendor/model -> effort -> type)
const filterState = {
  harness: '',
  vendor: '', // '' for all, or a vendor value from the data
  model: '',  // '' for all, or specific model name (e.g. 'Gemini-4-Argon')
  effort: '',
  type: ''    // '' | 'static' | 'animated'
};

const FILTER_STORAGE_KEY = 'svg-pelican-bicycle:filters:v1';

function restoreFilters() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FILTER_STORAGE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    for (const key of Object.keys(filterState)) {
      if (typeof saved[key] === 'string') filterState[key] = saved[key];
    }
  } catch {
    // 本地存储不可用或数据损坏时，继续使用默认筛选。
  }
}

function saveFilters() {
  try {
    if (Object.values(filterState).some(Boolean)) {
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterState));
    } else {
      window.localStorage.removeItem(FILTER_STORAGE_KEY);
    }
  } catch {
    // 浏览器限制本地存储时，筛选功能仍可正常使用。
  }
}

const CHECK_ICON_HTML = '<svg class="option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const CHEVRON_RIGHT_HTML = '<svg class="vendor-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

// Vendor names and grouping keys come only from the result data.
function getVendor(item) {
  const name = item.vendor?.trim() || '未填写厂商';
  return { id: name, name };
}

function getDynamicVendors() {
  const vendors = new Map();
  for (const item of results) {
    const vendor = getVendor(item);
    vendors.set(vendor.id, vendor);
  }
  return [...vendors.values()].sort((a, b) => collator.compare(a.name, b.name));
}

function createOptionElement(text, value, isSelected, badge) {
  const opt = document.createElement('div');
  opt.className = 'select-option' + (isSelected ? ' is-selected' : '');
  opt.setAttribute('role', 'option');
  opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  opt.tabIndex = 0;
  opt.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      opt.click();
    }
  });
  opt.dataset.value = value;

  const main = document.createElement('div');
  main.className = 'option-main';

  const label = document.createElement('span');
  label.className = 'option-text';
  label.textContent = text;
  main.appendChild(label);

  if (badge) {
    const b = document.createElement('span');
    b.className = 'option-badge';
    b.textContent = badge;
    main.appendChild(b);
  }

  opt.appendChild(main);
  opt.insertAdjacentHTML('beforeend', CHECK_ICON_HTML);
  return opt;
}

function closeAllSelects() {
  document.querySelectorAll('.custom-select').forEach(el => {
    el.classList.remove('is-open');
    const tr = el.querySelector('.select-trigger');
    if (tr) tr.setAttribute('aria-expanded', 'false');
  });
}

// Expand to content height; constrain only when neither side has enough room.
function fitSelectDropdown(container) {
  if (!container.classList.contains('is-open')) return;
  const dropdown = container.querySelector('.select-dropdown');
  const trigger = container.querySelector('.select-trigger').getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const below = Math.max(0, viewportBottom - trigger.bottom - 18);
  const above = Math.max(0, trigger.top - viewportTop - 18);

  dropdown.style.setProperty('--dropdown-max-height', '100000px');
  const contentHeight = dropdown.offsetHeight;
  const opensAbove = contentHeight > below && above > below;
  dropdown.dataset.side = opensAbove ? 'above' : 'below';
  dropdown.style.setProperty('--dropdown-max-height', `${opensAbove ? above : below}px`);
}

function fitOpenSelectDropdowns() {
  document.querySelectorAll('.custom-select.is-open').forEach(fitSelectDropdown);
}

window.addEventListener('resize', fitOpenSelectDropdowns);
window.addEventListener('scroll', fitOpenSelectDropdowns, { passive: true });
window.visualViewport?.addEventListener('resize', fitOpenSelectDropdowns);
window.visualViewport?.addEventListener('scroll', fitOpenSelectDropdowns);

// Standard Single-Level Select Controller (Harness, Effort, Type)
function initStandardSelect(containerId, defaultLabel, filterKey, onSelectCallback) {
  const container = $(containerId);
  const trigger = container.querySelector('.select-trigger');
  const valueDisplay = container.querySelector('.select-value');
  const optionsList = container.querySelector('.select-options-list');

  let currentOptions = [];

  function renderList() {
    optionsList.replaceChildren();

    const isAllSelected = !filterState[filterKey];
    const allOpt = createOptionElement(defaultLabel, '', isAllSelected);
    allOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectVal('', defaultLabel);
    });
    optionsList.appendChild(allOpt);

    for (const item of currentOptions) {
      const text = item.label || item;
      const val = item.value !== undefined ? item.value : item;
      const badge = item.badge || null;

      const isSelected = filterState[filterKey] === val;
      const opt = createOptionElement(text, val, isSelected, badge);
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectVal(val, text);
      });
      optionsList.appendChild(opt);
    }
  }

  function selectVal(val, displayLabel) {
    filterState[filterKey] = val;
    valueDisplay.textContent = displayLabel;
    trigger.classList.toggle('has-value', Boolean(val));
    container.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    renderList();
    if (onSelectCallback) onSelectCallback(val);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !container.classList.contains('is-open');
    closeAllSelects();
    if (willOpen) {
      container.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      fitSelectDropdown(container);
    }
  });

  return {
    setOptions(newOptions, resetIfInvalid = true) {
      currentOptions = newOptions;
      const validValues = ['', ...newOptions.map(o => o.value !== undefined ? o.value : o)];
      if (resetIfInvalid && !validValues.includes(filterState[filterKey])) {
        filterState[filterKey] = '';
      }
      const selectedOption = newOptions.find(o => (o.value !== undefined ? o.value : o) === filterState[filterKey]);
      valueDisplay.textContent = selectedOption ? (selectedOption.label || selectedOption) : defaultLabel;
      trigger.classList.toggle('has-value', Boolean(filterState[filterKey]));
      renderList();
    },
    reset() {
      filterState[filterKey] = '';
      valueDisplay.textContent = defaultLabel;
      trigger.classList.remove('has-value');
      container.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      renderList();
    }
  };
}

// Two-Level Model Controller (Vendor -> Model)
function initTwoLevelModelSelect(onModelChanged) {
  const container = $('#select-model');
  const trigger = container.querySelector('.select-trigger');
  const valueDisplay = container.querySelector('.select-value');
  const vendorListEl = $('#vendor-list');
  const modelSublistEl = $('#model-sublist');

  let activeHoveredVendor = null;

  function getAvailableModelsUnderHarness(vendorId = '') {
    const subset = results.filter(item =>
      (!filterState.harness || item.harness === filterState.harness) &&
      (!vendorId || getVendor(item).id === vendorId)
    );
    return [...new Set(subset.map(item => item.model))].sort(collator.compare);
  }

  function renderVendorPane() {
    vendorListEl.replaceChildren();

    const isAllSelected = !filterState.vendor && !filterState.model;

    // "全部模型" at top of left pane
    const allItem = document.createElement('div');
    allItem.className = 'vendor-item-all' + (isAllSelected ? ' is-selected' : '');
    allItem.innerHTML = `<span>全部模型</span>${CHECK_ICON_HTML}`;
    allItem.tabIndex = 0;
    allItem.setAttribute('role', 'button');
    allItem.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        allItem.click();
      }
    });
    allItem.addEventListener('click', (e) => {
      e.stopPropagation();
      selectModel('', '', '全部模型');
    });
    vendorListEl.appendChild(allItem);

    // Render vendors
    let firstActiveVendor = null;
    const currentVendors = getDynamicVendors();

    currentVendors.forEach(v => {
      const vendorModels = getAvailableModelsUnderHarness(v.id);
      const count = vendorModels.length;
      const isCurrentActive = (activeHoveredVendor && activeHoveredVendor.id === v.id);

      const vEl = document.createElement('div');
      vEl.className = 'vendor-item' + 
        (count === 0 ? ' is-disabled' : '') + 
        (filterState.vendor === v.id ? ' is-active-vendor' : '') +
        (isCurrentActive ? ' is-hovered' : '');
      
      const meta = element('div', undefined, 'vendor-meta');
      meta.append(element('span', count, 'vendor-badge'));
      const browse = element('button', undefined, 'vendor-browse');
      browse.type = 'button';
      browse.setAttribute('aria-label', `查看 ${v.name} 的具体模型`);
      browse.innerHTML = CHEVRON_RIGHT_HTML;
      browse.disabled = count === 0;
      browse.addEventListener('click', event => {
        event.stopPropagation();
        activeHoveredVendor = v;
        updateVendorHighlight();
        renderModelPane(v, vendorModels);
      });
      meta.append(browse);
      const name = element('button', v.name, 'vendor-name');
      name.type = 'button';
      name.disabled = count === 0;
      name.setAttribute('aria-label', `选择全部 ${v.name} 模型`);
      vEl.append(name, meta);

      if (count > 0) {
        if (!firstActiveVendor) firstActiveVendor = v;

        vEl.addEventListener('mouseenter', () => {
          activeHoveredVendor = v;
          updateVendorHighlight();
          renderModelPane(v, vendorModels);
        });
        vEl.addEventListener('focusin', () => {
          activeHoveredVendor = v;
          updateVendorHighlight();
          renderModelPane(v, vendorModels);
        });

        vEl.addEventListener('click', (e) => {
          e.stopPropagation();
          activeHoveredVendor = v;
          selectModel(v.id, '', `全部 ${v.name}`);
        });
      }

      vendorListEl.appendChild(vEl);
    });

    // Default right pane
    if (!activeHoveredVendor || !getAvailableModelsUnderHarness(activeHoveredVendor.id).length) {
      activeHoveredVendor = firstActiveVendor || currentVendors[0];
    }
    updateVendorHighlight();
    if (activeHoveredVendor) {
      renderModelPane(activeHoveredVendor, getAvailableModelsUnderHarness(activeHoveredVendor.id));
    } else {
      modelSublistEl.replaceChildren();
    }
  }

  function updateVendorHighlight() {
    const items = vendorListEl.querySelectorAll('.vendor-item');
    items.forEach(el => {
      const name = el.querySelector('.vendor-name').textContent;
      const isHov = activeHoveredVendor && activeHoveredVendor.name === name;
      el.classList.toggle('is-hovered', Boolean(isHov));
    });
  }

  function renderModelPane(vendor, models) {
    modelSublistEl.replaceChildren();

    const header = document.createElement('div');
    header.className = 'model-pane-header';
    header.append(element('span', `${vendor.name} 旗下模型`), element('span', `${models.length} 款`));
    modelSublistEl.appendChild(header);

    if (models.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'option-empty';
      empty.textContent = '当前平台下暂无该厂商模型';
      modelSublistEl.appendChild(empty);
      fitSelectDropdown(container);
      return;
    }

    // Each model of this vendor
    models.forEach(modelName => {
      const isSelected = filterState.model === modelName;
      const opt = createOptionElement(modelName, modelName, isSelected);
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectModel(vendor.id, modelName, modelName);
      });
      modelSublistEl.appendChild(opt);
    });
    fitSelectDropdown(container);
  }

  function selectModel(vendorId, modelName, displayLabel) {
    filterState.vendor = vendorId;
    filterState.model = modelName;
    valueDisplay.textContent = displayLabel;
    trigger.classList.toggle('has-value', Boolean(vendorId || modelName));
    container.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    renderVendorPane();
    if (onModelChanged) onModelChanged();
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !container.classList.contains('is-open');
    closeAllSelects();
    if (willOpen) {
      container.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      renderVendorPane();
    }
  });

  return {
    updateCascade() {
      if (filterState.vendor && !getAvailableModelsUnderHarness(filterState.vendor).length) {
        filterState.vendor = '';
        filterState.model = '';
      } else if (filterState.model && !getAvailableModelsUnderHarness(filterState.vendor).includes(filterState.model)) {
        filterState.model = '';
      }
      valueDisplay.textContent = filterState.model || (filterState.vendor ? `全部 ${filterState.vendor}` : '全部模型');
      trigger.classList.toggle('has-value', Boolean(filterState.vendor || filterState.model));
      renderVendorPane();
    },
    reset() {
      filterState.vendor = '';
      filterState.model = '';
      valueDisplay.textContent = '全部模型';
      trigger.classList.remove('has-value');
      container.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      renderVendorPane();
    }
  };
}

// Helper: Available efforts for current harness + model/vendor
function getAvailableEfforts() {
  const subset = results.filter(item => {
    if (filterState.harness && item.harness !== filterState.harness) return false;
    if (filterState.vendor && getVendor(item).id !== filterState.vendor) return false;
    if (filterState.model && item.model !== filterState.model) return false;
    return true;
  });
  return [...new Set(subset.map(item => item.effort))];
}

const typeOptions = [
  { value: 'static', label: '静态 SVG' },
  { value: 'animated', label: '动态动效', badge: '动效' }
];

let harnessCtrl, modelCtrl, effortCtrl, typeCtrl;

harnessCtrl = initStandardSelect('#select-harness', '全部 Harness', 'harness', () => {
  modelCtrl.updateCascade();
  effortCtrl.setOptions(getAvailableEfforts(), true);
  render();
});

modelCtrl = initTwoLevelModelSelect(() => {
  effortCtrl.setOptions(getAvailableEfforts(), true);
  render();
});

effortCtrl = initStandardSelect('#select-effort', '全部强度', 'effort', () => {
  render();
});

typeCtrl = initStandardSelect('#select-type', '全部形态', 'type', () => {
  render();
});

const galleryView = window.createPelicanView({
  onOpen: openArtwork,
  onReset: () => $('#btn-reset').click()
});

// Initial Setup
restoreFilters();
harnessCtrl.setOptions(allHarnesses);
modelCtrl.updateCascade();
effortCtrl.setOptions(getAvailableEfforts());
typeCtrl.setOptions(typeOptions);

$('#btn-reset').addEventListener('click', () => {
  galleryView.resetFilterOptions();
  filterState.harness = '';
  filterState.vendor = '';
  filterState.model = '';
  filterState.effort = '';
  filterState.type = '';

  harnessCtrl.reset();
  modelCtrl.reset();
  effortCtrl.setOptions(getAvailableEfforts(), false);
  effortCtrl.reset();
  typeCtrl.reset();

  render();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select')) {
    closeAllSelects();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllSelects();
  }
});

function render() {
  saveFilters();
  const selected = results.filter(item => {
    if (filterState.harness && item.harness !== filterState.harness) return false;
    if (filterState.vendor && getVendor(item).id !== filterState.vendor) return false;
    if (filterState.model && item.model !== filterState.model) return false;
    if (filterState.effort && item.effort !== filterState.effort) return false;
    const isAnimated = Boolean(item.animated || item.file.includes('animated'));
    if (filterState.type === 'animated' && !isAnimated) return false;
    if (filterState.type === 'static' && isAnimated) return false;
    return true;
  });

  galleryView.render(selected, results);
}

$('#close').addEventListener('click', () => $('#viewer').close());

$('#viewer').addEventListener('click', event => {
  if (event.target === $('#viewer')) {
    const rect = event.target.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      event.target.close();
    }
  }
});

render();

// 使用普通脚本轮询，兼容直接以 file:// 打开页面。
let dataSnapshot = JSON.stringify(results);
let dataCheckPending = false;

function checkForDataUpdates() {
  if (document.hidden || dataCheckPending) return;
  dataCheckPending = true;

  const script = document.createElement('script');
  const source = new URL('gallery-data.js', document.baseURI);
  source.searchParams.set('_check', Date.now());
  script.src = source.href;

  function cleanup() {
    script.remove();
    dataCheckPending = false;
  }

  script.onload = () => {
    cleanup();
    const nextResults = window.PELICAN_RESULTS;
    if (!Array.isArray(nextResults)) return;
    const nextSnapshot = JSON.stringify(nextResults);
    if (nextSnapshot === dataSnapshot) return;

    results = nextResults;
    dataSnapshot = nextSnapshot;
    allHarnesses = [...new Set(results.map(item => item.harness))].sort(collator.compare);
    $('#summary').textContent = `${results.length} 件作品 / ${allHarnesses.length} 个 Harness`;
    harnessCtrl.setOptions(allHarnesses);
    modelCtrl.updateCascade();
    effortCtrl.setOptions(getAvailableEfforts());
    typeCtrl.setOptions(typeOptions);
    render();
  };
  script.onerror = cleanup;
  document.head.appendChild(script);
}

setInterval(checkForDataUpdates, 3000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkForDataUpdates();
});
