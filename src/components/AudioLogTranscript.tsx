import React from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, X, Radio, CassetteTape } from 'lucide-react';
import { AudioLogPlaybackState } from '../types/game';

interface AudioLogTranscriptProps {
  playback: AudioLogPlaybackState;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onDismiss: () => void;
  onOpenArchive: () => void;
}

export const AudioLogTranscript: React.FC<AudioLogTranscriptProps> = ({
  playback,
  onPause,
  onResume,
  onReplay,
  onDismiss,
  onOpenArchive,
}) => {
  const { log, currentTime, duration, isPlaying, isComplete } = playback;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'origin':
        return 'border-amber-500/80 text-amber-400 bg-amber-950/40';
      case 'military':
        return 'border-sky-500/80 text-sky-400 bg-sky-950/40';
      case 'mutation':
        return 'border-purple-500/80 text-purple-400 bg-purple-950/40';
      case 'crafting':
        return 'border-emerald-500/80 text-emerald-400 bg-emerald-950/40';
      case 'hazards':
        return 'border-rose-500/80 text-rose-400 bg-rose-950/40';
      case 'evacuation':
        return 'border-cyan-500/80 text-cyan-400 bg-cyan-950/40';
      default:
        return 'border-zinc-500/80 text-zinc-400 bg-zinc-950/40';
    }
  };

  return (
    <div
      id="audio-log-transcript-panel"
      className="pointer-events-auto absolute bottom-24 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-500/50 bg-black/92 p-4.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* HEADER: Title & Cassette Visual */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950/70 border border-amber-500/60 text-amber-400 shadow-inner">
            <Radio className={`h-4.5 w-4.5 ${isPlaying ? 'animate-pulse text-amber-300' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                AUDIO LOG #{log.number}
              </span>
              <span
                className={`rounded-full border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${getCategoryColor(
                  log.category
                )}`}
              >
                {log.category}
              </span>
            </div>
            <h3 className="text-sm font-black text-white tracking-tight">{log.title}</h3>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          id="dismiss-transcript-btn"
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          title="Close Transcript"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* SPEAKER ATTRIBUTION & TIMESTAMP */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="font-semibold text-zinc-200">
          <span className="text-amber-400">{log.speaker}</span>
          <span className="mx-1.5 text-zinc-600">•</span>
          <span className="text-zinc-400">{log.role}</span>
        </div>
        <div className="font-mono text-[10px] text-zinc-500">{log.timestamp}</div>
      </div>

      {/* ANIMATED CASSETTE TAPE EQUALIZER */}
      <div className="my-2.5 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Animated Reel Icon */}
          <div
            className={`h-4 w-4 rounded-full border border-amber-400/80 border-dashed ${
              isPlaying ? 'animate-spin' : ''
            }`}
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {isPlaying ? 'TAPE MOTOR RUNNING' : isComplete ? 'PLAYBACK FINISHED' : 'PAUSED'}
          </span>
        </div>

        {/* Dynamic Equalizer Bars */}
        <div className="flex items-end gap-0.8 h-3.5">
          {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-sm bg-amber-400 transition-all duration-150 ${
                isPlaying ? 'opacity-90' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 0.9 : 1.2)) % 100)}%` : '20%',
              }}
            />
          ))}
        </div>
      </div>

      {/* VERBATIM NARRATIVE TRANSCRIPT */}
      <div className="max-h-28 overflow-y-auto rounded-lg bg-black/60 p-2.5 font-sans text-xs leading-relaxed text-zinc-200 border border-zinc-800/80 selection:bg-amber-500/40">
        <span className="font-serif italic text-amber-200/90 tracking-wide">
          "{log.transcript}"
        </span>
      </div>

      {/* SCRUBBER & CONTROLS */}
      <div className="mt-3 flex flex-col gap-2">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-400">{formatTime(currentTime)}</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-150 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-400">{formatTime(duration)}</span>
        </div>

        {/* Playback action bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <button
                onClick={onReplay}
                id="replay-log-btn"
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/70 bg-amber-950/60 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900/80 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Replay</span>
              </button>
            ) : isPlaying ? (
              <button
                onClick={onPause}
                id="pause-log-btn"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onResume}
                id="resume-log-btn"
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/70 bg-amber-950/60 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900/80 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={onOpenArchive}
              id="view-archive-btn"
              className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              All Logs [L]
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500">Press [E] nearby to stop</div>
        </div>
      </div>
    </div>
  );
};
