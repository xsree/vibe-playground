/**
 * MODULE 01: HTML5 SEMANTICS - INTERACTION CONTROLLERS & LIVE CODE BINDING
 */

window.LabModules = window.LabModules || {};

window.LabModules['01-html-semantics'] = {
  id: '01-html-semantics',
  title: 'HTML5 原生交互与现代语义体系',

  init: function () {
    this.initDialogSandbox();
    this.initPictureResizer();
  },

  initDialogSandbox: function () {
    const dialog = document.getElementById('demo-dialog');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnOpenNonModal = document.getElementById('btn-open-nonmodal');
    const btnCancel = document.getElementById('btn-dialog-cancel');
    const btnConfirm = document.getElementById('btn-dialog-confirm');
    const slider = document.getElementById('backdrop-blur-slider');
    const blurDisplay = document.getElementById('blur-val-display');
    const codeSnippet = document.getElementById('dialog-code-snippet');

    if (!dialog || !btnOpenModal) return;

    btnOpenModal.onclick = () => {
      dialog.showModal();
      if (window.LabCore) window.LabCore.showToast('Top Layer 顶层模态框已激活');
    };

    if (btnOpenNonModal) {
      btnOpenNonModal.onclick = () => {
        dialog.show();
        if (window.LabCore) window.LabCore.showToast('非模态模式激活 (无全局遮罩)');
      };
    }

    if (btnCancel) btnCancel.onclick = () => dialog.close('cancel');
    if (btnConfirm) btnConfirm.onclick = () => dialog.close('confirm');

    if (slider) {
      slider.oninput = (e) => {
        const val = e.target.value;
        if (blurDisplay) blurDisplay.textContent = val + 'px';
        document.documentElement.style.setProperty('--dialog-backdrop-blur', val + 'px');
        
        // 动态实时同步更新代码框
        if (codeSnippet) {
          codeSnippet.innerText = `const dialog = document.querySelector('dialog');
dialog.showModal(); // 激活顶层模态

/* 遮罩样式定制 (实时同步) */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(${val}px);
}`;
          delete codeSnippet.dataset.highlighted;
          if (window.LabCore && window.LabCore.applySyntaxHighlighting) {
            window.LabCore.applySyntaxHighlighting();
          }
        }
      };
    }
  },

  initPictureResizer: function () {
    const resizer = document.getElementById('picture-resizer');
    const box = document.getElementById('dynamic-viewport-box');
    const valText = document.getElementById('picture-width-val');
    const modeBadge = document.getElementById('current-picture-mode');

    if (!resizer || !box) return;

    resizer.oninput = (e) => {
      const w = e.target.value;
      box.style.width = w + 'px';
      if (valText) valText.textContent = w + 'px';

      if (w >= 600) {
        box.classList.remove('is-mobile');
        if (modeBadge) modeBadge.textContent = '宽屏横幅模式 (16:9)';
      } else {
        box.classList.add('is-mobile');
        if (modeBadge) modeBadge.textContent = '窄屏特写模式 (1:1)';
      }
    };
  }
};
