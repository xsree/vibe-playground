'use strict';

const results = window.PELICAN_3D_RESULTS || [];
const select = document.querySelector('#answer');

results.forEach((result, index) => {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = `${result.harness} / ${result.model} / ${result.effort}${result.animated ? ' · 动态版' : ''}`;
  select.append(option);
});

function show() {
  const result = results[Number(select.value)];
  if (!result) return;
  document.querySelector('#preview').src = result.file;
  document.querySelector('#open').href = result.file;
  document.querySelector('#meta').textContent = `共 ${results.length} 份答卷 · 厂商：${result.vendor} · 日期：${result.date}`;
}

select.addEventListener('change', show);
show();
