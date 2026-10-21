export interface DiskLook {
  brightness: number;
  speed: number;
  stretch: number;
  detail: number;
  turbulence: number;
  density: number;
  doppler: number;
  cloudScale: number;
  cloudSpeed: number;
  cloudStrength: number;
  spare0: number;
  spare1: number;
  spare2: number;
  spare3: number;
}

export interface StarLook {
  brightness: number;
  density: number;
  contrast: number;
  warmth: number;
  twinkle: number;
}

export interface BloomLook {
  strength: number;
  threshold: number;
  knee: number;
  radius: number;
}

export interface HeroSettings {
  cameraYaw: number;
  cameraY: number;
  distance: number;
  diskRadius: number;
  fov: number;
  centerX: number;
  centerY: number;
  cameraRoll: number;
  mouseYaw: number;
  centerFade: number;
  bloom: BloomLook;
  disk: DiskLook;
  stars: StarLook;
}

/** Shared deterministic production defaults for the browser and headless renderer. */
export function defaultHeroSettings(): HeroSettings {
  return {
    cameraYaw: -0.18,
    cameraY: 0.16,
    distance: 13.5,
    diskRadius: 9,
    fov: 1.55,
    centerX: 0.34,
    centerY: 0.12,
    cameraRoll: -0.05,
    mouseYaw: 0,
    centerFade: 0,
    bloom: { strength: 0.92, threshold: 0, knee: 0.18, radius: 1.45 },
    disk: {
      brightness: 0.9,
      speed: 0.75,
      stretch: 5.75,
      detail: 3.44,
      turbulence: 4.46,
      density: 1.38,
      doppler: 1.21,
      cloudScale: 20,
      cloudSpeed: 0.3,
      cloudStrength: 0.2,
      spare0: 0.43,
      spare1: -0.25,
      spare2: -0.67,
      spare3: 0.69,
    },
    stars: { brightness: 0.78, density: 0.92, contrast: 13, warmth: 0.38, twinkle: 0 },
  };
}
