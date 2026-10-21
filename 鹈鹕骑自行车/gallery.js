"use strict";

const results = window.PELICAN_RESULTS;
const $ = selector => document.querySelector(selector);
const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'});

// All unique harnesses
const allHarnesses = [...new Set(results.map(item => item.harness))].sort(collator.compare);
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
  vendor: '', // '' for all, or vendor id (e.g. 'gemini')
  model: '',  // '' for all, or specific model name (e.g. 'Gemini-4-Argon')
  effort: '',
  type: ''    // '' | 'static' | 'animated'
};

const CHECK_ICON_HTML = '<svg class="option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const CHEVRON_RIGHT_HTML = '<svg class="vendor-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

// Vendor Categorization (Alphabetical & Extensible)
const BUILTIN_VENDORS = [
  { id: 'claude', name: 'Claude', match: m => /^claude/i.test(m) },
  { id: 'deepseek', name: 'DeepSeek', match: m => /^deepseek/i.test(m) },
  { id: 'doubao', name: 'Doubao', match: m => /^doubao/i.test(m) },
  { id: 'gemini', name: 'Gemini', match: m => /^gemini/i.test(m) },
  { id: 'glm', name: 'GLM', match: m => /^glm/i.test(m) },
  { id: 'hy', name: 'Hy', match: m => /^hy/i.test(m) },
  { id: 'kimi', name: 'Kimi', match: m => /^kimi/i.test(m) },
  { id: 'mimo', name: 'Mimo', match: m => /^mimo/i.test(m) },
  { id: 'minimax', name: 'MiniMax', match: m => /^minimax/i.test(m) },
  { id: 'openai', name: 'OpenAI', match: m => /^(gpt|o1|o3|openai)/i.test(m) },
  { id: 'qwen', name: 'Qwen', match: m => /^qwen/i.test(m) }
];

const ANONYMOUS_VENDOR = { id: 'anonymous', name: '匿名模型', match: () => true };

// Dynamically discover all vendors from built-ins + custom vendor fields in data
function getDynamicVendors() {
  const map = new Map();
  // 1. Add built-in vendors
  BUILTIN_VENDORS.forEach(v => map.set(v.id, { ...v }));

  // 2. Discover custom vendors declared in results
  for (const item of results) {
    if (item.vendor) {
      const vName = item.vendor.trim();
      if (vName === '匿名模型' || vName.toLowerCase() === 'anonymous') continue;
      const vId = vName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (!map.has(vId)) {
        map.set(vId, {
          id: vId,
          name: vName,
          match: (modelName, itemVendor) => {
            if (itemVendor) return itemVendor.trim().toLowerCase() === vId;
            return modelName.toLowerCase().startsWith(vId);
          }
        });
      }
    }
  }

  // 3. Sort alphabetically (A-Z) by name, keeping "匿名模型" at the very end
  const list = [...map.values()].sort((a, b) => collator.compare(a.name, b.name));
  list.push(ANONYMOUS_VENDOR);
  return list;
}

function getVendorForModel(modelName, optionalVendor) {
  if (optionalVendor) {
    const vName = optionalVendor.trim();
    if (vName === '匿名模型' || vName.toLowerCase() === 'anonymous') return ANONYMOUS_VENDOR;
    const targetId = vName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const vendors = getDynamicVendors();
    const matched = vendors.find(v => v.id === targetId || v.name.toLowerCase() === vName.toLowerCase());
    if (matched) return matched;
  }

  // Check if any item in results with this model has an explicit vendor
  const explicitItem = results.find(it => it.model === modelName && it.vendor);
  if (explicitItem) {
    const vName = explicitItem.vendor.trim();
    if (vName === '匿名模型' || vName.toLowerCase() === 'anonymous') return ANONYMOUS_VENDOR;
    const targetId = vName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const vendors = getDynamicVendors();
    const matched = vendors.find(v => v.id === targetId || v.name.toLowerCase() === vName.toLowerCase());
    if (matched) return matched;
  }

  // Fallback to match functions (built-in regex)
  const vendors = getDynamicVendors();
  for (const v of vendors) {
    if (v.id === 'anonymous') continue;
    if (v.match && v.match(modelName)) return v;
  }
  return ANONYMOUS_VENDOR;
}

