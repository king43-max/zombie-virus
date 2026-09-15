import React, { useState } from 'react';
import {
  ArrowUpCircle,
  CircleDollarSign,
  Cpu,
  Flame,
  FlaskConical,
  Hammer,
  Heart,
  Package,
  Scroll,
  Shield,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CraftingMaterials,
  CraftingRecipe,
  PlayerStats,
  WeaponConfig,
  WeaponId,
  WeaponModState,
  WeaponState,
} from '../types/game';
import { CRAFTING_RECIPES, canCraftRecipe } from '../game/Crafting';

interface UpgradeStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  inventory: WeaponId[];
  weaponConfigs: Record<WeaponId, WeaponConfig>;
  weaponStates: Record<WeaponId, WeaponState>;
  materials: CraftingMaterials;
  blueprints: string[];
  weaponMods: WeaponModState;
  currentWave: number;
  availableSkillPoints?: number;
  onOpenSkillTree?: () => void;
  onUpgradeWeapon: (weaponId: WeaponId) => void;
  onBuyWeapon: (weaponId: WeaponId) => void;
  onBuyAmmo: (weaponId: WeaponId) => void;
  onBuyArmor: () => void;
  onBuyMedkit: () => void;
  onCraftRecipe: (recipeId: string) => void;
}

