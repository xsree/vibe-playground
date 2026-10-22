/**
 * MODULE 10: WEB GRAPHICS & AUDIO - INTERACTION CONTROLLERS
 */

window.LabModules = window.LabModules || {};

window.LabModules['10-web-graphics-audio'] = {
  id: '10-web-graphics-audio',
  title: '纯前端视听计算与硬件底层接口',

  init: function () {
    this.initCanvasFilters();
    this.initWebAudio();
  },

  initCanvasFilters: function () {
    const canvas = document.getElementById('filter-demo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    function drawBasePattern() {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(0.5, '#7c3aed');
      grad.addColorStop(1, '#db2777');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 3, h / 2, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.fillRect(w / 2 + 20, h / 4, 60, 60);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('Canvas 2D Graphics', 20, 30);
    }

    drawBasePattern();

    const btnNormal = document.getElementById('btn-filter-normal');
    const btnGray = document.getElementById('btn-filter-grayscale');
    const btnInvert = document.getElementById('btn-filter-invert');
    const btnEdge = document.getElementById('btn-filter-edge');

    if (btnNormal) btnNormal.onclick = () => {
      drawBasePattern();
      if (window.LabCore) window.LabCore.showToast('已还原为原始图像');
    };

    if (btnGray) btnGray.onclick = () => {
      drawBasePattern();
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
      if (window.LabCore) window.LabCore.showToast('像素级灰度加权运算完成');
    };

    if (btnInvert) btnInvert.onclick = () => {
      drawBasePattern();
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      ctx.putImageData(imgData, 0, 0);
      if (window.LabCore) window.LabCore.showToast('色彩反相矩阵运算完成');
    };

    if (btnEdge) btnEdge.onclick = () => {
      drawBasePattern();
      const src = ctx.getImageData(0, 0, w, h);
      const output = ctx.createImageData(w, h);
      const s = src.data;
      const d = output.data;

      // 快速拉普拉斯边缘卷积算子
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          let sum = 0;
          sum += s[((y - 1) * w + x) * 4] * -1;
          sum += s[((y + 1) * w + x) * 4] * -1;
          sum += s[(y * w + (x - 1)) * 4] * -1;
          sum += s[(y * w + (x + 1)) * 4] * -1;
          sum += s[idx] * 4;

          const val = Math.min(255, Math.max(0, Math.abs(sum)));
          d[idx] = d[idx + 1] = d[idx + 2] = val;
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(output, 0, 0);
      if (window.LabCore) window.LabCore.showToast('拉普拉斯卷积边缘提取算子执行完成！');
    };
  },

  initWebAudio: function () {
    const btnTone = document.getElementById('btn-play-tone');
    const btnChord = document.getElementById('btn-play-chord');
    const waveBar = document.getElementById('audio-wave-anim');
    const label = document.getElementById('audio-status-label');

    let audioCtx = null;

    function getAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playTone(freq, duration = 0.5) {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);

      if (waveBar) {
        waveBar.classList.add('active');
        setTimeout(() => waveBar.classList.remove('active'), duration * 1000);
      }
    }

    if (btnTone) {
      btnTone.onclick = () => {
        playTone(440, 0.6);
        if (label) label.textContent = '🔊 正弦波振荡器正在发声: 440 Hz (标准音 A4)';
        if (window.LabCore) window.LabCore.showToast('Web Audio API: 440Hz 正弦波合成');
      };
    }

    if (btnChord) {
      btnChord.onclick = () => {
        playTone(440, 0.8);
        playTone(554.37, 0.8); // C#5
        playTone(659.25, 0.8); // E5
        if (label) label.textContent = '🔊 三和弦合成: A4 (440Hz) + C#5 (554Hz) + E5 (659Hz)';
        if (window.LabCore) window.LabCore.showToast('Web Audio API: A 大调三和弦实时合成');
      };
    }
  }
};
