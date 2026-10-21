/**
 * MODULE 11: WEB SECURITY DEFENSE - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['11-web-security-defense'] = {
  id: '11-web-security-defense',
  title: '现代 Web 安全与客户端防御体系',

  init: function () {
    this.initCspDemo();
    this.initCorsDemo();
    this.initCookieDemo();
  },

  initCspDemo: function () {
    const chkCsp = document.getElementById('chk-enable-csp');
    const btnInject = document.getElementById('btn-inject-xss');
    const badge = document.getElementById('csp-shield-indicator');
    const commentBox = document.getElementById('user-comment-box');
    const log = document.getElementById('csp-security-log');

    if (!btnInject || !commentBox) return;

    if (chkCsp) {
      chkCsp.onchange = () => {
        if (chkCsp.checked) {
          badge.textContent = 'CSP Shield: ACTIVE';
          badge.classList.remove('off');
          log.textContent = '[CSP 引擎就绪] 已启用 default-src \'self\' 严格策略。';
        } else {
          badge.textContent = 'CSP Shield: DISABLED';
          badge.classList.add('off');
          log.textContent = '⚠️ 警告：CSP 已关闭，当前 DOM 处于 XSS 易受攻击状态！';
        }
      };
    }

    btnInject.onclick = () => {
      const maliciousPayload = `<img src="x" onerror="alert('XSS 攻击成功！Cookie 已被窃取');">`;
      commentBox.textContent = `模拟评论: 正常留言文本 + <script>窃取Token</script>`;

      if (chkCsp && chkCsp.checked) {
        log.innerHTML = `<span style="color: var(--accent-danger)">🔴 [CSP 拦截报告] Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'".</span>`;
        if (window.LabCore) window.LabCore.showToast('🛡️ CSP 内核层拦截恶意 XSS 脚本执行！');
      } else {
        log.innerHTML = `<span style="color: var(--accent-danger)">💥 [安全沦陷] 恶意脚本未经 CSP 拦截直接在用户页面上下文执行！</span>`;
        if (window.LabCore) window.LabCore.showToast('⚠️ 无 CSP 保护，XSS 漏洞触发！', 'error');
      }
    };
  },

  initCorsDemo: function () {
    const btnSimple = document.getElementById('btn-fire-simple-req');
    const btnPreflight = document.getElementById('btn-fire-preflight-req');
    const arrowOptions = document.getElementById('cors-arrow-options');
    const arrowActual = document.getElementById('cors-arrow-actual');
    const log = document.getElementById('cors-log-display');

    if (!btnSimple || !btnPreflight) return;

    btnSimple.onclick = () => {
      arrowOptions.className = 'swimlane-arrow';
      arrowOptions.querySelector('.arrow-label').textContent = '— (简单请求无需预检) —';
      arrowActual.className = 'swimlane-arrow active-success';
      arrowActual.querySelector('.arrow-label').textContent = 'GET /api/data (直接发起)';
      log.innerHTML = '<strong>简单请求判定：</strong> 请求方法为 GET 且无自定义 Header，浏览器直接发出请求并检查响应头的 <code>Access-Control-Allow-Origin</code>。';
      if (window.LabCore) window.LabCore.showToast('简单跨域请求：0 预检开销直接通信');
    };

    btnPreflight.onclick = () => {
      arrowOptions.className = 'swimlane-arrow active';
      arrowOptions.querySelector('.arrow-label').textContent = '1. OPTIONS /api (预检协商)';
      arrowActual.className = 'swimlane-arrow';
      arrowActual.querySelector('.arrow-label').textContent = '2. 等待预检通过...';
      log.innerHTML = '<strong>复杂请求触发：</strong> 携带 <code>Authorization</code> Header，浏览器自动暂停真实请求，先发出 OPTIONS 探测服务器许可...';

      setTimeout(() => {
        arrowActual.className = 'swimlane-arrow active-success';
        arrowActual.querySelector('.arrow-label').textContent = '2. PUT /api (真实业务请求执行)';
        log.innerHTML += '<br><span style="color: var(--accent-success)">🟢 预检通过 (HTTP 204)，浏览器正式发出 PUT 业务请求。</span>';
        if (window.LabCore) window.LabCore.showToast('OPTIONS 预检握手成功，业务请求放行');
      }, 700);
    };
  },

  initCookieDemo: function () {
    const chkHttp = document.getElementById('chk-httponly');
    const chkSame = document.getElementById('chk-samesite');
    const chkSec = document.getElementById('chk-secure');

    const statHttp = document.getElementById('stat-httponly');
    const statSame = document.getElementById('stat-samesite');
    const statSec = document.getElementById('stat-secure');
    const codeHeader = document.getElementById('cookie-header-code');

    function updateCookieFlags() {
      let flags = ['Path=/'];

      if (chkHttp.checked) {
        statHttp.className = 'defense-status pass';
        statHttp.textContent = '🛡️ 防御 XSS 盗取 Cookie (document.cookie 无法读取)';
        flags.push('HttpOnly');
      } else {
        statHttp.className = 'defense-status fail';
        statHttp.textContent = '⚠️ 危险：攻击者可通过 JS document.cookie 窃取敏感 Token！';
      }

      if (chkSame.checked) {
        statSame.className = 'defense-status pass';
        statSame.textContent = '🛡️ 彻底阻断跨站 CSRF 伪造请求携带 Cookie';
        flags.push('SameSite=Strict');
      } else {
        statSame.className = 'defense-status fail';
        statSame.textContent = '⚠️ 危险：第三方网站跨站跳转将自动携带该 Cookie (易受 CSRF 攻击)';
      }

      if (chkSec.checked) {
        statSec.className = 'defense-status pass';
        statSec.textContent = '🛡️ 仅通过 HTTPS 加密信道传输，防中间人窃听';
        flags.push('Secure');
      } else {
        statSec.className = 'defense-status fail';
        statSec.textContent = '⚠️ 危险：明文 HTTP 协议下 Cookie 易被局域网嗅探抓包';
      }

      if (codeHeader) {
        codeHeader.innerText = `Set-Cookie: session_id=0xFA89BC; ${flags.join('; ')};`;
        delete codeHeader.dataset.highlighted;
        if (window.LabCore && window.LabCore.applySyntaxHighlighting) {
          window.LabCore.applySyntaxHighlighting();
        }
      }
    }

    if (chkHttp) chkHttp.onchange = updateCookieFlags;
    if (chkSame) chkSame.onchange = updateCookieFlags;
    if (chkSec) chkSec.onchange = updateCookieFlags;
  }
};
