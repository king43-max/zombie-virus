import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bomb,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Flame,
  Footprints,
  HeartPulse,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  canUpgradeSkill,
  SKILL_DEFINITIONS,
} from '../game/SkillTree';
import {
  SkillCategory,
  SkillId,
  SkillTreeState,
} from '../types/game';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillTreeState: SkillTreeState;
  onUpgradeSkill: (skillId: SkillId) => void;
  onRespecSkills: () => void;
}

export function SkillTreeModal({
  isOpen,
  onClose,
  skillTreeState,
  onUpgradeSkill,
  onRespecSkills,
}: SkillTreeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [showRespecConfirm, setShowRespecConfirm] = useState(false);

  if (!isOpen) return null;

  const categories: { id: SkillCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All Attributes', icon: <Sparkles className="h-4 w-4" />, color: 'text-amber-400' },
    { id: 'survival', label: 'Survival & Vitals', icon: <HeartPulse className="h-4 w-4" />, color: 'text-emerald-400' },
    { id: 'combat', label: 'Combat & Ballistics', icon: <Crosshair className="h-4 w-4" />, color: 'text-red-400' },
    { id: 'engineering', label: 'Engineering & Traps', icon: <Wrench className="h-4 w-4" />, color: 'text-cyan-400' },
  ];

  const filteredSkills = SKILL_DEFINITIONS.filter(
    (skill) => selectedCategory === 'all' || skill.category === selectedCategory
  );

  const getSkillIcon = (id: SkillId) => {
    switch (id) {
      case 'vitality_regen':
        return <HeartPulse className="h-6 w-6 text-emerald-400" />;
      case 'fleet_foot':
        return <Footprints className="h-6 w-6 text-emerald-400" />;
      case 'iron_constitution':
        return <Shield className="h-6 w-6 text-emerald-400" />;
      case 'stamina_surge':
        return <Zap className="h-6 w-6 text-emerald-400" />;
      case 'deadly_precision':
        return <Crosshair className="h-6 w-6 text-red-400" />;
      case 'rapid_reload':
        return <RefreshCw className="h-6 w-6 text-red-400" />;
      case 'scavenger_instinct':
        return <Sparkles className="h-6 w-6 text-red-400" />;
      case 'extended_reach':
        return <Activity className="h-6 w-6 text-cyan-400" />;
      case 'reinforced_traps':
        return <Wrench className="h-6 w-6 text-cyan-400" />;
      case 'demolition_expert':
        return <Bomb className="h-6 w-6 text-cyan-400" />;
      default:
        return <Sparkles className="h-6 w-6 text-amber-400" />;
    }
  };

  const getCategoryBadge = (category: SkillCategory) => {
    switch (category) {
      case 'survival':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60 uppercase">
            Survival
          </span>
        );
      case 'combat':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-950/80 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-800/60 uppercase">
            Combat
          </span>
        );
      case 'engineering':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-800/60 uppercase">
            Engineering
          </span>
        );
    }
  };

  return (
    <div
      id="skill-tree-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
    >
      <div
        id="skill-tree-modal-container"
        className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Passive Attributes & Skill Tree</span>
                <span className="text-xs font-mono font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  [K]
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Permanent physical conditioning, ballistics enhancements, and trap modifications.
              </p>
            </div>
          </div>

          {/* SKILL POINTS STATUS BAR */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-2 shadow-lg shadow-amber-950/30">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Available Skill Points
                </div>
                <div className="text-xl font-black text-amber-400 leading-none">
                  {skillTreeState.availablePoints} <span className="text-xs font-normal text-amber-200/80">PTS</span>
                </div>
              </div>
              <div className="h-8 w-px bg-amber-500/30" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Kill Meter
                </div>
                <div className="text-xs font-mono text-zinc-300">
                  {skillTreeState.killsTowardsNextPoint} / {skillTreeState.killsPerPoint} Kills
                </div>
              </div>
            </div>

            {/* RESPEC BUTTON */}
            <button
              id="respec-skills-btn"
              onClick={() => setShowRespecConfirm(!showRespecConfirm)}
              title="Reset and refund all skill points"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-amber-500/50 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Respec</span>
            </button>

            {/* CLOSE BUTTON */}
            <button
              id="close-skill-tree-btn"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* RESPEC CONFIRMATION BANNER */}
        {showRespecConfirm && (
          <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-950/60 px-6 py-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Refund all spent points and reset all passive attributes to rank 0?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRespecSkills();
                  setShowRespecConfirm(false);
                }}
                className="rounded bg-amber-600 px-3 py-1 font-bold text-white transition hover:bg-amber-500"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowRespecConfirm(false)}
                className="rounded bg-zinc-800 px-3 py-1 font-bold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 py-2.5 gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`skill-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-600'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <span className={cat.color}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* SKILLS GRID */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => {
              const currentRank = skillTreeState.ranks[skill.id] || 0;
              const isMaxRank = currentRank >= skill.maxRank;
              const check = canUpgradeSkill(skill.id, skillTreeState);

              return (
                <div
                  key={skill.id}
                  id={`skill-card-${skill.id}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    currentRank > 0
                      ? 'border-zinc-600 bg-zinc-900/90 shadow-lg'
                      : check.canUpgrade
                      ? 'border-zinc-700/80 bg-zinc-900/40 hover:border-zinc-500'
                      : 'border-zinc-800/60 bg-zinc-950/60 opacity-85'
                  }`}
                >
                  <div>
                    {/* CARD TOP HEADER */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                            currentRank > 0
                              ? 'border-zinc-500 bg-zinc-800'
                              : 'border-zinc-800 bg-zinc-900'
                          }`}
                        >
                          {getSkillIcon(skill.id)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{skill.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getCategoryBadge(skill.category)}
                            <span className="text-[11px] font-mono text-zinc-400">
                              Tier {skill.tier}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RANK PILLS */}
                      <div className="flex items-center gap-1 pt-1">
                        {Array.from({ length: skill.maxRank }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 w-2.5 rounded-full border transition-all ${
                              i < currentRank
                                ? 'border-amber-400 bg-amber-400 shadow-sm shadow-amber-400/50'
                                : 'border-zinc-700 bg-zinc-900'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                      {skill.description}
                    </p>

                    {/* CURRENT & NEXT EFFECT */}
                    <div className="mt-3.5 space-y-1.5 rounded-lg border border-zinc-800/90 bg-black/50 p-2.5 text-xs font-mono">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-zinc-500 text-[11px] uppercase">Current Effect:</span>
                        <span className={currentRank > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                          {skill.getEffectDescription(currentRank)}
                        </span>
                      </div>

                      {!isMaxRank && (
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-zinc-800/80">
                          <span className="text-zinc-500 text-[11px] uppercase">Next Rank:</span>
                          <span className="text-amber-300 font-bold">
                            {skill.getEffectDescription(currentRank + 1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PREREQUISITE WARNING */}
                    {check.reason && !check.canUpgrade && !isMaxRank && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400/90">
                        <Lock className="h-3 w-3 shrink-0" />
                        <span>{check.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* UPGRADE ACTION BUTTON */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    {isMaxRank ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/40 py-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Maximum Rank Mastered</span>
                      </div>
                    ) : (
                      <button
                        id={`upgrade-btn-${skill.id}`}
                        onClick={() => onUpgradeSkill(skill.id)}
                        disabled={!check.canUpgrade}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                          check.canUpgrade
                            ? 'bg-amber-600 text-white hover:bg-amber-500 active:scale-[0.98] shadow-md shadow-amber-950/50 cursor-pointer'
                            : 'bg-zinc-800/60 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                        }`}
                      >
                        <span>Upgrade Rank ({currentRank + 1}/{skill.maxRank})</span>
                        <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                          {check.cost} {check.cost === 1 ? 'PT' : 'PTS'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-6 py-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">Tip:</span> Defeating 4 zombies awards 1 permanent Skill Point, plus +1 bonus point at the end of every wave.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700"
          >
            Back to Combat [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