export const UpgradeStationModal: React.FC<UpgradeStationModalProps> = ({
  isOpen,
  onClose,
  stats,
  inventory,
  weaponConfigs,
  weaponStates,
  materials,
  blueprints,
  weaponMods,
  currentWave,
  availableSkillPoints,
  onOpenSkillTree,
  onUpgradeWeapon,
  onBuyWeapon,
  onBuyAmmo,
  onBuyArmor,
  onBuyMedkit,
  onCraftRecipe,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'crafting' | 'armory'>('crafting');
  const [craftCategory, setCraftCategory] = useState<'all' | 'weapons' | 'mods' | 'traps' | 'supplies'>('all');

  const standardWeaponsList: WeaponId[] = ['pistol', 'shotgun', 'rifle', 'marksman', 'flamethrower', 'arc_rifle'];

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (craftCategory === 'all') return true;
    return r.category === craftCategory;
  });

  return (
    <div
      id="upgrade-station-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-700/80 bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-400">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                Tactical Armory & Crafting Station
              </h2>
              <p className="text-xs text-zinc-400">
                Fabricate experimental weapons, engineer defensive traps, and upgrade firearms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-base font-black text-emerald-400">
              <CircleDollarSign className="h-5 w-5" />
              <span>${stats.cash}</span>
            </div>
            <button
              id="close-workbench-btn"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scavenged Materials Resource Bar */}
        <div
          id="crafting-materials-bar"
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-2.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <Package className="h-4 w-4 text-cyan-400" />
            <span>Scavenged Parts:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            {/* Scrap Metal */}
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-2.5 py-1 text-zinc-200">
              <Hammer className="h-3.5 w-3.5 text-amber-400" />
              <span>Scrap Metal:</span>
              <span className="font-mono text-amber-300">{materials.scrapMetal}</span>
            </div>

            {/* Electronics */}
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-2.5 py-1 text-zinc-200">
              <Cpu className="h-3.5 w-3.5 text-sky-400" />
              <span>Electronics:</span>
              <span className="font-mono text-sky-300">{materials.electronics}</span>
            </div>

            {/* Chemicals */}
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-2.5 py-1 text-zinc-200">
              <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
              <span>Chemicals:</span>
              <span className="font-mono text-emerald-300">{materials.chemicals}</span>
            </div>

            {/* Weapon Parts */}
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-2.5 py-1 text-zinc-200">
              <Wrench className="h-3.5 w-3.5 text-purple-400" />
              <span>Weapon Parts:</span>
              <span className="font-mono text-purple-300">{materials.weaponParts}</span>
            </div>

            {/* Blueprints */}
            <div className="flex items-center gap-1.5 rounded-md bg-cyan-950/50 border border-cyan-800/50 px-2.5 py-1 text-cyan-300">
              <Scroll className="h-3.5 w-3.5 text-cyan-400" />
              <span>Blueprints:</span>
              <span className="font-mono font-black">{blueprints.length}/8</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-3 flex border-b border-zinc-800 text-sm font-bold">
          <button
            id="tab-crafting-btn"
            onClick={() => setActiveTab('crafting')}
            className={`flex items-center gap-2 border-b-2 px-6 py-2.5 uppercase tracking-wider transition-colors ${
              activeTab === 'crafting'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Weapon Crafting & Traps</span>
          </button>
          <button
            id="tab-armory-btn"
            onClick={() => setActiveTab('armory')}
            className={`flex items-center gap-2 border-b-2 px-6 py-2.5 uppercase tracking-wider transition-colors ${
              activeTab === 'armory'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>Tactical Armory & Supplies</span>
          </button>

          {onOpenSkillTree && (
            <button
              id="tab-skills-btn"
              onClick={onOpenSkillTree}
              className="ml-auto flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3.5 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-900/50 hover:text-amber-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Passive Skill Tree</span>
              {(availableSkillPoints || 0) > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black">
                  {availableSkillPoints} PTS
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab 1: Crafting View */}
        {activeTab === 'crafting' && (
          <div className="mt-3 flex flex-1 flex-col overflow-hidden">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-zinc-800/80">
              {(
                [
                  { id: 'all', label: 'All Blueprints' },
                  { id: 'weapons', label: 'Unique Weapons' },
                  { id: 'mods', label: 'Weapon Attachments' },
                  { id: 'traps', label: 'Tactical Traps' },
                  { id: 'supplies', label: 'Field Supplies' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCraftCategory(cat.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    craftCategory === cat.id
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Recipes Grid */}
            <div className="mt-3 grid flex-1 grid-cols-1 gap-3.5 overflow-y-auto pr-1 md:grid-cols-2">
              {filteredRecipes.map((recipe) => {
                const check = canCraftRecipe(recipe, materials, stats.cash, blueprints, currentWave);
                const isOwnedWeapon = recipe.resultType === 'weapon' && recipe.resultTarget && inventory.includes(recipe.resultTarget as WeaponId);
                const isOwnedMod = recipe.resultType === 'mod' && recipe.resultTarget && weaponMods[recipe.resultTarget as keyof WeaponModState];

                const isAlreadyCrafted = isOwnedWeapon || isOwnedMod;

                return (
                  <div
                    key={recipe.id}
                    id={`recipe-card-${recipe.id}`}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                      isAlreadyCrafted
                        ? 'border-emerald-800/60 bg-emerald-950/15'
                        : check.canCraft
                        ? 'border-cyan-800/70 bg-zinc-900/80 hover:border-cyan-500'
                        : 'border-zinc-800/80 bg-zinc-950/60 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Recipe Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{recipe.name}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                                recipe.category === 'weapons'
                                  ? 'bg-amber-900/60 text-amber-300'
                                  : recipe.category === 'mods'
                                  ? 'bg-purple-900/60 text-purple-300'
                                  : recipe.category === 'traps'
                                  ? 'bg-rose-900/60 text-rose-300'
                                  : 'bg-emerald-900/60 text-emerald-300'
                              }`}
                            >
                              {recipe.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">{recipe.description}</p>
                        </div>
                      </div>

                      {/* Required Materials Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        {recipe.cost.scrapMetal && (
                          <span
                            className={`rounded px-2 py-0.5 border ${
                              materials.scrapMetal >= recipe.cost.scrapMetal
                                ? 'border-amber-800/80 bg-amber-950/40 text-amber-300'
                                : 'border-red-900/60 bg-red-950/30 text-red-400'
                            }`}
                          >
                            {recipe.cost.scrapMetal} Scrap
                          </span>
                        )}
                        {recipe.cost.electronics && (
                          <span
                            className={`rounded px-2 py-0.5 border ${
                              materials.electronics >= recipe.cost.electronics
                                ? 'border-sky-800/80 bg-sky-950/40 text-sky-300'
                                : 'border-red-900/60 bg-red-950/30 text-red-400'
                            }`}
                          >
                            {recipe.cost.electronics} Electronics
                          </span>
                        )}
                        {recipe.cost.chemicals && (
                          <span
                            className={`rounded px-2 py-0.5 border ${
                              materials.chemicals >= recipe.cost.chemicals
                                ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300'
                                : 'border-red-900/60 bg-red-950/30 text-red-400'
                            }`}
                          >
                            {recipe.cost.chemicals} Chemicals
                          </span>
                        )}
                        {recipe.cost.weaponParts && (
                          <span
                            className={`rounded px-2 py-0.5 border ${
                              materials.weaponParts >= recipe.cost.weaponParts
                                ? 'border-purple-800/80 bg-purple-950/40 text-purple-300'
                                : 'border-red-900/60 bg-red-950/30 text-red-400'
                            }`}
                          >
                            {recipe.cost.weaponParts} Parts
                          </span>
                        )}
                        {recipe.cost.cash && (
                          <span
                            className={`rounded px-2 py-0.5 border ${
                              stats.cash >= recipe.cost.cash
                                ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300'
                                : 'border-red-900/60 bg-red-950/30 text-red-400'
                            }`}
                          >
                            ${recipe.cost.cash}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3.5 flex items-center justify-between border-t border-zinc-800/70 pt-3">
                      <div className="text-[11px] text-zinc-400">
                        {isAlreadyCrafted ? (
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            ✓ Equipped / In Inventory
                          </span>
                        ) : !check.canCraft ? (
                          <span className="text-amber-400/90">{check.reason}</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Ready to Assemble</span>
                        )}
                      </div>

                      <button
                        id={`craft-btn-${recipe.id}`}
                        disabled={isAlreadyCrafted || !check.canCraft}
                        onClick={() => onCraftRecipe(recipe.id)}
                        className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${
                          isAlreadyCrafted
                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                            : check.canCraft
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95 shadow-md'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {isAlreadyCrafted ? 'Crafted' : 'Craft'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Armory View */}
        {activeTab === 'armory' && (
          <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            {/* WEAPONS SECTION */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Firearms Arsenal & Upgrades
              </h3>

              {standardWeaponsList.map((wId) => {
                const cfg = weaponConfigs[wId];
                const st = weaponStates[wId];
                const owned = inventory.includes(wId);
                const upgradeCost = Math.round(cfg.cost * 0.75) + cfg.upgradeLevel * 250;
                const canUpgrade = owned && cfg.upgradeLevel < 5 && stats.cash >= upgradeCost;
                const canBuy = !owned && stats.cash >= cfg.cost;
                const canBuyAmmo = owned && stats.cash >= 150 && st.reserveAmmo < cfg.reserveAmmoMax;

                return (
                  <div
                    key={wId}
                    id={`weapon-entry-${wId}`}
                    className={`rounded-xl border p-3.5 transition-all ${
                      owned
                        ? 'border-zinc-800 bg-zinc-900/60'
                        : 'border-dashed border-zinc-800/80 bg-zinc-950/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{cfg.name}</span>
                          {owned && (
                            <span className="rounded bg-cyan-900/60 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                              TIER {cfg.upgradeLevel}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">{cfg.category}</span>
                      </div>

                      <div className="text-right font-mono text-xs text-zinc-300">
                        {owned ? (
                          <div>
                            Ammo: {st.currentMag} / {st.reserveAmmo}
                          </div>
                        ) : (
                          <div className="font-bold text-amber-400">${cfg.cost}</div>
                        )}
                      </div>
                    </div>

                    {/* Weapon Stats */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10px] text-zinc-400 border-t border-zinc-800/60 pt-2 font-mono">
                      <div>
                        DMG: <span className="text-zinc-200">{cfg.damage}</span>
                      </div>
                      <div>
                        MAG: <span className="text-zinc-200">{cfg.magazineSize}</span>
                      </div>
                      <div>
                        ROF: <span className="text-zinc-200">{cfg.fireRate}/s</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {owned ? (
                        <>
                          <button
                            id={`buy-ammo-btn-${wId}`}
                            disabled={!canBuyAmmo}
                            onClick={() => onBuyAmmo(wId)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                              canBuyAmmo
                                ? 'border border-cyan-800/80 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60'
                                : 'border border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            +Ammo ($150)
                          </button>
                          <button
                            id={`upgrade-weapon-btn-${wId}`}
                            disabled={!canUpgrade}
                            onClick={() => onUpgradeWeapon(wId)}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                              cfg.upgradeLevel >= 5
                                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                : canUpgrade
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpCircle className="h-3 w-3" />
                            <span>
                              {cfg.upgradeLevel >= 5 ? 'MAX TIER' : `Upgrade ($${upgradeCost})`}
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          id={`buy-weapon-btn-${wId}`}
                          disabled={!canBuy}
                          onClick={() => onBuyWeapon(wId)}
                          className={`rounded-lg px-4 py-1 text-[11px] font-bold uppercase transition-all ${
                            canBuy
                              ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          Unlock Weapon
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUPPLIES & GEAR SECTION */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Supplies & Defensive Gear
              </h3>

              {/* Medkit */}
              <div
                id="buy-medkit-card"
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/80 border border-red-800/80 text-red-400">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Trauma Medkit</div>
                    <div className="text-xs text-zinc-400">Restores +50 Health immediately.</div>
                  </div>
                </div>

                <button
                  id="buy-medkit-btn"
                  disabled={stats.cash < 250 || stats.health >= stats.maxHealth}
                  onClick={onBuyMedkit}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    stats.health >= stats.maxHealth
                      ? 'bg-zinc-800 text-zinc-500 cursor-default'
                      : stats.cash >= 250
                      ? 'bg-red-600 text-white hover:bg-red-500 active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {stats.health >= stats.maxHealth ? 'HEALTH FULL' : 'BUY ($250)'}
                </button>
              </div>

              {/* Armor Plating */}
              <div
                id="buy-armor-card"
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Ballistic Vest Plating</div>
                    <div className="text-xs text-zinc-400">Restores +50 Armor protection.</div>
                  </div>
                </div>

                <button
                  id="buy-armor-btn"
                  disabled={stats.cash < 200 || stats.armor >= stats.maxArmor}
                  onClick={onBuyArmor}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    stats.armor >= stats.maxArmor
                      ? 'bg-zinc-800 text-zinc-500 cursor-default'
                      : stats.cash >= 200
                      ? 'bg-sky-600 text-white hover:bg-sky-500 active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {stats.armor >= stats.maxArmor ? 'ARMOR FULL' : 'BUY ($200)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
