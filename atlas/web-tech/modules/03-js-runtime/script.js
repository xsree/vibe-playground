/**
 * MODULE 03: JAVASCRIPT RUNTIME & EVENT LOOP - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['03-js-runtime'] = {
  id: '03-js-runtime',
  title: 'JavaScript 现代运行时与内核机制',

  init: function () {
    this.initEventLoop();
    this.initProxyReactivity();
    this.initIntersectionObserver();
    this.initAbortController();
  },

  // 1. Event Loop Visualizer
  initEventLoop: function () {
    const runBtn = document.getElementById('btn-run-event-loop');
    const resetBtn = document.getElementById('btn-reset-loop');
    const indicator = document.getElementById('loop-step-indicator');
    const stackView = document.getElementById('call-stack-view');
    const microView = document.getElementById('microtask-queue-view');
    const macroView = document.getElementById('macrotask-queue-view');
    const logsEl = document.getElementById('loop-console-logs');

    if (!runBtn) return;

    let isRunning = false;

    function addLog(text, color = '#a7f3d0') {
      const line = document.createElement('div');
      line.className = 'log-line';
      line.style.color = color;
      line.textContent = '> ' + text;
      logsEl.appendChild(line);
      logsEl.scrollTop = logsEl.scrollHeight;
    }

    runBtn.onclick = () => {
      if (isRunning) return;
      isRunning = true;
      runBtn.disabled = true;
      logsEl.innerHTML = '';
      if (indicator) indicator.textContent = '执行中...';

      // Step 1: 同步代码入栈
      stackView.innerHTML = '<div class="queue-item-pill stack-item">console.log("1. 同步开始")</div>';
      addLog('1. 同步开始');

      setTimeout(() => {
        // Step 2: 宏任务 setTimeout 注册到 Macrotask
        stackView.innerHTML = '<div class="queue-item-pill stack-item">setTimeout(...)</div>';
        macroView.innerHTML = '<div class="queue-item-pill macro-item">Timer Callback (0ms)</div>';
        addLog('[Event Loop] 注册宏任务: setTimeout 移入 Macrotask Queue', '#fde047');

        setTimeout(() => {
          // Step 3: 微任务 Promise 入 Microtask Queue
          stackView.innerHTML = '<div class="queue-item-pill stack-item">Promise.resolve().then(...)</div>';
          microView.innerHTML = '<div class="queue-item-pill micro-item">Promise.then()</div>';
          addLog('[Event Loop] 注册微任务: Promise.then 移入 Microtask Queue', '#c084fc');

          setTimeout(() => {
            // Step 4: 同步结束
            stackView.innerHTML = '<div class="queue-item-pill stack-item">console.log("2. 同步结束")</div>';
            addLog('2. 同步结束');

            setTimeout(() => {
              // Step 5: 调用栈清空，优先清空所有微任务
              stackView.innerHTML = '<div class="queue-item-pill micro-item">执行微任务: Promise.then()</div>';
              microView.innerHTML = '<span class="queue-empty-text">已清空</span>';
              addLog('3. 微任务已执行: Promise.then() 完成！', '#c084fc');

              setTimeout(() => {
                // Step 6: 执行宏任务
                stackView.innerHTML = '<div class="queue-item-pill macro-item">执行宏任务: Timer Callback</div>';
                macroView.innerHTML = '<span class="queue-empty-text">已清空</span>';
                addLog('4. 宏任务已执行: setTimeout 回调完成！', '#fde047');

                setTimeout(() => {
                  stackView.innerHTML = '<span class="queue-empty-text">调用栈已全部清空</span>';
                  if (indicator) indicator.textContent = '完成一轮循环';
                  isRunning = false;
                  runBtn.disabled = false;
                  if (window.LabCore) window.LabCore.showToast('事件循环（Event Loop）演示完成！');
                }, 700);
              }, 700);
            }, 700);
          }, 700);
        }, 700);
      }, 700);
    };

    if (resetBtn) {
      resetBtn.onclick = () => {
        logsEl.innerHTML = '<div class="log-line text-muted">&gt; 日志已重置，请点击开始演示</div>';
        stackView.innerHTML = '<span class="queue-empty-text">当前无执行帧</span>';
        microView.innerHTML = '<span class="queue-empty-text">队列为空</span>';
        macroView.innerHTML = '<span class="queue-empty-text">队列为空</span>';
      };
    }
  },

  // 2. Proxy Reactivity
  initProxyReactivity: function () {
    const userInput = document.getElementById('proxy-input-user');
    const countInput = document.getElementById('proxy-input-count');
    const addBtn = document.getElementById('btn-proxy-add');
    const reactiveUser = document.getElementById('reactive-user-text');
    const reactiveScore = document.getElementById('reactive-score-text');
    const logLine = document.getElementById('proxy-log-line');

    if (!userInput || !countInput) return;

    // 核心 Proxy 响应式对象
    const rawState = { username: 'Antigravity', score: 100 };
    const state = new Proxy(rawState, {
      set(target, prop, value, receiver) {
        const success = Reflect.set(target, prop, value, receiver);
        if (prop === 'username' && reactiveUser) {
          reactiveUser.textContent = value;
        }
        if (prop === 'score' && reactiveScore) {
          reactiveScore.textContent = value;
        }
        if (logLine) {
          logLine.textContent = `[Proxy.set] 捕获到属性变更 -> state.${String(prop)} = ${value}`;
        }
        return success;
      }
    });

    userInput.oninput = (e) => {
      state.username = e.target.value;
    };

    countInput.oninput = (e) => {
      state.score = parseInt(e.target.value, 10) || 0;
    };

    if (addBtn) {
      addBtn.onclick = () => {
        state.score += 10;
        countInput.value = state.score;
        if (window.LabCore) window.LabCore.showToast(`Proxy 触发状态派发：score = ${state.score}`);
      };
    }
  },

  // 3. IntersectionObserver
  initIntersectionObserver: function () {
    const scrollContainer = document.getElementById('mock-scroll-viewport');
    const counterBadge = document.getElementById('observer-hit-counter');

    if (!scrollContainer) return;

    let hitCount = 1;
    const cards = scrollContainer.querySelectorAll('.observe-target-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          const statusText = entry.target.querySelector('.obs-status-text');
          if (statusText) {
            statusText.textContent = `✅ 传感器捕获曝光 (ratio: ${entry.intersectionRatio.toFixed(2)})`;
            statusText.style.color = 'var(--accent-emerald)';
          }
          hitCount = scrollContainer.querySelectorAll('.observe-target-card.is-visible').length;
          if (counterBadge) counterBadge.textContent = `已曝光卡片: ${hitCount} / 3`;
        }
      });
    }, {
      root: scrollContainer,
      threshold: 0.4
    });

    cards.forEach(card => observer.observe(card));
  },

  // 4. AbortController
  initAbortController: function () {
    const startBtn = document.getElementById('btn-start-fetch');
    const abortBtn = document.getElementById('btn-abort-fetch');
    const progressBar = document.getElementById('abort-progress-fill');
    const logDisplay = document.getElementById('abort-log-display');
    const badge = document.getElementById('abort-status-badge');

    if (!startBtn || !abortBtn) return;

    let controller = null;
    let timer = null;

    startBtn.onclick = () => {
      if (controller) controller.abort();
      controller = new AbortController();

      startBtn.disabled = true;
      abortBtn.disabled = false;
      progressBar.className = 'progress-fill';
      progressBar.style.width = '0%';
      if (badge) badge.textContent = '请求传输中 (3s)...';
      logDisplay.textContent = '🚀 正在发起慢速网络请求 (信号已连接到 AbortController)...';

      let progress = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        progress += 5;
        progressBar.style.width = progress + '%';
        if (progress >= 100) {
          clearInterval(timer);
          progressBar.classList.add('success');
          logDisplay.textContent = '✅ 请求成功返回：200 OK (数据包已安全接收)';
          if (badge) badge.textContent = '请求成功';
          startBtn.disabled = false;
          abortBtn.disabled = true;
          if (window.LabCore) window.LabCore.showToast('慢速请求已成功完成！');
        }
      }, 150);

      controller.signal.addEventListener('abort', () => {
        clearInterval(timer);
        progressBar.classList.add('aborted');
        logDisplay.textContent = '🚨 请求已被 AbortController.abort() 瞬间急停阻断！';
        if (badge) badge.textContent = '已被取消 (AbortError)';
        startBtn.disabled = false;
        abortBtn.disabled = true;
        if (window.LabCore) window.LabCore.showToast('已拉下急停总闸，请求被安全丢弃', 'error');
      });
    };

    abortBtn.onclick = () => {
      if (controller) {
        controller.abort();
      }
    };
  }
};
