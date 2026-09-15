/**
 * Mobile Performance System & Adaptive Quality Controller
 * Automatically detects device capabilities, monitors real-time FPS,
 * and dynamically adapts rendering quality, shadow passes, particle density,
 * and simulation throttling to ensure a stable 30 FPS on low-end phones
 * and 60 FPS on capable devices.
 */

export type QualityTier = 0 | 1 | 2 | 3; // 0: Minimal/Recovery, 1: Low, 2: Medium, 3: High

export interface QualityConfig {
  tier: QualityTier;
  label: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  maxDPR: number;
  shadowsEnabled: boolean;
  directionalShadowMapSize: number;
  flashlightShadows: boolean;
  flashlightShadowMapSize: number;
  streetLightShadows: boolean;
  particleLimit: number;
  particleMultiplier: number;
  zombieFullUpdateDistance: number;
  zombieThrottleDistance: number;
  zombieAnimateLimbsDistance: number;
  enablePickupPointLights: boolean;
}

export const QUALITY_CONFIGS: Record<QualityTier, QualityConfig> = {
  3: {
    tier: 3,
    label: 'HIGH',
    maxDPR: 1.5,
    shadowsEnabled: true,
    directionalShadowMapSize: 2048,
    flashlightShadows: true,
    flashlightShadowMapSize: 1024,
    streetLightShadows: true,
    particleLimit: 150,
    particleMultiplier: 1.0,
    zombieFullUpdateDistance: 32,
    zombieThrottleDistance: 55,
    zombieAnimateLimbsDistance: 45,
    enablePickupPointLights: true,
  },
  2: {
    tier: 2,
    label: 'MEDIUM',
    maxDPR: 1.15,
    shadowsEnabled: true,
    directionalShadowMapSize: 1024,
    flashlightShadows: true,
    flashlightShadowMapSize: 512,
    streetLightShadows: false, // Huge win on mobile: disable dynamic spotlight shadows while preserving illumination
    particleLimit: 80,
    particleMultiplier: 0.65,
    zombieFullUpdateDistance: 24,
    zombieThrottleDistance: 42,
    zombieAnimateLimbsDistance: 32,
    enablePickupPointLights: false,
  },
  1: {
    tier: 1,
    label: 'LOW',
    maxDPR: 1.0,
    shadowsEnabled: true,
    directionalShadowMapSize: 512,
    flashlightShadows: false, // Turn off flashlight shadowmap pass on mobile
    flashlightShadowMapSize: 512,
    streetLightShadows: false,
    particleLimit: 45,
    particleMultiplier: 0.4,
    zombieFullUpdateDistance: 18,
    zombieThrottleDistance: 32,
    zombieAnimateLimbsDistance: 22,
    enablePickupPointLights: false,
  },
  0: {
    tier: 0,
    label: 'MINIMAL',
    maxDPR: 0.85,
    shadowsEnabled: false, // Disable shadow pass completely during severe frame drops
    directionalShadowMapSize: 512,
    flashlightShadows: false,
    flashlightShadowMapSize: 512,
    streetLightShadows: false,
    particleLimit: 25,
    particleMultiplier: 0.25,
    zombieFullUpdateDistance: 14,
    zombieThrottleDistance: 24,
    zombieAnimateLimbsDistance: 16,
    enablePickupPointLights: false,
  },
};

export class PerformanceManager {
  public isMobile: boolean = false;
  public isLowEnd: boolean = false;
  public targetFPS: number = 60;
  public currentTier: QualityTier = 3;
  public config: QualityConfig = QUALITY_CONFIGS[3];

  // Real-time metrics
  public fps: number = 60;
  public frameTimeMs: number = 16.6;
  public activeZombiesCount: number = 0;
  public activeParticlesCount: number = 0;

  // FPS tracking
  private frameTimes: number[] = [];
  private lastTimestamp: number = performance.now();
  private maxHistory: number = 45;

  // Adaptive tuning timers
  private dropTimer: number = 0;
  private recoverTimer: number = 0;
  private maxAllowedTier: QualityTier = 3;
  private onQualityChangeCallback?: (config: QualityConfig) => void;

  // Developer Monitor State
  public showDevMonitor: boolean = false;

  constructor(onQualityChange?: (config: QualityConfig) => void) {
    this.onQualityChangeCallback = onQualityChange;
    this.detectDevice();
  }

  private detectDevice() {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
    const smallScreen = Math.min(window.screen.width, window.screen.height) < 768;

    this.isMobile = isMobileUA || (isTouch && smallScreen);

    // Hardware concurrency check
    const cores = navigator.hardwareConcurrency || 4;
    // Memory check if supported by Chromium
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

    // Detect low-end
    if (this.isMobile) {
      if (cores <= 4 || (memory !== undefined && memory <= 4) || window.screen.width < 400) {
        this.isLowEnd = true;
      }
    }

    if (this.isLowEnd) {
      this.targetFPS = 30;
      this.maxAllowedTier = 1;
      this.setTier(1);
    } else if (this.isMobile) {
      this.targetFPS = 60;
      this.maxAllowedTier = 2;
      this.setTier(2);
    } else {
      this.targetFPS = 60;
      this.maxAllowedTier = 3;
      this.setTier(3);
    }
  }

  public setTier(tier: QualityTier) {
    this.currentTier = tier;
    this.config = QUALITY_CONFIGS[tier];
    if (this.onQualityChangeCallback) {
      this.onQualityChangeCallback(this.config);
    }
  }

  public toggleDevMonitor() {
    this.showDevMonitor = !this.showDevMonitor;
    return this.showDevMonitor;
  }

  /**
   * Called once per frame in the main game loop
   */
  public update(delta: number, zombieCount: number, particleCount: number) {
    this.activeZombiesCount = zombieCount;
    this.activeParticlesCount = particleCount;

    const now = performance.now();
    const frameDelta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    if (frameDelta > 0 && frameDelta < 200) {
      this.frameTimes.push(frameDelta);
      if (this.frameTimes.length > this.maxHistory) {
        this.frameTimes.shift();
      }

      // Compute rolling average
      let sum = 0;
      for (let i = 0; i < this.frameTimes.length; i++) {
        sum += this.frameTimes[i];
      }
      this.frameTimeMs = sum / this.frameTimes.length;
      this.fps = 1000 / Math.max(0.1, this.frameTimeMs);
    }

    // Adaptive Quality Step Down/Up
    // Low-end targets 30 FPS: drops if < 26. Standard targets 60 FPS: drops if < 42
    const dropThreshold = this.targetFPS === 30 ? 25 : 40;
    const recoverThreshold = this.targetFPS === 30 ? 30 : 54;

    if (this.fps < dropThreshold) {
      this.dropTimer += delta;
      this.recoverTimer = 0;
      if (this.dropTimer > 2.2) {
        // Degrade quality by 1 step if possible
        if (this.currentTier > 0) {
          this.setTier((this.currentTier - 1) as QualityTier);
        }
        this.dropTimer = 0;
      }
    } else if (this.fps >= recoverThreshold) {
      this.recoverTimer += delta;
      this.dropTimer = 0;
      if (this.recoverTimer > 6.0) {
        // Upgrade quality by 1 step up to device ceiling
        if (this.currentTier < this.maxAllowedTier) {
          this.setTier((this.currentTier + 1) as QualityTier);
        }
        this.recoverTimer = 0;
      }
    } else {
      this.dropTimer = Math.max(0, this.dropTimer - delta * 0.5);
      this.recoverTimer = Math.max(0, this.recoverTimer - delta * 0.5);
    }
  }
}
