/**
 * MODULE 13: ASYNC CONCURRENCY & NETWORKING - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['13-async-concurrency-net'] = {
  id: '13-async-concurrency-net',
  title: '异步并发调度赛马场与网络传输协议',

  init: function () {
    this.initPromiseArena();
    this.initProtocolsDemo();
  },

  initPromiseArena: function () {
    const select = document.getElementById('select-promise-mode');
    const btn = document.getElementById('btn-fire-promise-race');
    const log = document.getElementById('promise-race-log');
    const notes = document.getElementById('promise-combinator-notes');
    const snippet = document.getElementById('promise-code-snippet');

    const fill1 = document.getElementById('track-fill-1');
    const fill2 = document.getElementById('track-fill-2');
    const fill3 = document.getElementById('track-fill-3');

    const tag1 = document.getElementById('track-tag-1');
    const tag2 = document.getElementById('track-tag-2');
    const tag3 = document.getElementById('track-tag-3');

    if (!btn || !select) return;

    select.onchange = (e) => {
      const mode = e.target.value;
      if (mode === 'all') {
        notes.innerHTML = '<strong>Promise.all 机制：</strong> “一败俱败”。所有并发任务全部成功才 resolve；只要任意一个任务 reject，整个组合器立即 reject 并返回该失败原因。';
        snippet.innerText = `try {
  const [u, p, m] = await Promise.all([fetchUser(), fetchPosts(), fetchMetrics()]);
} catch (err) {
  // 任何一个失败直接触发 catch
}`;
      } else if (mode === 'allSettled') {
        notes.innerHTML = '<strong>Promise.allSettled 机制：</strong> 永远不提前 reject，等待所有任务无论成功还是失败全部落定后，返回统一的结果对象数组。';
        snippet.innerText = `const results = await Promise.allSettled([fetchUser(), fetchPosts(), fetchMetrics()]);
// results: [{ status: 'fulfilled', value: ... }, { status: 'rejected', reason: ... }]`;
      } else if (mode === 'race') {
        notes.innerHTML = '<strong>Promise.race 机制：</strong> “先到先得”。只看哪个任务最先完成（无论 resolve 还是 reject），立即采纳该结果。可用于超时控制。';
        snippet.innerText = `const result = await Promise.race([
  fetchData(),
  new Promise((_, rej) => setTimeout(() => rej(new Error('超时')), 3000))
]);`;
      } else if (mode === 'any') {
        notes.innerHTML = '<strong>Promise.any 机制：</strong> 只要有任意一个成功就立即 resolve；只有全部任务均失败时才会抛出 AggregateError。';
        snippet.innerText = `// 镜像 CDN 竞速下载
const fastestData = await Promise.any([fetchFromCDN1(), fetchFromCDN2(), fetchFromCDN3()]);`;
      }
      delete snippet.dataset.highlighted;
      if (window.LabCore && window.LabCore.applySyntaxHighlighting) {
        window.LabCore.applySyntaxHighlighting();
      }
    };

    btn.onclick = () => {
      const mode = select.value;
      btn.disabled = true;
      log.textContent = '并发请求已发射... 正在竞速中';

      [fill1, fill2, fill3].forEach(f => f.style.width = '0%');
      [tag1, tag2, tag3].forEach(t => { t.className = 'track-result-tag'; t.textContent = 'Running...'; });

      // Track 1 (600ms Resolve)
      fill1.style.transition = 'width 600ms linear';
      fill1.style.width = '100%';
      setTimeout(() => { tag1.className = 'track-result-tag done'; tag1.textContent = 'Resolve'; }, 600);

      // Track 2 (400ms Reject)
      fill2.style.transition = 'width 400ms linear';
      fill2.style.width = '100%';
      setTimeout(() => { tag2.className = 'track-result-tag rejected'; tag2.textContent = 'Reject 🔴'; }, 400);

      // Track 3 (900ms Resolve)
      fill3.style.transition = 'width 900ms linear';
      fill3.style.width = '100%';
      setTimeout(() => { tag3.className = 'track-result-tag done'; tag3.textContent = 'Resolve'; }, 900);

      // Settle timing according to combinator
      if (mode === 'all') {
        setTimeout(() => {
          log.innerHTML = `<span style="color: var(--accent-danger)">🔴 [Promise.all 快速失败] 400ms 时 Task 2 抛出异常，整个组合器立即 Reject 终止！</span>`;
          btn.disabled = false;
        }, 400);
      } else if (mode === 'race') {
        setTimeout(() => {
          log.innerHTML = `<span style="color: var(--accent-danger)">🏁 [Promise.race 结算] 400ms 时 Task 2 最快到达，采纳 Task 2 (Reject)！</span>`;
          btn.disabled = false;
        }, 400);
      } else if (mode === 'any') {
        setTimeout(() => {
          log.innerHTML = `<span style="color: var(--accent-success)">🟢 [Promise.any 结算] 600ms 时 Task 1 最先成功 Resolve，采纳 Task 1 成功值！</span>`;
          btn.disabled = false;
        }, 600);
      } else if (mode === 'allSettled') {
        setTimeout(() => {
          log.innerHTML = `<span style="color: var(--accent-success)">🟢 [Promise.allSettled 全部结算] 900ms 时全部 3 个任务就绪，返回 2 个 fulfilled + 1 个 rejected 结果集。</span>`;
          btn.disabled = false;
        }, 900);
      }
    };
  },

  initProtocolsDemo: function () {
    const btnSse = document.getElementById('btn-demo-sse');
    const btnWs = document.getElementById('btn-demo-ws');
    const streamBox = document.getElementById('proto-feed-stream');
    const badge = document.getElementById('proto-name-badge');

    if (!btnSse || !btnWs) return;

    btnSse.onclick = () => {
      badge.textContent = 'Server-Sent Events (单向流式推送)';
      streamBox.innerHTML = '<div class="feed-item text-muted">[SSE 握手] HTTP/2 GET /stream (Content-Type: text/event-stream) 建立成功</div>';

      const chunks = [
        'data: {"token": "人工智能", "id": 1}',
        'data: {"token": "正在重构", "id": 2}',
        'data: {"token": "现代前端标准", "id": 3}',
        'data: [DONE]'
      ];

      chunks.forEach((c, idx) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'feed-item sse-chunk';
          el.textContent = `← [SSE Chunk +${(idx+1)*200}ms] ${c}`;
          streamBox.appendChild(el);
          streamBox.scrollTop = streamBox.scrollHeight;
        }, (idx + 1) * 250);
      });

      if (window.LabCore) window.LabCore.showToast('SSE 单向文本流持续推送中');
    };

    btnWs.onclick = () => {
      badge.textContent = 'WebSocket (101 Switching Protocols)';
      streamBox.innerHTML = '<div class="feed-item text-muted">[WS 握手] Upgrade: websocket -> 101 Switching Protocols 全双工建立</div>';

      const packets = [
        { dir: '→', text: '客户端发出: {"action": "PING", "cursor": [120, 340]}' },
        { dir: '←', text: '服务端广播: {"user_id": "99", "action": "DRAW_LINE"}' },
        { dir: '←', text: '服务端响应: {"status": "PONG", "latency_ms": 12}' }
      ];

      packets.forEach((p, idx) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'feed-item ws-packet';
          el.textContent = `${p.dir} [WS Frame] ${p.text}`;
          streamBox.appendChild(el);
          streamBox.scrollTop = streamBox.scrollHeight;
        }, (idx + 1) * 300);
      });

      if (window.LabCore) window.LabCore.showToast('WebSocket 双向二进制/文本帧实时通信');
    };
  }
};
