(function () {
  "use strict";

  const VS_GLSL = `#version 300 es
precision highp float;
void main() {
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

  const SCENE_GLSL_1 = `#version 300 es
precision highp float;

uniform vec4 uParams[5];
out vec4 fragColor;

float fractSafe(float x) {
  return x - floor(x);
}

float hash31(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = x - i;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

float fbm3(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise3(p);
    p = p * 2.03 + vec3(13.1, 7.7, 5.3);
    a *= 0.5;
  }
  return v / 0.875;
}
`;

  const SCENE_GLSL_2 = `
float fbm4(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise3(p);
    p = p * 2.05 + vec3(7.3, 19.1, 11.7);
    a *= 0.5;
  }
  return v / 0.9375;
}

float diskHalfHeight(float rxz) {
  return 0.084 + 0.041 * pow(max(rxz - 1.7, 0.0), 0.80);
}

float samplePhaseCloud(float rxz, float py, float theta, float tau) {
  float shearRate = 0.64 * pow(max(rxz, 1.6), -1.05);
  float inflowRate = 0.42 / (0.55 + 0.24 * rxz);
  float rk = max(rxz + inflowRate * tau, 1.15);
  float ang = theta - shearRate * tau + 0.46 * log(rk);

  vec3 q = vec3(rk * cos(ang), py * 2.60, rk * sin(ang)) * 0.56;
  vec3 warp = vec3(
    fbm3(q * 0.68 + vec3(1.7, 9.2, 3.4)),
    fbm3(q * 0.68 + vec3(8.3, 2.8, 5.1)),
    fbm3(q * 0.68 + vec3(4.1, 6.7, 9.8))
  ) - vec3(0.5);

  vec3 qw = q + warp * 1.12;
  float macroCloud = fbm3(qw * 0.46 + vec3(5.2, 1.9, 8.4));
  float billow = fbm4(qw * 1.18);
  float wispRaw = fbm4(qw * 2.35 + warp * 0.62);
  float wisps = 1.0 - abs(wispRaw * 2.0 - 1.0);

  float angRad = theta - 0.38 * shearRate * tau + 0.24 * log(rk);
  vec3 qRad = vec3(cos(angRad) * 2.65, sin(angRad) * 2.65, rk * 0.42 - py * 0.95) + warp * 0.58;
  float radialFlow = fbm3(qRad * 1.38);

  return 0.28 * macroCloud + 0.34 * billow + 0.20 * (wisps * wisps) + 0.18 * radialFlow;
}

struct GasSample {
  vec3 emission;
  float sigma;
};

GasSample evalDiskGas(vec3 p, vec3 rayDir, float time) {
  GasSample gs;
  gs.emission = vec3(0.0);
  gs.sigma = 0.0;

  float rxz = length(p.xz);
  if (rxz < 1.72 || rxz > 9.85) {
    return gs;
  }
  float h = diskHalfHeight(rxz);
  float yn = p.y / h;
  if (abs(yn) > 1.38) {
    return gs;
  }

  float vertEnv = exp(-1.90 * yn * yn) * smoothstep(1.38, 0.82, abs(yn));
  float theta = atan(p.z, p.x) - 0.058 * time;

  float ph0 = fractSafe(time / 24.0);
  float ph1 = fractSafe(time / 24.0 + 0.5);
  float w = 0.5 - 0.5 * cos(6.2831853 * ph0);

  float c0 = samplePhaseCloud(rxz, p.y, theta, (ph0 - 0.5) * 3.0);
  float c1 = samplePhaseCloud(rxz, p.y, theta, (ph1 - 0.5) * 3.0);
  float normW = inversesqrt(max(w * w + (1.0 - w) * (1.0 - w), 0.25));
  float turb = clamp((mix(c0 - 0.5, c1 - 0.5, w) * normW * 0.92) + 0.5, 0.0, 1.0);

  float smokeShape = smoothstep(0.22, 0.85, turb);
  float rInner = 2.08 + 0.30 * (turb - 0.5);
  float innerFade = smoothstep(rInner - 0.16, rInner + 0.62, rxz);
  float outerFade = 1.0 - smoothstep(4.1, 9.35, rxz + (turb - 0.5) * 1.55);
  float density = innerFade * outerFade * vertEnv * (0.09 + 1.48 * smokeShape);
  if (density <= 0.0005) {
    return gs;
  }
`;

  const SCENE_GLSL_3 = `
  float tempR = exp(-max(rxz - 2.15, 0.0) * 0.34);
  float corePlane = 1.0 - 0.24 * min(abs(yn), 1.0);
  float heat = clamp((0.52 * tempR + 0.54 * pow(smokeShape, 1.32)) * corePlane, 0.0, 1.0);

  float hueVar = smoothstep(0.30, 0.70, c0);
  vec3 colHot = vec3(0.95, 0.96, 1.00);
  vec3 colLav = vec3(0.80, 0.74, 0.96);
  vec3 colBlueViolet = vec3(0.68, 0.76, 0.98);
  vec3 colSilver = vec3(0.72, 0.75, 0.85);
  vec3 colOuter = vec3(0.40, 0.39, 0.58);

  vec3 midTint = mix(mix(colLav, colBlueViolet, hueVar), colSilver, 0.28);
  vec3 baseCol = mix(colOuter, midTint, smoothstep(0.06, 0.58, heat));
  baseCol = mix(baseCol, colHot, smoothstep(0.48, 0.96, heat));

  vec3 orbDir = normalize(vec3(p.z, 0.0, -p.x) + vec3(1e-5, 0.0, 0.0));
  float vOrb = clamp(0.80 * inversesqrt(max(rxz, 1.6)), 0.0, 0.56);
  float align = dot(-rayDir, orbDir) * vOrb;
  float beaming = clamp(1.0 + 0.56 * align, 0.68, 1.46);
  vec3 dopplerTint = mix(
    vec3(0.93, 0.88, 1.03),
    vec3(0.96, 0.99, 1.05),
    clamp(align + 0.5, 0.0, 1.0)
  );

  float energy = (1.65 + 3.15 * tempR * smokeShape) * (0.72 + 0.55 * smokeShape);
  gs.sigma = density * 3.85;
  gs.emission = baseCol * dopplerTint * beaming * density * energy;
  return gs;
}

vec3 evalStarLayer(vec3 dir, float scale, float densityProb, float pixAng, float streakMode) {
  vec3 sp = dir * scale;
  vec3 cell = floor(sp);
  vec3 rnd = hash33(cell + vec3(scale * 0.37));
  if (rnd.x > densityProb) {
    return vec3(0.0);
  }

  vec3 starGridPos = cell + vec3(0.26) + 0.48 * hash33(cell + vec3(19.7, 7.3, 3.1));
  vec3 starDir = normalize(starGridPos);
  vec3 diff = dir - starDir;

  float angSq = dot(diff, diff);
  float maxCellSig = 0.055 / scale;
  float sigma = clamp(pixAng * (0.68 + 0.35 * rnd.y), 0.00034, maxCellSig);

  if (streakMode > 0.5 && rnd.z > 0.80) {
    vec3 axis = normalize(vec3(0.22, 0.94, -0.25));
    vec3 tang = normalize(cross(starDir, axis) + vec3(1e-5));
    vec3 bitang = cross(starDir, tang);
    float along = dot(diff, tang);
    float perp = dot(diff, bitang);
    float streakLen = min(0.0038 + 0.0042 * rnd.y, 0.14 / scale);
    float clampedAlong = clamp(along, -streakLen * 0.2, streakLen);
    float residualAlong = along - clampedAlong;
    float taper = 1.0 - clamp((along + streakLen * 0.2) / (streakLen * 1.2), 0.0, 1.0) * 0.78;
    float trailFalloff = exp(-(residualAlong * residualAlong + perp * perp) / (2.0 * sigma * sigma));
    vec3 trailCol = mix(vec3(0.68, 0.75, 0.96), vec3(0.82, 0.79, 0.98), rnd.y);
    return trailCol * trailFalloff * taper * (0.14 + 0.20 * rnd.y);
  }

  float spot = exp(-angSq / (2.0 * sigma * sigma));
  float lum = pow(rnd.y, 3.4) * (0.12 + 0.58 * rnd.z);
  vec3 tint = mix(vec3(0.74, 0.80, 0.97), vec3(0.88, 0.85, 1.00), rnd.z);
  return tint * spot * lum;
}

vec3 evalStars(vec3 dirIn, float time, float pixAng) {
  float ang = 0.0016 * time;
  float ca = cos(ang);
  float sa = sin(ang);
  vec3 dir = normalize(vec3(
    ca * dirIn.x + sa * dirIn.z,
    dirIn.y,
    -sa * dirIn.x + ca * dirIn.z
  ));

  float bandPlane = abs(dot(dir, normalize(vec3(-0.28, 0.91, 0.30))));
  float bandBoost = exp(-bandPlane * 4.5);
  float dust = fbm3(dir * 3.4 + vec3(2.1, 5.4, 8.7));
  vec3 bg = vec3(0.0005, 0.0007, 0.0015) + vec3(0.0014, 0.0014, 0.0032) * bandBoost * dust;

  bg += evalStarLayer(dir, 142.0, 0.065 + 0.085 * bandBoost, pixAng, 0.0) * 0.42;
  bg += evalStarLayer(dir, 78.0, 0.042 + 0.050 * bandBoost, pixAng, 0.0) * 0.72;
  bg += evalStarLayer(dir, 36.0, 0.026, pixAng, 1.0) * 0.85;
  return bg;
}
`;

  const SCENE_GLSL_4 = `
vec3 geoAccel(vec3 p, float h2) {
  float r2 = max(dot(p, p), 0.09);
  float invR = inversesqrt(r2);
  float invR5 = invR * invR * invR * invR * invR;
  return (-1.5 * h2 * invR5) * p;
}

void main() {
  vec2 res = uParams[0].xy;
  float time = uParams[0].z;
  float fovScale = uParams[0].w;

  vec3 camPos = uParams[1].xyz;
  float camDist = uParams[1].w;
  vec3 camFwd = uParams[2].xyz;
  float offsetX = uParams[2].w;
  vec3 camRight = uParams[3].xyz;
  float offsetY = uParams[3].w;
  vec3 camUp = uParams[4].xyz;

  vec2 uv = gl_FragCoord.xy / res;
  float aspect = res.x / res.y;
  float px = (uv.x - offsetX) * aspect * 2.0 * fovScale;
  float py = (uv.y - offsetY) * 2.0 * fovScale;
  vec3 rd = normalize(camFwd + px * camRight + py * camUp);

  vec3 hVec = cross(camPos, rd);
  float h2 = dot(hVec, hVec);

  vec3 pos = camPos;
  vec3 vel = rd;
  vec3 acc = geoAccel(pos, h2);

  vec3 accum = vec3(0.0);
  float trans = 1.0;
  bool escaped = true;
  float rEscape = max(camDist * 1.45, 34.0);

  for (int step = 0; step < 228; step++) {
    float r = length(pos);
    if (r <= 1.006) {
      escaped = false;
      break;
    }
    if (r > rEscape && dot(pos, vel) > 0.0) {
      escaped = true;
      break;
    }

    float dt = 0.12;
    if (r > 13.5) {
      dt = clamp((r - 11.2) * 0.34, 0.20, 2.10);
    } else {
      float gravStep = clamp((r - 0.86) * 0.058, 0.020, 0.17);
      float rxz = length(pos.xz);
      dt = gravStep;
      if (rxz > 1.55 && rxz < 10.4) {
        float hLim = diskHalfHeight(rxz) * 1.45;
        float vGap = max(abs(pos.y) - hLim, 0.0);
        dt = min(gravStep, 0.032 + 0.20 * vGap);
      }
    }

    vec3 nextPos = pos + vel * dt + 0.5 * acc * (dt * dt);
    vec3 nextAcc = geoAccel(nextPos, h2);
    vec3 nextVel = vel + 0.5 * (acc + nextAcc) * dt;

    vec3 midP = 0.5 * (pos + nextPos);
    float midRxz = length(midP.xz);
    float slabY = 0.56;
    if (midRxz > 1.65 && midRxz < 11.0 && (min(abs(pos.y), abs(nextPos.y)) < slabY || pos.y * nextPos.y <= 0.0)) {
      vec3 segDir = nextPos - pos;
      float segLen = length(segDir);
      vec3 rayUnit = normalize(segDir + vec3(1e-6));
      float subDs = segLen / 3.0;
      for (int s = 0; s < 3; s++) {
        float frac = (float(s) + 0.5) / 3.0;
        vec3 sp = pos + segDir * frac;
        GasSample gas = evalDiskGas(sp, rayUnit, time);
        if (gas.sigma > 0.0004) {
          float st = exp(-gas.sigma * subDs);
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

  const SCENE_GLSL_5 = `
  float r0 = length(camPos);
  float invE = max(1.0 - h2 / max(r0 * r0 * r0, 1.0), 1e-4);
  float bEff = sqrt(h2 / invE);
  bool goingInward = dot(camPos, rd) < 0.0;
  if (goingInward && r0 > 1.55 && bEff < 2.5980762) {
    escaped = false;
  }

  if (goingInward && r0 > 1.55) {
    float worldPx = max(camDist * 2.0 * fovScale / res.y, 0.004);
    float db = bEff - 2.5980762;
    float ringW = max(1.25 * worldPx, 0.020);
    float ringCore = exp(-(db * db) / (ringW * ringW)) * smoothstep(-0.85 * worldPx, 0.12 * worldPx, db);
    float haloW = max(4.2 * worldPx, 0.085);
    float ringHalo = exp(-max(db, 0.0) / haloW) * smoothstep(-0.45 * worldPx, 0.55 * worldPx, db);
    float spinAlign = clamp(hVec.y * inversesqrt(max(h2, 1e-5)), -1.0, 1.0);
    float ringAsym = 1.0 + 0.24 * spinAlign;
    vec3 ringCol = mix(vec3(0.76, 0.74, 0.96), vec3(0.96, 0.97, 1.00), ringCore);
    float ringVis = pow(clamp(trans, 0.0, 1.0), 2.8);
    accum += ringVis * ringCol * ringAsym * (0.88 * ringCore + 0.18 * ringHalo);
  }

  if (escaped && trans > 0.002) {
    float pixAng = 2.0 * fovScale / res.y;
    vec3 starDir = normalize(vel);
    float causticFade = 1.0;
    if (goingInward && r0 > 1.55) {
      vec3 antiAxis = -normalize(camPos);
      float einsteinGuard = smoothstep(0.022, 0.115, length(starDir - antiAxis));
      causticFade = smoothstep(3.1, 6.8, bEff) * einsteinGuard;
    }
    vec3 skyCol = evalStars(starDir, time, pixAng);
    accum += trans * (vec3(0.0005, 0.0007, 0.0015) + (skyCol - vec3(0.0005, 0.0007, 0.0015)) * causticFade);
  }

  fragColor = vec4(max(accum, vec3(0.0)), 1.0);
}
`;

  const COMPOSITE_GLSL = `#version 300 es
precision highp float;

uniform vec4 uParams[5];
uniform sampler2D uHdrTex;
out vec4 fragColor;

vec3 softBright(vec3 c) {
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float w = smoothstep(0.32, 1.85, lum);
  return c * w;
}

void main() {
  vec2 res = uParams[0].xy;
  vec2 uv = gl_FragCoord.xy / res;
  float aspect = res.x / res.y;
  vec3 base = texture(uHdrTex, uv).rgb;

  vec3 glow = vec3(0.0);
  float wSum = 0.0;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float rNorm = sqrt((fi + 0.5) / 16.0);
    float ang = fi * 2.3999632;
    float rad = rNorm * 0.034;
    vec2 offs = vec2(cos(ang) / aspect, sin(ang)) * rad;
    vec3 sc = texture(uHdrTex, clamp(uv + offs, vec2(0.001), vec2(0.999))).rgb;
    float w = exp(-rNorm * rNorm * 2.1);
    glow += softBright(sc) * w;
    wSum += w;
  }
  glow /= max(wSum, 1e-4);

  float baseLum = dot(base, vec3(0.2126, 0.7152, 0.0722));
  float shadowGuard = smoothstep(0.0, 0.035, baseLum);
  vec3 hdr = base + glow * (0.045 + 0.095 * shadowGuard);

  float L = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  float Lm = (L * (1.0 + L / 5.2)) / (1.0 + L * 1.22);
  vec3 mapped = hdr * (Lm / max(L, 1e-5));
  vec3 whiteTint = vec3(Lm) * vec3(0.97, 0.98, 1.02);
  mapped = mix(mapped, whiteTint, smoothstep(0.46, 0.98, Lm) * 0.34);

  vec3 gamma = pow(clamp(mapped, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  fragColor = vec4(clamp(gamma + vec3(dither), vec3(0.0), vec3(1.0)), 1.0);
}
`;

  window.BH_GLSL = {
    vertex: VS_GLSL,
    scene: [SCENE_GLSL_1, SCENE_GLSL_2, SCENE_GLSL_3, SCENE_GLSL_4, SCENE_GLSL_5].join("\n"),
    composite: COMPOSITE_GLSL
  };
})();
