import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';
import {
  GameSettings,
  ObjectiveState,
  PickupData,
  PlayerStats,
  WeaponConfig,
  WeaponId,
  WeaponState,
} from '../types/game';
import { buildEnvironment, EnvironmentData, InteractivePoint, WorldObstacle } from './Environment';
import { HazardInstance, HazardManager } from './Hazards';
import { ParticleSystem } from './Particles';
import { PickupManager } from './Pickups';
import { createWeaponMesh, INITIAL_WEAPONS } from './Weapons';
import { ZombieInstance, ZombieManager } from './Zombies';
import { TrapManager } from './Traps';
import { CRAFTING_RECIPES, canCraftRecipe } from './Crafting';
import {
  AudioLog,
  AudioLogPlaybackState,
  CraftingMaterials,
  CraftingRecipe,
  SkillId,
  SkillTreeState,
  TrapType,
  WeaponModState,
} from '../types/game';
import { AudioLogManager } from './AudioLogs';
import { PerformanceManager, QualityConfig } from './PerformanceManager';
import { SpatialObstacleGrid } from './SpatialGrid';
import {
  INITIAL_SKILL_TREE_STATE,
  applySkillUpgrade,
  canUpgradeSkill,
  getExplosiveMultiplier,
  getExtraTrapUses,
  getHeadshotDamageMultiplierBonus,
  getHealthRegenRate,
  getMaxHealthBonus,
  getMovementSpeedMultiplier,
  getReloadSpeedMultiplier,
  getScavengerBonus,
  getStaminaRegenMultiplier,
  getTrapPlacementRange,
  respecSkillTree,
} from './SkillTree';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onWeaponsUpdate: (activeWeapon: WeaponConfig, state: WeaponState, inventory: WeaponId[]) => void;
  onWaveUpdate: (wave: number, remainingZombies: number, isIntermission: boolean, nextWaveIn: number) => void;
  onObjectiveUpdate: (objective: ObjectiveState) => void;
  onInteractPrompt: (prompt: string | null) => void;
  onOpenUpgradeStation: () => void;
  onHitMarker: (isHeadshot: boolean) => void;
  onDamageTaken: () => void;
  onGameOver: (finalStats: { score: number; kills: number; headshots: number; wave: number }) => void;
  onVictory: (finalStats: { score: number; kills: number; headshots: number; wave: number }) => void;
  onMaterialsUpdate?: (materials: CraftingMaterials) => void;
  onTrapInventoryUpdate?: (traps: Record<TrapType, number>, isPlacing: boolean, activeType: TrapType | null) => void;
  onBlueprintsUpdate?: (blueprints: string[]) => void;
  onModsUpdate?: (mods: WeaponModState) => void;
  onSkillTreeUpdate?: (treeState: SkillTreeState) => void;
  onOpenSkillTree?: () => void;
  onAudioLogPlaybackUpdate?: (playback: AudioLogPlaybackState | null) => void;
  onAudioLogsUpdate?: (logs: AudioLog[]) => void;
  onOpenAudioLogArchive?: () => void;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Environment & Subsystems
  private envData: EnvironmentData;
  private particles: ParticleSystem;
  private zombieManager: ZombieManager;
  private pickupManager: PickupManager;
  private hazardManager: HazardManager;
  public trapManager: TrapManager;
  public audioLogManager: AudioLogManager;

  // Crafting, Blueprints, & Mods
  public craftingMaterials: CraftingMaterials = {
    scrapMetal: 12,
    electronics: 6,
    chemicals: 4,
    weaponParts: 2,
  };
  public unlockedBlueprints: string[] = ['blueprint_bear_trap', 'blueprint_flamethrower'];
  public weaponMods: WeaponModState = {
    hasDrumMag: false,
    hasCompensator: false,
    hasIncendiary: false,
    hasShockCoil: false,
  };

  // Passive Skill Tree Progression & Permanent Attributes
  public skillTreeState: SkillTreeState = JSON.parse(JSON.stringify(INITIAL_SKILL_TREE_STATE));

  // Player Physics & Smooth Kinematics
  public playerPos = new THREE.Vector3(0, 1.7, 10);
  private playerVel = new THREE.Vector3();
  private horizontalVel = new THREE.Vector2(); // Smoothed velocity x, z
  private isGrounded = true;
  private cameraPitch = 0; // Current rendered pitch
  private cameraYaw = 0; // Current rendered yaw
  private targetCameraPitch = 0; // Target mouse look pitch
  private targetCameraYaw = 0; // Target mouse look yaw
  private cameraPitchVelocity = 0;
  private cameraYawVelocity = 0;
  private currentEyeHeight = 1.7;
  private landingDip = 0;
  private walkCycle = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private isPointerLocked = false;
  private flashlight: THREE.SpotLight;

  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    isCrouching: false,
    score: 0,
    cash: 300,
    kills: 0,
    headshots: 0,
  };

  public settings: GameSettings = {
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.0035,
    touchControls: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    volume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.5,
    viewMode: 'first',
    flashlightOn: true,
    bloodParticles: true,
  };

  // Mobile Touch Controls
  public mobileMoveVector = { x: 0, y: 0 };
  public mobileSprint = false;
  public mobileCrouch = false;

  // Weapons & Inventory
  public inventory: WeaponId[] = ['pistol'];
  public activeWeaponId: WeaponId = 'pistol';
  public weaponConfigs: Record<WeaponId, WeaponConfig>;
  public weaponStates: Record<WeaponId, WeaponState>;
  private weaponMeshGroup: THREE.Group = new THREE.Group();
  private currentWeaponMesh: THREE.Group | null = null;
  private weaponRecoilOffset = new THREE.Vector3();
  private weaponRecoilRot = new THREE.Vector3();
  private recoilSpringVel = new THREE.Vector3();
  private recoilSpringRotVel = new THREE.Vector3();
  private swayOffset = new THREE.Vector3();
  private swayRot = new THREE.Vector3();
  private cameraRecoilKick = 0;
  private isAimingDownSights = false;
  private isFiring = false;

  // Scratch objects for zero-allocation loops
  private scratchVec = new THREE.Vector3();
  private scratchVec2 = new THREE.Vector3();
  private scratchBox = new THREE.Box3();
  private scratchBoxX = new THREE.Box3();
  private scratchBoxZ = new THREE.Box3();
  private scratchBoxCenter = new THREE.Vector3();
  private scratchBoxSize = new THREE.Vector3(1.0, 1.8, 1.0);
  private sharedRaycaster = new THREE.Raycaster();

  // Wave & Objective
  public wave = 1;
  public zombiesToSpawn = 0;
  public spawnTimer = 0;
  public isIntermission = false;
  public intermissionTimer = 0;
  public objective: ObjectiveState = {
    type: 'survive',
    description: 'Survive the undead onslaught. Search crates for weapons and ammo.',
    currentProgress: 1,
    targetProgress: 5,
    extractionReady: false,
    extractionCountdown: 60,
    extractionX: 0,
    extractionZ: -56,
  };

  // Active interaction
  private activeInteractable: InteractivePoint | null = null;
  private activeHazard: HazardInstance | null = null;
  private isRunning = false;
  private lastTime = performance.now();
  private keys: Record<string, boolean> = {};

  // Performance & Optimization
  public performanceManager: PerformanceManager;
  private obstacleGrid: SpatialObstacleGrid;
  private nearbyObstaclesBuffer: WorldObstacle[] = [];
  private animFrameId: number | null = null;
  private lastInteractPrompt: string | null = null;
  private devMonitorEl: HTMLDivElement | null = null;
  private lastDevMonitorUpdate: number = 0;

  // Bound event listener references for leak-free disposal
  private handleKeyDown!: (e: KeyboardEvent) => void;
  private handleKeyUp!: (e: KeyboardEvent) => void;
  private handleMouseDown!: (e: MouseEvent) => void;
  private handleMouseUp!: (e: MouseEvent) => void;
  private handleMouseMove!: (e: MouseEvent) => void;
  private handleWheel!: (e: WheelEvent) => void;
  private handleContextMenu!: (e: MouseEvent) => void;
  private handlePointerLockChange!: () => void;
  private handlePointerLockError!: () => void;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Deep copy weapons
    this.weaponConfigs = JSON.parse(JSON.stringify(INITIAL_WEAPONS));
    this.weaponStates = {
      pistol: {
        currentMag: this.weaponConfigs.pistol.magazineSize,
        reserveAmmo: 60,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
      shotgun: {
        currentMag: this.weaponConfigs.shotgun.magazineSize,
        reserveAmmo: 24,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
      rifle: {
        currentMag: this.weaponConfigs.rifle.magazineSize,
        reserveAmmo: 120,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
      marksman: {
        currentMag: this.weaponConfigs.marksman.magazineSize,
        reserveAmmo: 30,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
      flamethrower: {
        currentMag: this.weaponConfigs.flamethrower.magazineSize,
        reserveAmmo: 200,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
      arc_rifle: {
        currentMag: this.weaponConfigs.arc_rifle.magazineSize,
        reserveAmmo: 40,
        isReloading: false,
        reloadProgress: 0,
        lastFired: 0,
        level: 1,
      },
    };

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      200
    );

    // Performance Manager (Device detection & dynamic tier controller)
    this.performanceManager = new PerformanceManager((config) => this.applyQualityConfig(config));

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.performanceManager.isMobile,
      powerPreference: 'high-performance',
      precision: this.performanceManager.isMobile ? 'mediump' : 'highp',
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.performanceManager.config.maxDPR));
    this.renderer.shadowMap.enabled = this.performanceManager.config.shadowsEnabled;
    this.renderer.shadowMap.type = this.performanceManager.isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Particles
    this.particles = new ParticleSystem(this.scene);

    // Environment
    this.envData = buildEnvironment(this.scene);

    // Spatial partitioning for ultra-fast obstacle queries
    this.obstacleGrid = new SpatialObstacleGrid(this.envData.obstacles, 10, 80);

    // Subsystems
    this.zombieManager = new ZombieManager(this.scene, this.particles);
    this.zombieManager.setObstacles(this.envData.obstacles);
    this.pickupManager = new PickupManager(this.scene);
    this.hazardManager = new HazardManager(this.scene, this.particles);
    this.trapManager = new TrapManager(this.scene, this.particles);
    this.trapManager.maxPlacementRange = getTrapPlacementRange(this.skillTreeState.ranks);
    this.trapManager.extraTrapUses = getExtraTrapUses(this.skillTreeState.ranks);
    this.trapManager.extraPinDuration = (this.skillTreeState.ranks.reinforced_traps || 0) * 1.5;
    this.trapManager.explosiveMultiplier = getExplosiveMultiplier(this.skillTreeState.ranks);

    // Audio Logs & Lore System
    this.audioLogManager = new AudioLogManager(
      (playback) => this.callbacks.onAudioLogPlaybackUpdate?.(playback),
      (logs) => this.callbacks.onAudioLogsUpdate?.(logs)
    );
    this.audioLogManager.registerInstances(this.scene);

    // Player Flashlight
    this.flashlight = new THREE.SpotLight(0xf5f3ce, 4.5, 38, Math.PI / 6, 0.4, 1.2);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);

    // Weapon ViewModel Camera Attachment
    this.camera.add(this.weaponMeshGroup);
    this.scene.add(this.camera);

    // Apply device quality configuration
    this.applyQualityConfig(this.performanceManager.config);
    this.initDevMonitor();

    this.switchWeapon(this.activeWeaponId);
    this.notifyMaterialsUpdate();
    this.notifyTrapUpdate();
    this.notifyBlueprintsUpdate();
    this.notifyModsUpdate();
    this.notifySkillTreeUpdate();
    this.callbacks.onAudioLogsUpdate?.(this.audioLogManager.logs);

    // Events
    this.setupEventListeners();

    // Start wave 1
    this.startWave(1);
    this.isRunning = true;
    this.animate();
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize);

    this.handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      // Developer Performance Monitor Toggle (F3 or Backquote/Tilde)
      if (e.code === 'F3' || e.code === 'Backquote') {
        this.performanceManager.toggleDevMonitor();
      }

      // Weapon hotkeys
      if (e.code === 'Digit1') this.switchWeapon('pistol');
      if (e.code === 'Digit2' && this.inventory.includes('shotgun')) this.switchWeapon('shotgun');
      if (e.code === 'Digit3' && this.inventory.includes('rifle')) this.switchWeapon('rifle');
      if (e.code === 'Digit4' && this.inventory.includes('marksman')) this.switchWeapon('marksman');
      if (e.code === 'Digit5' && this.inventory.includes('flamethrower')) this.switchWeapon('flamethrower');
      if (e.code === 'Digit6' && this.inventory.includes('arc_rifle')) this.switchWeapon('arc_rifle');

      // Trap hotkeys & quick deployment
      if (e.code === 'KeyT') {
        if (this.trapManager.isPlacing) {
          this.trapManager.cancelPlacement();
          this.notifyTrapUpdate();
        } else {
          // Find first available trap in inventory
          const inv = this.trapManager.inventory;
          const trap: TrapType = inv.bear_trap > 0 ? 'bear_trap' : (inv.spike_strip > 0 ? 'spike_strip' : 'pipe_bomb');
          this.startPlacingTrap(trap);
        }
      }
      if (e.code === 'KeyB') {
        this.startPlacingTrap('bear_trap');
      }
      if (e.code === 'KeyX') {
        this.startPlacingTrap('spike_strip');
      }
      if (e.code === 'KeyG') {
        this.startPlacingTrap('pipe_bomb');
      }
      if (e.code === 'Escape' && this.trapManager.isPlacing) {
        this.trapManager.cancelPlacement();
        this.notifyTrapUpdate();
      }

      // Jump buffer
      if (e.code === 'Space') {
        this.jumpBufferTimer = 0.16;
      }

      // Reload
      if (e.code === 'KeyR') this.reloadActiveWeapon();

      // Flashlight toggle
      if (e.code === 'KeyF') {
        this.settings.flashlightOn = !this.settings.flashlightOn;
        this.flashlight.visible = this.settings.flashlightOn;
      }

      // Viewmode toggle
      if (e.code === 'KeyV') {
        this.settings.viewMode = this.settings.viewMode === 'first' ? 'third' : 'first';
      }

      // Skill tree hotkey
      if (e.code === 'KeyK') {
        this.exitPointerLock();
        this.callbacks.onOpenSkillTree?.();
      }

      // Audio Logs archive hotkey
      if (e.code === 'KeyL') {
        this.exitPointerLock();
        this.callbacks.onOpenAudioLogArchive?.();
      }

      // Interaction
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    // Mouse Controls
    this.handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click: If placing trap, confirm placement
        if (this.trapManager.isPlacing) {
          const placed = this.trapManager.confirmPlacement(this.playerPos, this.cameraYaw);
          if (placed) {
            this.notifyTrapUpdate();
          }
          return;
        }

        // Left click: Gunshot
        this.isFiring = true;
        this.fireActiveWeapon();
      } else if (e.button === 2) {
        // Right click: If placing trap, cancel placement
        if (this.trapManager.isPlacing) {
          this.trapManager.cancelPlacement();
          this.notifyTrapUpdate();
          return;
        }

        // Right click ADS
        this.isAimingDownSights = true;
      }
    };

    this.handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isFiring = false;
      } else if (e.button === 2) {
        this.isAimingDownSights = false;
      }
    };

    this.handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Mouse movement with smooth target look and proportional ADS precision
    this.handleMouseMove = (e: MouseEvent) => {
      if (this.isPointerLocked) {
        const adsFactor = this.isAimingDownSights ? 0.62 : 1.0;
        const sens = this.settings.mouseSensitivity * adsFactor;
        this.targetCameraYaw -= e.movementX * sens;
        this.targetCameraPitch -= e.movementY * sens;
        this.targetCameraPitch = Math.max(-1.48, Math.min(1.48, this.targetCameraPitch));

        // Update trap placement preview raycast if placing
        if (this.trapManager.isPlacing) {
          this.trapManager.updatePlacementPreview(this.camera, this.playerPos);
        }
      }
    };

    // Mouse wheel weapon switch
    this.handleWheel = (e: WheelEvent) => {
      const idx = this.inventory.indexOf(this.activeWeaponId);
      if (e.deltaY > 0) {
        const nextIdx = (idx + 1) % this.inventory.length;
        this.switchWeapon(this.inventory[nextIdx]);
      } else {
        const prevIdx = (idx - 1 + this.inventory.length) % this.inventory.length;
        this.switchWeapon(this.inventory[prevIdx]);
      }
    };

    this.handlePointerLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
    };

    this.handlePointerLockError = () => {
      // Silently handle pointer lock browser restrictions
    };

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.container.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.container.addEventListener('wheel', this.handleWheel);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
  }

  private initDevMonitor() {
    this.devMonitorEl = document.createElement('div');
    this.devMonitorEl.id = 'dev-perf-monitor';
    this.devMonitorEl.style.cssText = `
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 9999;
      background: rgba(10, 15, 24, 0.88);
      border: 1px solid rgba(34, 197, 94, 0.5);
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      border-radius: 6px;
      padding: 8px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.45;
      color: #4ade80;
      pointer-events: none;
      user-select: none;
      display: none;
      white-space: pre;
    `;
    this.container.appendChild(this.devMonitorEl);
  }

  public togglePerformanceMonitor(): boolean {
    return this.performanceManager.toggleDevMonitor();
  }

  public applyQualityConfig(config: QualityConfig) {
    if (!this.renderer) return;

    // Viewport resolution & pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxDPR));

    // Shadow rendering
    this.renderer.shadowMap.enabled = config.shadowsEnabled;

    if (this.envData?.moonLight) {
      this.envData.moonLight.castShadow = config.shadowsEnabled;
      if (this.envData.moonLight.shadow?.map) {
        this.envData.moonLight.shadow.mapSize.set(config.directionalShadowMapSize, config.directionalShadowMapSize);
      }
    }

    if (this.envData?.streetLights) {
      for (let i = 0; i < this.envData.streetLights.length; i++) {
        this.envData.streetLights[i].castShadow = config.streetLightShadows;
      }
    }

    if (this.flashlight) {
      this.flashlight.castShadow = config.flashlightShadows;
      if (this.flashlight.shadow?.map) {
        this.flashlight.shadow.mapSize.set(config.flashlightShadowMapSize, config.flashlightShadowMapSize);
      }
    }

    // Particle pool limits
    if (this.particles) {
      this.particles.setQuality(config.particleLimit, config.particleMultiplier);
    }

    // Zombie AI throttling & max counts
    if (this.zombieManager) {
      this.zombieManager.setQuality(config);
    }

    // Pickup lights
    if (this.pickupManager) {
      this.pickupManager.enableLights = config.enablePickupPointLights;
    }
  }

  public requestPointerLock() {
    if (!this.container) return;
    try {
      const promise = this.container.requestPointerLock() as unknown as Promise<void> | undefined;
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Handled gracefully when user gesture is required or lock is denied
        });
      }
    } catch {
      // Handled gracefully
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // --- WEAPONS & SHOOTING ---

  public switchWeapon(weaponId: WeaponId) {
    if (!this.inventory.includes(weaponId)) return;
    this.activeWeaponId = weaponId;

    if (this.currentWeaponMesh) {
      this.weaponMeshGroup.remove(this.currentWeaponMesh);
    }

    this.currentWeaponMesh = createWeaponMesh(weaponId);
    this.weaponMeshGroup.add(this.currentWeaponMesh);

    // Initial positioning relative to camera
    this.updateWeaponPosition(0);

    const cfg = this.weaponConfigs[weaponId];
    const st = this.weaponStates[weaponId];
    this.callbacks.onWeaponsUpdate(cfg, st, this.inventory);
  }

  public reloadActiveWeapon() {
    const cfg = this.weaponConfigs[this.activeWeaponId];
    const st = this.weaponStates[this.activeWeaponId];

    if (st.isReloading) return;
    if (st.currentMag >= cfg.magazineSize) return;
    if (st.reserveAmmo <= 0) return;

    st.isReloading = true;
    st.reloadProgress = 0;
    soundManager.playReload();
  }

  // --- MOBILE TOUCH METHODS ---

  public setMobileMove(x: number, y: number) {
    this.mobileMoveVector.x = Math.max(-1, Math.min(1, x));
    this.mobileMoveVector.y = Math.max(-1, Math.min(1, y));
  }

  public addLookDelta(deltaX: number, deltaY: number, sensitivityMultiplier = 1.0) {
    const adsFactor = this.isAimingDownSights ? 0.62 : 1.0;
    const sens = (this.settings.touchSensitivity || 0.0035) * adsFactor * sensitivityMultiplier;
    this.targetCameraYaw -= deltaX * sens;
    this.targetCameraPitch -= deltaY * sens;
    this.targetCameraPitch = Math.max(-1.48, Math.min(1.48, this.targetCameraPitch));

    if (this.trapManager.isPlacing) {
      this.trapManager.updatePlacementPreview(this.camera, this.playerPos);
    }
  }

  public setMobileFiring(firing: boolean) {
    if (firing) {
      if (this.trapManager.isPlacing) {
        const placed = this.trapManager.confirmPlacement(this.playerPos, this.cameraYaw);
        if (placed) {
          this.notifyTrapUpdate();
        }
        return;
      }
      this.isFiring = true;
      this.fireActiveWeapon();
    } else {
      this.isFiring = false;
    }
  }

  public toggleAimDownSights(force?: boolean): boolean {
    this.isAimingDownSights = force !== undefined ? force : !this.isAimingDownSights;
    return this.isAimingDownSights;
  }

  public getIsAimingDownSights(): boolean {
    return this.isAimingDownSights;
  }

  public triggerJump() {
    this.jumpBufferTimer = 0.20;
  }

  public triggerSprintToggle(force?: boolean): boolean {
    this.mobileSprint = force !== undefined ? force : !this.mobileSprint;
    return this.mobileSprint;
  }

  public triggerCrouchToggle(force?: boolean): boolean {
    this.mobileCrouch = force !== undefined ? force : !this.mobileCrouch;
    return this.mobileCrouch;
  }

  public triggerInteraction() {
    this.handleInteraction();
  }

  public toggleFlashlight(): boolean {
    this.settings.flashlightOn = !this.settings.flashlightOn;
    this.flashlight.visible = this.settings.flashlightOn;
    return this.settings.flashlightOn;
  }

  public toggleViewMode(): 'first' | 'third' {
    this.settings.viewMode = this.settings.viewMode === 'first' ? 'third' : 'first';
    return this.settings.viewMode;
  }

  private fireActiveWeapon() {
    const cfg = this.weaponConfigs[this.activeWeaponId];
    const st = this.weaponStates[this.activeWeaponId];
    const now = performance.now() / 1000;

    if (st.isReloading) return;
    if (now - st.lastFired < 1 / cfg.fireRate) return;

    if (st.currentMag <= 0) {
      soundManager.playDryFire();
      this.reloadActiveWeapon();
      return;
    }

    st.lastFired = now;
    st.currentMag--;

    // Dynamic spring recoil impulses
    const kickZ = cfg.id === 'marksman' ? 0.12 : (cfg.id === 'shotgun' ? 0.10 : 0.055);
    const kickPitch = cfg.id === 'marksman' ? 0.18 : (cfg.id === 'shotgun' ? 0.14 : 0.08);
    this.recoilSpringVel.z += kickZ * 14;
    this.recoilSpringVel.y += kickZ * 2.5;
    this.recoilSpringRotVel.x += kickPitch * 16;
    this.cameraRecoilKick += kickPitch * 0.25;

    // Sound
    soundManager.playGunshot(cfg.id);

    // Flashlight & muzzle flash using scratch vector
    this.scratchVec.set(0.2, -0.15, -0.6).applyMatrix4(this.camera.matrixWorld);
    this.particles.emitMuzzleFlash(this.scratchVec);

    // Raycast shots (single or shotgun multi-pellet)
    const pellets = cfg.pellets;
    const spread = this.isAimingDownSights ? cfg.spread * 0.35 : cfg.spread;

    for (let p = 0; p < pellets; p++) {
      this.shootRay(cfg, spread);
    }

    this.callbacks.onWeaponsUpdate(cfg, st, this.inventory);
  }

  private shootRay(cfg: WeaponConfig, spread: number) {
    // Camera center direction + spread
    this.scratchVec
      .set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        -1
      )
      .applyEuler(this.camera.rotation)
      .normalize();

    const tracerStart = new THREE.Vector3(0.2, -0.15, -0.5).applyMatrix4(this.camera.matrixWorld);
    const aliveZombies = this.zombieManager.getAliveZombies();

    // SPECIAL WEAPON: Dragon's Breath Flamethrower (Continuous torrent of flame)
    if (cfg.id === 'flamethrower') {
      this.particles.emitFlameSpray(tracerStart, this.scratchVec, 6);

      const forward = this.scratchVec.clone();
      let hitAny = false;

      for (let i = 0; i < aliveZombies.length; i++) {
        const z = aliveZombies[i];
        if (z.data.isDead) continue;
        const toZ = z.group.position.clone().sub(this.camera.position);
        const dist = toZ.length();
        if (dist <= cfg.range) {
          toZ.normalize();
          const angle = forward.angleTo(toZ);
          if (angle < 0.44) {
            // Within flame cone!
            hitAny = true;
            z.data.burningTimer = 3.5;
            const hitPos = z.group.position.clone().add(new THREE.Vector3(0, 1.1, 0));
            const result = this.zombieManager.damageZombie(z, cfg.damage, false, hitPos);

            this.stats.score += result.points;
            this.stats.cash += result.cash;

            if (result.killed) {
              this.stats.kills++;
              this.onZombieKilled();
            }
          }
        }
      }

      // Check environmental barrels in flame cone
      for (const h of this.hazardManager.hazards) {
        if (h.type === 'barrel' && h.state === 'ready') {
          const toH = h.position.clone().sub(this.camera.position);
          const dist = toH.length();
          if (dist <= cfg.range && forward.angleTo(toH.normalize()) < 0.44) {
            this.hazardManager.damageHazard(
              h,
              120,
              h.position,
              (z, dmg, isHead) => this.onHazardDamagedZombie(z, dmg, isHead),
              (pDmg) => this.onPlayerTakeDamage(pDmg)
            );
          }
        }
      }

      if (hitAny) {
        soundManager.playHitMarker(false);
        this.callbacks.onHitMarker(false);
        this.callbacks.onStatsUpdate(this.stats);
      }
      return;
    }

    this.sharedRaycaster.set(this.camera.position, this.scratchVec);
    this.sharedRaycaster.far = cfg.range;

    // Collect shootable targets (zombies + environmental hazards)
    const targetMeshes: THREE.Object3D[] = [];

    for (let i = 0; i < aliveZombies.length; i++) {
      const z = aliveZombies[i];
      targetMeshes.push(z.headMesh, z.bodyMesh);
    }
    targetMeshes.push(...this.hazardManager.hitMeshes);

    const intersects = this.sharedRaycaster.intersectObjects(targetMeshes, false);
    let hitPoint = this.camera.position.clone().addScaledVector(this.scratchVec, cfg.range);

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint = hit.point;

      const obj = hit.object;
      const hazardRef = (obj as unknown as { hazardRef?: HazardInstance }).hazardRef;

      if (hazardRef) {
        soundManager.playHitMarker(false);
        this.callbacks.onHitMarker(false);
        this.hazardManager.damageHazard(
          hazardRef,
          cfg.damage,
          hit.point,
          (z, dmg, isHead) => this.onHazardDamagedZombie(z, dmg, isHead),
          (pDmg) => this.onPlayerTakeDamage(pDmg)
        );
      } else {
        // Zombie hit
        const isHead = (obj as unknown as { isZombieHead: boolean }).isZombieHead;
        const zombieRef = (obj as unknown as { zombieRef: ZombieInstance }).zombieRef;

        if (zombieRef) {
          const headshotBonus = getHeadshotDamageMultiplierBonus(this.skillTreeState.ranks);
          const effectiveHeadshotMult = cfg.headshotMultiplier + headshotBonus;
          const damage = isHead ? Math.round(cfg.damage * effectiveHeadshotMult) : cfg.damage;

          // Status effects from weapon mods
          if (this.weaponMods.hasIncendiary) {
            zombieRef.data.burningTimer = 3.5;
          }
          if (this.weaponMods.hasShockCoil && Math.random() < 0.6) {
            zombieRef.data.shockTimer = 2.5;
            this.particles.emitSparks(hit.point, new THREE.Vector3(0, 1, 0), 6);
          }

          // SPECIAL WEAPON: Tesla Arc Plasma Cannon
          if (cfg.id === 'arc_rifle') {
            zombieRef.data.shockTimer = 3.5;

            // Chain electricity to up to 2 other nearby zombies
            let chained = 0;
            for (let j = 0; j < aliveZombies.length; j++) {
              const otherZ = aliveZombies[j];
              if (otherZ === zombieRef || otherZ.data.isDead) continue;
              if (otherZ.group.position.distanceTo(hitPoint) < 6.8) {
                chained++;
                otherZ.data.shockTimer = 3.5;
                const chainTarget = otherZ.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                this.particles.emitElectricBeam(hitPoint, chainTarget);
                const chainResult = this.zombieManager.damageZombie(otherZ, 85, false, chainTarget);
                this.stats.score += chainResult.points;
                this.stats.cash += chainResult.cash;
                if (chainResult.killed) {
                  this.stats.kills++;
                  this.onZombieKilled();
                }
                if (chained >= 2) break;
              }
            }
          }

          const result = this.zombieManager.damageZombie(
            zombieRef,
            damage,
            isHead,
            hit.point,
            hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0)
          );

          // Feedback
          soundManager.playHitMarker(isHead);
          this.callbacks.onHitMarker(isHead);

          this.stats.score += result.points;
          this.stats.cash += result.cash;

          if (result.killed) {
            this.stats.kills++;
            if (isHead) this.stats.headshots++;
            this.onZombieKilled();
          }

          this.callbacks.onStatsUpdate(this.stats);
        }
      }
    } else {
      // Check collision with pre-indexed world meshes
      const worldHits = this.sharedRaycaster.intersectObjects(this.envData.collidableMeshes, false);
      if (worldHits.length > 0) {
        const wHit = worldHits[0];
        hitPoint = wHit.point;
        if (wHit.face) {
          this.particles.emitSparks(wHit.point, wHit.face.normal);
        }
      }
    }

    if (cfg.id === 'arc_rifle') {
      this.particles.emitElectricBeam(tracerStart, hitPoint);
    } else {
      this.particles.createTracer(tracerStart, hitPoint);
    }
  }

  // --- WAVE & OBJECTIVES ---

  private startWave(waveNumber: number) {
    this.wave = waveNumber;
    this.isIntermission = false;
    soundManager.playWaveAlert();
    this.hazardManager.resetForWave();

    // Calculate zombie count based on wave
    const count = 6 + waveNumber * 5;
    this.zombiesToSpawn = count;

    if (this.wave === 5) {
      this.objective.description = 'EMERGENCY: Wave 5 reached! Evac Beacon on Helipad is ready to activate!';
      this.objective.extractionReady = true;
    } else if (this.wave > 5) {
      this.objective.description = 'ENDLESS SURVIVAL: Evacuate at the Helipad or fight for highest score!';
    } else {
      this.objective.description = `Survive Wave ${waveNumber}. Clear all undead to earn supplies.`;
    }

    this.callbacks.onWaveUpdate(this.wave, this.zombiesToSpawn + this.zombieManager.getAliveZombies().length, false, 0);
    this.callbacks.onObjectiveUpdate(this.objective);
  }

  private onZombieKilled() {
    const remaining = this.zombiesToSpawn + this.zombieManager.getAliveZombies().length;
    this.callbacks.onWaveUpdate(this.wave, remaining, this.isIntermission, this.intermissionTimer);

    // Passive Skill Tree: Track kills towards next skill point
    this.skillTreeState.killsTowardsNextPoint++;
    if (this.skillTreeState.killsTowardsNextPoint >= this.skillTreeState.killsPerPoint) {
      this.skillTreeState.killsTowardsNextPoint = 0;
      this.skillTreeState.availablePoints++;
      this.skillTreeState.totalPointsEarned++;
      soundManager.playSkillPointEarned();
    }
    this.notifySkillTreeUpdate();

    const scavBonus = getScavengerBonus(this.skillTreeState.ranks);

    // Chance to drop combat pickup (ammo, medkit, armor, cash)
    if (Math.random() < 0.28 * (1 + scavBonus)) {
      const types: ('ammo' | 'health' | 'armor' | 'cash')[] = ['ammo', 'cash', 'health', 'armor'];
      const pType = types[Math.floor(Math.random() * types.length)];
      const randX = (Math.random() - 0.5) * 1.5;
      const randZ = (Math.random() - 0.5) * 1.5;
      const cashAmount = Math.round(50 * (1 + scavBonus));
      this.pickupManager.spawnPickup(
        pType,
        new THREE.Vector3(this.playerPos.x + randX, 0, this.playerPos.z + randZ),
        pType === 'cash' ? cashAmount : 1
      );
    }

    // 40% chance (+ scavBonus) to drop scavenged crafting materials (scrap, electronics, chemicals, parts, blueprints)
    if (Math.random() < 0.40 * (1 + scavBonus)) {
      const roll = Math.random();
      let matType: 'scrap' | 'electronics' | 'chemicals' | 'parts' | 'blueprint' = 'scrap';
      if (roll < 0.45) {
        matType = 'scrap';
      } else if (roll < 0.70) {
        matType = 'electronics';
      } else if (roll < 0.88) {
        matType = 'chemicals';
      } else if (roll < 0.96) {
        matType = 'parts';
      } else {
        matType = 'blueprint';
      }

      const randX = (Math.random() - 0.5) * 1.8;
      const randZ = (Math.random() - 0.5) * 1.8;
      const scrapAmount = Math.round(3 * (1 + scavBonus));
      this.pickupManager.spawnPickup(
        matType,
        new THREE.Vector3(this.playerPos.x + randX, 0, this.playerPos.z + randZ),
        matType === 'scrap' ? scrapAmount : 1
      );
    }

    if (remaining <= 0 && !this.isIntermission) {
      // Wave Complete!
      this.isIntermission = true;
      this.intermissionTimer = 12; // 12 seconds intermission
      this.stats.cash += 250 + this.wave * 100;
      this.craftingMaterials.scrapMetal += 4;
      this.craftingMaterials.electronics += 2;
      this.craftingMaterials.chemicals += 1;

      // Wave completion awards +1 bonus Skill Point!
      this.skillTreeState.availablePoints++;
      this.skillTreeState.totalPointsEarned++;
      soundManager.playSkillPointEarned();

      this.notifyMaterialsUpdate();
      this.notifySkillTreeUpdate();
      this.callbacks.onStatsUpdate(this.stats);
    }
  }

  private onHazardDamagedZombie(zombie: ZombieInstance, damage: number, isHead: boolean) {
    if (zombie.data.isDead) return;
    const result = this.zombieManager.damageZombie(
      zombie,
      damage,
      isHead,
      zombie.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
      new THREE.Vector3(0, 1, 0)
    );
    this.stats.score += result.points;
    this.stats.cash += result.cash;
    if (result.killed) {
      this.stats.kills++;
      this.callbacks.onHitMarker(false);
      this.onZombieKilled();
    }
    this.callbacks.onStatsUpdate(this.stats);
  }

  // --- INTERACTION ---

  private handleInteraction() {
    if (this.activeHazard) {
      const success = this.hazardManager.triggerInteractiveHazard(this.activeHazard);
      if (success) {
        this.activeHazard = null;
        this.callbacks.onInteractPrompt(null);
        return;
      }
    }

    if (!this.activeInteractable) return;

    const item = this.activeInteractable;

    if (item.type === 'crate' && !item.activated) {
      item.activated = true;
      soundManager.playCrateOpen();

      // Open crate lid animation
      if (item.mesh) {
        item.mesh.rotation.x = -0.3;
      }

      // Spawn loot items from crate
      const lootTypes: ('ammo' | 'health' | 'armor' | 'cash')[] = ['ammo', 'ammo', 'health', 'armor', 'cash'];
      for (let i = 0; i < 3; i++) {
        const t = lootTypes[Math.floor(Math.random() * lootTypes.length)];
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          0,
          (Math.random() - 0.5) * 1.8
        );
        this.pickupManager.spawnPickup(t, item.position.clone().add(offset), t === 'cash' ? 100 : 1);
      }

      // If opening armory crate, unlock shotgun or rifle if not already owned!
      if (!this.inventory.includes('shotgun') && (item.id === 'crate_1' || Math.random() < 0.35)) {
        this.inventory.push('shotgun');
        this.callbacks.onWeaponsUpdate(
          this.weaponConfigs[this.activeWeaponId],
          this.weaponStates[this.activeWeaponId],
          this.inventory
        );
      } else if (!this.inventory.includes('rifle') && (item.id === 'crate_4' || Math.random() < 0.25)) {
        this.inventory.push('rifle');
        this.callbacks.onWeaponsUpdate(
          this.weaponConfigs[this.activeWeaponId],
          this.weaponStates[this.activeWeaponId],
          this.inventory
        );
      }

      this.callbacks.onInteractPrompt(null);
      this.activeInteractable = null;

    } else if (item.type === 'workbench') {
      this.exitPointerLock();
      this.callbacks.onOpenUpgradeStation();

    } else if (item.type === 'extraction') {
      if (this.wave >= 5 || this.objective.extractionReady) {
        if (!item.activated) {
          item.activated = true;
          this.objective.type = 'extract';
          this.objective.description = 'EVAC CALL CONFIRMED! Helicopter landing! Defend Helipad for 60 seconds!';
          this.objective.extractionCountdown = 60;
          soundManager.playExtractionSiren();
          this.callbacks.onObjectiveUpdate(this.objective);
        }
      }
    } else if (item.type === 'audio_log' && item.audioLogId) {
      const isCurrentlyPlayingThis =
        this.audioLogManager.activePlayback &&
        this.audioLogManager.activePlayback.log.id === item.audioLogId &&
        this.audioLogManager.activePlayback.isPlaying;

      if (isCurrentlyPlayingThis) {
        this.audioLogManager.stopPlayback();
      } else {
        const wasDiscovered = this.audioLogManager.getLogById(item.audioLogId)?.discovered;
        this.audioLogManager.playLog(item.audioLogId);
        if (!wasDiscovered) {
          this.stats.score += 150;
          this.stats.cash += 50;
          this.callbacks.onStatsUpdate(this.stats);
        }
      }
      this.checkInteractivePrompt();
    }
  }

  // --- UPGRADES ---

  public upgradeWeapon(weaponId: WeaponId): boolean {
    const cfg = this.weaponConfigs[weaponId];
    const cost = Math.round(cfg.cost * 0.75) + cfg.upgradeLevel * 250;

    if (this.stats.cash >= cost && cfg.upgradeLevel < 5) {
      this.stats.cash -= cost;
      cfg.upgradeLevel++;
      cfg.damage = Math.round(cfg.damage * 1.25);
      cfg.magazineSize = Math.round(cfg.magazineSize * 1.2);
      cfg.reloadTime = Math.max(0.8, Number((cfg.reloadTime * 0.85).toFixed(2)));

      this.callbacks.onStatsUpdate(this.stats);
      this.callbacks.onWeaponsUpdate(
        this.weaponConfigs[this.activeWeaponId],
        this.weaponStates[this.activeWeaponId],
        this.inventory
      );
      soundManager.playPickup('cash');
      return true;
    }
    return false;
  }

  public buyWeapon(weaponId: WeaponId): boolean {
    const cfg = this.weaponConfigs[weaponId];
    if (!this.inventory.includes(weaponId) && this.stats.cash >= cfg.cost) {
      this.stats.cash -= cfg.cost;
      this.inventory.push(weaponId);
      this.switchWeapon(weaponId);
      this.callbacks.onStatsUpdate(this.stats);
      soundManager.playPickup('weapon');
      return true;
    }
    return false;
  }

  public buyAmmo(weaponId: WeaponId): boolean {
    const cfg = this.weaponConfigs[weaponId];
    const st = this.weaponStates[weaponId];
    const cost = 150;

    if (this.stats.cash >= cost && st.reserveAmmo < cfg.reserveAmmoMax) {
      this.stats.cash -= cost;
      st.reserveAmmo = Math.min(cfg.reserveAmmoMax, st.reserveAmmo + cfg.magazineSize * 2);
      this.callbacks.onStatsUpdate(this.stats);
      this.callbacks.onWeaponsUpdate(
        this.weaponConfigs[this.activeWeaponId],
        this.weaponStates[this.activeWeaponId],
        this.inventory
      );
      soundManager.playPickup('ammo');
      return true;
    }
    return false;
  }

  public buyArmor(): boolean {
    const cost = 200;
    if (this.stats.cash >= cost && this.stats.armor < this.stats.maxArmor) {
      this.stats.cash -= cost;
      this.stats.armor = Math.min(this.stats.maxArmor, this.stats.armor + 50);
      this.callbacks.onStatsUpdate(this.stats);
      soundManager.playPickup('armor');
      return true;
    }
    return false;
  }

  public buyMedkit(): boolean {
    const cost = 250;
    if (this.stats.cash >= cost && this.stats.health < this.stats.maxHealth) {
      this.stats.cash -= cost;
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 50);
      this.callbacks.onStatsUpdate(this.stats);
      soundManager.playPickup('health');
      return true;
    }
    return false;
  }

  // --- TRAP & CRAFTING SUBSYSTEM METHODS ---

  public startPlacingTrap(type: TrapType): boolean {
    const success = this.trapManager.startPlacement(type);
    if (success) {
      this.notifyTrapUpdate();
    }
    return success;
  }

  public craftRecipe(recipeId: string): boolean {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    const check = canCraftRecipe(
      recipe,
      this.craftingMaterials,
      this.stats.cash,
      this.unlockedBlueprints,
      this.wave
    );

    if (!check.canCraft) return false;

    // Deduct cost
    if (recipe.cost.cash) this.stats.cash -= recipe.cost.cash;
    if (recipe.cost.scrapMetal) this.craftingMaterials.scrapMetal -= recipe.cost.scrapMetal;
    if (recipe.cost.electronics) this.craftingMaterials.electronics -= recipe.cost.electronics;
    if (recipe.cost.chemicals) this.craftingMaterials.chemicals -= recipe.cost.chemicals;
    if (recipe.cost.weaponParts) this.craftingMaterials.weaponParts -= recipe.cost.weaponParts;

    // Apply outcome
    if (recipe.resultType === 'weapon' && recipe.resultTarget) {
      const wId = recipe.resultTarget as WeaponId;
      if (!this.inventory.includes(wId)) {
        this.inventory.push(wId);
        this.switchWeapon(wId);
      }
    } else if (recipe.resultType === 'trap' && recipe.resultTarget) {
      this.trapManager.addTrapToInventory(recipe.resultTarget as TrapType, recipe.amount || 1);
      this.notifyTrapUpdate();
    } else if (recipe.resultType === 'mod' && recipe.resultTarget) {
      const modKey = recipe.resultTarget as keyof WeaponModState;
      this.weaponMods[modKey] = true;

      // Apply mods to configs
      if (modKey === 'hasDrumMag') {
        Object.values(this.weaponConfigs).forEach((cfg) => {
          cfg.magazineSize = Math.round(cfg.magazineSize * 1.5);
        });
      } else if (modKey === 'hasCompensator') {
        Object.values(this.weaponConfigs).forEach((cfg) => {
          cfg.spread = cfg.spread * 0.55;
          cfg.range = cfg.range * 1.25;
        });
      }
      this.notifyModsUpdate();
    } else if (recipe.resultType === 'ammo') {
      const st = this.weaponStates[this.activeWeaponId];
      const cfg = this.weaponConfigs[this.activeWeaponId];
      st.reserveAmmo = Math.min(cfg.reserveAmmoMax, st.reserveAmmo + (recipe.amount || 60));
    } else if (recipe.resultType === 'health') {
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + (recipe.amount || 60));
    } else if (recipe.resultType === 'armor') {
      this.stats.armor = Math.min(this.stats.maxArmor, this.stats.armor + (recipe.amount || 60));
    }

    soundManager.playCraftSuccess();
    this.notifyMaterialsUpdate();
    this.callbacks.onStatsUpdate(this.stats);
    this.callbacks.onWeaponsUpdate(
      this.weaponConfigs[this.activeWeaponId],
      this.weaponStates[this.activeWeaponId],
      this.inventory
    );
    return true;
  }

  public notifyMaterialsUpdate() {
    this.callbacks.onMaterialsUpdate?.({ ...this.craftingMaterials });
  }

  public notifyTrapUpdate() {
    this.callbacks.onTrapInventoryUpdate?.(
      { ...this.trapManager.inventory },
      this.trapManager.isPlacing,
      this.trapManager.activeTrapType
    );
  }

  public notifyBlueprintsUpdate() {
    this.callbacks.onBlueprintsUpdate?.([...this.unlockedBlueprints]);
  }

  public notifyModsUpdate() {
    this.callbacks.onModsUpdate?.({ ...this.weaponMods });
  }

  public notifySkillTreeUpdate() {
    this.callbacks.onSkillTreeUpdate?.(JSON.parse(JSON.stringify(this.skillTreeState)));
  }

  // --- PASSIVE SKILL TREE UPGRADES & PERMANENT ATTRIBUTES ---

  public upgradeSkill(skillId: SkillId): boolean {
    const success = applySkillUpgrade(skillId, this.skillTreeState);
    if (success) {
      soundManager.playSkillUpgrade();

      // Apply permanent attribute bonuses
      const maxHpBonus = getMaxHealthBonus(this.skillTreeState.ranks);
      const targetMaxHp = 100 + maxHpBonus;
      const hpDiff = targetMaxHp - this.stats.maxHealth;
      if (hpDiff > 0) {
        this.stats.maxHealth = targetMaxHp;
        this.stats.health = Math.min(targetMaxHp, this.stats.health + hpDiff);
      }

      this.trapManager.maxPlacementRange = getTrapPlacementRange(this.skillTreeState.ranks);
      this.trapManager.extraTrapUses = getExtraTrapUses(this.skillTreeState.ranks);
      this.trapManager.extraPinDuration = (this.skillTreeState.ranks.reinforced_traps || 0) * 1.5;
      this.trapManager.explosiveMultiplier = getExplosiveMultiplier(this.skillTreeState.ranks);

      this.notifySkillTreeUpdate();
      this.callbacks.onStatsUpdate(this.stats);
    }
    return success;
  }

  public respecSkills() {
    respecSkillTree(this.skillTreeState);
    soundManager.playSkillReset();

    this.stats.maxHealth = 100;
    this.stats.health = Math.min(100, this.stats.health);

    this.trapManager.maxPlacementRange = getTrapPlacementRange(this.skillTreeState.ranks);
    this.trapManager.extraTrapUses = getExtraTrapUses(this.skillTreeState.ranks);
    this.trapManager.extraPinDuration = 0;
    this.trapManager.explosiveMultiplier = getExplosiveMultiplier(this.skillTreeState.ranks);

    this.notifySkillTreeUpdate();
    this.callbacks.onStatsUpdate(this.stats);
  }

  // --- PLAYER DAMAGE ---

  private onPlayerTakeDamage(damage: number) {
    if (this.stats.health <= 0) return;

    soundManager.playHurt();
    this.callbacks.onDamageTaken();

    // Armor absorption: 70% absorbed by armor
    if (this.stats.armor > 0) {
      const absorbed = Math.min(this.stats.armor, damage * 0.7);
      this.stats.armor -= absorbed;
      const remainingDamage = damage - absorbed;
      this.stats.health -= remainingDamage;
    } else {
      this.stats.health -= damage;
    }

    soundManager.updateHeartbeat(this.stats.health / this.stats.maxHealth);
    this.callbacks.onStatsUpdate(this.stats);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.isRunning = false;
      this.exitPointerLock();
      soundManager.stopAmbient();
      this.callbacks.onGameOver({
        score: this.stats.score,
        kills: this.stats.kills,
        headshots: this.stats.headshots,
        wave: this.wave,
      });
    }
  }

  // --- WEAPON VIEWMODEL ANIMATIONS ---

  private updateWeaponPosition(delta: number) {
    if (!this.currentWeaponMesh) return;

    // 1. Target base offset depending on weapon and ADS
    let targetPos: { x: number; y: number; z: number };
    if (this.isAimingDownSights) {
      if (this.activeWeaponId === 'pistol') {
        targetPos = { x: 0, y: -0.11, z: -0.32 };
      } else if (this.activeWeaponId === 'shotgun') {
        targetPos = { x: 0, y: -0.13, z: -0.34 };
      } else if (this.activeWeaponId === 'rifle') {
        targetPos = { x: 0, y: -0.115, z: -0.32 };
      } else {
        targetPos = { x: 0, y: -0.095, z: -0.28 };
      }
    } else if (this.stats.isSprinting && this.horizontalVel.lengthSq() > 1.0) {
      // Sprint weapon lowered ready position
      targetPos = { x: 0.12, y: -0.16, z: -0.42 };
    } else {
      // Standard hipfire
      targetPos = { x: 0.20, y: -0.21, z: -0.44 };
    }

    // 2. Weapon Sway (Rotational Inertia from mouse look)
    const swayAmount = this.isAimingDownSights ? 0.15 : 1.0;
    const targetSwayX = -this.cameraYawVelocity * 0.012 * swayAmount;
    const targetSwayY = this.cameraPitchVelocity * 0.012 * swayAmount;
    const targetSwayRoll = -this.cameraYawVelocity * 0.018 * swayAmount;
    const targetSwayPitch = this.cameraPitchVelocity * 0.014 * swayAmount;

    this.swayOffset.x = THREE.MathUtils.damp(this.swayOffset.x, targetSwayX, 18, delta);
    this.swayOffset.y = THREE.MathUtils.damp(this.swayOffset.y, targetSwayY, 18, delta);
    this.swayRot.z = THREE.MathUtils.damp(this.swayRot.z, targetSwayRoll, 18, delta);
    this.swayRot.x = THREE.MathUtils.damp(this.swayRot.x, targetSwayPitch, 18, delta);

    // 3. Movement and Idle Bobbing
    const actualSpeed = this.horizontalVel.length();
    const speedRatio = Math.min(actualSpeed / 7.5, 1.2);
    const time = performance.now() / 1000;

    // Idle breathing sway
    const breathX = Math.sin(time * 1.5) * (this.isAimingDownSights ? 0.0008 : 0.0025);
    const breathY = Math.cos(time * 3.0) * (this.isAimingDownSights ? 0.0008 : 0.002);

    // Dynamic walk bobbing
    const bobFactor = this.isAimingDownSights ? 0.15 : (this.stats.isSprinting ? 1.3 : 1.0);
    const bobX = Math.cos(this.walkCycle) * 0.014 * speedRatio * bobFactor;
    const bobY = Math.abs(Math.sin(this.walkCycle * 2)) * 0.016 * speedRatio * bobFactor;
    const bobRotRoll = Math.sin(this.walkCycle) * 0.02 * speedRatio * bobFactor;

    // 4. Spring-damper Recoil update
    const springK = 280;
    const springDamping = 26;
    this.recoilSpringVel.x -= (this.weaponRecoilOffset.x * springK + this.recoilSpringVel.x * springDamping) * delta;
    this.recoilSpringVel.y -= (this.weaponRecoilOffset.y * springK + this.recoilSpringVel.y * springDamping) * delta;
    this.recoilSpringVel.z -= (this.weaponRecoilOffset.z * springK + this.recoilSpringVel.z * springDamping) * delta;
    this.weaponRecoilOffset.addScaledVector(this.recoilSpringVel, delta);

    this.recoilSpringRotVel.x -= (this.weaponRecoilRot.x * springK + this.recoilSpringRotVel.x * springDamping) * delta;
    this.recoilSpringRotVel.y -= (this.weaponRecoilRot.y * springK + this.recoilSpringRotVel.y * springDamping) * delta;
    this.weaponRecoilRot.addScaledVector(this.recoilSpringRotVel, delta);

    // Sprint tilt
    const sprintRotX = (this.stats.isSprinting && speedRatio > 0.4 && !this.isAimingDownSights) ? -0.32 : 0;
    const sprintRotY = (this.stats.isSprinting && speedRatio > 0.4 && !this.isAimingDownSights) ? 0.28 : 0;

    // Smooth weapon placement
    const adsSpeed = 16;
    this.currentWeaponMesh.position.x = THREE.MathUtils.damp(
      this.currentWeaponMesh.position.x,
      targetPos.x + this.swayOffset.x + breathX + bobX + this.weaponRecoilOffset.x,
      adsSpeed,
      delta
    );
    this.currentWeaponMesh.position.y = THREE.MathUtils.damp(
      this.currentWeaponMesh.position.y,
      targetPos.y + this.swayOffset.y + breathY - bobY + this.weaponRecoilOffset.y,
      adsSpeed,
      delta
    );
    this.currentWeaponMesh.position.z = THREE.MathUtils.damp(
      this.currentWeaponMesh.position.z,
      targetPos.z + this.weaponRecoilOffset.z,
      adsSpeed,
      delta
    );

    this.currentWeaponMesh.rotation.x = THREE.MathUtils.damp(
      this.currentWeaponMesh.rotation.x,
      this.swayRot.x + this.weaponRecoilRot.x + sprintRotX,
      adsSpeed,
      delta
    );
    this.currentWeaponMesh.rotation.y = THREE.MathUtils.damp(
      this.currentWeaponMesh.rotation.y,
      this.swayRot.y + this.weaponRecoilRot.y + sprintRotY,
      adsSpeed,
      delta
    );
    this.currentWeaponMesh.rotation.z = THREE.MathUtils.damp(
      this.currentWeaponMesh.rotation.z,
      this.swayRot.z + bobRotRoll,
      adsSpeed,
      delta
    );

    // Camera FOV ADS zoom
    const targetFOV = this.isAimingDownSights ? (this.activeWeaponId === 'marksman' ? 38 : 58) : 75;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFOV, 16, delta);
    this.camera.updateProjectionMatrix();
  }

  // --- CORE ANIMATION & PHYSICS LOOP ---

  private animate = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min(Math.max((now - this.lastTime) / 1000, 0.001), 0.1);
    this.lastTime = now;

    // Subsystem metrics for mobile dynamic scaling
    const activeZombies = this.zombieManager.getAliveZombies().length;
    const activeParticles = this.particles.particles.length;

    // Performance adaptive quality step
    this.performanceManager.update(delta, activeZombies, activeParticles);

    // Update camera frustum for zombie & object culling
    this.zombieManager.updateCameraFrustum(this.camera);

    // Update Developer Performance Monitor if active
    if (this.performanceManager.showDevMonitor && this.devMonitorEl) {
      this.devMonitorEl.style.display = 'block';
      if (now - this.lastDevMonitorUpdate > 150) {
        this.lastDevMonitorUpdate = now;
        const pm = this.performanceManager;
        this.devMonitorEl.innerText =
          `FPS: ${pm.fps.toFixed(1)} (${pm.frameTimeMs.toFixed(1)}ms)\n` +
          `Zombies: ${activeZombies} | Particles: ${activeParticles}\n` +
          `Quality: ${pm.config.label} (Tier ${pm.currentTier})\n` +
          `DPR: ${this.renderer.getPixelRatio().toFixed(2)} | Target: ${pm.targetFPS} FPS\n` +
          `Device: ${pm.isLowEnd ? 'Mobile (Low-End)' : pm.isMobile ? 'Mobile' : 'Desktop'}`;
      }
    } else if (this.devMonitorEl && this.devMonitorEl.style.display !== 'none') {
      this.devMonitorEl.style.display = 'none';
    }

    // 1. Smooth Camera Rotation & Angular Velocity
    const rotSmooth = Math.min(1, delta * 42);
    const prevYaw = this.cameraYaw;
    const prevPitch = this.cameraPitch;
    this.cameraYaw = THREE.MathUtils.lerp(this.cameraYaw, this.targetCameraYaw, rotSmooth);
    this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, this.targetCameraPitch, rotSmooth);
    this.cameraYawVelocity = (this.cameraYaw - prevYaw) / Math.max(0.0001, delta);
    this.cameraPitchVelocity = (this.cameraPitch - prevPitch) / Math.max(0.0001, delta);

    // Camera Recoil Recovery
    this.cameraRecoilKick = THREE.MathUtils.damp(this.cameraRecoilKick, 0, 18, delta);
    const effectivePitch = this.cameraPitch + this.cameraRecoilKick;

    // 2. Update Automatic Weapon firing
    if (this.isFiring && this.weaponConfigs[this.activeWeaponId].automatic) {
      this.fireActiveWeapon();
    }

    // 3. Weapon Reload Progress (accelerated by rapid_reload passive)
    const activeSt = this.weaponStates[this.activeWeaponId];
    const activeCfg = this.weaponConfigs[this.activeWeaponId];
    if (activeSt.isReloading) {
      const reloadMult = getReloadSpeedMultiplier(this.skillTreeState.ranks);
      activeSt.reloadProgress += (delta * reloadMult) / activeCfg.reloadTime;
      if (activeSt.reloadProgress >= 1) {
        activeSt.isReloading = false;
        activeSt.reloadProgress = 0;
        const needed = activeCfg.magazineSize - activeSt.currentMag;
        const toLoad = Math.min(needed, activeSt.reserveAmmo);
        activeSt.currentMag += toLoad;
        activeSt.reserveAmmo -= toLoad;
        this.callbacks.onWeaponsUpdate(activeCfg, activeSt, this.inventory);
      }
    }

    // 4. Passive Health Regeneration (Cellular Regeneration)
    const regenRate = getHealthRegenRate(this.skillTreeState.ranks);
    if (regenRate > 0 && this.stats.health > 0 && this.stats.health < this.stats.maxHealth) {
      const oldHp = Math.floor(this.stats.health);
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + regenRate * delta);
      if (Math.floor(this.stats.health) !== oldHp) {
        this.callbacks.onStatsUpdate(this.stats);
      }
    }

    // 5. Player Input & Momentum Physics
    const autoSprintFromJoystick = this.mobileMoveVector.y > 0.85;
    const isShift = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mobileSprint || autoSprintFromJoystick;
    const isCtrl = this.keys['KeyC'] || this.keys['ControlLeft'] || this.mobileCrouch;
    this.stats.isCrouching = !!isCtrl;

    let moveForward =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) +
      this.mobileMoveVector.y;
    let moveRight =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) +
      this.mobileMoveVector.x;

    const moveMag = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
    if (moveMag > 1.0) {
      moveForward /= moveMag;
      moveRight /= moveMag;
    }
    const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;

    const speedMult = getMovementSpeedMultiplier(this.skillTreeState.ranks);
    const staminaMult = getStaminaRegenMultiplier(this.skillTreeState.ranks);
    const sprintDrain = (this.skillTreeState.ranks.stamina_surge || 0) > 0 ? 14 : 22;

    if (isShift && isMoving && this.stats.stamina > 5 && !this.stats.isCrouching && !this.isAimingDownSights) {
      this.stats.isSprinting = true;
      this.stats.stamina = Math.max(0, this.stats.stamina - delta * sprintDrain);
    } else {
      this.stats.isSprinting = false;
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + delta * 18 * staminaMult);
    }

    // Move Speeds with fleet_foot passive multiplier
    let baseSpeed = 5.2 * speedMult;
    if (this.stats.isSprinting) baseSpeed = 8.4 * speedMult;
    if (this.stats.isCrouching) baseSpeed = 2.8 * speedMult;
    if (this.isAimingDownSights) baseSpeed *= 0.65;

    // Movement Direction from Camera Yaw
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    let rawDirX = -sinYaw * moveForward + cosYaw * moveRight;
    let rawDirZ = -cosYaw * moveForward - sinYaw * moveRight;
    const rawLen = Math.sqrt(rawDirX * rawDirX + rawDirZ * rawDirZ);
    if (rawLen > 0.001) {
      rawDirX /= rawLen;
      rawDirZ /= rawLen;
    } else {
      rawDirX = 0;
      rawDirZ = 0;
    }

    const targetVelX = rawDirX * baseSpeed;
    const targetVelZ = rawDirZ * baseSpeed;

    // Smooth acceleration & friction
    if (this.isGrounded) {
      const accelRate = isMoving ? 45 : 16;
      this.horizontalVel.x = THREE.MathUtils.damp(this.horizontalVel.x, targetVelX, accelRate, delta);
      this.horizontalVel.y = THREE.MathUtils.damp(this.horizontalVel.y, targetVelZ, accelRate, delta);
    } else {
      // Air control
      this.horizontalVel.x = THREE.MathUtils.damp(this.horizontalVel.x, targetVelX, 16, delta);
      this.horizontalVel.y = THREE.MathUtils.damp(this.horizontalVel.y, targetVelZ, 16, delta);
    }

    const actualSpeed = this.horizontalVel.length();

    // Footstep audio
    if (actualSpeed > 1.2 && this.isGrounded) {
      const stepInterval = this.stats.isSprinting ? 0.32 : 0.52;
      if (Math.floor(now / (stepInterval * 1000)) !== Math.floor((now - delta * 1000) / (stepInterval * 1000))) {
        soundManager.playFootstep(this.stats.isSprinting);
      }
    }

    // 5. Jump Buffering & Coyote Time
    if (this.isGrounded) {
      this.coyoteTimer = 0.10;
    } else {
      this.coyoteTimer -= delta;
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= delta;
    }

    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0) && this.stats.stamina >= 8) {
      this.playerVel.y = 5.8;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.stats.stamina -= 8;
      soundManager.playJump();
    }

    // Gravity
    this.playerVel.y -= 19 * delta;

    // 6. Collision & Wall Sliding with Scratch Boxes
    const playerHeight = this.stats.isCrouching ? 1.05 : 1.75;
    const playerRadius = 0.45;
    const stepX = this.horizontalVel.x * delta;
    const stepZ = this.horizontalVel.y * delta;
    const newX = this.playerPos.x + stepX;
    const newZ = this.playerPos.z + stepZ;

    this.scratchBoxSize.set(playerRadius * 2, playerHeight, playerRadius * 2);

    // Query nearby obstacles using spatial grid
    this.obstacleGrid.queryNearby(newX, newZ, this.nearbyObstaclesBuffer);

    // Test X movement
    this.scratchBoxCenter.set(newX, this.playerPos.y + playerHeight * 0.5, this.playerPos.z);
    this.scratchBoxX.setFromCenterAndSize(this.scratchBoxCenter, this.scratchBoxSize);
    let collidesX = false;
    for (let o = 0; o < this.nearbyObstaclesBuffer.length; o++) {
      if (this.nearbyObstaclesBuffer[o].box.intersectsBox(this.scratchBoxX)) {
        collidesX = true;
        break;
      }
    }

    // Test Z movement
    this.scratchBoxCenter.set(this.playerPos.x, this.playerPos.y + playerHeight * 0.5, newZ);
    this.scratchBoxZ.setFromCenterAndSize(this.scratchBoxCenter, this.scratchBoxSize);
    let collidesZ = false;
    for (let o = 0; o < this.nearbyObstaclesBuffer.length; o++) {
      if (this.nearbyObstaclesBuffer[o].box.intersectsBox(this.scratchBoxZ)) {
        collidesZ = true;
        break;
      }
    }

    if (!collidesX) {
      this.playerPos.x = newX;
    } else {
      this.horizontalVel.x = 0;
    }

    if (!collidesZ) {
      this.playerPos.z = newZ;
    } else {
      this.horizontalVel.y = 0;
    }

    // Boundary clamp inside safe city arena
    this.playerPos.x = Math.max(-63, Math.min(63, this.playerPos.x));
    this.playerPos.z = Math.max(-64, Math.min(48, this.playerPos.z));

    // Y position & Landing Dip
    const wasGrounded = this.isGrounded;
    this.playerPos.y += this.playerVel.y * delta;
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVel.y = 0;
      this.isGrounded = true;

      // Soft landing impact bounce
      if (!wasGrounded) {
        this.landingDip = -0.06;
        soundManager.playFootstep(false);
      }
    }

    this.landingDip = THREE.MathUtils.damp(this.landingDip, 0, 16, delta);

    // 7. Smooth Eye Height & Head Bobbing
    const targetEyeHeight = this.stats.isCrouching ? 1.05 : 1.70;
    this.currentEyeHeight = THREE.MathUtils.damp(this.currentEyeHeight, targetEyeHeight, 14, delta);

    if (this.isGrounded && actualSpeed > 0.4) {
      this.walkCycle += delta * actualSpeed * 2.8;
    }

    const headBobAmount = this.isAimingDownSights ? 0.15 : (this.stats.isSprinting ? 1.3 : 1.0);
    const speedRatio = Math.min(actualSpeed / 6.5, 1.0);
    const headBobY = this.isGrounded ? Math.sin(this.walkCycle * 2) * 0.018 * speedRatio * headBobAmount : 0;
    const headBobRoll = this.isGrounded ? Math.cos(this.walkCycle) * 0.008 * speedRatio * headBobAmount : 0;

    const eyeY = this.playerPos.y + this.currentEyeHeight + headBobY + this.landingDip;

    if (this.settings.viewMode === 'first') {
      this.camera.position.set(this.playerPos.x, eyeY, this.playerPos.z);
      this.camera.rotation.set(effectivePitch, this.cameraYaw, headBobRoll, 'YXZ');
      this.weaponMeshGroup.visible = true;
    } else {
      // Third-person over-the-shoulder
      const camDist = 3.2;
      const camOffsetX = 0.6 * cosYaw + sinYaw * camDist;
      const camOffsetY = 0.4 + Math.sin(effectivePitch) * camDist;
      const camOffsetZ = -0.6 * sinYaw + cosYaw * camDist;
      this.camera.position.set(
        this.playerPos.x + camOffsetX,
        eyeY + camOffsetY,
        this.playerPos.z + camOffsetZ
      );
      this.camera.rotation.set(effectivePitch, this.cameraYaw, 0, 'YXZ');
      this.weaponMeshGroup.visible = false;
    }

    // Flashlight tracking using scratch vector
    this.flashlight.position.copy(this.camera.position);
    this.scratchVec
      .set(0, 0, -1)
      .applyEuler(this.camera.rotation)
      .multiplyScalar(22)
      .add(this.camera.position);
    this.flashlight.target.position.copy(this.scratchVec);

    // 8. Update Weapon Model Bobbing/Recoil/Sway
    this.updateWeaponPosition(delta);

    // 9. Zombie Spawner & AI Update
    if (!this.isIntermission && this.zombiesToSpawn > 0) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= 1.6) {
        this.spawnTimer = 0;
        this.zombiesToSpawn--;

        const spawnPoints = this.envData.spawnPoints;
        const validPoints = spawnPoints.filter((pt) => pt.distanceTo(this.playerPos) > 18);
        const spawnPt = validPoints.length > 0
          ? validPoints[Math.floor(Math.random() * validPoints.length)]
          : spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

        let zType: 'walker' | 'runner' | 'brute' = 'walker';
        const roll = Math.random();
        if (this.wave >= 3 && roll < 0.2) {
          zType = 'brute';
        } else if (this.wave >= 2 && roll < 0.5) {
          zType = 'runner';
        }

        this.zombieManager.spawnZombie(zType, spawnPt);
      }
    }

    // Wave Intermission countdown
    if (this.isIntermission) {
      this.intermissionTimer -= delta;
      this.callbacks.onWaveUpdate(this.wave, 0, true, Math.ceil(this.intermissionTimer));
      if (this.intermissionTimer <= 0) {
        this.startWave(this.wave + 1);
      }
    }

    // 10. Extraction Countdown
    if (this.objective.type === 'extract' && this.objective.extractionCountdown > 0) {
      this.objective.extractionCountdown -= delta;
      this.particles.emitExtractionSmoke(this.envData.extractionPoint);

      const distToHelipad = this.playerPos.distanceTo(this.envData.extractionPoint);
      if (distToHelipad < 7.5 && this.objective.extractionCountdown <= 5) {
        this.isRunning = false;
        this.exitPointerLock();
        soundManager.stopAmbient();
        this.callbacks.onVictory({
          score: this.stats.score,
          kills: this.stats.kills,
          headshots: this.stats.headshots,
          wave: this.wave,
        });
        return;
      }

      this.callbacks.onObjectiveUpdate(this.objective);
    }

    // 11. Update Subsystems
    this.zombieManager.update(delta, this.playerPos, (dmg) => this.onPlayerTakeDamage(dmg));
    this.pickupManager.update(delta, this.playerPos, (pickup) => this.onPickupCollected(pickup));
    this.particles.update(delta);
    this.hazardManager.update(
      delta,
      this.playerPos,
      this.zombieManager.getAliveZombies(),
      (z, dmg, isHead) => this.onHazardDamagedZombie(z, dmg, isHead),
      (pDmg) => this.onPlayerTakeDamage(pDmg)
    );
    this.trapManager.update(
      delta,
      this.zombieManager,
      (dmg, isKill) => {
        this.stats.score += Math.round(dmg * 0.5);
        this.stats.cash += Math.round(dmg * 0.2);
        this.callbacks.onHitMarker(false);
        if (isKill) {
          this.stats.kills++;
          this.onZombieKilled();
        }
        this.callbacks.onStatsUpdate(this.stats);
      },
      (pos, radius, damage) => {
        soundManager.playExplosion();
        this.particles.emitExplosion(pos);
        // Damage nearby zombies
        for (const z of this.zombieManager.getAliveZombies()) {
          const d = z.group.position.distanceTo(pos);
          if (d <= radius) {
            const expDmg = Math.round((1 - d / radius) * damage);
            this.onHazardDamagedZombie(z, expDmg, false);
          }
        }
        // Player damage if in blast radius
        const dPlayer = this.playerPos.distanceTo(pos);
        if (dPlayer <= radius) {
          this.onPlayerTakeDamage(Math.round((1 - dPlayer / radius) * 35));
        }
      }
    );

    this.audioLogManager.update(delta, performance.now() / 1000);

    // 12. Interaction Detection
    this.checkInteractivePrompt();

    // 13. Render
    this.renderer.render(this.scene, this.camera);
  };

  private onPickupCollected(pickup: PickupData): boolean {
    if (pickup.type === 'health') {
      if (this.stats.health >= this.stats.maxHealth) return false;
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 35);
    } else if (pickup.type === 'armor') {
      if (this.stats.armor >= this.stats.maxArmor) return false;
      this.stats.armor = Math.min(this.stats.maxArmor, this.stats.armor + 35);
    } else if (pickup.type === 'ammo') {
      // Add ammo to current weapon
      const st = this.weaponStates[this.activeWeaponId];
      const cfg = this.weaponConfigs[this.activeWeaponId];
      st.reserveAmmo = Math.min(cfg.reserveAmmoMax, st.reserveAmmo + cfg.magazineSize * 2);
      this.callbacks.onWeaponsUpdate(cfg, st, this.inventory);
    } else if (pickup.type === 'cash') {
      this.stats.cash += pickup.amount || 50;
      this.stats.score += 50;
    } else if (pickup.type === 'scrap') {
      this.craftingMaterials.scrapMetal += pickup.amount || 2;
      this.notifyMaterialsUpdate();
      soundManager.playPickup('ammo');
    } else if (pickup.type === 'electronics') {
      this.craftingMaterials.electronics += pickup.amount || 1;
      this.notifyMaterialsUpdate();
      soundManager.playPickup('ammo');
    } else if (pickup.type === 'chemicals') {
      this.craftingMaterials.chemicals += pickup.amount || 1;
      this.notifyMaterialsUpdate();
      soundManager.playPickup('ammo');
    } else if (pickup.type === 'parts') {
      this.craftingMaterials.weaponParts += pickup.amount || 1;
      this.notifyMaterialsUpdate();
      soundManager.playPickup('weapon');
    } else if (pickup.type === 'blueprint') {
      // Unlock next available blueprint
      const possibleBlueprints = [
        'blueprint_flamethrower',
        'blueprint_arc_rifle',
        'blueprint_drum_mag',
        'blueprint_compensator',
        'blueprint_incendiary',
        'blueprint_shock_coil',
        'blueprint_spike_strip',
        'blueprint_pipe_bomb',
      ];
      const unowned = possibleBlueprints.filter((b) => !this.unlockedBlueprints.includes(b));
      if (unowned.length > 0) {
        this.unlockedBlueprints.push(unowned[0]);
        this.notifyBlueprintsUpdate();
        soundManager.playCraftSuccess();
      }
    }

    this.callbacks.onStatsUpdate(this.stats);
    return true;
  }

  private checkInteractivePrompt() {
    let closestPoint: InteractivePoint | null = null;
    let closestHazard: HazardInstance | null = null;
    let minDist = 3.2;

    for (const pt of this.envData.interactivePoints) {
      if (pt.activated && pt.type === 'crate') continue;
      const d = this.playerPos.distanceTo(pt.position);
      if (d < minDist) {
        minDist = d;
        closestPoint = pt;
        closestHazard = null;
      }
    }

    for (const h of this.hazardManager.hazards) {
      if (h.type === 'electric_panel' && h.state === 'ready') {
        const d = this.playerPos.distanceTo(h.position);
        if (d < 3.5 && d < minDist) {
          minDist = d;
          closestHazard = h;
          closestPoint = null;
        }
      }
    }

    this.activeInteractable = closestPoint;
    this.activeHazard = closestHazard;

    let prompt: string | null = null;
    if (closestHazard && closestHazard.promptLabel) {
      prompt = closestHazard.promptLabel;
    } else if (closestPoint) {
      if (closestPoint.type === 'audio_log' && closestPoint.audioLogId) {
        const log = this.audioLogManager.getLogById(closestPoint.audioLogId);
        const isPlaying =
          this.audioLogManager.activePlayback &&
          this.audioLogManager.activePlayback.log.id === closestPoint.audioLogId &&
          this.audioLogManager.activePlayback.isPlaying;

        if (isPlaying) {
          prompt = `[E] Stop Audio Log #${log?.number}`;
        } else if (log?.discovered) {
          prompt = `[E] Replay Audio Log #${log?.number}: "${log?.title}"`;
        } else {
          prompt = `[E] Play Audio Log #${log?.number}: "${log?.title}"`;
        }
      } else {
        prompt = closestPoint.label;
      }
    }

    if (prompt !== this.lastInteractPrompt) {
      this.lastInteractPrompt = prompt;
      this.callbacks.onInteractPrompt(prompt);
    }
  }

  public restartGame() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    const maxHpBonus = getMaxHealthBonus(this.skillTreeState.ranks);
    this.stats = {
      health: 100 + maxHpBonus,
      maxHealth: 100 + maxHpBonus,
      armor: 50,
      maxArmor: 100,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      isCrouching: false,
      score: 0,
      cash: 300,
      kills: 0,
      headshots: 0,
    };

    this.inventory = ['pistol'];
    this.activeWeaponId = 'pistol';
    this.weaponConfigs = JSON.parse(JSON.stringify(INITIAL_WEAPONS));
    this.weaponStates = {
      pistol: { currentMag: 12, reserveAmmo: 60, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
      shotgun: { currentMag: 6, reserveAmmo: 24, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
      rifle: { currentMag: 30, reserveAmmo: 120, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
      marksman: { currentMag: 10, reserveAmmo: 30, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
      flamethrower: { currentMag: 50, reserveAmmo: 150, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
      arc_rifle: { currentMag: 20, reserveAmmo: 60, isReloading: false, reloadProgress: 0, lastFired: 0, level: 1 },
    };

    this.playerPos.set(0, 1.7, 10);
    this.playerVel.set(0, 0, 0);
    this.horizontalVel.set(0, 0);
    this.cameraPitch = 0;
    this.cameraYaw = 0;
    this.targetCameraPitch = 0;
    this.targetCameraYaw = 0;
    this.cameraPitchVelocity = 0;
    this.cameraYawVelocity = 0;
    this.currentEyeHeight = 1.7;
    this.landingDip = 0;
    this.walkCycle = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.cameraRecoilKick = 0;
    this.weaponRecoilOffset.set(0, 0, 0);
    this.weaponRecoilRot.set(0, 0, 0);
    this.recoilSpringVel.set(0, 0, 0);
    this.recoilSpringRotVel.set(0, 0, 0);
    this.swayOffset.set(0, 0, 0);
    this.swayRot.set(0, 0, 0);

    this.zombieManager.clearAll();
    this.pickupManager.clearAll();
    this.particles.clear();

    this.objective = {
      type: 'survive',
      description: 'Survive the undead onslaught. Search crates for weapons and ammo.',
      currentProgress: 1,
      targetProgress: 5,
      extractionReady: false,
      extractionCountdown: 60,
      extractionX: 0,
      extractionZ: -56,
    };

    this.envData.interactivePoints.forEach((pt) => {
      pt.activated = false;
      if (pt.mesh) pt.mesh.rotation.x = 0;
    });

    this.hazardManager.resetForWave();

    this.switchWeapon('pistol');
    this.callbacks.onStatsUpdate(this.stats);
    this.startWave(1);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.requestPointerLock();
    this.animate();
  }

  public continueEndless() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isRunning = true;
    this.startWave(this.wave + 1);
    this.requestPointerLock();
    this.animate();
  }

  // --- AUDIO LOG PUBLIC CONTROLS ---

  public playAudioLog(logId: string) {
    this.audioLogManager.playLog(logId);
  }

  public stopAudioLog() {
    this.audioLogManager.stopPlayback();
  }

  public pauseAudioLog() {
    this.audioLogManager.pausePlayback();
  }

  public resumeAudioLog() {
    this.audioLogManager.resumePlayback();
  }

  public getAudioLogs(): AudioLog[] {
    return this.audioLogManager.logs;
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundManager.stopAmbient();
    this.audioLogManager.cleanup();
    this.hazardManager.clearAll();
    this.zombieManager.clearAll();
    this.pickupManager.clearAll();
    this.particles.clearAll();

    // Clean up all DOM event listeners
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    if (this.container) {
      this.container.removeEventListener('mousedown', this.handleMouseDown);
      this.container.removeEventListener('contextmenu', this.handleContextMenu);
      this.container.removeEventListener('wheel', this.handleWheel);
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);

    // Remove dev performance monitor overlay
    if (this.devMonitorEl && this.devMonitorEl.parentNode) {
      this.devMonitorEl.parentNode.removeChild(this.devMonitorEl);
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
