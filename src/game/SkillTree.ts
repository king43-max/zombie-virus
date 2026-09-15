import {
  SkillCategory,
  SkillDefinition,
  SkillId,
  SkillRanks,
  SkillTreeState,
} from '../types/game';

export const INITIAL_SKILL_RANKS: SkillRanks = {
  vitality_regen: 0,
  fleet_foot: 0,
  iron_constitution: 0,
  stamina_surge: 0,
  deadly_precision: 0,
  rapid_reload: 0,
  scavenger_instinct: 0,
  extended_reach: 0,
  reinforced_traps: 0,
  demolition_expert: 0,
};

export const INITIAL_SKILL_TREE_STATE: SkillTreeState = {
  availablePoints: 2, // Start with 2 bonus points to try the tree right away
  totalPointsEarned: 2,
  killsTowardsNextPoint: 0,
  killsPerPoint: 4, // 1 Skill Point awarded every 4 kills
  ranks: { ...INITIAL_SKILL_RANKS },
};

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // --- SURVIVAL & CONDITIONING ---
  {
    id: 'vitality_regen',
    name: 'Cellular Regeneration',
    category: 'survival',
    description: 'Continuously regenerates health over time through cellular repair.',
    maxRank: 3,
    costPerRank: [1, 1, 2],
    tier: 1,
    getEffectDescription: (rank) => {
      if (rank === 0) return 'No regeneration active.';
      const rates = [0.8, 1.8, 3.2];
      return `Regenerates +${rates[rank - 1]} HP per second.`;
    },
  },
  {
    id: 'fleet_foot',
    name: 'Adrenaline Surge',
    category: 'survival',
    description: 'Increases base walking, strafing, and sprinting movement speed.',
    maxRank: 3,
    costPerRank: [1, 1, 2],
    tier: 1,
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard baseline movement speed.';
      const speeds = [10, 20, 32];
      return `+${speeds[rank - 1]}% overall movement and sprinting velocity.`;
    },
  },
  {
    id: 'iron_constitution',
    name: 'Hardened Vitals',
    category: 'survival',
    description: 'Permanently increases maximum health pool and immediately bolsters current HP.',
    maxRank: 3,
    costPerRank: [2, 2, 3],
    tier: 2,
    prerequisiteId: 'vitality_regen',
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard 100 maximum HP.';
      const hp = [30, 65, 100];
      return `+${hp[rank - 1]} Max Health (Cap: ${100 + hp[rank - 1]} HP).`;
    },
  },
  {
    id: 'stamina_surge',
    name: 'Endurance Runner',
    category: 'survival',
    description: 'Dramatically speeds up stamina recovery and reduces sprint stamina consumption.',
    maxRank: 3,
    costPerRank: [1, 2, 2],
    tier: 2,
    prerequisiteId: 'fleet_foot',
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard stamina recovery rate.';
      const recovery = [35, 75, 120];
      return `+${recovery[rank - 1]}% stamina recharge speed & 35% reduced sprint drain.`;
    },
  },

  // --- COMBAT & BALLISTICS ---
  {
    id: 'deadly_precision',
    name: 'Cranial Calibrator',
    category: 'combat',
    description: 'Boosts critical headshot damage multiplier across all projectile firearms.',
    maxRank: 3,
    costPerRank: [1, 2, 2],
    tier: 1,
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard weapon headshot multiplier.';
      const mult = [25, 50, 85];
      return `+${mult[rank - 1]}% additional lethal headshot damage multiplier.`;
    },
  },
  {
    id: 'rapid_reload',
    name: 'Fast Mag Drill',
    category: 'combat',
    description: 'Hones reload mechanics to drastically reduce weapon reload duration.',
    maxRank: 3,
    costPerRank: [1, 1, 2],
    tier: 1,
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard reload duration.';
      const speeds = [18, 35, 52];
      return `+${speeds[rank - 1]}% faster reload cycle across all firearms.`;
    },
  },
  {
    id: 'scavenger_instinct',
    name: 'Scavenger Instinct',
    category: 'combat',
    description: 'Increases scrap, electronics, chemicals, and cash dropped by defeated undead.',
    maxRank: 3,
    costPerRank: [1, 2, 2],
    tier: 2,
    prerequisiteId: 'rapid_reload',
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard resource drop rates.';
      const drops = [30, 65, 100];
      return `+${drops[rank - 1]}% bonus crafting materials and cash drop abundance.`;
    },
  },

  // --- FIELD ENGINEERING & TRAPS ---
  {
    id: 'extended_reach',
    name: 'Tactical Deployer',
    category: 'engineering',
    description: 'Greatly increases maximum distance for deploying bear traps, spike strips, and pipe bombs.',
    maxRank: 3,
    costPerRank: [1, 1, 2],
    tier: 1,
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Base placement distance of 6.5 meters.';
      const ranges = [8.5, 11.0, 14.0];
      return `Extends trap placement reach up to ${ranges[rank - 1]} meters.`;
    },
  },
  {
    id: 'reinforced_traps',
    name: 'Heavy Steel Alloys',
    category: 'engineering',
    description: 'Increases durability and uses of mechanical traps, and lengthens bear trap hold time.',
    maxRank: 3,
    costPerRank: [2, 2, 3],
    tier: 2,
    prerequisiteId: 'extended_reach',
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard trap durability (1-2 triggers).';
      const uses = [1, 2, 3];
      return `+${uses[rank - 1]} extra trigger use(s) before breaking; +1.5s pin duration.`;
    },
  },
  {
    id: 'demolition_expert',
    name: 'High-Yield Munitions',
    category: 'engineering',
    description: 'Enhances blast radius and explosive shockwave damage of pipe bombs and fuel barrels.',
    maxRank: 3,
    costPerRank: [2, 2, 3],
    tier: 2,
    prerequisiteId: 'extended_reach',
    getEffectDescription: (rank) => {
      if (rank === 0) return 'Standard explosion radius and blast damage.';
      const radius = [25, 50, 80];
      const damage = [35, 75, 120];
      return `+${radius[rank - 1]}% blast radius and +${damage[rank - 1]}% explosive concussive damage.`;
    },
  },
];

