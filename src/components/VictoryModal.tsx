import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Crosshair, Flame, Play, RotateCcw, Skull } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onContinueEndless: () => void;
  onRestart: () => void;
  stats: {
    score: number;
    kills: number;
    headshots: number;
    wave: number;
  };
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onContinueEndless,
  onRestart,
  stats,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="victory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-700/80 bg-zinc-950 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-700 bg-emerald-950/80 text-emerald-400 shadow-inner">
          <CheckCircle2 className="h-9 w-9 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400">
          EXTRACTION CONFIRMED!
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          You reached the evacuation helicopter and escaped the infected quarantine zone alive!
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Waves Cleared</span>
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white">{stats.wave}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase">
              <Skull className="h-3.5 w-3.5 text-zinc-400" />
              <span>Zombies Eliminated</span>
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white">{stats.kills}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase">
              <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
              <span>Headshots</span>
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white">{stats.headshots}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>Final Score</span>
            </div>
            <div className="mt-1 font-mono text-xl font-black text-emerald-400">{stats.score}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            id="continue-endless-btn"
            onClick={onContinueEndless}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Play className="h-4 w-4" />
            <span>Continue Endless Survival</span>
          </button>

          <button
            id="new-mission-btn"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span>New Mission (Restart)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

