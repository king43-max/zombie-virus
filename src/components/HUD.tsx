import React from 'react';
import {
  Activity,
  Award,
  CircleDollarSign,
  Compass,
  Cpu,
  Crosshair,
  Flame,
  FlaskConical,
  Hammer,
  Radio,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  CraftingMaterials,
  ObjectiveState,
  PlayerStats,
  TrapType,
  WeaponConfig,
  WeaponId,
  WeaponState,
  AudioLogPlaybackState,
} from '../types/game';
import { AudioLogTranscript } from './AudioLogTranscript';

interface HUDProps {
  stats: PlayerStats;
  activeWeapon: WeaponConfig | null;
  weaponState: WeaponState | null;
  inventory: WeaponId[];
  wave: number;
  remainingZombies: number;
  isIntermission: boolean;
  intermissionTimer: number;
  objective: ObjectiveState;
  interactPrompt: string | null;
  hitMarker: 'body' | 'head' | null;
  isDamaged: boolean;
  materials: CraftingMaterials;
  trapInventory: Record<TrapType, number>;
  isPlacingTrap: boolean;
  placingTrapType: TrapType | null;
  skillPoints?: number;
  onOpenSkillTree?: () => void;
  audioLogPlayback?: AudioLogPlaybackState | null;
  audioLogsDiscoveredCount?: number;
  totalAudioLogsCount?: number;
  onPauseAudioLog?: () => void;
  onResumeAudioLog?: () => void;
  onReplayAudioLog?: () => void;
  onDismissAudioLog?: () => void;
  onOpenAudioLogArchive?: () => void;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: () => void;
  onSelectWeapon: (id: WeaponId) => void;
  onStartPlacingTrap: (type: TrapType) => void;
  onPauseClick: () => void;
  isPointerLocked: boolean;
  onLockClick: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  activeWeapon,
  weaponState,
  inventory,
  wave,
  remainingZombies,
  isIntermission,
  intermissionTimer,
  objective,
  interactPrompt,
  hitMarker,
  isDamaged,
  materials,
  trapInventory,
  isPlacingTrap,
  placingTrapType,
  skillPoints = 0,
  onOpenSkillTree,
  audioLogPlayback,
  audioLogsDiscoveredCount = 0,
  totalAudioLogsCount = 6,
  onPauseAudioLog,
  onResumeAudioLog,
  onReplayAudioLog,
  onDismissAudioLog,
  onOpenAudioLogArchive,
  touchControlsEnabled = false,
  onToggleTouchControls,
  onSelectWeapon,
  onStartPlacingTrap,
  onPauseClick,
  isPointerLocked,
  onLockClick,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
  const armorPercent = Math.max(0, Math.min(100, (stats.armor / stats.maxArmor) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100));

  const allWeapons: { id: WeaponId; name: string }[] = [
    { id: 'pistol', name: 'Pistol' },
    { id: 'shotgun', name: 'Shotgun' },
    { id: 'rifle', name: 'Assault' },
    { id: 'marksman', name: 'Sniper' },
    { id: 'flamethrower', name: 'Flamethrower' },
    { id: 'arc_rifle', name: 'Tesla Cannon' },
  ];

  const trapNames: Record<TrapType, { name: string; key: string }> = {
    bear_trap: { name: 'Bear Trap', key: 'B' },
    spike_strip: { name: 'Spike Strip', key: 'X' },
    pipe_bomb: { name: 'Pipe Bomb', key: 'G' },
  };

  return (
    <div id="game-hud-overlay" className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Red Damage Vignette */}
      {isDamaged && (
        <div
          id="damage-vignette"
          className="pointer-events-none absolute inset-0 animate-pulse bg-radial from-transparent via-red-950/20 to-red-600/50"
        />
      )}

      {/* Critical Low Health Warning Glow */}
      {stats.health <= 25 && (
        <div
          id="low-health-vignette"
          className="pointer-events-none absolute inset-0 animate-ping bg-radial from-transparent to-red-900/30"
          style={{ animationDuration: '1.2s' }}
        />
      )}

