import { CraftingMaterials, CraftingRecipe, WeaponId, TrapType, WeaponModState } from '../types/game';

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // --- UNIQUE WEAPONS ---
  {
    id: 'craft_flamethrower',
    name: "Dragon's Breath Flamethrower",
    category: 'weapons',
    description: 'High-pressure chemical flamethrower. Shoots an unbroken torrent of liquid flame that ignites hordes and burns them over time.',
    cost: {
      scrapMetal: 12,
      chemicals: 8,
      electronics: 4,
    },
    blueprintRequired: 'blueprint_flamethrower',
    blueprintName: "Dragon's Breath Projector Schematic",
    unlockWave: 2,
    resultType: 'weapon',
    resultTarget: 'flamethrower',
  },
  {
    id: 'craft_arc_rifle',
    name: 'Tesla Arc Plasma Cannon',
    category: 'weapons',
    description: 'Fires high-voltage lightning discharges that arc between multiple zombies, dealing heavy electric shock damage and stunning them.',
    cost: {
      scrapMetal: 14,
      electronics: 12,
      weaponParts: 6,
    },
    blueprintRequired: 'blueprint_arc_rifle',
    blueprintName: 'Tesla Magnetic Coil Blueprint',
    unlockWave: 3,
    resultType: 'weapon',
    resultTarget: 'arc_rifle',
  },

  // --- WEAPON MODS & ATTACHMENTS ---
  {
    id: 'mod_drum_mag',
    name: 'High-Capacity Drum Magazine',
    category: 'mods',
    description: 'Expands weapon magazine size by +50% across all firearms, drastically reducing reload frequency during heavy swarms.',
    cost: {
      scrapMetal: 6,
      electronics: 4,
    },
    blueprintRequired: 'blueprint_drum_mag',
    blueprintName: 'Extended Drum Feed Assembly',
    unlockWave: 2,
    resultType: 'mod',
    resultTarget: 'hasDrumMag',
  },
  {
    id: 'mod_compensator',
    name: 'Heavy Recoil Compensator',
    category: 'mods',
    description: 'Tuned muzzle brake that reduces bullet spread by 45% and increases effective damage falloff range by +25%.',
    cost: {
      scrapMetal: 8,
      weaponParts: 4,
    },
    blueprintRequired: 'blueprint_compensator',
    blueprintName: 'Precision Muzzle Brake Blueprints',
    unlockWave: 2,
    resultType: 'mod',
    resultTarget: 'hasCompensator',
  },
  {
    id: 'mod_incendiary',
    name: 'Phosphorus Incendiary Ammo',
    category: 'mods',
    description: 'Coats bullet payloads in chemical accelerant, causing all gunfire to ignite struck zombies for 4 seconds of burning damage.',
    cost: {
      chemicals: 8,
      scrapMetal: 4,
      electronics: 2,
    },
    blueprintRequired: 'blueprint_incendiary',
    blueprintName: 'Pyrotechnic Primer Formulation',
    unlockWave: 3,
    resultType: 'mod',
    resultTarget: 'hasIncendiary',
  },
  {
    id: 'mod_shock_coil',
    name: 'Tesla Shock Capacitor Coil',
    category: 'mods',
    description: 'Channels high-voltage electricity into ballistic rounds, arcing bonus shock damage to an adjacent zombie on hit.',
    cost: {
      electronics: 10,
      scrapMetal: 6,
      weaponParts: 3,
    },
    blueprintRequired: 'blueprint_shock_coil',
    blueprintName: 'Capacitor Overcharge Schematics',
    unlockWave: 4,
    resultType: 'mod',
    resultTarget: 'hasShockCoil',
  },

  // --- DEPLOYABLE DEFENSIVE TRAPS ---
  {
    id: 'trap_bear_trap',
    name: 'Heavy Steel Bear Trap (x2)',
    category: 'traps',
    description: 'Spring-loaded steel jaw trap. Snaps shut on zombies, dealing 260 crushing damage and immobilizing them for 4.5 seconds.',
    cost: {
      scrapMetal: 4,
      weaponParts: 2,
    },
    blueprintRequired: 'blueprint_bear_trap',
    blueprintName: 'Steel Jaw Tension Blueprint',
    unlockWave: 1, // Available immediately
    resultType: 'trap',
    resultTarget: 'bear_trap',
    amount: 2,
  },
  {
    id: 'trap_spike_strip',
    name: 'Barbed Wire Spike Strip (x2)',
    category: 'traps',
    description: '3.5m ground barrier lined with rusted steel spikes and razor wire. Heavily slows zombies (65% slow) and causes continuous bleed damage.',
    cost: {
      scrapMetal: 6,
      chemicals: 3,
    },
    blueprintRequired: 'blueprint_spike_strip',
    blueprintName: 'Perimeter Defense Specifications',
    unlockWave: 2,
    resultType: 'trap',
    resultTarget: 'spike_strip',
    amount: 2,
  },
  {
    id: 'trap_pipe_bomb',
    name: 'Tripwire Pipe Bomb (x1)',
    category: 'traps',
    description: 'High-fragmentation pipe bomb with an infrared tripwire. Detonates in a lethal 420-damage fireball when crossed by undead.',
    cost: {
      scrapMetal: 5,
      chemicals: 5,
      electronics: 3,
    },
    blueprintRequired: 'blueprint_pipe_bomb',
    blueprintName: 'Improvised Munition Manual',
    unlockWave: 3,
    resultType: 'trap',
    resultTarget: 'pipe_bomb',
    amount: 1,
  },

  // --- FIELD CRAFTED SUPPLIES ---
  {
    id: 'supply_ammo',
    name: 'Military Surplus Ammo Pack',
    category: 'supplies',
    description: 'Hand-loads combat ammunition, replenishing 60 reserve rounds for your currently equipped weapon.',
    cost: {
      scrapMetal: 3,
      chemicals: 2,
      cash: 100,
    },
    unlockWave: 1,
    resultType: 'ammo',
    amount: 60,
  },
  {
    id: 'supply_medkit',
    name: 'Trauma First-Aid Medkit',
    category: 'supplies',
    description: 'Synthesizes antiseptic and pressure bandages, instantly restoring 60 Health.',
    cost: {
      chemicals: 4,
      electronics: 2,
      cash: 120,
    },
    unlockWave: 1,
    resultType: 'health',
    amount: 60,
  },
  {
    id: 'supply_armor',
    name: 'Ballistic Composite Armor',
    category: 'supplies',
    description: 'Fabricates reinforced titanium armor plating, immediately adding 60 Armor.',
    cost: {
      scrapMetal: 6,
      weaponParts: 2,
      cash: 120,
    },
    unlockWave: 1,
    resultType: 'armor',
    amount: 60,
  },
];

