/**
 * MODULE 09: FRAMEWORK PARADIGMS - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['09-framework-paradigms'] = {
  id: '09-framework-paradigms',
  title: '现代前端响应式内核与通信架构',

  init: function () {
    this.initReactivityArena();
    this.initBroadcastDemo();
  },

  initReactivityArena: function () {
    const btnTick = document.getElementById('btn-reactivity-tick');
    const tickCounter = document.getElementById('reactivity-tick-counter');
    const reactRenders = document.getElementById('stat-react-renders');
    const vueEffects = document.getElementById('stat-vue-effects');
    const signalUpdates = document.getElementById('stat-signals-updates');

    const cardReact = document.getElementById('card-mode-react');
    const cardVue = document.getElementById('card-mode-vue');
    const cardSignals = document.getElementById('card-mode-signals');

    if (!btnTick) return;

    let ticks = 0;

    btnTick.onclick = () => {
      ticks++;
      if (tickCounter) tickCounter.textContent = 'Tick: ' + ticks;
      if (reactRenders) reactRenders.textContent = ticks;
      if (vueEffects) vueEffects.textContent = ticks;
      if (signalUpdates) signalUpdates.textContent = ticks;

      [cardReact, cardVue, cardSignals].forEach(c => {
        if (c) {
          c.classList.add('flash');
          setTimeout(() => c.classList.remove('flash'), 200);
        }
      });

      if (window.LabCore) window.LabCore.showToast(`状态变更触发: React 重新计算整树，Vue 派发 Effect，Signals 直更 DOM Text`);
    };
  },

  initBroadcastDemo: function () {
    const input = document.getElementById('broadcast-input-msg');
    const btnSend = document.getElementById('btn-send-broadcast');
    const logs = document.getElementById('broadcast-logs');

    if (!btnSend || !logs) return;

    // 创建原生 BroadcastChannel
    const channel = new BroadcastChannel('lab-sync-channel');

    function appendLog(text, isReceived = false) {
      const line = document.createElement('div');
      line.className = 'b-log-line' + (isReceived ? ' b-log-received' : '');
      line.textContent = text;
      logs.appendChild(line);
      logs.scrollTop = logs.scrollHeight;
    }

    btnSend.onclick = () => {
      const msg = input.value.trim() || 'Ping!';
      channel.postMessage({ text: msg, time: new Date().toLocaleTimeString() });
      appendLog(`[本地发送] ${new Date().toLocaleTimeString()}: ${msg}`);
      if (window.LabCore) window.LabCore.showToast('已向同源所有标签页广播消息');
    };

    channel.onmessage = (event) => {
      appendLog(`[跨标签页同步] ${event.data.time}: ${event.data.text}`, true);
      if (window.LabCore) window.LabCore.showToast('收到来自其他标签页的广播！');
    };
  }
};