      {/* TOP BAR: Waves, Objective, Resources & Score */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {/* Left: Wave & Undead tracker */}
        <div className="flex flex-col gap-2">
          <div
            id="wave-badge"
            className="flex items-center gap-3 rounded-lg border border-red-900/60 bg-black/80 px-4 py-2.5 shadow-lg backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-950/80 border border-red-700/80 text-red-400">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-red-400/90 uppercase">Survive Outbreak</span>
                <span className="rounded bg-red-900/50 px-1.5 py-0.2 text-[10px] font-bold text-red-200">
                  WAVE {wave}
                </span>
              </div>
              <div className="text-sm font-bold text-zinc-100">
                {isIntermission ? (
                  <span className="text-amber-400">
                    Next wave in <span className="text-base font-black">{intermissionTimer}s</span>
                  </span>
                ) : (
                  <span>
                    Undead Remaining:{' '}
                    <span className="font-mono text-base font-black text-red-400">{remainingZombies}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tactical Scavenged Materials Quick Status */}
          <div
            id="hud-materials-pill"
            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-black/75 px-3 py-1.5 shadow-md backdrop-blur-sm text-[11px] font-mono text-zinc-300"
          >
            <span className="flex items-center gap-1 text-amber-300 font-bold" title="Scrap Metal">
              <Hammer className="h-3 w-3" />
              {materials.scrapMetal}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-sky-300 font-bold" title="Electronics">
              <Cpu className="h-3 w-3" />
              {materials.electronics}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-emerald-300 font-bold" title="Chemicals">
              <FlaskConical className="h-3 w-3" />
              {materials.chemicals}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-purple-300 font-bold" title="Weapon Parts">
              <Wrench className="h-3 w-3" />
              {materials.weaponParts}
            </span>
          </div>
        </div>

        {/* Center: Objective Banner */}
        <div
          id="objective-banner"
          className="flex max-w-md items-center gap-3 rounded-lg border border-zinc-800 bg-black/80 px-4 py-2.5 shadow-lg backdrop-blur-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-950/70 border border-amber-700/60 text-amber-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">Mission Objective</div>
            <div className="text-xs font-semibold text-zinc-200">{objective.description}</div>
          </div>
        </div>

        {/* Right: Cash, Score, Pause */}
        <div className="flex items-center gap-3">
          <div
            id="cash-score-display"
            className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-black/80 px-4 py-2 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-1.5 font-mono text-base font-bold text-emerald-400">
              <CircleDollarSign className="h-4 w-4" />
              <span>${stats.cash}</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-300">
              <Award className="h-4 w-4 text-amber-400" />
              <span>{stats.score}</span>
            </div>
          </div>

          {onOpenSkillTree && (
            <button
              id="hud-skills-btn"
              onClick={onOpenSkillTree}
              className={`pointer-events-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                skillPoints > 0
                  ? 'border-amber-500 bg-amber-950/80 text-amber-300 shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/50'
                  : 'border-zinc-800 bg-black/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>[K] SKILLS</span>
              {skillPoints > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-black">
                  {skillPoints}
                </span>
              )}
            </button>
          )}

          {/* Audio Logs Archive Button */}
          {onOpenAudioLogArchive && (
            <button
              id="hud-logs-btn"
              onClick={onOpenAudioLogArchive}
              className={`pointer-events-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                audioLogPlayback
                  ? 'border-amber-500 bg-amber-950/80 text-amber-300 ring-1 ring-amber-400/50'
                  : 'border-zinc-800 bg-black/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
              title="View Quarantine Zone Audio Logs Archive [L]"
            >
              <Radio className="h-3.5 w-3.5 text-amber-400" />
              <span>[L] LOGS</span>
              <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300">
                {audioLogsDiscoveredCount}/{totalAudioLogsCount}
              </span>
            </button>
          )}

          {/* Touch Controls Toggle Button */}
          {onToggleTouchControls && (
            <button
              id="hud-touch-btn"
              onClick={onToggleTouchControls}
              className={`pointer-events-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                touchControlsEnabled
                  ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 ring-1 ring-cyan-400/50'
                  : 'border-zinc-800 bg-black/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Toggle Mobile Touch Controls"
            >
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">TOUCH</span>
              <span className="text-[10px] uppercase font-black">
                {touchControlsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          <button
            id="pause-menu-btn"
            onClick={onPauseClick}
            className="pointer-events-auto rounded-lg border border-zinc-800 bg-black/80 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            [ESC] MENU
          </button>
        </div>
      </div>

      {/* CENTER: Crosshair & Hit Markers */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Standard crosshair dot & brackets */}
        <div className="relative flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm" />
          <div className="absolute h-6 w-6 rounded-full border border-white/20" />

          {/* Dynamic Hitmarker */}
          {hitMarker && (
            <div
              id="hit-marker"
              className={`absolute h-8 w-8 animate-ping font-mono font-black ${
                hitMarker === 'head' ? 'text-red-500 scale-125' : 'text-amber-400'
              }`}
            >
              ✕
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE TRAP PLACEMENT BANNER */}
      {isPlacingTrap && placingTrapType && (
        <div
          id="trap-placement-banner"
          className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-cyan-500/80 bg-black/90 px-6 py-3 shadow-2xl backdrop-blur-md animate-pulse"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950 border border-cyan-500 text-cyan-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-cyan-400">
              Deploying Trap: {trapNames[placingTrapType]?.name || placingTrapType}
            </div>
            <div className="text-[11px] font-bold text-zinc-300">
              <span className="text-white font-black">[LEFT CLICK]</span> Deploy on Ground &nbsp;•&nbsp;
              <span className="text-white font-black">[RIGHT CLICK / ESC]</span> Cancel
            </div>
          </div>
        </div>
      )}

      {/* INTERACT PROMPT */}
      {interactPrompt && !isPlacingTrap && (
        <div
          id="interact-prompt"
          className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-xl border border-amber-500/80 bg-black/90 px-5 py-2.5 shadow-2xl backdrop-blur-md animate-bounce"
        >
          <div className="rounded bg-amber-500 px-2 py-0.5 font-mono text-xs font-black text-black">E</div>
          <span className="text-sm font-bold text-amber-200">{interactPrompt}</span>
        </div>
      )}

      {/* RESUME POINTER LOCK OVERLAY IF DISENGAGED (Hidden when touch controls are active) */}
      {!isPointerLocked && !touchControlsEnabled && (
        <div
          id="click-to-focus-banner"
          onClick={onLockClick}
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
        >
          <div className="rounded-xl border border-cyan-500/80 bg-black/90 px-6 py-4 text-center shadow-2xl backdrop-blur-md">
            <div className="text-base font-black text-white uppercase tracking-wider">
              Click Screen to Aim & Fire
            </div>
            <div className="mt-1 text-xs text-cyan-400">Lock mouse cursor for 3D combat control</div>
          </div>
        </div>
      )}

      {/* BOTTOM LEFT: Health, Armor, Stamina, Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-3">
        {/* Health & Armor Card */}
        <div
          id="player-vitals-card"
          className="flex w-72 flex-col gap-2 rounded-xl border border-zinc-800/90 bg-black/85 p-3.5 shadow-2xl backdrop-blur-md"
        >
          {/* Health Bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-red-400">
                <Activity className="h-3.5 w-3.5" />
                <span>HEALTH</span>
              </div>
              <span className="font-mono text-zinc-100">
                {Math.ceil(stats.health)} / {stats.maxHealth}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full transition-all duration-150 ${
                  stats.health <= 25 ? 'bg-red-600 animate-pulse' : 'bg-red-500'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-sky-400">
                <Shield className="h-3.5 w-3.5" />
                <span>ARMOR</span>
              </div>
              <span className="font-mono text-zinc-100">
                {Math.ceil(stats.armor)} / {stats.maxArmor}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-sky-500 transition-all duration-150"
                style={{ width: `${armorPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                <span>STAMINA</span>
              </div>
              <span className="font-mono text-zinc-300">{Math.ceil(stats.stamina)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-100"
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Keyboard Hints (Only shown when not using touch controls) */}
        {!touchControlsEnabled && (
          <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-300">[F] Flashlight</span>
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-300">[V] 1st/3rd Person</span>
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-300">[C] Crouch</span>
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-300">[Shift] Sprint</span>
          </div>
        )}
      </div>

      {/* BOTTOM RIGHT: Traps, Weapon Selector, Active Weapon (Desktop layout; mobile has dedicated buttons) */}
      {!touchControlsEnabled && (
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5">
        {/* Tactical Traps Quick-Deploy Strip */}
        <div id="trap-quick-strip" className="pointer-events-auto flex items-center gap-2">
          {(
            [
              { type: 'bear_trap', label: 'Bear Trap', key: 'B' },
              { type: 'spike_strip', label: 'Spike Strip', key: 'X' },
              { type: 'pipe_bomb', label: 'Pipe Bomb', key: 'G' },
            ] as const
          ).map((trap) => {
            const count = trapInventory[trap.type] || 0;
            const isCurrentlyPlacing = isPlacingTrap && placingTrapType === trap.type;

            return (
              <button
                key={trap.type}
                id={`deploy-trap-btn-${trap.type}`}
                disabled={count <= 0}
                onClick={() => onStartPlacingTrap(trap.type)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  isCurrentlyPlacing
                    ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 ring-2 ring-cyan-500 shadow-lg'
                    : count > 0
                    ? 'border-zinc-700 bg-black/80 text-zinc-200 hover:border-cyan-500 hover:text-white'
                    : 'border-zinc-900 bg-black/40 text-zinc-600 opacity-50 cursor-not-allowed'
                }`}
                title={`Deploy ${trap.label} (Hotkey: [${trap.key}])`}
              >
                <span className="rounded bg-zinc-800 px-1 py-0.2 text-[9px] font-mono font-black text-cyan-400">
                  [{trap.key}]
                </span>
                <span>{trap.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-black ${
                    count > 0 ? 'bg-cyan-900/70 text-cyan-300' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  x{count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Weapon Selection Strip */}
        <div id="weapon-selector-strip" className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 max-w-xl">
          {allWeapons.map((w, i) => {
            const hasIt = inventory.includes(w.id);
            const isSelected = activeWeapon?.id === w.id;

            return (
              <button
                key={w.id}
                id={`select-weapon-btn-${w.id}`}
                disabled={!hasIt}
                onClick={() => onSelectWeapon(w.id)}
                className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-950/80 text-amber-200 shadow-md'
                    : hasIt
                    ? 'border-zinc-800 bg-black/70 text-zinc-300 hover:border-zinc-600'
                    : 'border-zinc-900 bg-black/40 text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
              >
                <span className="mr-1 text-[10px] text-zinc-400">[{i + 1}]</span>
                {w.name}
              </button>
            );
          })}
        </div>

        {/* Active Weapon Card */}
        {activeWeapon && weaponState && (
          <div
            id="active-weapon-card"
            className="flex items-center gap-4 rounded-xl border border-zinc-800/90 bg-black/85 p-3.5 shadow-2xl backdrop-blur-md"
          >
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-xs text-amber-400 font-semibold uppercase">
                <span>{activeWeapon.category}</span>
                <span className="rounded bg-amber-900/60 px-1 py-0.2 text-[10px] font-bold text-amber-200">
                  LVL {activeWeapon.upgradeLevel}
                </span>
              </div>
              <div className="text-sm font-bold text-zinc-100">{activeWeapon.name}</div>
            </div>

            {/* Ammo Display */}
            <div className="border-l border-zinc-800 pl-4 text-center">
              <div className="font-mono text-3xl font-black tracking-tight text-white">
                {weaponState.isReloading ? (
                  <span className="text-sm font-bold text-amber-400 animate-pulse">RELOADING...</span>
                ) : (
                  <span>
                    <span className={weaponState.currentMag <= 3 ? 'text-red-500' : 'text-white'}>
                      {weaponState.currentMag}
                    </span>
                    <span className="text-base text-zinc-500"> / {weaponState.reserveAmmo}</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                {weaponState.isReloading ? (
                  <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${weaponState.reloadProgress * 100}%` }}
                    />
                  </div>
                ) : (
                  '[R] Reload'
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* NARRATIVE AUDIO LOG TRANSCRIPT OVERLAY */}
      {audioLogPlayback && (
        <AudioLogTranscript
          playback={audioLogPlayback}
          onPause={() => onPauseAudioLog?.()}
          onResume={() => onResumeAudioLog?.()}
          onReplay={() => onReplayAudioLog?.()}
          onDismiss={() => onDismissAudioLog?.()}
          onOpenArchive={() => onOpenAudioLogArchive?.()}
        />
      )}
    </div>
  );
};
