import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Crosshair, Flame, Play, RotateCcw, Skull, Trophy, LogIn, Check } from 'lucide-react';
import { useFirebase } from '../firebase/FirebaseContext';
import { submitLeaderboardScore } from '../firebase/leaderboard';
import { recordGameStats } from '../firebase/userProfile';

interface VictoryModalProps {
  isOpen: boolean;
  onContinueEndless: () => void;
  onRestart: () => void;
  onOpenLeaderboard?: () => void;
  audioLogsCount?: number;
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
  onOpenLeaderboard,
  audioLogsCount = 0,
  stats,
}) => {
  const { user, signIn, refreshProfile } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmitScore = async () => {
    if (!user) {
      await signIn();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitLeaderboardScore({
        score: stats.score,
        wave: stats.wave,
        kills: stats.kills,
        headshots: stats.headshots,
        victory: true,
      });

      await recordGameStats({
        score: stats.score,
        wave: stats.wave,
        kills: stats.kills,
        headshots: stats.headshots,
        audioLogsCount,
      });

      await refreshProfile();
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit victory run to Firebase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Firebase Cloud Leaderboard Submit Box */}
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs">
          {isSubmitted ? (
            <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
              <Check className="h-4 w-4" />
              <span>Victory recorded to Global Leaderboard & Cloud Dossier!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Quarantine Cloud Sync:</span>
                {user ? (
                  <span className="font-bold text-amber-400">{user.displayName || 'Survivor'}</span>
                ) : (
                  <span className="text-zinc-500">Not signed in</span>
                )}
              </div>
              <button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40"
              >
                {user ? (
                  <>
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'Recording Run...' : 'Post Victory to Global Leaderboard'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In With Google & Save Career Stats</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>View Global Leaderboard</span>
            </button>
          )}

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