// --- STAT CALCULATION HELPERS ---

export function getHealthRegenRate(ranks: SkillRanks): number {
  const rank = ranks.vitality_regen || 0;
  if (rank === 1) return 0.8;
  if (rank === 2) return 1.8;
  if (rank === 3) return 3.2;
  return 0;
}

export function getMovementSpeedMultiplier(ranks: SkillRanks): number {
  const rank = ranks.fleet_foot || 0;
  if (rank === 1) return 1.10;
  if (rank === 2) return 1.20;
  if (rank === 3) return 1.32;
  return 1.0;
}

export function getMaxHealthBonus(ranks: SkillRanks): number {
  const rank = ranks.iron_constitution || 0;
  if (rank === 1) return 30;
  if (rank === 2) return 65;
  if (rank === 3) return 100;
  return 0;
}

export function getStaminaRegenMultiplier(ranks: SkillRanks): number {
  const rank = ranks.stamina_surge || 0;
  if (rank === 1) return 1.35;
  if (rank === 2) return 1.75;
  if (rank === 3) return 2.20;
  return 1.0;
}

export function getHeadshotDamageMultiplierBonus(ranks: SkillRanks): number {
  const rank = ranks.deadly_precision || 0;
  if (rank === 1) return 0.25;
  if (rank === 2) return 0.50;
  if (rank === 3) return 0.85;
  return 0;
}

export function getReloadSpeedMultiplier(ranks: SkillRanks): number {
  const rank = ranks.rapid_reload || 0;
  if (rank === 1) return 1.18;
  if (rank === 2) return 1.35;
  if (rank === 3) return 1.52;
  return 1.0;
}

export function getScavengerBonus(ranks: SkillRanks): number {
  const rank = ranks.scavenger_instinct || 0;
  if (rank === 1) return 0.30;
  if (rank === 2) return 0.65;
  if (rank === 3) return 1.00;
  return 0;
}

export function getTrapPlacementRange(ranks: SkillRanks): number {
  const rank = ranks.extended_reach || 0;
  if (rank === 1) return 8.5;
  if (rank === 2) return 11.0;
  if (rank === 3) return 14.0;
  return 6.5; // Base distance
}

export function getExtraTrapUses(ranks: SkillRanks): number {
  return ranks.reinforced_traps || 0;
}

export function getExplosiveMultiplier(ranks: SkillRanks): { radiusMult: number; damageMult: number } {
  const rank = ranks.demolition_expert || 0;
  if (rank === 1) return { radiusMult: 1.25, damageMult: 1.35 };
  if (rank === 2) return { radiusMult: 1.50, damageMult: 1.75 };
  if (rank === 3) return { radiusMult: 1.80, damageMult: 2.20 };
  return { radiusMult: 1.0, damageMult: 1.0 };
}

// --- VALIDATION & UPGRADE ENGINE ---

export function canUpgradeSkill(
  skillId: SkillId,
  state: SkillTreeState
): { canUpgrade: boolean; reason?: string; cost: number } {
  const def = SKILL_DEFINITIONS.find((s) => s.id === skillId);
  if (!def) return { canUpgrade: false, reason: 'Unknown skill', cost: 0 };

  const currentRank = state.ranks[skillId] || 0;
  if (currentRank >= def.maxRank) {
    return { canUpgrade: false, reason: 'Skill already at maximum rank', cost: 0 };
  }

  // Prerequisite check
  if (def.prerequisiteId) {
    const prereqRank = state.ranks[def.prerequisiteId] || 0;
    if (prereqRank < 1) {
      const prereqDef = SKILL_DEFINITIONS.find((s) => s.id === def.prerequisiteId);
      return {
        canUpgrade: false,
        reason: `Requires Rank 1 in ${prereqDef?.name || 'Prerequisite'}`,
        cost: 0,
      };
    }
  }

  const cost = def.costPerRank[currentRank] || 1;
  if (state.availablePoints < cost) {
    return {
      canUpgrade: false,
      reason: `Requires ${cost} Skill Point${cost > 1 ? 's' : ''} (You have ${state.availablePoints})`,
      cost,
    };
  }

  return { canUpgrade: true, cost };
}

export function applySkillUpgrade(skillId: SkillId, state: SkillTreeState): boolean {
  const check = canUpgradeSkill(skillId, state);
  if (!check.canUpgrade) return false;

  state.availablePoints -= check.cost;
  state.ranks[skillId] = (state.ranks[skillId] || 0) + 1;
  return true;
}

export function respecSkillTree(state: SkillTreeState): void {
  state.availablePoints = state.totalPointsEarned;
  state.ranks = { ...INITIAL_SKILL_RANKS };
}
