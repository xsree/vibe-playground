/**
 * MODULE 08: ADVANCED WEB APIS - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['08-advanced-web-apis'] = {
  id: '08-advanced-web-apis',
  title: '高级 Web API、多线程与内存管理',

  init: function () {
    this.initWorkerDemo();
    this.initStreamsDemo();
    this.initMemoryDemo();
  },

  initWorkerDemo: function () {
    const btnBlock = document.getElementById('btn-block-main');
    const btnWorker = document.getElementById('btn-run-worker');
    const log = document.getElementById('worker-result-log');

    if (!btnBlock || !btnWorker) return;

    // 主线程耗时死循环测试
    btnBlock.onclick = () => {
      log.textContent = '主线程正在计算 5000 万次迭代... (UI 此时已完全停止响应)';
      setTimeout(() => {
        const start = performance.now();
        let sum = 0;
        for (let i = 0; i < 50000000; i++) sum += Math.sqrt(i);
        const time = (performance.now() - start).toFixed(1);
        log.textContent = `🔴 主线程计算完成: 耗时 ${time}ms (期间页面动画掉帧/点击卡死)`;
        if (window.LabCore) window.LabCore.showToast('主线程执行完毕，恢复响应');
      }, 50);
    };

    // 原生 Inline Worker 测试
    const workerCode = `
      self.onmessage = function(e) {
        const start = performance.now();
        let sum = 0;
        for (let i = 0; i < 50000000; i++) sum += Math.sqrt(i);
        const time = (performance.now() - start).toFixed(1);
        self.postMessage({ sum, time });
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    let worker = new Worker(workerUrl);

    btnWorker.onclick = () => {
      log.textContent = '🟢 Web Worker 正在后台线程计算中... (观察上方指示球，UI 保持 60fps 丝滑旋转)';
      worker.postMessage({});
      worker.onmessage = (e) => {
        log.textContent = `🟢 Worker 后台计算完成: 耗时 ${e.data.time}ms (全程主线程 0 卡顿)`;
        if (window.LabCore) window.LabCore.showToast('Web Worker 后台运算成功！');
      };
    };
  },

  initStreamsDemo: function () {
    const btn = document.getElementById('btn-start-stream');
    const output = document.getElementById('stream-output-box');

    if (!btn || !output) return;

    btn.onclick = () => {
      output.textContent = '';
      btn.disabled = true;

      const sampleText = 'Web Streams API 提供了以流的方式处理网络数据的能力。支持逐块解码并即时渲染，是大语言模型（LLM）流式打字机效果的核心底层规范...';
      const words = sampleText.split('');

      const stream = new ReadableStream({
        start(controller) {
          let index = 0;
          const timer = setInterval(() => {
            if (index < words.length) {
              controller.enqueue(words[index++]);
            } else {
              controller.close();
              clearInterval(timer);
            }
          }, 35);
        }
      });

      const reader = stream.getReader();
      function readNext() {
        reader.read().then(({ done, value }) => {
          if (done) {
            btn.disabled = false;
            if (window.LabCore) window.LabCore.showToast('ReadableStream 流式推送完成！');
            return;
          }
          output.textContent += value;
          readNext();
        });
      }

      readNext();
    };
  },

  initMemoryDemo: function () {
    const btnCreate = document.getElementById('btn-create-dom-node');
    const btnRemove = document.getElementById('btn-remove-dom-node');
    const holder = document.getElementById('memory-dom-holder');
    const log = document.getElementById('memory-log-text');

    if (!btnCreate || !btnRemove || !holder) return;

    const weakMapStore = new WeakMap();

    btnCreate.onclick = () => {
      holder.innerHTML = '<div class="sample-node" id="sample-target-node">目标 DOM 元素节点</div>';
      const node = document.getElementById('sample-target-node');
      weakMapStore.set(node, { token: '0xFA89', createdAt: Date.now() });
      if (log) {
        log.innerHTML = '已生成 DOM 节点，并在 WeakMap 中建立键值映射。此时存在弱引用绑定。';
      }
      if (window.LabCore) window.LabCore.showToast('已创建 DOM 并写入 WeakMap 弱引用');
    };

    btnRemove.onclick = () => {
      holder.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted);">DOM 节点已从文档树彻底移除</span>';
      if (log) {
        log.innerHTML = '<strong>GC 自动回收生效：</strong> 原 DOM 节点已被销毁，由于使用的是 WeakMap，键值对不再被强引用持有，引擎将在下次垃圾回收时自动清理对应内存。';
      }
      if (window.LabCore) window.LabCore.showToast('DOM 移除，WeakMap 弱引用自动释放');
    };
  }
};
