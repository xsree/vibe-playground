(function () {
  "use strict";

  const DEFAULT_VIEW = Object.freeze({
    azDeg: 32.0,
    elDeg: 8.5,
    dist: 24.5
  });

  const LIMITS = Object.freeze({
    minElDeg: -89.0,
    maxElDeg: 89.0,
    minDist: 8.5,
    maxDist: 48.0
  });

  const canvas = document.getElementById("bh-canvas");
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingText = document.getElementById("loading-text");
  const rendererLabel = document.getElementById("renderer-label");
  const readoutAz = document.getElementById("readout-az");
  const readoutEl = document.getElementById("readout-el");
  const readoutDist = document.getElementById("readout-dist");
  const resetBtn = document.getElementById("reset-btn");

  const state = {
    curAzDeg: DEFAULT_VIEW.azDeg,
    curElDeg: DEFAULT_VIEW.elDeg,
    curDist: DEFAULT_VIEW.dist,
    targetAzDeg: DEFAULT_VIEW.azDeg,
    targetElDeg: DEFAULT_VIEW.elDeg,
    targetDist: DEFAULT_VIEW.dist,
    curOffsetX: 0.595,
    curOffsetY: 0.51,
    targetOffsetX: 0.595,
    targetOffsetY: 0.51,
    fovScale: Math.tan((20.0 * Math.PI) / 180.0),
    simTime: 0.0
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function normalizeAzimuth360(deg) {
    const m = deg % 360.0;
    return m < 0.0 ? m + 360.0 : m;
  }

  function updateFramingTargets() {
    const vw = Math.max(window.innerWidth || 1, 1);
    const vh = Math.max(window.innerHeight || 1, 1);
    const aspect = vw / vh;
    const baseTan = Math.tan((20.0 * Math.PI) / 180.0);

    if (vw <= 900) {
      state.targetOffsetX = 0.50;
      state.targetOffsetY = 0.555;
      state.fovScale = baseTan * Math.max(1.0, 1.36 / Math.max(aspect, 0.34));
    } else {
      state.targetOffsetX = aspect >= 1.65 ? 0.582 : 0.572;
      state.targetOffsetY = 0.508;
      state.fovScale = baseTan * (aspect < 1.48 ? Math.min(1.32, 1.48 / Math.max(aspect, 0.75)) : 1.0);
    }
  }

  function syncCanvasSize(renderer) {
    const vw = Math.max(window.innerWidth || 1, 1);
    const vh = Math.max(window.innerHeight || 1, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pw = Math.max(1, Math.round(vw * dpr));
    const ph = Math.max(1, Math.round(vh * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    updateFramingTargets();
    if (renderer) {
      renderer.resize(pw, ph);
    }
  }

  let lastAzText = "";
  let lastElText = "";
  let lastDistText = "";

  function updateHUD() {
    const azNorm = normalizeAzimuth360(state.curAzDeg);
    const azStr = azNorm.toFixed(1).padStart(5, "0") + "°";
    const elVal = clamp(state.curElDeg, LIMITS.minElDeg, LIMITS.maxElDeg);
    const elSign = elVal >= 0 ? "+" : "-";
    const elStr = elSign + Math.abs(elVal).toFixed(1).padStart(4, "0") + "°";
    const distStr = state.curDist.toFixed(1) + " Rs";

    if (azStr !== lastAzText) {
      readoutAz.textContent = azStr;
      lastAzText = azStr;
    }
    if (elStr !== lastElText) {
      readoutEl.textContent = elStr;
      lastElText = elStr;
    }
    if (distStr !== lastDistText) {
      readoutDist.textContent = distStr;
      lastDistText = distStr;
    }
  }

  function resetView() {
    const curMod = normalizeAzimuth360(state.curAzDeg);
    let deltaAz = DEFAULT_VIEW.azDeg - curMod;
    if (deltaAz > 180.0) deltaAz -= 360.0;
    if (deltaAz < -180.0) deltaAz += 360.0;

    state.targetAzDeg = state.curAzDeg + deltaAz;
    state.targetElDeg = DEFAULT_VIEW.elDeg;
    state.targetDist = DEFAULT_VIEW.dist;
    updateFramingTargets();
  }

  function bindInteractions() {
    const activePointers = new Map();
    let prevPinchDist = 0;

    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") {
        return;
      }
      canvas.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!activePointers.has(e.pointerId)) {
        return;
      }
      const prev = activePointers.get(e.pointerId);
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;

      if (activePointers.size === 1) {
        const vw = Math.max(window.innerWidth || 1, 320);
        const speed = vw <= 900 ? 0.34 : 0.26;
        state.targetAzDeg -= dx * speed;
        state.targetElDeg = clamp(state.targetElDeg + dy * speed, LIMITS.minElDeg, LIMITS.maxElDeg);
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (prevPinchDist > 8 && dist > 8) {
          const ratio = prevPinchDist / dist;
          state.targetDist = clamp(state.targetDist * ratio, LIMITS.minDist, LIMITS.maxDist);
        }
        prevPinchDist = dist;
      }
    });

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      prevPinchDist = 0;
    }

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("lostpointercapture", endPointer);

    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 18.0;
        else if (e.deltaMode === 2) delta *= 320.0;
        const zoomFactor = Math.exp(clamp(delta, -180, 180) * 0.00115);
        state.targetDist = clamp(state.targetDist * zoomFactor, LIMITS.minDist, LIMITS.maxDist);
      },
      { passive: false }
    );

    resetBtn.addEventListener("click", () => {
      resetView();
    });
  }

  async function boot() {
    updateFramingTargets();
    state.curOffsetX = state.targetOffsetX;
    state.curOffsetY = state.targetOffsetY;
    syncCanvasSize(null);
    updateHUD();
    bindInteractions();

    const renderer = await window.createBlackHoleRenderer(canvas);
    if (!renderer) {
      loadingText.textContent = "GRAPHICS CONTEXT UNAVAILABLE · 当前环境不支持硬件图形渲染";
      return;
    }

    rendererLabel.textContent = renderer.backendName;
    syncCanvasSize(renderer);

    window.addEventListener("resize", () => {
      syncCanvasSize(renderer);
    });

    const uniformData = new Float32Array(20);
    let lastTs = performance.now();
    let firstFramePresented = false;

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        lastTs = performance.now();
      }
    });

    function frame(now) {
      const rawDt = Math.max(0.0, (now - lastTs) * 0.001);
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      state.simTime += dt;

      const damp = 1.0 - Math.exp(-16.0 * Math.max(dt, 0.004));
      state.curAzDeg += (state.targetAzDeg - state.curAzDeg) * damp;
      state.curElDeg += (state.targetElDeg - state.curElDeg) * damp;
      state.curDist += (state.targetDist - state.curDist) * damp;
      state.curOffsetX += (state.targetOffsetX - state.curOffsetX) * damp;
      state.curOffsetY += (state.targetOffsetY - state.curOffsetY) * damp;

      updateHUD();

      const az = (state.curAzDeg * Math.PI) / 180.0;
      const el = (clamp(state.curElDeg, LIMITS.minElDeg, LIMITS.maxElDeg) * Math.PI) / 180.0;
      const ca = Math.cos(az);
      const sa = Math.sin(az);
      const ce = Math.cos(el);
      const se = Math.sin(el);
      const dist = state.curDist;

      const r0x = ca, r0y = 0.0, r0z = -sa;
      const u0x = -se * sa, u0y = ce, u0z = -se * ca;
      const roll = ((-4.2 * Math.PI) / 180.0) * ce;
      const cr = Math.cos(roll);
      const sr = Math.sin(roll);

      uniformData[0] = canvas.width;
      uniformData[1] = canvas.height;
      uniformData[2] = state.simTime;
      uniformData[3] = state.fovScale;

      uniformData[4] = dist * ce * sa;
      uniformData[5] = dist * se;
      uniformData[6] = dist * ce * ca;
      uniformData[7] = dist;

      uniformData[8] = -ce * sa;
      uniformData[9] = -se;
      uniformData[10] = -ce * ca;
      uniformData[11] = state.curOffsetX;

      uniformData[12] = cr * r0x + sr * u0x;
      uniformData[13] = cr * r0y + sr * u0y;
      uniformData[14] = cr * r0z + sr * u0z;
      uniformData[15] = state.curOffsetY;

      uniformData[16] = -sr * r0x + cr * u0x;
      uniformData[17] = -sr * r0y + cr * u0y;
      uniformData[18] = -sr * r0z + cr * u0z;
      uniformData[19] = 1.0;

      renderer.render(uniformData);

      if (!firstFramePresented) {
        firstFramePresented = true;
        requestAnimationFrame(() => {
          loadingOverlay.classList.add("is-hidden");
        });
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  boot();
})();
