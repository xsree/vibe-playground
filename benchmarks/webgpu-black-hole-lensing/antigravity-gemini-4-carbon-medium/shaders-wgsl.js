(function () {
  "use strict";

  const SCENE_WGSL = /* wgsl */ `
struct Uniforms {
  u0: vec4<f32>, // resX, resY, time, fovScale
  u1: vec4<f32>, // camPos.xyz, camDist
  u2: vec4<f32>, // camFwd.xyz, offsetX
  u3: vec4<f32>, // camRight.xyz, offsetY
  u4: vec4<f32>, // camUp.xyz, quality
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

struct VSOut {
  @builtin(position) pos: vec4<f32>,
};

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> VSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );
  var out: VSOut;
  out.pos = vec4<f32>(p[vid], 0.0, 1.0);
  return out;
}

fn fractSafe(x: f32) -> f32 {
  return x - floor(x);
}

fn hash31(p3_in: vec3<f32>) -> f32 {
  var p3 = fract(p3_in * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash33(p3_in: vec3<f32>) -> vec3<f32> {
  var p3 = fract(p3_in * vec3<f32>(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

fn noise3(x: vec3<f32>) -> f32 {
  let i = floor(x);
  let f = x - i;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let n000 = hash31(i + vec3<f32>(0.0, 0.0, 0.0));
  let n100 = hash31(i + vec3<f32>(1.0, 0.0, 0.0));
  let n010 = hash31(i + vec3<f32>(0.0, 1.0, 0.0));
  let n110 = hash31(i + vec3<f32>(1.0, 1.0, 0.0));
  let n001 = hash31(i + vec3<f32>(0.0, 0.0, 1.0));
  let n101 = hash31(i + vec3<f32>(1.0, 0.0, 1.0));
  let n011 = hash31(i + vec3<f32>(0.0, 1.0, 1.0));
  let n111 = hash31(i + vec3<f32>(1.0, 1.0, 1.0));

  let nx00 = mix(n000, n100, u.x);
  let nx10 = mix(n010, n110, u.x);
  let nx01 = mix(n001, n101, u.x);
  let nx11 = mix(n011, n111, u.x);

  let nxy0 = mix(nx00, nx10, u.y);
  let nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

fn fbm3(p_in: vec3<f32>) -> f32 {
  var p = p_in;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 3; i = i + 1) {
    v += a * noise3(p);
    p = p * 2.03 + vec3<f32>(13.1, 7.7, 5.3);
    a *= 0.5;
  }
  return v / 0.875;
}
`;

  const SCENE_WGSL_2 = /* wgsl */ `
fn fbm4(p_in: vec3<f32>) -> f32 {
  var p = p_in;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i = i + 1) {
    v += a * noise3(p);
    p = p * 2.05 + vec3<f32>(7.3, 19.1, 11.7);
    a *= 0.5;
  }
  return v / 0.9375;
}

fn diskHalfHeight(rxz: f32) -> f32 {
  return 0.084 + 0.041 * pow(max(rxz - 1.7, 0.0), 0.80);
}

fn samplePhaseCloud(rxz: f32, py: f32, theta: f32, tau: f32) -> f32 {
  let shearRate = 0.64 * pow(max(rxz, 1.6), -1.05);
  let inflowRate = 0.42 / (0.55 + 0.24 * rxz);
  let rk = max(rxz + inflowRate * tau, 1.15);
  let ang = theta - shearRate * tau + 0.46 * log(rk);

  let q = vec3<f32>(rk * cos(ang), py * 2.60, rk * sin(ang)) * 0.56;
  let warp = vec3<f32>(
    fbm3(q * 0.68 + vec3<f32>(1.7, 9.2, 3.4)),
    fbm3(q * 0.68 + vec3<f32>(8.3, 2.8, 5.1)),
    fbm3(q * 0.68 + vec3<f32>(4.1, 6.7, 9.8))
  ) - vec3<f32>(0.5);

  let qw = q + warp * 1.12;
  let macroCloud = fbm3(qw * 0.46 + vec3<f32>(5.2, 1.9, 8.4));
  let billow = fbm4(qw * 1.18);
  let wispRaw = fbm4(qw * 2.35 + warp * 0.62);
  let wisps = 1.0 - abs(wispRaw * 2.0 - 1.0);

  let angRad = theta - 0.38 * shearRate * tau + 0.24 * log(rk);
  let qRad = vec3<f32>(cos(angRad) * 2.65, sin(angRad) * 2.65, rk * 0.42 - py * 0.95) + warp * 0.58;
  let radialFlow = fbm3(qRad * 1.38);

  return 0.28 * macroCloud + 0.34 * billow + 0.20 * (wisps * wisps) + 0.18 * radialFlow;
}

struct GasSample {
  emission: vec3<f32>,
  sigma: f32,
};

fn evalDiskGas(p: vec3<f32>, rayDir: vec3<f32>, time: f32) -> GasSample {
  var out: GasSample;
  out.emission = vec3<f32>(0.0);
  out.sigma = 0.0;

  let rxz = length(p.xz);
  if (rxz < 1.72 || rxz > 9.85) {
    return out;
  }
  let h = diskHalfHeight(rxz);
  let yn = p.y / h;
  if (abs(yn) > 1.38) {
    return out;
  }

  let vertEnv = exp(-1.90 * yn * yn) * smoothstep(1.38, 0.82, abs(yn));
  let theta = atan2(p.z, p.x) - 0.058 * time;

  let ph0 = fractSafe(time / 24.0);
  let ph1 = fractSafe(time / 24.0 + 0.5);
  let w = 0.5 - 0.5 * cos(6.2831853 * ph0);

  let c0 = samplePhaseCloud(rxz, p.y, theta, (ph0 - 0.5) * 3.0);
  let c1 = samplePhaseCloud(rxz, p.y, theta, (ph1 - 0.5) * 3.0);
  let normW = inverseSqrt(max(w * w + (1.0 - w) * (1.0 - w), 0.25));
  let turb = clamp((mix(c0 - 0.5, c1 - 0.5, w) * normW * 0.92) + 0.5, 0.0, 1.0);

  let smokeShape = smoothstep(0.22, 0.85, turb);
  let rInner = 2.08 + 0.30 * (turb - 0.5);
  let innerFade = smoothstep(rInner - 0.16, rInner + 0.62, rxz);
  let outerFade = 1.0 - smoothstep(4.1, 9.35, rxz + (turb - 0.5) * 1.55);
  let density = innerFade * outerFade * vertEnv * (0.09 + 1.48 * smokeShape);
  if (density <= 0.0005) {
    return out;
  }
`;

  const SCENE_WGSL_3 = /* wgsl */ `
  let tempR = exp(-max(rxz - 2.15, 0.0) * 0.34);
  let corePlane = 1.0 - 0.24 * min(abs(yn), 1.0);
  let heat = clamp((0.52 * tempR + 0.54 * pow(smokeShape, 1.32)) * corePlane, 0.0, 1.0);

  let hueVar = smoothstep(0.30, 0.70, c0);
  let colHot = vec3<f32>(0.95, 0.96, 1.00);
  let colLav = vec3<f32>(0.80, 0.74, 0.96);
  let colBlueViolet = vec3<f32>(0.68, 0.76, 0.98);
  let colSilver = vec3<f32>(0.72, 0.75, 0.85);
  let colOuter = vec3<f32>(0.40, 0.39, 0.58);

  let midTint = mix(mix(colLav, colBlueViolet, hueVar), colSilver, 0.28);
  var baseCol = mix(colOuter, midTint, smoothstep(0.06, 0.58, heat));
  baseCol = mix(baseCol, colHot, smoothstep(0.48, 0.96, heat));

  let orbDir = normalize(vec3<f32>(p.z, 0.0, -p.x) + vec3<f32>(1e-5, 0.0, 0.0));
  let vOrb = clamp(0.80 * inverseSqrt(max(rxz, 1.6)), 0.0, 0.56);
  let align = dot(-rayDir, orbDir) * vOrb;
  let beaming = clamp(1.0 + 0.56 * align, 0.68, 1.46);
  let dopplerTint = mix(
    vec3<f32>(0.93, 0.88, 1.03),
    vec3<f32>(0.96, 0.99, 1.05),
    clamp(align + 0.5, 0.0, 1.0)
  );

  let energy = (1.65 + 3.15 * tempR * smokeShape) * (0.72 + 0.55 * smokeShape);
  out.sigma = density * 3.85;
  out.emission = baseCol * dopplerTint * beaming * density * energy;
  return out;
}

fn evalStarLayer(dir: vec3<f32>, scale: f32, densityProb: f32, pixAng: f32, streakMode: f32) -> vec3<f32> {
  let sp = dir * scale;
  let cell = floor(sp);
  let rnd = hash33(cell + vec3<f32>(scale * 0.37));
  if (rnd.x > densityProb) {
    return vec3<f32>(0.0);
  }

  let starGridPos = cell + vec3<f32>(0.26) + 0.48 * hash33(cell + vec3<f32>(19.7, 7.3, 3.1));
  let starDir = normalize(starGridPos);
  let diff = dir - starDir;

  let angSq = dot(diff, diff);
  let maxCellSig = 0.055 / scale;
  let sigma = clamp(pixAng * (0.68 + 0.35 * rnd.y), 0.00034, maxCellSig);

  if (streakMode > 0.5 && rnd.z > 0.80) {
    let axis = normalize(vec3<f32>(0.22, 0.94, -0.25));
    let tang = normalize(cross(starDir, axis) + vec3<f32>(1e-5));
    let bitang = cross(starDir, tang);
    let along = dot(diff, tang);
    let perp = dot(diff, bitang);
    let streakLen = min(0.0038 + 0.0042 * rnd.y, 0.14 / scale);
    let clampedAlong = clamp(along, -streakLen * 0.2, streakLen);
    let residualAlong = along - clampedAlong;
    let taper = 1.0 - clamp((along + streakLen * 0.2) / (streakLen * 1.2), 0.0, 1.0) * 0.78;
    let trailFalloff = exp(-(residualAlong * residualAlong + perp * perp) / (2.0 * sigma * sigma));
    let trailCol = mix(vec3<f32>(0.68, 0.75, 0.96), vec3<f32>(0.82, 0.79, 0.98), rnd.y);
    return trailCol * trailFalloff * taper * (0.14 + 0.20 * rnd.y);
  }

  let spot = exp(-angSq / (2.0 * sigma * sigma));
  let lum = pow(rnd.y, 3.4) * (0.12 + 0.58 * rnd.z);
  let tint = mix(vec3<f32>(0.74, 0.80, 0.97), vec3<f32>(0.88, 0.85, 1.00), rnd.z);
  return tint * spot * lum;
}

fn evalStars(dir_in: vec3<f32>, time: f32, pixAng: f32) -> vec3<f32> {
  let ang = 0.0016 * time;
  let ca = cos(ang);
  let sa = sin(ang);
  let dir = normalize(vec3<f32>(
    ca * dir_in.x + sa * dir_in.z,
    dir_in.y,
    -sa * dir_in.x + ca * dir_in.z
  ));

  let bandPlane = abs(dot(dir, normalize(vec3<f32>(-0.28, 0.91, 0.30))));
  let bandBoost = exp(-bandPlane * 4.5);
  let dust = fbm3(dir * 3.4 + vec3<f32>(2.1, 5.4, 8.7));
  var bg = vec3<f32>(0.0005, 0.0007, 0.0015) + vec3<f32>(0.0014, 0.0014, 0.0032) * bandBoost * dust;

  bg += evalStarLayer(dir, 142.0, 0.065 + 0.085 * bandBoost, pixAng, 0.0) * 0.42;
  bg += evalStarLayer(dir, 78.0, 0.042 + 0.050 * bandBoost, pixAng, 0.0) * 0.72;
  bg += evalStarLayer(dir, 36.0, 0.026, pixAng, 1.0) * 0.85;
  return bg;
}
`;

  const SCENE_WGSL_4 = /* wgsl */ `
fn geoAccel(p: vec3<f32>, h2: f32) -> vec3<f32> {
  let r2 = max(dot(p, p), 0.09);
  let invR = inverseSqrt(r2);
  let invR5 = invR * invR * invR * invR * invR;
  return (-1.5 * h2 * invR5) * p;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  let res = uni.u0.xy;
  let time = uni.u0.z;
  let fovScale = uni.u0.w;

  let camPos = uni.u1.xyz;
  let camDist = uni.u1.w;
  let camFwd = uni.u2.xyz;
  let offsetX = uni.u2.w;
  let camRight = uni.u3.xyz;
  let offsetY = uni.u3.w;
  let camUp = uni.u4.xyz;

  let uv = vec2<f32>(in.pos.x / res.x, 1.0 - in.pos.y / res.y);
  let aspect = res.x / res.y;
  let px = (uv.x - offsetX) * aspect * 2.0 * fovScale;
  let py = (uv.y - offsetY) * 2.0 * fovScale;
  let rd = normalize(camFwd + px * camRight + py * camUp);

  let hVec = cross(camPos, rd);
  let h2 = dot(hVec, hVec);

  var pos = camPos;
  var vel = rd;
  var acc = geoAccel(pos, h2);

  var accum = vec3<f32>(0.0);
  var trans = 1.0;
  var escaped = true;
  let rEscape = max(camDist * 1.45, 34.0);

  for (var step = 0; step < 228; step = step + 1) {
    let r = length(pos);
    if (r <= 1.006) {
      escaped = false;
      break;
    }
    if (r > rEscape && dot(pos, vel) > 0.0) {
      escaped = true;
      break;
    }

    var dt = 0.12;
    if (r > 13.5) {
      dt = clamp((r - 11.2) * 0.34, 0.20, 2.10);
    } else {
      let gravStep = clamp((r - 0.86) * 0.058, 0.020, 0.17);
      let rxz = length(pos.xz);
      dt = gravStep;
      if (rxz > 1.55 && rxz < 10.4) {
        let hLim = diskHalfHeight(rxz) * 1.45;
        let vGap = max(abs(pos.y) - hLim, 0.0);
        dt = min(gravStep, 0.032 + 0.20 * vGap);
      }
    }

    let nextPos = pos + vel * dt + 0.5 * acc * (dt * dt);
    let nextAcc = geoAccel(nextPos, h2);
    let nextVel = vel + 0.5 * (acc + nextAcc) * dt;

    let midP = 0.5 * (pos + nextPos);
    let midRxz = length(midP.xz);
    let slabY = 0.56;
    if (midRxz > 1.65 && midRxz < 11.0 && (min(abs(pos.y), abs(nextPos.y)) < slabY || pos.y * nextPos.y <= 0.0)) {
      let segDir = nextPos - pos;
      let segLen = length(segDir);
      let rayUnit = normalize(segDir + vec3<f32>(1e-6));
      let subDs = segLen / 3.0;
      for (var s = 0; s < 3; s = s + 1) {
        let frac = (f32(s) + 0.5) / 3.0;
        let sp = pos + segDir * frac;
        let gas = evalDiskGas(sp, rayUnit, time);
        if (gas.sigma > 0.0004) {
          let st = exp(-gas.sigma * subDs);
          accum += trans * gas.emission * ((1.0 - st) / max(gas.sigma, 1e-4));
          trans *= st;
        }
      }
      if (trans < 0.003) {
        trans = 0.0;
        escaped = false;
        break;
      }
    }

    pos = nextPos;
    vel = nextVel;
    acc = nextAcc;
  }
`;

  const SCENE_WGSL_5 = /* wgsl */ `
  let r0 = length(camPos);
  let invE = max(1.0 - h2 / max(r0 * r0 * r0, 1.0), 1e-4);
  let bEff = sqrt(h2 / invE);
  let goingInward = dot(camPos, rd) < 0.0;
  if (goingInward && r0 > 1.55 && bEff < 2.5980762) {
    escaped = false;
  }

  if (goingInward && r0 > 1.55) {
    let worldPx = max(camDist * 2.0 * fovScale / res.y, 0.004);
    let db = bEff - 2.5980762;
    let ringW = max(1.25 * worldPx, 0.020);
    let ringCore = exp(-(db * db) / (ringW * ringW)) * smoothstep(-0.85 * worldPx, 0.12 * worldPx, db);
    let haloW = max(4.2 * worldPx, 0.085);
    let ringHalo = exp(-max(db, 0.0) / haloW) * smoothstep(-0.45 * worldPx, 0.55 * worldPx, db);
    let spinAlign = clamp(hVec.y * inverseSqrt(max(h2, 1e-5)), -1.0, 1.0);
    let ringAsym = 1.0 + 0.24 * spinAlign;
    let ringCol = mix(vec3<f32>(0.76, 0.74, 0.96), vec3<f32>(0.96, 0.97, 1.00), ringCore);
    let ringVis = pow(clamp(trans, 0.0, 1.0), 2.8);
    accum += ringVis * ringCol * ringAsym * (0.88 * ringCore + 0.18 * ringHalo);
  }

  if (escaped && trans > 0.002) {
    let pixAng = 2.0 * fovScale / res.y;
    let starDir = normalize(vel);
    var causticFade = 1.0;
    if (goingInward && r0 > 1.55) {
      let antiAxis = -normalize(camPos);
      let einsteinGuard = smoothstep(0.022, 0.115, length(starDir - antiAxis));
      causticFade = smoothstep(3.1, 6.8, bEff) * einsteinGuard;
    }
    let skyCol = evalStars(starDir, time, pixAng);
    accum += trans * (vec3<f32>(0.0005, 0.0007, 0.0015) + (skyCol - vec3<f32>(0.0005, 0.0007, 0.0015)) * causticFade);
  }

  return vec4<f32>(max(accum, vec3<f32>(0.0)), 1.0);
}
`;

  const COMPOSITE_WGSL = /* wgsl */ `
struct Uniforms {
  u0: vec4<f32>,
  u1: vec4<f32>,
  u2: vec4<f32>,
  u3: vec4<f32>,
  u4: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var hdrTex: texture_2d<f32>;
@group(0) @binding(2) var hdrSamp: sampler;

struct VSOut {
  @builtin(position) pos: vec4<f32>,
};

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> VSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );
  var out: VSOut;
  out.pos = vec4<f32>(p[vid], 0.0, 1.0);
  return out;
}

fn softBright(c: vec3<f32>) -> vec3<f32> {
  let lum = dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
  let w = smoothstep(0.32, 1.85, lum);
  return c * w;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  let res = uni.u0.xy;
  let uv = in.pos.xy / res;
  let aspect = res.x / res.y;
  let base = textureSampleLevel(hdrTex, hdrSamp, uv, 0.0).rgb;

  var glow = vec3<f32>(0.0);
  var wSum = 0.0;
  for (var i = 0; i < 16; i = i + 1) {
    let fi = f32(i);
    let rNorm = sqrt((fi + 0.5) / 16.0);
    let ang = fi * 2.3999632;
    let rad = rNorm * 0.034;
    let offs = vec2<f32>(cos(ang) / aspect, sin(ang)) * rad;
    let sc = textureSampleLevel(hdrTex, hdrSamp, clamp(uv + offs, vec2<f32>(0.001), vec2<f32>(0.999)), 0.0).rgb;
    let w = exp(-rNorm * rNorm * 2.1);
    glow += softBright(sc) * w;
    wSum += w;
  }
  glow /= max(wSum, 1e-4);

  let baseLum = dot(base, vec3<f32>(0.2126, 0.7152, 0.0722));
  let shadowGuard = smoothstep(0.0, 0.035, baseLum);
  let hdr = base + glow * (0.045 + 0.095 * shadowGuard);

  let L = dot(hdr, vec3<f32>(0.2126, 0.7152, 0.0722));
  let Lm = (L * (1.0 + L / 5.2)) / (1.0 + L * 1.22);
  var mapped = hdr * (Lm / max(L, 1e-5));
  let whiteTint = vec3<f32>(Lm) * vec3<f32>(0.97, 0.98, 1.02);
  mapped = mix(mapped, whiteTint, smoothstep(0.46, 0.98, Lm) * 0.34);

  let gamma = pow(clamp(mapped, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(1.0 / 2.2));
  let dither = (fract(sin(dot(in.pos.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  return vec4<f32>(clamp(gamma + vec3<f32>(dither), vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
`;

  window.BH_WGSL = {
    scene: [SCENE_WGSL, SCENE_WGSL_2, SCENE_WGSL_3, SCENE_WGSL_4, SCENE_WGSL_5].join("\n"),
    composite: COMPOSITE_WGSL
  };
})();
