/**
 * MODULE 05: WEB COMPONENTS & SHADOW DOM - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

// 1. 定义原生自定义元素 (Custom Elements)
if (!customElements.get('tech-counter')) {
  class TechCounter extends HTMLElement {
    static get observedAttributes() {
      return ['count'];
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      const count = this.getAttribute('count') || '0';
      this.innerHTML = `
        <div class="counter-component-card">
          <span class="counter-badge">&lt;tech-counter&gt; 原生组件实例</span>
          <div class="counter-value-circle">${count}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">attributeChangedCallback 自动响应</span>
        </div>
      `;
    }
  }
  customElements.define('tech-counter', TechCounter);
}

window.LabModules['05-native-components'] = {
  id: '05-native-components',
  title: 'Web Components 原生组件化全家桶',

  init: function () {
    this.initCustomElementControls();
    this.initShadowDomIsolation();
    this.initTemplateCloning();
  },

  // 1. Custom Elements Controls
  initCustomElementControls: function () {
    const incBtn = document.getElementById('btn-custom-inc');
    const resetBtn = document.getElementById('btn-custom-reset');
    const counterEl = document.querySelector('tech-counter');

    if (!incBtn || !counterEl) return;

    incBtn.onclick = () => {
      let current = parseInt(counterEl.getAttribute('count') || '0', 10);
      counterEl.setAttribute('count', current + 1);
      if (window.LabCore) window.LabCore.showToast(`Custom Element 属性更新: count="${current + 1}"`);
    };

    if (resetBtn) {
      resetBtn.onclick = () => {
        counterEl.setAttribute('count', '0');
        if (window.LabCore) window.LabCore.showToast('Custom Element 计数已重置为 0');
      };
    }
  },

  // 2. Shadow DOM Mounting & Pollution Test
  initShadowDomIsolation: function () {
    const shadowHost = document.getElementById('shadow-dom-host');
    const pollutionBtn = document.getElementById('btn-toggle-pollution');
    const pane = document.querySelector('.shadow-dom-pane');
    const badge = document.getElementById('shadow-dom-badge');

    if (!shadowHost) return;

    // 挂载真实 Shadow DOM (如果尚未挂载)
    if (!shadowHost.shadowRoot) {
      const shadow = shadowHost.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .box-tag {
            font-family: 'Fira Code', monospace;
            font-size: 0.7rem;
            color: #38bdf8;
          }
          h4 {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 700;
            color: #38bdf8 !important; /* 舱内原生受保护颜色 */
          }
          p {
            margin: 0;
            font-size: 0.8rem;
            color: #94a3b8;
            line-height: 1.45;
          }
        </style>
        <span class="box-tag">🛡️ Shadow DOM 隔离舱 (Shadow Root)</span>
        <h4>受保护的隔离组件</h4>
        <p>浏览器底层沙盒强隔离，外部全局样式 100% 无法穿透或污染！</p>
      `;
    }

    if (pollutionBtn && pane) {
      pollutionBtn.onclick = () => {
        const isPolluted = pane.classList.toggle('pollution-active');
        if (isPolluted) {
          pollutionBtn.textContent = '🧹 清除全局恶性样式';
          if (badge) {
            badge.textContent = '🚨 恶性样式注入中';
            badge.style.background = 'var(--accent-rose-bg)';
            badge.style.color = 'var(--accent-rose)';
            badge.style.borderColor = 'var(--accent-rose)';
          }
          if (window.LabCore) window.LabCore.showToast('全局恶性样式已注入：普通 DOM 字体变红划线，Shadow DOM 岿然不动！', 'error');
        } else {
          pollutionBtn.textContent = '💥 注入全局恶性样式 (h4 { color: red !important })';
          if (badge) {
            badge.textContent = '普通隔离';
            badge.style.background = '';
            badge.style.color = '';
            badge.style.borderColor = '';
          }
          if (window.LabCore) window.LabCore.showToast('已清除全局恶性样式');
        }
      };
    }
  },

  // 3. Template & Slot Cloning
  initTemplateCloning: function () {
    const cloneBtn = document.getElementById('btn-clone-template');
    const template = document.getElementById('tmpl-profile-card');
    const wall = document.getElementById('template-render-wall');

    if (!cloneBtn || !template || !wall) return;

    const mockStaff = [
      { name: 'Alex Johnson', role: '系统内核工程师', avatar: '🚀', bio: '专注于现代 Web 运行时与高性能计算优化。' },
      { name: 'Elena Rostova', role: 'UI/UX 交互架构师', avatar: '🎨', bio: '主导设计系统与原子化组件库生态建设。' },
      { name: 'Marcus Chen', role: '全栈安全研究员', avatar: '🛡️', bio: '深耕浏览器沙盒安全与跨域通信协议。' }
    ];

    // 初始化先克隆 2 个实例
    if (wall.children.length === 0) {
      for (let i = 0; i < 2; i++) {
        const clone = template.content.cloneNode(true);
        const data = mockStaff[i];
        clone.querySelector('.profile-avatar').textContent = data.avatar;
        clone.querySelector('.slot-name-target').textContent = data.name;
        clone.querySelector('.slot-role-target').textContent = data.role;
        clone.querySelector('.profile-bio').textContent = data.bio;
        wall.appendChild(clone);
      }
    }

    cloneBtn.onclick = () => {
      const clone = template.content.cloneNode(true);
      const randomStaff = mockStaff[Math.floor(Math.random() * mockStaff.length)];
      clone.querySelector('.profile-avatar').textContent = randomStaff.avatar;
      clone.querySelector('.slot-name-target').textContent = `${randomStaff.name} #${wall.children.length + 1}`;
      clone.querySelector('.slot-role-target').textContent = randomStaff.role;
      clone.querySelector('.profile-bio').textContent = randomStaff.bio;
      wall.appendChild(clone);
      if (window.LabCore) window.LabCore.showToast(`从 <template> 克隆出新组件实例 #${wall.children.length}`);
    };
  }
};
