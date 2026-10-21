/**
 * MODULE 06: BROWSER PIPELINE - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['06-browser-pipeline'] = {
  id: '06-browser-pipeline',
  title: '关键渲染路径与浏览器管线',

  init: function () {
    this.initCrpSandbox();
    this.initScriptTimeline();
  },

  initCrpSandbox: function () {
    const btnReflow = document.getElementById('btn-trigger-reflow');
    const btnRepaint = document.getElementById('btn-trigger-repaint');
    const btnComposite = document.getElementById('btn-trigger-composite');
    const testBox = document.getElementById('crp-test-box');
    const stepLayout = document.getElementById('crp-step-layout');
    const stepPaint = document.getElementById('crp-step-paint');
    const stepComposite = document.getElementById('crp-step-composite');
    const feedback = document.getElementById('crp-cost-feedback');

    if (!btnReflow || !testBox) return;

    function resetActive() {
      stepLayout.className = 'crp-step-node';
      stepPaint.className = 'crp-step-node';
      stepComposite.className = 'crp-step-node';
    }

    btnReflow.onclick = () => {
      resetActive();
      stepLayout.classList.add('active');
      stepPaint.classList.add('active');
      stepComposite.classList.add('active');
      testBox.style.width = testBox.style.width === '220px' ? '140px' : '220px';
      if (feedback) {
        feedback.innerHTML = '<strong>重排触发 (Reflow)：</strong> 修改了 <code>width</code>，浏览器必须重新计算 DOM 几何包围盒并级联重新排版，耗费最高算力。';
      }
      if (window.LabCore) window.LabCore.showToast('触发完整管线：Reflow -> Repaint -> Composite', 'error');
    };

    btnRepaint.onclick = () => {
      resetActive();
      stepPaint.classList.add('active-paint');
      stepComposite.classList.add('active-paint');
      testBox.style.background = testBox.style.background === 'rgb(37, 99, 235)' ? '#27272a' : '#2563eb';
      if (feedback) {
        feedback.innerHTML = '<strong>重绘触发 (Repaint)：</strong> 修改了 <code>background</code>，几何位置未变，直接跳过 Layout，仅重新栅格化填充颜色。';
      }
      if (window.LabCore) window.LabCore.showToast('触发轻量管线：Paint -> Composite');
    };

    btnComposite.onclick = () => {
      resetActive();
      stepComposite.classList.add('active-gpu');
      testBox.style.transform = testBox.style.transform === 'scale(1.15)' ? 'scale(1)' : 'scale(1.15)';
      if (feedback) {
        feedback.innerHTML = '<strong>仅 GPU 合成 (Composite)：</strong> 修改了 <code>transform</code>，完全跳过主线程 Layout 与 Paint，由 GPU 合成器线程直接处理，保持极致 60fps。';
      }
      if (window.LabCore) window.LabCore.showToast('触发极致性能：仅 GPU Composite');
    };
  },

  initScriptTimeline: function () {
    const select = document.getElementById('script-strategy-select');
    const card = document.getElementById('timeline-visual-card');
    const notes = document.getElementById('script-strategy-notes');
    const codeDisplay = document.getElementById('script-code-display');

    if (!select || !card) return;

    function updateStrategy(strat) {
      card.className = 'timeline-visual-card strategy-' + strat;
      if (strat === 'normal') {
        notes.innerHTML = '<strong>普通 &lt;script&gt; 行为：</strong> 遇到脚本立即中断 HTML 解析，同步阻塞下载并执行，极易导致白屏。';
        codeDisplay.innerHTML = '<code>&lt;script src="app.js"&gt;&lt;/script&gt;</code>';
      } else if (strat === 'defer') {
        notes.innerHTML = '<strong>defer 行为：</strong> 后台异步下载，不阻塞 HTML 解析；在 DOMContentLoaded 事件前按照标签顺序依次执行。现代工程首选。';
        codeDisplay.innerHTML = '<code>&lt;script defer src="app.js"&gt;&lt;/script&gt;</code>';
      } else if (strat === 'async') {
        notes.innerHTML = '<strong>async 行为：</strong> 后台异步下载，但只要下载完毕立即暂停 HTML 解析并执行，执行时序不可控。适合无 DOM 依赖的独立埋点统计脚本。';
        codeDisplay.innerHTML = '<code>&lt;script async src="analytics.js"&gt;&lt;/script&gt;</code>';
      } else if (strat === 'module') {
        notes.innerHTML = '<strong>type="module" 行为：</strong> 模块化脚本默认具备 defer 异步加载与延迟执行语义，且天然拥有私有作用域。';
        codeDisplay.innerHTML = '<code>&lt;script type="module" src="main.js"&gt;&lt;/script&gt;</code>';
      }
    }

    select.onchange = (e) => updateStrategy(e.target.value);
    updateStrategy('normal');
  }
};
