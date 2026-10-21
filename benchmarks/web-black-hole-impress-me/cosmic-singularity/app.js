/**
 * ============================================================================
 * 克尔黑洞：广义相对论时空与引力透镜实时仿真引擎
 * Modern Vanilla Web // 零外部依赖 // 纯数学与物理建模
 * ============================================================================
 */

(function () {
  'use strict';

  // --- 基础仿真参数与常数 ---
  const MAX_PARTICLES = 36000;
  const G = 1200; // 引力标度常数
  const DEFAULT_BH_MASS = 1800;
  const SPEED_OF_LIGHT = 28;

  // 状态管理
  const state = {
    mode: 'kerr', // 'kerr' | 'chaos' | 'web' | 'supernova'
    spin: 0.992,
    mass: DEFAULT_BH_MASS,
    density: 1.0,
    dopplerBeaming: true,
    plasmaJets: true,
    einsteinRing: true,
    bloom: true,
    audioActive: false,
    
    // 摄像机与视口
    camera: {
      rotX: 0.38,
      rotY: 0.0,
      zoom: 1.0,
      targetZoom: 1.0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    },
    
    // 引力波冲击纹波
    shockwaves: [],
    
    // 交互微引力阱
    gravityWell: { active: false, x: 0, y: 0, z: 0, strength: 0 }
  };

  // --- 画布与渲染上下文初始化 ---
  const canvas = document.getElementById('sim-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // 性能监控
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fps = 60;
  const fpsDisplay = document.getElementById('fps-readout');

  // --- 高性能 TypedArray 粒子缓冲区 ---
  const px = new Float32Array(MAX_PARTICLES);
  const py = new Float32Array(MAX_PARTICLES);
  const pz = new Float32Array(MAX_PARTICLES);
  const pvx = new Float32Array(MAX_PARTICLES);
  const pvy = new Float32Array(MAX_PARTICLES);
  const pvz = new Float32Array(MAX_PARTICLES);
  const pLife = new Float32Array(MAX_PARTICLES);
  const pMaxLife = new Float32Array(MAX_PARTICLES);
  const pType = new Uint8Array(MAX_PARTICLES); // 0: 吸积盘, 1: 喷流, 2: 背景星, 3: 爆炸冲击

  // 预计算三维相机欧拉角
  let cosX = Math.cos(state.camera.rotX);
  let sinX = Math.sin(state.camera.rotX);
  let cosY = Math.cos(state.camera.rotY);
  let sinY = Math.sin(state.camera.rotY);

  // --- 程序化 Web Audio 时空音效合成器 ---
  class SpacetimeAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.filter = null;
      this.lfo = null;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // 主增益节点
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 低通共振滤波器
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(110, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4.2, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // 双耳低频驻波振荡器 (43.65Hz 与 44.2Hz 差频共鸣)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(43.65, this.ctx.currentTime);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(44.20, this.ctx.currentTime);

      // 低频调制器 (LFO)
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.droneOsc1.connect(oscGain);
      this.droneOsc2.connect(oscGain);
      oscGain.connect(this.filter);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.lfo.start();
    }

    toggle() {
      if (!this.ctx) {
        this.init();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      state.audioActive = !state.audioActive;
      const targetGain = state.audioActive ? 0.35 : 0.0001;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
      return state.audioActive;
    }

    // 激发 LIGO 四极引力波啁啾脉冲 (GW150914 仿真)
    playChirp() {
      if (!this.ctx || !state.audioActive) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // 0.45 秒内指数级从 32Hz 扫频至 260Hz
      osc.frequency.setValueAtTime(32, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.45);
      // 环下衰减至 160Hz
      osc.frequency.linearRampToValueAtTime(160, now + 0.52);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.7, now + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.58);
    }
  }

  const audio = new SpacetimeAudioEngine();

  // --- 粒子系统初始化 ---
  function initParticle(i, mode = state.mode) {
    pLife[i] = Math.random() * 500;
    pMaxLife[i] = 400 + Math.random() * 600;

    if (mode === 'kerr') {
      const isJet = state.plasmaJets && Math.random() < 0.16;
      if (isJet) {
        pType[i] = 1; // 双极相对论喷流
        const sign = Math.random() < 0.5 ? 1 : -1;
        const radius = 2 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        px[i] = Math.cos(theta) * radius;
        pz[i] = Math.sin(theta) * radius;
        py[i] = sign * (12 + Math.random() * 20);

        // 沿磁轴高度准直螺旋运动
        const vHelical = 1.2;
        pvx[i] = -Math.sin(theta) * vHelical + (Math.random() - 0.5) * 0.4;
        pvz[i] = Math.cos(theta) * vHelical + (Math.random() - 0.5) * 0.4;
        pvy[i] = sign * (SPEED_OF_LIGHT * (0.65 + Math.random() * 0.35));
      } else {
        pType[i] = 0; // 吸积盘粒子
        // 幂律半径分布，紧贴光子球轨道
        const rMin = 28;
        const rMax = 380;
        const u = Math.random();
        const r = rMin + (rMax - rMin) * Math.pow(u, 2.2);
        const theta = Math.random() * Math.PI * 2;

        px[i] = Math.cos(theta) * r;
        pz[i] = Math.sin(theta) * r;
        py[i] = (Math.random() - 0.5) * (r * 0.045); // 薄盘几何尺度

        // 开普勒轨道初速度 + 克尔参考系拖曳
        const vCirc = Math.sqrt((G * state.mass) / (r + 15));
        pvx[i] = -Math.sin(theta) * vCirc;
        pvz[i] = Math.cos(theta) * vCirc;
        pvy[i] = (Math.random() - 0.5) * 0.2;
      }
    } else if (mode === 'chaos') {
      // 艾萨瓦动力学吸引子种子
      pType[i] = 0;
      px[i] = (Math.random() - 0.5) * 2;
      py[i] = (Math.random() - 0.5) * 2;
      pz[i] = (Math.random() - 0.5) * 2;
      pvx[i] = 0; pvy[i] = 0; pvz[i] = 0;
    } else if (mode === 'web') {
      // 宇宙原初密度扰动网
      pType[i] = 0;
      const r = Math.pow(Math.random(), 0.5) * 320;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      px[i] = r * Math.sin(phi) * Math.cos(theta);
      py[i] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      pz[i] = r * Math.cos(phi);
      pvx[i] = (Math.random() - 0.5) * 0.5;
      pvy[i] = (Math.random() - 0.5) * 0.2;
      pvz[i] = (Math.random() - 0.5) * 0.5;
    } else if (mode === 'supernova') {
      // 超新星核心剧烈坍缩
      pType[i] = 3;
      const r = 30 + Math.random() * 240;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      px[i] = r * Math.sin(phi) * Math.cos(theta);
      py[i] = r * Math.sin(phi) * Math.sin(theta);
      pz[i] = r * Math.cos(phi);
      const vCollapse = -1.8;
      pvx[i] = (px[i] / r) * vCollapse;
      pvy[i] = (py[i] / r) * vCollapse;
      pvz[i] = (pz[i] / r) * vCollapse;
    }
  }

  function resetAllParticles(mode = state.mode) {
    state.mode = mode;
    state.shockwaves = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      initParticle(i, mode);
    }
    updateTelemetryUI();
  }

  // --- 激发引力波冲击波 ---
  function triggerGravitationalWave() {
    state.shockwaves.push({
      radius: 20,
      maxRadius: 650,
      strength: 28,
      speed: 14.5
    });
    audio.playChirp();

    const ind = document.querySelector('.pulse-indicator');
    if (ind) {
      ind.style.transform = 'scale(2.5)';
      ind.style.background = '#ff3366';
      setTimeout(() => {
        ind.style.transform = '';
        ind.style.background = '';
      }, 400);
    }
  }

  // --- 物理更新步进 ---
  function updatePhysics(dt) {
    const activeCount = Math.floor(MAX_PARTICLES * state.density);
    const spin = state.spin;
    const bhMass = state.mass;
    const rEventHorizon = 24;

    // 扩展时空冲击波纹
    for (let s = state.shockwaves.length - 1; s >= 0; s--) {
      const sw = state.shockwaves[s];
      sw.radius += sw.speed;
      sw.strength *= 0.985;
      if (sw.radius > sw.maxRadius || sw.strength < 0.2) {
        state.shockwaves.splice(s, 1);
      }
    }

    if (state.mode === 'kerr') {
      for (let i = 0; i < activeCount; i++) {
        pLife[i] += dt;

        const x = px[i];
        const y = py[i];
        const z = pz[i];
        const rSq = x * x + z * z;
        const r = Math.sqrt(rSq + y * y);

        if (pType[i] === 1) {
          // 双极相对论喷流动力学
          px[i] += pvx[i] * dt;
          py[i] += pvy[i] * dt;
          pz[i] += pvz[i] * dt;

          const radialDist = Math.sqrt(x * x + z * z);
          const confinementForce = -0.08 * (radialDist - 6);
          pvx[i] += (x / (radialDist + 0.1)) * confinementForce;
          pvz[i] += (z / (radialDist + 0.1)) * confinementForce;

          if (Math.abs(py[i]) > 380 || pLife[i] > pMaxLife[i]) {
            initParticle(i, 'kerr');
          }
          continue;
        }

        // 掉入事件视界或寿命终结，在外部边缘重置
        if (r < rEventHorizon || pLife[i] > pMaxLife[i]) {
          initParticle(i, 'kerr');
          continue;
        }

        // 1. Paczynski-Wiita 伪相对论引力势阱: Phi = -GM / (r - r_g)
        const rg = rEventHorizon * 0.5;
        const effectiveR = Math.max(r - rg, 4.0);
        const force = (G * bhMass) / (effectiveR * effectiveR * r);

        let ax = -x * force;
        let ay = -y * force * 1.6;
        let az = -z * force;

        // 2. 伦斯-蒂林参考系拖曳效应 (Lense-Thirring Precession)
        const dragOmega = (2.2 * spin * bhMass) / (r * r * r + 200);
        ax += -z * dragOmega;
        az += x * dragOmega;

        // 3. 引力波冲击波扰动
        for (let s = 0; s < state.shockwaves.length; s++) {
          const sw = state.shockwaves[s];
          const dist = Math.abs(r - sw.radius);
          if (dist < 40) {
            const push = (1 - dist / 40) * sw.strength;
            ax += (x / r) * push;
            az += (z / r) * push;
          }
        }

        // 4. 用户交互引力阱
        if (state.gravityWell.active) {
          const dx = state.gravityWell.x - x;
          const dy = state.gravityWell.y - y;
          const dz = state.gravityWell.z - z;
          const dSq = dx * dx + dy * dy + dz * dz + 100;
          const gwForce = (state.gravityWell.strength * 4000) / Math.pow(dSq, 1.5);
          ax += dx * gwForce;
          ay += dy * gwForce;
          az += dz * gwForce;
        }

        pvx[i] += ax * dt;
        pvy[i] += ay * dt;
        pvz[i] += az * dt;

        px[i] += pvx[i] * dt;
        py[i] += pvy[i] * dt;
        pz[i] += pvz[i] * dt;
      }
    } else if (state.mode === 'chaos') {
      // 艾萨瓦吸引子非线性微分方程组
      const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
      const timeScale = 0.45;
      for (let i = 0; i < activeCount; i++) {
        let x = px[i], y = py[i], z = pz[i];
        const dx = ((z - b) * x - d * y) * timeScale;
        const dy = (d * x + (z - b) * y) * timeScale;
        const dz = (c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x) * timeScale;

        px[i] += dx * dt;
        py[i] += dy * dt;
        pz[i] += dz * dt;

        pvx[i] = dx;
        pvy[i] = dy;
        pvz[i] = dz;

        pLife[i] += dt;
        if (pLife[i] > pMaxLife[i] || Math.abs(x) > 40 || Math.abs(y) > 40 || Math.abs(z) > 40) {
          initParticle(i, 'chaos');
        }
      }
    } else if (state.mode === 'web') {
      // 宇宙纤维网演化
      for (let i = 0; i < activeCount; i++) {
        const x = px[i], y = py[i], z = pz[i];
        const r = Math.sqrt(x * x + y * y + z * z) + 1;
        const theta = Math.atan2(z, x);
        const spiralArm = Math.sin(3 * theta - r * 0.03);
        const filamentForce = spiralArm * 0.15;

        pvx[i] += (-x / r) * 0.3 + (-z / r) * filamentForce;
        pvy[i] += (-y / r) * 0.3;
        pvz[i] += (-z / r) * 0.3 + (x / r) * filamentForce;

        pvx[i] *= 0.992;
        pvy[i] *= 0.992;
        pvz[i] *= 0.992;

        px[i] += pvx[i];
        py[i] += pvy[i];
        pz[i] += pvz[i];
      }
    } else if (state.mode === 'supernova') {
      // 超新星核心回弹爆炸激波
      for (let i = 0; i < activeCount; i++) {
        px[i] += pvx[i] * dt * 1.8;
        py[i] += pvy[i] * dt * 1.8;
        pz[i] += pvz[i] * dt * 1.8;

        const r = Math.sqrt(px[i] * px[i] + py[i] * py[i] + pz[i] * pz[i]);
        if (r > 420) {
          initParticle(i, 'supernova');
        }
      }
    }
  }

  // --- 画面渲染流水线 ---
  function render() {
    // 带有拖尾余辉效果的背景清除
    ctx.fillStyle = 'rgba(3, 5, 8, 0.32)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const zoom = state.camera.zoom;
    const activeCount = Math.floor(MAX_PARTICLES * state.density);

    // 开启高亮度叠加混合模式 (Lighter Blend)
    ctx.globalCompositeOperation = 'lighter';

    // 1. 绘制克尔黑洞事件视界与爱因斯坦光环
    if (state.mode === 'kerr') {
      const bhRadiusScreen = 24 * zoom;
      const photonRingScreen = bhRadiusScreen * 1.5;
      const ergoScreen = bhRadiusScreen * 1.95;

      // 光子球外部扩散漫射光晕
      if (state.bloom) {
        const glowGrad = ctx.createRadialGradient(cx, cy, bhRadiusScreen * 0.8, cx, cy, photonRingScreen * 2.8);
        glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
        glowGrad.addColorStop(0.3, 'rgba(255, 183, 0, 0.25)');
        glowGrad.addColorStop(0.7, 'rgba(255, 51, 102, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, photonRingScreen * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 爱因斯坦引力透镜弯曲环
      if (state.einsteinRing) {
        ctx.strokeStyle = 'rgba(255, 240, 200, 0.6)';
        ctx.lineWidth = 1.8 * zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, photonRingScreen, 0, Math.PI * 2);
        ctx.stroke();

        // 能层边界椭圆指示
        ctx.strokeStyle = 'rgba(255, 183, 0, 0.2)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ergoScreen, ergoScreen * Math.abs(cosX), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 2. 绘制引力波冲击波纹
    for (let s = 0; s < state.shockwaves.length; s++) {
      const sw = state.shockwaves[s];
      const rScreen = sw.radius * zoom;
      const alpha = Math.min(1, sw.strength / 20);
      ctx.strokeStyle = `rgba(255, 51, 102, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rScreen, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. 三维投影并渲染粒子群
    const isKerr = state.mode === 'kerr';
    const isChaos = state.mode === 'chaos';
    const chaosScale = isChaos ? 14 * zoom : zoom;

    for (let i = 0; i < activeCount; i++) {
      let x = px[i];
      let y = py[i];
      let z = pz[i];

      if (isChaos) {
        x *= chaosScale;
        y *= chaosScale;
        z *= chaosScale;
      } else {
        x *= zoom;
        y *= zoom;
        z *= zoom;
      }

      // 3D 旋转变换
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // 透视投影
      const fov = 650;
      const depth = fov / (fov + z2);
      if (depth <= 0) continue;

      const sx = cx + x1 * depth;
      const sy = cy + y2 * depth;

      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;

      // 相对论多普勒红移 / 蓝移计算
      let rCol, gCol, bCol, alpha, pSize;

      if (isKerr) {
        if (pType[i] === 1) {
          // 双极等离子体喷流 (高能电光青蓝与紫罗兰)
          rCol = 140; gCol = 220; bCol = 255;
          alpha = 0.85;
          pSize = 1.6 * depth;
        } else {
          // 吸积盘多普勒集束效应
          const vTangential = (pvx[i] * cosY - pvz[i] * sinY);
          
          if (state.dopplerBeaming) {
            const beta = Math.max(-0.95, Math.min(0.95, vTangential / (SPEED_OF_LIGHT * 0.8)));
            if (beta < 0) {
              // 迎向观测者旋转：强烈蓝移与辐射增强
              const factor = -beta;
              rCol = Math.floor(40 + (1 - factor) * 80);
              gCol = Math.floor(180 + factor * 75);
              bCol = 255;
              alpha = Math.min(1.0, 0.4 + factor * 0.6);
              pSize = (1.5 + factor * 1.5) * depth;
            } else {
              // 背离观测者旋转：强烈引力与运动学红移、变暗
              const factor = beta;
              rCol = 255;
              gCol = Math.floor(80 * (1 - factor));
              bCol = Math.floor(40 * (1 - factor));
              alpha = Math.max(0.12, 0.45 - factor * 0.3);
              pSize = Math.max(0.8, (1.3 - factor * 0.5) * depth);
            }
          } else {
            rCol = 255; gCol = 180; bCol = 60;
            alpha = 0.5;
            pSize = 1.2 * depth;
          }
        }
      } else if (isChaos) {
        const speed = Math.sqrt(pvx[i] * pvx[i] + pvy[i] * pvy[i] + pvz[i] * pvz[i]);
        rCol = Math.floor(Math.sin(speed * 0.8) * 127 + 128);
        gCol = Math.floor(Math.cos(speed * 0.5) * 127 + 128);
        bCol = 255;
        alpha = 0.7;
        pSize = 1.2 * depth;
      } else if (state.mode === 'web') {
        rCol = 0; gCol = 255; bCol = 180;
        alpha = 0.35;
        pSize = 1.4 * depth;
      } else {
        rCol = 255; gCol = 90; bCol = 140;
        alpha = 0.8;
        pSize = 2.0 * depth;
      }

      ctx.fillStyle = `rgba(${rCol},${gCol},${bCol},${alpha.toFixed(3)})`;
      ctx.fillRect(sx, sy, pSize, pSize);
    }

    // 4. 遮罩中央事件视界阴影 (遮挡背景光)
    if (state.mode === 'kerr') {
      ctx.globalCompositeOperation = 'source-over';
      const shadowRadius = 24 * zoom;
      ctx.fillStyle = '#010204';
      ctx.beginPath();
      ctx.arc(cx, cy, shadowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 绝对黑体视界轮廓
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  // --- 遥测状态数据动态更新 ---
  function updateTelemetryUI() {
    const metricReadout = document.getElementById('metric-readout');
    const rsVal = document.getElementById('rs-val');
    const ergoVal = document.getElementById('ergo-val');
    const rphVal = document.getElementById('rph-val');
    const spinVal = document.getElementById('spin-readout');
    const frameDragVal = document.getElementById('frame-drag-val');

    if (state.mode === 'kerr') {
      metricReadout.textContent = '克尔度规 (高速自旋)';
      metricReadout.className = 'val accent-cyan';
      spinVal.textContent = `${state.spin.toFixed(3)} c`;
      rsVal.textContent = '12.24 × 10⁶ km';
      ergoVal.textContent = '24.48 × 10⁶ km';
      rphVal.textContent = '18.36 × 10⁶ km';
      frameDragVal.textContent = `${Math.floor(1480 * state.spin)} rad/s`;
    } else if (state.mode === 'chaos') {
      metricReadout.textContent = '艾萨瓦动力学奇异吸引子';
      metricReadout.className = 'val accent-amber';
      spinVal.textContent = '无 [混沌态]';
      rsVal.textContent = '分形维数: 2.34';
      ergoVal.textContent = '李雅普诺夫: +0.48';
      rphVal.textContent = '相空间: 3D流形';
      frameDragVal.textContent = '拓扑特征: 紧致有界';
    } else if (state.mode === 'web') {
      metricReadout.textContent = 'ΛCDM 宇宙暗物质纤维网';
      metricReadout.className = 'val accent-green';
      spinVal.textContent = '宇宙红移 z = 2.45';
      rsVal.textContent = '星系晕质量: 10¹⁴ M☉';
      ergoVal.textContent = '主干纤维束: 3 条';
      rphVal.textContent = '哈勃常数: 67.4 km/s/Mpc';
      frameDragVal.textContent = '潮汐引力场: 活跃演化';
    } else if (state.mode === 'supernova') {
      metricReadout.textContent = '核心坍缩超新星 (II型)';
      metricReadout.className = 'val accent-red';
      spinVal.textContent = '脉冲星自转: 300 Hz';
      rsVal.textContent = '中子核半径: 12 km';
      ergoVal.textContent = '激波扩散速度: 0.1 c';
      rphVal.textContent = '中微子光度: 10⁴⁶ W';
      frameDragVal.textContent = '引力波暴: 已辐射激发';
    }
  }

  // --- 事件绑定与用户交互 ---
  function setupEventListeners() {
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target === canvas || e.target.id === 'canvas-container') {
        state.camera.isDragging = true;
        state.camera.lastMouseX = e.clientX;
        state.camera.lastMouseY = e.clientY;

        if (e.button === 0 && e.shiftKey) {
          state.gravityWell.active = true;
          state.gravityWell.x = (e.clientX - width / 2) / state.camera.zoom;
          state.gravityWell.y = 0;
          state.gravityWell.z = (e.clientY - height / 2) / state.camera.zoom;
          state.gravityWell.strength = 1.0;
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.camera.isDragging) {
        const dx = e.clientX - state.camera.lastMouseX;
        const dy = e.clientY - state.camera.lastMouseY;
        state.camera.rotY += dx * 0.007;
        state.camera.rotX = Math.max(-1.4, Math.min(1.4, state.camera.rotX + dy * 0.007));

        cosX = Math.cos(state.camera.rotX);
        sinX = Math.sin(state.camera.rotX);
        cosY = Math.cos(state.camera.rotY);
        sinY = Math.sin(state.camera.rotY);

        state.camera.lastMouseX = e.clientX;
        state.camera.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      state.camera.isDragging = false;
      state.gravityWell.active = false;
    });

    window.addEventListener('wheel', (e) => {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      state.camera.zoom = Math.max(0.35, Math.min(3.2, state.camera.zoom * zoomFactor));
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerGravitationalWave();
      } else if (e.key === '1') {
        switchMode('kerr');
      } else if (e.key === '2') {
        switchMode('chaos');
      } else if (e.key === '3') {
        switchMode('web');
      } else if (e.key === '4') {
        switchMode('supernova');
      }
    });

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        switchMode(mode);
      });
    });

    function switchMode(mode) {
      document.querySelectorAll('.mode-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === mode);
      });
      resetAllParticles(mode);
    }

    document.getElementById('btn-chirp').addEventListener('click', () => {
      triggerGravitationalWave();
    });

    const audioBtn = document.getElementById('btn-audio');
    const audioLabel = document.getElementById('audio-label');
    audioBtn.addEventListener('click', () => {
      const isActive = audio.toggle();
      audioLabel.textContent = isActive ? '时空音效: 运行中' : '时空音效: 关闭';
      audioBtn.classList.toggle('glow-red', isActive);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      state.camera.rotX = 0.38;
      state.camera.rotY = 0.0;
      state.camera.zoom = 1.0;
      cosX = Math.cos(state.camera.rotX);
      sinX = Math.sin(state.camera.rotX);
      cosY = Math.cos(state.camera.rotY);
      sinY = Math.sin(state.camera.rotY);
      resetAllParticles(state.mode);
    });

    const toggleDoppler = document.getElementById('toggle-doppler');
    if (toggleDoppler) {
      toggleDoppler.addEventListener('change', (e) => {
        state.dopplerBeaming = e.target.checked;
      });
    }

    const toggleJets = document.getElementById('toggle-jets');
    if (toggleJets) {
      toggleJets.addEventListener('change', (e) => {
        state.plasmaJets = e.target.checked;
        resetAllParticles(state.mode);
      });
    }

    const toggleLensing = document.getElementById('toggle-lensing');
    if (toggleLensing) {
      toggleLensing.addEventListener('change', (e) => {
        state.einsteinRing = e.target.checked;
      });
    }

    const toggleBloom = document.getElementById('toggle-bloom');
    if (toggleBloom) {
      toggleBloom.addEventListener('change', (e) => {
        state.bloom = e.target.checked;
      });
    }

    const inputSpin = document.getElementById('input-spin');
    const sliderSpinVal = document.getElementById('slider-spin-val');
    if (inputSpin) {
      inputSpin.addEventListener('input', (e) => {
        state.spin = parseFloat(e.target.value);
        sliderSpinVal.textContent = state.spin.toFixed(3);
        updateTelemetryUI();
      });
    }

    const inputDensity = document.getElementById('input-density');
    const sliderDensityVal = document.getElementById('slider-density-val');
    if (inputDensity) {
      inputDensity.addEventListener('input', (e) => {
        state.density = parseFloat(e.target.value);
        sliderDensityVal.textContent = `${state.density.toFixed(1)}x`;
        document.getElementById('particle-count').textContent = Math.floor(MAX_PARTICLES * state.density).toLocaleString();
      });
    }
  }

  // --- 物理与动画主循环 ---
  function mainLoop(now) {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    frameCount++;
    if (frameCount % 24 === 0) {
      fps = Math.round(1 / dt);
      fpsDisplay.textContent = Math.min(fps, 60);
    }

    updatePhysics(1.0);
    render();

    requestAnimationFrame(mainLoop);
  }

  // --- 启动仿真 ---
  resetAllParticles('kerr');
  setupEventListeners();
  requestAnimationFrame(mainLoop);

})();
