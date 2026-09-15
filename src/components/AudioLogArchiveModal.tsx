import React, { useState } from 'react';
import {
  X,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  Sparkles,
  Search,
} from 'lucide-react';
import { AudioLog, AudioLogPlaybackState } from '../types/game';

interface AudioLogArchiveModalProps {
  logs: AudioLog[];
  activePlayback: AudioLogPlaybackState | null;
  onPlayLog: (logId: string) => void;
  onPauseLog: () => void;
  onResumeLog: () => void;
  onStopLog: () => void;
  onClose: () => void;
}

export const AudioLogArchiveModal: React.FC<AudioLogArchiveModalProps> = ({
  logs,
  activePlayback,
  onPlayLog,
  onPauseLog,
  onResumeLog,
  onStopLog,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id || '');

  const discoveredCount = logs.filter((l) => l.discovered).length;
  const totalCount = logs.length;

  const filteredLogs = logs.filter((log) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'discovered') return log.discovered;
    return log.category === selectedCategory;
  });

  const activeSelectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'origin':
        return 'bg-amber-950/60 border-amber-500/80 text-amber-300';
      case 'military':
        return 'bg-sky-950/60 border-sky-500/80 text-sky-300';
      case 'mutation':
        return 'bg-purple-950/60 border-purple-500/80 text-purple-300';
      case 'crafting':
        return 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300';
      case 'hazards':
        return 'bg-rose-950/60 border-rose-500/80 text-rose-300';
      case 'evacuation':
        return 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300';
      default:
        return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    }
  };

  const isSelectedPlaying =
    activePlayback &&
    activePlayback.log.id === activeSelectedLog?.id &&
    activePlayback.isPlaying;

  const isSelectedActive = activePlayback && activePlayback.log.id === activeSelectedLog?.id;

  return (
    <div
      id="audio-log-archive-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[88vh] max-h-[820px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-zinc-950 shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/70 bg-amber-950/60 text-amber-400 shadow-md">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-white tracking-wide">
                  QUARANTINE ZONE AUDIO ARCHIVE
                </h2>
                <span className="rounded-full border border-amber-500/40 bg-amber-950/50 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                  {discoveredCount} / {totalCount} Recovered
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Classified military and survivor audio recordings recovered from the sector
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-archive-modal-btn"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-6 py-2.5">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'discovered', label: `Discovered (${discoveredCount})` },
            { id: 'origin', label: 'Origin' },
            { id: 'military', label: 'Military' },
            { id: 'mutation', label: 'Mutations' },
            { id: 'crafting', label: 'Machinist' },
            { id: 'hazards', label: 'Grid/Hazards' },
            { id: 'evacuation', label: 'Evacuation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN BODY: Two-Column Dossier Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT LIST: Audio Log Tape Selectors */}
          <div className="w-80 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto flex flex-col gap-2.5">
            {filteredLogs.map((log) => {
              const isSelected = activeSelectedLog?.id === log.id;
              const isCurrentlyPlaying =
                activePlayback && activePlayback.log.id === log.id && activePlayback.isPlaying;

              return (
                <button
                  key={log.id}
                  id={`select-log-${log.id}`}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-950/25 shadow-lg'
                      : 'border-zinc-800/70 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {log.discovered ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                      <span className="font-mono text-[10px] font-black tracking-wider text-amber-400">
                        LOG #{log.number}
                      </span>
                    </div>

                    <span
                      className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${getCategoryBadge(
                        log.category
                      )}`}
                    >
                      {log.category}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white line-clamp-1">
                    {log.discovered ? log.title : 'Encrypted Field Recording'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate max-w-[140px]">
                      {log.discovered ? log.speaker : 'Unknown Source'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {log.durationSeconds}s
                    </span>
                  </div>

                  {isCurrentlyPlaying && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-400 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Actively Playing...</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT VIEW: Selected Audio Log Dossier & Transcript Player */}
          {activeSelectedLog ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              <div>
                {/* Dossier Header */}
                <div className="flex flex-col gap-2 border-b border-zinc-800 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black tracking-wider text-amber-400 uppercase">
                        AUDIO REEL #{activeSelectedLog.number}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getCategoryBadge(
                          activeSelectedLog.category
                        )}`}
                      >
                        {activeSelectedLog.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeSelectedLog.discovered ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <Unlock className="h-4 w-4" />
                          <span>Recovered</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <Lock className="h-4 w-4" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {activeSelectedLog.discovered ? activeSelectedLog.title : 'Field Tape Encrypted'}
                  </h1>

                  {/* Metadata cards */}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <User className="h-3.5 w-3.5 text-amber-400" />
                        <span>Speaker</span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-white">
                        {activeSelectedLog.discovered ? activeSelectedLog.speaker : 'Unknown'}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {activeSelectedLog.discovered ? activeSelectedLog.role : 'Classified Personnel'}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <Clock className="h-3.5 w-3.5 text-sky-400" />
                        <span>Timestamp</span>
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold text-white">
                        {activeSelectedLog.discovered ? activeSelectedLog.timestamp : 'Corrupted Index'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        Duration: {activeSelectedLog.durationSeconds}s
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Location Intel</span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-zinc-200 line-clamp-2">
                        {activeSelectedLog.locationHint}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRANSCRIPT VIEW */}
                <div className="mt-6">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Audio Transcript
                  </div>

                  {activeSelectedLog.discovered ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 leading-relaxed shadow-inner">
                      <p className="font-serif text-base italic text-amber-100/90 tracking-wide selection:bg-amber-500/40">
                        "{activeSelectedLog.transcript}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 mb-3">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="text-sm font-bold text-zinc-300">
                        Field Recording Not Yet Discovered
                      </div>
                      <p className="mt-1 max-w-md text-xs text-zinc-400">
                        Explore the quarantine sector to recover this cassette recorder.
                        <br />
                        <span className="text-amber-400 font-semibold">
                          Intel Hint: {activeSelectedLog.locationHint}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TAPE CASSETTE AUDIO CONTROLS */}
              {activeSelectedLog.discovered && (
                <div className="mt-6 rounded-2xl border border-amber-500/40 bg-zinc-900/90 p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black shadow-lg">
                        <Radio className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">CASSETTE DECK PLAYBACK</div>
                        <div className="font-mono text-[10px] text-zinc-400">
                          {isSelectedPlaying
                            ? 'Transmission transmitting over tactical frequency'
                            : 'Ready for audio playback'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSelectedPlaying ? (
                        <>
                          <button
                            onClick={onPauseLog}
                            id="modal-pause-log-btn"
                            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
                          >
                            <Pause className="h-4 w-4" />
                            <span>Pause</span>
                          </button>
                          <button
                            onClick={onStopLog}
                            id="modal-stop-log-btn"
                            className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-900/60 transition-colors"
                          >
                            <span>Stop</span>
                          </button>
                        </>
                      ) : isSelectedActive && !activePlayback.isComplete ? (
                        <>
                          <button
                            onClick={onResumeLog}
                            id="modal-resume-log-btn"
                            className="flex items-center gap-2 rounded-xl border border-amber-500/80 bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400 transition-colors"
                          >
                            <Play className="h-4 w-4 fill-black" />
                            <span>Resume</span>
                          </button>
                          <button
                            onClick={onStopLog}
                            id="modal-stop-log-btn"
                            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
                          >
                            <span>Stop</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onPlayLog(activeSelectedLog.id)}
                          id={`modal-play-log-${activeSelectedLog.id}`}
                          className="flex items-center gap-2 rounded-xl border border-amber-500/80 bg-amber-500 px-5 py-2 text-xs font-black text-black shadow-lg hover:bg-amber-400 transition-all hover:scale-105"
                        >
                          {isSelectedActive && activePlayback?.isComplete ? (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              <span>Replay Recording</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 fill-black" />
                              <span>Play Recording</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
