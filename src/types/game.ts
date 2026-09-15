export type WeaponId = 'pistol' | 'shotgun' | 'rifle' | 'marksman' | 'flamethrower' | 'arc_rifle';

export type TrapType = 'bear_trap' | 'spike_strip' | 'pipe_bomb';

export interface CraftingMaterials {
  scrapMetal: number;
  electronics: number;
  chemicals: number;
  weaponParts: number;
}

export type CraftingMaterialType = keyof CraftingMaterials;

export interface WeaponModState {
  hasDrumMag: boolean;
  hasCompensator: boolean;
  hasIncendiary: boolean;
  hasShockCoil: boolean;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'weapons' | 'mods' | 'traps' | 'supplies';
  description: string;
  cost: Partial<CraftingMaterials> & { cash?: number };
  blueprintRequired?: string;
  blueprintName?: string;
  unlockWave?: number;
  resultType: 'weapon' | 'mod' | 'trap' | 'ammo' | 'health' | 'armor';
  resultTarget?: WeaponId | TrapType | string;
  amount?: number;
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // shots per second
  magazineSize: number;
  reserveAmmoMax: number;
  reloadTime: number; // seconds
  pellets: number; // 1 for bullet, 8 for shotgun
  spread: number; // rad
  range: number;
  cost: number;
  upgradeLevel: number;
  headshotMultiplier: number;
  automatic: boolean;
  isCrafted?: boolean;
}

export interface WeaponState {
  currentMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  lastFired: number;
  level: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  isCrouching: boolean;
  score: number;
  cash: number;
  kills: number;
  headshots: number;
}

export type ZombieType = 'walker' | 'runner' | 'brute';

export interface ZombieData {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  meshIndex: number;
  isDead: boolean;
  deathTime: number;
  slowTimer?: number;
  slowFactor?: number;
  pinnedTimer?: number;
  burningTimer?: number;
  shockTimer?: number;
}

export type PickupType = 'ammo' | 'health' | 'armor' | 'weapon' | 'cash' | 'scrap' | 'electronics' | 'chemicals' | 'parts' | 'blueprint';

export interface PickupData {
  id: string;
  type: PickupType;
  subtype?: WeaponId;
  amount: number;
  x: number;
  y: number;
  z: number;
  pickedUp: boolean;
}

export interface CrateData {
  id: string;
  x: number;
  y: number;
  z: number;
  isOpened: boolean;
  contents: {
    type: PickupType;
    amount: number;
    subtype?: WeaponId;
  };
}

export interface ObjectiveState {
  type: 'survive' | 'activate_generators' | 'extract';
  description: string;
  currentProgress: number;
  targetProgress: number;
  extractionReady: boolean;
  extractionCountdown: number; // seconds left
  extractionX: number;
  extractionZ: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  touchSensitivity: number;
  touchControls: boolean;
  volume: number;
  sfxVolume: number;
  musicVolume: number;
  viewMode: 'first' | 'third';
  flashlightOn: boolean;
  bloodParticles: boolean;
}

// --- PASSIVE SKILL TREE SYSTEM ---

export type SkillCategory = 'survival' | 'combat' | 'engineering';

export type SkillId =
  | 'vitality_regen'
  | 'fleet_foot'
  | 'iron_constitution'
  | 'stamina_surge'
  | 'deadly_precision'
  | 'rapid_reload'
  | 'scavenger_instinct'
  | 'extended_reach'
  | 'reinforced_traps'
  | 'demolition_expert';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  category: SkillCategory;
  description: string;
  maxRank: number;
  costPerRank: number[];
  tier: number; // 1 or 2
  prerequisiteId?: SkillId;
  getEffectDescription: (rank: number) => string;
}

export type SkillRanks = Record<SkillId, number>;

export interface SkillTreeState {
  availablePoints: number;
  totalPointsEarned: number;
  killsTowardsNextPoint: number;
  killsPerPoint: number;
  ranks: SkillRanks;
}

// --- COLLECTIBLE AUDIO LOGS & LORE SYSTEM ---

export interface AudioLog {
  id: string;
  number: number;
  title: string;
  speaker: string;
  role: string;
  timestamp: string;
  category: 'origin' | 'military' | 'mutation' | 'crafting' | 'hazards' | 'evacuation';
  durationSeconds: number;
  transcript: string;
  locationHint: string;
  coordinates: { x: number; y: number; z: number };
  discovered: boolean;
  voiceConfig: {
    pitch: number;
    rate: number;
  };
}

export interface AudioLogPlaybackState {
  log: AudioLog;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isComplete: boolean;
}