function createOptionElement(text, value, isSelected, badge) {
  const opt = document.createElement('div');
  opt.className = 'select-option' + (isSelected ? ' is-selected' : '');
  opt.setAttribute('role', 'option');
  opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
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
    }
  });

  return {
    setOptions(newOptions, resetIfInvalid = true) {
      currentOptions = newOptions;
      const validValues = ['', ...newOptions.map(o => o.value !== undefined ? o.value : o)];
      if (resetIfInvalid && !validValues.includes(filterState[filterKey])) {
        filterState[filterKey] = '';
        valueDisplay.textContent = defaultLabel;
        trigger.classList.remove('has-value');
      }
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

  function getAvailableModelsUnderHarness() {
    const subset = results.filter(item => !filterState.harness || item.harness === filterState.harness);
    return [...new Set(subset.map(item => item.model))].sort(collator.compare);
  }

  function renderVendorPane() {
    vendorListEl.replaceChildren();

    const availableModels = getAvailableModelsUnderHarness();
    const isAllSelected = !filterState.vendor && !filterState.model;

    // "全部模型" at top of left pane
    const allItem = document.createElement('div');
    allItem.className = 'vendor-item-all' + (isAllSelected ? ' is-selected' : '');
    allItem.innerHTML = `<span>全部模型</span>${CHECK_ICON_HTML}`;
    allItem.addEventListener('click', (e) => {
      e.stopPropagation();
      selectModel('', '', '全部模型');
    });
    vendorListEl.appendChild(allItem);

    // Render vendors
    let firstActiveVendor = null;
    const currentVendors = getDynamicVendors();

    currentVendors.forEach(v => {
      const vendorModels = availableModels.filter(m => getVendorForModel(m).id === v.id);
      const count = vendorModels.length;
      const isCurrentActive = (activeHoveredVendor && activeHoveredVendor.id === v.id);

      const vEl = document.createElement('div');
      vEl.className = 'vendor-item' + 
        (count === 0 ? ' is-disabled' : '') + 
        (filterState.vendor === v.id ? ' is-active-vendor' : '') +
        (isCurrentActive ? ' is-hovered' : '');
      
      vEl.innerHTML = `
        <span class="vendor-name">${v.name}</span>
        <div class="vendor-meta">
          <span class="vendor-badge">${count}</span>
          ${CHEVRON_RIGHT_HTML}
        </div>
      `;

      if (count > 0) {
        if (!firstActiveVendor) firstActiveVendor = v;

        vEl.addEventListener('mouseenter', () => {
          activeHoveredVendor = v;
          updateVendorHighlight();
          renderModelPane(v, vendorModels);
        });

        vEl.addEventListener('click', (e) => {
          e.stopPropagation();
          activeHoveredVendor = v;
          updateVendorHighlight();
          renderModelPane(v, vendorModels);
        });
      }

      vendorListEl.appendChild(vEl);
    });

    // Default right pane
    if (!activeHoveredVendor || !availableModels.some(m => getVendorForModel(m).id === activeHoveredVendor.id)) {
      activeHoveredVendor = firstActiveVendor || currentVendors[0];
    }
    updateVendorHighlight();
    const modelsForActive = availableModels.filter(m => getVendorForModel(m).id === activeHoveredVendor.id);
    renderModelPane(activeHoveredVendor, modelsForActive);
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
    header.innerHTML = `<span>${vendor.name} 旗下模型</span><span>${models.length} 款</span>`;
    modelSublistEl.appendChild(header);

    if (models.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'option-empty';
      empty.textContent = '当前平台下暂无该厂商模型';
      modelSublistEl.appendChild(empty);
      return;
    }

    // "全部 [厂商] 模型" option
    const isVendorAll = filterState.vendor === vendor.id && !filterState.model;
    const vendorAllOpt = createOptionElement(`全部 ${vendor.name} 模型`, `vendor:${vendor.id}`, isVendorAll);
    vendorAllOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectModel(vendor.id, '', `全部 ${vendor.name}`);
    });
    modelSublistEl.appendChild(vendorAllOpt);

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
      const availableModels = getAvailableModelsUnderHarness();
      if (filterState.model && !availableModels.includes(filterState.model)) {
        filterState.model = '';
        if (filterState.vendor && !availableModels.some(m => getVendorForModel(m).id === filterState.vendor)) {
          filterState.vendor = '';
          valueDisplay.textContent = '全部模型';
          trigger.classList.remove('has-value');
        } else if (filterState.vendor) {
          const v = getDynamicVendors().find(x => x.id === filterState.vendor);
          valueDisplay.textContent = v ? `全部 ${v.name}` : '全部模型';
        }
      }
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
    if (filterState.model) {
      if (item.model !== filterState.model) return false;
    } else if (filterState.vendor) {
      if (getVendorForModel(item.model, item.vendor).id !== filterState.vendor) return false;
    }
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

// Initial Setup
harnessCtrl.setOptions(allHarnesses, false);
effortCtrl.setOptions(getAvailableEfforts(), false);
typeCtrl.setOptions(typeOptions, false);

$('#btn-reset').addEventListener('click', () => {
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
  const selected = results.filter(item => {
    if (filterState.harness && item.harness !== filterState.harness) return false;
    if (filterState.model) {
      if (item.model !== filterState.model) return false;
    } else if (filterState.vendor) {
      const v = getVendorForModel(item.model, item.vendor);
      if (v.id !== filterState.vendor) return false;
    }
    if (filterState.effort && item.effort !== filterState.effort) return false;
    const isAnimated = Boolean(item.animated || item.file.includes('animated'));
    if (filterState.type === 'animated' && !isAnimated) return false;
    if (filterState.type === 'static' && isAnimated) return false;
    return true;
  });

  const columns = filterState.harness ? [filterState.harness] : allHarnesses;
  const groups = new Map();
  for (const item of selected) {
    const key = `${item.model}\u0000${item.effort}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const row = element('tr');
  for (const label of ['模型 / 思考强度', ...columns]) {
    const th = element('th', label);
    th.scope = 'col';
    row.append(th);
  }
  $('#head').replaceChildren(row);

  const rows = [...groups.values()].sort((a,b) => collator.compare(a[0].model,b[0].model) || collator.compare(a[0].effort,b[0].effort));
  const fragment = document.createDocumentFragment();

  for (const group of rows) {
    const tr = element('tr');
    const th = element('th');
    th.scope = 'row';

    th.append(
      element('span', group[0].model, 'model'),
      element('span', group[0].effort, 'effort')
    );
    tr.append(th);

    for (const column of columns) {
      const td = element('td');
      const items = group.filter(item => item.harness === column);
      if (!items.length) {
        td.textContent = '—';
        td.className = 'missing';
        td.setAttribute('aria-label', '尚无产物');
      } else {
        const cellWrap = element('div', undefined, 'cell-items');
        for (const item of items) {
          const isAnimated = Boolean(item.animated || item.file.includes('animated'));
          const button = element('button', undefined, 'artwork');
          button.type = 'button';
          button.setAttribute('aria-label', `放大 ${item.model} ${item.effort} ${item.harness} ${isAnimated ? '动态版' : ''}`);
          button.title = item.file;

          const img = element('img');
          img.src = encodeURI(item.file);
          img.alt = `${item.model} · ${item.effort} 的鹈鹕骑自行车`;
          img.loading = 'lazy';
          button.append(img);

          if (isAnimated) {
            const badge = element('span', '动态 SVG', 'art-badge-animated');
            button.append(badge);
          }

          button.addEventListener('click', () => openArtwork(item));
          cellWrap.append(button);
        }
        td.append(cellWrap);
      }
      tr.append(td);
    }
    fragment.append(tr);
  }

  $('#body').replaceChildren(fragment);
  $('#empty').hidden = selected.length > 0;
  $('#count').textContent = `显示 ${selected.length} / ${results.length} 件作品 · ${rows.length} 组规格`;
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