export function canCraftRecipe(
  recipe: CraftingRecipe,
  materials: CraftingMaterials,
  cash: number,
  unlockedBlueprints: string[],
  currentWave: number
): { canCraft: boolean; reason?: string } {
  // Check blueprint / wave unlock
  if (recipe.blueprintRequired && !unlockedBlueprints.includes(recipe.blueprintRequired)) {
    if (recipe.unlockWave && currentWave < recipe.unlockWave) {
      return { canCraft: false, reason: `Requires ${recipe.blueprintName || 'Blueprint'} (Unlocks Wave ${recipe.unlockWave} or find in crates)` };
    }
  }

  // Check cash
  if (recipe.cost.cash && cash < recipe.cost.cash) {
    return { canCraft: false, reason: `Need $${recipe.cost.cash}` };
  }

  // Check materials
  if (recipe.cost.scrapMetal && materials.scrapMetal < recipe.cost.scrapMetal) {
    return { canCraft: false, reason: `Need ${recipe.cost.scrapMetal} Scrap Metal` };
  }
  if (recipe.cost.electronics && materials.electronics < recipe.cost.electronics) {
    return { canCraft: false, reason: `Need ${recipe.cost.electronics} Electronics` };
  }
  if (recipe.cost.chemicals && materials.chemicals < recipe.cost.chemicals) {
    return { canCraft: false, reason: `Need ${recipe.cost.chemicals} Chemicals` };
  }
  if (recipe.cost.weaponParts && materials.weaponParts < recipe.cost.weaponParts) {
    return { canCraft: false, reason: `Need ${recipe.cost.weaponParts} Weapon Parts` };
  }

  return { canCraft: true };
}
